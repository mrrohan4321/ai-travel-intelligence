import { computeBudget, alternatives, savingIdeas, STYLE_RATES } from "./cost.js";
import { DEMO_TRIP, DEMO_PLAN, DEMO_RATE_OVERRIDES } from "./demo-data.js";

/* ----------------------------------------------------------------- utils */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rupees = (n) => "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");
const dayName = (iso) => {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return isNaN(d) ? "" : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};

const state = { live: false, trip: null, plan: null, budget: null };

/* ------------------------------------------------------------ connection */
async function checkBackend() {
  try {
    const r = await fetch("/api/health", { signal: AbortSignal.timeout(4000) });
    if (!r.ok) throw new Error();
    const j = await r.json();
    state.live = true;
    $("#status").innerHTML =
      `<span class="dot live"></span>Live · SerpApi ${j.serpApi ? `${j.usage.left} searches left` : "key missing"}` +
      (j.llm ? ` · ${esc(j.llm)}` : " · rule-based");
  } catch {
    state.live = false;
    $("#status").innerHTML = `<span class="dot"></span>Sample mode · no backend connected`;
  }
}

/* ------------------------------------------------------------------ form */
function readForm() {
  return {
    origin: $("#origin").value.trim(),
    destination: $("#destination").value.trim(),
    days: Number($("#days").value) || 3,
    people: Number($("#people").value) || 2,
    budget: Number($("#budget").value) || 0,
    style: $("#style").value,
    startDate: $("#startDate").value || undefined,
    interests: $$('[data-group="interest"][aria-pressed="true"]').map((b) => b.dataset.value),
    transport: $$('[data-group="transport"][aria-pressed="true"]').map((b) => b.dataset.value),
  };
}

function fillForm(t) {
  $("#origin").value = t.origin || "";
  $("#destination").value = t.destination || "";
  $("#days").value = t.days;
  $("#people").value = t.people;
  $("#budget").value = t.budget || "";
  $("#style").value = t.style;
  $$("[data-group]").forEach((b) => {
    const on = (b.dataset.group === "interest" ? t.interests : t.transport)?.includes(b.dataset.value);
    b.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

$$("[data-group]").forEach((b) =>
  b.addEventListener("click", () => b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true"))
);

/* --------------------------------------------------------------- loading */
const STEPS = [
  "Locating the destination",
  "Searching places, stays and food",
  "Reading fares and rental prices",
  "Pulling the weather forecast",
  "Writing the day-by-day plan",
  "Costing it against your budget",
];

function showLoading() {
  $("#result").hidden = true;
  $("#loading").hidden = false;
  $("#loading").innerHTML = `<div class="wrap">${STEPS.map((s, i) => `<div class="step" data-i="${i}">${esc(s)}</div>`).join("")}</div>`;
  let i = 0;
  const tick = () => {
    const steps = $$("#loading .step");
    steps.forEach((el, k) => el.classList.toggle("done", k < i));
    steps.forEach((el, k) => el.classList.toggle("on", k === i));
    i = Math.min(i + 1, STEPS.length - 1);
  };
  tick();
  return setInterval(tick, state.live ? 2200 : 320);
}

/* ------------------------------------------------------------------ plan */
async function plan(trip) {
  state.asked = trip.destination;
  const timer = showLoading();
  try {
    let data;
    if (state.live) {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trip),
      });
      data = await res.json();
      if (data.error) throw new Error(data.error);
    } else {
      await new Promise((r) => setTimeout(r, 1800));
      data = { ...DEMO_PLAN, trip: DEMO_TRIP };
      trip = DEMO_TRIP;
      fillForm(DEMO_TRIP);
    }
    state.trip = trip;
    state.plan = data;
    state.budget = data.budget || computeBudget(trip, DEMO_RATE_OVERRIDES);
    render();
  } catch (e) {
    $("#loading").innerHTML = `<div class="wrap"><div class="notice bad">Couldn't build the plan: ${esc(e.message)}. Check the server log, then try again.</div></div>`;
    return;
  } finally {
    clearInterval(timer);
  }
  $("#loading").hidden = true;
  $("#result").hidden = false;
  $("#result").classList.add("reveal");
  $("#result").scrollIntoView({ behavior: "smooth", block: "start" });
}

$("#tripForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const trip = readForm();
  if (!trip.destination) return $("#destination").focus();
  plan(trip);
});

/* ---------------------------------------------------------------- render */
function render() {
  const p = state.plan, t = state.trip, b = state.budget;

  $("#headline").textContent = `${t.days} days in ${t.destination}, ${t.people === 1 ? "solo" : `for ${t.people}`}`;
  $("#summary").textContent = p.summary || "";
  if (!state.live) {
    const note = $("#demoNote");
    note.hidden = false;
    note.textContent = state.asked && state.asked.toLowerCase() !== t.destination.toLowerCase()
      ? `No backend connected, so “${state.asked}” can't be researched here — this is the built-in sample trip. Run the server with your SerpApi key to plan any destination live.`
      : "No backend connected, so this is the built-in sample trip. Run the server with your SerpApi key to plan any destination live.";
  }

  $("#meta").innerHTML = [
    ["From", t.origin || "—"],
    ["Dates", p.weather?.[0] ? `${dayName(p.weather[0].date)} → ${dayName(p.weather[p.weather.length - 1].date)}` : `${t.days} days`],
    ["Travellers", t.people],
    ["Style", STYLE_RATES[t.style]?.label || t.style],
    ["Getting around", (t.transport || []).join(", ") || "—"],
    ["Your budget", t.budget ? rupees(t.budget) : "open"],
    ["Planned total", rupees(b.total)],
  ].map(([k, v]) => `<li><span>${esc(k)}</span><span class="num">${esc(v)}</span></li>`).join("");

  // route
  $("#route").innerHTML = p.bestRoute
    ? `<h3>${esc(p.bestRoute.headline)}</h3><table><tbody>${(p.bestRoute.legs || [])
        .map((l) => `<tr><td style="width:90px">${esc(l.mode)}</td><td>${esc(l.detail)}</td><td class="num" style="white-space:nowrap">${esc(l.duration || "")}</td><td class="amt">${l.costPerPerson ? rupees(l.costPerPerson) + " pp" : "—"}</td></tr>`)
        .join("")}</tbody></table>`
    : "";

  // weather
  $("#weather").innerHTML = (p.weather || [])
    .map(
      (w) => `<div class="${w.wet ? "wet" : ""}"><div class="d">${esc(dayName(w.date))}</div><div class="c">${esc(w.condition)}</div>
      <div class="num">${w.tempMin}–${w.tempMax}°C</div><div class="r num">rain ${w.rainChance ?? 0}%</div></div>`
    )
    .join("");
  $("#weatherWrap").hidden = !(p.weather || []).length;

  // days
  $("#itineraryDays").innerHTML = (p.days || [])
    .map(
      (d) => `<article class="day">
      <div class="day-no num">${d.day}</div>
      <h3>${esc(d.title)}</h3>
      <div class="daymeta">${esc(dayName(d.date))}${d.weatherNote ? ` · <span class="${/rain|shower|storm/i.test(d.weatherNote) ? "wet" : ""}">${esc(d.weatherNote)}</span>` : ""}</div>
      ${(d.stops || [])
        .map(
          (s) => `<div class="stop">
          <div class="t num">${esc(s.time || "")}</div>
          <div><div class="name">${esc(s.name)}</div><div class="what">${esc(s.what || "")}</div>
          ${s.travelFromPrev ? `<div class="leg">${esc(s.travelFromPrev)}</div>` : ""}</div>
          <div class="fee num">${s.entryFee ? rupees(s.entryFee) : ""}</div>
        </div>`
        )
        .join("")}
      ${(d.meals || []).length ? `<div class="meals">${d.meals.map((m) => `<b>${esc(m.slot)}:</b> ${esc(m.name)}${m.dish ? ` — ${esc(m.dish)}` : ""} <span class="num">${m.cost ? "· " + rupees(m.cost) : ""}</span>`).join("<br>")}</div>` : ""}
      ${d.stay ? `<div class="stayline">Night ${d.day}: ${esc(d.stay.name)}${d.stay.area ? `, ${esc(d.stay.area)}` : ""}${d.stay.costPerNight ? ` · ${rupees(d.stay.costPerNight)}/room` : ""}</div>` : ""}
      ${d.restNote ? `<div class="stayline">${esc(d.restNote)}</div>` : ""}
    </article>`
    )
    .join("");

  // places
  $("#places").innerHTML = (p.places || [])
    .map(
      (pl) => `<article class="place">
      <div class="shot ${pl.image ? "" : "empty"}">${pl.image ? `<img src="${esc(pl.image)}" alt="${esc(pl.name)}" loading="lazy" onerror="this.parentNode.classList.add('empty');this.remove()">` : ""}</div>
      <h4>${esc(pl.name)}</h4>
      <div class="stat">${pl.rating ? `★ ${pl.rating}${pl.reviews ? ` · ${pl.reviews} reviews` : ""}` : ""}${pl.entryFee ? `${pl.rating ? " · " : ""}entry ${rupees(pl.entryFee)}` : ""}</div>
      <p>${esc(pl.description || "")}</p>
      <div class="kv">${pl.bestTime ? `<span>Best: ${esc(pl.bestTime)}</span>` : ""}${pl.timeNeeded ? `<span>Needs: ${esc(pl.timeNeeded)}</span>` : ""}
      ${(pl.nearby || []).length ? `<span>Nearby: ${esc(pl.nearby.join(", "))}</span>` : ""}
      <a href="https://www.google.com/maps/search/${encodeURIComponent(pl.name + " " + (t.destination || ""))}" target="_blank" rel="noopener">Map</a></div>
    </article>`
    )
    .join("");

  // transport + rentals
  $("#transport").innerHTML = (p.transportOptions || []).length
    ? `<table><thead><tr><th>Mode</th><th>Operator</th><th>Leg</th><th>Time</th><th class="amt">Cost</th></tr></thead><tbody>${p.transportOptions
        .map(
          (o) => `<tr><td>${esc(o.mode)}</td><td>${esc(o.provider)}<div class="what" style="font-size:.85rem;color:var(--ink-soft)">${esc(o.notes || "")}</div></td>
          <td>${esc(o.from || "")} → ${esc(o.to || "")}</td><td class="num">${esc(o.duration || "")}</td><td class="amt">${o.cost ? rupees(o.cost) : "—"}</td></tr>`
        )
        .join("")}</tbody></table>`
    : `<p class="sub">No transport results for this route yet.</p>`;

  $("#rentalsWrap").hidden = !(p.rentals || []).length;
  $("#rentals").innerHTML = (p.rentals || [])
    .map(
      (r) => `<tr><td>${esc(r.vehicle)}</td><td>${esc(r.provider)}</td><td>${esc(r.location || "")}</td><td>${esc(r.requirements || "")}</td><td class="amt">${rupees(r.perDay)}/day</td></tr>`
    )
    .join("");

  renderBudget();

  // packing / tips / emergency
  $("#packing").innerHTML = (p.packing || []).map((x) => `<li>${esc(x)}</li>`).join("");
  $("#tips").innerHTML = (p.tips || []).map((x) => `<li>${esc(x)}</li>`).join("");
  $("#emergency").innerHTML = (p.emergency || []).map((e) => `<li>${esc(e.label)} — <span class="num">${esc(e.number)}</span></li>`).join("");
  $("#sources").innerHTML = (p.sources || [])
    .map((s) => `<a href="${esc(s.link)}" target="_blank" rel="noopener">${esc(s.title)} · ${esc(s.source || "")}</a>`)
    .join("");
}

function renderBudget() {
  const b = state.budget, t = state.trip;
  $("#bill").innerHTML = `<tbody>${b.lines
    .map((l) => `<tr><td>${esc(l.label)}<div style="font-size:.82rem;color:var(--ink-soft)">${esc(l.basis)}</div></td><td class="amt">${rupees(l.amount)}</td></tr>`)
    .join("")}
    <tr class="total"><td>Total for ${t.people} ${t.people === 1 ? "person" : "people"}</td><td class="amt">${rupees(b.total)}</td></tr>
    <tr class="perhead"><td>Per person</td><td class="amt">${rupees(b.perPerson)}</td></tr>
    <tr class="perhead"><td>Per day</td><td class="amt">${rupees(b.perDay)}</td></tr></tbody>`;

  const v = $("#verdict");
  if (!t.budget) {
    v.className = "verdict";
    v.innerHTML = `No target budget set — this plan costs <b>${rupees(b.total)}</b>, or <b>${rupees(b.perPerson)}</b> each.`;
  } else if (b.withinBudget) {
    v.className = "verdict";
    v.innerHTML = `Fits your budget with <b>${rupees(t.budget - b.total)}</b> to spare. Per person: <b>${rupees(b.perPerson)}</b>.`;
  } else {
    v.className = "verdict over";
    v.innerHTML = `Over your ${rupees(t.budget)} budget by <b>${rupees(b.gap)}</b>. The cuts below close the gap.`;
  }

  $("#savings").innerHTML = savingIdeas(t, b)
    .map((s) => `<li><span>${esc(s.text)}</span><span class="amt">− ${rupees(s.saves)}</span></li>`)
    .join("");

  $("#classes").innerHTML = alternatives(t, state.plan?.rateOverrides || {})
    .map(
      (a) => `<div class="class" data-current="${a.current}">
      <h4>${esc(a.label)}${a.current ? " — your plan" : ""}</h4>
      <div class="big">${rupees(a.total)}</div>
      <div class="per">${rupees(a.perPerson)} per person</div>
      <p>${esc(a.note)}</p>
      ${a.current ? "" : `<button data-style="${a.style}">Switch to ${esc(a.label)}</button>`}
    </div>`
    )
    .join("");

  $$("#classes button").forEach((btn) =>
    btn.addEventListener("click", () => applyChange({ style: btn.dataset.style }, `Switched to the ${btn.dataset.style} plan`))
  );
}

/* --------------------------------------------------------------- what-if */
const ASKS = [
  { label: "One more person", change: (t) => ({ people: t.people + 1 }) },
  { label: "One fewer person", change: (t) => ({ people: Math.max(1, t.people - 1) }) },
  { label: "Stay two more days", change: (t) => ({ days: Math.min(14, t.days + 2) }) },
  { label: "Cut it to 3 days", change: () => ({ days: 3 }) },
  { label: "Budget drops ₹5,000", change: (t) => ({ budget: Math.max(0, (t.budget || 0) - 5000) }) },
  { label: "Rent bikes", change: (t) => ({ transport: [...new Set([...(t.transport || []), "bike"])] }) },
  { label: "Drop the bikes", change: (t) => ({ transport: (t.transport || []).filter((x) => x !== "bike") }) },
  { label: "Hire a car with driver", change: (t) => ({ transport: [...new Set([...(t.transport || []), "car"])] }) },
];

$("#asks").innerHTML = ASKS.map((a, i) => `<button class="ask" data-i="${i}">${esc(a.label)}</button>`).join("");
$$("#asks .ask").forEach((btn) =>
  btn.addEventListener("click", () => {
    const a = ASKS[btn.dataset.i];
    applyChange(a.change(state.trip), a.label);
  })
);

async function applyChange(change, label) {
  if (!state.trip) return;
  const before = state.budget.total;
  const trip = { ...state.trip, ...change };
  const out = $("#whatifOut");
  out.hidden = false;

  if (state.live) {
    out.textContent = "Recalculating…";
    try {
      const res = await fetch("/api/whatif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip: state.trip, change }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      state.trip = trip;
      state.plan = data;
      state.budget = data.budget;
      fillForm(trip);
      render();
    } catch (e) {
      out.innerHTML = `<span class="delta up">Couldn't recalculate: ${esc(e.message)}</span>`;
      return;
    }
  } else {
    state.trip = trip;
    state.budget = computeBudget(trip, DEMO_RATE_OVERRIDES);
    fillForm(trip);
    renderBudget();
  }

  const after = state.budget.total;
  const diff = after - before;
  out.innerHTML =
    `<b>${esc(label)}.</b> New total <span class="num">${rupees(after)}</span> ` +
    `<span class="delta ${diff > 0 ? "up" : "down"}">${diff === 0 ? "no change" : (diff > 0 ? "+" : "−") + rupees(Math.abs(diff))}</span>` +
    ` · ${rupees(state.budget.perPerson)} per person.` +
    (state.live ? "" : " Costs recalculated — connect the backend to rewrite the itinerary too.");
  out.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* ------------------------------------------------------------------- PDF */
$("#pdf").addEventListener("click", () => {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) return alert("PDF library didn't load. Check your connection and reload.");
  const p = state.plan, t = state.trip, b = state.budget;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = 595, M = 48;
  let y = 0;

  const line = (txt, { size = 10, bold = false, gap = 14, color = [22, 38, 31], indent = 0, maxW = W - M * 2 } = {}) => {
    doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(size).setTextColor(...color);
    const rows = doc.splitTextToSize(String(txt), maxW - indent);
    rows.forEach((r) => {
      if (y > 790) { doc.addPage(); y = M; }
      doc.text(r, M + indent, y);
      y += gap;
    });
  };
  const rule = (g = 10) => { if (y > 780) { doc.addPage(); y = M; } doc.setDrawColor(205, 212, 203).line(M, y, W - M, y); y += g; };
  const head = (txt) => { y += 10; line(txt, { size: 14, bold: true, gap: 18 }); rule(12); };

  // cover
  doc.setFillColor(28, 92, 73).rect(0, 0, W, 190, "F");
  doc.setTextColor(255).setFont("helvetica", "bold").setFontSize(26);
  doc.text(doc.splitTextToSize(`${t.days} days in ${t.destination}`, W - M * 2), M, 90);
  doc.setFontSize(11).setFont("helvetica", "normal");
  doc.text(`${t.origin ? t.origin + " → " : ""}${t.destination} · ${t.people} travellers · ${STYLE_RATES[t.style]?.label || t.style}`, M, 130);
  doc.text(`Total ${rupees(b.total)} · ${rupees(b.perPerson)} per person`, M, 150);
  y = 230;
  line(p.summary || "", { size: 11, gap: 16 });
  y += 6;
  if (p.bestRoute) { head("Getting there"); line(p.bestRoute.headline, { bold: true });
    (p.bestRoute.legs || []).forEach((l) => line(`${l.mode}: ${l.detail} (${l.duration}${l.costPerPerson ? ", " + rupees(l.costPerPerson) + " pp" : ""})`, { indent: 10 })); }

  // itinerary
  doc.addPage(); y = M;
  head("Day by day");
  (p.days || []).forEach((d) => {
    line(`Day ${d.day} — ${d.title}`, { size: 12, bold: true, gap: 16 });
    if (d.weatherNote) line(d.weatherNote, { size: 9, color: [74, 90, 82] });
    (d.stops || []).forEach((s) => {
      line(`${s.time || ""}  ${s.name}${s.entryFee ? "  (" + rupees(s.entryFee) + ")" : ""}`, { bold: true, indent: 10, gap: 13 });
      if (s.what) line(s.what, { size: 9, indent: 20, gap: 12, color: [74, 90, 82] });
      if (s.travelFromPrev) line(s.travelFromPrev, { size: 9, indent: 20, gap: 12, color: [44, 110, 155] });
    });
    (d.meals || []).forEach((m) => line(`${m.slot}: ${m.name}${m.dish ? " — " + m.dish : ""}${m.cost ? " · " + rupees(m.cost) : ""}`, { size: 9, indent: 10, gap: 12 }));
    if (d.stay) line(`Night: ${d.stay.name}${d.stay.costPerNight ? " · " + rupees(d.stay.costPerNight) + "/room" : ""}`, { size: 9, indent: 10, gap: 12 });
    y += 6; rule(12);
  });

  // places
  doc.addPage(); y = M;
  head("Places");
  (p.places || []).forEach((pl) => {
    line(pl.name, { bold: true, size: 11 });
    line(pl.description || "", { size: 9, color: [74, 90, 82] });
    line([pl.bestTime && `Best: ${pl.bestTime}`, pl.timeNeeded && `Time: ${pl.timeNeeded}`, pl.entryFee && `Entry: ${rupees(pl.entryFee)}`].filter(Boolean).join("   "), { size: 9, color: [44, 110, 155] });
    y += 4;
  });

  // transport + rentals
  head("Transport");
  (p.transportOptions || []).forEach((o) =>
    line(`${o.mode} · ${o.provider} · ${o.from} → ${o.to} · ${o.duration || ""} · ${o.cost ? rupees(o.cost) : "—"}${o.notes ? " — " + o.notes : ""}`, { size: 9, gap: 13 })
  );
  if ((p.rentals || []).length) {
    head("Rentals");
    p.rentals.forEach((r) => line(`${r.vehicle} · ${r.provider} · ${rupees(r.perDay)}/day · ${r.requirements || ""}`, { size: 9, gap: 13 }));
  }

  // budget
  doc.addPage(); y = M;
  head("Budget");
  b.lines.forEach((l) => {
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(22, 38, 31);
    if (y > 780) { doc.addPage(); y = M; }
    doc.text(l.label, M, y);
    doc.text(rupees(l.amount), W - M, y, { align: "right" });
    y += 12;
    doc.setFontSize(8).setTextColor(120, 130, 122).text(l.basis, M, y);
    y += 16;
  });
  rule(14);
  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(22, 38, 31);
  doc.text("Total", M, y); doc.text(rupees(b.total), W - M, y, { align: "right" }); y += 18;
  doc.setFontSize(10).setFont("helvetica", "normal");
  doc.text("Per person", M, y); doc.text(rupees(b.perPerson), W - M, y, { align: "right" }); y += 24;

  if ((p.packing || []).length) { head("Packing"); p.packing.forEach((x) => line("· " + x, { size: 9, gap: 13 })); }
  if ((p.tips || []).length) { head("Before you go"); p.tips.forEach((x) => line("· " + x, { size: 9, gap: 13 })); }
  if ((p.emergency || []).length) { head("Emergency"); p.emergency.forEach((e) => line(`${e.label} — ${e.number}`, { size: 9, gap: 13 })); }

  doc.save(`${t.destination.replace(/\s+/g, "-").toLowerCase()}-${t.days}-day-guide.pdf`);
});

$("#print").addEventListener("click", () => window.print());

/* ------------------------------------------------------------------ boot */
checkBackend();
$("#demo").addEventListener("click", () => { fillForm(DEMO_TRIP); plan(DEMO_TRIP); });