# ION Minter

Jetton deployer and manager built on the ION/TON blockchain.

## Requirements

- Node 18 (use `nvm use` to switch automatically)

## Setup

```bash
nvm use
npm install
npm start
```

## Branches

- `master` — production only, protected
- `staging` — active development
- `feature/xyz` — one feature at a time, merged into staging

## Environment

- `.env` — mainnet config
- `.env.staging` — testnet config

## Deploy

```bash
npm run build
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
