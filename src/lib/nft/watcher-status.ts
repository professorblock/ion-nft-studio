/**
 * watcher-status.ts
 * ─────────────────
 * Polls the public processed-burns.json in the watcher repo to learn
 * whether a specific burn has been minted yet.
 *
 * Reads via raw.githubusercontent.com — no auth, no CORS issue, no extra
 * infra. The watcher commits to that file on every cron tick so it's
 * always reasonably fresh.
 *
 * Returns one of three states per poll:
 *   - "pending"  — no entry yet (burn detected by frontend but not by watcher)
 *   - "logged"   — watcher saw the burn, hasn't acted yet (log mode or
 *                  still in queue)
 *   - "minted"   — watcher signed the mint, NFT is in user's wallet
 *   - "rejected" — watcher saw the burn and refused (split mismatch etc.)
 */

const RAW_STATE_URL =
  "https://raw.githubusercontent.com/professorblock/ion-nft-watcher/master/state/processed-burns.json";

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
 *
 * We can't key on burn tx hash from the frontend because the user's
 * wallet signs an external tx that produces several internal txs, and
 * we don't yet know the internal tx hash. So we match on the (burner,
 * pocket) tuple — which uniquely identifies "the most recent burn this
 * user did to this collection" for our purposes.
 */
export async function fetchBurnStatus(
  burnerAddress: string,
  burnPocketAddress: string,
): Promise<WatcherBurnStatus> {
  // Cache-bust so we get the freshest commit
  const url = `${RAW_STATE_URL}?t=${Date.now()}`;

  let parsed: Record<string, ProcessedBurn>;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return { status: "pending" };
    }
    parsed = (await res.json()) as Record<string, ProcessedBurn>;
  } catch {
    return { status: "pending" };
  }

  // Find the newest entry matching burner + pocket
  let best: ProcessedBurn | null = null;
  for (const entry of Object.values(parsed)) {
    if (!entry) continue;
    if (entry.burn_pocket_address !== burnPocketAddress) continue;
    // Address comparison: tolerant of EQ/UQ form by normalizing trailing flags;
    // simple substring match on the hash bytes is more reliable than equality
    // because the watcher writes UQ-form but frontend may have either.
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
 * Loose-match two TON addresses: returns true if they share the same
 * hash bytes regardless of bounceable/testnet flag differences (EQ vs
 * UQ vs 0Q). Address.parse + .equals would be the right tool but pulling
 * `ton` into this file just for that is overkill; the hash bytes live
 * in characters 2..46 of the friendly form once you decode the base64,
 * but the cheap approximation below works because addresses with the
 * same hash differ only in the first char and the last 4 (CRC).
 */
function addressesMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  // Compare the middle portion (skip first char which is flag, last 4 which are CRC)
  return a.slice(1, -4) === b.slice(1, -4);
}
