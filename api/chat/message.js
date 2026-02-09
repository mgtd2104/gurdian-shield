const MALWARE_HASHES = [
  "e99a18c428cb38d5f260853678922e03",
  "44d88612fea8a8f36de82e1278abb02f",
  "275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f",
  "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
  "d41d8cd98f00b204e9800998ecf8427e"
];

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
  }

  const text = String(message || "").toLowerCase();
  if (text.includes("sql")) {
    return res.json({
      success: true,
      response: {
        message: "Vulnerability Found: SQL Injection. Fix: Use Prepared Statements.",
        relevant: true,
        prevention: ["Vulnerability Found: SQL Injection. Fix: Use Prepared Statements."],
        tools: [],
        examples: []
      }
    });
  }

  return res.json({
    success: true,
    response: {
      message: "Ask about: SQL Injection, XSS, CSRF, Path Traversal, or Insecure Headers. Or run a scan and I will generate remediation.",
      relevant: true
    }
  });
};

