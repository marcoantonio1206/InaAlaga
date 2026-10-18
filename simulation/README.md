# InaAlaga synthetic generator and routine-contact simulation

Implemented model v1.0.0, October 18, 2026. This is a hypothetical operational model, not clinical prediction, an observed Tuguegarao workflow, or evidence of health benefit. No restricted microdata dependency. The web app is separate and is not implemented by this package.

## Run from the project root

Requires Python 3.10+ and its standard library only; no package installation, API key, Supabase account, NumPy, pandas or SimPy is needed for this first implementation. Record/use the Python version in the generated manifest for exact reproduction. This dependency-light implementation is a documented engineering choice from the PRD's Python plan.

```sh
python3 -m unittest discover -s tests -v
python3 -m simulation.run --suite full --replications 100
```

The default seed starts at 20261018 and increments by replication. Default results are written under `simulation/results/v1/`. To run a quick three-scenario check in a separate folder:

```sh
python3 -m simulation.run --suite smoke --replications 3 --output /tmp/inaalaga-smoke
```

The output folder cannot be reused for a different design or source version; choose a new path. The runner freezes `experiment_design.json` before outcomes, records input/source hashes, checks immutable case pairing and validates timelines/resources on every run. Exact same-version reruns reproduce the numerical results and CSV files. Regenerating geography or editing model/config inputs requires a new run/design version; do not mix old results with new source files.

## Synthetic cases

For 14 arrival days, draw daily demand from a Poisson distribution at 4, 8 or 12 cases/day across the whole pilot. Discharge times are uniform within each day, including outside worker shifts. Each fictional case has a `SYN-` ID, barangay PSGC string, station, discharge minute, administrative due minute, travel duration, fixed service duration, one uniform handoff draw, and backlog flag. No names, phones, real homes, clinical risk, or DHS-derived attributes. This cohort is a simulation input, not a complete application database seed (no birth timestamps, tokens, login roles, or SMS inbox).

The uniform five-barangay allocation and saved v2 station lookup imply expected 60%/40% demand at Linao West/Tanza. Individual replications vary. Demand, location, deadline and handoff random streams are separate so sensitivity changes do not inadvertently redraw other inputs. Within a replication, generate the cohort once and reuse it across every policy. All policies use the same uniform handoff variate; their delay ranges differ as specified. Changing worker capacity never changes the cases.

Source: `data/geography/pilot_v2/` and `data/simulation/demand_allocation.json`. Approximate straight-line travel is precomputed at 15 km/h with a baseline 5-minute floor. Multipliers apply after that floor. No live road routing. Linao location, Pallua Sur assignment and Libag Sur topology limitations still apply.

## Model clock and event rules

Times are minutes from an abstract Day 1 midnight on a synthetic Asia/Manila daily schedule, not real patient dates. Workers have identical daily shifts 09:00–13:00, including weekends, for 14 arrival plus 7 drain days. One worker at each station in base scenarios; separate zero- and ten-worker controls. Workers cannot serve another station. Acknowledgment is included in the assumed handoff delay rather than an additional unmeasured improvement.

Policy A: assumed reference delay uniform 12–48 hours + first-received-first-served. B: shorter delay uniform 0–6 hours + same FIFO rule. C: same shorter delay + earliest-due-first. Optional diagnostic D (included by default) uses reference delay + earliest-due-first, completing the two-by-two design. Policy A is hypothetical, not established current city practice.

Cases enter the station queue at discharge plus delay. At each receipt, shift opening or worker return, process all events at the same timestamp before dispatch. FIFO ties break on case ID; EDF ties break on receipt then case ID. Idle workers break ties by fixed worker ID. Visits are non-preemptive. Outbound travel + service + return travel occupy a worker; service completion is recorded before return. A whole trip must fit within the current shift and the experiment horizon. If the queue head cannot fit, do not bypass it with shorter jobs; it waits for a later shift. This head-of-line rule is the same for all policies and may affect results. A task longer than a full shift remains unserved and can block its station's queue; current experiment durations fit a full shift.

Already-acknowledged backlog is generated from one assumed prior day and made available at minute 0, identically across policies. Its discharge/deadline may precede time 0. It consumes capacity and has separately reported metrics. The primary denominator remains the new 14-day cohort; backlog is never silently added to or dropped from that denominator. This makes the backlog sensitivity a capacity/initial-state comparison rather than a change in the primary target population.

No contact attempt failures, no-shows, availability restrictions, clinical deterioration or emergency queues are modeled. Every served task succeeds by assumption. Remaining work at the horizon stays in the unserved count; cases with handoff after the horizon are also retained.

## Experiments and metrics

Full suite: 30 configurations, each with 100 matched replications and A/B/C/D (12,000 policy runs). For each of the three demand levels, run base plus one-at-a-time service 15/60 minutes, travel 0.5x/2x, reference delays 6–24/24–72 hours, one-day backlog, and uniform 48-hour deadline. Add demand-12 combined long-service/slow-travel stress, zero-worker and abundant-worker controls. Baseline service is 30 minutes and due windows are 24/48/72 hours after discharge, equal random probabilities. These deadlines are administrative assumptions, not WHO birth-based clinical guidance. Population-proportional allocation remains optional and is not implemented as an experiment in this release.

Primary: on-time completed contacts divided by all new introduced cases. Secondary: contact start within 48h of discharge; contact completion within 72h; unserved fraction; median and p90 nonnegative lateness among completed contacts; workload utilization including outbound/service/return and backlog busy time. Lateness includes zeros for on-time completions; it is not “lateness among late cases only.” Busy-time denominator includes all worker shifts over arrival and drain days, so empty drain shifts can lower utilization. Zero-capacity utilization and empty-cohort rates are null, not fabricated zero performance.

Paired B−A and C−B percentage-point differences (plus C−A, D−A and C−D) are computed per seed before aggregation. Results expose means, 2.5th/97.5th replication percentiles and positive/tie/negative fractions. These are simulation-randomness intervals, not confidence intervals for real effectiveness or the mean. Replication means of rates are not pooled counts across unequal-size cohorts. Descriptive breakdowns by barangay, station and preselected near/middle/far reference role are not validated fairness estimates. Uniform 48h deadlines do not guarantee FIFO/EDF ties because receipt delays can reorder cases; the hand fixture for equal receipt and deadline order does verify ties.

## Output contract for the future dashboard

- `results.json`: one schema/model version, design hash, policy/scenario IDs, units, assumptions, limitations, summary distributions, paired comparisons and subgroup summaries. No demo-operation counts mixed in.
- `experiment_design.json`: all scenario configs and input/code hashes, saved before experiments.
- `replications.csv`: each seed/policy's metrics, input hashes and backlog counts.
- `paired_differences.csv`: seed-level paired percentage-point differences.
- `synthetic_cases_example.csv`: base demand-8 first-seed cohort, synthetic only.
- `timeline_example_A/B/C/D.csv`: the same cohort's receipt/departure/contact/return times; blank unserved fields.
- `manifest.json`: output hashes, model/Python version and source/input hashes.

The dashboard should read a whole scenario object by ID. Display missing values as unavailable. Label all results “synthetic simulation” and expose the source assumptions and 60/40 demand split. These files do not show that a real worker accepted or completed contact. `FINDINGS.md` records results of the bundled run with limitations; it is not a target improvement to enforce.

## Verification and limits

The tests include hand-calculated FIFO/EDF and overload queues, zero/abundant capacity, exact shift fit, nonfitting tasks, delayed receipts, same-time arrivals, shared-case reproducibility, sensitivity pairing, duplicate prevention and no-overlap checks. The runner independently checks all completed timelines and metric denominators. This verifies implementation against stated rules; no local operational/clinical validation has occurred. Null results and reversals must remain in results and reports.

## Full-factorial uncertainty extension

The original 30-configuration release above is preserved. A separate extension examines all 162 combinations of demand (4/8/12), workers per station (1/2), service minutes (15/30/60), travel multiplier (0.5/1/2), and reference handoff hours (6–24/12–48/24–72). With 100 seeds and A/B/C/D this is 64,800 policy runs. No engine changes were made; `simulation/model.py` and the original runner remain unchanged so original v1 reproduction is preserved.

```sh
python3 -m unittest discover -s tests -v
python3 -m simulation.factorial --replications 100
python3 -m simulation.factorial_report
```

The first command now runs 21 tests, including full-grid coverage and common cohorts across staffing/delay changes. The factorial command freezes `simulation/results/factorial_v1/experiment_design.json` before outcomes. The report command builds findings, grid counts, separate staffing comparisons and capacity/scheduling interactions under `simulation/reports/factorial_v1/`. Full raw outputs and per-cell summary CSV remain in the factorial results folder. The original results and original FINDINGS.md remain historical initial-grid artifacts.

For optional standalone PNG heatmaps, install the plotting dependency into your own environment and run:

```sh
python3 -m pip install -r simulation/requirements-plots.txt
python3 -m simulation.factorial_report --plots
```

The simulation still needs no third-party packages. Heatmaps are means, not uncertainty intervals; read the summary CSV for ranges. The same seeds are reused across settings and policies; no additional independent evidence is created by repeating B/C over the reference-delay axis, which only affects A/D. There are 54 distinct B/C settings. Staffing comparisons use matched cohorts but different resources and must not be labeled scheduling-only gains. Full-grid counts are not weighted by the frequency of conditions in the real city.

See [factorial findings and heatmaps](reports/factorial_v1/FINDINGS.md) for all scheduling cells, complete raw-data links, and unchanged model/local-validity limits. No local workflow validation has occurred. This extension addresses interactions among the five stated axes; it does not vary every possible assumption or prove robustness beyond this grid.
