import os
import hashlib
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import RequestEntityTooLarge
from werkzeug.utils import secure_filename


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
        os.makedirs('temp', exist_ok=True)
        file = request.files['file']

        UPLOAD_FOLDER = os.path.join(os.getcwd(), 'backend', 'temp')
        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER)

        original_name = file.filename or 'upload.bin'
        filename = secure_filename(original_name) or 'upload.bin'
        abs_upload_folder = os.path.abspath(UPLOAD_FOLDER)
        abs_path = os.path.abspath(os.path.join(abs_upload_folder, filename))

        file.save(abs_path)

        with open(abs_path, 'rb') as f:
            data = f.read()

        sha256_hash = hashlib.sha256(data).hexdigest()

        known_bad_hashes = set(MALWARE_SHA256_HASHES)
        known_bad_hashes.add('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')

        threats = []
        if sha256_hash in known_bad_hashes:
            threats.append({
                "type": "Known Malware",
                "risk": "Critical",
                "description": f"File hash matches known malware database. SHA256: {sha256_hash}",
                "file": original_name,
            })

        is_safe = len(threats) == 0
        return jsonify({
            "success": True,
            "fileName": original_name,
            "sha256": sha256_hash,
            "isSafe": is_safe,
            "threatCount": len(threats),
            "threats": threats,
            "riskLevel": "Critical" if not is_safe else "Safe",
        })
    except RequestEntityTooLarge as e:
        return jsonify({"error": str(e)}), 413
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
