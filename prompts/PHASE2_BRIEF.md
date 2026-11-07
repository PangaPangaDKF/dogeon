# DOGEON — Phase 2 Brief: "Market of Much Wow"

Version 1.0 · 2026-11-07 · Built from the user's request + 12 concept images.
This is an *enhanced prompt*: role → context → goals → constraints → resolved ambiguities →
work plan (iterations) → acceptance criteria → definition of done. Paste it (or point to it with
`@prompts/PHASE2_BRIEF.md`) to drive any session that continues Phase 2.

---

## 1. Role
You are the lead engineer and pixel artist of DOGEON. You ship in small, verified, committed iterations,
and you loop (plan → build → test → log → commit → improve the prompt/skill) until every acceptance box below is ticked.

## 2. Context (read first)
- `CLAUDE.md`, the `dogeon-game` skill, the last 5 entries of `docs/DECISIONS.md`.
- The game is ONE file, `index.html`, vanilla JS + Canvas, 320×224, all art drawn in code.
- Concept images (from the user, not stored in the repo, described here so any session can use them):

| # | Image | Role in game | Key visual traits to keep at 16×20 px |
|---|---|---|---|
| 3, 4 | Shiba with a giant **barrel hammer** on the shoulder, brown open vest, cream chest, blue rolled pants, rope belt, sleepy half-closed eyes, curly tail | **HERO** (replaces the blue-tunic sword hero) | barrel hammer silhouette, vest + cream chest, blue pants, sleepy eyes |
| 1 (user called it "15") | Golden **sphinx doge** with blue/gold striped headdress and a blue gem | **THE BANK = Web3 DEX NPC** | lying pose, striped headdress, gold body (draw bigger: 32×24) |
| 1 | **Old doge**: grey muzzle, round glasses, beige cardigan, cane, key ring | **Elder**: talks market price + doge lore (+ keeps quests) | grey face, glasses, cardigan, cane |
| 1 | **Mechanic doge**: goggles, pencil, blue overalls, tool belt, wrench, blueprint | **Crafter**: burns materials to create gear | goggles, overalls, wrench |
| 2 | **Frog mage**: teal skin, yellow spots, lily-pad hat, green cloak, staff with purple orb | enemy: ranged caster | lily hat, cloak, purple orb |
| 5, 6 | **Ninja shiba**: dark orange fur, black gi, red scarf + belt, twin daggers, angry eyes, fangs | enemy: fast dasher | black gi, red scarf, daggers |
| 7, 8, 9 | **Green Candle Bull**: black muscle hide, green→orange horns, red eyes, spiked collar, green loincloth, iron bracers | enemy: heavy charger | horns gradient, red eyes, collar |
| 10, 11 | **Blue-tunic shiba knight**: red headband, blue tunic with crown, sword, boots | enemy: rogue knight (melee lunge) | blue tunic, crown, sword |
| 12 (user called it "16") | Stone-slab plaza, wooden fence with double doors on 4 sides, 4 corner tents, round stone pads, gold crystals, giant golden coin mosaic with a shiba face, fire brazier | **SAFE CAMP layout** | plaza tiles, doors, coin mosaic, crystals, brazier |

## 3. Goals (user's words, organized)
- **G1 Art:** hero = hammer shiba; NPCs = sphinx, old doge, mechanic; enemies = frog, ninja, bull, knight (cats stay too); camp = image 12.
- **G2 Web3 UI (simulated):** the sphinx opens DEX menus: **swap** (loot ↔ DOGE, DOGE → items), **create/add/remove liquidity pool**,
  stake (safe vault), wallet panel. References DogeOS (EVM-compatible app layer for Dogecoin, Chikyū testnet, native DOGE).
  *UI only*: no network calls, no real wallet, clearly labelled SIMULATED.
- **G3 Elder:** talks about the current market price and tells doge lore (rotating stories); still advances quests.
- **G4 Crafter:** "burn" materials to create gear (UI menu, works in-game).
- **G5 Market:** DOGE price moves randomly. **Falling** → enemies stronger, map darker + red tint. **Rising** → player stronger.
- **G6 Healing:** pressing R no longer heals instantly; you must stay still a few seconds before recovery starts.
- **G7 Death:** you respawn with reduced HP and MP.
- **G8 Process:** install a Solidity skill and a Rust skill; commit every iteration; log every decision; improve prompt + skill.

## 4. Constraints (non-negotiable)
- One file, zero deps, no `fetch`/network, no `alert/confirm/prompt`, no external images. Concept art is **redrawn** as code pixel art.
- Original art only: the coin mosaic uses our own shiba face, **not** the Dogecoin "Ð" logo. No real wallet addresses, no real chain calls.
- Camp stays fully safe (fix I-1 first). Healing still only in camp. New numbers live in balance tables (`MARKET`, `REST`, `ECON`, `RECIPES`, `ETYPES`).
- Every text line ≤ 75 chars, uppercase pixel font. Tests must pass on Git Bash and Ubuntu/WSL.

## 5. Resolved ambiguities (decisions taken so we don't stall — user may override)
1. Image numbering: user said "15" and "16" but sent 12 images → NPC sheet = image 1, camp = image 12.
2. "BACK" = bank. The sphinx **replaces Sir Hodl** (vault) and **Barksley** (shop): items are bought with DOGE at the DEX.
3. Currency **FUD → DOGE**. Prices are anchored in USD; at the start price $0.25 the old economy is identical (1 whisker = 3 DOGE).
   Rising price → items cost fewer DOGE, loot swaps for fewer DOGE. "Sell loot in dumps, buy gear in pumps."
4. Liquidity pool = constant-product AMM DOGE/WHISK simulated locally, arbitraged to the market every second, earns fees,
   **safe on death** (like the old vault) but suffers impermanent loss. Stake = plain safe vault with a tiny yield.
5. Old doge = the Elder (quest giver keeps working) + market report + lore. Mechanic = forge: hammer upgrades and special gear.
6. Hero weapon is a hammer: the "sword" upgrade track becomes "HAMMER" in all UI text (internal variable names kept to keep diffs small).
7. New enemies drop materials: frog → ORB, ninja → SCRAP, bull → HORN, knight → STEEL; cats still drop WHISKERS.
   Death loses 50% carried DOGE and all whiskers + materials.
8. Market effect = *sentiment* (price vs. its 45 s moving average) in −1…+1. Bear: enemy dmg up to +50%, speed +15%, screen dark-red overlay.
   Bull: player dmg up to +50%, speed +10%, light gold HUD glow.
9. Rest: hold R still for 3 s ("CATCHING BREATH" bar) before +10 HP/s, +8 MP/s. Moving or releasing resets it.
10. Respawn at 35% HP and 35% MP.

## 6. Work plan (one commit each, tests green after every step)
- **IT-0** brief + Solidity/Rust skills.
- **IT-1** fix I-1 (bone hits in camp) and I-2 (particle leak); promote both WARNs to FAIL.
- **IT-2** core systems: market sim + sentiment effects + overlay, rest delay, reduced respawn, DOGE currency.
- **IT-3** new camp (image 12): plaza, doors, tents, crystals, brazier, coin mosaic, NPC pads.
- **IT-4** sprites: hammer hero (+ hammer swing), sphinx, old doge, mechanic.
- **IT-5** enemies: frog, ninja, bull, knight sprites + AI + material drops + spawns.
- **IT-6** sphinx DEX UI (wallet, swap, pool, stake, price chart) + Elder market/lore + mechanic forge.
- **IT-7** tests for every new rule, docs (CLAUDE.md, skill, DECISIONS), prompt v1.2.

## 7. Acceptance criteria
- [ ] Hero, 3 NPCs and 4 new enemy types are visible, readable, animated in 4 directions.
- [ ] Camp matches image 12's layout; enemies still can't enter; bones can't hit you inside.
- [ ] HUD shows DOGE price with up/down colour; bear market visibly darkens/reddens the map; multipliers apply.
- [ ] Sphinx: wallet panel, swap loot→DOGE, buy items with DOGE, create/add/remove LP, stake/unstake, price chart.
- [ ] Mechanic: recipes burn materials, show what is missing, grant gear.
- [ ] Elder reports price + trend and tells rotating lore; quests 0→4 still completable.
- [ ] R needs 3 s of stillness before healing; death respawns at 35% HP/MP.
- [ ] `bash tests/check.sh` → ALL CHECKS PASSED, with new scenarios for market, rest, respawn, LP, forge, new enemies.

## 8. Definition of done (per iteration)
Tests green → `docs/DECISIONS.md` entry → Conventional Commit → one improvement to this brief, the session prompt or the skill
if the iteration taught something → short report (files, what changed, how to test by hand).
