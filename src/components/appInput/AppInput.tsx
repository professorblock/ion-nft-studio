import { Box, Typography, styled } from "@mui/material";

export const InputWrapper = styled(Box)(({ theme }) => ({
  width: "100%",
  marginBottom: theme.spacing(0.5),
}));

export const InputShell = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  minHeight: 52,
  borderRadius: 13,
  padding: "0 16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  transition: "all 200ms ease",
  "&:hover": {
    borderColor: "rgba(0,212,255,0.25)",
    background: "rgba(255,255,255,0.05)",
  },
  "&:focus-within": {
    borderColor: "#00D4FF",
    boxShadow: "0 0 0 3px rgba(0,212,255,0.12)",
    background: "rgba(0,212,255,0.03)",
  },
  "& input": {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: 500,
    fontFamily: "'Inter', sans-serif",
    padding: "4px 0",
  },
  "& input::placeholder": { color: "rgba(255,255,255,0.28)" },
  "& input:disabled": { color: "rgba(255,255,255,0.22)", cursor: "not-allowed" },
}));

export const HelperText = styled(Box)(() => ({
  marginTop: 6,
  paddingLeft: 4,
  color: "rgba(255,255,255,0.35)",
  fontSize: 12,
  lineHeight: "18px",
  fontFamily: "'Inter', sans-serif",
}));

interface LabelProps {
  label?: string;
  required?: boolean;
}

export const AppInputLabel = ({ label, required }: LabelProps) =>
  label ? (
    <Typography
      component="label"
      sx={{
        display: "block",
        mb: 0.75,
        fontSize: 13,
        fontWeight: 600,
        color: "rgba(255,255,255,0.55)",
        letterSpacing: "0.015em",
        fontFamily: "'Inter', sans-serif",
      }}>
      {label}
      {required && (
        <Box component="span" sx={{ color: "#00D4FF", ml: 0.4 }}>
          *
        </Box>
      )}
    </Typography>
  ) : null;
