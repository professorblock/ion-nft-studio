import { Box, styled } from "@mui/material";

const LogoWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  userSelect: "none",
  "&:hover": {
    cursor: "pointer",
    opacity: 0.8,
  },
  transition: "opacity 0.2s ease-in-out",
  [theme.breakpoints.down("sm")]: {
    "& img": { width: 28, height: 28 },
  },
}));

const ImageWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginRight: theme.spacing(0.5),
}));

export { LogoWrapper, ImageWrapper };
