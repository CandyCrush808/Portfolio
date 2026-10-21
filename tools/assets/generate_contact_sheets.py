#!/usr/bin/env python3
"""Generate neutral/checker contact sheets for processed art and terrain crops."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
PROCESSED = ROOT / 'public/assets/processed'
PREVIEWS = ROOT / 'assets-processing/previews'


def checker(size: tuple[int, int], cell: int = 8) -> Image.Image:
    image = Image.new('RGB', size, (255, 0, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) & 1:
                draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=(0, 255, 255))
    return image


def create_sheet(
    items: list[tuple[str, Image.Image]],
    prefix: str,
    columns: int,
    cell: tuple[int, int],
) -> None:
    rows = (len(items) + columns - 1) // columns
    sheet_size = (columns * cell[0], rows * (cell[1] + 18))
    PREVIEWS.mkdir(parents=True, exist_ok=True)
    for background_name, background in (
        ('neutral', lambda: Image.new('RGB', sheet_size, (128, 128, 128))),
        ('checker', lambda: checker(sheet_size)),
    ):
        canvas = background().convert('RGBA')
        draw = ImageDraw.Draw(canvas)
        for index, (label, source) in enumerate(items):
            image = source.convert('RGBA')
            scale = min(2, (cell[0] - 8) / image.width, (cell[1] - 8) / image.height)
            if scale >= 1:
                scale = max(1, int(scale))
            size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
            image = image.resize(size, Image.Resampling.NEAREST)
            x = (index % columns) * cell[0]
            y = (index // columns) * (cell[1] + 18)
            canvas.alpha_composite(image, (x + (cell[0] - image.width) // 2, y + (cell[1] - image.height) // 2))
            draw.text((x + 3, y + cell[1]), label[:28], fill=(255, 255, 255, 255))
        canvas.convert('RGB').save(PREVIEWS / f'{prefix}-{background_name}.png')


def load_images(paths: list[tuple[str, Path]]) -> list[tuple[str, Image.Image]]:
    return [(label, Image.open(path).convert('RGBA')) for label, path in paths]


def main() -> None:
    player = PROCESSED / 'player'
    player_frames = sorted((player / 'frames').glob('player-r*c*.png'))
    if len(player_frames) != 16:
        raise RuntimeError(f'Expected 16 player frames, found {len(player_frames)}')
    create_sheet(
        [(path.stem, Image.open(path)) for path in player_frames],
        'player-frames-contact',
        columns=4,
        cell=(180, 190),
    )
    create_sheet(
        load_images([
            ('cleaned-sheet', player / 'player-sheet-clean.png'),
            ('normalized-atlas', player / 'player-atlas-normalized.png'),
        ]),
        'player-sheet-atlas-contact',
        columns=2,
        cell=(320, 360),
    )

    building_dir = PROCESSED / 'buildings/individual'
    building_files = sorted(building_dir.glob('*.png'))
    if len(building_files) != 4:
        raise RuntimeError(f'Expected 4 extracted buildings; found {len(building_files)}')
    create_sheet(
        [(path.stem, Image.open(path)) for path in building_files],
        'buildings-contact',
        columns=4,
        cell=(220, 200),
    )

    control_dir = PROCESSED / 'ui/controls'
    control_files = sorted(control_dir.glob('*.png'))
    if len(control_files) != 31:
        raise RuntimeError(f'Expected 31 mobile-control assets; found {len(control_files)}')
    create_sheet(
        [(path.stem, Image.open(path)) for path in control_files],
        'controls-contact',
        columns=6,
        cell=(160, 150),
    )

    tile_data = json.loads((PROCESSED / 'terrain/terrain-tiles.json').read_text(encoding='utf-8'))
    tile_sheet = Image.open(PROCESSED / 'terrain/terrain-tileset-clean-partial.png').convert('RGBA')
    tiles = []
    for tile in tile_data['tiles']:
        rect = (tile['x'], tile['y'], tile['x'] + tile['w'], tile['y'] + tile['h'])
        tiles.append((tile['id'], tile_sheet.crop(rect)))
    create_sheet(tiles, 'terrain-contact', columns=8, cell=(150, 140))


if __name__ == '__main__':
    main()
