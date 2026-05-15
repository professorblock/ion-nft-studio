/**
 * AddressDisplay
 * ──────────────
 * Reusable address chip with copy-to-clipboard + open-in-explorer affordances.
 *
 * Always renders in friendly form (UQ for wallets, EQ for contracts).
 * Auto-normalizes raw "0:hex" inputs.
 */

import { useState } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { normalizeWallet, normalizeContract, shortAddress } from "lib/nft/address-format";

interface Props {
  address: string;
  /** "contract" → EQ form + explorer /address. "wallet" → UQ form + /address. */
  variant?: "contract" | "wallet";
  /** Show only the short truncated form. Default true; pass false for full text. */
  shorten?: boolean;
  /** Custom label to show instead of the address text. */
  label?: string;
  /** Inline (compact, monospace) vs block (full row). */
  layout?: "inline" | "block";
  /** Override accent color for the chip. */
  color?: string;
}

export const AddressDisplay = ({
  address,
  variant = "wallet",
  shorten = true,
  label,
  layout = "inline",
  color = "rgba(255,255,255,0.7)",
}: Props) => {
  const [copied, setCopied] = useState(false);

  const normalized = variant === "wallet" ? normalizeWallet(address) : normalizeContract(address);
  const display = label
    ? label
    : shorten
    ? shortAddress(address, 6, 4, { bounceable: variant === "contract" })
    : normalized;
  const explorerUrl = `https://explorer.ice.io/address/${normalized}`;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(normalized);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked — silently ignore */
    }
  };

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.25,
        background: layout === "block" ? "rgba(255,255,255,0.04)" : "transparent",
        border: layout === "block" ? "1px solid rgba(255,255,255,0.08)" : "none",
        borderRadius: "6px",
        px: layout === "block" ? 1 : 0,
        py: layout === "block" ? 0.5 : 0,
      }}>
      <Typography
        sx={{
          fontFamily: "monospace",
          fontSize: layout === "block" ? 12 : 11.5,
          color,
          letterSpacing: 0,
          userSelect: "all",
        }}>
        {display}
      </Typography>
      <Tooltip title={copied ? "Copied" : "Copy address"} placement="top" arrow>
        <IconButton
          onClick={handleCopy}
          size="small"
          sx={{
            ml: 0.25,
            p: 0.5,
            color: copied ? "#34D399" : "rgba(255,255,255,0.4)",
            "&:hover": { color: "rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.05)" },
          }}>
          {copied ? (
            <CheckRoundedIcon sx={{ fontSize: 14 }} />
          ) : (
            <ContentCopyRoundedIcon sx={{ fontSize: 13 }} />
          )}
        </IconButton>
      </Tooltip>
      <Tooltip title="View on explorer" placement="top" arrow>
        <IconButton
          component="a"
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          onClick={(e) => e.stopPropagation()}
          sx={{
            p: 0.5,
            color: "rgba(255,255,255,0.4)",
            "&:hover": { color: "rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.05)" },
          }}>
          <OpenInNewRoundedIcon sx={{ fontSize: 13 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
