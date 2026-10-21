# PixelQuest — Project Memory

> Keep the project state factual. Distinguish measured, visually reviewed,
> and unresolved work.

## Project identity

- **Name:** PixelQuest — My Portfolio Adventure.
- **Purpose:** A responsive 2D top-down pixel-art RPG presenting a
  developer/designer portfolio as an explorable village.
- **Targets:** Windows desktop browsers and Android mobile browsers.
- **Stack:** Phaser 3.90, Vite, TypeScript, and Tiled when map work begins.
- **Content:** No invented portfolio details, external URLs, or backend.

## Current project state

- **Active phase:** Phase 3 player/world integration IN PROGRESS; Phase 2 asset
  review remains open. The maintainer's controller brief is titled Phase 4,
  while the project roadmap tracks player control under Phase 3.
- Phaser boot/preload/world-scene flow and DOM shell remain in place. The
  village has an animated player controller, keyboard/touch input, and explicit
  collision-door gaps. Runtime gameplay has not been browser-verified.
- Deployment is not configured or verified.
- The original 13 files remain under `assets-source/`; all original
  images are RGB with no alpha channel. Processed images are RGBA.
- Phase 1 had previously passed its build and browser checks; the
  current build/typecheck are also verified after the manifest update.

## Decisions to preserve

1. Support desktop and Android browsers, keyboard and touch input, and
   static hosting without a backend.
2. Keep original artwork unchanged. Never infer transparency from a
   checkerboard baked into RGB pixels.
3. Assign only player frames whose poses are visibly identifiable in the
   contact preview; keep the full atlas semantics marked unverified until the
   remaining frames and animation ordering are reviewed.
4. Preserve the Phaser preload interface and subpath-aware asset URLs.
5. Keep portfolio information structured and do not invent biography,
   achievements, project details, contact details, or URLs.
6. Do not add combat, multiplayer, login, analytics, or backend services
   without approval.

## Verified asset work

- The runtime catalog has 56 processed-image entries in
  `src/config/assetManifestData.json`; `src/config/assetManifest.ts`
  exposes typed catalog data and keeps four core `ESSENTIAL_IMAGES` for
  `PreloadScene`.
- Player: 16 measured crops and a normalized 4x4 atlas with 144x176
  cells. Contact-sheet review identifies front/down (row 0), back/up (row 1),
  and right profile (row 2 columns 0-1); the right profile is flipped for left.
  These selected assignments are temporary; overall manifest direction and
  animation-order verification remains false.
- Buildings: four sprites extracted. Slate-roof workshop is omitted
  until a manual mask is possible. Smoke remains approximate.
- Mobile controls: 31 sprites extracted and contact sheets generated.
  Edge residue is unresolved; no left-pressed arrow exists in source.
- Terrain: 10 horizontal bands, 164 irregular boxes. Checker period is
  about 11.75px, with irregular local phase; no global checker lattice
  is imposed. Grass defects at x=702–706 and x=690–720 were corrected
  and visually checked at 8x on magenta and cyan. Gray stone/junction/
  wall areas and both similar bridge pillars are retained opaque for
  manual masks.
- Contact sheets, diagnostics, measurements, and source SHA-256
  baseline/comparison are in `assets-processing/`. See
  `docs/asset-audit-report.md`.
- Asset-only validation checks pass, including all 13 original hashes.
  Overall status is NEEDS_MANUAL_REVIEW because manual visual tasks
  remain; programmatic checks make no visual-quality claim.
- Village uses four measured building exports and selected high-confidence
  terrain water crops. The map is 1600x1120 with connected paths, spawn and
  destination data, depth sorted buildings/trees, collision footprints, pond
  bounds, labels, and query-string debug overlays. Trees and flowers are small
  code-drawn decorative placeholders; tree collision is separate from art size.
- `npm run typecheck` passes after controller changes. `npm run build` passes
  after rerunning with broader filesystem access; Vite 7.3.7 generated `dist/`.
  `npm run assets:validate`
  passes structural checks and reports NEEDS_MANUAL_REVIEW as before.
- Touch uses a Phaser-drawn D-pad because the processed control sprites retain
  unresolved edge residue. Use `?touchControls` to force it on desktop.
- Building collision footprints leave center door gaps. Trees, pond, and four
  buildings have explicit solids; the map currently has no rocks or fences.

## Unresolved Phase 2 work

1. Manually mask the 55 terrain boxes flagged in
   `public/assets/processed/terrain/terrain-tiles.json`.
2. Manually mask the slate-roof workshop.
3. Review all 16 player frames and certify directional semantics and animation
   order; the controller currently uses only the visually identifiable subset.
4. Review building smoke boundaries, control edge residue, and pressed
   state alignment.
5. Re-run validation and visual review after masks are completed.

## Next steps

Complete the manual masks and remaining visual reviews. Open `npm run dev` at desktop and mobile sizes,
check keyboard and `?touchControls`, movement, animations, entrances, collision,
resize, and `?debug` overlays. Phase 2 and Phase 3 remain IN PROGRESS until
review and runtime verification tasks are addressed.
