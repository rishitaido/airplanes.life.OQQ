from flask import Blueprint, request, jsonify, Response, stream_with_context
from dotenv import load_dotenv
import os
import requests
from cache import init_cache_db, get_cached_response, save_response_to_cache

load_dotenv()
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

HF_MODEL = "HuggingFaceH4/zephyr-7b-beta"
HF_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
HEADERS = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}

ai_routes = Blueprint("ai_routes", __name__)
init_cache_db() 

  # ✅ Match frontend route
@ai_routes.route("/api/ask", methods=["POST"])
def ask():
    data = request.get_json()
    prompt = data.get("prompt", "")
    print(f"🔍 Prompt: {prompt}")

    cached = get_cached_response(prompt)
    if cached:
        return Response(cached, mimetype="text/plain")

    def generate():
        payload = {
            "inputs": f"<|system|>You are a helpful assistant.<|user|>{prompt}<|assistant|>",
            "parameters": {"max_new_tokens": 550, "temperature": 0.7, "do_sample": True}
        }
        response = requests.post(HF_URL, headers=HEADERS, json=payload)

        if response.status_code == 200:
            resp_json = response.json()
            if isinstance(resp_json, list) and "generated_text" in resp_json[0]:
                answer = resp_json[0]["generated_text"]
                answer = answer.split("<|assistant|>")[-1].strip()
                save_response_to_cache(prompt, answer)
                yield answer
        else:
            yield f"[ERROR]: {response.status_code} - {response.text}"

    return Response(stream_with_context(generate()), mimetype="text/plain")
