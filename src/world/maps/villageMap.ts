import type { VillageBuilding, VillageProp, WorldPoint, WaterBody } from '../worldTypes';

// Compact cozy farming village — 2048 × 1536 world
// Player at 0.35 scale (50×62 px display) appears correctly sized against
// 128-px paths, 160-px buildings and 90-px trees.
export const VILLAGE = {
  width: 2048,
  height: 1536,
  spawn: { x: 1024, y: 1380 } as WorldPoint,

  // ── Connected hand-drawn path network ─────────────────────────────────────
  paths: [
    // 1. South entrance path (spawn → village center)
    [{ x: 1024, y: 1420 }, { x: 1024, y: 1320 }, { x: 1024, y: 1150 }, { x: 1024, y: 960 }],

    // 2. Center crossroads loop around farm market
    [{ x: 1024, y: 960 }, { x: 860, y: 900 }, { x: 760, y: 800 }, { x: 860, y: 700 }, { x: 1024, y: 660 }, { x: 1188, y: 700 }, { x: 1288, y: 800 }, { x: 1188, y: 900 }, { x: 1024, y: 960 }],

    // 3. North path to Projects Workshop
    [{ x: 1024, y: 660 }, { x: 1024, y: 520 }, { x: 1024, y: 380 }],

    // 4. Northwest path to Skills Library
    [{ x: 860, y: 700 }, { x: 680, y: 620 }, { x: 500, y: 520 }, { x: 360, y: 460 }],

    // 5. West path to About Me Cottage
    [{ x: 760, y: 800 }, { x: 580, y: 800 }, { x: 420, y: 800 }, { x: 280, y: 820 }],

    // 6. Northeast path to Experience Guild Hall
    [{ x: 1188, y: 700 }, { x: 1400, y: 620 }, { x: 1580, y: 540 }, { x: 1720, y: 480 }],

    // 7. East path to Services Market
    [{ x: 1288, y: 800 }, { x: 1460, y: 800 }, { x: 1640, y: 810 }, { x: 1780, y: 820 }],

    // 8. Southeast path to Contact Inn
    [{ x: 1188, y: 900 }, { x: 1360, y: 980 }, { x: 1520, y: 1080 }, { x: 1660, y: 1150 }],

    // 9. Southwest path to pond area
    [{ x: 860, y: 900 }, { x: 700, y: 1000 }, { x: 560, y: 1120 }, { x: 440, y: 1220 }],

    // 10. South border path (east)
    [{ x: 1024, y: 1320 }, { x: 1200, y: 1340 }, { x: 1380, y: 1360 }, { x: 1520, y: 1350 }],
  ] as WorldPoint[][],

  // ── Portfolio Buildings ────────────────────────────────────────────────────
  buildings: [
    {
      id: 'about',
      label: 'About Me Cottage',
      texture: 'building-about-me',
      x: 180,
      y: 640,
      width: 220,
      height: 230,
      door: { x: 290, y: 820 },
      collision: [
        { x: 190, y: 780, width: 70, height: 50 },
        { x: 330, y: 780, width: 70, height: 50 },
      ],
    },
    {
      id: 'projects',
      label: 'Projects Workshop',
      texture: 'building-projects',
      x: 914,
      y: 220,
      width: 220,
      height: 230,
      door: { x: 1024, y: 380 },
      collision: [
        { x: 924, y: 360, width: 70, height: 50 },
        { x: 1064, y: 360, width: 70, height: 50 },
      ],
    },
    {
      id: 'skills',
      label: 'Skills Library',
      texture: 'building-skills',
      x: 248,
      y: 320,
      width: 220,
      height: 230,
      door: { x: 358, y: 460 },
      collision: [
        { x: 258, y: 440, width: 70, height: 50 },
        { x: 398, y: 440, width: 70, height: 50 },
      ],
    },
    {
      id: 'experience',
      label: 'Experience Guild Hall',
      texture: 'building-guild-hall',
      x: 1612,
      y: 320,
      width: 220,
      height: 230,
      door: { x: 1722, y: 480 },
      collision: [
        { x: 1622, y: 460, width: 70, height: 50 },
        { x: 1762, y: 460, width: 70, height: 50 },
      ],
    },
    {
      id: 'services',
      label: 'Services Market',
      texture: 'building-services',
      x: 1672,
      y: 660,
      width: 220,
      height: 230,
      door: { x: 1782, y: 820 },
      collision: [
        { x: 1682, y: 800, width: 70, height: 50 },
        { x: 1822, y: 800, width: 70, height: 50 },
      ],
    },
    {
      id: 'contact',
      label: 'Contact Inn',
      texture: 'building-contact',
      x: 1552,
      y: 1000,
      width: 220,
      height: 230,
      door: { x: 1662, y: 1150 },
      collision: [
        { x: 1562, y: 1130, width: 70, height: 50 },
        { x: 1702, y: 1130, width: 70, height: 50 },
      ],
    },
    {
      id: 'house1',
      label: 'Farmhand Cottage',
      texture: 'building-house-1',
      x: 820,
      y: 1280,
      width: 180,
      height: 180,
      door: { x: 910, y: 1380 },
      collision: [
        { x: 830, y: 1360, width: 55, height: 40 },
        { x: 960, y: 1360, width: 55, height: 40 },
      ],
    },
    {
      id: 'house2',
      label: 'Village Homestead',
      texture: 'building-house-2',
      x: 1160,
      y: 1280,
      width: 180,
      height: 180,
      door: { x: 1250, y: 1380 },
      collision: [
        { x: 1170, y: 1360, width: 55, height: 40 },
        { x: 1300, y: 1360, width: 55, height: 40 },
      ],
    },
  ] as VillageBuilding[],

  // ── Water bodies ──────────────────────────────────────────────────────────
  waterBodies: [
    {
      id: 'pond',
      type: 'pond' as const,
      x: 380,
      y: 1080,
      width: 280,
      height: 200,
    },
    {
      id: 'stream',
      type: 'river' as const,
      x: 1900,
      y: 768,
      width: 100,
      height: 1536,
    },
  ] as WaterBody[],

  // ── Bridges ───────────────────────────────────────────────────────────────
  bridges: [
    { id: 'bridge-east', x: 1900, y: 820, width: 100, height: 60, orientation: 'horizontal' as const },
    { id: 'bridge-east-2', x: 1900, y: 1150, width: 100, height: 60, orientation: 'horizontal' as const },
  ],

  // ── Props ─────────────────────────────────────────────────────────────────
  props: [
    // Central fountain at village crossroads
    { texture: 'prop-fountain', x: 1024, y: 800, depth: 'sort' as const, collision: { width: 70, height: 60 } },

    // Village entrance arch at south
    { texture: 'prop-arch', x: 1024, y: 1460, depth: 'sort' as const, collision: { width: 100, height: 20 } },

    // Fishing dock at pond
    { texture: 'prop-dock', x: 450, y: 1130, depth: 'sort' as const },
    { texture: 'prop-boat', x: 340, y: 1110, depth: 'sort' as const, collision: { width: 50, height: 35 } },

    // Street lamps — placed at path intersections & building fronts
    ...[
      [1024, 1260], [1024, 1080],
      [960, 800], [1088, 800],
      [960, 640], [1088, 640],
      [370, 480], [520, 800],
      [1680, 500], [1740, 820],
      [1600, 1100],
      [860, 940], [1188, 940],
    ].map(([x, y]) => ({ texture: 'prop-lamp', x, y, depth: 'sort' as const, collision: { width: 14, height: 14 } })),

    // Benches near fountain and paths
    { texture: 'prop-bench', x: 900, y: 800, depth: 'sort' as const, collision: { width: 44, height: 18 } },
    { texture: 'prop-bench', x: 1148, y: 800, depth: 'sort' as const, collision: { width: 44, height: 18 } },
    { texture: 'prop-bench', x: 1024, y: 1020, depth: 'sort' as const, collision: { width: 44, height: 18 } },

    // ── Fences enclosing crop plots (east farm area) ────────────────────────
    // Crop plot 1 — north crop field (top side)
    ...[
      [1090, 1180], [1150, 1180], [1210, 1180],
      // right side handled by vertical fences → use prop-fence-v for sides
    ].map(([x, y]) => ({ texture: 'prop-fence-h', x, y, depth: 'sort' as const, collision: { width: 60, height: 16 } })),

    // Fence around about-me area
    ...[
      [200, 580], [260, 580], [320, 580],
    ].map(([x, y]) => ({ texture: 'prop-fence-h', x, y, depth: 'sort' as const, collision: { width: 60, height: 16 } })),

    // ── Trees — perimeter + grove clusters ────────────────────────────────
    ...[
      // North border
      [100, 100], [240, 80], [400, 100], [560, 80], [720, 100], [880, 80],
      [1160, 80], [1320, 100], [1480, 80], [1640, 100], [1800, 80], [1960, 100],
      // West border
      [80, 280], [80, 460], [80, 640], [80, 820], [80, 1000], [80, 1180], [80, 1380],
      // East border (left of stream)
      [1820, 280], [1820, 460], [1820, 640],
      // South border
      [120, 1460], [300, 1480], [500, 1460], [700, 1480],
      [1380, 1480], [1580, 1460], [1780, 1480], [1920, 1460],
      // Village groves and clusters
      [310, 700], [340, 880], [300, 1100], [440, 360], [600, 300],
      [1480, 360], [1580, 260], [1440, 620],
      [680, 1000], [620, 1200], [1340, 1060], [1400, 1200],
      [760, 480], [800, 280], [1200, 280], [1240, 480],
    ].map(([x, y], i) => ({
      texture: i % 3 === 0 ? 'prop-tree-pine' : 'prop-tree-oak',
      x, y,
      depth: 'sort' as const,
      collision: { width: 30, height: 22 },
    })),

    // ── Bushes — decorative borders and garden edges ─────────────────────
    ...[
      [380, 820], [480, 820], [560, 700], [540, 500],
      [1460, 820], [1560, 700], [1560, 900],
      [900, 1040], [1148, 1040],
      [900, 620], [1148, 620],
      [780, 700], [1270, 700],
      [740, 900], [1310, 900],
      [1680, 1060], [1560, 1060],
      [520, 1060], [640, 1060],
    ].map(([x, y]) => ({ texture: 'prop-bush', x, y, depth: 'sort' as const, collision: { width: 28, height: 18 } })),

    // ── Flowerbeds — along paths and building gardens ─────────────────────
    ...[
      // Around fountain plaza
      [940, 740], [1108, 740], [940, 860], [1108, 860],
      // Along south entrance
      [980, 1200], [1068, 1200],
      // Near buildings
      [290, 880], [1024, 420], [358, 500], [1722, 520],
      [1782, 860], [1662, 1190],
      // South cottages gardens
      [870, 1270], [1210, 1270],
    ].map(([x, y]) => ({ texture: 'prop-flowerbed', x, y, depth: 'ground' as const })),
  ] as VillageProp[],

  // ── Village points of interest (for minimap + zone system) ───────────────
  pointsOfInterest: [
    { id: 'fountain', label: 'Central Fountain', x: 1024, y: 800 },
    { id: 'about', label: 'About Me Cottage', x: 290, y: 820 },
    { id: 'projects', label: 'Projects Workshop', x: 1024, y: 380 },
    { id: 'skills', label: 'Skills Library', x: 358, y: 460 },
    { id: 'experience', label: 'Experience Guild Hall', x: 1722, y: 480 },
    { id: 'services', label: 'Services Market', x: 1782, y: 820 },
    { id: 'contact', label: 'Contact Inn', x: 1662, y: 1150 },
    { id: 'pond', label: 'Tranquil Pond', x: 440, y: 1120 },
  ],
} as const;
