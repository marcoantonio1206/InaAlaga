# Initial simulation findings — model v1.0.0

Generated October 18, 2026 from `results/v1/results.json`. Design SHA-256: `520105ec5303d4428931612b4eed0e53996bcbd312ceadabbb2d87d0f4d167d1`. These are synthetic scenario results, not observed city outcomes or evidence of clinical benefit. All 30 configurations were specified before comparison; none are removed for showing ties or reversals.

100 matched replications per configuration, four policies (A/B/C/D), 12,000 policy runs. Rate entries below are the mean of per-replication fractions, expressed as percentages. Differences are paired percentage points. The interval columns show the central 95% range across seed-level differences; they are not confidence intervals for city effects or for the simulation mean.

| Scenario | A on time % | B on time % | C on time % | D on time % | B−A pp | C−B pp | C−B central 95% simulation interval |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| demand_4_base | 60.06 | 97.84 | 98.55 | 60.48 | 37.78 | 0.70 | [0.00, 3.78] |
| demand_4_service_15 | 61.68 | 98.77 | 98.92 | 61.87 | 37.10 | 0.15 | [0.00, 1.92] |
| demand_4_service_60 | 45.77 | 81.96 | 86.79 | 41.09 | 36.18 | 4.83 | [-6.17, 13.57] |
| demand_4_travel_half | 61.11 | 98.62 | 98.78 | 61.45 | 37.51 | 0.16 | [0.00, 2.10] |
| demand_4_travel_double | 54.90 | 92.47 | 96.34 | 54.39 | 37.57 | 3.87 | [0.00, 11.45] |
| demand_4_reference_delay_6_24 | 80.63 | 97.84 | 98.55 | 81.94 | 17.21 | 0.70 | [0.00, 3.78] |
| demand_4_reference_delay_24_72 | 34.95 | 97.84 | 98.55 | 34.05 | 62.89 | 0.70 | [0.00, 3.78] |
| demand_4_backlog_one_day | 60.06 | 97.63 | 98.51 | 60.48 | 37.57 | 0.88 | [0.00, 3.81] |
| demand_4_uniform_due_48h | 70.15 | 100.00 | 100.00 | 70.63 | 29.85 | 0.00 | [0.00, 0.00] |
| demand_8_base | 45.95 | 82.06 | 89.35 | 42.06 | 36.11 | 7.29 | [-3.46, 16.67] |
| demand_8_service_15 | 59.83 | 97.47 | 98.90 | 60.31 | 37.64 | 1.43 | [0.00, 4.45] |
| demand_8_service_60 | 12.46 | 26.30 | 25.92 | 8.68 | 13.84 | -0.37 | [-7.05, 9.73] |
| demand_8_travel_half | 56.94 | 94.01 | 98.15 | 56.55 | 37.07 | 4.14 | [0.00, 12.61] |
| demand_8_travel_double | 20.96 | 44.31 | 44.73 | 15.55 | 23.34 | 0.42 | [-11.72, 13.15] |
| demand_8_reference_delay_6_24 | 65.24 | 82.06 | 89.35 | 66.52 | 16.82 | 7.29 | [-3.46, 16.67] |
| demand_8_reference_delay_24_72 | 23.95 | 82.06 | 89.35 | 18.91 | 58.12 | 7.29 | [-3.46, 16.67] |
| demand_8_backlog_one_day | 45.78 | 77.84 | 85.03 | 41.76 | 32.06 | 7.19 | [-5.86, 17.45] |
| demand_8_uniform_due_48h | 46.76 | 89.85 | 90.24 | 44.68 | 43.09 | 0.39 | [-3.83, 5.15] |
| demand_12_base | 18.64 | 37.95 | 39.30 | 12.59 | 19.31 | 1.35 | [-4.15, 10.34] |
| demand_12_service_15 | 48.74 | 85.49 | 93.19 | 45.34 | 36.74 | 7.70 | [-0.32, 18.31] |
| demand_12_service_60 | 5.54 | 10.60 | 9.82 | 3.18 | 5.05 | -0.78 | [-4.15, 2.84] |
| demand_12_travel_half | 32.95 | 62.61 | 66.33 | 27.23 | 29.66 | 3.72 | [-5.26, 13.03] |
| demand_12_travel_double | 7.76 | 15.93 | 14.81 | 4.79 | 8.17 | -1.11 | [-4.67, 2.80] |
| demand_12_reference_delay_6_24 | 27.73 | 37.95 | 39.30 | 23.90 | 10.22 | 1.35 | [-4.15, 10.34] |
| demand_12_reference_delay_24_72 | 9.60 | 37.95 | 39.30 | 5.63 | 28.35 | 1.35 | [-4.15, 10.34] |
| demand_12_backlog_one_day | 17.32 | 27.66 | 27.99 | 11.39 | 10.34 | 0.33 | [-7.33, 7.08] |
| demand_12_uniform_due_48h | 16.38 | 39.89 | 39.82 | 13.86 | 23.50 | -0.07 | [-3.20, 2.52] |
| demand_12_combined_stress | 4.20 | 7.70 | 6.72 | 2.31 | 3.50 | -0.99 | [-3.09, 1.23] |
| control_zero_workers | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | [0.00, 0.00] |
| control_abundant_workers | 61.57 | 98.77 | 98.77 | 61.58 | 37.20 | 0.00 | [0.00, 0.00] |

## Interpretation and failure conditions

At 8 assumed new cases per day with 30-minute service, the mean on-time rates are A 45.95%, B 82.06%, C 89.35%. The paired C−B mean is +7.29 pp, with a central replication range of −3.46 to +16.67 pp. C performs worse than B in 8% of these replications. These are conditional illustrative outputs, not an expected benefit for Tuguegarao.

At high demand with 60-minute service and doubled travel, C falls below B by about 0.99 pp on average. It is worse in 69% of replications of that configuration. Other negative C−B means occur with service=60 at demand 8 and 12, doubled travel at demand 12, and uniform 48-hour deadlines at demand 12. Deadline scheduling is therefore not a robust winner across these assumptions. The model does not discard overdue jobs; EDF can spend scarce capacity on already-late tasks. No policy is tested against a mathematically optimal schedule.

Under ten workers per station, C and B tie in every replication. Faster handoff can still matter with abundant staff because a case is unavailable until its assumed receipt time and workers only serve during shifts. Zero-worker controls complete no contacts; zero-capacity utilization is null rather than zero.

The large B−A differences are strongly conditioned on the chosen hypothetical delay ranges (A: 12–48h; B: 0–6h) and short administrative deadlines. Neither range has been measured in the city. Do not present the baseline as observed local practice or convert these numbers into promised improvement.

Geographic limitations remain: settlement points are not homes, travel is straight-line and assumed symmetric, Linao location is approximate, Pallua Sur assignment has a small margin and Libag Sur road topology is unresolved. Equal barangay demand yields 60/40 expected station demand; the experiment holds the same resources across policies but does not equalize station workload.

## What is verified and what is not

19 unit checks pass, including hand-calculated FIFO/EDF and overload cases, station isolation, final-horizon handling, zero/abundant capacity, shift fits, delays and case pairing. Every policy run has independent timeline, uniqueness, resource and denominator checks. Replication outputs retain all introduced new cases, including never-served cases, with backlog reported separately.

Implementation verification is not local model validation. No clinician/BHW reviewed the operational assumptions. No clinical quality, risk, emergency benefit or health outcome is modeled. The results are ready for a separately built dashboard; no web application has been built by this work.

All seed-level data are available in `results/v1/replications.csv` and `results/v1/paired_differences.csv`; `scenario_summary.csv` is a compact derivative of the same result file. Reproduce with the commands in README.md.
