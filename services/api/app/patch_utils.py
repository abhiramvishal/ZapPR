"""
In-memory unified diff parser and applier.
Parses unified diff format and applies patches to string content.
"""
import re
from dataclasses import dataclass
from typing import Optional


@dataclass
class FilePatch:
    path: str
    hunks: list["Hunk"]


@dataclass
class Hunk:
    old_start: int
    old_lines: int
    new_start: int
    new_lines: int
    lines: list[tuple[str, str]]  # (prefix, content): + - or space


def parse_unified_diff(patch_text: str) -> list[FilePatch]:
    """Parse unified diff and return list of FilePatch."""
    patches: list[FilePatch] = []
    lines = patch_text.split("\n")
    i = 0

    while i < len(lines):
        line = lines[i]
        if line.startswith("--- "):
            old_path = line[4:].split("\t")[0].strip()
            if old_path.startswith("a/"):
                old_path = old_path[2:]
            i += 1
            if i >= len(lines):
                break
            line = lines[i]
            new_path = ""
            if line.startswith("+++ "):
                new_path = line[4:].split("\t")[0].strip()
                if new_path.startswith("b/"):
                    new_path = new_path[2:]
                path = new_path or old_path
            else:
                path = old_path
            hunks: list[Hunk] = []
            i += 1

            while i < len(lines):
                line = lines[i]
                if line.startswith("@@ "):
                    m = re.match(r"@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@", line)
                    if m:
                        old_start = int(m.group(1))
                        old_lines = int(m.group(2) or 1)
                        new_start = int(m.group(3))
                        new_lines = int(m.group(4) or 1)
                        hunk_lines: list[tuple[str, str]] = []
                        i += 1
                        while i < len(lines) and not lines[i].startswith("@@ ") and not lines[i].startswith("--- "):
                            l = lines[i]
                            if l.startswith("+") and not l.startswith("+++"):
                                hunk_lines.append(("+", l[1:]))
                            elif l.startswith("-") and not l.startswith("---"):
                                hunk_lines.append(("-", l[1:]))
                            elif l.startswith(" "):
                                hunk_lines.append((" ", l[1:]))
                            elif l == "\\ No newline at end of file":
                                pass
                            else:
                                break
                            i += 1
                        hunks.append(
                            Hunk(
                                old_start=old_start,
                                old_lines=old_lines,
                                new_start=new_start,
                                new_lines=new_lines,
                                lines=hunk_lines,
                            )
                        )
                        continue
                elif line.startswith("--- "):
                    break
                i += 1

            patches.append(FilePatch(path=path, hunks=hunks))
            continue
        i += 1

    return patches


def apply_patch(original: str, file_patch: FilePatch) -> str:
    """Apply a FilePatch to original content. Returns new content.
    Raises ValueError if patch does not apply cleanly."""
    orig_lines = original.split("\n")
    result: list[str] = []
    pos = 0

    for hunk in file_patch.hunks:
        # Copy lines before this hunk
        while pos < hunk.old_start - 1 and pos < len(orig_lines):
            result.append(orig_lines[pos])
            pos += 1

        # Apply hunk - verify context matches for clean apply
        for prefix, content in hunk.lines:
            if prefix == " ":
                if pos >= len(orig_lines):
                    raise ValueError(f"Patch does not apply: expected context line at {pos + 1}")
                if orig_lines[pos] != content:
                    raise ValueError(f"Patch does not apply: context mismatch at line {pos + 1}")
                result.append(orig_lines[pos])
                pos += 1
            elif prefix == "+":
                result.append(content)
            elif prefix == "-":
                if pos >= len(orig_lines):
                    raise ValueError(f"Patch does not apply: expected line to remove at {pos + 1}")
                if orig_lines[pos] != content:
                    raise ValueError(f"Patch does not apply: line to remove mismatch at {pos + 1}")
                pos += 1

    # Copy remaining lines
    while pos < len(orig_lines):
        result.append(orig_lines[pos])
        pos += 1

    return "\n".join(result)
