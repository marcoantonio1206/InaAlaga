# Fictional app demo seed v1

`seed_v1.json` is the canonical initial dataset for the app demonstration. It was authored independently for the app, not generated from survey respondents or copied from simulation cohorts. Names are fictional aliases; any resemblance to actual people is incidental. Station/facility names are demonstration references, not proof of referral partnerships, catchments or worker employment.

## Choose a demo profile

| Profile | File | Use |
| --- | --- | --- |
| Clean start | `seed_v1.json` | Six mothers and two workers; perform acceptance, scheduling and request actions live. |
| Populated snapshot | `seed_populated_v1.json` | Twenty mothers and four workers with coherent fictional histories, for later UI testing and populated-inbox demonstrations. See `POPULATED_SNAPSHOT.md`. |

These are alternative starting profiles, not files to merge into the same session. They intentionally share stable case IDs for the first six mothers. The populated snapshot is prepared for later use and does not replace the clean profile, select an app default, or connect to a database. Four workers are a UI demonstration choice, not a simulation parameter or verified local staffing level.

This file is ready for an app importer to consume. No app/database importer exists yet, and creating this file does not connect or deploy the app. Do not seed from `simulation/results/`; the simulation remains unchanged.

## Initial cases

Times below are Philippine time (Asia/Manila). All displayed dates are in October 2026. JSON timestamps are UTC ISO 8601 strings with `Z`; PSGC identifiers remain strings.

| Case ID | Mother alias | Barangay | Demo station | Birth | Discharge | Demo follow-up target |
| --- | --- | --- | --- | --- | --- | --- |
| IA-0042 | Maria Santos | Caritan Norte | Tanza BHS | Oct 18, 9:40 AM | Oct 19, 11:15 AM | Oct 20, 10:00 AM |
| IA-0043 | Rosa Dela Cruz | Libag Sur | Tanza BHS | Oct 17, 1:00 PM | Oct 18, 1:00 PM | Oct 20, 1:00 PM |
| IA-0044 | Grace Villanueva | Linao West | Linao West BHS | Oct 18, 6:00 AM | Oct 19, 6:00 AM | Oct 22, 6:00 AM |
| IA-0045 | Liza Mercado | Atulayan Norte | Linao West BHS | Oct 17, 9:00 AM | Oct 18, 9:00 AM | Oct 19, 9:00 AM |
| IA-0046 | Angelica Bautista | Pallua Sur | Linao West BHS | Oct 18, 7:30 AM | Oct 19, 7:30 AM | Oct 21, 7:30 AM |
| IA-0047 | Demo Mother 08 | Fictional barangay outside lookup | Unassigned | Oct 17, 10:00 AM | Oct 18, 10:00 AM | Oct 21, 9:00 AM |

Targets were explicitly authored for each fictional record. They are administrative demo targets, not medical visit recommendations; a future discharge form must still require explicit entry rather than calculating a default from these examples. One case per pilot barangay is UI coverage, not a demand estimate or simulation allocation rule.

## Shape and initial state

- `case_id` is a stable, human-readable seed key; use it for references, never match records by mother name. An importer may map it to a database UUID and retain this ID for display.
- `mother_alias` supplies the fictional name shown across hospital, worker and mother views. Baby names are omitted because they are not needed by this flow.
- `barangay_psgc`, `station_id` and the five assignments match the canonical `../geography/pilot_v2/barangays.csv`. The unmapped fixture has null PSGC/station, not an invented official code.
- Ana and Bea are fictional station-scoped demo workers. Merely listing them in `workers` does not assign ownership of a case.
- Five cases have a recorded station assignment and `handoff_status: pending`; one is `unassigned`. Every `owner_worker_id` and `acknowledged_at` is null.
- `followups`, `contact_requests` and `contact_outcomes` start empty. Show “No visit scheduled yet.” Do not fabricate a scheduled visit, acceptance, request acknowledgment or successful contact.
- Birth, discharge and assignment timestamps describe a fictional history. They are not server audit timestamps. The app importer must record its own server-time seed/import event; subsequent user actions must create real server audit events.
- There are no phone numbers, real household addresses, home coordinates, symptoms, risk labels, clinical results, access tokens or credentials in this dataset.

## Clock and demo use

`demo_clock_at` is October 19, 2026 at 12:00 PM Philippine time, stored as `2026-10-19T04:00:00Z`. Display it explicitly when calculating demo-target overdue states. Liza's target is three hours overdue at that clock; that is an administrative state, not clinical danger. Do not use the frozen clock as an audit timestamp or silently substitute the present date. If the app uses a live clock instead, label that mode and expect different overdue states.

Suggested walkthrough: load/reset a session; open Maria (IA-0042); Ana accepts responsibility in the Tanza worker view; Ana schedules a home follow-up; Maria sees that saved schedule and requests contact; Ana acknowledges the request and separately records contact. Check that the same case ID and saved states survive refresh across relevant views. Worker acceptance, appointments, requests and outcomes are created during the walkthrough, not prefilled by this seed. The unassigned fixture demonstrates coordinator correction before acceptance.

Earlier Figma cards were illustrative and include different prefilled statuses. This dataset defines a clean starting state; update Figma examples or advance the app through saved actions rather than assuming those illustrative labels are already present. In particular, Angelica's Pallua Sur assignment is Linao West under the canonical lookup, regardless of an earlier illustrative table showing Tanza.

## Import contract

When wiring the app, validate this JSON before import. Scope every mutable record to a newly created demo session and use a transaction. Reference lookup entities by their stable IDs, and use `(session_id, case_id)` as an idempotent seed key. Reimporting must not overwrite a session's accepted owners, schedules or request states; reset must be an explicit session-scoped action. Generate scoped mother tokens server-side and keep credentials out of this file. The JSON property names may be mapped to the chosen database schema; no production schema is implied.

## Validation

From the project root:

```sh
python3 data/app_demo/validate_seed.py
```

The standard-library validator checks unique identifiers, references, timezone-aware timestamp order, initial pending/unassigned consistency, empty workflow collections and exact agreement with the pilot assignment lookup. It does not certify database import, security or app behavior.

## Geographic provenance

Names/codes and assignment references follow `../geography/pilot_v2/README.md`; retain that file's source notices when distributing this dataset. PSGC names/codes: Philippine Statistics Authority, https://psa.gov.ph/classification/psgc/barangays/0201529000, retrieved October 18, 2026; https://psa.gov.ph/terms-of-use . Assignment lookup uses the project's PSA/OSM-derived demonstration geography; OpenStreetMap contributors, https://www.openstreetmap.org/copyright . No map coordinates, route distances or registry export are copied here. Tanza's reference location is supported, Linao West's approximate; neither station's actual service acceptance is established.
