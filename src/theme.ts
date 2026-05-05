import { createTheme } from "@mui/material/styles";

// Arena reference design tokens
// Background: pure black with subtle purple/blue radial glow
// Primary CTA: blue (#3B82F6) with darker blue gradient hover
// Accent gradient on heading: blue → purple (#60A5FA → #A78BFA)
// "CREATOR STUDIO" pill: purple (#A78BFA)
// "V2 INFRASTRUCTURE LIVE" pill: blue (#60A5FA)
// Estimated Fee callout: green (#34D399)

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#3B82F6", light: "#60A5FA", dark: "#2563EB", contrastText: "#fff" },
    secondary: { main: "#A78BFA", light: "#C4B5FD", dark: "#8B5CF6" },
    background: { default: "#000000", paper: "#0A0A12" },
    text: { primary: "#FFFFFF", secondary: "rgba(255,255,255,0.62)" },
    error: { main: "#F87171" },
    success: { main: "#34D399" },
    warning: { main: "#FBBF24" },
    divider: "rgba(255,255,255,0.06)",
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    button: { textTransform: "none", fontWeight: 600, letterSpacing: "-0.01em" },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "#000000", color: "#FFFFFF" },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(255,255,255,0.025)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.07)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
          fontSize: 14,
          padding: "11px 22px",
          transition: "all 200ms ease",
          "&:hover": { transform: "translateY(-1px)" },
          "&:active": { transform: "translateY(0)" },
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
          color: "#fff",
          boxShadow: "0 8px 24px rgba(59,130,246,0.32)",
          "&:hover": {
            background: "linear-gradient(135deg, #4F8DF6 0%, #2D6BE8 100%)",
            boxShadow: "0 12px 32px rgba(59,130,246,0.42)",
          },
          "&.Mui-disabled": {
            background: "rgba(255,255,255,0.07)",
            color: "rgba(255,255,255,0.2)",
            boxShadow: "none",
            transform: "none",
          },
        },
        outlinedPrimary: {
          border: "1px solid rgba(255,255,255,0.14)",
          color: "rgba(255,255,255,0.92)",
          background: "rgba(255,255,255,0.03)",
          "&:hover": {
            border: "1px solid rgba(255,255,255,0.24)",
            background: "rgba(255,255,255,0.06)",
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: "rgba(255,255,255,0.025)",
          color: "#FFFFFF",
          "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
          "&:hover fieldset": { borderColor: "rgba(96,165,250,0.32)" },
          "&.Mui-focused fieldset": {
            borderColor: "#60A5FA",
            boxShadow: "0 0 0 3px rgba(96,165,250,0.14)",
          },
        },
        input: {
          color: "#FFFFFF",
          padding: "14px 16px",
          fontSize: 14,
          "&::placeholder": { color: "rgba(255,255,255,0.32)", opacity: 1 },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "rgba(255,255,255,0.5)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          "&.Mui-focused": { color: "#60A5FA" },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: { color: "#FFFFFF" },
        icon: { color: "rgba(255,255,255,0.4)" },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          backgroundColor: "#0A0A12",
          color: "#FFFFFF",
          "&:hover": { backgroundColor: "rgba(96,165,250,0.08)" },
          "&.Mui-selected": { backgroundColor: "rgba(96,165,250,0.16)" },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(96,165,250,0.10)",
          color: "#60A5FA",
          border: "1px solid rgba(96,165,250,0.22)",
          fontWeight: 700,
          fontSize: 11,
          height: 22,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontFamily: "'Inter', sans-serif",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#16161F",
          color: "rgba(255,255,255,0.85)",
          border: "1px solid rgba(255,255,255,0.08)",
          fontSize: 12,
          borderRadius: 8,
          padding: "7px 12px",
        },
        arrow: { color: "#16161F" },
      },
    },
    MuiCircularProgress: {
      styleOverrides: { root: { color: "#60A5FA" } },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: "rgba(255,255,255,0.06)" } },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(96,165,250,0.06)",
          border: "1px solid rgba(96,165,250,0.15)",
          color: "#FFFFFF",
          borderRadius: 12,
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: "#60A5FA",
          textDecorationColor: "rgba(96,165,250,0.3)",
          "&:hover": { color: "#A78BFA" },
        },
      },
    },
  },
});

export default theme;
