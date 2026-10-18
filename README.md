# InaAlaga — team handoff

Project state: October 18, 2026. Start with [team context](docs/TEAM_HANDOFF.md), then [PRD](docs/InaAlaga_PRD.md), then [location findings](data/locations/tuguegarao_review/README.md).

No application or policy simulation has been built yet. This is a curated handoff, not the complete local master folder or chat export.

## Published statistics verification

Read the [PSA NDHS verification report](data/context/psa_ndhs_verification/README.md) before citing maternal-care figures. It records exact table cells, population definitions, source links and remaining provenance limits. The [checked indicators](data/context/psa_ndhs_verification/checked_indicators.csv) are published aggregates, not respondent records.

## Current pilot inputs

The [pilot v2 specification](data/geography/pilot_v2/README.md) is the current five-barangay selection, station lookup and approximate travel matrix. It supersedes the earlier grouping in the historical location review. Reproduce it with `python3 data/geography/build_pilot_v2.py`. These are geographic/model inputs, not policy results or verified catchments.

## Included

Team-authored planning documents, a small OSM geographic extract and extraction script, and narrative location findings/source links. The location report describes additional local working tables that are intentionally not included here.

## Intentionally excluded

DHS microdata, all restricted audit outputs, raw conversation logs, secrets, raw NHFR exports and registry-derived joined tables whose reuse terms are unresolved, the national GeoPackage, and WHO extracts pending separate license packaging. A private repository does not waive third-party terms. Facility identities in narrative findings are context, not a licensed registry dump or referral directory. The full location-matching script depends on excluded registry tables and is also withheld.

## Geography and reproduction

OSM files are already extracted; use the small GeoJSON files for the pilot. Re-extraction requires a separately obtained Philippines Geofabrik GeoPackage and `python3 data/geography/extract_tuguegarao.py /path/to/philippines.gpkg`. The national file is not bundled. Source snapshot cutoff is not independently verified.

## Attribution and licensing

Geographic database material: © OpenStreetMap contributors, distributed by Geofabrik GmbH; Open Database License 1.0 (ODbL). Preserve attribution and applicable database share-alike obligations. See https://www.openstreetmap.org/copyright and data/geography/tuguegarao_osm/sources.txt. Source-specific terms apply separately from team-authored documents; no blanket software license is assigned by this handoff. Sources cited in documents are not automatically included datasets.

## Continuing with Claude

Select this README, docs/TEAM_HANDOFF.md, docs/InaAlaga_PRD.md and the location README first. Add relevant geographic files as needed. Keep measured facts, decisions, assumptions, and unresolved questions separate. Agree on pilot station allocation before policy experiments.
