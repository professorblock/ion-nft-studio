/**
 * collection-reader.ts
 * ────────────────────
 * Pure-logic module: given a collection address string, fetches
 *   1. The on-chain collection data (next index, content URI, owner)
 *      via TonClient.callGetMethod("get_collection_data")
 *   2. The off-chain metadata JSON from the URI returned in (1)
 *
 * Returns a structured CollectionData object or throws CollectionLoadError
 * with a categorized reason so the UI can render the right error state.
 *
 * This bypasses the ION explorer's slow NFT-metadata indexer entirely —
 * we render directly from the contract.
 */

import BN from "bn.js";
import { Address, Cell } from "ton";
import { getClient } from "../get-ton-client";
import { makeGetCall, cellToAddress, GetResponseValue } from "../make-get-call";
import { formatContract, formatWallet } from "./address-format";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface IonHubMetadata {
  version: number;
  collection_type: "paid" | "pob";
  max_supply: number | null;
  royalty_pct: number;
  mint_price_ion?: number;
  pob_mint_amount_ion?: number;
  pob_burn_pct?: number;
}

export interface CollectionMetadata {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  symbol?: string;
  ion_hub?: IonHubMetadata;
}

export interface CollectionData {
  /** Address of the collection contract (EQ… form). */
  address: string;
  /** Address of the collection owner / mint authority (UQ… form). */
  ownerAddress: string;
  /** Number of items minted so far (= next index to be assigned). */
  nextItemIndex: number;
  /** The off-chain URL stored in the contract's content cell. */
  metadataUri: string;
  /** Parsed metadata JSON. May be partially empty if upstream fields missing. */
  metadata: CollectionMetadata;
}

export type CollectionLoadErrorKind =
  | "invalid-address"
  | "not-found"
  | "not-a-collection"
  | "metadata-fetch-failed";

export class CollectionLoadError extends Error {
  constructor(public kind: CollectionLoadErrorKind, message: string) {
    super(message);
    this.name = "CollectionLoadError";
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Cell parsing
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Parse the off-chain content URL out of the collection's content cell.
 * Format (TIP-64): `0x01` byte prefix + URL bytes (snake-encoded if long).
 *
 * For our deploys, URLs are short enough to fit in the prefix cell with
 * no snake refs, so we just read the remaining bytes as ASCII.
 */
function parseContentUrl(contentCell: Cell): string {
  const slice = contentCell.beginParse();
  const prefix = slice.readUint(8).toNumber();
  if (prefix !== 0x01) {
    throw new Error(
      `Unexpected content prefix 0x${prefix.toString(16)} (expected 0x01 for off-chain content)`,
    );
  }
  const remaining = slice.readRemainingBytes().toString("ascii").trim();
  return remaining;
}

// ──────────────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────────────

export async function loadCollection(addressString: string): Promise<CollectionData> {
  // 1. Parse address
  let address: Address;
  try {
    address = Address.parse(addressString);
  } catch {
    throw new CollectionLoadError(
      "invalid-address",
      `"${addressString}" is not a valid ION address.`,
    );
  }

  // 2. Call get_collection_data via Hub's makeGetCall helper
  const client = await getClient();

  let stack: GetResponseValue[];
  try {
    stack = await makeGetCall(address, "get_collection_data", [], (s) => s, client);
  } catch (err: any) {
    const msg = (err?.message ?? String(err)).toLowerCase();
    if (msg.includes("inactive") || msg.includes("not_active") || msg.includes("404")) {
      throw new CollectionLoadError("not-found", "No contract is deployed at this address.");
    }
    throw new CollectionLoadError(
      "not-a-collection",
      "This address has a contract, but it isn't responding to NFT-collection methods.",
    );
  }

  // 3. Decode stack: [BN nextItemIndex, Cell content, Cell owner]
  let nextItemIndex: number;
  let contentCell: Cell;
  let ownerAddress: Address;
  try {
    if (stack.length < 3) throw new Error(`expected 3 stack values, got ${stack.length}`);
    const indexBN = stack[0] as BN;
    nextItemIndex = indexBN.toNumber();
    contentCell = stack[1] as Cell;
    ownerAddress = cellToAddress(stack[2]);
  } catch (e: any) {
    throw new CollectionLoadError(
      "not-a-collection",
      `Contract response wasn't shaped like an NFT collection: ${e?.message ?? e}`,
    );
  }

  // 4. Extract URL from content cell
  let metadataUri: string;
  try {
    metadataUri = parseContentUrl(contentCell);
  } catch (e: any) {
    throw new CollectionLoadError(
      "not-a-collection",
      `Could not parse collection content cell: ${e?.message ?? e}`,
    );
  }

  // Older collections (deployed before fix4) stored `ipfs://CID` directly.
  // Browsers can't fetch the ipfs:// scheme, so resolve to the public gateway.
  const fetchableUri = metadataUri.startsWith("ipfs://")
    ? `https://gateway.pinata.cloud/ipfs/${metadataUri.slice(7)}`
    : metadataUri;

  // 5. Fetch metadata JSON from the URL
  let metadata: CollectionMetadata = {};
  try {
    const res = await fetch(fetchableUri);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    metadata = await res.json();
  } catch (e: any) {
    throw new CollectionLoadError(
      "metadata-fetch-failed",
      `Couldn't load metadata from ${fetchableUri}: ${e?.message ?? e}`,
    );
  }

  // Same conversion for the image URL inside the metadata, in case the
  // creator stored `ipfs://...` there too.
  if (metadata.image && metadata.image.startsWith("ipfs://")) {
    metadata.image = `https://gateway.pinata.cloud/ipfs/${metadata.image.slice(7)}`;
  }

  return {
    address: formatContract(address),
    ownerAddress: formatWallet(ownerAddress),
    nextItemIndex,
    metadataUri,
    metadata,
  };
}
