"""Generate monitor targets from the reviewed intake without duplicating it."""

from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
from pathlib import Path
from typing import Any, Mapping, Sequence

from .monitor import ConfigError, SCHEMA_VERSION

_MONITORED_ROLES = frozenset({"current", "archive"})
_NON_MONITORED_ROLES = frozenset({"request_info"})
_EXPECTED_CONTENT_TYPES = {
    "pdf": ["application/pdf"],
}


def build_targets(document: Mapping[str, Any]) -> dict[str, Any]:
    """Extract public current/archive URLs from a reviewed-intake document.

    Request-only sources and request-information links remain catalog metadata
    but are not outage targets because access requires human coordination.
    """

    if document.get("schema_version") != SCHEMA_VERSION:
        raise ConfigError(f"catalog schema_version must be {SCHEMA_VERSION}")
    sources = document.get("sources")
    if not isinstance(sources, list):
        raise ConfigError("catalog sources must be an array")

    endpoints: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for source_index, source in enumerate(sources):
        if not isinstance(source, dict):
            raise ConfigError(f"sources[{source_index}] must be an object")
        access_type = source.get("access_type")
        if access_type == "request_only":
            continue
        if access_type != "public":
            raise ConfigError(
                f"sources[{source_index}].access_type must be public or request_only"
            )
        source_id = source.get("id")
        if not isinstance(source_id, str):
            raise ConfigError(f"sources[{source_index}].id must be a string")
        distributions = source.get("distributions", [])
        if not isinstance(distributions, list):
            raise ConfigError(f"sources[{source_index}].distributions must be an array")

        for distribution_index, distribution in enumerate(distributions):
            location = f"sources[{source_index}].distributions[{distribution_index}]"
            if not isinstance(distribution, dict):
                raise ConfigError(f"{location} must be an object")
            role = distribution.get("role")
            if role in _NON_MONITORED_ROLES:
                continue
            if role not in _MONITORED_ROLES:
                raise ConfigError(f"{location}.role is not a supported access role")
            distribution_id = distribution.get("id")
            url = distribution.get("url")
            data_format = distribution.get("format")
            if not isinstance(distribution_id, str):
                raise ConfigError(f"{location}.id must be a string")
            if not isinstance(url, str):
                raise ConfigError(f"{location}.url must be a string")
            key = (source_id, distribution_id)
            if key in seen:
                raise ConfigError(f"duplicate distribution target {source_id}/{distribution_id}")
            seen.add(key)

            target: dict[str, Any] = {
                "dataset_id": source_id,
                "distribution_id": distribution_id,
                "url": url,
                "enabled": True,
            }
            expected = _EXPECTED_CONTENT_TYPES.get(str(data_format).lower())
            if expected:
                target["expected_content_types"] = expected
            endpoints.append(target)

    return {"schema_version": SCHEMA_VERSION, "endpoints": endpoints}


def load_catalog(path: Path) -> Mapping[str, Any]:
    try:
        with path.open("r", encoding="utf-8") as handle:
            document = json.load(handle)
    except json.JSONDecodeError as exc:
        raise ConfigError(f"{path} is not valid JSON: line {exc.lineno}") from exc
    except OSError as exc:
        raise ConfigError(f"unable to read catalog {path}") from exc
    if not isinstance(document, dict):
        raise ConfigError("catalog document must be an object")
    return document


def write_targets(path: Path, document: Mapping[str, Any]) -> None:
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
            json.dump(document, handle, indent=2, ensure_ascii=False)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary_name, path)
    finally:
        if temporary_name and os.path.exists(temporary_name):
            os.unlink(temporary_name)


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Generate monitor targets from a reviewed-intake catalog."
    )
    parser.add_argument("--catalog", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args(argv)
    try:
        targets = build_targets(load_catalog(args.catalog))
        write_targets(args.output, targets)
    except (ConfigError, OSError) as exc:
        print(f"target generation error: {exc}", file=sys.stderr)
        return 2
    print(f"generated {len(targets['endpoints'])} monitor targets")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
