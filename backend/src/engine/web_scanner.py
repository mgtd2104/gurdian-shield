import sys
import json
import requests
from bs4 import BeautifulSoup
import urllib.parse
import threading
import warnings
from requests.packages.urllib3.exceptions import InsecureRequestWarning

# Suppress SSL warnings for live targets/CTFs
warnings.simplefilter('ignore', InsecureRequestWarning)

# STRICT USER-DEFINED PAYLOADS
REAL_PAYLOADS = [
    '" OR 1=1 --', 
    "' OR 1=1 --", 
    '<script>alert(1)</script>',
    "' OR '1'='1", 
    "admin' --",
    "<img src=x onerror=alert(1)>",
    "../../etc/passwd", # Path Traversal check
    "..\\..\\windows\\win.ini" # Windows Path Traversal
]

class WebScanner:
    def __init__(self, url):
        self.target_url = url
        self.vulnerabilities = []
        self.lock = threading.Lock()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        })
        # Disable SSL verification for scan
        self.session.verify = False

    def log_vulnerability(self, type, severity, description, url):
        with self.lock:
            # Check for duplicates
            for v in self.vulnerabilities:
                if v['type'] == type and v['url'] == url and v['description'] == description:
                    return
            self.vulnerabilities.append({
                "type": type,
                "severity": severity,
                "description": description,
                "url": url
            })

    def scan_url(self, url):
        try:
            # Baseline request
            baseline_response = self.session.get(url, timeout=10)
            baseline_len = len(baseline_response.text)
            
            # 1. Security Headers Check
            headers = baseline_response.headers
            missing_headers = []
            if 'Content-Security-Policy' not in headers:
                missing_headers.append('Content-Security-Policy')
            if 'X-Frame-Options' not in headers:
                missing_headers.append('X-Frame-Options')
            if 'X-Content-Type-Options' not in headers:
                missing_headers.append('X-Content-Type-Options')
            
            if missing_headers:
                 self.log_vulnerability("Insecure Headers", "Medium", f"Missing security headers: {', '.join(missing_headers)}", url)

            parsed = urllib.parse.urlparse(url)
            params = urllib.parse.parse_qs(parsed.query)
            
            # Scan forms regardless of URL params
            self.scan_forms(baseline_response.text, url)
            
            if not params:
                return

            base_url = url.split('?')[0]
            
            for param in params:
                for payload in REAL_PAYLOADS:
                    fuzzed_params = params.copy()
                    fuzzed_params[param] = payload
                    
                    try:
                        resp = self.session.get(base_url, params=fuzzed_params, timeout=10)
                        
                        # REFLECTED XSS
                        if payload in resp.text:
                             if "<script>" in payload or "<img" in payload:
                                 self.log_vulnerability("Cross-Site Scripting (XSS)", "High", f"Payload reflected in response: {payload}", url)
                        
                        # SQL INJECTION
                        sql_errors = ["SQL syntax", "mysql_fetch", "ORA-01756", "SQLite3::SQLException", "syntax error"]
                        if any(e in resp.text for e in sql_errors):
                             self.log_vulnerability("SQL Injection", "Critical", f"SQL Error detected with payload: {payload}", url)
                        elif abs(len(resp.text) - baseline_len) > 50 and "OR 1=1" in payload:
                             self.log_vulnerability("SQL Injection", "Critical", f"Significant response length change detected ({len(resp.text)} vs {baseline_len}) with payload: {payload}", url)

                    except Exception:
                        pass

        except Exception as e:
            # We don't log connection errors as vulnerabilities, but we could return them if needed.
            # For now, we just fail silently or log to stderr if debugging.
            pass

    def scan_forms(self, html, url):
        try:
            soup = BeautifulSoup(html, 'html.parser')
            forms = soup.find_all('form')
            
            for form in forms:
                action = form.get('action') or url
                method = form.get('method', 'get').lower()
                target_url = urllib.parse.urljoin(url, action)
                inputs = form.find_all('input')
                
                data = {}
                for input_tag in inputs:
                    name = input_tag.get('name')
                    if name:
                        # Default value
                        data[name] = "test"
                
                # Fuzz each input
                for input_tag in inputs:
                    name = input_tag.get('name')
                    if not name: continue
                    
                    for payload in REAL_PAYLOADS:
                        fuzzed_data = data.copy()
                        fuzzed_data[name] = payload
                        
                        try:
                            if method == 'post':
                                resp = self.session.post(target_url, data=fuzzed_data, timeout=10)
                            else:
                                resp = self.session.get(target_url, params=fuzzed_data, timeout=10)
                                
                            # XSS
                            if payload in resp.text and ("<script>" in payload or "<img" in payload):
                                 self.log_vulnerability("Cross-Site Scripting (XSS)", "High", f"Payload reflected in form response: {payload}", target_url)
                            
                            # SQLi
                            sql_errors = ["SQL syntax", "mysql_fetch", "ORA-01756", "SQLite3::SQLException", "syntax error"]
                            if any(e in resp.text for e in sql_errors):
                                 self.log_vulnerability("SQL Injection", "Critical", f"SQL Error in form: {payload}", target_url)

                        except:
                            pass
        except:
            pass

    def run(self):
        self.scan_url(self.target_url)
        
        return {
            "success": True,
            "input": self.target_url,
            "vulnerabilities": self.vulnerabilities,
            "riskLevel": "Critical" if any(v['severity'] == 'Critical' for v in self.vulnerabilities) else ("High" if self.vulnerabilities else "Safe")
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No URL provided"}))
        sys.exit(1)
    
    url = sys.argv[1]
    # Simple validation
    if not url.startswith("http"):
        url = "http://" + url
        
    scanner = WebScanner(url)
    result = scanner.run()
    print(json.dumps(result))
