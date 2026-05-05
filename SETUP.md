# ION Hub | NFT Studio — Day 2 Scaffold

This zip is your new project: **ion-nft-studio**, a React/TS/MUI sister site to the Hub Jetton minter. It deploys to `nft.ionhub.io` via GitHub Pages, exactly the same way `launch.ionhub.io` works.

## What's already done

The wallet hookup, header, footer, theme, MUI setup, MaterialDesign components, RPC client (`https://api.mainnet.ice.io/http/v2/jsonRPC`), and TonConnect manifest are all wired up identically to the Hub. The Jetton-specific code has been stripped out. In its place:

- **NFT smart-contract layer** (`src/lib/nft/`) — compiled FunC bytecode for the audited getgems collection + item contracts, embedded as base64 BOCs.
- **Browser-side deploy controller** (`src/lib/nft/nft-deploy-controller.ts`) — mirrors the Hub's pattern. Builds a `StateInit` cell, sends a single batched transaction (platform fee + collection deploy) for the user to sign in their wallet.
- **Three new pages** (`/`, `/launch`, `/collection/:address`) — Home is a simple landing, Launch has working "Test Deploy: Paid" / "Test Deploy: PoB" buttons that prove the wallet → contract pipeline works, Collection viewer is a stub for the next iteration.
- **`nft.ionhub.io` configured** — `package.json` homepage, `public/CNAME`, and `public/tonconnect-manifest.json` all point at the new subdomain.
- **Verified**: `tsc --noEmit` passes with zero errors and `react-scripts build` produces a working 412 KB gzipped bundle.

## What's coming next (Day 2 second-half)

The polished Configure-Collection form (matching the Hub's deploy form quality), Pinata IPFS uploads, and the collection viewer with an item gallery + mint button. We'll iterate on these like we did for the Hub deploy form.

After that, Day 3: the PoB watcher backend.

---

## Setup — exactly what to do, in order

This mirrors the workflow you already used for `launch.ionhub.io`. About 15 minutes total.

### Step 1 — Unzip and open in VS Code

Move the zip to your `Downloads` folder, double-click to extract. You'll get a folder called `ion-nft-studio` next to the zip.

In VS Code: **File → Open Folder…** → navigate to `Downloads`, single-click `ion-nft-studio`, click **Open**. Click "Yes, I trust the authors" when prompted.

In VS Code's top menu: **Terminal → New Terminal**. The terminal opens at the bottom of the window with a prompt ending in `ion-nft-studio %`.

### Step 2 — Create the GitHub repo

In your browser, go to **https://github.com/new** while signed into the `professorblock` account. Fill in:

- **Repository name**: `ion-nft-studio`
- **Description** (optional): `ION Hub | NFT Studio — proof-of-burn NFT minter for ION`
- **Public** (so GitHub Pages works on the free tier)
- **Do NOT** check "Add a README" or "Add .gitignore" or "Add license" — the zip already contains those.

Click **Create repository**. Don't follow GitHub's "quick setup" instructions on the next page — we'll wire it up from the terminal.

### Step 3 — Initialize git and push to the new repo

In the VS Code terminal, paste these commands one block at a time. After each block, paste the output back to me if anything looks unexpected.

**Block 3A — initialize and stage files:**

```
git init
git checkout -b master
git add .
git commit -m "initial: ion-nft-studio scaffold (forked from ion-minter)"
```

You should see something like `[master (root-commit) abc1234] initial: ion-nft-studio scaffold` followed by the file count.

**Block 3B — connect to GitHub and push:**

```
git remote add origin https://github.com/professorblock/ion-nft-studio.git
git push -u origin master
git checkout -b staging
git push -u origin staging
```

The first `git push` may prompt for your GitHub credentials. Use a personal access token (same one you used for `ion-minter`) if password auth is rejected.

When this finishes, refresh the GitHub repo page — you should see all the files listed.

### Step 4 — Install dependencies

In the VS Code terminal:

```
npm install --legacy-peer-deps
```

This takes 30–60 seconds. The `--legacy-peer-deps` flag is needed because `react-app-rewire-typescript` has stale peer requirements — same flag the Hub uses. Ignore any "deprecated" warnings, they're upstream issues unrelated to us.

When it finishes, you'll see something like `added 1695 packages in 43s`.

### Step 5 — Run it locally and confirm it works

```
npm start
```

After ~30 seconds, your browser should auto-open at `http://localhost:3000`. You should see:

- **Header** at top with "ION Hub" wordmark, "NFT Studio" subtitle, and Connect Wallet button on the right
- **Hero** in the middle: "● LIVE ON ION MAINNET" pill, large "Mint NFTs on **ION.**" heading (ION in blue→purple gradient), description text, two buttons ("Launch a Collection" + "Mint a Token (ION Hub)")
- **Footer** at bottom

**Confirm it works**: click "Launch a Collection" — URL changes to `/launch` and you see the Launch page with "Connect Wallet" inside it. **Don't actually deploy anything yet** — we haven't set the platform treasury address to your wallet, and a real deploy on mainnet would cost real ION.

Stop the dev server with **Ctrl + C** in the terminal once you've confirmed the UI loads.

### Step 6 — Set the platform treasury to your own wallet (for safe testing)

Open `src/lib/nft/nft-deploy-controller.ts` in VS Code. Around line 50 you'll see:

```ts
export const PLATFORM_TREASURY_ADDRESS = Address.parse(
  // PLACEHOLDER — replace with actual treasury before mainnet launch.
  "EQDrjaLahLkMB-hMCmkzOyiv9yEa2wzPpkbn5_Mdsy5Sxb6m",
);
```

Replace the `EQDrjaLahLkMB-hMCmkzOyiv9yEa2wzPpkbn5_Mdsy5Sxb6m` string with **your own ION wallet address** (the one you used for the Hub deploy fee testing). This way, when you run a test deploy, the 1000 ION platform fee goes back to your own wallet — net cost is just ~0.25 ION for gas.

When we go to production, we'll create a separate treasury wallet and update this address. For now, your own address is correct.

Save the file (Cmd+S).

### Step 7 — Set up the `nft.ionhub.io` DNS record

Wherever you manage DNS for `ionhub.io` (the same place you set up `launch.ionhub.io`'s CNAME), add a new record:

- **Type**: CNAME
- **Name** (or **Host**): `nft`
- **Target** (or **Value**): `professorblock.github.io`
- **TTL**: leave as default (usually 3600 or "Auto")

Save the record. DNS propagation can take 5–60 minutes.

### Step 8 — Deploy to GitHub Pages

Back in the VS Code terminal, on the staging branch:

```
git status
```

Should show `modified: src/lib/nft/nft-deploy-controller.ts` from Step 6. Commit it:

```
git add src/lib/nft/nft-deploy-controller.ts
git commit -m "config: set platform treasury to dev wallet"
git push origin staging
```

Then merge to master and deploy:

```
git checkout master
git merge staging --no-edit
git push origin master
npm run deploy
```

`npm run deploy` builds the app and pushes to the `gh-pages` branch automatically. Takes about 1–2 minutes.

### Step 9 — Enable GitHub Pages with the custom domain

In your browser, go to **https://github.com/professorblock/ion-nft-studio/settings/pages**.

- **Source**: Deploy from a branch
- **Branch**: `gh-pages` / `(root)`
- Save
- **Custom domain**: enter `nft.ionhub.io` and click Save
- Wait for the green checkmark next to "DNS check successful" (may take a few minutes if DNS hasn't propagated yet)
- Check **Enforce HTTPS** once it becomes available

### Step 10 — Verify

Open `https://nft.ionhub.io` in an incognito window. You should see the same UI you saw on localhost in Step 5. If you get a blank page, hard-refresh; if it persists, paste me what's in the browser Console (F12 → Console tab) and we'll debug the same way we did for `launch.ionhub.io`.

---

## What to send back when each step completes

I don't need confirmation for every step — just paste back any output you see for **Block 3A**, **Block 3B**, and the result of **Step 10** (whether it works or what error you see). Then we move to building the actual Configure-Collection form.

## Files you might want to know about

- `src/App.tsx` — route map (home / launch / collection)
- `src/consts.ts` — branding strings and route definitions
- `src/lib/nft/nft-deploy-controller.ts` — deploy logic + monetization constants (1000 ION fee, 50% min burn, etc.)
- `src/lib/nft/NftCollection.source.ts` — embedded contract bytecode (don't edit)
- `src/lib/nft/NftCollection.data.ts` — data cell builder
- `src/pages/launch/index.tsx` — current "Test Deploy" UI (will be replaced with the real form next iteration)
- `public/tonconnect-manifest.json` — wallet integration manifest
- `public/CNAME` — `nft.ionhub.io`
