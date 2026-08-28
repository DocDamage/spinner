"""Review-first image downloader for Multiverse Wheel game assets.

Searches are staged outside the live asset folders. Nothing replaces active art
unless a candidate is explicitly accepted or passes the optional high-confidence
auto-accept gate. Every accepted file records its query, source page, image URL,
score, dimensions, media type, and hash.
"""

from __future__ import annotations

import argparse
import ast
import hashlib
import html
import json
import re
import struct
import sys
import time
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

import requests

try:
    from ddgs import DDGS
except ImportError:  # pragma: no cover - exercised by CLI users without deps
    DDGS = None


ROOT = Path(__file__).resolve().parent
CATALOG_PATH = ROOT / "assets" / "game-asset-catalog.json"
REVIEW_ROOT = ROOT / "asset_review"
MANIFEST_PATH = ROOT / "game_asset_manifest.js"
ACTIVE_DIRS = {
    "character": ROOT / "verified_character_images",
    "item": ROOT / "item_images",
    "macguffin": ROOT / "macguffin_images",
}
IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
NEGATIVE_TERMS = {
    "cosplay", "costume", "toy", "lego", "minecraft", "roblox", "tattoo",
    "meme", "wallpaper pack", "funko", "etsy", "shirt", "ai generated",
    "fan cast", "reaction", "thumbnail template", "coloring page",
}
TRUSTED_HOST_PARTS = {
    "fandom.com", "wikia.nocookie.net", "wikimedia.org", "wikipedia.org",
    "marvel.com", "dc.com", "starwars.com", "pokemon.com", "sonic.sega.jp",
    "nintendo.com", "playstation.com", "xbox.com", "capcom.com", "bandainamco",
}
STOP_TOKENS = {
    "the", "of", "and", "a", "an", "form", "mode", "prime", "earth",
    "official", "render", "transparent", "png", "image", "character",
}
SEARCH_HINTS = {
    "mega_dc_comics__man_bat": "Kirk Langstrom",
    "mega_generator_rex__van_kleiss": "Generator Rex villain",
    "mega_marvel_comics__knull_s_grendel": "Grendel symbiote dragon Knull",
    "mega_metal_gear__solidus_snake": "George Sears Metal Gear Solid 2",
}
ALIASES = {
    "dc comics": "dc", "marvel comics": "marvel", "watchmen dc": "dc",
    "naruto boruto": "naruto", "sonic the hedgehog": "sonic",
    "the legend of zelda": "zelda", "final fantasy vii": "final fantasy",
    "final fantasy xiii": "final fantasy", "final fantasy xv": "final fantasy",
}


def normalize(value: object) -> str:
    text = str(value or "").lower().replace("’", "'")
    text = re.sub(r"[^a-z0-9]+", " ", text).strip()
    return ALIASES.get(text, text)


def tokens(value: object) -> set[str]:
    return {token for token in normalize(value).split() if token not in STOP_TOKENS and len(token) > 1}


def safe_id(value: object) -> str:
    return re.sub(r"[^a-z0-9_-]+", "-", str(value or "").lower()).strip("-")


def load_catalog() -> dict:
    if not CATALOG_PATH.exists():
        raise SystemExit("Missing assets/game-asset-catalog.json. Run: node tools/export-game-assets.js")
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def all_assets(catalog: dict) -> list[dict]:
    return [*catalog["characters"], *catalog["items"], *catalog["macguffins"]]


def select_assets(catalog: dict, kind: str, ids: list[str]) -> list[dict]:
    groups = {
        "characters": catalog["characters"], "character": catalog["characters"],
        "items": catalog["items"], "item": catalog["items"],
        "macguffins": catalog["macguffins"], "macguffin": catalog["macguffins"],
        "all": all_assets(catalog),
    }
    selected = list(groups[kind])
    if ids:
        wanted = {safe_id(value) for value in ids}
        selected = [asset for asset in selected if safe_id(asset["id"]) in wanted]
        missing = sorted(wanted - {safe_id(asset["id"]) for asset in selected})
        if missing:
            raise SystemExit(f"Unknown asset id(s): {', '.join(missing)}")
    return selected


@dataclass(frozen=True)
class ImageInfo:
    extension: str
    mime: str
    width: int
    height: int


def detect_image(data: bytes) -> ImageInfo | None:
    if data.startswith(b"\x89PNG\r\n\x1a\n") and len(data) >= 24:
        width, height = struct.unpack(">II", data[16:24])
        return ImageInfo(".png", "image/png", width, height)
    if data[:6] in {b"GIF87a", b"GIF89a"} and len(data) >= 10:
        width, height = struct.unpack("<HH", data[6:10])
        return ImageInfo(".gif", "image/gif", width, height)
    if data.startswith(b"\xff\xd8"):
        index = 2
        while index + 9 < len(data):
            if data[index] != 0xFF:
                index += 1
                continue
            marker = data[index + 1]
            index += 2
            if marker in {0xD8, 0xD9}:
                continue
            if index + 2 > len(data):
                break
            length = int.from_bytes(data[index:index + 2], "big")
            if marker in {0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF} and index + 7 < len(data):
                height = int.from_bytes(data[index + 3:index + 5], "big")
                width = int.from_bytes(data[index + 5:index + 7], "big")
                return ImageInfo(".jpg", "image/jpeg", width, height)
            index += max(2, length)
    if data.startswith(b"RIFF") and data[8:12] == b"WEBP" and len(data) >= 30:
        chunk = data[12:16]
        if chunk == b"VP8X":
            width = 1 + int.from_bytes(data[24:27], "little")
            height = 1 + int.from_bytes(data[27:30], "little")
            return ImageInfo(".webp", "image/webp", width, height)
        if chunk == b"VP8 " and data[23:26] == b"\x9d\x01\x2a":
            width = int.from_bytes(data[26:28], "little") & 0x3FFF
            height = int.from_bytes(data[28:30], "little") & 0x3FFF
            return ImageInfo(".webp", "image/webp", width, height)
        if chunk == b"VP8L" and data[20] == 0x2F:
            bits = int.from_bytes(data[21:25], "little")
            width = 1 + (bits & 0x3FFF)
            height = 1 + ((bits >> 14) & 0x3FFF)
            return ImageInfo(".webp", "image/webp", width, height)
        return ImageInfo(".webp", "image/webp", 0, 0)
    return None


def candidate_score(asset: dict, result: dict) -> tuple[int, float, list[str]]:
    name_tokens = tokens(asset["name"])
    universe_tokens = tokens(asset.get("universe", ""))
    title = normalize(result.get("title", ""))
    searchable = normalize(" ".join(str(result.get(key, "")) for key in ("title", "url", "image", "source")))
    found = {token for token in name_tokens if token in searchable.split()}
    coverage = len(found) / max(1, len(name_tokens))
    score = round(coverage * 55)
    reasons = [f"name coverage {len(found)}/{len(name_tokens)}"]
    if normalize(asset["name"]) in title:
        score += 24
        reasons.append("exact name phrase")
    universe_hits = len({token for token in universe_tokens if token in searchable.split()})
    if universe_hits:
        score += min(16, universe_hits * 6)
        reasons.append("universe context")
    host = urlparse(str(result.get("url") or result.get("image") or "")).netloc.lower()
    if any(part in host for part in TRUSTED_HOST_PARTS):
        score += 12
        reasons.append("preferred source")
    negative_hits = sorted(term for term in NEGATIVE_TERMS if term in searchable)
    if negative_hits:
        score -= 24 * len(negative_hits)
        reasons.append(f"negative terms: {', '.join(negative_hits)}")
    try:
        width, height = int(result.get("width", 0)), int(result.get("height", 0))
        if min(width, height) >= 500:
            score += 5
        elif width and height and min(width, height) < 220:
            score -= 18
            reasons.append("low resolution")
    except (TypeError, ValueError):
        pass
    if coverage < 0.6:
        score -= 35
        reasons.append("ambiguous name")
    return score, coverage, reasons


def search_query(asset: dict) -> str:
    kind_hint = "fictional artifact prop" if asset["kind"] == "item" else "original science fiction relic" if asset["kind"] == "macguffin" else "character"
    identity_hint = SEARCH_HINTS.get(asset["id"], "")
    return f'"{asset["name"]}" "{asset.get("universe", "")}" {identity_hint} {kind_hint} official render'.strip()


def session() -> requests.Session:
    client = requests.Session()
    client.headers.update({"User-Agent": "MultiverseWheelAssetReview/1.0 (+https://github.com/DocDamage/spinner)"})
    return client


def download_bytes(client: requests.Session, url: str) -> bytes | None:
    try:
        response = client.get(url, timeout=25, stream=True)
        response.raise_for_status()
        length = int(response.headers.get("Content-Length", "0") or 0)
        if length > 18 * 1024 * 1024:
            return None
        data = response.content
        return data if 5_000 <= len(data) <= 18 * 1024 * 1024 else None
    except requests.RequestException:
        return None


def stage_asset(asset: dict, max_candidates: int, client: requests.Session) -> list[dict]:
    if DDGS is None:
        raise SystemExit("Missing ddgs. Install dependencies with: python -m pip install -r requirements.txt")
    query = search_query(asset)
    results = DDGS().images(query, max_results=max(8, max_candidates * 3))
    ranked = []
    for result in results:
        score, coverage, reasons = candidate_score(asset, result)
        ranked.append({**result, "score": score, "coverage": coverage, "reasons": reasons})
    ranked.sort(key=lambda item: (-item["score"], -int(item.get("width", 0) or 0) * int(item.get("height", 0) or 0)))
    target = REVIEW_ROOT / asset["kind"] / safe_id(asset["id"])
    target.mkdir(parents=True, exist_ok=True)
    staged = []
    for result in ranked:
        if len(staged) >= max_candidates:
            break
        data = download_bytes(client, str(result.get("image", "")))
        info = detect_image(data or b"")
        if not data or not info or (info.width and info.height and min(info.width, info.height) < 180):
            continue
        index = len(staged) + 1
        filename = f"candidate-{index}{info.extension}"
        (target / filename).write_bytes(data)
        staged.append({
            "index": index, "file": filename, "query": query, "score": result["score"],
            "coverage": result["coverage"], "reasons": result["reasons"],
            "title": result.get("title", ""), "source": result.get("source", ""),
            "sourcePage": result.get("url", ""), "imageUrl": result.get("image", ""),
            "width": info.width, "height": info.height, "mime": info.mime,
            "sha256": hashlib.sha256(data).hexdigest(),
        })
    record = {"asset": asset, "query": query, "candidates": staged, "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    (target / "candidates.json").write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
    return staged


def active_files(kind: str, asset_id: str) -> list[Path]:
    directory = ACTIVE_DIRS[kind]
    return [path for path in directory.glob(f"{safe_id(asset_id)}.*") if path.suffix.lower() in IMAGE_SUFFIXES]


def accept_candidate(asset: dict, index: int, replace: bool = False) -> Path:
    review_dir = REVIEW_ROOT / asset["kind"] / safe_id(asset["id"])
    record_path = review_dir / "candidates.json"
    if not record_path.exists():
        raise SystemExit(f"No staged candidates for {asset['id']}.")
    record = json.loads(record_path.read_text(encoding="utf-8"))
    candidate = next((item for item in record["candidates"] if item["index"] == index), None)
    if not candidate:
        raise SystemExit(f"Candidate {index} does not exist for {asset['id']}.")
    existing = active_files(asset["kind"], asset["id"])
    if existing and not replace:
        raise SystemExit(f"{asset['id']} already has active art. Re-run with --replace after review.")
    destination_dir = ACTIVE_DIRS[asset["kind"]]
    destination_dir.mkdir(parents=True, exist_ok=True)
    source = review_dir / candidate["file"]
    destination = destination_dir / f"{safe_id(asset['id'])}{source.suffix.lower()}"
    if replace:
        for old in existing:
            if old.resolve().parent == destination_dir.resolve() and old != destination:
                old.unlink()
    destination.write_bytes(source.read_bytes())
    metadata = {"asset": asset, **candidate, "acceptedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    destination.with_suffix(destination.suffix + ".source.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    return destination


def write_manifest() -> list[dict]:
    catalog = load_catalog()
    by_key = {(asset["kind"], safe_id(asset["id"])): asset for asset in all_assets(catalog)}
    entries = []
    for kind, directory in ACTIVE_DIRS.items():
        if not directory.exists():
            continue
        for path in sorted(directory.iterdir()):
            if path.suffix.lower() not in IMAGE_SUFFIXES:
                continue
            asset = by_key.get((kind, path.stem))
            if not asset:
                continue
            data = path.read_bytes()
            info = detect_image(data)
            if not info:
                continue
            metadata_path = path.with_suffix(path.suffix + ".source.json")
            metadata = json.loads(metadata_path.read_text(encoding="utf-8")) if metadata_path.exists() else {}
            entries.append({
                "kind": kind, "id": asset["id"], "name": asset["name"],
                "path": path.relative_to(ROOT).as_posix(), "width": info.width,
                "height": info.height, "mime": info.mime, "sha256": hashlib.sha256(data).hexdigest(),
                "sourcePage": metadata.get("sourcePage", "generated-project-art"),
            })
    MANIFEST_PATH.write_text("self.GAME_ASSET_MANIFEST=" + json.dumps(entries, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    return entries


def legacy_manifest_entries() -> list[dict]:
    path = ROOT / "character_image_manifest.js"
    if not path.exists():
        return []
    source = path.read_text(encoding="utf-8").strip()
    prefix = "window.CHARACTER_IMAGE_MANIFEST="
    if not source.startswith(prefix):
        return []
    return ast.literal_eval(source[len(prefix):].rstrip(";"))


def audit_images() -> dict:
    files = []
    for directory in [ROOT / "character_images", *ACTIVE_DIRS.values()]:
        if directory.exists():
            files.extend(path for path in directory.rglob("*") if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES)
    issues, hashes = [], defaultdict(list)
    for path in files:
        data = path.read_bytes()
        digest = hashlib.sha256(data).hexdigest()
        hashes[digest].append(path.relative_to(ROOT).as_posix())
        info = detect_image(data)
        if not info:
            issues.append({"severity": "error", "path": path.relative_to(ROOT).as_posix(), "reason": "not a recognized image"})
            continue
        if path.suffix.lower() == ".jpeg":
            suffix = ".jpg"
        else:
            suffix = path.suffix.lower()
        if suffix != info.extension:
            issues.append({"severity": "warning", "path": path.relative_to(ROOT).as_posix(), "reason": f"extension {suffix} contains {info.extension} data"})
        if info.width and info.height and min(info.width, info.height) < 180:
            issues.append({"severity": "warning", "path": path.relative_to(ROOT).as_posix(), "reason": f"low resolution {info.width}×{info.height}"})
    duplicates = [paths for paths in hashes.values() if len(paths) > 1]
    for paths in duplicates:
        issues.append({"severity": "review", "path": paths[0], "reason": f"identical bytes used by {len(paths)} files", "matches": paths[1:]})
    report = {
        "files": len(files), "recognized": len(files) - sum(1 for issue in issues if issue["severity"] == "error"),
        "issues": issues, "duplicateGroups": len(duplicates), "legacyManifestEntries": len(legacy_manifest_entries()),
        "note": "Automated checks detect format, resolution, and duplicate failures. Visual identity still requires the generated contact sheet or source-backed accepted candidates.",
    }
    (REVIEW_ROOT / "audit.json").parent.mkdir(parents=True, exist_ok=True)
    (REVIEW_ROOT / "audit.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


def write_review_html() -> Path:
    cards = []
    for record_path in REVIEW_ROOT.glob("*/*/candidates.json"):
        record = json.loads(record_path.read_text(encoding="utf-8"))
        asset = record["asset"]
        candidates = []
        for candidate in record["candidates"]:
            src = (record_path.parent / candidate["file"]).relative_to(REVIEW_ROOT).as_posix()
            candidates.append(f'<figure><img src="{html.escape(src)}" alt=""><figcaption><b>#{candidate["index"]} · score {candidate["score"]}</b><span>{html.escape(candidate["title"])}</span><a href="{html.escape(candidate["sourcePage"])}">Source page</a></figcaption></figure>')
        cards.append(f'<section><h2>{html.escape(asset["name"])} <small>{html.escape(asset["id"])}</small></h2><p>{html.escape(record["query"])}</p><div>{"".join(candidates) or "No valid candidates."}</div></section>')
    legacy_cards = []
    for entry in legacy_manifest_entries():
        legacy_cards.append(f'<figure><img loading="lazy" src="../{html.escape(entry["path"])}" alt=""><figcaption><b>{html.escape(entry["name"])}</b><span>{html.escape(entry["folder"])}</span><code>{html.escape(entry["path"])}</code></figcaption></figure>')
    document = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Multiverse Wheel asset review</title><style>body{{margin:0;padding:24px;background:#050711;color:#eef7ff;font:14px system-ui}}h1,h2{{margin:.4em 0}}small,span,code{{display:block;color:#9fb1c5}}section{{margin:18px 0;padding:16px;border:1px solid #23344e;border-radius:12px}}section>div,.legacy{{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}}figure{{margin:0;padding:8px;background:#0b1324;border-radius:9px}}img{{width:100%;height:220px;object-fit:contain;background:#02050d}}figcaption>*{{margin-top:4px;overflow-wrap:anywhere}}a{{color:#67e8f9}}</style></head><body><h1>Candidate review</h1>{''.join(cards) or '<p>No staged searches yet.</p>'}<h1>Existing character contact sheet</h1><p>Use this visual inventory to identify legacy downloads whose pixels do not match their labels.</p><div class="legacy">{''.join(legacy_cards)}</div></body></html>'''
    path = REVIEW_ROOT / "index.html"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(document, encoding="utf-8")
    return path


def command_search(args: argparse.Namespace) -> None:
    catalog = load_catalog()
    assets = select_assets(catalog, args.kind, args.ids)
    if args.limit:
        assets = assets[:args.limit]
    client = session()
    accepted = 0
    for position, asset in enumerate(assets, 1):
        print(f"[{position}/{len(assets)}] {asset['kind']}: {asset['name']}", flush=True)
        candidates = stage_asset(asset, args.candidates, client)
        if args.auto_accept and candidates:
            top, runner_up = candidates[0], candidates[1] if len(candidates) > 1 else {"score": -99}
            if top["score"] >= 80 and top["coverage"] >= .75 and top["score"] - runner_up["score"] >= 10:
                destination = accept_candidate(asset, top["index"], replace=args.replace)
                accepted += 1
                print(f"  accepted high-confidence candidate -> {destination.relative_to(ROOT)}")
            else:
                print("  staged for review; confidence gate did not pass")
        else:
            print(f"  staged {len(candidates)} candidate(s)")
        if position < len(assets):
            time.sleep(max(0, args.delay))
    write_review_html()
    entries = write_manifest()
    print(f"Review: {REVIEW_ROOT / 'index.html'}")
    print(f"Accepted {accepted}; active manifest now contains {len(entries)} entries.")


def command_accept(args: argparse.Namespace) -> None:
    catalog = load_catalog()
    matches = [asset for asset in all_assets(catalog) if safe_id(asset["id"]) == safe_id(args.id)]
    if len(matches) != 1:
        raise SystemExit(f"Expected one catalog entry for {args.id}; found {len(matches)}.")
    destination = accept_candidate(matches[0], args.candidate, replace=args.replace)
    entries = write_manifest()
    print(f"Accepted {destination.relative_to(ROOT)}; manifest contains {len(entries)} entries.")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Search, verify, review, and activate Multiverse Wheel art.")
    subparsers = parser.add_subparsers(dest="command", required=True)
    search = subparsers.add_parser("search", help="Stage search candidates; optionally auto-accept only high-confidence matches.")
    search.add_argument("--kind", choices=["characters", "items", "macguffins", "all"], default="items")
    search.add_argument("--ids", nargs="*", default=[])
    search.add_argument("--limit", type=int, default=0)
    search.add_argument("--candidates", type=int, default=3)
    search.add_argument("--delay", type=float, default=.8)
    search.add_argument("--auto-accept", action="store_true")
    search.add_argument("--replace", action="store_true", help="Replace active art only after the confidence gate passes.")
    search.set_defaults(func=command_search)
    accept = subparsers.add_parser("accept", help="Activate one reviewed candidate.")
    accept.add_argument("--id", required=True)
    accept.add_argument("--candidate", required=True, type=int)
    accept.add_argument("--replace", action="store_true")
    accept.set_defaults(func=command_accept)
    audit = subparsers.add_parser("audit", help="Audit formats, dimensions, hashes, and build a visual contact sheet.")
    audit.add_argument("--json", action="store_true")
    audit.set_defaults(func=lambda args: print(json.dumps(audit_images(), indent=2) if args.json else f"Audit written to {REVIEW_ROOT / 'audit.json'}; review {write_review_html()}"))
    manifest = subparsers.add_parser("manifest", help="Rebuild the browser manifest from accepted art.")
    manifest.set_defaults(func=lambda _args: print(f"Wrote {len(write_manifest())} active asset mappings to {MANIFEST_PATH.name}."))
    return parser


def main() -> int:
    args = build_parser().parse_args()
    args.func(args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
