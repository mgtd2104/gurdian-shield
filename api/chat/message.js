const SYSTEM_INSTRUCTION = "You are Guardian Shield AI, a specialized cybersecurity assistant. Provide expert, concise remediation steps for vulnerabilities found in scans. Use Markdown for code blocks.";

function normalizeModelId(raw) {
  if (typeof raw !== "string") return null;
  let model = raw.trim();
  if (!model) return null;
  if (model.startsWith("models/")) model = model.slice("models/".length);
  if (model.includes("/")) model = model.split("/").filter(Boolean).pop();
  return model || null;
}

async function listModels({ apiKey, apiVersion }) {
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${encodeURIComponent(apiKey)}`;
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const data = await resp.json();
  const models = Array.isArray(data?.models) ? data.models : [];
  return models
    .map((m) => ({
      name: typeof m?.name === "string" ? m.name : "",
      supportedGenerationMethods: Array.isArray(m?.supportedGenerationMethods) ? m.supportedGenerationMethods : []
    }))
    .filter((m) => m.name);
}

function pickFallbackModelId(models) {
  const eligible = models.filter((m) => m.supportedGenerationMethods.includes("generateContent"));
  const preferred = eligible.find((m) => m.name.includes("gemini-1.5-flash")) || eligible[0];
  if (!preferred) return null;
  return normalizeModelId(preferred.name);
}

function toTextParts(value) {
  const text = typeof value === "string" ? value : String(value ?? "");
  const trimmed = text.trim();
  return trimmed ? [{ text: trimmed }] : [];
}

function normalizeRole(role) {
  const r = String(role || "").toLowerCase();
  if (r === "assistant" || r === "bot" || r === "model") return "model";
  return "user";
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .map((m) => {
      if (!m) return null;
      if (Array.isArray(m.parts) && typeof m.role === "string") {
        return { role: normalizeRole(m.role), parts: m.parts };
      }
      const role = normalizeRole(m.role ?? m.type);
      const content = m.content ?? m.text ?? m.message;
      const parts = toTextParts(content);
      if (!parts.length) return null;
      return { role, parts };
    })
    .filter(Boolean);
}

function appendScanContext(contents, scanResult) {
  if (scanResult === undefined || scanResult === null) return contents;

  let scanText;
  try {
    scanText = `Scan context (JSON):\n${JSON.stringify(scanResult, null, 2)}`;
  } catch {
    scanText = `Scan context:\n${String(scanResult)}`;
  }

  for (let i = contents.length - 1; i >= 0; i -= 1) {
    if (contents[i]?.role === "user") {
      const existingText = contents[i]?.parts?.[0]?.text;
      if (typeof existingText === "string") {
        contents[i] = {
          ...contents[i],
          parts: [{ text: `${existingText.trim()}\n\n${scanText}` }]
        };
        return contents;
      }
      break;
    }
  }

  return [...contents, { role: "user", parts: [{ text: scanText }] }];
}

async function generate({ apiKey, apiVersion, modelId, contents, prompt }) {
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const finalContents = Array.isArray(contents) && contents.length
    ? contents
    : [{ role: "user", parts: [{ text: prompt }] }];

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: finalContents
    })
  });

  const text = await resp.text();
  if (!resp.ok) {
    const err = new Error(text || `Gemini request failed (${resp.status})`);
    err.status = resp.status;
    err.bodyText = text;
    throw err;
  }
  try {
    return JSON.parse(text);
  } catch {
    const err = new Error("Gemini returned non-JSON response");
    err.status = 502;
    err.bodyText = text;
    throw err;
  }
}

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
  const history = body.history;

  const prompt = buildPrompt(message, scanResult);
  let contents = normalizeHistory(history);
  if (!contents.length) {
    contents = [{ role: "user", parts: [{ text: prompt }] }];
  } else {
    contents = appendScanContext(contents, scanResult);
  }
  const configuredModel = normalizeModelId(process.env.GEMINI_MODEL);
  const model = configuredModel || "gemini-1.5-flash";
  const apiVersion = (process.env.GEMINI_API_VERSION || "v1beta").trim() || "v1beta";

  try {
    let data;
    try {
      data = await generate({ apiKey, apiVersion, modelId: model, contents, prompt });
    } catch (e) {
      if (e?.status === 404) {
        const models = await listModels({ apiKey, apiVersion });
        const fallback = pickFallbackModelId(models);
        if (fallback && fallback !== model) {
          console.error(`Gemini model not found: ${model}. Retrying with: ${fallback}`);
          data = await generate({ apiKey, apiVersion, modelId: fallback, contents, prompt });
        } else {
          const sample = models.slice(0, 15).map((m) => m.name).join(", ");
          console.error(`Gemini model not found: ${model}. Available models sample: ${sample}`);
          throw e;
        }
      } else {
        throw e;
      }
    }

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
