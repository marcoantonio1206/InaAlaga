# Facilitator progress — October 24, 2026

Changes following c99c430, prepared for the October 24 team progress push. No deployment or remote database migration was performed. Local-only statements below describe the validation stage before that push.

## Layout and wording

- Wider patient list, left-aligned names, circular initials and a horizontally scrollable table at small widths.
- Compact responsibility summary; full-width visits; separate contact requests and attempts; collapsed discharge details and handoff history; fixed profile header/Close control.
- Next/future/previous visits retain completed history, visiting worker and actual station destination separately from the coordinating station.
- Removed repeated fictional/demo wording from facilitator screens, forms and validation. Demonstration remains in the header.

## Facilitator assignment

Open an Unassigned mother's profile, choose a BHW under Assign BHW, review the associated station and save. The current supported role-switcher workers are Ana (Tanza) and Bea (Linao West). Worker availability here means available in the supported directory; it is not a workload or appointment-availability calculation.

Assignment saves the named worker and coordinating station, changes the handoff to pending and appends an event with the real save time. It does not accept responsibility or schedule a visit. The selected BHW accepts separately. Duplicate saves are harmless; assigning a different worker to an already assigned/accepted case is rejected. Reassignment is outside this control.

Both browser-local and database adapters implement assignment. Apply `web/supabase/migrations/004_facilitator_assignment.sql` after migrations 001–003 before using the updated application in database mode. It adds the separate assigned worker, the assignment event type and service-role-only RPC functions that lock the case and save the state/audit changes together. Acceptance uses the matching atomic function and checks station/named assignment. No remote migration or database integration test was run. This extends the existing role-launcher/API model; it does not introduce production staff authentication or new session authorization.

## Validation

- Production webpack build passed.
- Lint: no errors; existing AppBar image optimization warning remains.
- Automated tests cover cross-tab persistence and station inbox placement, separate acceptance, wall-clock timestamps, duplicate saves, invalid workers, existing ownership and competing assignments.
- Browser walkthrough used a temporary, separate local production preview: Carmela → Bea/Linao West → pending → BHW acceptance. The normal localhost:3000 records were not changed or reset.

## Uniform pending-worker details

The patient list displays only the responsibility badge, without an extra Assigned BHW line. Pending profiles show the saved worker name and Assigned · Awaiting acceptance for station-routed cases as well as manually assigned cases.

The current supported station defaults are Ana for Tanza and Bea for Linao West. Browser-local seed/new discharge records include these assignments; previously stored pending station-only records are filled once with a real-time Station lookup audit event, without resetting data or replacing explicit assignments/accepted owners. Unknown stations remain without a default. The default requires one unambiguous supported worker; it is not a workload-based allocation rule.

For database mode, apply `web/supabase/migrations/005_default_pending_worker.sql` after 004. It backfills existing pending station-only cases and handles future inserts through the same guarded trigger, writing the assignment and audit event in one transaction. No remote migration was applied. Local validation: 41 tests passed, production build passed, lint has only the existing image warning.

## Live records, audit time and discharge form

- The facilitator list and open profile refresh every five seconds while visible, on window focus/visibility return, on cross-tab storage changes, and through Refresh buttons. Refresh errors preserve the last loaded records with Retry. Requests are serialized; newer refresh requests supersede older responses; closing/navigating suppresses late results. Search, filters and form inputs are retained during background updates.
- Facilitator timeline rows use only saved timestamps; missing times read Time not recorded. New discharges store actual UTC save time in recorded_at/assigned_at, independently of entered birth/discharge/target dates and the fixed schedule clock. Historical seed timestamps are not rewritten. Newly issued links expire 14 days after the new record's actual recording time.
- The follow-up target starts blank. Facility and Follow-up target labels stay short; one field hint explains the administrative deadline. Edit, review/save and saved-state actions sit in fixed modal footers. Closing, editing and repeat saves are disabled during a pending save; a failed save retains entries for retry. Unassigned saved records can open their handoff directly to choose a BHW.
- Validation: 45 tests passed, lint has no errors (one existing AppBar image warning), and the default production build passed. Use `npm run build` (the configured Turbopack CSS loader) for a styled production preview; the webpack compilation check does not process the existing Tailwind directives.
- Browser checks used a separate local preview: blank target, entered dates, review/save footer, real recorded time and BHW acceptance updating both hospital list and profile without a reload. No test records were added to the user's normal localhost:3000 workspace. No remote database integration, push, deployment or migration was performed.

## Shared mother-details layout

The facilitator profile now uses the current BHW mother-details layout through `web/src/components/case/MotherDetails.js`, shared by both role wrappers. It covers the initials/name/case/status header, three-column station/worker/target summary, next/future/previous visits, contact-request/attempt columns, collapsed discharge details and event history. The BHW view remains the layout reference, including icon badges, orange future visits, View details/Hide details controls and completed badges alongside previous records.

Role actions remain in the callers: BHW acceptance, scheduling, visit outcomes and contact actions; facilitator assignment, automatic/manual refresh and the scoped mother link. The facilitator keeps saved-only timestamp evidence and its existing successful-contact target treatment. No records were reset for the visual comparison. Browser inspection used an existing populated local case in both roles and checked expandable previous visits; only BHW displayed visit/contact write controls. Validation: 45 tests and the default production build passed; lint has the existing AppBar image warning.

## Visit/contact list readability

The facilitator table now renders schedule status, scheduled date/time, completed-visit count, contact-request state and latest contact attempt as separate short lines instead of concatenating them into one sentence. Phrases, names, status badges, targets and station names stay together; narrow screens retain horizontal table scrolling. Browser verification used the existing accepted/scheduled Grace record without editing data. Lint has no errors (existing image warning only), and the default production build passed.

Empty contact summaries are now hidden in the facilitator list. Saved requests and contact attempts still display; detailed profile empty states remain. The empty contact container is omitted as well, so blank updates add no row spacing. Checked in the browser; lint has no errors (existing image warning only).

## Future scheduling and arranging overdue follow-ups

Application displays, countdowns and visit/target warnings now use the real clock, displayed in Philippine time. The old fixed clock remains an explicit seed/reference value for historical fixtures and simulation; existing saved event and schedule dates are not rewritten.

New visit times must be strictly later than the actual save time. The BHW form supplies a current Philippine-time minimum, rejects past times on submit and starts blank when the old follow-up target has elapsed. Browser-local and server save handlers independently validate the instant; the API returns a validation error for past times. Minute-level entry uses the next available minute rather than accepting an already-started minute. Duplicate start and discharge-order checks remain.

In a BHW case profile, the responsible accepted owner can choose Arranged with mother when a follow-up target or open visit is overdue. Confirmation records who/when, resolves the current overdue target and currently passed open visits, and appends an audit event. It does not change visit dates, complete a visit, record successful contact, or resolve a future visit in advance. Later visits becoming overdue raise warnings again. Repeated confirmation is idempotent. Facilitator details/list, BHW details/schedule and mother views display the saved arrangement; request acknowledgment and actual contact/visit completion remain separate actions. Future completion-time validation and rescheduling remain separate follow-up scope.

For database mode, apply `web/supabase/migrations/006_arranged_overdue.sql` after 004–005. It adds case/visit arrangement fields and a service-role-only transactional RPC with case locking and responsible-owner checks. No remote migration or database integration was performed.

Validation: 49 automated tests pass, covering exact/earlier instants, Philippine offsets, missing zones, persistence, ownership, idempotency, unchanged schedule/outcome fields and later visits becoming overdue. Older dated scheduling tests now explicitly freeze their test clock. The default production build and lint pass (existing image warning only). An isolated local browser check rejected a past date, saved a future appointment and replaced an overdue target warning with the saved arrangement. No test actions changed the user's normal localhost:3000 records.

## Record discharge workflow check

Tested the current production preview on an isolated local origin using fictional Lina Test Mother (IA-0048). The form rejected discharge before birth, then reviewed and saved valid dates with the entered follow-up target, actual save timestamp, Tanza BHS/Ana pending assignment and a private mother link expiring 14 days after recording. The single new record and its link survived refresh.

Verified the case appeared in Ana's inbox; Bea's other-station view could not accept it. Ana accepted the case and scheduled an October 26 home visit. The mother and facilitator views received the schedule. The mother's contact request reached the BHW, acknowledgment saved, and a reached phone attempt appeared in the facilitator profile and list. The scheduled visit remained open, as intended. The mother link retained the appointment and acknowledgment after reload.

No functional defect was found in this tested path, so no application code changed for this check. All 49 automated tests passed. This verifies browser-local prototype mode; remote database mode was not exercised. Temporary preview tabs/server were closed, and normal localhost:3000 records were untouched. Nothing was pushed or deployed.

## BHW refresh parity

The BHW Cases list, open case profile and Schedule now use the facilitator's shared `useLiveResource` system: five-second visible-tab polling, focus/visibility/storage updates, serialized requests, stale-response protection and manual Refresh buttons with a disabled Refreshing state. Saved actions refresh the profile and list. Search/filter state and open forms stay in place during background updates; switching workers remounts the case panel so forms do not carry across workers. List/schedule responses remain scoped to the current station/worker. Failed background updates retain the last successful data with a short retry notice; initial failures retain the existing load-error treatment.

Verified manual refresh in all three BHW views. In an isolated production preview, a mother contact request appeared in both the BHW list and open profile without manual refresh or navigation. Normal localhost records were not changed. All 49 tests and the production build passed; lint has no errors and only the existing AppBar image warning. No push, deployment or remote database changes.
