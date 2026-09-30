import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config, hasSerp, hasLlm } from "./config.js";
import healthRoute from "./routes/health.js";
import planRoute from "./routes/plan.js";
import whatifRoute from "./routes/whatif.js";
import budgetRoute from "./routes/budget.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.use("/api/health", healthRoute);
app.use("/api/plan", planRoute);
app.use("/api/whatif", whatifRoute);
app.use("/api/budget", budgetRoute);

app.listen(config.port, () => {
  console.log(`AI Travel Intelligence → http://localhost:${config.port}`);
  if (!hasSerp()) console.log("⚠  SERPAPI_KEY missing — research calls will fail.");
  if (!hasLlm()) console.log("ℹ  No LLM key — falling back to the rule-based planner.");
});
