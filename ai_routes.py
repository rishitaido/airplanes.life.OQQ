"""
ai_routes.py – Zephyr gateway that returns JSON for the frontend.

  • POST /api/ask   {"prompt":"Plan a 3-day trip …"}
      → { "reply": "...", "itinerary":[ … ] }

If the prompt is NOT travel-related, we still respond with JSON:
      → { "reply": "Here's the information you asked for." }
"""

from flask import Blueprint, request, jsonify
from dotenv import load_dotenv
import os, re, json, requests, time
from cache import init_cache_db, get_cached_response, save_response_to_cache

# ─── HuggingFace setup ─────────────────────────────────────────────
load_dotenv(override=True)
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY", "")
AI_MODEL   = "HuggingFaceH4/zephyr-7b-beta"
HF_URL     = f"https://api-inference.huggingface.co/models/{AI_MODEL}"
HEADERS    = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}

# ─── Flask blueprint & tiny cache ──────────────────────────────────
ai_routes = Blueprint("ai_routes", __name__)
init_cache_db()

# -------------------------------------------------------------------
SYSTEM_INSTR = """
You are TripMate, an upbeat, detail-oriented travel-planning assistant for the domain ‘airplanes.life’.

OUTPUT RULES
• Always respond with one — and only one — valid JSON object.  
• Do NOT wrap the JSON in markdown, HTML, or code-fences.  
• Never add keys that are not listed here.

REQUIRED KEYS
1. "reply"   (string)  
   - 3–4 vivid sentences that paint the trip’s highlights (signature foods, culture, neighbourhood vibe).  
   - Stands alone: this is what the chat UI shows.

2. "itinerary" (array) — include only when the user explicitly wants a day-by-day plan.  
   Each element:  
     {
       "day": <integer starting at 1>,
       "activities": [
         {
           "time": "HH:MM",          // 24-hour local time
           "place": "<short name>",
           "location": [<lon>, <lat>]   // optional; omit if unknown
         },
         …
       ]
     }
   • 5–7 activities per day max.

NON-TRAVEL QUERIES
If the user is *not* asking for a trip plan, reply with:
{ "reply": "<helpful answer>" }
and omit the "itinerary" key.

STYLE
• Friendly, concise, confident.  
• Use local currency symbols (€, $, ¥) and appropriate metric/imperial units.  
• Maintain correct JSON syntax at all times.

EXAMPLE (for guidance only)
{
  "reply": "Three flavour-packed days await! From sunrise pastries at the old central market to candle-lit jazz bars at night, you’ll taste, tour and tap into the soul of the city.",
  "itinerary": [
    {
      "day": 1,
      "activities": [
        { "time": "08:00", "place": "Central Market – breakfast bites", "location": [12.4924, 41.8902] },
        { "time": "10:30", "place": "National Art Museum",            "location": [12.4833, 41.8926] },
        { "time": "13:00", "place": "Local trattoria – pasta class" },
        { "time": "18:30", "place": "Riverside walk & sunset aperitivo" }
      ]
    },
    {
      "day": 2,
      "activities": [
        { "time": "09:00", "place": "Historic district walking tour" },
        { "time": "12:30", "place": "Street-food lunch bazaar" },
        { "time": "16:00", "place": "Craft coffee tasting" },
        { "time": "20:00", "place": "Rooftop dinner with skyline view" }
      ]
    }
  ]
}
"""



# ─── Helpers ───────────────────────────────────────────────────────
def call_zephyr(prompt: str) -> str:
    """Send prompt → HF Inference, return raw generated_text."""
    payload = {
        "inputs": f"{SYSTEM_INSTR}\nUser: {prompt}\nAssistant:",
        "parameters": {
            "max_new_tokens": 600,
            "temperature": 0.0,
            "top_p": 0.9,
            "do_sample": True,
            "return_full_text": False,
        },
    }
    res = requests.post(HF_URL, headers=HEADERS, json=payload, timeout=60)
    if res.status_code != 200:
        raise RuntimeError(f"HF API {res.status_code}: {res.text[:200]}")
    data = res.json()
    if isinstance(data, list) and "generated_text" in data[0]:
        return data[0]["generated_text"]
    if isinstance(data, dict) and "generated_text" in data:
        return data["generated_text"]
    raise ValueError("Unexpected HF response format")

_JSON_RE = re.compile(r"\{.*\}", re.DOTALL)

def extract_json(txt: str) -> dict:
    """
    Returns first valid JSON object found in txt.
    Falls back to {"reply": txt} if nothing parseable.
    """
    try:
        return json.loads(txt)
    except json.JSONDecodeError:
        match = _JSON_RE.search(txt)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
    return {"reply": txt.strip()}

# ─── Route ─────────────────────────────────────────────────────────
@ai_routes.route("/api/ask", methods=["POST"])
def ask():
    data   = request.get_json(force=True, silent=True) or {}
    prompt = (data.get("prompt") or "").strip()
    if not prompt:
        return jsonify({"error": "empty prompt"}), 400

    # cache check
    cached = get_cached_response(prompt)
    if cached:
        return jsonify(json.loads(cached))

    try:
        raw_answer = call_zephyr(prompt)
        answer_obj = extract_json(raw_answer)
    except Exception as e:
        answer_obj = {"reply": f"[ERROR] {str(e)}"}

    # save to cache & return
    save_response_to_cache(prompt, json.dumps(answer_obj))
    return jsonify(answer_obj)
