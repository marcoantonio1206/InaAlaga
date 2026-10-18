# PSA published NDHS verification

Checked October 18, 2026. This operation reads published aggregate sources only. No restricted DHS files or respondent-derived audit files were processed. Originals and PRD unchanged. This report and the checked aggregate indicators are included in the curated team handoff; the original source workbook and PDF are not bundled.

## Source identity

- Local workbook: `Statistical Tables_3.xlsx`, 1,300,022 bytes, SHA-256 `8231f218911c25da27cc3c2cfd3cdfc46ebd198a2126e36d9eb61c4ba4e25553`. Contains 21 sheets of aggregate statistical tables. Table 6 is Maternal care indicators and compares survey years 2025 and 2022. It is not a respondent dataset.
- Official landing page: https://psa.gov.ph/statistics/national-demographic-health-survey/stat-tables . Its March 30, 2026 release, “Fertility Steadily Declines: Results from the Key Indicators of the 2025 National Demographic and Health Survey,” links a 1.24 MB workbook at https://psa.gov.ph/sites/default/files/dhsd/Statistical%20Tables_3.xlsx . Filename, approximate listed size, subjects and years agree. Direct download returned HTTP 403, so a byte-for-byte comparison is NOT established. This is source-link identification plus local-content verification, not proof the local file is identical to the current hosted file.
- Local PDF: `CAR-SSR-2023-25_2022-NDHS-Maternal-Care-and-Child-Health-3.pdf`, 520,314 bytes, SHA-256 `3a926fe795da7eb8625850bf4a0ffe8b4c8a1f35326da02ee23bfce6aad6ea83`, 7 pages. Publisher PSA Cordillera, May 18, 2023, SSR 2023-25. Official page https://rssocar.psa.gov.ph/content/2022-national-demographic-and-health-survey-ndhs-key-indicators-maternal-care-and-child links https://rssocar.psa.gov.ph/system/files/attachment-dir/CAR-SSR-2023-25_2022-NDHS-Maternal-Care-and-Child-Health.pdf . Official PDF was opened and its relevant text agrees with the local file; local page 6 chart was also rendered and inspected. No binary identity claim is made.

## Values checked in local Table 6

| Geography / population section | Survey year | Facility delivery % | Maternal check within first 2 days after birth % | Facility / check cells |
| --- | --- | ---: | ---: | --- |
| Cagayan Valley, live births | 2025 | 94.7 | 61.2 | J20 / N20 |
| Cagayan Valley, live births | 2022 | 94.3 | 79.9 | Y20 / AC20 |
| Philippines, live births | 2025 | 93.7 | 76.6 | J51 / N51 |
| Philippines, live births | 2022 | 88.4 | 75.4 | Y51 / AC51 |
| Philippines, live births and stillbirths | 2025 | 93.5 | 76.5 | J55 / N55 |
| Philippines, live births and stillbirths | 2022 | 88.5 | 75.5 | Y55 / AC55 |

The regional rows appear under A6 “LIVE BIRTHS”; they must not be described as all mothers with either live births or stillbirths merely because the overall table title covers both. Rows 53 and 55 provide separate national stillbirth and combined summaries. This is an important precision correction to broad wording in earlier context, not a change to the numerical regional values.

Facility delivery counts births in the preceding two years. Maternal postnatal care counts eligible women aged 15–49 with a recent live birth, referring to the most recent birth. The table footnote includes checks by doctors, nurses, midwives, traditional birth attendants/hilot, and BHWs; do not rename it skilled-provider-only care. Technical notes for the same release: https://psa.gov.ph/sites/default/files/dhsd/Technical%20Notes_0.pdf . These explicitly describe the maternal postnatal sample as women with a live birth in the preceding two years and explain weighting/normalization.

The regional table's displayed counts include 68 births (L20) and 65 women (O20) for 2025, versus 103 births (AA20) and 101 women (AD20) for 2022. Do not call these city caseloads, population totals or independently verified unweighted sample sizes. Survey estimates use weights, and the raw unweighted regional sample sizes and design-based confidence intervals were not established here. The table's parentheses note refers specifically to estimates based on 25–49 unweighted cases. It does not authorize converting every displayed table count to an unweighted sample count.

## PDF inconsistencies

Page 6 explicitly reports national 75.4% and its chart shows Region II 79.9%; the chart labels were visually checked. Page 5 instead shows national 76.0% in its summary graphic. Use the workbook's labeled population section for exact numbers, not the PDF graphic. Page 6's prose describes live births and/or stillbirths but assigns 75.4%; in the newer comparative workbook 75.4% is the live-birth figure and 75.5% the combined figure. Preserve this discrepancy rather than silently treating those denominators as identical.

## Appropriate use in InaAlaga

Suggested background statement: “In the published 2025 NDHS tables, 61.2% of women aged 15–49 with a live birth in the preceding two years in Cagayan Valley received a postnatal check within the first two days after birth.” Cite Table 6, N20, survey year 2025; retain the local-copy provenance caveat until a matching official download is obtained. It is a regional survey estimate, not a Tuguegarao measurement or a current individual probability.

The 94.7% facility-delivery and 61.2% postnatal figures have different denominators and are not linked individual transitions. Their 33.5 percentage-point difference is NOT a handoff-failure rate. No clinical care or contact after discharge is isolated by this summary indicator: its time origin is birth, not discharge. Likewise the 2022–2025 point-estimate difference does not establish a statistically significant decline without survey uncertainty and comparability checks.

These public aggregates can support problem context. They do not estimate local discharge volumes, handoff delays, BHW capacity, travel speed, official catchments, or policy effectiveness. Do not use them to reconstruct patient rows or substitute observed local simulation parameters.

## Sharing and next action

PSA terms https://psa.gov.ph/terms-of-use classify site statistical tables/documents as open material under attribution terms; the site footer specifies CC BY 4.0 unless otherwise stated. Preserve publisher, survey year, exact table and denominator, source URL, retrieval date and any changes. No special contrary restriction was found in the inspected relevant table notes. This is distinct from permissions for restricted DHS respondent files.

No new download is necessary to continue reviewing/using the local published aggregates with those caveats. For a fully verified public source bundle, download the workbook manually from the official landing page and compare its hash or relevant cells, because automated acquisition was blocked. Avoid claiming exact file authenticity until then. The PDF may remain a supplementary historical reference; prefer the tabular denominator labels when citing exact estimates.
