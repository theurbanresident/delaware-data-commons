"""Offline tests for target generation and the bounded endpoint monitor."""

from __future__ import annotations

import hashlib
import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

from monitoring.generate_targets import build_targets, load_catalog, write_targets
from monitoring.monitor import (
    CheckPolicy,
    ConfigError,
    Endpoint,
    InvalidTarget,
    RawResponse,
    _request_once,
    check_endpoint,
    load_endpoints,
    redact_url,
    run_scan,
    validate_target,
    write_scan,
)
from monitoring.summary import render_summary


ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "tests" / "fixtures" / "monitoring"
FIXED_TIME = datetime(2026, 8, 17, 12, 0, tzinfo=timezone.utc)


def public_resolver(hostname: str, port: int) -> set[str]:
    del port
    if hostname == "private.example":
        return {"127.0.0.1"}
    if hostname == "mixed.example":
        return {"93.184.216.34", "10.0.0.8"}
    return {"93.184.216.34"}


def fixed_clock() -> datetime:
    return FIXED_TIME


class QueueRequester:
    def __init__(self, *responses: RawResponse | BaseException) -> None:
        self.responses = list(responses)
        self.calls: list[dict[str, object]] = []

    def __call__(
        self,
        url: str,
        headers: dict[str, str],
        timeout_seconds: float,
        max_bytes: int,
        deep: bool,
    ) -> RawResponse:
        self.calls.append(
            {
                "url": url,
                "headers": headers,
                "timeout_seconds": timeout_seconds,
                "max_bytes": max_bytes,
                "deep": deep,
            }
        )
        if not self.responses:
            raise AssertionError("unexpected network request")
        response = self.responses.pop(0)
        if isinstance(response, BaseException):
            raise response
        return response


def raw_response(
    status: int,
    *,
    headers: dict[str, str] | None = None,
    body: bytes = b"",
    truncated: bool = False,
) -> RawResponse:
    return RawResponse(
        status=status,
        headers=headers or {},
        body=body,
        truncated=truncated,
        latency_ms=7,
    )


class TargetPolicyTests(unittest.TestCase):
    def test_redact_url_removes_secrets_and_user_information(self) -> None:
        value = redact_url("https://person:password@example.org/data?q=secret#part")
        self.assertEqual(value, "https://example.org/data")

    def test_validate_accepts_public_https_and_preserves_query_for_request(self) -> None:
        value = validate_target(
            "https://DATA.EXAMPLE/path?q=needed",
            CheckPolicy(retries=0),
            public_resolver,
        )
        self.assertEqual(value, "https://data.example/path?q=needed")

    def test_validate_rejects_unsafe_network_targets(self) -> None:
        unsafe = (
            "http://data.example/file.csv",
            "https://user:password@data.example/file.csv",
            "https://127.0.0.1/file.csv",
            "https://private.example/file.csv",
            "https://mixed.example/file.csv",
            "https://data.example:8443/file.csv",
            "https://data.example/file.csv#fragment",
        )
        for url in unsafe:
            with self.subTest(url=url), self.assertRaises(InvalidTarget):
                validate_target(url, CheckPolicy(retries=0), public_resolver)


class RequestBoundTests(unittest.TestCase):
    def test_shallow_request_uses_get_identity_and_range_and_closes_response(self) -> None:
        class FakeResponse:
            def __init__(self) -> None:
                self.headers = {"Content-Type": "text/csv"}
                self.closed = False
                self.read_size: int | None = None

            def getcode(self) -> int:
                return 200

            def read(self, size: int) -> bytes:
                self.read_size = size
                return b"abcd"

            def close(self) -> None:
                self.closed = True

        class FakeOpener:
            def __init__(self, response: FakeResponse) -> None:
                self.response = response
                self.request = None
                self.timeout = None

            def open(self, request: object, timeout: float) -> FakeResponse:
                self.request = request
                self.timeout = timeout
                return self.response

        response = FakeResponse()
        opener = FakeOpener(response)
        with patch("monitoring.monitor._OPENER", opener):
            result = _request_once(
                "https://data.example/file.csv",
                {"Accept-Encoding": "identity"},
                3.0,
                3,
                False,
            )

        assert opener.request is not None
        headers = {key.lower(): value for key, value in opener.request.header_items()}
        self.assertEqual(opener.request.get_method(), "GET")
        self.assertEqual(headers["range"], "bytes=0-2")
        self.assertEqual(headers["accept-encoding"], "identity")
        self.assertEqual(response.read_size, 4)
        self.assertTrue(response.closed)
        self.assertEqual(result.body, b"abc")
        self.assertTrue(result.truncated)


class EndpointCheckTests(unittest.TestCase):
    def endpoint(self, expected: tuple[str, ...] = ()) -> Endpoint:
        return Endpoint(
            dataset_id="public-health-source",
            distribution_id="current-report-file",
            url="https://data.example/file.csv?token=not-for-output",
            expected_content_types=expected,
        )

    def test_success_records_only_bounded_metadata_and_redacts_query(self) -> None:
        requester = QueueRequester(
            raw_response(
                200,
                headers={
                    "content-type": "text/csv; charset=utf-8",
                    "content-length": "8",
                    "etag": '"abc"',
                    "last-modified": "Sun, 16 Aug 2026 12:00:00 GMT",
                },
                body=b"a,b\n1,2\n",
            )
        )
        result = check_endpoint(
            self.endpoint(("text/csv",)),
            CheckPolicy(retries=0),
            resolver=public_resolver,
            requester=requester,
            clock=fixed_clock,
        )
        self.assertEqual(result["access_status"], "available")
        self.assertEqual(result["reason"], "ok")
        self.assertEqual(result["requested_url"], "https://data.example/file.csv")
        self.assertEqual(result["final_url"], "https://data.example/file.csv")
        self.assertEqual(
            result["sample_sha256"], hashlib.sha256(b"a,b\n1,2\n").hexdigest()
        )
        self.assertNotIn("token", json.dumps(result))
        self.assertNotIn("body", result)

    def test_redirect_is_revalidated_and_query_is_redacted(self) -> None:
        requester = QueueRequester(
            raw_response(
                302,
                headers={
                    "location": "https://download.example/final.csv?token=also-secret"
                },
            ),
            raw_response(200, headers={"content-type": "text/csv"}, body=b"x\n1\n"),
        )
        result = check_endpoint(
            self.endpoint(("text/csv",)),
            CheckPolicy(retries=0),
            resolver=public_resolver,
            requester=requester,
            clock=fixed_clock,
        )
        self.assertEqual(result["access_status"], "available")
        self.assertEqual(
            result["redirect_chain"], ["https://download.example/final.csv"]
        )
        self.assertEqual(result["final_url"], "https://download.example/final.csv")
        self.assertEqual(len(requester.calls), 2)
        self.assertNotIn("token", json.dumps(result))

    def test_redirect_to_private_address_is_rejected_before_following(self) -> None:
        requester = QueueRequester(
            raw_response(
                302,
                headers={"location": "https://private.example/internal"},
            )
        )
        result = check_endpoint(
            self.endpoint(),
            CheckPolicy(retries=0),
            resolver=public_resolver,
            requester=requester,
            clock=fixed_clock,
        )
        self.assertEqual(result["access_status"], "invalid-target")
        self.assertEqual(result["reason"], "target-policy-rejected")
        self.assertEqual(len(requester.calls), 1)

    def test_http_results_are_classified_without_retries_when_disabled(self) -> None:
        cases = {
            401: ("blocked", "access-blocked"),
            403: ("blocked", "access-blocked"),
            404: ("unavailable", "not-found"),
            410: ("unavailable", "not-found"),
            429: ("rate-limited", "rate-limited"),
            503: ("degraded", "upstream-server-error"),
            418: ("degraded", "http-error"),
        }
        for status, expected in cases.items():
            with self.subTest(status=status):
                result = check_endpoint(
                    self.endpoint(),
                    CheckPolicy(retries=0),
                    resolver=public_resolver,
                    requester=QueueRequester(raw_response(status)),
                    clock=fixed_clock,
                )
                self.assertEqual(
                    (result["access_status"], result["reason"]), expected
                )

    def test_transient_status_retries_then_recovers(self) -> None:
        requester = QueueRequester(
            raw_response(503),
            raw_response(200, headers={"content-type": "text/csv"}, body=b"a\n"),
        )
        sleeps: list[float] = []
        result = check_endpoint(
            self.endpoint(("text/csv",)),
            CheckPolicy(retries=1),
            resolver=public_resolver,
            requester=requester,
            clock=fixed_clock,
            sleeper=sleeps.append,
        )
        self.assertEqual(result["access_status"], "available")
        self.assertEqual(result["retry_count"], 1)
        self.assertEqual(sleeps, [1])

    def test_type_mismatch_and_oversized_deep_response_are_degraded(self) -> None:
        mismatch = check_endpoint(
            self.endpoint(("application/pdf",)),
            CheckPolicy(retries=0),
            resolver=public_resolver,
            requester=QueueRequester(
                raw_response(200, headers={"content-type": "text/html"}, body=b"html")
            ),
            clock=fixed_clock,
        )
        oversized = check_endpoint(
            self.endpoint(),
            CheckPolicy(retries=0, deep=True, max_bytes=4),
            resolver=public_resolver,
            requester=QueueRequester(raw_response(200, body=b"abcd", truncated=True)),
            clock=fixed_clock,
        )
        self.assertEqual(mismatch["reason"], "unexpected-content-type")
        self.assertEqual(oversized["reason"], "response-too-large")
        self.assertEqual(mismatch["access_status"], "degraded")
        self.assertEqual(oversized["access_status"], "degraded")


class ConfigurationAndOutputTests(unittest.TestCase):
    def test_load_targets_skips_disabled_and_rejects_duplicates(self) -> None:
        endpoints = load_endpoints(FIXTURES / "targets.valid.json")
        self.assertEqual(len(endpoints), 1)
        self.assertEqual(endpoints[0].expected_content_types, ("application/pdf",))
        with self.assertRaises(ConfigError):
            load_endpoints(FIXTURES / "targets.duplicate.json")

    def test_generator_excludes_request_only_and_request_information(self) -> None:
        document = load_catalog(FIXTURES / "catalog.valid.json")
        targets = build_targets(document)
        self.assertEqual(len(targets["endpoints"]), 2)
        ids = {
            (item["dataset_id"], item["distribution_id"])
            for item in targets["endpoints"]
        }
        self.assertEqual(
            ids,
            {
                ("public-health-source", "current-report-pdf"),
                ("public-health-source", "archived-landing-page"),
            },
        )
        pdf = next(
            item
            for item in targets["endpoints"]
            if item["distribution_id"] == "current-report-pdf"
        )
        self.assertEqual(pdf["expected_content_types"], ["application/pdf"])

    def test_empty_scan_and_atomic_writers_emit_valid_json(self) -> None:
        scan = run_scan(
            [],
            CheckPolicy(retries=0),
            clock=fixed_clock,
            scan_id="12345678-1234-4234-9234-123456789abc",
        )
        self.assertEqual(scan["summary"]["total"], 0)
        self.assertEqual(scan["observations"], [])
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            scan_path = root / "nested" / "status.json"
            target_path = root / "nested" / "targets.json"
            write_scan(scan_path, scan)
            write_targets(
                target_path,
                {"schema_version": "1.0.0", "endpoints": []},
            )
            self.assertEqual(json.loads(scan_path.read_text(encoding="utf-8")), scan)
            self.assertEqual(
                json.loads(target_path.read_text(encoding="utf-8"))["endpoints"], []
            )

    def test_workflow_summary_uses_fixed_labels_and_validated_counts(self) -> None:
        scan = run_scan(
            [],
            CheckPolicy(retries=0),
            clock=fixed_clock,
            scan_id="12345678-1234-4234-9234-123456789abc",
        )
        markdown = render_summary(scan, "Weekly public endpoint monitor")
        self.assertIn("## Weekly public endpoint monitor", markdown)
        self.assertIn("- Total: 0", markdown)
        self.assertIn("- Rate limited: 0", markdown)
        scan["summary"]["total"] = "0"
        with self.assertRaises(ConfigError):
            render_summary(scan, "Weekly public endpoint monitor")

    def test_schema_documents_are_parseable_draft_2020_12_json(self) -> None:
        for filename in ("catalog.schema.json", "status.schema.json"):
            with self.subTest(filename=filename):
                document = json.loads(
                    (ROOT / "schemas" / filename).read_text(encoding="utf-8")
                )
                self.assertEqual(
                    document["$schema"], "https://json-schema.org/draft/2020-12/schema"
                )
                self.assertTrue(document["$id"].startswith("urn:"))


if __name__ == "__main__":
    unittest.main()
