from flask import Flask, render_template, request, jsonify
from ai_routes import ai_routes

app = Flask(__name__)
app.register_blueprint(ai_routes)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/hello", methods=["GET"])
def hello():
    return jsonify({"msg": "Hello, world!"})

if __name__ == "__main__":
    app.run(debug=True)

