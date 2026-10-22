# Figma MCP to code: setup and prompt playbook for InaAlaga
 
Goal: build the BHW workspace (Figma file 2) and apply the mother/hospital revisions (Figma file 1) into `web/` using Claude Code with the Figma remote MCP server, in an order that always leaves the repo runnable.
 
## 0. Setup (once)
 
```sh
# in the repo root
claude plugin install figma@claude-plugins-official     # recommended: MCP server + Figma skills
# or, manual:
claude mcp add --transport http figma https://mcp.figma.com/mcp
```
 
Then in a new Claude Code session: `/mcp` → figma → Authenticate → Allow access in the browser. Confirm with `/mcp` again.
 
Seat note: Figma's remote MCP needs a full or dev seat; other seats have usage limits. Budget your calls: one frame per prompt, no "look around the file" prompts, and ask for `get_screenshot` only when a frame's layout is ambiguous.
 
Put `CLAUDE.md` at `web/CLAUDE.md` and commit it before the first prompt. Start Claude Code from `web/` so it is picked up.
 
Getting a frame link: in Figma, right-click the frame → Copy link to selection. The URL contains `node-id=...`. Paste that URL into the prompt.
 
## 1. Build order
 
Each step is one Claude Code prompt. Do not skip step 1; it is what stops the model from inventing colours.
 
| Step | Frame(s) | Output |
| --- | --- | --- |
| 1 | BHW file, whole-file URL | token reconciliation, no code |
| 2 | BHW: layout shell + inbox/queue | `app/bhw/layout.js`, `app/bhw/page.js`, data: `listStationCases` |
| 3 | BHW: case detail (pending state) + accept | `app/bhw/cases/[caseId]/page.js`, data: `acknowledgeCase` |
| 4 | BHW: schedule visit sheet/form | component + data: `scheduleVisit` |
| 5 | BHW: record outcome (attempted / completed) | component + data: `recordContactOutcome` |
| 6 | BHW: mother request panel + acknowledge | component + data: `acknowledgeRequest` |
| 7 | Mother file: Visits page revisions | update `app/(mobile)/m/[token]/visits/page.js` and `i18n.js` |
| 8 | Mother file: Home card revisions | update `StatusCard`, `VisitCard` |
| 9 | Hospital file revisions if any | update `app/hospital/...` |
| 10 | Walkthrough + lint | no new code, fixes only |
 
## 2. Prompts
 
Copy these verbatim, replacing the `<link>` placeholders.
 
### Step 1: tokens
 
```
Use the Figma MCP to call get_variable_defs on <BHW file URL>. Compare every colour, radius and spacing variable with the @theme block in src/app/globals.css and the token table in CLAUDE.md. Output a mapping table (Figma variable → existing Tailwind token) and list any Figma variable with no reasonable match. Do not write any component code yet. Do not call get_design_context in this step.
```
 
If the list of unmatched variables is empty or trivial, move on. If not, decide together which get added to `@theme` (semantic names only) and have Claude Code add them.
 
### Step 2: BHW shell and inbox
 
```
Read CLAUDE.md. Using get_design_context on <link to BHW inbox frame>, build the BHW workspace shell and inbox:
 
- src/app/bhw/layout.js: mobile-first shell (360 px) with a header showing the station name and a "Fictional demo" tag; on lg widths reuse the same visual language as the hospital Sidebar but do not import hospital components.
- src/app/bhw/page.js: client page that reads listStationCases(stationName) from @/lib/data for one demo station (hardcode "Tanza BHS (demo station)" from @/lib/demoGeography for now), sorted by due_at ascending, ties by recorded_at then id. Show the ordering reason "Earliest follow-up target first". Each row: alias, case id, barangay, responsibility (Awaiting acceptance / Accepted / Unassigned via the same labels as hospitalStatus.responsibility), visit summary (hospitalStatus.visitSummary), due target with overdueLabel from @/lib/format. Filters: All, Awaiting acceptance, Accepted, Scheduled, Overdue. Loading, failed-with-Retry, and empty states.
- Add listStationCases to lib/data/mock.js, a notReady stub in supabase.js, and re-export from index.js.
 
Use only existing tokens and primitives (Card, Badge, Pill, Icon, Button). Map Figma colours with the table from step 1. No absolute positioning. Run npm run lint and fix issues.
```
 
### Step 3: case detail and accept
 
```
Read CLAUDE.md. Using get_design_context on <link to BHW case detail frame>, build src/app/bhw/cases/[caseId]/page.js.
 
Show: mother alias, case id, barangay, assigned station, birth_at, discharge_at, due_at (labelled "Administrative follow-up target"), handoff timeline (recorded, assigned, accepted, visit scheduling) in the same style as the hospital patient profile. Primary action when handoff_state is "pending": "Accept responsibility". On click call acknowledgeCase(caseId, { worker_name: "Demo worker Ana" }); show a saving state; on success show "Accepted by Demo worker Ana · <timestamp>" and never before. Repeated clicks must not create a second acceptance. If the case is unassigned, show the unassigned explanation and no accept button.
 
Add acknowledgeCase to mock.js (sets handoff_state "acknowledged", owner_worker, acknowledged_at = getDemoNow(); idempotent), stub in supabase.js, re-export in index.js. Lint.
```
 
### Step 4: schedule visit
 
```
Read CLAUDE.md. Using get_design_context on <link to schedule sheet frame>, add a ScheduleVisit component in src/components/bhw/ used from the case detail page when handoff_state is "acknowledged" and there is no scheduled visit. Fields: date and time (Asia/Manila), location type (Home follow-up | At station), worker name prefilled. Validation: scheduled_for must not be before discharge_at. On submit call scheduleVisit(caseId, {...}); saving state; on success the detail page shows "Scheduled visit" with date, type and worker, and the mother-facing wording in VisitCard stays consistent. Scheduling must not mark anything as contacted.
 
Add scheduleVisit to mock.js (push { id, state: "scheduled", scheduled_for, location_type, worker_name } to visits), stub, re-export. Lint.
```
 
### Step 5: record outcome
 
```
Read CLAUDE.md. Using get_design_context on <link to record outcome frame>, add a RecordOutcome component used when a scheduled visit exists. Two distinct actions: "Record attempt (not reached)" and "Record completed contact". Completed requires started_at and completed_at not before discharge_at and not before started_at. Call recordContactOutcome(caseId, visitId, { outcome, started_at, completed_at }). After a completed outcome the case status becomes completed in both the BHW list and the mother view (lib/status.js already handles visits with state "completed"). An attempt leaves the visit scheduled and adds a visible "Contact attempted · <time>" entry; it must not complete or cancel the visit.
 
Add recordContactOutcome to mock.js, stub, re-export. Lint.
```
 
### Step 6: mother requests
 
```
Read CLAUDE.md. Using get_design_context on <link to requests frame>, add a request panel to the BHW case detail that shows the mother's request_state: none (no panel), recorded ("Request recorded · Awaiting acknowledgment" with an "Acknowledge request" button), acknowledged ("Request acknowledged by <worker>"). Call acknowledgeRequest(caseId, { worker_name }). Acknowledging a request must not change visit state or handoff state. Add the function to mock.js, stub, re-export. Confirm the mother Home page (RequestPanel) shows requestAcked after this. Lint.
```
 
### Step 7: mother Visits page
 
```
Read CLAUDE.md. Using get_design_context on <link to mother Visits frame in file 1>, update src/app/(mobile)/m/[token]/visits/page.js to the PRD Section 3 structure: next scheduled visit expanded; later visits as compact expandable rows; previous completed/cancelled rows; contact updates (attempted entries) when present; one shared "Please contact me" action using the existing RequestPanel state. Empty states: "No visit scheduled yet", "No completed visits yet". Add every new string to both fil and en in lib/i18n.js and use useLang(). Do not add a calendar grid or filters. Lint and check at 360 px.
```
 
### Step 8 and 9: Home card and hospital revisions
 
```
Read CLAUDE.md. Using get_design_context on <link>, update <StatusCard|VisitCard|hospital page> to match the frame. Keep the component API; change markup and strings only. List every visual difference you resolved and any Figma element you intentionally did not implement (illustrative route distances, map tiles, anything that implies live SMS or clinical urgency). Lint.
```
 
### Step 10: walkthrough
 
```
Do not call Figma. Start npm run dev and walk the story in the mock data source: hospital /discharge creates a case → it appears in /bhw for Tanza → accept → schedule → open /m/ia-00XX as the mother and submit "Please contact me" → acknowledge the request in /bhw → record an attempt → record completed → mother Home shows completed and hospital /patients shows "Visit completed". Fix anything that breaks. Then test an unassigned case (barangay "Other barangay (outside demo area)"), a duplicate submit, and a visit time before discharge. Report what passed and what you could not verify.
```
 
## 3. Guardrails for the free seat
 
- Never prompt "look through the whole file"; always a single frame link.
- If a `get_design_context` result is huge (many nested components), ask Claude Code to summarise the frame into a component tree first, then build from the tree without re-calling Figma.
- Keep `get_screenshot` for frames with overlapping sheets or ambiguous spacing only.
- If the MCP rate-limits you mid-step, continue from the summary already in the conversation; do not re-call.
## 4. Done criteria for the submission
 
- Every route listed in CLAUDE.md exists and works in mock mode.
- `npm run lint` clean.
- No risk labels, no live SMS claims, "Fictional demo" on every screen.
- README in `web/` updated with the role launcher routes: `/hospital`, `/bhw`, `/m/ia-0042`.