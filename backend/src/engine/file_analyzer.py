import sys
import json
import hashlib
import os
import math

# USER MANDATED HASHES
# "Compare it against ['e99a18c428cb38d5f260853678922e03']"
MALWARE_HASHES = [
    "e99a18c428cb38d5f260853678922e03",  # User provided hash
    "44d88612fea8a8f36de82e1278abb02f",  # EICAR Test String (MD5)
    "275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f", # EICAR (SHA256)
    "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", # Sample ransomware
    "d41d8cd98f00b204e9800998ecf8427e"   # Empty file (MD5)
]

class FileAnalyzer:
    def __init__(self, file_path):
        self.file_path = file_path
        self.threats = []

    def calculate_entropy(self, data):
        if not data:
            return 0
        entropy = 0
        for x in range(256):
            p_x = float(data.count(x)) / len(data)
            if p_x > 0:
                entropy += - p_x * math.log(p_x, 2)
        return entropy

    def analyze_pe(self):
        try:
            import pefile
            pe = pefile.PE(self.file_path)
            suspicious_imports = ['CreateRemoteThread', 'WriteProcessMemory', 'VirtualAllocEx']
            for entry in pe.DIRECTORY_ENTRY_IMPORT:
                for imp in entry.imports:
                    if imp.name and imp.name.decode() in suspicious_imports:
                        self.threats.append({
                            "type": "Suspicious API Call",
                            "risk": "High",
                            "description": f"Imported suspicious function: {imp.name.decode()}",
                            "file": os.path.basename(self.file_path)
                        })
        except ImportError:
            pass # pefile not installed, skip
        except Exception:
            pass # Not a PE file or error

    def scan(self):
        try:
            with open(self.file_path, 'rb') as f:
                data = f.read()

            # 1. Hashing & Malware Database Check (MANDATORY SHA-256)
            sha256_hash = hashlib.sha256(data).hexdigest()
            md5_hash = hashlib.md5(data).hexdigest()
            
            if sha256_hash in MALWARE_HASHES or md5_hash in MALWARE_HASHES:
                self.threats.append({
                    "type": "Known Malware",
                    "risk": "Critical",
                    "description": f"File hash matches known malware database. SHA256: {sha256_hash}",
                    "file": os.path.basename(self.file_path)
                })

            # 2. Entropy Check
            entropy = self.calculate_entropy(data)
            if entropy > 7.5:
                 self.threats.append({
                "type": "High Entropy",
                "risk": "Medium",
                "description": f"File entropy is {entropy:.2f}, indicating packed or encrypted content.",
                "file": os.path.basename(self.file_path)
              })

            # 3. PE Analysis (if Windows Executable)
            if data.startswith(b'MZ'):
                self.analyze_pe()

            return {
                "success": True,
                "isSafe": len(self.threats) == 0,
                "threatCount": len(self.threats),
                "threats": self.threats,
                "riskLevel": "Critical" if any(t['risk'] == 'Critical' for t in self.threats) else ("High" if self.threats else "Safe")
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No file provided"}))
        sys.exit(1)
    
    # Strip quotes if they were added by the shell or spawn process
    file_path = sys.argv[1].strip('"').strip("'")
    
    analyzer = FileAnalyzer(file_path)
    result = analyzer.scan()
    print(json.dumps(result))
