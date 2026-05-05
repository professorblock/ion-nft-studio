import { useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { Screen, ScreenContent } from "components/Screen";

/**
 * Collection viewer stub. Full UI (collection metadata, item gallery, mint button,
 * PoB burn flow) lands in the next iteration.
 */
export function CollectionPage() {
  const { address } = useParams<{ address: string }>();

  return (
    <Screen>
      <ScreenContent>
        <Box sx={{ pt: 6, pb: 12, maxWidth: 720, mx: "auto" }}>
          <Typography sx={{ fontSize: { xs: 28, md: 40 }, fontWeight: 800, color: "#FFFFFF" }}>
            Collection Viewer
          </Typography>
          <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: "monospace", mt: 1, wordBreak: "break-all" }}>
            {address ?? "(no address)"}
          </Typography>
          <Box sx={{ mt: 4, p: 3, borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
              Item gallery, mint button, and proof-of-burn flow are scaffolded
              for the next build iteration. The route is live, the URL parsing
              works, and the chrome (header / footer / wallet) is identical to
              ION Hub.
            </Typography>
          </Box>
        </Box>
      </ScreenContent>
    </Screen>
  );
}
