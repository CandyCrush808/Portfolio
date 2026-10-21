#!/usr/bin/env python3
"""Terrain tileset audit + conservative checkerboard removal.  Run from repo root:

    python3 tools/assets/process_terrain.py

Source (READ ONLY): public/assets/terrain/terrain-tileset.png  (byte-identical copy of the
file in assets-source/; hashes are compared before and after and the run aborts on mismatch).

What this script MEASURES (nothing here is assumed):
  1. checker shades, cell pitch, and how the checker phase varies across the sheet
  2. horizontal row bands (rows made only of neutral grey = gaps between tile rows)
  3. per-band tile boxes (columns that are not pure neutral grey)
  4. per tile: local checker lattice fit on the gap ring around the tile, edge ambiguity,
     fill ratio and a leak test

What it WRITES:
  public/assets/processed/terrain/terrain-tileset-clean-partial.png  RGBA, same canvas, only
        tiles graded high/medium are filled; low-confidence tiles stay transparent here
  public/assets/processed/terrain/terrain-tiles.json                 tile metadata (source rects)
  assets-processing/diagnostics/terrain/*                            masks, overlays, measurements
  assets-processing/previews/terrain-*.png                           contact sheets

Policy: when separation is not reliable the tile is NOT cleaned. Its original pixels are kept
opaque in the partial output and copied to terrain-uncertain-regions-*.png for manual masking.
The measured confidence is not visual verification; only the two grass crops explicitly reviewed
at 8x on contrasting backgrounds are marked as visually reviewed.
"""
from __future__ import annotations
import hashlib, json, sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'public/assets/terrain/terrain-tileset.png'
ORIG = ROOT / 'assets-source/Firefly_Gemini Flash_Create a professional 2D top-down 16-bit pixel-art RPG environment tileset for a cozy 939225.png'
OUT = ROOT / 'public/assets/processed/terrain'
DIAG = ROOT / 'assets-processing/diagnostics/terrain'
PREV = ROOT / 'assets-processing/previews'

# Regions that visually contain only checkerboard (used ONLY to measure the checker itself).
# Chosen by inspection of the sheet: empty area right of the bridge pieces / below the fences.
EMPTY_BOXES = [(640, 632, 775, 690), (940, 625, 1400, 695)]

# Row-band meaning. Assigned by visual inspection of the original sheet (see audit report).
BAND_CATEGORY = {
    0: 'grass', 1: 'path-dirt', 2: 'path-cobblestone', 3: 'path-junction', 4: 'water',
    5: 'water-edge', 6: 'wall', 7: 'fence', 8: 'bridge-dock', 9: 'vegetation',
}
SOLID_BANDS = {0, 1, 2, 4, 5, 6}      # expected to be fully opaque rectangles. Band 3 (path junctions) is NOT: it has transparent corners (measured/visually confirmed)
GRID_PITCH_X_HYP = 1408 / 18           # hypothesis only (18 columns); reported, never relied on
MANUAL_SPLIT_SEAMS = {0: [(702, 706)]}
MANUAL_REVIEW_REGIONS = [(235, 622, 259, 681), (363, 622, 388, 681)]
VISUALLY_APPROVED_GRASS_TILES = {(0, 631), (0, 707)}


def sha256(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def runs_where(mask1d, min_len=1):
    out, s = [], None
    for i, v in enumerate(mask1d):
        if v and s is None: s = i
        if not v and s is not None:
            if i - s >= min_len: out.append((s, i - 1))
            s = None
    if s is not None and len(mask1d) - s >= min_len: out.append((s, len(mask1d) - 1))
    return out


# ---------------------------------------------------------------- checker measurement
def measure_checker(rgb):
    lum = rgb.astype(float).mean(2)
    vals = np.concatenate([lum[y0:y1, x0:x1].ravel() for x0, y0, x1, y1 in EMPTY_BOXES])
    mid = (vals.min() + vals.max()) / 2
    for _ in range(12):
        lo, hi = vals[vals <= mid].mean(), vals[vals > mid].mean()
        mid = (lo + hi) / 2
    shades = dict(dark=float(lo), light=float(hi), dark_sd=float(vals[vals <= mid].std()),
                  light_sd=float(vals[vals > mid].std()), split=float(mid))
    # cell pitch: median run length between luminance transitions along clean rows of the empty boxes
    runs_x = []
    for x0, y0, x1, y1 in EMPTY_BOXES:
        for y in range(y0 + 2, y1 - 2, 6):
            cls = (lum[y, x0:x1] > mid).astype(int)
            edges = np.nonzero(np.diff(cls))[0]
            runs_x += list(np.diff(edges)[1:-1]) if len(edges) > 3 else []
    runs_x = np.array(runs_x)
    runs_x = runs_x[(runs_x > 8) & (runs_x < 16)]
    # lattice fit per empty box (period search), to show phase stability
    fits = {}
    for name, (x0, y0, x1, y1) in zip('AB', EMPTY_BOXES):
        yy, xx = np.mgrid[y0:y1, x0:x1]; bright = lum[y0:y1, x0:x1] > mid; best = (0,)
        for p in np.arange(11.6, 11.95, 0.05):
            for ox in np.arange(0, 2 * p, 0.5):
                cx = np.floor((xx - ox) / p).astype(int)
                for oy in np.arange(0, 2 * p, 0.5):
                    par = ((cx + np.floor((yy - oy) / p).astype(int)) & 1).astype(bool)
                    s = max((par == bright).mean(), 1 - (par == bright).mean())
                    if s > best[0]: best = (s, p, ox % (2 * p), oy % (2 * p))
        fits[name] = dict(box=[x0, y0, x1, y1], agreement=float(best[0]), period=float(best[1]),
                          ox=float(best[2]), oy=float(best[3]))
    period = float(np.mean([f['period'] for f in fits.values()]))
    return dict(shades=shades, run_length_median_px=float(np.median(runs_x)),
                run_length_mean_px=float(runs_x.mean()), run_length_samples=int(len(runs_x)),
                period_px=period, empty_region_fits=fits)


def lattice_domain_report(rgb, chk):
    """How well does ONE global lattice explain the checker? (answer: it does not)."""
    lum = rgb.astype(float).mean(2); chroma = rgb.max(2).astype(int) - rgb.min(2).astype(int)
    H, W = lum.shape; yy, xx = np.mgrid[0:H, 0:W]
    f = chk['empty_region_fits']['B']; p = chk['period_px']
    par = ((np.floor((xx - f['ox']) / p) + np.floor((yy - f['oy']) / p)).astype(int) & 1).astype(bool)
    sh = chk['shades']
    ck = (chroma <= 7) & ((abs(lum - sh['dark']) <= 12) | (abs(lum - sh['light']) <= 12))
    agree = (par == (lum > sh['split']))
    blocks = []
    for by in range(0, H, 96):
        row = []
        for bx in range(0, W, 176):
            m = ck[by:by + 96, bx:bx + 176]
            row.append(None if m.sum() < 150 else round(float(agree[by:by + 96, bx:bx + 176][m].mean()), 2))
        blocks.append(row)
    return dict(global_lattice=dict(ox=f['ox'], oy=f['oy'], period=p),
                overall_agreement=float(agree[ck].mean()), block_size=[176, 96], block_agreement=blocks)


# ---------------------------------------------------------------- tile box detection
def find_bands(rgb):
    lum = rgb.astype(float).mean(2); chroma = rgb.max(2).astype(int) - rgb.min(2).astype(int)
    neu = (chroma <= 7) & (lum >= 52) & (lum <= 138)
    gap_rows = runs_where(neu.mean(1) >= 0.93, min_len=2)
    H = rgb.shape[0]
    bands, prev_end = [], -1
    for gs, ge in gap_rows + [(H, H)]:
        if gs - 1 - (prev_end + 1) + 1 >= 20:
            bands.append((prev_end + 1, gs - 1))
        prev_end = ge
    # a 2px gap between two tile rows can fail the 0.93 test; split any band taller than 110px
    # at the row (middle 40%) with the highest neutral-grey fraction
    rp = neu.mean(1); out = []
    for a, b in bands:
        if b - a + 1 > 110:
            lo, hi = a + int((b - a) * 0.3), a + int((b - a) * 0.7)
            k = lo + int(np.argmax(rp[lo:hi + 1]))
            out += [(a, k - 1), (k + 2, b)]
            gap_rows.append((k, k + 1))
        else:
            out.append((a, b))
    gap_rows.sort()
    return neu, gap_rows, out


def tile_boxes(rgb, neu, bands):
    tiles = []
    for bi, (y0, y1) in enumerate(bands):
        cf = neu[y0:y1 + 1].mean(0)
        cols = []
        for s_, e_ in [(s, e) for s, e in runs_where(cf < 0.93) if e - s + 1 >= 6]:
            seams = [seam for seam in MANUAL_SPLIT_SEAMS.get(bi, [])
                     if s_ <= seam[0] and e_ >= seam[1]]
            if seams:
                cut = s_
                for seam_start, seam_end in seams:
                    if seam_start > cut:
                        cols.append((cut, seam_start - 1))
                    cut = seam_end + 1
                if cut <= e_:
                    cols.append((cut, e_))
            elif e_ - s_ + 1 > 100:   # split touching tiles where >=2 columns are still mostly checker
                inner = runs_where(cf[s_:e_ + 1] >= 0.6, min_len=2)
                inner = [(a + s_, b + s_) for a, b in inner if a > 20 and b < (e_ - s_ - 20)]
                cut = s_
                for a, b in inner:
                    cols.append((cut, a - 1)); cut = b + 1
                cols.append((cut, e_))
            else:
                cols.append((s_, e_))
        for ci, (xs, xe) in enumerate(cols):
            rf = neu[y0:y1 + 1, xs:xe + 1].mean(1)
            rows = runs_where(rf < 0.93)
            if not rows: continue
            ys, ye = rows[0][0] + y0, rows[-1][1] + y0
            tiles.append(dict(band=bi, order=ci, x=xs, y=ys, w=xe - xs + 1, h=ye - ys + 1))
    return tiles


# ---------------------------------------------------------------- per tile processing
def fit_local_lattice(lum, chroma, shades, period, ring_mask, win):
    wy0, wy1, wx0, wx1 = win
    ys, xs = np.nonzero(ring_mask)
    sel = (chroma[wy0:wy1, wx0:wx1][ys, xs] <= 7) & (
        (abs(lum[wy0:wy1, wx0:wx1][ys, xs] - shades['dark']) <= 14) | (abs(lum[wy0:wy1, wx0:wx1][ys, xs] - shades['light']) <= 14))
    ys, xs = ys[sel] + wy0, xs[sel] + wx0
    if len(ys) < 40: return None
    bright = lum[ys, xs] > shades['split']
    offs = np.arange(0, 2 * period, 0.5)
    cx = np.floor((xs[None, :] - offs[:, None]) / period).astype(int)   # (n_off, n)
    cy = np.floor((ys[None, :] - offs[:, None]) / period).astype(int)
    best = (0, 0, 0, False)
    for j in range(len(offs)):
        par = ((cx + cy[j][None, :]) & 1).astype(bool)                 # (n_off, n)
        a = (par == bright[None, :]).mean(1)
        i = int(np.argmax(np.maximum(a, 1 - a)))
        s = max(a[i], 1 - a[i])
        if s > best[0]: best = (float(s), float(offs[i]), float(offs[j]), bool(a[i] < 0.5))
    return dict(agreement=best[0], ox=best[1], oy=best[2], flip=best[3], ring_px=int(len(ys)))


def process_tile(rgb, lum, chroma, chk, t, all_boxes, canvas_alpha, no_fringe):
    H, W = lum.shape; sh = chk['shades']; p = chk['period_px']
    x0, y0, x1, y1 = t['x'], t['y'], t['x'] + t['w'], t['y'] + t['h']
    PAD = 10
    wy0, wy1, wx0, wx1 = max(0, y0 - PAD), min(H, y1 + PAD), max(0, x0 - PAD), min(W, x1 + PAD)
    win = (wy0, wy1, wx0, wx1); wh, ww = wy1 - wy0, wx1 - wx0
    inbox = np.zeros((wh, ww), bool); inbox[y0 - wy0:y1 - wy0, x0 - wx0:x1 - wx0] = True
    other = np.zeros((wh, ww), bool)
    for o in all_boxes:
        if o is t: continue
        ox0, oy0, ox1, oy1 = o['x'] - 1, o['y'] - 1, o['x'] + o['w'] + 1, o['y'] + o['h'] + 1
        a0, b0, a1, b1 = max(ox0, wx0), max(oy0, wy0), min(ox1, wx1), min(oy1, wy1)
        if a1 > a0 and b1 > b0: other[b0 - wy0:b1 - wy0, a0 - wx0:a1 - wx0] = True
    ring = ~ndi.binary_dilation(inbox, iterations=1) & ~other
    # the ring may include image-border-clipped parts; that is fine
    fit = fit_local_lattice(lum, chroma, sh, p, ring, win)
    res = dict(lattice=fit)
    if fit is None:
        fit = dict(agreement=0.0, ox=0.0, oy=0.0, flip=False, ring_px=0); res['lattice'] = None
    L = lum[wy0:wy1, wx0:wx1]; C = chroma[wy0:wy1, wx0:wx1]; TOL = 14.0
    # Lattice-free background evidence: neutral grey close to either measured checker shade, plus the
    # resampling-blur band between the two shades (only where both shades are within 2px).
    near_d = (abs(L - sh['dark']) <= TOL) & (C <= 8); near_l = (abs(L - sh['light']) <= TOL) & (C <= 8)
    blur = (C <= 8) & (L > sh['dark'] + TOL) & (L < sh['light'] - TOL) & ndi.binary_dilation(near_d, iterations=2) & ndi.binary_dilation(near_l, iterations=2)
    cand = near_d | near_l | blur
    shade = np.where(abs(L - sh['light']) < abs(L - sh['dark']), sh['light'], sh['dark'])
    lab, n = ndi.label(cand, structure=np.ones((3, 3)))
    # pixels on the sheet's own outer border that look like checker are outside the artwork: extra flood seeds
    border = np.zeros_like(cand)
    if wy0 == 0: border[0, :] = True
    if wx0 == 0: border[:, 0] = True
    if wy1 == H: border[-1, :] = True
    if wx1 == W: border[:, -1] = True
    ring_ids = np.unique(lab[(ring | border) & cand]); ring_ids = ring_ids[ring_ids > 0]
    flooded = np.isin(lab, ring_ids)
    # enclosed candidate pockets: remove only if compact (checker cell-like) and big enough
    pocket = cand & ~flooded
    plab, pn = ndi.label(pocket, structure=np.ones((3, 3)))
    pocket_removed = np.zeros_like(pocket); pocket_kept_px = 0; pocket_removed_px = 0
    for i, sl in enumerate(ndi.find_objects(plab), start=1):
        comp = plab[sl] == i; area = int(comp.sum()); box = comp.shape[0] * comp.shape[1]
        if area >= 30 and area / box >= 0.55 and p * 0.3 <= min(comp.shape) :
            pocket_removed[sl] |= comp; pocket_removed_px += area
        else:
            pocket_kept_px += area
    bg = flooded | pocket_removed
    manual_bg = np.zeros_like(bg)
    if t['band'] == 0:
        for gx0, gx1, gy0, gy1 in ((690, 721, 0, 4),):
            ax0, ax1 = max(gx0, wx0), min(gx1, wx1)
            ay0, ay1 = max(gy0, wy0), min(gy1, wy1)
            if ax1 > ax0 and ay1 > ay0:
                local = np.s_[ay0 - wy0:ay1 - wy0, ax0 - wx0:ax1 - wx0]
                manual_bg[local] = True
    bg |= manual_bg
    # one bounded fringe pass for coloured art only (grey tiles: skipped so thin outlines survive)
    if not no_fringe and fit['agreement'] >= 0.9:
        touch = ndi.binary_dilation(bg, structure=np.ones((3, 3))) & ~bg
        fr = touch & (C <= 8) & (abs(L - shade) <= TOL)
        bg = bg | fr
    fg = ~bg
    # specks: tiny neutral components that match checker values and are not part of the tile art
    flab, fn = ndi.label(fg, structure=np.ones((3, 3))); area = np.bincount(flab.ravel(), minlength=fn + 1)
    specks = 0
    for i in range(1, fn + 1):
        if area[i] <= 8 and C[flab == i].max() <= 10 and (L[flab == i].min() >= sh['dark'] - 20) and (L[flab == i].max() <= sh['light'] + 20):
            bg[flab == i] = True; specks += 1
    fg = ~bg
    # Soft-edge decontamination (solid chromatic ground tiles only). The generator blurred tile edges over
    # ~3-4px, so edge pixels are a MIX of tile colour and checker grey. Pixels are only dropped (never
    # recoloured): a pixel within 3.5px of removed background whose chroma is < 50% of the tile's own
    # interior chroma is treated as contaminated. Thin outlines elsewhere (fence/plants) are untouched.
    fill_pre = float((fg & inbox).sum() / (t['w'] * t['h']))
    core = ndi.binary_erosion(inbox, iterations=6)
    core_bg_pre = int((bg & core).sum())   # leak test uses the flood result BEFORE edge trimming
    fringe_trimmed = 0
    if t['band'] in (0, 1, 3, 4, 5):
        for _ in range(2):
            dist = ndi.distance_transform_edt(fg)
            interior = fg & inbox & (dist >= 6)
            if interior.sum() < 200: break
            med = float(np.median(C[interior]))
            if med < 30: break
            bad = fg & (dist <= 3.5) & (C < 0.5 * med)
            fringe_trimmed += int((bad & inbox).sum()); bg = bg | bad; fg = ~bg
    tile_fg = fg & inbox
    bbox_area = t['w'] * t['h']
    fill = float(tile_fg.sum() / bbox_area)
    core_bg = core_bg_pre; core_area = int(core.sum())
    # edge ambiguity: share of the tile's own 2px border band that looks like neutral checker grey
    band2 = inbox & ~ndi.binary_erosion(inbox, iterations=2)
    edge_amb = float(((C <= 7) & (L >= 52) & (L <= 138) & band2 & tile_fg).sum() / max(1, (band2 & tile_fg).sum()))
    ring_clean = float((cand & ring).sum() / max(1, ring.sum()))
    solid_expected = t['band'] in SOLID_BANDS
    # share of the whole tile box that is neutral grey in the checker luminance range (measured)
    centre = ndi.binary_erosion(inbox, iterations=18)
    if t['band'] <= 6:   # ground bands: RAW pixels of the central region (corners may legitimately be checker)
        gray_art = float(((C <= 7) & (L >= 52) & (L <= 138) & centre).sum() / max(1, centre.sum())) if centre.sum() > 50 else 0.0
    else:                # open structures (fence/bridge/plants): what REMAINS after removal must not be grey
        gray_art = float(((C <= 7) & (L >= 52) & (L <= 138) & tile_fg).sum() / max(1, tile_fg.sum()))
    reasons = []; seam = fit['agreement'] < 0.75
    if ring_clean < 0.85: reasons.append(f"gap ring only {ring_clean:.2f} checker-consistent (box edge not clean)")
    if solid_expected and core_bg > 0.003 * core_area: reasons.append(f"{core_bg}px of tile core classed as background (leak into solid tile)")
    if solid_expected and fill_pre < 0.90: reasons.append(f"fill ratio {fill_pre:.2f} < 0.90 for a tile expected to be solid")
    if (gray_art >= (0.10 if t['band'] <= 6 else 0.15)) or edge_amb >= 0.35: reasons.append(f"grey artwork ({gray_art:.2f} of tile centre, edge band {edge_amb:.2f}) cannot be separated from grey checker by colour; needs manual mask")
    if pocket_kept_px > 0.02 * bbox_area: reasons.append(f"{pocket_kept_px}px of unresolved checker-like pockets kept")
    manual_review = any(
        x0 < rx1 and x1 > rx0 and y0 < ry1 and y1 > ry0
        for rx0, ry0, rx1, ry1 in MANUAL_REVIEW_REGIONS
    )
    if manual_review:
        reasons.append('gray bridge pillar matches a neighboring pillar; preserve original pixels pending a manual mask')
    if t['band'] == 3:
        reasons.append('junction tiles mix gray cobble and checker-like pixels; preserve original pixels pending manual masks')
    if reasons: status = 'low'
    elif edge_amb >= 0.15 or seam or ring_clean < 0.97: status = 'medium'
    else: status = 'high'
    if status == 'medium':
        if edge_amb >= 0.15: reasons.append(f'edge band {edge_amb:.2f} neutral grey: check outline pixels visually')
        if seam: reasons.append(f"local checker lattice agreement {fit['agreement']:.2f} (phase seam near tile; informational - removal is colour based, not lattice based)")
        if ring_clean < 0.97: reasons.append(f"gap ring {ring_clean:.2f} checker-consistent")
    res.update(status=status, reasons=reasons, fill_ratio=round(fill, 4), fill_ratio_before_trim=round(fill_pre, 4), edge_neutral_fraction=round(edge_amb, 3),
               ring_checker_fraction=round(ring_clean, 3), gray_art_fraction=round(gray_art, 3), core_bg_px=core_bg, pockets_removed_px=pocket_removed_px,
               pockets_kept_px=pocket_kept_px, specks_removed=specks, fringe_px_trimmed=fringe_trimmed,
               manual_background_px=int(manual_bg.sum()), opaque_px=int(tile_fg.sum()))
    return res, (win, fg & inbox, bg & inbox)


def main():
    h_before = sha256(SRC)
    if h_before != sha256(ORIG):
        sys.exit('ABORT: public/assets/terrain copy differs from assets-source original')
    img = Image.open(SRC); rgb = np.array(img.convert('RGB'))
    H, W = rgb.shape[:2]
    lum = rgb.astype(float).mean(2); chroma = (rgb.max(2).astype(int) - rgb.min(2).astype(int))
    for d in (OUT, DIAG, PREV): d.mkdir(parents=True, exist_ok=True)

    chk = measure_checker(rgb)
    domain = lattice_domain_report(rgb, chk)
    neu, gap_rows, bands = find_bands(rgb)
    tiles = tile_boxes(rgb, neu, bands)
    print(f'checker shades {chk["shades"]["dark"]:.1f}/{chk["shades"]["light"]:.1f}  period {chk["period_px"]:.2f}  bands {len(bands)}  tiles {len(tiles)}')

    canvas = np.zeros((H, W, 4), np.uint8)
    grass_candidate = np.zeros((H, W, 4), np.uint8)
    fg_all = np.zeros((H, W), bool); bg_all = np.zeros((H, W), bool); uncertain = np.zeros((H, W), bool)
    records = []
    for t in tiles:
        r, extra = process_tile(rgb, lum, chroma, chk, t, tiles, canvas, no_fringe=t['band'] in (2, 6))
        t.update(r)
        if (
            (t['band'], t['x']) in VISUALLY_APPROVED_GRASS_TILES
            and t['status'] == 'low'
            and all(reason.startswith('gap ring only') for reason in t['reasons'])
        ):
            t['status'] = 'medium'
            t['visual_review'] = 'reviewed-8x-magenta-and-cyan'
        if extra is None: continue
        (wy0, wy1, wx0, wx1), fgm, bgm = extra
        sl = (slice(wy0, wy1), slice(wx0, wx1))
        if t['band'] == 0 and t['x'] in (631, 707):
            candidate = grass_candidate[sl]
            candidate[fgm, :3] = rgb[sl][fgm]
            candidate[fgm, 3] = 255
        fg_all[sl] |= fgm; bg_all[sl] |= bgm
        if t['status'] in ('high', 'medium'):
            sub = canvas[sl]; sub[fgm, :3] = rgb[sl][fgm]; sub[fgm, 3] = 255
        else:
            uncertain[t['y']:t['y'] + t['h'], t['x']:t['x'] + t['w']] = True
            # Do not discard ambiguous gray artwork. Keep the original crop opaque
            # (including its checker) until a manual mask can safely separate it.
            ys = slice(t['y'], t['y'] + t['h'])
            xs = slice(t['x'], t['x'] + t['w'])
            canvas[ys, xs, :3] = rgb[ys, xs]
            canvas[ys, xs, 3] = 255

    # ---- write processed sheet (never overwrites the source) ----
    grass_crop = Image.fromarray(grass_candidate, 'RGBA').crop((620, 0, 790, 78))
    grass_crop.save(DIAG / 'grass-divider-candidate.png')
    candidate_alpha = np.array(grass_crop.getchannel('A'))
    if candidate_alpha[0:4, 70:101].any() or candidate_alpha[:, 82:87].any():
        sys.exit('ABORT: manually identified grass strip or divider remains opaque')
    if canvas[0:4, 690:721, 3].any() or canvas[0:77, 702:707, 3].any():
        sys.exit('ABORT: required grass strip or divider remains opaque in the processed sheet')
    Image.fromarray(canvas, 'RGBA').save(OUT / 'terrain-tileset-clean-partial.png')
    grass_before = Image.fromarray(rgb).crop((620, 0, 790, 78))
    for tag, color in (('magenta', (255, 0, 255)), ('cyan', (0, 255, 255))):
        scale = 8
        before = grass_before.resize((grass_before.width * scale, grass_before.height * scale), Image.Resampling.NEAREST)
        after = grass_crop.resize((grass_crop.width * scale, grass_crop.height * scale), Image.Resampling.NEAREST)
        panel = Image.new('RGB', (before.width + 60, before.height * 2 + 80), (32, 32, 32))
        ImageDraw.Draw(panel).text((20, 5), f'candidate before/after; 8x; {tag}', fill='white')
        panel.paste(before, (20, 40))
        background = Image.new('RGBA', after.size, (*color, 255)); background.alpha_composite(after)
        panel.paste(background.convert('RGB'), (20, before.height + 60))
        panel.save(PREV / f'terrain-grass-candidate-8x-{tag}.png')

    # ---- tile metadata ----
    meta_tiles = []
    for t in tiles:
        cx = t['x'] + t['w'] / 2
        span = round(t['w'] / 73.0)
        notes = list(t.get('reasons', []))
        if t['band'] == 0 and any(
            t['x'] <= seam[0] <= t['x'] + t['w'] for seam in MANUAL_SPLIT_SEAMS.get(0, [])
        ):
            notes.append('split at visually inspected gray divider; manually identified top-edge strip removed')
        if t.get('status') == 'low':
            notes.append('original pixels retained opaque in partial sheet; checker removal requires manual mask')
        if t['w'] > 100: notes.append(f"wide element ~{span} cells; may be one design or touching tiles (not splittable by gap evidence)")
        meta_tiles.append(dict(
            id=f"terrain_b{t['band']}_{t['order']:02d}", band=t['band'], order_in_band=t['order'],
            grid_col_estimate=int(cx // GRID_PITCH_X_HYP),
            x=t['x'], y=t['y'], w=t['w'], h=t['h'],
            category=BAND_CATEGORY[t['band']], category_basis='row band, assigned by visual inspection',
            confidence=t['status'],
            alpha_exported=t['status'] in ('high', 'medium'),
            manual_mask_required=t['status'] == 'low',
            visual_review=t.get('visual_review', 'manual-review-required' if t['status'] == 'low' else 'not-verified-by-heuristic'),
            fill_ratio=t.get('fill_ratio'), edge_neutral_fraction=t.get('edge_neutral_fraction'),
            lattice_agreement=(round(t['lattice']['agreement'], 3) if t.get('lattice') else None), gray_art_fraction=t.get('gray_art_fraction'),
            manual_background_px=t.get('manual_background_px', 0),
            notes=notes))
    counts = {k: sum(1 for m in meta_tiles if m['confidence'] == k) for k in ('high', 'medium', 'low')}
    meta = dict(
        source='assets/terrain/terrain-tileset.png', source_sha256=h_before, source_size=[W, H],
        processed='assets/processed/terrain/terrain-tileset-clean-partial.png',
        rect_semantics='x,y,w,h are SOURCE pixel coordinates of the measured tile box in both the original and processed sheet (same canvas)',
        tile_size_note='tiles are NOT a uniform size; no 16x16 or 32x32 grid exists in this artwork',
        counts=counts, bands=[dict(index=i, y0=a, y1=b, h=b - a + 1, category=BAND_CATEGORY.get(i)) for i, (a, b) in enumerate(bands)],
        tiles=meta_tiles)
    (OUT / 'terrain-tiles.json').write_text(json.dumps(meta, indent=1))

    # ---- measurements ----
    measurements = dict(
        source=str(SRC.relative_to(ROOT)), sha256=h_before, size=[W, H], mode=img.mode,
        checker=chk, lattice_domains=domain, gap_rows=gap_rows,
        bands=[list(b) for b in bands],
        grid_hypothesis=dict(columns=18, pitch_x=GRID_PITCH_X_HYP, note='ESTIMATE: tiles start 0-8 px away from nominal cell starts; placement is irregular'),
        tile_width_stats=dict(
            single_cell_widths=sorted(set(int(m['w']) for m in meta_tiles if m['w'] < 90 and m['band'] not in (7, 8, 9))),
            median_single_cell_w=float(np.median([m['w'] for m in meta_tiles if m['w'] < 90 and m['band'] in (0, 1, 3, 5)])),
            median_single_cell_h=float(np.median([m['h'] for m in meta_tiles if m['band'] in (0, 1, 3, 5)]))),
        counts=counts)
    (DIAG / 'terrain-measurements.json').write_text(json.dumps(measurements, indent=1))

    # ---- diagnostic masks / overlays ----
    Image.fromarray((fg_all * 255).astype(np.uint8)).save(DIAG / 'mask-foreground.png')
    Image.fromarray((bg_all * 255).astype(np.uint8)).save(DIAG / 'mask-background-removed.png')
    Image.fromarray((uncertain * 255).astype(np.uint8)).save(DIAG / 'mask-uncertain-not-cleaned.png')
    ov = Image.fromarray(rgb).convert('RGB'); d = ImageDraw.Draw(ov)
    colr = dict(high=(0, 255, 0), medium=(255, 200, 0), low=(255, 40, 40))
    for t in tiles:
        d.rectangle([t['x'], t['y'], t['x'] + t['w'] - 1, t['y'] + t['h'] - 1], outline=colr[t['status']])
    for gs, ge in gap_rows: d.line([(0, gs), (W, gs)], fill=(0, 160, 255)); d.line([(0, ge), (W, ge)], fill=(0, 160, 255))
    ov.save(DIAG / 'overlay-tile-boxes-by-confidence.png')
    # lattice agreement against the single global lattice (red = disagrees) shows the phase domains
    f = chk['empty_region_fits']['B']; p = chk['period_px']; yy, xx = np.mgrid[0:H, 0:W]; sh = chk['shades']
    par = ((np.floor((xx - f['ox']) / p) + np.floor((yy - f['oy']) / p)).astype(int) & 1).astype(bool)
    ck = (chroma <= 7) & ((abs(lum - sh['dark']) <= 12) | (abs(lum - sh['light']) <= 12))
    m = np.zeros((H, W, 3), np.uint8) + 40; ag = par == (lum > sh['split'])
    m[ck & ag] = (60, 200, 60); m[ck & ~ag] = (220, 50, 50)
    Image.fromarray(m).save(DIAG / 'checker-global-lattice-agreement.png')

    # ---- contact sheets ----
    def checker_bg(size, cell=8):
        im = Image.new('RGB', size, (255, 0, 255)); dd = ImageDraw.Draw(im)
        for yy_ in range(0, size[1], cell):
            for xx_ in range(0, size[0], cell):
                if (xx_ // cell + yy_ // cell) & 1: dd.rectangle([xx_, yy_, xx_ + cell - 1, yy_ + cell - 1], fill=(0, 255, 255))
        return im
    clean = Image.fromarray(canvas, 'RGBA')
    for tag, bgim in (('neutral', Image.new('RGB', (W, H), (128, 128, 128))), ('checker', checker_bg((W, H)))):
        b = bgim.convert('RGBA'); b.alpha_composite(clean); b.convert('RGB').save(PREV / f'terrain-clean-on-{tag}.png')
    # before / after, stacked
    ba = Image.new('RGB', (W, H * 2 + 8), (0, 0, 0)); ba.paste(Image.fromarray(rgb), (0, 0))
    b = checker_bg((W, H)).convert('RGBA'); b.alpha_composite(clean); ba.paste(b.convert('RGB'), (0, H + 8)); ba.save(PREV / 'terrain-before-after.png')
    # uncertain regions: ORIGINAL pixels, preserved for manual masking
    unc = [t for t in tiles if t['status'] == 'low']
    if unc:
        cols = 6; cw = 160; ch = 150
        rows_n = (len(unc) + cols - 1) // cols
        sheet = Image.new('RGB', (cols * cw, rows_n * (ch + 14)), (30, 30, 30)); dd = ImageDraw.Draw(sheet)
        for i, t in enumerate(unc):
            crop = Image.fromarray(rgb[t['y']:t['y'] + t['h'], t['x']:t['x'] + t['w']])
            k = min(2, (cw - 8) / crop.width, (ch - 8) / crop.height); crop = crop.resize((max(1, int(crop.width * k)), max(1, int(crop.height * k))), Image.NEAREST)
            cx0, cy0 = (i % cols) * cw, (i // cols) * (ch + 14); sheet.paste(crop, (cx0 + 4, cy0 + 4))
            dd.text((cx0 + 3, cy0 + ch), f"b{t['band']}_{t['order']:02d}", fill=(255, 255, 255))
        sheet.save(PREV / 'terrain-uncertain-regions-original-pixels.png')

    # Inspect the hand-corrected grass seam and the two matching bridge pillars at native
    # pixels, enlarged with nearest-neighbour sampling on contrasting backgrounds.
    for name, box in (
        ('grass-divider', (620, 0, 790, 78)),
        ('bridge-pillars', (215, 615, 410, 690)),
    ):
        original = Image.fromarray(rgb[box[1]:box[3], box[0]:box[2]])
        processed = clean.crop(box)
        original = original.resize((original.width * 8, original.height * 8), Image.Resampling.NEAREST)
        processed = processed.resize((processed.width * 8, processed.height * 8), Image.Resampling.NEAREST)
        for bg_name, color in (('magenta', (255, 0, 255)), ('cyan', (0, 255, 255))):
            pad, label = 20, 30
            preview = Image.new('RGB', (original.width + 3 * pad, 2 * original.height + 3 * pad + label), (32, 32, 32))
            draw = ImageDraw.Draw(preview)
            draw.text((pad, 5), f'{name}: original above / processed below; 8x; {bg_name}', fill='white')
            preview.paste(original, (pad, pad + label))
            background = Image.new('RGBA', processed.size, (*color, 255))
            background.alpha_composite(processed)
            preview.paste(background.convert('RGB'), (pad, 2 * pad + label + original.height))
            preview.save(PREV / f'terrain-{name}-8x-{bg_name}.png')

    # source integrity
    if sha256(SRC) != h_before: sys.exit('ABORT: source changed during processing')
    print('tiles', counts, '| source hash unchanged', h_before[:12])
    for bi, (a, b) in enumerate(bands):
        ts = [t for t in tiles if t['band'] == bi]
        print(f"band {bi} y{a}-{b} {BAND_CATEGORY[bi]:17s} n={len(ts):2d} " + ' '.join(t['status'][0] for t in ts))


if __name__ == '__main__':
    main()
