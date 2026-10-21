#!/usr/bin/env python3
"""Contact sheets for inspecting transparent edges: neutral grey and high-contrast checker backgrounds."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

def checker(size, cell=8, a=(255, 0, 255), b=(0, 255, 255)):
    im = Image.new('RGB', size, a); d = ImageDraw.Draw(im)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) & 1: d.rectangle([x, y, x + cell - 1, y + cell - 1], fill=b)
    return im

def sheet(files, out_prefix, cols=6, cell=(180, 180), scale_max=2):
    rows = (len(files) + cols - 1) // cols
    W, H = cols * cell[0], rows * (cell[1] + 14)
    for tag, bgmaker in (('neutral', lambda s: Image.new('RGB', s, (128, 128, 128))), ('checker', checker)):
        canvas = bgmaker((W, H)).convert('RGBA'); d = ImageDraw.Draw(canvas)
        for i, f in enumerate(files):
            im = Image.open(f).convert('RGBA')
            k = min(scale_max, (cell[0] - 8) / im.width, (cell[1] - 8) / im.height)
            k = max(1, int(k)) if k >= 1 else k
            im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.NEAREST)
            cx, cy = (i % cols) * cell[0], (i // cols) * (cell[1] + 14)
            canvas.alpha_composite(im, (cx + (cell[0] - im.width) // 2, cy + (cell[1] - im.height) // 2))
            d.text((cx + 3, cy + cell[1]), Path(f).stem[:28], fill=(255, 255, 255, 255))
        canvas.convert('RGB').save(f'{out_prefix}-{tag}.png')

if __name__ == '__main__':
    d = Path(sys.argv[1]); out = sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
    sheet(sorted(d.glob('*.png')), out, cols)
