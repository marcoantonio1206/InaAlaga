# Progress report — October 22, 2026

Branch `coordinator-planning`, stacked on `mother-access-links`, both based on `main` @ `1944140`. Nothing is pushed or merged. Today's commits: 47 files changed, 2,043 insertions, 62 deletions.

| Commit | Branch | Summary |
| --- | --- | --- |
| `dec01e2` | mother-access-links | Replace case-ID mother URLs with private expiring links |
| `6b373a0` | mother-access-links | Add repository knowledge base and mother access report |
| `2b8b12a` | coordinator-planning | Add coordinator planning view over v1 simulation results (superseded) |
| `467d89d` | coordinator-planning | Rebuild planning view over the factorial scenario summary |

Merge order: `mother-access-links` first, then `coordinator-planning`.

## 1. Repository onboarding

A full inspection of the repository is recorded in `docs/architecture/` (overview, map, data flow, data model, development guide, security, known issues, inspection status). Main findings at the start of the day:

- The web app is a client-only Next.js prototype on an in-browser mock data layer; no server, database, authentication or scope enforcement exists.
- `npm run lint` failed and `npm ci` fails on lockfile drift.
- Mother links were guessable case IDs (`/m/ia-0042`), contrary to PRD M01.
- The simulation is complete and reproducible on LF checkouts; Windows CRLF checkouts break its recorded hashes.

## 2. Mother access links (PRD M01, Figma "Your follow-up link")

The PRD and the Figma notes rule out a mother login or registration system ("No OTP or production account flow is introduced"), so access follows their design:

- Saving a hospital discharge issues the mother's private link (random, 14-day expiry). This is her "registration".
- She opens it from a simulated SMS inbox (`/inbox/[token]`). This is her "sign-in".
- Case IDs, unknown tokens and expired tokens show "This link can't be used" with no case details.
- Loading and read-failure screens follow the Figma frames; the hospital save step and patient profile show the link.
- Also fixed: the lint error in `caseContext.js`, and saves from two open tabs overwriting each other.

Details and 12 screenshots: [mother access report](../2026-10-22-mother-access/REPORT.md).

## 3. Coordinator planning view (PRD D01–D02)

`/coordinator`, with its own app bar ("City coordinator · Planning view · simulation results") and the hospital layout's 900 px content width.

The first version (`2b8b12a`) read the 30-scenario v1 results. It was replaced the same day (`467d89d`) by the requested design over the 162-setting factorial study:

- Data: `web/public/scenario_summary.csv` (copied from `simulation/results/factorial_v1/`), fetched by `getScenarioSummary()` in the data layer and parsed by a ~40-line CSV reader, no library.
- Five selects (demand, workers, service, travel, reference delay); defaults 8 / 1 / 30 / ×1 / 12–48 h.
- On-time share for policies A–D as plain div bars; B vs A and C vs B with replication ranges; "Deadline ordering adds little in this setting." when C−B ≤ 0.5 pp.
- Assumptions card with the five selected values and the fixed settings; the replication-spread footer.
- Loading, failed-with-Retry and "No matching scenario" states.
- Simulation results are read outside the mock/Supabase switch so they never mix with demo records.

| Screenshot | Shows |
| --- | --- |
| [01-planning-default.jpg](screenshots/01-planning-default.jpg) | Default scenario: A 46.0%, B 82.1%, C 89.4%, D 42.1%; B vs A +36.1 pp, C vs B +7.3 pp |
| [02-planning-default-assumptions.jpg](screenshots/02-planning-default-assumptions.jpg) | Same scenario scrolled: full assumptions list and footer |
| [03-planning-12-per-day-60-min-adds-little.jpg](screenshots/03-planning-12-per-day-60-min-adds-little.jpg) | 12/day, 60-min service: C vs B −0.8 pp, "adds little" sentence shown |
| [04-planning-12-per-day-2-workers.jpg](screenshots/04-planning-12-per-day-2-workers.jpg) | 12/day, 2 workers: B 97.2%, C 98.6%; C vs B +1.4 pp |

All displayed values were checked against the CSV.

## 4. Verification on the final commit (`467d89d`)

| Check | Result |
| --- | --- |
| `npm test` (web, Node built-in runner, no new dependencies) | 20 passed, 0 failed |
| `python -m unittest discover -s tests` | 21 passed |
| `npm run lint` | Passed, 0 problems |
| `npm run build` | Passed; `/coordinator` and `/inbox/[token]` built |
| Browser walkthroughs | Mother flow, expired and case-ID rejections, hospital save → new mother link; planning defaults and two other settings |

Web tests cover mother-link rules (case IDs, expiry, issuing, duplicates, two-tab saves, reset) and planning (CSV parsing, all 162 selector combinations matching exactly one row, the 0.5 pp rule, formatting). Lint and build ran in a scratch copy with dependencies installed, because `npm ci` fails on the existing lockfile drift.

Not verified: the loading skeleton and load-failure screens visually (they appear too briefly, or the mock never fails); planning view below desktop width (the PRD targets 1280 px for coordinator views).

## 5. Open items

Highest priority first.

1. **Lockfile:** `npm ci` fails. Regenerate and commit `web/package-lock.json` so installs and deploys are reproducible.
2. **No server-side enforcement:** mother links, station scope and worker identity are checked only in the browser. Do not use real data until PRD §8 route handlers exist.
3. **Planning assumptions card** omits two settings that drive B and C's advantage: the 0–6 h faster handoff and the 24/48/72 h targets. Awaiting a decision on adding them.
4. **Still missing from the PRD's P0 list:** the coordinator operations view over saved demo events, and the pilot map or schematic (D03).
5. **Known mother-view issues** (pre-existing): "Overdue" derives from the visit time rather than the follow-up target; language resets to Filipino on every full page load; Home, Visits and Stations not yet redesigned to the Figma three-tab layout.
6. **Filipino copy** for the new mother access strings is a draft for team review.
7. **Line endings:** add a `.gitattributes` so Windows checkouts keep the simulation's recorded hashes valid.
8. `web/public/travel_matrix.csv` is copied but not yet used by any page.
