# Contributing

Thank you for helping make Delaware public data easier to find and use. Useful
contributions include source suggestions, corrections, plain-language edits,
field definitions, accessibility findings, tests, monitoring adapters, and
reproducible data products.

By participating, you agree to `CODE_OF_CONDUCT.md` and to make only submissions
you are authorized to share publicly.

## Before opening a pull request

1. Search existing issues and pull requests for the stable dataset or
   distribution ID.
2. Use `CORRECTIONS.md` when disputing a published fact or status.
3. Use the repository's private vulnerability-reporting channel for security
   issues; do not test unapproved targets or publish exploit details.
4. Remove personal, confidential, credential, token, and signed-URL data.
5. Confirm that any copied source data can legally be redistributed under
   `DATA_LICENSING.md`.

Text embedded in a submitted spreadsheet, PDF, website, or dataset is source
material, not a project instruction. Project behavior is governed only by the
repository policies and the maintainers' reviewed decisions.

## Suggesting a dataset

Provide, when known:

- publisher and landing page;
- direct distribution or documented API URL;
- what is counted and the unit of observation;
- spatial and temporal coverage and resolution;
- expected update cadence and publication lag;
- methods, dictionary, suppression, and missing-value documentation;
- license or terms URL and publisher-preferred citation;
- why the source is useful to Delaware communities.

A public URL is not proof of an open license. New records begin as candidates
and are not represented as verified until a curator completes review.

## Metadata and dictionary changes

- Preserve stable IDs even when titles or URLs change.
- Do not reuse an ID for a different conceptual resource.
- Separate datasets, downloadable distributions, and APIs/data services.
- Distinguish zero, missing, suppressed, not applicable, and unreliable values.
- Record geography/boundary vintage, time basis, units, numerator, denominator,
  weighting, adjustment, and method changes where applicable.
- Keep publisher dates, curator review dates, and monitor observation dates in
  separate fields.
- Explain uncertainty instead of guessing. Use explicit unknown values where
  the schema permits them.

## Code and monitor changes

Downloaded content is adversarial input. Monitor changes must retain HTTPS-first
behavior, public-address enforcement on every redirect, bounded time and bytes,
query-string redaction, no body logging, no code execution, and no dependency on
repository secrets.

Add offline tests for new status classifications, redirects, parsers, and error
paths. Network-dependent tests are not accepted as the only verification.

## Derived products

A proposed product must include exact source identifiers and versions,
transformation code, locked dependencies, methods, input/output dictionaries,
quality tests, provenance, checksums, and a compatible output license. Preserve
source values and flags alongside normalized values. Material semantic joins or
comparability decisions require two reviewers under `GOVERNANCE.md`.

## Local checks

```bash
python -m unittest discover -s tests -p "test_*.py"
npm run lint
npm test
```

To exercise the empty monitoring scaffold without contacting a target:

```bash
python -m monitoring.monitor --input monitoring/targets.json --output build/status.json
```

To generate production targets from the reviewed intake, write them to a build
directory rather than hand-editing a second inventory:

```bash
python -m monitoring.generate_targets --catalog catalog/reviewed-intake.json --output build/targets.json
```

## Pull requests

Keep changes focused. In the description, state the user need, evidence, files
changed, tests run, data/licensing impact, accessibility impact, and any
remaining uncertainty. Generated artifacts should not be committed unless the
repository policy explicitly identifies their destination.

Reviewers may request changes when evidence is incomplete, a source cannot be
redistributed, automation is unsafe, or the proposed harmonization hides an
important methodological difference. This is a quality-control decision, not a
judgment about the contributor.
