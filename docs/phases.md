# PixelQuest --- Implementation Phases

Each phase must be verified before moving to the next. Avoid building
every feature at once.

## Phase 1 --- Project setup and foundation

**Status: COMPLETED 2026-10-21** (verified: dev server, canvas, production
build, 75/75 browser checks). See `task-tracker.md` for evidence and
deviations (TypeScript instead of JavaScript).

**Objective:** Create a running web project. - Initialize Vite and
install a compatible Phaser 3 version. - Add `index.html`,
`src/main.js`, and `src/gameConfig.js`. - Add a responsive game
container and basic CSS. - Establish asset folders and Git repository.
**Dependencies:** None. **Deliverables:** Local app opens and displays a
Phaser canvas. **Completion criteria:** `npm run dev` works; no console
errors; initial production build succeeds.

## Phase 2 --- Asset audit and core architecture

**Status: IN PROGRESS.** The 56-entry processed asset catalog,
measurements, contact sheets, terrain processing, and asset validator
exist. Phase 2 remains open because 55 terrain boxes and the slate-roof
workshop need manual masks; player facing/animation semantics and mobile
control edge/state review remain unresolved. Project architecture
requirements such as MenuScene, portfolio data files, and Tiled
conventions are also not complete.

**Objective:** Make existing assets usable and define core systems. -
Inspect all image dimensions, frame boundaries, transparency, and
licenses/origins. - Separate UI sprites where needed; do not assume
checkerboards are transparent. - Document tile and character frame
dimensions. - Create BootScene, MenuScene, VillageScene,
InputController, and data files. - Define map layer names and
interaction object properties. **Dependencies:** Phase 1.
**Deliverables:** Asset manifest, project skeleton, data model.
**Completion criteria:** Essential assets load; missing asset errors are
understandable.

**Phase 3 entry gate:** Phase 2 manual masks and review remain open. The
maintainer explicitly requested Phase 3 work before that gate was met, so
map construction uses only four verified building exports and selected
high-confidence terrain crops; uncertain regions remain excluded.

## Phase 3 --- Village map and player movement

**Status: IN PROGRESS — visual/build verification remains.**

**Objective:** Create the first playable world. - Build/import the
village map using Tiled. - Add terrain, roads, buildings, props, and
depth layers. - Add player sprite and directional animations after
verifying the sheet grid. - Configure camera follow and map bounds. -
Add collision for buildings, water, trees, walls, and fences.
**Dependencies:** Phase 2 (asset review remains open by maintainer choice).
**Deliverables:** Data-driven village, connected paths, buildings, props,
pond, collision metadata, debug overlay, and camera bounds are implemented.
Player movement now uses a scaled atlas sprite; Phase 3 is not complete until
the world is rendered and visually/responsively checked. Collision behavior
needs runtime verification.

The maintainer's controller brief is titled Phase 4, but its scope maps to
this roadmap's Phase 3 player movement/collision tasks. The controller,
selected atlas animations, keyboard, touch D-pad, and collision integration
are implemented; runtime verification remains outstanding. Only visibly
identifiable down/up/right-profile frames are selected; left mirrors the
right profile. Full atlas semantics remain unverified in the manifest.

## Phase 4 --- Input, interactions, dialogue, and portfolio

**Objective:** Make exploration meaningful. - Normalize keyboard,
mouse/pointer, and touch input. - Add interaction range and prompts. -
Add NPC dialogue and close/advance behavior. - Connect buildings/NPCs to
profile, projects, skills, and contact panels. - Add non-game navigation
to portfolio sections. - Implement click-to-navigate only if a reliable
pathfinding or movement fallback is included. **Dependencies:** Phase 3.
**Deliverables:** Functional interactions and portfolio content.
**Completion criteria:** Each core portfolio destination can be reached
and opened without dead ends.

## Phase 5 --- Mobile UI and responsive behavior

**Objective:** Make desktop and Android experiences usable. - Integrate
D-pad or joystick, action, pause, and map/menu controls. - Support
simultaneous movement and action where feasible. - Handle pointer/touch
cancellation and prevent stuck movement. - Adjust dialogue and menus for
portrait and landscape. - Respect safe areas and avoid accidental
browser scrolling while playing. **Dependencies:** Phase 4.
**Deliverables:** Responsive touch-enabled build. **Completion
criteria:** Tested on Android browser or a reliable device emulator;
controls are usable in both orientations.

## Phase 6 --- Testing and bug fixing

**Objective:** Stabilize critical journeys. - Test movement, collision,
camera, interaction, dialogue, and links. - Test missing data/assets and
unknown interaction IDs. - Test keyboard, mouse, touch, resize, and
orientation changes. - Add unit/e2e tests where practical. - Fix
high-impact defects before adding decorative features. **Dependencies:**
Phases 3--5. **Deliverables:** Test checklist and defect list.
**Completion criteria:** No blocking defects in the main journey; no
uncaught errors during normal play.

## Phase 7 --- Visual polish and accessibility

**Objective:** Improve clarity and finish. - Align sprites and remove
unintended transparency/checkerboard artifacts. - Tune scaling, UI
spacing, focus states, dialogue text sizes, and touch targets. - Add
loading, empty, and error states. - Optimize asset sizes and check pixel
sharpness. - Check reduced-motion and keyboard accessibility.
**Dependencies:** Phase 6. **Deliverables:** Polished, consistent
interface. **Completion criteria:** Design checklist passes on desktop
and mobile.

## Phase 8 --- Deployment and final verification

**Objective:** Publish a stable portfolio. - Configure production base
path and host settings. - Run production build and preview. - Deploy to
static hosting with HTTPS. - Test deployed asset paths, refresh,
external links, and mobile controls. - Update README and memory/task
tracker. **Dependencies:** Phase 7. **Deliverables:** Live URL and
deployment notes. **Completion criteria:** Full main journey works on
Windows browser and Android browser; no missing assets or broken
navigation.

## Change-control rule

If a phase uncovers a foundational problem, fix it before proceeding. Do
not rewrite working architecture or replace the asset style without
explaining the reason and obtaining maintainer agreement.
