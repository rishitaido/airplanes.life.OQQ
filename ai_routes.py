"""
ai_routes.py — OpenRouter AI Assistant
===================================================================
• POST /api/ask        – general assistant (normal reply)
• POST /api/itinerary  – day-by-day trip JSON for map UI
"""

from flask import Blueprint, request, jsonify
from dotenv import load_dotenv
import os, requests, functools

# ─────────────── Constants ───────────────
MAX_PROMPT_LEN = 1_000
REQUEST_TIMEOUT = 90        # seconds

from cache import init_cache_db, get_cached_response, save_response_to_cache
from limiter_config import limiter

# ─────────────── Environment & Config ───────────────
load_dotenv(override=True)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
MODEL = "mistralai/devstral-small-2505:free"   # you can swap this to gpt-4o, mistral etc
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json"
}

# ─────────────── Initialize Flask Blueprint ───────────────
ai_routes = Blueprint("ai_routes", __name__)
init_cache_db()

# ─────────────── System Prompt (AI Personality) ───────────────
SYSTEM_INSTR = """
You are TripMate, an upbeat, helpful AI assistant for airplanes.life.

If the user asks for an itinerary, provide a day-by-day plan in JSON array format:

[
  { "day": 1, "morning": "...", "afternoon": "...", "evening": "..." },
  { "day": 2, "morning": "...", "afternoon": "...", "evening": "..." },
  ...
]

If the user asks a general question (airport lounge, travel tips, airlines), reply in plain text.

Do not use Markdown. Do not use headings, bold, italics, or emoji unless the user explicitly asks for formatted output.

Be helpful, clear, and concise. Your tone should be friendly and professional.
"""


# ─────────────── AI Completion Function ───────────────
def call_openrouter(prompt: str, *, max_tokens: int = 1200) -> str:
    """ Sends prompt to OpenRouter API and returns the AI's reply text. """
    payload = {
        "model": MODEL,
        "messages": [
            { "role": "system", "content": SYSTEM_INSTR.strip() },
            { "role": "user",   "content": prompt.strip() }
        ],
        "max_tokens": max_tokens,
        "temperature": 0.7
    }
    if not OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY is missing.")
    r = requests.post(OPENROUTER_URL, headers=HEADERS, json=payload, timeout=REQUEST_TIMEOUT)
    if r.status_code == 401:
        raise RuntimeError("Invalid OpenRouter API key.")
    if r.status_code == 402:
        raise RuntimeError("Quota exceeded or model requires payment.")
    r.raise_for_status()

    data = r.json()
    return data["choices"][0]["message"]["content"].strip()

# ─────────────── Decorator for Reusable AI Routes ───────────────
def ai_endpoint(default_days: int | None = None):
    """
    Shared wrapper for AI routes.
    - If default_days is set → force itinerary JSON
    - If None → normal chat
    """
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper():
            data = request.get_json(force=True, silent=True) or {}

            # Support "prompt" being string or dict
            prompt_data = data.get("prompt")
            if isinstance(prompt_data, dict):
                city = prompt_data.get("city", "").strip()
                days_field = prompt_data.get("days", "")
                theme = prompt_data.get("theme", "").strip()
                prompt = f"Plan a trip to {city}, {days_field} days, focused on {theme}."
            else:
                prompt = (prompt_data or "").strip()

            # Reject empty / too long
            if not prompt:
                return jsonify({"error": "Prompt is required"}), 400
            if len(prompt) > MAX_PROMPT_LEN:
                return jsonify({"error": f'Prompt too long (max {MAX_PROMPT_LEN} chars)'}), 413

            # Optional itinerary formatting
            req_days = data.get("days")
            try:
                req_days = int(req_days) if req_days else None
            except ValueError:
                req_days = None

            days = req_days or default_days
            if days:
                prompt += (
                    f"\n\nPlease return a {days}-day itinerary in this exact JSON array format:\n\n"
                    "[\n"
                    "  { \"day\": 1, \"morning\": \"In 2–3 sentences, describe the morning with times, locations, and experiences.\",\n"
                    "    \"afternoon\": \"In 2–3 sentences, describe afternoon activities with pacing and local details.\",\n"
                    "    \"evening\": \"In 2–3 sentences, describe evening experiences, with times, food, culture.\" },\n"
                    "  ...\n"
                    "]\n\n"
                    "Make each day feel full and realistic — include times, places, and descriptions. Return ONLY the JSON array. Do not include any extra text."
                )


            # Check cache
            if cached := get_cached_response(prompt):
                return jsonify({"reply": cached})

            # Call AI
            try:
                dynamic_max = 400 + (days or 0) * 180
                dynamic_max = min(dynamic_max, 2048)
                reply = call_openrouter(prompt, max_tokens=dynamic_max)
                if not reply:
                    raise RuntimeError("Empty response from AI")
            except requests.Timeout:
                reply = "[ERROR] AI request timed out"
            except Exception as e:
                reply = f"[ERROR] {e}"

            save_response_to_cache(prompt, reply)
            return jsonify({"reply": reply})

        return wrapper
    return decorator

# ─────────────── Routes ───────────────
@ai_routes.route("/api/ask", methods=["POST"])
@limiter.limit("5 per minute")
@ai_endpoint(default_days=None)   # ✅ FIXED: pure chat — no forced JSON
def api_ask():
    """ General-purpose chat from AI. """
    pass

@ai_routes.route("/api/itinerary", methods=["POST"])
@limiter.limit("4 per minute")
@ai_endpoint(default_days=3)      # ✅ For itinerary/map UI — returns JSON
def api_itinerary():
    """ AI-generated 3-day itineraries for map UI. """
    pass
