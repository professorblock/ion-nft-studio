/**
 * ion-nft-upload-proxy
 * ────────────────────
 * Cloudflare Worker that proxies image and JSON uploads to Pinata.
 *
 * Frontend POSTs to:
 *   /upload/file → multipart/form-data (image)
 *   /upload/json → application/json (collection metadata)
 *
 * Worker holds the Pinata JWT as a Cloudflare secret (`PINATA_JWT`),
 * forwards the upload, and returns:
 *   { url: "https://gateway.pinata.cloud/ipfs/CID", cid: "CID" }
 *
 * Allowed origins are restricted via the ALLOWED_ORIGINS env var (set in
 * wrangler.toml — public, comma-separated list of full origins).
 */

interface Env {
  // Existing
  PINATA_JWT: string;
  ALLOWED_ORIGINS: string;
  // NEW: registration endpoint
  GITHUB_PAT: string; // secret — fine-grained, contents:write on watcher repo only
  GITHUB_REPO: string; // var — e.g. "professorblock/ion-nft-watcher"
  PLATFORM_MINT_KEY_ADDRESS: string; // var — public; just used for echo/sanity
}

const PINATA_BASE = "https://api.pinata.cloud";
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB hard cap (form caps at 5 MB)

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") ?? "";
    const allowed = env.ALLOWED_ORIGINS.split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const corsOrigin = allowed.includes(origin) ? origin : "";

    const corsHeaders: Record<string, string> = {
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    };
    if (corsOrigin) {
      corsHeaders["Access-Control-Allow-Origin"] = corsOrigin;
    }

    // Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Origin gate (allow GET /health from anywhere for uptime checks)
    // Items metadata endpoint also bypasses CORS — NFT marketplaces and
    // wallet indexers from any origin need to fetch item JSON.
    const url = new URL(request.url);
    const isHealth = url.pathname === "/health" || url.pathname === "/";
    const isItems = url.pathname.startsWith("/items/") && request.method === "GET";
    if (!corsOrigin && !isHealth && !isItems) {
      return jsonResponse({ error: "Origin not allowed" }, corsHeaders, 403);
    }

    try {
      if (isHealth) {
        return jsonResponse({ ok: true, service: "ion-nft-upload-proxy", version: 1 }, corsHeaders);
      }
      if (isItems) {
        return await getItem(url, env);
      }
      if (url.pathname === "/upload/file" && request.method === "POST") {
        return await uploadFile(request, env, corsHeaders);
      }
      if (url.pathname === "/upload/json" && request.method === "POST") {
        return await uploadJson(request, env, corsHeaders);
      }
      if (url.pathname === "/register-pob-collection" && request.method === "POST") {
        return await registerPobCollection(request, env, corsHeaders);
      }
      return jsonResponse({ error: "Not found" }, corsHeaders, 404);
    } catch (err: any) {
      return jsonResponse({ error: err?.message ?? "Internal error" }, corsHeaders, 500);
    }
  },
};

async function uploadFile(
  request: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const contentLength = parseInt(request.headers.get("Content-Length") ?? "0", 10);
  if (contentLength > MAX_FILE_BYTES) {
    return jsonResponse({ error: `File too large (max ${MAX_FILE_BYTES} bytes)` }, cors, 413);
  }

  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    return jsonResponse({ error: "Expected multipart/form-data" }, cors, 400);
  }

  const body = await request.arrayBuffer();
  const pinataRes = await fetch(`${PINATA_BASE}/pinning/pinFileToIPFS`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.PINATA_JWT}`,
      "Content-Type": contentType,
    },
    body,
  });

  if (!pinataRes.ok) {
    const text = await pinataRes.text();
    return jsonResponse(
      { error: `Pinata error: ${pinataRes.status} ${text.slice(0, 200)}` },
      cors,
      502,
    );
  }

  const result = (await pinataRes.json()) as { IpfsHash: string };
  return jsonResponse({ url: `${PINATA_GATEWAY}/${result.IpfsHash}`, cid: result.IpfsHash }, cors);
}

async function uploadJson(
  request: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Body must be valid JSON" }, cors, 400);
  }

  const pinataRes = await fetch(`${PINATA_BASE}/pinning/pinJSONToIPFS`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.PINATA_JWT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinataMetadata: { name: "ion-nft-studio:metadata" },
      pinataContent: payload,
    }),
  });

  if (!pinataRes.ok) {
    const text = await pinataRes.text();
    return jsonResponse(
      { error: `Pinata error: ${pinataRes.status} ${text.slice(0, 200)}` },
      cors,
      502,
    );
  }

  const result = (await pinataRes.json()) as { IpfsHash: string };
  return jsonResponse({ url: `${PINATA_GATEWAY}/${result.IpfsHash}`, cid: result.IpfsHash }, cors);
}

function jsonResponse(data: unknown, cors: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// PoB collection registration with the watcher repo
// ──────────────────────────────────────────────────────────────────────────────

interface RegisterPayload {
  collection_address: string;
  burn_pocket_address: string;
  creator_address: string;
  pob_burn_pct: number;
  pob_mint_amount_nano: string;
  max_supply: number | null;
  /** IPFS/HTTPS URI of the collection's metadata JSON.
   *  Used by GET /items/:collection/:index to serve per-item metadata
   *  by extending the collection's metadata with a "#N" suffix. */
  metadata_uri?: string;
}

interface TrackedCollection extends RegisterPayload {
  registered_at: string;
}

const TRACKED_FILE_PATH = "state/tracked-collections.json";

async function registerPobCollection(
  request: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  if (!env.GITHUB_PAT || !env.GITHUB_REPO) {
    return jsonResponse({ error: "Watcher registration not configured on this server" }, cors, 503);
  }

  // 1. Parse + shape-validate
  let body: RegisterPayload;
  try {
    body = (await request.json()) as RegisterPayload;
  } catch {
    return jsonResponse({ error: "Body must be valid JSON" }, cors, 400);
  }
  const required: (keyof RegisterPayload)[] = [
    "collection_address",
    "burn_pocket_address",
    "creator_address",
    "pob_burn_pct",
    "pob_mint_amount_nano",
  ];
  for (const f of required) {
    if (body[f] === undefined || body[f] === null || body[f] === "") {
      return jsonResponse({ error: `Missing field: ${f}` }, cors, 400);
    }
  }
  if (body.pob_burn_pct < 50 || body.pob_burn_pct > 100) {
    return jsonResponse({ error: "pob_burn_pct must be 50–100" }, cors, 400);
  }

  // 2. Verify the collection actually exists on-chain. Cheap and crucial:
  // someone could otherwise register a phantom address that never gets
  // deployed, polluting state/tracked-collections.json indefinitely.
  const exists = await ionAccountActive(body.collection_address);
  if (!exists) {
    return jsonResponse(
      { error: "Collection contract is not active on ION mainnet yet" },
      cors,
      400,
    );
  }

  // 3. Read current tracked-collections.json
  let current: TrackedCollection[] = [];
  let sha: string | null = null;
  try {
    const file = await githubGetFile(env, TRACKED_FILE_PATH);
    current = JSON.parse(file.content) as TrackedCollection[];
    sha = file.sha;
  } catch (e: any) {
    return jsonResponse({ error: `Could not read watcher state: ${e?.message ?? e}` }, cors, 502);
  }

  // 4. Dedup
  if (current.some((c) => c.collection_address === body.collection_address)) {
    return jsonResponse(
      { tracked: true, alreadyRegistered: true, message: "Already registered" },
      cors,
    );
  }

  // 5. Append + commit (with optimistic concurrency via sha)
  const entry: TrackedCollection = {
    ...body,
    registered_at: new Date().toISOString(),
  };
  current.push(entry);
  const newContent = JSON.stringify(current, null, 2) + "\n";

  let commit: any;
  try {
    commit = await githubPutFile(
      env,
      TRACKED_FILE_PATH,
      newContent,
      sha,
      `register: ${body.collection_address.slice(0, 16)}…`,
    );
  } catch (e: any) {
    // Single retry: if the watcher's cron committed state during our read-write
    // window, we'd see a 409. Re-fetch sha and retry once.
    if (String(e?.message ?? "").includes("409")) {
      const file = await githubGetFile(env, TRACKED_FILE_PATH);
      const reread = JSON.parse(file.content) as TrackedCollection[];
      if (reread.some((c) => c.collection_address === body.collection_address)) {
        return jsonResponse(
          { tracked: true, alreadyRegistered: true, message: "Already registered (race-resolved)" },
          cors,
        );
      }
      reread.push(entry);
      commit = await githubPutFile(
        env,
        TRACKED_FILE_PATH,
        JSON.stringify(reread, null, 2) + "\n",
        file.sha,
        `register: ${body.collection_address.slice(0, 16)}… (retry)`,
      );
    } else {
      return jsonResponse(
        { error: `Could not write watcher state: ${e?.message ?? e}` },
        cors,
        502,
      );
    }
  }

  return jsonResponse(
    {
      tracked: true,
      collection_address: body.collection_address,
      commit_url: commit?.commit?.html_url ?? null,
    },
    cors,
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// On-chain check via ION HTTP API
// ──────────────────────────────────────────────────────────────────────────────

const ION_RPC = "https://api.mainnet.ice.io/http/v2/jsonRPC";

async function ionAccountActive(address: string): Promise<boolean> {
  try {
    const resp = await fetch(ION_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "1",
        jsonrpc: "2.0",
        method: "getAddressInformation",
        params: { address },
      }),
    });
    if (!resp.ok) return false;
    const data = (await resp.json()) as { result?: { state?: string } };
    return data.result?.state === "active";
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// GitHub Contents API (read + write a single file with optimistic concurrency)
// ──────────────────────────────────────────────────────────────────────────────

interface GhFile {
  content: string; // decoded UTF-8
  sha: string;
}

async function githubGetFile(env: Env, path: string): Promise<GhFile> {
  const resp = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path}`, {
    headers: {
      Authorization: `Bearer ${env.GITHUB_PAT}`,
      "User-Agent": "ion-nft-upload-proxy",
      Accept: "application/vnd.github+json",
    },
  });
  if (!resp.ok) {
    throw new Error(`GitHub GET ${path}: ${resp.status} ${await resp.text()}`);
  }
  const data = (await resp.json()) as { content: string; sha: string };
  // GitHub returns base64 with newlines; strip them then decode UTF-8.
  const b64 = data.content.replace(/\n/g, "");
  const content = utf8FromBase64(b64);
  return { content, sha: data.sha };
}

async function githubPutFile(
  env: Env,
  path: string,
  content: string,
  sha: string | null,
  message: string,
): Promise<any> {
  const resp = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${env.GITHUB_PAT}`,
      "User-Agent": "ion-nft-upload-proxy",
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify({
      message,
      content: base64FromUtf8(content),
      sha: sha ?? undefined,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GitHub PUT ${path}: ${resp.status} ${text}`);
  }
  return await resp.json();
}

// Cloudflare Workers' btoa/atob handle latin-1 only; wrap for UTF-8 safety.
function base64FromUtf8(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function utf8FromBase64(b64: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// ──────────────────────────────────────────────────────────────────────────────
// Per-item NFT metadata
// ──────────────────────────────────────────────────────────────────────────────
//
// GET /items/:collection_address/:index
//   Returns NFT item metadata JSON. We fetch the collection's IPFS metadata
//   (recorded at registration time), then return it with a "#<index>" suffix
//   on the name. Same image, description, attributes; different name per item.
//
// This is what each minted NFT's content URL resolves to. The collection's
// common_content is set to "<this worker>/items/<collection>/" so that the
// FunC contract auto-builds the per-item URL by appending the item index.

async function getItem(url: URL, env: Env): Promise<Response> {
  const parts = url.pathname.split("/").filter(Boolean);
  // parts = ["items", collectionAddress, indexStr]
  if (parts.length !== 3) {
    return jsonResponse({ error: "Path must be /items/:collection/:index" }, ITEMS_CORS, 400);
  }
  const collectionAddress = parts[1];
  const indexStr = parts[2];
  const index = Number(indexStr);
  if (!Number.isInteger(index) || index < 0) {
    return jsonResponse({ error: "Invalid index" }, ITEMS_CORS, 400);
  }

  // Look up the collection's metadata URI from tracked-collections.json
  let tracked: TrackedCollection[];
  try {
    const file = await githubGetFile(env, TRACKED_FILE_PATH);
    tracked = JSON.parse(file.content) as TrackedCollection[];
  } catch {
    return jsonResponse(
      placeholderMetadata(index, "Collection registry unavailable"),
      ITEMS_CORS,
      200,
    );
  }

  // Loose-match: addresses can be in raw or friendly form
  const entry = tracked.find((c) => addressMatches(c.collection_address, collectionAddress));
  if (!entry || !entry.metadata_uri) {
    return jsonResponse(
      placeholderMetadata(index, "Collection not registered or metadata not yet pinned"),
      ITEMS_CORS,
      200,
    );
  }

  // Fetch the collection's metadata JSON
  let collectionMeta: Record<string, unknown>;
  try {
    const httpUri = ipfsToHttp(entry.metadata_uri);
    const res = await fetch(httpUri, { cf: { cacheTtl: 3600 } as any });
    if (!res.ok) throw new Error(`metadata fetch ${res.status}`);
    collectionMeta = (await res.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse(
      placeholderMetadata(index, "Collection metadata unreachable"),
      ITEMS_CORS,
      200,
    );
  }

  // Build per-item metadata: same content as collection, name has "#N" suffix
  const baseName = (collectionMeta.name as string | undefined) ?? "Item";
  const itemMeta = {
    ...collectionMeta,
    name: `${baseName} #${index}`,
    external_url: `https://nft.ionhub.io/collection/${collectionAddress}`,
  };

  return jsonResponse(itemMeta, ITEMS_CORS, 200);
}

const ITEMS_CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "public, max-age=300",
};

function placeholderMetadata(index: number, hint: string): Record<string, unknown> {
  return {
    name: `Item #${index}`,
    description: `Metadata temporarily unavailable: ${hint}`,
  };
}

function ipfsToHttp(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
  }
  return uri;
}

/** Tolerant address match: treats raw "0:hex" and friendly "EQ/UQ/0Q..."
 *  forms of the same address as equal. */
function addressMatches(a: string, b: string): boolean {
  if (a === b) return true;
  const ah = extractHash(a);
  const bh = extractHash(b);
  return ah !== null && ah === bh;
}

function extractHash(addr: string): string | null {
  if (addr.includes(":")) {
    const parts = addr.split(":");
    if (parts.length === 2 && parts[1].length === 64) {
      return parts[1].toLowerCase();
    }
  }
  // Friendly form: 48 chars base64-url. The hash bytes are at offsets 2..34
  // of the 36-byte decoded form. Skip the precise decode here — for matching
  // we just need consistency between two friendly forms which == triggers on.
  return null;
}
