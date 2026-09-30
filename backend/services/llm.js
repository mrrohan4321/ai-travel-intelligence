/**
 * Free-tier LLM access. Two providers, same interface:
 *   groq   - console.groq.com, no card, rate-limited only
 *   gemini - aistudio.google.com, free Flash models
 * If neither key is set the planner falls back to a rule-based plan.
 */
import { config, hasLlm } from "../config.js";

const stripFences = (t) => t.replace(/```json/gi, "").replace(/```/g, "").trim();

async function groqJson(system, user) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.groqKey}`,
    },
    body: JSON.stringify({
      model: config.groqModel,
      temperature: 0.4,
      max_tokens: 8000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  const j = await res.json();
  if (j.error) throw new Error("Groq: " + (j.error.message || JSON.stringify(j.error)));
  return JSON.parse(stripFences(j.choices[0].message.content));
}

async function geminiJson(system, user) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.4, responseMimeType: "application/json", maxOutputTokens: 8192 },
    }),
  });
  const j = await res.json();
  if (j.error) throw new Error("Gemini: " + j.error.message);
  return JSON.parse(stripFences(j.candidates[0].content.parts.map((p) => p.text).join("")));
}

export async function completeJson(system, user) {
  if (!hasLlm()) throw new Error("no-llm");
  return config.llmProvider === "gemini" ? geminiJson(system, user) : groqJson(system, user);
}

export { hasLlm };
