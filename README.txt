# Vercel Rollup Native Fix

This bundle contains:
- package.json (Node 20 + explicit rollup + optional native binary for Linux)
- .nvmrc (forces Node 20 in many CI providers, Vercel respects this in most cases)
- vercel.json (sets build command and ROLLUP_SKIP_NODEJS_NATIVE=1)

## What you must do in Vercel UI
1) Project → Settings → General → **Node.js Version** → set to **20.x**.
2) Project → Settings → Environment Variables → add:
   - `ROLLUP_SKIP_NODEJS_NATIVE = 1`
   Apply to **Production, Preview, Development**.
3) Redeploy with **Clear build cache**.

## Local
npm install
npm run build
