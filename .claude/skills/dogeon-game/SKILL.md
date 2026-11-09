---
name: dogeon-game
description: Full context, exact stack, live DogeOS Chikyū contract registry, ABI selectors, DOGEON Pool DEX card, and gameplay invariants for DOGEON ("The Grand Heist"), the single-file 16-bit Shiba-vs-cats Web3 Action RPG in index.html. Load before planning, designing, balancing, drawing sprites, writing Web3/Solidity integrations, or recreating the project on TryNoah AI.
---

# DOGEON — Master Game & Web3 Context Skill

Version: 2.4 (2026-11-08). Bump the version and add a line to `docs/DECISIONS.md` § Process whenever you edit this file.

**RULE #0 (Pre-Decision Analyzer Gate — THE NUMBER ONE RULE):** before taking ANY decision or editing ANY file, activate the **`analyzer-master`** skill (`.agents/skills/analyzer-master/SKILL.md` / `/analyzer-master`), run `node .agents/skills/analyzer-master/scripts/audit-scan.mjs`, answer its 4 Strategic Thinking questions, and load `references/decision-gate.md` on demand.

**RULE #1 (User — Feature Closeout & Single-Prompt Reproducibility):** after every finished feature → tests green (`bash tests/check.sh`) → `docs/DECISIONS.md` entry → improve `MASTER_PROMPT.md` + `prompts/SESSION_PROMPT.md` + this skill (so the project can be recreated on **TryNoah AI** from a single prompt with zero wasted context and zero missing implementations) → update `AGENTS.md`/`CLAUDE.md`/`CONTEXT.md` + `MASTER_PROMPT.md` §G → commit.

---

## 1. Exact Stack & Hard Constraints (Zero Context Waste)
- **Frontend (`index.html`, < 1,500 lines):** Plain HTML + inline CSS + vanilla ES2022 JS + Canvas 2D (`320×224` internal resolution, `image-rendering: pixelated`, integer scaling).
- **Zero External Dependencies:** No npm runtime packages, no ethers.js/viem/wagmi CDN, no external images/fonts/audio, no `fetch()`, `XMLHttpRequest`, `WebSocket`, `import()`, `alert()`, `confirm()`, or `prompt()`.
- **Procedural Assets:**
  - **Font:** 3×5 uppercase bitmap glyph table `FONT` (`text`, `textC`, `wrap`).
  - **Sprites:** 16×20 character sprites via `buildChar({head:HEAD.dog|cat, pal:{O,F,C,P,E,N,R,W,T,A,B,L,K}, acc(g,dir,frame)})` and `staticSpr()`. Boss draws at 2×.
  - **Tiles:** 16×16 procedural tile atlas `TL` (`MW=80, MH=60`, deterministic `mulberry(4242)` in `genMap()`).
  - **Audio:** WebAudio `sfx(freq,dur,type,vol,slide)` with `AudioContext` resumed on `click` and `keydown`.
- **Smart Contracts (`contracts/`, Foundry):** Solidity `^0.8.24` (`evm_version = "cancun"`), OpenZeppelin v5.1 (`ERC721`, `ERC721Enumerable`, `ReentrancyGuard`), 45 Foundry unit + fuzz tests (`forge test`).
- **Web3 Transport:** EIP-1193 (`window.ethereum || window.bitkeep?.ethereum`) ONLY after clicking `CONNECT WALLET`. Precomputed 4-byte selectors (`SEL`) + 32-byte hex ABI helpers (`W32`, `A32`, `words`, `arrAt`, `unpack`, `toWei`, `fromWei`).

---

## 2. Live DogeOS Chikyū Testnet Registry (`0x5fdaf3` / `6281971`)
- **RPC:** `https://rpc.testnet.dogeos.com` · **Explorer:** `https://dogeos-testnet.l2scan.co` · **Faucet:** `https://faucet.testnet.dogeos.com`
- **Deployed Game Contracts (`CONTRACTS['0x5fdaf3']`):**
  - `items` (`DogeItems.sol`, ERC721Enumerable, packed `id<<16|type<<8|level`, `0.1 DOGE` mint fee): `0xea63AF6aD560E4a84aA633E138f89F28c2D25ed4`
  - `dex` (`DogeDEX.sol`, NFT listings + `x*y=k` NFT/DOGE AMM pools, 2% LP fee + 1% protocol fee split 0.2% treasury / 0.8% stakers, pull-payment `proceeds`): `0xD381e28AC54399EfeA53DCE17D0b627883c00B6e`
  - `prof` (`DogeProfession.sol`, 1 class per wallet forever, `0.05 DOGE` fee): `0x7AEF681331EFa8C356d27b96BC5B223a2B4FC055`
  - `stake` (`DogeStaking.sol`, MasterChef `1e18` precision DOGE staking vault): `0x4a1BF177c842bD55d933f49ee8297Ec6D190e12d`
- **RedStone DOGE/USD Oracle (`REDSTONE['0x5fdaf3']`):**
  - `feed`: `0x434F8D17c0301cfEa143dba912972E24B827C968` (`0xfeaf968c`) · `adapter`: `0xB08342D907D2df47B6F73e25F4fa033978B344B1` (`0x729bfda4` + `bytes32("DOGE")` stale fallback)
- **4-Byte Selectors (`SEL`):**
  `mint:'352926a8', burn:'42966c68', inventoryOf:'7eaebb15', mintFee:'13966db5', setApprovalForAll:'a22cb465', isApprovedForAll:'e985e9c5', list:'50fd7367', delist:'964bc33f', buy:'d96a094a', activeListings:'aa4df6f0', listedCount:'f36065b3', addLiquidity:'c5bb3168', removeLiquidity:'f88bf15a', buyFromPool:'66c1dbf3', sellToPool:'0de77491', withdraw:'3ccfd60b', dogeUsd:'435a3613', proceeds:'35adde54', allPools:'c5c63e65', poolInfo:'81ea4ee7', chooseProf:'f94e349d', professionOf:'31544fd8', profFee:'ddca3f43', stakeDoge:'3a4b66f1', unstakeDoge:'2e17de78', claimStake:'4e71d92d', pendingRewards:'31d7a262', stakedOf:'98807d84', flushFees:'6811406e', stakerFeesView:'67f7cf97'`

---

## 3. Core Gameplay & Web3 Design Invariants
1. **Sanctuary Camp & Survival:** Camp (`x:33..47, y:27..41`) is 100% safe (`hurtPlayer` returns in camp; `solidFor` blocks `ent.enemy` and bone projectiles). Holding `R` in camp waits `3s` (`REST_DELAY`), then heals HP up to **60% (`REST_CAP`)** and MP to 100%. Healing above 60% requires eating fish (`RAW FISH +15`, `COOKED FISH +25`) or casting Healer `MEND` (`10 MP`).
2. **Death & Greed vs. Safety:** Death loses 50% of carried `P.doge`, all whiskers, all materials, and `P.bag`, respawning at campfire at 35% HP/MP (`RESPAWN_FRAC`). Pooled `P.bank` DOGE and on-chain NFTs/staked DOGE are never lost on death.
3. **Starter Bag & NFT Minting (`D-019`, `D-021`, `D-036`):**
   - `newGame()` starts every player with `wood:3, stone:3, orb:2, scrap:2, horn:2, steel:2` and `bag:[{kind:'wood',qty:3},{kind:'stone',qty:3}]`.
   - Players can immediately mint a `HAMMER LV2 NFT` using `1 WOOD + 1 STONE` (`mintNft(1,2,'starter')` in `invMenu` or `shopMenu`), mint crafted items via `creditOk`/`takeOffChain`/`putBack` (1 craft = 1 item, no dupes), preserve fish, or mint any item directly at Row 0 of `marketMenu()` (`MINT < ITEM > NFT (0.1 DOGE)`).
   - Owning a gear NFT = wearing it (`swordLv()`, `armorLv()`).
4. **Distinct Profession Gameplay Mechanics (`D-027..D-029`, `D-036`):**
   - `applyClass(cls, onchain)` updates `P.prof`, recalculates `P.maxHp` via `syncMaxHp()`, and transforms the hero sprite (`SPR[classOf()?.spr || 'hero']`).
   - **WARRIOR (`id:1`):** `+25` Max HP (`85` base), `+15%` armor (`0.15`), `1.35x` melee damage, `0.95x` speed, wider heavy cleave (`+4 px` reach + screen shake) on `Space`, and `GROUND POUND` AoE slam (`12 MP`) on `K`/`Q`.
   - **ARCHER (`id:2`):** `60` base Max HP, `1.25x` speed, `1.0x` damage. **Pressing `Space` (`attack()`) shoots a fast ranged ARROW (`0 MP` cost, `speed=280`, `+1` combat XP on hit) and draws a wooden bow in `drawSlash()`!** Pressing `K`/`Q` (`quickShot()`) fires a **3-arrow spread volley** (`6 MP`).
   - **HEALER (`id:3`):** `-15` Max HP (`45` base), `1.25x` speed (fast), `+5%` armor, weak melee (`0.65x`, draws glowing staff in `drawSlash()`, **restores `+2 MP` on hit**), and `MEND` (`K`/`Q`, `10 MP` → `+20 HP × bark skill`).
5. **DOGEON Pool DEX (`marketMenu`, `ui.pooldex`, `D-036`):**
   - Opened at the Sphinx NPC via `NFT MARKET: SWAP + LIQUIDITY POOLS`. Uses ONLY our game contracts (`DogeItems` + `DogeDEX`).
   - Header shows `WALLET: <bal> DOGE` and `ITEMS: <chainData.inv.length>  STAKED: <staked>`.
   - Row 0 (`MINT < ITEM > NFT (0.1 DOGE)`) mints item tokens directly (consuming `1 WOOD + 1 STONE` for starter Hammer Lv2 if in bag); Row 1 (`WALLET ITEMS (N): #id ITEM...`) shows the player's minted item tokens balance; below that are `CREATE POOL` / `POOL` / `SWAP` / `ADD LP` / `REMOVE LP` rows styled with an amber/slate/emerald card colors in `drawUI()`.
6. **Instant Wallet Popup & Mouse UX (`D-036`):**
   - `chainAct()` never awaits `refreshChain()` before `await fn()` (so MetaMask/Bitget opens immediately on click/keypress).
   - Full mouse hover/wheel/click support on canvas (`cvPos`). In `tests/sim.mjs`, always close menus with `api.press('escape'); api.step(DT);` (never `api.get().ui = null`, which only mutates the wrapper object).

---

## 4. Working Protocol (Every Session)
1. Run `node .agents/skills/analyzer-master/scripts/audit-scan.mjs` (`RULE #0`).
2. Read `CLAUDE.md`, `MASTER_PROMPT.md` §A–B, and the last 5 entries of `docs/DECISIONS.md`.
3. Make surgical diffs; keep `index.html` < 1,500 lines; put balance numbers in top-of-section tables.
4. Export any new Web3/gameplay functions in `tests/sim.mjs` `HARNESS`, add assertions, and run `bash tests/check.sh` (`ALL CHECKS PASSED`).
5. Follow `RULE #1`: log in `docs/DECISIONS.md`, update `MASTER_PROMPT.md` + this skill + `CLAUDE.md`/`CONTEXT.md`, and commit with a Conventional Commit message.
