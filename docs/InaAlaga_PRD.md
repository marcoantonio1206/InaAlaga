# InaAlaga Product Requirements Document

## Hackathon prototype and simulation plan

Version 1.1 | Prepared October 18, 2026 | UI revision October 19, 2026 | Team BAIthropic, UPLB

**Revision status:** Section 3 records the current mother UI/UX direction and proposed extensions discussed on October 19. This is a design specification, not implemented functionality or an updated Figma file. The simulation is implemented; the app remains unbuilt. For later evidence and approved operational assumptions, read `FINAL_ASSUMPTIONS_REVIEW.md` alongside the historical research sections below. The Markdown PRD is current; the existing DOCX is the earlier version and has not been regenerated.

**Delivery target:** hosted demonstration and submission by October 24, 2026, 11:59 PM Asia/Manila, subject to the official primer. Application requirements specify work still to build and verify; the simulation is implemented as documented in the later assumptions review.

InaAlaga will demonstrate how hospital discharge records can reach a barangay health team, acquire a responsible worker, and lead to a recorded follow-up. A separate simulation will help a proposed city maternal-health coordinator compare handoff and scheduling policies under limited worker capacity. Every patient and worker record in the public demonstration will be fictional.

The release will prioritize a reproducible analytical comparison and one complete handoff. The mother view remains essential, but family management, broad educational content, automated medical triage, and predictive scoring are deferred. The team has approved the revised direction and the Next.js, TypeScript, Supabase, and offline Python stack. Detailed defaults in this PRD are proposed implementation choices, not confirmed local practice.

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

The mother application prioritizes a compact Home page and a distinct Visits design for schedules/history. A station/map view and secondary settings remain under design review; the original four tabs are not automatically removed or retained. Section 3 distinguishes the required single-follow-up flow from proposed multi-visit and schedule-change extensions. The dashboard remains the analytical centerpiece. The BHW queue explains administrative order, not medical risk. Reusable Figma components are retained; the connected story takes priority over optional screens.

<!-- pagebreak -->

## 2 Users and the complete handoff

### User responsibilities

| User | Can do | Boundary |
| --- | --- | --- |
| Hospital discharge staff | Create a fictional discharge and review assigned station | Cannot claim a worker accepted it |
| BHW | View assigned cases, acknowledge, schedule and record outcomes | No clinical diagnosis or automated treatment |
| Mother | Read her status, see confirmed visit and request contact | Cannot mark a worker contact complete |
| Coordinator | Review workload and compare simulated policies | Scenario results do not change real services |

### Demonstration story

1. Staff open a seeded demo workspace and enter a fictional alias, barangay, birth time, discharge time and follow-up due time. The form rejects discharge before birth and a due time before discharge.
2. A saved barangay-to-station lookup assigns an eligible demo station. Confirmation says “Assigned to [station], awaiting acknowledgment.” If the lookup fails, the record is visibly unassigned for coordinator action; the system does not invent a destination.
3. The BHW inbox displays that same case. A worker acknowledges it, storing worker ID and server timestamp. Only then may the mother see “Your health worker has accepted the follow-up.”
4. The worker schedules a home follow-up. The mother opens her scoped demo link from a simulated SMS inbox and sees the date, location type and worker status. Scheduling alone does not mean contact occurred.
5. The mother submits “Please contact me.” The application saves a contact request, displays “Request recorded in this demonstration,” and exposes it to the BHW. It never says that someone has read it before acknowledgment.
6. The worker acknowledges the request, then records a contact outcome. A successful contact updates the mother view and the operational dashboard. An unsuccessful attempt remains distinct from success.
7. The presenter switches to planning results and compares policies on identical fictional demand. A scenario change selects another precomputed result with its assumptions displayed.

### States and clocks

Store handoff, appointment, contact request and contact outcome as separate states. Handoff is unassigned, pending or acknowledged. Visit is unscheduled, scheduled, attempted, completed or cancelled. Requests are open or acknowledged. “Overdue” is derived from current time, due_at and absence of successful contact; it is not a replacement for those states.

Record birth_at, discharge_at, routed_at, acknowledged_at, scheduled_for, contact_started_at and contact_completed_at separately. Store UTC timestamps; display Asia/Manila. Deadline-based queue order uses due_at, never the mother's survey-derived risk. The synthetic demo clock is explicit and separate from audit timestamps.

<!-- pagebreak -->

## 3 Functional requirements and acceptance criteria

P0 means required for the submission. P1 is added only after the core flow and simulation pass. Owners A–E are defined in Section 9.

| ID | Priority and owner | Requirement and acceptance test |
| --- | --- | --- |
| H01 | P0 C | Discharge creation persists a case and assignment event. Refresh retains it; double submission with the same idempotency key produces one case. |
| H02 | P0 C | Missing or ambiguous routing remains unassigned. A seeded unmapped barangay produces a visible exception, not a false success. |
| W01 | P0 B and C | BHW queue shows only the authorized station's cases, acknowledgment status, due time and ordering reason. Cross-station requests are rejected server-side. |
| W02 | P0 C | Acknowledgment sets one owner and a server timestamp. Repeated acknowledgment does not duplicate events or silently replace the owner. |
| W03 | P0 B and C | Scheduling, attempt and completion are distinct actions. Completion requires an outcome and cannot precede discharge or contact start. |
| M01 | P0 A and C | Mother link returns only its case. A different case ID or expired token does not reveal another record. |
| M02 | P0 A | Mother page shows pending, acknowledged, scheduled, overdue and completed states with words and icons. A request-contact action is separate from visit completion. |
| R01 | P0 C | Contact requests persist and become visible to the assigned BHW on refresh/poll. Notification-delivery claims are never generated by a database write alone. |
| D01 | P0 B and D | Operational cards use stored demo events. Simulation cards use precomputed outputs with a visible simulation label. Their numbers never mix. |
| D02 | P0 D and E | A scenario selector updates every result, assumptions and comparison chart from one scenario ID. Missing combinations show unavailable; no fabricated interpolation. |
| D03 | P0 A and D | A map or schematic shows selected barangays and stations, source date and attribution. Labels state pilot coverage and any geographic approximation. |
| S01 | P0 D | A documented command regenerates a fixed-seed scenario result; policy changes do not regenerate exogenous demand or staff capacity. |
| Q01 | P0 E | Authorized demo reset restores a known state without deleting another session. The complete story passes in two separate browser sessions. |

### Screens and interaction

Core views remain the demo launcher/SMS inbox, hospital form/confirmation, BHW queue/detail, mother experience, and coordinator operations/planning. The mother experience now has a Home/Visits design direction rather than a fixed one-screen restriction. Desktop views target 1280 px; mother/BHW views must work at 360 px. Frontend work starts from agreed fields, not final Figma completion.

P1 items include reviewed FIL/EN strings, station-versus-home visit selection, map pin highlighting and CSV scenario export. Plain English remains a release fallback. Additional UI proposals below do not silently expand P0 or change the first-home-follow-up simulation.

### Figma and mother UI progress — October 19

The old exports and PJDSC minutes are historical design references. The October 18 alignment review remains useful evidence of those exports; this section supersedes its blanket recommendation to consolidate everything into one page. Current progress consists of reviewed content hierarchy, text wireframes, and interaction/state proposals. No app, updated native Figma frames, live map routing, or multi-visit persistence is claimed complete.

| Status | Direction |
| --- | --- |
| Agreed direction | Fictional coordination prototype; purple/lilac identity and rounded cards; no family features; replace symptom/SOS flow with “Please contact me”; distinguish recorded requests from worker acknowledgment. |
| Current Home layout direction | Shared follow-up card connects responsible worker, assigned demo station and scheduled visit. Expandable explanation belongs inside that card; essential status/schedule remain visible. |
| Current design proposal | Visits page with upcoming/later/previous records, expanded details and state variants. Mother preference submission is recommended but requires new saved request/review behavior. |
| Still unresolved | Final bottom-tab count/names; permanent Station/Map tab versus contextual screen; exact future-visit coverage; routing provider, origin and travel mode; reschedule/cancellation implementation priority. |

### Mother Home

Use a compact header with InaAlaga, FIL/EN selected state, and a small “Fictional demo” label. Greeting example: “Good morning, Maria!” Example alias, worker and dates are fictional seed content, not hardcoded status.

One rounded “Your follow-up” card contains:

- Responsibility: “Ana has accepted your follow-up” with “Demo worker.” Render acceptance only after the worker's saved action. Before that, use “Awaiting worker acceptance.”
- “Assigned demo station” and “Tanza BHS.” This is the responsible demonstration station, not automatically the visit destination or a claim about an actual worker's employer.
- A divider followed by “Scheduled visit,” type, date/time and location. Example: “Home follow-up · Oct 19, 9:00 AM · Your home.” Show the scheduled visitor only when recorded; case ownership does not prove who will visit.
- “How your follow-up works” disclosure at the bottom, collapsed by default. Suggested expanded copy: “Your assigned worker coordinates your follow-up. Scheduled visit details appear above. ‘Please contact me’ records a request; acknowledgment appears after the worker accepts the request. This fictional demo is not monitored for emergencies.”

“Scheduled visit” replaces the ambiguous “Next confirmed visit”; a saved worker schedule does not imply the mother separately confirmed it. Before scheduling, say “No visit scheduled yet.” The status and next visit are static/readable, not hidden behind card expansion. The contact button sits directly below the shared card.

```text
InaAlaga                         FIL / [EN]
Fictional demo
Good morning, Maria!
+----------------------------------------+
| YOUR FOLLOW-UP                         |
| Ana has accepted your follow-up        |
| Demo worker                           |
| Assigned demo station: Tanza BHS        |
| -------------------------------------- |
| SCHEDULED VISIT                        |
| Home follow-up · Oct 19, 9:00 AM        |
| Your home                             |
| -------------------------------------- |
| How your follow-up works             v |
+----------------------------------------+
[             Please contact me          ]
```

### Visits page and expandable records

Home answers “What happens next?” Visits answers “What is scheduled and what happened previously?” A separate Visits destination is useful when multiple saved records exist; do not invent a history to fill the screen. The existing P0 flow still requires only one scheduled follow-up. Multiple appointments and their history are proposed app extensions, not simulated long-term care.

Order: page title; next scheduled visit expanded; later visits as compact expandable rows; previous records as compact expandable rows; contact updates when present; one shared contact action/status. Do not add a calendar grid or filters initially.

| Record | Always visible | Expanded details |
| --- | --- | --- |
| Next scheduled | Type, date/time, location and recorded visitor | Essential details already visible; proposed “Request a different time” entry point |
| Later scheduled | Date/time, type/location summary, “Scheduled,” “View details” | Full location, recorded visitor, conditional station-location link, proposed change-request entry point, “Hide details” |
| Previous completed | Date, type, “Completed,” “View details” | Scheduled time/location, recorded worker, completion-recorded timestamp explicitly labeled as an audit event rather than actual ending time |
| Previous cancelled | Date, type, “Cancelled” | Cancellation-recorded time, mother-appropriate saved reason if present, replacement schedule status |

Home visits say “Your home” and have no station-route action. Station visits, if enabled, name the actual scheduled destination and offer “View station location.” Do not assume the assigned worker is the scheduled visitor. No clinical results or symptom assessment fields are added.

### Mother state coverage for Figma

Design reusable variants, not disconnected static screens. A failed save must never show success. Persistence, refresh and cross-role behavior still require implementation tests.

| State | Mother-facing behavior |
| --- | --- |
| Pending responsibility | “Awaiting worker acceptance”; assigned station if known; no invented owner |
| Unassigned | “Demo station not assigned yet”; no fabricated station/route |
| No scheduled visit | “No visit scheduled yet. Your schedule will appear here when your worker adds a visit.” |
| No later/previous records | “No other visits scheduled” / “No completed visits yet,” adjusted if cancelled history exists |
| Request saving | “Saving request…”; prevent duplicate submission |
| Request saved | “Request recorded · Awaiting acknowledgment” |
| Request acknowledged | “Request acknowledged,” with saved acknowledging worker; not “contacted” or “resolved” |
| Request save failure | “Couldn’t save your request” with Retry; preserve entered preference if applicable |
| Contact attempted, not reached | Separate Contact updates entry with time and recorded worker. It does not automatically complete, cancel or mark a scheduled visit missed. |
| Scheduled time passed, outcome absent | “Awaiting visit update”; do not automatically infer completion, a missed visit or clinical urgency |
| Completed | Only after saved worker completion; recording timestamp distinct from event time |
| Rescheduled — proposed | Current schedule prominent; previous date/time in expanded details; retain change history |
| Cancelled — proposed | Retain cancelled record; show no upcoming visit if no replacement exists; do not silently remove it |
| Loading / read failure | Loading indicator; “Couldn’t load visits” and Retry, distinct from a genuine empty schedule |

“Please contact me” is prominent on Home and proposed on Visits, with one shared saved state across destinations. Do not duplicate pending requests when switching tabs. Omit the persistent SOS-style action from Station/Map and Settings. Eligibility for a new request after acknowledgment remains to be specified; acknowledgment alone is not resolution.

### Preferred schedule request — proposed extension

Recommended visit action: “Request a different time.” Open a bottom sheet showing the current visit, preferred date, and Morning/Afternoon/Any time. Prefer a broad time preference over an exact slot picker until worker availability exists. Provide “Send request” and a dismiss action.

Copy: “Your worker will review this. Your current visit stays scheduled until a change is confirmed.” After saving: “Change requested · Preferred: Oct 20, afternoon · Awaiting worker review.” A request is neither a booking nor proof that the worker read it. Acknowledgment, acceptance of the preferred time and the actual schedule update are separate events.

This supersedes the earlier suggestion to use a generic contact request for every schedule change, if this extension is selected. It requires a visit-linked request type, preferred date/time period, status/audit history, station-scoped worker review and a visible outcome for the mother. The worker must be able to retain the existing schedule or arrange another time; do not silently accept a preference. Define request editing, duplicates, date validation and competing worker updates before implementation. Without this extension, explain that “Please contact me” can be used to discuss the visit and that the schedule remains unchanged. Neither approach is implemented yet.

### Station and map design

Preserve the useful intent of the original Maps design: understand the assigned station and, where relevant, locate the scheduled destination. Keep distance/time in Figma as a proposed useful feature, not as established live functionality. Remove the old emergency-destination card and symptom/SOS action from this release.

- Label “Assigned demo station,” not “Closest station” or automatically “For your visits.” For a home visit, explicitly state the visit is at home; station travel is secondary reference information.
- A contextual link may open a focused station screen with Back. A permanent Map/Station tab remains unresolved; do not add/remove tabs merely to fill space.
- Leaflet is the planned optional map display library, not a selected routing provider. Route distance/time needs a separately selected service, named origin/destination and travel mode. No live GPS is authorized by this revision.
- Use independently fictional home coordinates if demonstrating a household route. Barangay reference points are not homes. Figma values such as “1.2 km · About 10 min” must be annotated as illustrative; runtime values must identify their route source/mode and estimation basis. Display “Route unavailable” when needed.
- Keep mother-facing route estimates separate from the frozen simulation travel assumptions. Routing APIs do not establish official catchments, referral acceptance or verified entrances. Tanza's supported reference location is not a verified entrance; Linao West remains approximate.
- Schematic views must say “Illustration only · Not a real map,” avoid an implied known user position, and not pair fabricated measured journeys with active-looking route/call controls. Implemented map views need attribution and uncertainty labels. Phone and external route actions require reviewed destinations/contact details.

### Navigation, visual system and remaining design work

Original tabs were Home, Visits, Health center and More. Home/Visits now have distinct proposed purposes; Station can be contextual or a tab. More is justified only by useful supported secondary content. Settings may instead open from the header. Final tab count is not agreed. Retain visible text labels for any tabs.

Use purple/lilac branding, rounded mobile cards and concise natural language. Start with 16 px side margins/card padding and 12–16 px section gaps, readable 16 px body text and large touch targets. Avoid fixed-height empty cards or large decorative gaps. Some unused space below content is acceptable; adding screens to fill a viewport is not a requirement. Verify at actual mobile size, including expanded cards, longer Filipino strings and enlarged text. Status meaning uses words/icons, never color alone; no clinical severity palette. Language selection must be visually clear. Family controls, symptom forms, learning library and live-SMS promises remain excluded.

Next Figma work: create Home accepted/pending/unassigned variants; Visits default/expanded/empty/history/change/error variants; shared request-state components; proposed preference sheet and worker review counterpart; station/map alternatives with illustrative route annotations. Review navigation after these screens have meaningful content. All UI completion and application acceptance checks remain pending until actual artifacts and persisted behavior are verified.

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

Use barangay reference points, not real homes. If a reference point is an approximate settlement point, label it as such; do not call it a population-weighted centroid. Candidate station assignment uses the shortest available estimated journey to an eligible station. Store the assignment reason and allow a coordinator override with an audit event. The assignment is a demo suggestion, not a replacement for local jurisdiction rules.

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

Use Python with NumPy and pandas; a standard-library heap event queue is sufficient. SimPy [10] is optional if it simplifies the implementation. Publish the algorithm and assumptions using the STRESS-DES reporting principles [11]. A cited framework does not validate local assumptions.

### Core policy comparisons

| Policy | Handoff delay | Routine queue order |
| --- | --- | --- |
| A Reference workflow | Assumed delayed handoff | First received first served |
| B Faster handoff | Assumed shorter handoff | First received first served |
| C Faster handoff and deadlines | Same shorter handoff as B | Earliest due time first |

Add Policy D, reference delay with deadline ordering, as a low-cost diagnostic using the same engine if ready by October 21. It completes a two-by-two comparison but is not required for the UI. Policy A is a hypothetical comparator, never asserted to be observed Tuguegarao practice.

### Time and queue rules

Use minutes from simulation start. Cases become available at discharge plus policy-specific handoff delay. Model acknowledgment as part of that delay, not an additional unmeasured capacity benefit. Each station has a fixed worker pool and shift calendar shared across policies. At shift start, handoff arrival or task completion, an idle worker selects from available cases at its station.

Ties use receipt time then case ID. Tasks are non-preemptive. A home task consumes outbound travel, contact duration and return travel; the worker is unavailable for the whole interval. Contact is recorded complete at the end of service, before the return leg. Permit a start only if the entire trip fits the shift. Prevent overlapping tasks and count a case once.

Use 14 days of new cases and 7 additional days to drain the queue. Within each day, distribute the sampled arrivals uniformly across 24 hours. Score every case introduced during the 14-day window, including never-served cases. Report any unfinished tasks at the end. This is a terminating experiment starting empty, not a steady-state city forecast; test initial backlog separately.

Assume every serviced task successfully reaches the mother. No-shows, refusal, patient availability and clinical deterioration are not modeled. Results therefore describe capacity under successful-contact assumptions, not achieved community coverage. The application may record unsuccessful attempts, but the simulation does not estimate their frequency.

App alerts remain outside this routine simulation. No emergency benefit or clinical safety claim is calculated.

<!-- pagebreak -->

## 7 Assumptions experiments and metrics

### Initial scenario values

All numeric values here are proposed engineering assumptions for stress testing, not measured staffing or clinical standards. D may revise them after documenting reasons, before final comparisons are run.

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

### Metrics and interpretation

- **Primary:** number completing contact by due_at divided by all introduced cases. Missed, late and never-served cases remain in the denominator.
- **Secondary:** start within 48 hours of discharge; completion within 72 hours of discharge; unserved fraction; median and 90th-percentile lateness among completed tasks, with unserved count alongside; worker busy minutes divided by available shift minutes.
- Report paired percentage-point differences B minus A and C minus B, with replication mean and central 95% simulation interval. This interval represents scenario randomness, not uncertainty about the real city. Show input sensitivity separately.
- Display descriptive coverage by near/far travel group. Do not imply that all barangays have enough cases for stable estimates or that this establishes fairness.
- Prefer the simplest policy with better supported coverage and no large hidden delay burden. If rankings reverse across plausible assumptions, state that no robust preferred policy was established. Higher workload, equal deadlines or abundant capacity may remove gains.

<!-- pagebreak -->

## 8 Architecture and data contracts

### Small deployment architecture

Use one Next.js application with TypeScript, Tailwind CSS and Route Handlers [12]. Supabase PostgreSQL stores demo cases and events [13]. Deploy the web app to a compatible hosting service such as Vercel; confirm account access and current limits on October 18. Python runs offline and exports versioned JSON; no Python inference server or live simulation API is required. Leaflet [14] can display the small pilot map.

Frontend views call server endpoints, which validate a session's role and record/station scope before database access. Supabase service credentials remain server-only; public database reads/writes are blocked by default [15]. A visible role selector creates a scoped demo session, not a production identity system. Every input says fictional data only. Do not collect actual phone numbers, addresses or symptoms.

### Minimum database entities

| Entity | Key fields and constraints |
| --- | --- |
| demo_sessions | UUID, created_at, expires_at; all mutable demo rows scoped to session |
| stations and barangays | IDs, sources, verification status, reference points; assignment lookup version |
| cases | ID, session, alias, barangay, birth_at, discharge_at, due_at, station, owner; valid timestamp ordering |
| followups | Case ID, state, scheduled_for, start, completion, outcome, worker; one active first-follow-up task |
| contact_requests | Case ID, created_at, acknowledged_at, worker; no free-text medical advice |
| events | Session, case, event type, actor role/ID, server time, before/after status; append-only through endpoints |
| access_tokens | Hashed random token, session, case scope, role, expiry; reject invalid or expired token |

Simulation files use separate fictional cohort IDs and a result manifest. Changing a demo case never silently recalculates planning results. The UI explains that planning uses an independently generated cohort. No database table is seeded from DHS respondent rows.

### Minimal endpoint contract

POST /api/demo/session creates an expiring workspace. POST /api/cases creates a routed or unassigned case. GET /api/cases and GET /api/cases/[id] enforce scope. POST actions acknowledge, schedule, record contact, submit request and acknowledge request. POST /api/demo/reset is restricted to its workspace. GET /api/scenarios returns versioned public result JSON. Every write requires validation, session scope and an idempotency key where retries could duplicate records.

Use ISO timestamps and a shared TypeScript schema. Pin dependencies and include .env.example without secrets. Poll updates every five seconds or use manual refresh; realtime subscriptions are optional. Backend and frontend developers agree one example payload on October 18 before building independent screens.

<!-- pagebreak -->

## 9 Team assignments and schedule

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

Use a short scripted test or Playwright flow: create case; refresh; view at correct station; reject other-station access; acknowledge; schedule; open mother link; submit request; acknowledge; record attempt then successful contact; confirm dashboard counts. Repeat the complete story twice with reset. Test an unmapped barangay, duplicate submit, expired link, future completion timestamp, empty state, failed save and two independent workspaces.

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
- **Specified in this PRD:** first routine home-follow-up simulation, bounded pilot, three policies, engineering defaults, team roles and acceptance criteria. These require implementation and ordinary team review, not renewed permission for routine work.
- **Unresolved:** real local coordinator title, verified facility/catchment rules, local operational inputs, data acquisition and exact file terms, organizer response, clinical/workflow validation. These limit claims; they are not secretly assumed solved.
- **Next working session:** assign A–E; create the payload/schema and hosted skeleton; acquire small public pilot inputs; implement the deterministic event queue; update the proposal and Figma scope to this document.

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
