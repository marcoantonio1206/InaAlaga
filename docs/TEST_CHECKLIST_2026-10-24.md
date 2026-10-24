# Test checklist — October 24, 2026 session

Covers everything changed in this session:

- Coordinator Planning polish and the new Overview (`e7b190d`).
- The shared header wrap in `AppBar.js`.
- Migrations 002–006 applied to the InaAlaga Supabase project.
- The Supabase CLI dev dependency (`e919840`).

Tick each box as you go. If a result differs, note the step and what you saw.

Part A runs locally in mock mode, so it never touches shared data. Parts B–D need the deployed site. All records you create must be clearly fictional.

---

## Part A — Local, mock mode

### A0. Automated checks

From `web/`:

- [ ] `npm test` → `pass 56`, `fail 0`
- [ ] `npm run lint` → 0 errors (1 existing AppBar `<img>` warning is expected)
- [ ] `NEXT_PUBLIC_DATA_SOURCE=mock npm run dev` starts at http://localhost:3000

Afterwards, reset the sample data at `/demonstration/settings`.

### A1. Plain-language summary (`/coordinator`)

These results are for the default settings: 8 per day, 1 worker, 30 min, ×1, 12–48 h.

- [ ] The bars read A 46.0%, B 82.1%, C 89.4%, D 42.1%.
- [ ] "What this shows" reads "Faster handoff increased on-time contact by 36.1 percentage points on average."
- [ ] It continues "Deadline ordering added another 7.3 percentage points on average. It was lower than faster handoff alone in 8% of runs."
- [ ] The percentage-point explanation appears and ends with "No approach is best in every scenario…".
- [ ] The second card is titled "Changes between approaches", not "Paired differences".

### A2. Worse results shown honestly

Keep the reference delay at 12–48 h and change only the listed settings.

| Settings | Expected C vs B label | Expected summary wording | ✓ |
| --- | --- | --- | --- |
| 8 · 1 · 60 min · ×2 | ⚠ Lower on average | "lowered on-time contact by 1.6 percentage points… lower than faster handoff alone in 74% of runs" | [ ] |
| 8 · 1 · 60 min · ×1 | ⚠ Lower on average | "lowered… by 0.4 percentage points… in 52% of runs" | [ ] |
| 4 · 1 · 15 min · ×1 | Little difference | "made little difference on average (+0.1 points)" | [ ] |
| 4 · 2 · 15 min · ×0.5 | Same result in every run | "gave the same result as faster handoff alone in every run" | [ ] |

- [ ] Every label shows an icon as well as colour.
- [ ] Each comparison row shows its average, its range and "lower in N% of runs".
- [ ] No wording calls any approach "best".

### A3. Assumptions

- [ ] The list includes "8 new cases per day across all five pilot barangays combined".
- [ ] It includes "1 worker at each of the two stations".
- [ ] It includes "Faster handoff (B, C): 0–6 hours…".
- [ ] It includes "Follow-up targets: 24, 48 or 72 hours…".
- [ ] It includes "…(straight-line estimates, not measured journeys)".
- [ ] Changing a setting updates the matching assumption line.
- [ ] "How the simulation works" expands to four paragraphs.
- [ ] The top banner says the results are precomputed synthetic results, independent of mothers entered in the app.

### A4. Overview (`/coordinator/overview`)

Start from freshly reset data.

- [ ] Unassigned shows 1: Carmela Tolentino, "Outside covered area · no coordinating station".
- [ ] Awaiting acceptance shows 5.
- [ ] Visits awaiting an update shows None.
- [ ] Open contact requests shows None.
- [ ] Clicking a mother opens a read-only panel with no Accept, Schedule or Assign buttons, and the URL ends in `?case=IA-…`.
- [ ] Refresh shows "Refreshing…" while it loads.

Keep the Overview open in a second tab. Each change below should appear within about 5 seconds, without reloading.

| Action in another tab | Expected on Overview | ✓ |
| --- | --- | --- |
| `/hospital/patients` → Carmela → assign Bea | Carmela moves from Unassigned to Awaiting acceptance | [ ] |
| `/bhw` as Ana → Maria (IA-0042) → Accept | Maria leaves Awaiting acceptance | [ ] |
| Ana schedules Maria's visit 1–2 minutes from now; wait until that time passes | Maria appears under Visits awaiting an update | [ ] |
| Ana records the outcome, or uses "Arranged with mother" | Maria leaves that group | [ ] |
| Open `/m/mQ7vX2rLp9TzK4dWb8NcYs` → "Please contact me" | Maria appears under Open contact requests | [ ] |
| Ana acknowledges the request | Maria leaves Open contact requests | [ ] |

- [ ] The Planning numbers stayed the same after all of the above.

### A5. Evidence (Planning → "More evidence for this scenario")

- [ ] Default scenario: B shows 0.0% never served and 52.3% worker utilization.
- [ ] 8 · 1 · 60 · ×2: B shows 21.7% never served and 81.5% worker utilization.
- [ ] The comparison table has five rows (B vs A, C vs B, C vs A, D vs A, C vs D), each with "Runs lower" and "Runs tied".
- [ ] The footer shows `d8_w1_s30_t1_h12-48 · model 1.0.0 · results factorial_v1`.
- [ ] "Download all 162 scenarios (CSV)" saves the file.

### A6. Consistency

- [ ] The coordinator header has no bell.
- [ ] The "Demonstration" link opens `/demonstration/settings`.
- [ ] The Planning and Overview tabs highlight the current page.
- [ ] Reset scenario is greyed out at the defaults.
- [ ] After changing a setting, Reset scenario restores all five defaults.
- [ ] In DevTools → Network, `scenario_summary.csv` loads once on Planning and is not re-fetched every 5 seconds.
- [ ] At 360–390 px the coordinator header wraps to two rows with nothing cut off.
- [ ] At 360–390 px the selects stack.
- [ ] At 360–390 px the evidence tables scroll sideways inside their card.
- [ ] At 1280 px, the `/hospital/patients` and `/bhw` headers look unchanged (shared `AppBar` edit).

---

## Part B — Deployment

- [ ] The project owner has run `deploy.ps1`, or `main` (`e919840`) has been pushed to the `deploy` remote.
- [ ] https://inaalaga.vercel.app/coordinator/overview loads (it returned 404 before deployment).
- [ ] https://inaalaga.vercel.app/coordinator shows the "Precomputed synthetic simulation results" banner, not "Planning view · simulation results".

---

## Part C — Live Supabase, one check per migration

These records persist in the shared database. Use obviously fictional names.

| Migration | Action on inaalaga.vercel.app | Expected | ✓ |
| --- | --- | --- | --- |
| 002 visit destination | `/bhw` → an accepted case → schedule a station check-up | Saves; the mother's Stations button opens that station | [ ] |
| 003 exact-start rule | Schedule the same mother again at the identical time | Rejected: "A visit is already scheduled for this mother at that time" | [ ] |
| 004 facilitator assignment | `/hospital/patients` → Carmela (IA-0047) → assign a BHW | Becomes Awaiting acceptance with the named worker | [ ] |
| 004 acceptance | That BHW accepts the case; the other station's worker cannot | Accepted with worker name and time | [ ] |
| 005 default worker | Record a new discharge in a mapped barangay | Profile shows the named worker · Awaiting acceptance | [ ] |
| 005 backfill | Open IA-0043 to IA-0046 | IA-0043 shows Ana; IA-0044, IA-0045 and IA-0046 show Bea | [ ] |
| 006 arranged | As the accepted BHW on an overdue case → "Arranged with mother" | Overdue warning clears; the visit stays open | [ ] |

- [ ] `/coordinator/overview` reflects the records above within about 5 seconds.
- [ ] Opening a record from the Overview shows its saved history.

---

## Part D — Final four-perspective walkthrough

One fictional mother, end to end on the live site:

- [ ] Hospital records the discharge, and the mother link is issued.
- [ ] She appears in the correct station's BHW inbox; the other station cannot accept her.
- [ ] The BHW accepts and schedules a future visit.
- [ ] The mother link shows the visit; "Please contact me" saves.
- [ ] The BHW acknowledges the request, then records a contact attempt.
- [ ] The hospital list and profile show the updates without a reload.
- [ ] The coordinator Overview shows and then clears each item as it is resolved.
- [ ] Coordinator Planning is unchanged throughout.

---

## Already verified in this session (for reference)

- 56/56 tests passed; lint had no errors; the production build passed in both mock and Supabase modes.
- Screenshots in mock mode confirmed Planning at 1280 px and 390 px, the Overview, and the read-only drill-down.
- A read-only check after applying the migrations found every column, constraint, index, function, trigger and event type from 002–006 present, and the 005 default workers set.
- The local Supabase-mode server read all 6 cases through the API routes.
- Not yet verified: the expanded evidence panel in a browser; the Overview's visit and request groups with real entries (covered by unit tests only); the deployed site.
