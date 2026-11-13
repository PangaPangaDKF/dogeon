---
name: dogeon-agent-sync
description: How DOGEON's two Claude Code agents (BRAIN = game/server/media/deploy, LANDING = landing page only) split work, take turns every 30+ minutes through docs/AGENT_BOARD.md, avoid git collisions and hand tasks to each other. Load at the start of every session in this repo when another agent may be running, and before writing to any shared file, committing, or deploying.
---

# DOGEON Agent Sync (two-lane loop)

Version: 1.0 (2026-11-13, D-096) · Decided by the user · Mirror: `.agents/skills/dogeon-agent-sync/SKILL.md`

## 1. The two lanes
| Lane | Who | Owns (only this lane writes it) | Decides |
|---|---|---|---|
| **BRAIN** | The heavy agent (herdr terminal named `CLaudote`) | `src/`, `index.html`, `server/`, `contracts/`, `tests/`, `scripts/` (except `scripts/landing-*.mjs`), `assets/video/`, `docs/TRAILER_SCRIPT.md`, `docs/GAME_GUIDE.md`, `CLAUDE.md`, all skills except the landing one, `Dockerfile`, `fly.toml`, **every deploy** | Everything not listed for LANDING: game rules, media, server, deploy, and which tasks each lane gets |
| **LANDING** | The light agent (herdr terminal named `dogeon`) | `landing.html`, `scripts/landing-*.mjs`, `assets/icons/`, `assets/screenshots/`, `.claude/skills/dogeon-landing-design/` (+ `.agents` mirror), `prompts/LANDING_MASTER_PROMPT.md` | Only landing-page design and copy, inside the truth rules |
Shared, append-only for both: `docs/AGENT_BOARD.md`, `docs/DECISIONS.md`, `CONTEXT.md`. Add your own entry; never rewrite the other lane's entry.
BRAIN does the token-heavy work (video, images, audio, code, tests, chain checks, deploy) and gives LANDING small, exact tasks.
LANDING saves tokens: it reads the board, does its tasks, reports, and asks BRAIN for anything outside `landing.html`.

## 2. The loop (one turn = do, report, hand over, wait)
1. **Read first.** `docs/AGENT_BOARD.md` (your inbox), `git log --oneline -8`, `git status --short`. To read the other agent's
   screen: `hc ls` (find the terminal whose `where` is the other lane's name), then `hc read <address> --lines 120`.
2. **Do your tasks.** Only in files your lane owns. Need a change in the other lane's file? Write it as a task on the board.
3. **Verify** with the commands the task names (at least `bash tests/check.sh`; LANDING also `node scripts/landing-check.mjs`).
4. **Commit only your paths** (`git add <paths>`, never `git add -A`), Conventional Commit, with your reserved D-number.
5. **Report on the board:** append under `## Log` → what you did, the commit hash, the tests you ran and their result, and
   new tasks for the other lane (numbered, exact file paths, exact values, how to verify). Update `## Status`.
6. **Hand over:** if the other agent's `hc ls` status is `done` or `idle`, send one line:
   `hc send <address> "BOARD: new tasks for <LANE> in docs/AGENT_BOARD.md (after <hash>). Read it, do them, report back, then wait 30 min."`
   Never `hc send` into an agent whose status is `working`; the board is enough, it will read it on its next turn.
7. **Wait at least 30 minutes**, then go to step 1. BRAIN waits with a background command, which wakes it when it ends:
   `sleep 1800; git -C /mnt/c/Users/dulbi/dogeon log --oneline -5; tail -40 /mnt/c/Users/dulbi/dogeon/docs/AGENT_BOARD.md`
   (Bash `run_in_background: true`). Don't stop the loop while either lane has open tasks; stop when the board says `DONE`.

## 3. Collision rules
- `git status --short` right before every write. If a file you own shows changes you didn't make, stop and ask on the board.
- **D-numbers are reserved on the board** (`## D-numbers`) before you use them. Take the next free one and write it there first.
- Never commit, revert, stash, or reformat the other lane's files. Never `git add -A`, `git stash`, `git reset --hard` or `git checkout -- <their file>`.
- If HEAD moved while you worked, run `git log --stat` on the new commits, and confirm they don't touch your files before you commit.
- **Deploys are BRAIN only**: after both lanes have committed, `bash tests/check.sh` is green, and `node scripts/landing-check.mjs` is green.
  `fly deploy -a dogeon-game`, then verify `https://dogeon.lat/`, `https://play.dogeon.lat/` and `/health`, then log the result on the board.
- Tests that start servers use their own port and kill only their own PID (never `pkill node`): the user's relay may be running.

## 4. Writing a good task for the other lane
Each task needs: an ID (`L7` for LANDING, `B7` for BRAIN), a goal in one sentence, exact files, exact values (hashes, paths,
sizes, numbers already verified), the truth source (a commit, a D-entry or a code line), and a verify step. LANDING should never
have to re-derive a fact BRAIN already checked.

## Changelog
- 1.0 (2026-11-13, D-096): Created at the user's request: BRAIN/LANDING split, board mailbox, 30-minute take-and-give loop, hc read/send, D-number reservation, BRAIN-only deploys.
