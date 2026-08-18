# Security Policy

## Supported versions

Security fixes are applied to the default branch and the most recent tagged
release. Historical catalog or data-product releases are immutable; a correction
is published as a new version with a relationship to the affected release.

## Reporting a vulnerability

Use GitHub's private **Report a vulnerability** / Security Advisory feature for
this repository. If that feature is unavailable, contact an organization owner
through the private method listed in the repository or organization profile.

Do not open a public issue, attach sensitive data, test a target you do not own,
or include working credentials. Include only the minimum reproduction details:

- affected component and revision;
- impact and realistic attack path;
- safe reproduction steps or a minimal proof of concept;
- known mitigations;
- whether anyone else has been notified.

Maintainers will acknowledge a report when a qualified reviewer is available,
coordinate a fix and disclosure based on severity, and credit reporters who want
public attribution. This is a volunteer project and does not promise a fixed
response time. Imminent threats to people or active credential exposure should
also be reported to the relevant platform or service owner.

Dataset inaccuracies, stale links, publisher disputes, and ordinary monitoring
false positives are corrections, not vulnerabilities; use `CORRECTIONS.md`.

## Security boundaries

The public catalog intentionally handles untrusted metadata and remote content.
Its primary risks include:

- server-side request forgery through contributor-supplied URLs or redirects;
- DNS rebinding between address validation and connection;
- credential or signed-query leakage in logs and generated pages;
- decompression bombs, oversized files, parser exploits, and path traversal;
- HTML/script injection through publisher text or response metadata;
- compromised workflow dependencies or overly broad `GITHUB_TOKEN` access;
- privileged workflows executing pull-request code;
- disclosure risk created by joining individually public datasets.

## Required controls

- Scheduled collection runs on a GitHub-hosted ephemeral runner without project
  secrets or private-network connectivity.
- The monitor accepts HTTPS/default-port targets by default, rejects embedded
  credentials and non-global addresses, and validates every redirect.
- Requests have bounded redirects, retries, duration, and bytes. Response bodies
  are neither logged nor rendered and downloaded content is never executed.
- Query strings are removed from observations and errors are sanitized.
- Production templates escape untrusted text and must not enable raw HTML in
  contributor-authored Markdown without review and sanitization.
- Workflow permissions default to none and are granted per job. Third-party
  actions are pinned to full reviewed commit SHAs.
- Pull-request validation receives read-only repository access and no secrets.
  `pull_request_target` must not execute or build untrusted pull-request content.
- The default branch and deployment environment require review and passing
  checks. Personal access tokens are not used when a scoped `GITHUB_TOKEN`
  suffices.
- Full-data processing adds explicit archive, decompression, memory, row, and
  disclosure limits before it is enabled.

## Monitor limitations

The current standard-library monitor validates DNS before making a request, but
the HTTP library resolves the host again when connecting. This leaves a narrow
time-of-check/time-of-use DNS-rebinding risk. The no-secrets, public hosted-runner
boundary is therefore a required defense, not an optional convenience. A future
network sandbox or transport that connects to a validated address while checking
TLS host identity can strengthen this control.

## Dependency and release security

Dependabot or an equivalent reviewer should propose updates to action SHAs and
application dependencies. Review the source release before accepting a new SHA.
Important released products should include SHA-256 manifests and build
provenance; an attestation establishes origin, not correctness.
