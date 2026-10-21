#!/usr/bin/env python3
"""Validate processed images, catalog metadata, crops, contacts, and source hashes."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import sys
from typing import Any

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / 'public'
SOURCE = ROOT / 'assets-source'
MANIFEST = ROOT / 'src/config/assetManifestData.json'
MANIFEST_TS = ROOT / 'src/config/assetManifest.ts'
HASH_BASELINE = ROOT / 'assets-processing/source-hashes-before.json'
CONTACTS = ROOT / 'assets-processing/previews'
EXPECTED_CONTACTS = [
    'player-frames-contact-neutral.png',
    'player-frames-contact-checker.png',
    'player-sheet-atlas-contact-neutral.png',
    'player-sheet-atlas-contact-checker.png',
    'buildings-contact-neutral.png',
    'buildings-contact-checker.png',
    'terrain-contact-neutral.png',
    'terrain-contact-checker.png',
    'controls-contact-neutral.png',
    'controls-contact-checker.png',
    'terrain-grass-divider-8x-magenta.png',
    'terrain-grass-divider-8x-cyan.png',
    'terrain-bridge-pillars-8x-magenta.png',
    'terrain-bridge-pillars-8x-cyan.png',
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def result(status: str, details: list[str]) -> dict[str, Any]:
    return {'status': status, 'details': details}


def run() -> dict[str, Any]:
    checks: dict[str, dict[str, Any]] = {}
    manual_findings: list[str] = []
    failures: list[str] = []

    if not MANIFEST.exists():
        checks['manifest'] = result('FAIL', [f'Missing {MANIFEST.relative_to(ROOT)}'])
        return {'status': 'FAIL', 'checks': checks, 'manualReview': manual_findings}
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    assets = manifest.get('assets', [])
    keys = [asset.get('key') for asset in assets]
    paths = [asset.get('path') for asset in assets]
    structural_errors = []
    if len(keys) != len(set(keys)):
        structural_errors.append('Manifest keys are not unique')
    if len(paths) != len(set(paths)):
        structural_errors.append('Manifest paths are not unique')
    if len(assets) != 56:
        structural_errors.append(f'Expected 56 catalog entries, found {len(assets)}')
    ts_source = MANIFEST_TS.read_text(encoding='utf-8') if MANIFEST_TS.exists() else ''
    if "from './assetManifestData.json'" not in ts_source:
        structural_errors.append('Runtime TypeScript manifest is not backed by assetManifestData.json')
    if 'ASSET_CATALOG' not in ts_source or 'ESSENTIAL_IMAGES' not in ts_source:
        structural_errors.append('Runtime catalog or compatible preload export is missing')
    essentials = [asset for asset in assets if asset.get('essential')]
    essential_keys = {asset.get('key') for asset in essentials}
    if essential_keys != {'player-sheet', 'buildings-sheet', 'terrain-tileset', 'mobile-controls-sheet'}:
        structural_errors.append(f'Unexpected essential preload keys: {sorted(essential_keys)}')
    if structural_errors:
        checks['manifest'] = result('FAIL', structural_errors)
        failures.extend(structural_errors)
    else:
        checks['manifest'] = result('PASS', [f'{len(assets)} unique records; four existing essential preload entries'])

    file_errors: list[str] = []
    image_errors: list[str] = []
    crop_errors: list[str] = []
    frame_errors: list[str] = []
    for asset in assets:
        key = asset.get('key', '<missing-key>')
        relative = asset.get('path')
        if not isinstance(relative, str):
            file_errors.append(f'{key}: missing path')
            continue
        image_path = (PUBLIC / relative).resolve()
        if not image_path.is_relative_to(PUBLIC.resolve()):
            file_errors.append(f'{key}: path escapes public/')
            continue
        if not image_path.is_file():
            file_errors.append(f'{key}: missing file {relative}')
            continue
        try:
            with Image.open(image_path) as image:
                image.load()
                if image.size != (asset.get('width'), asset.get('height')):
                    image_errors.append(
                        f"{key}: manifest {asset.get('width')}x{asset.get('height')}, "
                        f"actual {image.width}x{image.height}"
                    )
                has_alpha = 'A' in image.getbands()
                alpha_transparent = has_alpha and image.getchannel('A').getextrema()[0] < 255
                if has_alpha != asset.get('hasAlpha'):
                    image_errors.append(f'{key}: alpha-channel declaration is incorrect')
                if alpha_transparent != asset.get('alphaHasTransparency'):
                    image_errors.append(f'{key}: transparent-pixel declaration is incorrect')
                expected_status = (
                    'present-with-transparency' if alpha_transparent
                    else 'present-fully-opaque' if has_alpha
                    else 'absent'
                )
                if asset.get('alphaChannelStatus') != expected_status:
                    image_errors.append(f'{key}: alphaChannelStatus should be {expected_status}')
                alpha_bbox = image.getchannel('A').getbbox() if has_alpha else image.getbbox()
                if alpha_bbox is None:
                    crop_errors.append(f'{key}: image is empty')

                crop = asset.get('cropMetadata')
                if crop:
                    source_path = SOURCE / Path(crop.get('source', '')).name
                    rect = crop.get('sourceRect', {})
                    if not source_path.is_file():
                        crop_errors.append(f'{key}: missing crop source {crop.get("source")}')
                    elif not all(isinstance(rect.get(field), int) for field in ('x', 'y', 'w', 'h')):
                        crop_errors.append(f'{key}: crop rectangle is incomplete')
                    else:
                        with Image.open(source_path) as source_image:
                            x, y, w, h = (rect[field] for field in ('x', 'y', 'w', 'h'))
                            if w <= 0 or h <= 0 or x < 0 or y < 0 or x + w > source_image.width or y + h > source_image.height:
                                crop_errors.append(f'{key}: crop rectangle is empty or outside its source')
                            if (image.width, image.height) != (w, h):
                                crop_errors.append(f'{key}: output size does not match its measured source crop')
                    if not asset.get('limitations'):
                        crop_errors.append(f'{key}: unresolved crop limitations are not recorded')
                    if crop.get('facingDirectionVerified') is False or crop.get('animationOrderVerified') is False:
                        manual_findings.append(f'{key}: player-facing/animation semantics remain unverified')

                frame_meta = asset.get('frameMetadata') or {}
                for frame in frame_meta.get('sourceBounds', []):
                    rect = (frame['x'], frame['y'], frame['w'], frame['h'])
                    if min(rect[2:]) <= 0 or rect[0] < 0 or rect[1] < 0 or rect[0] + rect[2] > image.width or rect[1] + rect[3] > image.height:
                        frame_errors.append(f'{key}: source frame bounds exceed the image')
                atlas_frames = frame_meta.get('frameBounds', [])
                if atlas_frames:
                    boxes = []
                    for frame in atlas_frames:
                        x, y, w, h = (frame[name] for name in ('x', 'y', 'w', 'h'))
                        if w <= 0 or h <= 0 or x < 0 or y < 0 or x + w > image.width or y + h > image.height:
                            frame_errors.append(f'{key}: atlas frame bounds exceed the image')
                        if any(x < ox + ow and x + w > ox and y < oy + oh and y + h > oy for ox, oy, ow, oh in boxes):
                            frame_errors.append(f'{key}: atlas frames overlap')
                        boxes.append((x, y, w, h))
                    if len(atlas_frames) != 16:
                        frame_errors.append(f'{key}: expected 16 verified atlas frame rectangles')

                source_frames = frame_meta.get('frames', [])
                frame_source = frame_meta.get('source')
                if source_frames and frame_source:
                    frame_source_path = SOURCE / Path(frame_source).name
                    if not frame_source_path.is_file():
                        frame_errors.append(f'{key}: missing frame source {frame_source}')
                    else:
                        with Image.open(frame_source_path) as source_image:
                            for frame in source_frames:
                                x, y, w, h = (frame[name] for name in ('x', 'y', 'w', 'h'))
                                if w <= 0 or h <= 0 or x < 0 or y < 0 or x + w > source_image.width or y + h > source_image.height:
                                    frame_errors.append(f'{key}: measured source frame bounds exceed their source')

                tile_path = frame_meta.get('tileMetadataPath')
                if tile_path and asset.get('key') == 'terrain-tileset':
                    tile_meta_path = ROOT / tile_path
                    if not tile_meta_path.is_file():
                        frame_errors.append(f'{key}: missing tile metadata {tile_path}')
                    else:
                        tile_data = json.loads(tile_meta_path.read_text(encoding='utf-8'))
                        tiles = tile_data.get('tiles', [])
                        if len(tiles) != frame_meta.get('tileCount'):
                            frame_errors.append(f'{key}: tile count disagrees with manifest')
                        tile_boxes = []
                        for tile in tiles:
                            x, y, w, h = (tile[name] for name in ('x', 'y', 'w', 'h'))
                            if w <= 0 or h <= 0 or x < 0 or y < 0 or x + w > image.width or y + h > image.height:
                                frame_errors.append(f"{key}: tile {tile.get('id')} is outside the image")
                            if any(x < ox + ow and x + w > ox and y < oy + oh and y + h > oy for ox, oy, ow, oh in tile_boxes):
                                frame_errors.append(f"{key}: tile rectangles overlap")
                            tile_boxes.append((x, y, w, h))
                            if tile.get('manual_mask_required'):
                                manual_findings.append(f"{tile.get('id')}: original pixels retained; manual mask required")
                if asset.get('category') == 'buildings' and 'workshop' in key:
                    failures.append(f'{key}: missing workshop artwork must not be catalogued as an available file')
        except (OSError, ValueError, TypeError, KeyError) as error:
            image_errors.append(f'{key}: could not decode image ({error})')

    for label, errors in (
        ('requiredFiles', file_errors),
        ('imageDimensionsAndAlpha', image_errors),
        ('crops', crop_errors),
        ('spriteFramesAndTiles', frame_errors),
    ):
        checks[label] = result('FAIL' if errors else 'PASS', errors or ['All checks passed'])
        failures.extend(errors)

    contact_errors = [name for name in EXPECTED_CONTACTS if not (CONTACTS / name).is_file()]
    checks['contactSheets'] = result(
        'FAIL' if contact_errors else 'PASS',
        [f'Missing contact sheet or 8x preview: {name}' for name in contact_errors]
        or ['All ten neutral/checker sheets and four required 8x comparisons exist'],
    )
    failures.extend(f'Missing contact sheet: {name}' for name in contact_errors)

    hash_errors = []
    if not HASH_BASELINE.is_file():
        hash_errors.append(f'Missing pre-processing hash baseline {HASH_BASELINE.relative_to(ROOT)}')
    else:
        baseline = json.loads(HASH_BASELINE.read_text(encoding='utf-8'))
        expected = baseline.get('files', {})
        actual_files = {path.name: sha256(path).upper() for path in sorted(SOURCE.iterdir()) if path.is_file()}
        if len(expected) != 13:
            hash_errors.append(f'Expected 13 baseline hashes, found {len(expected)}')
        if set(actual_files) != set(expected):
            hash_errors.append('Source filename set changed after baseline capture')
        for name in sorted(set(actual_files) & set(expected)):
            if actual_files[name] != expected[name]:
                hash_errors.append(f'Source hash changed: {name}')
    checks['originalSourceHashes'] = result('FAIL' if hash_errors else 'PASS', hash_errors or ['All 13 source SHA-256 hashes match the baseline'])
    failures.extend(hash_errors)

    for asset in assets:
        if asset.get('limitations') and any(word in asset['limitations'].lower() for word in ('manual', 'not verified', 'unverified', 'residue', 'review')):
            manual_findings.append(f"{asset['key']}: {asset['limitations']}")
    manual_findings = sorted(set(manual_findings))
    status = 'FAIL' if failures else 'NEEDS_MANUAL_REVIEW' if manual_findings else 'PASS'
    return {
        'status': status,
        'checks': checks,
        'manualReview': manual_findings,
        'visualQualityClaim': 'Not assessed by programmatic validation',
    }


def main() -> int:
    try:
        report = run()
    except (OSError, ValueError, TypeError, KeyError, ImportError) as error:
        print(json.dumps({'status': 'FAIL', 'error': str(error)}, indent=2))
        return 1
    print(json.dumps(report, indent=2))
    return 1 if report['status'] == 'FAIL' else 0


if __name__ == '__main__':
    sys.exit(main())
