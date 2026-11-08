---
name: analyzer-master
version: "2.1.0"
spec: "agentskills@1.0"
description: >
  Pre-decision strategic analyzer, verification gate, and single-prompt reproducibility architect for DOGEON (Solidity contracts + 16-bit Canvas RPG + BarkSwap/DogeOS Chikyū DeFi).
  Use BEFORE making any architectural, Solidity, Web3, balance, or multi-section code decision, or invoke via /analyzer-master.
---

# Analyzer Master Skill (`/analyzer-master`)

> **RULE #0 (Strategic Pre-Decision Gate):** Do not blindly follow checklists or edit files mechanically. Before any decision, run the bundled diagnostic script, evaluate the **Strategic Next-Step Questions**, and complete the **Explore → Verify → Plan → Execute** loop.

## 1. Progressive Execution Workflow

### Step 1 — Automated Architecture & Parity Scan (`scripts/`)
Run the bundled zero-dependency scanner first to get hard facts instead of guessing:
```bash
node .agents/skills/analyzer-master/scripts/audit-scan.mjs
```
This script deterministically checks:
1. `index.html` line budget against the 1,500-line ceiling and forbidden APIs (`fetch`, `alert`, `confirm`, `prompt`, `XMLHttpRequest`, `WebSocket`, `import`).
2. Selector & contract wiring parity between `index.html` (`CONTRACTS`, `TOKENS`, `SEL`) and `contracts/src/*.sol`.
3. Unused selectors/constants and top-level identifier collision risks.
4. Coverage gaps: which on-chain action functions in `index.html` lack simulation coverage in `tests/sim.mjs`.

### Step 2 — Strategic Thinking Gate (Stop & Ask Before Acting)
Before proposing any change, answer these 4 strategic questions in 1–2 lines each:
1. **Why this, why now?** Does this change advance the user's actual goal (playable 16-bit RPG + real DogeOS Chikyū DeFi/BarkSwap/NFT/Class/Staking loop), or is it scope creep / mechanical rule-following?
2. **Second-order effects:** If I change `X`, what breaks in offline mode (`!chainReady() || !addrs().x`), on account/chain switch (`accountsChanged`/`chainChanged`), on player death (`respawn()`), or in contract solvency (`k = x * y`, `proceeds`, `stakerFees`)?
3. **Test-first proof:** Can I write a failing assertion in `tests/sim.mjs` or `contracts/test/*.t.sol` *before* touching production code?
4. **Zero-Waste Single-Prompt Reproducibility (TryNoah AI Rule):** Can another AI builder (e.g., TryNoah AI) recreate this exact feature from `MASTER_PROMPT.md` §A–B and `dogeon-game/SKILL.md` without missing contract addresses, 4-byte selectors, state fields, or UI rows? Remove any dead instructions or outdated facts immediately.

### Step 3 — On-Demand Deep Checklists (`references/`)
Load [`references/decision-gate.md`](./references/decision-gate.md) **only when** your task touches:
- **Solidity / DeFi math** (`contracts/src/*.sol` or `CHAIN` section in `index.html`)
- **Combat, Enemy AI, or Economy balance** (`GAME STATE`, `COMBAT`, `ENEMY AI`)
- **Pixel Art Sprites or Map Generation** (`CHARACTER SPRITES`, `TILES`, `MAP`)

### Step 4 — Enchanted Prompt Engineering Pattern (For New Skills & Prompts)
Whenever the user asks to build or document a feature prompt, structure it with these 4 zero-waste blocks (see `MASTER_PROMPT.md` §B):
1. **Context & Hard Constraints:** Target file (`@index.html`), line ceiling (`< 1,500`), zero-dependency rule, verification command (`audit-scan.mjs && bash tests/check.sh`).
2. **Exact On-Chain Registry & Selectors:** Explicit contract addresses (`CONTRACTS`, `TOKENS`, `REDSTONE`) and 4-byte `SEL` hex strings — never leave addresses or selectors vague.
3. **Deterministic Implementation Spec:** Exact function signatures, state mutations (`P.*`, `chainData.*`), UI row labels, and offline fallback behavior.
4. **Negative Constraints:** Explicit "Do NOT" guardrails (e.g., do not block `chainAct` before `await fn()`, do not break offline mode, do not use `api.get().ui = null` to close menus in `sim.mjs`).

### Step 5 — Verification & Closeout Loop (`RULE #1`)
1. Run full verification:
   ```bash
   node .agents/skills/analyzer-master/scripts/audit-scan.mjs && bash tests/check.sh
   ```
2. Update `MASTER_PROMPT.md` (§A Blueprint, §B Enchanted Example, §G Ledger), `.claude/skills/dogeon-game/SKILL.md`, `prompts/SESSION_PROMPT.md`, and `docs/DECISIONS.md`, then commit atomically.
