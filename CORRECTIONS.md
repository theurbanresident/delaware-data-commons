# Corrections and Disputes

The catalog welcomes corrections from publishers, subject-matter experts, data
users, and community members. Good-faith reports do not need to use technical
language.

## What to report

- incorrect title, publisher, contact, coverage, cadence, method, or rights;
- a moved, blocked, retired, or replacement source;
- a false outage, stale-data, or schema-change observation;
- a dictionary, unit, denominator, geography, suppression, or citation error;
- an accessibility barrier;
- an unauthorized copy or disclosure concern;
- a derived-product error or misleading comparability claim.

Security vulnerabilities follow `SECURITY.md`, not this process.

## How to report

Use the repository's correction issue form. Include the stable dataset or
distribution ID, the statement at issue, proposed correction, supporting source,
and why the change matters. Do not put personal, confidential, credential, or
legally sensitive material in a public issue; contact an organization owner
privately through the method listed in the repository profile.

## Review process

1. A maintainer labels and acknowledges the report when a reviewer is available.
2. A steward checks the cited source and distinguishes publisher assertions,
   curator interpretation, and monitor observations.
3. Straightforward corrections use a normal reviewed pull request.
4. Disputed semantic, licensing, privacy, or product changes use the material
   decision process in `GOVERNANCE.md`.
5. The issue links the resulting change, records unresolved uncertainty, and is
   closed only with a public non-sensitive rationale.

The project does not promise a fixed response time, but prioritizes active
disclosure risks, broken high-use sources, and errors likely to affect public
decisions.

## History and notices

Corrections create a new catalog or product version. Stable identifiers are not
reassigned, and history is not rewritten merely because a fact changed. A record
may be marked corrected, deprecated, retired, or superseded with effective date,
reason, and replacement. A released data product that changes values receives a
new version and a notice describing the affected fields, rows, and period.

Automated observations are statements about what the monitor saw at a time, so
an accurate past observation is retained even after recovery. If the observation
itself was faulty, the incident receives a correction annotation rather than
being silently deleted.

## Appeals

A reporter or affected publisher may request review by an organization owner who
was not involved in the initial decision. The reviewer considers the evidence,
project policies, effect on users, and whether the decision can be reversed. The
outcome and non-sensitive rationale remain public.
