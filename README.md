# TrailShare Pro+ (MVP bundle)
Includes:
- Leaflet interactive map with markers
- GPS autofill button in New Report
- Photo compression (client-side)
- Comments + helpful votes
- PWA install (Android add-to-home-screen)
- Simple offline cache via service worker

## Run locally
npm install
npm run dev

## Build
npm run build

## Deploy to Vercel
- Project settings: Framework = Vite
- Build command: npm run build
- Output directory: dist

## Notes
- Data is in localStorage (LS key trailshare_reports_v2).
- Supabase is included as a dependency but not wired; we can connect it once you provide a project URL and anon key.
