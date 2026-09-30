# AI Travel Intelligence — Plan a Trip You Can Actually Execute

> Tell it where you want to go, your budget, dates, group size and how you like to travel. It researches the place live, prices the whole trip line by line, and hands you a day-by-day plan plus a PDF to carry on the road.

**AI Travel Intelligence** is an AI-powered trip planner built for Indian domestic travel — think Kolkata → Sikkim or Meghalaya on a fixed student-group budget. Instead of dumping search results, it combines live web research, real weather and road data, a deterministic cost engine and an LLM itinerary writer into one workflow.

Built entirely on **free tiers**. No paid API anywhere in the stack.

🔗 **Live Demo:** [add link]()
🎥 **Demo Video:** [add link]()
📦 **Project:** [add link]()

---

## ✨ What It Does

You give it:

- Origin and destination
- Number of days and travellers
- Total group budget (₹)
- Travel style — budget / balanced / premium
- Interests — food, nature, culture, adventure, etc.
- How you want to move — train, bus, flight, bike, car
- Optional start date

It then:

- 🔎 **Researches live** — places, stays, restaurants, fares, rentals and photos through SerpApi
- 🌦️ **Checks the weather** for your exact dates (Open-Meteo)
- 🗺️ **Geocodes and routes** — coordinates plus road distance and driving time (Nominatim + OSRM)
- 🧠 **Writes the itinerary** — an LLM turns the research into a practical day-by-day plan
- 💰 **Prices everything** — a deterministic cost engine builds the budget line by line
- 🔀 **Answers "What if?"** — change budget, days, headcount or transport and the trip is re-planned instantly
- 📄 **Exports a PDF travel guide** you can carry offline

---

## 🧩 Core Idea

```
Research → Understand → Cost → Plan → What-If → PDF
```

The LLM writes the story. It does **not** do arithmetic. All numbers come from one shared cost engine, so the itinerary, budget table, what-if answers and PDF can never disagree with each other.

---

## 🏗️ Architecture

```
                    ┌─────────────────────────┐
                    │   Frontend (Vanilla JS) │
                    │  HTML · CSS · ES Modules│
                    └────────────┬────────────┘
                                 │  REST
                                 ▼
                    ┌─────────────────────────┐
                    │   Express API (Node 18+)│
                    │  /plan /whatif /budget  │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │         Planner         │
                    │ research → weather →    │
                    │ synthesis → plan        │
                    └────────────┬────────────┘
                                 │
        ┌────────────┬───────────┼────────────┬────────────┐
        ▼            ▼           ▼            ▼            ▼
   ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐
   │ SerpApi │ │Open-Meteo│ │Nominatim│ │   OSRM   │ │ Groq /   │
   │ research│ │ weather  │ │ geocode │ │  routes  │ │ Gemini   │
   └────┬────┘ └──────────┘ └─────────┘ └──────────┘ └──────────┘
        │
        ▼
   ┌───────────────────┐      ┌────────────────────────┐
   │ Disk cache (72 h) │      │      Cost Engine       │
   │ + monthly meter   │      │ (shared, deterministic)│
   └───────────────────┘      └────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Tools |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript (ES modules), jsPDF |
| Backend | Node.js 18+, Express |
| Research | SerpApi (Google Local, Google Search, Google Images) |
| Weather | Open-Meteo |
| Geocoding | OpenStreetMap Nominatim |
| Routing | OSRM |
| LLM | Groq or Google AI Studio (Gemini Flash) — optional |
| Config | dotenv |

---

## 🆓 The API Stack (All Free)

| Job | Service | Free tier | Key needed |
|---|---|---|---|
| Research: places, stays, food, fares, rentals, photos | **SerpApi** | 250 successful searches/month, 50/hour | Yes |
| Weather forecast | **Open-Meteo** | Unlimited non-commercial | No |
| Geocoding | **OpenStreetMap Nominatim** | Free, 1 req/sec, needs a User-Agent | No |
| Road distance and driving time | **OSRM demo server** | Free | No |
| Writing the itinerary | **Groq** or **Google AI Studio** | Rate-limited, no card | Optional |
| PDF guide | **jsPDF** | Open source, runs in the browser | No |

Only SerpApi is required. Without an LLM key the app still works — it falls back to a **rule-based itinerary** built straight from the search results.

---

## 🔍 How SerpApi Is Used

SerpApi is the research engine, not a decorative search box. Six searches per new destination cover the whole brief:

| # | Engine | Query shape | Fills |
|---|---|---|---|
| 1 | `google` + `tbm=lcl` | Top attractions + your interests | Places, ratings, addresses, coordinates, hours |
| 2 | `google` + `tbm=lcl` | Hotels and homestays for your style | Where to stay, price bands |
| 3 | `google` + `tbm=lcl` | Best restaurants and local food | Meals for each day |
| 4 | `google` | Origin to destination train / bus / flight fare | How to reach, real fares |
| 5 | `google` | Bike / scooter rental prices, or permits and tips | Rentals, requirements |
| 6 | `google_images` | Destination tourist places | Photos for the page and the PDF |

The results are handed to the LLM as the **only allowed source** of business names, with instructions never to invent one.

### 🛡️ Protecting the 250 Free Searches

- **Disk cache** — every SerpApi response is cached in `.cache/` for 72 hours. Repeating a plan costs **zero** searches.
- **Per-plan cap** — a plan is limited to 6 searches (`SERPAPI_CALLS_PER_PLAN`).
- **Monthly meter** — `SERPAPI_MONTHLY_BUDGET` (default 200) refuses new searches before the real limit is hit, and resets each calendar month.
- **What-if is free** — every what-if question reuses cached research.
- **Health endpoint** — `GET /api/health` reports how many searches are left.

That works out to roughly 33 fresh destinations a month, with unlimited re-planning of each.

---

## 💰 How the Numbers Work

The cost engine multiplies per-style rates (budget / mid-range / premium) by your group size, nights, riding days and room occupancy, then adds an 8% buffer.

```
Total Budget
    │
    ├── Stay          (rooms × nights)
    ├── Food          (people × days)
    ├── Local transport
    ├── Activities
    ├── Bike / car rental
    ├── Intercity travel
    └── 8% buffer
```

Where research finds a real price — say a ₹1,300 homestay or a ₹700 scooter — the LLM returns it as a `rateOverride` and it replaces the assumption. The plan also shows **"Same trip, three ways"** (three fare classes side by side) and **"Where you can cut"** saving ideas.

---

## 🔀 What-If Simulator

Ask questions like:

- What if we cut the budget by ₹5,000?
- What if two more friends join?
- What if we go for 2 fewer days?
- What if we take the train instead of a flight?

The trip is rebuilt with one field changed, and the totals are diffed against the original — using cached research, so it costs **0 searches**.

---

## 🧪 Sample Mode

Open the app without any API key and it runs in **sample mode** with a built-in Meghalaya trip, so you can see the full output before signing up for anything.

---

## 📁 Project Structure

```
ai-travel-intelligence/
│
├── backend/
│   ├── index.js              Express app + route wiring
│   ├── config.js             Env, quotas, provider choice
│   ├── cache.js              Disk cache + SerpApi monthly meter
│   ├── models/
│   │   └── tripRequest.js    Request shape + normalization
│   ├── routes/
│   │   ├── health.js
│   │   ├── plan.js
│   │   ├── whatif.js
│   │   └── budget.js
│   └── services/
│       ├── serpapi.js        searchLocal / searchWeb / searchImages
│       ├── world.js          Nominatim, Open-Meteo, OSRM
│       ├── llm.js            Groq + Gemini, JSON mode
│       ├── planner.js        research → weather → synthesis → plan
│       └── budget.js         Re-exports the shared cost engine
│
├── frontend/
│   ├── index.html            Page
│   ├── styles.css            Design tokens and layout
│   ├── app.js                Form, rendering, what-if, PDF
│   ├── cost.js               Cost engine (shared with the server)
│   └── demo-data.js          Sample trip for offline mode
│
├── DESIGN.md                 Design notes
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/mrrohan4321/ai-travel-intelligence.git
cd ai-travel-intelligence
```

### 2. Install dependencies

```bash
npm install
```

Requires **Node.js 18 or newer** (uses the built-in `fetch`).

### 3. Configure environment variables

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Open `.env` and add your keys:

```env
SERPAPI_KEY=your_serpapi_key
GROQ_API_KEY=your_groq_key        # optional
```

Get a free SerpApi key at [serpapi.com](https://serpapi.com/users/sign_up) and a free Groq key at [console.groq.com](https://console.groq.com/keys).

> ⚠️ Never commit your real `.env` file or API keys to GitHub.

### 4. Start the app

```bash
npm start
```

Open **http://localhost:3000**.

For auto-reload during development:

```bash
npm run dev
```

---

## ⚙️ Configuration

| Variable | Default | Purpose |
|---|---|---|
| `SERPAPI_KEY` | — | Required for live research |
| `SERPAPI_MONTHLY_BUDGET` | `200` | Safety ceiling on monthly searches |
| `SERPAPI_CALLS_PER_PLAN` | `6` | Max searches per new plan |
| `SERPAPI_COUNTRY` / `SERPAPI_LANGUAGE` | `in` / `en` | Search locale |
| `LLM_PROVIDER` | `groq` | `groq`, `gemini` or none |
| `GROQ_API_KEY` / `GROQ_MODEL` | — | Groq settings |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | — | Gemini settings |
| `CACHE_DIR` | `.cache` | Where research is cached |
| `CACHE_TTL_HOURS` | `72` | Cache lifetime |
| `PORT` | `3000` | Server port |
| `APP_USER_AGENT` | — | Identifies your app to Nominatim |

---

## 🔌 API

| Route | Does |
|---|---|
| `GET /api/health` | Key status, LLM provider, searches left |
| `POST /api/plan` | Full plan. Body: `{origin, destination, days, people, budget, style, interests[], transport[], startDate}` |
| `POST /api/whatif` | `{trip, change}` → re-planned trip, 0 searches |
| `POST /api/budget` | Costing only, no network calls |

**Example request**

```bash
curl -X POST http://localhost:3000/api/plan \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "Kolkata",
    "destination": "Meghalaya",
    "days": 5,
    "people": 4,
    "budget": 40000,
    "style": "budget",
    "interests": ["nature", "food"],
    "transport": ["train", "bike"]
  }'
```

---

## ☁️ Deployment

Any free Node host works — Render, Railway, Fly, Koyeb.

- Set the env vars from `.env.example` in the host dashboard
- Build command: `npm install`
- Start command: `npm start`
- Keep `CACHE_DIR` on a persistent disk if the host offers one; otherwise the cache resets on redeploy and costs you searches

**Never put the SerpApi key in frontend code.** All calls go through the server for exactly that reason.

---

## 🎨 Design

The interface borrows from Indian railway reservation slips and fare charts — the hero *is* the form (a trip slip), results run as one vertical day-rail, and the budget renders as a bill with a rule above the total. Colours are mist and pine rather than the usual warm-cream default. See [DESIGN.md](DESIGN.md) for the full notes.

---

## 🔐 Security

- API keys are loaded from environment variables only
- `.env`, `.cache/`, `node_modules/`, `dist/` and logs are excluded through `.gitignore`
- All third-party API calls go through the server, never the browser

---

## 🗺️ Roadmap

- Store plans so a trip has a shareable URL
- A real map with Leaflet + OpenStreetMap tiles (place coordinates already come back from SerpApi)
- Train availability lookup through a SerpApi search on the train number
- Inline stop editing with instant re-pricing

---

## 🏆 Hackathon

Built for a SerpApi-sponsored hackathon. The project focuses on:

- Meaningful, budget-protected SerpApi usage
- Free-tier-only architecture
- Deterministic costing alongside LLM planning
- What-if trip simulation
- Practical, executable output

---

## 👤 Author

**Rohan**

GitHub: [github.com/mrrohan4321](https://github.com/mrrohan4321)

---

## 📄 License

This project is provided for hackathon and project demonstration purposes.