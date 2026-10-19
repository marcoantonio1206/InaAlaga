# Figma export alignment review

**October 19 update:** This remains a historical review of the old exports. PRD v1.1 Section 3 now records the newer Home/Visits proposals, compact shared follow-up card, expandable visit history, preferred schedule request proposal and conditional station/routing design. It supersedes the blanket single-page/navigation recommendation below. Distance/time may be designed as explicitly illustrative route estimates, subject to a routing provider/origin/mode and location review; simulation assumptions are not mother-facing measured journeys. Final tabs and extensions remain unresolved, and no updated native Figma or app implementation is claimed.

Reviewed October 18, 2026 against the confirmed assumptions review and PRD. Input: user-supplied `InaAlaga.zip`, containing 22 PNG exports, including language/state variants and two small frame fragments. Family-member features are excluded from this assessment. Screenshots show visual content, not prototype navigation, persistence, permissions, or code. Missing below means not present in this export, not proof it does not exist elsewhere in Figma.

## Verdict

The visual identity is reusable. The exported product flow is only partly aligned and should not be implemented unchanged. It centers on mother/baby symptom reporting, emergency guidance, and nearby-facility navigation. The approved product centers on a persisted discharge-to-station handoff, worker acknowledgment, scheduling/contact outcomes, a minimal mother view, and a coordinator's separate operational/simulation views. Removing family features alone will not resolve that mismatch.

## Frame-by-frame decisions

| Export evidence | Assessment | Recommended action |
| --- | --- | --- |
| Entry screens, home, forms | Purple/lilac palette, rounded cards, buttons, language toggle and mobile layout can carry over. | Reuse components and visual direction. Language toggle is optional release scope; unfinished translation should not block the core workflow. |
| Home mother, English/Filipino | Main action is scheduled symptom check-in; the revised main mother page should communicate handoff and visit status. | Put assigned demo station, pending/accepted responsibility, confirmed visit and contact-request status first. Replace check-in with the nonclinical “Please contact me” action. |
| Home “Visit the station” | Appointment card is useful, but automatically directing the mother to a station does not match the modeled home follow-up. | Show the visit actually scheduled by the worker, its date/time and location type. Initial routine demo can show home follow-up; do not fabricate a confirmed appointment before scheduling. |
| Home “Closest station”, 200 m, map | Nearest facility and precise household distance are not established for the mother. | Prefer “Assigned demonstration station.” Keep any map schematic/source-labeled; no live GPS, confirmed entrances, measured journeys or official catchment claims. Simulation travel estimates stay in the planning context. |
| You/EN and You/FIL symptom lists; Baby variants | Symptom collection and urgency-oriented path are outside approved scope. Existing screenshots do not prove a classifier exists, but the flow implies clinical assessment. | Archive these screens for a later reviewed product. Do not wire symptom selections to urgency, risk labels, or medical instructions. Use a simple saved contact request in this release. |
| “Something else” free-text field | Invites medical details not needed by the approved fictional contact-request flow. | Omit it from the initial build. A nonclinical request needs no symptom description. |
| Higher risk “Go to the hospital now” | Clinical escalation screen conflicts with deferred automated triage and lack of clinical workflow review. | Remove from the submission flow. Merely adding “NEEDS REVIEW” does not make this part of the approved release. |
| Sent “Your health worker has been notified” | Sending/saving does not establish receipt, worker acknowledgment or response. Real messaging is deferred. | Immediately show “Request recorded in this demonstration.” Show “Request acknowledged” only after a saved worker action. Preserve errors/retry; never show success after a failed save. |
| Emergency/call/directions buttons | Live calls, emergency destination routing and validated journey times are not part of this synthetic demonstration. | Exclude active call/direction actions from the core demo; do not imply a live monitored service. This review does not assess whether the clinical wording or phone guidance is medically correct. |
| Consent/privacy sheet | Claims collection of check-in answers and user rights/controls that do not yet correspond to the revised prototype. | Write accurate fictional-demo data wording and describe only implemented access/controls. A consent sheet is not evidence of privacy compliance or production authorization. |
| Four-tab mother navigation | Home/calendar/map/other affordances imply more mother-app scope than required. | Consolidate status, confirmed visit and contact request into one mobile page. Keep additional navigation only if it leads to implemented, in-scope content. |
| “Why follow up?” expandable area | Small explanatory text can be retained, but a broad learning library is deferred. | Optional short project explanation; avoid expanding it into unreviewed medical advice. |

## Required views absent from the export

1. Demo role launcher and simulated SMS inbox, with fictional-data labeling and a scoped mother link.
2. Hospital discharge form and confirmation: fictional alias, barangay, birth/discharge times, explicit administrative demo deadline with no prefilled 48-hour default; show suggested station or an unassigned exception.
3. BHW station inbox: pending/accepted responsibility, due time, administrative ordering reason and case detail.
4. BHW detail: accept responsibility, schedule, acknowledge contact request, record unsuccessful attempt or successful contact as separate actions. Station correction is logged and allowed before acknowledgment; acknowledged reassignment is outside the first build.
5. Coordinator operations view: persisted pending, acknowledged, scheduled, attempted/completed and unassigned records; no simulation counts mixed in.
6. Coordinator planning view: versioned scenario selector, A/B/C/D comparisons, paired differences/replication ranges, workload, failures/ties, assumptions, travel/geography limitations and source attribution. Results remain conditional; no universal best-policy claim.

The mother page must also show states not currently demonstrated in these exports: awaiting acknowledgment, worker accepted, no visit scheduled, confirmed visit, request recorded, request acknowledged, attempted/not reached, completed, and administrative overdue. These states should follow saved events rather than static labels. No clinical urgency is inferred from the queue deadline.

## Practical revision order

Preserve the design system; replace the home page's content hierarchy with handoff/visit/request cards. Design the hospital form, station inbox and acknowledgment detail next, then complete the mother/contact-outcome story and coordinator views. Archive the symptom/emergency flows rather than investing in their translations. Make a fictional record traceable across every role before polishing optional screens.

A suitable mother-page structure is: “Fictional demonstration” label; assigned demonstration station; responsibility status; next confirmed visit or no visit scheduled; “Please contact me”; request acknowledgment state; latest contact outcome. Render only the seeded case alias and schedule, with no implied real service availability.

Basis: `docs/FINAL_ASSUMPTIONS_REVIEW.md` and `docs/InaAlaga_PRD.md`, plus inspected PNG exports. No original images, PRD, simulation settings or Figma design were modified. This review is saved locally and has not been uploaded to GitHub.
