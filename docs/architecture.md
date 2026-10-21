# PixelQuest --- Architecture

## 1. Architecture summary

Use a client-side static web application. Phaser handles the game world,
rendering, camera, movement, collisions, and in-game interaction.
HTML/CSS handles accessible surrounding UI and responsive overlays where
that is simpler than rendering text inside the canvas. Portfolio content
lives in version-controlled JSON/JavaScript data files.

No backend or database is required for the first release.

## 2. Recommended technology stack

-   Vite: local development server and production bundling.
-   JavaScript ES modules: application code.
-   Phaser 3: 2D game engine.
-   Tiled: external map editor; export maps as JSON.
-   HTML/CSS: title screen, accessible panels, responsive shell, and
    optional portfolio overlays.
-   Optional: Vitest for unit tests and Playwright for browser
    end-to-end tests.
-   Git: source control.
-   Static hosting: GitHub Pages, Netlify, or Vercel. Configure the base
    path correctly for the selected host.

Use stable compatible package versions and commit the lockfile. Avoid
adding libraries without a concrete need.

## 3. Runtime components

-   **BootScene:** load essential assets, validate required resources,
    and show loading/error feedback.
-   **MenuScene:** title screen, start, controls, settings, and
    accessible portfolio shortcut.
-   **VillageScene:** tilemap, layers, player, NPCs, interactables,
    camera, and collision setup.
-   **UIShell:** responsive HTML/CSS overlays for menus, dialogue,
    project details, and help.
-   **InputController:** combines `KeyboardInput` and `TouchControls` into a
    normalized movement vector; `PlayerController` applies velocity/facing and
    `PlayerAnimations` selects idle/walk frames. Pointer steering is not used.
-   **CollisionSystem:** reads collision properties from map
    objects/tiles and blocks movement.
-   **InteractionSystem:** detects nearby interactables, shows prompts,
    and dispatches interaction events.
-   **DialogueSystem:** displays speaker, message, choices if needed,
    and next/close behavior.
-   **PortfolioRepository:** reads local portfolio data and resolves IDs
    for projects, skills, profile, and contact links.
-   **AudioManager:** optional, only if sound is added.
-   **SettingsManager:** optional local settings such as sound, control
    mode, and text scale.

## 4. Data flow

1.  Vite serves the application entry point.
2.  BootScene loads player, environment, building, NPC, and UI assets.
3.  VillageScene loads the Tiled JSON map and its referenced tilesets.
4.  InputController reads active inputs and emits a normalized
    direction/action.
5.  Player movement is applied through Phaser physics/collision
    handling.
6.  InteractionSystem finds a nearby object and opens the matching
    dialogue or portfolio panel.
7.  PortfolioRepository resolves content from local data files.
8.  UI updates from events; UI actions dispatch events back to game
    systems.
9.  Build output is deployed as static files.

## 5. Folder structure

``` text
pixelquest/
├── public/
│   └── assets/
│       ├── player/
│       ├── buildings/
│       ├── terrain/
│       ├── props/
│       ├── npcs/
│       ├── ui/
│       └── audio/
├── maps/
│   └── village.json
├── src/
│   ├── main.js
│   ├── gameConfig.js
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── MenuScene.js
│   │   └── VillageScene.js
│   ├── systems/
│   │   ├── InputController.js
│   │   ├── InteractionSystem.js
│   │   ├── DialogueSystem.js
│   │   └── PortfolioRepository.js
│   ├── ui/
│   │   ├── UIController.js
│   │   └── styles.css
│   ├── data/
│   │   ├── profile.json
│   │   ├── projects.json
│   │   ├── skills.json
│   │   └── links.json
│   └── utils/
├── tests/
├── index.html
├── package.json
└── README.md
```

## 6. Map and data model

Use Tiled layers with clear names: - `Ground`: grass, dirt, water
base. - `GroundDetails`: flowers, patches, small non-blocking detail. -
`Paths`: roads and walkable stone. - `Buildings`: visual building
layers. - `Props`: fences, trees, rocks, stalls. - `Collision`:
tile/object collision data. - `Interactables`: object layer with IDs and
properties. - `SpawnPoints`: player and optional NPC spawn positions. -
`AbovePlayer`: roof canopies or objects that should render above the
player.

Suggested object properties: - `id`: unique stable identifier. - `type`:
`npc`, `building`, `sign`, or `object`. - `interactionId`: ID resolved
by InteractionSystem. - `label`: short interaction label. - `collides`:
boolean where relevant. - `portfolioTarget`: optional content ID. -
`dialogueId`: optional dialogue content ID.

Portfolio data examples: - `projects.json`: `id`, `title`, `summary`,
`technologies`, `thumbnail`, `demoUrl`, `sourceUrl`, `featured`. -
`skills.json`: `id`, `name`, `category`, `description`, `icon`. -
`profile.json`: `displayName`, `role`, `bio`, `education`,
`experience`. - `links.json`: `email`, `github`, `linkedin`,
`resumeUrl`.

Do not invent real portfolio claims or URLs. Use clearly marked
placeholders until supplied by the maintainer.

## 7. Physics and controls

Use Phaser Arcade Physics for player movement and collision if it suits
the map. Set the player's collision body smaller than the visible
sprite, typically aligned to the feet. Use a consistent world coordinate
system and integer-friendly pixel scaling.

Normalize all control sources: - Keyboard: WASD and arrow keys; `E` or
`Enter` to interact; `Esc` to pause/close. - Touch: D-pad or joystick
plus action button. - Pointer: tap/click destination to move if
pathfinding is implemented; otherwise use click-to-interact and preserve
keyboard/touch movement. - Prevent page scrolling while actively using
the game controls, without blocking normal page scrolling outside the
game.

## 8. APIs, backend, and authentication

No backend API, database, authentication, or authorization is needed for
the MVP. All portfolio content is public static data. External links are
navigational links, not API integrations.

If a backend is introduced later, document the reason, data retention,
API contracts, authentication, authorization, and privacy implications
before implementation.

## 9. Error handling and security

-   Show a friendly error screen if essential assets or the map cannot
    load.
-   Log actionable development errors; do not leave silent failures.
-   Guard against unknown interaction IDs and missing optional data.
-   Validate external links and use `rel="noopener noreferrer"` for
    links opened in a new tab.
-   Do not store secrets in frontend code.
-   Avoid injecting untrusted content through `innerHTML`; render text
    safely.
-   Do not collect or transmit visitor information in the MVP.

## 10. Deployment

-   Run `npm run build` for production.
-   Test the generated `dist/` directory with a local preview.
-   Deploy static output to the chosen host.
-   Configure Vite's `base` for the hosting path when needed.
-   Verify HTTPS, asset paths, refresh behavior, mobile input, and a
    full portfolio journey after deployment.
