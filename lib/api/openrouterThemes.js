/**
 * OpenRouter — interpret user search into 3–5 English theme keywords for Quran search.
 * Uses only the model from OPENROUTER_MODEL (must be a free-tier model you choose).
 * Never falls back to paid models.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function parseThemeLine(text) {
  if (!text || typeof text !== "string") return [];
  const cleaned = text.replace(/```[\s\S]*?```/g, "").trim();
  const parts = cleaned.split(/[,;\n]+/);
  const out = [];
  for (const p of parts) {
    const w = p
      .trim()
      .toLowerCase()
      .replace(/^[\d.)]+\s*/, "")
      .replace(/^[-*•]\s*/, "")
      .replace(/^["']|["']$/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (w.length < 2 || w.length > 48) continue;
    const words = w.split(/\s+/);
    if (words.length <= 3) out.push(w);
  }
  return [...new Set(out)].slice(0, 5);
}

/**
 * @returns {Promise<string[]|null>} Themes, or null if AI unavailable / failed (caller uses raw query).
 */
export async function interpretSearchThemes(userInput) {
  const raw = typeof userInput === "string" ? userInput.trim() : "";
  if (!raw) return null;

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  if (!apiKey || !model) return null;

  const system = `You convert user feelings or situations into 3 to 5 short English search keywords for finding relevant Quran translations.
Rules:
- Output ONLY a comma-separated list of keywords (no numbering, no sentences, no quotes).
- Keywords are themes: single words or two-word phrases max.
- No Arabic. No verse references. No explanation.
- Be specific to the user's intent (e.g. business → trade, provision, honesty, risk).`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Quran Reflect",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 80,
        messages: [
          { role: "system", content: system },
          { role: "user", content: raw },
        ],
      }),
    });

    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;
    const themes = parseThemeLine(content);
    return themes.length > 0 ? themes : null;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}
