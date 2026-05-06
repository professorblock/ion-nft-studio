/**
 * pinata.ts
 * ─────────
 * Client-side helpers for IPFS uploads. Two modes, picked at build time:
 *
 *   1. PROXY MODE (preferred for production)
 *        Set REACT_APP_UPLOAD_PROXY_URL in .env.local. The worker at that
 *        URL holds the JWT server-side; nothing sensitive ships in the bundle.
 *        Worker source: workers/upload-proxy/
 *
 *   2. DIRECT MODE (legacy / solo dev)
 *        Set REACT_APP_PINATA_JWT in .env.local. JWT is bundled into the
 *        client JS — fine for solo testing, not safe for public production.
 *
 * If neither is set, the form gracefully degrades to URL-paste only.
 */

const PINATA_BASE = "https://api.pinata.cloud";
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";

const PROXY_URL = (process.env.REACT_APP_UPLOAD_PROXY_URL ?? "").replace(/\/+$/, "");
const PINATA_JWT = process.env.REACT_APP_PINATA_JWT ?? "";

const HAS_PROXY = Boolean(PROXY_URL);
const HAS_JWT = Boolean(PINATA_JWT);

export class UploadNotConfiguredError extends Error {
  constructor() {
    super(
      "Image uploads not configured. Set REACT_APP_UPLOAD_PROXY_URL " +
        "(preferred) or REACT_APP_PINATA_JWT in .env.local. " +
        "See workers/upload-proxy/README.md for the proxy setup.",
    );
    this.name = "UploadNotConfiguredError";
  }
}

export function isPinataConfigured(): boolean {
  return HAS_PROXY || HAS_JWT;
}

/**
 * Convert an IPFS URI to a public HTTPS gateway URL for previews.
 * Accepts both `ipfs://CID` and bare CID strings.
 */
export function ipfsToHttp(uri: string): string {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) return `${PINATA_GATEWAY}/${uri.slice(7)}`;
  if (uri.startsWith("http://") || uri.startsWith("https://")) return uri;
  return `${PINATA_GATEWAY}/${uri}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// File upload
// ──────────────────────────────────────────────────────────────────────────────

export async function uploadFileToIPFS(file: File | Blob, filename = "upload"): Promise<string> {
  if (HAS_PROXY) return uploadFileViaProxy(file, filename);
  if (HAS_JWT) return uploadFileViaJwt(file, filename);
  throw new UploadNotConfiguredError();
}

async function uploadFileViaProxy(file: File | Blob, filename: string): Promise<string> {
  const form = new FormData();
  form.append("file", file, filename);

  const res = await fetch(`${PROXY_URL}/upload/file`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload proxy error (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { url: string };
  return json.url;
}

async function uploadFileViaJwt(file: File | Blob, filename: string): Promise<string> {
  const form = new FormData();
  form.append("file", file, filename);
  form.append("pinataMetadata", JSON.stringify({ name: `ion-nft-studio:${filename}` }));

  const res = await fetch(`${PINATA_BASE}/pinning/pinFileToIPFS`, {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata file upload failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { IpfsHash: string };
  return `${PINATA_GATEWAY}/${json.IpfsHash}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// JSON upload
// ──────────────────────────────────────────────────────────────────────────────

export async function uploadJsonToIPFS(obj: unknown, name = "metadata.json"): Promise<string> {
  if (HAS_PROXY) return uploadJsonViaProxy(obj);
  if (HAS_JWT) return uploadJsonViaJwt(obj, name);
  throw new UploadNotConfiguredError();
}

async function uploadJsonViaProxy(obj: unknown): Promise<string> {
  const res = await fetch(`${PROXY_URL}/upload/json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload proxy error (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { url: string };
  return json.url;
}

async function uploadJsonViaJwt(obj: unknown, name: string): Promise<string> {
  const res = await fetch(`${PINATA_BASE}/pinning/pinJSONToIPFS`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify({
      pinataMetadata: { name: `ion-nft-studio:${name}` },
      pinataContent: obj,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata JSON upload failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { IpfsHash: string };
  return `${PINATA_GATEWAY}/${json.IpfsHash}`;
}
