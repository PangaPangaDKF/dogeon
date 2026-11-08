# DOGEON — Master Prompt & Zero-Waste Full-Stack Blueprint (TryNoah AI / Claude Code / AGY)

> **Purpose of this Master Prompt:**
> 1. **One-Shot Full Project Recreation (TryNoah AI / Autonomous Builders):** Copy **Section A** into TryNoah AI (`https://trynoah.ai`) or any agentic coding environment to recreate the entire **DOGEON ("The Grand Heist")** 16-bit Web3 Action RPG + DogeOS Chikyū DeFi & NFT Ecosystem from a single prompt with **zero wasted context** and **zero missing implementations**.
> 2. **Enchanted Example Skill Prompt (Section B):** Reusable, high-density prompt engineering template demonstrating how to specify Web3 DeFi UI (`barkswap.fi/swap`), multi-asset ERC-20 integration, starter bag NFT minting, and distinct class combat mechanics (`WARRIOR`, `ARCHER`, `HEALER`).
> 3. **Pre-Decision Gate & Feature Ledger (Sections C–G):** Rules (`RULE #0` & `RULE #1`), reusable task templates, and the canonical shipped feature ledger (`D-014..D-036`).

---

## A. Single-Prompt Full-Stack Recreation Blueprint (Paste into TryNoah AI / LLM Builder)

```markdown
# ROLE & OBJECTIVE
Build **DOGEON ("The Grand Heist")**, a complete, production-ready 16-bit Sega Genesis-style top-down Web3 Action RPG and DeFi Hub on **DogeOS Chikyū Testnet (`chainId: 0x5fdaf3` / `6281971`)** inside a single zero-dependency file `index.html` (< 1,500 lines), backed by 4 audited Solidity ^0.8.24 contracts in `contracts/src/`.

## 1. EXACT TECHNICAL STACK & HARD CONSTRAINTS (NEVER VIOLATE)
- **Frontend (`index.html`):** Single HTML file with inline CSS + vanilla ES2022 JavaScript + HTML5 `<canvas width="320" height="224">` (`image-rendering: pixelated`, integer window scaling).
- **Zero External Dependencies:** NO npm runtime packages, NO ethers.js/viem/wagmi CDN, NO external images/fonts/audio files, NO `fetch()`, `XMLHttpRequest`, `WebSocket`, `import()`, `alert()`, `confirm()`, or `prompt()`.
- **Procedural Assets in Code:**
  - **Font:** 3×5 uppercase bitmap glyph table `FONT` (including `#`, `^`, `$`, `%`, `/`, `<`, `>`, `[`, `]`, `|`), rendered via `text(s,x,y,col,scale)` and `textC()`.
  - **Sprites:** 16×20 character sprites built from string templates (`HEAD.dog`, `HEAD.cat`, `TOP`, `LEGS`) + palette roles (`O F C P E N R W T A B L K`) + per-direction accessory painter `acc(g,dir,frame)`.
  - **Tiles:** 16×16 procedural tile atlas `TL` (`GRASS, FLOWERS, TREE, WATER, PATH, WALL, FLOOR, FENCE, GATE, TORCH, STAIRS, PILLAR, RUG, DOOR, CRYSTAL, PAD, FIRE`).
  - **Audio:** WebAudio synthesizer `sfx(freq,dur,type,vol,slide)`; resume `AudioContext` on `click` and `keydown` user gestures.
- **Web3 Transport:** EIP-1193 provider (`window.ethereum || window.bitkeep?.ethereum`) ONLY after user clicks `CONNECT WALLET`. All contract reads (`eth_call`) and writes (`eth_sendTransaction` + `eth_getTransactionReceipt`) use precomputed 4-byte selectors (`SEL`) and 32-byte hex ABI helpers (`W32`, `A32`, `words`, `arrAt`, `unpack`, `toWei`, `fromWei`).
- **Offline Playability Invariant:** Every on-chain feature (classes, BarkSwap DEX, NFT market, staking, oracle) MUST degrade gracefully when offline (`!chainReady() || !addrs().x`). The full RPG is 100% playable without a wallet.
- **Input Support:** Full Keyboard (`WASD`/Arrows, `Space`/`J` attack, `K`/`Q` class skill, `E`/`Enter` interact, `R` rest, `I`/`Tab` inventory, `F` fish, `Esc` close) AND full Mouse support on canvas (`mousemove` row hover, `wheel` scroll, `click` `<`/`>` preset adjusters or row activation).

## 2. LIVE DOGEOS CHIKYŪ TESTNET REGISTRY (`0x5fdaf3` / `6281971`)
- **Chain Config:** `id: '0x5fdaf3'`, `name: 'DogeOS Chikyu Testnet'`, `rpc: 'https://rpc.testnet.dogeos.com'`, `explorer: 'https://dogeos-testnet.l2scan.co'`, `faucet: 'https://faucet.testnet.dogeos.com'`, native currency `DOGE` (18 decimals). Support `?chain=local` for local Foundry Anvil (`0x7a69`, `http://127.0.0.1:8545`).
- **Core Game Contracts (`CONTRACTS['0x5fdaf3']`):**
  - `items` (`DogeItems.sol`, ERC721Enumerable, on-chain SVG `tokenURI`, `0.1 DOGE` mint fee): `0x207641C60474526a353960F3967d5c412026F62e`
  - `dex` (`DogeDEX.sol`, NFT marketplace + constant-product `x*y=k` NFT/DOGE AMM pools, 2% LP fee + 1% protocol fee split 0.2% treasury / 0.8% stakers, pull-payment `proceeds`): `0xaecaABe03eA9b0b8aA0eFdD2104A445DdBbdcF10`
  - `prof` (`DogeProfession.sol`, 1 class per wallet forever, `0.05 DOGE` fee): `0x7AEF681331EFa8C356d27b96BC5B223a2B4FC055`
  - `stake` (`DogeStaking.sol`, MasterChef `1e18` precision DOGE staking vault earning 0.8% of DEX volume): `0x4a1BF177c842bD55d933f49ee8297Ec6D190e12d`
- **RedStone Oracle (`REDSTONE['0x5fdaf3']`):**
  - `feed`: `0x434F8D17c0301cfEa143dba912972E24B827C968` (`latestRoundData()` = `0xfeaf968c`, 8 decimals)
  - `adapter`: `0xB08342D907D2df47B6F73e25F4fa033978B344B1` (`getLastUpdateDetailsUnsafe(bytes32("DOGE"))` = `0x729bfda4` + `'444f4745'.padEnd(64,'0')`, fallback when feed reverts on >24h stale heartbeat)
- **Precomputed 4-Byte Function Selectors (`SEL`):**
  ```js
  const SEL={mint:'352926a8',burn:'42966c68',inventoryOf:'7eaebb15',mintFee:'13966db5',setApprovalForAll:'a22cb465',isApprovedForAll:'e985e9c5',list:'50fd7367',delist:'964bc33f',buy:'d96a094a',activeListings:'aa4df6f0',listedCount:'f36065b3',addLiquidity:'c5bb3168',removeLiquidity:'f88bf15a',buyFromPool:'66c1dbf3',sellToPool:'0de77491',withdraw:'3ccfd60b',dogeUsd:'435a3613',proceeds:'35adde54',allPools:'c5c63e65',poolInfo:'81ea4ee7',chooseProf:'f94e349d',professionOf:'31544fd8',profFee:'ddca3f43',stakeDoge:'3a4b66f1',unstakeDoge:'2e17de78',claimStake:'4e71d92d',pendingRewards:'31d7a262',stakedOf:'98807d84',flushFees:'6811406e',stakerFeesView:'67f7cf97'};
  ```

## 3. GAMEPLAY MECHANICS, CLASSES, STARTER BAG & DEFI INTERFACES
1. **World & Sanctuary Camp (`MW=80, MH=60`):**
   - Walled Sanctuary Camp (`x:33..47, y:27..41`, campfire at `CX=40, CY=34`, `FY=38`) where enemies cannot enter (`solidFor` blocks `ent.enemy`) and `hurtPlayer()` immediately returns.
   - Northern Dungeon Ruins (`x:26..54, y:2..17`, boss gate at `GATE_ROW=9`), 5 fishing ponds outside camp (`PONDS_EXTRA`).
   - 8 enemy types (`alley`, `archer`, `frog`->`orb`, `ninja`->`scrap`, `bull`->`horn`, `knight`->`steel`, `brute`->3×`whisk`, `boss` Cat Lord -> Golden Yarn). Field cap `FIELD_POP=22`, dungeon cap `DUN_POP=6`, spawn distance `>=200` px from player.
2. **Starter Bag & NFT Minting (`newGame`, `invMenu`, `shopMenu`, `marketMenu`):**
   - Every new player starts with `wood:3, stone:3, orb:2, scrap:2, horn:2, steel:2` and `bag:[{kind:'wood',qty:3},{kind:'stone',qty:3}]` (12-slot bag, food stacks 5, materials stack 20).
   - Players can immediately mint a `HAMMER LV2 NFT` (`type:1, level:2`) by spending `1 WOOD + 1 STONE` (`mintNft(1,2,'starter')`) from `invMenu` (`I`/`Tab`) or `shopMenu` (Wrenchpaw's Forge), craft 7 recipes (`RECIPES`) for mint credits (`creditOk`/`takeOffChain`/`putBack`), preserve caught fish (`raw_fish`/`cooked_fish`), OR directly mint any item at Row 0 of `marketMenu()` (`MINT < ITEM > NFT (0.1 DOGE)`).
   - Owning a gear NFT on-chain (`chainData.inv`) equips it automatically (`swordLv()`, `armorLv()`).
3. **Three Distinct Professions (`CLASSES`, `applyClass`, `syncMaxHp`, `attack`, `useSkill`):**
   - **Hero Sprite Transformation:** Choosing a profession immediately transforms the player sprite (`SPR[classOf()?.spr || 'hero']`).
   - **WARRIOR (`id:1`, Demolition Dogs, Sergeant Ironpaw):** `+25` Max HP (`85` base HP), `+15%` armor (`0.15`), `1.35x` melee damage, `0.95x` move speed. `Space` performs a wide heavy cleave (`+4 px` hitbox + screen shake). `K`/`Q` casts `GROUND POUND` (`12 MP`, radial AoE damage + knockback).
   - **ARCHER (`id:2`, Kernel Crew, Scout Fleetwhisker):** `60` base Max HP, `1.25x` move speed, `1.0x` damage. **`Space` fires a predetermined ranged basic ARROW (`0 MP` cost, `speed=280`, grants `+1` combat XP on hit, draws bow & string in `drawSlash`)!** `K`/`Q` casts `ARROW VOLLEY` (`6 MP`, 3-arrow fan at `speed=300`).
   - **HEALER (`id:3`, Barkitects, Mender Brighttail):** `-15` Max HP (`45` base HP), `1.25x` move speed (fast), `+5%` armor, weak melee (`0.65x` damage, draws glowing staff in `drawSlash`, **restores `+2 MP` on hit**). `K`/`Q` casts `MEND` (`10 MP`, heals `+20 HP * bark skill` anywhere).
   - Offline pick is free and switchable; connected pick calls `DogeProfession.choose(id)` (`0.05 DOGE`) and permanently binds one class per wallet.
4. **BarkSwap-Styled Pool DEX (`marketMenu`) & Sphinx DeFi Hub (`bankMenu`, `stakeMenu`):**
   - **BarkSwap Pool DEX (`marketMenu`, `ui.barkswap=true`):** Opened when choosing `NFT MARKET: SWAP + LIQUIDITY POOLS` at the Sphinx NPC. Styled with BarkSwap's amber CTA (`#3a2208`/`#ffd860`), dark-slate wallet item balance (`#101838`/`#f8e090`), and emerald pool/swap cards (`#0c2624`/`#80f8c0`):
     - Header shows `WALLET: <bal> DOGE` and `ITEMS: <chainData.inv.length>  STAKED: <staked>`.
     - Row 0: `MINT < ITEM > NFT (0.1 DOGE)` (`A/D` or mouse `<`/`>` cycles `MINTABLE`; consumes `1 WOOD + 1 STONE` when minting starter Hammer Lv2 or mints directly on `DogeItems`).
     - Row 1: `WALLET ITEMS (N): #id ITEM, ...` so the player immediately sees their minted item tokens in their wallet after minting.
     - Pool & Swap rows: `CREATE POOL: N ITEM + < AMT > DOGE` (`addLp`), `POOL ITEM: N ITEMS / X DOGE`, `SWAP X DOGE -> 1 ITEM` (`buyPool`), `SWAP 1 ITEM -> X DOGE` (`sellPool`), `ADD N ITEMS + X DOGE AS LP` (`addLp`), `REMOVE MY LP` (`removeLp`), and `SELL #id ITEM FOR < PRICE > DOGE` (`listNft`).
   - **Instant Wallet Popup (`chainAct`):** Never block `eth_sendTransaction` behind slow RPC reads; call `await fn()` immediately on user click/keypress with safe default fees (`fee=10n**17n`, `profFee=5n*10n**16n`), then refresh chain state afterward.
```

---

## B. Enchanted Example Skill Prompt (Best LLM Practices Template)

Use this exact prompt structure when instructing an AI agent (TryNoah AI, Claude Code, or Antigravity) to build or extend full-stack Web3 + gameplay features without wasting context:

```markdown
# TASK: BarkSwap-Styled Pool DEX + Starter Bag Item Minting + Distinct Class Combat Mechanics

## 1. CONTEXT & ARCHITECTURAL BOUNDARIES
- **Target File:** `@index.html` (single-file 320×224 Canvas 2D RPG, must stay < 1,500 lines, zero external dependencies, no `fetch`/`alert`).
- **Scope Rule:** Focus strictly on the 4 game contracts (`DogeItems`, `DogeDEX`, `DogeProfession`, `DogeStaking`). Do NOT add extra contracts or external tokens.
- **Verification Gate:** Run `node .agents/skills/analyzer-master/scripts/audit-scan.mjs && bash tests/check.sh` after edits. Every Web3 function must be exported in `tests/sim.mjs` `HARNESS` and asserted in a deterministic scenario.

## 2. EXACT ON-CHAIN REGISTRY & ABI SELECTORS (DogeOS Chikyū `0x5fdaf3`)
- **Deployed Game Contracts:**
  - `items` (`DogeItems.sol`, ERC-721 minted item tokens): `0x207641C60474526a353960F3967d5c412026F62e`
  - `dex` (`DogeDEX.sol`, item/DOGE pool & swap contract): `0xaecaABe03eA9b0b8aA0eFdD2104A445DdBbdcF10`
  - `prof` (`DogeProfession.sol`, 1 class per wallet): `0x7AEF681331EFa8C356d27b96BC5B223a2B4FC055`
  - `stake` (`DogeStaking.sol`, 0.8% DEX fee staking vault): `0x4a1BF177c842bD55d933f49ee8297Ec6D190e12d`
- **Selectors (`SEL`):** `mint: '352926a8'`, `inventoryOf: '7eaebb15'`, `addLiquidity: 'c5bb3168'`, `removeLiquidity: 'f88bf15a'`, `buyFromPool: '66c1dbf3'`, `sellToPool: '0de77491'`, `chooseProf: 'f94e349d'`, `stakeDoge: '3a4b66f1'`.

## 3. DETERMINISTIC IMPLEMENTATION SPEC
1. **BarkSwap-Styled Pool DEX at the Sphinx NPC (`marketMenu`, `drawUI`):**
   - When the player selects `NFT MARKET: SWAP + LIQUIDITY POOLS` at the Sphinx NPC, open `marketMenu(n)` (`BARKSWAP POOL DEX: MINT, SWAP & LP`, `ui.barkswap = true`).
   - Header (`drawUI`) displays `WALLET: <bal> DOGE` and `ITEMS: <chainData.inv.length>  STAKED: <staked>`.
   - Row 0: `MINT < ITEM > NFT (0.1 DOGE)` (`A/D` or mouse `<`/`>` cycles `MINTABLE`; uses `1 WOOD + 1 STONE` for starter Hammer Lv2 or mints directly on `DogeItems`).
   - Row 1: `WALLET ITEMS (N): #id ITEM, ...` displaying the live balance and IDs of minted item tokens in the player's wallet (`myFree()`).
   - Pool & Swap rows: `CREATE POOL: N ITEM + < AMT > DOGE` (`addLp` on `DogeDEX`), `POOL ITEM: N ITEMS / X DOGE`, `SWAP X DOGE -> 1 ITEM` (`buyPool`), `SWAP 1 ITEM -> X DOGE` (`sellPool`), `ADD N ITEMS + X DOGE AS LP` (`addLp`), and `REMOVE MY LP` (`removeLp`).
   - In `drawUI()`, when `ui.barkswap` is true, highlight `MINT` in amber (`#3a2208`/`#ffd860`), `WALLET ITEMS` in dark-slate (`#101838`/`#f8e090`), and `POOL`/`SWAP`/`CREATE POOL` in emerald (`#0c2624`/`#80f8c0`).
2. **Starter Bag Materials & Direct Minting (`newGame`, `mintNft`, `invMenu`, `shopMenu`):**
   - Initialize `P` in `newGame()` with `wood:3, stone:3, orb:2, scrap:2, horn:2, steel:2` and `bag:[{kind:'wood',qty:3},{kind:'stone',qty:3}]`.
   - Support `mintNft(1, 2, 'starter')` consuming `1 WOOD + 1 STONE` (refunding both on reverted tx) from `invMenu` (`I`/`Tab`), `shopMenu`, and `marketMenu` Row 0.
3. **Distinct Class Gameplay Mechanics (`CLASSES`, `applyClass`, `syncMaxHp`, `attack`, `quickShot`, `drawWorld`, `drawSlash`):**
   - `applyClass(cls, onchain)` sets `P.prof = cls`, updates `P.maxHp = 60 + P.hpUps*15 + (classOf()?.hp || 0)` via `syncMaxHp()`, and transforms the hero sprite (`SPR[classOf()?.spr || 'hero']`).
   - **ARCHER (`id:2`):** `spd:1.25, dmg:1.0, hp:0` (`60` maxHp). `Space` (`attack()`) fires a ranged `'arrow'` projectile (`0 MP` cost, `speed=280`, `+1` combat XP on hit) and draws a wooden bow in `drawSlash()`. `K`/`Q` (`quickShot()`) fires a 3-arrow spread volley (`6 MP`).
   - **HEALER (`id:3`):** `spd:1.25, dmg:0.65, hp:-15` (`45` maxHp), `armor:0.05`. Weak melee staff swing (`Space`) restores `+2 MP` on hit and draws a cyan/emerald staff in `drawSlash()`. `K`/`Q` (`mend()`, `10 MP`) heals `+20 HP * bark skill`.
   - **WARRIOR (`id:1`):** `spd:0.95, dmg:1.35, hp:+25` (`85` maxHp), `armor:0.15`. Heavy melee cleave (`+4 px` reach + screen shake) on `Space`; `GROUND POUND` AoE slam (`12 MP`) on `K`/`Q`.

## 4. NEGATIVE CONSTRAINTS (DO NOT DO)
- Do NOT add extra contracts or external ERC-20 tokens outside `DogeItems`, `DogeDEX`, `DogeProfession`, and `DogeStaking`.
- Do NOT await `refreshChain()` before `await fn()` inside `chainAct()` (blocks the browser wallet popup).
- Do NOT break the offline fallback when `wallet.connected === false`.
- Do NOT mutate `api.get().ui = null` in tests to close menus; send `api.press('escape'); api.step(DT);`.
```

---

## C. Pre-Decision Gate & Iteration Templates

### RULE #0 — Analyzer Prompt Master Gate (ALWAYS RUN FIRST)
Before taking any decision or editing any file, run `node .agents/skills/analyzer-master/scripts/audit-scan.mjs`, follow `prompts/ANALYZER_PROMPT_MASTER.md`, and verify all 4 gates:
1. **Line Budget & Zero-Dep Gate:** `index.html` < 1,500 lines, 0 external assets/fetch/alerts.
2. **Selector & Collision Gate:** Every `SEL.*` key used; 0 top-level identifier collisions.
3. **Offline & Economy Invariant Gate:** Every Web3 action has an offline fallback; 1 craft = 1 item (`creditOk` + `putBack`/`takeOffChain`).
4. **100% Web3 Sim Coverage Gate:** Every Web3 action function is exported and tested in `tests/sim.mjs`.

### C1. Web3 / DeFi Feature (`index.html` CHAIN + UI sections)
```
Feature: <one sentence>. Chain: DogeOS Chikyu testnet (CHAIN.id 0x5fdaf3).
Rules: EIP-1193 window.ethereum only after CONNECT; precomputed 4-byte selector in SEL; instant wallet popup in chainAct();
offline fallback when !chainReady(); async status via setWalletMsg(); handle 4001 (rejected), -32002 (pending), 4902 (add chain).
Verify: export in tests/sim.mjs HARNESS, add mockEth() assertions, run audit-scan.mjs + bash tests/check.sh.
```

### C2. Solidity Contract (`contracts/src/`, Foundry)
```
Contract: <name + one sentence>. Solidity ^0.8.24, OpenZeppelin v5.1, checks-effects-interactions, pull payments for ETH/DOGE
payouts, custom errors, events on every state mutation, no admin drain on user funds. Run forge test (45+ tests).
```

### C3. Pixel Art / Character Sprite (`CHARACTER SPRITES` section)
```
Create a 16x20 sprite using buildChar({head:HEAD.dog|cat, pal:{O,F,C,P,E,N,R,W,T,A,B,L,K}, acc(g,dir,frame)}) or staticSpr().
Integer coordinates only, dark outline, max 3 shades per material. Render via `node tests/sprites.mjs` to inspect visually.
```

---

## G. Feature Ledger (Every Shipped Feature, Key Code, and Decision Log)
Update this table in the same commit as each feature (**RULE #1**).

| Iter | Feature | Key code (`index.html` unless noted) | Log |
|---|---|---|---|
| P3 IT-1 | Rest cap 60%, 12-slot bag (I/Tab), skill-by-use | `REST_CAP`, `BAG_SIZE`, `FOODS`, `addToBag/bagCount/bagRemove`, `invMenu()`, `P.skills`, `P.iT` (was `P.inv`) | D-014 |
| P3 IT-2 | Fishing at 5 ponds, per-skill tiers, field pop 22 / spawn 3 s | `PONDS_EXTRA`, `SKILL_THRESH{combat,fishing,bark}`, `skillLv/skillMul(xp,kind)`, `FISH_MIN/MAX`, `waterAt/startFish/stopFish/updFish`, `drawFishing()`, `FIELD_POP/DUN_POP/SPAWN_EVERY` | D-015 |
| P3 IT-3 | Real wallet connect + DogeOS Chikyu add/switch, balance, disconnect, offline fallback | CHAIN section: `CHAIN`, `wallet`, `eth()`, `connectWallet()`, `switchChain()`, `refreshBal()`, `hookWallet()`, `disconnectWallet()`, `walletRows()`, `setWalletMsg()`; `tests/serve.mjs` | D-016 |
| P3 fix | IT-2 review fixes: ponds carved after vegetation, face-water-only cast, no cast while moving, up-cast drawn above head, ninjas favour ponds | `genMap()` pond pass + shore ring, `startFish()`, `waterAt()`, `NINJA_WATER`, `nearWaterT()` | D-017 |
| P3 IT-4 | Contracts: DogeItems ERC-721 crafter mint (0.1 DOGE fee, on-chain SVG) + DogeDEX listings and DOGE/item LP pools (x·y=k, 2% LP fee, pull payments, no admin) | `contracts/src/DogeItems.sol`, `contracts/src/DogeDEX.sol`, `contracts/script/Deploy.s.sol`, `tests/check.sh` stage 4 | D-018 |
| P3 IT-5 | Game ↔ contracts: forge mint credits + PRESERVE fish, bag NFT rows (eat = burn), owning gear NFT = wearing it, Sphinx NFT MARKET, scrolling menus, `?chain=local` anvil mode | `CONTRACTS`, `SEL`, `W32/A32/words/arrAt/unpack`, `ecall/etx`, `chainData`, `refreshChain`, `chainAct`, `ensureApproved`, `mintNft/useNft/listNft/delistNft/buyListing/addLp/removeLp/buyPool/sellPool/withdrawProceeds`, `swordLv/armorLv`, `marketMenu`, `MENU_ROWS` | D-019 |
| P3 IT-6 | Survival tests (rest cap, bag, food, cook, skills, death), bag slot + materials rows, death empties the bag (preserve fish as NFTs), player README | `respawn()`, `invMenu()`, `tests/sim.mjs` IT-6 scenarios, `README.md` | D-020 |
| P3 fix | IT-5 review fixes: mint moves crafted items on chain (no dupes), no refund on unknown tx outcome, account switch resets NFTs, `0x` = "deploy first", drained pools re-creatable, `#`/`^` glyphs | `creditOk/takeOffChain/putBack`, `etx` `.sent/.reverted`, `resetChainData()`, `ecall` 0x guard, `marketMenu` shares filter, `FONT` | D-021 |
| P3 audit | Contract audit fixes: no zero-share LP theft (1e18 shares/item first LP, MIN_FIRST_DOGE, ZeroShares, minShares, ZeroPayout), removeLiquidity slippage, ERC721Enumerable inventory, paginated listings | `DogeDEX.addLiquidity(ids,minShares)`, `removeLiquidity(key,amt,minItems,minDoge)`, `activeListings(offset,limit)`, `listedCount()`, `DogeItems is ERC721Enumerable` | D-022 |
| P3 tool | Deploy helper writes deployed addresses into `CONTRACTS` after checking contract code on the RPC | `contracts/apply-deployment.mjs` | D-023 |
| P4 | **The Grand Heist**: partner NPCs (Cloverheart/Relotto, Noah/trynoah.ai, Bitget Wallet Card), Elder = Heist lore + factions + heist.dogeos.com, Sphinx = DogeOS DeFi hub, DogeDEX RedStone `dogeUsd()` | `SPR.clover/noah/bitget`, `staticSpr`, `PADS2`, `LINKS`, `openLink/linkRow`, `bankMenu` hub, `SCHOOL/schoolMenu`, `elderMenu/factionMenu/FACTIONS/HEIST_STORY`, `PARTNERS/partnerTalk/partnerMenu`, `REDSTONE/oracle/refreshOracle/oracleRow` | D-024 |
| P4 live | First Chikyū deploy (`DogeItems` + `DogeDEX`) + creator referral links on Noah & Bitget NPCs | `CONTRACTS['0x5fdaf3']`, `LINKS.noah`, `LINKS.bitgetShare` | D-025, D-026 |
| P5 IT-1..3 | **Factions of the Heist**: `DogeProfession.sol` (one class/wallet, paid `choose`), 3 faction trainers in camp (`PADS3`), WARRIOR/ARCHER/HEALER passive stats + `GROUND POUND`/`QUICK SHOT`/`MEND` skills | `contracts/src/DogeProfession.sol`; `SPR.tWarrior/tArcher/tHealer`, `CLASSES`, `classOf/classSpd/classDmg/classArmor`, `chooseProfession`, `professorTalk/professorMenu`, `useSkill/groundPound/quickShot/mend` | D-027, D-028, D-029 |
| P5 IT-4..6 | **On-chain DOGE Staking + 1% DEX Fee Split**: `DogeStaking.sol` (MasterChef), `DogeDEX` 1% protocol fee (0.2% project / 0.8% stakers, outside reserves), `stakeMenu()` in Sphinx UI, full 4-contract redeploy live on Chikyū | `contracts/src/DogeStaking.sol`, `DogeDEX._protoSplit/_accrueProto/flushStakerFees`; `stakeDoge/unstakeStake/claimStakeRewards/syncDexFees`, `stakeMenu`, `CONTRACTS['0x5fdaf3']` | D-030, D-031, D-032 |
| P5 clean | Finishing pass: dead code removal (`solidFor` duplicate check I-9, `ITEM_ICONS`, `SEL.poolTvlUsd`) | `solidFor()`, `MAT_ICONS`, `SEL` | D-033 |
| P5 meta | **Analyzer Prompt Master & Rule #0 Gate + Solidity/Web3/Browser Skills**: pre-decision analyzer prompt (`prompts/ANALYZER_PROMPT_MASTER.md`), `AGENTS.md` workspace rule file, `find-skills`, `agent-browser`, `avalanche-skills` + `avax-*` EVM/Audit/Security skill packs | `prompts/ANALYZER_PROMPT_MASTER.md`, `AGENTS.md`, `CLAUDE.md`, `prompts/SESSION_PROMPT.md`, `.claude/skills/`, `.agents/skills/` | D-034 |
| P5 audit | **Audit Hardening & 100% Web3 Action Test Coverage**: `chainChanged` reload (G-1), Sphinx/STAKE live-testnet copy (G-2), boss minion aggro range (I-3), `spawnEnemy` ≥200 px (I-4), title particles `dt` (I-5), `AudioContext` gesture resume (I-8), and full Phase 5 Web3 test scenario (G-7) | `hookWallet()`, `talk()`, `SCHOOL`, `updEnemy()`, `spawnEnemy()`, `update()`, `drawTitle()`; `tests/sim.mjs` D-035 scenarios | D-035 |
| P5 ux | **BarkSwap-Styled Pool DEX, Distinct Class Mechanics, Starter Bag Materials (`WOOD`/`STONE`), Wallet Minted Items Balance & Mouse UX**: `marketMenu` (`BARKSWAP POOL DEX: MINT, SWAP & LP`, `ui.barkswap=true`) with Row-0 `MINT < ITEM > NFT`, Row-1 `WALLET ITEMS (N)` balance, and `CREATE POOL` / `SWAP` / `ADD LP` on `DogeDEX`; Archer `Space` basic arrow (`0 MP`) + 3-arrow volley (`K`/`Q`); Healer weak melee (`+2 MP` on hit) + `-15` HP + fast speed + `MEND`; Warrior `+25` HP + `+15%` armor + wider cleave; hero sprite transform; starter `WOOD x3` + `STONE x3` bag minting; Row-0 staking; and mouse controls | `CLASSES`, `applyClass/syncMaxHp`, `attack()`, `quickShot()`, `drawWorld()`, `drawSlash()`, `MINTABLE`, `marketMenu()`, `stakeMenu()`, `drawUI()`, `cvPos()` | D-036 |
