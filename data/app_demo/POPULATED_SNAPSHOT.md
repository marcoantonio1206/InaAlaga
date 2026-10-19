# Populated app snapshot for later demonstration

`seed_populated_v1.json` contains 20 independently fictional mother records, two demo stations and four fictional workers. It is an alternative to `seed_v1.json`, not an additional batch to append. The app is not yet wired to either dataset. Do not automatically switch profiles on a calendar date.

## Workers and states

| Demo station | Fictional workers |
| --- | --- |
| Tanza BHS | Ana, Carlo |
| Linao West BHS | Bea, Dina |

Initial snapshot counts:

- 14 accepted handoffs, four pending acceptance, two unassigned.
- Five upcoming home follow-ups, four completed home follow-ups, two unsuccessful attempts. Three accepted cases have no visit scheduled.
- Four contact requests: two awaiting acknowledgment, two acknowledged. An acknowledged request does not establish completed contact.
- 83 matching fictional history events.

Counts overlap across entities: a scheduled visit is associated with an accepted handoff; contact requests are separate records. These counts describe an authored app snapshot, not observed demand, outcomes, recommended staffing or evidence of effectiveness. They do not modify the scheduling simulation, its workers, or its results. All visits use the existing home-follow-up scope; station visits, cancellation, multiple visits per case and preferred-schedule requests are not seeded as implemented features.

## Key cases to inspect

| Case | Mother | Scenario |
| --- | --- | --- |
| IA-0042 | Maria Santos | Ana has accepted; future home visit; contact request recorded and awaiting acknowledgment. Useful for finishing the request-acknowledgment story. |
| IA-0043 | Rosa Dela Cruz | Accepted at Tanza; no visit yet. |
| IA-0044 | Grace Villanueva | Scheduled at Linao West; contact request acknowledged, without completed contact. |
| IA-0045 | Liza Mercado | Accepted at Linao West; unsuccessful home-follow-up attempt; no completion. |
| IA-0046 | Angelica Bautista | Completed home follow-up at Linao West. |
| IA-0047 | Demo Mother 08 | Unassigned lookup exception. |
| IA-0048 | Camille Navarro | Pending worker acceptance. |
| IA-0049 | Isabel Mendoza | Scheduled home follow-up; open contact request. |
| IA-0050 | Patricia Ramos | Completed home follow-up. |
| IA-0051 | Elena Castillo | Unsuccessful home-follow-up attempt. |
| IA-0052 | Sofia Garcia | Accepted; no visit yet. |
| IA-0053 | Teresa Aquino | Pending worker acceptance. |
| IA-0054 | Mikaela Flores | Scheduled home follow-up; acknowledged contact request. |
| IA-0055 | Nina Soriano | Completed home follow-up. |
| IA-0056 | Andrea Valdez | Accepted; no visit yet. |
| IA-0057 | Julia Fernandez | Pending worker acceptance. |
| IA-0058 | Lea Domingo | Scheduled home follow-up. |
| IA-0059 | Clara Reyes | Completed home follow-up. |
| IA-0060 | Diana Cruz | Pending worker acceptance. |
| IA-0061 | Mara Santiago | Unassigned lookup exception. |

Names and event times were authored for a fictional demonstration. No baby names, real contact details, household coordinates, symptom answers, clinical risk labels or access credentials are included. Geographic names and assignments use the same canonical pilot lookup and source notices as the clean seed; see `README.md` for provenance.

## Time and history

The frozen clock is **October 19, 2026, 12:00 PM Philippine time** (`2026-10-19T04:00:00Z`). This remains the snapshot time even when presenting on October 24 or later. Show a demo-clock label. Upcoming visits and overdue administrative targets must be derived against that clock, not silently against the present date. A visit scheduled after its administrative target is possible in these fictional examples; it is not automatically completed or clinically urgent. A real-time-clock mode would yield different states.

The first six aliases, case IDs, locations and discharge/target fields are retained from the clean seed. Their accepted/visit/request states are intentionally advanced in this profile. IA-0047 stays unassigned. Use a fresh profile-specific session when switching; do not merge states by case ID across sessions.

`fixture_events` contains explicit actor, case, event type, fictional occurrence time and related record IDs. They are labeled `fixture_only: true`. They are not authentic server audit records. `demo_scenarios` is a developer guide, not a status field for the app to blindly display. Render statuses from the linked records/history instead.

When imported, record the actual server-time import event separately; preserve fictional occurrence times as fixture history. Subsequent user actions require server-generated audit timestamps and normal scope checks. The importer must retain matching case, follow-up, request, outcome and event references, scope mutable data by session, and be idempotent within the profile/session. Generate mother access tokens separately on the server. Reset must be explicit and session-scoped. No importer or database migration is included here.

## Reproduce and validate

From the project root, using Python 3 (standard library only):

```sh
python3 data/app_demo/build_populated_seed.py
python3 data/app_demo/validate_populated_seed.py
python3 data/app_demo/validate_seed.py
```

The builder deterministically reads the clean seed and pilot lookup and writes only `seed_populated_v1.json`. It does not change `seed_v1.json` or run the simulation. The validator checks IDs, station ownership, assignment lookup, chronological order, matching state/history, visit outcomes and request acknowledgment. These checks do not prove app/database execution or access control.

For the three-minute submission video, follow one case; use the other records to show meaningful inbox/filter states. Use the clean profile if the video needs to begin before worker acceptance. Test the populated profile through the actual app before using it for submission.
