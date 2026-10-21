"""Background probability mask for baked-checkerboard sheets.

Evidence combined per pixel:
  1. colour   - neutral grey and close to one of the two checker shades
  2. pattern  - the shade agrees with the fitted lattice parity at that pixel
  3. spatial  - candidate must connect to the sheet border through candidates
Anything that fails (1)/(2) is foreground. Enclosed candidate pockets that are
NOT border-connected are kept as foreground and reported (never guessed).
"""
from __future__ import annotations
import numpy as np
from scipy import ndimage as ndi


def fit_lattice(lum, neutral, n_cells_x, search=0.12, step=0.005):
    """Fit period and y/x phase on neutral pixels only. Returns dict."""
    h, w = lum.shape
    p0 = w / n_cells_x
    ys, xs = np.nonzero(neutral)
    sel = np.random.default_rng(0).choice(len(ys), size=min(60000, len(ys)), replace=False)
    ys, xs = ys[sel].astype(float), xs[sel].astype(float)
    bright = lum[neutral][sel] > (np.percentile(lum[neutral], 5) + np.percentile(lum[neutral], 95)) / 2
    best = (0, p0, 0.0, 0.0)
    for p in np.arange(p0 - search, p0 + search + 1e-9, step):
        for ox in np.arange(0, p, 0.5):
            cx = np.floor((xs - ox) / p).astype(int)
            for oy in np.arange(0, p, 0.5):
                par = (cx + np.floor((ys - oy) / p).astype(int)) & 1
                s = (par == bright).mean()
                s = max(s, 1 - s)
                if s > best[0]:
                    best = (s, p, ox, oy)
    s, p, ox, oy = best
    par = (np.floor((xs - ox) / p) + np.floor((ys - oy) / p)).astype(int) & 1
    flip = (par == bright).mean() < 0.5
    return dict(period=float(p), ox=float(ox), oy=float(oy), flip=bool(flip), agreement=float(s))


def parity_map(shape, fit):
    h, w = shape
    yy, xx = np.mgrid[0:h, 0:w]
    par = (np.floor((xx - fit["ox"]) / fit["period"]) + np.floor((yy - fit["oy"]) / fit["period"])).astype(int) & 1
    return (par ^ int(fit["flip"])).astype(bool)  # True = light cell


def estimate_shades(rgb, empty_boxes):
    """Two checker shades (dark, light) as medians of the two luminance clusters."""
    lum = rgb.mean(axis=2)
    v = np.concatenate([lum[y0:y1, x0:x1].ravel() for x0, y0, x1, y1 in empty_boxes])
    mid = (v.min() + v.max()) / 2
    for _ in range(10):
        lo, hi = v[v <= mid].mean(), v[v > mid].mean()
        mid = (lo + hi) / 2
    spread_lo = v[v <= mid].std(); spread_hi = v[v > mid].std()
    return dict(dark=float(lo), light=float(hi), dark_sd=float(spread_lo), light_sd=float(spread_hi))


def background_mask(rgb, shades, light_cell, tol=12.0, chroma_max=10, edge_px=2):
    """Return dict(bg, candidate, pockets, lattice_edge).

    Interior of a cell must match that cell's predicted shade. Within edge_px of
    a predicted cell edge (resampling blur) any neutral luminance between the two
    shades is accepted, otherwise the blur band would cut the checkerboard into
    isolated fragments that can't connect to the border.
    """
    r = rgb.astype(int)
    lum = r.mean(axis=2)
    chroma = r.max(axis=2) - r.min(axis=2)
    near_dark = np.abs(lum - shades["dark"]) <= tol
    near_light = np.abs(lum - shades["light"]) <= tol
    between = (lum >= shades["dark"] - tol) & (lum <= shades["light"] + tol)
    edge = ndi.binary_dilation(light_cell, iterations=edge_px) & ndi.binary_dilation(~light_cell, iterations=edge_px)
    neutral = chroma <= chroma_max
    cand = neutral & ((near_dark & ~light_cell & ~edge) | (near_light & light_cell & ~edge) | (edge & between))
    lab, _ = ndi.label(cand, structure=np.ones((3, 3)))
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    border = border[border > 0]
    bg = np.isin(lab, border)
    return dict(bg=bg, candidate=cand, pockets=cand & ~bg, lattice_edge=edge)


def fit_local_lattice(lum, neutral, period, block=(96, 192), min_neutral=300, step=0.5):
    """Per-block phase fit (period fixed). The generator's lattice drifts
    vertically across seams, so one global phase is wrong (measured ~70%
    agreement globally vs 98-100% locally). Returns a bool light-cell map and
    a per-block agreement table for the audit report."""
    h, w = lum.shape
    yy, xx = np.mgrid[0:h, 0:w]
    bright = lum > (np.percentile(lum[neutral], 5) + np.percentile(lum[neutral], 95)) / 2
    bh, bw = block
    phases = {}
    light = np.zeros((h, w), bool)
    table = []
    last = None
    for by in range(0, h, bh):
        row = []
        for bx in range(0, w, bw):
            sl = (slice(by, min(by + bh, h)), slice(bx, min(bx + bw, w)))
            m = neutral[sl]
            if m.sum() < min_neutral:
                row.append(None)
                continue
            best = (0, 0.0, 0.0, False)
            for ox in np.arange(0, period, step):
                cx = np.floor((xx[sl] - ox) / period).astype(int)
                for oy in np.arange(0, period, step):
                    par = ((cx + np.floor((yy[sl] - oy) / period).astype(int)) & 1).astype(bool)
                    a = (par == bright[sl])[m].mean()
                    flip = a < 0.5
                    a = max(a, 1 - a)
                    if a > best[0]:
                        best = (a, ox, oy, flip)
            phases[(by, bx)] = best
            row.append(tuple(round(v, 3) if isinstance(v, float) else v for v in best))
        table.append(row)
    # paint each block with its own fit; blocks without a fit borrow nearest fitted block in the same row band
    keys = list(phases)
    for by in range(0, h, bh):
        for bx in range(0, w, bw):
            key = (by, bx)
            if key not in phases:
                same = [k for k in keys if k[0] == by]
                pool = same or keys
                key = min(pool, key=lambda k: abs(k[1] - bx) + abs(k[0] - by))
            a, ox, oy, flip = phases[key]
            sl = (slice(by, min(by + bh, h)), slice(bx, min(bx + bw, w)))
            par = ((np.floor((xx[sl] - ox) / period) + np.floor((yy[sl] - oy) / period)).astype(int) & 1).astype(bool)
            light[sl] = par ^ flip
    return light, table
