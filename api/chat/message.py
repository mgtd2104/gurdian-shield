import json
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request


load_dotenv()


OFFLINE_MESSAGE = "Guardian Shield is currently in offline mode."
SYSTEM_INSTRUCTION = (
    "You are Guardian Shield AI, a specialized cybersecurity assistant. "
    "Provide expert, concise remediation steps for vulnerabilities found in scans. "
    "Use Markdown for code blocks."
)


def _get_api_key():
    return os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")


def _build_prompt(message, scan_result):
    parts = []
    if isinstance(message, str) and message.strip():
        parts.append(f"User message:\n{message.strip()}")

    if scan_result is not None:
        try:
            scan_json = json.dumps(scan_result, ensure_ascii=False, indent=2)
        except Exception:
            scan_json = str(scan_result)
        parts.append(f"Scan context (JSON):\n{scan_json}")

    if not parts:
        return "Provide cybersecurity help."
    return "\n\n".join(parts)


def _call_gemini(prompt):
    api_key = _get_api_key()
    if not api_key:
        return None

    from google import genai

    model_id = os.getenv("GEMINI_MODEL") or "gemini-1.5-flash"
    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model=model_id,
        contents={"text": prompt},
        config={
            "system_instruction": SYSTEM_INSTRUCTION,
            "temperature": 0.2,
        },
    )
    text = getattr(response, "text", None)
    if isinstance(text, str) and text.strip():
        return text.strip()
    return None


app = Flask(__name__)


@app.route("/", methods=["POST"])
@app.route("/chat/message", methods=["POST"])
@app.route("/api/chat/message", methods=["POST"])
def chat_message():
    payload = request.get_json(silent=True) or {}
    message = payload.get("message")
    scan_result = payload.get("scanResult")

    try:
        prompt = _build_prompt(message, scan_result)
        answer = _call_gemini(prompt)
    except Exception:
        answer = None

    if not answer:
        answer = OFFLINE_MESSAGE

    return jsonify({
        "success": True,
        "response": {
            "message": answer,
            "relevant": True,
        },
    })

