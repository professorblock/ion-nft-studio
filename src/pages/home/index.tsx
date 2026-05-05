import { Box, Button, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { ROUTES, ION_HUB_LAUNCH_URL } from "consts";
import { Screen, ScreenContent } from "components/Screen";

/**
 * NFT Studio landing page (Day 2 first-half stub).
 * The polished hero/feature-cards layout — matching ION Hub's design system —
 * comes in the next iteration. This stub just proves chrome + routing works.
 */
export function HomePage() {
  return (
    <Screen>
      <ScreenContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            minHeight: "60vh",
            gap: 3,
            pt: 8,
          }}>
          <Typography
            sx={{
              fontSize: { xs: 12, md: 13 },
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "#34D399",
              textTransform: "uppercase",
            }}>
            ● Live on ION Mainnet
          </Typography>

          <Typography
            sx={{
              fontSize: { xs: 48, md: 88 },
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "#FFFFFF",
              maxWidth: 900,
            }}>
            Mint NFTs on{" "}
            <Box
              component="span"
              sx={{
                background: "linear-gradient(90deg, #60A5FA 0%, #A78BFA 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
              ION.
            </Box>
          </Typography>

          <Typography
            sx={{
              fontSize: { xs: 18, md: 22 },
              color: "rgba(255,255,255,0.65)",
              maxWidth: 640,
              fontWeight: 400,
              letterSpacing: "-0.01em",
            }}>
            Launch NFT collections with paid mints or proof-of-burn drops that
            permanently destroy ION with every mint.
          </Typography>

          <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap", justifyContent: "center" }}>
            <Button
              component={RouterLink}
              to={ROUTES.launch}
              variant="contained"
              size="large"
              endIcon={<ArrowForwardRoundedIcon />}
              sx={{
                background: "linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: 16,
                px: 4,
                py: 1.5,
                borderRadius: "12px",
                textTransform: "none",
                "&:hover": {
                  background: "linear-gradient(90deg, #2563EB 0%, #7C3AED 100%)",
                },
              }}>
              Launch a Collection
            </Button>

            <Button
              href={ION_HUB_LAUNCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              size="large"
              sx={{
                borderColor: "rgba(255,255,255,0.18)",
                color: "rgba(255,255,255,0.9)",
                fontWeight: 600,
                fontSize: 16,
                px: 4,
                py: 1.5,
                borderRadius: "12px",
                textTransform: "none",
                "&:hover": {
                  borderColor: "rgba(255,255,255,0.32)",
                  background: "rgba(255,255,255,0.04)",
                },
              }}>
              Mint a Token (ION Hub)
            </Button>
          </Box>
        </Box>
      </ScreenContent>
    </Screen>
  );
}
