/**
 * Shape of a trip request coming from the browser, and how it's normalized
 * before anything downstream (research, budget, LLM) sees it.
 *
 * @typedef {Object} TripRequest
 * @property {string} origin
 * @property {string} destination
 * @property {number} days        1-14
 * @property {number} people      1-12
 * @property {number} budget      total for the group, 0 = not set
 * @property {"budget"|"balanced"|"premium"} style
 * @property {string[]} interests
 * @property {string[]} transport
 * @property {string} [startDate] YYYY-MM-DD
 */

/** @returns {TripRequest} */
export function normalizeTripRequest(body = {}) {
  return {
    origin: String(body.origin || "").slice(0, 80),
    destination: String(body.destination || "").slice(0, 80),
    days: Math.max(1, Math.min(14, Number(body.days) || 3)),
    people: Math.max(1, Math.min(12, Number(body.people) || 2)),
    budget: Math.max(0, Number(body.budget) || 0),
    style: ["budget", "balanced", "premium"].includes(body.style) ? body.style : "balanced",
    interests: (Array.isArray(body.interests) ? body.interests : []).slice(0, 8).map(String),
    transport: (Array.isArray(body.transport) ? body.transport : []).slice(0, 6).map(String),
    startDate: /^\d{4}-\d{2}-\d{2}$/.test(body.startDate || "") ? body.startDate : undefined,
  };
}
