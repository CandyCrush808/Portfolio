#!/usr/bin/env python3
"""Stage 2: buildings sheet cut-out + per-building extraction. Run from repo root."""
import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from cutout import cutout

SRC = Path('assets-source/Firefly_Gemini Flash_Create a set of separate 2D top-down 16-bit pixel-art RPG building sprites for a cozy 939225.png')
OUT = Path('public/assets/processed/buildings'); DIAG = Path('assets-processing/diagnostics/buildings')
EMPTY = [(0, 0, 80, 300), (900, 420, 1400, 760), (350, 400, 540, 700)]

if __name__ == '__main__':
    rgb = np.array(Image.open(SRC).convert('RGB'))
    bg, info = cutout(rgb, EMPTY, 120)
    fg = ~bg
    OUT.mkdir(parents=True, exist_ok=True); (OUT / 'individual').mkdir(exist_ok=True); DIAG.mkdir(parents=True, exist_ok=True)
    # merge nearby components (smoke, props) into one building: dilate to label groups, then keep real pixels only
    grp, n = ndi.label(ndi.binary_dilation(fg, structure=np.ones((3, 3)), iterations=14), structure=np.ones((3, 3)))
    grp = np.where(fg, grp, 0)
    area = np.bincount(grp.ravel(), minlength=n + 1)
    objs = ndi.find_objects(grp)
    found = [(i, objs[i - 1], int(area[i])) for i in range(1, n + 1) if area[i] > 0]
    found.sort(key=lambda t: (int((t[1][0].start + t[1][0].stop) / 2 > 384), t[1][1].start))  # row 0 = top, row 1 = bottom
    for i, sl, a in found: print(i, 'x', sl[1].start, sl[1].stop, 'y', sl[0].start, sl[0].stop, 'area', a)
    rgba = np.dstack([rgb, (fg * 255).astype(np.uint8)]); rgba[~fg, :3] = 0
    # Building 5 (dark slate roof) is NOT separable: its roof luminance (63-106, median ~69)
    # overlaps the dark checker shade (67.6 +- 7) and the border flood leaks through the roof
    # (measured visually as a checker-patterned hole grid). Flag, do not guess.
    NEEDS_MANUAL = {5}
    PAD = 2
    names = {1: 'cottage-green', 2: 'forge-red', 3: 'hall-blue', 4: 'house-orange', 5: 'workshop-slate'}
    meta = []
    # order: row-major as listed (top row left->right, then bottom row)
    for idx, (gid, sl, a) in enumerate(found, start=1):
        y0, y1 = max(sl[0].start - PAD, 0), min(sl[0].stop + PAD, rgb.shape[0])
        x0, x1 = max(sl[1].start - PAD, 0), min(sl[1].stop + PAD, rgb.shape[1])
        rec = dict(index=idx, name=names[idx], bbox=dict(x=x0, y=y0, w=x1 - x0, h=y1 - y0), opaque_px=a)
        if idx in NEEDS_MANUAL:
            rec['status'] = 'needs-manual-mask'
            rec['reason'] = 'slate roof luminance overlaps dark checker shade; flood leaks through roof'
        else:
            crop = np.where((grp[y0:y1, x0:x1] == gid)[..., None], rgba[y0:y1, x0:x1], 0).astype(np.uint8)
            fn = f'building-{idx}-{names[idx]}.png'
            Image.fromarray(crop, 'RGBA').save(OUT / 'individual' / fn)
            rec['file'] = fn; rec['status'] = 'extracted-pending-visual-check'
        meta.append(rec)
    keep = fg.copy()
    for idx, (gid, sl, a) in enumerate(found, start=1):
        if idx in NEEDS_MANUAL:
            keep[grp == gid] = False   # leave out of the cleaned sheet rather than ship holes
    sheet = np.dstack([rgb, (keep * 255).astype(np.uint8)]); sheet[~keep, :3] = 0
    Image.fromarray(sheet, 'RGBA').save(OUT / 'buildings-sheet-clean-partial.png')
    Image.fromarray((fg * 255).astype(np.uint8)).save(DIAG / 'mask-all-incl-failed.png')
    (DIAG / 'buildings-measurements.json').write_text(json.dumps(dict(source=SRC.name, buildings=meta, info={k: (v if not isinstance(v, np.generic) else float(v)) for k, v in info.items()}), indent=2))
    print(json.dumps(meta, indent=1))
