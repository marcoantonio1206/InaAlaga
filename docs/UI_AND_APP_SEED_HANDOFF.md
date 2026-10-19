# UI and app seed handoff

Updated October 19, 2026. This handoff links the recent design and dataset work. These artifacts do not constitute a built or connected application.

## Start here

1. Read [PRD Section 3](InaAlaga_PRD.md#screens-and-interaction) for the mother UI direction, contact-request states and proposed extensions. Final tabs, multi-visit scope and preferred-schedule requests are not all approved implementation requirements.
2. Open the [editable hospital facilitator Figma](https://www.figma.com/design/cSPwoJSQP9oAmQzLdiDdD8?node-id=4-179). Its eight screens/states preserve the teammate's sidebar, table, profile cards and grouped form layout. They cover the patient list, pending-acceptance profile, form before/after target entry, handoff review, saved confirmation, unassigned station and invalid-target state. Main navigation actions are linked for a walkthrough; this is not a live form or database.
3. Choose an [app demo seed profile](../data/app_demo/README.md). Run its validator before connecting it to an importer.

## Hospital UI changes

Keep purple/lilac branding, rounded cards and the existing desktop layout. Remove High/Medium/Low risk labels because the project has no validated individual urgency assessment. Separate responsibility, visit/contact status and administrative demo target. A station assignment is not worker acceptance; an administrative target being overdue is not clinical severity.

The revised form uses mother alias, barangay, birth/discharge timestamps, an explicitly entered administrative demo target and a read-only facility. Show the suggested demo station before saving. Omit unused clinical/personal identifiers, symptom fields and live-SMS promises. Save confirmation must distinguish a saved record from worker acceptance. Unknown assignment remains unassigned for coordinator review.

Initials/avatar icons beside mother names are useful and can be retained in implementation; their omission from the revised Figma table was not a requirement. Baby names are optional, not required by the present coordination flow. The supplied app seeds omit them. Use case ID, not mother name, as the stable identifier.

The Figma list uses illustrative mixed statuses. The seed profiles below are the actual authored data examples. Do not treat a design label as a saved event, or expect every Figma example to exactly match a seed profile.

## Seed profiles

| Profile | File | Purpose |
| --- | --- | --- |
| Clean start | `data/app_demo/seed_v1.json` | Six mothers, two workers, five pending assignments and one unassigned case. No prefilled visits, requests or contact outcomes. |
| Populated snapshot | `data/app_demo/seed_populated_v1.json` | Twenty mothers, four workers, 14 accepted handoffs, four pending and two unassigned; five scheduled, two attempted and four completed home follow-ups; two open and two acknowledged requests; 83 matching fixture events. |

Both profiles use **October 19, 2026 at 12:00 PM Philippine time** as an explicitly frozen demo clock. Using a profile on October 24 does not silently change its snapshot date. Audit/import timestamps must use actual server time, separately from fictional historical event times.

The populated profile is prepared for later use, not an automatic replacement for the clean start. Select a fresh session/profile; never merge the two files by shared case ID. Use the clean profile for a live story beginning with worker acceptance. Use the populated profile to inspect inboxes, ownership and recorded outcomes. All four worker identities are fictional and do not change simulation staffing.

The first six mothers preserve stable aliases/IDs across profiles; Maria Santos is IA-0042. Seed creation does not create mother access tokens or deploy/import a database. The future importer must be session-scoped, transactional and idempotent, preserve foreign keys and record its own audit events. See the dataset guides for details and source notices.

## Commands

From the repository root, Python 3 standard library only:

```sh
python3 data/app_demo/validate_seed.py
python3 data/app_demo/validate_populated_seed.py
```

To reproduce the larger fixture deliberately:

```sh
python3 data/app_demo/build_populated_seed.py
python3 data/app_demo/validate_populated_seed.py
```

The builder writes only the populated JSON. It does not modify the clean seed or rerun the simulation. [Populated snapshot guide](../data/app_demo/POPULATED_SNAPSHOT.md) lists all 20 mothers and demonstration scenarios.

## Competition context checked in the supplied primer

The supplied 2026 PJDSC primer, printed pages 08–13 (PDF pages 10–15), contains no minimum station/barangay count or citywide-coverage requirement. Two stations and five selected barangays remain a bounded demo, not a representative city sample. October submission criteria include analytical depth, validity, findings, reproducibility and demonstration quality; UI breadth alone is insufficient. The November final-round criteria include scalability/deployment, which calls for an expansion explanation rather than an explicit citywide implementation minimum.

The supplied primer states October 24, 2026, 11:59 PM submission; at most 20 PDF slides including title/references/appendices, a video of at most three minutes, and a complete repository link. Top 10 announcement is November 4; final live demonstration November 14. Recheck organizer updates before submission. Code/datasets are intended for publication, so retain the project's existing public-data/restricted-data separation. The organizer PDF and teammate's original PDF are not copied into this repository by this handoff.

## Remaining implementation

Connect one saved discharge → station inbox → acceptance → schedule → mother contact request → worker acknowledgment → separate contact outcome. Test session/case/station scope, failed saves, refresh/persistence and unassigned handling. Create server-side seed/reset support before calling either dataset an operational app input. Preserve the distinction between app snapshots and independently generated simulation results.
