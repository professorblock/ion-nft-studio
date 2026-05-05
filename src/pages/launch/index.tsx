import { useState } from "react";
import { Box, Button, Typography, CircularProgress } from "@mui/material";
import { Address } from "ton";
import { toNano } from "ton";
import BN from "bn.js";
import { useTonAddress, useTonConnectUI } from "@ion-gateway/ui-react";

import { Screen, ScreenContent } from "components/Screen";
import {
  deployNftCollection,
  PLATFORM_TREASURY_ADDRESS,
  CollectionType,
} from "lib/nft/nft-deploy-controller";

/**
 * Collection deploy page — Day 2 first-half stub.
 *
 * Shows: wallet-gated "Deploy Test Collection" button. Hardcoded params
 * for proof-of-architecture; the full Configure-Collection form (with
 * image upload, IPFS, paid/PoB toggle, advanced options) lands in the
 * next iteration.
 */
export function LaunchPage() {
  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ address: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnectWallet = () => {
    if (tonConnectUI) tonConnectUI.openModal();
  };

  const handleTestDeploy = async (type: CollectionType) => {
    if (!walletAddress) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const creator = Address.parse(walletAddress);
      const out = await deployNftCollection(
        {
          creatorAddress: creator,
          type,
          collectionContentUri: "https://nft.ionhub.io/meta/test/collection.json",
          commonContentUri: "https://nft.ionhub.io/meta/test/items/",
          royaltyFactor: 50,
          royaltyBase: 1000,
          paidMintPrice: type === "paid" ? toNano(1) : undefined,
          pobBurnBps: type === "pob" ? 8000 : undefined,
          pobMintAmount: type === "pob" ? toNano(1000) : undefined,
          // For dev: use creator's own wallet as platform mint key.
          // Production: replace with the actual platform wallet.
          platformMintKeyAddress: creator,
        },
        tonConnectUI,
      );
      setResult({ address: out.collectionAddress.toString() });
    } catch (e: any) {
      setError(e?.message ?? "Deploy failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScreenContent>
        <Box sx={{ pt: 6, pb: 12, maxWidth: 720, mx: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
          <Typography sx={{ fontSize: { xs: 32, md: 48 }, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
            Launch a Collection
          </Typography>
          <Typography sx={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
            Deploy a fresh NFT collection to ION mainnet. The full Configure-Collection
            form (image upload, paid vs proof-of-burn toggle, royalty and burn-ratio
            sliders) lands in the next build. For now, two test deploy buttons —
            useful for verifying the wallet → contract pipeline works end-to-end.
          </Typography>

          <Box sx={{
            mt: 2,
            p: 3,
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}>
            <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.55)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>
              Wallet
            </Typography>
            <Typography sx={{ fontSize: 14, color: walletAddress ? "#A7F3D0" : "rgba(255,255,255,0.5)", fontFamily: "monospace", wordBreak: "break-all" }}>
              {walletAddress || "Not connected"}
            </Typography>

            {!walletAddress ? (
              <Button
                onClick={handleConnectWallet}
                variant="contained"
                sx={{
                  alignSelf: "flex-start",
                  background: "linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)",
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: "10px",
                  px: 3,
                }}>
                Connect Wallet
              </Button>
            ) : (
              <Box sx={{ display: "flex", gap: 1.5, mt: 1, flexWrap: "wrap" }}>
                <Button
                  onClick={() => handleTestDeploy("paid")}
                  disabled={busy}
                  variant="contained"
                  sx={{
                    background: "linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)",
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: "10px",
                  }}>
                  {busy ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Test Deploy: Paid"}
                </Button>
                <Button
                  onClick={() => handleTestDeploy("pob")}
                  disabled={busy}
                  variant="outlined"
                  sx={{
                    borderColor: "rgba(255,255,255,0.18)",
                    color: "rgba(255,255,255,0.9)",
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: "10px",
                  }}>
                  {busy ? <CircularProgress size={20} /> : "Test Deploy: PoB (80% burn)"}
                </Button>
              </Box>
            )}

            {result && (
              <Box sx={{ mt: 2, p: 2, borderRadius: "10px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)" }}>
                <Typography sx={{ fontSize: 13, color: "#A7F3D0", fontWeight: 700, mb: 1 }}>
                  ✓ Deploy tx sent
                </Typography>
                <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontFamily: "monospace", wordBreak: "break-all" }}>
                  Collection address: {result.address}
                </Typography>
              </Box>
            )}

            {error && (
              <Box sx={{ mt: 2, p: 2, borderRadius: "10px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}>
                <Typography sx={{ fontSize: 13, color: "#FCA5A5" }}>{error}</Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ mt: 2, fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
            <strong>Heads up — mainnet only:</strong> ION Hub's RPC config is mainnet-only,
            so test deploys cost real ION (~0.25 ION gas + 1000 ION platform fee).
            For dev cost-control, the platform fee currently routes to{" "}
            <code style={{ fontSize: 11 }}>{PLATFORM_TREASURY_ADDRESS.toString().slice(0, 12)}…</code>
            {" "}— change <code>PLATFORM_TREASURY_ADDRESS</code> in{" "}
            <code>src/lib/nft/nft-deploy-controller.ts</code> to your own wallet so the
            1000 ION bounces back during testing.
          </Box>
        </Box>
      </ScreenContent>
    </Screen>
  );
}
