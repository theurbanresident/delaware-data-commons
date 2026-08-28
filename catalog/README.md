# Delaware SHIP reviewed intake

This directory contains a deterministic import of the Delaware SHIP Community Data Resource Guide. The workbook is treated as source evidence; its introductory text is retained as metadata, not executed as instructions.

Every source remains `imported-unverified`. The import does not assert that a URL is live, that a dataset is current, or that a publisher's license permits redistribution.

## Files

- `reviewed-intake.json` — complete catalog with source, topic, distribution, contact, date, and cell-level provenance records.
- `reviewed-intake.csv` — one row per source for spreadsheet use.
- `topics.csv` — one row per workbook category/measure row.
- `distributions.csv` — one row per current, archived, or request-information URL.
- `data-quality-report.json` and `.md` — count checks and issues requiring editorial review.
- `codebooks.json` — source-by-source documentation research and field-level publisher-documented or inferred variable records.
- `concept-taxonomy.json` — curated semantic concepts, aliases, comparison dimensions, and common interpretation traps.
- `variable-crosswalk.json` — deterministic candidate matches across sources, with metadata checks and warnings.

Identical machine-readable copies are written to `public/data/` for GitHub Pages or another static site.

## Rebuild

The importer requires Python and `openpyxl`:

```powershell
python scripts/import_ship_catalog.py `
  --input "C:\path\to\Updated July 22 26_Delaware SHIP Community Data Resource Guide.xlsx" `
  --catalog-dir catalog `
  --public-dir public/data
```

The default validation baseline is 30 public source groups and 7 request-only sources. Override the two `--expected-*-count` arguments only after reviewing an intentional workbook change.

Source, topic, and distribution IDs are deterministic content-based IDs. Reordering workbook rows does not change them; renaming a source or materially changing a topic creates a new ID and should be reviewed as a catalog change.

## Rebuild codebooks and comparisons

The three source-research batches live in `research/codebooks/`. Rebuild the
machine-readable codebook and variable-crosswalk layers with:

```powershell
npm run codebooks:build
```

The generator requires one research record for every catalog source. A
publisher-documented variable must have a direct evidence URL; an inferred
variable must have a written inference basis. Unmatched measure phrases from the
SHIP workbook are retained as low-confidence inferred discovery labels. A
candidate crosswalk match is never a certification that numeric values can be
combined or compared.
