# Monitoring scaffold

`monitoring.monitor` performs a small, bounded technical check of reviewed
public endpoints and emits one JSON scan document conforming to
`schemas/status.schema.json`. It uses only the Python standard library.

`monitoring/targets.json` is a deliberately empty offline example. Production
targets are generated from reviewed public catalog distributions rather than
maintained as a second independent source of truth. Current and archive links
are checked; `request_only` sources and `request_info` links remain visible in
the catalog but are excluded from outage checks.

## Run

```bash
python -m monitoring.generate_targets \
  --catalog catalog/reviewed-intake.json \
  --output build/targets.json
python -m monitoring.monitor \
  --input build/targets.json \
  --output build/status.json
```

PowerShell users can put the command on one line. A monthly bounded deep sample
can be requested with `--deep --max-bytes 5242880`; it is still not an
unbounded archive or a data-quality audit.

Target input shape:

```json
{
  "schema_version": "1.0.0",
  "endpoints": [
    {
      "dataset_id": "publisher-concept",
      "distribution_id": "publisher-concept-csv",
      "url": "https://data.example.org/file.csv",
      "expected_content_types": ["text/csv"],
      "enabled": true
    }
  ]
}
```

IDs must be stable lowercase slugs. URL query strings are allowed for public API
queries but are removed from output. Do not put API keys, signed URLs, cookies,
or credentials in this file.

## What a check means

The monitor reports one of these access observations:

- `available`: expected successful HTTP result and, if configured, media type;
- `degraded`: network/server problem, unexpected media type, excessive redirect,
  or deep response larger than the configured cap;
- `unavailable`: confirmed `404` or `410` response;
- `blocked`: `401` or `403`, which may be an access-policy or bot issue;
- `rate-limited`: `429`, not evidence that the resource was removed;
- `invalid-target`: URL violates the monitor's network safety policy;
- `error`: an unexpected checker/configuration-adjacent condition.

The monitor intentionally does not change lifecycle, freshness, or integrity
metadata. Those require separate policies and, for retirement, human review.

## Safety properties

- HTTPS and port 443 only by default. `--allow-http` adds HTTP/80 for a reviewed
  migration case; target data cannot relax this policy itself.
- User information and fragments are rejected.
- Literal and DNS-resolved addresses must all be globally routable. A hostname
  resolving to any private/reserved address is rejected.
- Every redirect is resolved, validated, and counted before following.
- Fast checks request a byte range, use identity encoding, and still stop after
  `max_bytes + 1` if a server ignores the range.
- Response bodies are hashed in memory only, never logged or serialized.
- Errors are single-line, length-bounded, and have URL query strings redacted.
- Endpoint failures are observations. Invalid JSON/configuration and inability
  to write a complete scan are process failures.

Python's HTTP stack resolves DNS again during connection, so validation does not
fully eliminate DNS rebinding. Scheduled collection must stay on a hosted runner
with no project secrets or private-network connectivity. See `SECURITY.md`.

## Scheduled operations

The weekly workflow regenerates its targets from the reviewed intake, runs the
offline safety suite, collects bounded samples, writes a fixed-field job
summary, and retains the status JSON as a 30-day workflow artifact. The monthly
deep audit uses a larger but still bounded byte cap and 90-day retention. Both
jobs are read-only and intentionally cannot commit files, publish Pages, or open
issues.

Workflow artifacts are operational evidence, not durable public history. A
future reviewed publishing stage should validate the artifact, compare it with
the last accepted observation, suppress one-off noise, and publish confirmed
outage/recovery events plus immutable releases. That privileged stage should be
separate from the untrusted network collection job.

## Deliberate non-goals in this phase

- Executing downloaded workbooks, scripts, archives, or macros.
- Authenticating to private or nominally public services with secrets.
- Treating a content sample hash as a complete-file checksum.
- Inferring publisher update dates from HTTP headers.
- Declaring a dataset retired from a single failed request.
- Crawling sites or bypassing publisher access policies.
