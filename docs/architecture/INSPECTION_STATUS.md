# Inspection status

| Item | Value |
| --- | --- |
| Date | 2026-10-22 (Asia/Manila) |
| Repository | https://github.com/marcoantonio1206/InaAlaga (local checkout) |
| Branch / commit | `main` @ `1944140` ("Deploy 2026-10-22 15:18"), clean working tree before docs were added |
| Remote branches | `origin/bhw-workspace`, `origin/mother-ui-v2`: both fully merged into `main` (0 commits ahead) |
| Tracked files | 163 (no submodules, no workspaces) |
| Environment | Windows 11, Git Bash, Node 24.21.0, npm 11.19.0, Python 3.14.8, git `core.autocrlf=true` |
| Overall | **Fully inspected** for first-party source and docs; large data artifacts sampled (see exclusions) |

## Instruction files read

`CLAUDE.md` (root), `web/CLAUDE.md`. No `AGENTS.md`, `CONTRIBUTING*`, `.github/` or `.gitattributes`.

## Examined

- All 79 tracked files under `web/` except binaries: every page, layout, component, lib module, config, `.env.example`, `.gitignore`, `README.md`; `package-lock.json` structurally.
- `simulation/*.py`, `tests/*.py`, `data/app_demo/*.py`, `data/geography/*.py`: read in full.
- All Markdown documentation in `docs/`, `simulation/`, `data/**`, root.
- `data/geography/pilot_v2/*`, `data/simulation/demand_allocation.json`, `simulation/*validation*.json`: read in full.
- Seed JSONs: schema and all case rows extracted programmatically.
- `HANDOFF_MANIFEST.json`: all 71 hashes recomputed.

## Commands executed

| Command | Exit | Result |
| --- | --- | --- |
| `python -m unittest discover -s tests -v` | 0 | 21 tests OK |
| `python data/app_demo/validate_seed.py` | 0 | Valid (6 cases) |
| `python validate_populated_seed.py` (in `data/app_demo/`) | 0 | 20 cases, 4 workers, 83 events |
| `python -m simulation.run --suite smoke --replications 3 --output <scratchpad>` | 0 | 3 scenarios verified |
| Manifest/design hash recomputation (Python, read-only) | 0 | Raw-byte mismatch on CRLF files; LF-normalised matches except 9 handoff entries |
| `npm ci` (in `web/`) | 1 | EUSAGE lockfile out of sync |
| `npm install` (scratchpad copy of `web/`) | 0 | 360 packages |
| `npm run lint` (copy) | 1 | 1 error, `caseContext.js:21` |
| `npm run build` (copy, mock env) | 0 | 14 routes |
| `npm audit --omit=dev` / `npm audit` (copy) | 0 / 1 | 0 runtime; 5 high dev-only |
| Node harness against a scratchpad copy of `mock.js` + `status.js` | 0 | Confirmed K3–K7 behaviours |

All writes from these commands went to the session scratchpad; the repository working tree was not modified except for this `docs/architecture/` folder.

## Not run (and why)

- Full simulation suites, factorial run, factorial report, `build_pilot_v2.py`, `build_populated_seed.py`: they overwrite tracked outputs.
- `extract_tuguegarao.py`: needs the unbundled national GeoPackage.
- `npm run dev` + browser walkthrough: UI behaviours R1 (Escape) and R2 (multi-tab) are confirmed by code reading only; no responsive/visual QA at 360 px or 1280 px was done.
- Any Supabase, Vercel or Figma access: no credentials in repo; remote resources out of scope.

## Excluded files

| File(s) | Reason |
| --- | --- |
| `docs/InaAlaga_PRD.docx` | Older duplicate of the Markdown PRD (documented) |
| `docs/bhw_flowchart.png`, `simulation/reports/factorial_v1/*.png`, `web/src/app/favicon.ico`, `web/public/*.svg` | Binary/placeholder assets |
| Large result files (`simulation/results/**/*.csv`, `results.json`, `experiment_design.json`) | Inspected by header/keys only; content integrity covered by recorded manifests |
| `data/geography/tuguegarao_osm/*.geojson` | Single-line large GeoJSON; consumed through scripts |

## Remaining unknowns

- Hosting provider, its build command, root directory and environment variables.
- Whether the deployed site has any Supabase variables set.
- Visual fidelity against Figma frames (not compared).
- Cause of the PNG hash mismatches in `HANDOFF_MANIFEST.json` (binary files, unchanged since commit `7a0cef3`).
- Behaviour on Safari/iOS of `datetime-local` inputs used for all times.

## Areas for further investigation

1. Browser walkthrough of the full story in two tabs to confirm R1/R2 and record the demo.
2. Accessibility audit (focus trapping in `Overlay.js` only focuses the first element; no focus restore on close).
3. Full simulation rerun on an LF checkout to re-confirm byte-identical reproduction claimed in `simulation/validation_report.json`.
