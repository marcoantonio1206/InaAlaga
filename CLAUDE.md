# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 1. Overview
- **Project**: InaAlaga – a synthetic generator and simulation for health service scheduling, coupled with a lightweight web front‑end.
- **Front‑end**: Next.js 16.4.2 + React 19.3.0, Tailwind CSS 4, supabase client.  Rendered with Turbopack.
- **Simulation backend**: Pure‑Python (Python 3.10+) – no external third‑party packages.  Implements a full‑factorial uncertainty study and a simple synthetic case generator.
- **Data**: Geographic and scenario seeds in the `data/` directory; results from the simulation are written to `simulation/results/`.
- **Documentation**: READMEs, PRD, handoff documents, and simulation reports.

## 2. Building & Running the Web UI
The Next.js app is in the `web/` folder. Run all npm commands from there.

cd web
npm install        # once
npm run dev        # dev server at http://localhost:3000
npm run build      # production build
npm run start      # run the production build
npm run lint       # ESLint

Environment: copy `web/.env.example` to `web/.env.local` and fill it in.
- `NEXT_PUBLIC_DATA_SOURCE=mock` uses mock data (no Supabase needed). Use this for UI work.
- `NEXT_PUBLIC_DATA_SOURCE=supabase` uses Supabase. See `.env.example` for the Supabase variable names.

## 3. Running Python Simulation & Tests
```
# Run all unittest cases
python3 -m unittest discover -s tests -v
# Run the full simulation suite with 100 replications
python3 -m simulation.run --suite full --replications 100
# Quick smoke test (3 replications, separate output folder)
python3 -m simulation.run --suite smoke --replications 3 --output /tmp/inaalaga-smoke
# Generate the full‑factorial study (100 replications per cell)
python3 -m simulation.factorial --replications 100
# Build heat‑map plots (requires optional plotting deps)
python3 -m pip install -r simulation/requirements-plots.txt
python3 -m simulation.factorial_report --plots
```

The simulation package has no runtime dependencies; Python 3.10+ is required.  Results are written to `simulation/results/v1/` or `simulation/results/factorial_v1/` depending on the command.

## 4. High-Level Architecture
web/                              # Next.js front-end (run npm commands here)
  src/app/                        # App Router
    globals.css                   # Global CSS; Tailwind v4 @theme tokens go here
    (mobile)/m/[token]/           # Mother-facing mobile views
    hospital/                     # Facilitator section
  src/lib/i18n.js                 # Custom i18n (no library); all UI text goes here
  src/lib/data/index.js           # Data source switch (mock | supabase)
  src/lib/data/mock.js            # Mock data
  src/lib/data/supabase.js        # Supabase client calls
simulation/                       # Pure-Python discrete-event simulation (model.py)
tests/                            # Python unittest tests
data/geography/                   # Stdlib Python pipeline; OSM/Geofabrik GeoJSON (ODbL)
data/app_demo/                    # Stdlib Python demo data pipeline; PSA barangay CSVs
docs/                             # PRD, team handoff
free-claude-code/                 # Local dev tool, not part of the app; never edit

Current state (differs from PRD):
- Plain JavaScript, although the PRD specifies TypeScript.
- No `app/api` route handlers yet. The client talks to Supabase or mock data directly, so the PRD's server-side scope enforcement is not implemented. Do not use real patient data until it is.
- Leaflet is planned in the PRD but not installed yet.

## 5. Development Tips
- For local work on the web UI, use `npm run dev` and navigate to `http://localhost:3000`.
- When testing simulation logic, start from the command‑line examples above; no need to run an IDE.
- The `simulation/README.md` contains deeper guidance on scenario generation and validating outputs.
- The `docs/TEAM_HANDOFF.md` and `docs/InaAlaga_PRD.md` are good starting points for new contributors.

## 6. Figma to Code
- Frontend conventions, tokens, primitives, data-layer rules and PRD product rules are in `web/CLAUDE.md`. Read it before generating any component.
- Before any Figma MCP call, run `ToolSearch` with query `select:mcp__figma__get_design_context,mcp__figma__get_screenshot,mcp__figma__get_variable_defs,mcp__figma__create_session`, then call the tool. Never retry a "No such tool available" error without running ToolSearch first.
- One Figma frame per prompt, using the "copy link to selection" URL. Do not browse the whole file.
- Mother views (`(mobile)/m/[token]`) use `lib/i18n.js` with both `fil` and `en` strings. Hospital and BHW views are English for this release.
- Add tokens to the existing `@theme` block in `web/src/app/globals.css`; never remove or rename the existing `brand-*`, `ink`, `muted`, `ok`, `warn`, `danger` tokens, which the built screens depend on.
---
*Note: The file was created by the assistant on 2026-10-22.*
