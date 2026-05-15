import { Address } from "ton";

/**
 * Format a wallet address as `UQ…` (mainnet, non-bounceable, URL-safe).
 * Use for showing user wallets and collection owners.
 */
export function formatWallet(addr: Address | string): string {
  const a = typeof addr === "string" ? Address.parse(addr) : addr;
  return a.toFriendly({ urlSafe: true, bounceable: false, testOnly: false });
}

/**
 * Format a contract address as `EQ…` (mainnet, bounceable, URL-safe).
 * Use for collection contracts, item contracts, etc.
 */
export function formatContract(addr: Address | string): string {
  const a = typeof addr === "string" ? Address.parse(addr) : addr;
  return a.toFriendly({ urlSafe: true, bounceable: true, testOnly: false });
}

/**
 * Truncate an address for compact display: `UQAb12…ZyXw`.
 * Accepts any input form (raw `0:hex`, EQ, UQ, 0Q) and normalizes to UQ
 * before shortening, so the display is consistent regardless of source format.
 * Defaults to wallet-style UQ form; pass `{ bounceable: true }` for contract EQ form.
 */
export function shortAddress(
  addr: Address | string,
  head = 6,
  tail = 4,
  opts: { bounceable?: boolean } = {},
): string {
  const wantBounceable = opts.bounceable ?? false;
  let normalized: string;
  try {
    const parsed = typeof addr === "string" ? Address.parse(addr) : addr;
    normalized = parsed.toFriendly({
      urlSafe: true,
      bounceable: wantBounceable,
      testOnly: false,
    });
  } catch {
    normalized = typeof addr === "string" ? addr : "";
  }
  if (normalized.length <= head + tail + 1) return normalized;
  return `${normalized.slice(0, head)}…${normalized.slice(-tail)}`;
}

/**
 * Normalize any address form (raw "0:hex", EQ, UQ, 0Q) to friendly UQ form.
 * For displaying wallet addresses to users in the format they recognize.
 */
export function normalizeWallet(addr: Address | string): string {
  try {
    const parsed = typeof addr === "string" ? Address.parse(addr) : addr;
    return parsed.toFriendly({ urlSafe: true, bounceable: false, testOnly: false });
  } catch {
    return typeof addr === "string" ? addr : "";
  }
}

/**
 * Normalize any address form to friendly EQ form (bounceable, for contracts).
 */
export function normalizeContract(addr: Address | string): string {
  try {
    const parsed = typeof addr === "string" ? Address.parse(addr) : addr;
    return parsed.toFriendly({ urlSafe: true, bounceable: true, testOnly: false });
  } catch {
    return typeof addr === "string" ? addr : "";
  }
}

/**
 * URL-encode an address for use in routes (preserves the canonical EQ form).
 */
export function addressToParam(addr: Address | string): string {
  return formatContract(addr);
}
