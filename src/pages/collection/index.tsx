import { useParams } from "react-router-dom";
import { Box, Typography, Button, CircularProgress, IconButton, Tooltip } from "@mui/material";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import SellRoundedIcon from "@mui/icons-material/SellRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Link as RouterLink } from "react-router-dom";

import { Screen, ScreenContent } from "components/Screen";
import { useCollection, CollectionState } from "./useCollection";
import { CollectionData, CollectionMetadata } from "lib/nft/collection-reader";
import { shortAddress } from "lib/nft/address-format";
import { ROUTES } from "consts";
import { PobMintFlow } from "./PobMintFlow";
import { useState } from "react";

const ION_EXPLORER_ADDR = (a: string) => `https://explorer.ice.io/address/${a}`;

// ──────────────────────────────────────────────────────────────────────────────

export function CollectionPage() {
  const { address } = useParams<{ address: string }>();
  const state = useCollection(address);

  return (
    <Screen>
      <ScreenContent>
        <Box sx={{ pt: 4, pb: 12, maxWidth: 1080, mx: "auto" }}>
          <BackLink />
          {state.status === "loading" && <LoadingSkeleton />}
          {state.status === "error" && <ErrorState state={state} />}
          {state.status === "success" && <SuccessView data={state.data} />}
        </Box>
      </ScreenContent>
    </Screen>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Header link

const BackLink = () => (
  <Button
    component={RouterLink}
    to={ROUTES.home}
    startIcon={<ArrowBackRoundedIcon />}
    sx={{
      color: "rgba(255,255,255,0.55)",
      textTransform: "none",
      fontWeight: 600,
      fontSize: 13,
      mb: 3,
      px: 1,
      "&:hover": { color: "#fff", background: "transparent" },
    }}>
    Home
  </Button>
);

// ──────────────────────────────────────────────────────────────────────────────
// Loading

const LoadingSkeleton = () => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "320px 1fr" },
        gap: 4,
        alignItems: "start",
      }}>
      <Box sx={shimmerBox(320, 320)} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={shimmerBox("40%", 16)} />
        <Box sx={shimmerBox("80%", 48)} />
        <Box sx={shimmerBox("100%", 14)} />
        <Box sx={shimmerBox("90%", 14)} />
        <Box sx={shimmerBox("60%", 14)} />
      </Box>
    </Box>
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
        gap: 2,
      }}>
      {[0, 1, 2, 3].map((i) => (
        <Box key={i} sx={shimmerBox("100%", 96)} />
      ))}
    </Box>
  </Box>
);

const shimmerBox = (width: string | number, height: string | number) => ({
  width,
  height,
  borderRadius: "12px",
  background:
    "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.6s ease-in-out infinite",
  "@keyframes shimmer": {
    "0%": { backgroundPosition: "200% 0" },
    "100%": { backgroundPosition: "-200% 0" },
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// Error

const ERROR_COPY: Record<string, { title: string; help: string }> = {
  "invalid-address": {
    title: "Invalid address",
    help: "The address in the URL doesn't look like an ION address. Check that you copied the full string.",
  },
  "not-found": {
    title: "Collection not found",
    help: "There's no contract deployed at this address yet. If you just deployed, give it 30 seconds and refresh.",
  },
  "not-a-collection": {
    title: "Not an NFT collection",
    help: "There's a contract here, but it doesn't respond to NFT-collection methods. It's probably a different kind of contract (token, wallet, sale, etc.).",
  },
  "metadata-fetch-failed": {
    title: "Couldn't load collection details",
    help: "The contract is fine, but the off-chain metadata didn't load. The IPFS gateway might be slow — wait a moment and refresh.",
  },
};

const ErrorState = ({ state }: { state: Extract<CollectionState, { status: "error" }> }) => {
  const copy = ERROR_COPY[state.kind] ?? { title: "Something went wrong", help: "" };
  return (
    <Box sx={{ pt: 6, display: "flex", flexDirection: "column", gap: 2.5, maxWidth: 560 }}>
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#FCA5A5",
        }}>
        Couldn't load collection
      </Typography>
      <Typography
        sx={{
          fontSize: { xs: 28, md: 38 },
          fontWeight: 800,
          color: "#FFFFFF",
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
        }}>
        {copy.title}
      </Typography>
      <Typography sx={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
        {copy.help}
      </Typography>
      <Box
        sx={{
          mt: 1,
          p: 2,
          borderRadius: "10px",
          background: "rgba(248,113,113,0.06)",
          border: "1px solid rgba(248,113,113,0.2)",
          fontSize: 12,
          color: "rgba(252,165,165,0.9)",
          fontFamily: "monospace",
          wordBreak: "break-word",
        }}>
        {state.reason}
      </Box>
      <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
        <Button
          onClick={() => window.location.reload()}
          variant="outlined"
          sx={{
            borderColor: "rgba(255,255,255,0.18)",
            color: "rgba(255,255,255,0.9)",
            textTransform: "none",
            fontWeight: 600,
            borderRadius: "10px",
          }}>
          Retry
        </Button>
        <Button
          component={RouterLink}
          to={ROUTES.launch}
          variant="contained"
          sx={{
            background: "linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)",
            textTransform: "none",
            fontWeight: 700,
            borderRadius: "10px",
          }}>
          Launch a new collection
        </Button>
      </Box>
    </Box>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Success

const SuccessView = ({ data }: { data: CollectionData }) => {
  const meta = data.metadata;
  const ionHub = meta.ion_hub;
  const isPob = ionHub?.collection_type === "pob";
  const accent = isPob ? "#F87171" : "#60A5FA";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <Hero data={data} accent={accent} isPob={isPob} />
      <StatsGrid data={data} accent={accent} isPob={isPob} />
      {isPob ? (
        <PobMintFlow data={data} accent={accent} />
      ) : (
        <MintSection data={data} accent={accent} isPob={isPob} />
      )}
      <ItemsGallery nextItemIndex={data.nextItemIndex} />
    </Box>
  );
};

// ──── Hero ────

const Hero = ({
  data,
  accent,
  isPob,
}: {
  data: CollectionData;
  accent: string;
  isPob: boolean;
}) => {
  const m = data.metadata;
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "320px 1fr" },
        gap: { xs: 3, md: 5 },
        alignItems: "start",
      }}>
      <CoverImage src={m.image} accent={accent} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TypePill isPob={isPob} accent={accent} />
        <Typography
          sx={{
            fontSize: { xs: 36, md: 52 },
            fontWeight: 800,
            color: "#FFFFFF",
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
          }}>
          {m.name || "Untitled collection"}
        </Typography>
        {m.symbol && (
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 700,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}>
            {m.symbol}
          </Typography>
        )}
        {m.description && (
          <Typography
            sx={{
              fontSize: 15,
              color: "rgba(255,255,255,0.72)",
              lineHeight: 1.65,
              whiteSpace: "pre-wrap",
            }}>
            {m.description}
          </Typography>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mt: 2, fontSize: 13 }}>
          <AddressRow
            label="Collection"
            address={data.address}
            explorerHref={ION_EXPLORER_ADDR(data.address)}
          />
          <AddressRow
            label="Owner"
            address={data.ownerAddress}
            explorerHref={ION_EXPLORER_ADDR(data.ownerAddress)}
          />
          {m.external_url && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "rgba(255,255,255,0.65)",
              }}>
              <Box sx={labelStyle}>External</Box>
              <Box
                component="a"
                href={m.external_url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: "#A78BFA",
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                }}>
                {m.external_url}
                <OpenInNewRoundedIcon sx={{ fontSize: 13 }} />
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

const TypePill = ({ isPob, accent }: { isPob: boolean; accent: string }) => (
  <Box
    sx={{
      display: "inline-flex",
      alignItems: "center",
      gap: 0.75,
      alignSelf: "flex-start",
      px: 1.25,
      py: 0.5,
      borderRadius: "999px",
      background: `${accent}1A`,
      border: `1px solid ${accent}55`,
      color: accent,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
    }}>
    {isPob ? (
      <LocalFireDepartmentRoundedIcon sx={{ fontSize: 13 }} />
    ) : (
      <SellRoundedIcon sx={{ fontSize: 13 }} />
    )}
    {isPob ? "Proof-of-Burn" : "Paid Mint"}
  </Box>
);

const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.45)",
  minWidth: 76,
} as const;

const AddressRow = ({
  label,
  address,
  explorerHref,
}: {
  label: string;
  address: string;
  explorerHref: string;
}) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "rgba(255,255,255,0.78)" }}>
      <Box sx={labelStyle}>{label}</Box>
      <Box sx={{ fontFamily: "monospace", fontSize: 13 }}>{shortAddress(address)}</Box>
      <Tooltip title={copied ? "Copied!" : "Copy"} placement="top">
        <IconButton
          size="small"
          onClick={copy}
          sx={{ color: "rgba(255,255,255,0.4)", "&:hover": { color: "#fff" } }}>
          <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="View on ION Explorer" placement="top">
        <IconButton
          size="small"
          component="a"
          href={explorerHref}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: "rgba(255,255,255,0.4)", "&:hover": { color: "#fff" } }}>
          <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

const CoverImage = ({ src, accent }: { src?: string; accent: string }) => {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <Box
        sx={{
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.08)",
          background: `linear-gradient(135deg, ${accent}15 0%, transparent 60%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.3)",
          fontSize: 13,
        }}>
        No cover image
      </Box>
    );
  }
  return (
    <Box
      component="img"
      src={src}
      alt="Collection cover"
      onError={() => setErrored(true)}
      sx={{
        width: "100%",
        aspectRatio: "1 / 1",
        objectFit: "cover",
        borderRadius: "16px",
        background: "rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    />
  );
};

// ──── Stats Grid ────

const StatsGrid = ({
  data,
  accent,
  isPob,
}: {
  data: CollectionData;
  accent: string;
  isPob: boolean;
}) => {
  const ih = data.metadata.ion_hub;
  const totalMinted = data.nextItemIndex.toString();
  const maxSupply = ih?.max_supply == null ? "∞" : ih.max_supply.toLocaleString();
  const royalty = ih?.royalty_pct != null ? `${ih.royalty_pct}%` : "—";

  const stats: { label: string; value: string; sub?: string }[] = isPob
    ? [
        {
          label: "Burn per mint",
          value: `${ih?.pob_mint_amount_ion ?? "—"}`,
          sub: "ION (total paid)",
        },
        {
          label: "Burn ratio",
          value: ih?.pob_burn_pct != null ? `${ih.pob_burn_pct}%` : "—",
          sub: "destroyed forever",
        },
        {
          label: "Items minted",
          value: totalMinted,
          sub: maxSupply !== "∞" ? `of ${maxSupply}` : undefined,
        },
        { label: "Royalty", value: royalty, sub: "secondary sales" },
      ]
    : [
        { label: "Mint price", value: `${ih?.mint_price_ion ?? "—"}`, sub: "ION" },
        {
          label: "Items minted",
          value: totalMinted,
          sub: maxSupply !== "∞" ? `of ${maxSupply}` : "open edition",
        },
        { label: "Max supply", value: maxSupply },
        { label: "Royalty", value: royalty, sub: "secondary sales" },
      ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
        gap: 2,
      }}>
      {stats.map((s) => (
        <Box
          key={s.label}
          sx={{
            p: 2.5,
            borderRadius: "12px",
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            flexDirection: "column",
            gap: 0.75,
          }}>
          <Box sx={{ ...labelStyle, minWidth: "auto" }}>{s.label}</Box>
          <Box sx={{ fontSize: 24, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
            {s.value}
          </Box>
          {s.sub && <Box sx={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{s.sub}</Box>}
        </Box>
      ))}
    </Box>
  );
};

// ──── Mint Section ────

const MintSection = ({
  data,
  accent,
  isPob,
}: {
  data: CollectionData;
  accent: string;
  isPob: boolean;
}) => {
  const ih = data.metadata.ion_hub;
  const price = isPob ? ih?.pob_mint_amount_ion : ih?.mint_price_ion;
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
            Mint
          </Typography>
          <Typography
            sx={{
              fontSize: 22,
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
            }}>
            {price ? `${price} ION per mint` : "Mint price not set"}
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
            {isPob
              ? `Each mint sends ${price ?? "X"} ION through the platform — ${
                  ih?.pob_burn_pct ?? "?"
                }% is permanently destroyed, the rest splits between you and the platform.`
              : `Each mint costs ${price ?? "X"} ION. 95% goes to the creator, 5% to the platform.`}
          </Typography>
        </Box>
        <Button
          disabled
          variant="contained"
          size="large"
          sx={{
            alignSelf: { xs: "stretch", md: "auto" },
            minWidth: 200,
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
          {isPob ? "Burn to Mint" : "Mint NFT"}
        </Button>
      </Box>
      <Box
        sx={{
          mt: 3,
          pt: 2.5,
          borderTop: "1px solid rgba(255,255,255,0.07)",
          fontSize: 12,
          color: "rgba(255,255,255,0.5)",
          lineHeight: 1.6,
        }}>
        <strong style={{ color: "rgba(255,255,255,0.75)" }}>
          Minting opens in the next iteration.
        </strong>{" "}
        {isPob
          ? "Proof-of-burn mints require a backend watcher service that observes ION burns and signs mint authorizations. That's coming as part of Day 3."
          : "Paid mints will use per-item fixprice-sale contracts deployed on demand. We're wiring those up next."}
      </Box>
    </Box>
  );
};

// ──── Items Gallery ────

const ItemsGallery = ({ nextItemIndex }: { nextItemIndex: number }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <Typography
      sx={{
        fontSize: 13,
        fontWeight: 700,
        color: "rgba(255,255,255,0.7)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      }}>
      Items
    </Typography>
    <Box
      sx={{
        p: 4,
        borderRadius: "16px",
        border: "1px dashed rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.015)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 1,
        minHeight: 180,
      }}>
      <Typography sx={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
        {nextItemIndex === 0
          ? "No items minted yet"
          : `${nextItemIndex} item${nextItemIndex === 1 ? "" : "s"} minted`}
      </Typography>
      <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.4)", maxWidth: 420 }}>
        {nextItemIndex === 0
          ? "Once minting opens, items will appear here as collectors mint them."
          : "The item gallery (with images, owners, and per-item details) lands in the next iteration."}
      </Typography>
    </Box>
  </Box>
);

// satisfy unused-import linter for CollectionMetadata (used only as type)
void ({} as CollectionMetadata);
