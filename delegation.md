# Prototype delegation instructions

How to delegate each prototype to a subagent, what to include in the prompt, and how to verify the output.

---

## Waves

Don't run all 8 in parallel. Credential requests and design questions from 8 agents at once are unmanageable.

**Wave 1:** P0 alone. Everything depends on it. Small scope (types + Zod schemas, no logic).

**Wave 2:** P1, P2, P3, P4, P5 in parallel. The core prototypes. P3 and P4 will ask for API keys. P1 and P2 need no credentials. P5 is self-contained.

**Wave 3:** P6, P7, P8 after wave 2 settles. Integration surfaces. P6 imports P1's `<DynamicForm>` directly. P8 needs P4's interfaces finalized. P7 needs Salesforce credentials.

---

## What to include in each agent's prompt

### Required context

1. **Its own prototype section** from `prototypes.md` — the full text of the relevant P(N) section only.
2. **P0 contracts** — once P0 is built, include the full source of `p0-contracts/` so the agent knows the exact types/interfaces it's implementing. For P0 itself, include the P0 section from `prototypes.md`.
3. **Relevant design.md sections** for domain understanding:
   - P1: sections 2.1 (dynamic form)
   - P2: sections 2.1--2.3 (form triggers, pipeline, AI actions)
   - P3: sections 2.2--2.4 (pipeline, AI actions, SecureDNA)
   - P4: sections 2.1 + 2.6 (customer auth, provider auth) + full `cybersec/cybersec-requirements.md` sections 2.2--2.9
   - P5: section 2.2 (the three views: customer, provider, debug)
   - P6: sections 2.1--2.3 (the full customer + provider experience)
   - P7: sections 2.3 + 2.5 (email actions, Salesforce)
   - P8: all of section 2 + section 3 (needs to understand the full data model)
4. **Existing tool code** — if the prototype's section lists "Existing code to reuse", include those files or tell the agent where to find them (`~/code/cliver/tool/...`).

### Behavioral instructions

Include these verbatim (or adapted) in every agent prompt:

```
## How to build this prototype

Follow this protocol strictly:

### Phase 1: Design questions
Before writing any code, ask me 2--5 blocking design and dependency questions
using AskUserQuestion. Examples: library choices, API credential availability,
format decisions. Do not guess—ask.

### Phase 2: Implementation
- Import types from `../p0-contracts/`. Do not redefine shared types.
- Write tests first (red), then implementation (green).
- Use real APIs. If you need a credential, ask me—don't skip the test or mock it.
- The prototype directory must be self-contained:
  - Its own `package.json` with dependencies
  - Its own test runner, runnable with `cd <dir> && yarn test`
  - A `contract-check.ts` file that imports every export and verifies it satisfies
    the P0 interfaces. Must compile with `npx tsc --noEmit contract-check.ts`.
- Use yarn for package management.

### Phase 3: Explanation
After all tests pass, dispatch a subagent to read the implementation and write
`EXPLANATION.md`. The explanation must:
- Be understandable by someone who doesn't know TypeScript, React, or the
  specific libraries used
- Use proper nouns for technologies but explain them on first use
  (e.g., "SSE (Server-Sent Events, a way for the server to push updates to
  the browser in real time)")
- Describe what the code does, not how the code is structured
- Cover: what problem this prototype solves, how it works at a high level,
  what external services it talks to, and what its boundaries are
```

### What NOT to include

- Don't paste the entire `prototypes.md`. Each agent only needs its own section + P0. The full doc wastes context and invites the agent to interfere with other prototypes.
- Don't prescribe specific libraries unless you have a strong preference. The design-questions phase handles this—let the agent propose, you approve.
- Don't include other prototypes' sections. If P2 needs to know about P3's interface, it gets that from P0's types, not from P3's spec.

---

## Verifying output

Three checks per prototype, in order of effort:

### 1. Automated: run the tests

```bash
cd pN-whatever && yarn test
```

If tests pass, the agent built what it said it would. If they fail, send the agent back with the failure output. You shouldn't need to read the code to verify correctness—that's what the tests are for.

### 2. Human-readable: read EXPLANATION.md

Read the plain-language explanation. If it doesn't match your understanding of what the prototype should do, something's wrong—either the implementation or the spec. Faster than reading TypeScript.

### 3. Contract compliance: verify the interface

```bash
cd pN-whatever && npx tsc --noEmit --project tsconfig.json
```

The agent was instructed to create a `contract-check.ts` file (included in the project's `tsconfig.json`). It imports every export and assigns it to a variable typed with the P0 interface. If it compiles, the contracts are met.

---

## Watching for cross-prototype conflicts

Pay attention to design questions from wave 2 agents. If two agents ask contradictory questions (e.g., P4 asks "should sessions use cookies?" while P8 asks "should sessions use bearer tokens?"), that's a sign the spec needs clarification before both go build incompatible things.

After each wave, before starting the next:
1. Run all tests across all completed prototypes.
2. Skim each EXPLANATION.md for anything surprising.
3. Check that P0 types haven't been forked or redefined in any prototype.
