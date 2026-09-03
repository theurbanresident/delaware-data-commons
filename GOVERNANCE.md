# Governance

## Purpose and principles

The Delaware Public Data Catalog is a public-interest collaboration. Its
governance is intended to keep the catalog accurate, independent, transparent,
accessible, technically safe, and maintainable beyond any one contributor.

The project follows these principles:

1. Publisher assertions, curator judgments, and automated observations remain
   visibly distinct.
2. A record is not removed to hide an outage or disagreement. It is retained
   with a lifecycle state, reason, date, and replacement when known.
3. Availability, freshness, integrity, methodological quality, and fitness for
   use are different claims.
4. Data is copied or transformed only when rights and disclosure risk permit it.
5. Material semantic decisions are documented and reviewed by another person.
6. Public users should not need GitHub expertise to understand the catalog.

## Community reports and technical changes

Community members may report a correction, broken source, unclear variable, new
source, or prompt guide concern through a plain-language GitHub form. They are
not expected to edit files, understand the data schema, or open a pull request.
Maintainers must not reject a useful report only because it lacks technical
terms. They may ask for public evidence or a clearer description when needed for
review.

Each report receives an issue number. When a file change is needed, a maintainer
or contributor prepares a linked pull request. Review and automated checks apply
to that pull request, and the merged commit becomes the new version. The issue
then links to the change or records why no change was made. This process gives
community feedback the same visible history as a technical contribution without
giving it automatic authority to change published data.

The site’s Community and Technical views use the same underlying records.
Changing views does not create a second catalog, change a source value, or skip
review. Community-facing summaries must link or map to the technical evidence
and provenance used to create them.

The prompt guide library follows the same rule. Both views copy one canonical
prompt assembled from a versioned guide record. Each guide names required
inputs, evidence rules, expected output, limitations, and a human-review gate.
An AI output is never treated as publisher evidence, curator approval, or a
substitute for the named reviewer.

## Roles

One person may hold more than one role during the initial phase, but no single
person should be the only repository administrator or release approver.

- **Organization owners** manage repository access, protected environments,
  succession, and emergency recovery. At least two owners from different
  institutions are preferred.
- **Maintainers** merge reviewed changes, manage releases, and enforce this
  policy. Maintainers do not silently override branch protection.
- **Metadata stewards** verify records, dictionaries, citations, licensing, and
  publisher relationships.
- **Technical stewards** maintain schemas, monitoring, tests, deployment, and
  supply-chain controls.
- **Product reviewers** evaluate joins, definitions, comparability, disclosure
  risk, and reproducibility for derived products.
- **Community reviewers** assess plain language, accessibility, and practical
  usefulness for community organizations and members of the public.

Current role assignments should be maintained in the GitHub organization team
list and repository access settings, rather than duplicated in a document that
can become stale.

## Decision process

Routine, reversible changes use a pull request with passing required checks and
at least one approving reviewer who did not author the latest change.

The following material changes require two approvals, including one reviewer
with relevant subject-matter responsibility:

- a breaking schema or identifier change;
- an indicator definition, unit, denominator, geography, or comparability rule;
- a new derived product or a material transformation change;
- a decision to redistribute an upstream file;
- a privacy or disclosure-risk determination;
- a shared prompt safety rule or removal of a required human-review checkpoint;
- a governance, licensing, security, or correction-policy change.

When reasonable reviewers disagree, the pull request records the alternatives,
evidence, affected users, and a reversible path. Maintainers seek rough
consensus. If consensus is not possible, organization owners decide by simple
majority and record the rationale in the pull request or a decision record.

Emergency security changes may be merged by two maintainers before normal
review completes. The project publishes a retrospective after disclosure is
safe.

## Repository protections

The default branch should require pull requests, approving review, required
tests, resolved conversations, and blocked force-pushes and deletions. Workflow
files, schemas, monitoring policy, licensing, and governance should have named
code owners once organization teams are established.

GitHub Actions receive no permissions by default. Permissions are granted per
job, third-party actions are pinned to reviewed commit SHAs, and scheduled
collection jobs run without secrets. Generated monitoring output must not be
trusted as executable code.

## Catalog lifecycle

An imported candidate moves through these states:

1. `candidate`: received but not independently checked;
2. `reviewed`: core publisher, access, coverage, method, and rights metadata
   were assessed by a curator;
3. `published`: exposed in the public catalog;
4. `deprecated`, `retired`, or `superseded`: no longer a current source, while
   its stable identifier and history remain available.

Automated access status never changes a dataset's curator-controlled lifecycle
status. A confirmed 404 may create an incident, but only evidence from the
publisher or a documented curator review marks a dataset retired.

## Releases and preservation

Catalog releases are immutable and versioned. A release should include the
catalog export, schemas, checksum manifest, change notes, and citation metadata.
Derived-product releases additionally include source-version identifiers,
methods, dictionaries, quality results, provenance, and applicable rights.

GitHub workflow artifacts are temporary staging, not archival storage. Important
releases should also be deposited in a preservation service capable of issuing
persistent identifiers. Large recurring source data should remain outside Git.

## Conflicts of interest

Reviewers disclose employment, funding, authorship, or another relationship that
could reasonably affect a catalog or product decision. Disclosure does not
automatically disqualify a reviewer, but a non-conflicted reviewer must approve
any disputed material change.

## Corrections, conduct, and appeals

Factual corrections follow `CORRECTIONS.md`. Contributor behavior follows
`CODE_OF_CONDUCT.md`. A person affected by a moderation or data decision may ask
an organization owner who was not involved in the original decision to review
it. The outcome and non-sensitive rationale are recorded publicly.

## Stewardship review and succession

Maintainers review ownership, access, scheduled workflow health, stale records,
and unresolved corrections at least quarterly. Organization owners maintain at
least two recovery-capable administrators and document how to export the catalog
and status history.

If active maintenance ends, maintainers publish a notice, final export, last
successful scan date, successor location if any, and preservation deposit before
enabling GitHub's read-only repository archive setting.

## Amendments

Governance amendments use the material-change process above. The pull request
must explain why the change is needed and how it affects contributors and data
users.
