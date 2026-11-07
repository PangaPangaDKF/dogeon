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

### D-019 · 2026-11-07 · Phase 3 IT-5: game ↔ contracts (mint at the forge, NFTs in the bag, Sphinx NFT market + LP)
- Feature: the on-chain loop is playable. Crafting at Wrenchpaw gives a **mint credit**, so you can mint that item as an NFT
  (0.1 DOGE fee). Fish from the bag can be **preserved** as NFTs. The bag lists your NFTs: food NFTs can be eaten (burn → HP),
  charm/biscuit NFTs can be used, and gear NFTs count as worn just by being owned. The Sphinx has a new **NFT MARKET**: buy and
  delist listings, sell an NFT at a preset price (A/D), create a DOGE/item **LP pool** or add to one, swap DOGE↔item against a
  pool, remove your LP, and withdraw proceeds. It shows "NO MARKET YET" until a player creates one.
- Reference: user request (mint / sell / LP with DOGE, only playing gets you stuff, no store until someone creates it, crafter
  mints with a fee); `prompts/PHASE3_BRIEF.md` G6–G8 + acceptance boxes IT-5; D-018 contract API.
- Files: `index.html`, `tests/sim.mjs` (sandbox `realTimers`/`location`, +1 anvil e2e scenario with 10 checks), docs.
- Code (`index.html`, CHAIN section, after `walletRows()`):
  - Config: `DEV_LOCAL` (`?chain=local` → anvil `0x7a69`, `http://127.0.0.1:8545`), `CONTRACTS{chainId:{items,dex}}`
    (Chikyu empty until the user deploys), `SEL` (20 selectors from `cast sig`), `ITEM_TYPES`, `FOOD_TYPE`/`TYPE_FOOD`, `PRICES`.
  - ABI: `W32` uint word, `A32` address word, `words()` → BigInt words, `arrAt(w,slot)` dynamic array, `unpack()` packed item,
    `toWei/fromWei` (4-decimal DOGE). RPC: `ecall()` = `eth_call`, `etx()` = `eth_sendTransaction` + receipt poll (1.5 s, 200 tries).
  - State: `chainData{inv,listings,pools,proceeds,fee,approved,loaded}`, `refreshChain()` (6 parallel reads + `poolInfo` per pool),
    `chainAct(doneMsg,fn)` (one tx at a time via `wallet.busy`, result → `setWalletMsg`), `ensureApproved()` (`setApprovalForAll` once).
  - Actions: `mintNft(type,level,src)` (credit or bag food; food goes back to the bag if the tx fails), `useNft()` (burn → heal /
    +maxHp / +maxMp), `listNft`, `delistNft`, `buyListing`, `addLp` (ABI-encoded `uint256[]`), `removeLp`, `buyPool`, `sellPool`
    (minOut = quote), `withdrawProceeds`. `chainBlockRow()` explains why on-chain rows are disabled.
  - Gameplay: `swordLv()` / `armorLv()` = max(crafted, best owned NFT) used in `attack`, `bark`, `hurtPlayer`; listed/sold NFTs
    stop counting after the next refresh. `RECIPES[].nft=[type,level]`; crafting calls `addCredit()`; `P.credits{'t:l':n}`.
  - UI: forge mint rows (credits + PRESERVE food), bag NFT rows, Sphinx row "NFT MARKET: LISTINGS + LP POOLS" (only when
    connected, so offline row order is unchanged), `marketMenu()`, A/D `adj()` on rows, scrolling menus (`MENU_ROWS=13`, ^/V hints).
- Why: delivers the user's core web3 ask on top of IT-3/IT-4 without adding a library.
- Alternatives rejected: ethers.js (precomputed selectors + 6 helpers cover it); text input for prices (no keyboard text UI in
  the pixel menus → presets); separate equip step for gear NFTs (owning = wearing is simpler and can't desync on transfer);
  a game backend that signs crafts (needs a server + key; documented limitation in D-018).
- Process: the new `mkt` market-UI state collided with the price sim's `mkt` (practice 13 again) and broke every test → caught
  in one run. Practice 22: "name-collision grep loop for every new top-level name" (the closeout now runs it).
  The e2e caught a wrong test assumption (pre-existing anvil NFTs) → tests read state, not assumptions.
- Verify: sim `✓ 0 failed` at seeds 4242/7 — 51 PASS incl. anvil e2e (connect, mint+equip, preserve, eat, list, buy, LP, swap,
  remove LP, withdraw, market menu); `forge test` 20 passed; `ALL CHECKS PASSED`.
- Commit: this commit.

### D-018 · 2026-11-07 · Phase 3 IT-4: DogeItems (ERC-721 crafter mint) + DogeDEX (listings + DOGE/item LP pools)
- Feature: on-chain economy. The Mechanic mints every crafted item as an NFT for an exact 0.1 DOGE fee. The Sphinx DEX lets
  players sell NFTs at a fixed price, or create a DOGE/item liquidity pool that anyone can then swap against. No store and no
  swap exist until a player creates one.
- Reference: user request ("items are nfts that you mint, sell and create lp with doge coin, only playing you can get stuff and
  there is not a store or a swap if you dont create it before and the crafter mints the gear or the food with a contract and a fee");
  `prompts/PHASE3_BRIEF.md` G6–G8; user-supplied avaxskills.com `security` + `nft-basics` checklists (CEI, nonReentrant, events,
  ids from 1, no silent overpayment).
- Files (new): `contracts/foundry.toml`, `contracts/src/DogeItems.sol`, `contracts/src/DogeDEX.sol`, `contracts/test/DogeItems.t.sol`,
  `contracts/test/DogeDEX.t.sol`, `contracts/script/Deploy.s.sol`, `contracts/README.md`, `contracts/.gitignore`,
  `contracts/deployments/.gitkeep`. Changed: `tests/check.sh` (stage 4 `forge test`), docs.
- Code:
  - `DogeItems` (OZ v5.1 `ERC721`, `Ownable`, `ReentrancyGuard`): types 1 HAMMER (lv1-4), 2 ARMOR (lv1-2), 3 RAW FISH,
    4 COOKED FISH, 5 BONE CHARM, 6 MOON BISCUIT; `mint(to,type,level)` payable, `msg.value == mintFee` exactly (`WrongFee`),
    `maxLevel()`, ids from 1; `burn()` (owner/approved via `_update` auth); `withdrawFees()` (anyone, funds only to `treasury`);
    `setMintFee/setTreasury` onlyOwner (no power over user NFTs); `inventoryOf(owner)` packed `id<<16|type<<8|level`;
    `tokenURI` = base64 JSON + base64 SVG card, fully on-chain.
  - `DogeDEX` (no admin, `ReentrancyGuard`, CEI, pull payments `proceeds` + `withdraw()`, plain `transferFrom` = no callbacks):
    listings `list/delist/buy` (exact price) + `activeListings()` (packed, prices, sellers; O(1) swap-remove index);
    pools keyed `type<<8|level`: `addLiquidity(ids[])` (first LP sets price, 1 share/wei; later LPs pay `ceil(n·x/y)`, excess →
    proceeds), `removeLiquidity(key,shares)` pro-rata, `buyFromPool(key)` cost `ceil(x/(y-1))`+2%, last item never sold,
    `sellToPool(id,minOut)` `floor(x/(y+1))`−2% with slippage guard; views `poolInfo`, `allPools`, `buyQuote`, `sellQuote`.
  - Compiler: solc 0.8.24, `evm_version = cancun` — probed on Chikyu with `eth_call` (PUSH0, MCOPY, TLOAD all execute).
  - `Deploy.s.sol`: no key in code; local `--unlocked`, Chikyu `--account dogeon` (encrypted Foundry keystore); writes
    `deployments/<chainId>.json`. Selectors precomputed with `cast sig` for the IT-5 game wiring.
- Why: real ownership and player-made markets on DogeOS; LP makes "create LP with DOGE" literal.
- Alternatives rejected: own ERC-721 (security skill: prefer audited libs); ERC721Enumerable (gas on every transfer — a view scan
  is fine on testnet); a game-server signature to prove crafting (needs a backend + key custody; documented limitation: on-chain
  anyone who pays the fee can mint, the game only offers mint after a craft); royalties / protocol fee (MVP); upgradeable proxies.
- Skipped (needs the user): deploying to Chikyu with a funded wallet → README steps. Deployed and smoke-tested on local anvil
  (`mint` → `inventoryOf` = 65795 = id 1, HAMMER, lv 3).
- Verify: `forge test` 20 passed (fuzz 512 runs: k never drops, DEX solvent; reentrancy on withdraw blocked); `ALL CHECKS PASSED`.
- Commit: this commit.

### D-017 · 2026-11-07 · IT-2 review fixes: pond RNG reshuffle, facing-only cast, F while moving, ninja turf
- Feature: fixes 6 findings that an adversarial review workflow confirmed (2 reviewers + 1 refuter, ultracode) on the IT-2 diff.
- Reference: review workflow `wf_53729af6-6df` (6 REAL / 2 refuted); `prompts/PHASE3_BRIEF.md` ambiguities 3 + 10.
- Files: `index.html`, `tests/sim.mjs` (+1 refill check, +1 scenario with 6 checks), docs.
- Code (`index.html`):
  - 🟠 **major** `genMap()`: `PONDS_EXTRA` was stamped in the first water pass, and `reserved()` treats water as reserved, so the
    tree/scatter passes consumed a different number of `r()` calls → 1221 tiles of forest moved and unreachable pockets grew 21 → 55.
    Now ponds are carved AFTER vegetation, and a ring (`d<2.2`) of TREE/BUSH/ROCK around each is cleared to GRASS.
    Verified: vs `c06128e` only 81 tiles differ, all inside the pond rings.
  - `startFish()`: `P.moving` → "STAND STILL TO FISH." (F while walking used to cast and auto-cancel next frame with a false
    "THE FISH GOT AWAY"). Must face the water: `waterAt(P.dir)`; adjacent-but-not-facing → "FACE THE WATER TO FISH."
    `findWater()` removed. "F" hint shows only when facing water.
  - `waterAt('up')` throws the float 16 px further, the catch bar moves to `P.y-38` when facing up, so neither covers the head.
  - `spawnEnemy()`: field spawn within `NINJA_WATER.r=4` tiles of water → `NINJA_WATER.p=0.25` extra chance of ninja.
    New helper `nearWaterT(tx,ty,r)`.
- Refuted (kept): no bag-space check at cast time (bag-full is handled at catch with its own message); CLAUDE.md drift (already fixed in 02adc15).
- Why: the seeded map is part of the approved design (concept images); hard mode needs fair, readable rules.
- Alternatives rejected: calling `r()` for reserved tiles too (would ALSO move the whole forest vs the approved layout).
- Process: lesson → skill + SESSION_PROMPT practice 19 "seeded generators: append new map features after all RNG passes,
  then diff the map against the last approved commit".
- Verify: `✓ 0 failed, 0 warnings` at seeds 4242/7/99 — 41 PASS; `ALL CHECKS PASSED`.
- Commit: this commit.

### D-016 · 2026-11-07 · Phase 3 IT-3: real wallet connect on DogeOS Chikyū (no library)
- Feature: the Sphinx DEX's first row is now a real wallet. CONNECT asks the wallet for accounts, switches to DogeOS Chikyū
  (adds it on 4902), shows the short address and test-DOGE balance, follows account/network changes, and can DISCONNECT.
  Without a wallet the row reads "WALLET: OFFLINE (SIMULATED DOGE ONLY)" and the game is unchanged.
- Reference: user request ("add the wallet connect and after connect you add the dogeos testnet rpc to the wallet");
  `prompts/PHASE3_BRIEF.md` G5, ambiguity 8. Chain verified live 2026-11-07: `eth_chainId` on `https://rpc.testnet.dogeos.com` →
  `0x5fdaf3`, blocks advancing; Blockscout explorer and faucet return 200. Sources: chainlist.org/chain/6281971,
  github.com/ethereum-lists/chains/pull/8860.
- Files: `index.html`, `tests/sim.mjs` (+3 async scenarios, `mockEth()`), `tests/serve.mjs` (new), `CLAUDE.md`, `CONTEXT.md`,
  `MASTER_PROMPT.md` (§F templates C7/C8, §G feature ledger), `prompts/SESSION_PROMPT.md` v1.4, `dogeon-game` skill v1.4.
- Code (`index.html`, new section `CHAIN` before UI):
  - `CHAIN{id:'0x5fdaf3',name,rpc,explorer,faucet}`, `wallet{connected,addr,bal,chainOk,busy,msg,hooked}`, `eth()`, `shortAddr()`,
    `walletErr()` (4001 rejected, -32002 pending), `setWalletMsg()` (writes into the open Sphinx menu, marked `ui.chain`).
  - `switchChain()` → `wallet_switchEthereumChain`, on any non-4001 error → `wallet_addEthereumChain` (DOGE, 18 decimals, rpc, explorer).
  - `refreshBal()` → `eth_getBalance` → BigInt → 4-decimal DOGE. `hookWallet()` → `accountsChanged` / `chainChanged`.
  - `connectWallet()`, `disconnectWallet()` (local clear + best-effort `wallet_revokePermissions`), `walletRows()`.
  - `bankMenu()`: row 0 = `...walletRows()` (one row, so SWAP stays row 1); DISCONNECT row before LEAVE when connected.
  - HUD camp hint shows `SPHINX=WALLET` or `CHAIN 0x12..abcd`; title line mentions the Sphinx wallet.
- Why: the user wants real testnet transactions; this is the safe base for IT-4/IT-5 (mint/list/buy).
- Alternatives rejected: ethers.js v6 from CDN (brief G5) — not needed: connect/switch/balance are plain EIP-1193 calls and the
  IT-5 contract calls can use precomputed selectors (`cast sig`), so the game stays zero-dependency and works with the CDN blocked;
  WalletConnect — needs a project id + network relay; RPC reads via `fetch` — breaks the "no network from the game" rule, the wallet
  already proxies reads.
- Process: user said "skip anything that needs a wallet or a hand, keep going" → contracts are built and tested locally with Foundry,
  deployment is left as a script + steps. Every feature now also goes into MASTER_PROMPT §G ledger (user rule).
- Verify: `✓ 0 failed, 0 warnings (seed 4242)` — 34 PASS; `ALL CHECKS PASSED`. Manual: `node tests/serve.mjs` → http://localhost:8080 →
  Sphinx → CONNECT WALLET → approve "add network" + "switch" in MetaMask → row shows address + DOGE.
- Commit: this commit.

### D-015 · 2026-11-07 · Phase 3 IT-2: fishing, per-skill tiers, enemy pressure 22 / 3 s
- Feature: fishing as the only way to heal above the 60% rest cap. Ponds sit in the dangerous field, so food costs risk.
- Reference: user request ("add a fishing feature to be able to eat to get hp up but the trick is that it is hard to fish if you
  get attacked and all the map is always full and you cannot get full hp"); `prompts/PHASE3_BRIEF.md` G4, ambiguities 3, 4, 10.
- Files: `index.html`, `tests/sim.mjs` (+4 scenarios, 6 PASS lines; stale `inv:0` → `iT:0`), `CLAUDE.md`, `CONTEXT.md`,
  `prompts/SESSION_PROMPT.md` v1.3, `dogeon-game` skill v1.3.
- Code (`index.html`):
  - MAP: `PONDS_EXTRA=[[54,25,3.5,2.5],[24,53,4,2.5]]` → 5 ponds total (3 existing + one NE of the camp fence, one SW). `genMap()`
    stamps them in the same water pass (no RNG calls, so the rest of the seeded map is unchanged). `T.WATER` was already solid.
  - GAME STATE: `SKILL_THRESH` is now per skill `{combat:[0,10,25,50,100], fishing:[0,5,15,30,60], bark:[0,8,20,45,80]}`;
    `skillLv(xp,kind)`, `skillMul(xp,kind)` (kind defaults to combat). `FISH_MIN=3, FISH_MAX=5, FIELD_POP=22, DUN_POP=6, SPAWN_EVERY=3`.
    `waterAt(dir)` samples 6 px past the hitbox edge; `findWater()` prefers the facing dir, else turns to adjacent water;
    `startFish()` (bar = rand(3..5) s ÷ `skillMul(fishing)`), `stopFish(msg)`, `updFish(dt)` (catch → `addToBag('raw_fish')`,
    +1 fishing XP; bag full → "THE FISH GOT AWAY").
  - Cancels: `hurtPlayer` → "LINE SNAPPED!"; any movement input → "THE FISH GOT AWAY"; `attack()`/`bark()` → "REELED IN";
    F again → "REELED IN"; `respawn()` clears `P.fishing`.
  - `update()`: F (not resting) toggles fishing; `updFish(dt)` runs after movement so a step on the last frame never awards a fish.
    Spawner uses `SPAWN_EVERY`/`FIELD_POP`/`DUN_POP`; `newGame()` spawns `FIELD_POP`/`DUN_POP`.
  - RENDER: `drawFishing()` — 1 px line with a slight sag from paw to a bobbing red/white float, 16×3 blue catch bar over the head.
    Blue "F" hint bobs over the hero when water is adjacent (same style as the NPC "E").
- Why: hard mode — every point of HP above 60% now costs a 3-5 s stand-still next to water in a field with 22 cats refilling every 3 s.
- Alternatives rejected: a fishing minigame (timing hook) — extra system, MVP says no; river near camp (brief G4) — the resolved
  ambiguity 3 says ponds, one near the camp, which is simpler; "ninja spawns increased near water" — deferred, population bump already
  supplies the pressure; fish lost on death — not specified, kept the IT-1 death rule (materials only) and noted for the IT-6 balance pass.
- Process: tests that reset a renamed field (`inv:0`) silently kept passing after IT-1 → SESSION_PROMPT practice 14 "when you rename
  state, grep the tests too"; and "cancel tests must first assert the state they cancel" (non-vacuous tests).
- Verify: `✓ 0 failed, 0 warnings` at seeds 4242, 7, 99 — 26 PASS. Manual: walk NE out of the camp to the pond, face it, F, wait for
  the bar → +1 RAW FISH; get hit while fishing → LINE SNAPPED!; I at the fire → COOK.
- Commit: this commit.

### D-014 · 2026-11-07 · Phase 3 IT-1: rest cap 60%, inventory bag, skill-by-use
- Feature: survival rework part 1. Rest is now a stopgap; food (IT-2) is the real heal. Skills grow by doing, like Tibia.
- Reference: user request ("rest only a little of hp", "inventory", "like tibia… you get more of something using some kind of attack");
  `prompts/PHASE3_BRIEF.md` G1–G3, ambiguities 1, 2, 4.
- Files: `index.html`, `tests/sim.mjs` (harness exports), `CLAUDE.md`, `prompts/SESSION_PROMPT.md` v1.2, `dogeon-game` skill v1.2.
- Code (`index.html`):
  - GAME STATE: `REST_CAP=0.6`; `SKILL_THRESH=[0,10,25,50,100]`, `SKILL_BONUS=0.08`, `skillLv(xp)`, `skillMul(xp)`;
    `BAG_SIZE=12`; `FOODS{raw_fish:+15, cooked_fish:+25}`; `addToBag(kind,qty)` (food stacks 5, others 20), `bagCount`, `bagRemove`.
  - `newGame()`: `P.bag=[]`, `P.skills={combat,fishing,bark}`, `P.fishing`, `P.fishT`. **Renamed `P.inv` → `P.iT`** (i-frames) in
    `hurtPlayer`, `respawn`, `update`, `drawWorld` to free the name.
  - `attack()`: damage × `skillMul(P.skills.combat)`; +1 combat XP only if the swing hit something (no XP for air swings).
  - `bark()`: +1 bark XP per cast, damage × `skillMul(P.skills.bark)`.
  - `update()` rest: HP capped at `ceil(maxHp*REST_CAP)`; MP still fills. `I`/`Tab` → `invMenu()`. Tab `preventDefault`.
  - UI: `invMenu()` lists bag slots, EAT (food), COOK raw→cooked within 30 px of the campfire, skills line.
  - Icons: `FISH_IC`, `CFISH_IC`, `ITEM_ICONS` map. HUD rest text shows "HP CAPPED AT 60%. EAT FOOD FOR MORE." Title controls updated.
- Why: makes HP a scarce resource (hard mode) and creates a reason to leave camp to fish.
- Alternatives rejected: character XP levels (user said no level-up); slowing rest instead of capping (still reaches full, no tension);
  moving materials into the bag now (bigger diff; forge still reads `P.orb` etc. — revisit in IT-5 when items become NFTs).
- Process: the `P.inv` name collision → new practice 13 in SESSION_PROMPT ("grep before naming new state"). User RULE #1 added to prompt + skill.
- Verify: `✓ 0 failed, 0 warnings (seed 4242)` — 20 PASS. Rest-cap / bag / skill scenarios land in IT-6.
- Commit: this commit.

### D-013 · 2026-11-07 · IT-7: tests, docs, prompt — Phase 2 complete
- What:
  - 6 new test scenarios (20 total): forge craft + burn, pool deposit + safe-on-death, new enemy spawn + material types, death materials loss.
  - CLAUDE.md §3–§4 updated: new sprites, ETYPES with ai/mat, MARKET/REST/RESPAWN, RECIPES, forge/DEX/elder, DOGE economy, material drops, 7 enemy types.
  - PHASE2_BRIEF.md §7: all 8 acceptance criteria checked off.
  - sim.mjs harness exposes RECIPES and ETYPES.
- Why: IT-7 = final iteration. Tests cover every new rule; docs keep future sessions accurate.
- Tool: Claude Code (Opus 4.6).
- Verify: `0 failed, 0 warnings (seed 4242)`, 20 PASS lines.

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
- 2026-11-07 · SESSION_PROMPT v1.2 + skill v1.2: user RULE #1 (feature closeout), practice 13 grep-before-naming (D-014), Phase 3 pointer.
