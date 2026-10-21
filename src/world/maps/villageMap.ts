import type { VillageBuilding, VillageProp, WorldPoint } from '../worldTypes';

export const VILLAGE = {
  width: 1600, height: 1120,
  spawn: { x: 800, y: 770 } as WorldPoint,
  // Waypoints describe the main walkable route from spawn to the village square.
  paths: [
    [{ x: 800, y: 770 }, { x: 800, y: 640 }, { x: 800, y: 525 }, { x: 800, y: 460 }],
    [{ x: 800, y: 525 }, { x: 520, y: 525 }, { x: 300, y: 525 }, { x: 300, y: 620 }],
    [{ x: 800, y: 525 }, { x: 1080, y: 525 }, { x: 1300, y: 525 }],
    [{ x: 800, y: 640 }, { x: 700, y: 820 }, { x: 700, y: 980 }, { x: 590, y: 980 }],
    [{ x: 800, y: 640 }, { x: 900, y: 820 }, { x: 900, y: 980 }, { x: 1024, y: 980 }],
  ] as WorldPoint[][],
  buildings: [
    { id: 'portfolio', label: 'Portfolio Hall', texture: 'building-hall', x: 684, y: 205, width: 236, height: 237, collision: [{x:715,y:368,width:64,height:63},{x:825,y:368,width:64,height:63}] },
    { id: 'skills', label: 'Skills Forge', texture: 'building-forge', x: 185, y: 375, width: 227, height: 231, collision: [{x:218,y:535,width:54,height:62},{x:324,y:535,width:54,height:62}] },
    { id: 'about', label: 'About Cottage', texture: 'building-cottage', x: 492, y: 672, width: 180, height: 242, collision: [{x:520,y:843,width:44,height:62},{x:601,y:843,width:44,height:62}] },
    { id: 'contact', label: 'Contact House', texture: 'building-house', x: 950, y: 672, width: 146, height: 243, collision: [{x:974,y:843,width:34,height:62},{x:1040,y:843,width:34,height:62}] },
  ] as VillageBuilding[],
  props: [
    ...[[105,170],[245,155],[1330,160],[1470,285],[1400,820],[1280,950],[250,940],[110,770],[475,280],[1160,300],[350,760],[1240,700]].map(([x,y])=>({texture:'tree',x,y,depth:'sort' as const,collision:{width:28,height:22}})),
    ...[[650,570],[925,570],[540,600],[1060,610],[770,920],[820,930],[1180,445],[450,440]].map(([x,y])=>({texture:'flower',x,y,depth:'ground' as const})),
  ] as VillageProp[],
  pointsOfInterest: [
    { id: 'portfolio', label: 'Portfolio Hall', x: 802, y: 470 },
    { id: 'skills', label: 'Skills Forge', x: 300, y: 620 },
    { id: 'about', label: 'About Cottage', x: 590, y: 950 },
    { id: 'contact', label: 'Contact House', x: 1024, y: 950 },
  ],
  workshopReserved: { x: 1230, y: 365, width: 250, height: 280, note: 'Slate-roof workshop omitted until its mask is verified.' },
  pond: { x: 1320, y: 670, columns: 3, rows: 2, tileWidth: 67, tileHeight: 68 },
} as const;
