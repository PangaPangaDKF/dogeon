# START HERE — any agent opening DOGEON

DOGEON is a 16-bit browser action RPG on the DogeOS Chikyū testnet: game `src/game.js`, relay `server/relay.mjs`, contracts
`contracts/src/`, landing `landing.html`, live at https://dogeon.lat (landing) and https://play.dogeon.lat (game).
Two Claude Code lanes work it in turns. **Pick one before you touch anything. If you are not sure which, ask the user.**

## 1. Choose your path
| If your task is… | You are | Load first | Start the session with |
|---|---|---|---|
| Game rules, bugs, server/relay, tests, contracts plan, media (video/audio/images), audits, subagents, **any deploy** | **BRAIN** | skill `dogeon-brain` | `claude --agent dogeon-brain` |
| Only `landing.html` (copy, layout, placing media BRAIN delivered, landing truth fixes) | **LANDING** | skill `dogeon-landing-design` | `claude --agent dogeon-landing` |
| Anything else, or both lanes at once, or the user's request is ambiguous | **Ask the user** which lane, in one short question, before editing | — | — |

Do not pick a lane just because it is free. If the user's words don't make the lane obvious, ask:
"Is this for the game/server side (BRAIN) or only the landing page (LANDING)?"

## 2. Then, in this order
1. `docs/AGENT_BOARD.md` — §Status, tasks for your lane, D-numbers (reserve yours there **before** you write it anywhere).
2. Your lane skill's state file: `.claude/skills/dogeon-brain/references/STATE.md` or `.claude/skills/dogeon-landing-design/references/STATE.md`.
3. `git status --short && git log --oneline -8`. If files you don't own are dirty, the other lane is mid-task: don't touch them.
4. `CLAUDE.md` (project rules) and the charter skill `dogeon-mission` (what to build and what never to change).

## 3. Laws every agent keeps
- **Charter (`dogeon-mission`):** never alter the Dogecoin coin art (R1); light: no new FX/sound (R2); scope freeze: finish and
  polish, add nothing the user didn't ask for.
- **N0 SPEND → GET (`dogeon-solidity`):** nothing is minted, credited or paid out of nothing, in the game or on chain.
- **No in-game DOGE (D-097):** testnet DOGE is only for mint, DEX, staking and the class oath.
- **Contracts are frozen until after launch:** contract findings live in `docs/CONTRACTS_V2_PLAN.md` §0 (first when work restarts).
- **Truth:** every public claim matches the code; testnet tokens, no real value, not financial advice.
- **Collisions (`dogeon-agent-sync`):** own-lane paths only, `git add <paths>` (never `-A`), reserve D-numbers first, only BRAIN deploys.
- Every verified change: `bash tests/check.sh` green → `docs/DECISIONS.md` entry → Conventional Commit.

## 4. Where the user is now (2026-11-14)
Launch-ready. Last step: a live playtest with up to 8 players (procedure: `.claude/skills/dogeon-brain/references/RUNBOOK.md` §8).
Deferred by the user: contracts v2 (§0), player saves (`docs/PLAYER_DATA_PLAN.md`).
