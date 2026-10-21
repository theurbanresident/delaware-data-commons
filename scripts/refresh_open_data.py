#!/usr/bin/env python3
"""Capture public Delaware catalog metadata; never retrieve dataset rows.

Run live with --fetch, or reproduce an evidence capture with --from-directory
and --checked-at. A failed/incomplete response leaves the last catalog intact.
"""
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
from html import unescape
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import tempfile
from urllib.parse import urlencode, urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

ROOT = Path(__file__).resolve().parents[1]
CATALOG_API = "https://api.us.socrata.com/api/catalog/v1"
TRANSITION = "https://dhss.delaware.gov/dph/homepage/about/health-data-stats/my-healthy-community/"
ID = re.compile(r"^[a-z0-9]{4}-[a-z0-9]{4}$")
ALLOWED_HOSTS = {"api.us.socrata.com", "data.delaware.gov", "dhss.delaware.gov"}


def validate_url(url):
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname not in ALLOWED_HOSTS or parsed.port not in (None, 443) or parsed.username or parsed.password:
        raise ValueError("Unexpected metadata URL")


class PublisherRedirects(HTTPRedirectHandler):
    def redirect_request(self, request, response, code, message, headers, new_url):
        validate_url(new_url)
        return super().redirect_request(request, response, code, message, headers, new_url)


class Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_data(self, value):
        self.parts.append(value)


def plain(value):
    parser = Text()
    parser.feed(str(value or ""))
    return " ".join(unescape(" ".join(parser.parts)).split())


def encode(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode()


def timestamp(value):
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value, timezone.utc).isoformat().replace("+00:00", "Z")
    return value or None


def fetch(url):
    # Only fixed publisher/catalog hosts are contacted; no catalog URLs executed.
    validate_url(url)
    request = Request(url, headers={"User-Agent": "DelawareDataCommons-Metadata/1.0", "Accept": "application/json,text/html"})
    with build_opener(PublisherRedirects()).open(request, timeout=45) as response:
        data = response.read(15_000_001)
        if len(data) > 15_000_000:
            raise ValueError("Metadata response exceeds 15 MB")
        return data


def normalize_asset(item):
    resource, classification = item["resource"], item.get("classification", {})
    asset_id = resource["id"]
    if not ID.fullmatch(asset_id) or item.get("metadata", {}).get("domain") != "data.delaware.gov":
        raise ValueError("Invalid asset ID or catalog domain")
    fields = resource.get("columns_field_name") or []
    names = resource.get("columns_name") or []
    types = resource.get("columns_datatype") or []
    descriptions = resource.get("columns_description") or []
    def at(values, index):
        return plain(values[index]) if index < len(values) else ""
    return {
        "id": asset_id, "name": plain(resource.get("name")),
        "description": plain(resource.get("description")),
        "url": f"https://data.delaware.gov/d/{asset_id}",
        "asset_type": resource.get("type") or "unknown",
        "publisher": plain(resource.get("attribution")) or None,
        "category": plain(classification.get("domain_category")) or None,
        "tags": sorted(set(plain(t) for t in classification.get("domain_tags", []) if t)),
        "updated_at": timestamp(resource.get("data_updated_at")),
        "metadata_updated_at": timestamp(resource.get("metadata_updated_at")),
        "metadata_url": f"https://data.delaware.gov/api/views/{asset_id}.json",
        "license": plain(item.get("metadata", {}).get("license")) or None,
        "columns": [{"field_name": field, "name": at(names, index), "data_type": at(types, index), "description": at(descriptions, index)} for index, field in enumerate(fields)],
    }


def build_snapshot(catalog, details, landing, checked_at, evidence):
    parsed_time = datetime.fromisoformat(checked_at.replace("Z", "+00:00"))
    if parsed_time.tzinfo is None:
        raise ValueError("Capture timestamp requires an explicit timezone")
    checked_at = parsed_time.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    results = catalog.get("results", [])
    expected = int(catalog["resultSetSize"])
    if not results or len(results) != expected:
        raise ValueError(f"Incomplete catalog: {len(results)} of {expected}")
    assets = sorted((normalize_asset(item) for item in results), key=lambda item: (item["name"].casefold(), item["id"]))
    by_id = {asset["id"]: asset for asset in assets}
    if len(by_id) != len(assets):
        raise ValueError("Duplicate asset IDs")
    priority_ids = sorted(set(re.findall(r"https://data\.delaware\.gov/[^\s\"<>]*?/([a-z0-9]{4}-[a-z0-9]{4})(?:[/\"?]|$)", landing)))
    if not priority_ids:
        raise ValueError("No official MHC priority links found; review publisher transition")
    for asset_id in priority_ids:
        if asset_id not in by_id or asset_id not in details:
            raise ValueError(f"Missing priority metadata: {asset_id}")
        detail = details[asset_id]
        if detail.get("id") != asset_id:
            raise ValueError("Priority metadata ID mismatch")
        asset = by_id[asset_id]
        asset["columns"] = [{"field_name": c["fieldName"], "name": c["name"], "data_type": c["dataTypeName"], "description": plain(c.get("description"))} for c in detail["columns"] if not c.get("fieldName", "").startswith(":" )]
        asset["updated_at"] = timestamp(detail.get("rowsUpdatedAt"))
        asset["metadata_updated_at"] = timestamp(detail.get("viewLastModified"))
        asset["temporal_coverage"] = detail.get("metadata", {}).get("custom_fields", {}).get("Additional Information", {}).get("Temporal Coverage")
    counts = dict(sorted(Counter(a["asset_type"] for a in assets).items()))
    return {
        "schema_version": "1.0", "checked_at": checked_at,
        "portal": {"name": "Delaware Open Data", "url": "https://data.delaware.gov/", "catalog_url": f"{CATALOG_API}?domains=data.delaware.gov", "scope": "Public catalog metadata, not dataset rows or a full historical data archive."},
        "summary": {"asset_count": len(assets), "dataset_count": counts.get("dataset", 0), "by_type": counts},
        "assets": assets,
        "mhc": {"transition_url": TRANSITION, "checked_at": checked_at, "priority_dataset_ids": priority_ids, "dictionary_status": "not-acquired", "note": "DHSS links these priority datasets while My Healthy Community is in transition. These are current ODP column descriptions, not a recovered original MHC indicator dictionary. Migration completeness and statistical equivalence have not been established."},
        "evidence": evidence,
        "archive": {"scope": "metadata-only", "history_url": "/data/open-data/history.json", "payloads_archived": False},
    }


def publish(snapshot, root=ROOT):
    output = root / "catalog/delaware-open-data.json"
    previous = json.loads(output.read_text()) if output.exists() else None
    before = {a["id"]: a for a in previous["assets"]} if previous else {}
    after = {a["id"]: a for a in snapshot["assets"]}
    payload = encode(snapshot)
    digest = hashlib.sha256(payload).hexdigest()
    relative = f"/data/open-data/history/{snapshot['checked_at'][:10]}-{digest[:12]}.json"
    archive_path = root / "public" / relative.lstrip("/")
    archive_path.parent.mkdir(parents=True, exist_ok=True)
    if archive_path.exists() and archive_path.read_bytes() != payload:
        raise ValueError("Immutable snapshot collision")
    history_path = root / "public/data/open-data/history.json"
    history = json.loads(history_path.read_text()) if history_path.exists() else {"schema_version": "1.0", "scope": "metadata-only", "snapshots": []}
    entry = {"checked_at": snapshot["checked_at"], "url": relative, "sha256": digest, "asset_count": len(after), "change_type": "metadata-refresh" if previous else "baseline", "added_ids": sorted(after.keys() - before.keys()), "not_in_current_catalog_ids": sorted(before.keys() - after.keys()), "changed_ids": sorted(k for k in before.keys() & after.keys() if before[k] != after[k])}
    if not any(s["sha256"] == digest for s in history["snapshots"]):
        history["snapshots"].append(entry)
    # Stage every file after validation, then replace each without truncating it.
    # The immutable snapshot is installed before indexes that reference it.
    output.parent.mkdir(parents=True, exist_ok=True)
    writes = [(archive_path, payload), (history_path, encode(history)), (output, payload), (root / "public/data/delaware-open-data.json", payload)]
    staged = []
    try:
        for path, data in writes:
            path.parent.mkdir(parents=True, exist_ok=True)
            with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as handle:
                staged.append((Path(handle.name), path))
                handle.write(data)
        for temporary, path in staged:
            os.replace(temporary, path)
    finally:
        for temporary, _ in staged:
            temporary.unlink(missing_ok=True)
    return entry


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--fetch", action="store_true")
    mode.add_argument("--from-directory", type=Path)
    parser.add_argument("--checked-at", help="Original UTC retrieval time for offline reproduction")
    args = parser.parse_args()
    checked_at = args.checked_at or datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    if args.from_directory and not args.checked_at:
        parser.error("Offline capture requires --checked-at")
    evidence = []
    def record(url, data):
        evidence.append({"request_url": url, "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data), "scope": "publisher-metadata"})
        return data
    if args.from_directory:
        raw = (args.from_directory / "catalog-domain-limit1000.json").read_bytes()
        catalog = json.loads(record(f"{CATALOG_API}?domains=data.delaware.gov&limit=1000", raw))
        landing_bytes = (args.from_directory / "mhc-transition.html").read_bytes()
    else:
        results, expected = [], None
        for offset in range(0, 5000, 100):
            url = f"{CATALOG_API}?{urlencode({'domains': 'data.delaware.gov', 'limit': 100, 'offset': offset})}"
            page = json.loads(record(url, fetch(url)))
            if expected is not None and expected != int(page["resultSetSize"]):
                raise ValueError("Catalog count changed during pagination; retry capture")
            expected = int(page["resultSetSize"])
            results.extend(page["results"])
            if len(results) >= expected:
                break
        catalog = {"results": results, "resultSetSize": expected}
        landing_bytes = fetch(TRANSITION)
    landing = record(TRANSITION, landing_bytes).decode("utf-8")
    priority_ids = sorted(set(re.findall(r"https://data\.delaware\.gov/[^\s\"<>]*?/([a-z0-9]{4}-[a-z0-9]{4})(?:[/\"?]|$)", landing)))
    details = {}
    for asset_id in priority_ids:
        url = f"https://data.delaware.gov/api/views/{asset_id}.json"
        raw = (args.from_directory / f"{asset_id}-metadata.json").read_bytes() if args.from_directory else fetch(url)
        details[asset_id] = json.loads(record(url, raw))
    snapshot = build_snapshot(catalog, details, landing, checked_at, evidence)
    entry = publish(snapshot)
    print(json.dumps({"assets": snapshot["summary"], "snapshot": entry["url"], "sha256": entry["sha256"]}))


if __name__ == "__main__":
    main()
