from flask import Flask, render_template, request, jsonify, send_from_directory
from ai_routes import ai_routes
from flask_swagger_ui import get_swaggerui_blueprint
import os

app = Flask(__name__)

app.register_blueprint(ai_routes)

SWAGGER_URL = '/docs'
API_URL     = '/openapi.yaml'

swaggerui_bp = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={ 'app_name': "My AI 3D Viewer API" }
)
app.register_blueprint(swaggerui_bp, url_prefix=SWAGGER_URL)

# Serve the spec file itself
@app.route('/openapi.yaml')
def openapi_spec():
    return send_from_directory(os.getcwd(), 'openapi.yaml')

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/hello", methods=["GET"])
def hello():
    return jsonify({"msg": "Hello, world!"})

if __name__ == "__main__":
    app.run(debug=True)

