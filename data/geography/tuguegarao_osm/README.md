# Tuguegarao OSM candidate subset

Extracted read-only from the supplied Geofabrik GeoPackage. See extraction_summary.json for counts and bounds, sources.txt for provenance, and the adjacent extraction script for reproduction.

## Interpretation

- The area is an OSM city-boundary bounding box with a small halo, not an official administrative clip. Neighboring areas may appear.
- city_boundary.geojson is an OSM boundary, not a PSA-certified boundary. places.geojson is a reference-point layer, not a confirmed one-to-one barangay list. Join to PSA codes only after checking names and coordinates.
- Health features include pharmacies, dentists and veterinary features where present. They are not all eligible postnatal facilities or BHSs. Points and areas may duplicate a facility. Do not assign clinical destinations until verified.
- health_candidates.csv polygon reference points are bbox midpoints, not validated entrances or population-weighted centroids.
- roads.geojson contains mapped road segments. It is not yet a validated routing graph. Missing/zero maxspeed does not mean zero travel speed. Travel times require explicit assumptions and network checks.
- Features retain source IDs, geometry, and source attributes. No restricted DHS records are used. Keep PSA census population authoritative rather than OSM place-population tags.
- Preserve OpenStreetMap attribution and applicable ODbL requirements for redistribution. No app or simulation has been implemented by this extraction.
