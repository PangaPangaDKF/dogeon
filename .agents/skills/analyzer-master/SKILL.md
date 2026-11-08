---
name: analyzer-master
version: "2.0.0"
spec: "agentskills@1.0"
description: >
  Pre-decision strategic analyzer and verification gate for DOGEON (Solidity contracts + 16-bit Canvas RPG).
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
1. `index.html` line budget against the 1,500-line ceiling and forbidden APIs.
2. Selector & contract wiring parity between `index.html` (`CONTRACTS`, `SEL`) and `contracts/src/*.sol`.
3. Unused selectors/constants and top-level identifier collision risks.
4. Coverage gaps: which on-chain action functions in `index.html` lack simulation coverage in `tests/sim.mjs`.

### Step 2 — Strategic Thinking Gate (Stop & Ask Before Acting)
Before proposing any change, answer these 4 strategic questions in 1–2 lines each:
1. **Why this, why now?** Does this change advance the user's actual goal (playable 16-bit RPG + real DogeOS Chikyū DeFi/NFT/Class/Staking loop), or is it scope creep / mechanical rule-following?
2. **Second-order effects:** If I change `X`, what breaks in offline mode (`! wallet.connected`), on account/chain switch (`accountsChanged`/`chainChanged`), on player death (`respawn()`), or in contract solvency (`k = x * y`, `proceeds`, `stakerFees`)?
3. **Test-first proof:** Can I write a failing assertion in `tests/sim.mjs` or `contracts/test/*.t.sol` *before* touching production code?
4. **Context & repo hygiene:** Am I keeping prompts/skills modular (progressive disclosure via `SKILL.md` + `scripts/` + `references/`) instead of bloating the repo or prompt window?

### Step 3 — On-Demand Deep Checklists (`references/`)
Load [`references/decision-gate.md`](./references/decision-gate.md) **only when** your task touches:
- **Solidity / DeFi math** (`contracts/src/*.sol` or `CHAIN` section in `index.html`)
- **Combat, Enemy AI, or Economy balance** (`GAME STATE`, `COMBAT`, `ENEMY AI`)
- **Pixel Art Sprites or Map Generation** (`CHARACTER SPRITES`, `TILES`, `MAP`)

### Step 4 — Verification & Closeout Loop
1. Run full verification:
   ```bash
   bash tests/check.sh
   ```
2. Log the decision in `docs/DECISIONS.md` and `MASTER_PROMPT.md` §G, then commit atomically.
