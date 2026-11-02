#!/usr/bin/env python3
"""Offline integrity check for the TORI specification pack, not a product test."""

from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
REQUIRED = (
    "README.md", "AGENTS.md", "STATE.md", "HANDOFF.md", "CODEX_START.md",
    "docs/specs/FOUNDATION.md", "docs/specs/ARCHITECTURE.md",
    "docs/specs/CONTRACTS.md", "docs/specs/CAPABILITY-CATALOG.md",
    "docs/specs/UI-FOUNDATION.md", "docs/specs/ACCEPTANCE.md",
    "docs/implementation/ROADMAP.md", "docs/implementation/FIRST-STAGE.md",
    "docs/reference/BASELINE.md", "docs/governance/DECISIONS.md",
    "docs/governance/UI-EXCEPTIONS.md", "docs/governance/VERIFICATION.md",
    "docs/evidence/TEMPLATE.md", "docs/evidence/bootstrap/INSPECTION.md",
    "docs/evidence/bootstrap/VALIDATION.md",
)
EXPECTED_STAGES = {"G0", "U0", "V1a", "V1b", "V1c", "V2", "V3", "V4", "V5", "I-VICT"}


def main() -> int:
    errors = []
    for name in REQUIRED:
        if not (ROOT / name).is_file():
            errors.append(f"Missing required file: {name}")
    if errors:
        print("\n".join(errors))
        return 1

    # Limit scans to the specification pack, not dependencies/future build outputs.
    docs = sorted(ROOT.glob("*.md")) + sorted((ROOT / "docs").rglob("*.md"))
    texts = {path: path.read_text(encoding="utf-8") for path in docs}
    links = 0
    for path, content in texts.items():
        if not content.endswith("\n"):
            errors.append(f"Missing final newline: {path.relative_to(ROOT)}")
        for target in re.findall(r"\[[^\]]*\]\(([^)]+)\)", content):
            target = target.strip().strip("<>")
            parsed = urlsplit(target)
            if parsed.scheme or parsed.netloc or not parsed.path:
                continue
            resolved = (path.parent / unquote(parsed.path)).resolve()
            links += 1
            if not resolved.is_relative_to(ROOT) or not resolved.exists():
                errors.append(f"Broken/outside local link in {path.relative_to(ROOT)}: {target}")

    catalog = (ROOT / "docs/specs/CAPABILITY-CATALOG.md").read_text(encoding="utf-8")
    acceptance = (ROOT / "docs/specs/ACCEPTANCE.md").read_text(encoding="utf-8")
    roadmap = (ROOT / "docs/implementation/ROADMAP.md").read_text(encoding="utf-8")
    groups = (
        ("capability", re.findall(r"^\| (CAP-\d{2}) \|", catalog, re.M), {f"CAP-{n:02}" for n in range(1, 35)}),
        ("product test", re.findall(r"^## (T\d{2}) —", acceptance, re.M), {f"T{n:02}" for n in range(1, 10)}),
        ("cross-cutting probe", re.findall(r"^\| (X\d{2}) \|", acceptance, re.M), {f"X{n:02}" for n in range(1, 16)}),
        ("UI criterion", re.findall(r"^\| (U0-\d{2}) \|", acceptance, re.M), {f"U0-{n:02}" for n in range(1, 15)}),
    )
    declared = set()
    for label, actual, expected in groups:
        declared.update(expected)
        if set(actual) != expected or len(actual) != len(expected):
            errors.append(f"{label} inventory differs: missing={sorted(expected - set(actual))}, extra={sorted(set(actual) - expected)}, rows={len(actual)}")
    for path, content in texts.items():
        for match in re.findall(r"\b(?:CAP-\d{2}|T\d{2}|X\d{2}|U0-\d{2})\b", content):
            if match not in declared:
                errors.append(f"Unknown criterion {match} in {path.relative_to(ROOT)}")
    stages = set(re.findall(r"^\| (G0|U0|V\d[a-z]?|I-VICT) \|", roadmap, re.M))
    if stages != EXPECTED_STAGES:
        errors.append(f"Roadmap stage inventory differs: {sorted(stages)}")
    for line in catalog.splitlines():
        if re.match(r"\| CAP-\d{2} \|", line) and not re.search(r"\b(?:T\d{2}|X\d{2})\b", line):
            errors.append(f"Capability without acceptance reference: {line.split('|')[1].strip()}")

    if errors:
        print("Documentation integrity FAIL")
        print("\n".join(errors))
        return 1
    print(f"Documentation integrity PASS: {len(docs)} Markdown files, {links} local links, 34 capabilities, 9 product tests, 15 cross-cutting probes, 14 UI criteria, 10 roadmap stages.")
    print("Scope: file/link/identifier integrity only; no runtime or owner acceptance is implied.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
