export interface WorldPoint { x: number; y: number }
export interface VillageBuilding {
  id: string; label: string; texture: string; x: number; y: number; width: number; height: number;
  /** Explicit solid wall sections leave a door opening between them. */
  collision: Array<{ x: number; y: number; width: number; height: number }>;
}
export interface VillageProp { texture: string; x: number; y: number; depth: 'ground' | 'sort'; collision?: { width: number; height: number } }
