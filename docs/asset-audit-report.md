# PixelQuest Asset Audit and Processing Report

**Audit state: PARTIAL — Phase 2 remains IN PROGRESS.** The automated
integrity checks pass, but visual/manual work remains. This report
distinguishes measured output from visual review and unresolved work; a
programmatic PASS is not a visual-quality certification.

## Inventory

| Category | Processed inventory | Image properties | State / limitations |
|---|---|---|---|
| Player | Cleaned 1408x768 sheet, normalized 4x4 atlas with 144x176 cells, and 16 individual frame crops | RGBA; alpha channel present | Frame source bounds were measured. Row-major position is recorded; facing direction and animation order are not assigned. |
| Buildings | Partial cleaned 1408x768 sheet and 4 individual sprites | RGBA; alpha channel present | Cottage, forge, hall, and orange house exported. Slate-roof workshop is omitted pending a manual mask. |
| Terrain | Partial cleaned 1408x768 sheet; 164 variable-size source-coordinate boxes | RGBA; alpha channel present | 55 ambiguous tile boxes retain their original RGB pixels fully opaque pending manual masking. Do not use those regions as cleaned transparent tiles. |
| Mobile controls | Cleaned 1536x1024 sheet and 31 individual sprites | RGBA; alpha channel present | Includes available normal/active/pressed sprites. There is no left-pressed arrow in the source; light edge residue remains unresolved. |
| Source-only references | 13 original files: 4 PNGs and 9 JPGs | All original images are RGB; the original PNGs have no alpha channel | Originals are unchanged and retained in `assets-source/`. Their SHA-256 baseline and comparison record are in [`source-hashes-before.json`](../assets-processing/source-hashes-before.json). |

The generated runtime catalog contains 56 records for all available
processed player, building, terrain, and control images. It is sourced by
[`assetManifestData.json`](../src/config/assetManifestData.json), typed
and exposed to Phaser through [`assetManifest.ts`](../src/config/assetManifest.ts).
`ESSENTIAL_IMAGES` remains compatible with `PreloadScene` and contains
the same four core sheet keys.

The nine reference JPGs measure 896x1152. The supplied player, building,
and terrain source sheets measure 1408x768; the mobile control source
sheet measures 1536x1024. The processed outputs are RGBA and have alpha
channels; the source artworks are not.

## Terrain measurements and results

The source terrain sheet is 1408x768. Audit measurements found 10
horizontal bands and an irregular placement of 164 boxes; a uniform
16x16 or 32x32 tile grid is not supported by the art. The approximate
single-cell width and height are 73px and 74px, respectively. The
checker run-length mean is 11.75px and its fitted period is 11.75px.
Measured phase domains differ; the single-lattice agreement across
classified checker pixels is only about 0.376. A global checker phase is
therefore not used for removal.

| Band | Y range (inclusive) | Category | Boxes |
|---:|---:|---|---:|
| 0 | 0–76 | Grass | 18 |
| 1 | 81–153 | Dirt path | 17 |
| 2 | 158–226 | Cobblestone path | 18 |
| 3 | 233–306 | Path junction | 17 |
| 4 | 309–377 | Water | 18 |
| 5 | 385–458 | Water edge | 17 |
| 6 | 473–532 | Wall | 14 |
| 7 | 553–599 | Fence | 21 |
| 8 | 621–684 | Bridge/dock | 8 |
| 9 | 699–758 | Vegetation | 16 |

Per-box `x, y, w, h`, confidence, measured fill/edge metrics, and
manual-mask flags are recorded in
[`terrain-tiles.json`](../public/assets/processed/terrain/terrain-tiles.json).
The current heuristic counts are 55 high, 54 medium, and 55 low; these
are processing labels, not visual verification. Low-confidence regions
are deliberately copied back as opaque original pixels to preserve
gray stone detail, with checker pixels still present and a manual-mask
flag.

### Requested terrain defects

- The approximately 144px-wide grass region at x=631–775 had not split
  because its narrow divider did not meet the general minimum-width
  column-gap rule. It is now explicitly split at x=702–706 into measured
  boxes x=631–701 (71px) and x=707–774 (68px).
- The short top-edge strip at x=690–720, y=0–3 is removed using a
  region-specific mask. Pixel checks assert the strip and full divider
  are transparent in the reviewed grass candidate.
- Before/after crops are enlarged 8x using nearest-neighbour sampling
  and shown on both magenta and cyan backgrounds:
  [`terrain-grass-divider-8x-magenta.png`](../assets-processing/previews/terrain-grass-divider-8x-magenta.png),
  [`terrain-grass-divider-8x-cyan.png`](../assets-processing/previews/terrain-grass-divider-8x-cyan.png).
  Both candidates were visually inspected; the two grass tiles are
  recorded as visually reviewed.
- Bridge pillars at x=235–258 and x=363–387 are similar gray stone
  artwork. The earlier cut removed stone from the second pillar while
  the first already required manual review. Both are now retained
  opaque and marked for manual masks. The 8x comparisons are
  [`terrain-bridge-pillars-8x-magenta.png`](../assets-processing/previews/terrain-bridge-pillars-8x-magenta.png)
  and
  [`terrain-bridge-pillars-8x-cyan.png`](../assets-processing/previews/terrain-bridge-pillars-8x-cyan.png).
- Cobblestone, all 17 junction tiles, walls, and both pillars are
  conservative manual-review regions. No single checker lattice is
  forced over these gray artworks.

The broad terrain previews and diagnostic masks are in
[`assets-processing/previews/`](../assets-processing/previews/) and
[`assets-processing/diagnostics/terrain/`](../assets-processing/diagnostics/terrain/).
The cleaned sheet is intentionally named `clean-partial`: many source
pixels remain opaque until safe masks exist.

## Contact sheets and visual review

Every contact sheet is generated in neutral-gray and magenta/cyan
checker versions:

| Review set | Neutral | Checker | Notes |
|---|---|---|---|
| All 16 player frames | [`player-frames-contact-neutral.png`](../assets-processing/previews/player-frames-contact-neutral.png) | [`player-frames-contact-checker.png`](../assets-processing/previews/player-frames-contact-checker.png) | Sword silhouettes and sprite outlines are visible; no reliable defect was found that justified trimming. Facing direction and row/animation semantics remain unverified. |
| Cleaned player sheet and normalized atlas | [`player-sheet-atlas-contact-neutral.png`](../assets-processing/previews/player-sheet-atlas-contact-neutral.png) | [`player-sheet-atlas-contact-checker.png`](../assets-processing/previews/player-sheet-atlas-contact-checker.png) | Measured cell geometry only; do not assign directions or animation order yet. |
| Four extracted buildings | [`buildings-contact-neutral.png`](../assets-processing/previews/buildings-contact-neutral.png) | [`buildings-contact-checker.png`](../assets-processing/previews/buildings-contact-checker.png) | Four exported sprites were visually reviewed. Roof edges are present. Cottage/forge chimney smoke is approximate and not a verified animation. The slate workshop is absent from the export. |
| 164 terrain boxes | [`terrain-contact-neutral.png`](../assets-processing/previews/terrain-contact-neutral.png) | [`terrain-contact-checker.png`](../assets-processing/previews/terrain-contact-checker.png) | Manual-review tiles visibly retain source checker pixels by design; see terrain metadata. |
| All 31 mobile-control sprites | [`controls-contact-neutral.png`](../assets-processing/previews/controls-contact-neutral.png) | [`controls-contact-checker.png`](../assets-processing/previews/controls-contact-checker.png) | Available pressed/active states are included. Small light edge residue is visible, but is not safely distinguishable from authored highlights and outlines. No further automatic trimming was made. |

## Processing commands

Run from the project root with Python, Pillow, NumPy, and SciPy available:

```powershell
python tools/assets/process_player.py
python tools/assets/process_buildings.py
python tools/assets/process_controls.py
python tools/assets/process_terrain.py
python tools/assets/generate_contact_sheets.py
python tools/assets/build_asset_manifest.py
python tools/assets/validate_assets.py
```

The npm validation alias is `npm run assets:validate`. Its structural
checks are separate from visual inspection.

## Validation and source integrity

`validate_assets.py` checks required files and safe paths, decoded image
dimensions, RGBA/alpha declarations, crop bounds and non-empty crops,
player atlas frame bounds and overlap, terrain box bounds and overlap,
manifest/preload compatibility, contact-sheet existence, and the hashes
of all 13 original source files.

Current result:

- **PASS** — manifest consistency and four-entry Phaser preload surface.
- **PASS** — required files, image dimensions, RGBA/alpha status, crop
  bounds, player atlas frame bounds/non-overlap, and terrain box bounds.
- **PASS** — ten contact-sheet files and 13/13 original source SHA-256
  comparisons.
- **NEEDS_MANUAL_REVIEW** — overall, because visual tasks and masks
  remain. Automated checks make no visual-quality claim.

The dependency restore initially could not reach the npm registry. After
checking connectivity (`npm ping` returned PONG), `npm ci --no-audit
--no-fund` installed the locked dependencies. `npm run typecheck` passed.
`npm run build` passed with Vite 7.3.7; its generated `dist/` output is
excluded from the project ZIP.

## Remaining manual tasks

1. Create manual masks for the 55 terrain tiles flagged by
   `terrain-tiles.json`; then regenerate previews and review them on
   contrasting backgrounds.
2. Manually separate the slate-roof workshop from its checker and
   export it only after roof pixels are verified.
3. Resolve player facing direction and animation ordering from verified
   frame content; do not infer them from row position.
4. Review building smoke boundaries and mobile-control edge residue.
   A left-pressed arrow is not present in the source artwork.
5. Re-run asset validation and visual review after those edits. Phase 2
   remains in progress, and Phase 3 map construction must not start
   until the manifest and usable asset pipeline are stable.

## Package

[`pixelquest-phase2-complete.zip`](../pixelquest-phase2-complete.zip) contains
the project sources, source assets, processed outputs, diagnostics,
contact sheets, manifest, scripts, and documentation. It was inspected
after creation; `node_modules/`, `dist/`, Git data, Python caches, and
other build/cache artifacts are excluded.
