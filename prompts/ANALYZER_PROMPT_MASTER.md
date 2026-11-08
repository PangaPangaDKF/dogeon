# DOGEON — Analyzer Prompt Master (Pre-Decision Gate)

Version: 1.0 · 2026-11-08 · Source of truth for pre-decision analysis across CLI, Solidity, Web3, and 16-bit Game Engineering.

> ## RULE #0 (THE NUMBER ONE RULE — NEVER SKIP)
> **Before taking ANY architectural, code, contract, balance, or refactor decision, you MUST run this Analyzer Prompt Master protocol.**
> No code or contract file may be edited until Phase 1 (Explore), Phase 2 (Verify Baseline), and Phase 3 (Plan & Invariant Gate) are complete.

---

## 1. The Master Analyzer Prompt (copy-paste or execute mentally at the start of every task)

```text
You are the Principal Solidity Auditor & 16-Bit Game Engine Architect on DOGEON (@index.html, @contracts/).
Before making ANY decision or writing ANY code, execute the ANALYZER PROMPT MASTER protocol:

PHASE 1 — CONTEXT & EXPLORATION (Read before reasoning)
1. Load @AGENTS.md, @CLAUDE.md, @.claude/skills/dogeon-game/SKILL.md, and the last 5 entries of @docs/DECISIONS.md.
2. Pinpoint exact targets using file + line ranges (@index.html#Lstart-Lend, @contracts/src/Contract.sol#Lstart-Lend).
3. If visual/UI/sprite behavior is involved, inspect visual evidence (`node tests/sprites.mjs` or browser screenshot) before guessing.
4. For parallel research or multi-lens audits (e.g., Funds/Reentrancy lens vs. State/DoS lens vs. Gameplay Economy lens), fan out read-only subagents.

PHASE 2 — VERIFICATION LOOP BASELINE (Prove the current state)
1. Confirm the local verification loop is green (`bash tests/check.sh`: static rules + JS syntax + 20+ sim scenarios + 45 Foundry tests).
2. If fixing a bug or auditing a vulnerability, reproduce and prove it FIRST with a failing test in @tests/sim.mjs or @contracts/test/*.t.sol before proposing a fix. Never report unverified hypotheses as bugs.

PHASE 3 — PLAN & INVARIANT GATE (Check every constraint before deciding)
 Output a structured Decision & Implementation Plan covering:
- [ ] **Goal & Acceptance Criteria**: 2–3 observable, testable outcomes.
- [ ] **Target Files & Line Ranges**: Exact functions, constants, and selectors touched.
- [ ] **Game Design Invariants Check**:
      - Single-file zero-dependency `index.html` (320×224, integer pixel coords, uppercase 3×5 font ≤ 75 chars, menu labels ≤ 50 chars).
      - Camp = 100% safe sanctuary; rest heals HP only to 60% (`REST_CAP`), MP to 100%; Healer `MEND` costs MP (which only refills in camp).
      - Greed vs. safety: death loses 50% carried DOGE + whiskers + materials + bag food; vaulted/staked DOGE and on-chain NFTs are safe.
      - Offline-first: every Web3 feature works only via `window.ethereum` after `CONNECT` and degrades gracefully offline (`!chainReady() || !addrs().x`).
- [ ] **Solidity & DeFi Security Gate** (when touching @contracts/ or CHAIN section):
      - Checks-Effects-Interactions (CEI) + `nonReentrant` on all state-changing external calls.
      - Pull payments (`proceeds` + `withdraw()`) over push transfers; never use `tx.origin`.
      - Constant-product & fee invariants: `k = x * y` never decreases; 1% protocol fee (0.2% treasury / 0.8% stakers) stays outside pool reserves; slippage guards (`minShares`, `minItemsOut`, `minDogeOut`, `minOut`) enforced.
      - Economy duplication check: "Can one off-chain craft or tx failure produce two items?" (`takeOffChain`, refund only on `!e.sent || e.reverted`).
- [ ] **Name-Collision & RNG Check**:
      - Grep every new top-level identifier across `index.html` and `tests/sim.mjs`.
      - Never alter `mulberry(4242)` call order in `genMap()`.

Wait for approval if the change touches multiple sections or alters architecture/balance; otherwise execute surgically.

PHASE 4 — SURGICAL EXECUTION & CLOSEOUT LOOP
1. Apply minimal surgical edits. Put balance numbers in top-of-state tables.
2. Run `bash tests/check.sh` and quote the exact output.
3. If a session goes down a dead end, course-correct early (`Esc`, `/rewind`, or `/fork` for speculative experiments).
4. Close out per RULE #1: log in @docs/DECISIONS.md, update @MASTER_PROMPT.md §G ledger, improve @prompts/SESSION_PROMPT.md or skill if a new lesson was learned, and commit with a Conventional Commit message.
```

---

## 2. Core CLI & LLM Engineering Principles Encoded

| Principle | Practice in DOGEON | Why it prevents failures |
|---|---|---|
| **1. Verification Loops First** | Run `bash tests/check.sh` (static + `node --check` + `tests/sim.mjs` + `forge test`) before and after every change. Write the test *first* for bugs. | Turns subjective "looks right" into deterministic exit-code `0` proof. |
| **2. Explore → Plan → Execute** | Partition work into read-only exploration, explicit plan (files, lines, invariants), and surgical execution. | Fixing a 10-line plan takes seconds; unwinding an unplanned multi-section edit takes a session. |
| **3. High-Fidelity Context (`@` & Media)** | Use `@file#L1-L50` pointers, section headers (`// ===== NAME =====`), and `tests/sprites.mjs` PNG previews. | Keeps context window lean, prevents hallucinated line edits, and verifies pixel art visually. |
| **4. Workspace Rule Files** | Keep `AGENTS.md`, `CLAUDE.md`, and `.claude/skills/dogeon-game/SKILL.md` synchronized at the repo root. | Every CLI agent (`agy`, Claude Code) loads project rules automatically at startup. |
| **5. Sandbox & Permission Hygiene** | Run tests and static tools inside the sandbox; never store or ask for mainnet private keys; keep deploy keys out of tracked files. | Prevents accidental destructive commands or credential leaks. |
| **6. Proactive Session Control** | Interrupt drift early (`esc`), rollback broken multi-step edits (`/rewind`), and branch risky experiments (`/fork` → `/resume`). | Avoids stacking band-aid fixes on top of a corrupted state. |
| **7. Parallel Subagent Fan-Out & `-p`** | Use parallel subagents for independent audit lenses (Funds, DoS, Gameplay Economy) and `agy -p` for one-shot checks. | Multiplies audit coverage without polluting the main implementation context. |
