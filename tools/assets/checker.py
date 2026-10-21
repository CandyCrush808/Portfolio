"""Checkerboard model fitting and background-mask generation.

The "transparent" backgrounds in the source sheets are checkerboards baked into
RGB pixels. Cells are not an integer pixel size (generator resampled them), so
we fit period + phase + the two shades from empty regions, predict the
background at every pixel, and only call a pixel background when it matches the
prediction AND is connected to the sheet border through other such pixels.
"""
from __future__ import annotations
import numpy as np
from scipy import ndimage as ndi


def fit_checker(img: np.ndarray, empty_boxes, period_range=(9.0, 13.0), step=0.02):
    """Fit period/phase of a checkerboard from boxes (x0,y0,x1,y1) known empty.

    Returns dict(period, ox, oy, dark, light, score). Phase/period are fitted
    on luminance split at the midpoint of the two dominant shades.
    """
    lum = img.astype(float).mean(axis=2)
    samples = np.concatenate([lum[y0:y1, x0:x1].ravel() for x0, y0, x1, y1 in empty_boxes])
    lo, hi = np.percentile(samples, [10, 90])
    mid = (lo + hi) / 2
    best = None
    ys, xs = [], []
    cls = []
    for x0, y0, x1, y1 in empty_boxes:
        yy, xx = np.mgrid[y0:y1, x0:x1]
        ys.append(yy.ravel()); xs.append(xx.ravel()); cls.append((lum[y0:y1, x0:x1] > mid).ravel())
    ys = np.concatenate(ys); xs = np.concatenate(xs); cls = np.concatenate(cls)
    # coarse-to-fine search over period and offsets
    for p in np.arange(period_range[0], period_range[1], step):
        for ox in np.arange(0, p, 0.5):
            cx = np.floor((xs - ox) / p).astype(int)
            for oy in np.arange(0, p, 0.5):
                par = (cx + np.floor((ys - oy) / p).astype(int)) & 1
                agree = (par == cls).mean()
                agree = max(agree, 1 - agree)
                if best is None or agree > best[0]:
                    best = (agree, p, ox, oy)
    score, p, ox, oy = best
    par = ((np.floor((xs - ox) / p) + np.floor((ys - oy) / p)).astype(int)) & 1
    a = (par == cls).mean()
    flip = a < 0.5  # parity 0 is the light cell if flip
    return dict(period=float(p), ox=float(ox), oy=float(oy), score=float(score), flip=bool(flip), mid=float(mid))


def predicted_parity(shape, fit):
    h, w = shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    par = (np.floor((xx - fit["ox"]) / fit["period"]) + np.floor((yy - fit["oy"]) / fit["period"])).astype(int) & 1
    return par ^ (1 if fit["flip"] else 0)  # 1 = light cell
