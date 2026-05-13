/**
 * watcher-status.ts
 * ─────────────────
 * Polls the public processed-burns.json in the watcher repo to learn
 * whether a specific burn has been minted yet, and reads the registered
 * creator address from tracked-collections.json.
 *
 * Reads via raw.githubusercontent.com — no auth, no CORS issue, no extra
 * infra. The watcher commits to those files on every cron tick so they're
 * always reasonably fresh.
 */

import { Address } from "ton";

const RAW_STATE_URL =
  "https://raw.githubusercontent.com/professorblock/ion-nft-watcher/master/state/processed-burns.json";

const RAW_TRACKED_URL =
  "https://raw.githubusercontent.com/professorblock/ion-nft-watcher/master/state/tracked-collections.json";

// ──────────────────────────────────────────────────────────────────────────────
// Burn status
// ──────────────────────────────────────────────────────────────────────────────

export type WatcherBurnStatus =
  | { status: "pending" }
  | { status: "logged"; detectedAt: string }
  | { status: "minted"; mintTxHash?: string; detectedAt: string }
  | { status: "rejected"; reason: string };

interface ProcessedBurn {
  burn_tx_hash: string;
  burn_pocket_address: string;
  burner_address: string;
  amount_nano: string;
  detected_at: string;
  status: "logged" | "validated" | "minted" | "rejected";
  rejection_reason?: string;
  mint_tx_hash?: string;
}

/**
 * Look up the most recent burn in the watcher's processed-burns.json
 * matching this (burnerAddress, burnPocket) pair.
 */
export async function fetchBurnStatus(
  burnerAddress: string,
  burnPocketAddress: string,
): Promise<WatcherBurnStatus> {
  const url = `${RAW_STATE_URL}?t=${Date.now()}`;

  let parsed: Record<string, ProcessedBurn>;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { status: "pending" };
    parsed = (await res.json()) as Record<string, ProcessedBurn>;
  } catch {
    return { status: "pending" };
  }

  let best: ProcessedBurn | null = null;
  for (const entry of Object.values(parsed)) {
    if (!entry) continue;
    if (!addressesMatch(entry.burn_pocket_address, burnPocketAddress)) continue;
    if (!addressesMatch(entry.burner_address, burnerAddress)) continue;

    if (!best || entry.detected_at > best.detected_at) {
      best = entry;
    }
  }

  if (!best) return { status: "pending" };

  switch (best.status) {
    case "minted":
      return {
        status: "minted",
        mintTxHash: best.mint_tx_hash,
        detectedAt: best.detected_at,
      };
    case "rejected":
      return {
        status: "rejected",
        reason: best.rejection_reason ?? "Burn was rejected by the watcher",
      };
    case "validated":
    case "logged":
    default:
      return { status: "logged", detectedAt: best.detected_at };
  }
}

/**
 * Match two TON address strings: returns true if they share the same
 * workchain + hash bytes regardless of bounceable/testnet flag differences
 * (EQ vs UQ vs 0Q). Uses the ton library's canonical parse + equals.
 */
function addressesMatch(a: string, b: string): boolean {
  if (a === b) return true;
  try {
    return Address.parse(a).equals(Address.parse(b));
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Tracked collections — look up the registered creator address
// ──────────────────────────────────────────────────────────────────────────────

interface TrackedCollection {
  collection_address: string;
  burn_pocket_address: string;
  creator_address: string;
  pob_burn_pct: number;
  pob_mint_amount_nano: string;
  max_supply: number | null;
  registered_at: string;
}

export interface RegisteredCollectionInfo {
  creator_address: string;
  burn_pocket_address: string;
  pob_burn_pct: number;
}

/**
 * Look up a PoB collection's registered info (creator + pocket) from the
 * watcher's tracked-collections.json. Returns null if not registered yet.
 *
 * The on-chain owner of a PoB collection is the PLATFORM MINT KEY (so the
 * watcher can authorize mints) — the actual creator wallet is only known
 * to the watcher via the registration entry. The burn-to-mint flow must
 * use the registered creator_address to direct the creator share correctly.
 */
export async function fetchRegisteredCollection(
  collectionAddress: string,
): Promise<RegisteredCollectionInfo | null> {
  try {
    const res = await fetch(`${RAW_TRACKED_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const arr = (await res.json()) as TrackedCollection[];
    const entry = arr.find((c) => addressesMatch(c.collection_address, collectionAddress));
    if (!entry) return null;
    return {
      creator_address: entry.creator_address,
      burn_pocket_address: entry.burn_pocket_address,
      pob_burn_pct: entry.pob_burn_pct,
    };
  } catch {
    return null;
  }
}
