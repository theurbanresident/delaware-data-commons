# Data and Licensing Policy

## Core rule

Publicly reachable is not the same as openly licensed. Cataloging a URL,
temporarily retrieving bytes for a bounded technical check, redistributing a
source file, and publishing a derived product are different uses and require
separate consideration.

When rights are unclear, the catalog may describe and link to the source, but it
must not claim the data is open or republish a copy.

## Separate rights layers

Every release distinguishes:

1. **Project software**: code written for this repository, governed by the
   repository's code license once adopted.
2. **Catalog metadata and documentation**: original descriptive material created
   by contributors, governed by the repository's metadata/documentation license
   once adopted.
3. **Third-party source data**: governed by each publisher's license, terms,
   attribution, privacy, and access conditions.
4. **Derived products**: governed by an explicit output license compatible with
   every input and with the transformation authors' rights.

A repository-level license never overrides a third party's rights. Preserve
upstream notices and attribution with any authorized snapshot.

## Required distribution metadata

Each reviewed distribution records, when known:

- license name, version, URI, and standard identifier;
- rights holder and required attribution;
- terms-of-use and privacy URLs;
- whether the rights apply to metadata, files, API results, or all of them;
- access restrictions and non-commercial/share-alike/database-right terms;
- `license_status`: `known`, `unknown`, `conflicting`, or `not-applicable`;
- `archive_allowed`: `yes`, `no`, or `unknown`;
- date and reviewer of the rights assessment.

Do not convert `unknown` into an open-license value for catalog completeness.

## Snapshot and archival policy

An upstream file may be preserved or redistributed only when one of these is
documented:

- an applicable license permits copying and redistribution;
- the rights holder gave permission that can be retained with the record; or
- qualified review documents another lawful basis.

Otherwise retain only catalog metadata, observed technical facts, permitted
small samples if any, and cryptographic fingerprints. Follow publisher rate
limits and access policies. Do not bypass authentication, paywalls, robots
controls, technical restrictions, or revocation.

Authorized snapshots include original URL, retrieval time, media type, size,
SHA-256, upstream version/date, rights statement, attribution, and a manifest.
Files that may contain personal or sensitive information require a separate
disclosure review even when a license permits copying.

## Derived products

Before publication, a derived product documents:

- exact inputs and rights for each input;
- whether contractual or database-right conditions propagate;
- transformations, joins, and retained source notices;
- disclosure and small-cell review;
- chosen output license and compatibility rationale.

If input terms conflict, the product is not publicly released until the conflict
is resolved. An aggregate or factual calculation does not automatically remove
license, attribution, privacy, or ethical obligations.

## Contributions and takedowns

Contributors submit only material they are authorized to share and identify any
third-party content. Rights holders may request correction or removal of an
unauthorized copy under `CORRECTIONS.md`. The catalog record and non-infringing
history may remain with a notice explaining the access change.

This policy is operational guidance, not legal advice. Material uncertainty
should be escalated to qualified counsel or the rights holder rather than guessed.
