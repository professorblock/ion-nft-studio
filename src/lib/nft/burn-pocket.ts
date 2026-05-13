/**
 * burn-pocket.ts (frontend)
 * ─────────────────────────
 * Derives the per-collection burn pocket address — a deterministic
 * non-deployable ION address. Same algorithm as the watcher's
 * src/burn-pocket.ts (`ion-nft-watcher` repo), just using a browser-
 * compatible SHA256 (jssha) instead of Node's crypto module so it
 * compiles under CRA's webpack 5.
 *
 * IMPORTANT: any change to this function must be mirrored in the
 * watcher's burn-pocket.ts. They MUST agree byte-for-byte or the
 * watcher will fail to find burns at the addresses the frontend tells
 * users to send to.
 */

import jsSHA from "jssha";
import { Address } from "ton";

const BURN_DOMAIN = "ion-nft-burn:v1:";

export function deriveBurnPocket(collectionAddress: Address | string): Address {
  const addr =
    typeof collectionAddress === "string" ? Address.parse(collectionAddress) : collectionAddress;

  // Same byte composition as the watcher: domain string + workchain byte + address hash.
  const domainBytes = new TextEncoder().encode(BURN_DOMAIN);
  const wcByte = new Uint8Array([addr.workChain & 0xff]);
  const addrHash = new Uint8Array(addr.hash);

  const concat = new Uint8Array(domainBytes.length + wcByte.length + addrHash.length);
  concat.set(domainBytes, 0);
  concat.set(wcByte, domainBytes.length);
  concat.set(addrHash, domainBytes.length + wcByte.length);

  const sha = new jsSHA("SHA-256", "UINT8ARRAY");
  sha.update(concat);
  const burnHash = sha.getHash("UINT8ARRAY");

  return new Address(0, Buffer.from(burnHash));
}
