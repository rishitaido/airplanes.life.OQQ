"""
ai_routes.py — OpenRouter AI Assistant (DeepSeek-R1 Qwen3-8B Free)
===================================================================
• POST /api/ask        – general assistant (returns plain reply)
• POST /api/itinerary  – same logic, different UI use
"""

from flask import Blueprint, request, jsonify
from dotenv import load_dotenv
import os, requests, functools
from cache import init_cache_db, get_cached_response, save_response_to_cache
from limiter_config import limiter
# ─────────────── Environment & Config ───────────────
load_dotenv(override=True)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
MODEL = "deepseek/deepseek-r1-0528-qwen3-8b:free"
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
Generate natural, human-readable answers. For itinerary requests, respond with a day-by-day plan in plain text and make sure each day is in the output.
Example:
Day 1:
- Breakfast at Roscioli
- Visit Colosseum
- Pasta lunch at Trattoria al Moro
...etc.
"""

# ─────────────── AI Completion Function ───────────────
def call_openrouter(prompt: str, *, max_tokens: int = 1200) -> str:
    """
    Sends prompt to OpenRouter API and returns the AI's reply text.
    Raises exception on error.
    """
    payload = {
        "model": MODEL,
        "messages": [
            { "role": "system", "content": SYSTEM_INSTR.strip() },
            { "role": "user",   "content": prompt.strip() }
        ],
        "max_tokens": max_tokens,
        "temperature": 0.7
    }

    r = requests.post(OPENROUTER_URL, headers=HEADERS, json=payload, timeout=90)
    if r.status_code == 401:
        raise RuntimeError("Invalid OpenRouter API key.")
    if r.status_code == 402:
        raise RuntimeError("Quota exceeded or model requires payment.")
    r.raise_for_status()

    data = r.json()
    return data["choices"][0]["message"]["content"].strip()

# ─────────────── Decorator for Reusable AI Routes ───────────────
def ai_endpoint(force_3_days=False):
    """
    Shared wrapper for API endpoints that call the AI.
    Supports optional 3-day itinerary formatting override.
    """
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper():
            data = request.get_json(force=True, silent=True) or {}
            prompt = (data.get("prompt") or "").strip()

            # 🔒 Reject empty or excessively long prompts
            if not prompt:
                return jsonify({"error": "Prompt is required"}), 400
            if len(prompt) > 1000:
                return jsonify({"error": "Prompt too long (max 1000 characters)"}), 413

            # ✈️ Enforce 3-day formatting if this is an itinerary endpoint
            if force_3_days: 
                prompt += (
                  "\n\nPlease respond with a complete 3-day itinerary for this trip, using the format:\n"
                  "Day 1:\n- Morning:\n- Afternoon:\n- Evening:\n\n"
                  "Day 2:\n- Morning:\n- Afternoon:\n- Evening:\n\n"
                  "Day 3:\n- Morning:\n- Afternoon:\n- Evening:\n\n"
                  "Be concise but clear. Use plain text only."
                )

            # 💾 Return cached response if available
            if cached := get_cached_response(prompt):
                return jsonify({"reply": cached})

            # 🚀 Call AI and handle errors gracefully
            try:
                reply = call_openrouter(prompt)
                if not reply:
                    raise RuntimeError("Empty response from AI")
            except Exception as e:
                reply = f"[ERROR] {e}"

            # 💽 Cache response for future reuse
            save_response_to_cache(prompt, reply)
            return jsonify({"reply": reply})

        return wrapper
    return decorator

# ─────────────── Routes ───────────────
@ai_routes.route("/api/ask", methods=["POST"])
@limiter.limit("5 per minute")
@ai_endpoint()
def api_ask():
    """Handles general-purpose AI questions from chat UI."""
    pass

@ai_routes.route("/api/itinerary", methods=["POST"])
@limiter.limit("4 per minute")
@ai_endpoint(force_3_days=True)
def api_itinerary():
    """Handles AI-generated 3-day itineraries for map UI."""
    pass
