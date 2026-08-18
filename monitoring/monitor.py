"""Safely sample public data endpoints and emit bounded status observations.

This module intentionally uses only the Python standard library. Remote content
is untrusted: it is never executed, extracted, logged, or included in output.
"""

from __future__ import annotations

import argparse
import hashlib
import ipaddress
import json
import os
import re
import socket
import sys
import tempfile
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from email.message import Message
from pathlib import Path
from typing import Any, Callable, Iterable, Mapping, Sequence
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlsplit, urlunsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

SCHEMA_VERSION = "1.0.0"
MONITOR_VERSION = "0.1.0"
DEFAULT_USER_AGENT = (
    "Delaware-Public-Data-Monitor/0.1 "
    "(bounded availability checker; contact via repository metadata)"
)

_ID_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
_MEDIA_TYPE_PATTERN = re.compile(
    r"^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$"
)
_REDIRECT_STATUSES = frozenset({301, 302, 303, 307, 308})
_TRANSIENT_STATUSES = frozenset({429, 500, 502, 503, 504})


class ConfigError(ValueError):
    """The local target file or monitor policy is invalid."""


class InvalidTarget(ValueError):
    """A URL violates the network safety policy."""


@dataclass(frozen=True)
class CheckPolicy:
    """Limits controlled by trusted workflow configuration, never target data."""

    timeout_seconds: float = 15.0
    max_bytes: int = 65_536
    max_redirects: int = 5
    retries: int = 2
    allow_http: bool = False
    deep: bool = False
    user_agent: str = DEFAULT_USER_AGENT

    def __post_init__(self) -> None:
        if not 0 < self.timeout_seconds <= 120:
            raise ConfigError("timeout_seconds must be greater than 0 and at most 120")
        if not 0 < self.max_bytes <= 52_428_800:
            raise ConfigError("max_bytes must be between 1 and 52428800")
        if not 0 <= self.max_redirects <= 10:
            raise ConfigError("max_redirects must be between 0 and 10")
        if not 0 <= self.retries <= 5:
            raise ConfigError("retries must be between 0 and 5")
        if not self.user_agent.strip() or len(self.user_agent) > 300:
            raise ConfigError("user_agent must contain 1 to 300 characters")

    @property
    def allowed_schemes(self) -> tuple[str, ...]:
        return ("https", "http") if self.allow_http else ("https",)

    def as_dict(self) -> dict[str, Any]:
        return {
            "allowed_schemes": list(self.allowed_schemes),
            "timeout_seconds": self.timeout_seconds,
            "max_bytes": self.max_bytes,
            "max_redirects": self.max_redirects,
            "retries": self.retries,
        }


@dataclass(frozen=True)
class Endpoint:
    dataset_id: str
    distribution_id: str
    url: str
    expected_content_types: tuple[str, ...] = ()
    enabled: bool = True

    @classmethod
    def from_mapping(cls, value: Mapping[str, Any], index: int) -> "Endpoint":
        allowed = {
            "dataset_id",
            "distribution_id",
            "url",
            "expected_content_types",
            "enabled",
        }
        extra = sorted(set(value) - allowed)
        if extra:
            raise ConfigError(f"endpoints[{index}] has unknown fields: {', '.join(extra)}")

        dataset_id = value.get("dataset_id")
        distribution_id = value.get("distribution_id")
        url = value.get("url")
        enabled = value.get("enabled", True)
        expected = value.get("expected_content_types", [])

        for field_name, field_value in (
            ("dataset_id", dataset_id),
            ("distribution_id", distribution_id),
        ):
            if not isinstance(field_value, str) or not _ID_PATTERN.fullmatch(field_value):
                raise ConfigError(
                    f"endpoints[{index}].{field_name} must be a stable lowercase slug"
                )
            if not 3 <= len(field_value) <= 120:
                raise ConfigError(f"endpoints[{index}].{field_name} length is invalid")

        if not isinstance(url, str) or not 1 <= len(url) <= 4096:
            raise ConfigError(f"endpoints[{index}].url must be a non-empty URL string")
        if any(ord(character) < 32 or ord(character) == 127 for character in url):
            raise ConfigError(f"endpoints[{index}].url contains control characters")
        try:
            parsed = urlsplit(url)
            syntactically_absolute = bool(parsed.scheme and parsed.hostname)
        except ValueError as exc:
            raise ConfigError(f"endpoints[{index}].url is malformed") from exc
        if not syntactically_absolute:
            raise ConfigError(f"endpoints[{index}].url must be absolute")
        if not isinstance(enabled, bool):
            raise ConfigError(f"endpoints[{index}].enabled must be boolean")
        if not isinstance(expected, list) or not all(isinstance(item, str) for item in expected):
            raise ConfigError(
                f"endpoints[{index}].expected_content_types must be an array of strings"
            )

        normalized_expected: list[str] = []
        for media_type in expected:
            normalized = media_type.strip().lower()
            if not _MEDIA_TYPE_PATTERN.fullmatch(normalized):
                raise ConfigError(
                    f"endpoints[{index}] contains invalid media type {media_type!r}"
                )
            if normalized not in normalized_expected:
                normalized_expected.append(normalized)

        return cls(
            dataset_id=dataset_id,
            distribution_id=distribution_id,
            url=url,
            expected_content_types=tuple(normalized_expected),
            enabled=enabled,
        )


@dataclass(frozen=True)
class RawResponse:
    status: int
    headers: Mapping[str, str]
    body: bytes
    truncated: bool
    latency_ms: int


Resolver = Callable[[str, int], Iterable[str]]
Requester = Callable[[str, Mapping[str, str], float, int, bool], RawResponse]
Clock = Callable[[], datetime]
Sleeper = Callable[[float], None]


class _NoRedirect(HTTPRedirectHandler):
    """Expose redirects to the policy layer instead of following automatically."""

    def redirect_request(  # type: ignore[override]
        self,
        req: Request,
        fp: Any,
        code: int,
        msg: str,
        headers: Message,
        newurl: str,
    ) -> None:
        return None


_OPENER = build_opener(_NoRedirect())


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _timestamp(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _system_resolver(hostname: str, port: int) -> set[str]:
    try:
        results = socket.getaddrinfo(
            hostname,
            port,
            family=socket.AF_UNSPEC,
            type=socket.SOCK_STREAM,
        )
    except socket.gaierror as exc:
        raise InvalidTarget("hostname could not be resolved") from exc
    return {result[4][0] for result in results}


def _is_global_address(value: str) -> bool:
    try:
        return ipaddress.ip_address(value.split("%", 1)[0]).is_global
    except ValueError:
        return False


def redact_url(url: str) -> str:
    """Remove user information, query, and fragment from a URL for publication."""

    try:
        parsed = urlsplit(url)
        hostname = parsed.hostname or "redacted.invalid"
        if ":" in hostname and not hostname.startswith("["):
            hostname = f"[{hostname}]"
        try:
            port = parsed.port
        except ValueError:
            port = None
        netloc = f"{hostname}:{port}" if port is not None else hostname
        scheme = parsed.scheme.lower() if parsed.scheme else "https"
        path = parsed.path or "/"
        return urlunsplit((scheme, netloc, path, "", ""))
    except (TypeError, ValueError):
        return "https://redacted.invalid/"


def validate_target(
    url: str,
    policy: CheckPolicy,
    resolver: Resolver = _system_resolver,
) -> str:
    """Validate a URL and every address it currently resolves to.

    All resolved addresses must be global. Rejecting a mixed public/private DNS
    answer prevents clients from choosing an unsafe answer after validation.
    """

    if len(url) > 4096 or any(ord(character) < 32 or ord(character) == 127 for character in url):
        raise InvalidTarget("URL length or characters violate policy")
    try:
        parsed = urlsplit(url)
        scheme = parsed.scheme.lower()
        hostname = parsed.hostname
        port = parsed.port
    except ValueError as exc:
        raise InvalidTarget("URL is malformed") from exc

    if scheme not in policy.allowed_schemes:
        raise InvalidTarget(f"scheme {scheme or '(missing)'} is not allowed")
    if not hostname:
        raise InvalidTarget("hostname is required")
    if parsed.username is not None or parsed.password is not None:
        raise InvalidTarget("embedded URL credentials are not allowed")
    if parsed.fragment:
        raise InvalidTarget("URL fragments are not allowed")

    expected_port = 443 if scheme == "https" else 80
    effective_port = port if port is not None else expected_port
    if effective_port != expected_port:
        raise InvalidTarget(f"port {effective_port} is not allowed for {scheme}")

    try:
        ascii_hostname = hostname.encode("idna").decode("ascii").lower()
    except UnicodeError as exc:
        raise InvalidTarget("hostname is not valid IDNA") from exc

    try:
        literal = ipaddress.ip_address(ascii_hostname.split("%", 1)[0])
    except ValueError:
        addresses = set(resolver(ascii_hostname, effective_port))
    else:
        addresses = {str(literal)}

    if not addresses:
        raise InvalidTarget("hostname resolved to no addresses")
    if any(not _is_global_address(address) for address in addresses):
        raise InvalidTarget("target resolves to a non-global address")

    display_hostname = (
        f"[{ascii_hostname}]" if ":" in ascii_hostname and not ascii_hostname.startswith("[")
        else ascii_hostname
    )
    netloc = display_hostname if port is None else f"{display_hostname}:{port}"
    return urlunsplit((scheme, netloc, parsed.path or "/", parsed.query, ""))


def _bounded_header(headers: Mapping[str, str], name: str, limit: int = 500) -> str | None:
    value = headers.get(name.lower())
    if value is None:
        return None
    return " ".join(value.split())[:limit]


def _request_once(
    url: str,
    headers: Mapping[str, str],
    timeout_seconds: float,
    max_bytes: int,
    deep: bool,
) -> RawResponse:
    request_headers = dict(headers)
    if not deep:
        request_headers["Range"] = f"bytes=0-{max_bytes - 1}"
    request = Request(url, headers=request_headers, method="GET")
    started = time.monotonic()
    response: Any
    try:
        response = _OPENER.open(request, timeout=timeout_seconds)
    except HTTPError as exc:
        response = exc
    latency_ms = max(0, round((time.monotonic() - started) * 1000))

    try:
        status = int(response.getcode())
        normalized_headers = {
            str(key).lower(): str(value) for key, value in response.headers.items()
        }
        if 200 <= status <= 299:
            payload = response.read(max_bytes + 1)
            truncated = len(payload) > max_bytes
            body = payload[:max_bytes]
        else:
            body = b""
            truncated = False
    finally:
        response.close()

    return RawResponse(
        status=status,
        headers=normalized_headers,
        body=body,
        truncated=truncated,
        latency_ms=latency_ms,
    )


def _sanitize_error(exc: BaseException) -> str:
    message = " ".join(str(exc).split())
    # Error strings from urllib can contain the requested URL. Remove any query.
    for token in tuple(message.split()):
        if "://" in token:
            message = message.replace(token, redact_url(token.rstrip(".,);]")))
    return (message or exc.__class__.__name__)[:500]


def _base_observation(endpoint: Endpoint, clock: Clock) -> dict[str, Any]:
    return {
        "dataset_id": endpoint.dataset_id,
        "distribution_id": endpoint.distribution_id,
        "observed_at": _timestamp(clock()),
        "requested_url": redact_url(endpoint.url),
        "access_status": "error",
        "reason": "monitor-error",
        "redirect_chain": [],
        "bytes_sampled": 0,
        "sample_complete": False,
        "retry_count": 0,
    }


def _check_once(
    endpoint: Endpoint,
    policy: CheckPolicy,
    resolver: Resolver,
    requester: Requester,
    clock: Clock,
) -> tuple[dict[str, Any], bool]:
    observation = _base_observation(endpoint, clock)
    current_url = endpoint.url
    redirect_chain: list[str] = []

    try:
        for redirect_count in range(policy.max_redirects + 1):
            current_url = validate_target(current_url, policy, resolver)
            raw = requester(
                current_url,
                {
                    "Accept": "*/*",
                    "Accept-Encoding": "identity",
                    "User-Agent": policy.user_agent,
                },
                policy.timeout_seconds,
                policy.max_bytes,
                policy.deep,
            )

            if raw.status in _REDIRECT_STATUSES:
                location = _bounded_header(raw.headers, "location", 4096)
                if not location:
                    observation.update(
                        {
                            "access_status": "degraded",
                            "reason": "redirect-without-location",
                            "http_status": raw.status,
                            "final_url": redact_url(current_url),
                            "latency_ms": raw.latency_ms,
                            "redirect_chain": redirect_chain,
                        }
                    )
                    return observation, False
                if redirect_count >= policy.max_redirects:
                    observation.update(
                        {
                            "access_status": "degraded",
                            "reason": "too-many-redirects",
                            "http_status": raw.status,
                            "final_url": redact_url(current_url),
                            "latency_ms": raw.latency_ms,
                            "redirect_chain": redirect_chain,
                        }
                    )
                    return observation, False
                next_url = urljoin(current_url, location)
                # Validate before recording or following the redirect.
                current_url = validate_target(next_url, policy, resolver)
                redirect_chain.append(redact_url(current_url))
                continue

            content_type_header = _bounded_header(raw.headers, "content-type", 255)
            normalized_content_type = (
                content_type_header.split(";", 1)[0].strip().lower()
                if content_type_header
                else None
            )
            content_length_value = _bounded_header(raw.headers, "content-length", 30)
            try:
                content_length = (
                    int(content_length_value) if content_length_value is not None else None
                )
            except ValueError:
                content_length = None

            observation.update(
                {
                    "final_url": redact_url(current_url),
                    "redirect_chain": redirect_chain,
                    "http_status": raw.status,
                    "latency_ms": raw.latency_ms,
                    "bytes_sampled": len(raw.body),
                    "sample_complete": bool(
                        not raw.truncated
                        and raw.status != 206
                        and not _bounded_header(raw.headers, "content-range", 200)
                    ),
                }
            )
            if content_type_header:
                observation["content_type"] = content_type_header
            if content_length is not None and content_length >= 0:
                observation["content_length"] = content_length
            for header, output_name in (
                ("etag", "etag"),
                ("last-modified", "last_modified"),
            ):
                value = _bounded_header(raw.headers, header)
                if value:
                    observation[output_name] = value
            if raw.body:
                observation["sample_sha256"] = hashlib.sha256(raw.body).hexdigest()

            if 200 <= raw.status <= 299:
                if policy.deep and raw.truncated:
                    observation.update(
                        {
                            "access_status": "degraded",
                            "reason": "response-too-large",
                        }
                    )
                elif (
                    endpoint.expected_content_types
                    and normalized_content_type not in endpoint.expected_content_types
                ):
                    observation.update(
                        {
                            "access_status": "degraded",
                            "reason": "unexpected-content-type",
                        }
                    )
                else:
                    observation.update(
                        {
                            "access_status": "available",
                            "reason": "ok",
                        }
                    )
                return observation, False

            if raw.status in (401, 403):
                observation.update({"access_status": "blocked", "reason": "access-blocked"})
                return observation, False
            if raw.status in (404, 410):
                observation.update({"access_status": "unavailable", "reason": "not-found"})
                return observation, False
            if raw.status == 429:
                observation.update(
                    {"access_status": "rate-limited", "reason": "rate-limited"}
                )
                return observation, True
            if 500 <= raw.status <= 599:
                observation.update(
                    {"access_status": "degraded", "reason": "upstream-server-error"}
                )
                return observation, True
            observation.update({"access_status": "degraded", "reason": "http-error"})
            return observation, False

    except InvalidTarget as exc:
        observation.update(
            {
                "access_status": "invalid-target",
                "reason": "target-policy-rejected",
                "redirect_chain": redirect_chain,
                "error_type": exc.__class__.__name__,
                "error_message": _sanitize_error(exc),
            }
        )
        return observation, False
    except (TimeoutError, URLError, OSError) as exc:
        observation.update(
            {
                "access_status": "degraded",
                "reason": "network-error",
                "redirect_chain": redirect_chain,
                "error_type": exc.__class__.__name__,
                "error_message": _sanitize_error(exc),
            }
        )
        return observation, True
    except Exception as exc:  # Defensive boundary: one target must not abort a scan.
        observation.update(
            {
                "access_status": "error",
                "reason": "monitor-error",
                "redirect_chain": redirect_chain,
                "error_type": exc.__class__.__name__,
                "error_message": _sanitize_error(exc),
            }
        )
        return observation, False

    observation.update({"access_status": "error", "reason": "monitor-error"})
    return observation, False


def check_endpoint(
    endpoint: Endpoint,
    policy: CheckPolicy,
    *,
    resolver: Resolver = _system_resolver,
    requester: Requester = _request_once,
    clock: Clock = _utc_now,
    sleeper: Sleeper = time.sleep,
) -> dict[str, Any]:
    """Check one endpoint with bounded retries for transient conditions."""

    last_observation: dict[str, Any] | None = None
    for attempt in range(policy.retries + 1):
        observation, transient = _check_once(
            endpoint,
            policy,
            resolver,
            requester,
            clock,
        )
        observation["retry_count"] = attempt
        last_observation = observation
        if not transient or attempt >= policy.retries:
            return observation
        sleeper(min(2**attempt, 4))
    assert last_observation is not None
    return last_observation


def load_endpoints(path: Path) -> list[Endpoint]:
    try:
        with path.open("r", encoding="utf-8") as handle:
            document = json.load(handle)
    except json.JSONDecodeError as exc:
        raise ConfigError(f"{path} is not valid JSON: line {exc.lineno}") from exc
    except OSError as exc:
        raise ConfigError(f"unable to read target file {path}") from exc

    if not isinstance(document, dict):
        raise ConfigError("target document must be an object")
    if set(document) - {"schema_version", "endpoints"}:
        raise ConfigError("target document contains unknown top-level fields")
    if document.get("schema_version") != SCHEMA_VERSION:
        raise ConfigError(f"target schema_version must be {SCHEMA_VERSION}")
    values = document.get("endpoints")
    if not isinstance(values, list):
        raise ConfigError("target document endpoints must be an array")

    endpoints: list[Endpoint] = []
    seen: set[tuple[str, str]] = set()
    for index, value in enumerate(values):
        if not isinstance(value, dict):
            raise ConfigError(f"endpoints[{index}] must be an object")
        endpoint = Endpoint.from_mapping(value, index)
        key = (endpoint.dataset_id, endpoint.distribution_id)
        if key in seen:
            raise ConfigError(
                f"duplicate endpoint {endpoint.dataset_id}/{endpoint.distribution_id}"
            )
        seen.add(key)
        if endpoint.enabled:
            endpoints.append(endpoint)
    return endpoints


def run_scan(
    endpoints: Sequence[Endpoint],
    policy: CheckPolicy,
    *,
    resolver: Resolver = _system_resolver,
    requester: Requester = _request_once,
    clock: Clock = _utc_now,
    sleeper: Sleeper = time.sleep,
    scan_id: str | None = None,
) -> dict[str, Any]:
    started_at = _timestamp(clock())
    observations = [
        check_endpoint(
            endpoint,
            policy,
            resolver=resolver,
            requester=requester,
            clock=clock,
            sleeper=sleeper,
        )
        for endpoint in endpoints
    ]

    summary = {
        "total": len(observations),
        "available": 0,
        "degraded": 0,
        "unavailable": 0,
        "blocked": 0,
        "rate_limited": 0,
        "invalid_target": 0,
        "error": 0,
    }
    summary_key = {
        "available": "available",
        "degraded": "degraded",
        "unavailable": "unavailable",
        "blocked": "blocked",
        "rate-limited": "rate_limited",
        "invalid-target": "invalid_target",
        "error": "error",
    }
    for observation in observations:
        summary[summary_key[observation["access_status"]]] += 1

    return {
        "schema_version": SCHEMA_VERSION,
        "scan_id": scan_id or str(uuid.uuid4()),
        "started_at": started_at,
        "completed_at": _timestamp(clock()),
        "monitor_version": MONITOR_VERSION,
        "deep": policy.deep,
        "policy": policy.as_dict(),
        "summary": summary,
        "observations": observations,
    }


def write_scan(path: Path, document: Mapping[str, Any]) -> None:
    """Write a complete scan atomically so a crash cannot publish partial JSON."""

    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_name: str | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            newline="\n",
            dir=path.parent,
            prefix=f".{path.name}.",
            suffix=".tmp",
            delete=False,
        ) as handle:
            temporary_name = handle.name
            json.dump(document, handle, indent=2, sort_keys=True, ensure_ascii=False)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary_name, path)
    finally:
        if temporary_name and os.path.exists(temporary_name):
            os.unlink(temporary_name)


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Run bounded availability checks against reviewed public endpoints."
    )
    parser.add_argument("--input", required=True, type=Path, help="Target JSON file")
    parser.add_argument("--output", required=True, type=Path, help="Status JSON path")
    parser.add_argument("--timeout", type=float, default=15.0, help="Seconds per request")
    parser.add_argument("--max-bytes", type=int, default=65_536, help="Response byte cap")
    parser.add_argument("--max-redirects", type=int, default=5)
    parser.add_argument("--retries", type=int, default=2)
    parser.add_argument(
        "--allow-http",
        action="store_true",
        help="Also allow plain HTTP on port 80; use only after review",
    )
    parser.add_argument(
        "--deep",
        action="store_true",
        help="Omit Range and treat responses over max-bytes as degraded",
    )
    parser.add_argument("--user-agent", default=DEFAULT_USER_AGENT)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    try:
        policy = CheckPolicy(
            timeout_seconds=args.timeout,
            max_bytes=args.max_bytes,
            max_redirects=args.max_redirects,
            retries=args.retries,
            allow_http=args.allow_http,
            deep=args.deep,
            user_agent=args.user_agent,
        )
        endpoints = load_endpoints(args.input)
        document = run_scan(endpoints, policy)
        write_scan(args.output, document)
    except (ConfigError, OSError) as exc:
        print(f"monitor configuration/output error: {_sanitize_error(exc)}", file=sys.stderr)
        return 2

    print(json.dumps(document["summary"], sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
