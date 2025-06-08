from flask import Flask, render_template, request, jsonify, send_from_directory
from ai_routes import ai_routes
from flask_swagger_ui import get_swaggerui_blueprint
import os
from prometheus_client import Counter, Histogram, generate_latest
import time 

app = Flask(__name__)

# 1) Define your metrics
REQUEST_COUNT   = Counter('request_count', 'Total HTTP requests', ['method', 'endpoint'])
REQUEST_LATENCY = Histogram('request_latency_seconds', 'Request latency', ['endpoint'])

# 2) Hook into the request lifecycle
@app.before_request
def before_request():
    request.start_time = time.time()

@app.after_request
def after_request(response):
    REQUEST_COUNT.labels(request.method, request.path).inc()
    REQUEST_LATENCY.labels(request.path).observe(time.time() - request.start_time)
    return response

# 3) Expose the /metrics endpoint
@app.route('/metrics')
def metrics():
    return generate_latest(), 200, {'Content-Type': 'text/plain; charset=utf-8'}


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

@app.route("/model")
def model():
    return render_template("model.html")

@app.route("/itinerary")
def itinerary():
    return render_template("itinerary.html")


if __name__ == "__main__":
    app.run(debug=True)

