import { Box, IconButton, styled, Typography } from "@mui/material";

export const MenuWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const MenuItem = styled(Box)(() => ({
  padding: "6px 14px",
  borderRadius: 8,
  cursor: "pointer",
  color: "rgba(255,255,255,0.55)",
  fontSize: 14,
  fontWeight: 500,
  fontFamily: "'Inter', sans-serif",
  transition: "all 180ms ease",
  "&:hover": {
    color: "#FFFFFF",
    background: "rgba(255,255,255,0.06)",
  },
  "&.active": {
    color: "#00D4FF",
    background: "rgba(0,212,255,0.08)",
  },
}));

export const MenuItemText = styled(Typography)(() => ({
  fontSize: 14,
  fontWeight: 500,
  fontFamily: "'Inter', sans-serif",
  color: "inherit",
}));

export const CloseMenuButton = styled(IconButton)(() => ({
  position: "absolute",
  top: 12,
  right: 12,
  color: "rgba(255,255,255,0.5)",
  "&:hover": {
    color: "#FFFFFF",
    background: "rgba(255,255,255,0.06)",
  },
}));

export const DrawerContent = styled(Box)(({ theme }) => ({
  width: 280,
  height: "100%",
  background: "#0D0C18",
  padding: theme.spacing(8, 3, 3),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  borderRight: "1px solid rgba(255,255,255,0.07)",
}));

export const StyledGithubIcon = styled("img")(() => ({
  filter: "brightness(0) invert(0.6)",
  transition: "filter 180ms ease",
  "&:hover": { filter: "brightness(0) invert(1)" },
}));

export const AppMenu = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
}));
