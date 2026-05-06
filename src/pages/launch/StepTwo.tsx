import { useState, useRef, ChangeEvent } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Slider,
  Switch,
  FormControlLabel,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { Address, toNano } from "ton";
import BN from "bn.js";
import { useTonAddress, useTonConnectUI } from "@ion-gateway/ui-react";

import {
  CollectionType,
  deployNftCollection,
  predictCollectionAddress,
} from "lib/nft/nft-deploy-controller";
import { uploadFileToIPFS, uploadJsonToIPFS, ipfsToHttp, isPinataConfigured } from "lib/nft/pinata";
import {
  FormShell,
  FormCard,
  FieldGroup,
  FieldLabel,
  FieldHint,
  RequiredDot,
  StyledInput,
  StyledTextarea,
  FieldError,
  TwoColumnRow,
} from "./styled";

interface Props {
  type: CollectionType;
  onBack: () => void;
}

interface FormState {
  name: string;
  symbol: string;
  description: string;
  externalUrl: string;
  coverImageFile: File | null;
  coverImageUrl: string; // fallback if Pinata not configured
  maxSupply: string; // empty = unlimited
  royaltyPct: number; // 0-50
  // Paid only
  mintPriceIon: string;
  // PoB only
  pobMintAmountIon: string;
  pobBurnPct: number; // 50-100
  // Advanced
  showAdvanced: boolean;
}

type DeployStage =
  | { kind: "idle" }
  | { kind: "uploading-image" }
  | { kind: "uploading-metadata" }
  | { kind: "awaiting-signature" }
  | { kind: "broadcasting" }
  | { kind: "success"; address: string }
  | { kind: "error"; message: string };

const ION_EXPLORER_ADDR = (a: string) => `https://explorer.ice.io/address/${a}`;

export const StepTwo = ({ type, onBack }: Props) => {
  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    symbol: "",
    description: "",
    externalUrl: "",
    coverImageFile: null,
    coverImageUrl: "",
    maxSupply: "",
    royaltyPct: 5,
    mintPriceIon: "",
    pobMintAmountIon: "1000",
    pobBurnPct: 80,
    showAdvanced: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [stage, setStage] = useState<DeployStage>({ kind: "idle" });
  const pinataReady = isPinataConfigured();

  // ───────────────────── helpers ─────────────────────

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((er) => ({ ...er, coverImageFile: "Image must be under 5 MB" }));
      return;
    }
    update("coverImageFile", file);
    update("coverImageUrl", ""); // file overrides URL
  };

  // ───────────────────── validation ─────────────────────

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = "Required";
    if (form.name.length > 80) e.name = "Max 80 characters";
    if (form.royaltyPct < 0 || form.royaltyPct > 50) e.royaltyPct = "Must be 0–50%";

    if (type === "paid") {
      if (!form.description.trim()) e.description = "Required for paid collections";
      if (!form.coverImageFile && !form.coverImageUrl.trim()) {
        e.coverImageFile = "Cover image required for paid collections";
      }
      const mp = Number(form.mintPriceIon);
      if (!form.mintPriceIon.trim() || !Number.isFinite(mp) || mp <= 0) {
        e.mintPriceIon = "Must be a positive number";
      }
    } else {
      const ma = Number(form.pobMintAmountIon);
      if (!Number.isFinite(ma) || ma < 1000) {
        e.pobMintAmountIon = "Must be at least 1000 ION (anti-dust floor)";
      }
      if (form.pobBurnPct < 50 || form.pobBurnPct > 100) {
        e.pobBurnPct = "Must be between 50% and 100%";
      }
    }

    if (form.maxSupply.trim()) {
      const ms = Number(form.maxSupply);
      if (!Number.isInteger(ms) || ms <= 0) e.maxSupply = "Must be a positive integer";
    }
    if (form.coverImageUrl.trim() && !/^https?:\/\//.test(form.coverImageUrl.trim())) {
      e.coverImageUrl = "Must start with http:// or https://";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ───────────────────── submit ─────────────────────

  const handleDeploy = async () => {
    if (!walletAddress) {
      tonConnectUI?.openModal();
      return;
    }
    if (!validate()) return;

    setStage({ kind: "idle" });
    try {
      // 1. Upload cover image (if file picked)
      let imageUri = form.coverImageUrl.trim();
      if (form.coverImageFile) {
        if (!pinataReady) {
          throw new Error(
            "Pinata not configured. Add REACT_APP_PINATA_JWT to .env.local, or paste an image URL instead.",
          );
        }
        setStage({ kind: "uploading-image" });
        imageUri = await uploadFileToIPFS(form.coverImageFile, form.coverImageFile.name);
      }

      // 2. Build + upload collection metadata JSON (TIP-64 / OpenSea-compatible)
      setStage({ kind: "uploading-metadata" });
      const metadata: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        image: imageUri || undefined,
        external_url: form.externalUrl.trim() || undefined,
        symbol: form.symbol.trim() || undefined,
        // ION Hub-specific extension fields (read by the watcher backend + viewer):
        ion_hub: {
          version: 1,
          collection_type: type,
          max_supply: form.maxSupply.trim() ? Number(form.maxSupply) : null,
          royalty_pct: form.royaltyPct,
          ...(type === "paid"
            ? { mint_price_ion: Number(form.mintPriceIon) }
            : {
                pob_mint_amount_ion: Number(form.pobMintAmountIon),
                pob_burn_pct: form.pobBurnPct,
              }),
        },
      };

      let metadataUri: string;
      if (pinataReady) {
        metadataUri = await uploadJsonToIPFS(metadata, `${form.name}.json`);
      } else {
        // Graceful degradation: data: URI for testing without Pinata
        metadataUri =
          "data:application/json;base64," +
          btoa(unescape(encodeURIComponent(JSON.stringify(metadata))));
      }

      // 3. Build per-item URI prefix (items get appended index).
      // For v1 these are all generated server-side at mint time, so we just
      // point at our domain with the collection address as a marker.
      const creator = Address.parse(walletAddress);
      const placeholderAddr = predictCollectionAddress({
        creatorAddress: creator,
        type,
        collectionContentUri: metadataUri,
        commonContentUri: "https://nft.ionhub.io/items/",
        royaltyFactor: Math.round(form.royaltyPct * 10),
        royaltyBase: 1000,
        platformMintKeyAddress: creator,
        ...(type === "paid"
          ? { paidMintPrice: toNano(form.mintPriceIon) }
          : {
              pobBurnBps: form.pobBurnPct * 100,
              pobMintAmount: toNano(form.pobMintAmountIon),
            }),
      });
      const commonContentUri = `https://nft.ionhub.io/items/${placeholderAddr.toString()}/`;

      // 4. Sign + send the deploy transaction
      setStage({ kind: "awaiting-signature" });
      const result = await deployNftCollection(
        {
          creatorAddress: creator,
          type,
          collectionContentUri: metadataUri,
          commonContentUri,
          royaltyFactor: Math.round(form.royaltyPct * 10),
          royaltyBase: 1000,
          platformMintKeyAddress: creator, // dev: creator's own wallet
          ...(type === "paid"
            ? { paidMintPrice: toNano(form.mintPriceIon) }
            : {
                pobBurnBps: form.pobBurnPct * 100,
                pobMintAmount: toNano(form.pobMintAmountIon),
              }),
        },
        tonConnectUI,
      );

      setStage({ kind: "broadcasting" });
      // Tx is sent; on-chain confirmation typically lands in 5–15 seconds.
      // We don't poll here — the user can click through to the explorer.
      setTimeout(() => {
        setStage({ kind: "success", address: result.collectionAddress.toString() });
      }, 1200);
    } catch (err: any) {
      setStage({
        kind: "error",
        message: err?.message ?? String(err) ?? "Deploy failed for an unknown reason",
      });
    }
  };

  // ───────────────────── UI ─────────────────────

  const isBusy = [
    "uploading-image",
    "uploading-metadata",
    "awaiting-signature",
    "broadcasting",
  ].includes(stage.kind);

  const accent = type === "paid" ? "#60A5FA" : "#F87171";

  // SUCCESS view
  if (stage.kind === "success") {
    return (
      <FormShell>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#34D399",
            }}>
            ✓ Collection deployed
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: 30, md: 42 },
              fontWeight: 800,
              color: "#FFFFFF",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}>
            "{form.name}" is live.
          </Typography>
          <Typography sx={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
            Your collection contract is being confirmed on ION (typically 5–15 seconds). Once
            confirmed, anyone can view it on the explorer or mint from it (subject to your
            collection's rules).
          </Typography>

          <FormCard sx={{ width: "100%" }}>
            <FieldGroup>
              <FieldLabel>Collection address</FieldLabel>
              <Box
                sx={{
                  fontSize: 13,
                  fontFamily: "monospace",
                  color: "rgba(255,255,255,0.85)",
                  wordBreak: "break-all",
                }}>
                {stage.address}
              </Box>
            </FieldGroup>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <Button
                href={ION_EXPLORER_ADDR(stage.address)}
                target="_blank"
                rel="noopener noreferrer"
                variant="contained"
                endIcon={<OpenInNewRoundedIcon />}
                sx={{
                  background: "linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)",
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: "10px",
                  px: 3,
                }}>
                View on ION Explorer
              </Button>
              <Button
                href={`/collection/${stage.address}`}
                variant="outlined"
                sx={{
                  borderColor: "rgba(255,255,255,0.18)",
                  color: "rgba(255,255,255,0.9)",
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: "10px",
                }}>
                View Collection Page
              </Button>
            </Box>
          </FormCard>
        </Box>
      </FormShell>
    );
  }

  // FORM view
  return (
    <FormShell>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              onClick={onBack}
              startIcon={<ArrowBackRoundedIcon />}
              sx={{
                color: "rgba(255,255,255,0.55)",
                textTransform: "none",
                fontWeight: 600,
                fontSize: 13,
                px: 1,
                "&:hover": { color: "#fff", background: "transparent" },
              }}>
              Back
            </Button>
          </Box>
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: accent,
            }}>
            Step 2 of 2 · {type === "paid" ? "Paid Collection" : "Proof-of-Burn Collection"}
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: 30, md: 42 },
              fontWeight: 800,
              color: "#FFFFFF",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}>
            Configure your collection.
          </Typography>
        </Box>

        {!pinataReady && (
          <Box
            sx={{
              p: 2,
              borderRadius: "10px",
              border: "1px solid rgba(251,191,36,0.3)",
              background: "rgba(251,191,36,0.06)",
              fontSize: 13,
              color: "rgba(255,255,255,0.78)",
              lineHeight: 1.5,
            }}>
            <strong>Pinata not configured.</strong> Image uploads disabled — paste an image URL
            instead. To enable file upload, add <code>REACT_APP_PINATA_JWT</code> to a{" "}
            <code>.env.local</code> file in the project root and restart <code>npm start</code>.
            Setup steps in <code>src/lib/nft/pinata.ts</code>.
          </Box>
        )}

        {/* CORE FIELDS — both types */}
        <FormCard>
          <FieldGroup>
            <FieldLabel>
              <RequiredDot /> Collection Name
            </FieldLabel>
            <StyledInput
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. ION Genesis"
              maxLength={80}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && <FieldError>{errors.name}</FieldError>}
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Symbol (optional)</FieldLabel>
            <StyledInput
              value={form.symbol}
              onChange={(e) => update("symbol", e.target.value.toUpperCase())}
              placeholder="GENESIS"
              maxLength={12}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>
              {type === "paid" && <RequiredDot />} Description {type === "pob" && "(optional)"}
            </FieldLabel>
            <StyledTextarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="What's this collection about?"
              maxLength={1000}
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description && <FieldError>{errors.description}</FieldError>}
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>
              {type === "paid" && <RequiredDot />} Cover Image {type === "pob" && "(optional)"}
            </FieldLabel>

            {/* File upload — disabled if Pinata not ready */}
            <Box
              sx={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                p: 2,
                border: "1px dashed rgba(255,255,255,0.18)",
                borderRadius: "10px",
                background: "rgba(0,0,0,0.2)",
                opacity: pinataReady ? 1 : 0.5,
              }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onPickFile}
                disabled={!pinataReady}
                style={{ display: "none" }}
              />
              {form.coverImageFile ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                  <Box
                    component="img"
                    src={URL.createObjectURL(form.coverImageFile)}
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: "8px",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box
                      sx={{
                        fontSize: 13,
                        color: "#fff",
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                      {form.coverImageFile.name}
                    </Box>
                    <Box sx={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                      {(form.coverImageFile.size / 1024).toFixed(0)} KB
                    </Box>
                  </Box>
                  <Button
                    onClick={() => update("coverImageFile", null)}
                    sx={{ color: "rgba(255,255,255,0.55)", textTransform: "none", fontSize: 12 }}>
                    Remove
                  </Button>
                </Box>
              ) : (
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!pinataReady}
                  startIcon={<ImageRoundedIcon />}
                  sx={{
                    color: "rgba(255,255,255,0.7)",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: 13,
                  }}>
                  Choose image (PNG / JPG, &lt; 5MB)
                </Button>
              )}
            </Box>

            {/* Fallback: paste URL */}
            {!form.coverImageFile && (
              <>
                <FieldHint sx={{ mt: 0.5 }}>Or paste a hosted image URL:</FieldHint>
                <StyledInput
                  value={form.coverImageUrl}
                  onChange={(e) => update("coverImageUrl", e.target.value)}
                  placeholder="https://..."
                  aria-invalid={Boolean(errors.coverImageUrl)}
                />
                {errors.coverImageUrl && <FieldError>{errors.coverImageUrl}</FieldError>}
              </>
            )}
            {errors.coverImageFile && <FieldError>{errors.coverImageFile}</FieldError>}
          </FieldGroup>
        </FormCard>

        {/* TYPE-SPECIFIC FIELDS */}
        <FormCard>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: accent,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              mb: 0.5,
            }}>
            {type === "paid" ? "Mint economics" : "Burn rules"}
          </Typography>

          {type === "paid" ? (
            <TwoColumnRow>
              <FieldGroup>
                <FieldLabel>
                  <RequiredDot /> Mint Price (ION)
                </FieldLabel>
                <StyledInput
                  type="number"
                  inputMode="decimal"
                  value={form.mintPriceIon}
                  onChange={(e) => update("mintPriceIon", e.target.value)}
                  placeholder="100"
                  aria-invalid={Boolean(errors.mintPriceIon)}
                />
                <FieldHint>
                  What each user pays per mint. 5% goes to platform, 95% to you.
                </FieldHint>
                {errors.mintPriceIon && <FieldError>{errors.mintPriceIon}</FieldError>}
              </FieldGroup>
              <FieldGroup>
                <FieldLabel>Max Supply (optional)</FieldLabel>
                <StyledInput
                  type="number"
                  inputMode="numeric"
                  value={form.maxSupply}
                  onChange={(e) => update("maxSupply", e.target.value)}
                  placeholder="Unlimited"
                  aria-invalid={Boolean(errors.maxSupply)}
                />
                <FieldHint>Leave blank for an open-edition.</FieldHint>
                {errors.maxSupply && <FieldError>{errors.maxSupply}</FieldError>}
              </FieldGroup>
            </TwoColumnRow>
          ) : (
            <>
              <TwoColumnRow>
                <FieldGroup>
                  <FieldLabel>
                    <RequiredDot /> ION Burned per Mint
                  </FieldLabel>
                  <StyledInput
                    type="number"
                    inputMode="decimal"
                    value={form.pobMintAmountIon}
                    onChange={(e) => update("pobMintAmountIon", e.target.value)}
                    placeholder="1000"
                    aria-invalid={Boolean(errors.pobMintAmountIon)}
                  />
                  <FieldHint>Minimum 1000 ION. Total amount user pays per mint.</FieldHint>
                  {errors.pobMintAmountIon && <FieldError>{errors.pobMintAmountIon}</FieldError>}
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel>Max Supply (optional)</FieldLabel>
                  <StyledInput
                    type="number"
                    inputMode="numeric"
                    value={form.maxSupply}
                    onChange={(e) => update("maxSupply", e.target.value)}
                    placeholder="Unlimited"
                  />
                  {errors.maxSupply && <FieldError>{errors.maxSupply}</FieldError>}
                </FieldGroup>
              </TwoColumnRow>

              <FieldGroup>
                <FieldLabel>
                  <RequiredDot /> Burn Ratio: {form.pobBurnPct}%
                </FieldLabel>
                <Box sx={{ px: 1.5 }}>
                  <Slider
                    value={form.pobBurnPct}
                    min={50}
                    max={100}
                    step={5}
                    onChange={(_, v) => update("pobBurnPct", v as number)}
                    marks={[
                      { value: 50, label: "50%" },
                      { value: 75, label: "75%" },
                      { value: 100, label: "100%" },
                    ]}
                    sx={{
                      color: accent,
                      "& .MuiSlider-markLabel": { color: "rgba(255,255,255,0.45)", fontSize: 11 },
                    }}
                  />
                </Box>
                <FieldHint>
                  Of every {form.pobMintAmountIon || "X"} ION minted,{" "}
                  <strong>{form.pobBurnPct}%</strong> is permanently destroyed,{" "}
                  {Math.round((100 - form.pobBurnPct) * 0.98)}% goes to you, ~2% to platform. Higher
                  burn ratio = stronger ecosystem signal, less creator earnings.
                </FieldHint>
                {errors.pobBurnPct && <FieldError>{errors.pobBurnPct}</FieldError>}
              </FieldGroup>
            </>
          )}

          <FieldGroup>
            <FieldLabel>Royalty: {form.royaltyPct}%</FieldLabel>
            <Box sx={{ px: 1.5 }}>
              <Slider
                value={form.royaltyPct}
                min={0}
                max={50}
                step={1}
                onChange={(_, v) => update("royaltyPct", v as number)}
                marks={[
                  { value: 0, label: "0%" },
                  { value: 10, label: "10%" },
                  { value: 25, label: "25%" },
                  { value: 50, label: "50%" },
                ]}
                sx={{
                  color: accent,
                  "& .MuiSlider-markLabel": { color: "rgba(255,255,255,0.45)", fontSize: 11 },
                }}
              />
            </Box>
            <FieldHint>
              What you receive on every secondary-market sale. Honored by marketplaces that respect
              TIP-4.2 royalties.
            </FieldHint>
          </FieldGroup>
        </FormCard>

        {/* ADVANCED (collapsed) */}
        <FormCard>
          <FormControlLabel
            control={
              <Switch
                checked={form.showAdvanced}
                onChange={(_, v) => update("showAdvanced", v)}
                sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: accent } }}
              />
            }
            label={
              <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
                Show advanced options
              </Typography>
            }
          />
          {form.showAdvanced && (
            <FieldGroup>
              <FieldLabel>External URL</FieldLabel>
              <StyledInput
                value={form.externalUrl}
                onChange={(e) => update("externalUrl", e.target.value)}
                placeholder="https://yourproject.io"
              />
              <FieldHint>Optional homepage shown by marketplaces.</FieldHint>
            </FieldGroup>
          )}
        </FormCard>

        {/* DEPLOY BUTTON + STATUS */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {stage.kind === "error" && (
            <Box
              sx={{
                p: 2,
                borderRadius: "10px",
                border: "1px solid rgba(248,113,113,0.3)",
                background: "rgba(248,113,113,0.06)",
                fontSize: 13,
                color: "#FCA5A5",
                lineHeight: 1.5,
              }}>
              <strong>Deploy failed.</strong> {stage.message}
            </Box>
          )}

          {isBusy && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 2,
                borderRadius: "10px",
                background: "rgba(96,165,250,0.06)",
                border: "1px solid rgba(96,165,250,0.25)",
              }}>
              <CircularProgress size={18} sx={{ color: accent }} />
              <Box sx={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
                {stage.kind === "uploading-image" && "Uploading cover image to IPFS…"}
                {stage.kind === "uploading-metadata" && "Uploading collection metadata to IPFS…"}
                {stage.kind === "awaiting-signature" &&
                  "Confirm the deploy transaction in your wallet…"}
                {stage.kind === "broadcasting" &&
                  "Transaction sent — waiting for confirmation on ION…"}
              </Box>
            </Box>
          )}

          <Button
            onClick={handleDeploy}
            disabled={isBusy}
            variant="contained"
            size="large"
            sx={{
              background: `linear-gradient(90deg, ${accent} 0%, #8B5CF6 100%)`,
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: 16,
              py: 1.6,
              borderRadius: "12px",
              textTransform: "none",
              alignSelf: "stretch",
              "&:hover": { filter: "brightness(1.08)" },
              "&.Mui-disabled": {
                background: "rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.4)",
              },
            }}>
            {!walletAddress
              ? "Connect Wallet to Deploy"
              : isBusy
              ? "Deploying…"
              : `Deploy ${type === "paid" ? "Paid" : "PoB"} Collection`}
          </Button>

          <Box
            sx={{
              fontSize: 11.5,
              color: "rgba(255,255,255,0.4)",
              lineHeight: 1.55,
              textAlign: "center",
            }}>
            One signature deploys the collection contract + pays the 1000 ION platform fee. Network
            gas is ~0.25 ION on top.
          </Box>
        </Box>
      </Box>
    </FormShell>
  );
};

// Suppress unused-var warning for ipfsToHttp (re-exported for use elsewhere)
void ipfsToHttp;
