""" Sketchfab search helper – June 2025

    Env var required:
        SKETCHFAB_TOKEN = sk_xxxxxxxxxxxxxxxxxxxxxxxxx
"""

import os, time, requests
from pathlib import Path

# ── 0. .env loader for local dev ─────────────────────
if not os.getenv("CI"):
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if env_path.exists():
        load_dotenv(env_path)

# ── 1. constants ─────────────────────────────────────
BASE_URL = "https://api.sketchfab.com/v3"
TOKEN    = os.getenv("SKETCHFAB_KEY")

if not TOKEN:
    raise SystemExit("❌  SKETCHFAB_KEY not set.")

HEADERS = {"Authorization": f"Token {TOKEN}"}

# ── 2. search generator ──────────────────────────────
def search(keyword: str, limit: int = 50):
    """Yield Sketchfab model items for <keyword>, stopping at <limit>"""
    page    = 1
    fetched = 0

    while fetched < limit:
        print(f"🌍 GET {BASE_URL}/search page={page}")
        resp = requests.get(
            f"{BASE_URL}/search",
            headers=HEADERS,
            params={
                "q": keyword,
                "type": "models",
                "downloadable": "true",
                "sort_by": "relevance",
                "page": page,
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()

        # ── loop over results ────────
        items = data.get("results", [])
        if not items:
            print("🚫 No more results")
            break

        for item in items:
            license_ = item["license"]["label"].strip().lower()

            if license_ not in ("cc attribution", "cc0"):
                print(f"⛔ Skipping license: {license_}")
                continue

            # ensure GLB available
            archives = item.get("archives") or {}
            glb_info = archives.get("glb")
            if not glb_info:
                print(f"⛔ Skipping (no GLB): {item['name']}")
                continue

            download_url = f"https://api.sketchfab.com/v3/models/{item['uid']}/download"

            yield {
                "id":        item["uid"],
                "name":      item["name"],
                "author":    item["user"]["displayName"],
                "license":   license_,
                "download":  download_url,
                "filesize":  glb_info.get("size", 0),
            }

            fetched += 1
            if fetched >= limit:
                return

        # next page
        page += 1
        time.sleep(1)  # be polite

