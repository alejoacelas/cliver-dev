# /// script
# requires-python = ">=3.11"
# dependencies = ["httpx"]
# ///
"""
LLM+Exa search tool for the KYC tool evaluation pipeline.

Core loop adapted from api-cliver: sends a prompt to Gemini via OpenRouter's
Responses API, gives the model an Exa web-search tool, and loops until it
produces a final answer.

Usage:
    uv run tool-evaluation/llm-exa-search.py "Does MIT have a presence at 77 Massachusetts Ave?"
    uv run tool-evaluation/llm-exa-search.py --prompt-file query.txt
    uv run tool-evaluation/llm-exa-search.py --prompt-file query.txt --json

Env vars (reads from .env automatically):
    OPENROUTER_API_KEY  — required
    EXA_API_KEY         — required
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import httpx

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

OPENROUTER_RESPONSES_URL = "https://openrouter.ai/api/v1/responses"
EXA_SEARCH_URL = "https://api.exa.ai/search"

DEFAULT_MODEL = "google/gemini-3.1-pro-preview"
MAX_ITERATIONS = 15
REQUEST_TIMEOUT = 120.0  # seconds

# Exa search defaults
EXA_NUM_RESULTS = 10
EXA_MAX_CHARS = 800  # per-result text content cap
EXA_SEARCH_TYPE = "neural"

# ---------------------------------------------------------------------------
# Load .env (minimal, no dependency)
# ---------------------------------------------------------------------------


def _load_dotenv(path: Path) -> None:
    """Source key=value lines from a .env file into os.environ."""
    if not path.is_file():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip()
        if not os.environ.get(key):
            os.environ[key] = value


# Load project .env, then global credentials as fallback
_load_dotenv(Path(__file__).resolve().parent.parent / ".env")
_load_dotenv(Path.home() / ".config" / "credentials" / ".env")

# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------


@dataclass
class ToolCall:
    """Record of a single tool invocation."""

    tool_name: str
    arguments: dict[str, Any]
    result: dict[str, Any]
    duration_s: float


@dataclass
class SearchResult:
    """Final output of a search run."""

    answer: str
    tool_calls: list[ToolCall] = field(default_factory=list)
    total_exa_cost: float = 0.0
    model: str = ""
    iterations: int = 0


# ---------------------------------------------------------------------------
# Exa search implementation
# ---------------------------------------------------------------------------


def exa_search(
    query: str,
    *,
    exa_api_key: str,
    num_results: int = EXA_NUM_RESULTS,
    max_chars: int = EXA_MAX_CHARS,
    search_type: str = EXA_SEARCH_TYPE,
) -> dict[str, Any]:
    """Call the Exa search API and return formatted results."""
    payload = {
        "query": query,
        "numResults": num_results,
        "type": search_type,
        "contents": {"text": {"maxCharacters": max_chars}},
    }

    with httpx.Client(timeout=30.0) as client:
        resp = client.post(
            EXA_SEARCH_URL,
            headers={
                "x-api-key": exa_api_key,
                "Content-Type": "application/json",
            },
            json=payload,
        )
    resp.raise_for_status()
    data = resp.json()

    results = []
    for item in data.get("results", []):
        results.append({
            "url": item.get("url", ""),
            "title": item.get("title", ""),
            "content": item.get("text", ""),
        })

    cost = data.get("costDollars", {}).get("total", 0.0)
    return {"results": results, "cost": cost}


# ---------------------------------------------------------------------------
# Tool definition (OpenRouter Responses API format)
# ---------------------------------------------------------------------------

SEARCH_TOOL_SCHEMA: list[dict[str, Any]] = [
    {
        "type": "function",
        "name": "search_web",
        "description": (
            "Search the web using Exa neural search. Use this to find "
            "current information about institutions, addresses, domains, "
            "organizations, or any factual question that requires web lookup."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query — be specific and descriptive.",
                },
            },
            "required": ["query"],
        },
    }
]

# ---------------------------------------------------------------------------
# Core agentic loop
# ---------------------------------------------------------------------------


def run_search(
    prompt: str,
    *,
    system_prompt: str | None = None,
    model: str = DEFAULT_MODEL,
    max_iterations: int = MAX_ITERATIONS,
    openrouter_key: str | None = None,
    exa_key: str | None = None,
    verbose: bool = False,
) -> SearchResult:
    """
    Run the LLM+Exa agentic loop.

    Sends `prompt` to the model with a web search tool. The model can call
    the tool as many times as it needs. Loop ends when the model produces a
    final text response without requesting more tool calls.

    If `system_prompt` is provided, it is sent as the `instructions` field
    (system-level context) and `prompt` becomes the user message with the
    case-specific input fields.
    """
    openrouter_key = openrouter_key or os.environ["OPENROUTER_API_KEY"]
    exa_key = exa_key or os.environ["EXA_API_KEY"]

    headers = {
        "Authorization": f"Bearer {openrouter_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://cliver.example.com",
        "X-Title": "Cliver KYC Tool Evaluation",
    }

    input_items: list[dict[str, Any]] = [{"role": "user", "content": prompt}]
    tool_calls: list[ToolCall] = []
    total_exa_cost = 0.0

    for iteration in range(1, max_iterations + 1):
        if verbose:
            print(f"  [iter {iteration}] Calling {model}...", file=sys.stderr)

        payload: dict[str, Any] = {
            "model": model,
            "input": input_items,
            "tools": SEARCH_TOOL_SCHEMA,
            "tool_choice": "auto",
        }
        if system_prompt:
            payload["instructions"] = system_prompt

        with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
            response = client.post(
                OPENROUTER_RESPONSES_URL,
                headers=headers,
                json=payload,
            )
        response.raise_for_status()
        data = response.json()

        output_items = data.get("output", [])
        function_calls = [
            item for item in output_items if item.get("type") == "function_call"
        ]

        if not function_calls:
            # Model is done — extract final text
            break

        for fc in function_calls:
            func_name = fc.get("name", "")
            call_id = fc.get("call_id", "")

            try:
                args = json.loads(fc.get("arguments", "{}"))
            except json.JSONDecodeError:
                args = {}

            query = args.get("query", "")
            if verbose:
                print(f"  [iter {iteration}] search_web: {query!r}", file=sys.stderr)

            # Execute Exa search
            t0 = time.monotonic()
            try:
                result = exa_search(query, exa_api_key=exa_key)
            except Exception as e:
                result = {"results": [], "cost": 0.0, "error": str(e)}
            duration = time.monotonic() - t0

            total_exa_cost += result.get("cost", 0.0)

            tool_calls.append(ToolCall(
                tool_name=func_name,
                arguments=args,
                result=result,
                duration_s=round(duration, 2),
            ))

            # Format result for model
            model_output = json.dumps({
                "instruction": "Cite using [N] format where N is the result index.",
                "results": [
                    {
                        "index": i + 1,
                        "title": r.get("title", ""),
                        "url": r.get("url", ""),
                        "content": r.get("content", ""),
                    }
                    for i, r in enumerate(result.get("results", []))
                ],
            })

            # Feed back into conversation
            input_items.append({
                "type": "function_call",
                "id": fc.get("id", call_id),
                "call_id": call_id,
                "name": func_name,
                "arguments": fc.get("arguments", "{}"),
                "status": "completed",
            })
            input_items.append({
                "type": "function_call_output",
                "call_id": call_id,
                "output": model_output,
            })

    # Extract final answer text
    answer = _extract_text(output_items, data)

    return SearchResult(
        answer=answer,
        tool_calls=tool_calls,
        total_exa_cost=total_exa_cost,
        model=model,
        iterations=iteration,
    )


def _extract_text(
    output_items: list[dict[str, Any]], data: dict[str, Any]
) -> str:
    """Extract text content from OpenRouter Responses API output."""
    for item in output_items:
        if item.get("type") == "message":
            content_items = item.get("content", [])
            text_parts = []
            for content in content_items:
                if content.get("type") == "output_text":
                    text_parts.append(content.get("text", ""))
            if text_parts:
                return "".join(text_parts)

    # Fallback to top-level output_text
    return data.get("output_text", "")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description="LLM+Exa search — agentic web search for KYC tool evaluation",
    )
    parser.add_argument("prompt", nargs="?", help="The search prompt")
    parser.add_argument(
        "--prompt-file", type=Path, help="Read prompt from a file instead"
    )
    parser.add_argument(
        "--system-prompt-file", type=Path,
        help="System prompt file (the template). When used, --prompt-file or "
             "positional prompt becomes the user message (case-specific input).",
    )
    parser.add_argument(
        "--model", default=DEFAULT_MODEL, help=f"OpenRouter model ID (default: {DEFAULT_MODEL})"
    )
    parser.add_argument(
        "--max-iterations", type=int, default=MAX_ITERATIONS,
        help=f"Max tool-calling iterations (default: {MAX_ITERATIONS})",
    )
    parser.add_argument(
        "--json", action="store_true", dest="json_output",
        help="Output full result as JSON (for pipeline integration)",
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true",
        help="Print progress to stderr",
    )

    args = parser.parse_args()

    if args.prompt_file:
        prompt = args.prompt_file.read_text().strip()
    elif args.prompt:
        prompt = args.prompt
    else:
        parser.error("provide a prompt or --prompt-file")
        return

    system_prompt = None
    if args.system_prompt_file:
        system_prompt = args.system_prompt_file.read_text().strip()

    result = run_search(
        prompt,
        system_prompt=system_prompt,
        model=args.model,
        max_iterations=args.max_iterations,
        verbose=args.verbose,
    )

    if args.json_output:
        output = {
            "answer": result.answer,
            "model": result.model,
            "iterations": result.iterations,
            "total_exa_cost_usd": result.total_exa_cost,
            "tool_calls": [
                {
                    "tool": tc.tool_name,
                    "query": tc.arguments.get("query", ""),
                    "num_results": len(tc.result.get("results", [])),
                    "duration_s": tc.duration_s,
                    "results": [
                        {"title": r.get("title", ""), "url": r.get("url", "")}
                        for r in tc.result.get("results", [])
                    ],
                }
                for tc in result.tool_calls
            ],
        }
        print(json.dumps(output, indent=2))
    else:
        print(result.answer)
        print(f"\n---\nSearches: {len(result.tool_calls)} | "
              f"Iterations: {result.iterations} | "
              f"Exa cost: ${result.total_exa_cost:.4f}")


if __name__ == "__main__":
    main()
