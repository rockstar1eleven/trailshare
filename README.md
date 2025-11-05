# TrailShare (clean full demo)

This is a clean, ASCII-only TrailShare demo that includes:

- Trail feed with reports
- Create report modal (photos, hazards, difficulty, rating)
- Optional GPS link and lat/lng fields
- Simple map stub using OpenStreetMap iframe
- LocalStorage persistence
- Mobile bottom nav

## Run locally

```bash
npm install
npm run dev
```

Open the printed URL.

## Build for production

```bash
npm run build
npm run preview
```

## Deploy to Vercel

- Import the repo in Vercel
- Framework preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`

Done.
