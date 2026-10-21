import assetCatalogData from './assetManifestData.json';

export interface AssetRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ImageAsset {
  key: string;
  /** Path relative to the site root (served from /public). */
  path: string;
  width: number;
  height: number;
  hasAlpha: boolean;
  alphaHasTransparency: boolean;
  alphaChannelStatus: AlphaChannelStatus;
  category: string;
  essential: boolean;
  intendedUse: string;
  limitations: string;
  note: string;
  frameMetadata?: {
    rows?: number;
    columns?: number;
    cellWidth?: number;
    cellHeight?: number;
    order?: string;
    semanticDirectionsVerified?: boolean;
    animationOrderVerified?: boolean;
    spriteCount?: number;
    cropMetadataPath?: string;
    tileCount?: number;
    tileMetadataPath?: string;
    source?: string;
    uniformTileSize?: boolean;
    checkerPeriodEstimatePx?: number;
    checkerPhaseIsGlobal?: boolean;
    frames?: Array<{ index?: number; row?: number; column?: number } & AssetRect>;
    sourceBounds?: Array<{ row: number; column: number } & AssetRect>;
    frameBounds?: Array<{ row: number; column: number } & AssetRect>;
  };
  cropMetadata?: {
    source: string;
    sourceRect: AssetRect;
    row?: number;
    column?: number;
    facingDirectionVerified?: boolean;
    animationOrderVerified?: boolean;
    state?: string;
  };
}

type AlphaChannelStatus = 'present-with-transparency' | 'present-fully-opaque' | 'absent';

function parseAlphaChannelStatus(value: string): AlphaChannelStatus {
  if (
    value === 'present-with-transparency' ||
    value === 'present-fully-opaque' ||
    value === 'absent'
  ) {
    return value;
  }
  throw new Error(`Unsupported alpha channel status in asset manifest: ${value}`);
}

/** Complete catalog of processed images, including assets not loaded at boot. */
export const ASSET_CATALOG: readonly ImageAsset[] = assetCatalogData.assets.map((asset) => ({
  ...asset,
  alphaChannelStatus: parseAlphaChannelStatus(asset.alphaChannelStatus),
}));

/** Keep the existing Phaser preload surface limited to the four core sheets. */
export const ESSENTIAL_IMAGES: readonly ImageAsset[] = ASSET_CATALOG.filter((asset) => asset.essential);

/** Resolve a manifest path against Vite's base so sub-path hosting works. */
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}
