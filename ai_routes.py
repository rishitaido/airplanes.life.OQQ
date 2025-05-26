from flask import Blueprint, request, jsonify, Response, stream_with_context
from dotenv import load_dotenv
import os
from openai import OpenAI
from cache import init_cache_db, get_cached_response, save_response_to_cache

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ai_routes = Blueprint("ai_routes", __name__)
init_cache_db() 

@ai_routes.route("/ai/ask", methods=["POST"])
def ask():
    data = request.get_json()
    prompt = data.get("prompt", "")

    cached = get_cached_response(prompt)
    if cached: 
        return Response(cached, mimetype="text/plain")

    full_response = []

    def generate():
        nonlocal full_response

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            stream=True
        )
        for chunk in response:
            if chunk.choices:
                content = chunk.choices[0].delta.content or ""
                full_response.append(content)
                yield content
    
    def stream_and_cache(): 
        for chunk in generate():
            yield chunk
        save_response_to_cache(prompt, "".join(full_response))
        
    return Response(stream_with_context(generate()), mimetype="text/plain")
