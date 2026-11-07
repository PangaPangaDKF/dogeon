# DOGEON — Master Prompt & Workflow for Claude Code (VS Code)

This file has three parts:
- **A.** One-time setup.
- **B.** The kickoff prompt to paste into your first Claude Code session.
- **C.** Prompt templates and LLM best practices for every iteration after that.

> The living, improved version of the per-session prompt is `prompts/SESSION_PROMPT.md`.
> This file is the original reference; improvements go there first.

---

## A. One-time setup (5 minutes)

1. Create a folder, for example `dogeon/`, and put these files in it:
   - `index.html`: the game.
   - `CLAUDE.md`: project memory. Claude Code reads it automatically every session.
   - `MASTER_PROMPT.md`: this file.
   - Optional: `docs/GDD.md`, your original design doc.
2. Open the folder in VS Code. Install the **Claude Code** extension, published by Anthropic, from the Extensions view (Ctrl/Cmd+Shift+X). Make sure the workspace is **trusted**, because the extension doesn't run in Restricted Mode.
3. Start version control. It's your real safety net:
   ```bash
   git init && git add . && git commit -m "DOGEON MVP baseline"
   ```
4. Install the **Live Server** extension, or run `npx serve .`, so the game reloads when you save. Opening `index.html` directly in a browser also works.
5. Open Claude Code from the Spark icon in the editor toolbar or the activity bar.

**Useful extension features**
- **Plan mode:** cycle modes with Shift+Tab. Claude reads the code and writes a plan for you to approve before it edits anything. Use it for every feature that touches more than one section.
- **@-mentions:** `@index.html` gives Claude the whole file. `@index.html#313-345` points it at a line range (for example, the enemy AI). Alt+K (Option+K on Mac) inserts your current selection.
- **Diff review:** every edit opens a side-by-side diff. Read it before accepting.
- **Checkpoints:** hover over a message to rewind the code or the conversation if Claude went the wrong way. Git still covers anything destructive.
- **Problems panel:** Claude can read the VS Code diagnostics directly, so you don't need to paste lint errors.

---

## B. Kickoff prompt (paste this as your first message)

```
You are the lead engineer on DOGEON, a 16-bit top-down action RPG MVP in a single file, index.html.
Read @CLAUDE.md first; it is the source of truth for stack, architecture, design rules and how to verify.
Then read @index.html completely.

Context:
- Style target: Sega Genesis "Crusader of Centy" (320x224, 16x16 tiles, chunky outlined pixel art, blue dialog boxes).
- Hero: original half-human Shiba Inu with the "doge" look. Enemies: half-human cats. NPCs: Shiba people with distinct outfits.
- Tryhard design: healing ONLY by resting in camp, death costs 50% carried FUD + all whiskers, the bank vault protects FUD.
- Tech: vanilla JS + Canvas 2D, zero dependencies, zero external assets, no build step. Keep it that way unless I say otherwise.

Your first task is NOT to write code. Do this:
1. Summarize the architecture back to me in 10-15 bullet points (sections, main data structures, update/render flow).
2. List any bugs, edge cases or fragile spots you notice, ranked by severity, with line numbers.
3. Propose a prioritized roadmap of the next 8 iterations. Each one must be small enough to finish and verify in one session.
   Use my wishlist below as input, but push back if something conflicts with the design rules.
4. Ask me up to 3 questions if anything is ambiguous.

Wishlist:
- Touch/mobile controls (virtual D-pad + A/B buttons)
- Chiptune music loop + better SFX
- Save/load to localStorage (with try/catch)
- More dungeon rooms with keys/doors like Crusader of Centy
- A 2nd boss and new cat types (mage cat, shield cat)
- Hero animations: dedicated attack frame, hurt frame, rest/sit pose
- Pause menu with stats and controls
- Split the file into ES modules once it passes ~1500 lines

Rules for every change from now on:
- Use plan mode for anything touching more than one section; wait for my approval.
- Make surgical edits; don't reformat or rename untouched code.
- After each change, tell me exactly how to test it in the browser (keys to press, console shortcuts).
- Keep CLAUDE.md up to date when architecture or rules change.
- Suggest a git commit message at the end of each task.
```

---

## C. Iteration templates

### C1. New feature (use plan mode)
```
Feature: <one sentence>.
Why (player experience): <what it should feel like>.
Acceptance criteria:
- <observable behavior 1>
- <observable behavior 2>
- No console errors; existing loop (fight → whiskers → bank → shop → rest) still works.
Constraints: follow @CLAUDE.md. Touch only the sections you need. Put new numbers in the balance tables.
Plan first: list the functions you'll add or change and why. Wait for my OK.
```

### C2. Bug fix
```
Bug: <what happens>.
Steps to reproduce: <keys / console commands>.
Expected: <what should happen>.
Console output: <paste the error, or @terminal:name>.
Find the root cause first and explain it in 2-3 sentences, then propose the smallest fix. Don't refactor unrelated code.
```

### C3. Pixel art / new sprite
```
Create a new character sprite using the existing system in @index.html (CHARACTER SPRITES section):
- Base: <dog|cat> head template, palette roles O F C P E N R W T A B L K.
- Palette: <colors or vibe, e.g. "dark purple robe, silver fur, glowing cyan eyes">.
- Accessory function acc(g,dir,frame): <hat / weapon / cape details per direction>.
- Must read clearly at 16x20 with a dark outline, light from top-left, max 3 shades per material.
Also add it to the title screen lineup so I can see it at 3x.
```

### C4. Balance pass
```
Act as a game designer focused on "hard but fair". Read the balance tables and ETYPES in @index.html.
Simulate (in your head or with a quick script) how long it takes a new player to: clear quest 1, afford Sword Lv2, beat the boss.
Target: quest 1 in ~5 min, boss after ~20-25 min, death feels punishing but recoverable.
Propose number changes as a table (old → new → reason). Don't edit until I approve.
```

### C5. Refactor or split into modules (only when asked)
```
Split @index.html into ES modules without changing behavior:
src/core.js, input.js, font.js, sprites.js, tiles.js, map.js, state.js, collision.js, combat.js, ai.js, ui.js, render.js, main.js.
No bundler: index.html loads <script type="module" src="src/main.js">.
Keep a mutable shared game object instead of scattered globals. After the split, the game must play identically.
Update the code map in CLAUDE.md.
```

### C6. Self-review before you commit
```
Review the diff of this session as a strict senior game dev:
correctness, frame-rate independence (everything scaled by dt), collision edge cases, memory leaks (arrays that only grow),
input edge cases (keys held through dialogs, focus loss), and adherence to @CLAUDE.md.
List findings by severity. Fix only the critical ones, then give me a commit message.
```

---

## D. Best practices that matter most with an LLM agent

1. **One task per session.** When a task is done, commit and start a fresh conversation. Long chats drift and fill up context. `CLAUDE.md` carries the memory between sessions, so keep it current.
2. **Plan, then build.** Plan mode for multi-section work. Read the plan and correct it before any code is written. Fixing a plan is much cheaper than fixing code.
3. **Give acceptance criteria, not vibes.** "Brute flashes red for 0.55 s, then dashes at 165 px/s; a slash during the wind-up cancels it" beats "make brutes better".
4. **Point at code precisely.** Use `@index.html#start-end` and section names from the code map. Less context means better, cheaper answers.
5. **Make it verifiable.** Always ask "how do I test this?" Use the console shortcuts in `CLAUDE.md` to jump straight to the case. If Playwright is installed, ask Claude to write a smoke test that loads the page, presses keys, and fails on any console error.
6. **Small diffs, frequent commits.** If a diff is bigger than you can read in 2 minutes, ask Claude to split the work.
7. **Lock design decisions in writing.** When you decide something ("no potions ever", "boss stays in its room"), add it to section 4 of `CLAUDE.md` so future sessions don't undo it.
8. **Use rewind and git without guilt.** If a direction feels wrong, rewind to a checkpoint or `git checkout .` and re-prompt with what you learned. Don't stack fixes on top of a bad base.
9. **Ask for options when it's taste.** For art or feel, ask for 2–3 variants (for example, 3 palettes for the mage cat on the title screen), pick one, then iterate.
10. **Stay original with the art.** Keep the hero an original doge-style Shiba, and don't import ripped Crusader of Centy sprites or the Dogecoin logo, especially if you plan to publish.

---

## E. Suggested next 8 iterations (in order)
1. Pause menu (Esc): stats, controls, resume. *Small, a good first warm-up task.*
2. Save/load to localStorage (stage, FUD, vault, upgrades, gate), behind try/catch.
3. Hero polish: attack frame, hurt frame, sit-and-rest pose, footstep dust.
4. Chiptune loop: WebAudio sequencer with 2 tracks (field, ruins/boss) and a mute key (M).
5. Touch controls: on-screen D-pad plus A (slash), B (bark), E (talk), R (rest).
6. Ruins expansion: 3 rooms, a key item, a locked door, and a small puzzle (switch tiles).
7. New enemies: Mage Cat (teleports, homing yarn ball) and Shield Cat (blocks frontal hits; attack from behind).
8. Second region + second boss, and split into ES modules before it grows further.

---

## F. Phase 3 templates (web3 + survival)

### C7. Web3 feature (wallet / chain)
```
Feature: <one sentence>. Chain: DogeOS Chikyu testnet (CHAIN in index.html, chainId 0x5fdaf3).
Rules: talk to the wallet only through window.ethereum (EIP-1193) in the CHAIN section; no fetch/XHR/WebSocket in the game;
nothing touches the network until the player presses CONNECT; every on-chain row has an offline fallback;
async results land via setWalletMsg(); handle 4001 (rejected), -32002 (pending), 4902 (unknown chain).
Test: add a mockEth() scenario in tests/sim.mjs (connect, reject, no wallet) before claiming done.
```

### C8. Solidity contract (contracts/, Foundry)
```
Contract: <name + one sentence>. Write it in contracts/src, tests in contracts/test (forge test must pass).
Rules: Solidity ^0.8.24, no external imports unless vendored, checks-effects-interactions, pull payments or
call{value} with success checks, events for every state change, custom errors, no owner backdoor on user funds.
Deploying needs the user's funded key: never ask for or store a private key; leave a script + README steps instead.
```

## G. Feature ledger (every shipped feature, its code, and where it is logged)
Update this table in the same commit as each feature (user RULE #1).

| Iter | Feature | Key code (index.html unless noted) | Log |
|---|---|---|---|
| P3 IT-1 | Rest cap 60%, 12-slot bag (I/Tab), skill-by-use | `REST_CAP`, `BAG_SIZE`, `FOODS`, `addToBag/bagCount/bagRemove`, `invMenu()`, `P.skills`, `P.iT` (was `P.inv`) | D-014 |
| P3 IT-2 | Fishing at 5 ponds, per-skill tiers, field pop 22 / spawn 3 s | `PONDS_EXTRA`, `SKILL_THRESH{combat,fishing,bark}`, `skillLv/skillMul(xp,kind)`, `FISH_MIN/MAX`, `waterAt/findWater/startFish/stopFish/updFish`, `drawFishing()`, `FIELD_POP/DUN_POP/SPAWN_EVERY` | D-015 |
| P3 IT-3 | Real wallet connect + DogeOS Chikyu add/switch, balance, disconnect, offline fallback | CHAIN section: `CHAIN`, `wallet`, `eth()`, `connectWallet()`, `switchChain()`, `refreshBal()`, `hookWallet()`, `disconnectWallet()`, `walletRows()`, `setWalletMsg()`; Sphinx row 0; `tests/serve.mjs` (localhost) | D-016 |
