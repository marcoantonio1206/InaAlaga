# Pilot v2: five barangays, two demo stations, approximate travel

Decision date: October 18, 2026. User authorized the revised pilot and PRD distance-based travel fallback. These files supersede the original five-barangay proposal and its manual station grouping for future demo/simulation inputs. Historical data/locations/tuguegarao_review outputs remain a record of the earlier review. At this geography-input freeze, no synthetic cases or policy outcomes had been generated. The later generator and experiments are now documented separately in ../../../simulation/README.md. PRD v1.0 remains intact; this is its geographic input addendum.

## Selection before policy outcomes

Eligible references must have an exact PSA/OSM name match, fall inside the supplied OSM city boundary, and be at most 5 km straight-line from the nearer of the two station reference points. Ambiguous names such as Balzain West/Centro 12 are excluded rather than automatically reconciled. Five km is a chosen compact demonstration footprint, not an official service radius. Reference points are approximate settlements, not household locations or population-weighted centroids. City containment does not establish barangay-boundary membership.

Among each station's eligible references ordered by unrounded distance then PSGC, select near/lower-middle/far for Linao West and near/far for Tanza. The odd-number quota of 3/2 is a demonstration design choice. The full candidate table records all name-matched, city-contained points, including those outside the footprint, so selection can be audited. No selection depends on patient outcomes, gains or policy rankings. The selection is not representative of the whole city.

| Barangay | PSGC | Assigned demonstration station | Straight-line km | Assumed one-way minutes |
| --- | --- | --- | ---: | ---: |
| Linao West | 0201529047 | Linao West | 0.025 | 5.00 |
| Atulayan Norte | 0201529002 | Linao West | 1.193 | 5.00 |
| Pallua Sur | 0201529049 | Linao West | 3.501 | 14.00 |
| Caritan Norte | 0201529019 | Tanza | 1.645 | 6.58 |
| Libag Sur | 0201529045 | Tanza | 3.533 | 14.13 |

Equal 20% probability per barangay implies 60% expected demand at Linao West and 40% at Tanza, not equal station workload. Realized counts vary. With unchanged one-worker-per-station assumptions, queue differences can reflect this imbalance; do not claim equal workload or interpret near/far subgroup differences as an isolated causal travel effect.

## Assignment and uncertainty

Choose the minimum unrounded haversine distance, breaking exact ties by internal station ID. Distances are a proxy for estimated journeys, not a claim of shortest road journey. Choose before imposing the five-minute time floor, which can create time ties. Keep this lookup fixed across policies and travel multipliers. This implements nearest-distance DEMONSTRATION routing, not government catchments, referral acceptance or real patient advice.

Tanza's facility match is supported; Linao West's is approximate and its Alaw Street/entrance is unconfirmed. All candidate household origins are settlement reference points. Pallua Sur's station-distance margin is only about 0.170 km (Linao 3.501 vs Tanza 3.671); its assignment is particularly sensitive to approximate points or road detours. Keep that caveat visible and do not imply an operational recommendation. Station eligibility and staffing remain assumptions.

## Travel formula

Use haversine distance with mean Earth radius 6371.0088 km:

`baseline_one_way_minutes = max(5, distance_km / 15 * 60)`

Fifteen km/h and a five-minute minimum are modeling assumptions, not measured speeds or clinical timing. The same value is assumed for outbound and return travel. Round-trip travel consumes twice the one-way time; add service duration separately in the later simulation. Do not round stored times to whole minutes when comparing deadlines.

Sensitivity: multiply the baseline travel time by 0.5, 1 or 2 AFTER applying the floor. Consequently the faster scenario may have a 2.5-minute minimum and the slower one a 10-minute minimum. Do not reapply the five-minute floor after multiplying. These are travel-duration multipliers, not newly measured speeds. Station assignments and total resources stay fixed.

All ten barangay/station pairs are saved, including the unassigned alternative. No actual routes or observed travel minutes are asserted. Rivers, road detours, barriers and private access can make real journeys substantially longer. The very short Linao West point distance does not represent all households; its minimum time is an explicit simplification.

## Road checks

The separate road screen respects one-way directions and exact shared vertex coordinates plus layer/bridge/tunnel state. It does not connect arbitrary geometric crossings. Footways, paths, tracks, pedestrian streets, steps and busway are excluded. Original attributes remain in the source files. The point-to-nearest-road-vertex gaps range from about 7 to 35 m; these are geometric gaps, not certified entrances or traversable connectors.

Eight of ten station-to-barangay pairs connect in this conservative screening graph. Both links to Libag Sur are disconnected in the screen, despite its point being about 7 m from a mapped Maharlika Highway vertex. Different layer/bridge/tunnel states are not joined, including at transitions; missing topology can therefore create false disconnections. This is unresolved map topology, not evidence that Libag Sur is physically inaccessible. Do not silently repair crossings or invent a routed distance. Libag Sur remains an approximate geography scenario using the explicitly approved straight-line fallback, not a road-validated destination.

The graph lacks original node identities, access/motorcycle restrictions, barriers and turn restrictions. None of these pairs is a validated legal driving route. The travel matrix deliberately does not use graph lengths. A future verified road method must be a new version of the inputs, applied consistently across policies before results are examined.

## Files, reproduction and sources

Run `python3 data/geography/build_pilot_v2.py` from the project root. It reads only public PSA/OSM inputs and regenerates candidate selection, five pilot references, stations, travel and sensitivity matrices, road-screen diagnostics, assumptions, and the separate demand-allocation JSON. It does not generate patients or run policies. The script has no national GeoPackage or NHFR table dependency. README narrative is maintained separately.

- `candidate_selection.csv`: full considered name-matched candidate set and selection flags.
- `barangays.csv`, `stations.csv`: canonical v2 reference identities and uncertainty.
- `travel_matrix.csv`: 10 baseline pairs; five assigned flags.
- `travel_sensitivity.csv`: 30 pairs/scenarios.
- `road_screen.csv`, `road_connectivity_screen.csv`: diagnostic proximity and topology limits.
- `assumptions.json`: decision rules, units, limits and input/script hashes.
- `../../simulation/demand_allocation.json`: matching uniform demand specification.

Sources: Philippine Statistics Authority, https://psa.gov.ph/classification/psgc/barangays/0201529000 (table says July 31, 2025; population 2024 POPCEN; retrieved October 18, 2026), CC BY 4.0 unless otherwise stated, https://psa.gov.ph/terms-of-use . OSM contributors, distributed by Geofabrik, https://download.geofabrik.de/asia/philippines.html ; ODbL, https://www.openstreetmap.org/copyright . Retain attribution and applicable database share-alike obligations. This joined geography is derived database material with source-specific terms, not a blanket code license. Exact OSM snapshot cutoff is unverified. Internal station IDs do not assert official institutional approval.
