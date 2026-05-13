/**
 * PobMintFlow.tsx
 * ───────────────
 * Burn-to-mint flow for PoB collections. Replaces the disabled placeholder
 * MintSection from Batch 1.
 *
 * Fixes since fix8:
 *   - Burn message now carries a text-comment payload. Some wallets ignore
 *     the address's non-bounceable flag and bounce funds from uninitialized
 *     accounts back to sender. Attaching a body cell makes the wallet route
 *     the message as a "transfer with intent" — preventing the auto-bounce.
 *   - Creator address is now fetched from the watcher's tracked-collections.json,
 *     NOT from data.ownerAddress. For PoB collections, the on-chain owner is
 *     the platform mint key; the actual creator wallet lives only in the
 *     watcher's registration entry.
 */

import { useEffect, useState } from "react";
import { Box, Button, Typography, CircularProgress } from "@mui/material";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import { Address, beginCell, toNano } from "ton";
import { useTonAddress, useTonConnectUI } from "@ion-gateway/ui-react";

import { CollectionData } from "lib/nft/collection-reader";
import { deriveBurnPocket } from "lib/nft/burn-pocket";
import { PLATFORM_TREASURY_ADDRESS } from "lib/nft/nft-deploy-controller";
import {
  fetchBurnStatus,
  fetchRegisteredCollection,
  RegisteredCollectionInfo,
} from "lib/nft/watcher-status";
import { shortAddress } from "lib/nft/address-format";

const POLL_INTERVAL_MS = 30_000;
const POLL_TIMEOUT_MS = 10 * 60_000;

type FlowStage =
  | { kind: "idle" }
  | { kind: "signing" }
  | { kind: "pending" }
  | { kind: "logged"; detectedAt: string }
  | { kind: "minted"; mintTxHash?: string }
  | { kind: "rejected"; reason: string }
  | { kind: "timeout" }
  | { kind: "error"; message: string };

interface Props {
  data: CollectionData;
  accent: string;
}

export const PobMintFlow = ({ data, accent }: Props) => {
  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [stage, setStage] = useState<FlowStage>({ kind: "idle" });

  // ── Registered-collection lookup (creator address) ────────────────
  const [registered, setRegistered] = useState<
    RegisteredCollectionInfo | null | "loading" | "not-registered"
  >("loading");
  useEffect(() => {
    let cancelled = false;
    fetchRegisteredCollection(data.address).then((info) => {
      if (cancelled) return;
      setRegistered(info ?? "not-registered");
    });
    return () => {
      cancelled = true;
    };
  }, [data.address]);

  const ih = data.metadata.ion_hub;
  const mintAmountIon = ih?.pob_mint_amount_ion ?? 0;
  const burnPct = ih?.pob_burn_pct ?? 0;
  const platformPct = 2;
  const creatorPct = Math.max(0, 100 - burnPct - platformPct);

  const burnNano = toNano(((mintAmountIon * burnPct) / 100).toFixed(9));
  const platformNano = toNano(((mintAmountIon * platformPct) / 100).toFixed(9));
  const creatorNano = toNano(((mintAmountIon * creatorPct) / 100).toFixed(9));

  // ── Polling for mint status ────────────────────────────────────────
  useEffect(() => {
    if (stage.kind !== "pending" && stage.kind !== "logged") return;
    if (!walletAddress) return;

    const burnPocket = deriveBurnPocket(data.address);
    const pocketStr = burnPocket.toFriendly({ urlSafe: true, bounceable: false, testOnly: false });

    let cancelled = false;
    const startedAt = Date.now();

    const tick = async () => {
      if (cancelled) return;
      const result = await fetchBurnStatus(walletAddress, pocketStr);
      if (cancelled) return;

      switch (result.status) {
        case "pending":
          if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
            setStage({ kind: "timeout" });
          }
          break;
        case "logged":
          setStage({ kind: "logged", detectedAt: result.detectedAt });
          break;
        case "minted":
          setStage({ kind: "minted", mintTxHash: result.mintTxHash });
          break;
        case "rejected":
          setStage({ kind: "rejected", reason: result.reason });
          break;
      }
    };

    tick();
    const id = window.setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [stage.kind, walletAddress, data.address]);

  // ── Burn click handler ─────────────────────────────────────────────
  const onBurnClick = async () => {
    if (!walletAddress) {
      tonConnectUI?.openModal();
      return;
    }
    if (!ih?.pob_mint_amount_ion || !ih?.pob_burn_pct) {
      setStage({
        kind: "error",
        message: "Collection is missing burn-amount or burn-percent metadata.",
      });
      return;
    }
    if (registered === "loading") {
      setStage({
        kind: "error",
        message: "Loading collection registration… try again in a moment.",
      });
      return;
    }
    if (registered === "not-registered" || !registered) {
      setStage({
        kind: "error",
        message:
          "This collection isn't registered with the watcher yet. The watcher's registration file may not have indexed it (auto-registration happens at deploy time). Without registration the mint can't be authorized — try again in a few minutes, or contact the creator.",
      });
      return;
    }

    const burnPocket = deriveBurnPocket(data.address);
    let creatorAddr: Address;
    try {
      creatorAddr = Address.parse(registered.creator_address);
    } catch {
      setStage({ kind: "error", message: "Could not parse the registered creator address." });
      return;
    }

    // Comment payload — short text body on the burn message. Wallets that
    // would otherwise auto-bounce a transfer to an uninitialized account
    // generally do not bounce a message that carries a comment body, since
    // it indicates explicit intent.
    const burnComment = beginCell()
      .storeUint(0, 32) // op = 0 (text comment)
      .storeBuffer(Buffer.from(`ION Hub burn ${data.address.slice(0, 8)}`, "utf-8"))
      .endCell();
    const burnPayloadB64 = burnComment.toBoc({ idx: false }).toString("base64");

    setStage({ kind: "signing" });

    try {
      await tonConnectUI!.sendTransaction({
        validUntil: Date.now() + 5 * 60_000,
        messages: [
          {
            address: burnPocket.toFriendly({ urlSafe: true, bounceable: false, testOnly: false }),
            amount: burnNano.toString(),
            payload: burnPayloadB64,
          },
          {
            address: creatorAddr.toFriendly({ urlSafe: true, bounceable: false, testOnly: false }),
            amount: creatorNano.toString(),
          },
          {
            address: PLATFORM_TREASURY_ADDRESS.toFriendly({
              urlSafe: true,
              bounceable: false,
              testOnly: false,
            }),
            amount: platformNano.toString(),
          },
        ],
      });
      setStage({ kind: "pending" });
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      if (msg.includes("declined") || msg.includes("cancel") || msg.includes("reject")) {
        setStage({ kind: "idle" });
      } else {
        setStage({ kind: "error", message: msg });
      }
    }
  };

  const isWorking = ["signing", "pending", "logged"].includes(stage.kind);
  const isLoadingRegistration = registered === "loading";
  const buttonDisabled = isWorking || stage.kind === "minted" || isLoadingRegistration;

  return (
    <Box
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: "16px",
        background: `linear-gradient(135deg, ${accent}10 0%, rgba(0,0,0,0) 70%)`,
        border: `1px solid ${accent}30`,
      }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          gap: 3,
        }}>
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 700,
              color: accent,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}>
            Burn to Mint
          </Typography>
          <Typography
            sx={{
              fontSize: 22,
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
            }}>
            {mintAmountIon ? `${mintAmountIon} ION per mint` : "Mint price not set"}
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
            <strong style={{ color: accent }}>{burnPct}%</strong> permanently destroyed ·{" "}
            <strong style={{ color: "#A78BFA" }}>{creatorPct}%</strong> to creator ·{" "}
            <strong style={{ color: "rgba(255,255,255,0.85)" }}>{platformPct}%</strong> platform
          </Typography>
          {registered && registered !== "loading" && registered !== "not-registered" && (
            <Typography sx={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", mt: 0.5 }}>
              Creator:{" "}
              <span style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.65)" }}>
                {shortAddress(registered.creator_address)}
              </span>
            </Typography>
          )}
        </Box>

        <Button
          onClick={onBurnClick}
          disabled={buttonDisabled}
          variant="contained"
          size="large"
          startIcon={
            !isWorking && stage.kind !== "minted" && !isLoadingRegistration ? (
              <LocalFireDepartmentRoundedIcon />
            ) : null
          }
          sx={{
            alignSelf: { xs: "stretch", md: "auto" },
            minWidth: 220,
            py: 1.6,
            px: 4,
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 700,
            fontSize: 16,
            background: `linear-gradient(90deg, ${accent} 0%, #8B5CF6 100%)`,
            color: "#FFFFFF",
            "&.Mui-disabled": {
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.4)",
            },
          }}>
          {isLoadingRegistration
            ? "Loading…"
            : !walletAddress
            ? "Connect Wallet"
            : registered === "not-registered"
            ? "Not registered"
            : stage.kind === "signing"
            ? "Confirm in wallet…"
            : isWorking
            ? "Working…"
            : stage.kind === "minted"
            ? "✓ Minted"
            : `Burn ${mintAmountIon} ION`}
        </Button>
      </Box>

      <StatusPanel stage={stage} accent={accent} registered={registered} />
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const StatusPanel = ({
  stage,
  accent,
  registered,
}: {
  stage: FlowStage;
  accent: string;
  registered: RegisteredCollectionInfo | null | "loading" | "not-registered";
}) => {
  if (stage.kind === "idle") {
    if (registered === "not-registered") {
      return (
        <Box sx={{ mt: 3, pt: 2.5, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <ErrorBlock
            title="Collection not yet registered with the watcher"
            message="This collection's burn-to-mint flow is not yet active."
            tone="warn"
            hint="Auto-registration usually happens within seconds of deploy. If this is a fresh deploy, refresh in 30 seconds. If the collection has been deployed for a while, the registration may have failed — contact the creator."
          />
        </Box>
      );
    }
    return null;
  }

  const stages: { key: string; label: string }[] = [
    { key: "signing", label: "Signing transaction" },
    { key: "pending", label: "Burn broadcast to ION" },
    { key: "logged", label: "Watcher detected burn" },
    { key: "minted", label: "NFT minted to your wallet" },
  ];
  // Map each state to the index of the FIRST stage that hasn't completed yet.
  //   signing  → 0 (signing is in progress)
  //   pending  → 2 (signing + broadcast done; waiting for watcher to detect)
  //   logged   → 3 (signing + broadcast + watcher done; waiting for mint)
  //   minted   → 4 (all done; no in-progress stage)
  const stageOrder: Record<string, number> = { signing: 0, pending: 2, logged: 3, minted: 4 };
  const currentIdx = stageOrder[stage.kind] ?? -1;

  return (
    <Box sx={{ mt: 3, pt: 2.5, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
      {stage.kind === "rejected" && (
        <ErrorBlock
          title="Watcher rejected this burn"
          message={stage.reason}
          tone="error"
          hint="The burn was detected but didn't match the expected split. If you used the official mint button on this page, this shouldn't happen — please report it."
        />
      )}
      {stage.kind === "timeout" && (
        <ErrorBlock
          title="Watcher hasn't authorized this mint yet"
          message="No mint confirmation after 10 minutes."
          tone="warn"
          hint="Two possible reasons: (1) the watcher is currently in log-only mode (live signing not enabled yet during testing); (2) the watcher missed the burn. Your ION was still sent — check the explorer."
        />
      )}
      {stage.kind === "error" && (
        <ErrorBlock title="Couldn't send transaction" message={stage.message} tone="error" />
      )}
      {(stage.kind === "signing" ||
        stage.kind === "pending" ||
        stage.kind === "logged" ||
        stage.kind === "minted") && (
        <Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {stages.map((s, i) => (
              <Box key={s.key} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      i < currentIdx
                        ? accent
                        : i === currentIdx
                        ? `${accent}30`
                        : "rgba(255,255,255,0.06)",
                    border: i === currentIdx ? `2px solid ${accent}` : "none",
                  }}>
                  {i < currentIdx && (
                    <Box sx={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</Box>
                  )}
                  {i === currentIdx && <CircularProgress size={10} sx={{ color: accent }} />}
                </Box>
                <Typography
                  sx={{
                    fontSize: 13,
                    color: i <= currentIdx ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)",
                    fontWeight: i === currentIdx ? 600 : 500,
                  }}>
                  {s.label}
                </Typography>
              </Box>
            ))}
          </Box>
          {stage.kind === "pending" && (
            <Box sx={{ mt: 2, fontSize: 11.5, color: "rgba(255,255,255,0.45)", lineHeight: 1.55 }}>
              Watcher polls every 5 minutes. Mint usually lands within 0–10 minutes after burn
              confirmation. You can leave this tab open or come back later — the burn is on-chain
              regardless.
            </Box>
          )}
          {stage.kind === "minted" && stage.mintTxHash && (
            <Box sx={{ mt: 2 }}>
              <Box
                component="a"
                href={`https://explorer.ice.io/transaction/${stage.mintTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  fontSize: 13,
                  color: "#A78BFA",
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                }}>
                View mint transaction
                <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

const ErrorBlock = ({
  title,
  message,
  tone,
  hint,
}: {
  title: string;
  message: string;
  tone: "error" | "warn";
  hint?: string;
}) => {
  const color = tone === "error" ? "#FCA5A5" : "#FBBF24";
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 700,
          color,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}>
        {tone === "error" ? "⚠ " : ""}
        {title}
      </Typography>
      <Box
        sx={{
          fontSize: 12,
          fontFamily: "monospace",
          color: tone === "error" ? "#FCA5A5" : "#FCD34D",
          background: tone === "error" ? "rgba(248,113,113,0.05)" : "rgba(251,191,36,0.05)",
          border: `1px solid ${
            tone === "error" ? "rgba(248,113,113,0.25)" : "rgba(251,191,36,0.25)"
          }`,
          borderRadius: "8px",
          padding: "8px 12px",
          wordBreak: "break-word",
        }}>
        {message}
      </Box>
      {hint && (
        <Typography
          sx={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.55, mt: 0.5 }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
};
