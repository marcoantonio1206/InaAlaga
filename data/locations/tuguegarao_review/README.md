# Tuguegarao location review and proposed pilot

Reviewed October 18, 2026 (Asia/Manila). This is a local working evidence package, not a publication-cleared dataset or a referral directory. The PRD and all source datasets remain unchanged. No application, synthetic patient generator, or policy simulation was built or run. Restricted DHS files and respondent-derived audit contents were not opened.

## Decision and evidence status

**Approved scope:** one discharge-facility reference, two demonstration receiving stations, five barangays, entirely fictional operational records. Registry inclusion and a map match do not establish postnatal referral acceptance, training, staffing, opening hours, or official catchments.

**Recommendation:** use CVMC as the discharge reference, Tanza BHS as a supported mapped demonstration receiving station, and Linao West BHS/Health Center as an approximate mapped demonstration receiving station. Keep the latter's approximation visible. This is a proposed pilot, not a newly approved clinical arrangement. Linao West still needs confirmation of its Alaw Street address and actual access point.

| Role | Registry identity | OSM identity and layer | Reference longitude, latitude | Location status |
| --- | --- | --- | --- | --- |
| Discharge reference: CVMC | DOH000000000002162 | 775561027; gis_osm_pois_a_free | 121.74712305, 17.6565835 | Supported match; campus bounding-box midpoint, not entrance |
| Demonstration receiving station: Tanza BHS | DOH000000000009429 | 3641821237; gis_osm_pois_free | 121.7365289, 17.6274872 | Supported match; mapped POI, not verified doorway |
| Demonstration receiving station: Linao West BHS | DOH000000000030141 | 4412908190; gis_osm_pois_free | 121.7169282, 17.6502689 | Approximate; Health Center/BHS identity candidate |

“Supported match” means identity and mapped vicinity have corroborating spatial/address evidence; it does not certify survey accuracy. “Approximate” means a plausible facility candidate remains subject to address/alias or geometry uncertainty. “Unresolved” means no accepted coordinate, which remains blank. These statuses describe location only.

CVMC's distinctive name, campus polygon, and adjacent Dalan na Pagayaya align with the government's PhilGEPS address (S2). Its registry's Maharlika Highway/Carig wording is broader; retain both rather than overwriting either. A road is about 88 m from the polygon midpoint along Dalan na Pagayaya, and an internal mapped service road is about 34 m away. Neither identifies the entrance.

Tanza's exact facility name and Maharlika Highway registry address align with a mapped primary road approximately 14 m away. Its point is inside the supplied OSM city boundary. No independent official precise coordinate or facility entrance was found.

Linao West's name variant, mapped clinic class, city containment, and settlement reference approximately 25 m away support a locality-level candidate. A residential road is about 33 m away; the registry's Alaw Street is not named nearby in this extract. This missing corroboration prevents promotion to Supported match. The settlement proximity is supporting locality evidence, not independent facility verification.

## Pilot selected before policy results

Selection uses available facility evidence and a compact western/northern geographic comparison. No policy outcomes exist. The five name/code pairs were checked anew on the official PSA city page (S1); the missing earlier text was not silently reused. That page labels its barangay table **as of July 31, 2025**, even though it also links newer PSGC publications. This review does not claim a September 2026 classification join. No population weights were imported.

| Barangay | PSGC text | Proposed station grouping | Screened outward road distance from grouped station |
| --- | --- | --- | ---: |
| Linao West | 0201529047 | Linao West | 0.010 km |
| Linao East | 0201529027 | Linao West | 0.453 km |
| Linao Norte | 0201529046 | Linao West | 0.794 km |
| Annafunan West | 0201529038 | Tanza | 3.749 km |
| Atulayan Sur | 0201529039 | Tanza | 2.931 km |

These are OSM settlement reference points, not actual homes, barangay centroids, or facility locations. The very short Linao West road distance reflects nearly co-located reference points, not a typical household journey. Road lengths exclude straight geometric connectors: approximately 33 m at Linao station, 14 m at Tanza, and 1–28 m at the five settlement references. See the per-reference connector table.

**Grouping is an explicit demonstration allocation, not a nearest-station result.** In fact all five settlement references are geometrically closer by the screened outward network to Linao West than to Tanza. The proposed grouping creates a near/far comparison but cannot be described as optimal routing or real catchments. A strict nearest-station rule would leave Tanza unused for this particular five-point subset. Before simulation, choose and document either the fixed demo grouping or a separately justified, geographically broader subset for nearest-station allocation; do not switch after seeing policy results. Until then, the station grouping is a proposal, not a frozen simulation input. If the current grouping is retained, near/far differences conflate station allocation and distance and must not be interpreted as a causal travel effect.

## Other matches and rejected shortcuts

The 48 registry facilities have 2 Supported match, 10 Approximate, and 36 Unresolved locations. The complete table preserves each DOH ID and its registry address separately from the candidate OSM layer/ID and coordinate method. Other hospitals mostly have distinctive name candidates but lack independently reconciled exact addresses; they remain Approximate rather than being promoted by name similarity. The current People's General Hospital remains Unresolved: the mapped People's Emergency Hospital name is insufficient to establish the Luna Street facility identity.

Four of the 42 health features fall outside the supplied OSM city polygon: Lasam Medical Clinic, Rodamel Drug Store, Rural Health Unit (near the Enrile town reference), and Solana Municipal Health Office. They are excluded from this pilot, not inferred to be Tuguegarao facilities from the extraction bounding box. This boundary test is not an official jurisdiction determination.

The old “Devine mercy hospital” point and the Divine Mercy Wellness polygon are separate candidates; relocation/current identity remains unresolved. Pharmacies and dentists are excluded from receiving-station consideration. No automatic point/polygon merges were performed.

Carig Norte and Carig Sur BHS retain separate registry identities despite their common 0201529018 code. Both facility coordinates remain blank. PSA's inspected city table also uses the single Carig entry; this does not resolve the north/south naming issue or authorize assigning either BHS the CVMC coordinate.

The RHU, DOH000000000000148, is an alternate candidate. The OSM City Health Office point is near Main Avenue (38 m), and official LGU material confirms an Urban Health Center project in San Gabriel (S4). The PhilHealth search-indexed historical entry also agrees on the registry address (S3), but its PDF returned 404 on direct retrieval. Neither proves that the OSM point is the same building. It remains Approximate and is not substituted silently for a verified RHU entrance.

## Road screening and its limits

The reproducible script screens 3,537 of 3,860 road features. It excludes tracks, paths, footways, steps, pedestrian roads and busway for a conservative motor-road geometry check. It respects Geofabrik B/F one-way directions (S7), joins only identical vertex coordinates with matching layer/bridge/tunnel state, inserts each selected road projection into that segment, and never creates intersections at arbitrary crossings. Original one-way, bridge, tunnel and layer attributes are retained. Different bridge/layer states are deliberately not joined; this may create conservative false disconnections at transitions. Original OSM graph node IDs are unavailable, so even exact coordinate joins remain a topology approximation.

All 56 directed pairs among the three facility references and five settlement points are connected in this screened graph. Directed road distances from CVMC to the stations and in reverse are recorded separately in the CSV; do not assume symmetry. Paths retain contributing road IDs in GeoJSON for review. Lengths use a local equirectangular metre approximation at latitude 17.62 degrees, suitable for this screening scale, not survey distances.

**Legal or practical motor access is unverified.** The supplied road schema lacks access, motor_vehicle/motorcycle, surface, barriers and turn restrictions. A service road may be private; a geometric connector may cross a wall. Excluding footways and preserving one-way fields does not establish a validated driving route. No measured or assumed travel minutes are produced, and zero/blank maxspeed values are never treated as zero speed. The existing PRD's distance-based travel fallback remains available as an explicitly assumed method for a later task; it is not applied here.

## Files and reproduction

Run `python3 data/locations/review_locations.py` from the workspace, using Python's standard library. The script reads only local cleaned candidate/extraction files, never the restricted audit data or microdata. Manual links are explicit review decisions in the script; re-running does not independently reverify the web sources.

- `facility_location_review.csv`: all 48 registry identities, status, candidate location, evidence and release hold.
- `osm_candidate_review.csv`: all 42 map candidates, city-polygon screen and exclusions.
- `proposed_demo_facilities.csv`: the three proposed facilities, retaining uncertainty.
- `pilot_barangays.csv`: five references, PSA name/code provenance and proposed grouping.
- `road_access_screen.csv`: nearest screened road projections and unverified connectors.
- `connectivity_distances.csv`: all 56 ordered pairs; road metres and blank travel minutes.
- `screened_paths.geojson`: path geometry and road source IDs; no simulated visits.
- `review_summary.json`: counts, method limits and SHA-256 hashes of local inputs/script.
- `sources.csv`: primary-source URLs, evidence access status, reuse caveats.
- `file_inventory.csv`: current existence check for supplied paths and workspace reference files.

Validation checks cover unique registry identities, blank unresolved coordinates, ten-digit leading-zero pilot codes, all ordered pairs, and distance-only output. Successful execution verifies these invariants, not real-world validity.

## Publication and outstanding evidence

OSM-derived geography requires OpenStreetMap attribution and applicable ODbL obligations (S6). Keep it separate from code licenses. PSA names/codes require attribution and source vintage (S1/S5). The inspected PSA page states CC BY 4.0 unless otherwise specified. The joined registry/OSM tables remain **local review material on hold** until NHFR export reuse terms are confirmed. The registry portal was not retrievable in this browser session; no license permission is inferred from public accessibility. PhilGEPS, LGU and historical PhilHealth sources support address context, not current staffing or postnatal-service accreditation. No source PDFs or contact details are copied into this package.

Outstanding evidence is specific: an official or facility-confirmed pin/site plan for Linao West BHS on Alaw Street and its entrance; current receiving-service/staff confirmation for either station; any official catchments; RHU/City Health Office co-location evidence if it becomes the alternate; NHFR export reuse terms; and richer road restrictions or explicit acceptance of approximate travel assumptions. No source resubmission is needed for the completed review. A public release must still be built from a separate explicit allowlist; this folder is not automatically cleared for upload.
