# InaAlaga Product Requirements Document

## Hackathon prototype and simulation plan

Version 1.2 | Prepared October 18, 2026 | Implementation revision October 24, 2026 | Team BAIthropic, UPLB

**Revision status:** Updated to the implemented prototype and locally verified progress through October 24. Mother, BHW and hospital facilitator workflows are implemented; coordinator planning displays the completed simulation, while its operational overview and presentation polish remain pending. Read `TEAM_HANDOFF.md`, `UI_PROGRESS_2026-10-24.md` and `FACILITATOR_PROGRESS_2026-10-24.md` for detailed evidence. The Markdown PRD is authoritative; the older PRD.docx is not updated or used.

**Delivery target:** hosted demonstration and submission by October 24, 2026, 11:59 PM Asia/Manila, subject to the official primer. Latest application validation: 49 automated tests and the production build passed; lint has no errors and one existing image optimization warning. Recent browser workflow checks used local mock mode. These checks do not establish hosted readiness or remote database integration.

InaAlaga demonstrates how fictional hospital discharge records reach a barangay health team, acquire a responsible worker, and lead to a recorded follow-up. A separate, precomputed simulation supports comparison of handoff and scheduling policies under assumed worker capacity. All demonstration mother and worker records are independently fictional.

The implemented application uses **Next.js/React with vanilla JavaScript (JS/JSX), Tailwind CSS, a browser-local mock data adapter and an optional Supabase PostgreSQL adapter**. Offline Python generates the analytical outputs. Family management, automated medical triage and predictive scoring remain outside this release.

### Implementation checkpoint — October 24

| Area | Implemented and checked locally | Remaining limits |
| --- | --- | --- |
| Hospital facilitator | Discharge edit/review/save; explicit follow-up target; persisted mother link; named BHW assignment for unassigned cases; shared mother-details layout; automatic/manual refresh | Reassignment and station correction after assignment are not implemented |
| BHW | Station inbox, named acceptance, multiple home/station appointments, individual visit outcomes, request acknowledgment, separate contact attempts, overdue arrangement; refresh on Cases/profile/Schedule | Exact-start collisions are blocked; travel/duration conflicts, rescheduling/cancellation controls and future completion-time validation remain pending |
| Mother | Home, Visits and Stations; FIL/EN; saved next/future/previous visits, countdown, worker status, repeat contact requests after acknowledgment, scoped expiring links and station map | No real SMS, live GPS, route estimates or visit-change request workflow |
| Coordinator | Planning: five-setting selector over 162 precomputed scenarios, plain-language summary, higher/little/lower comparison wording, assumptions and methods, expandable utilization/unserved/all-comparison evidence with scenario ID and CSV download, Reset scenario. Overview: saved-record groups with read-only drill-down and polling | Overview has no station filter or historical trends; final four-perspective walkthrough pending |
| Persistence and release | Browser-local persistence/cross-tab updates, reset confirmation, mocked workflow tests and browser walkthroughs | No cross-device sharing in mock mode; migrations 004–006 not applied remotely; Supabase integration, hosted smoke test and final submission evidence still need verification |

### Primary decision

**With the same available follow-up capacity, when do faster discharge handoff and deadline-based scheduling improve timely contact compared with arrival-order scheduling?**

The intended decision-maker is the city health office staff member coordinating maternal/postnatal services. The exact Tuguegarao job title, authority, and workflow are unverified. BHWs are operational users; hospital staff create handoffs; mothers see their status and request contact.

### Release boundaries

- A hosted synthetic demonstration, not a health service deployment or hospital integration.
- A simulated operational contact deadline, not a clinical recommendation or proof of improved health outcomes.
- No restricted DHS microdata dependency in the hosted app, simulation, public repository, or recording. A later permission response does not automatically add the deferred model back to this release.
- A successful release may find that scheduling adds little benefit or that staffing dominates. No minimum improvement, accuracy score, or finalist placement is promised.

### How to use this document

Sections 1–3 establish the product and acceptance requirements; 4–7 define the data and analytical method; 8–10 cover architecture and delivery; 11–12 define evidence and release checks. The source register distinguishes researched candidates from data already acquired. All times and dates use Asia/Manila for display and schedules.

<!-- pagebreak -->

## 1 Product goals and scope

### Six gaps addressed by requirements

| Previous gap | Requirement that closes the design gap | Evidence needed before submission |
| --- | --- | --- |
| Unclear decision | One policy comparison for a city coordinator | Dashboard and deck answer the same question |
| Weak simulation credibility | Equal resources, shared cases, repeated runs and sensitivity analysis | Reproducible results and verification tests |
| Incomplete handoff | Assignment, named owner, acknowledgment and timestamps | Persisted case traverses the full flow |
| Unclear dashboard value | Policy comparison plus uncertainty and failure conditions | One traceable finding, including null findings |
| Publication uncertainty | Public-data core and a dataset license register | Clean repository and documented source terms |
| Conflicting claims | One metric dictionary and an explicit claim checklist | App, notebook, deck and video agree |

These requirements address the previous holes in the design. Closing them in practice requires the evidence in the last column; writing the PRD alone does not establish validation.

### Must deliver by October 24

- Minimal hospital discharge form with routing confirmation and a pending handoff state.
- BHW inbox, case detail, acknowledgment, scheduling and contact outcome actions.
- Mother status/visit page and a nonclinical request-contact action.
- Coordinator view with clearly separated demo operations and precomputed simulation results.
- A small pilot map, policy comparison chart, workload and delay results, and an assumptions panel.
- Seeded synthetic records, repeatable simulation, data provenance, tests, setup instructions, deck and video.

### Deferred from this release

Family permissions and supportive actions; learning library; full maternal/newborn questionnaire; automated danger-sign interpretation; Taglish classifier; NDHS predictive model; real SMS; OTP/account recovery; live GPS; route optimization; full-city population coverage; cross-LGU routing; medical advice and clinical escalation protocols. A simple role launcher replaces production staff account management.

### Changes from earlier designs

The mother application now has Home, Visits and Stations. Multiple saved appointments, station destinations and FIL/EN strings are implemented. Preferred schedule requests and rescheduling/cancellation controls remain proposals. The simulation continues to model only the first routine home follow-up. The dashboard remains the analytical centerpiece. The BHW queue explains administrative order, not medical risk. Reusable Figma components are retained; the connected story takes priority over optional screens.

<!-- pagebreak -->

## 2 Users and the complete handoff

### User responsibilities

| User | Can do | Boundary |
| --- | --- | --- |
| Hospital discharge staff | Record discharge, review routing and assign an unassigned mother to a supported BHW | Assignment is pending; cannot accept on the worker’s behalf |
| BHW | View assigned cases, acknowledge, schedule and record outcomes | No clinical diagnosis or automated treatment |
| Mother | Read status, saved visits and station information; request contact again after acknowledgment | Cannot complete contact or directly change a visit |
| Coordinator | Compare precomputed simulated policies; saved-activity overview remains pending | Simulation results are independent of app records and do not change services |

### Demonstration story

1. A facilitator enters a fictional alias, barangay, birth and discharge time, and explicitly entered follow-up target. The target starts blank. Date-order validation precedes review/save; the facility is read-only and review/save actions stay accessible.
2. Saved routing selects a station and pending BHW (Ana/Tanza or Bea/Linao West). Unsupported routing stays unassigned. The facilitator can choose a supported BHW for an unassigned case; assignment saves station, worker and an audit event without acceptance or scheduling.
3. The correct station inbox displays the case. The named worker accepts responsibility, saving the owner and actual action time. Another station or a conflicting named worker cannot accept through the assignment flow.
4. The worker schedules a future home visit or station check-up in Philippine time. The actual visit destination/visitor is separate from the coordinating station/case owner. Multiple appointments persist; exact-start duplicates for the mother or visitor are blocked.
5. The mother opens her opaque, case-scoped link through the simulated message preview. New links expire 14 days after recording. Home shows the next unresolved visit and worker status; Visits groups next, future and previous records. A passed appointment remains unresolved until a saved outcome or arrangement is recorded.
6. “Please contact me” saves an open request. The BHW acknowledges separately and records a contact attempt as reached/not reached. After acknowledgment the mother may submit another request; an already-open request is not duplicated. Phone contact does not complete a scheduled visit. Facilitator list/profile show the saved updates.
7. A responsible accepted BHW can choose “Arranged with mother” for an overdue target or currently passed open appointments. It records who/when and clears those warnings without rescheduling, completing a visit or proving successful contact. A later appointment becoming overdue raises a new warning.
8. The presenter opens coordinator Planning and selects a precomputed scenario. All displayed results and assumptions follow that setting. Entering or editing a mother does not recalculate the simulation. A coordinator operational overview is still pending.

### States and clocks

Handoff is unassigned, pending or acknowledged. Stored visits have scheduled/completed/cancelled states; unscheduled means no saved appointment, while contact attempts are separate records. The UI supports cancelled history but does not yet provide cancellation controls. Requests are none, recorded or acknowledged. Overdue and visit-update warnings are derived administrative states, not medical urgency labels. Saved arrangement metadata suppresses only the relevant warnings and remains separate from contact success and visit outcomes.

Store entered birth/discharge/target/visit times separately from real action timestamps, including recording, assignment, acceptance, request acknowledgment and arrangement. Persist timezone-aware instants and display Asia/Manila. Operational status/countdowns now use actual current time. The fixed October 19 reference remains only for historical fixtures and explicit simulation/seed context. Historical events are not rewritten; missing facilitator timeline timestamps display “Time not recorded.”

<!-- pagebreak -->

## 3 Functional requirements and acceptance criteria

P0 means required for the submission. The table states requirements, not a blanket completion claim. Use the implementation checkpoint and verification section for current evidence. Owners A–E are the original planning placeholders in Section 9.

| ID | Priority and owner | Requirement and acceptance test |
| --- | --- | --- |
| H01 | P0 C | Discharge creation persists a case and assignment event. Refresh retains it; double submission with the same idempotency key produces one case. |
| H02 | P0 C | Missing routing remains unassigned. A facilitator can assign a supported BHW, saving the station/worker/audit event without acceptance; conflicting repeat assignments are rejected. |
| W01 | P0 B and C | BHW queue shows only the authorized station's cases, acknowledgment status, due time and ordering reason. Cross-station requests are rejected server-side. |
| W02 | P0 C | Acknowledgment sets one owner and a server timestamp. Repeated acknowledgment does not duplicate events or silently replace the owner. |
| W03 | P0 B and C | Scheduling, contact attempt and visit completion are separate. New schedules must be strictly in the future at save time; individual outcomes retain history. Validation that rejects future completion timestamps is still pending. |
| W04 | P0 B and C | Responsible accepted BHW can record an overdue arrangement idempotently; currently overdue warnings clear without changing schedule/outcome fields, and later overdue visits can warn again. |
| R02 | P0 B | Facilitator list/profile and BHW Cases/profile/Schedule refresh every five seconds while visible, on return to the tab and storage changes; manual Refresh, serialized requests and stale-response suppression preserve last loaded data on failure. |
| M01 | P0 A and C | Mother link returns only its case. A different case ID or expired token does not reveal another record. |
| M02 | P0 A | Mother page shows pending, acknowledged, scheduled, overdue and completed states with words and icons. A request-contact action is separate from visit completion. |
| R01 | P0 C | Contact requests persist and become visible to the assigned BHW on refresh/poll. Notification-delivery claims are never generated by a database write alone. |
| D01 | P0 B and D | Operational cards use stored demo events. Simulation cards use precomputed outputs with a visible simulation label. Their numbers never mix. |
| D02 | P0 D and E | A scenario selector updates every result, assumptions and comparison chart from one scenario ID. Missing combinations show unavailable; no fabricated interpolation. |
| D03 | P0 A and D | A map or schematic shows selected barangays and stations, source date and attribution. Labels state pilot coverage and any geographic approximation. |
| S01 | P0 D | A documented command regenerates a fixed-seed scenario result; policy changes do not regenerate exogenous demand or staff capacity. |
| Q01 | P0 E | Authorized demo reset restores a known state without deleting another session. The complete story passes in two separate browser sessions. |

### Screens and interaction

Implemented views: launcher/message preview, facilitator patient list and discharge review/save, BHW Cases/detail/Schedule, mother Home/Visits/Stations, and coordinator Planning. Reset is at `/demonstration/settings` with confirmation; browser-local reset restores sample data across perspectives. Database-mode reset is unavailable in the current UI. Mobile and desktop presentation remain final release checks.

### Mother Home and Visits — implemented

Home presents the next scheduled visit/countdown, responsible worker and coordinating station, with an expandable explanation and contact request action. Completed visits appear in Visits history. Acceptance is shown only after saving worker acceptance; scheduling is not a separate mother confirmation. Never infer that the case owner is the scheduled visitor.

Visits groups the earliest unresolved appointment as Next visit, later appointments as Future visits and completed/cancelled records as Previous visits. Future records use a soft orange tint, completed badges use green, and expanded details preserve visitor/location/history. A passed appointment is not silently completed or marked missed. Arranged-with-mother status does not replace a saved visit outcome.

Home visits say “Your home.” Station check-ups name the actual saved destination and link to its station location. A request acknowledgment is separate from a contact outcome; reached phone contact leaves a scheduled visit open. Request state is shared across mother destinations, and a new request is allowed after acknowledgment without duplicating an open request. Loading, invalid/expired access, failure and empty states remain distinct. FIL/EN strings cover Home, Visits, Stations, countdowns and access/error states; stored names retain their original spelling.

### Shared facilitator/BHW mother details — implemented

Both roles use the same mother-details component: compact name/case/status header, station/worker/target summary, full-width visits, grouped contact requests/attempts, collapsed discharge details and event history. Roles retain their own actions. Facilitators assign unassigned cases and open mother links; BHWs accept, schedule and record follow-up actions. Facilitator list rows keep the Unassigned/pending/accepted responsibility summary compact; named pending BHW information belongs in the profile. Empty list contact summaries are hidden; saved updates remain visible.

### Discharge and refresh behavior — implemented

The follow-up target starts blank and requires deliberate entry. “Facility” and “Follow-up target” use short labels; targets are administrative deadlines. The saved audit time is the actual save time, separate from entered dates. Duplicate discharge retries with the same idempotency key return one case/link. Facilitator and BHW refresh buttons show “Refreshing…” while busy; background failures retain last loaded data with Retry. Refreshing does not reset search/filter state or open forms; switching BHW identity remounts the case panel.

### Preferred schedule request — proposed extension

Recommended visit action: “Request a different time.” Open a bottom sheet showing the current visit, preferred date, and Morning/Afternoon/Any time. Prefer a broad time preference over an exact slot picker until worker availability exists. Provide “Send request” and a dismiss action.

Copy: “Your worker will review this. Your current visit stays scheduled until a change is confirmed.” After saving: “Change requested · Preferred: Oct 20, afternoon · Awaiting worker review.” A request is neither a booking nor proof that the worker read it. Acknowledgment, acceptance of the preferred time and the actual schedule update are separate events.

This supersedes the earlier suggestion to use a generic contact request for every schedule change, if this extension is selected. It requires a visit-linked request type, preferred date/time period, status/audit history, station-scoped worker review and a visible outcome for the mother. The worker must be able to retain the existing schedule or arrange another time; do not silently accept a preference. Define request editing, duplicates, date validation and competing worker updates before implementation. Without this extension, explain that “Please contact me” can be used to discuss the visit and that the schedule remains unchanged. The dedicated preference workflow is not implemented; the existing contact request can be used to discuss a visit without changing its schedule.

### Stations, navigation and visual system — implemented and remaining

Mother navigation is Home, Visits and Stations. Stations provides a two-station selector, saved appointment context and an OpenStreetMap embed/external link with attribution. Coordination and the actual visit destination remain separate. Locations/entrances retain approximation and verification caveats. No live GPS, measured household distance, routing service or travel-time estimate is implemented. Leaflet is not part of the current runtime.

Keep the established purple/lilac theme, rounded cards, visible navigation labels, clear status text/icons and simple wording. Facilitator and BHW placeholder bells are removed; repeated demo wording was reduced on facilitator screens. Coordinator still has a placeholder bell and older demonstration wording; header consistency is pending. Mother text still contains some demonstration wording, so final copy review should not be described as complete. No family controls, symptom forms, emergency monitoring or real-SMS promises are added.

Remaining coordinator polish: explain results in plain language; distinguish negative differences from ties/small gains; explain percentage points and assumptions; optionally expose saved utilization/unserved/negative-run metrics and scenario provenance; add a separate saved-record overview. These recommendations have been reviewed, not implemented. A Reset scenario control is proposed; polling is for operational records, not fixed simulation results.

Final UI checks should cover narrow screens, expanded details, longer Filipino strings, keyboard access and enlarged text. Native Figma parity is not assumed from implemented browser behavior.

<!-- pagebreak -->

## 4 Data strategy and source research

### Public core and restricted research

Use four layers with separate provenance: published maternal-care indicators for context; geographic identities and facility points for the pilot; fictional case/workforce records; and scenario assumptions/results. Public statistics must not be converted into individual clinical labels or barangay-specific observed outcomes.

The PHNR82FL ZIP is restricted research material. Its earlier audit informed the decision to defer predictive scoring. It is excluded from this release's runtime, synthetic generator and required analytical pipeline. Do not copy its rows, empirical row combinations or respondent identifiers into fictional records. No further microdata processing through an AI service is authorized by this PRD. Organizer approval would address competition rules only; DHS terms remain separate.

### Researched source register

Research checked on October 18, 2026. “Verified” below means the source page or relevant documentation was inspected, not that a complete local dataset has been downloaded, joined, licensed and validated.

| Source | Role and status | Acquisition and fallback |
| --- | --- | --- |
| PSA PSGC publications [1] | Official barangay names/codes; page verified. Preferred core geography identifier. | Download the publication; filter Tuguegarao; retain code strings and vintage. API [2] is documented but requires a token, so avoid API dependence. |
| PSA CPH publications [3] | Candidate barangay population for spatial allocation of synthetic demand. Publication portal verified; complete city extract not acquired. | Acquire the relevant full table by Oct 19. Otherwise use equal synthetic demand across pilot barangays and disclose that assumption. Population is not birth demand. |
| PSA NDHS public tables [4] | Context for regional maternal care. Official public page verified; user supplied comparative workbook already inspected. | Cite published aggregates only after checking the file's source and notes. Preserve numerator/denominator differences. No restricted respondent-level input. |
| OSM and Geofabrik [6–7] | Roads and candidate facilities/settlement points; download and license pages verified. Local extraction not yet performed. | Obtain a small pilot extract; retain OSM IDs and dates. If network routing is late, use explicitly approximate distance-based travel. |
| DOH HFSRB registry portal [8] | Official facility verification candidate; registry role verified. Pilot list, coordinates and reuse terms not established. | Cross-check a few facilities if accessible. Otherwise use OSM candidates labeled unverified or fictional service stations; never call them confirmed clinical destinations. |
| WHO postnatal guideline [9] | Clinical context only; publication page verified. Not staffing, travel or local demand evidence. | Cite and paraphrase carefully. No automated treatment advice or clinical protocol is implemented. |

PSA terms [5] permit reuse with attribution unless material states otherwise. Check the actual file and preserve technical notes. OSM is ODbL, requiring attribution and applicable share-alike obligations; keep its derived geographic database separate from app code and fictional data. Public access is not a blanket redistribution license for DOH or other sources.

<!-- pagebreak -->

## 5 Pilot dataset and provenance requirements

### Bound the geography

Target five selected Tuguegarao barangays and two demo service stations, supported by at least one mapped discharge facility if verified. Select varied near/far locations before looking at policy outcomes. This is a demonstrator subset, not a representative sample or citywide resource plan. Do not claim the selected stations are official catchments or actual BHW employers.

Use barangay reference points, not real homes. If a reference point is an approximate settlement point, label it as such; do not call it a population-weighted centroid. Candidate station assignment uses the shortest available estimated journey to an eligible station. The app uses a saved lookup and facilitator assignment for unassigned cases. Coordinator station override/reassignment remains unimplemented; any future override must retain an audit event. The assignment is a demo suggestion, not a replacement for local jurisdiction rules.

### Required data products

| File or table | Required fields | Quality checks |
| --- | --- | --- |
| barangays.csv | Internal ID, PSGC string, name, vintage, reference coordinates, source ID | Unique keys; known city; valid coordinates; no silent vintage mixing |
| facilities.csv | ID, name, type, coordinates, verification status, source ID | No duplicate OSM/DOH identities; unverified status visible |
| travel_matrix.csv | Origin, station, minutes, method, speed/scenario, source date | Every modeled pair covered; finite nonnegative values; no road claim for straight-line distance |
| assumptions.json | Units, base values, ranges, distributions, rationale, version | No unlabelled operational default; no borrowed local staffing claim |
| synthetic_cases.csv | Fictional ID, barangay, release/discharge time, due time, random attributes | No real names, phone numbers or copied respondent rows |
| results.json | Scenario/policy/seed IDs, config hash, metric values, replication count | Schema valid; matched settings; every UI value traceable |
| data_manifest.csv | Publisher, URL, retrieval date, vintage, license, changes, checksum, purpose | Every bundled external file has a source and reuse record |

### Acquisition deadline and limits

E owns source acquisition with D. By October 19, spend at most one focused work session obtaining identifiers, pilot points and permission records. Do not download a national road network and build a complex GIS pipeline if a small extract suffices. Preserve only the necessary pilot data.

If population or a DOH list cannot be obtained, the core study remains a transparent synthetic scenario comparison. However, if no defensible geographic input is acquired, label the result a Tuguegarao-inspired schematic and remove claims of verified barangay travel. That fallback reduces local grounding and must be acknowledged in the deck, rather than disguised.

### Context statistics

The supplied comparative table reports Cagayan Valley facility delivery at 94.7% and maternal checks within two days at 61.2% in 2025. They describe different denominators and do not establish a 33.5% handoff-failure rate. Keep any published counts distinct from unweighted survey sample sizes. The research question is motivated by a care gap; the cause is not proven.

<!-- pagebreak -->

## 6 Simulation specification

### Purpose and modeled service

Use a small discrete-event simulation with a chronological event queue. It models the first routine home follow-up task after discharge, not a clinical examination, newborn outcome, emergency response or long-term visit schedule. A completed simulated task is an operational contact; it is not evidence that adequate clinical postnatal care occurred. Every task consumes travel and service capacity.

The implemented Python simulation uses the standard library and a heap event queue; NumPy, pandas and SimPy [10] are not runtime requirements for the model. Publish the algorithm and assumptions using the STRESS-DES reporting principles [11]. A cited framework does not validate local assumptions.

### Core policy comparisons

| Policy | Handoff delay | Routine queue order |
| --- | --- | --- |
| A Reference workflow | Assumed delayed handoff | First received first served |
| B Faster handoff | Assumed shorter handoff | First received first served |
| C Faster handoff and deadlines | Same shorter handoff as B | Earliest due time first |

Policy D, reference delay with earliest-deadline ordering, is implemented in the engine, factorial results and coordinator chart. It completes the two-by-two comparison. Policy A is a hypothetical comparator, never asserted to be observed Tuguegarao practice.

### Time and queue rules

Use minutes from simulation start. Cases become available at discharge plus policy-specific handoff delay. Model acknowledgment as part of that delay, not an additional unmeasured capacity benefit. Each station has a fixed worker pool and shift calendar shared across policies. At shift start, handoff arrival or task completion, an idle worker selects from available cases at its station.

FIFO ties use case ID; earliest-deadline ties use receipt time then case ID. Idle workers break ties by fixed worker ID. All events at a timestamp are processed before dispatch. If the queue head cannot fit within the remaining shift, it waits rather than being bypassed by a shorter task; this rule applies to all policies. Tasks are non-preemptive. A home task consumes outbound travel, contact duration and return travel; the worker is unavailable for the whole interval. Contact is recorded complete at the end of service, before the return leg. Permit a start only if the entire trip fits the shift. Prevent overlapping tasks and count a case once.

Use 14 days of new cases and 7 additional days to drain the queue. Within each day, distribute the sampled arrivals uniformly across 24 hours. Score every case introduced during the 14-day window, including never-served cases. Report any unfinished tasks at the end. This is a terminating experiment starting empty, not a steady-state city forecast; test initial backlog separately.

Assume every serviced task successfully reaches the mother. No-shows, refusal, patient availability and clinical deterioration are not modeled. Results therefore describe capacity under successful-contact assumptions, not achieved community coverage. The application may record unsuccessful attempts, but the simulation does not estimate their frequency.

App alerts remain outside this routine simulation. No emergency benefit or clinical safety claim is calculated.

<!-- pagebreak -->

## 7 Assumptions experiments and metrics

### Initial scenario values

These values are engineering assumptions, not measured staffing or clinical standards. The completed runs freeze their own designs/manifests; changes require a new version rather than rewriting existing evidence.

| Parameter | Initial definition | Sensitivity requirement |
| --- | --- | --- |
| Demand | Poisson total arrivals with mean 4, 8 or 12 cases per day across the pilot | Test all three; no claim these are Tuguegarao births |
| Geography | Equal barangay assignment unless permitted population weights acquired | Compare equal versus population-proportional if available |
| Workers | One per station; two stations; 09:00–13:00 daily including weekends | Additional worker per station is an explicitly higher-resource secondary scenario |
| Handoff delay | A: uniform 12–48 hours; B/C: uniform 0–6 hours | Vary A to 6–24 and 24–72 hours; pair policies using the same uniform draws |
| Routine service | Fixed 30 minutes in base case | Test 15 and 60 minutes |
| Due time | Discharge plus 24, 48 or 72 hours, equal random shares | Test a uniform 48-hour deadline; order policies may then tie |
| Travel | Cached point-to-station estimate; base travel multiplier 1 | Test multipliers 0.5 and 2; show approximate method if used |
| Starting backlog | Zero in base case | Test one day of initial demand |

Due windows are synthetic administrative targets, not a prescription for different mothers. Their variation permits testing heterogeneous deadlines without inventing clinical risk labels. If road distances are unavailable, use haversine distance at an assumed 15 km/h, with a minimum five-minute one-way trip. Label this approximation and vary speed; do not call it measured driving time. Real road lengths still require assumed speeds and do not establish actual traffic conditions.

### Experiment plan

Generate cases, service times, locations and staffing before policy execution. Pair seeds across policies. Run 100 replications per configuration: first the three demand levels at base assumptions; then change one uncertain factor at a time across demand levels; finally combine high demand, long service and slow travel. Include abundant-capacity and zero-capacity checks. Freeze the configuration before selecting headline results.

### Completed analytical outputs

Model v1.0.0 and the original 30-configuration results remain in `simulation/results/v1/`. The factorial study in `simulation/results/factorial_v1/` contains 162 configurations × 100 paired replications × four policies = 64,800 policy runs. The coordinator serves an identical copy of its scenario summary at `web/public/scenario_summary.csv`; settings select one row without interpolation or live computation. Python result JSON/CSV files and manifests remain the reproducible evidence.

Across the stated grid, B−A mean differences are positive in all 162 configurations. C−B has 44 positive, three zero and seven negative means across 54 distinct settings; reference-delay settings repeat B/C outputs and are not independent evidence. Numerical signs are not statistical significance or probabilities of local benefit. See `simulation/reports/factorial_v1/FINDINGS.md` and `FINAL_ASSUMPTIONS_REVIEW.md` for assumptions and limitations. No model outputs were changed by the application workflow updates.

### Metrics and interpretation

- **Primary:** number completing contact by due_at divided by all introduced cases. Missed, late and never-served cases remain in the denominator.
- **Secondary:** start within 48 hours of discharge; completion within 72 hours of discharge; unserved fraction; median and 90th-percentile lateness among completed tasks, with unserved count alongside; worker busy minutes divided by available shift minutes.
- Report paired percentage-point differences B minus A and C minus B, with replication mean and central 95% simulation interval. This interval represents scenario randomness, not uncertainty about the real city. Show input sensitivity separately.
- Display descriptive coverage by near/far travel group. Do not imply that all barangays have enough cases for stable estimates or that this establishes fairness.
- Prefer the simplest policy with better supported coverage and no large hidden delay burden. If rankings reverse across plausible assumptions, state that no robust preferred policy was established. Higher workload, equal deadlines or abundant capacity may remove gains.

<!-- pagebreak -->

## 8 Architecture and data contracts

### Implemented application stack and data modes

The application root is `web/`. Runtime source uses **vanilla JavaScript (JS/JSX), React and Next.js App Router/Route Handlers**, with Tailwind CSS. Shared JavaScript modules provide runtime validation. Python runs offline; the browser reads precomputed simulation CSV. No Python inference service, live simulation endpoint or Leaflet runtime is needed.

`NEXT_PUBLIC_DATA_SOURCE=mock` uses browser-local storage, fictional seed records and cross-tab storage updates. It is scoped to that browser/origin and does not share updates across devices. `NEXT_PUBLIC_DATA_SOURCE=supabase` routes browser calls through API handlers to the Supabase PostgreSQL adapter; service credentials stay server-side. Staff role switching is a prototype identity mechanism, not production authentication. Do not claim that local tests prove full server-side authorization or deployed session isolation.

The SQL schema/migrations define sessions, stations/workers, cases, visits, requests, contact attempts and audit events. Migrations 002–003 add independent visit destinations/multiple appointments and exact-start uniqueness. Migrations 004–005 add atomic named assignment/acceptance and default pending workers. Migration 006 adds arrangement metadata and a responsible-owner transactional RPC. Apply 001–006 in order to a reviewed database before using all features in Supabase mode; recent migrations have not been applied remotely or integration-tested in this progress update. The stored model supports multiple appointments rather than one active first-follow-up row.

Mother access uses opaque case-scoped expiring links; a case ID is not an access token. Mock access/expiry tests pass. Do not describe the current implementation as a separately audited hashed-token authentication system. No real names, phone numbers, home addresses or medical symptoms are collected for this demonstration.

### Implemented endpoint and refresh contract

Routes include `/api/sessions/seed`, `/api/sessions/[id]/reset`, `/api/cases`, `/api/cases/[id]`, `/api/stations/[name]/cases`, `/api/workers` and `/api/workers/[name]/schedule`; case actions cover assign, acknowledge, arrange, visits, attempts and request acknowledgment. `/api/visits/[id]/outcome` records an individual visit outcome. Mother-token routes provide the case, simulated message and contact request; `/api/cases/[id]/link` provides its mother link. These are the current route paths, not the earlier proposed `/api/demo/*` or `/api/scenarios` endpoints. Browser-local reset is implemented; database-mode reset remains unavailable in the UI despite the existing server route.

Use timezone-aware ISO timestamps, shared JavaScript validation, pinned lockfiles and `.env.example` without secrets. New visits must be strictly in the future at actual save time, checked in the form, adapter and API. Exact-start collisions do not check travel time or visit duration. Facilitator list/profile and BHW Cases/profile/Schedule poll every five seconds while visible and refresh on focus/visibility/storage changes; each has manual Refresh and failure recovery. Mother views also update saved follow-up state across tabs.

Simulation cohorts use separate fictional IDs and versioned manifests. Changing a demo case never recalculates planning results. The core model uses Python's standard library; plotting dependencies are separate. No DHS respondent rows seed the app or simulation.

<!-- pagebreak -->

## 9 Original team assignments and schedule (historical plan)

The planning estimates and milestones below are retained as historical context, not current completion evidence. Use the October 24 checkpoint, Section 10 and team handoff for release status.

### Capacity and ownership

From October 18–23, the two design/frontend members can supply about 24–36 combined hours and the other three members about 54–72 combined hours: **78–108 hours before submission day**. Plan approximately 80 task-hours and treat additional time as contingency. October 24 capacity is reserved for fixes and submission. These are estimates, not guarantees; the team should replace A–E with names immediately.

| Owner | Responsibility | Planned hours through Oct 23 |
| --- | --- | ---: |
| A Design and mother frontend | Shared components, mother view, accessibility, demo visual QA | 12 |
| B Frontend integration | Hospital/BHW screens and coordinator layout | 12 |
| C Backend and deployment | Schema, endpoints, scope enforcement, seed/reset, hosting | 18 |
| D Simulation and metrics | Engine, experiment runs, tests, JSON outputs, charts | 18 |
| E Data and delivery coordination | Sources/geography, provenance, analytical review, integration checks, deck/video | 18 |
| Shared integration reserve | Small repairs across A–E; subtract elsewhere if capacity is tight | 2 |

The simulation has a dedicated owner. E supports data and review rather than leaving D to acquire every source. Design/frontend members work concurrently with data/backend; do not spend both members' first days exclusively in Figma.

### Milestones in Asia Manila time

| Date | Application milestone | Analytical and submission milestone |
| --- | --- | --- |
| Oct 18 | Shared payload, six-view skeleton, database and first hosted build | Freeze question, acquisition list, assumptions and owner names |
| Oct 19 | Saved discharge appears in scoped BHW queue | Pilot identifiers/points acquired or fallback declared; deterministic simulation works |
| Oct 20 | Acknowledgment, scheduling and mother link work end to end | Policies A/B/C run on shared cases; metrics verified by hand examples |
| Oct 21 | Contact request/outcome updates persist across views | Repeated runs and sensitivity outputs; sources and license manifest complete |
| Oct 22 | Dashboard wired to result JSON; feature freeze at 20:00 | Freeze inputs/results and write one defensible finding; no invented headline gain |
| Oct 23 | Test deployment, fix only blockers, verify replay/reset | Clean-environment rerun, deck complete, three-minute recording and backup |
| Oct 24 | Final smoke test and stable URL | Target upload by 18:00; verify links before stated 23:59 deadline |

If no persisted handoff exists by October 20 evening, remove P1 work and simplify layout. If no verified policy comparison exists by October 21 evening, all discretionary UI work stops until D and E deliver it. The project cannot pass release solely on a polished portal.

<!-- pagebreak -->

## 10 Verification and release quality

### Simulation verification

Verification establishes that the code follows the stated model. It does not validate the model against local operations; no clinical or workflow reviewer is available.

| Check | Expected behavior |
| --- | --- |
| No workers | No contacts complete; all cases remain in metrics denominator |
| Abundant capacity | Feasible tasks complete; different policies may tie |
| Identical configuration and seed | Same event sequence and metrics reproduce |
| Equal deadlines and receipt order | FIFO/EDF order agrees where applicable |
| Short versus long service | Busy time includes service and travel; no overlapping worker tasks |
| Shift boundary | A task whose complete trip cannot fit waits for a later shift |
| Delayed handoff | Contact never starts before the case becomes available |
| One case and two workers | Case assigned once and completed once |
| End of experiment | Unserved cases remain visible; no censored-denominator inflation |
| Pairing audit | Every policy receives the same exogenous cases, deadline assignments and capacities |

Hand-calculate at least two small queues with different deadlines and one overload case before running the experiment grid. Save expected outcomes as tests, not screenshots. Show both improvements and non-improvements; no test asserts that a preferred policy must always win.

### Application acceptance

The latest local validation passed 49 automated tests, the default production build and lint (one existing AppBar image warning). Tests cover timestamps, link isolation/expiry, discharge idempotency, named assignment/ownership, cross-tab persistence/reset, polling races/recovery, station visits, multiple appointments, translations, future scheduling and overdue arrangements. Browser checks verified discharge through correct BHW acceptance, scheduling, mother request, acknowledgment and contact logging, plus automatic/manual BHW updates. These are mock-mode checks, not a remote Supabase validation.

Remaining release acceptance: use a short scripted test or browser flow: create case; refresh; view at correct station; reject other-station access; acknowledge; schedule; open mother link; submit request; acknowledge; record attempt then successful contact; confirm facilitator updates and, once implemented, coordinator overview counts. Repeat the complete story twice with reset. Retain coverage for unmapped assignment, duplicate saves, expired links, empty/error states and independent workspaces. Future completion-time rejection is a known outstanding validation item, not a passed check. Verify database migrations/integration and the final hosted build separately.

Mother text must distinguish request recorded, request acknowledged, scheduled visit and completed contact. A failed write keeps entered values and offers retry. Never show a success state before the server confirms it.

### Release targets

The hosted demo should load the core view within about three seconds on the team's ordinary test connection after warm-up, and show a saved change in another view within ten seconds using polling. These are acceptance targets, not measured results. Verify on 360 px mobile and desktop widths. Core forms and scenario summaries must remain usable if map tiles fail; charts and tables must not require live external APIs.

No clinical diagnosis, emergency prioritization or real medical messaging is tested. The request panel is a demonstrator, not an emergency service. Real deployment requires institutional partners, workflow/clinical review, appropriate privacy/security work and evaluation beyond this hackathon.

<!-- pagebreak -->

## 11 Risks publication and fallback scope

### Risk register

| Risk | Owner and response | Decision cutoff |
| --- | --- | --- |
| Restricted data conflicts with primer | E excludes DHS from submitted pipeline and asks organizers about future restricted inputs | Core decision fixed now; no dependency on reply |
| No local workload evidence | D labels all staffing/demand/delay values as assumptions and tests sensitivity | Before Oct 20 experiment setup |
| Missing geography or population | E uses documented approximate points/equal demand; removes unsupported citywide claims | Oct 19 evening |
| Unverified facilities | E labels candidates; uses fictional stations if necessary; no clinical directions | Before demo seeding |
| EDF gains are trivial or absent | D reports tie/reversal and bottleneck conditions; keeps honest result | Oct 22 result freeze |
| AI-generated code mismatches contracts | C checks shared schema and E runs cross-view tests | Daily integration |
| Hosting/account failure | C deploys on Oct 18, tests again Oct 23; retains local run and recording backup | Oct 23 evening |
| Excess scope or design delay | A/B use existing components, defer extra screens and FIL/EN | Oct 20 progress gate |

### Public repository contract

Publish app and simulation source; pinned environments; setup and seed commands; permitted pilot data; independently synthetic cases; assumptions; test fixtures; results; limitations; data/source license notices; deck and video links. Use a separate attribution/license entry for each source. App code, PSA-derived files and OSM-derived database material do not automatically share one license.

Exclude restricted ZIPs and extracts, cached respondent data, row-level notebook output, secrets, real contacts and unreviewed artifacts derived from restricted data. The earlier local audit folder is not automatically approved for public release. Build the public package from an explicit allowlist rather than publishing the entire existing workspace. Scan the Git history and submission files, not only .gitignore. This is a packaging requirement; no files are deleted by this PRD.

The organizer question remains open. No answer is required to run the independent public-data core. If organizers later permit a restricted-data exception, separately verify DHS research purpose, AI processing and artifact-release terms. The user or organizer cannot waive a third-party restriction.

### Cut order and protected scope

Cut in this order: family/learning features already deferred; language toggle; map interactivity; export buttons; optional Policy D; live scenario computation already excluded. Preserve the mother view, persisted acknowledgment, contact outcome, A/B/C comparisons, repeated-run evidence, sensitivity, provenance and publication checks.

A static map plus interactive scenario tables is acceptable. A local recording is a backup, not equivalent to the hosted acceptance target. If a P0 requirement fails, disclose it and revise the submission claim; do not silently mark it implemented.

<!-- pagebreak -->

## 12 Submission evidence and decision log

### Evidence package

| Claim | Required supporting artifact |
| --- | --- |
| Handoff is functional | One persisted synthetic case, timestamps, acknowledgment and recorded outcome across views |
| A policy performs better under conditions | Paired results with identical inputs, replications, interval and sensitivity settings |
| Local geography grounds the demonstration | Source manifest, selected points, method and explicit geographic limits |
| Work is reproducible | Fresh setup followed by one command producing the documented result |
| Public sharing is permitted | File-specific attribution/license register and no restricted records in package/history |
| Prototype is feasible | Hosted URL, repeatable reset, passed acceptance checklist and known limitations |

### Presentation plan

Keep the PDF deck within the team's stated 20-slide limit and the video within three minutes; recheck the official primer before uploading. A suggested deck sequence is problem and careful public statistics; user/decision; scope changes; workflow; data and permissions; simulation logic; assumptions; verification; policy comparison; sensitivity/failure conditions; working demo; limitations; next steps; references. Use extra slides only where they add evidence.

For the video, allocate about 20 seconds to the question, 65 seconds to the connected handoff and mother view, 65 seconds to the scenario comparison and one honest finding, and 20 seconds to assumptions/limits and the conclusion. Aim for 170 seconds to leave margin. Never put a sample improvement number in the deck until its result file exists.

### Allowed and unsupported claims

Allowed after verification: “The prototype records assignment and acknowledgment”; “Under the stated simulation settings, policy C completed this share by the administrative deadline”; “Benefits were sensitive to workload and travel assumptions.”

Unsupported: “NDHS proves handoff failure”; “The city will improve coverage by X”; “Our model predicts clinical risk”; “The platform guarantees timely medical help”; “All Tuguegarao barangays are covered”; “Synthetic data validate real-world effectiveness.” Do not present the hypothetical baseline as current practice or a request-contact message as confirmed worker response.

### Decisions and remaining tasks

- **Approved by the team:** revised scope; predictive model deferred; hosted synthetic demo; selected stack; coordinator as primary decision-maker; minimal mother view; hackathon focus.
- **Implemented:** mother/facilitator/BHW workflows described above, four-policy simulation and 162-scenario planning view. JavaScript/JSX is the application language; Python is the offline analysis language.
- **Unresolved:** real local coordinator title, verified facility/catchment rules, local operational inputs, data acquisition and exact file terms, organizer response, clinical/workflow validation. These limit claims; they are not secretly assumed solved.
- **Next working session:** polish coordinator interpretation and assumptions, distinguish worse/tied results, add the separate operational overview if feasible, and align header controls. Then run the final four-perspective walkthrough, verify the hosted target/data mode, and finalize deck/video/repository evidence before the deadline. No coordinator polish is marked complete by this PRD update.

Release is accepted only when all P0 requirements pass, the evidence package can be reproduced, the submission contains no prohibited data, and the team can explain a result together with the conditions where it may fail.

<!-- pagebreak -->

## References and acquisition links

The numbered sources below are primary publisher or official documentation links checked on October 18, 2026. They are a research register, not proof of local dataset acquisition. Preserve exact edition, filename and retrieval details when files are downloaded. Publication and license terms apply separately.

### Public data and guidance

[1] Philippine Statistics Authority. (n.d.). PSGC barangays and downloadable publications. https://psa.gov.ph/classification/psgc/barangays

[2] Philippine Statistics Authority. (n.d.). PSGC classifications API. https://psa.gov.ph/classifications-api/psgc

[3] Philippine Statistics Authority. (n.d.). Census of population and housing report. https://psa.gov.ph/publication/census-population-and-housing-report

[4] Philippine Statistics Authority, Cordillera Administrative Region. (n.d.). 2022 National Demographic and Health Survey key indicators maternal care and child health. https://rssocar.psa.gov.ph/content/2022-national-demographic-and-health-survey-ndhs-key-indicators-maternal-care-and-child

[5] Philippine Statistics Authority. (n.d.). Terms of use. https://psa.gov.ph/terms-of-use

[6] OpenStreetMap contributors. (n.d.). Copyright and license. https://www.openstreetmap.org/copyright

[7] Geofabrik GmbH. (n.d.). Download OpenStreetMap data for Philippines. https://download.geofabrik.de/asia/philippines.html

[8] Department of Health, Health Facilities and Services Regulatory Bureau. (n.d.). Data management unit. https://sites.google.com/doh.gov.ph/hfsrbdata/

[9] World Health Organization. (2022). WHO recommendations on maternal and newborn care for a positive postnatal experience. https://www.who.int/publications/i/item/9789240045989

### Methods and implementation

[10] SimPy developers. (n.d.). SimPy overview. https://simpy.readthedocs.io/en/stable/

[11] Monks, T., Currie, C. S. M., Onggo, B. S., Robinson, S., Kunc, M., & Taylor, S. J. E. (2019). Strengthening the reporting of empirical simulation studies: Introducing the STRESS guidelines. Journal of Simulation, 13(1), 55–67. https://doi.org/10.1080/17477778.2018.1442155

Open author manuscript and reporting checklists: https://repository.lboro.ac.uk/articles/journal_contribution/Strengthening_the_reporting_of_empirical_simulation_studies_Introducing_the_STRESS_guidelines/9503495

[12] Vercel. (n.d.). Next.js route handlers. https://nextjs.org/docs/app/getting-started/route-handlers

[13] Supabase. (n.d.). Use Supabase with Next.js. https://supabase.com/docs/guides/getting-started/quickstarts/nextjs

[14] Leaflet contributors. (n.d.). Leaflet. https://leafletjs.com/

[15] Supabase. (n.d.). Row level security. https://supabase.com/docs/guides/database/postgres/row-level-security

### Team materials and interpretation

Team BAIthropic. (2026). InaAlaga initial proposal; mother and family transfer notes; PJDSC minutes; brainstorm playbook; supplied statistical workbook; DHS authorization excerpt; and competition primer excerpt. Internal project references supplied in this conversation. The playbook's past-winner descriptions are reference notes, not independently verified reasons for winning. The primer excerpt governs submitted-work publication expectations but cannot override source-data restrictions.

The earlier feasibility audit is an internal methodological decision record. Restricted microdata and respondent-derived artifacts are not bundled into the core deliverable. References to public aggregate indicators must be checked against the publisher's exact table and footnotes before presentation.
