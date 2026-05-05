import React from "react";
import { Box, Typography } from "@mui/material";
import { Outlet } from "react-router-dom";
import ionLogo from "assets/ion-logo.png";

const resources = [
  { label: "Documentation", href: "https://github.com/professorblock/ion-nft-studio#readme" },
  { label: "Block Explorer", href: "https://explorer.ice.io" },
  { label: "Network Status", href: "https://ice.io" },
];

const community = [
  { label: "Twitter / X", href: "https://x.com/ice_blockchain" },
  { label: "Telegram", href: "https://t.me/iceblockchain" },
  { label: "GitHub", href: "https://github.com/professorblock/ion-nft-studio" },
];

export const Footer = () => {
  return (
    <>
      <Box
        component="footer"
        sx={{
          mt: { xs: 12, md: 16 },
          borderTop: "1px solid rgba(255,255,255,0.07)",
          background: "linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.5) 100%)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}>
        <Box
          sx={{
            width: "100%",
            maxWidth: 1280,
            mx: "auto",
            px: { xs: "18px", md: "40px" },
            pt: { xs: 7, md: 9 },
            pb: { xs: 4, md: 5 },
          }}>
          {/* Top row — brand block + 2 columns, distributed across full width */}
          <Box
            sx={{
              display: "grid",
              // brand wider, columns farther right (less centered feel)
              gridTemplateColumns: { xs: "1fr", md: "2.4fr 1fr 1fr" },
              alignItems: "start",
              columnGap: { xs: 0, md: 10 },
              rowGap: { xs: 5, md: 4 },
              pb: { xs: 5, md: 6 },
            }}>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.4, mb: 2.5 }}>
                <Box sx={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
                  <Box
                    sx={{
                      position: "absolute",
                      inset: -2,
                      borderRadius: "12px",
                      background:
                        "linear-gradient(135deg, rgba(96,165,250,0.35), rgba(167,139,250,0.35))",
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

                <Box sx={{ lineHeight: 1 }}>
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
                        color: "#fff",
                        fontSize: 23,
                        fontWeight: 800,
                        letterSpacing: "-0.04em",
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
                      }}>
                      Hub
                    </Box>
                  </Box>
                  <Typography
                    sx={{
                      mt: 0.6,
                      color: "#60A5FA",
                      fontSize: 9.5,
                      fontWeight: 700,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                    }}>
                    Token Launchpad
                  </Typography>
                </Box>
              </Box>

              <Typography
                sx={{
                  color: "rgba(255,255,255,0.56)",
                  fontSize: 14,
                  lineHeight: "24px",
                  maxWidth: 420,
                }}>
                The community-built token launch platform for Ice Open Network. Minimal,
                transparent, and open-source — designed for builders.
              </Typography>
            </Box>

            <FooterGroup title="Resources" items={resources} />
            <FooterGroup title="Community" items={community} />
          </Box>

          {/* Sub-footer: copyright (left) | community line (center, fills space) | socials (right) */}
          <Box
            sx={{
              pt: { xs: 3.5, md: 4 },
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "auto 1fr auto" },
              alignItems: "center",
              gap: { xs: 2, md: 3 },
            }}>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.34)",
                fontSize: 12.5,
                letterSpacing: "-0.01em",
                textAlign: { xs: "center", md: "left" },
              }}>
              © {new Date().getFullYear()} ION Hub. All rights reserved.
            </Typography>

            <Typography
              sx={{
                color: "rgba(255,255,255,0.42)",
                fontSize: 12.5,
                letterSpacing: "-0.01em",
                textAlign: "center",
                whiteSpace: { xs: "normal", md: "nowrap" },
              }}>
              A community platform for{" "}
              <Box
                component="a"
                href="https://ice.io"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: "#8AB4FF",
                  textDecoration: "none",
                  fontWeight: 500,
                  "&:hover": { color: "#A5C5FF", textDecoration: "underline" },
                }}>
                Ice Open Network
              </Box>
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                justifyContent: { xs: "center", md: "flex-end" },
              }}>
              <SocialBubble href="https://t.me/iceblockchain" ariaLabel="Telegram">
                <TelegramIcon />
              </SocialBubble>
              <SocialBubble href="https://x.com/ice_blockchain" ariaLabel="X (Twitter)">
                <XIcon />
              </SocialBubble>
              <SocialBubble href="https://github.com/professorblock/ion-nft-studio" ariaLabel="GitHub">
                <GitHubIcon />
              </SocialBubble>
            </Box>
          </Box>
        </Box>
      </Box>

      <Outlet />
    </>
  );
};

const FooterGroup = ({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) => {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          color: "#fff",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          mb: 2.5,
        }}>
        {title}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.7 }}>
        {items.map((item) => (
          <Typography
            key={item.label}
            component="a"
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: "rgba(255,255,255,0.54)",
              fontSize: 14,
              lineHeight: 1.4,
              cursor: "pointer",
              width: "fit-content",
              textDecoration: "none",
              transition: "color 180ms ease, transform 180ms ease",
              "&:hover": {
                color: "#8AB4FF",
                transform: "translateX(2px)",
              },
            }}>
            {item.label}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

const SocialBubble = ({
  href,
  ariaLabel,
  children,
}: {
  href: string;
  ariaLabel: string;
  children: React.ReactNode;
}) => (
  <Box
    component="a"
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={ariaLabel}
    sx={{
      width: 38,
      height: 38,
      borderRadius: "999px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      color: "rgba(255,255,255,0.62)",
      textDecoration: "none",
      transition: "all 180ms ease",
      "&:hover": {
        background: "rgba(96,165,250,0.10)",
        borderColor: "rgba(96,165,250,0.32)",
        color: "#fff",
        transform: "translateY(-1px)",
      },
    }}>
    {children}
  </Box>
);

const TelegramIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const XIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const GitHubIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);
