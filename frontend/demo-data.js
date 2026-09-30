/**
 * Sample plan shown when the page can't reach the backend (GitHub Pages,
 * a shared link, or before you've added your SerpApi key).
 * Prices and timings are illustrative; the live app fills this in from
 * SerpApi + Open-Meteo instead.
 */
export const DEMO_TRIP = {
  origin: "Kolkata",
  destination: "Meghalaya",
  days: 5,
  people: 3,
  budget: 25000,
  style: "budget",
  interests: ["nature", "waterfalls", "trekking"],
  transport: ["train", "bike"],
};

export const DEMO_RATE_OVERRIDES = {
  stayPerRoomNight: 1300,
  foodPerPersonDay: 400,
  intercityPerPerson: 1100,
  bikeRentPerDay: 700,
};

export const DEMO_PLAN = {
  summary:
    "Five days built around water: the falls at Sohra, the root bridges below them, and the clear river at Dawki. You ride in on the overnight train to Guwahati, take a shared Sumo up to Shillong, then run the whole plateau on rented bikes. The hardest day is the Nongriat descent, so it sits in the middle where legs are freshest and the forecast is driest.",
  bestRoute: {
    headline: "Overnight train to Guwahati, shared Sumo up the hill, bikes after that",
    legs: [
      { mode: "train", detail: "Kolkata (Sealdah/Howrah) → Guwahati, sleeper class, book 30+ days ahead", duration: "18–20 h", costPerPerson: 650 },
      { mode: "cab", detail: "Guwahati Paltan Bazar → Shillong, shared Sumo counters", duration: "3.5 h", costPerPerson: 450 },
      { mode: "bike", detail: "Rented 2 bikes in Shillong for the plateau legs", duration: "3 riding days", costPerPerson: 0 },
    ],
  },
  weather: [
    { date: "2026-10-12", condition: "Partly cloudy", tempMin: 17, tempMax: 25, rainChance: 25, wet: false },
    { date: "2026-10-13", condition: "Light rain", tempMin: 16, tempMax: 23, rainChance: 55, wet: false },
    { date: "2026-10-14", condition: "Mainly clear", tempMin: 16, tempMax: 26, rainChance: 15, wet: false },
    { date: "2026-10-15", condition: "Rain showers", tempMin: 18, tempMax: 27, rainChance: 70, wet: true },
    { date: "2026-10-16", condition: "Partly cloudy", tempMin: 17, tempMax: 26, rainChance: 30, wet: false },
  ],
  days: [
    {
      day: 1, date: "2026-10-12", title: "Guwahati to Shillong, easy first evening",
      weatherNote: "Partly cloudy, 17–25°C, rain chance 25%",
      stops: [
        { time: "07:30", name: "Arrive Guwahati", what: "Breakfast at the station, then walk to the Sumo counters at Paltan Bazar.", entryFee: 0, minutes: 60, travelFromPrev: "" },
        { time: "09:00", name: "Shared Sumo to Shillong", what: "NH6 climbs steadily; the last hour opens onto the plateau.", entryFee: 0, minutes: 210, travelFromPrev: "103 km · 3.5 h by shared Sumo" },
        { time: "13:00", name: "Umiam Lake (Barapani)", what: "Stop on the way in for the viewpoint over the reservoir. Kayaks and pedal boats at the water sports complex.", entryFee: 30, minutes: 60, travelFromPrev: "15 km before Shillong" },
        { time: "16:00", name: "Police Bazar", what: "Check in nearby, sort out bike rental for the next three days, walk the market in the evening.", entryFee: 0, minutes: 120, travelFromPrev: "17 km · 40 min" },
      ],
      meals: [
        { slot: "Lunch", name: "Roadside dhaba, Umiam", dish: "Rice, dal, pork curry", cost: 180 },
        { slot: "Dinner", name: "Police Bazar eateries", dish: "Jadoh and doh khleh", cost: 220 },
      ],
      stay: { name: "Homestay, Laitumkhrah", area: "10 min from Police Bazar", costPerNight: 1300 },
      restNote: "Short first day on purpose — you'll have slept on a train.",
    },
    {
      day: 2, date: "2026-10-13", title: "Ride to Sohra for the falls",
      weatherNote: "Light rain, 16–23°C, rain chance 55% — waterfalls run hard after rain",
      stops: [
        { time: "08:00", name: "Shillong → Sohra (Cherrapunji)", what: "The Shillong–Sohra road along the gorge is the best riding of the trip. Fuel up before leaving the city.", entryFee: 0, minutes: 90, travelFromPrev: "54 km · 1.5 h by bike" },
        { time: "10:00", name: "Nohkalikai Falls", what: "India's tallest plunge waterfall. Go early; cloud usually closes the view by noon.", entryFee: 30, minutes: 60, travelFromPrev: "5 km from Sohra market" },
        { time: "12:00", name: "Seven Sisters Falls (Nohsngithiang)", what: "Seven strands over the cliff edge, best right after rain.", entryFee: 20, minutes: 45, travelFromPrev: "8 km · 20 min" },
        { time: "14:30", name: "Mawsmai Cave", what: "Short lit limestone cave, tight in two places. Good rain backup.", entryFee: 50, minutes: 45, travelFromPrev: "3 km · 10 min" },
        { time: "16:00", name: "Arwah Cave and Eco Park", what: "Fossils in the cave walls; the park edge looks into the Bangladesh plains.", entryFee: 40, minutes: 75, travelFromPrev: "6 km · 15 min" },
      ],
      meals: [
        { slot: "Lunch", name: "Sohra market stalls", dish: "Jadoh with tungrymbai", cost: 160 },
        { slot: "Dinner", name: "Homestay kitchen, Sohra", dish: "Home-cooked Khasi thali", cost: 200 },
      ],
      stay: { name: "Homestay, Sohra", area: "Near Sohra market, 2 km from the falls road", costPerNight: 1300 },
      restNote: "Stay in Sohra tonight instead of riding back — saves 100 km and starts tomorrow's trek at dawn.",
    },
    {
      day: 3, date: "2026-10-14", title: "Double Decker Living Root Bridge, Nongriat",
      weatherNote: "Mainly clear, 16–26°C, rain chance 15% — the dry day, spent on the steps",
      stops: [
        { time: "06:30", name: "Tyrna village", what: "Park the bikes, pay the village entry, start down before the sun is on the steps.", entryFee: 50, minutes: 30, travelFromPrev: "12 km · 30 min from Sohra" },
        { time: "07:00", name: "Descent to Nongriat", what: "About 3,000 steps down and two steel suspension bridges. Two to three hours, slow and steady.", entryFee: 0, minutes: 180, travelFromPrev: "Steps only" },
        { time: "10:30", name: "Double Decker Root Bridge", what: "Two woven ficus spans stacked over the stream. Swim in the pool below if the water is low.", entryFee: 30, minutes: 120, travelFromPrev: "" },
        { time: "13:30", name: "Climb back to Tyrna", what: "The hard half. Budget three hours and carry two litres of water each.", entryFee: 0, minutes: 180, travelFromPrev: "" },
      ],
      meals: [
        { slot: "Breakfast", name: "Packed from the homestay", dish: "Eggs, bread, bananas", cost: 90 },
        { slot: "Lunch", name: "Nongriat tea shacks", dish: "Maggi, black tea, oranges", cost: 120 },
        { slot: "Dinner", name: "Sohra homestay", dish: "Rice, chicken curry", cost: 210 },
      ],
      stay: { name: "Homestay, Sohra", area: "Same room, second night", costPerNight: 1300 },
      restNote: "Nothing else today. Legs will be finished by 5 pm.",
    },
    {
      day: 4, date: "2026-10-15", title: "Dawki and Mawlynnong",
      weatherNote: "Rain showers, 18–27°C, rain chance 70% — boat ride moved to the early morning slot",
      stops: [
        { time: "07:00", name: "Sohra → Dawki", what: "Ride down off the plateau towards the border. Heat rises as you drop.", entryFee: 0, minutes: 150, travelFromPrev: "84 km · 2.5 h by bike" },
        { time: "09:30", name: "Umngot River, Dawki", what: "Boat ride on the clear river — ₹1,000 per boat for up to 6, so one boat covers the three of you. Clearest before the day's rain.", entryFee: 0, minutes: 90, travelFromPrev: "" },
        { time: "12:30", name: "Mawlynnong", what: "The 'cleanest village' — bamboo sky walk, orchid gardens, living root bridge at Riwai nearby.", entryFee: 50, minutes: 120, travelFromPrev: "26 km · 50 min" },
        { time: "16:00", name: "Ride to Shillong", what: "Long last leg. Leave by 4 pm so you're off the hill roads before dark.", entryFee: 0, minutes: 180, travelFromPrev: "78 km · 3 h" },
      ],
      meals: [
        { slot: "Lunch", name: "Dawki bazaar stalls", dish: "Fish curry, rice", cost: 190 },
        { slot: "Dinner", name: "Police Bazar, Shillong", dish: "Momos and thukpa", cost: 180 },
      ],
      stay: { name: "Homestay, Laitumkhrah", area: "Back where you started", costPerNight: 1300 },
      restNote: "Rain expected after midday — the boat ride is booked first thing for that reason.",
    },
    {
      day: 5, date: "2026-10-16", title: "Shillong morning, then the journey home",
      weatherNote: "Partly cloudy, 17–26°C, rain chance 30%",
      stops: [
        { time: "08:00", name: "Return the bikes", what: "Fuel them up, check for scratches, collect the deposit.", entryFee: 0, minutes: 45, travelFromPrev: "" },
        { time: "09:30", name: "Ward's Lake and Don Bosco Museum", what: "Easy walking morning. The museum's seven floors on north-east tribes are worth the two hours.", entryFee: 100, minutes: 150, travelFromPrev: "3 km · 15 min by cab" },
        { time: "13:00", name: "Shared Sumo to Guwahati", what: "Leave by 1 pm to make an evening train comfortably.", entryFee: 0, minutes: 210, travelFromPrev: "103 km · 3.5 h" },
        { time: "18:30", name: "Guwahati → Kolkata", what: "Overnight train back, arriving the next morning.", entryFee: 0, minutes: 0, travelFromPrev: "" },
      ],
      meals: [
        { slot: "Breakfast", name: "Laitumkhrah bakeries", dish: "Tea and pastries", cost: 100 },
        { slot: "Lunch", name: "Before departure", dish: "Rice plate", cost: 170 },
      ],
      stay: null,
      restNote: "Buy tea and Khasi honey at Police Bazar before leaving if you want something to carry back.",
    },
  ],
  places: [
    { name: "Nohkalikai Falls", description: "A single 340 m plunge into a green pool, the tallest of its kind in India. The viewpoint is paved and railed; the light is best between 9 and 11 am before cloud fills the gorge.", bestTime: "Morning, just after rain", timeNeeded: "1 hour", entryFee: 30, rating: 4.6, nearby: ["Mawsmai Cave", "Sohra market"] },
    { name: "Double Decker Living Root Bridge", description: "Two ficus-root spans grown over a stream at Nongriat, reached by roughly 3,000 steps down from Tyrna. The village at the bottom sells water, Maggi and a bed if you want to stay the night.", bestTime: "Start before 7 am", timeNeeded: "6–8 hours round trip", entryFee: 30, rating: 4.7, nearby: ["Rainbow Falls", "Tyrna village"] },
    { name: "Umngot River, Dawki", description: "In the dry season the water is clear enough to see the riverbed under the boats. One boat takes up to six people, so a group of three pays for a single boat between them.", bestTime: "November to March, early morning", timeNeeded: "2 hours", entryFee: 0, rating: 4.5, nearby: ["Mawlynnong", "Shnongpdeng"] },
    { name: "Mawlynnong", description: "A Khasi village known for how carefully it is kept, with a bamboo viewing tower over the plains and a smaller living root bridge at Riwai, ten minutes away.", bestTime: "Midday", timeNeeded: "2 hours", entryFee: 50, rating: 4.4, nearby: ["Riwai root bridge", "Dawki"] },
    { name: "Umiam Lake", description: "A reservoir on the road up from Guwahati, ringed by pine. Most people stop at the viewpoint for twenty minutes; the water sports complex is a longer stop if you want a kayak.", bestTime: "Late afternoon", timeNeeded: "1 hour", entryFee: 30, rating: 4.4, nearby: ["Shillong", "Nongpoh"] },
    { name: "Mawsmai Cave", description: "A short lit limestone passage near Sohra with two genuinely narrow squeezes. It works as a rain plan when the falls are socked in.", bestTime: "Any time", timeNeeded: "45 minutes", entryFee: 50, rating: 4.3, nearby: ["Seven Sisters Falls", "Eco Park"] },
  ],
  transportOptions: [
    { mode: "Train", provider: "IRCTC — Kanchanjunga / Saraighat Express", from: "Kolkata", to: "Guwahati", cost: 650, duration: "18–20 h", notes: "Sleeper class. Tatkal opens one day before at 11 am." },
    { mode: "Flight", provider: "Low-cost carriers", from: "Kolkata", to: "Guwahati", cost: 3200, duration: "1 h 10 m", notes: "Cheaper than the train only if you book 6+ weeks out." },
    { mode: "Shared Sumo", provider: "Counters at Paltan Bazar", from: "Guwahati", to: "Shillong", cost: 450, duration: "3.5 h", notes: "Leaves when full, roughly every 30 minutes until evening." },
    { mode: "Private cab", provider: "Guwahati airport taxi desks", from: "Guwahati", to: "Shillong", cost: 3000, duration: "3 h", notes: "Per car, splits three ways if you skip the Sumo." },
    { mode: "Bike rental", provider: "Rental counters, Police Bazar area", from: "Shillong", to: "Plateau circuit", cost: 700, duration: "Per bike per day", notes: "Deposit and original licence held. Fuel extra, roughly ₹400 per bike per day." },
  ],
  rentals: [
    { provider: "Police Bazar rental counters, Shillong", vehicle: "Scooter (Activa 110)", perDay: 600, location: "Shillong", requirements: "Original driving licence + ₹2,000 deposit" },
    { provider: "Police Bazar rental counters, Shillong", vehicle: "Motorcycle (Himalayan / Classic 350)", perDay: 1400, location: "Shillong", requirements: "Licence + ID proof + ₹5,000 deposit" },
    { provider: "Laitumkhrah operators", vehicle: "Geared bike (Pulsar 150)", perDay: 700, location: "Shillong", requirements: "Licence, helmet included, fuel extra" },
    { provider: "Sohra market operators", vehicle: "Scooter", perDay: 800, location: "Sohra (Cherrapunji)", requirements: "Fewer bikes available — book the night before" },
  ],
  packing: [
    "Rain shell — Meghalaya rains out of season too",
    "Shoes with grip for the Nongriat steps, not sandals",
    "Two litres of water per person for trek day",
    "Cash: card machines fail often outside Shillong",
    "Power bank — no charging on the descent",
    "Light warm layer for Shillong evenings (16°C)",
    "Original driving licence for the bike rental deposit",
    "Basic first aid, knee support if you have weak knees",
  ],
  tips: [
    "Book the Guwahati train at least a month ahead; the Kolkata–Guwahati route fills early.",
    "Shared Sumos are a third the price of a private cab and take the same road.",
    "Nongriat is a full day. Don't pair it with Dawki.",
    "Carry cash for village entry fees — most are ₹20–₹50 and nobody takes UPI reliably.",
    "Bike rentals keep your original licence until you return. Carry a photocopy for checkpoints.",
    "Dawki's river is clearest November to March; after heavy rain it runs muddy.",
    "Sunset is early in the north-east — plan to be off hill roads by 5.30 pm.",
  ],
  emergency: [
    { label: "National emergency", number: "112" },
    { label: "Ambulance", number: "108" },
    { label: "Meghalaya tourist helpline", number: "1363" },
    { label: "Shillong Civil Hospital", number: "0364-2224100" },
  ],
  stays: [
    { name: "Homestay, Laitumkhrah, Shillong", rating: 4.4, price: "₹1,200–1,500", address: "Laitumkhrah, Shillong" },
    { name: "Guesthouse near Police Bazar", rating: 4.1, price: "₹1,400–1,800", address: "Police Bazar, Shillong" },
    { name: "Homestay, Sohra market", rating: 4.5, price: "₹1,200–1,600", address: "Sohra (Cherrapunji)" },
    { name: "Village stay, Nongriat", rating: 4.6, price: "₹600–900", address: "Nongriat, below Tyrna" },
  ],
  sources: [
    { title: "Sample research result — connect the backend for live sources", link: "https://serpapi.com/search-api", source: "serpapi.com" },
  ],
  engine: "demo",
};
