/**
 * PobMintFlow.tsx
 * ───────────────
 * Burn-to-mint user flow for PoB collections. Replaces the disabled
 * placeholder MintSection from Batch 1.
 *
 * Stages:
 *   idle      → "Burn N ION to Mint" button
 *   signing   → wallet popup open
 *   pending   → tx broadcast, polling watcher for first detection
 *   logged    → watcher saw the burn, waiting for mint authorization
 *   minted    → NFT confirmed in burner's wallet
 *   rejected  → watcher refused the burn (split mismatch etc.)
 *   error     → wallet declined or other failure
 */

import { useEffect, useState } from "react";
import { Box, Button, Typography, CircularProgress, LinearProgress } from "@mui/material";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import { Address, toNano } from "ton";
import { useTonAddress, useTonConnectUI } from "@ion-gateway/ui-react";

import { CollectionData } from "lib/nft/collection-reader";
import { deriveBurnPocket } from "lib/nft/burn-pocket";
import { PLATFORM_TREASURY_ADDRESS } from "lib/nft/nft-deploy-controller";
import { fetchBurnStatus } from "lib/nft/watcher-status";

const POLL_INTERVAL_MS = 30_000;
const POLL_TIMEOUT_MS = 10 * 60_000; // 10 min total

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

  const ih = data.metadata.ion_hub;
  const mintAmountIon = ih?.pob_mint_amount_ion ?? 0;
  const burnPct = ih?.pob_burn_pct ?? 0;
  // 2% platform fee, rest to creator
  const platformPct = 2;
  const creatorPct = Math.max(0, 100 - burnPct - platformPct);

  const burnNano = toNano(((mintAmountIon * burnPct) / 100).toFixed(9));
  const platformNano = toNano(((mintAmountIon * platformPct) / 100).toFixed(9));
  const creatorNano = toNano(((mintAmountIon * creatorPct) / 100).toFixed(9));

  // Polling effect: kicks in once we've broadcast and are waiting for mint
  useEffect(() => {
    if (stage.kind !== "pending" && stage.kind !== "logged") return;
    if (!walletAddress) return;

    const burnPocket = deriveBurnPocket(data.address);
    const pocketStr = burnPocket.toFriendly({ urlSafe: true, bounceable: true, testOnly: false });

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

    // Tick now, then every POLL_INTERVAL_MS
    tick();
    const id = window.setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [stage.kind, walletAddress, data.address]);

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
    if (
      !data.metadata.ion_hub?.collection_type ||
      data.metadata.ion_hub.collection_type !== "pob"
    ) {
      setStage({ kind: "error", message: "Not a proof-of-burn collection." });
      return;
    }

    // Build the 3-message transaction
    const burnPocket = deriveBurnPocket(data.address);
    let creatorAddr: Address;
    try {
      creatorAddr = Address.parse(data.ownerAddress);
    } catch {
      setStage({ kind: "error", message: "Could not parse the collection's owner address." });
      return;
    }

    setStage({ kind: "signing" });

    try {
      await tonConnectUI!.sendTransaction({
        validUntil: Date.now() + 5 * 60_000,
        messages: [
          {
            address: burnPocket.toFriendly({ urlSafe: true, bounceable: true, testOnly: false }),
            amount: burnNano.toString(),
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

  // ──────── RENDER ────────

  const isWorking = ["signing", "pending", "logged"].includes(stage.kind);

  return (
    <Box
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: "16px",
        background: `linear-gradient(135deg, ${accent}10 0%, rgba(0,0,0,0) 70%)`,
        border: `1px solid ${accent}30`,
      }}>
      {/* HEADER */}
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
        </Box>

        <Button
          onClick={onBurnClick}
          disabled={isWorking || stage.kind === "minted"}
          variant="contained"
          size="large"
          startIcon={
            !isWorking && stage.kind !== "minted" ? <LocalFireDepartmentRoundedIcon /> : null
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
          {!walletAddress
            ? "Connect Wallet"
            : stage.kind === "signing"
            ? "Confirm in wallet…"
            : isWorking
            ? "Working…"
            : stage.kind === "minted"
            ? "✓ Minted"
            : `Burn ${mintAmountIon} ION`}
        </Button>
      </Box>

      {/* STATUS PANEL */}
      <StatusPanel stage={stage} accent={accent} data={data} />
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const StatusPanel = ({
  stage,
  accent,
  data,
}: {
  stage: FlowStage;
  accent: string;
  data: CollectionData;
}) => {
  if (stage.kind === "idle") return null;

  const stages: { key: string; label: string }[] = [
    { key: "signing", label: "Signing transaction" },
    { key: "pending", label: "Burn broadcast to ION" },
    { key: "logged", label: "Watcher detected burn" },
    { key: "minted", label: "NFT minted to your wallet" },
  ];

  const stageOrder: Record<string, number> = {
    signing: 0,
    pending: 1,
    logged: 2,
    minted: 3,
  };
  const currentIdx = stageOrder[stage.kind] ?? -1;

  return (
    <Box sx={{ mt: 3, pt: 2.5, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
      {stage.kind === "rejected" && (
        <ErrorBlock
          title="Watcher rejected this burn"
          message={stage.reason}
          tone="error"
          hint="The burn was detected but didn't match the expected split (burn / creator / treasury legs). If you used the official mint button on this page, this shouldn't happen — paste this message in support."
        />
      )}
      {stage.kind === "timeout" && (
        <ErrorBlock
          title="Watcher hasn't authorized this mint yet"
          message="No mint confirmation after 10 minutes."
          tone="warn"
          hint={
            "Two possible reasons: (1) the watcher is in log-only mode (live signing not enabled yet — that's true while we're still in v1 testing); (2) the watcher missed the burn. Your ION was still sent — check the explorer."
          }
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
