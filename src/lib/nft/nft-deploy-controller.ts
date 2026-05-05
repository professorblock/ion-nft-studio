/**
 * nft-deploy-controller.ts
 * ────────────────────────
 * Browser-side controller for deploying NFT collections to ION mainnet.
 * Mirrors lib/contract-deployer.ts pattern from the Hub Jetton minter:
 * the user's wallet signs the deploy tx via TonConnectUI; we never hold keys.
 *
 * Two collection types supported (chosen at deploy time):
 *   - "paid"  : standard mint flow — creators receive ION when users mint
 *   - "pob"   : proof-of-burn — every mint burns ≥50% of the mint amount,
 *               creator + platform split the rest
 *
 * For v1 (Path A), PoB minting is gated by a backend watcher that observes
 * burns to a per-collection burn pocket and signs mint authorizations.
 * The collection contract itself is identical for both types — only the
 * "owner" (mint authority) differs:
 *   - paid: creator's wallet
 *   - pob:  platform mint key (so the watcher can authorize mints)
 */

import BN from "bn.js";
import { Address, Cell, contractAddress, StateInit, toNano } from "ton";
import { TonConnectUI, SendTransactionRequest } from "@ion-gateway/ui-react";

import { NFT_COLLECTION_CODE_CELL } from "./NftCollection.source";
import {
  buildCollectionDataCell,
  NftCollectionInitialData,
  RoyaltyParams,
} from "./NftCollection.data";

// ──────────────────────────────────────────────────────────────────────────────
// Configuration constants — mirror locked decisions from planning conversation
// ──────────────────────────────────────────────────────────────────────────────

/** Gas to forward to the new collection contract on deploy. ~0.25 ION on ION. */
export const NFT_COLLECTION_DEPLOY_GAS = toNano(0.25);

/** Flat platform fee per collection deploy. 1000 ION at current ION price. */
export const COLLECTION_DEPLOY_FEE = toNano(1000);

/** Floor on burn ratio for PoB collections (basis points; 5000 = 50%). */
export const POB_MIN_BURN_BPS = 5000;

/** Minimum burn amount per PoB mint (anti-dust). */
export const POB_MIN_BURN_PER_MINT = toNano(1000);

/** Platform's slice on paid mints (basis points; 500 = 5%). */
export const PAID_MINT_PLATFORM_FEE_BPS = 500;

/**
 * Treasury that receives platform fees. **Override per environment.**
 * During development you can point this at your own wallet so test deploy
 * fees bounce back; in production, set to the actual platform treasury.
 */
export const PLATFORM_TREASURY_ADDRESS = Address.parse(
  // PLACEHOLDER — replace with actual treasury before mainnet launch.
  // For dev, set in .env.local and read via process.env.
  "EQDrjaLahLkMB-hMCmkzOyiv9yEa2wzPpkbn5_Mdsy5Sxb6m",
);

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export type CollectionType = "paid" | "pob";

export interface NftCollectionDeployParams {
  /** Wallet address of the user signing the deploy. Becomes contract owner for "paid". */
  creatorAddress: Address;

  /** Collection type. Determines who the on-chain mint authority is. */
  type: CollectionType;

  /** Off-chain URLs (uploaded to IPFS in Day 2 second-half; can be any URL for v1). */
  collectionContentUri: string;
  commonContentUri: string;

  /** Royalty config (paid out on secondary marketplace sales). */
  royaltyFactor: number; // numerator
  royaltyBase: number;   // denominator (typically 1000)

  /**
   * For PoB collections:
   *   - burnBps: how much of each mint payment is burned (≥ POB_MIN_BURN_BPS)
   *   - mintAmount: total ION user pays per mint (must be ≥ POB_MIN_BURN_PER_MINT)
   * Ignored for "paid" collections.
   */
  pobBurnBps?: number;
  pobMintAmount?: BN;

  /**
   * For paid collections: mint price per item.
   * Ignored for "pob" collections.
   */
  paidMintPrice?: BN;

  /**
   * The platform mint key address. Used as collection owner for PoB collections
   * so the watcher backend can authorize mints. Must be a wallet whose key
   * the platform controls.
   */
  platformMintKeyAddress: Address;
}

// ──────────────────────────────────────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────────────────────────────────────

function validateParams(params: NftCollectionDeployParams): void {
  if (params.type === "pob") {
    if (params.pobBurnBps === undefined || params.pobBurnBps < POB_MIN_BURN_BPS) {
      throw new Error(
        `PoB burn ratio must be at least ${POB_MIN_BURN_BPS / 100}%`,
      );
    }
    if (params.pobBurnBps > 10000) {
      throw new Error("PoB burn ratio cannot exceed 100%");
    }
    if (!params.pobMintAmount || params.pobMintAmount.lt(POB_MIN_BURN_PER_MINT)) {
      throw new Error(
        `PoB mint amount must be at least ${POB_MIN_BURN_PER_MINT.toString()} (1000 ION)`,
      );
    }
  } else {
    if (!params.paidMintPrice || params.paidMintPrice.lten(0)) {
      throw new Error("Paid mint price must be greater than 0");
    }
  }
  if (params.royaltyFactor < 0 || params.royaltyBase <= 0) {
    throw new Error("Invalid royalty parameters");
  }
  if (params.royaltyFactor > params.royaltyBase) {
    throw new Error("Royalty cannot exceed 100%");
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Address derivation (deterministic — works without sending any tx)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Compute the collection's mainnet address before deploy.
 * Useful for showing the user "this is where your collection will live"
 * and for storing collection metadata server-side keyed by address.
 */
export function predictCollectionAddress(params: NftCollectionDeployParams): Address {
  const initialData = buildInitialData(params);
  const dataCell = buildCollectionDataCell(initialData);

  return contractAddress({
    workchain: 0,
    initialData: dataCell,
    initialCode: NFT_COLLECTION_CODE_CELL,
  });
}

function buildInitialData(params: NftCollectionDeployParams): NftCollectionInitialData {
  // Owner determines mint authority on-chain:
  //   - paid → creator (creators authorize their own mints via marketplace contracts)
  //   - pob  → platform mint key (watcher backend authorizes mints after burn)
  const ownerAddress =
    params.type === "pob" ? params.platformMintKeyAddress : params.creatorAddress;

  const royalty: RoyaltyParams = {
    factor: params.royaltyFactor,
    base: params.royaltyBase,
    // Royalty recipient is always the creator, regardless of collection type.
    address: params.creatorAddress,
  };

  return {
    ownerAddress,
    collectionContentUri: params.collectionContentUri,
    commonContentUri: params.commonContentUri,
    royaltyParams: royalty,
    secondOwnerAddress: ownerAddress,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Deploy — single call site, browser-only, signed by user's wallet
// ──────────────────────────────────────────────────────────────────────────────

export interface DeployResult {
  collectionAddress: Address;
  /** Whether the deploy tx was actually sent (false if collection already exists). */
  txSent: boolean;
}

/**
 * Deploy a new NFT collection. The user's wallet is prompted to sign two
 * messages bundled in one transaction:
 *   1. The platform fee (1000 ION) sent to PLATFORM_TREASURY_ADDRESS
 *   2. The collection deploy itself (state init + ~0.25 ION gas)
 *
 * Both messages are batched in a single SendTransactionRequest so the user
 * sees one wallet popup, not two.
 */
export async function deployNftCollection(
  params: NftCollectionDeployParams,
  tonConnection: TonConnectUI,
): Promise<DeployResult> {
  validateParams(params);

  const initialData = buildInitialData(params);
  const dataCell = buildCollectionDataCell(initialData);

  const collectionAddr = contractAddress({
    workchain: 0,
    initialData: dataCell,
    initialCode: NFT_COLLECTION_CODE_CELL,
  });

  // Build StateInit cell for the deploy message
  const stateInitCell = new Cell();
  new StateInit({ data: dataCell, code: NFT_COLLECTION_CODE_CELL }).writeTo(
    stateInitCell,
  );

  const tx: SendTransactionRequest = {
    validUntil: Date.now() + 5 * 60 * 1000, // 5-minute signing window
    messages: [
      // 1. Platform fee
      {
        address: PLATFORM_TREASURY_ADDRESS.toString(),
        amount: COLLECTION_DEPLOY_FEE.toString(),
      },
      // 2. Collection deploy
      {
        address: collectionAddr.toString(),
        amount: NFT_COLLECTION_DEPLOY_GAS.toString(),
        stateInit: stateInitCell.toBoc().toString("base64"),
      },
    ],
  };

  await tonConnection.sendTransaction(tx);

  return { collectionAddress: collectionAddr, txSent: true };
}
