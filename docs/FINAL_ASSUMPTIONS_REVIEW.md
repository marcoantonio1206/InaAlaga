# InaAlaga: final assumptions review before app development

**Team decisions confirmed — October 18, 2026, Asia/Manila.** This consolidates the current evidence and implementation. Section 8 records the team’s explicit approval in chat. This does not validate local operations or replace the PRD. Confirming a demo assumption means accepting it for the fictional prototype, not declaring it true in Tuguegarao.

## 1. What has already been agreed

These are existing project decisions, not questions that must be approved again.

- Build a hosted, entirely fictional hospital-to-community handoff demonstration in Tuguegarao, supported by a separate scheduling simulation.
- Proposed planning user: the city maternal/postnatal coordinator. The actual local title, authority and workflow are unverified.
- Stack: Next.js, TypeScript, Tailwind, Supabase PostgreSQL; offline Python produces versioned simulation results. Leaflet may provide the interactive map.
- Include hospital discharge, BHW inbox/acknowledgment/scheduling/outcome, a minimal mother status/contact-request page, and a coordinator dashboard.
- Keep restricted DHS respondent data out of the runtime, generator and shared core. The original individual-risk prediction model remains deferred.
- No real patient records, live SMS, production authentication, automated clinical triage, full family app or clinical deployment.
- Supplied submission target: October 24, 2026, 11:59 PM Philippine time; at most 20 PDF slides and a three-minute video, plus reproducible repository. These are team-supplied requirements; recheck the actual primer before submission.

## 2. What the existing evidence supports

| Item | What we checked | What this does not establish |
| --- | --- | --- |
| Published maternal-care figures | Existing workbook contains published aggregate tables; official PSA page links the same filename/listed size. Relevant cells, survey years, denominator sections and footnotes were inspected. | The official workbook download returned 403; byte-for-byte identity with the current hosted copy remains unconfirmed. No city handoff rate or causal explanation. |
| Regional statistics | Table 6's Cagayan Valley live-birth section reports 2025 facility delivery 94.7% and maternal check within two days after birth 61.2%. | These count different groups. Their difference is NOT a handoff-failure rate; the clock starts at birth, not discharge. |
| Barangay identities/population | Recovered 49 unique PSA codes and 2024 POPCEN population totaling 167,297. | The page labels its geography table July 31, 2025; this is not a verified 2026 classification join. Population is not postpartum demand. |
| OSM geography | Small extract, reference points, city polygon and mapped roads exist with source notes. | Settlement points are not homes/centroids; OSM city containment is not certified barangay membership. Exact snapshot cutoff is unverified. |
| Facilities | Local registry subsets contain 37 BHSs, 10 hospitals and one RHU. Location review has 2 supported, 10 approximate and 36 unresolved matches. | Not proof of exhaustive coverage, current operation, postnatal eligibility, training, staffing, catchments or referral acceptance. |
| Simulation | Generator and discrete-event engine implemented. 21 tests pass. Original 30-scenario run plus separate 162-combination factorial run; full reruns reproduced outputs. Saved source/input/output checksums were rechecked for this review. | Code verification is not local workflow or clinical validation. No actual patient health benefit was tested. |
| App | PRD and input files exist. | No connected website, database handoff, hosted demo or application acceptance tests have been implemented yet. |

Published figures are background only. Do not reconstruct respondent rows or calibrate local demand, delay or staffing from those regional percentages.

## 3. Geographic choices already adopted for the demonstration

CVMC is the discharge-facility reference. Tanza and Linao West are **demonstration receiving stations**, not confirmed referral partners. CVMC and Tanza have supported location matches; CVMC's coordinate is a campus bounding-box midpoint, not an entrance. Linao West's facility location remains approximate.

| Selected barangay | Assigned demo station | Baseline assumed one-way travel |
| --- | --- | ---: |
| Linao West | Linao West | 5.00 min |
| Atulayan Norte | Linao West | 5.00 min |
| Pallua Sur | Linao West | 14.00 min |
| Caritan Norte | Tanza | 6.58 min |
| Libag Sur | Tanza | 14.13 min |

The reproducible pilot rule uses name-matched, city-contained OSM references within a chosen 5 km footprint, selecting near/middle/far references at Linao and near/far at Tanza before policy outcomes. Five barangays and the 3/2 station split are scope/design choices, not a representative sample.

Assignment uses the minimum unrounded straight-line distance, before the travel-time floor. This is a demo lookup, NOT an official catchment or shortest driving route. Equal 20% case probabilities per barangay imply expected 60%/40% station demand, not equal station workload. Individual runs vary.

Travel is `max(5, straight_line_km / 15 * 60)` minutes. The 15 km/h speed and five-minute floor are assumptions. Multiply the resulting baseline by 0.5/1/2; do not reapply the floor afterward. Outbound and return durations are assumed equal.

**Keep visible:** Pallua Sur is only about 170 m closer to Linao and may switch under different points/road routes. Libag Sur remains disconnected in the conservative road screen; its geographic scenario uses the straight-line fallback. None of the modeled times is a validated legal driving route. Missing access/turn restrictions and bridge transitions must not be disguised as measured travel.

## 4. Simulation assumptions that remain assumptions

| Choice | Implemented definition | Interpretation/limit |
| --- | --- | --- |
| Demand | Poisson 4/8/12 new cases per day across the entire pilot; discharge uniformly within each day | Experimental stress levels, not recorded city births or discharges. |
| Allocation | Independently assign each case to a pilot barangay with probability 0.2 | Not exactly equal counts per run; reuse the identical generated assignments across policies. Population-weighted demand remains optional and unimplemented. |
| Workers and shifts | 1 per station in base; factorial tests 1/2; 09:00–13:00 every day, including weekends | Not verified staff schedules. Compare policies at equal resources within each scenario; adding workers is a separate resource change. |
| Handoff | A/D: reference delay 6–24, 12–48 or 24–72h; B/C: 0–6h; same uniform draws | Hypothetical delay ranges; acknowledgment is included in the delay. |
| Service | Fixed 15/30/60 minutes; base 30 | Operational contact task, not a validated clinical examination duration. |
| Administrative due times | Discharge +24/+48/+72h, equal probabilities; original suite also tests uniform 48h | Not medical recommendations or WHO contact schedules. |
| Queue order | A/B FIFO; C/D earliest due time; ties by receipt and case ID | Routine administrative order, never automated clinical triage. |
| Trip | Outbound + service + return; worker cannot overlap tasks or serve another station | No multi-home route, patient availability or route optimization. |
| Shift boundary | Whole trip must fit; a nonfitting queue head waits and cannot be bypassed | Can leave spare minutes unused; identical rule across policies, not known local practice. |
| Contact success | Every served task succeeds | No-shows, refusal, repeat failures, emergencies and clinical outcomes are absent. |
| Duration/denominator | 14 arrival days +7 drain days; all new cases remain in primary denominator | Late/never-served cases included. Initial backlog is separate stock; original suite tests one prior day, factorial starts empty. |
| Uncertainty | 100 paired replications per configuration; central 95% replication ranges | Scenario randomness, not confidence intervals for real effectiveness or for the mean. |

The factorial extension has 162 settings and 64,800 policy runs. B/C outputs repeat across the reference-delay axis because that axis affects A/D only: there are 54 distinct B/C settings. Their mean C−B differences are positive in 44, zero in 3 and negative in 7. These counts are neither statistical significance nor the probability a policy helps locally. The large faster-handoff gains depend on assumed delays/deadlines. No universal best scheduling policy is established.

## 5. Minimum app behavior already required by the PRD

These are build acceptance requirements, not claims of completed software.

- [ ] A fictional discharge persists with birth/discharge/due times and a station assignment event. Invalid timestamps and duplicate submissions are handled.
- [ ] Missing or ambiguous lookup stays visibly unassigned. Proposed correction/override is logged; the app does not pretend the assignment is a government catchment.
- [ ] Station-scoped inbox shows the saved case. Acknowledgment stores one named demo owner and a server timestamp; saving/assigning alone never means accepted.
- [ ] Scheduling, contact attempt and successful contact are distinct saved actions. The app must record unsuccessful attempts even though the simulation does not model their frequency.
- [ ] The minimal mother page sees only its fictional case, shows status/confirmed visit, and saves a nonclinical contact request. Acknowledging a request is separate from completing contact.
- [ ] Saved changes survive refresh and appear across relevant screens. Role selection is a demo convenience; server-side station/case scope checks still apply.
- [ ] Store event timestamps in UTC and display Asia/Manila. Keep any synthetic demo clock explicit and separate from server audit timestamps. Administrative overdue labels must not imply clinical danger.
- [ ] Coordinator operations use saved app events; planning uses a selected versioned scenario JSON. Never mix the two sets of counts or recalculate planning results from one demo case.
- [ ] A map OR schematic shows the pilot and attribution/uncertainty. Interactive Leaflet is optional; the geographic explanation is not optional under the PRD.
- [ ] Mother/BHW views work on mobile; statuses use words/icons as well as color. Do not show medical risk scores or claim messages have been read before acknowledgment.
- [ ] Use separately created fictional app seed records. Simulation cohorts lack app fields such as birth timestamps and access tokens; they are not ready-made complete database seeds.

## 6. What remains unresolved

No interview has yet confirmed the real local coordinator role, station assignment authority, referral/acknowledgment process, home-visit provider/training, available hours, caseloads, actual delays, service duration or handling of failed contact. Keep the workflow changeable and label its roles as demonstration roles. A future interview can inform assumptions but cannot by itself validate citywide effectiveness.

NHFR redistribution terms remain unresolved; the joined registry tables and restricted audit remain excluded from GitHub. PSA and OSM materials retain their separate attribution/license conditions. The organizer's request for the DHS agreement is reported by the user; it is not evidence of DHS permission for AI processing or respondent-data redistribution. The approved release does not depend on those permissions.

## 7. Claims we can and cannot make

| Evidence level | Defensible wording |
| --- | --- |
| Now, checked sources | “We use published regional statistics for context and a five-barangay demonstration geography, with source limitations.” |
| Now, implemented analysis | “Under stated synthetic settings, policies differ; some settings show ties or reversals.” |
| After app acceptance passes | “The prototype saves assignment, acknowledgment, scheduling and contact outcomes across its demo views.” |
| Not established | “Tuguegarao has this handoff-failure rate”; “these are official catchments”; “every BHW can provide this care”; “the city will improve by X”; “the prototype improves health outcomes.” |

## 8. Team confirmation before the app build

Existing approved scope and pilot/travel rules are retained. The team explicitly approved decisions 1, 3 and 4, and the explicit-entry alternative for decision 2, in this chat on October 18, 2026.

- [x] **Proceed with a fictional prototype while seeking local feedback.** Keep unverified station eligibility/catchments and worker roles visible; do not present it as ready for real referrals. Lack of an interview does not block the fictional build; disclose that limitation.
- [x] **Require explicit entry of a demo follow-up deadline, with no prefilled 48-hour default.** The hospital form labels it an administrative demo target, requires it before saving, and rejects a deadline before discharge. Seeded fictional examples may already contain deadlines. The simulation’s mixed 24/48/72-hour deadlines remain unchanged and are not clinical recommendations.
- [x] **Use the saved lookup for an initial assignment suggestion**, show the hospital user the selected demonstration station, and provide a coordinator correction path while the case remains unacknowledged. Log the change. Acknowledged-case reassignment is outside the initial build; do not silently replace a worker’s accepted responsibility. Missing/ambiguous lookup remains visibly unassigned.
- [x] **Build one persisted discharge → station inbox → acknowledgment flow first**, then scheduling, mother/contact outcomes and the scenario dashboard. Keep the analysis frozen unless a bug or new evidence justifies a new version.

These checked items record design approval only. The Section 5 app acceptance checkboxes remain unchecked until implemented and tested. The app remains unbuilt; no operational or clinical validation is implied.

## Source-of-truth references

- [PRD v1.0](InaAlaga_PRD.md): scope, workflow, states and acceptance requirements. Its old source-acquisition statuses are historical, not current inventory.
- [Current team handoff](TEAM_HANDOFF.md).
- [Published NDHS verification](../data/context/psa_ndhs_verification/README.md): exact figures, denominator caveats and acquisition limits.
- [Recovered PSA table notes](../data/geography/psa_tuguegarao/README.md).
- [Pilot v2](../data/geography/pilot_v2/README.md): supersedes the original five-barangay grouping.
- [Demand allocation](../data/simulation/demand_allocation.json).
- [Implemented engine](../simulation/model.py) and [simulation guide](../simulation/README.md).
- [Factorial design](../simulation/results/factorial_v1/experiment_design.json), [findings](../simulation/reports/factorial_v1/FINDINGS.md), and [verification record](../simulation/factorial_validation.json).

Review basis: existing local artifacts and code, plus verification of saved v1/factorial source/input/output hashes. No restricted respondent data were opened, no external facts were newly independently established, no experiments were rerun, and the simulation inputs and results were not modified. Section 8 now records approved app behavior; the review and decision summary are included in the curated GitHub handoff.
