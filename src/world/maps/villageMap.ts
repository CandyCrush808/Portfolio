import type { VillageBuilding, VillageProp, WorldPoint, WaterBody } from '../worldTypes';

export const VILLAGE = {
  width: 4096,
  height: 3072,
  spawn: { x: 2048, y: 2650 } as WorldPoint,

  // Connected hand-drawn path network
  paths: [
    // 1. Southern Entrance Avenue (Spawn to Plaza)
    [{ x: 2048, y: 2750 }, { x: 2048, y: 2650 }, { x: 2048, y: 2350 }, { x: 2048, y: 1950 }, { x: 2048, y: 1660 }],

    // 2. Main Plaza Circular Loop
    [{ x: 2048, y: 1660 }, { x: 1860, y: 1560 }, { x: 1820, y: 1440 }, { x: 1860, y: 1320 }, { x: 2048, y: 1220 }, { x: 2236, y: 1320 }, { x: 2276, y: 1440 }, { x: 2236, y: 1560 }, { x: 2048, y: 1660 }],

    // 3. North path to Projects Workshop
    [{ x: 2048, y: 1220 }, { x: 2048, y: 1040 }, { x: 2048, y: 880 }],

    // 4. Northwest path to Skills Library & Decorative House 1
    [{ x: 2048, y: 1040 }, { x: 1680, y: 1000 }, { x: 1368, y: 900 }],
    [{ x: 1368, y: 900 }, { x: 1020, y: 920 }, { x: 648, y: 960 }],

    // 5. Northeast path to Experience Guild Hall
    [{ x: 2048, y: 1040 }, { x: 2420, y: 980 }, { x: 2848, y: 860 }],

    // 6. West path to About Me Cottage & Decorative House 2
    [{ x: 1820, y: 1440 }, { x: 1450, y: 1480 }, { x: 1068, y: 1540 }],
    [{ x: 1068, y: 1540 }, { x: 800, y: 1580 }, { x: 508, y: 1700 }],

    // 7. Southwest path from About Me to Tranquil Pond & Fishing Dock
    [{ x: 1068, y: 1540 }, { x: 1068, y: 1850 }, { x: 1000, y: 2180 }],

    // 8. East path to Services Market
    [{ x: 2276, y: 1440 }, { x: 2460, y: 1480 }, { x: 2648, y: 1540 }],

    // 9. South path from Services Market to Contact Inn
    [{ x: 2648, y: 1540 }, { x: 2720, y: 1850 }, { x: 2808, y: 2220 }],

    // 10. Southwest path from Contact Inn back to Main Avenue
    [{ x: 2808, y: 2220 }, { x: 2500, y: 2360 }, { x: 2048, y: 2450 }],

    // 11. Paths to River Bridges
    [{ x: 2848, y: 860 }, { x: 3150, y: 700 }, { x: 3450, y: 500 }], // Northeast Bridge
    [{ x: 2648, y: 1540 }, { x: 2980, y: 1460 }, { x: 3300, y: 1380 }], // Eastern Market Bridge
    [{ x: 2808, y: 2220 }, { x: 3050, y: 2380 }, { x: 3250, y: 2450 }], // Southeast River Bridge
  ] as WorldPoint[][],

  buildings: [
    {
      id: 'about',
      label: 'About Me Cottage',
      texture: 'building-about-me',
      x: 920,
      y: 1220,
      width: 296,
      height: 320,
      door: { x: 1068, y: 1540 },
      collision: [
        { x: 935, y: 1400, width: 100, height: 130 },
        { x: 1105, y: 1400, width: 100, height: 130 },
      ],
    },
    {
      id: 'projects',
      label: 'Projects Workshop',
      texture: 'building-projects',
      x: 1900,
      y: 560,
      width: 296,
      height: 320,
      door: { x: 2048, y: 880 },
      collision: [
        { x: 1915, y: 740, width: 100, height: 130 },
        { x: 2085, y: 740, width: 100, height: 130 },
      ],
    },
    {
      id: 'skills',
      label: 'Skills Library',
      texture: 'building-skills',
      x: 1220,
      y: 580,
      width: 296,
      height: 320,
      door: { x: 1368, y: 900 },
      collision: [
        { x: 1235, y: 760, width: 100, height: 130 },
        { x: 1405, y: 760, width: 100, height: 130 },
      ],
    },
    {
      id: 'experience',
      label: 'Experience Guild Hall',
      texture: 'building-guild-hall',
      x: 2700,
      y: 540,
      width: 296,
      height: 320,
      door: { x: 2848, y: 860 },
      collision: [
        { x: 2715, y: 720, width: 100, height: 130 },
        { x: 2885, y: 720, width: 100, height: 130 },
      ],
    },
    {
      id: 'services',
      label: 'Services Market',
      texture: 'building-services',
      x: 2500,
      y: 1220,
      width: 296,
      height: 320,
      door: { x: 2648, y: 1540 },
      collision: [
        { x: 2515, y: 1400, width: 100, height: 130 },
        { x: 2685, y: 1400, width: 100, height: 130 },
      ],
    },
    {
      id: 'contact',
      label: 'Contact Inn',
      texture: 'building-contact',
      x: 2660,
      y: 1900,
      width: 296,
      height: 320,
      door: { x: 2808, y: 2220 },
      collision: [
        { x: 2675, y: 2080, width: 100, height: 130 },
        { x: 2845, y: 2080, width: 100, height: 130 },
      ],
    },
    {
      id: 'house1',
      label: 'Decorative Cottage 1',
      texture: 'building-house-1',
      x: 500,
      y: 640,
      width: 296,
      height: 320,
      door: { x: 648, y: 960 },
      collision: [
        { x: 515, y: 820, width: 100, height: 130 },
        { x: 685, y: 820, width: 100, height: 130 },
      ],
    },
    {
      id: 'house2',
      label: 'Decorative Cottage 2',
      texture: 'building-house-2',
      x: 360,
      y: 1380,
      width: 296,
      height: 320,
      door: { x: 508, y: 1700 },
      collision: [
        { x: 375, y: 1560, width: 100, height: 130 },
        { x: 545, y: 1560, width: 100, height: 130 },
      ],
    },
  ] as VillageBuilding[],

  waterBodies: [
    {
      id: 'pond',
      type: 'pond',
      x: 950,
      y: 2300,
      width: 680,
      height: 440,
    },
    {
      id: 'river-main',
      type: 'river',
      x: 3420,
      y: 1536,
      width: 220,
      height: 3072,
    },
    {
      id: 'waterfall-ne',
      type: 'waterfall',
      x: 3480,
      y: 80,
      width: 140,
      height: 160,
    },
    {
      id: 'waterfall-sw',
      type: 'waterfall',
      x: 520,
      y: 2250,
      width: 140,
      height: 140,
    },
  ] as WaterBody[],

  bridges: [
    { id: 'bridge-ne', x: 3450, y: 500, width: 160, height: 70, orientation: 'horizontal' as const },
    { id: 'bridge-e', x: 3300, y: 1380, width: 160, height: 70, orientation: 'horizontal' as const },
    { id: 'bridge-se', x: 3250, y: 2450, width: 70, height: 160, orientation: 'vertical' as const },
  ],

  props: [
    // Stone Fountain in Main Plaza
    { texture: 'prop-fountain', x: 2048, y: 1440, depth: 'sort' as const, collision: { width: 90, height: 80 } },

    // Entrance Arch & Steps
    { texture: 'prop-arch', x: 2048, y: 2520, depth: 'sort' as const, collision: { width: 120, height: 24 } },
    { texture: 'stone-steps', x: 2048, y: 2800, depth: 'ground' as const },

    // Fishing Dock & Rowboat
    { texture: 'prop-dock', x: 1000, y: 2220, depth: 'sort' as const, collision: { width: 50, height: 80 } },
    { texture: 'prop-boat', x: 3150, y: 2480, depth: 'sort' as const, collision: { width: 60, height: 40 } },

    // Streetlamps along paths and plaza
    { texture: 'prop-lamp', x: 2000, y: 2600, depth: 'sort' as const, collision: { width: 16, height: 16 } },
    { texture: 'prop-lamp', x: 2096, y: 2600, depth: 'sort' as const, collision: { width: 16, height: 16 } },
    { texture: 'prop-lamp', x: 2000, y: 2150, depth: 'sort' as const, collision: { width: 16, height: 16 } },
    { texture: 'prop-lamp', x: 2096, y: 2150, depth: 'sort' as const, collision: { width: 16, height: 16 } },
    { texture: 'prop-lamp', x: 1940, y: 1380, depth: 'sort' as const, collision: { width: 16, height: 16 } },
    { texture: 'prop-lamp', x: 2156, y: 1380, depth: 'sort' as const, collision: { width: 16, height: 16 } },
    { texture: 'prop-lamp', x: 1940, y: 1500, depth: 'sort' as const, collision: { width: 16, height: 16 } },
    { texture: 'prop-lamp', x: 2156, y: 1500, depth: 'sort' as const, collision: { width: 16, height: 16 } },
    { texture: 'prop-lamp', x: 1980, y: 920, depth: 'sort' as const, collision: { width: 16, height: 16 } },
    { texture: 'prop-lamp', x: 2116, y: 920, depth: 'sort' as const, collision: { width: 16, height: 16 } },
    { texture: 'prop-lamp', x: 1300, y: 940, depth: 'sort' as const, collision: { width: 16, height: 16 } },
    { texture: 'prop-lamp', x: 2780, y: 900, depth: 'sort' as const, collision: { width: 16, height: 16 } },
    { texture: 'prop-lamp', x: 2580, y: 1580, depth: 'sort' as const, collision: { width: 16, height: 16 } },
    { texture: 'prop-lamp', x: 2740, y: 2260, depth: 'sort' as const, collision: { width: 16, height: 16 } },
    { texture: 'prop-lamp', x: 1000, y: 1580, depth: 'sort' as const, collision: { width: 16, height: 16 } },
    { texture: 'prop-lamp', x: 3340, y: 530, depth: 'sort' as const, collision: { width: 16, height: 16 } },
    { texture: 'prop-lamp', x: 3190, y: 1410, depth: 'sort' as const, collision: { width: 16, height: 16 } },

    // Benches in plaza and along paths
    { texture: 'prop-bench', x: 1880, y: 1440, depth: 'sort' as const, collision: { width: 44, height: 20 } },
    { texture: 'prop-bench', x: 2216, y: 1440, depth: 'sort' as const, collision: { width: 44, height: 20 } },
    { texture: 'prop-bench', x: 2048, y: 1720, depth: 'sort' as const, collision: { width: 44, height: 20 } },
    { texture: 'prop-bench', x: 1068, y: 1630, depth: 'sort' as const, collision: { width: 44, height: 20 } },
    { texture: 'prop-bench', x: 2650, y: 2260, depth: 'sort' as const, collision: { width: 44, height: 20 } },

    // Fences
    ...[
      [820, 1180], [884, 1180], [1220, 1180], [1284, 1180],
      [400, 600], [464, 600], [800, 600], [864, 600],
      [1800, 520], [1864, 520], [2200, 520], [2264, 520],
      [2600, 500], [2664, 500], [3000, 500], [3064, 500],
      [2400, 1180], [2464, 1180], [2800, 1180], [2864, 1180],
      [1940, 2480], [2156, 2480],
    ].map(([x, y]) => ({ texture: 'prop-fence-h', x, y, depth: 'sort' as const, collision: { width: 64, height: 18 } })),

    // Trees (Oak and Pine) forming borders and village groves
    ...[
      // Northern border forest
      [200, 200], [380, 180], [560, 210], [740, 170], [920, 190], [1100, 170], [1280, 200],
      [1460, 180], [1640, 210], [1820, 190], [2000, 180], [2180, 210], [2360, 180], [2540, 200],
      [2720, 180], [2900, 210], [3080, 190], [3260, 200],
      // Western border forest
      [180, 400], [160, 600], [190, 800], [170, 1000], [180, 1200], [160, 1400], [180, 1600],
      [190, 1800], [170, 2000], [180, 2500], [190, 2750], [200, 2950],
      // Southern border forest
      [400, 2950], [600, 2970], [800, 2950], [1000, 2960], [1200, 2950], [1400, 2970], [1600, 2950],
      [1800, 2960], [2300, 2960], [2500, 2950], [2700, 2970], [2900, 2950], [3100, 2960],
      // Eastern border beyond river
      [3750, 400], [3800, 700], [3760, 1000], [3800, 1300], [3750, 1600], [3800, 1900], [3760, 2200], [3800, 2500], [3750, 2800],
      // Village groves
      [600, 1150], [750, 1320], [1450, 1250], [1600, 1150], [1650, 1350], [1550, 750],
      [2380, 750], [2450, 1050], [2350, 1320], [2450, 1700], [2950, 1650], [3100, 1850],
      [1450, 1750], [1650, 1950], [1500, 2200], [1700, 2400], [2350, 2200], [2550, 2500],
      [750, 1950], [650, 2550], [1250, 2550], [1400, 2400],
    ].map(([x, y], i) => ({
      texture: i % 2 === 0 ? 'prop-tree-oak' : 'prop-tree-pine',
      x,
      y,
      depth: 'sort' as const,
      collision: { width: 36, height: 26 },
    })),

    // Bushes and shrubs
    ...[
      [860, 1540], [1260, 1540], [1820, 880], [2270, 880], [1150, 900], [1550, 900],
      [2620, 860], [3020, 860], [2420, 1540], [2820, 1540], [2580, 2220], [2980, 2220],
      [1940, 1750], [2156, 1750], [1750, 1440], [2346, 1440], [1980, 2680], [2116, 2680],
    ].map(([x, y]) => ({ texture: 'prop-bush', x, y, depth: 'sort' as const, collision: { width: 32, height: 20 } })),

    // Flowerbeds along paths and gardens
    ...[
      [1920, 1600], [2176, 1600], [1920, 1280], [2176, 1280],
      [1980, 1950], [2116, 1950], [1980, 2350], [2116, 2350],
      [1068, 1420], [2648, 1420], [2808, 2100], [1368, 800], [2848, 760],
    ].map(([x, y]) => ({ texture: 'prop-flowerbed', x, y, depth: 'ground' as const })),
  ] as VillageProp[],

  pointsOfInterest: [
    { id: 'fountain', label: 'Central Fountain', x: 2048, y: 1440 },
    { id: 'about', label: 'About Me Cottage', x: 1068, y: 1540 },
    { id: 'projects', label: 'Projects Workshop', x: 2048, y: 880 },
    { id: 'skills', label: 'Skills Library', x: 1368, y: 900 },
    { id: 'experience', label: 'Experience Guild Hall', x: 2848, y: 860 },
    { id: 'services', label: 'Services Market', x: 2648, y: 1540 },
    { id: 'contact', label: 'Contact Inn', x: 2808, y: 2220 },
    { id: 'pond', label: 'Tranquil Pond', x: 1000, y: 2220 },
  ],
} as const;
