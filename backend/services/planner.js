/**
 * Orchestration: research -> weather -> synthesis -> costed plan.
 * Every network dependency here is free-tier.
 */
import { searchLocal, searchWeb, searchImages } from "./serpapi.js";
import { geocode, forecast, route } from "./world.js";
import { completeJson, hasLlm } from "./llm.js";
import { computeBudget, alternatives, savingIdeas } from "./budget.js";
import { cacheGet, cacheSet } from "../cache.js";
import { config } from "../config.js";

const styleWord = { budget: "budget", balanced: "mid-range", premium: "luxury" };

export function researchKey(t) {
  return `research:${t.destination}|${t.style}|${(t.transport || []).join(",")}|${(t.interests || []).join(",")}`.toLowerCase();
}

/**
 * Up to `serpCallsPerPlan` SerpApi searches, then cached for
 * CACHE_TTL_HOURS so what-if questions are free.
 */
export async function research(t) {
  const key = researchKey(t);
  const cached = cacheGet(key);
  if (cached) return { ...cached, cached: true };

  const dest = t.destination;
  const interests = (t.interests || []).join(" ");
  const wantsBike = (t.transport || []).includes("bike");

  // Each entry is a *function* (not yet called) so we can stagger the
  // actual requests below instead of firing all six at the exact same
  // instant — SerpApi occasionally throttles a burst like that.
  const jobs = [
    () => searchLocal(`top tourist attractions ${interests} in ${dest}`, { limit: 10 }).catch(() => []),
    () => searchLocal(`${styleWord[t.style] || ""} hotels and homestays in ${dest}`, { limit: 6 }).catch(() => []),
    () => searchLocal(`best restaurants and local food in ${dest}`, { limit: 6 }).catch(() => []),
    () => searchWeb(`${t.origin} to ${dest} train bus flight fare and how to reach`, { limit: 8 }).catch(() => ({ organic: [] })),
    () =>
      wantsBike
        ? searchWeb(`bike scooter rental in ${dest} price per day documents required`, { limit: 8 }).catch(() => ({ organic: [] }))
        : searchWeb(`${dest} travel tips permits best time to visit ${new Date().getFullYear()}`, { limit: 8 }).catch(() => ({ organic: [] })),
    () => searchImages(`${dest} tourist places`, { limit: 6 }).catch(() => []),
  ].slice(0, config.serpCallsPerPlan);

  const stagger = (ms) => new Promise((res) => setTimeout(res, ms));
  const started = jobs.map(async (job, i) => {
    await stagger(i * 350); // spread six requests over ~1.75s instead of one instant burst
    return job();
  });

  const [attractions, stays, food, transport, extra, images] = await Promise.all(started);

  const out = {
    attractions: attractions || [],
    stays: stays || [],
    food: food || [],
    transport: transport || { organic: [] },
    extra: extra || { organic: [] },
    images: images || [],
    fetchedAt: new Date().toISOString(),
  };
  return cacheSet(key, out);
}

/* ------------------------------ synthesis ------------------------------ */

const SYSTEM = `You are a meticulous Indian travel planner. You turn live web research into a practical, executable trip plan.
Rules:
- Use ONLY places, hotels, restaurants and rental providers that appear in the research given to you. Never invent a business name.
- Costs are in INR. Give realistic per-item costs; the app recomputes the grand total itself.
- Be specific and local: name the transport (e.g. "Darjeeling Mail 12343, sleeper"), the road, the market, the dish.
- Respect the weather feed: move outdoor activities off days flagged wet.
- Reply with a single JSON object, nothing else.`;

function userPrompt(t, r, weather) {
  const brief = {
    trip: t,
    weather: weather.map((w) => ({ date: w.date, condition: w.condition, tempMin: w.tempMin, tempMax: w.tempMax, rainChance: w.rainChance, wet: w.wet })),
    research: {
      attractions: r.attractions.map((a) => ({ name: a.name, rating: a.rating, reviews: a.reviews, type: a.type, address: a.address, hours: a.hours })),
      stays: r.stays.map((s) => ({ name: s.name, rating: s.rating, price: s.price, address: s.address })),
      food: r.food.map((f) => ({ name: f.name, rating: f.rating, type: f.type, price: f.price, address: f.address })),
      transportSnippets: (r.transport.organic || []).map((o) => `${o.source}: ${o.title} — ${o.snippet}`),
      extraSnippets: (r.extra.organic || []).map((o) => `${o.source}: ${o.title} — ${o.snippet}`),
    },
  };

  return `Plan this trip.

${JSON.stringify(brief)}

Return JSON shaped exactly like this:
{
 "summary": "3 sentences on what this trip feels like and how it is structured",
 "bestRoute": {"headline":"", "legs":[{"mode":"train|bus|flight|cab|bike","detail":"","duration":"","costPerPerson":0}]},
 "days": [{"day":1,"date":"YYYY-MM-DD","title":"","weatherNote":"",
   "stops":[{"time":"08:30","name":"","what":"one or two lines on what to do here","entryFee":0,"minutes":90,"travelFromPrev":"12 km · 30 min by cab"}],
   "meals":[{"slot":"Lunch","name":"","dish":"","cost":0}],
   "stay":{"name":"","area":"","costPerNight":0},
   "restNote":""}],
 "places":[{"name":"","description":"2-3 lines","bestTime":"","timeNeeded":"","entryFee":0,"nearby":["",""]}],
 "transportOptions":[{"mode":"","provider":"","from":"","to":"","cost":0,"duration":"","notes":""}],
 "rentals":[{"provider":"","vehicle":"","perDay":0,"location":"","requirements":""}],
 "rateOverrides":{"stayPerRoomNight":0,"foodPerPersonDay":0,"intercityPerPerson":0},
 "packing":["",""],
 "tips":["",""],
 "emergency":[{"label":"","number":""}]
}
rateOverrides must reflect the real prices you found in the research; omit a key if unknown. Exactly ${t.days} day objects.`;
}

export async function buildPlan(t) {
  const [geo, r] = await Promise.all([geocode(t.destination), research(t)]);
  const weather = geo ? await forecast({ lat: geo.lat, lng: geo.lng, days: t.days, startDate: t.startDate }) : [];

  let ai = null;
  if (hasLlm()) {
    try {
      ai = await completeJson(SYSTEM, userPrompt(t, r, weather));
    } catch (e) {
      console.warn("LLM failed, using rule-based plan:", e.message);
    }
  }
  if (!ai) ai = ruleBasedPlan(t, r, weather);

  const over = {};
  for (const [k, v] of Object.entries(ai.rateOverrides || {})) if (Number(v) > 0) over[k] = Number(v);

  const budget = computeBudget(t, over);
  const photos = r.images.map((i) => ({ url: i.original || i.thumbnail, thumb: i.thumbnail, title: i.title, source: i.source }));

  const places = (ai.places || []).map((p) => {
    const match = r.attractions.find((a) => a.name && p.name && a.name.toLowerCase().includes(p.name.toLowerCase().slice(0, 12)));
    return {
      ...p,
      rating: match?.rating ?? null,
      reviews: match?.reviews ?? null,
      address: match?.address ?? "",
      hours: match?.hours ?? "",
      lat: match?.lat ?? null,
      lng: match?.lng ?? null,
      image: match?.thumbnail || photos[(ai.places || []).indexOf(p) % Math.max(1, photos.length)]?.thumb || null,
      mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent((p.name || "") + " " + t.destination)}`,
    };
  });

  return {
    trip: t,
    geo,
    summary: ai.summary,
    bestRoute: ai.bestRoute || null,
    days: ai.days || [],
    places,
    photos,
    weather,
    transportOptions: ai.transportOptions || [],
    rentals: ai.rentals || [],
    stays: r.stays,
    food: r.food,
    budget,
    alternatives: alternatives(t, over),
    savings: savingIdeas(t, budget),
    packing: ai.packing || [],
    tips: ai.tips || [],
    emergency: ai.emergency?.length ? ai.emergency : [
      { label: "National emergency", number: "112" },
      { label: "Ambulance", number: "108" },
      { label: "Tourist helpline", number: "1363" },
    ],
    sources: [...(r.transport.organic || []), ...(r.extra.organic || [])].slice(0, 8),
    generatedAt: new Date().toISOString(),
    researchCached: Boolean(r.cached),
    engine: hasLlm() ? config.llmProvider : "rule-based",
  };
}

/* --------------------- fallback when no LLM key is set --------------------- */

function ruleBasedPlan(t, r, weather) {
  const picks = r.attractions.filter((a) => a.name);
  const perDay = Math.max(1, Math.ceil(picks.length / Math.max(1, t.days)));
  const stay = r.stays[0];
  const days = Array.from({ length: t.days }, (_, i) => {
    const slice = picks.slice(i * perDay, i * perDay + perDay);
    const w = weather[i];
    return {
      day: i + 1,
      date: w?.date || "",
      title: i === 0 ? `Arrive in ${t.destination}` : i === t.days - 1 ? "Last morning and journey home" : `Around ${t.destination}`,
      weatherNote: w ? `${w.condition}, ${w.tempMin}–${w.tempMax}°C, rain chance ${w.rainChance ?? 0}%` : "",
      stops: slice.map((p, k) => ({
        time: ["09:00", "11:30", "14:30", "16:30"][k] || "17:30",
        name: p.name,
        what: p.type || "Sightseeing stop",
        entryFee: 0,
        minutes: 90,
        travelFromPrev: "",
      })),
      meals: r.food[i] ? [{ slot: "Lunch", name: r.food[i].name, dish: "Local thali", cost: 250 }] : [],
      stay: stay ? { name: stay.name, area: stay.address, costPerNight: 0 } : null,
      restNote: w?.wet ? "Rain likely — keep the afternoon indoors." : "",
    };
  });
  return {
    summary: `A ${t.days}-day ${styleWord[t.style]} trip to ${t.destination} for ${t.people}, built from live search results. Add a Groq or Gemini key to get a written, weather-aware itinerary.`,
    bestRoute: null,
    days,
    places: picks.slice(0, 8).map((p) => ({ name: p.name, description: p.type || "", bestTime: "", timeNeeded: "1–2 hours", entryFee: 0, nearby: [] })),
    transportOptions: [],
    rentals: [],
    rateOverrides: {},
    packing: [],
    tips: [],
    emergency: [],
  };
}

/* ------------------------------- what-if ------------------------------- */

export async function whatIf(t, change) {
  const next = { ...t, ...change };
  next.days = Math.max(1, Math.min(14, Number(next.days)));
  next.people = Math.max(1, Math.min(12, Number(next.people)));
  const plan = await buildPlan(next);
  return plan;
}

export { route };
