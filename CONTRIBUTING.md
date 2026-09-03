# Contributing

Thank you for helping make Delaware public data easier to find, understand, and
use. You do not need to know how to code or edit a spreadsheet to help.

Everything posted in a GitHub issue is public. Do not include private records,
names or contact details about other people, passwords, access tokens,
confidential messages, or files you do not have permission to share. Report a
security problem by following `SECURITY.md`, not by opening a public issue.

By taking part, you agree to `CODE_OF_CONDUCT.md` and will share only information
that you are allowed to make public.

## Choose the easiest way to help

### Community path: tell us what you know

Use this path if you can describe a problem or useful source. No coding, Git
command, data schema, or pull request is required. Choose one form:

- [Correct information in a catalog record](../../issues/new?template=correction.yml)
- [Report a broken, moved, or retired source](../../issues/new?template=broken-source.yml)
- [Explain a variable or metadata problem](../../issues/new?template=variable-metadata.yml)
- [Suggest a new public data source](../../issues/new?template=dataset-suggestion.yml)
- [Improve a prompt guide](../../issues/new?template=prompt-guide.yml)

The forms ask what you saw, what you think should change, and how you know. A
link to an official webpage is helpful, but evidence can also be a clear
description of what the publisher says, the date you checked, a public report,
or a screenshot that contains no private information. It is fine to say “I do
not know” when a detail is uncertain.

You can also comment on an open issue. Helpful comments explain whether a
definition is clear, whether the data works for a real community question, or
whether a proposed correction matches the source. Please do not post the same
report in several places.

### Technical path: propose a change

Use this path if you are comfortable editing repository files. Search existing
issues and pull requests for the dataset or distribution ID, make a focused
change, and open a pull request. See the metadata, monitoring, and testing rules
below. A technical contributor may also start with any community form.

## What happens after a community report

1. GitHub gives the report a permanent issue number and records later edits.
2. A maintainer sorts the report and may ask a plain-language follow-up
   question. The report stays open while it is being checked.
3. A steward compares the report with the publisher or other public evidence.
   They keep publisher statements, reviewer judgments, and automated website
   checks separate.
4. If a repository change is needed, a maintainer or contributor opens a pull
   request and links it to the issue. The reporter does not have to write it.
5. Checks and review happen before the change is merged. Important changes to
   meanings, licensing, privacy, or data products need two reviewers under
   `GOVERNANCE.md`.
6. GitHub keeps the old and new versions. The issue is closed with a link to the
   change or a public explanation of why no change was made.

This history is the project’s version record. We correct the current catalog
without erasing what the catalog said before. Stable IDs remain the same when a
title or web address changes.

## Information that makes a report useful

Share what you know; you do not need every item:

- the dataset name or catalog ID;
- the page, download, field, definition, or status you are discussing;
- what you saw and the date you saw it;
- what should change, if you know;
- a public source that supports the report;
- why the issue matters for a community, grant, study, or decision;
- limits or uncertainty that future users should see.

## Suggesting a data source

Useful details include the publisher, official landing page, what the source
counts, Delaware places and years covered, how often it changes, definitions,
known limits, and reuse terms. A public URL does not always mean that the data
can legally be copied. New sources stay marked as candidates until a steward
checks them.

## Metadata and data-dictionary changes

Technical contributors should:

- preserve stable IDs when names or web addresses change;
- use a new ID for a different resource;
- separate a dataset from its downloads, dashboards, and APIs;
- distinguish zero, missing, suppressed, not applicable, and unreliable values;
- record units, numerator, denominator, geography and boundary year, time
  period, weighting, adjustments, and method changes when they apply;
- keep publisher dates, steward review dates, and automated check dates in
  separate fields; and
- explain uncertainty instead of guessing.

## Code and monitoring changes

Downloaded content must be treated as untrusted. Monitoring changes must keep
HTTPS-first behavior, public-address checks after redirects, time and download
limits, query-string hiding, no response-body logs, no code execution, and no
need for repository secrets.

Add offline tests for new status rules, redirects, parsers, and error paths.
Network tests cannot be the only proof that a change works.

## Derived data products

A proposed product must include exact source IDs and versions, transformation
code, locked dependencies, methods, input and output dictionaries, quality
tests, provenance, checksums, and a compatible output license. Keep original
values and quality flags beside normalized values. Joins or comparisons that
change meaning need two reviewers under `GOVERNANCE.md`.

## Prompt guide changes

Prompt guides are versioned review workflows, not claims that an AI tool can
certify data quality. A useful report names the guide, explains the real task,
describes the missing or unsafe step, and suggests which human role should
review the change. Do not paste a private AI conversation or any confidential,
personal, protected, licensed, or restricted data into an issue.

Changes to wording or examples need one independent reviewer. Changes to shared
safety rules, semantic comparison, privacy, licensing, causal interpretation,
or required human-review gates use the material-change process in
`GOVERNANCE.md`.

## Local checks for technical changes

```bash
python -m unittest discover -s tests -p "test_*.py"
npm run lint
npm test
```

To test the empty monitoring scaffold without visiting an outside website:

```bash
python -m monitoring.monitor --input monitoring/targets.json --output build/status.json
```

To generate monitoring targets from the reviewed catalog:

```bash
python -m monitoring.generate_targets --catalog catalog/reviewed-intake.json --output build/targets.json
```

## Pull requests

Keep each change focused. Link the issue that explains the need. Describe the
evidence, files changed, checks run, effect on licensing and accessibility, and
anything still uncertain. Do not commit generated files unless repository
policy names their required location.

Reviewers may ask for changes when evidence is incomplete, reuse rights are
unclear, automation is unsafe, or a proposed comparison hides an important
method difference. This protects users; it is not a judgment about the person
who contributed.
