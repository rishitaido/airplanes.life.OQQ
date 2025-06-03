from flask import Blueprint, request, Response, stream_with_context
from dotenv import load_dotenv
import os
import re
import requests
import time
from cache import init_cache_db, get_cached_response, save_response_to_cache

# Load environment variables
load_dotenv(override=True)
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

# Model configuration
AI_MODEL = "HuggingFaceH4/zephyr-7b-beta"
HF_URL = f"https://api-inference.huggingface.co/models/{AI_MODEL}"
HEADERS = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}

ai_routes = Blueprint("ai_routes", __name__)

init_cache_db()

@ai_routes.route("/api/ask", methods=["POST"])
def ask():
    print("🔍 /api/ask HIT")
    data = request.get_json() or {}
    prompt = data.get("prompt", "").strip()
    print(f"🔍 Prompt: {prompt}")

    # Return cached response if available
    cached = get_cached_response(prompt)
    if cached:
        return Response(cached, mimetype="text/plain")

    def generate():
        # simulate thinking delay
        time.sleep(1)

        # System instruction: concise factual answers only
        system_instruction = (
            "You are a concise, factual assistant. "
            "Answer the question directly in one short paragraph. "
            "Do not ask follow-up questions or add extra commentary."
        )
        full_input = f"{system_instruction}\nQuestion: {prompt}"   
        payload = {
            "inputs": full_input,
            "parameters": {
                "max_new_tokens": 300,
                "temperature": 0.1,
                "do_sample": False,
                "return_full_text": False,
            }
        }

        try:
            response = requests.post(HF_URL, headers=HEADERS, json=payload)
            print("⬅️ HF status:", response.status_code)
            print("⬅️ HF raw body:", response.text[:500])

            if response.status_code != 200:
                yield f"[ERROR]: {response.status_code} - {response.text}"
                return

            resp_json = response.json()
            # Extract generated text
            if isinstance(resp_json, dict) and "generated_text" in resp_json:
                answer = resp_json["generated_text"].strip()
            elif isinstance(resp_json, list) and resp_json and "generated_text" in resp_json[0]:
                answer = resp_json[0]["generated_text"].strip()
            else:
                print("⚠️ Unexpected HF format:", resp_json)
                yield "[ERROR]: Unexpected response format from HF API"
                return

            # Clean control tokens
            answer = re.sub(r"<\|.*?\|>", "", answer).strip()
            # Remove echoed prompt prefix
            if answer.lower().startswith(prompt.lower()):
                answer = answer[len(prompt):].lstrip(' \n:–—-')

            print("💡 Final cleaned answer:", answer)

            # Cache and stream full detailed answer
            save_response_to_cache(prompt, answer)
            yield answer

        except Exception as e:
            print("❌ Exception during HF request:", str(e))
            yield f"[ERROR]: Exception {e}"

    return Response(stream_with_context(generate()), mimetype="text/plain")
