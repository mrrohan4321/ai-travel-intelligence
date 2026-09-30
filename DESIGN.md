# Design notes

**Subject.** A trip planner for Indian domestic travel, where the currency of the
decision is rupees and the output has to survive contact with an actual bus stand.
Audience: friend groups and students planning Kolkata → Sikkim / Meghalaya type
trips on a fixed budget. The job of the page: turn one line of intent into a plan
someone can execute.

**Vernacular.** Railway reservation slips, fare charts, milestone stones on hill
roads, hand-drawn trek maps. The interface borrows the *slip* (a form you fill and
tear off) and the *chart* (a costed ledger you can argue with).

**Colour** — mist and pine, not the warm-cream/terracotta default:
- `#EFF1EC` mist (paper)
- `#16261F` pine ink (text)
- `#1C5C49` pine (primary, actions, route line)
- `#2C6E9B` river (transport, distances)
- `#D99A2B` marigold (money, totals)
- `#9C3A22` rust (over budget, rain warnings) — used sparingly

**Type.** Bricolage Grotesque for headings, controls and all numerals (tabular);
Newsreader for reading text. Two clearly distinct families, one voice each: the
grotesque handles data, the serif handles description.

**Layout.** The hero *is* the form — a trip slip, because the product's first act
is taking an order. Results run as one vertical rail: the day sequence is a real
sequence, so day markers are numbered; nothing else is. Budget renders as a bill
with a rule above the total. Alternatives are three fare classes side by side.

**Restraint.** One bold element: the day rail with its route line and markers.
Everything else is quiet — hairline separators, no card shadows, no gradient
washes, one entrance animation when a plan first appears.
