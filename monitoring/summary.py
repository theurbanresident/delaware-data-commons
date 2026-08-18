"""Render a monitor result as fixed-field Markdown for a workflow summary."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Mapping, Sequence

from .monitor import ConfigError

_SUMMARY_FIELDS = (
    ("total", "Total"),
    ("available", "Available"),
    ("degraded", "Degraded"),
    ("unavailable", "Unavailable"),
    ("blocked", "Blocked"),
    ("rate_limited", "Rate limited"),
    ("invalid_target", "Invalid target"),
    ("error", "Monitor error"),
)


def render_summary(document: Mapping[str, Any], title: str) -> str:
    """Return Markdown containing only trusted labels and validated counts."""

    summary = document.get("summary")
    if not isinstance(summary, dict):
        raise ConfigError("status document summary must be an object")
    values: list[tuple[str, int]] = []
    for key, label in _SUMMARY_FIELDS:
        count = summary.get(key)
        if not isinstance(count, int) or isinstance(count, bool) or count < 0:
            raise ConfigError(f"status summary {key} must be a non-negative integer")
        values.append((label, count))
    safe_title = " ".join(title.split())
    if not safe_title or len(safe_title) > 120 or any(char in safe_title for char in "\r\n"):
        raise ConfigError("summary title must contain 1 to 120 characters")
    return "\n".join(
        [f"## {safe_title}", "", *(f"- {label}: {count}" for label, count in values)]
    )


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Render a monitor JSON summary as Markdown.")
    parser.add_argument("status", type=Path)
    parser.add_argument("--title", required=True)
    args = parser.parse_args(argv)
    try:
        with args.status.open("r", encoding="utf-8") as handle:
            document = json.load(handle)
        if not isinstance(document, dict):
            raise ConfigError("status document must be an object")
        output = render_summary(document, args.title)
    except (OSError, json.JSONDecodeError, ConfigError) as exc:
        print(f"summary error: {exc}", file=sys.stderr)
        return 2
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
