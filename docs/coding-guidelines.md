# PixelQuest --- Coding Guidelines

## 1. General rules

-   Prefer simple, readable JavaScript ES modules.
-   Follow existing patterns before introducing new ones.
-   Make small, focused changes; do not rewrite working modules without
    a clear reason.
-   Do not duplicate movement, dialogue, interaction, or portfolio logic
    across scenes.
-   Do not claim a feature is complete unless it has been run and
    verified.
-   Update `memory.md` and `task-tracker.md` after meaningful changes.

## 2. Naming and formatting

-   Classes: `PascalCase` (for example, `VillageScene`).
-   Functions and variables: `camelCase`.
-   Constants: `UPPER_SNAKE_CASE` for true shared constants.
-   Files: use clear names such as `InputController.js` and
    `DialogueSystem.js`.
-   Prefer descriptive names over abbreviations.
-   Use consistent formatting and semicolons according to the
    repository's established style.

## 3. Separation of concerns

-   Scenes manage scene lifecycle and compose systems.
-   InputController normalizes keyboard, pointer, and touch input.
-   InteractionSystem detects and dispatches interactions.
-   DialogueSystem manages dialogue state and presentation.
-   PortfolioRepository loads and validates static portfolio data.
-   UI components should not directly manipulate unrelated scene
    internals.
-   Map-specific data belongs in Tiled maps or structured data, not
    scattered magic numbers.

## 4. Phaser practices

-   Use Phaser lifecycle methods correctly; clean up listeners and
    timers when scenes stop or shut down.
-   Avoid creating duplicate event handlers on every scene restart.
-   Use Arcade Physics consistently for movement and collisions where
    suitable.
-   Keep the collision body aligned with the character's feet rather
    than the entire transparent sprite.
-   Configure camera bounds to match the map.
-   Use `setScale`/game scaling deliberately and preserve pixel
    sharpness.
-   Verify sprite-sheet dimensions before setting frame widths or
    animation indices.
-   Keep world-space entities separate from camera-fixed UI elements.

## 5. Input and state

-   Normalize keyboard and touchscreen input into one movement/action
    interface.
-   Support releasing keys and touch pointers reliably, including
    `pointerup`, `pointerupoutside`, cancellation, window blur, and
    orientation changes as relevant.
-   Do not allow stuck directional input after a touch ends.
-   Pause or gate movement when a blocking menu/dialogue is open.
-   Ensure action input does not fire repeatedly unless intended.
-   Avoid conflicting inputs from keyboard, joystick, and D-pad.
-   Implement click-to-navigate as a real movement/pathfinding feature
    or label it as a limited interaction behavior; do not pretend direct
    teleportation is navigation.

## 6. Data and validation

-   Keep portfolio content in data files.
-   Validate required fields such as project IDs and titles.
-   Treat optional images and links as optional; display a fallback when
    absent.
-   Do not invent real biography, achievements, skill levels, contact
    details, or project URLs.
-   Validate external URL schemes and avoid executing content from data
    files.
-   Render user-facing strings as text; do not inject untrusted strings
    into `innerHTML`.

## 7. Error handling

-   Fail clearly if required map or player assets are missing.
-   Handle unknown interaction IDs without crashing.
-   Show useful fallback UI for missing optional content.
-   Avoid empty `catch` blocks.
-   Development logs should explain which asset, interaction, or
    operation failed.
-   Do not expose sensitive implementation details to visitors.

## 8. Dependencies and environment

-   Prefer native browser APIs and Phaser features over unnecessary
    dependencies.
-   Add dependencies only when they solve a real requirement.
-   Commit the package lockfile.
-   Do not put API keys or secrets in client-side environment variables.
-   Static portfolio links and content should not require a backend.
-   Document any new dependency and why it is necessary.

## 9. UI and responsive behavior

-   Keep HTML overlays semantic and keyboard accessible.
-   Use accessible names for icon-only controls.
-   Respect device safe areas.
-   Prevent page scrolling only while the user is actively interacting
    with game controls.
-   Ensure mobile controls do not obscure dialogue or essential map
    details.
-   Use CSS variables from `design.md` rather than scattering colors
    throughout styles.
-   Provide visible focus, pressed, selected, and disabled states.

## 10. Testing and change management

-   Run the relevant tests and build after code changes.
-   Test both desktop and mobile input after modifying controls.
-   Test a full user journey after changing scene transitions or
    portfolio panels.
-   Review browser console and network requests.
-   Do not delete or rename user assets without checking references.
-   Before a broad refactor, explain the problem, expected benefit,
    affected files, and risk.
-   Update `task-tracker.md` statuses only after verification.
