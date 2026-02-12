from flask import Flask, jsonify


app = Flask(__name__)


@app.get("/")
def index():
    return jsonify({"ok": True, "service": "guardian-shield-api"}), 200

