# Reviewed-intake data quality report

Source workbook: `Updated July 22 26_Delaware SHIP Community Data Resource Guide.xlsx`  
SHA-256: `2f9f0d2bb5f1bf523864a86a64f4e57e8a45a17684e0f59bf4afddfd242418ac`

This is an import-time review, not a claim that linked resources are currently available or authoritative.

| Metric | Count |
|---|---:|
| Public sources | 30 |
| Request-only sources | 7 |
| Total sources | 37 |
| Topics / measure rows | 126 |
| Current links | 37 |
| Archived links | 11 |
| Request-information links | 1 |
| Unique URLs | 49 |
| Preserved non-empty cells | 537 |
| Review warnings | 27 |

## Validation checks

| Check | Result | Expected | Actual |
|---|---|---|---|
| expected-public-source-count | PASS | 30 | 30 |
| expected-request-only-source-count | PASS | 7 | 7 |
| unique-source-ids | PASS | 37 | 37 |
| unique-topic-ids | PASS | 126 | 126 |
| unique-distribution-ids | PASS | 49 | 49 |
| review-status-set | PASS | imported-unverified | ['imported-unverified'] |
| source-cell-provenance | PASS | at least one raw cell per source | 37 |

## Review warnings

| Issue | Source | Cells | Detail |
|---|---|---|---|
| display-hyperlink-mismatch | America's Health Rankings (United Health Foundation) | G24 | Visible URL is https://www.americashealthrankings.org/explore/states/DE; hyperlink target is https://www.americashealthrankings.org/explore/measures |
| display-hyperlink-mismatch | Map the Meal Gap 2025 (Feeding America) | H53 | Visible URL is https://www.feedingamerica.org/sites/default/files/2023-05/Map%20the%20Meal%20Gap%202023.pdf; hyperlink target is https://www.feedingamerica.org/sites/default/files/2024-05/MMG%202024%20Executive%20Summary%20%281%29.pdf |
| display-hyperlink-mismatch | Map the Meal Gap 2025 (Feeding America) | H53 | Visible URL is https://www.feedingamerica.org/sites/default/files/2022-09/Map%20the%20Meal%20Gap%202022%20Report_0.pdf; hyperlink target is https://www.feedingamerica.org/sites/default/files/2024-05/MMG%202024%20Executive%20Summary%20%281%29.pdf |
| display-hyperlink-mismatch | Education Data Reports (39) (Delaware Department of Education) | G86 | Visible URL is https://education.delaware.gov/community/data/reports/#enrollment; hyperlink target is https://education.delaware.gov/community/data/reports/ |
| display-hyperlink-mismatch | DELAWARE Statistics on children, youth and families in Delaware (Annie E. Casey Foundation and KIDS COUNT) | G113 | Visible URL is https://datacenter.aecf.org/data?location=DE#DE/2/0/char/0; hyperlink target is https://datacenter.aecf.org/data?location=DE |
| missing-category | Youth Risk Behavior Survey (UD Center for Drug & Health Studies) | — | No data category was supplied in the workbook. |
| missing-category | Delaware School Survey (UD Center for Drug & Health Studies) | — | No data category was supplied in the workbook. |
| missing-category | Youth Tobacco Survey (UD Center for Drug & Health Studies) | — | No data category was supplied in the workbook. |
| missing-category | National Survey of Children's Health (The Child and Adolescent Health Measurement Initiative) | — | No data category was supplied in the workbook. |
| missing-category | Vaccination Coverage Among Young Children (CDC) | — | No data category was supplied in the workbook. |
| missing-category | Trends in College Pricing (College Board) | — | No data category was supplied in the workbook. |
| missing-category | Statistics for Tax Returns with the Earned Income Tax Credit (IRS) | — | No data category was supplied in the workbook. |
| missing-category | CoC Homeless Populations and Subpopulations (HUD) | — | No data category was supplied in the workbook. |
| missing-background | Delaware Health and Social Services | — | Background cell is blank. |
| missing-category | Delaware Health and Social Services | — | No data category was supplied in the workbook. |
| missing-background | Food Bank of Delaware | — | Background cell is blank. |
| missing-category | Food Bank of Delaware | — | No data category was supplied in the workbook. |
| missing-background | Medicaid Project (DMMA/CCRS) | — | Background cell is blank. |
| missing-category | Medicaid Project (DMMA/CCRS) | — | No data category was supplied in the workbook. |
| missing-background | DE 211 | — | Background cell is blank. |
| missing-category | DE 211 | — | No data category was supplied in the workbook. |
| missing-background | Delaware Libraries | — | Background cell is blank. |
| missing-category | Delaware Libraries | — | No data category was supplied in the workbook. |
| missing-background | Delaware Department of Services for Children Youth & Their Families | — | Background cell is blank. |
| missing-category | Delaware Department of Services for Children Youth & Their Families | — | No data category was supplied in the workbook. |
| missing-background | Delaware State Police | — | Background cell is blank. |
| missing-category | Delaware State Police | — | No data category was supplied in the workbook. |

All source records remain `imported-unverified`; URL checks and editorial verification happen in later stages.
