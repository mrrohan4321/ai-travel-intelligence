/**
 * SerpApi is the research engine of the app.
 * Free plan = 250 successful searches/month, 50/hour, so every call is
 * cached on disk and counted. Cached hits cost nothing.
 *
 * Docs: https://serpapi.com/search-api
 */
import { config } from "../config.js";
import { cacheGet, cacheSet, serpCountCall, serpHasBudget, serpUsage } from "../cache.js";

const ENDPOINT = "https://serpapi.com/search.json";

class QuotaError extends Error {}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * SerpApi occasionally returns a transient 429/503 (or a plain-text
 * "Access Denied" page from its CDN) under load. Neither means the key or
 * the request is wrong, so this retries a few times with backoff before
 * giving up, instead of crashing the whole plan on one flaky response.
 */
async function serp(params, { cacheKey, retries = 3 } = {}) {
  const key = cacheKey || "serp:" + JSON.stringify(params);
  const hit = cacheGet(key);
  if (hit) return { ...hit, _cached: true };

  if (!config.serpApiKey) throw new Error("SERPAPI_KEY is missing. Add it to .env");
  if (!serpHasBudget()) {
    throw new QuotaError(
      `SerpApi monthly budget used (${serpUsage().used}/${serpUsage().limit}). Cached results still work.`
    );
  }

  const url = new URL(ENDPOINT);
  Object.entries({
    api_key: config.serpApiKey,
    gl: config.serpCountry,
    hl: config.serpLanguage,
    ...params,
  }).forEach(([k, v]) => v != null && url.searchParams.set(k, String(v)));

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await sleep(500 * 2 ** attempt); // 1s, 2s, 4s

    let res, text;
    try {
      res = await fetch(url, { headers: { "User-Agent": config.userAgent } });
      text = await res.text();
    } catch (e) {
      lastErr = e; // network hiccup — retry
      continue;
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      // Not JSON — a CDN/rate-limit page ("Access Denied", 503 HTML, etc).
      lastErr = new Error(
        `SerpApi returned a non-JSON response (HTTP ${res.status}): ${text.slice(0, 150)}`
      );
      if (res.status === 429 || res.status === 503 || res.status === 403) continue; // worth retrying
      throw lastErr; // anything else, don't waste retries
    }

    if (json.error) {
      lastErr = new Error("SerpApi: " + json.error);
      if (/rate|throughput|try again/i.test(json.error)) continue;
      throw lastErr;
    }

    serpCountCall(); // only successful searches count on the free plan
    return cacheSet(key, json);
  }
  throw lastErr;
}

const clean = (s) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim() : s);

/** Places / attractions / anything with a map presence (Google Local pack). */
export async function searchLocal(query, { limit = 8 } = {}) {
  const json = await serp({ engine: "google", q: query, tbm: "lcl" });
  const rows = json.local_results?.places || json.local_results || [];
  return (Array.isArray(rows) ? rows : []).slice(0, limit).map((p) => ({
    name: clean(p.title),
    rating: p.rating ?? null,
    reviews: p.reviews ?? null,
    type: clean(p.type || p.category || ""),
    address: clean(p.address || ""),
    hours: clean(p.hours || p.open_state || ""),
    price: clean(p.price || ""),
    thumbnail: p.thumbnail || null,
    lat: p.gps_coordinates?.latitude ?? null,
    lng: p.gps_coordinates?.longitude ?? null,
    link: p.links?.website || p.website || null,
  }));
}

/** Plain web search — used for fares, rentals, permits, travel tips. */
export async function searchWeb(query, { limit = 8 } = {}) {
  const json = await serp({ engine: "google", q: query, num: 10 });
  const organic = (json.organic_results || []).slice(0, limit).map((r) => ({
    title: clean(r.title),
    link: r.link,
    snippet: clean(r.snippet || ""),
    source: clean(r.source || new URL(r.link).hostname.replace("www.", "")),
  }));
  return {
    answerBox: json.answer_box
      ? clean(json.answer_box.answer || json.answer_box.snippet || "")
      : null,
    knowledge: json.knowledge_graph
      ? {
          title: clean(json.knowledge_graph.title),
          description: clean(json.knowledge_graph.description || ""),
          image: json.knowledge_graph.header_images?.[0]?.image || json.knowledge_graph.thumbnail || null,
        }
      : null,
    organic,
  };
}

/** Photographs for destination cards and the PDF. */
export async function searchImages(query, { limit = 4 } = {}) {
  const json = await serp({ engine: "google_images", q: query });
  return (json.images_results || []).slice(0, limit).map((i) => ({
    thumbnail: i.thumbnail,
    original: i.original,
    title: clean(i.title || ""),
    source: i.source || i.link,
  }));
}

export { QuotaError };
