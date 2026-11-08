# DOGEON — Workspace Rules (`AGENTS.md` / `GEMINI.md` / `CLAUDE.md`)

> Auto-loaded by Antigravity CLI (`agy`) and compatible coding agents. Keep concise, authoritative, and in sync with `CLAUDE.md`.

## 0. RULE #0 (THE NUMBER ONE RULE — `/analyzer-master` SKILL GATE)
1. **Before taking ANY decision or editing ANY file**, invoke and follow the modular **`analyzer-master` skill** ([`.agents/skills/analyzer-master/SKILL.md`](./.agents/skills/analyzer-master/SKILL.md) / [`prompts/ANALYZER_PROMPT_MASTER.md`](./prompts/ANALYZER_PROMPT_MASTER.md)):
   - **Step 1 (Automated Diagnostic Scan):** Run `node .agents/skills/analyzer-master/scripts/audit-scan.mjs` to check line budget, selector parity, top-level collisions, and simulation test coverage gaps.
   - **Step 2 (Strategic Thinking Gate):** Answer *Why this, why now?*, *Second-order effects (offline, account/chain switch, death, contract solvency)*, *Test-first proof*, and *Progressive context hygiene*.
   - **Step 3 (On-Demand Checklists):** Load [`.agents/skills/analyzer-master/references/decision-gate.md`](./.agents/skills/analyzer-master/references/decision-gate.md) only for the domains touched. Wait for approval on multi-section or architectural changes.
2. **RULE #1 — Feature Closeout (after every verified change)**:
   - Run `bash tests/check.sh` (all 4 stages must pass: static rules, JS syntax, headless simulation `tests/sim.mjs`, and Foundry `forge test`).
   - Append a decision entry to [`docs/DECISIONS.md`](./docs/DECISIONS.md) (what, why, tool/skill, alternatives rejected, verification output).
   - Add a row to [`MASTER_PROMPT.md`](./MASTER_PROMPT.md) §G feature ledger.
   - Update [`prompts/SESSION_PROMPT.md`](./prompts/SESSION_PROMPT.md), [`CLAUDE.md`](./CLAUDE.md), [`CONTEXT.md`](./CONTEXT.md), and `dogeon-game` skill if rules or architecture changed.
   - Commit with a Conventional Commit message (one logical feature/fix per commit).

## 1. Architecture & Stack Constraints
- **Single-file game (`index.html`)**: Vanilla JS + HTML5 Canvas 2D (`320×224`, `16×16` tiles, `16×20` sprites, 3×5 uppercase pixel font). Zero external assets, zero build step, no `fetch`/`XMLHttpRequest`/`WebSocket`/`alert`/`confirm`/`prompt`.
- **Web3 & DogeOS Chikyū Testnet (`chainId: 0x5fdaf3` / `6281971`)**: Plain EIP-1193 (`window.ethereum` / `window.bitkeep.ethereum`) in the `CHAIN` section only after player clicks `CONNECT`. Must remain 100% playable offline with no wallet.
- **Smart Contracts (`contracts/`)**: Foundry (`solc 0.8.24`, `cancun`).
  - `DogeItems.sol`: ERC-721Enumerable items (1..6), exact `mintFee`, on-chain SVG `tokenURI`, `inventoryOf`.
  - `DogeDEX.sol`: Fixed-price listings + constant-product (`x * y = k`) NFT/DOGE LP pools, 2% LP fee + 1% protocol fee (0.2% project treasury / 0.8% `DogeStaking`), RedStone `dogeUsd()` view, pull payments via `proceeds` + `withdraw()`.
  - `DogeProfession.sol`: One class per wallet forever (`WARRIOR=1`, `ARCHER=2`, `HEALER=3`), exact fee, pull-payment treasury.
  - `DogeStaking.sol`: MasterChef DOGE staking vault receiving the 0.8% DEX fee share via `flushStakerFees()`.

## 1b. DUAL-BRAIN PROTOCOL (Antigravity CLI ↔ Claude Code) — read before editing
Two agents work this repo. These rules exist because real collisions already happened (one agent's **uncommitted**
`index.html` edits were swept into the other's commit). Follow them exactly.

1. **Dirty tree = the other brain is mid-flight. Do not edit.**
   Start every session with `git status --short && git log --oneline -3`.
   - Tree **clean** → you own the repo, proceed.
   - Tree **dirty** and you did not make those edits → **do not touch those files.** Read them, report what you see,
     and either wait or work in a lane that does not overlap. Never `git checkout`/`stash`/revert another agent's work.
2. **Always hand off a clean tree.** Commit (or explicitly report) everything before you stop. Never end a turn with
   uncommitted edits — that is exactly what the other brain will overwrite.
3. **Claim the decision number first.** `grep -oE 'D-0[0-9]+' docs/DECISIONS.md | sort -u | tail -1`, then write your
   `### D-NNN` heading **before** coding. Two agents must never both write the same `D-NNN`.
4. **One logical change per commit**, Conventional Commits, and state in the body which brain authored it.
5. **Shared blackboard:** [`CLAUDE_CODE_HANDOFF.md`](./CLAUDE_CODE_HANDOFF.md). When you finish a cycle, update its
   "Current Snapshot" and leave a concrete *next* task. Read it first; it is the fastest way to inherit context.
6. **Lane preferences** (soft ownership — reduces overlap, not a hard wall):
   | Lane | Typical owner | Files |
   |---|---|---|
   | Gameplay / sprites / combat feel | Antigravity | `index.html` (GAME STATE, COMBAT, ENEMY AI, RENDER) |
   | Contracts / Web3 / DeFi math / audits | Claude Code | `contracts/**`, `index.html` (CHAIN), `tests/sim.mjs` |
   | Reproducibility / release / tooling | Claude Code | `scripts/**`, `prompts/TRYNOAH_RECREATE.md`, `docs/RECREATION_MANIFEST.md` |
   | Prompts / skills / docs | Either (announce in handoff) | `MASTER_PROMPT.md`, `AGENTS.md`, `CLAUDE.md`, `.claude|.agents/skills/**` |
7. **Never regenerate a generated file by hand.** `docs/RECREATION_MANIFEST.md` comes from
   `node scripts/trynoah-manifest.mjs --out docs/RECREATION_MANIFEST.md`.
8. **Never commit a deploy key.** The testnet key lives only in the session scratchpad. `bash scripts/publish-github.sh`
   runs a hard secret gate and refuses to push if anything key-shaped is tracked.
9. **Learn from both brains' mistakes:** read [`docs/LESSONS.md`](./docs/LESSONS.md) ("Final Conclusions" at minimum) before
   deciding anything. **Every error either brain hits gets appended there** as `L-NNN` with root cause → **RULE** → what now
   enforces it. An error is only closed once a test/script/skill enforces the rule — a note nobody runs is a note nobody keeps.
10. **Pre-commit collision check (mandatory):** `git log --oneline -1` (did HEAD move while you worked?) and
    `git diff --numstat` (does each file's +/- match your intent?). An additive change showing deletions means you are
    reverting the other brain — stop. **Never restore a file from a backup made earlier in the session;** use
    `git checkout -- <file>`. (Real incident: `docs/LESSONS.md` L-016.)

## 2. Verification Commands
```bash
bash tests/check.sh          # Full suite: static checks + syntax + sim.mjs + forge test
node tests/sim.mjs           # Fast headless simulation (88+ checks)
node tests/sprites.mjs index.html tests/out/sprites.png  # Visual sprite sheet verification
```
