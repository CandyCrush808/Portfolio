# PixelQuest --- Design System

## 1. Design philosophy

PixelQuest should resemble a polished cozy 16-bit top-down RPG: inviting
village architecture, readable paths, warm wood, lush greenery, and
clear UI. The experience is playful but the portfolio content must
remain professional and easy to understand.

The uploaded references establish the desired visual direction: top-down
village exploration, pixel-art buildings, character sprites, and
fantasy-style interface frames. Existing building, player, and
touchscreen UI assets should be reused when they match technical
requirements.

## 2. Visual principles

-   Crisp pixel edges; no blur or unintended anti-aliasing.
-   Consistent sprite scale and logical pixel grid.
-   Use nearest-neighbor scaling for pixel art.
-   Keep the world visually rich but UI panels uncluttered.
-   Make interactable objects discoverable through prompts, outlines, or
    small icons.
-   Do not bake text into image assets.
-   Verify alpha transparency; checkerboard patterns must not appear in
    final gameplay unless intentionally part of an asset.

## 3. Color tokens

``` css
:root {
  --pq-navy: #17172F;
  --pq-panel: #222443;
  --pq-cream: #FFF0CC;
  --pq-gold: #F4C75B;
  --pq-wood: #69402F;
  --pq-blue: #69B8F0;
  --pq-green: #83D17B;
  --pq-red: #E85D5D;
  --pq-grass: #75B85A;
  --pq-path: #B8A58A;
}
```

Use gold for selected/focused elements, not as a large body background.
Red is reserved for warnings or destructive actions.

## 4. Typography

-   Prefer a legible pixel font for short game labels and decorative
    headings.
-   Use a highly readable system or sans-serif font for longer project
    descriptions if the pixel font harms readability.
-   Load font files locally when licensing permits.
-   Keep body text readable on mobile; do not shrink long dialogue
    merely to preserve a decorative frame.
-   Text must be rendered dynamically, never baked into UI sprites.

## 5. Pixel and layout rules

-   Choose a logical game resolution and scale by integer multiples
    where possible.
-   Use `image-rendering: pixelated` for pixel-art images and canvas
    presentation where supported.
-   Keep sprite and tile dimensions consistent with the actual assets;
    do not assume every generated sheet uses the same frame size before
    inspecting it.
-   Use a 4px or 8px spacing rhythm for UI layout.
-   Keep dialogue and menu panels within the visible viewport.
-   Use nine-slice-compatible frames or CSS borders for resizable
    panels.
-   Separate game-world coordinates from screen-space UI coordinates.

## 6. Component specifications

### Dialogue panel

-   Navy body, cream double border, restrained brown shadow.
-   Speaker name strip and optional portrait slot.
-   Continue indicator and optional choice list.
-   Desktop: wide bottom panel.
-   Mobile: compact panel above or beside controls, never covering the
    entire playable view.

### Buttons

-   Normal: navy or timber fill with cream border.
-   Hover/focus: gold edge or gold arrow.
-   Pressed: visibly inset or shifted by a pixel or two.
-   Disabled: reduced contrast while remaining identifiable.
-   Touch targets should be approximately 44 CSS pixels or larger when
    feasible, regardless of source sprite dimensions.

### HUD

-   Minimal location label and optional discovery indicator.
-   Avoid combat-style health bars unless the game actually uses them.
-   Keep essential navigation accessible without overwhelming the
    environment.

### Touch controls

-   D-pad or joystick on the lower-left.
-   Interaction/action button on the lower-right.
-   Pause/menu near the top edge.
-   Respect device safe areas and avoid blocking dialogue.
-   Controls should have clear pressed states and enough spacing to
    avoid accidental touches.

### Portfolio panels

-   Project title, thumbnail, summary, technology tags, and genuine
    demo/source links.
-   Skills and about sections use the same panel language but prioritize
    content hierarchy.
-   Always offer a clear close/back action and a way to return to
    exploration.

## 7. Responsive behavior

-   **Desktop (typically 1024px and wider):** larger game viewport,
    keyboard hints, optional side information panel.
-   **Tablet:** preserve the world view, compact HUD, use touch controls
    when touch input is detected.
-   **Mobile portrait:** keep gameplay controls near bottom corners, use
    compact dialogue and avoid horizontal overflow.
-   **Mobile landscape:** maximize world view and keep controls at the
    edges.
-   Respond to viewport changes dynamically; do not rely only on initial
    screen dimensions.
-   Keep UI anchored to the viewport, not to world coordinates.

## 8. Interaction and motion

-   Use short transitions for menus and panel changes.
-   Animate the player and small UI indicators with crisp frame changes.
-   Avoid blur filters, heavy particles, and expensive full-screen
    effects.
-   Respect `prefers-reduced-motion` for HTML/CSS transitions and avoid
    forcing repeated camera shake.
-   Pause gameplay input when a modal dialogue/menu is active where
    appropriate.

## 9. Accessibility

-   Keyboard-only access for all essential actions.
-   Visible focus state on HTML controls.
-   Sufficient text contrast.
-   Meaningful accessible names for icon-only HTML buttons.
-   Do not rely on color alone to convey state.
-   Provide a controls/help panel and a conventional way to access
    portfolio content.
-   Ensure browser zoom and text scaling do not make overlays unusable.
-   Keep important information out of decorative images.

## 10. Reference direction

Use the user's uploaded top-down village, forest/village scene,
houses/river tileset, building spritesheet, player spritesheet, and
touchscreen UI assets as references. Match their cozy fantasy mood and
pixel-art treatment without copying unrelated branding or embedding
content that is not supplied.

## 11. Design acceptance checklist

-   UI uses consistent palette, borders, spacing, and states.
-   Pixel art remains sharp at all target scales.
-   Dialogue remains readable on small phones.
-   Touch targets are comfortably usable.
-   Transparent assets have real alpha transparency.
-   UI does not obscure the player or critical map interactions
    unnecessarily.
