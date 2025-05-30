#!/usr/bin/env python3
"""
End-to-end harvest:
$ python scripts/ingest_airplanes.py [--keyword jet] [--limit 50]
"""
from __future__ import annotations
import argparse, json, hashlib, shutil, subprocess
from pathlib import Path

import requests, trimesh, tqdm

from scripts.poly_pizza import search

RAW     = Path("scratch/raw")
CONVERT = Path("scratch/out")
DEST    = Path("static/assets/3d/airplanes")
MANIFEST = Path("static/assets/3d/models.json")
GLTFPACK = Path("tools/gltfpack")

RAW.mkdir(parents=True, exist_ok=True)
CONVERT.mkdir(parents=True, exist_ok=True)
DEST.mkdir(parents=True, exist_ok=True)

def sha256(p: Path) -> str:
    return hashlib.file_digest(open(p, "rb"), "sha256").hexdigest()

def download(entry: dict) -> Path:
    # Poly Pizza 2025-05 schema
    url      = entry["Download"]             # was downloadUrl
    raw_id   = entry["ID"]                   # keep for filename
    ext      = Path(url).suffix or ".glb"
    target   = RAW / f"{raw_id}{ext}"
    if target.exists():
        return target

    with requests.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        with open(target, "wb") as fh:
            shutil.copyfileobj(r.raw, fh)
    return target


def convert_if_needed(rfile: Path) -> Path:
    if rfile.suffix.lower() == ".glb":
        return rfile
    out = CONVERT / f"{rfile.stem}.glb"
    if out.exists():
        return out
    subprocess.check_call(
        ["blender", "--background", "--python", "scripts/convert.py", "--",
         str(rfile), str(out)]
    )
    return out

def optimise(src: Path) -> Path:
    dst = DEST / src.name
    if dst.exists():
        return dst
    try:
        subprocess.check_call([
            str(GLTFPACK),
            "-i", str(src),
            "-o", str(dst),
            "-cc", "-si", "0.75", "-kn"
        ])
    except FileNotFoundError:
        raise RuntimeError("❌ gltfpack not found – see README for install")
    return dst

def triangle_count(glb: Path) -> int:
    m = trimesh.load(glb, force="mesh")
    return int(m.faces.shape[0]) if hasattr(m, "faces") else 0

def main(keyword: str, limit: int | None):
    records: list[dict] = []

    # --------------- harvest ----------------
    fetch_raw = list(search(keyword))     # no limit param at all
    for entry in tqdm.tqdm(fetch_raw[:limit]):   # slice locally
        try:
            # ----- map Poly Pizza fields -----
            raw_id   = entry["ID"]
            raw_name = entry["Title"]
            author   = entry["Creator"]["Username"]

            raw_file = download(entry)
            glb      = optimise(convert_if_needed(raw_file))
            tris     = triangle_count(glb)

            records.append({
                "id":      raw_id,
                "name":    raw_name,
                "author":  author,
                "license": "CC0",
                "path":    str(glb.relative_to("static")),
                "tris":    tris,
                "sha256":  sha256(glb),
            })

        except Exception as e:
            tqdm.tqdm.write(f"skip {entry.get('ID', '?')}: {e}")

    # --------------- manifest merge ---------
    existing = {r["id"]: r for r in json.loads(MANIFEST.read_text() or "[]")}
    for r in records:
        existing[r["id"]] = r

    MANIFEST.write_text(
        json.dumps(sorted(existing.values(), key=lambda x: x["name"]),
                   indent=2)
    )
    print(f"{len(records)} new / updated models")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--keyword", default="airplane",
                    help="search term (default: airplane)")
    ap.add_argument("--limit", type=int, help="max results")
    main(**vars(ap.parse_args()))
