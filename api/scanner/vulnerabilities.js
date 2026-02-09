const axios = require("axios");
const cheerio = require("cheerio");
const { URL } = require("url");

const PAYLOADS = [
  "' OR 1=1 --",
  '" OR 1=1 --',
  "<script>alert(1)</script>",
  "<img src=x onerror=alert(1)>",
  "../../etc/passwd",
  "..\\..\\windows\\win.ini"
];

function uniquePush(arr, item) {
  const key = `${item.type}|${item.url}|${item.description}`;
  if (!arr.some((v) => `${v.type}|${v.url}|${v.description}` === key)) {
    arr.push(item);
  }
}

async function fetchPage(url) {
  const res = await axios.get(url, {
    timeout: 10000,
    maxRedirects: 5,
    validateStatus: () => true,
    headers: {
      "User-Agent": "GuardianShield-Scanner/1.0",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
  });
  return res;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.json({ error: "Method not allowed" });
  }

  const { input } = req.body || {};
  if (!input) {
    res.statusCode = 400;
    return res.json({ error: "Input is required" });
  }

  const target = String(input).startsWith("http") ? String(input) : `http://${input}`;
  const vulnerabilities = [];

  try {
    const baseline = await fetchPage(target);
    const baselineText = String(baseline.data || "");
    const baselineLen = baselineText.length;

    const headers = baseline.headers || {};
    const missing = [];
    if (!headers["content-security-policy"]) missing.push("Content-Security-Policy");
    if (!headers["x-frame-options"]) missing.push("X-Frame-Options");
    if (!headers["x-content-type-options"]) missing.push("X-Content-Type-Options");
    if (missing.length) {
      uniquePush(vulnerabilities, {
        type: "Insecure Headers",
        severity: "Medium",
        description: `Missing security headers: ${missing.join(", ")}`,
        url: target
      });
    }

    const parsed = new URL(target);
    const params = new URLSearchParams(parsed.search);
    const baseUrl = `${parsed.origin}${parsed.pathname}`;

    for (const [key] of params.entries()) {
      for (const payload of PAYLOADS) {
        const p = new URLSearchParams(parsed.search);
        p.set(key, payload);
        const fuzzUrl = `${baseUrl}?${p.toString()}`;
        const r = await fetchPage(fuzzUrl);
        const t = String(r.data || "");

        if (t.includes(payload) && (payload.includes("<script>") || payload.includes("<img"))) {
          uniquePush(vulnerabilities, {
            type: "Cross-Site Scripting (XSS)",
            severity: "High",
            description: `Payload reflected in response: ${payload}`,
            url: fuzzUrl
          });
        }

        const sqlErrors = ["SQL syntax", "mysql_fetch", "ORA-01756", "SQLite3::SQLException", "syntax error"];
        if (sqlErrors.some((e) => t.includes(e))) {
          uniquePush(vulnerabilities, {
            type: "SQL Injection",
            severity: "Critical",
            description: `SQL error detected with payload: ${payload}`,
            url: fuzzUrl
          });
        } else if (Math.abs(t.length - baselineLen) > 50 && payload.includes("OR 1=1")) {
          uniquePush(vulnerabilities, {
            type: "SQL Injection",
            severity: "Critical",
            description: `Significant response length change detected (${t.length} vs ${baselineLen}) with payload: ${payload}`,
            url: fuzzUrl
          });
        }
      }
    }

    const $ = cheerio.load(baselineText);
    const forms = $("form").toArray();

    for (const form of forms) {
      const $form = $(form);
      const action = $form.attr("action") || target;
      const method = String($form.attr("method") || "get").toLowerCase();
      const formUrl = new URL(action, target).toString();

      const inputNames = $form
        .find("input")
        .map((_, el) => $(el).attr("name"))
        .get()
        .filter(Boolean);

      for (const name of inputNames) {
        for (const payload of PAYLOADS) {
          const data = {};
          for (const n of inputNames) data[n] = "test";
          data[name] = payload;

          let r;
          if (method === "post") {
            r = await axios.post(formUrl, new URLSearchParams(data).toString(), {
              timeout: 10000,
              maxRedirects: 5,
              validateStatus: () => true,
              headers: {
                "User-Agent": "GuardianShield-Scanner/1.0",
                "Content-Type": "application/x-www-form-urlencoded"
              }
            });
          } else {
            r = await fetchPage(`${formUrl}?${new URLSearchParams(data).toString()}`);
          }

          const t = String(r.data || "");
          if (t.includes(payload) && (payload.includes("<script>") || payload.includes("<img"))) {
            uniquePush(vulnerabilities, {
              type: "Cross-Site Scripting (XSS)",
              severity: "High",
              description: `Payload reflected in form response: ${payload}`,
              url: formUrl
            });
          }

          const sqlErrors = ["SQL syntax", "mysql_fetch", "ORA-01756", "SQLite3::SQLException", "syntax error"];
          if (sqlErrors.some((e) => t.includes(e))) {
            uniquePush(vulnerabilities, {
              type: "SQL Injection",
              severity: "Critical",
              description: `SQL error in form with payload: ${payload}`,
              url: formUrl
            });
          }
        }
      }
    }

    const riskLevel = vulnerabilities.some((v) => v.severity === "Critical")
      ? "Critical"
      : vulnerabilities.length
        ? "High"
        : "Safe";

    return res.json({
      success: true,
      input: target,
      vulnerabilities,
      riskLevel
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: String(e?.message || e) });
  }
};

