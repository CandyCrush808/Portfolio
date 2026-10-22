export interface WorldPoint {
  x: number;
  y: number;
}

export interface VillageBuilding {
  id: string;
  label: string;
  texture: string;
  x: number;
  y: number;
  width: number;
  height: number;
  door: { x: number; y: number };
  collision: Array<{ x: number; y: number; width: number; height: number }>;
}

export interface VillageProp {
  id?: string;
  texture: string;
  x: number;
  y: number;
  depth: 'ground' | 'sort' | number;
  scale?: number;
  tint?: number;
  collision?: { width: number; height: number; offsetX?: number; offsetY?: number };
}

export interface WaterBody {
  id: string;
  type: 'river' | 'pond' | 'waterfall';
  x: number;
  y: number;
  width: number;
  height: number;
}
