/**
 * watcher-registration.ts
 * ───────────────────────
 * Registers a freshly-deployed PoB collection with the watcher repo.
 * Posts to the upload-proxy worker's /register-pob-collection endpoint;
 * the worker holds the GitHub PAT and commits to ion-nft-watcher.
 *
 * Failure is non-fatal — if registration fails, the deploy itself still
 * succeeded, the user just needs to register manually (we can later add
 * a "Retry registration" button).
 */

const PROXY_URL = (process.env.REACT_APP_UPLOAD_PROXY_URL ?? "").replace(/\/+$/, "");

export interface RegisterPayload {
  collection_address: string;
  burn_pocket_address: string;
  creator_address: string;
  pob_burn_pct: number;
  pob_mint_amount_nano: string;
  max_supply: number | null;
}

export type RegisterResult =
  | { ok: true; alreadyRegistered: boolean; commitUrl: string | null }
  | { ok: false; reason: string };

export async function registerPobCollectionWithWatcher(
  payload: RegisterPayload,
): Promise<RegisterResult> {
  if (!PROXY_URL) {
    return { ok: false, reason: "Upload proxy not configured" };
  }
  try {
    const res = await fetch(`${PROXY_URL}/register-pob-collection`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as Record<string, any>;
    if (!res.ok) {
      return { ok: false, reason: data?.error ?? `HTTP ${res.status}` };
    }
    return {
      ok: true,
      alreadyRegistered: Boolean(data.alreadyRegistered),
      commitUrl: data.commit_url ?? null,
    };
  } catch (e: any) {
    return { ok: false, reason: e?.message ?? String(e) };
  }
}
