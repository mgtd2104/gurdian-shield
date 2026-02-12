async function main() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY");
    process.exitCode = 1;
    return;
  }

  const apiVersion = (process.env.GEMINI_API_VERSION || "v1beta").trim() || "v1beta";
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${encodeURIComponent(apiKey)}`;
  const resp = await fetch(url);
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error(JSON.stringify(data, null, 2));
    process.exitCode = 1;
    return;
  }

  const models = Array.isArray(data?.models) ? data.models : [];
  const eligible = models
    .filter((m) => Array.isArray(m?.supportedGenerationMethods) && m.supportedGenerationMethods.includes("generateContent"))
    .map((m) => m.name)
    .filter(Boolean);

  console.log(eligible.join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

