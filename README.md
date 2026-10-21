# PixelQuest — My Portfolio Adventure

Responsive pixel-art RPG portfolio. Phaser 3 + Vite + TypeScript. Static site, no backend.

## Commands
- `npm install`
- `npm run dev` — dev server (http://localhost:5173). `npm run dev:host` exposes it on your LAN for phone testing.
- `npm run build` — typecheck + production build to `dist/`
- `npm run preview` — serve `dist/` (http://localhost:4173)
- Add `?debug` to the URL to expose `window.__PIXELQUEST__` for tests.

## Layout
- `src/config` constants, asset manifest, Phaser config
- `src/core` event bus, responsive scaler
- `src/scenes`, `src/entities`, `src/input`, `src/world`, `src/ui`, `src/utils`
- `public/assets` served art; `assets-source/` untouched originals
- `docs/` project documentation (requirements, architecture, phases, tracker...)

Status: Phase 1 complete (see `docs/task-tracker.md`).
# Portfolio
