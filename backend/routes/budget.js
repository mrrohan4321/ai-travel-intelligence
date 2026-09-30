import { Router } from "express";
import { normalizeTripRequest } from "../models/tripRequest.js";
import { computeBudget, alternatives, savingIdeas } from "../services/budget.js";

const router = Router();

/** Instant budget maths with no network calls — used for slider previews. */
router.post("/", (req, res) => {
  const trip = normalizeTripRequest(req.body);
  const budget = computeBudget(trip);
  res.json({ budget, alternatives: alternatives(trip), savings: savingIdeas(trip, budget) });
});

export default router;
