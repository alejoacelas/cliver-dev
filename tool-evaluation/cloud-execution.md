# Cloud execution guide

> For running the pipeline from a Claude Code cloud session. Read `run.md` first, then this file.

---

## 1. Setup (do this before Stage 0)

### API keys

Write the following to `tool-evaluation/../.env` (i.e., the repo root `.env`).
The keys will be provided in the task description — copy them verbatim.

```
OPENROUTER_API_KEY=...
EXA_API_KEY=...
SMARTY_AUTH_ID=...
SMARTY_AUTH_TOKEN=...
STRIPE_TEST_PK=...
STRIPE_TEST_SK=...
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENV=sandbox
COMPANIES_HOUSE_API_KEY=...
GOOGLE_MAPS_API_KEY=...
GEONAMES_USERNAME=...
```

`llm-exa-search.py` and all stage scripts load this file automatically. Do not commit it.

### Customer dataset

`tool-evaluation/customers.csv` is gitignored (contains PII). Fetch it from the private gist:

```bash
curl -L "https://gist.github.com/alejoacelas/f5cb417b57bd3c171b052d19d0198be4/raw" \
  -o tool-evaluation/customers.csv
```

Verify: `wc -l tool-evaluation/customers.csv` should be ≥ 536.

---

## 2. Rate limit strategy

The pipeline's heavy stages (3, 5 loop) run many parallel subagents that make
LLM calls. Claude's usage resets on a rolling 3-hour window. If you hit a rate
limit mid-stage, the right response is not a fixed sleep — it's to wait until
3 hours have elapsed since the session started (or since the last reset was hit).

**Rule:** Track the wall-clock time when the session starts. Before launching
each heavy stage (Stage 3 rounds, Stage 5 iterations), check: has at least
3 hours passed since the last time you were rate-limited (or since start if
you haven't been limited yet)? If not, wait until that 3-hour mark before
proceeding. Light stages (0, 2, 4, 6, 7) can run immediately — they don't
generate enough volume to hit limits.

Stages that count as heavy (require the 3h check):
- Stage 3, every round (including re-runs triggered by Stage 5)
- Stage 5, every iteration

Stages that are light (run freely):
- Stage 0, 2, 4, 6, 7

**Practical flow:**

```
T=0:00  Start. Note wall-clock start time.
        Run Stage 0 (light).
        Run Stage 2 (light, 9 parallel subagents).

T≈1:00  Stage 3, round 1 (heavy — check: ≥3h since last limit? No limit yet,
        so first 3h window starts now).
        Run Stage 3 round 1 (9 parallel subagents).

T≈2:30  Stage 5, iteration 1 (heavy — check: <3h since Stage 3 started).
        Wait until T=4:00 if needed, then run.

T≈4:00  Stage 3 round 2 / Stage 5 iteration 2 (heavy — 3h window resets here).
        Run if Stage 5 iteration 1 found high-severity issues.

T≈5:30  Stage 5 final / Stage 4 (Stage 4 is light — run immediately).

T≈6:30  Stage 6 (light, sequential).

T≈7:30  Stage 7 (light, sequential).
```

If you hit a 429 or rate-limit error mid-stage: stop, note the exact wall-clock
time, wait until 3h from that moment, then resume. Don't retry sooner.

---

## 3. Tool availability

Standard CLI tools used by stages:
- `dig` — DNS lookups (MX, SPF, DMARC records)
- `whois` — domain registration fallback
- `curl` — API calls
- `uv` — Python runner (`uv run tool-evaluation/llm-exa-search.py`)

These should be available in the cloud environment. If `dig` or `whois` is
missing, the email/domain stage can note the gap and continue with RDAP.
