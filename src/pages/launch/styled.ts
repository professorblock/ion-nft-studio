import { Box, styled } from "@mui/material";

export const FormShell = styled(Box)(() => ({
  width: "100%",
  maxWidth: 720,
  margin: "0 auto",
  padding: "8px 0 96px",
}));

export const FormCard = styled(Box)(() => ({
  background: "rgba(255,255,255,0.025)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px",
  padding: "28px",
  display: "flex",
  flexDirection: "column",
  gap: 20,
}));

export const FieldGroup = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  gap: 8,
}));

export const FieldLabel = styled(Box)(() => ({
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.62)",
  display: "flex",
  alignItems: "center",
  gap: 6,
}));

export const FieldHint = styled(Box)(() => ({
  fontSize: 12,
  lineHeight: 1.5,
  color: "rgba(255,255,255,0.4)",
}));

export const RequiredDot = styled(Box)(() => ({
  width: 5,
  height: 5,
  borderRadius: "50%",
  background: "#F87171",
  flexShrink: 0,
}));

export const StyledInput = styled("input")(() => ({
  width: "100%",
  background: "rgba(0,0,0,0.35)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "10px",
  padding: "13px 14px",
  fontSize: 15,
  fontWeight: 500,
  color: "#FFFFFF",
  fontFamily: "'Inter', sans-serif",
  outline: "none",
  transition: "border-color 180ms ease, background 180ms ease",
  "&::placeholder": { color: "rgba(255,255,255,0.32)" },
  "&:focus": { borderColor: "rgba(96,165,250,0.5)", background: "rgba(0,0,0,0.45)" },
  "&[aria-invalid='true']": { borderColor: "rgba(248,113,113,0.55)" },
}));

export const StyledTextarea = styled("textarea")(() => ({
  width: "100%",
  minHeight: 88,
  background: "rgba(0,0,0,0.35)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "10px",
  padding: "13px 14px",
  fontSize: 14,
  lineHeight: 1.55,
  color: "#FFFFFF",
  fontFamily: "'Inter', sans-serif",
  resize: "vertical",
  outline: "none",
  transition: "border-color 180ms ease, background 180ms ease",
  "&::placeholder": { color: "rgba(255,255,255,0.32)" },
  "&:focus": { borderColor: "rgba(96,165,250,0.5)", background: "rgba(0,0,0,0.45)" },
  "&[aria-invalid='true']": { borderColor: "rgba(248,113,113,0.55)" },
}));

export const FieldError = styled(Box)(() => ({
  fontSize: 12,
  color: "#FCA5A5",
  marginTop: 2,
}));

export const TwoColumnRow = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
  },
}));
