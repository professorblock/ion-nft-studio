import { Box, Button, IconButton, Menu, MenuItem, useMediaQuery, Drawer } from "@mui/material";
import React, { useState } from "react";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import WalletRoundedIcon from "@mui/icons-material/WalletRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { Outlet, useNavigate } from "react-router-dom";
import { HeaderContent, HeaderWrapper } from "./styled";
import { TonConnectButton, useTonAddress, useTonConnectUI } from "@ion-gateway/ui-react";
import ionLogo from "assets/ion-logo.png";

const navItems = [
  { label: "Ecosystem", href: "https://ice.io" },
  { label: "Network", href: "https://ice.io" },
  { label: "Docs", href: "https://github.com/professorblock/ion-nft-studio" },
];

export const Header = () => {
  const isDesktop = useMediaQuery("(min-width:900px)");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <HeaderWrapper position="sticky" elevation={0}>
        <HeaderContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              minWidth: 0,
            }}>
            <LogoBlock />
          </Box>

          {isDesktop && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 5,
                minWidth: 0,
              }}>
              {navItems.map((item) => (
                <NavItem key={item.label} label={item.label} href={item.href} />
              ))}
            </Box>
          )}

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              minWidth: 0,
            }}>
            {isDesktop ? (
              <ConnectWalletButton />
            ) : (
              <IconButton
                onClick={() => setMobileOpen(true)}
                sx={{
                  color: "#fff",
                  width: 42,
                  height: 42,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  "&:hover": { background: "rgba(255,255,255,0.08)" },
                }}>
                <MenuRoundedIcon />
              </IconButton>
            )}
          </Box>
        </HeaderContent>
      </HeaderWrapper>

      {/* Hidden TonConnectButton kept mounted for compatibility with
          utils/onConnect (used in some places elsewhere in the app). */}
      <Box
        id="ton-connect-button"
        sx={{
          position: "absolute",
          width: 0,
          height: 0,
          overflow: "hidden",
          visibility: "hidden",
        }}>
        <TonConnectButton />
      </Box>

      {/* Mobile drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          // Drawer's own z-index — the TonConnect modal must sit ABOVE this
          // when opened from inside the drawer. We solve that by closing the
          // drawer FIRST (see ConnectWalletButton.onBeforeOpen).
          zIndex: 1300,
        }}
        PaperProps={{
          sx: {
            width: "100%",
            maxWidth: 360,
            background: "rgba(0,0,0,0.96)",
            color: "#fff",
            backdropFilter: "blur(20px)",
            borderLeft: "1px solid rgba(255,255,255,0.06)",
          },
        }}>
        <Box sx={{ minHeight: "100%", display: "flex", flexDirection: "column", px: 3, py: 2.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 4,
            }}>
            <LogoBlock />
            <IconButton
              onClick={() => setMobileOpen(false)}
              sx={{
                color: "#fff",
                width: 42,
                height: 42,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
              }}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 4 }}>
            {navItems.map((item) => (
              <Box
                key={item.label}
                component="a"
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: "rgba(255,255,255,0.84)",
                  fontSize: 16,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  py: 1.5,
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  textDecoration: "none",
                  display: "block",
                }}>
                {item.label}
              </Box>
            ))}
          </Box>

          {/* Wallet button at the TOP of the drawer (not buried at the bottom),
              and it closes the drawer before opening the connect modal so the
              modal isn't trapped behind the drawer. */}
          <Box sx={{ pt: 1 }}>
            <ConnectWalletButton fullWidth onBeforeOpen={() => setMobileOpen(false)} />
          </Box>
        </Box>
      </Drawer>

      <Outlet />
    </>
  );
};

const IonLogoMark = ({ size = 44 }: { size?: number }) => (
  <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
    <Box
      sx={{
        position: "absolute",
        inset: -2,
        borderRadius: "12px",
        background: "linear-gradient(135deg, rgba(96,165,250,0.35), rgba(167,139,250,0.35))",
        filter: "blur(10px)",
        opacity: 0.85,
        pointerEvents: "none",
      }}
    />
    <Box
      component="img"
      src={ionLogo}
      alt="ION"
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: "11px",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 8px 22px rgba(36,28,90,0.45)",
        objectFit: "cover",
        display: "block",
      }}
    />
  </Box>
);

const WordMark = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      lineHeight: 1,
      minWidth: 0,
    }}>
    <Box
      sx={{
        display: "flex",
        alignItems: "baseline",
        gap: "5px",
        whiteSpace: "nowrap",
      }}>
      <Box
        component="span"
        sx={{
          color: "#FFFFFF",
          fontSize: 23,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          fontFamily: "'Inter', sans-serif",
        }}>
        ION
      </Box>
      <Box
        component="span"
        sx={{
          color: "rgba(255,255,255,0.78)",
          fontSize: 23,
          fontWeight: 300,
          letterSpacing: "-0.025em",
          fontFamily: "'Inter', sans-serif",
        }}>
        Hub
      </Box>
    </Box>
    <Box
      sx={{
        mt: 0.6,
        color: "#60A5FA",
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}>
      NFT Studio
    </Box>
  </Box>
);

const LogoBlock = () => {
  const navigate = useNavigate();
  return (
    <Box
      onClick={() => navigate("/")}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.4,
        cursor: "pointer",
        userSelect: "none",
      }}>
      <IonLogoMark />
      <WordMark />
    </Box>
  );
};

const NavItem = ({ label, href }: { label: string; href: string }) => (
  <Box
    component="a"
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    sx={{
      position: "relative",
      color: "rgba(255,255,255,0.68)",
      fontSize: 14,
      fontWeight: 500,
      letterSpacing: "-0.01em",
      cursor: "pointer",
      py: 1,
      textDecoration: "none",
      transition: "color 180ms ease",
      "&:hover": { color: "#fff" },
      "&::after": {
        content: '""',
        position: "absolute",
        left: "50%",
        bottom: 2,
        width: 0,
        height: 2,
        borderRadius: "999px",
        background: "linear-gradient(90deg, #60A5FA 0%, #A78BFA 100%)",
        transform: "translateX(-50%)",
        transition: "width 180ms ease",
      },
      "&:hover::after": { width: "100%" },
    }}>
    {label}
  </Box>
);

/* ================================================================
   Connect Wallet button
   - Not connected → opens TonConnect modal
   - Connected → shows dropdown with Copy Address / Disconnect
   - On mobile, calls onBeforeOpen() (closes drawer) before opening
     modal so the modal isn't hidden behind the drawer
   ================================================================ */
const ConnectWalletButton = ({
  fullWidth = false,
  onBeforeOpen,
}: {
  fullWidth?: boolean;
  onBeforeOpen?: () => void;
}) => {
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const menuOpen = Boolean(anchorEl);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (address) {
      // Already connected → show menu (do NOT call openModal — that throws
      // WalletAlreadyConnectedError)
      setAnchorEl(e.currentTarget);
    } else {
      // Not connected → close mobile drawer (if any) then open the modal.
      // Small delay lets the drawer animation finish so the modal lands
      // on top instead of behind it.
      onBeforeOpen?.();
      setTimeout(() => {
        if (tonConnectUI) tonConnectUI.openModal();
      }, 280);
    }
  };

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      // older-browser fallback
      const ta = document.createElement("textarea");
      ta.value = address;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
    setTimeout(() => setAnchorEl(null), 600);
  };

  const handleDisconnect = async () => {
    setAnchorEl(null);
    try {
      if (tonConnectUI) await tonConnectUI.disconnect();
    } catch (err) {
      // swallow — user likely already disconnected
      console.warn("Disconnect failed", err);
    }
  };

  const truncate = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  return (
    <>
      <Box
        sx={{
          position: "relative",
          width: fullWidth ? "100%" : "auto",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: -2,
            borderRadius: "999px",
            background: "linear-gradient(90deg, rgba(59,130,246,0.45), rgba(99,102,241,0.40))",
            filter: "blur(14px)",
            opacity: 0.9,
            pointerEvents: "none",
          },
        }}>
        <Button
          onClick={handleClick}
          fullWidth={fullWidth}
          startIcon={<WalletRoundedIcon sx={{ fontSize: 18 }} />}
          endIcon={
            address ? <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18, opacity: 0.7 }} /> : null
          }
          sx={{
            position: "relative",
            zIndex: 1,
            minHeight: 44,
            px: 2.75,
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
            boxShadow: "0 10px 28px rgba(37,99,235,0.34)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            letterSpacing: "-0.01em",
            textTransform: "none",
            fontFamily: "Inter, sans-serif",
            "&:hover": {
              background: "linear-gradient(135deg, #4F8DF6 0%, #2D6BE8 100%)",
              transform: "translateY(-1px)",
              boxShadow: "0 14px 36px rgba(37,99,235,0.44)",
            },
            "&:active": { transform: "translateY(0)" },
          }}>
          {address ? truncate(address) : "Connect Wallet"}
        </Button>
      </Box>

      {/* Wallet dropdown — shown when connected */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 220,
            borderRadius: 2,
            background: "rgba(10,10,18,0.96)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 18px 48px rgba(0,0,0,0.42)",
            overflow: "hidden",
          },
        }}
        // ensure the menu sits above the drawer if it ever opens together
        sx={{ zIndex: 1400 }}>
        <MenuItem
          onClick={handleCopy}
          sx={{
            py: 1.25,
            px: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            color: "rgba(255,255,255,0.85)",
            fontSize: 13.5,
            "&:hover": { background: "rgba(96,165,250,0.10)" },
          }}>
          {copied ? (
            <CheckRoundedIcon sx={{ fontSize: 17, color: "#34D399" }} />
          ) : (
            <ContentCopyRoundedIcon sx={{ fontSize: 17, opacity: 0.7 }} />
          )}
          {copied ? "Copied!" : "Copy Address"}
        </MenuItem>
        <MenuItem
          onClick={handleDisconnect}
          sx={{
            py: 1.25,
            px: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            color: "#F87171",
            fontSize: 13.5,
            "&:hover": { background: "rgba(248,113,113,0.10)" },
          }}>
          <LogoutRoundedIcon sx={{ fontSize: 17, opacity: 0.85 }} />
          Disconnect
        </MenuItem>
      </Menu>
    </>
  );
};
