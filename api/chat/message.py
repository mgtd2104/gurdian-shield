import json
import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request
import google.generativeai as genai


load_dotenv(dotenv_path=str(Path(__file__).resolve().parents[2] / ".env"))


SYSTEM_INSTRUCTION = (
    "You are Guardian Shield AI, a specialized cybersecurity assistant. "
    "Provide expert, concise remediation steps for vulnerabilities found in scans. "
    "Use Markdown for code blocks."
)


def _get_api_key():
    return os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")


def _build_prompt(message, scan_result):
    parts = [f"System instruction:\n{SYSTEM_INSTRUCTION}"]

    if isinstance(message, str) and message.strip():
        parts.append(f"User message:\n{message.strip()}")

    if scan_result is not None:
        try:
            scan_json = json.dumps(scan_result, ensure_ascii=False, indent=2)
        except Exception:
            scan_json = str(scan_result)
        parts.append(f"Scan context (JSON):\n{scan_json}")

    return "\n\n".join(parts)


def _call_gemini(prompt):
    api_key = _get_api_key()
    if not api_key:
        print("GEMINI_API_KEY missing: set GEMINI_API_KEY (or GOOGLE_API_KEY) in environment.")
        raise RuntimeError("GEMINI_API_KEY is not configured")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")
    result = model.generate_content(prompt)

    text = getattr(result, "text", None)
    if isinstance(text, str) and text.strip():
        return text.strip()
    raise RuntimeError("Gemini returned an empty response")


app = Flask(__name__)


@app.route("/", methods=["POST"])
@app.route("/chat/message", methods=["POST"])
@app.route("/api/chat/message", methods=["POST"])
def chat_message():
    payload = request.get_json(silent=True) or {}
    message = payload.get("message")
    scan_result = payload.get("scanResult")

    prompt = _build_prompt(message, scan_result)
    answer = _call_gemini(prompt)
    return jsonify({"success": True, "response": {"message": answer, "relevant": True}})
