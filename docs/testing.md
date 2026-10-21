# PixelQuest --- Testing Plan

## 1. Purpose

Verify that PixelQuest is playable, understandable, responsive, and
reliable on Windows desktop browsers and Android mobile browsers.
Testing should cover both game mechanics and portfolio usability.

## 2. Test layers

-   **Unit tests:** pure logic such as portfolio data validation,
    interaction ID resolution, input normalization, and settings
    defaults.
-   **Integration tests:** scene loading, map/object interactions,
    dialogue transitions, and UI-to-game events.
-   **End-to-end tests:** start the game, move, interact, open portfolio
    content, navigate back, and follow an external link.
-   **Manual device tests:** touch behavior, multi-touch, browser safe
    areas, orientation changes, pixel sharpness, and real-world
    performance.

Use Vitest for unit tests and Playwright for browser tests if these
tools are introduced. Do not add test dependencies without checking the
current project setup.

## 3. Critical user journeys

### Journey A --- First visit

1.  Open the deployed site.
2.  See a clear title/start experience or clear instructions.
3.  Start the village.
4.  Learn how to move.
5.  Reach an NPC or building.
6.  Open and close a dialogue or portfolio panel.
7.  Return to exploration.

### Journey B --- Project discovery

1.  Open the Projects location or portfolio menu.
2.  Select a project.
3.  Read its title, description, and technologies.
4.  Open the demo/source link if supplied.
5.  Return to the project list or game.

### Journey C --- Desktop controls

1.  Move using WASD.
2.  Move using arrow keys.
3.  Interact using the configured action key.
4.  Open and close pause/menu overlays.
5.  Use keyboard focus in surrounding HTML controls.

### Journey D --- Android controls

1.  Load the game in a mobile browser.
2.  Move with the D-pad or joystick.
3.  Release the control and verify movement stops.
4.  Move while using the interaction button where supported.
5.  Open dialogue and advance/close it.
6.  Rotate the device and confirm controls reposition.
7.  Verify browser scrolling does not occur accidentally during
    gameplay.

## 4. Functional test cases

  -----------------------------------------------------------------------
  ID                      Test                    Expected result
  ----------------------- ----------------------- -----------------------
  T-01                    Initial load            Menu or playable scene
                                                  appears without fatal
                                                  error

  T-02                    Missing essential asset Friendly error is shown
                                                  and useful details
                                                  logged

  T-03                    Four-direction movement Player moves in all
                                                  intended directions

  T-04                    Animation               Correct directional
                                                  animation plays

  T-05                    Collision               Player cannot cross
                                                  blocked terrain/objects

  T-06                    Camera bounds           Camera remains within
                                                  map bounds

  T-07                    NPC interaction         Correct prompt and
                                                  dialogue appear

  T-08                    Dialogue advance        Next message appears
                                                  without duplicate
                                                  advancement

  T-09                    Dialogue close          Dialogue closes and
                                                  gameplay input resumes

  T-10                    Building interaction    Correct portfolio panel
                                                  opens

  T-11                    Unknown interaction ID  No crash; safe
                                                  fallback/logging occurs

  T-12                    Project data missing    Placeholder is
                          optional image          displayed

  T-13                    External link missing   Button is hidden or
                                                  disabled clearly

  T-14                    Touch release/cancel    Player does not
                                                  continue moving
                                                  unintentionally

  T-15                    Multi-touch             Movement and action
                                                  work together where
                                                  designed

  T-16                    Resize/orientation      UI reflows and remains
                                                  within viewport

  T-17                    Keyboard focus          Focus is visible and
                                                  controls can be reached

  T-18                    Production build        Build completes and
                                                  output loads in preview

  T-19                    Deployed asset paths    No missing assets or
                                                  incorrect base-path
                                                  URLs

  T-20                    Refresh deployed page   Application loads
                                                  correctly after refresh
  -----------------------------------------------------------------------

## 5. Responsive matrix

Test at minimum: - Desktop: 1366 × 768 and 1920 × 1080. - Small
laptop/tablet landscape: approximately 1024 × 768. - Mobile portrait:
360 × 800 and 390 × 844. - Mobile landscape: approximately 844 × 390. -
Android Chrome on a real device where available. - Current Windows
Chrome or Edge.

Check: - No horizontal page overflow. - Dialogue text is not clipped. -
Buttons are large enough to tap. - Touch controls do not cover important
interactions. - UI respects safe areas and orientation changes. - Pixel
art remains crisp. - Browser back/refresh behavior is not broken.

## 6. Accessibility checks

-   All essential actions are possible with keyboard.
-   Focus is visible on HTML buttons and links.
-   Icon-only controls have accessible labels.
-   Text and UI have adequate contrast.
-   State is not communicated by color alone.
-   Text remains readable at browser zoom.
-   Reduced-motion preferences are respected where practical.
-   The visitor can reach portfolio content without relying solely on
    game exploration.

## 7. Performance and reliability

-   Watch for long loading times and unnecessarily large image files.
-   Confirm stable performance during normal exploration on a mid-range
    Android device.
-   Avoid repeated allocation or event-handler creation in update loops.
-   Verify scene changes do not leave duplicate listeners.
-   Check console errors and failed network requests.
-   Test the deployed production build, not only the development server.

## 8. Regression testing

After changes to input, scenes, map layers, asset dimensions, dialogue,
or responsive UI, rerun the directly affected tests and the critical
user journeys. After major changes, rerun the full matrix.

## 9. Village controller verification

The controller implementation is pending browser verification. Start with
`npm run dev`, then check:

1. Use WASD and arrow keys separately and together. Confirm diagonals are
   normalized, releasing keys stops immediately, and tab focus loss does not
   leave movement active.
2. On a touch device, use the lower-left D-pad. On desktop, append
   `?touchControls` to force the D-pad. Hold two directions, slide a finger
   between buttons and off the pad, release, cancel touch, and resize/rotate.
3. Walk to the hall, forge, cottage, and house doors. Try the center door gaps,
   wall edges, trees, pond, and all four world edges. Confirm paths remain clear.
4. Use `?debug` to inspect the player foot body, spawn, solids, boundaries,
   points of interest, facing, and idle/walking state.
5. Repeat at 1366x768, 390x844, and 844x390. Check sprite sharpness, camera
   behavior, D-pad placement, and that the player stays visible.

The inspected preview supports temporary direction assignments for atlas
row 0 (down), row 1 (up), and row 2 columns 0-1 (right profile). Left mirrors
the right profile. The asset manifest still labels full direction semantics
and animation ordering unverified, so the complete atlas has not been
certified. The mobile source crops have unresolved edge residue; the current
D-pad is drawn with Phaser graphics.

Latest checks for this controller change: `npm run typecheck` passes,
`npm run assets:validate` structural checks pass (overall status remains
`NEEDS_MANUAL_REVIEW`), and `npm run build` passes with Vite 7.3.7. No browser
movement, touch, collision, responsive, or screenshot check has been completed
in this environment.

## 10. Definition of done

A feature is complete only when: - Its acceptance criteria in
`project-requirements.md` are met. - It works in the relevant desktop
and mobile contexts. - Loading, missing-data, and error cases are
handled. - No new blocking console errors are introduced. - Existing
critical journeys still pass. - Documentation and task status are
updated. - The production build succeeds before deployment.
