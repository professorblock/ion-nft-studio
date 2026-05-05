/**
 * NftCollection.source.ts
 * ───────────────────────
 * Compiled FunC bytecode for the NFT collection contract (TIP-4.2 standard,
 * editable v2). Source: getgems-io/nft-contracts (audited, battle-tested).
 *
 * The base64 BOC below is produced by the `ion-hub-nft` workspace
 * (scripts/compile.ts) which compiles:
 *   - sources/stdlib.fc
 *   - sources/op-codes.fc
 *   - sources/params.fc
 *   - sources/nft-collection-editable-v2.fc
 *
 * Re-run that compile script and paste the new base64 here whenever
 * the contract source changes. For v1 we never modify the contract,
 * so this base64 is stable.
 */

import { Cell } from "ton";

export const NFT_COLLECTION_CODE_BOC_BASE64 =
  "te6ccgECFgEAAygAART/APSkE/S88sgLAQIBYgIDAgLNBAUCASAODwL30QY4BIrfAA6GmBgLjYSK3wfSAYAOmP6Z/2omh9IGmfqZBjgOAAShh9IADvAOpqahgqgUEINJ6cqClIXUcUiy+DNgloQQhUZYBWuEAIZGWCqALnixJ9AQpltQnlj+WfgOeLZMAgfYBwKcrjgqnQ44LY+XDIlGAA8YEUYAFAYHAgEgCgsAcDc3NwPTP1MSu/LhklMSugH6ANQwKRA0WfAGjhikUERFFQPIUAbPFhTLPxLMzMwBzxbJ7VSSXwbiAvyOdTc3N3AE1FNQxwHAAJQw0gEwkTHijkUBgED0lm+lJMD/JcABsZMxUlDeII4pCKQggQD6vpPywY/egQGTIaBTJ7vy9AL6ANQwIlRNMPAGJbqTBKQE3gaSbCHisxLmWzNQREUVA8hQBs8WFMs/EszMzAHPFsntVOAowAPjAigICQBQMDY2BoEPoQPHBRLy9AH6QDBUIwVQM8hQBs8WFMs/EszMzAHPFsntVADuwASOIDEyNTU1AdTUMBAlRAMCyFAGzxYUyz8SzMzMAc8Wye1U4DAnwAWOI18GcIAYyMsFUATPFiP6AhPLassfyz+CCvrwgHD7AsmDBvsA4DY3BcAGjhoC+kAwRVAUE8hQBs8WFMs/EszMzAHPFsntVOBfBoQP8vACASAMDQA9Ra8ARwIfAFd4AYyMsFWM8WUAT6AhPLaxLMzMlx+wCAAtAHIyz/4KM8WyXAgyMsBE/QA9ADLAMmAAGz5AHTIywISygfL/8nQgAgEgEBEARbyC32omh9IGmfqZBjgOAAShh9IADvAOpqahgqgS+B6GoYLEAGG4tdMe1E0PpA0z9TIMcBwACUMPpAAd4B1NTUMFUCEDVfBdDUMdQw0HHIywcBzxbMyYAgEgEhMCAWYUFQBNtPR9qJofSBpn6mQY4DgAEoYfSAA7wDqamoYKoEIEq+C+AI4APgCwADyqFe1E0PpA0z9TIMcBwACUMPpAAd4B1NTUMFUCbFEATqrX7UTQ+kDTP1MgxwHAAJQw+kAB3gHU1NQwVQIVXwXQ0w/TD/pAMA==";

export const NFT_COLLECTION_CODE_CELL = Cell.fromBoc(
  Buffer.from(NFT_COLLECTION_CODE_BOC_BASE64, "base64"),
)[0];
