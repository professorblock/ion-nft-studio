/**
 * NftItem.source.ts
 * ─────────────────
 * Compiled FunC bytecode for individual NFT items (TIP-4.2 v2).
 * Source: getgems-io/nft-contracts (sources/nft-item-v2.fc).
 * Compiled by ion-hub-nft/scripts/compile.ts.
 */

import { Cell } from "ton";

export const NFT_ITEM_CODE_BOC_BASE64 =
  "te6ccgECDgEAAikAART/APSkE/S88sgLAQIBYgIDAgLOBAUACaEfn+AFAgEgBgcCASAMDQO5DIhxwCSXwPg0NMDAXGwkl8D4PpA+kAx+gAxcdch+gAx+gAwc6m0APACBLPjAgbTH9M/ghBfzD0UUjC6jokyEDdeMkAT2zzgMDQ0NTWCEC/LJqISuuMCXwSED/LwgCAkKABE+kQwcLry4U2AAyjBsIjRSMscF8uGVAfpA1FQjQFI18AMhxwHAAI5EAfoAIY46ghAFE42RcMhQBs8WWM8WEDRBMHNwgBDIywVQB88WUAX6AhXLahLLH8s/Im6zlFjPFwGRMuIByQH7AJJfBOKSXwPiAfZRNccF8uGR+kAh8AH6QNIAMfoAggr68IAboSGUUxWgod4i1wsBwwAgkgahkTbiIML/8uGSIY4+ghAFE42RyFAJzxZQC88WcSRJFFRGoHCAEMjLBVAHzxZQBfoCFctqEssfyz8ibrOUWM8XAZEy4gHJAfsAEEeUECo3W+ILAHJwghCLdxc1BcjL/1AEzxYQJIBAcIAQyMsFUAfPFlAF+gIVy2oSyx/LPyJus5RYzxcBkTLiAckB+wAAggKONSbwAYIQ1TJ22xA3RABtcXCAEMjLBVAHzxZQBfoCFctqEssfyz8ibrOUWM8XAZEy4gHJAfsAkzAyNOJVAvADADs7UTQ0z/6QCDXScIAmn8B+kDUMBAkECPgMHBZbW2AAHQDyMs/WM8WAc8WzMntVIA==";

export const NFT_ITEM_CODE_CELL = Cell.fromBoc(
  Buffer.from(NFT_ITEM_CODE_BOC_BASE64, "base64"),
)[0];
