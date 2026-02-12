const SYSTEM_INSTRUCTION = "You are Guardian Shield AI, a specialized cybersecurity assistant. Provide expert, concise remediation steps for vulnerabilities found in scans. Use Markdown for code blocks.";

function buildPrompt(message, scanResult) {
  const parts = [];
  if (typeof message === "string" && message.trim()) {
    parts.push(`User message:\n${message.trim()}`);
  }

  if (scanResult !== undefined && scanResult !== null) {
    try {
      parts.push(`Scan context (JSON):\n${JSON.stringify(scanResult, null, 2)}`);
    } catch {
      parts.push(`Scan context:\n${String(scanResult)}`);
    }
  }

  if (!parts.length) return "Provide cybersecurity help.";
  return parts.join("\n\n");
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.json({ success: false, error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    res.statusCode = 500;
    return res.json({
      success: false,
      response: { message: "Guardian Shield is currently in offline mode." }
    });
  }

  const body = req.body || {};
  const message = body.message;
  const scanResult = body.scanResult;

  const prompt = buildPrompt(message, scanResult);
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      res.statusCode = 502;
      return res.json({
        success: false,
        response: { message: text || "Gemini request failed" }
      });
    }

    const data = await resp.json();
    const answer = data?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join("") || "";

    return res.json({
      success: true,
      response: {
        message: answer.trim() || "No response generated.",
        relevant: true
      }
    });
  } catch (e) {
    res.statusCode = 502;
    return res.json({
      success: false,
      response: { message: String(e?.message || e) }
    });
  }
};

