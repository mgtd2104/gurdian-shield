module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.json({ error: "Method not allowed" });
  }

  const { scanResult } = req.body || {};
  if (!scanResult) {
    res.statusCode = 400;
    return res.json({ error: "Scan result is required" });
  }

  const vulnerabilities = scanResult.vulnerabilities || scanResult.threats || [];
  const remediation = [];

  const hasSQLi = vulnerabilities.some((v) => {
    const t = String(v?.type || "").toLowerCase();
    const d = String(v?.description || "").toLowerCase();
    return t.includes("sql") || d.includes("sql");
  });

  if (hasSQLi) {
    remediation.push({
      topic: "SQL Injection",
      message: "Vulnerability Found: SQL Injection. Fix: Use Prepared Statements.",
      prevention: ["Use Prepared Statements", "Input Validation", "Least Privilege"],
      examples: [],
      tools: []
    });
  }

  return res.json({
    success: true,
    message: remediation.length ? "Vulnerabilities detected. See remediation below." : `Scan complete for ${scanResult.input}. No vulnerabilities found.`,
    detectedVulnerabilities: vulnerabilities,
    remediation
  });
};

