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
 * Truncate an address for compact display: `EQAb12…ZyXw`.
 */
export function shortAddress(addr: Address | string, head = 6, tail = 4): string {
  const s = typeof addr === "string" ? addr : formatContract(addr);
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

/**
 * URL-encode an address for use in routes (preserves the canonical EQ form).
 */
export function addressToParam(addr: Address | string): string {
  return formatContract(addr);
}
