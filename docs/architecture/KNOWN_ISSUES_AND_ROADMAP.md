# Known issues and roadmap

Each item gives evidence and why it matters. "Confirmed" means verified by execution or unambiguous code reading; "Hypothesis" means plausible but unverified. Security items are detailed in `SECURITY_AND_RELIABILITY.md` (S*, R*).

## Confirmed defects

| ID | Severity | Defect | Evidence | Why it matters |
| --- | --- | --- | --- | --- |
| K1 | Fixed 2026-10-22 | `npm run lint` failed: `react-hooks/set-state-in-effect` | `web/src/lib/caseContext.js` now fetches inside the effect with an `active` guard | `web/CLAUDE.md` makes lint a PR gate |
| K2 | Medium | `npm ci` fails on lockfile drift | `web/package-lock.json` missing `@emnapi/*` entries | Non-reproducible installs/deploys |
| K3 | High (real) | Station/worker scope enforced only in UI | `mock.js:238-332`; harness: Bea accepted a Tanza case | PRD W01/W02; any future backend must not copy this |
| K4 | Partly fixed 2026-10-22 | Mother token was the case ID | Mock now uses opaque expiring tokens (`links` in `mock.js`); case IDs, unknown and expired tokens show InvalidLink. Still client-side: tokens sit in browser storage until server routes exist | PRD M01 |
| K5 | Medium | Visit completion accepts times after the demo clock | `mock.js:276-293`; harness: completed with start Oct 20 10:00 while now is Oct 19 12:00 | PRD §10 lists "future completion timestamp" as an acceptance test |
| K6 | Low | Contact attempts and request acknowledgment allowed on unassigned cases | `mock.js:295-332`; `CaseDetail.js:77` (`otherStation` false when `station_name` null); harness | Contradicts "coordinator must review first" |
| K7 | Medium | Mother "Overdue" is derived from `scheduled_for`, not `due_at`; a case past its target with no visit shows "Acknowledged" | `web/src/lib/status.js:7`; harness on IA-0045 | Conflicts with `web/CLAUDE.md` product rule and PRD's "Awaiting visit update"; hospital/BHW use `due_at` |
| K8 | Medium | Escape closes both nested Modal and SlideOver | `components/ui/Overlay.js:22-25` | Loses in-progress form input (R1) |
| K9 | Fixed 2026-10-22 | Multi-tab lost updates in mock persistence | `hydrate()` now re-reads storage on every data call (R2). Remaining gap: a reset in one tab does not clear another tab's in-memory copy until it next writes | Multi-tab demo walkthrough could drop saves |
| K10 | Medium | Mock seed diverges from canonical `seed_v1.json` (IA-0043…0047) | `DATA_MODEL.md` table | Docs, Figma and demo script disagree with the app |
| K11 | Medium | Windows CRLF checkout breaks all recorded hashes; default simulation reruns refuse to run | no `.gitattributes`; `core.autocrlf=true`; hash check | Reproducibility claim fails for Windows teammates |
| K12 | Low | `HANDOFF_MANIFEST.json` is stale (9 entries differ even after LF normalisation; `web/` not covered) | recomputed hashes | Submission integrity record is inaccurate |
| K13 | Low | `PatientProfile` shows "not found" on load failure, no Retry | `PatientProfile.js:32-34` | Inconsistent error UX (R4) |
| K14 | Low | Hard-coded `text-red-700` instead of a token | `components/RequestPanel.js:62` | Token rule in `web/CLAUDE.md` |
| K15 | Low | `<html lang="en">` while default language is `fil` and never updated | `app/layout.js:14`, `lib/i18n.js` (`useState("fil")`) | Screen-reader pronunciation |
| K16 | Low | Leftover design annotation shown to users: "Example review state after an explicit target has been entered." | `components/hospital/DischargeDialog.js:200` | Polish |
| K17 | Low | Language choice is not persisted and resets on reload | `lib/i18n.js` | Mother UX |

## Incomplete features (vs PRD P0)

| PRD | Gap |
| --- | --- |
| H01 | No real persistence/refresh across browsers; idempotency only within one page load |
| W01, M01, Q01 | No server, sessions, scoped tokens or session-scoped reset |
| M02 | Home is not the v1.1 single "Your follow-up" card; worker name not shown on acceptance; contact attempts not shown; Visits/More are placeholders |
| R01 | No polling; acknowledgment visible to mother only after reload |
| D01–D03 | Planning view built 2026-10-22 at `/coordinator` (v1 scenario selector, on-time and paired-difference charts, workload, limitations). Still absent: coordinator operations view over saved demo events, factorial-grid results, and the map/schematic (D03) |
| Role launcher / SMS inbox | Absent; hospital and BHW are reachable only by typing URLs |
| Station correction | No coordinator path to assign an unassigned case |
| Supabase | `@supabase/supabase-js` installed but unused; no schema, RLS or importer for `data/app_demo` seeds |
| Tests | No web unit, integration or end-to-end tests; no CI |

## Documentation discrepancies

| Document | Claim | Reality |
| --- | --- | --- |
| `README.md`, `docs/TEAM_HANDOFF.md`, `docs/FINAL_ASSUMPTIONS_REVIEW.md`, `simulation/README.md` | "The application remains unbuilt" | Hospital/BHW/mother UI exist on mock data |
| `docs/InaAlaga_PRD.md` §8 | TypeScript, Route Handlers, Supabase, Leaflet | Plain JS, no API, mock only (root `CLAUDE.md` already notes this) |
| `web/README.md` | create-next-app text, Geist font, `app/page.js` | Nunito; entry is `app/(mobile)/page.js` |
| `web/CLAUDE.md` | "Overdue is derived from `due_at`" | Mother status uses `scheduled_for` (K7) |
| `web/CLAUDE.md` | `recordContactAttempt(caseId, {method, started_at, ended_at, outcome})` | Also takes `worker_name` |
| `web/CLAUDE.md` | Visit states include `attempted`, `cancelled` | Never produced by mock |
| `docs/FRONTEND_FIGMA_PROMPTS.md` | `recordContactOutcome`, Overdue filter, separate case route | Replaced by `recordVisitOutcome` + `recordContactAttempt`, "Update needed", slide-over |
| Root `CLAUDE.md` | `free-claude-code/` directory | Not present in checkout (ignored) |
| `simulation/FINDINGS.md` | "19 unit checks pass" | 21 now (README is current) |
| All docs | `python3 …` | Fails on this Windows machine; `python` works |

## Technical debt and improvement opportunities

- Business rules live in `mock.js`; the future Supabase path has no shared rule module or contract tests, so rules will be re-implemented and can drift.
- Station identity is a display string (`"Tanza BHS (demo station)"`) in the mock vs IDs (`demo_tanza`) in seeds and simulation.
- `components/hospital/` is used as a shared UI library by BHW; consider `components/ui/` for `Pill`, `Field`, `PageHeader` (only when touching them).
- Duplicated `Item` helper in `CaseDetail`, `PatientProfile`, `DischargeDialog`; duplicated table markup between hospital list and BHW inbox.
- Status derivation duplicated in three modules with different semantics (`status.js`, `bhwStatus.js`, `hospitalStatus.js`).
- `public/*.svg` are unused boilerplate files.

## Hypotheses (unverified)

- The hosted deployment runs mock mode (no Supabase vars), so every visitor has an independent browser-local dataset.
- The hosting service is Vercel with root directory `web` (PRD names Vercel; empty "Deploy" commits).

## Prioritised recommendations

Ordered by impact on the October 24 submission and on future safety.

1. **Make the gates green** (small): fix K1, regenerate/commit the lockfile (K2). Unblocks reliable builds.
2. **Fix demo-visible correctness** (small each): K7 status semantics, K5 future timestamps, K6 unassigned actions, K8 Escape stacking, K9 multi-tab writes, K16 annotation. These affect the recorded walkthrough.
3. **Align mock with the canonical seed** (K10) or document the mock as the demo source of truth; bump the storage key when changed.
4. **Coordinator dashboard (D01–D03)** reading `simulation/results/v1/results.json` as static JSON: highest remaining P0 gap and the PRD's "analytical centerpiece". Depends on nothing above.
5. **Role launcher** linking `/hospital`, `/bhw`, a mother link.
6. **Add `.gitattributes`** (`* text=auto eol=lf`) and refresh `HANDOFF_MANIFEST.json` (K11, K12). Needs a renormalisation commit; coordinate with the team.
7. **Before any real use**: server route handlers, Supabase schema + RLS, scoped sessions and hashed tokens (S1–S3), seed importer, contract tests shared by mock and Supabase implementations. Large; depends on 1.

Dependencies: 4 and 5 are independent. 7 should follow a written contract test suite derived from the current mock rules plus fixes in 2.
