import { Drawer, IconButton, styled, Box } from "@mui/material";
import githubIcon from "assets/icons/github-logo.svg";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { AppLogo } from "components/appLogo";
import { CloseMenuButton, DrawerContent, StyledGithubIcon, AppMenu } from "./styled";
import { TonConnectButton } from "@ion-gateway/ui-react";

interface MenuProps {
  closeMenu?: () => void;
  showMenu?: boolean;
}

const MobileMenu: React.FC<MenuProps> = ({ closeMenu, showMenu }) => {
  return (
    <Drawer anchor="left" open={showMenu} onClose={closeMenu}>
      <CloseMenuButton onClick={closeMenu}>
        <CloseRoundedIcon style={{ width: 30, height: 30 }} />
      </CloseMenuButton>
      <DrawerContent>
        <AppLogo />
        <HeaderMenu showMenu={showMenu} closeMenu={closeMenu} />
      </DrawerContent>
    </Drawer>
  );
};

const HeaderMenu: React.FC<MenuProps> = (props) => {
  return (
    <AppMenu>
      <Box onClick={props.closeMenu}>
        <StyledIONConnectButton />
      </Box>

      <IconButton
        sx={{
          width: 42,
          height: 42,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          "&:hover": { background: "rgba(255,255,255,0.06)" },
        }}
        href="https://github.com/professorblock/ion-nft-studio"
        target="_blank">
        <StyledGithubIcon width={18} height={18} src={githubIcon} />
      </IconButton>
    </AppMenu>
  );
};

const StyledIONConnectButton = styled(TonConnectButton)(() => ({
  button: {
    background: "linear-gradient(135deg, #6E39F6 0%, #7C4DFF 100%)",
    borderRadius: 999,
    height: 48,
    padding: "0 20px",
    boxShadow: "0 10px 30px rgba(110,57,246,0.35)",
    fontFamily: "Inter, sans-serif",
    fontWeight: 700,
    border: "1px solid rgba(255,255,255,0.08)",
  },
  "*": {
    color: "#fff !important",
    fontFamily: "Inter, sans-serif !important",
  },
  img: {
    display: "none !important",
  },
  svg: {
    color: "#fff !important",
    fill: "#fff !important",
  },
}));

export { HeaderMenu, MobileMenu };
