# Vercel Deployment Guide

**Last Updated:** 2026-03-22

---

## Frontend Deployment

The Mirror Protocol frontend is deployed on Vercel from `src/frontend/`.

### Build Command

```bash
cd src/frontend
pnpm build
```

Output goes to `src/frontend/dist/`.

### Environment Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_ENVIO_GRAPHQL_URL` | `https://indexer.dev.hyperindex.xyz/4cda827/v1/graphql` | Envio HyperSync endpoint |

This is also hardcoded in `src/frontend/src/contracts/config.ts` as a fallback.

---

## Envio Proxy Rewrite

The frontend uses a Vercel rewrite to proxy Envio GraphQL requests, avoiding CORS issues in production.

### Configuration

In `vercel.json` (or Vercel project settings):

```json
{
  "rewrites": [
    {
      "source": "/api/envio/:path*",
      "destination": "https://indexer.dev.hyperindex.xyz/4cda827/v1/:path*"
    }
  ]
}
```

### How It Works

1. Frontend makes requests to `/api/envio/graphql` (same origin)
2. Vercel rewrites the request to the HyperSync endpoint
3. No CORS headers needed — request appears same-origin to the browser
4. Response is proxied back to the frontend

### Why This Matters

- Browser CORS policies block direct cross-origin GraphQL requests
- The proxy makes Envio requests appear as same-origin API calls
- No server-side code needed — Vercel handles the rewrite at the edge

---

## Deployment Steps

1. **Connect repo to Vercel** (one-time setup)
2. **Set root directory** to `src/frontend`
3. **Set build command** to `pnpm build`
4. **Set output directory** to `dist`
5. **Add environment variable** `VITE_ENVIO_GRAPHQL_URL`
6. **Deploy** — Vercel builds and deploys automatically on push

---

## Verification

After deployment:
1. Open the Vercel URL
2. Connect MetaMask wallet
3. Switch to Monad testnet (Chain ID 10143)
4. Verify patterns load from on-chain data
5. Check Envio metrics dashboard shows live data
6. Confirm no CORS errors in browser console
