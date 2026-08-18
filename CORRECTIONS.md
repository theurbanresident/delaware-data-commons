# Corrections and Disputes

We welcome reports from community members, publishers, subject experts,
researchers, and data users. You do not need technical language or a proposed
code change. A clear description of what you saw is enough to begin review.

## Pick the right public form

- [Data correction](../../issues/new?template=correction.yml): a catalog fact,
  coverage statement, status, citation, or explanation is wrong.
- [Broken or moved source](../../issues/new?template=broken-source.yml): a page,
  file, dashboard, or API is unavailable, replaced, or retired.
- [Variable or metadata feedback](../../issues/new?template=variable-metadata.yml):
  a field name, definition, unit, denominator, geography, time period,
  suppression rule, or other documentation is missing or confusing.
- [New source suggestion](../../issues/new?template=dataset-suggestion.yml): a
  useful Delaware public source is not yet listed.

Security vulnerabilities follow `SECURITY.md`, not this process.

## Before you post

GitHub issues and their attachments are public. Do not include private records,
personal details about other people, passwords, access tokens, confidential or
legally protected information, signed download links, or files you do not have
permission to share. If the evidence cannot safely be public, do not post it;
contact a repository owner through the owner’s GitHub profile.

## Evidence can be simple

The form will ask what is wrong, what should change, and how you know. Good
evidence may be an official webpage, a public data dictionary, a publisher’s
public notice, the date and result of your own visit, or a public screenshot.
You do not need to inspect code, name a database field, or know the catalog ID.
Say what you are unsure about instead of guessing.

## Review and version history

1. A maintainer sorts the report and may ask questions in the issue.
2. A steward checks the public evidence and notes what is confirmed or still
   uncertain.
3. A maintainer or contributor prepares a linked pull request when files need
   to change. The reporter does not need to make the change.
4. Another person reviews the change. Meaning, licensing, privacy, and product
   changes follow the two-reviewer rule in `GOVERNANCE.md`.
5. After the pull request is merged, the issue links to the exact version. If no
   change is made, the issue records a plain-language reason.

GitHub keeps the earlier version. Stable dataset IDs are not reassigned. A
record may be marked corrected, deprecated, retired, or superseded with a date,
reason, and replacement. When a released data product changes values, it gets a
new version and a note naming the affected fields, rows, and dates.

Automated availability checks record what the monitor observed at a specific
time. A recovery does not erase an accurate past outage. If the automated check
was wrong, we add a correction note rather than silently deleting the event.

## Priority and appeals

The project cannot promise a fixed response time. It gives priority to possible
public disclosure, broken high-use sources, and errors likely to affect a public
decision.

A reporter or affected publisher may ask for a new review by an organization
owner who was not part of the first decision. That person considers the public
evidence, project rules, effect on users, and whether the decision can be
reversed. The result and a non-sensitive explanation remain public.
