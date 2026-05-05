/**
 * NftCollection.data.ts
 * ─────────────────────
 * Builds the initial-state Cell for a fresh NFT collection contract.
 *
 * Storage layout (from nft-collection-editable-v2.fc):
 *   - owner_address      : MsgAddress
 *   - next_item_index    : uint64   (always 0 for fresh collections)
 *   - content            : ref Cell (collection meta + per-item URI prefix)
 *   - nft_item_code      : ref Cell (compiled NftItem code BOC)
 *   - royalty_params     : ref Cell (factor / base / recipient)
 *   - second_owner       : MsgAddress (defaults to owner)
 *
 * Uses the `ton@^12` API (BN-based, matches the Hub Jetton minter).
 */

import { Address, beginCell, Cell } from "ton";
import { NFT_ITEM_CODE_CELL } from "./NftItem.source";

export interface RoyaltyParams {
  /** Numerator (e.g. 50 with base 1000 = 5%) */
  factor: number;
  /** Denominator */
  base: number;
  /** Address that receives royalty payments on secondary sales */
  address: Address;
}

export interface NftCollectionInitialData {
  /** Initial owner / mint authority. For PoB collections, this is the platform mint key. */
  ownerAddress: Address;
  /** Off-chain URL for collection-level metadata (TIP-64 off-chain content). */
  collectionContentUri: string;
  /** Per-item URL prefix (item index appended at runtime). */
  commonContentUri: string;
  royaltyParams: RoyaltyParams;
  /** Optional second admin. Defaults to ownerAddress. */
  secondOwnerAddress?: Address;
}

/**
 * Build the off-chain content cell (TIP-64).
 * Format: 0x01 prefix + snake-encoded URL string for the collection-level metadata,
 *         + ref cell containing the per-item URI prefix.
 */
function buildContentCell(collectionUri: string, commonUri: string): Cell {
  const collectionMetaCell = beginCell()
    .storeUint(0x01, 8) // off-chain content marker
    .storeBuffer(Buffer.from(collectionUri, "utf-8"))
    .endCell();

  const commonMetaCell = beginCell()
    .storeBuffer(Buffer.from(commonUri, "utf-8"))
    .endCell();

  return beginCell()
    .storeRef(collectionMetaCell)
    .storeRef(commonMetaCell)
    .endCell();
}

function buildRoyaltyCell(r: RoyaltyParams): Cell {
  return beginCell()
    .storeUint(r.factor, 16)
    .storeUint(r.base, 16)
    .storeAddress(r.address)
    .endCell();
}

/**
 * Build the data cell for a fresh deploy.
 * Combined with the collection code cell, this determines the contract's address.
 */
export function buildCollectionDataCell(d: NftCollectionInitialData): Cell {
  const contentCell = buildContentCell(d.collectionContentUri, d.commonContentUri);
  const royaltyCell = buildRoyaltyCell(d.royaltyParams);
  const secondOwner = d.secondOwnerAddress ?? d.ownerAddress;

  return beginCell()
    .storeAddress(d.ownerAddress)
    .storeUint(0, 64) // next_item_index
    .storeRef(contentCell)
    .storeRef(NFT_ITEM_CODE_CELL)
    .storeRef(royaltyCell)
    .storeAddress(secondOwner)
    .endCell();
}
