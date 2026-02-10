const KNOWLEDGE = {
  "sql injection": "Vulnerability: SQL Injection\n\nWhat it is: Attackers can manipulate database queries by injecting SQL into inputs.\n\nHow to fix: Use prepared statements/parameterized queries everywhere, never build SQL with string concatenation. Validate input, and enforce least-privilege DB accounts.",
  "xss": "Vulnerability: Cross-Site Scripting (XSS)\n\nWhat it is: Malicious JavaScript can execute in users’ browsers if input is reflected/stored without proper output encoding.\n\nHow to fix: Escape output by context (HTML/attr/JS/URL), sanitize rich HTML with a library (DOMPurify), and add a strict Content-Security-Policy.",
  "path traversal": "Vulnerability: Path Traversal\n\nWhat it is: Attackers use ../ sequences to access files outside the intended directory.\n\nHow to fix: Never trust user-supplied paths. Use allow-lists, resolve/normalize paths, and enforce that resolved paths stay inside a safe base directory.",
  "csrf": "Vulnerability: CSRF\n\nWhat it is: An attacker tricks a logged-in user’s browser into performing an unwanted action.\n\nHow to fix: Use CSRF tokens, SameSite cookies, and verify Origin/Referer for state-changing requests.",
  "insecure headers": "Vulnerability: Missing/Insecure Security Headers\n\nWhy it matters: Without headers like CSP and X-Frame-Options, browsers can’t enforce key protections.\n\nHow to fix: Add Content-Security-Policy, X-Frame-Options or frame-ancestors, X-Content-Type-Options, Referrer-Policy, and HSTS (for HTTPS only).",
  "malware": "Topic: Malware / Virus\n\nWhat it is: Malicious software designed to steal data, encrypt files (ransomware), spy (spyware), or give remote control (RAT).\n\nWhat to do: Isolate the file/system, do not execute it, hash it (SHA-256) and check reputation, scan with multiple engines, and inspect for high entropy/packed binaries. If confirmed, reimage or restore from clean backups.",
  "virus": "Topic: Virus / Malware\n\nQuick guidance: If a scan flags a file as Known Malware, treat it as compromised. Quarantine it, avoid running it, and remove persistence points (startup tasks/services). Validate with hashes and multiple scanners.",
  "eicar": "Topic: EICAR Test File\n\nEICAR is a harmless test string used to verify antivirus detection pipelines. If your scanner detects EICAR, that’s expected and means the detection logic is working.",
  "ransomware": "Topic: Ransomware\n\nWhat to do: Immediately isolate the machine (disconnect network), preserve evidence, identify affected scope, restore from offline backups, and rotate credentials. Don’t pay unless you have no other option and leadership approves.",
  "trojan": "Topic: Trojan\n\nWhat it is: A program that looks legitimate but performs malicious actions.\n\nHow to respond: Quarantine, inspect execution chain, check persistence, and hunt for lateral movement and credential theft.",
  "hash": "Topic: File Hashing (SHA-256)\n\nWhy: Hashes uniquely identify file contents. Use SHA-256 to compare against known-bad hash lists and to track samples across systems."
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.json({ error: "Method not allowed" });
  }

  const { message, scanResult } = req.body || {};
  if (!message && !scanResult) {
    res.statusCode = 400;
    return res.json({ error: "Message or scanResult is required" });
  }

  if (scanResult && Array.isArray(scanResult.vulnerabilities)) {
    const vulnerabilities = scanResult.vulnerabilities;
    const hasSQLi = vulnerabilities.some((v) => {
      const t = String(v?.type || "").toLowerCase();
      const d = String(v?.description || "").toLowerCase();
      return t.includes("sql") || d.includes("sql");
    });

    if (hasSQLi) {
      return res.json({
        success: true,
        response: {
          message: "CRITICAL: SQL Injection Vulnerability Detected. Immediate Action Required.",
          detectedVulnerabilities: vulnerabilities,
          remediation: [
            {
              topic: "SQL Injection",
              message: "Vulnerability Found: SQL Injection. Fix: Use Prepared Statements.",
              prevention: ["Use Prepared Statements", "Input Validation", "Least Privilege"],
              examples: [],
              tools: []
            }
          ]
        }
      });
    }

    const remediation = [];
    for (const v of vulnerabilities) {
      const t = String(v?.type || "").toLowerCase();
      for (const [key, info] of Object.entries(KNOWLEDGE)) {
        if (t.includes(key)) {
          remediation.push({ topic: v.type, message: info, prevention: [], examples: [], tools: [] });
          break;
        }
      }
    }

    if (remediation.length) {
      return res.json({
        success: true,
        response: {
          message: "Scan results received. Here is remediation and background for the findings.",
          detectedVulnerabilities: vulnerabilities,
          remediation
        }
      });
    }
  }

  const text = String(message || "").toLowerCase();
  for (const [key, info] of Object.entries(KNOWLEDGE)) {
    if (text.includes(key)) {
      return res.json({
        success: true,
        response: {
          message: info,
          relevant: true,
          prevention: [],
          tools: [],
          examples: []
        }
      });
    }
  }

  return res.json({
    success: true,
    response: {
      message: "Ask about: SQL Injection, XSS, CSRF, Path Traversal, Insecure Headers, Malware/Virus, Ransomware, Trojan, EICAR, or Hashing. You can also run a scan and I will generate remediation.",
      relevant: true
    }
  });
};
