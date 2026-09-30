import { Router } from "express";
import { config, hasSerp, hasLlm } from "../config.js";
import { serpUsage } from "../cache.js";

const router = Router();

router.get("/", (_req, res) =>
  res.json({ ok: true, serpApi: hasSerp(), llm: hasLlm() ? config.llmProvider : null, usage: serpUsage() })
);

export default router;
