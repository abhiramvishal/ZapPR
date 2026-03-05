"""
Claude agent: generates unified diff patch from user goal and repo context.
"""
import re
from typing import Any

from anthropic import Anthropic

AGENT_SYSTEM = """You are a code assistant that generates unified diff patches only.
You must NOT directly edit files. You output exactly:
1. PLAN: A short bullet list of what you will change
2. PATCH: A single unified diff block (format: --- a/path, +++ b/path, @@ ... @@)
3. SUMMARY: Files changed and why

Output format (strict):
## PLAN
- bullet 1
- bullet 2

## PATCH
--- a/file.py
+++ b/file.py
@@ -1,3 +1,4 @@
 line1
+new line
 line2

## SUMMARY
- file.py: description
"""


def build_context_prompt(
    repo_map: str,
    selected_files: dict[str, str],
    user_goal: str,
    extra_instructions: str | None = None,
) -> str:
    parts = [
        "## Repo structure (directory tree)",
        repo_map,
        "",
        "## Selected file contents (for context)",
    ]
    for path, content in selected_files.items():
        parts.append(f"### {path}")
        parts.append("```")
        parts.append(content[:50000])  # Limit per file
        if len(content) > 50000:
            parts.append("... (truncated)")
        parts.append("```")
        parts.append("")

    parts.append("## User goal")
    parts.append(user_goal)
    if extra_instructions:
        parts.append("")
        parts.append("## Extra instructions")
        parts.append(extra_instructions)

    return "\n".join(parts)


def parse_agent_response(text: str) -> tuple[list[str], str, str]:
    """Parse agent response into plan, patch, summary."""
    plan: list[str] = []
    patch = ""
    summary = ""

    plan_match = re.search(r"##\s*PLAN\s*\n(.*?)(?=##|$)", text, re.DOTALL | re.IGNORECASE)
    if plan_match:
        plan_text = plan_match.group(1).strip()
        plan = [b.strip().lstrip("-•*").strip() for b in plan_text.split("\n") if b.strip()]

    patch_match = re.search(r"##\s*PATCH\s*\n(.*?)(?=##|$)", text, re.DOTALL | re.IGNORECASE)
    if patch_match:
        patch = patch_match.group(1).strip()

    summary_match = re.search(r"##\s*SUMMARY\s*\n(.*?)(?=##|$)", text, re.DOTALL | re.IGNORECASE)
    if summary_match:
        summary = summary_match.group(1).strip()

    return plan, patch, summary


async def generate_patch(
    api_key: str,
    repo_map: str,
    selected_files: dict[str, str],
    user_goal: str,
    extra_instructions: str | None = None,
) -> dict[str, Any]:
    """
    Call Claude to generate a patch. Uses transient API key (never stored).
    Returns {plan, patch, summary, files_changed}.
    """
    client = Anthropic(api_key=api_key)
    prompt = build_context_prompt(repo_map, selected_files, user_goal, extra_instructions)

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=16000,
        system=AGENT_SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )

    text = ""
    for block in message.content:
        if hasattr(block, "text"):
            text += block.text

    plan, patch, summary = parse_agent_response(text)

    # Extract file paths from patch
    files_changed: list[str] = []
    for line in patch.split("\n"):
        if line.startswith("--- ") or line.startswith("+++ "):
            path = line[4:].split("\t")[0].strip()
            if path.startswith("a/") or path.startswith("b/"):
                path = path[2:]
            if path and path not in files_changed:
                files_changed.append(path)

    return {
        "plan": plan,
        "patch": patch,
        "summary": summary,
        "files_changed": files_changed,
    }


async def chat(
    api_key: str,
    repo_map: str,
    selected_files: dict[str, str],
    message: str,
    history: list[dict[str, str]],
) -> dict[str, Any]:
    """Conversational chat with Claude. Returns content and optional patch."""
    client = Anthropic(api_key=api_key)
    context = ""
    if repo_map:
        context += f"## Repo structure\n{repo_map}\n\n"
    if selected_files:
        context += "## File contents for context\n"
        for path, content in list(selected_files.items())[:10]:
            context += f"### {path}\n```\n{content[:8000]}\n```\n\n"

    messages = []
    for h in history[-10:]:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": f"{context}\n\nUser: {message}"})

    msg = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=8000,
        system="You are a code assistant. When making code changes, output a unified diff in a ## PATCH section. Format: ## PLAN (bullets), ## PATCH (unified diff), ## SUMMARY.",
        messages=messages,
    )

    text = ""
    for block in msg.content:
        if hasattr(block, "text"):
            text += block.text

    plan, patch, summary = parse_agent_response(text)
    files_changed = []
    for line in patch.split("\n"):
        if line.startswith("--- ") or line.startswith("+++"):
            path = line[4:].split("\t")[0].strip().replace("a/", "").replace("b/", "")
            if path and path not in files_changed:
                files_changed.append(path)

    return {
        "content": text,
        "patch": patch if patch else None,
        "files_changed": files_changed,
    }
