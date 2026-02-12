from dotenv import load_dotenv
from flask import Flask, jsonify


load_dotenv(dotenv_path="../.env")


app = Flask(__name__)


@app.get("/")
def index():
    return jsonify({"ok": True, "service": "guardian-shield-api"}), 200

