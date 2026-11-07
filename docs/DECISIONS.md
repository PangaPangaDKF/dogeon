# DOGEON — Decision Log & History

Why things are the way they are. **Newest first.** One entry per meaningful change or decision.
Every entry answers: *what* changed, *why*, *which tool/skill/model* did it, and *what we rejected*.

## Template
```
### D-NNN · YYYY-MM-DD · <short title>
- What: <files / behavior>
- Why: <player or dev reason>
- Tool: <Claude Code model, skills used, commands>
- Alternatives rejected: <option — reason>
- Verify: <test output line / manual steps>
- Commit: <hash or "this commit">
```

---

## Open issues (found in the first review, D-006)
Severity: 🔴 breaks a design invariant · 🟠 real bug · 🟡 minor / edge case. "Proven" = reproduced by a test.

| # | Sev | Issue | Where | Proof |
|---|---|---|---|---|
| ~~I-1~~ | ✅ | **Fixed in D-007.** An in-flight bone can hit the player standing just inside the camp gap. Its tile check uses the bone's tile, but its hitbox is 8 px wide, and `hurtPlayer` has no camp guard. | `index.html:435`, `hurtPlayer` | Proven: sim WARN "camp gap bone" |
| ~~I-2~~ | ✅ | **Fixed in D-007.** `parts[]` grows without limit while a dialog/menu is open. `drawFire()` (render) keeps pushing particles but `update()` returns before `updateParts()`. Embers also freeze mid-air. | `:405`, `:472` | Proven: sim WARN "particles during UI" (+535 in 30 s) |
| I-3 | 🟡 | Boss-summoned alleys (`zone:'boss'`) aggro anywhere on the map with no chase range, and they're never culled except on death/respawn. | `:320` | Code reading |
| I-4 | 🟡 | Spawns need ≥170 px from the player, but the view half-diagonal is ~195 px, so cats can pop in at screen corners. | `:233` | Geometry |
| I-5 | 🟡 | On the title screen, `updateParts(1/60)` runs inside render, and the fire spawns particles per render frame. On 120/144 Hz screens both run faster/denser. | `:550`, `:472` | Code reading |
| I-6 | 🟡 | Esc on the Elder's dialog runs `onEnd`, so skipping still accepts the quest / grants the reward. Might be intended. Ask. | `:385` | Code reading |
| I-7 | 🟡 | Input uses `e.key`, so non-QWERTY layouts (AZERTY) get unusable WASD. `e.code` is layout-independent. | `:41` | Code reading |
| I-8 | 🟡 | `AudioContext` is created inside the rAF loop, not in the key handler. Safari/iOS may keep it suspended (no sound). | `:37` | Code reading |
| I-9 | ⚪ | `solidFor` checks `ent.boss&&ty>=GATE_ROW` twice (dead code). | `:245` | Code reading |

When an issue is fixed: strike it here, link the D-entry, and promote its sim WARN to a FAIL.

---

### D-012 · 2026-11-07 · IT-6: Sphinx DEX, Elder lore, Mechanic forge + DOGE everywhere
- What:
  - **Sphinx DEX** (replaces old bank): WALLET panel (simulated, shows fake address + DogeOS Chikyū testnet), SWAP whiskers→DOGE, BUY items (Bone Charm/Moon Biscuit) with DOGE, ADD TO POOL / REMOVE FROM POOL with 1% yield. Pooled DOGE safe on death.
  - **Elder**: now opens with market price report + rotating doge lore (8 stories) before quest dialog. Lore rotates every 20 s.
  - **Mechanic forge** (replaces old shop): 7 RECIPES that burn materials (ORB/SCRAP/HORN/STEEL) to craft hammer upgrades, armor, charms, biscuits. Shows inventory count. Missing-materials message.
  - NPC intro dialogs rewritten to match new roles.
  - Death dialog mentions lost materials + pool advice.
  - Title: "POWERED BY DOGE" added to subtitle.
- Why: User's G2 (web3 UI simulated), G3 (Elder market/lore), G4 (crafter). All UI only, no network calls.
- Tool: Claude Code (Opus 4.6). Test fix: bank menu now has wallet at index 0, so the sim navigates to index 1 for the swap test.
- Alternatives rejected: Real AMM math for the pool (cut by scope rule). Price chart visualization (not requested in MVP).
- Verify: `0 failed, 0 warnings (seed 4242)`.

### D-011 · 2026-11-07 · IT-5: frog, ninja, bull, knight enemies + material drops
- What:
  - 4 new enemy sprites: frog mage (teal, lily hat, purple orb staff), ninja shiba (black gi, red scarf, daggers), green candle bull (dark hide, green→orange horns, spiked collar), blue-tunic knight (red headband, sword, crown emblem).
  - 4 new ETYPEs: frog (ranged/archer AI, drops ORB), ninja (fast melee, drops SCRAP), bull (charger/brute AI, drops HORN), knight (tough melee, drops STEEL). Each uses `ai` field to reuse existing AI behaviours.
  - Material item icons (ORB_IC, SCRAP_IC, HORN_IC, STEEL_IC) + pickup logic + render.
  - Player tracks `P.orb, P.scrap, P.horn, P.steel`. Death zeroes all materials.
  - Spawn mix updated: field and dungeon both spawn all 6 enemy types with varied probabilities. Bulls and brutes are rarer.
  - Title screen shows all new enemies.
- Why: User's concept images 2, 5-6, 7-9, 10-11. Reusing AI keeps it MVP.
- Tool: Claude Code (Opus 4.6). `ai` field on ETYPES lets new types share archer/brute logic without new AI states.
- Alternatives rejected: Custom AI per enemy (scope creep). Separate spawn tables per zone (unnecessary complexity).
- Verify: `0 failed, 0 warnings (seed 4242)`.

### D-010 · 2026-11-07 · Sprites IT-4: hammer hero, sphinx, elder, mechanic + hammer swing
- What:
  - Hero redesigned: brown open vest (T), cream chest (A), blue pants (L), rope belt (B), sleepy half-closed eyes (acc overpaints top eye pixels with fur), barrel hammer on shoulder (acc draws handle+barrel per direction).
  - Sphinx (bank): golden body, blue/gold alternating striped headdress (nemes) flowing down sides, blue gem on forehead.
  - Elder (sage): grey fur, round glasses with cyan lens, beige cardigan, white beard, walking cane.
  - Mechanic (merchant): brown fur, blue overalls (T+L same), cyan-tinted goggles on forehead, wrench in hand.
  - `drawSlash` → hammer swing: wooden handle, barrel head at tip, muted swing trail.
  - NPC names updated: "WRENCHPAW THE MECHANIC", "THE GREAT SPHINX OF DOGE", menu titles to match.
- Why: User's concept images 3/4 (hero), image 1 (NPCs). Sphinx replaces Sir Hodl as the DEX. Mechanic replaces Barksley as the forge.
- Tool: Claude Code (Opus 4.6). Palette + acc function changes only, reusing the same buildChar template.
- Alternatives rejected: Custom HEAD templates per NPC (too much code for MVP — acc overlays work fine). Animated hammer idle (not requested).
- Verify: `0 failed, 0 warnings (seed 4242)`.

### D-009 · 2026-11-07 · Camp redesign (image 12): plaza, doors, crystals, coin mosaic, NPC pads, Ð coin icon
- What:
  - New tile types: DOOR, CRYSTAL, PAD. Plaza slab tile with grid lines. Gold crystal tile, round stone pad, wooden door leaf.
  - Camp layout: 4 corner tents, double doors on each fence side, gold crystals at 4 symmetric spots, 3 round pads (N/W/E).
  - MOSAIC: 96×96 pre-rendered canvas with gold ring, gridded interior, and the dog head template at 4×. Drawn behind the brazier fire.
  - NPCs repositioned onto PADS: sphinx (bank) → N pad, elder (sage) → W pad, merchant → E pad.
  - HUD coin icon redrawn as a Ð (Dogecoin symbol).
- Why: User's image 12 defines the camp layout; Ð coin references are wanted everywhere (v1.2 scope).
- Tool: Claude Code (Opus 4.6). No new test scenarios needed — existing camp safety and economy tests cover the layout.
- Alternatives rejected: Animated mosaic sparkle (too flashy for MVP). NPCs staying at old hard-coded positions (pads are the reference layout).
- Verify: `0 failed, 0 warnings (seed 4242)`.

### D-008 · 2026-11-07 · Phase 2 core: DOGE market, rest delay, weaker respawn, FUD → DOGE
- What:
  - `MARKET` table plus `updMarket()`, a random walk that ticks once per second with mild pull back to $0.25. Sentiment is price vs. its 30 s average, clamped to −1…+1.
  - Falling price: enemy damage up to +50% (applied in `hurtPlayer`), enemy speed up to +15%, and a dark-red screen overlay. Rising price: player hammer/bark damage up to +50%, speed up to +10%.
  - The HUD shows `DOGE $price` and `±% BULL/BEAR/FLAT` in place of SWORD/VAULT.
  - Rest: holding R in camp waits `REST_DELAY`=3 s ("CATCHING BREATH… 3,2,1") before healing.
  - Respawn: 35% HP/MP (`RESPAWN_FRAC`).
  - The currency is renamed FUD → DOGE (variable `P.doge`).
- Why: The user's Phase 2 request, G5–G7 in `prompts/PHASE2_BRIEF.md`.
- Tool: Claude Code (Opus 5.5). 3 new sim scenarios: rest delay, respawn, market bounds plus bear damage 10→15.
- Alternatives rejected:
  - Trend events, regime pop-ups, a price chart, and an AMM pool with impermanent loss. Cut after the user asked for MVP scope ("no effects or extra development").
  - A gold overlay for bull markets: not requested.
- Verify: `0 failed, 0 warnings`.
- Process: The user's mid-task note became the **MVP scope rule** in the brief (v1.1) and in memory.

### D-007 · 2026-11-07 · Fix I-1 (bone hits inside camp) and I-2 (particle leak during UI)
- What: Bone collision skips the player when `playerInCamp()`. `hurtPlayer()` also returns early in camp, so no future damage source can break the sanctuary. `update()` keeps calling `updateParts(dt)` while a dialog or menu is open.
- Why: Phase 2 (IT-1) must start from a safe camp. The sanctuary is a design pillar.
- Tool: Claude Code (Opus 5.5), `tests/sim.mjs`. Both WARNs are promoted to `fail()`.
- Alternatives rejected: Shrinking the bone hitbox. That only fixes this one projectile. The `hurtPlayer` guard fixes the whole class of bugs.
- Verify: `0 failed, 0 warnings (seed 4242)`.

### D-006 · 2026-11-07 · First architecture review (kickoff prompt §B)
- What: Reviewed `index.html` end to end. Logged issues I-1…I-9 above. Proved I-1 and I-2 with simulation scenarios.
- Why: The kickoff asks for a ranked bug list before any feature work.
- Tool: Claude Code (Opus 5.5), `dogeon-game` skill, `tests/sim.mjs`.
- Alternatives rejected: Fixing bugs during the review. Rejected because the kickoff says no code changes in the first task, and each fix gets its own commit.
- Verify: `bash tests/check.sh` → `0 failed, 2 warnings`.

### D-005 · 2026-11-07 · False positive caught: "armor label shows 45.00000000000001%"
- What: I suspected `ARMOR_RED[2]*100` prints float noise in the shop. `node -e "console.log(0.45*100)"` prints `45`. Not a bug. The sim check became a hard FAIL guard for labels >50 chars or long decimals.
- Why: LLMs report confident false positives. Lesson: **prove a bug before reporting it.**
- Tool: Node one-liner.
- Process change: Added "prove bugs before reporting" to `prompts/SESSION_PROMPT.md` v1.1 and the skill's protocol.

### D-004 · 2026-11-07 · Test strategy: headless `vm` simulation instead of Playwright first
- What: `tests/check.sh` (grep rules + `node --check` + sim) and `tests/sim.mjs` (real game code in a Node `vm` sandbox with a Proxy fake canvas, seeded `Math.random`, invariants checked every frame).
- Why: Zero dependencies, matching the project rule. Runs in about 1 s on Git Bash and Ubuntu/WSL. Simulates minutes of play. Catches logic and invariant bugs that screenshots miss.
- Tool: Node 24 (Windows) / Node 20 (Ubuntu 24.04 WSL).
- Alternatives rejected: Playwright as the main test. It downloads ~300 MB of browsers, and visual checks are slower and flakier. Kept as an optional future `tests/smoke.mjs` for real-browser console errors. Jest/Vitest: needs npm deps and a module split first.
- Verify: Both environments print `ALL CHECKS PASSED`.

### D-003 · 2026-11-07 · Skills installed (project scope, `.claude/skills/`)
- What:
  - `find-skills` (vercel-labs/skills): discover more skills on demand.
  - `caveman` + 21 companion skills (JuliusBrussee/caveman), **skill-only install**.
  - Game design: `game-design-theory` (pluginagentmarketplace, 2.6K installs), `pixel-art-sprites` (omer-metin, 3K), `balance-check` (donchitos/claude-code-game-studios), `game-design-document` (ityes22, 1.1K).
  - Own skills: `dogeon-game` (game context + protocol), `terminal-testing` (teaching).
- Why: The user asked for caveman, find-skills and game-design skills. Project scope means they're versioned with the repo and don't touch other projects.
- Tool: `npx skills add … -a claude-code -y`. All passed Gen/Socket/Snyk scans ("Safe"; `caveman-review` flagged Snyk "Med", two had 1 Socket alert). Reviewed: no install hooks. Python/Node scripts only run when a skill is invoked. `caveman-setup` references a gateway proxy via curl and is **not** to be run without asking.
- Alternatives rejected: Caveman *plugin* or full CLI. These add a startup hook, a proxy and telemetry by default. Too invasive for a teaching project. Re-evaluate if token cost becomes a problem.
  Skipping already-global skills (`rpg`, `game-feel`, `design-action-combat`, `tune-enemy-ai`, `level-design`, `test-playable-web-games`, …). They're available anyway, so we route to them from the `dogeon-game` skill instead of duplicating.

### D-002 · 2026-11-07 · Process files
- What: `prompts/SESSION_PROMPT.md` (living best-practice opener with changelog), this log, `CLAUDE.md` §0 session protocol, `.gitattributes` (LF for `*.sh`/`*.mjs` so Ubuntu can run them).
- Why: The user wants every change committed, a self-improving prompt and skill, and a history of why each change was made.
- Tool: Claude Code (Opus 5.5).

### D-001 · 2026-11-07 · Project bootstrap
- What: Created `C:\Users\dulbi\dogeon\` with `index.html`, `CLAUDE.md`, `MASTER_PROMPT.md` (from the previous chat), `git init -b main`, baseline commit of `index.html` exactly as delivered.
- Why: Git is the safety net. The baseline commit makes every later diff reviewable.
- Note: `CLAUDE.md` got a §0 "session protocol" plus test commands on top of the delivered text. `MASTER_PROMPT.md` points to the living prompt. Both changes are in D-002's commit.

## Process (improvements to the prompt / skills themselves)
- 2026-11-07 · SESSION_PROMPT v1.1: "prove bugs before reporting" (from D-005), WARN→FAIL promotion rule.
- 2026-11-07 · dogeon-game skill v1.1: added skill routing table and the 8-step protocol.
