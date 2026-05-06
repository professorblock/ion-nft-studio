/**
 * pinata.ts
 * ─────────
 * Client-side IPFS uploads via Pinata's REST API.
 *
 * Setup:
 *   1. Sign up at pinata.cloud (free tier, 1 GB)
 *   2. Generate a scoped API key with `pinFileToIPFS` + `pinJSONToIPFS`
 *      permissions (settings → API Keys → New Key → tick those two scopes)
 *   3. Copy the JWT (long string starting with "eyJ…")
 *   4. Add to your `.env.local` file in project root:
 *        REACT_APP_PINATA_JWT=eyJ...
 *      (.env.local is gitignored by CRA so the JWT never reaches GitHub)
 *
 * SECURITY NOTE:
 *   The JWT is bundled into the client-side JS at build time. Anyone
 *   inspecting network requests on the live site can extract it. For a
 *   solo/small project this is acceptable (worst case: someone uploads
 *   garbage to your Pinata bucket — rotate the key if abused). For
 *   production hardening, replace this with a server-side proxy
 *   (Cloudflare Worker etc.) that holds the JWT.
 */

const PINATA_BASE = "https://api.pinata.cloud";
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs"; // public gateway for reads

export class PinataNotConfiguredError extends Error {
  constructor() {
    super(
      "Pinata JWT not configured. Add REACT_APP_PINATA_JWT to .env.local — " +
        "see src/lib/nft/pinata.ts for setup instructions.",
    );
    this.name = "PinataNotConfiguredError";
  }
}

function getJwt(): string {
  const jwt = process.env.REACT_APP_PINATA_JWT;
  if (!jwt) throw new PinataNotConfiguredError();
  return jwt;
}

export function isPinataConfigured(): boolean {
  return Boolean(process.env.REACT_APP_PINATA_JWT);
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

/**
 * Upload an arbitrary File or Blob to IPFS via Pinata.
 * Returns the ipfs:// URI on success.
 */
export async function uploadFileToIPFS(file: File | Blob, filename = "upload"): Promise<string> {
  const jwt = getJwt();

  const form = new FormData();
  form.append("file", file, filename);
  form.append("pinataMetadata", JSON.stringify({ name: `ion-nft-studio:${filename}` }));

  const res = await fetch(`${PINATA_BASE}/pinning/pinFileToIPFS`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata file upload failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as { IpfsHash: string };
  // Return the public HTTPS gateway URL rather than `ipfs://CID` — ION's
  // explorer and most TON-family marketplaces don't resolve the ipfs://
  // scheme on their own. The content is still pinned to IPFS; we just give
  // consumers a URL they can actually fetch.
  return `${PINATA_GATEWAY}/${json.IpfsHash}`;
}

/**
 * Upload a JSON object to IPFS via Pinata.
 * Returns the ipfs:// URI on success.
 */
export async function uploadJsonToIPFS(obj: unknown, name = "metadata.json"): Promise<string> {
  const jwt = getJwt();

  const res = await fetch(`${PINATA_BASE}/pinning/pinJSONToIPFS`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
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
