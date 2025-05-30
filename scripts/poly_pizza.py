"""
Poly Pizza search helper  ·  May 2025
------------------------------------
Env var required:
    POLY_PIZZA_KEY=pp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
"""

from __future__ import annotations
import os, time, requests, json, typing
from pathlib import Path
from typing import Generator, Dict, Any

# ── 0.  .env loader for local dev ───────────────────────────────────
if not os.getenv("CI"):                           # GitHub Actions sets CI=true
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if env_path.exists():
        load_dotenv(env_path)

API_KEY = os.getenv("POLY_PIZZA_KEY")
if not API_KEY:
    raise SystemExit("❌  POLY_PIZZA_KEY not set (see README)")

# ── 1.  constants ───────────────────────────────────────────────────
BASE    = "https://api.poly.pizza/v1"             # <- current root
HEADERS = {"x-auth-token": API_KEY}
RETRY   = (0.5, 2, 5)                             # back-off sec

# ── 2.  tiny GET helper ─────────────────────────────────────────────
def _get(url: str, **kw) -> requests.Response:
    for delay in (*RETRY, None):
        r = requests.get(url, headers=HEADERS, timeout=20, **kw)
        if r.status_code < 400:
            return r
        if delay is None or r.status_code == 404:
            r.raise_for_status()
        time.sleep(delay)

# ── replace the entire search() function ──────────────────────────
def _first_list(obj) -> list:
    """DFS: return first list found in a nested dict/list structure."""
    if isinstance(obj, list):
        return obj
    if isinstance(obj, dict):
        for v in obj.values():
            found = _first_list(v)
            if isinstance(found, list) and found:
                return found
    return []

def _query(keyword: str, params: dict) -> list:
    """Hit the endpoint once, return the *first non-empty* list (else [])."""
    data = _get(f"{BASE}/search/{keyword}", params=params).json()
    return _first_list(data)

def search(keyword: str,
           license_: int | None = 1,
           page: int | None = None
           ) -> Generator[Dict[str, Any], None, None]:
    """
    Yield model dicts for <keyword>, being tolerant of Poly Pizza quirks.
    1️⃣ try with licence=1  → CC-0
    2️⃣ if empty, retry with *no* licence filter       (still CC-0 heavy)
    3️⃣ if still empty, retry with licence=0          (CC-BY, warn caller)
    """
    attempts: list[tuple[str, dict]] = []

    # 1. caller’s params (usually licence=1)
    params = {"license": license_} if license_ is not None else {}
    if page not in (None, 1):
        params["page"] = page
    attempts.append(("licence filter", params))

    # 2. no licence param
    if license_ is not None:
        attempts.append(("no licence filter", {}))

    # 3. licence=0 (CC-BY etc.)
    attempts.append(("licence=0 fallback", {"license": 0}))

    for label, p in attempts:
        items = _query(keyword, p)
        if items:
            if label == "licence=0 fallback":
                print("⚠️  Poly Pizza returned only CC-BY assets for this "
                      "keyword; check licences before distribution.")
            yield from items
            return

    # If we get here every attempt was empty → dump payload for inspection
    Path("scratch/last_poly_response.json").write_text(
        json.dumps(_get(f'{BASE}/search/{keyword}', params=attempts[0][1]).json(),
                   indent=2, ensure_ascii=False)
    )
    raise RuntimeError("Poly Pizza gave no model list; "
                       "see scratch/last_poly_response.json")
