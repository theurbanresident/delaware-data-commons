# Delaware Data Commons

Delaware Data Commons is an independent, public index of open data
relevant to Delaware communities. It is being designed to make scattered
datasets easier to find, understand, cite, monitor, and eventually combine into
well-documented, analysis-ready data products.

The project is not an official State of Delaware service and does not replace
the original data publishers. A successful automated check means only that a
distribution was reachable and met a small technical contract at a particular
time. It is not an endorsement of the data's accuracy, timeliness, or fitness
for a particular purpose.

## Project status

This repository is in Phase 0/1. It currently establishes the public-site,
governance, schema, and monitoring foundations. The source inventory is still
being reviewed; imported spreadsheet rows must be treated as unverified intake
until a curator confirms their publisher, coverage, definitions, access method,
and licensing.

The repository must remain active for weekly monitoring. Do not enable GitHub's
read-only **Archive repository** setting while the project is maintained.

## What this project will provide

- A human-readable catalog with stable dataset and distribution identifiers.
- Plain-language descriptions, coverage, update cadence, limitations, rights,
  citations, and field-level dictionaries.
- Source-by-source public codebook research with inferred metadata visibly
  separated from publisher-documented fields.
- Deterministic candidate comparisons for similarly named variables, with
  unit, population, geography, time, and method review warnings.
- A versioned, provider-neutral prompt guide library for careful AI-assisted
  interpretation, with explicit human-review checkpoints.
- Weekly bounded checks of public landing pages, files, and APIs, with access,
  freshness, and integrity reported as separate dimensions.
- A public history of observed moves, outages, recoveries, and breaking changes.
- Reproducible, versioned derived products with provenance and quality tests.
- Machine-readable exports based on DCAT, CSVW, JSON Schema, and PROV concepts.

## Two views, one catalog

The public site defaults to **Community view**, which uses shorter explanations
and emphasizes what a source may help answer, how to get it, and what to check
before use. **Technical view** reveals stable IDs, parsed fields, dates,
monitoring state, workbook cells, raw record JSON, and provenance. The switch is
a presentation preference only: both views render the same canonical catalog
record and no second dataset is maintained.

Visitors can share the detailed presentation by adding `?view=technical` to a
site URL. The preference is also stored on the visitor's device.

## Repository map

| Path | Purpose |
| --- | --- |
| `app/` | Public web application. |
| `catalog/codebooks.json` | Generated publisher-documented and inferred variable metadata. |
| `catalog/concept-taxonomy.json` | Curated concepts and comparison cautions. |
| `catalog/variable-crosswalk.json` | Generated cross-source candidate matches and checks. |
| `catalog/prompt-guides.json` | Canonical copy-and-paste prompt guides, safety rules, versions, and human-review gates. |
| `research/codebooks/` | Dated source-by-source documentation research. |
| `schemas/` | Versioned JSON Schemas for catalog and monitoring output. |
| `monitoring/` | Standard-library Python monitor and its operational policy. |
| `tests/` | Application and monitor tests, including offline fixtures. |
| `.github/workflows/` | Least-privilege validation, monitoring, audit, and Pages templates. |
| `GOVERNANCE.md` | Roles, decisions, releases, stewardship, and succession. |
| `DATA_LICENSING.md` | Rules for metadata, source files, and derived products. |
| `CORRECTIONS.md` | Transparent correction and dispute process. |
| `CHANGELOG.md` | Human-readable release history. |

Catalog records and generated status history will be added as separately
reviewed work. Large or repeatedly changing source files do not belong in Git.

## Local development

The public site requires Node.js `>=22.13.0`:

```bash
npm ci
npm run dev
```

Useful checks:

```bash
npm run lint
npm test
npm run codebooks:build
npm run prompts:build
python -m unittest discover -s tests -p "test_*.py"
python -m monitoring.generate_targets --catalog catalog/reviewed-intake.json --output build/targets.json
python -m monitoring.monitor --input build/targets.json --output build/status.json
```

The monitor uses only the Python standard library. `monitoring/targets.json` is
an empty offline example; production targets are generated from reviewed public
catalog distributions. Request-only sources remain cataloged but are excluded
from outage probes. Endpoint failures are observations and do not cause a scan
to exit unsuccessfully. Configuration, parser, or output failures do.

The Pages workflow is disabled until an administrator sets the repository
variable `ENABLE_GITHUB_PAGES` to `true`. Enable it only after the site build
produces a static `dist/client/index.html`; a server-only Vinext asset directory
is not a deployable Pages site. The workflow checks this invariant before it can
receive deployment permissions. Project-site builds default to the repository
name as their base path and the standard `github.io` URL. Repository variables
`PAGES_BASE_PATH` and `NEXT_PUBLIC_SITE_URL` can supply non-empty overrides.

## Monitoring safety model

Remote URLs and response metadata are untrusted input. The monitor:

- allows HTTPS on the default port by default;
- rejects embedded credentials, fragments, private, loopback, link-local,
  multicast, reserved, and otherwise non-global IP addresses;
- revalidates each redirect and caps redirects, retries, response bytes, and
  request time;
- uses bounded `GET` requests because many data portals mishandle `HEAD`;
- requests identity encoding and never executes or extracts downloaded content;
- stores no response bodies and removes URL query strings from observations;
- distinguishes blocked and rate-limited access from confirmed removal.

DNS can change between validation and connection, so the production workflow
uses a GitHub-hosted runner with no project secrets or private-network access.
See `SECURITY.md` and `monitoring/README.md` for the complete threat model.

## Standards and interoperability

The local schemas are intentionally small and versioned. Generated exports can
map them to:

- [W3C DCAT 3](https://www.w3.org/TR/vocab-dcat-3/) for datasets,
  distributions, services, series, versions, and checksums;
- [DCAT-US](https://resources.data.gov/resources/dcat-us3/) for U.S. catalog
  interoperability;
- [W3C CSVW](https://www.w3.org/TR/tabular-metadata/) for tabular dictionaries
  and constraints;
- [W3C PROV-O](https://www.w3.org/TR/prov-o/) for derived-product lineage; and
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) for the public interface.

## Participate

The site's **Contribute** page links to five short GitHub forms for corrections,
broken or moved sources, variable or metadata feedback, new source suggestions,
and prompt guide improvements. Community contributors do not need to edit a file
or open a pull request. A maintainer checks the evidence and prepares a linked
change when one is warranted.

## Prompt guide library

`catalog/prompt-guides.json` is the single versioned source for the site's
copy-and-paste guides. A deterministic function assembles each full prompt from
its required inputs, shared evidence rules, task instructions, expected output,
and human-review checkpoints. Community and Technical views explain the guide
differently but copy identical prompt text. The browser does not transmit prompt
text or filter input to an AI provider.

Prompt outputs are working notes, not evidence or approval. Semantic matching,
trend breaks, missing and suppressed data, joins, privacy, licensing, grant and
policy claims, and community framing remain human decisions. Prompt changes can
be proposed through the plain-language GitHub form and follow the same reviewed,
versioned process as catalog corrections.

Read `CONTRIBUTING.md` for both community and technical paths. Use
`CORRECTIONS.md` for factual disputes and `SECURITY.md` for vulnerabilities.
Never include personal, confidential, credential, or otherwise sensitive
information in a public issue.

## Rights and citation

Public availability does not automatically grant permission to redistribute a
dataset. Rights are assessed per distribution; unknown rights remain unknown.
See `DATA_LICENSING.md` before copying or transforming source material.

Citation guidance for the catalog software is in `CITATION.cff`. Each published
dataset and product should also expose its own publisher-preferred, version-aware
citation.
