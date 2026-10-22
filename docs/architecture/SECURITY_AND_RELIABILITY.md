# Security, privacy and reliability

Context: the deployed app is a fictional demo in mock mode with no backend. Severity below is rated for two contexts: **demo** (fictional data, as today) and **real** (any use with real people or a shared backend). The repo's own rule is: do not use real patient data until server-side scope enforcement exists (root `CLAUDE.md`).

No vulnerability scan beyond `npm audit` was performed. Absence of findings is not evidence of security.

## Existing controls (Verified)

- Fictional-data labelling on every role (`DemoNotice`, `PageHeader` and `SlideOver` "Fictional demo" tags).
- No collection of phone numbers, addresses, symptoms or risk labels in any form or fixture.
- No raw-HTML sinks (`dangerouslySetInnerHTML`, `innerHTML`, `eval`) in `web/src`; React escapes all rendered values.
- `.env*` ignored at root and in `web/`; `.env.example` contains names only.
- `SUPABASE_SERVICE_ROLE_KEY` lacks the `NEXT_PUBLIC_` prefix, so Next.js will not inline it into client bundles.
- Restricted DHS data, registry joins and the national GeoPackage are excluded by `.gitignore` and the documented allowlist.
- Runtime dependency audit: 0 known vulnerabilities (`npm audit --omit=dev`).
- Business-rule guards in `mock.js` (ordering, ownership conflict, single open visit, idempotent discharge).

## Confirmed findings

| ID | Finding | Evidence | Demo / Real | Mitigation |
| --- | --- | --- | --- | --- |
| S1 | **All authorization is client-side.** Data functions accept any worker for any station. Executed: `acknowledgeCase("IA-0042", {worker_name:"Bea"})` succeeds although IA-0042 is a Tanza case and Bea is Linao West. Only `CaseDetail.js:77-79` hides buttons. PRD W01 requires server-side rejection. | `mock.js:238-332` | Low / **Critical** | Implement PRD §8 route handlers with session, role and station scope checks; keep mock checks equivalent for parity |
| S2 | **Mother links are client-side only.** Fixed 2026-10-22 in mock: links are opaque 128-bit tokens with 14-day expiry, and case IDs no longer resolve. But the token registry lives in `localStorage` and the JS bundle, and tokens are not hashed. PRD M01 needs server issuance and validation. | `mock.js` (`links`, `caseForToken`) | Low / **High** | Server-generated random tokens stored hashed with case scope and expiry, validated in route handlers |
| S3 | **No identity or session.** Worker identity is a dropdown; acting worker is never validated against owner or visitor (`recordVisitOutcome` uses the visit's `worker_name`; anyone can complete). | `bhwWorkers.js`, `mock.js:276-293` | Low / **High** | Demo session with role/worker bound server-side |
| S4 | **Lockfile drift** makes installs non-reproducible (`npm ci` fails); hosts that fall back to `npm install` may resolve different transitive versions than developers. | `npm ci` output | Medium / Medium | Regenerate and commit lockfile; use `npm ci` in deploys |
| S5 | **Dev-tool vulnerabilities**: 5 high (`braces` ReDoS-style DoS) through `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch`. Dev-only. | `npm audit` | Low / Low | Track upstream fix; do not `audit fix --force` (breaking) |
| S6 | **localStorage is fully trusted** on hydrate: any parseable JSON replaces the store. Self-tampering only; no cross-user impact today. | `mock.js:136-148` | Info / n/a (mock only) | Validate shape/version on load if mock persists longer |

## Potential risks (not confirmed exploitable)

- **Supabase anon key in client** (`NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.example`): when wired, any table without Row Level Security is publicly readable/writable. PRD §8 says public reads/writes must be blocked by default.
- **Service-role key misuse**: if a future developer imports it into a client component it will be `undefined` (safe) but may tempt adding `NEXT_PUBLIC_`; keep it in route handlers only.
- **Install script** `unrs-resolver` postinstall (flagged by npm allowScripts). Standard ESLint resolver dependency; low risk.
- **Hosting env**: if the host sets `NEXT_PUBLIC_DATA_SOURCE=supabase`, every screen fails because all Supabase calls throw.

## Privacy-sensitive workflows

| Workflow | Data | Note |
| --- | --- | --- |
| Discharge entry | Alias, barangay, birth/discharge/due times | Free-text alias could receive a real name; UI says "fictional", nothing enforces it |
| Mother page | Same + station, visits, request state | Readable by anyone who guesses the ID (S2) |
| Contact request | Boolean request + timestamp | No free text (by design) |
| Storage | Entire store in `localStorage` | Persists on shared demo laptops until reset |

Consent screen (`consent/page.js`) describes the demo accurately for fictional data, but "Who can see it: staff … including the health worker at your assigned station" is not technically enforced (S1, S2).

## Reliability and error handling

| ID | Observation | Evidence | Impact |
| --- | --- | --- | --- |
| R1 | Escape in a nested action `Modal` also closes the parent `SlideOver`: both `useOverlay` instances add a `document` keydown listener; neither stops propagation or checks stacking. | `components/ui/Overlay.js:22-25`; nesting in `CaseDetail.js:239-255` | Unsaved form entries in the modal are lost along with the panel. Confirmed by code reading, not in a browser |
| R2 | Fixed 2026-10-22: `hydrate()` now re-reads storage before every data call, so tabs no longer overwrite each other's saves (harness-verified). | `mock.js` | — |
| R3 | No polling or refresh: mother view never sees BHW actions without reload; PRD target is ≤10 s. | `caseContext.js` | Cross-view demo requires manual reload |
| R4 | `PatientProfile` maps a load error to "This record was not found." with no Retry, unlike the documented pattern. | `components/hospital/PatientProfile.js:32-34` | Misleading message on failure |
| R5 | Idempotency map is in memory only; a reload between a timed-out save and retry can create a duplicate (mock has no real timeouts today). | `mock.js:131` | Low |
| R6 | All mock audit times equal the frozen clock, so event history cannot show real ordering times; PRD requires server audit time separate from the demo clock. | `mock.js:182-184` | Audit fidelity |
| R7 | `verify_run` uses `assert`; running with `python -O` silently skips all simulation invariants. | `simulation/model.py:267-295` | Validation could pass vacuously |

## Prioritised mitigations

1. Before any non-fictional or multi-user use: server route handlers with session/role/station scope (S1, S3), random hashed mother tokens (S2), Supabase RLS deny-by-default.
2. Regenerate and commit the lockfile; deploy with `npm ci` (S4).
3. Fix overlay Escape stacking (R1) and multi-tab persistence, e.g. re-read storage before each write or listen to the `storage` event (R2).
4. Add a data-layer test suite that pins the scope and timestamp rules so the Supabase implementation can be checked against it.
