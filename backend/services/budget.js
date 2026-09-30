// The cost engine lives in frontend/cost.js so the browser and the server run
// exactly the same arithmetic (instant previews client-side, authoritative
// totals server-side). This file just re-exports it.
export * from "../../frontend/cost.js";
