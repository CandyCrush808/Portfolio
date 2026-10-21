# PixelQuest --- Project Requirements

## 1. Project overview

PixelQuest is a responsive, browser-based 2D top-down pixel-art RPG
portfolio. Visitors explore a cozy fantasy village, interact with NPCs
and buildings, and discover the creator's profile, skills, projects,
achievements, and contact links.

The game should feel like a small RPG adventure while still functioning
as a clear, accessible professional portfolio.

## 2. Goals

-   Create an original, memorable portfolio experience rather than a
    conventional scrolling portfolio.
-   Support Windows desktop browsers and Android mobile browsers.
-   Allow keyboard, mouse/click-to-navigate, and touchscreen controls.
-   Use the existing pixel-art building spritesheet, player-character
    spritesheet, and touchscreen-control UI assets where technically
    suitable.
-   Keep portfolio content easy to update without redesigning the world.
-   Deliver a deployable static web application with documented local
    setup and deployment steps.

## 3. Target users and problems

-   Recruiters and potential clients who want to quickly understand the
    creator's work.
-   Developers and designers interested in projects, skills, and
    technical approach.
-   Mobile visitors who need comfortable touch controls and readable
    text.
-   Visitors unfamiliar with RPG controls who need clear prompts and a
    conventional fallback navigation path.

User problems addressed: - Traditional portfolios can be visually
generic. - Visitors may not know where to start; in-world guidance and
map/navigation UI should make exploration understandable. - Game-style
interfaces can be hard to use on phones; responsive layouts and
accessible alternative navigation are required.

## 4. Core features

### Gameplay

-   Top-down village exploration.
-   Four-direction player movement and animation.
-   Camera follows the player and respects map boundaries.
-   Collision with buildings, walls, trees, water, fences, props, and
    other blocked areas.
-   NPCs with interaction prompts and dialogue.
-   Interactive buildings that open relevant portfolio sections.
-   Keyboard controls on desktop.
-   Touch D-pad or virtual joystick and action button on Android.
-   Click/tap-to-navigate where practical, with pathfinding or a clearly
    communicated fallback.
-   Pause/menu overlay and help screen.

### Portfolio

-   About/profile area.
-   Projects list and project detail views.
-   Skills/tools area.
-   Experience/education or achievements area, if content is supplied.
-   Contact options such as email, GitHub, LinkedIn, and résumé links,
    only when real destinations are provided.
-   Optional map or discovery tracker.
-   Portfolio content stored in structured local data files so it can be
    edited independently of gameplay code.

### UX and quality

-   Responsive desktop, tablet, portrait mobile, and landscape mobile
    layouts.
-   Clear keyboard focus, visible interaction states, and readable
    dialogue.
-   Loading/error states and graceful handling of missing optional
    content.
-   Reduced-motion support for interface transitions where practical.
-   Persistent settings only if implemented using browser storage
    safely.

## 5. User roles and permissions

-   **Visitor/player:** explore the world, read portfolio content,
    follow external links, change local settings.
-   **Project maintainer:** edits source files and portfolio data,
    replaces assets, tests and deploys the site.
-   No user accounts, authentication, or admin dashboard are required
    for the initial version.
-   Do not collect personal visitor data or add analytics without an
    explicit decision.

## 6. Functional requirements

-   FR-01: The application loads into a title/menu screen or a clearly
    signposted playable start.
-   FR-02: The player can move using WASD/arrow keys.
-   FR-03: The player cannot pass through objects marked as collidable.
-   FR-04: The camera follows the player without exposing unintended
    empty space beyond map boundaries.
-   FR-05: The player can interact with an NPC or object using a
    keyboard action key and mobile action button.
-   FR-06: Dialogue can advance and close using keyboard, mouse, or
    touch as appropriate.
-   FR-07: Buildings and NPCs link to relevant portfolio content.
-   FR-08: A visitor can access portfolio sections without needing to
    finish the game.
-   FR-09: Touch controls are shown on touch-oriented devices and do not
    cover critical dialogue content.
-   FR-10: The game scales cleanly across target viewport sizes while
    preserving pixel-art sharpness.
-   FR-11: External links open safely and use valid, maintainer-supplied
    URLs.
-   FR-12: Missing optional images or content produce a fallback rather
    than a broken screen.
-   FR-13: The UI includes help/instructions and a way to return to the
    game.
-   FR-14: The project can be built and deployed using documented
    commands.

## 7. Non-functional requirements

-   Performance: target a stable 60 FPS on typical recent desktop and
    Android devices; gracefully accept lower frame rates on weaker
    hardware.
-   Loading: keep initial assets reasonably small; use compressed images
    and load only what is needed.
-   Responsiveness: support 360px-wide mobile screens and common desktop
    widths without horizontal page overflow.
-   Accessibility: semantic HTML for surrounding UI, keyboard focus
    visibility, adequate contrast, text alternatives for meaningful
    icons, and reduced-motion consideration.
-   Maintainability: separate scenes, input, collision, dialogue,
    portfolio data, and UI.
-   Security: no embedded secrets; validate external URLs; avoid
    unnecessary third-party scripts.
-   Reliability: handle missing assets and unknown interactions without
    crashing the game.

## 8. Scope

### Included in initial release

-   One explorable village map.
-   One controllable player character.
-   Static portfolio content.
-   Several NPCs and interactive buildings.
-   Dialogue and interaction prompts.
-   Desktop keyboard and mouse support.
-   Android touch controls.
-   Basic click/tap-to-move if feasible without compromising core
    movement.
-   Responsive menus, project panels, help, and settings.
-   Build and deployment documentation.

### Excluded unless separately approved

-   Multiplayer or online accounts.
-   Combat, enemies, inventory economy, or a full quest system.
-   Backend/database or CMS.
-   Online content editing.
-   Analytics, advertising, payments, or visitor tracking.
-   Complex procedural world generation.
-   Native Android app packaging.

## 9. Acceptance criteria

-   A first-time visitor can start and understand movement without
    external instructions.
-   Player movement, collisions, camera bounds, dialogue, and
    interactions work in a complete local playthrough.
-   Every portfolio destination has a visible label or discoverable
    prompt.
-   Portfolio sections can be reached from in-world interactions and a
    non-game menu.
-   Touch controls respond correctly on Android and allow movement plus
    interaction where supported.
-   Portrait and landscape layouts remain usable; dialogue and controls
    do not permanently obscure the player or critical content.
-   Assets render with correct transparency and crisp pixel edges.
-   No console errors occur during the main user journey.
-   Production build succeeds and the deployed site loads over HTTPS.
