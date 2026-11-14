---
name: dogeon-landing-design
description: Complete handoff skill for DOGEON's landing page (landing.html on dogeon.lat) and its media placement. Load at the start of any landing session, or before designing, reviewing, writing copy for, or changing landing.html, assets/icons, assets/screenshots or the landing's videos. Holds the session protocol, the LANDING lane, truth rules T1–T10, the design system, the 3 verification gates, and references/ with the live state, page map, verified facts, open tasks, runbooks and the full changelog. Must be updated in the same commit as every landing change.
---

# DOGEON Landing Skill

Version: 2.1 (2026-11-14) · Lane: LANDING (herdr terminal `dogeon`) · Agent: `.claude/agents/dogeon-landing.md` ·
Opener prompt: `prompts/LANDING_MASTER_PROMPT.md` · History and lessons: `references/CHANGELOG.md`.

## 0. Start here (every session)
1. Read `references/STATE.md`: what's live, the page map, facts already verified, open tasks. Don't re-derive what it lists.
2. Read the newest entries in `docs/AGENT_BOARD.md` (tasks for LANDING, D-numbers) and `docs/HANDOFF_LOOP.md`;
   run `git status --short && git log --oneline -8`. If a file you own shows changes you didn't make, stop and ask on the board.
3. Pick the task: the board's LANDING tasks first, then `STATE.md` §4. Under the scope freeze, add nothing the user didn't ask for.
4. Before changing any claim, check it against the code (T1). Use `references/RUNBOOK.md` for recipes instead of improvising.
5. Pass the 3 gates (§5), close out (RULE L0), commit only your paths, report on the board, and ask BRAIN to deploy.

## RULE L0: keep the handoff current
Every landing change ends with, in the same commit: a version bump here plus a top entry in `references/CHANGELOG.md` (what you
learned); `references/STATE.md` updated (page map, facts, open tasks); `prompts/LANDING_MASTER_PROMPT.md` bumped if the workflow
changed; a `docs/DECISIONS.md` entry with a D-number reserved on the board; and the mirror
`cp -r .claude/skills/dogeon-landing-design/. .agents/skills/dogeon-landing-design/`. Write in plain English. If something went
wrong, add the rule that would have prevented it.

## 1. Role and lane
The landing has one job: **get a visitor into the game in one click and make them trust that the on-chain parts are real.**
LANDING owns `landing.html`, `scripts/landing-*.mjs`, `assets/icons/`, `assets/screenshots/`, this skill (+ `.agents` mirror),
`prompts/LANDING_MASTER_PROMPT.md` and `.claude/agents/dogeon-landing.md`. Everything else is BRAIN's (game, server, tests, video/audio
in `assets/video/`, every deploy). Need something outside your lane? Write a task on the board.
Charter (`dogeon-mission`) wins conflicts: R1 never alter the Dogecoin coin art; R2 no decorative FX.

## 2. Truth rules (a claim with no source gets deleted)
- **T1. Every claim maps to code or a D-entry.** Grep `src/game.js`, `server/relay.mjs`, `contracts/src/` before publishing a number
  or a feature, and re-check every caption after any game-rule change.
- **T2. No fake live data** (server status, balances, levels, player counts).
- **T3. Gameplay images are real captures** (`assets/screenshots/`, `assets/video/`), integer-scaled and pixelated. AI art is key art only.
- **T4. The coin is sacred (R1):** never redrawn or "enhanced", in any image.
- **T5. Addresses = `CONTRACTS['0x5fdaf3']`**, linked to `https://dogeos-testnet.l2scan.co/address/<addr>`.
- **T6. Links work today.** Play CTAs → `https://play.dogeon.lat/`; the `/play` route also works.
- **T7. Chain parameters come from `CHAIN` in `src/game.js`**, never memory. A wrong RPC is a security bug (D-085).
- **T8. Testnet PonziFi, never a price.** No DOGE price, USD value, oracle or yield promise anywhere, images included. PonziFi and
  staking are satire on free testnet tokens; keep the "testnet, no real-world value, not financial advice" disclaimer in hero and footer.
- **T9. Doge art: the game's own coin** (`assets/icons/dogecoin.png`, `coin.png`, from `scripts/landing-icons.mjs`), whole-number scales.
  No inline coin pixel data, no halos/sparkles. No third-party Dogecoin/Kabosu images without the owner's permission.
- **T10. Lore layers.** Keep The Grand Heist's main lore; DOGEON is its **PonziFi chapter** in a magic dimension, a degen web3 meme
  game. Voice for Doge-community degens (fren, rug, APY, paper hands, bonk, such/much/wow), always with the testnet disclaimer.
  No in-game DOGE exists (D-097).

## 3. Design system (apply it, don't replace it)
A dark "heist terminal": DogeOS yellow is the one dominant accent, cyan = web3/tech, red = danger/PvP, green = safe, purple = raid/staking.
Tokens in `landing.html` `:root`: `--bg #020307`, `--card-bg #0a0c16`, `--card-border #181d36`, `--gold #ffd500`, `--cyan #0bdafe`,
`--red #fb1313`, `--green #00c758`, `--purple #b829ff`, `--text #fff`, `--text-muted #94a3b8`. Single dark theme.
Type: **Press Start 2P** for headlines and CTAs only (cap 32 px under 900 px), **Silkscreen** for chips and captions, **Space Grotesk**
for body (line-height 1.6, ~65 characters). Reusable classes: `.card`, `.grid-2`, `.grid-3`, `.shot-card`/`.shot` (figure + capture),
`.proof`/`.proof-list`, `.trailer`, `.story-box`, `.table-wrap`.

## 4. Design practices (keep it from looking machine-made)
Real content from the game's world; one bold idea (the pixel game frame), everything else quiet. Avoid AI tells: emoji icons, fake
dashboards, gradient blobs, decorative numbering, centering everything, identical card chrome. Icons come from the game. Copy is
plain, specific and active (no em-dash asides, no "not X but Y", no hype without a fact). Grids use `minmax(min(Npx, 100%), 1fr)`;
wide tables live in `.table-wrap`. Alt text on every image, visible focus, `prefers-reduced-motion` honored. No scripts or frameworks.

## 5. The 3 gates (all must pass before a commit)
```bash
node scripts/landing-check.mjs      # truth/design gate
node scripts/landing-probe.mjs      # true 390/360 px overflow probe (exit 1 lists offenders)
bash tests/check.sh                 # project suite (~5 min; run in the background)
```
Also view at least one 1280 px render of what you changed (`node scripts/landing-probe.mjs --shot '#id' --out /tmp/x.png`, then
Read it). Video playback and other traps: `references/RUNBOOK.md` §2.

## 6. References
| File | Read when |
|---|---|
| `references/STATE.md` | Every session (live status, page map, verified facts, open tasks) |
| `references/RUNBOOK.md` | Verifying, screenshots, cropping, real-browser video checks, domains/deploy facts, media placement, two-agent rules |
| `references/CHANGELOG.md` | A task touches an area with history; the "Lesson" lines are hard-won rules |
| `docs/TRAILER_SCRIPT.md` | Media questions (BRAIN's lane) |
