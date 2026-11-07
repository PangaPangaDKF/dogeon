# DOGEON — Project Memory for Claude Code

> Claude Code reads this file at the start of every session. Keep it accurate and short.
> When an architectural decision changes, update this file in the same commit.

## 0. Session protocol (always)
1. Load the project skill **`dogeon-game`** (`.claude/skills/dogeon-game/`) before planning or editing.
2. One task per session. Plan mode for anything touching more than one section.
3. After every verified change: append an entry to `docs/DECISIONS.md` (what, why, tool, alternatives),
   update this file / the skill if rules or architecture changed, then **commit** (Conventional Commits).
4. If the prompt in `prompts/SESSION_PROMPT.md` or the skill could have prevented a mistake this session,
   improve it in the same commit. Note it in `docs/DECISIONS.md` under "Process".
5. Test with the `terminal-testing` skill: `bash tests/check.sh` (Git Bash or Ubuntu/WSL) must pass.

**Project files:** `docs/DECISIONS.md` (history + open issues) · `prompts/SESSION_PROMPT.md` (session opener) ·
`tests/check.sh`, `tests/sim.mjs` · skills in `.claude/skills/` (own: `dogeon-game`, `terminal-testing`;
installed: `find-skills`, `caveman*`, `game-design-theory`, `pixel-art-sprites`, `balance-check`, `game-design-document`).

## 1. What this is
DOGEON ("The Cat Invasion") is a 16-bit top-down action RPG MVP in the style of the Sega Genesis
game *Crusader of Centy*. The hero is an original half-human Shiba Inu ("doge" look: orange fur,
cream face, cream eyebrow dots, red headband). Enemies are half-human cats. NPCs are Shiba people
with distinct outfits. Tone: tryhard (hard but fair), with doge-speak jokes ("such X, much Y, wow").

**Core loop:** leave the safe camp → fight cats → pick up whiskers → return to camp → trade
whiskers for FUD at the bank → buy upgrades → heal ONLY by resting in camp → push further
(field → brutes → ruins → Cat Lord boss).

## 2. Stack & constraints (do not change without asking)
- **One file: `index.html`.** Plain HTML + vanilla JavaScript + Canvas 2D. No framework, no build step,
  no npm, no external assets. Everything (sprites, tiles, font, sound) is generated in code.
  (Dev-only test tooling under `tests/` may use Node/Playwright; the game itself never does.)
- Internal resolution **320×224** (Genesis-like), scaled with CSS `image-rendering: pixelated`
  (integer scale when the window allows).
- Tiles are **16×16**. Characters are **16×20** sprites. The boss draws at 2×.
- Audio: tiny WebAudio beeps via `sfx()`. Created on first key press.
- Runs by opening `index.html` in a browser, or `npx serve .` / VS Code Live Server.
- Must also run when published as a sandboxed single page: **no network calls, no `alert/confirm/prompt`,
  no external images.** CDN scripts are allowed only if truly needed (prefer not).
- Phaser 3 was the original spec (see `docs/GDD.md` if present). The MVP deliberately uses vanilla
  Canvas for full pixel control and zero dependencies. Porting to Phaser is a separate, explicit task.

## 3. Code map (`index.html`, sections are marked `// ===== NAME =====`)
| Section | What lives there |
|---|---|
| CORE | Constants `W,H,TS,HUD_H`, canvas setup, `resize()`, seeded RNG `mulberry()`, helpers `mk() px() rect() flip() tinted()` |
| AUDIO | `sfx(freq, dur, type, vol, slide)` |
| INPUT | `keys` (held) and `pressed` (this frame only, cleared at end of `loop`). Helpers `kd()` held, `kp()` just pressed. Keys are lowercased `e.key` (`' '` = Space, `'arrowup'`, `'enter'`, `'escape'`) |
| PIXEL FONT 3x5 | `FONT` glyph table (5 rows × 3-bit numbers), `text()`, `textC()` centered, `wrap()`. Uppercase only |
| CHARACTER SPRITES | String templates `HEAD.dog/cat`, `TOP`, `LEGS`. `buildChar({head, pal, acc})` → `{down,up,right,left}[frame]` canvases. `SPR.hero/merchant/bank/sage/alley/archer/brute/boss`. Icons `SHADOW COIN WHISK YARN BONE` |
| TILES | Tile ids `T.*`, `SOLID` set, procedural tile painters, atlas `TL` |
| MAP | `MW=80, MH=60` tiles. `CAMP` (33..47, 27..41), fire at `CX=40, CY=34`. `DUN` ruins (26..54, 2..17), `GATE_ROW=9`. `genMap()` (seed 4242, deterministic). `tileCanvas()` picks the variant per tile |
| GAME STATE | Balance tables `SWORD_DMG SWORD_COST ARMOR_RED ARMOR_COST`, enemy stats `ETYPES`, globals, `NPCS`, `newGame()`, `makeEnemy()`, `spawnEnemy(zone)`, `summon()` |
| COLLISION | `solidFor(tx,ty,ent)`, `blocked(ent,x,y)` (AABB vs tiles + NPCs for player), `move(ent,dx,dy)` (sub-stepped, corner sliding for the player), `overlap()`, `playerInCamp()`, `zoneOf()` → `'field' / 'dun' / 'boss'` |
| FX | `puff()` particles, `floater()` damage text, `toast()`, `shake()` |
| COMBAT | `hurtPlayer()` (armor, i-frames, knockback, death), `respawn()` (death penalty), `attack()` sword arc, `bark()` "WOW" projectile, `damageEnemy()`, `killEnemy()` (drops + quest counters + boss victory), `shootBone()` |
| ENEMY AI | `updEnemy(e,dt)`: knockback → states `wander / chase / wind / dash`. Archer kites + shoots, brute winds up (flashes red) then dashes, boss shoots spreads and summons below 50% HP |
| UI | `ui` is `null`, `{type:'dialog'}` or `{type:'menu'}`. `openDialog(npc, pages, onEnd)`, `openMenu(npc, title, buildFn)`, `talk()`, `shopMenu()`, `bankMenu()`, `questTalk()`, `updateUI()` |
| UPDATE | `update(dt)`: title → UI (pauses world) → death timer → rest → movement → attack/bark/talk → enemies → projectiles → items → respawn timer → camera |
| RENDER | `drawTiles`, `drawChar` (shadow + sprite + tint), `drawFire`, `drawWorld` (y-sorted entities), `drawSlash`, `drawHUD`, `box`, `drawUI`, `logo`, `drawTitle`, `render` |
| LOOP | `genMap()`, `requestAnimationFrame` loop, `dt` clamped to 0–0.05 s |

### Entity conventions
- Position `(x, y)` = center of the collision box in pixels. Feet at `y + hh`.
- Sprites draw so their bottom row sits at the feet: `drawChar(spr, dir, frame, x, y+hh, scale, ox, oy, tint)`.
- `dir` is `'down' | 'up' | 'left' | 'right'`. Walk cycle: front/back `[0,1,0,2]`, side `[0,1,0,1]`.
- Enemies have `enemy:true` → camp tiles are solid for them (this is what makes the camp safe).
- Remove dead entities with a `.filter()` **after** a loop, never `splice` inside it.

### Sprite template letters (palette roles)
`O` outline · `F` fur · `C` cream/face · `P` inner ear · `E` eye · `N` nose · `R` cat eye ·
`W` whisker · `T` tunic · `A` tunic accent · `B` belt · `L` legs · `K` tail · `.` transparent.
New characters = new palette + `acc(g, dir, frame)` function that paints hats/weapons on top.

## 4. Game rules (design invariants — don't break these)
- **Healing only by resting:** hold R inside the camp (+10 HP/s, +8 MP/s). No potions, no regen.
- **Camp is fully safe:** enemies can't enter, can't damage you, projectiles stop at the fence.
- **Death:** lose 50% of carried FUD and all whiskers, wake at the fire. Vault FUD is safe.
- **Economy:** whisker = 3 FUD at Sir Hodl (bank). Barksley sells sword (Lv2 30, Lv3 80, Lv4 160),
  armor (40, 110), Bone Charm +15 max HP (50/80/110), Moon Biscuit +10 max MP (40/65).
  Max-stat items do **not** heal.
- **Quests (`state.stage`):** 0 talk to Elder → 1 slay 8 cats (+40 FUD) → 2 slay 3 brutes (+80 FUD,
  opens ruins gate) → 3 defeat the Cat Lord → 4 complete (Golden Yarn +150 FUD).
- **Enemy populations:** field 18, ruins lower hall 6, respawn one every 4 s out of view.
- **Controls:** WASD/arrows move, Space/J slash, K/Q "WOW" bark (10 MP), E talk, hold R rest, Esc close.

## 5. Coding rules for this project
- Keep everything in `index.html` until we decide to split (then: `src/*.js` as ES modules, no bundler).
- Small, surgical edits. Don't reformat or rename things you weren't asked to touch.
- New balance numbers go in the tables at the top of GAME STATE, not as magic numbers in logic.
- Pixel art: integer coordinates only (`Math.round`), no anti-aliased shapes, no `ctx.arc` for sprites.
  Use the existing palette style (dark outline, 2–3 shades per material, light from top-left).
- All visible text uses the pixel font (`text`/`textC`), uppercase, ≤ 75 chars per line.
- Never block the main loop. Guard `dt` (already clamped). Initialize arrays before first render.

## 6. How to verify a change (do this before saying "done")
1. `bash tests/check.sh` — syntax check of the game script + static rule checks (no alert/fetch/etc.).
2. Open `index.html` in a browser (or Live Server). Check the DevTools console: **zero errors**.
3. Title → Enter → walk out of camp → slash a cat → pick up a whisker → rest with R → trade at the bank.
4. For AI/boss changes, use the console to jump: `state.gateOpen=true; P.x=40*16+8; P.y=7*16+8`.
5. Optional real-browser check (not written yet, see DECISIONS D-004): a Playwright `tests/smoke.mjs` that loads
   the page, presses Enter, runs input, fails on any `pageerror`, saves `tests/out/smoke.png`.
6. Log the decision in `docs/DECISIONS.md` and commit with a Conventional Commit message.
