import { AppBar, styled } from "@mui/material";
import { Box } from "@mui/system";

export const HeaderWrapper = styled(AppBar)(() => ({
  height: 80,
  background: "rgba(0, 0, 0, 0.65)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  position: "sticky",
  top: 0,
  zIndex: 1200,
}));

export const HeaderContent = styled(Box)(({ theme }) => ({
  width: "100%",
  maxWidth: 1280,
  margin: "0 auto",
  height: "100%",
  padding: "0 32px",
  display: "grid",
  gridTemplateColumns: "240px 1fr 240px",
  alignItems: "center",
  columnGap: 24,

  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr auto",
    padding: "0 18px",
  },
}));
