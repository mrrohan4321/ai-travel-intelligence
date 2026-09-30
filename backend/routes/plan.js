import { Router } from "express";
import { normalizeTripRequest } from "../models/tripRequest.js";
import { buildPlan } from "../services/planner.js";
import { serpUsage } from "../cache.js";

const router = Router();

router.post("/", async (req, res) => {
  const trip = normalizeTripRequest(req.body);
  if (!trip.destination) return res.status(400).json({ error: "Tell me where you want to go." });
  try {
    const plan = await buildPlan(trip);
    res.json({ ...plan, usage: serpUsage() });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: e.message });
  }
});

export default router;
