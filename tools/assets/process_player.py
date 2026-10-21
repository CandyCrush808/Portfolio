#!/usr/bin/env python3
"""Stage 1: player sheet cut-out + frame measurement. Run from repo root."""
import sys, json, hashlib
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import mask

SRC = Path('assets-source/Firefly_Gemini Flash_Create a clean 2D top-down 16-bit pixel-art RPG player character sprite sheet. A youn 939225.png')
OUT = Path('public/assets/processed/player'); DIAG = Path('assets-processing/diagnostics/player')
EMPTY = [(0, 0, 100, 100), (1000, 0, 1130, 200), (600, 380, 780, 480)]


def cutout(rgb):
    r = rgb.astype(int); lum = r.mean(2); chroma = r.max(2) - r.min(2)
    sh = mask.estimate_shades(rgb, EMPTY)
    neutral = (chroma <= 10) & ((np.abs(lum - sh['dark']) < 16) | (np.abs(lum - sh['light']) < 16))
    light, table = mask.fit_local_lattice(lum, neutral, rgb.shape[1] / 120)
    m = mask.background_mask(rgb, sh, light)
    bg = m['bg']
    # one bounded 1px fringe pass: fg pixel touching bg, neutral, matching its cell's shade
    touch = ndi.binary_dilation(bg, structure=np.ones((3, 3))) & ~bg
    shade = np.where(light, sh['light'], sh['dark'])
    fringe = touch & (chroma <= 8) & (np.abs(lum - shade) <= 12)
    bg = bg | fringe
    # speckle residue: tiny neutral fg components in checker luminance range
    fg = ~bg
    lab, n = ndi.label(fg, structure=np.ones((3, 3)))
    area = np.bincount(lab.ravel(), minlength=n + 1)
    speck = np.zeros(n + 1, bool)
    for i in range(1, n + 1):
        if area[i] <= 16:
            sel = lab == i
            if chroma[sel].max() <= 14 and sh['dark'] - 25 <= lum[sel].min() and lum[sel].max() <= sh['light'] + 25:
                speck[i] = True
    removed_specks = int(speck[1:].sum())
    bg |= speck[lab]
    return bg, dict(shades=sh, lattice_table=table, fringe_px=int(fringe.sum()), speckles_removed=removed_specks,
                    pocket_px=int(m['pockets'].sum()))


SEAM_BAND = (266, 286)       # generator artifact: grey dashed seam across the sheet (measured y 272-281)
MIN_FRAME_AREA = 2000        # sprite frames measure 8.7k-11.4k opaque px; everything smaller is residue
CELL = (144, 176)            # normalized atlas cell (max measured frame 133x169)


def finalize(rgb, bg):
    r = rgb.astype(int); lum = r.mean(2); chroma = r.max(2) - r.min(2)
    fg = ~bg
    y0, y1 = SEAM_BAND
    band = np.zeros_like(fg); band[y0:y1, :] = True
    seam = band & fg & (chroma <= 14) & (lum >= 40) & (lum <= 135)
    fg = fg & ~seam
    lab, n = ndi.label(fg, structure=np.ones((3, 3)))
    area = np.bincount(lab.ravel(), minlength=n + 1)
    objs = ndi.find_objects(lab)
    frames, dropped = [], []
    for i in range(1, n + 1):
        sl = objs[i - 1]
        box = dict(x=sl[1].start, y=sl[0].start, w=sl[1].stop - sl[1].start, h=sl[0].stop - sl[0].start, area=int(area[i]))
        (frames if area[i] >= MIN_FRAME_AREA else dropped).append((i, box))
    keep = np.isin(lab, [i for i, _ in frames])
    # order: rows by y-centre cluster, then x
    boxes = [b for _, b in frames]
    boxes.sort(key=lambda b: (round((b['y'] + b['h'] / 2) / 190), b['x']))
    return keep, boxes, [b for _, b in dropped], int(seam.sum())


def main():
    rgb = np.array(Image.open(SRC).convert('RGB'))
    bg, info = cutout(rgb)
    keep, boxes, dropped, seam_px = finalize(rgb, bg)
    DIAG.mkdir(parents=True, exist_ok=True); (OUT / 'frames').mkdir(parents=True, exist_ok=True)
    rgba = np.dstack([rgb, (keep * 255).astype(np.uint8)])
    rgba[~keep, :3] = 0                      # no checker colour hidden under alpha=0
    Image.fromarray(rgba, 'RGBA').save(OUT / 'player-sheet-clean.png')
    Image.fromarray((keep * 255).astype(np.uint8)).save(DIAG / 'mask.png')
    names = []
    atlas = Image.new('RGBA', (CELL[0] * 4, CELL[1] * 4), (0, 0, 0, 0))
    for idx, b in enumerate(boxes):
        row, col = divmod(idx, 4)
        crop = Image.fromarray(rgba[b['y']:b['y'] + b['h'], b['x']:b['x'] + b['w']], 'RGBA')
        name = f'player-r{row}c{col}.png'
        crop.save(OUT / 'frames' / name)
        b.update(row=row, col=col, file=name)
        # bottom-centre anchor inside the normalized cell
        ox = col * CELL[0] + (CELL[0] - b['w']) // 2
        oy = row * CELL[1] + (CELL[1] - b['h'])
        atlas.alpha_composite(crop, (ox, oy))
        b['atlas_offset'] = [ox - col * CELL[0], oy - row * CELL[1]]
    atlas.save(OUT / 'player-atlas-normalized.png')
    report = dict(source=SRC.name, boxes=boxes, dropped_components=dropped, seam_px_removed=seam_px,
                  speckles_removed=info['speckles_removed'], pocket_px=info['pocket_px'], cell=CELL,
                  shades=info['shades'])
    (DIAG / 'player-measurements.json').write_text(json.dumps(report, indent=2))
    print(json.dumps({k: report[k] for k in ('seam_px_removed', 'speckles_removed', 'pocket_px')}),
          len(boxes), 'frames;', len(dropped), 'dropped components')


if __name__ == '__main__':
    main()
