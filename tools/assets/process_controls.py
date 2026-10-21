#!/usr/bin/env python3
"""Stage 3: mobile controls sheet cut-out + component survey. Run from repo root."""
import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from cutout import cutout

SRC = Path('assets-source/Pixel RPG Mobile UI Controls Sheet.png')
OUT = Path('public/assets/processed/ui'); DIAG = Path('assets-processing/diagnostics/ui')
EMPTY = [(1320, 280, 1520, 520), (1360, 0, 1520, 80), (360, 0, 520, 80), (360, 480, 560, 560), (920, 320, 1000, 400)]

def run():
    rgb = np.array(Image.open(SRC).convert('RGB'))
    bg, info = cutout(rgb, EMPTY, 144, tol=10.0)
    return rgb, bg, info

# name -> (x0,y0,x1,y1) search window (measured component bboxes, real pixel coords). The component
# whose centre lies in the window is cropped; labels/brackets are separate components and are excluded.
TARGETS = {
 'dpad-normal': (33, 84, 265, 303), 'dpad-pressed': (310, 84, 536, 311),
 'joystick-base-normal': (589, 75, 768, 257), 'joystick-base-active': (778, 78, 961, 257),
 'thumbstick-normal': (628, 323, 725, 423), 'thumbstick-active': (824, 324, 925, 424),
 'interact-normal': (1003, 87, 1119, 209), 'interact-active': (1120, 94, 1233, 212),
 'action-normal': (1267, 97, 1383, 209), 'action-active': (1392, 97, 1504, 211),
 'pause-normal': (1038, 302, 1164, 434), 'pause-active': (1168, 303, 1295, 435),
 'map-normal': (33, 583, 148, 695), 'map-active': (161, 580, 273, 700),
 'journal-normal': (304, 580, 415, 700), 'journal-active': (422, 580, 540, 700),
 'portfolio-normal': (579, 583, 703, 695), 'portfolio-active': (707, 580, 829, 700),
 'dpad-up-normal': (40, 322, 113, 392), 'dpad-up-pressed': (113, 323, 187, 392),
 'dpad-down-normal': (198, 323, 270, 389), 'dpad-down-pressed': (271, 323, 336, 389),
 'extra-dot': (44, 877, 134, 958), 'extra-check': (155, 877, 236, 958), 'extra-cross': (251, 879, 330, 955),
 'extra-arrow-left': (348, 877, 429, 961), 'extra-arrow-right': (444, 877, 536, 960), 'extra-settings': (560, 862, 654, 959),
}
GROUP_SPLIT = {'dpad-sides': (358, 323, 556, 391)}   # left/right buttons touch; split on empty alpha columns


def main():
    rgb, bg, info = run()
    # one bounded fringe pass for the light checker shade: neutral, bright pixels that touch background
    r_ = rgb.astype(int); lum_ = r_.mean(2); chroma_ = r_.max(2) - r_.min(2)
    touch = ndi.binary_dilation(bg, structure=np.ones((3, 3))) & ~bg
    light_fringe = touch & (chroma_ <= 12) & (lum_ >= 205)
    info['light_fringe_px'] = int(light_fringe.sum())
    bg = bg | light_fringe
    fg = ~bg
    OUT_C = OUT / 'controls'; OUT_C.mkdir(parents=True, exist_ok=True); DIAG.mkdir(parents=True, exist_ok=True)
    lab, n = ndi.label(fg, structure=np.ones((3, 3)))
    area = np.bincount(lab.ravel(), minlength=n + 1); objs = ndi.find_objects(lab)
    rgba = np.dstack([rgb, (fg * 255).astype(np.uint8)]); rgba[~fg, :3] = 0
    meta = []

    def comps_in(win):
        x0, y0, x1, y1 = win
        out = []
        for i in range(1, n + 1):
            if area[i] < 150: continue
            sl = objs[i - 1]
            cx = (sl[1].start + sl[1].stop) / 2; cy = (sl[0].start + sl[0].stop) / 2
            if x0 <= cx <= x1 and y0 <= cy <= y1: out.append(i)
        return out

    def save(name, mask_, extra=None):
        lab_, n_ = ndi.label(mask_, structure=np.ones((3, 3)))
        if n_ > 1:   # drop slivers from touching neighbours (split artefacts): keep the largest component only
            sizes = np.bincount(lab_.ravel())[1:]
            mask_ = lab_ == (1 + int(np.argmax(sizes)))
        ys, xs = np.nonzero(mask_)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        crop = np.where(mask_[y0:y1, x0:x1, None], rgba[y0:y1, x0:x1], 0).astype(np.uint8)
        Image.fromarray(crop, 'RGBA').save(OUT_C / f'{name}.png')
        rec = dict(name=name, file=f'{name}.png', x=int(x0), y=int(y0), w=int(x1 - x0), h=int(y1 - y0), status='extracted-pending-visual-check')
        if extra: rec.update(extra)
        meta.append(rec)

    for name, win in TARGETS.items():
        ids = comps_in(win)
        if len(ids) != 1:
            meta.append(dict(name=name, status='FAILED', reason=f'{len(ids)} components in window')); continue
        save(name, lab == ids[0])
    for gname, win in GROUP_SPLIT.items():
        ids = comps_in(win)
        m = np.isin(lab, ids)
        counts = m.sum(axis=0)
        xs = np.nonzero(counts)[0]
        lo, hi = xs.min(), xs.max()
        third = (hi - lo) / 3.0
        # the three buttons touch at their corners; split at the column-count valley nearest 1/3 and 2/3
        cuts = []
        for k in (1, 2):
            c = lo + k * third
            rng = np.arange(int(c - third / 3), int(c + third / 3) + 1)
            cuts.append(int(rng[np.argmin(counts[rng])]))
        bounds = [lo, cuts[0], cuts[1], hi + 1]
        names = ['dpad-left-normal', 'dpad-right-normal', 'dpad-right-pressed']
        for nm, (a_, b_) in zip(names, zip(bounds[:-1], bounds[1:])):
            mm = m.copy(); mm[:, :a_] = False; mm[:, b_:] = False
            save(nm, mm, dict(split_columns=[int(a_), int(b_)], valley_counts=[int(counts[c]) for c in cuts]))
    # unclaimed big components (reported, not exported)
    claimed = set()
    for w in list(TARGETS.values()) + list(GROUP_SPLIT.values()): claimed.update(comps_in(w))
    unclaimed = [dict(x=int(objs[i-1][1].start), y=int(objs[i-1][0].start), w=int(objs[i-1][1].stop-objs[i-1][1].start),
                      h=int(objs[i-1][0].stop-objs[i-1][0].start), area=int(area[i]))
                 for i in range(1, n + 1) if area[i] >= 1500 and i not in claimed]
    sheet = np.dstack([rgb, (fg * 255).astype(np.uint8)]); sheet[~fg, :3] = 0
    Image.fromarray(sheet, 'RGBA').save(OUT / 'mobile-controls-sheet-clean.png')
    (DIAG / 'controls-measurements.json').write_text(json.dumps(dict(source=SRC.name, items=meta, unclaimed_large_components=unclaimed,
        info={k: (float(v) if isinstance(v, np.generic) else v) for k, v in info.items()}), indent=2))
    print(len([m for m in meta if m['status'] != 'FAILED']), 'extracted;', [m for m in meta if m['status'] == 'FAILED'])
    print('unclaimed large components:', len(unclaimed))


if __name__ == '__main__':
    main()
