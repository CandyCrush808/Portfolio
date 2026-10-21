#!/usr/bin/env python3
"""Build the runtime asset catalog from measured processing metadata."""
from __future__ import annotations

import json
from pathlib import Path
import re

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / 'public'
PROCESSED = PUBLIC / 'assets/processed'
DIAGNOSTICS = ROOT / 'assets-processing/diagnostics'
OUTPUT = ROOT / 'src/config/assetManifestData.json'


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding='utf-8'))


def image_entry(
    key: str,
    path: Path,
    category: str,
    intended_use: str,
    limitations: str,
    *,
    essential: bool = False,
    frame_metadata: dict | None = None,
    crop_metadata: dict | None = None,
) -> dict:
    image = Image.open(path)
    has_alpha = 'A' in image.getbands()
    alpha_has_transparency = has_alpha and image.getchannel('A').getextrema()[0] < 255
    return {
        'key': key,
        'path': path.relative_to(PUBLIC).as_posix(),
        'width': image.width,
        'height': image.height,
        'hasAlpha': has_alpha,
        'alphaHasTransparency': alpha_has_transparency,
        'alphaChannelStatus': (
            'present-with-transparency' if alpha_has_transparency
            else 'present-fully-opaque' if has_alpha
            else 'absent'
        ),
        'category': category,
        'essential': essential,
        'intendedUse': intended_use,
        'limitations': limitations,
        'note': limitations,
        **({'frameMetadata': frame_metadata} if frame_metadata else {}),
        **({'cropMetadata': crop_metadata} if crop_metadata else {}),
    }


def source_rect(record: dict) -> dict:
    return {name: int(record[name]) for name in ('x', 'y', 'w', 'h')}


def main() -> None:
    player_data = load_json(DIAGNOSTICS / 'player/player-measurements.json')
    building_data = load_json(DIAGNOSTICS / 'buildings/buildings-measurements.json')
    control_data = load_json(DIAGNOSTICS / 'ui/controls-measurements.json')
    terrain_data = load_json(PROCESSED / 'terrain/terrain-tiles.json')
    original_player = player_data['source']
    player_frames = player_data['boxes']
    atlas_rects = [
        {
            'row': int(frame['row']),
            'column': int(frame['col']),
            'x': int(frame['col'] * player_data['cell'][0] + frame['atlas_offset'][0]),
            'y': int(frame['row'] * player_data['cell'][1] + frame['atlas_offset'][1]),
            'w': int(frame['w']),
            'h': int(frame['h']),
        }
        for frame in player_frames
    ]
    player_frame_map = {
        'rows': 4,
        'columns': 4,
        'cellWidth': int(player_data['cell'][0]),
        'cellHeight': int(player_data['cell'][1]),
        'order': 'row-major by measured frame bounds',
        'sourceBounds': [
            {'row': int(f['row']), 'column': int(f['col']), **source_rect(f)}
            for f in player_frames
        ],
        'semanticDirectionsVerified': False,
        'animationOrderVerified': False,
    }
    atlas_map = {
        'rows': 4,
        'columns': 4,
        'cellWidth': int(player_data['cell'][0]),
        'cellHeight': int(player_data['cell'][1]),
        'order': 'row-major by measured frame bounds',
        'semanticDirectionsVerified': False,
        'animationOrderVerified': False,
        'frameBounds': atlas_rects,
    }

    entries = [
        image_entry(
            'player-sheet',
            PROCESSED / 'player/player-sheet-clean.png',
            'player',
            'Reference sheet and future frame extraction source',
            '16 measured crops exist; facing directions and animation order are not verified.',
            essential=True,
            frame_metadata=player_frame_map,
        ),
        image_entry(
            'player-atlas-normalized',
            PROCESSED / 'player/player-atlas-normalized.png',
            'player',
            'Normalized 4x4 player atlas',
            'Frame cells are 144x176; facing directions and animation order are not verified.',
            frame_metadata=atlas_map,
        ),
    ]
    for frame in player_frames:
        name = frame['file']
        entries.append(image_entry(
            f"player-r{frame['row']}c{frame['col']}",
            PROCESSED / f"player/frames/{name}",
            'player',
            'Individually cropped player pose; row/column identify measured sheet position only',
            'Facing direction and animation order have not been assigned.',
            crop_metadata={
                'source': f'assets-source/{original_player}',
                'sourceRect': source_rect(frame),
                'row': int(frame['row']),
                'column': int(frame['col']),
                'facingDirectionVerified': False,
                'animationOrderVerified': False,
            },
        ))

    building_records = building_data['buildings']
    building_exported = [record for record in building_records if record.get('file')]
    building_rects = [
        {'index': int(record['index']), **source_rect(record['bbox'])}
        for record in building_exported
    ]
    entries.append(image_entry(
        'buildings-sheet',
        PROCESSED / 'buildings/buildings-sheet-clean-partial.png',
        'buildings',
        'Reference sheet containing the safely extracted buildings',
        'Four buildings are exported. The slate-roof workshop is not included because its roof cannot be separated safely without a manual mask.',
        essential=True,
        frame_metadata={
            'frames': building_rects,
            'source': f"assets-source/{building_data['source']}",
            'tileMetadataPath': 'assets-processing/diagnostics/buildings/buildings-measurements.json',
        },
    ))
    for record in building_exported:
        entries.append(image_entry(
            f"building-{record['index']}-{re.sub(r'[^a-z0-9]+', '-', record['name'])}",
            PROCESSED / f"buildings/individual/{record['file']}",
            'buildings',
            f"Extracted {record['name']} building sprite",
            'Roof boundaries and chimney smoke remain subject to visual review; do not assume smoke is a separate animated asset.',
            crop_metadata={
                'source': f"assets-source/{building_data['source']}",
                'sourceRect': source_rect(record['bbox']),
            },
        ))

    terrain_tiles = terrain_data['tiles']
    entries.append(image_entry(
        'terrain-tileset',
        PROCESSED / 'terrain/terrain-tileset-clean-partial.png',
        'terrain',
        'Partial cleaned terrain sheet; source-coordinate tile boxes are in the linked metadata',
        'Ambiguous gray cobblestone, wall, bridge, and junction artwork is retained opaque and requires manual masks; checker pixels remain in those boxes.',
        essential=True,
        frame_metadata={
            'tileCount': len(terrain_tiles),
            'tileMetadataPath': 'public/assets/processed/terrain/terrain-tiles.json',
            'uniformTileSize': False,
            'checkerPeriodEstimatePx': 11.75,
            'checkerPhaseIsGlobal': False,
        },
    ))

    controls = control_data['items']
    control_entries = [
        image_entry(
            'mobile-controls-sheet',
            PROCESSED / 'ui/mobile-controls-sheet-clean.png',
            'mobile-controls',
            'Reference sheet for the extracted touch-control sprites',
            'Per-sprite edge residue remains under visual review; no left-pressed state is present in the source.',
            essential=True,
            frame_metadata={'spriteCount': len(controls), 'cropMetadataPath': 'assets-processing/diagnostics/ui/controls-measurements.json'},
        )
    ]
    for control in controls:
        if control.get('status') == 'FAILED' or not control.get('file'):
            continue
        stem = Path(control['file']).stem
        state = next((suffix for suffix in ('normal', 'pressed', 'active') if stem.endswith(f'-{suffix}')), 'unspecified')
        control_entries.append(image_entry(
            f'control-{stem}',
            PROCESSED / f"ui/controls/{control['file']}",
            'mobile-controls',
            f'Individual mobile control sprite ({state} state)',
            'Source crop; visual inspection found light edge residue that is not safely separable from the authored outline.',
            crop_metadata={
                'source': 'assets-source/Pixel RPG Mobile UI Controls Sheet.png',
                'sourceRect': {key: int(control[key]) for key in ('x', 'y', 'w', 'h')},
                'state': state,
            },
        ))
    entries.extend(control_entries)

    data = {
        'schemaVersion': 1,
        'catalogStatus': 'partial; manual visual review remains',
        'assets': entries,
    }
    OUTPUT.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
    print(f'Wrote {len(entries)} asset records to {OUTPUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
