# DOGEON — Project Memory for Claude Code

> Claude Code reads this file at the start of every session. Keep it accurate and short.
> When an architectural decision changes, update this file in the same commit.

## 0. Session protocol (always)
0. **RULE #0 (Pre-Decision Gate — NEVER SKIP):** Before taking ANY decision or editing ANY file, follow the **Analyzer Prompt Master** (`prompts/ANALYZER_PROMPT_MASTER.md`): Explore (`@file#lines`, visual evidence, parallel subagents for multi-lens audits) → Verify Baseline (`bash tests/check.sh`, reproduce bugs with a failing test first) → Plan & Invariant Gate (game invariants, Solidity CEI/solvency, offline fallback, name collisions, seeded RNG).
1. Load the project skill **`dogeon-game`** (`.claude/skills/dogeon-game/`) before planning or editing.
2. One task per session. Plan mode for anything touching more than one section.
3. After every verified change: append an entry to `docs/DECISIONS.md` (what, why, tool, alternatives),
   update this file / the skill if rules or architecture changed, then **commit** (Conventional Commits).
4. If the prompt in `prompts/SESSION_PROMPT.md` or the skill could have prevented a mistake this session,
   improve it in the same commit. Note it in `docs/DECISIONS.md` under "Process".
5. Test with the `terminal-testing` skill: `bash tests/check.sh` (Git Bash or Ubuntu/WSL) must pass (stage 4 = `forge test` on `contracts/`).

**Project files:** `AGENTS.md` (workspace rules) · `prompts/ANALYZER_PROMPT_MASTER.md` (pre-decision master prompt) · `docs/DECISIONS.md` (history + open issues) · `docs/LESSONS.md` (dual-brain error→rule ledger) · `prompts/TRYNOAH_RECREATE.md` + `docs/RECREATION_MANIFEST.md` + `scripts/` (reproducibility & release) · `contracts/` (Foundry: DogeItems ERC-721 + DogeDEX + DogeProfession + DogeStaking, see its README) · `prompts/SESSION_PROMPT.md` (session opener) ·
`tests/check.sh`, `tests/sim.mjs` · skills in `.claude/skills/` and `.agents/skills/` (own: `dogeon-game`, `terminal-testing`;
installed: `find-skills`, `agent-browser`, `avalanche-skills`, `avax-*`, `solidity-security`, `caveman*`, `game-design-theory`, `pixel-art-sprites`, `balance-check`, `game-design-document`).

## 1. What this is
DOGEON ("The Grand Heist", Phase 4) is a 16-bit top-down action RPG set in the DogeOS Grand Heist lore, with a DeFi + educational purpose. MVP in the style of the Sega Genesis
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
- Must also run when published as a sandboxed single page: **no network calls from game code, no `alert/confirm/prompt`,
  no external images.** CDN scripts are allowed only if truly needed (prefer not — Phase 3 ships without ethers.js).
- **Phase 3 web3 exception (D-016):** the game may talk to the player's wallet through `window.ethereum` (EIP-1193) in the
  CHAIN section, and only after the player presses CONNECT. The wallet does all network traffic. No wallet = fully playable.
  MetaMask does not inject into `file://` → run `node tests/serve.mjs` and open http://localhost:8080.
- **Multiplayer exception (D-040):** the browser's native `WebSocket` may be used **only** inside the `MULTIPLAYER` section, and
  **only** when the URL has `?mp=ws(s)://host` (opt-in; off by default). Without `?mp` the game makes zero network calls.
  Scope is "the option": other players appear as ghosts (class sprite, facing, walk, HP, name). Shared enemies/loot are NOT
  built (would need an authoritative server, e.g. Colyseus). Self-host: `node server/relay.mjs` (zero deps, serves the game +
  relay). Peer data is untrusted → validate ids/coords, sanitize names, cap peers. `tests/check.sh` enforces the confinement.
- Phaser 3 was the original spec (see `docs/GDD.md` if present). The MVP deliberately uses vanilla
  Canvas for full pixel control and zero dependencies. Porting to Phaser is a separate, explicit task.

## 3. Code map (`index.html`, sections are marked `// ===== NAME =====`)
| Section | What lives there |
|---|---|
| CORE | Constants `W,H,HUD_H` (tiles are a literal 16 px), canvas setup, `resize()`, seeded RNG `mulberry()`, helpers `mk() px() rect() flip() tinted()` |
| AUDIO | `sfx(freq, dur, type, vol, slide)` |
| INPUT | `keys` (held) and `pressed` (this frame only, cleared at end of `loop`). Helpers `kd()` held, `kp()` just pressed. Keys are lowercased `e.key` (`' '` = Space, `'arrowup'`, `'enter'`, `'escape'`) |
| PIXEL FONT 3x5 | `FONT` glyph table (5 rows × 3-bit numbers), `text()`, `textC()` centered, `wrap()`. Uppercase only |
| CHARACTER SPRITES | String templates `HEAD.dog/cat`, `TOP`, `LEGS`. `buildChar({head, pal, acc})` → `{down,up,right,left}[frame]` canvases. `SPR.hero/merchant/bank/sage/alley/archer/brute/boss/frog/ninja/bull/knight`, faction trainers `SPR.tWarrior/tArcher/tHealer` (D-028). Icons `SHADOW COIN WHISK YARN BONE ORB_IC SCRAP_IC HORN_IC STEEL_IC FISH_IC CFISH_IC`. `MAT_ICONS` map (ground-item icons) |
| TILES | Tile ids `T.*`, `SOLID` set, procedural tile painters, atlas `TL` |
| MAP | `MW=80, MH=60` tiles. `CAMP` (33..47, 27..41), fire at `CX=40, CY=34`. `DUN` ruins (26..54, 2..17), `GATE_ROW=9`. 5 ponds (3 inline + `PONDS_EXTRA`). `genMap()` (seed 4242, deterministic). `tileCanvas()` picks the variant per tile |
| GAME STATE | Balance tables `SWORD_DMG ARMOR_RED` (gear comes from forge `RECIPES`, not a DOGE shop — D-039), `MARKET` (price sim), `REST_DELAY REST_CAP(0.6) RESPAWN_FRAC`, `SKILL_THRESH{combat,fishing,bark}` `SKILL_BONUS skillLv(xp,kind) skillMul(xp,kind)`, fishing `FISH_MIN FISH_MAX waterAt() startFish() stopFish() updFish()`, pressure `FIELD_POP(22) DUN_POP(6) SPAWN_EVERY(3)`, `BAG_SIZE(12) FOODS`, bag helpers `addToBag/bagCount/bagRemove`, enemy stats `ETYPES` (with `ai` and `mat` fields), `RECIPES` (forge), classes `CLASSES{warrior,archer,healer}` + `CLASS_IDS CLASS_COL classOf classSpd classDmg classArmor` (D-028), globals, `NPCS` (+ trainers on `PADS3`), `newGame()` (`P.prof`), `makeEnemy()`, `spawnEnemy(zone)`, `summon()` |
| COLLISION | `solidFor(tx,ty,ent)`, `blocked(ent,x,y)` (AABB vs tiles + NPCs for player), `move(ent,dx,dy)` (sub-stepped, corner sliding for the player), `overlap()`, `playerInCamp()`, `zoneOf()` → `'field' / 'dun' / 'boss'` |
| FX | `puff()` particles, `floater()` damage text, `toast()`, `shake()` |
| COMBAT | `hurtPlayer()` (armor, i-frames, knockback, death, bear-market dmg boost), `respawn()` (death penalty: 50% DOGE + all whiskers + all materials), `attack()` hammer swing, `bark()` "WOW" projectile, `damageEnemy()` (uses `ai` field for knockback), `killEnemy()` (drops material via `e.def.mat` + quest counters + boss victory), `shootBone()` |
| ENEMY AI | `updEnemy(e,dt)`: knockback → states `wander / chase / wind / dash`. Uses `e.def.ai||e.type` for behaviour: archer/frog kite + shoot, brute/bull wind up then dash, boss shoots spreads and summons below 50% HP |
| CHAIN | DogeOS Chikyū via EIP-1193, no library: `CHAIN{id 0x5fdaf3, rpc, explorer, faucet}`, `wallet{connected,addr,bal,chainOk,busy,msg}`, `eth()`, `connectWallet()`, `switchChain()` (switch → add on error), `refreshBal()`, `hookWallet()` (accountsChanged/chainChanged), `disconnectWallet()`, `walletRows()` (Sphinx row 0), `setWalletMsg()` (async result → open menu with `ui.chain`). **Items on chain (D-019):** `DEV_LOCAL` (`?chain=local` = anvil), `CONTRACTS{chainId:{items,dex}}`, `SEL` selectors, ABI `W32 A32 words arrAt unpack toWei fromWei`, `ecall etx`, `chainData`, `refreshChain()`, `chainAct()`, `ensureApproved()`, `mintNft useNft listNft delistNft buyListing addLp removeLp buyPool sellPool withdrawProceeds`, `swordLv() armorLv()`, `addCredit()`, `chainBlockRow()`, `marketMenu()`. **Classes (D-027/28):** `CONTRACTS[].prof`, `chooseProfession()`, `professorMenu()`. **Staking (D-030/31):** `CONTRACTS[].stake`, `stakeDoge/unstakeStake/claimStakeRewards/syncDexFees`, `stakeMenu()` |
| PHASE 4 (in UI) | `LINKS`, `openLink()` (menu action only, `noopener`, URL printed), `linkRow()`, `SCHOOL` + `schoolMenu()` + `lesson()`, `bankMenu()` = Sphinx DeFi hub, RedStone `REDSTONE`/`oracle`/`refreshOracle()`/`oracleRow()`, `FACTIONS`/`HEIST_STORY`/`elderMenu()`/`factionMenu()`, `PARTNERS`/`partnerTalk()`/`partnerMenu()`. Sprites `SPR.clover/noah/bitget`, `staticSpr()`; pads `PADS2` |
| UI | `ui` is `null`, `{type:'dialog'}` or `{type:'menu'}`. `openDialog(npc, pages, onEnd)`, `openMenu(npc, title, buildFn)`, `talk()`, `shopMenu()` (forge: RECIPES burn materials), `bankMenu()` (Sphinx DEX: wallet, swap, buy, pool), `questTalk()` (Elder: market report + lore + quests), `invMenu()` (I/Tab: bag, eat, cook near fire, skills), `updateUI()` |
| MULTIPLAYER (D-040) | Opt-in ghosts. `netParam()`, `NET_URL NET_ROOM NET_HZ(10) NET_TTL(5) NET_MAX(8) NET_PEERS(32)`, state `net{ws,on,id,name,peers}`, `netClean()`, `netConnect()`, `netTick(dt)` (called in `update` before the UI early-return), `netDraw(list,ox,oy)` (called in `drawWorld` before the y-sort). Named `net*` on purpose: `mp` already means **mana** (`P.mp`). Relay: `server/relay.mjs`; test: `tests/relay.mjs` |
| UPDATE | `update(dt)`: title → UI (pauses world) → death timer → rest → movement → attack/bark/talk → enemies → projectiles → items → respawn timer → camera |
| RENDER | `drawTiles`, `drawChar` (shadow + sprite + tint), `drawFire`, `drawWorld` (y-sorted entities, "F" hint near water), `drawSlash`, `drawFishing` (line, float, catch bar), `drawHUD`, `box`, `drawUI`, `logo`, `drawTitle`, `render` |
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
- **Healing:** hold R inside the camp for 3 s (REST_DELAY), then +10 HP/s up to **60% maxHp only** (REST_CAP), +8 MP/s to full. Moving resets. Above 60% HP you must **eat food** from the bag (RAW FISH +15, COOKED FISH +25). No potions, no regen.
- **Skill-by-use (Tibia-style, no char levels):** `P.skills.combat` +1 per hammer swing that hits, `bark` +1 per bark, `fishing` +1 per catch. Tiers combat 10/25/50/100, fishing 5/15/30/60, bark 8/20/45/80; +8% per tier (`skillMul(xp,kind)`).
- **Fishing:** F next to water (ponds, all outside camp) → 3–5 s bar ÷ fishing skill. Getting hit, moving, slashing, barking or F again cancels. Catch → RAW FISH in the bag (cook at the fire via I). No safe fishing spot may ever exist.
- **Inventory:** `P.bag` = up to 12 slots `{kind,qty}`; food stacks 5, others 20. `P.iT` = i-frame timer (was `P.inv`).
- **Camp is fully safe:** enemies can't enter, can't damage you, projectiles stop at the fence. `hurtPlayer` has a camp guard.
- **Death:** lose 50% of carried DOGE, all whiskers, all materials and the whole bag (food). NFTs are safe on chain. Wake at fire at 35% HP/MP (RESPAWN_FRAC). Pooled DOGE is safe.
- **DOGE Market:** price random-walks once per second; sentiment = price vs 30 s average. Bear: enemy dmg +50%, speed +15%, dark-red overlay. Bull: player dmg +50%, speed +10%.
- **Economy:** whisker = 3 DOGE at the Sphinx (swap). Sphinx DEX: swap, buy items, pool/unpool DOGE. Mechanic forge: burn materials (ORB/SCRAP/HORN/STEEL) via RECIPES to craft hammer upgrades, armor, charms. **On-chain staking (D-030/D-031):** DEX charges a 1% protocol fee on every trade split **0.2% project treasury / 0.8% DOGE stakers**, skimmed outside the pool reserves (curve/k unchanged, D-022 audit holds); `DogeStaking` vault pays stakers pro-rata (MasterChef); the game's `stakeMenu` (Sphinx "ON-CHAIN STAKING" row) stakes/unstakes/claims and `flushStakerFees()` syncs fees in. The off-chain P.bank "safe vault" is a separate thing (DOGE safe on death).
  Enemies drop materials: frog→ORB, ninja→SCRAP, bull→HORN, knight→STEEL; cats→WHISKERS; brutes→3 WHISKERS.
- **Wallet:** Sphinx row 0 = CONNECT WALLET / `WALLET 0x12..ab N DOGE` / OFFLINE label. Never ask for or store a private key.
- **NFT items (D-019):** only crafted (forge credit `P.credits`) or caught (bag food) things can be minted. Owning a gear NFT = wearing it
  (`swordLv/armorLv`, never read `P.sword/P.armor` directly for combat). Eating a food NFT burns it. The Sphinx NFT MARKET is empty until a
  player lists or creates a pool. NFTs are not lost on death (they live on chain); carried DOGE/materials still are.
  On-chain features are additive; the core loop never needs a wallet.
- **NPCs:** Sphinx (bank) = DogeOS DeFi hub (connect + RPC, NFT market LP/swap, faucet, stake, RedStone oracle, school, dogeos.com, docs), Elder (quest) = Keeper of the Heist (quest, story, factions, heist.dogeos.com), Mechanic (merchant) = forge. On pads N/W/E. Partners on `PADS2`: Cloverheart (Relotto), Noah (trynoah.ai), Bitget Wallet Card. Faction trainers on `PADS3` (D-028): Sergeant Ironpaw (warrior), Scout Fleetwhisker (archer), Mender Brighttail (healer) → `professorTalk/professorMenu`.
- **Classes / professions (D-027/D-028/D-036):** one class per wallet — WARRIOR (Demolition Dogs), ARCHER (Kernel Crew), HEALER (Barkitects). Bound on-chain by `DogeProfession.choose(id)` (exact fee + gas, one per wallet forever) via `chooseProfession()`; offline it's a free LOCAL pick you can switch until sworn. `applyClass(cls,onchain)` transforms the hero sprite (`SPR[classOf().spr]`) and recalculates `P.maxHp` (`syncMaxHp()`): **WARRIOR** has `+25` Max HP (`85` base), `+15%` armor, `+35%` melee damage with a wider cleave, and `GROUND POUND` (`K`/`Q`); **ARCHER** has `+25%` speed, **shoots a basic arrow on `Space` (`0 MP` cost, bow drawn in `drawSlash`)**, and fires a 3-arrow spread volley on `K`/`Q` (`QUICK SHOT`, `6 MP`); **HEALER** has `-15` Max HP (`45` base), `+25%` speed, weak melee (`0.65x`, staff drawn in `drawSlash`, restores `+2 MP` on hit), and `MEND` (`K`/`Q`, `10 MP` → `+20 HP`). **HEALER MEND heals in the field but is paid in MP, and MP refills ONLY by resting in camp**, so the camp-sanctuary + greed-vs-safety invariants still hold.
- **Starter Bag & BarkSwap-Styled Pool DEX (D-036):** New players start with `WOOD x3` and `STONE x3` in `P.bag` (plus starter `orb/scrap/horn/steel`) so they can immediately mint a `HAMMER LV2 NFT` from `invMenu` (`I`/`Tab`), `shopMenu`, or `marketMenu` Row 0. Choosing `NFT MARKET: SWAP + LIQUIDITY POOLS` at the Sphinx opens `marketMenu` (`BARKSWAP POOL DEX: MINT, SWAP & LP`, `ui.barkswap=true`), showing your wallet's DOGE balance, `WALLET ITEMS (N)` minted item balance, Row-0 item minting, and `CREATE POOL` / `SWAP` / `ADD LP` rows on `DogeDEX`.
- **Links + partners (D-024):** links open only from a menu row via `openLink()`; partner stories must be factual and sourced; no "official partner" claims without a source.
- **Oracle (D-024):** RedStone DOGE/USD is display/safety only (and anchors the simulated market when connected); swap prices always come from pool reserves.
- **Quests (`state.stage`):** 0 talk to Elder → 1 slay 8 cats (+40 DOGE) → 2 slay 3 brutes (+80 DOGE,
  opens ruins gate) → 3 defeat the Cat Lord → 4 complete (Golden Yarn +150 DOGE).
- **Enemy populations:** field 22 (`FIELD_POP`), ruins lower hall 6 (`DUN_POP`), respawn one every 3 s (`SPAWN_EVERY`) out of view. Types: alley, archer, frog, ninja, bull, knight, brute.
- **Controls:** WASD/arrows move, Space/J slash (hammer swing), K/Q class skill (`useSkill()` → WOW bark, or GROUND POUND/QUICK SHOT/MEND by class, D-029), E talk, hold R rest, I/Tab bag, F fish, Esc close.

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
