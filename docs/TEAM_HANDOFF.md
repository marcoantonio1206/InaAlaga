# InaAlaga team handoff

Status: October 18, 2026. Read this first, then docs/InaAlaga_PRD.md and data/locations/tuguegarao_review/README.md. This summary covers the supplied project handoff and files inspected in this chat, not a complete export of every earlier conversation.

## What we are building

We are BAIthropic, five second-year BS Computer Science students from UPLB joining PJDSC 2026. Our supplied deadline is October 24, 11:59 PM Philippine time. Deliverables are a hosted demo, reproducible repository, PDF deck of at most 20 slides, and video of at most three minutes. Recheck the official primer before submitting.

InaAlaga demonstrates a hospital-to-community handoff after childbirth in Tuguegarao. Hospital staff save a fictional discharge record and assign it to a station. A BHW accepts responsibility, schedules follow-up, and records whether contact happened. A simple mother page shows status and visits and lets her request contact. A coordinator dashboard separates saved demo activity from simulation results.

The team approved Next.js, TypeScript, Tailwind, Supabase PostgreSQL, and offline Python analysis that exports JSON. A small Leaflet map is optional. SMS is simulated. Real SMS, production login, automated medical advice, risk scores, family features, and a full mother app are outside the current scope.

## Why we changed direction

The original plan used 2022 NDHS survey data to predict missing postnatal checks. An earlier feasibility audit found timing problems and limits on what the survey can prove. It cannot establish actual hospital handoff failure or validated local clinical risk. We deferred the prediction model and chose a synthetic workflow demonstration plus a scheduling simulation.

Do not upload DHS respondent records, cleaned copies, restricted audit outputs, or raw conversations containing those records to GitHub or Claude. Sharing and AI-processing permission are not established. Private GitHub does not remove those restrictions. Demo patients must be independently fictional, never altered survey rows.

## What the simulation will ask

With the same workers and follow-up capacity, when do faster handoffs and deadline-based scheduling help complete contact on time?

Compare A: assumed delayed handoff and arrival-order scheduling; B: faster handoff and arrival-order scheduling; C: faster handoff and earliest-deadline scheduling. Use the same fictional cases, locations, capacity, and random inputs across policies. Repeat runs and vary demand, travel, service time, and delays. Report ties or worse results honestly.

We are still using a mathematical model: a discrete-event simulation. We deferred the machine-learning model that predicts individual outcomes. Our simulation will represent discharge times, handoff delays, worker queues, travel, and contact duration. We will compare scheduling policies using on-time contact rates, delays, and workload, then repeat experiments under different assumptions. The generator and discrete-event simulation are now implemented in simulation/. The initial 30-configuration experiment is preserved. A separate full-factorial experiment now covers 162 combinations of demand, staffing, service duration, travel and reference delay, with 100 paired replications and four policies (64,800 policy runs). Read simulation/README.md and simulation/FINDINGS.md; the web app remains unbuilt.

Synthetic cases will be allocated equally in probability across the five selected barangays (20% per barangay). This is an experimental assumption, not an estimate of actual local births. Each case receives one seeded random barangay assignment, reused across all policies; counts can vary by barangay within a run. Population-based allocation is an optional sensitivity check, not the main scenario. See data/simulation/demand_allocation.json. Station assignments and approximate travel are now specified in data/geography/pilot_v2/ as demonstration assumptions; they are not official catchments.

Staffing, demand, handoff delays, and 24/48/72-hour post-discharge deadlines are assumptions, not measured Tuguegarao practice or WHO clinical deadlines. WHO contact timing is counted from birth. Saving a record or sending a message does not prove care occurred. We have no clinician/BHW reviewer and cannot claim real health improvements.

## What is finished

The PRD is written. Data inspection/extraction scripts, source notes, the synthetic case generator and the discrete-event simulation exist. Versioned simulation JSON, seed-level metrics and example synthetic timelines are saved under simulation/results/v1/. Published maternal-care statistics and WHO guidance were reviewed for context. Regional percentages do not measure local handoff failure, and indicators with different denominators cannot simply be subtracted to calculate it.

A small OSM extract contains roads, settlement reference points, health candidates, and a city boundary. Registry exports identify 37 BHSs, 10 hospitals, and one RHU in Tuguegarao; this does not prove complete coverage. Across those 48 facilities, the location review found 2 supported matches, 10 approximate locations, and 36 unresolved locations. Unresolved coordinates stay blank.

Proposed pilot: CVMC as discharge reference, Tanza BHS and Linao West BHS as demonstration receiving stations. CVMC and Tanza have supported map matches; Linao West is approximate and still needs its Alaw Street location/access confirmed. No station has verified postnatal referral acceptance, staffing, or official catchments.

The revised five-barangay pilot is Linao West, Atulayan Norte, Pallua Sur, Caritan Norte, and Libag Sur. The first three are assigned to Linao West and the last two to Tanza using nearest straight-line distance. Selection uses a documented 5 km footprint and near/middle/far rule before policy results. At 20% demand probability per barangay, station shares are 60%/40%. Travel is max(5 minutes, distance / assumed 15 km/h), tested with 0.5x and 2x duration multipliers. These are modeled settlement-to-station estimates, not measured journeys. Pallua Sur has a small station-distance margin; Libag Sur has unresolved road-screen connectivity. See data/geography/pilot_v2/README.md for the canonical inputs and limitations.

Road screening connects eight of ten pairs in the revised pilot; Libag Sur topology is unresolved. Entrances, private access, turn restrictions, and actual travel times remain unverified. Straight-line travel is the explicit modeling fallback. OSM attribution/license obligations apply. Registry redistribution terms remain unresolved. The earlier PSA text file is missing, but all 49 barangay rows have now been recovered from the official PSA page and saved in data/geography/psa_tuguegarao/. Their 2024 population totals 167,297. The page labels its geography table July 31, 2025; this is not a verified 2026 classification update. Population is background and an optional allocation sensitivity input, not measured postpartum demand.

## Confirmed app-build decisions (October 18, 2026)

The team approved proceeding with the fictional prototype while seeking local feedback. The hospital form must require an explicitly entered administrative demo follow-up deadline, with no automatic 48-hour default; seeded fictional examples may already contain deadlines. Keep the simulation’s 24/48/72-hour assumptions unchanged.

Show the saved lookup’s initial demonstration-station assignment and allow a coordinator to correct it before acknowledgment, with an audit event. Keep acknowledged-case reassignment outside the first build; do not silently change ownership. Unmapped/ambiguous cases remain unassigned. Build the saved discharge → station inbox → acknowledgment path first, then the remaining workflow and dashboard. These are design decisions, not proof of local practice. See docs/FINAL_ASSUMPTIONS_REVIEW.md; implementation acceptance boxes remain unchecked.

## What is not finished and what comes next

The application has not been built. The synthetic generator and scheduling simulation are implemented; 21 unit checks pass; the initial 12,000-run release is preserved and the factorial extension adds 64,800 runs across 162 configurations. These verify the stated model, not actual city effectiveness. Deadline scheduling ties or performs worse in some configurations; do not promise an improvement. See simulation/reports/factorial_v1/FINDINGS.md for the current interaction analysis and simulation/FINDINGS.md for the original grid. These tests explore assumed conditions and do not establish which conditions occur locally.

Next: use the versioned pilot allocation and travel assumptions; assign the five team roles; build one complete saved handoff; review the simulation assumptions and failure conditions; connect the dashboard to the versioned results; prepare deck/video and a clean submission. Aim for feature freeze October 22, testing/recording October 23, and October 24 for fixes/submission.

Treat the PRD as the implementation baseline, with proposed defaults clearly marked. The newer location review updates geography knowledge without silently changing the PRD. Keep approved decisions, inspected facts, assumptions, and unanswered questions separate. Keep source citations and licenses. Build the public repository from a reviewed allowlist, not the entire master folder.
