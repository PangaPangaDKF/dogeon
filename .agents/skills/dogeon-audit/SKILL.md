---
name: dogeon-audit
description: DOGEON's staged audit pipeline. Six read-only auditors run in a fixed sequence (baseline → contracts → game↔chain → server/security → gameplay invariants → landing truth) and a final adversarial verifier; each stage reads every earlier report and must confirm, extend or dispute it. Load to run a full or partial audit before a launch, after a big change, or when the user asks for "audit", "auditoría", "review everything", "launch readiness". Holds the auditor contract (laws, evidence rules, report schema), the stage prompts, and how to run it in-session or as a separate session.
---

# DOGEON Audit Pipeline

Version: 1.0 (2026-11-14, D-106) · Owner: BRAIN lane · Mirror: `.agents/skills/dogeon-audit/SKILL.md`
Stage prompts: `stages/0N-*.md` (this folder). Reports: `docs/audits/<YYYY-MM-DD>/0N-*.md`. Subagent wrappers: `.claude/agents/dogeon-audit-*.md`.

## 1. Sequence (always this order; each stage gets all earlier reports)
| # | Stage | Looks at | Main skills/laws | Report |
|---|---|---|---|---|
| 0 | Baseline | repo state, tests, scope map | `analyzer-master`, CLAUDE.md §6 | `00-baseline.md` |
| 1 | Contracts | `contracts/src/*.sol`, tests | `solidity-auditor`, `solidity-security`, `dogeon-solidity` N0–N7 | `01-contracts.md` |
| 2 | Game ↔ chain | CHAIN section of `src/game.js` (tx paths, refunds, selectors) | `dogeon-solidity` N0/N4, `dogeon-game` | `02-chain.md` |
| 3 | Server & security | `server/relay.mjs`, `Dockerfile`, `fly.toml`, MULTIPLAYER section | OWASP-style review, CLAUDE.md §2 (D-040) | `03-server.md` |
| 4 | Gameplay invariants | `src/game.js` rules vs CLAUDE.md §4, `tests/sim.mjs` coverage | `dogeon-game`, `dogeon-mission`, `dogeon-hardcore-mechanics` | `04-gameplay.md` |
| 5 | Landing truth | `landing.html` claims vs code (read-only; LANDING lane fixes) | `dogeon-landing-design` T1–T9 | `05-landing.md` |
| 6 | Verifier | every finding in 00–05 | adversarial: try to disprove each one | `06-verified.md` (the only list the user sees) |
Why sequential: later stages reuse earlier evidence (e.g. stage 2 checks the game against the contract facts of stage 1) and
must say for each earlier finding: CONFIRMED / EXTENDED / DISPUTED (with evidence). Parallel runs lose that chain.

## 2. The auditor contract (every stage obeys it; stage prompts only add scope)
**Laws to enforce** (cite the law ID in each finding): CLAUDE.md §4 game invariants and §2 stack rules; `dogeon-mission`
R1–R6 (coin art untouched, light: no new FX/sound, scope fence); `dogeon-solidity` nerves **N0 SPEND → GET**, N1 exact payment,
N2 solvency, N3 CEI/nonReentrant/pull, N4 no dupes, N5 honest PonziFi, N6 wallet safety, N7 the game never needs a wallet;
`dogeon-landing-design` T1–T9 (truth, no fake data, real captures, coin sacred, addresses = `CONTRACTS`, links work, chain
params from `CHAIN`, no price, game's own coin art).
**Read-only.** Never edit, format, stage, commit, stash or delete any file except your own report. Never deploy, never send a
transaction, never touch a wallet or a key. Commands allowed: reading, `grep`, `git log/show/diff`, `node --check`,
`bash tests/check.sh`, `node tests/sim.mjs`, `node tests/relay.mjs` (it uses its own port), `cd contracts && forge test`,
`forge test --match-*`, `cast sig`, `node scripts/landing-check.mjs`. Kill only processes you started.
**Evidence or it didn't happen.** Every finding has: `file:line` (current HEAD), the exact quoted code, a concrete failure scenario
(inputs → wrong result), and a proof level: **PROVEN** (you ran a command/test that shows it; paste the output line), **TRACED**
(you followed the code path end to end; list the hops), or **SUSPECTED** (pattern only; say what would prove it). Never invent
line numbers, addresses, selectors, balances or test results. If you did not run it, do not say it passed.
**Don't fix, recommend.** Give the smallest fix and the owning lane (BRAIN or LANDING) and whether it touches contracts (contracts
are frozen as a plan: `docs/CONTRACTS_V2_PLAN.md`; contract fixes become plan items, not code).
**Prior reports are claims, not facts.** Re-check each earlier finding that touches your scope before agreeing. Disagree openly.
**Severity:** CRITICAL (funds/NFTs stolen or duplicated, server takeover, a law broken for every player) · HIGH (exploitable by a
player, data loss, broken core loop) · MEDIUM (wrong behaviour in edge cases, misleading UI/claims) · LOW (hygiene, docs drift) ·
INFO (observation, no action). Testnet tokens have no value: rank by what breaks the game and the trust, not by dollars.
**Stay in scope, stay brief.** Plain English, short sentences, no filler. Max ~25 findings per stage; merge duplicates.
**Stop condition:** you covered every file in your scope list, re-checked the earlier findings in scope, and wrote the report.

## 3. Report schema (copy exactly)
```
# Stage N — <name> · <date> · HEAD <short sha>
## Scope covered
- <files / functions read>, <commands run with their result line>
## Earlier findings re-checked
| ID | Verdict (CONFIRMED/EXTENDED/DISPUTED/OUT OF SCOPE) | Evidence |
## Findings
### SN-1 · <SEVERITY> · <one-line title>
- Law: <ID>   - Where: `path:line`   - Proof: PROVEN | TRACED | SUSPECTED
- Evidence: <quoted code / command + output line>
- Failure scenario: <inputs → wrong result>
- Fix (smallest): <...>   - Lane: BRAIN | LANDING   - Contracts: no | plan item
## Not checked (and why)
## Handoff to the next stage
- <what the next auditor should look at first, with paths>
```

## 4. How to run
**A. In the BRAIN session (Claude Code here):** say "run the dogeon-audit pipeline". BRAIN creates `docs/audits/<date>/`, then for
each stage in order launches one subagent (`.claude/agents/dogeon-audit-<stage>.md`, or a general agent given
`stages/0N-*.md` verbatim), waits for its report, and passes the report paths to the next stage. After stage 6, BRAIN reads
`06-verified.md`, fixes BRAIN-lane items, posts LANDING items on `docs/AGENT_BOARD.md`, logs a D-entry, commits.
**B. As a separate session you control (recommended for a calm audit):**
```bash
hc run --bg --name audit --cwd /mnt/c/Users/dulbi/dogeon -- claude "Load skill dogeon-audit and run the full pipeline, stage 0 to 6. Report path docs/audits/$(date +%F)/. Do not fix anything."
hc attach audit          # watch or steer it; ctrl+\ detaches without stopping it
hc read audit --lines 80 # peek without attaching
```
Or in any terminal: `cd /mnt/c/Users/dulbi/dogeon && claude`, then type the same sentence. To run one stage only:
"use the dogeon-audit-contracts agent" (or `/agents` to see them). Resume a stopped session with `claude --resume`.
**C. One stage by hand:** paste `stages/0N-*.md` into a fresh session together with the paths of the earlier reports.
Cost guide: a full run is 7 agents; run stage 1 only when contracts changed, stages 2–4 after game/server changes, 5 after landing edits.

## 5. After the audit
Only `06-verified.md` findings with verdict REAL are acted on. BRAIN fixes its lane, LANDING gets board tasks, contract items go to
`docs/CONTRACTS_V2_PLAN.md`. Every fix gets a test that fails before and passes after (CLAUDE.md RULE #0). Log one D-entry.

## Changelog
- 1.0 (2026-11-14, D-106): created at the user's request: sequential stages with report handoff, auditor contract (laws, evidence levels, read-only), schema, in-session and separate-session runs.
