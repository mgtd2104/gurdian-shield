from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import RequestEntityTooLarge
from werkzeug.utils import secure_filename
import hashlib
import os


app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.abspath(os.path.join(BASE_DIR, 'uploads'))
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

CORS(app, resources={r"/scan-file": {"origins": "*"}})

MALWARE_SHA256_HASHES = {
    "275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f",
}


@app.errorhandler(RequestEntityTooLarge)
def handle_file_too_large(_e):
    return jsonify({"error": "File exceeds 50MB limit."}), 413


@app.route('/scan-file', methods=['POST'])
def scan_file():
    try:
        file = request.files['file']
        filename = secure_filename(file.filename or 'upload.bin')
        abs_path = os.path.abspath(os.path.join(UPLOAD_FOLDER, filename))

        file.save(abs_path)

        with open(abs_path, 'rb') as f:
            data = f.read()

        sha256_hash = hashlib.sha256(data).hexdigest()
        threats = []
        if sha256_hash in MALWARE_SHA256_HASHES:
            threats.append({
                "type": "Known Malware",
                "risk": "Critical",
                "description": f"File hash matches known malware database. SHA256: {sha256_hash}",
                "file": file.filename,
            })

        result = {
            "success": True,
            "fileName": filename,
            "sha256": sha256_hash,
            "isSafe": len(threats) == 0,
            "threatCount": len(threats),
            "threats": threats,
            "riskLevel": "Critical" if threats else "Safe",
        }

        return jsonify({"status": "success", "message": "Scan complete", "data": result})
    except RequestEntityTooLarge as e:
        return jsonify({"error": str(e)}), 413
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
