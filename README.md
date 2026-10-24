# InaAlaga

**Smart postnatal follow-up: every discharged mother gets a named owner and a deadline.**
Team BAIthropic · University of the Philippines Los Baños · Philippine Junior Data Science Challenge 2026

Live demo: **https://inaalaga.vercel.app** · All data in the demo is fictional.

| Role | Link | What it does |
| --- | --- | --- |
| Hospital staff | [/hospital/patients](https://inaalaga.vercel.app/hospital/patients) | Records a discharge and routes the mother to her home barangay station |
| Barangay health worker | [/bhw](https://inaalaga.vercel.app/bhw) | Accepts responsibility, schedules the home visit, records the outcome; switch between Ana (Tanza) and Bea (Linao West) |
| Mother | [/m/mQ7vX2rLp9TzK4dWb8NcYs](https://inaalaga.vercel.app/m/mQ7vX2rLp9TzK4dWb8NcYs) | Private link (simulated SMS) showing her follow-up status, with a "Please contact me" button; Filipino and English |
| City coordinator | [/coordinator](https://inaalaga.vercel.app/coordinator) | Simulation results: which scheduling policy gets more mothers contacted on time with the same workers |

## The problem

In the Philippines, 93.7% of births now happen in a health facility, but the share of mothers checked within two days barely moved between 2022 and 2025 (75.4% to 76.6%) (PSA, 2026). In Cagayan Valley, facility delivery is 94.7% and timely postnatal checks fell from 79.9% to 61.2%. Using the 2022 NDHS microdata we found that the published indicator mostly measures checks done *before* discharge: **44% of facility-born mothers nationally had no post-discharge check at all within two months**, and only about one in five had one within 48 hours of discharge. Our hypothesis is a handoff failure: once a mother leaves the facility, nobody owns her follow-up.

## What we built

1. **A handoff workflow** (this app). Discharge is recorded once at the facility, routed to the mother's home barangay station, accepted by a named worker, scheduled, and closed only when a visit outcome is saved. Acceptance, scheduling, contact attempts and visit completion are separate saved events, so nothing is assumed done.
2. **A capacity simulation** (`simulation/`). A discrete-event model of the first home follow-up: synthetic discharges across five Tuguegarao barangays, two stations, worker shifts, travel and service time. Four policies are compared on identical cases: A reference workflow, B faster handoff, C faster handoff with earliest-deadline-first ordering, D reference delay with deadline ordering. 162 configurations × 100 paired replications. Headline: a fast handoff with a named owner is what raises on-time contact; deadline ordering adds a little in most settings and nothing when workers are saturated.
3. **A tested negative result.** The proposal planned a logistic-regression risk score from NDHS microdata. We fit it (survey-weighted, PSU-grouped cross-validation, n = 2,542 facility births): AUC 0.65 overall, 0.54 once region is removed, 0.40 within Cagayan Valley. Survey fields cannot predict who gets missed, so the product prioritises by follow-up deadline instead of scoring mothers.

Dropped from the original proposal and listed as future work: SMS danger-sign triage (no clinician-labelled messages), PhilHealth and 4Ps predictors (not in the pregnancy recode), live SMS and server-side access control.

## Run it locally

```sh
cd web
npm install
npm run dev        # http://localhost:3000
npm run lint
npm test           # mother-access and planning-view unit tests
```

`web/.env.example` → `web/.env.local` with `NEXT_PUBLIC_DATA_SOURCE=mock`. Mock mode needs no accounts; saved demo actions persist in the browser (reset from the BHW page). The Supabase data source is stubbed and not required.

Deployment: Vercel, root directory `web`, framework Next.js, the env variable above. Project owner runs `deploy.ps1` after merging to `main`.

## Reproduce the analysis

```sh
python3 -m unittest discover -s tests -v                 # 21 simulation checks
python3 -m simulation.run --suite full --replications 100  # 30-configuration grid → simulation/results/v1/
python3 -m simulation.factorial --replications 100         # 162-configuration study → simulation/results/factorial_v1/
python3 data/geography/build_pilot_v2.py                   # pilot barangays, stations, travel matrix
```

Python 3.10+, standard library only. Seeds, config hashes and output checksums are bundled. The coordinator page reads `web/public/scenario_summary.csv`, a copy of `simulation/results/factorial_v1/scenario_summary.csv`.

The NDHS microdata (DHS Program, PHGR82FL) is restricted and not included; register at dhsprogram.com to obtain it. Published aggregates used for context are documented in `data/context/psa_ndhs_verification/`.

## Latest UI handoff

See [Mother and BHW progress — October 24, 2026](docs/UI_PROGRESS_2026-10-24.md) for the implemented workflows, validation, database migrations and remaining deployment checks.

## Repository map

Older handoff notes, including what is intentionally excluded from the repo and how to re-extract the OSM geography: `docs/HANDOFF_NOTES.md`.
```
web/            Next.js 16 app (JavaScript, Tailwind v4). Roles under src/app: hospital, bhw, (mobile) mother, coordinator
simulation/     Discrete-event simulation, experiment runners, results and findings
tests/          Simulation unit tests
data/           Pilot geography (OSM, PSA), demo seeds, published-statistics verification
docs/           PRD, team handoff, architecture notes, dated progress reports with screenshots
```

Start with `docs/TEAM_HANDOFF.md`, then `docs/InaAlaga_PRD.md`.

## Tech stack

Next.js 16 (App Router), React 19, Tailwind CSS 4, Supabase client (stubbed); Python 3 for simulation and data pipelines; Vercel hosting.

## Limitations

- Fictional prototype. No real patients, no live SMS, no institutional partner. Access checks run in the browser only until server routes exist.
- Simulation inputs (demand, staffing, delays, travel) are stated assumptions, not Tuguegarao measurements; replication ranges describe scenario randomness, not uncertainty about the real city.
- NDHS is regionally representative; Cagayan Valley estimates rest on about 100 women. The handoff-failure explanation is a hypothesis.
- Station assignments use straight-line distance to demonstration stations, not official catchments.

## Data sources and attribution

- Philippine Statistics Authority and ICF (2023). *2022 Philippine National Demographic and Health Survey: Final report.* Published tables: CC BY 4.0. Microdata: DHS Program terms, not redistributed.
- Philippine Statistics Authority (2026). *2025 NDHS key indicators: Statistical tables.*
- OpenStreetMap contributors via Geofabrik, © OpenStreetMap contributors, ODbL 1.0 (`data/geography/`).
- Philippine Statistics Authority. PSGC and 2024 POPCEN barangay population.
- World Health Organization (2022). *Recommendations on maternal and newborn care for a positive postnatal experience.*

## Team

BAIthropic, UPLB: Iesou Aguila, Quin Xyrah Eunice Almeyda, Henry Gabriel Buban, Mark Daniel Cascara, Marco Antonio Tumaob.
