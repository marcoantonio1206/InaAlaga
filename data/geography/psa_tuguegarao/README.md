# Tuguegarao PSA barangay and population reference

Source: Philippine Statistics Authority, https://psa.gov.ph/classification/psgc/barangays/0201529000 , retrieved October 18, 2026. Attribution: Philippine Statistics Authority. Reuse under the site's CC BY 4.0 notice unless otherwise stated; https://psa.gov.ph/terms-of-use . Changes: transcription into CSV, addition of provenance fields; no values intentionally altered.

`barangays_population_2024.csv` contains all 49 barangays, PSGC and correspondence codes as text, source urban/rural labels and 2024 POPCEN population. Counts sum to the page's city total of 167,297. `source_manifest.json` records acquisition, validation and checksum. Codes must retain leading zeros; importing CSV into Excel may require explicitly choosing Text for both code columns.

The table explicitly says “as of 31 July 2025.” Its newer publication links do not make these rows a verified September 2026 classification. Urban/rural classification vintage was not independently confirmed. Do not use the 2024 population year as the geography vintage.

This is a recovered source table, not the earlier missing Downloads text. Total population does not measure postpartum demand. No barangay boundaries, homes, station catchments or facility coordinates are supplied here.

The main simulation assumption is equal probability across the five selected pilot barangays. Population-based allocation is optional sensitivity only; see ../../simulation/demand_allocation.json. Station assignment and travel assumptions remain unresolved. No synthetic cases or policy results were generated.
