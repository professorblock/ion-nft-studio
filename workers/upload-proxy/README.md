# ion-nft-upload-proxy

Cloudflare Worker that proxies Pinata uploads for the ION Hub | NFT Studio frontend. Holds the Pinata JWT as a Cloudflare secret so it never reaches the client bundle. Restricts callers to the configured allowed origins via CORS.

## Endpoints

| Method | Path           | Purpose                              |
| ------ | -------------- | ------------------------------------ |
| GET    | `/health`      | Liveness check                       |
| POST   | `/upload/file` | Pin a file (multipart/form-data)     |
| POST   | `/upload/json` | Pin a JSON object (application/json) |

Successful uploads return `{ "url": "https://gateway.pinata.cloud/ipfs/CID", "cid": "CID" }`.

## Deploy

```bash
npm install
npx wrangler login           # one-time browser auth
npx wrangler deploy          # initial deploy → prints worker URL
npx wrangler secret put PINATA_JWT   # paste your Pinata JWT when prompted
```

The Worker URL goes into the frontend's `.env.local` as `REACT_APP_UPLOAD_PROXY_URL`.

## Local development

```bash
echo 'PINATA_JWT="your_jwt_here"' > .dev.vars
npm run dev
```

`.dev.vars` is gitignored.

## Cost

Cloudflare Workers free tier: 100k requests/day. For this proxy at any reasonable v1 traffic that's effectively unlimited; cost is $0/month.
