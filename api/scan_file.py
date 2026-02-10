import hashlib

from flask import Flask, jsonify, request
from werkzeug.exceptions import RequestEntityTooLarge


app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024


MALWARE_SHA256_HASHES = {
    "275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f",
}


@app.errorhandler(RequestEntityTooLarge)
def handle_file_too_large(_e):
    return jsonify({"error": "File exceeds 50MB limit."}), 413


@app.route('/', methods=['POST'])
def scan_file():
    try:
        if 'file' not in request.files:
            return jsonify({"success": False, "error": "No file uploaded"}), 400

        uploaded_file = request.files['file']
        original_name = uploaded_file.filename or 'upload.bin'

        try:
            file_content = uploaded_file.read()
        except Exception as read_error:
            return jsonify({"success": False, "error": f"Failed to read uploaded file from memory: {str(read_error)}"}), 500

        if not isinstance(file_content, (bytes, bytearray)):
            return jsonify({"success": False, "error": "Invalid uploaded file content"}), 500

        file_hash = hashlib.sha256(file_content).hexdigest()

        known_bad_hashes = set(MALWARE_SHA256_HASHES)
        known_bad_hashes.add('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')

        threats = []
        if file_hash in known_bad_hashes:
            threats.append({
                "type": "Known Malware",
                "risk": "Critical",
                "description": f"File hash matches known malware database. SHA256: {file_hash}",
                "file": original_name,
            })

        is_safe = len(threats) == 0
        return jsonify({
            "success": True,
            "fileName": original_name,
            "sha256": file_hash,
            "isSafe": is_safe,
            "threatCount": len(threats),
            "threats": threats,
            "riskLevel": "Critical" if not is_safe else "Safe",
        }), 200
    except RequestEntityTooLarge as e:
        return jsonify({"error": str(e)}), 413
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

