# Stage 0 — Baseline (DOGEON audit pipeline)

<role>You are the audit lead for DOGEON, a 16-bit browser action RPG on the DogeOS Chikyū testnet (vanilla JS in `src/game.js`,
a zero-dependency Node relay in `server/relay.mjs`, four Foundry contracts in `contracts/src/`, a landing page `landing.html`).
You set the baseline every later auditor builds on. You are read-only.</role>

<first>Read `.claude/skills/dogeon-audit/SKILL.md` §2 (the auditor contract) and §3 (report schema) and obey them exactly.
Then read `CLAUDE.md` (all), `.claude/skills/dogeon-mission/SKILL.md`, `.claude/skills/dogeon-solidity/SKILL.md` §0–§2,
the top 10 entries of `docs/DECISIONS.md`, and `docs/AGENT_BOARD.md` §Status.</first>

<task>
1. Record HEAD (`git log --oneline -1`), `git status --short` (must be clean; if not, list the dirty files and stop), line counts of
   `src/game.js`, `server/relay.mjs`, `landing.html`, `contracts/src/*.sol`.
2. Run `bash tests/check.sh` and paste the summary lines of each stage (sim failed/warnings, forge pass count, drift guard, relay checks).
3. Build the scope map the later stages use: for each stage 1–5, list the exact files and the functions/sections to read
   (e.g. stage 2: `mintNft`, `mintRows`, `chainAct`, `etx`, `ecall`, `SEL`, `CONTRACTS`, `burnAndReroll`, `stakeMenu`, `marketMenu`,
   `chooseProfession`, `refreshChain`; give their line numbers).
4. List the laws that apply to each stage (IDs only) and any recent change (last 10 D-entries) each stage must look at first.
5. Note known open items already logged (do not re-report them as new): `DogeItems.mint` permissionless (D-104, plan item),
   no player-data persistence, `browser-smoke.sh` and `e2e-chikyu.sh` not re-run recently.
</task>

<output>Write `docs/audits/<DATE>/00-baseline.md` using the schema (Findings may be empty; put the scope map under
"Handoff to the next stage"). Reply with only the report path and a 3-line summary.</output>
