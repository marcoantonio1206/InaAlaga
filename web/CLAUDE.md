# InaAlaga web app: conventions for AI-assisted frontend work
 
This file lives at `web/CLAUDE.md`. Read it before generating any component from Figma. It overrides generic Next.js or Tailwind defaults.
 
## Stack (do not change)
 
- Next.js 16 App Router, React 19, **plain JavaScript** (`.js`). No TypeScript, no `.tsx`, no type annotations.
- Tailwind CSS v4. Design tokens live in `src/app/globals.css` under `@theme`. There is no `tailwind.config.js`.
- Font: Nunito via `next/font` (`--font-nunito`). Do not add other fonts.
- Path alias `@/` maps to `src/`.
- Data access goes **only** through `@/lib/data` (see Data layer). No `fetch`, no Supabase client calls inside components or pages.
- Commands: `npm run dev`, `npm run lint`. Lint must pass before a PR.
## Folder map
 
```
src/app/(mobile)/           mother views, 360 px first. /consent, /m/[token], /m/[token]/visits, /station, /more
src/app/hospital/           facilitator desktop views (top bar, 1180 px content). /patients is the only screen; ?case=ID opens the profile slide-over, ?new=1 opens the discharge dialog; /patients/[caseId] and /discharge redirect there
src/app/bhw/                BHW workspace. /bhw is the Cases list (table on desktop, cards on phones); ?case=ID opens the case-detail slide-over; /bhw/schedule; /bhw/cases/[caseId] redirects to ?case=
src/components/             mother components (StatusCard, VisitCard, RequestPanel, BottomNav, MotherHeader, DemoNotice ...)
src/components/ui/          primitives: Card, Badge, Button, Icon, AppBar (shared purple header + RoleChip), Overlay (Modal + SlideOver)
src/components/hospital/    TopBar (wraps AppBar), PageHeader, Pill, Field, PatientProfile, DischargeDialog
src/components/bhw/         BhwShell, CaseRow, CaseDetail (panel body; every action opens a Modal), AcceptCard, ScheduleForm, VisitOutcomeForm, ContactRequestCard, ContactAttemptForm, EventHistory, LoadState, useSave
src/lib/data/index.js       switches mock.js | supabase.js by NEXT_PUBLIC_DATA_SOURCE; re-exports functions
src/lib/status.js           mother status: unassigned | pending | acknowledged | scheduled | overdue | completed
src/lib/hospitalStatus.js   responsibility() and visitSummary() labels for hospital tables
src/lib/i18n.js             LangProvider + useLang(); strings.fil / strings.en (mother views only)
src/lib/format.js           formatDateTime, formatDot, formatDotYear, initials, overdueLabel
src/lib/validation.js       validateDischarge, toManilaIso
src/lib/demoGeography.js    TANZA, LINAO, BARANGAYS, lookupStation
```
 
## Design tokens: map Figma colours to these, never add hex values in components
 
| Token (Tailwind class) | Use |
| --- | --- |
| `brand-950`, `brand-900`, `brand-600` | headings, primary buttons, active nav |
| `brand-200`, `brand-50` | card tints, page background |
| `ink`, `muted` | body text, secondary text |
| `ok-bg` / `ok-ink` | accepted, completed |
| `warn-bg` / `warn-ink` | unassigned, awaiting |
| `danger-bg` / `danger-ink` | overdue (administrative), failed save |
| `attention` | request pending accent |
 
If a Figma colour has no token, pick the nearest token. If a new semantic colour is really needed, add it to `@theme` in `globals.css` with a semantic name and use it through the class, not inline.
 
Radii and spacing in use: cards `rounded-2xl p-4`, buttons `h-[52px] rounded-xl`, pills `rounded-full px-3 py-1`, page padding `p-4` (mobile) and `px-6 py-6 lg:px-8` (desktop), section gaps `gap-3`.
 
## Component rules
 
- Reuse `Card`, `Badge`, `Button`, `Icon`, `Pill`, `Field` before creating new primitives. Extend with props, do not fork.
- `Icon` takes `name` from the fixed set in `components/ui/Icon.js` (clock, calendar, check, alert, pin, message, home, dots, plus, list). Add a new icon there as a 24 px stroke path; never paste Figma SVG exports into pages.
- Layout with flex/grid only. No absolute positioning or fixed pixel widths copied from Figma frames, except `max-w-*` on page containers.
- One route per Figma frame. State variants (pending, accepted, scheduled, overdue, completed, empty, loading, error) are **props or derived state in one component**, not separate pages.
- Pages that read data are `"use client"` and follow the `listCases()` pattern in `app/hospital/patients/page.js`: `useEffect` fetch, `null` while loading, `failed` flag with a Retry button, never show a success state before the data call resolves.
- Status meaning must be carried by words plus an icon, never by colour alone.
- Time: data stores ISO strings; display through `format.js` helpers (Asia/Manila). `getDemoNow()` is the clock; never call `new Date()` for "now" in mock mode.
## Data layer: how to add a BHW action
 
1. Add the function to `lib/data/mock.js` operating on `store` with a `wait()` delay, returning `structuredClone(...)`.
2. Add the same name to `lib/data/supabase.js` as `notReady()` stub.
3. Re-export it from `lib/data/index.js`.
Case shape (mock): `{ id, alias, barangay, station_name, handoff_state: "unassigned"|"pending"|"acknowledged", request_state: "none"|"recorded"|"acknowledged", birth_at, discharge_at, due_at, recorded_at, assigned_at, visits: [{ id, state: "scheduled"|"attempted"|"completed"|"cancelled", scheduled_for, location_type: "home"|"station", worker_name }] }`.
 
Functions the BHW workspace needs (names are agreed; implement exactly these):
 
```
listStationCases(stationName)                          cases for one station only, sorted by due_at
listWorkerSchedule(workerName)                          scheduled home follow-ups where worker_name matches; empty until one is saved
acknowledgeCase(caseId, { worker_name })                pending -> acknowledged with owner_worker + acknowledged_at; if already owned by another worker, throw "Owner conflict" and change nothing
scheduleVisit(caseId, { scheduled_for, worker_name })   location is home; adds visit { state: "scheduled" }
recordVisitOutcome(caseId, visitId, { started_at, ended_at, outcome: "completed" })   the only action that completes a case
acknowledgeRequest(caseId, { worker_name })             request_state "recorded" -> "acknowledged"
recordContactAttempt(caseId, { method, started_at, ended_at, outcome: "not_reached"|"reached" })   appends to case.contact_attempts; never changes visit state
```
 
Add `owner_worker`, `acknowledged_at`, `contact_attempts: []` and `events: []` to the case shape. Every successful save appends an event `{ at, type, actor }` shown in Case detail as chronological history.
 
Routes: `/bhw` (Cases, station-scoped inbox), `/bhw/cases/[caseId]` (Case detail: responsibility, home follow-up, contact requests, contact attempts, read-only discharge details, event history), `/bhw/schedule` (Schedule). Forms (accept review, schedule, visit outcome, acknowledge request, contact attempt) are components under `components/bhw/` rendered inside Case detail, not separate routes. Demo workers: "Ana" at Tanza, "Bea" at Linao West; a simple worker switcher in the BHW header selects which one is acting. Desktop: top navigation. Phone: fixed bottom tabs Cases / Schedule.
 
Save is the boundary: state changes only after a successful save; a failed save keeps the form entries and offers Retry; "Update needed" appears when a scheduled time has passed with no saved outcome and is cleared only by saving an outcome. Acknowledged request is not contact; reached by phone is not a completed home visit. The visual spec is `docs/bhw_flowchart.png`; the visual style is the existing hospital screens.
 
Queue order for the BHW inbox is `due_at` ascending, ties by `recorded_at` then `id`. The ordering reason shown to the worker is "Earliest follow-up target first". Never order by, or display, any risk score.
 
## Product rules from the PRD (these are requirements, not style)
 
- Every screen carries a "Fictional demo" label (`DemoNotice` on mobile, header tag on desktop).
- No High/Medium/Low risk labels, no clinical severity colours, no symptom or SOS entry, no phone numbers or addresses.
- A station assignment is not acceptance. Acceptance exists only after `acknowledgeCase` succeeds and must show the worker name and timestamp.
- A scheduled visit is not a completed contact. Completion is a separate recorded action with an outcome; an unsuccessful attempt stays distinct from success.
- "Overdue" is derived from `due_at` versus the demo clock and is labelled an administrative target, never urgency.
- A mother's contact request shows "Request recorded" until a worker acknowledges it; never "read" or "contacted".
- Unmapped barangay stays visibly unassigned; the UI never invents a station.
- Mother and BHW views must be usable at 360 px; hospital and coordinator views target 1280 px.
- Mother views are bilingual through `useLang()`; add every new mother string to both `fil` and `en` in `i18n.js`. BHW and hospital views are English for this release.
## Figma-to-code workflow
 
1. Ask for `get_variable_defs` once per file and reconcile with `@theme`; do not re-request it.
2. For each frame: one prompt, one route or component, using the "copy link to selection" URL for that frame only.
3. Generated code must import existing primitives and data functions; if a needed data function does not exist, add it following the three-step rule above in the same change.
4. After each screen: `npm run lint`, then open the route in `npm run dev` at 360 px and at desktop width.
5. Commit per screen with a message naming the Figma frame.
 