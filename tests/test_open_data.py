"""Offline contract tests for complete metadata captures and durable history."""

from copy import deepcopy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("refresh_open_data", ROOT / "scripts/refresh_open_data.py")
refresh = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(refresh)

FIRST = "aaaa-bbbb"
SECOND = "cccc-dddd"
THIRD = "eeee-ffff"
CHECKED = "2026-10-21T12:00:00Z"
LANDING = f'<a href="https://data.delaware.gov/d/{FIRST}">Priority</a>'


def asset(asset_id, name="Example dataset", asset_type="dataset"):
    return {
        "resource": {
            "id": asset_id, "name": name, "type": asset_type,
            "description": "<p>Public <strong>metadata</strong> &amp; definitions</p>",
            "columns_field_name": ["year"], "columns_name": ["Year"],
            "columns_datatype": ["Number"], "columns_description": ["Release year"],
        },
        "metadata": {"domain": "data.delaware.gov"},
        "classification": {"domain_tags": ["health", "health"]},
    }


def details(asset_id=FIRST):
    return {
        "id": asset_id, "rowsUpdatedAt": 1704067200,
        "columns": [
            {"fieldName": ":id", "name": "Internal ID", "dataTypeName": "meta_data"},
            {"fieldName": "year", "name": "Year", "dataTypeName": "number", "description": "<p>Calendar year</p>"},
        ],
        "metadata": {"custom_fields": {"Additional Information": {"Temporal Coverage": "2020-2024"}}},
    }


def snapshot(items=None, checked_at=CHECKED):
    items = items if items is not None else [asset(FIRST)]
    return refresh.build_snapshot(
        {"results": items, "resultSetSize": len(items)},
        {FIRST: details()}, LANDING, checked_at, [],
    )


class CaptureContractTests(unittest.TestCase):
    def test_unsafe_redirect_is_rejected_before_follow_up_request_is_constructed(self):
        request = refresh.Request("https://data.delaware.gov/api/views/aaaa-bbbb.json")
        handler = refresh.PublisherRedirects()
        unsafe_urls = [
            "https://unexpected.example/metadata", "http://data.delaware.gov/metadata",
            "https://data.delaware.gov:444/metadata", "https://user:password@data.delaware.gov/metadata",
        ]
        for target in unsafe_urls:
            with self.subTest(target=target), patch.object(refresh.HTTPRedirectHandler, "redirect_request") as delegate:
                with self.assertRaisesRegex(ValueError, "Unexpected metadata URL"):
                    handler.redirect_request(request, None, 302, "Found", {}, target)
                delegate.assert_not_called()
        allowed = "https://data.delaware.gov/api/views/cccc-dddd.json"
        follow_up = handler.redirect_request(request, None, 302, "Found", {}, allowed)
        self.assertEqual(follow_up.full_url, allowed)

    def test_complete_capture_counts_every_asset_type_and_sorts_stably(self):
        document = snapshot([asset(SECOND, "Zulu", "chart"), asset(FIRST, "alpha")])
        self.assertEqual([a["id"] for a in document["assets"]], [FIRST, SECOND])
        self.assertEqual(document["summary"], {"asset_count": 2, "dataset_count": 1, "by_type": {"chart": 1, "dataset": 1}})
        self.assertEqual(document["assets"][0]["description"], "Public metadata & definitions")
        self.assertEqual(document["assets"][0]["tags"], ["health"])

    def test_incomplete_empty_and_overfull_results_are_rejected(self):
        for items, expected in [([], 0), ([asset(FIRST)], 2), ([asset(FIRST), asset(SECOND)], 1)]:
            with self.subTest(expected=expected, actual=len(items)):
                with self.assertRaisesRegex(ValueError, "Incomplete catalog"):
                    refresh.build_snapshot({"results": items, "resultSetSize": expected}, {FIRST: details()}, LANDING, CHECKED, [])

    def test_duplicate_ids_cannot_satisfy_count_completeness(self):
        with self.assertRaisesRegex(ValueError, "Duplicate asset IDs"):
            snapshot([asset(FIRST), asset(FIRST, "Other name")])

    def test_all_assets_must_have_valid_ids_and_exact_portal_domain(self):
        for bad_id, bad_domain in [("invalid", "data.delaware.gov"), (SECOND, "evil.example"), (SECOND, "data.delaware.gov.evil.example")]:
            with self.subTest(asset_id=bad_id, domain=bad_domain):
                item = asset(bad_id)
                item["metadata"]["domain"] = bad_domain
                with self.assertRaisesRegex(ValueError, "Invalid asset ID or catalog domain"):
                    snapshot([asset(FIRST), item])

    def test_priority_links_are_deduplicated_and_detail_columns_replace_catalog_summary(self):
        landing = LANDING + LANDING + f'<a href="https://data.delaware.gov/Health/Example/{FIRST}?view=table">Again</a>'
        document = refresh.build_snapshot({"results": [asset(FIRST)], "resultSetSize": 1}, {FIRST: details()}, landing, CHECKED, [])
        self.assertEqual(document["mhc"]["priority_dataset_ids"], [FIRST])
        self.assertEqual(document["assets"][0]["columns"], [{"field_name": "year", "name": "Year", "data_type": "number", "description": "Calendar year"}])
        self.assertEqual(document["assets"][0]["updated_at"], "2024-01-01T00:00:00Z")
        self.assertEqual(document["assets"][0]["temporal_coverage"], "2020-2024")
        self.assertEqual(document["mhc"]["dictionary_status"], "not-acquired")
        self.assertFalse(document["archive"]["payloads_archived"])

    def test_priority_capture_requires_publisher_links_matching_catalog_and_details(self):
        cases = [
            ("<p>No priority links</p>", {FIRST: details()}, "No official MHC priority links"),
            (f'<a href="https://data.delaware.gov/d/{SECOND}">Missing</a>', {SECOND: details(SECOND)}, "Missing priority metadata"),
            (LANDING, {}, "Missing priority metadata"),
            (LANDING, {FIRST: details(SECOND)}, "Priority metadata ID mismatch"),
        ]
        for landing, metadata, message in cases:
            with self.subTest(message=message, landing=landing):
                with self.assertRaisesRegex(ValueError, message):
                    refresh.build_snapshot({"results": [asset(FIRST)], "resultSetSize": 1}, metadata, landing, CHECKED, [])

    def test_offline_incomplete_capture_leaves_existing_current_and_history_intact(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            refresh.publish(snapshot(), root=root)
            paths = [root / "catalog/delaware-open-data.json", root / "public/data/delaware-open-data.json", root / "public/data/open-data/history.json"]
            original = {path: path.read_bytes() for path in paths}
            capture = root / "evidence"
            capture.mkdir()
            (capture / "catalog-domain-limit1000.json").write_bytes(refresh.encode({"results": [asset(FIRST)], "resultSetSize": 2}))
            (capture / "mhc-transition.html").write_text(LANDING)
            (capture / f"{FIRST}-metadata.json").write_bytes(refresh.encode(details()))
            with patch("sys.argv", ["refresh_open_data.py", "--from-directory", str(capture), "--checked-at", CHECKED]), patch.object(refresh, "fetch", side_effect=AssertionError("Offline capture must never fetch")), patch.object(refresh, "publish") as publish:
                with self.assertRaisesRegex(ValueError, "Incomplete catalog"):
                    refresh.main()
                publish.assert_not_called()
            self.assertEqual({path: path.read_bytes() for path in paths}, original)


class MetadataHistoryTests(unittest.TestCase):
    def test_staging_failure_does_not_replace_any_existing_published_files(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            refresh.publish(snapshot(), root=root)
            original = {path.relative_to(root): path.read_bytes() for path in root.rglob("*") if path.is_file()}
            create_temporary = refresh.tempfile.NamedTemporaryFile
            calls = 0

            def fail_during_staging(*args, **kwargs):
                nonlocal calls
                calls += 1
                if calls == 3:
                    raise OSError("Simulated disk failure while staging")
                return create_temporary(*args, **kwargs)

            with patch.object(refresh.tempfile, "NamedTemporaryFile", side_effect=fail_during_staging):
                with self.assertRaisesRegex(OSError, "Simulated disk failure"):
                    refresh.publish(snapshot(checked_at="2026-10-22T12:00:00Z"), root=root)
            self.assertEqual({path.relative_to(root): path.read_bytes() for path in root.rglob("*") if path.is_file()}, original)

    def test_archive_checksum_current_copies_and_idempotent_republication(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            document = snapshot()
            entry = refresh.publish(document, root=root)
            archive = root / "public" / entry["url"].lstrip("/")
            payload = archive.read_bytes()
            self.assertEqual(hashlib.sha256(payload).hexdigest(), entry["sha256"])
            self.assertEqual(json.loads(payload), document)
            self.assertEqual((root / "catalog/delaware-open-data.json").read_bytes(), payload)
            self.assertEqual((root / "public/data/delaware-open-data.json").read_bytes(), payload)
            self.assertEqual(entry["change_type"], "baseline")
            self.assertEqual(entry["added_ids"], [FIRST])
            refresh.publish(document, root=root)
            history = json.loads((root / "public/data/open-data/history.json").read_text())
            self.assertEqual(len(history["snapshots"]), 1)
            self.assertEqual(history["snapshots"][0], entry)

    def test_history_distinguishes_additions_changes_and_not_present_without_deleting_old_capture(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            first = refresh.publish(snapshot([asset(FIRST), asset(SECOND)]), root=root)
            archived = root / "public" / first["url"].lstrip("/")
            original_payload = archived.read_bytes()
            changed = snapshot([asset(FIRST), asset(THIRD)], "2026-10-22T12:00:00Z")
            changed["assets"][0]["name"] = "Updated publisher title"
            second = refresh.publish(changed, root=root)
            self.assertEqual(second["change_type"], "metadata-refresh")
            self.assertEqual(second["added_ids"], [THIRD])
            self.assertEqual(second["changed_ids"], [FIRST])
            self.assertEqual(second["not_in_current_catalog_ids"], [SECOND])
            self.assertEqual(archived.read_bytes(), original_payload)
            history = json.loads((root / "public/data/open-data/history.json").read_text())
            self.assertEqual(len(history["snapshots"]), 2)
            self.assertEqual(history["scope"], "metadata-only")

    def test_changed_capture_time_alone_does_not_claim_dataset_metadata_changed(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            first = refresh.publish(snapshot(), root=root)
            second = refresh.publish(snapshot(checked_at="2026-10-22T12:00:00Z"), root=root)
            self.assertNotEqual(first["sha256"], second["sha256"])
            for key in ["added_ids", "changed_ids", "not_in_current_catalog_ids"]:
                self.assertEqual(second[key], [])

    def test_checksum_path_collision_is_rejected_before_current_replacement(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            document = snapshot()
            entry = refresh.publish(document, root=root)
            current = root / "catalog/delaware-open-data.json"
            original = current.read_bytes()
            archive = root / "public" / entry["url"].lstrip("/")
            archive.write_bytes(b"unexpected replacement bytes")
            with self.assertRaisesRegex(ValueError, "Immutable snapshot collision"):
                refresh.publish(deepcopy(document), root=root)
            self.assertEqual(current.read_bytes(), original)


if __name__ == "__main__":
    unittest.main()
