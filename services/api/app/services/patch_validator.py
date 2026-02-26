"""
Patch validation: apply check, limits, blocked paths, secrets scan.
"""
import re
from typing import Any

from app.config import get_settings
from app.patch_utils import FilePatch, parse_unified_diff

BLOCKED_PATTERNS = [
    r"\.env$",
    r"\.env\.",
    r"\.pem$",
    r"\.key$",
    r"secrets\.",
    r"\.secret",
    r"config/secrets",
    r"\.credentials",
    r"id_rsa",
    r"id_ed25519",
]
BLOCKED_RE = re.compile("|".join(f"({p})" for p in BLOCKED_PATTERNS))

# Common API key patterns to block in diff content
SECRET_PATTERNS = [
    r"sk-ant-[a-zA-Z0-9-]{20,}",  # Anthropic
    r"sk-[a-zA-Z0-9]{20,}",  # OpenAI
    r"ghp_[a-zA-Z0-9]{36}",
    r"gho_[a-zA-Z0-9]{36}",
    r"AKIA[0-9A-Z]{16}",  # AWS
]
SECRET_RE = re.compile("|".join(f"({p})" for p in SECRET_PATTERNS))


def validate_patch(
    patch_text: str,
    max_files: int | None = None,
    max_lines: int | None = None,
) -> tuple[bool, str | None, list[dict[str, Any]]]:
    """
    Validate patch. Returns (valid, error_message, file_changes).
    file_changes: list of {path, additions, deletions, hunks}
    """
    settings = get_settings()
    max_files = max_files or settings.patch_max_files
    max_lines = max_lines or settings.patch_max_lines

    # Secrets in diff
    if SECRET_RE.search(patch_text):
        return False, "Patch contains potential API keys or secrets", []

    try:
        patches = parse_unified_diff(patch_text)
    except Exception as e:
        return False, f"Invalid patch format: {e}", []

    if not patches:
        return False, "Empty or invalid patch", []

    if len(patches) > max_files:
        return False, f"Too many files changed (max {max_files})", []

    total_add = 0
    total_del = 0
    file_changes: list[dict[str, Any]] = []

    for fp in patches:
        path = fp.path
        if BLOCKED_RE.search(path):
            return False, f"Blocked path: {path}", []

        # Check binary (heuristic: non-utf8 or null bytes)
        add = 0
        del_ = 0
        hunks_info: list[dict[str, Any]] = []

        for hunk in fp.hunks:
            for prefix, content in hunk.lines:
                if prefix == "+":
                    add += 1
                    try:
                        content.encode("utf-8")
                    except UnicodeEncodeError:
                        return False, f"Binary or invalid UTF-8 in {path}", []
                elif prefix == "-":
                    del_ += 1

            hunks_info.append({
                "old_start": hunk.old_start,
                "old_lines": hunk.old_lines,
                "new_start": hunk.new_start,
                "new_lines": hunk.new_lines,
            })

        total_add += add
        total_del += del_
        file_changes.append({
            "path": path,
            "additions": add,
            "deletions": del_,
            "hunks": hunks_info,
        })

    if total_add + total_del > max_lines:
        return False, f"Too many lines changed (max {max_lines})", []

    return True, None, file_changes
