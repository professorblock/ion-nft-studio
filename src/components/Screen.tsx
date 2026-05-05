import { Box, styled } from "@mui/material";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  id?: string;
  removeBackground?: boolean;
}

const StyledScreen = styled(Box)({
  display: "flex",
  alignItems: "center",
  flexDirection: "column",
  width: "100%",
});

const StyledContent = styled(Box)(({ theme }) => ({
  width: "100%",
  maxWidth: 1280,
  margin: "0 auto",
  padding: "0 24px",
  paddingTop: 80,
  paddingBottom: 60,
  [theme.breakpoints.down("lg")]: { maxWidth: "100%" },
  [theme.breakpoints.down("sm")]: {
    padding: "0 16px",
    paddingTop: 80,
    paddingBottom: 40,
  },
}));

const ScreenContent = ({ children }: Props) => (
  <StyledContent className="screen-content">{children}</StyledContent>
);

function Screen({ children, id = "" }: Props) {
  return <StyledScreen id={id}>{children}</StyledScreen>;
}

export { Screen, ScreenContent };
