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
  PINATA_JWT: string;
  ALLOWED_ORIGINS: string;
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
    const url = new URL(request.url);
    const isHealth = url.pathname === "/health" || url.pathname === "/";
    if (!corsOrigin && !isHealth) {
      return jsonResponse({ error: "Origin not allowed" }, corsHeaders, 403);
    }

    try {
      if (isHealth) {
        return jsonResponse({ ok: true, service: "ion-nft-upload-proxy", version: 1 }, corsHeaders);
      }
      if (url.pathname === "/upload/file" && request.method === "POST") {
        return await uploadFile(request, env, corsHeaders);
      }
      if (url.pathname === "/upload/json" && request.method === "POST") {
        return await uploadJson(request, env, corsHeaders);
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
