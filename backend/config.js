import "dotenv/config";

export const config = {
  port: process.env.PORT || 3000,

  // --- SerpApi (free plan: 250 successful searches / month, 50 per hour) ---
  serpApiKey: process.env.SERPAPI_KEY || "",
  // Hard ceiling so a few test runs can never eat the whole free allowance.
  serpMonthlyBudget: Number(process.env.SERPAPI_MONTHLY_BUDGET || 200),
  serpCallsPerPlan: Number(process.env.SERPAPI_CALLS_PER_PLAN || 6),
  serpCountry: process.env.SERPAPI_COUNTRY || "in",
  serpLanguage: process.env.SERPAPI_LANGUAGE || "en",

  // --- LLM: free tiers only. groq | gemini | none ---
  llmProvider: (process.env.LLM_PROVIDER || "groq").toLowerCase(),
  groqKey: process.env.GROQ_API_KEY || "",
  groqModel: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  geminiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",

  // Cache research on disk so repeat/what-if requests cost 0 searches.
  cacheDir: process.env.CACHE_DIR || ".cache",
  cacheTtlHours: Number(process.env.CACHE_TTL_HOURS || 72),

  // Nominatim asks every app to identify itself.
  userAgent:
    process.env.APP_USER_AGENT ||
    "AI-Travel-Intelligence/1.0 (https://github.com/yourname/ai-travel-intelligence)",
};

export const hasSerp = () => Boolean(config.serpApiKey);
export const hasLlm = () =>
  (config.llmProvider === "groq" && config.groqKey) ||
  (config.llmProvider === "gemini" && config.geminiKey);