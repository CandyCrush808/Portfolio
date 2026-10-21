"""Generic checkerboard cut-out used by every sheet script."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import numpy as np
from scipy import ndimage as ndi
import mask


def cutout(rgb, empty_boxes, n_cells_x, tol=12.0, chroma_max=10):
    r = rgb.astype(int); lum = r.mean(2); chroma = r.max(2) - r.min(2)
    sh = mask.estimate_shades(rgb, empty_boxes)
    neutral = (chroma <= chroma_max) & ((np.abs(lum - sh['dark']) < tol + 4) | (np.abs(lum - sh['light']) < tol + 4))
    light, table = mask.fit_local_lattice(lum, neutral, rgb.shape[1] / n_cells_x)
    m = mask.background_mask(rgb, sh, light, tol=tol, chroma_max=chroma_max)
    bg = m['bg']
    touch = ndi.binary_dilation(bg, structure=np.ones((3, 3))) & ~bg
    shade = np.where(light, sh['light'], sh['dark'])
    fringe = touch & (chroma <= 8) & (np.abs(lum - shade) <= 12)   # one bounded 1px pass
    bg = bg | fringe
    fg = ~bg
    lab, n = ndi.label(fg, structure=np.ones((3, 3)))
    area = np.bincount(lab.ravel(), minlength=n + 1)
    removed = 0
    for i in range(1, n + 1):
        if area[i] <= 16:
            sel = lab == i
            if chroma[sel].max() <= 14 and sh['dark'] - 25 <= lum[sel].min() and lum[sel].max() <= sh['light'] + 25:
                bg[sel] = True; removed += 1
    info = dict(shades=sh, fringe_px=int(fringe.sum()), speckles_removed=removed, pocket_px=int(m['pockets'].sum()),
                lattice_agreement_min=min(v[0] for row in table for v in row if v) if any(any(row) for row in table) else None)
    return bg, info
