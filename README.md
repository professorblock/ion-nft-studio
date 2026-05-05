# ION Hub | NFT Studio

Open-source NFT collection launcher for **Ice Open Network (ION)**. Deploy NFT collections directly from your wallet — no CLI, no private keys ever leave the browser. Each collection picks one of two flavors at deploy time: **standard paid mints** or **proof-of-burn drops** that permanently destroy ION with every mint.

Sister product to ION Hub's Jetton Minter at [launch.ionhub.io](https://launch.ionhub.io).

## Live

**[nft.ionhub.io](https://nft.ionhub.io)**

## Features

- **Wallet-signed deploys** via TonConnect — keys never touch the app.
- **Two collection types**, selectable at deploy:
  - **Paid mints** — standard NFT economics; creators receive ION on each mint.
  - **Proof-of-burn** — each mint permanently destroys ION. Creator-configurable burn ratio with a 50% minimum floor enforced.
- **Audited contracts** — TIP-4.2 NFT collection + item, forked from [getgems-io/nft-contracts](https://github.com/getgems-io/nft-contracts).
- **Mainnet only** — `tonconnect-manifest` and CNAME configured for `nft.ionhub.io`.

## Architecture

The app deploys collections in a single user-signed transaction batched via `tonConnection.sendTransaction()`:

1. Platform fee transfer (1000 ION → treasury).
2. Collection contract deploy (StateInit + ~0.25 ION gas).

For PoB collections, the on-chain owner is set to a platform mint key. A small backend watcher (separate, not in this repo) observes ION burns to per-collection burn pockets and signs mint authorizations. This keeps the smart-contract layer trustless and standard while the burn-verification layer remains upgradeable.

Compiled FunC bytecode is embedded in `src/lib/nft/` as base64-encoded BOCs. The contract sources and compile pipeline are maintained separately.

## Stack

- React 18, TypeScript, Material UI v5
- `ton@^12` for cell encoding and contract address derivation
- `@ion-gateway/ui-react` for wallet connection (TonConnect-compatible)
- `react-app-rewired` build pipeline

## Development

```bash
nvm use
npm install --legacy-peer-deps
npm start
```

Dev server runs at `http://localhost:3000`.

## Build & deploy

```bash
npm run deploy
```

Builds the app and publishes to the `gh-pages` branch in one command.

## Branches

- `master` — production (auto-deployed)
- `staging` — active development

## License

MIT — see [LICENSE](./LICENSE).

## Acknowledgements

- NFT contracts forked from [getgems-io/nft-contracts](https://github.com/getgems-io/nft-contracts)
- App shell forked from the ION Hub Jetton Minter, which itself is a fork of [ton-blockchain/minter](https://github.com/ton-blockchain/minter)
- Built for the [Ice Open Network](https://ice.io) ecosystem
