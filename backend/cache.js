import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { config } from "./config.js";

const dir = path.resolve(config.cacheDir);
fs.mkdirSync(dir, { recursive: true });

const keyFile = (key) =>
  path.join(dir, crypto.createHash("sha1").update(key).digest("hex") + ".json");

export function cacheGet(key) {
  const file = keyFile(key);
  if (!fs.existsSync(file)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    const ageHours = (Date.now() - raw.savedAt) / 36e5;
    if (ageHours > config.cacheTtlHours) return null;
    return raw.value;
  } catch {
    return null;
  }
}

export function cacheSet(key, value) {
  fs.writeFileSync(keyFile(key), JSON.stringify({ savedAt: Date.now(), value }));
  return value;
}

/* ------------------------------------------------------------------ *
 * SerpApi usage meter.
 * The free plan is 250 successful searches per month, so every search
 * is counted and the month rolls over on its own.
 * ------------------------------------------------------------------ */
const usageFile = path.join(dir, "serp-usage.json");

function readUsage() {
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  try {
    const u = JSON.parse(fs.readFileSync(usageFile, "utf8"));
    if (u.month === month) return u;
  } catch {
    /* first run */
  }
  return { month, used: 0 };
}

export function serpUsage() {
  const u = readUsage();
  return { ...u, limit: config.serpMonthlyBudget, left: Math.max(0, config.serpMonthlyBudget - u.used) };
}

export function serpCountCall() {
  const u = readUsage();
  u.used += 1;
  fs.writeFileSync(usageFile, JSON.stringify(u));
  return u.used;
}

export function serpHasBudget(n = 1) {
  return serpUsage().left >= n;
}
