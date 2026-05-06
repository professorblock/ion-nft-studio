import { Box, Typography } from "@mui/material";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import SellRoundedIcon from "@mui/icons-material/SellRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { CollectionType } from "lib/nft/nft-deploy-controller";

interface Props {
  onPick: (type: CollectionType) => void;
}

const TypeCard = ({
  icon,
  title,
  subtitle,
  bullets,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  bullets: string[];
  accent: string;
  onClick: () => void;
}) => (
  <Box
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
    sx={{
      cursor: "pointer",
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: "16px",
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      transition: "border-color 200ms ease, transform 200ms ease, background 200ms ease",
      "&:hover": {
        borderColor: accent,
        background: "rgba(255,255,255,0.04)",
        transform: "translateY(-2px)",
      },
      "&:focus-visible": {
        outline: "2px solid #60A5FA",
        outlineOffset: 2,
      },
    }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "12px",
          background: `${accent}1A`, // ~10% alpha
          color: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.55)", mt: 0.25 }}>
          {subtitle}
        </Typography>
      </Box>
      <ArrowForwardRoundedIcon sx={{ color: "rgba(255,255,255,0.35)", fontSize: 20 }} />
    </Box>

    <Box
      component="ul"
      sx={{ m: 0, p: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
      {bullets.map((b, i) => (
        <Box
          component="li"
          key={i}
          sx={{
            fontSize: 13.5,
            color: "rgba(255,255,255,0.72)",
            display: "flex",
            gap: 8,
            lineHeight: 1.55,
            "&::before": {
              content: '""',
              flexShrink: 0,
              marginTop: "8px",
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: accent,
            },
          }}>
          {b}
        </Box>
      ))}
    </Box>
  </Box>
);

export const StepOne = ({ onPick }: Props) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#60A5FA",
          }}>
          Step 1 of 2 · Collection type
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: 30, md: 42 },
            fontWeight: 800,
            color: "#FFFFFF",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}>
          How do you want to mint?
        </Typography>
        <Typography
          sx={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, maxWidth: 560 }}>
          Pick the model that fits your drop. You can launch as many collections as you like — each
          one stands alone with its own contract.
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
        <TypeCard
          icon={<SellRoundedIcon sx={{ fontSize: 24 }} />}
          title="Paid Collection"
          subtitle="Standard NFT economics"
          bullets={[
            "Set a fixed mint price in ION",
            "Creators receive 95% of mint revenue (5% platform fee)",
            "Royalties on secondary sales (configurable, up to 50%)",
            "Description and cover image are required",
          ]}
          accent="#60A5FA"
          onClick={() => onPick("paid")}
        />
        <TypeCard
          icon={<LocalFireDepartmentRoundedIcon sx={{ fontSize: 24 }} />}
          title="Proof-of-Burn Collection"
          subtitle="Permanently destroy ION on every mint"
          bullets={[
            "Configure burn ratio per mint (50% minimum, up to 100%)",
            "Minimum 1000 ION burned per mint",
            "Strongest ecosystem signal — supply goes down with every mint",
            "Description and cover image are optional",
          ]}
          accent="#F87171"
          onClick={() => onPick("pob")}
        />
      </Box>

      <Box
        sx={{
          mt: 1,
          fontSize: 12,
          color: "rgba(255,255,255,0.4)",
          lineHeight: 1.6,
          maxWidth: 560,
        }}>
        Both types deploy the same audited TIP-4.2 NFT collection contract. The difference is who
        controls minting and where the proceeds go — both are configured at deploy and recorded
        on-chain.
      </Box>
    </Box>
  );
};
