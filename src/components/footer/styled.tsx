import { Box, Link, styled } from "@mui/material";
import { APP_GRID } from "consts";

export const FooterWrapper = styled(Box)(({ theme }) => ({
  maxWidth: APP_GRID,
  width: "calc(100% - 48px)",
  margin: "0 auto",
  padding: `${theme.spacing(4)} 0`,
}));

export const SocialsWrapper = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
});

export const SocialsContent = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
}));

export const CredentialsWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: theme.spacing(2),
  color: "rgba(255,255,255,0.52)",
  fontSize: 13,
  fontFamily: "'Inter', sans-serif",
  [theme.breakpoints.down("md")]: {
    "& > *": { marginBottom: `${theme.spacing(1)} !important` },
  },
}));

export const Separator = styled("hr")({
  height: "1px",
  background: "rgba(255,255,255,0.10)",
  border: "none",
  margin: 0,
});

export const FooterLink = styled(Link)(() => ({
  color: "rgba(255,255,255,0.62)",
  textDecoration: "none",
  fontFamily: "'Inter', sans-serif",
  fontSize: 13,
  transition: "color 180ms ease",
  "&:hover": { color: "#60A5FA" },
}));

export const CenteringWrapper = styled(Box)({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
});
export const ContributedWrapper = styled(CenteringWrapper)(({ theme }) => ({
  [theme.breakpoints.down("md")]: { minWidth: "100%", flex: 2, order: 3 },
}));
export const FooterTextBox = styled(CenteringWrapper)(({ theme }) => ({
  [theme.breakpoints.down("md")]: { minWidth: "50%" },
}));
export const FooterTextBoxLeft = styled(FooterTextBox)(({ theme }) => ({
  [theme.breakpoints.down("md")]: { justifyContent: "start" },
}));
export const FooterTextBoxRight = styled(FooterTextBox)(({ theme }) => ({
  [theme.breakpoints.down("md")]: { justifyContent: "end" },
}));
