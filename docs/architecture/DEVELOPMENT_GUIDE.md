# Development guide

Commands marked **Verified** were executed on 2026-10-22 on Windows 11 (Git Bash), Node 24.21.0, npm 11.19.0, Python 3.14.8.

## Prerequisites

- Node.js and npm (versions above verified; no `engines` field is declared).
- Python 3.10+ (standard library only). On this Windows machine `python3` is the Microsoft Store stub and fails; use `python`. Docs and `CLAUDE.md` write `python3`.
- Optional: `matplotlib==3.11.2` for heatmaps.

## Web app

```sh
cd web
cp .env.example .env.local        # NEXT_PUBLIC_DATA_SOURCE=mock (default)
npm install                       # see lockfile note below
npm run dev                       # http://localhost:3000
npm run lint
npm run build && npm run start
```

| Command | Result on 2026-10-22 |
| --- | --- |
| `npm ci` | **Fails** (EUSAGE): lockfile out of sync with `package.json` for transitive `@emnapi/*` packages |
| `npm install` (in a scratch copy) | Succeeds; resolves next 16.4.2, react 19.3.0, tailwindcss 4.3.3, eslint 9.39.5; **rewrites `package-lock.json`** |
| `npm run lint` | **Fails**: 1 error, `react-hooks/set-state-in-effect` at `src/lib/caseContext.js:21` |
| `npm run build` | **Succeeds**; 14 routes (dynamic: `/m/[token]/*`, `/hospital/patients/[caseId]`, `/bhw/cases/[caseId]`) |
| `npm audit --omit=dev` | 0 vulnerabilities; 5 high in dev tooling (`braces` via `eslint-config-next`) |

Lockfile note: running `npm install` in `web/` will modify the tracked `package-lock.json`. Decide as a team whether to commit a regenerated lockfile (recommended, so `npm ci` works) rather than letting each machine drift.

Useful demo URLs (mock mode). Mother links use opaque tokens (seeded in `mock.js`, `links`); `/m/ia-0042` no longer works by design.

| URL | Shows |
| --- | --- |
| `/` → `/consent` → `/inbox/mQ7vX2rLp9TzK4dWb8NcYs` | Maria's simulated SMS, then "Open my follow-up" |
| `/m/mQ7vX2rLp9TzK4dWb8NcYs` | Maria (IA-0042) |
| `/m/Dt1Yw5Sn9Ce3Ak7Ux0Fr4L`, `/m/Jq8Zm2Vb6Hx0Pe4Ng1Wt9C`, `/m/Gk3Ua7Rf1Lo5Ys9Dj2Mv6E`, `/m/Rv2Xo8Qy4Mi6Tg0Bh3Kp7J` | Preview fixtures: scheduled, overdue, completed, acknowledged |
| `/inbox/Xs0Ib4Nh8Tc2Ek6Qa9Wz3P` | Expired link: SMS shows, opening it shows "This link can't be used" |
| `/hospital/patients?case=IA-0042` | Profile with "Mother's demo link" |
| `/hospital/patients?new=1` | Discharge dialog; the saved step shows the new mother's link |
| `/bhw`, `/bhw?case=IA-0042`, `/bhw/schedule` | BHW workspace |

Resetting demo state: "Reset demo data in this browser" on `/bhw`, or delete `localStorage["inaalaga-mock-store-v2"]` (it stores `{ cases, links }`). Bump the storage key if seed data in `mock.js` changes, because saved stores fully replace the seed.

### Conventions (from `web/CLAUDE.md`, enforced by review only)

- Plain `.js`, `@/` alias, data access only via `@/lib/data`.
- New data function: implement in `mock.js` (with `wait()` and `structuredClone`), add a `notReady()` stub in `supabase.js`, re-export from `index.js`.
- Colours only via `@theme` tokens; status meaning via words + icon.
- Mother strings in both `fil` and `en`; BHW/hospital English.
- Use `getDemoNow()` for "now"; format through `lib/format.js`.

## Simulation and data

Run from the repository root.

| Command | Result |
| --- | --- |
| `python -m unittest discover -s tests -v` | **Verified**: 21 tests, OK (0.03 s) |
| `python -m simulation.run --suite smoke --replications 3 --output <scratch dir>` | **Verified**: 3 scenarios, exit 0 |
| `python data/app_demo/validate_seed.py` | **Verified**: "Valid: 6 cases, 2 stations, 2 workers; one unassigned; overdue target: IA-0045." |
| `cd data/app_demo && python validate_populated_seed.py` | **Verified**: 20 cases, 4 workers, 83 events (must run from that folder or set `PYTHONPATH`) |
| `python -m simulation.run --suite full --replications 100` | Not run. Writes into tracked `simulation/results/v1/`. See Windows note |
| `python -m simulation.factorial --replications 100` | Not run (writes tracked `simulation/results/factorial_v1/`) |
| `python -m simulation.factorial_report [--plots]` | Not run (overwrites tracked `simulation/reports/factorial_v1/`) |
| `python data/geography/build_pilot_v2.py` | Not run (overwrites tracked pilot inputs and `demand_allocation.json`) |
| `python data/geography/extract_tuguegarao.py <gpkg>` | Not runnable: national GeoPackage not bundled |

### Windows line-ending trap (Verified)

System git config sets `core.autocrlf=true` and the repo has no `.gitattributes`, so text files are checked out with CRLF. The recorded hashes in `experiment_design.json`, `manifest.json` and `HANDOFF_MANIFEST.json` were computed on LF bytes. Consequences:

- `simulation.run`/`simulation.factorial` into their default folders will compute a different design hash and stop with "Output folder has a different design/source version" (`simulation/run.py:65-67`). This is inferred from the code plus the hash mismatch; it was not executed.
- New outputs written on Windows get CRLF in JSON (via `Path.write_text`), so byte-identical reproduction against bundled outputs fails.
- Workaround: clone with `git -c core.autocrlf=false clone …`, or add a `.gitattributes` (`* text=auto eol=lf`) as a reviewed change.

## Debugging

- Mock state: DevTools → Application → Local Storage → `inaalaga-mock-store-v1`.
- A page stuck on "Loading…" in Supabase mode is expected; every Supabase function throws.
- Stale data across tabs: reload; the mock reads storage once per page load (see `SECURITY_AND_RELIABILITY.md` R2).
- Simulation invariants: `verify_run` asserts are skipped under `python -O`; do not use `-O` when validating.
- Hydration warnings from browser extensions are suppressed on `<body>` (`app/layout.js:15`).

## Deployment

No deployment configuration is committed (no `vercel.json`, no `.github/workflows`). Commits titled "Deploy …" are empty and appear to trigger a git-integrated host (**Inferred**; PRD names Vercel). Host settings such as root directory (`web`) and environment variables are **Unknown** from the repo. A production build uses whatever `NEXT_PUBLIC_DATA_SOURCE` the host provides; unset means mock.

## Common setup failures

| Symptom | Cause | Fix |
| --- | --- | --- |
| `npm ci` EUSAGE | Lockfile drift | `npm install`, review and commit the lockfile |
| `Python was not found` | Windows Store `python3` alias | Use `python` or disable the alias |
| `ModuleNotFoundError: validate_seed` | Running populated validator from root | `cd data/app_demo` first |
| "different design/source version" | CRLF checkout or edited sources | Use a fresh `--output` folder or an LF checkout |
| Lint error in `caseContext.js` | React Compiler lint rule | Restructure the effect (see `KNOWN_ISSUES_AND_ROADMAP.md`) |
