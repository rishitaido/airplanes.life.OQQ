from flask import Blueprint, request, jsonify, Response, stream_with_context
from dotenv import load_dotenv
import os
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ai_routes = Blueprint("ai_routes", __name__)

@ai_routes.route("/ai/ask", methods=["POST"])
def ask():
    data = request.get_json()
    prompt = data.get("prompt", "")
    def generate():
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            stream=True
        )
        for chunk in response:
            if chunk.choices:
                content = chunk.choices[0].delta.content or ""
                yield content
    return Response(stream_with_context(generate()), mimetype="text/plain")
