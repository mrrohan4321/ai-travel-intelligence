import { Router } from "express";
import { normalizeTripRequest } from "../models/tripRequest.js";
import { whatIf } from "../services/planner.js";
import { serpUsage } from "../cache.js";

const router = Router();

router.post("/", async (req, res) => {
  const trip = normalizeTripRequest(req.body.trip || {});
  const change = req.body.change || {};
  try {
    // Research is already cached for this destination, so this costs 0 searches.
    const plan = await whatIf(trip, change);
    res.json({ ...plan, usage: serpUsage() });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

export default router;
