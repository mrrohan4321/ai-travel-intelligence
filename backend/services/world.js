/**
 * Free, keyless data sources.
 *   Geocoding : Open-Meteo Geocoding API (free, no key, no UA/rate-limit games)
 *   Weather   : Open-Meteo               (free, no key, 16-day forecast)
 *   Distance  : OSRM demo router         (free, no key)
 */
import { config } from "../config.js";
import { cacheGet, cacheSet } from "../cache.js";

const ua = { "User-Agent": config.userAgent, Accept: "application/json" };

/**
 * Any of these free demo endpoints can occasionally answer with a plain-text
 * block/error page instead of JSON. Parse defensively so one bad response
 * doesn't take down the whole plan — the rest of the app can still run
 * without weather/coordinates for that request.
 */
async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response (HTTP ${res.status}) from ${res.url}: ${text.slice(0, 150)}`);
  }
}

/**
 * Switched from Nominatim (nominatim.openstreetmap.org) to Open-Meteo's own
 * geocoder: same free/keyless deal, but it's built for programmatic app use
 * instead of the OSM search box, so it doesn't do the aggressive per-app
 * User-Agent/IP blocking that kept 403'ing this project.
 */
export async function geocode(place) {
  const key = "geo:" + place.toLowerCase();
  const hit = cacheGet(key);
  if (hit) return hit;

  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", place);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");
    const res = await fetch(url, { headers: ua });
    const j = await safeJson(res);
    const first = j.results?.[0];
    if (!first) return null;
    const name = [first.name, first.admin1, first.country].filter(Boolean).join(", ");
    return cacheSet(key, {
      name,
      lat: Number(first.latitude),
      lng: Number(first.longitude),
    });
  } catch (e) {
    console.warn("geocode failed, continuing without it:", e.message);
    return null;
  }
}

const WMO = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain", 66: "Freezing rain", 67: "Freezing rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
  80: "Rain showers", 81: "Rain showers", 82: "Violent rain showers",
  85: "Snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with hail",
};

export async function forecast({ lat, lng, days = 7, startDate }) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lng);
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max"
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", String(Math.min(16, Math.max(1, days))));
  if (startDate) url.searchParams.set("start_date", startDate);

  try {
    const res = await fetch(url, { headers: ua });
    const j = await safeJson(res);
    const d = j.daily;
    if (!d) return [];
    return d.time.map((date, i) => ({
      date,
      condition: WMO[d.weather_code[i]] || "—",
      code: d.weather_code[i],
      tempMax: Math.round(d.temperature_2m_max[i]),
      tempMin: Math.round(d.temperature_2m_min[i]),
      rainChance: d.precipitation_probability_max?.[i] ?? null,
      rainMm: d.precipitation_sum?.[i] ?? null,
      wind: Math.round(d.wind_speed_10m_max?.[i] ?? 0),
      wet: (d.precipitation_probability_max?.[i] ?? 0) >= 60 || [65, 82, 95, 96, 99].includes(d.weather_code[i]),
    }));
  } catch (e) {
    console.warn("forecast failed, continuing without it:", e.message);
    return [];
  }
}

/** Road distance + driving time between two points, free OSRM demo server. */
export async function route(from, to) {
  const key = `route:${from.lat},${from.lng}->${to.lat},${to.lng}`;
  const hit = cacheGet(key);
  if (hit) return hit;
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
    const j = await safeJson(await fetch(url, { headers: ua }));
    const r = j.routes?.[0];
    if (!r) return null;
    return cacheSet(key, { km: +(r.distance / 1000).toFixed(1), hours: +(r.duration / 3600).toFixed(1) });
  } catch {
    return null;
  }
}