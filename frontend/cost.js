/**
 * Deterministic cost engine.
 * The LLM writes the story; this file does all the arithmetic, so the
 * numbers in the itinerary, the budget table and the PDF always agree.
 * Rates are indicative INR figures for Indian domestic travel and live in
 * one place so they are easy to tune.
 */

export const STYLE_RATES = {
  budget: {
    label: "Budget",
    stayPerRoomNight: 1300,     // homestay, triple sharing
    foodPerPersonDay: 400,      // local dhaba + street food
    localTransportPerDay: 600,  // shared cabs / buses per group
    activityPerPersonDay: 200,
    bikeRentPerDay: 700,
    carRentPerDay: 2800,
    intercityPerPerson: 1100,   // sleeper train / state bus, one way
  },
  balanced: {
    label: "Mid-range",
    stayPerRoomNight: 2600,
    foodPerPersonDay: 800,
    localTransportPerDay: 1400,
    activityPerPersonDay: 500,
    bikeRentPerDay: 1100,
    carRentPerDay: 3800,
    intercityPerPerson: 2600,   // 3AC train / cheap flight
  },
  premium: {
    label: "Premium",
    stayPerRoomNight: 6500,
    foodPerPersonDay: 1800,
    localTransportPerDay: 3000,
    activityPerPersonDay: 1200,
    bikeRentPerDay: 1600,
    carRentPerDay: 5500,
    intercityPerPerson: 6000,   // flight
  },
};

// Budget travellers take triple-sharing rooms; everyone else sleeps two to a room.
export const roomsFor = (people, style = "balanced") =>
  Math.max(1, Math.ceil(people / (style === "budget" ? 3 : 2)));
export const bikesFor = (people) => Math.max(1, Math.ceil(people / 2));

/**
 * @param {object} t trip: {days, people, style, transport:[], budget}
 * @param {object} over optional overrides from research, e.g. {stayPerRoomNight: 1500}
 */
export function computeBudget(t, over = {}) {
  const r = { ...(STYLE_RATES[t.style] || STYLE_RATES.balanced), ...over };
  const nights = Math.max(1, t.days - 1);
  const rooms = roomsFor(t.people, t.style);
  const usesBike = (t.transport || []).includes("bike");
  const usesCar = (t.transport || []).includes("car");
  const ridingDays = Math.max(1, t.days - 2); // arrival and departure days are travel days

  const lines = [
    {
      key: "intercity",
      label: `Travel ${t.origin || "home"} ⇄ ${t.destination}`,
      basis: `${t.people} × ₹${r.intercityPerPerson} × 2 ways`,
      amount: r.intercityPerPerson * t.people * 2,
    },
    {
      key: "stay",
      label: "Accommodation",
      basis: `${rooms} room${rooms > 1 ? "s" : ""} × ${nights} night${nights > 1 ? "s" : ""} × ₹${r.stayPerRoomNight}`,
      amount: r.stayPerRoomNight * rooms * nights,
    },
    {
      key: "food",
      label: "Food",
      basis: `${t.people} × ${t.days} days × ₹${r.foodPerPersonDay}`,
      amount: r.foodPerPersonDay * t.people * t.days,
    },
    {
      key: "local",
      label: "Local transport",
      basis: `${t.days} days × ₹${r.localTransportPerDay} per group`,
      amount: usesBike ? Math.round(r.localTransportPerDay * t.days * 0.35) : r.localTransportPerDay * t.days,
    },
    {
      key: "activities",
      label: "Activities & entry tickets",
      basis: `${t.people} × ${t.days} days × ₹${r.activityPerPersonDay}`,
      amount: r.activityPerPersonDay * t.people * t.days,
    },
  ];

  if (usesBike)
    lines.push({
      key: "bike",
      label: "Bike / scooter rental",
      basis: `${bikesFor(t.people)} bike${bikesFor(t.people) > 1 ? "s" : ""} × ${ridingDays} days × ₹${r.bikeRentPerDay} (+ fuel)`,
      amount: Math.round(r.bikeRentPerDay * bikesFor(t.people) * ridingDays * 1.25),
    });

  if (usesCar)
    lines.push({
      key: "car",
      label: "Car rental with driver",
      basis: `${ridingDays} days × ₹${r.carRentPerDay}`,
      amount: r.carRentPerDay * ridingDays,
    });

  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const misc = Math.round(subtotal * 0.08);
  lines.push({ key: "misc", label: "Buffer (permits, tips, SIM, emergencies)", basis: "8% of subtotal", amount: misc });

  const total = subtotal + misc;
  const target = Number(t.budget) || 0;

  return {
    style: r.label,
    lines,
    total,
    perPerson: Math.round(total / Math.max(1, t.people)),
    perDay: Math.round(total / Math.max(1, t.days)),
    target,
    withinBudget: target ? total <= target : true,
    gap: target ? total - target : 0,
    rates: r,
  };
}

/** Three alternative price points for the same trip. */
export function alternatives(t, over = {}) {
  return ["budget", "balanced", "premium"].map((style) => {
    const b = computeBudget({ ...t, style }, style === t.style ? over : {});
    return {
      style,
      label: STYLE_RATES[style].label,
      total: b.total,
      perPerson: b.perPerson,
      current: style === t.style,
      note:
        style === "budget"
          ? "Homestays, sleeper class, shared jeeps, local eateries."
          : style === "balanced"
          ? "Clean 3-star rooms, 3AC or a cheap flight, private cab on key days."
          : "Resorts, flights, private car all days, guided experiences.",
    };
  });
}

/** Suggestions that actually close the gap, each with a rupee value. */
export function savingIdeas(t, budget) {
  const ideas = [];
  const r = budget.rates;
  const nights = Math.max(1, t.days - 1);
  const rooms = roomsFor(t.people, t.style);

  if (t.style !== "budget") {
    const cheaper = computeBudget({ ...t, style: t.style === "premium" ? "balanced" : "budget" });
    ideas.push({ text: `Switch to the ${cheaper.style} plan`, saves: budget.total - cheaper.total });
  }
  if (t.days > 3) {
    const shorter = computeBudget({ ...t, days: t.days - 1 });
    ideas.push({ text: `Drop one day (${t.days} → ${t.days - 1})`, saves: budget.total - shorter.total });
  }
  if (t.people > 2 && rooms > 1)
    ideas.push({
      text: "Take one triple-sharing room instead of two doubles",
      saves: r.stayPerRoomNight * nights,
    });
  ideas.push({
    text: "Sleeper class / state bus instead of AC or flight on the long leg",
    saves: Math.round(r.intercityPerPerson * t.people * 2 * 0.4),
  });
  ideas.push({
    text: "Two street-food meals a day instead of restaurants",
    saves: Math.round(r.foodPerPersonDay * t.people * t.days * 0.3),
  });
  return ideas.filter((i) => i.saves > 0).sort((a, b) => b.saves - a.saves).slice(0, 5);
}
