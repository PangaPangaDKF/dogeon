# DOGEON ("The Grand Heist") — Master Prompt, GitHub Repo Map & DogeOS Solidity Architecture Guide

> **How to use this file with TryNoah AI (or any AI coding tool):**
> 1. **Import or link the GitHub repository** AND **paste this file as the guiding prompt**:
>    - **Direct GitHub Import:** Point TryNoah AI (or Claude/Cursor) at your GitHub repository URL (`https://github.com/<user>/<repo>`).
>    - **Single-File Repo Digest (`GitIngest` / `Repomix` pattern):** Replace `github.com` with `gitingest.com` in the repo URL (or run `npx repomix --ignore "contracts/lib/**,contracts/cache/**,contracts/out/**,tests/out/**"`) to pack the entire repo alongside this prompt.
> 2. **Mode A — Exact Replica (Recommended for live hosting):** Serve [`index.html`](./index.html) byte-for-byte over `http(s)://` with zero build step (see [`prompts/TRYNOAH_RECREATE.md`](./prompts/TRYNOAH_RECREATE.md) §1). The 4 DogeOS Chikyū contracts are already deployed and live.
> 3. **Mode B — Blueprint Rebuild / Extension:** Follow the **8-Step Developer Execution Flow (§0)**, the **GitHub Repo & 18-Section Map (§1)**, the **DogeOS Solidity Architecture Guide (§2)**, the **Live ABI Registry (§3)**, and the **Gameplay/DEX Spec (§4)** below, then verify against [`docs/RECREATION_MANIFEST.md`](./docs/RECREATION_MANIFEST.md).

---

## 0. STACK & CHAIN LOCK + 8-STEP DEVELOPER EXECUTION FLOW

### A. Non-Negotiable Chain & Language Lock (READ FIRST)
- **Target Blockchain:** **DogeOS Chikyū Testnet** — an **EVM Layer-2** powered by native `DOGE` (`18` decimals).
  - `chainId`: **`0x5fdaf3`** (decimal **`6281971`**)
  - RPC: `https://rpc.testnet.dogeos.com`
  - Explorer: `https://dogeos-testnet.l2scan.co`
  - Faucet: `https://faucet.testnet.dogeos.com`
- **Smart Contract Stack:** **100% EVM Solidity `^0.8.24`** (Foundry `forge`, OpenZeppelin Contracts `v5.1`).
- **CRITICAL NEGATIVE CONSTRAINT:** **NEVER generate Rust, Anchor, `Cargo.toml`, `@solana/web3.js`, or Solana programs.** DOGEON is strictly an **EVM Solidity + EIP-1193 (`window.ethereum`)** application on DogeOS.
- **Single-File Zero-Dependency Frontend (`index.html` < 1,500 lines):**
  - Native resolution `<canvas id="c" width="320" height="224">` with `image-rendering: pixelated` and integer CSS scaling.
  - **FORBIDDEN in `index.html`:** `alert(`, `confirm(`, `prompt(`, `fetch(`, `XMLHttpRequest`, `import(`, external `<script src>`, `<link href>`, external images, fonts, or audio files (`WebSocket` is allowed ONLY inside §15 `MULTIPLAYER` when `?mp=` is present).
- **Offline-First & Instant Wallet Popup (`chainAct`):**
  - Touch `window.ethereum || window.bitkeep?.ethereum` ONLY after the player clicks `CONNECT WALLET`.
  - Every Web3 menu/action must degrade cleanly when offline (`!chainReady()`).
  - Inside `chainAct(done, fn)`, NEVER `await refreshChain()` before `await fn()`. Call `await fn()` immediately on the user gesture so MetaMask/Bitget opens without popup-blocker delay.

### B. 8-Step Expert Developer Execution Flow (Dependency Order)
When cloning, rebuilding, or extending this repository, execute strictly in this dependency order:

| Step | Layer | Files & `index.html` Sections | Key Deliverable & Acceptance Gate |
| :--- | :--- | :--- | :--- |
| **Step 0** | **Hard Constraints** | [`AGENTS.md`](./AGENTS.md), [`docs/LESSONS.md`](./docs/LESSONS.md) | Lock DogeOS EVM (`0x5fdaf3`), `< 1,500` lines in `index.html`, zero external deps, forbidden-API gate. |
| **Step 1** | **DogeOS Solidity Contracts** | `contracts/src/*.sol`, `contracts/script/Deploy.s.sol` (§2) | Compile/reuse in order: `IPriceFeed` → `DogeItems` → `DogeStaking` → `DogeDEX` → `DogeProfession`. Pass `forge test` (`45/45`). |
| **Step 2** | **Engine Core, Audio, Input & Font** | `index.html` §1 `CORE` · §2 `AUDIO` · §3 `INPUT` · §4 `PIXEL FONT 3x5` (§4.1) | Boot `320×224` canvas, lazy `AudioContext` (`sfx`), keyboard + mouse hit-testing (`cvPos`), 3×5 uppercase bitmap `FONT`. |
| **Step 3** | **Dogecoin Art, Tiles & Seeded Map** | `index.html` §5 `CHARACTER SPRITES` · §6 `TILES` · §7 `MAP` + [`docs/ART_STYLE.md`](./docs/ART_STYLE.md) (§4.2–4.3) | Build `16×20` Shiba/Cat/Partner sprites, `16×16` tiles (`T`), `96×96` camp DOGE coin `MOSAIC`, `80×60` map (`mulberry(4242)`), 9 camp `PADS`, dungeon, 5 ponds. |
| **Step 4** | **Game State, 3 Classes, Combat & AI** | `index.html` §8 `GAME STATE` · §9 `COLLISION` · §10 `FX` · §11 `COMBAT` · §12 `ENEMY AI` (§4.4) | Starter bag (`WOOD x3`, `STONE x3`), 12-slot `BAG_SIZE`, 3 distinct classes (`WARRIOR`, `ARCHER`, `HEALER`), 8 enemy types (`ETYPES`), fishing, `MARKET`. |
| **Step 5** | **DogeOS EIP-1193 Web3 Layer** | `index.html` §13 `CHAIN` (§3) | Wire `CHAIN`, `CONTRACTS['0x5fdaf3']`, `REDSTONE`, all 30 4-byte `SEL` selectors, raw 32-byte ABI helpers (`W32`, `A32`, `words`, `arrAt`), and 21 on-chain actions. |
| **Step 6** | **UI Menus & DOGEON Pool DEX** | `index.html` §14 `UI` (§4.5) | Build all 11 menus (`marketMenu` with `ui.pooldex=true`, LP share & price impact, `invMenu` with `ON-CHAIN ITEMS`, `stakeMenu`, `bankMenu`, `shopMenu`, `professorMenu`, etc.). |
| **Step 7** | **Opt-In Multiplayer, HUD & Loop** | `index.html` §15 `MULTIPLAYER` · §16 `UPDATE` · §17 `RENDER` · §18 `LOOP` + `server/relay.mjs` (§4.6) | Keep `netTick(dt)` in `update()` and `netDraw(list,ox,oy)` in `drawWorld()`, `hudTag()` class/MP indicator in `drawHUD()`, and 60 FPS loop. |
| **Step 8** | **6-Stage Verification Gate** | `tests/check.sh`, `scripts/trynoah-manifest.mjs` | Run `bash tests/check.sh` (static + syntax + sim + forge + manifest drift guard + relay) → **ALL CHECKS PASSED**. |

---

## 1. COMPLETE GITHUB REPOSITORY MAP & `index.html` 18-SECTION INDEX

### A. Repository File Map
```text
index.html                         # Complete 16-bit RPG + DOGEON Pool DEX + DogeOS EIP-1193 client (~1,316 lines, 0 external deps)
contracts/                         # Foundry project (Solidity ^0.8.24, OpenZeppelin v5.1, EVM Paris)
  foundry.toml                     # RPC endpoints: chikyu = https://rpc.testnet.dogeos.com, local = http://127.0.0.1:8545
  apply-deployment.mjs             # Copies contracts/deployments/<chainId>.json addresses into index.html CONTRACTS
  script/Deploy.s.sol              # Deploys DogeItems -> DogeStaking -> DogeDEX -> DogeProfession in dependency order
  src/
    IPriceFeed.sol                 # Chainlink AggregatorV3-compatible interface for RedStone DOGE/USD feed (8 decimals)
    DogeItems.sol                  # ERC721Enumerable items (1=HAMMER..6=MOON_BISCUIT), 0.1 DOGE mintFee, packed inventoryOf, SVG tokenURI
    DogeStaking.sol                # MasterChef (PREC=1e12) native DOGE staking vault receiving 0.8% of DogeDEX trades
    DogeDEX.sol                    # Fixed-price NFT listings + constant-product (x*y=k) NFT/DOGE AMM pools + 1% protocol fee (0.2%/0.8%)
    DogeProfession.sol             # Immutable 1-class-per-wallet oath registry (1=WARRIOR, 2=ARCHER, 3=HEALER), 0.05 DOGE fee
    mocks/MockPriceFeed.sol        # Local Anvil mock price feed for deterministic Foundry tests
  test/
    DogeItems.t.sol                # Unit + fuzz tests for minting, burning, packed inventoryOf, SVG tokenURI, fee withdrawal
    DogeDEX.t.sol                  # Unit + fuzz tests for listings, x*y=k pools, 2% LP fee, 1% protocol split (20/80), slippage, oracle
    DogeProfession.t.sol           # Unit tests for 1-class-per-wallet lock, roster counts, treasury pull-payment
    DogeStaking.t.sol              # Unit + fuzz tests for stake/unstake/claim, residual orphan rewards, DEX -> Staking E2E fee flow
server/
  relay.mjs                        # Zero-dependency Node.js HTTP static server + native WebSocket multiplayer relay (:8787)
scripts/
  trynoah-manifest.mjs             # Generates docs/RECREATION_MANIFEST.md (--out) & verifies prompt/code parity (--verify)
  e2e-chikyu.sh                    # Live DogeOS Chikyu on-chain E2E test of the full DeFi loop (17/17 PASS)
  browser-smoke.sh                 # Real-Chrome smoke test via agent-browser (single-player + 3-player multiplayer, 11/11 PASS)
  publish-github.sh                # Secret-gated one-command GitHub publisher
tests/
  check.sh                         # 6-stage release gate: static rules + syntax + sim.mjs + forge test + manifest verify + relay.mjs
  sim.mjs                          # Deterministic headless VM simulation (32 scenarios, ~120 assertions, mockEth() Web3 E2E)
  relay.mjs                        # Real WebSocket 3-player multiplayer relay test (room isolation, anti-spoof, cap, TTL)
  serve.mjs                        # Lightweight localhost HTTP server for wallet testing
  sprites.mjs                      # Renders all procedural sprites to PNG for visual inspection
docs/
  ART_STYLE.md                     # Exact measured Dogecoin hex palettes, 16x10 Shiba head template, and 96x96 DOGE coin recipe
  RECREATION_MANIFEST.md           # Auto-generated completeness contract (never hand-edit; regenerate via trynoah-manifest.mjs)
  DECISIONS.md                     # Architectural decision ledger (D-001..D-042)
  LESSONS.md                       # Shared error -> rule -> machine-gate ledger (L-001..L-027)
prompts/
  TRYNOAH_RECREATE.md              # Step-by-step TryNoah deployment runbook (Path A exact replica vs Path B blueprint rebuild)
  ANALYZER_PROMPT_MASTER.md        # Pre-decision diagnostic checklist (RULE #0)
```

### B. Exact 18-Section Map of `index.html`
Every section in [`index.html`](./index.html) is marked by `// ================= SECTION_NAME =================` in this exact order:

| # | Section Marker (`index.html`) | Approx Lines | Key Symbols & Owned Responsibilities |
| :--- | :--- | :--- | :--- |
| **1** | `CORE` | `L18–47` | `W=320`, `H=224`, `HUD_H=18`, `<canvas id="c">`, integer `fit()`, seeded PRNG `mulberry(4242)`, math helpers (`clamp`, `dist`). |
| **2** | `AUDIO` | `L48–51` | Lazy WebAudio `AudioContext` (`AC`), `sfx(freq, dur, type, vol, slide)`, `noise(dur, vol)`. |
| **3** | `INPUT` | `L52–59` | Keyboard state (`keys`, `just`, `kp`), `AudioContext` gesture resume, mouse-to-canvas `cvPos(e)` hit-testing (`click`, `mousemove`, `wheel`). |
| **4** | `PIXEL FONT 3x5` | `L60–68` | `FONT` 3×5 bitmask glyph table (`A-Z`, `0-9`, symbols), `text(str,x,y,col,scale)`, `textC(str,x,y,col,scale)`. |
| **5** | `CHARACTER SPRITES` | `L69–266` | `basePal`, `catPal`, `HEAD.dog`, `HEAD.cat`, `TOP`, `LEGS`, `buildChar()`, `staticSpr()`, `SPR` (`hero`, `tWarrior`, `tArcher`, `tHealer`, 6 NPCs, 8 enemies), icons (`WHISK`, `COIN`, `WOOD_IC`, `STONE_IC`, `FOOD_IC`). |
| **6** | `TILES` | `L267–302` | `T` (`GRASS:0..PAD:17`), `SOLID` set, procedural 16×16 `TL` tile canvases, 96×96 camp Dogecoin `MOSAIC`. |
| **7** | `MAP` | `L303–366` | `MW=80`, `MH=60`, `CAMP`, `CX=40`, `CY=34`, `FY=38`, `MOS_Y=33`, `DUN`, `GATE_ROW=9`, `PADS`/`PADS2`/`PADS3`, `PONDS_EXTRA`, `genMap()`, `inCampT()`, `playerInCamp()`. |
| **8** | `GAME STATE` | `L367–488` | `CLASSES` (`warrior`, `archer`, `healer`), `SKILL_MP`, `classOf()`, `syncMaxHp()`, `applyClass()`, `FOODS`, `MAT_TYPES`, `BAG_SIZE=12`, `addToBag/bagCount/bagRemove`, `SKILL_THRESH`, `MARKET`/`updMarket`, `ETYPES`, `NPCS`, `newGame()`, `spawnEnemy()`, `startFish/updFish()`. |
| **9** | `COLLISION` | `L489–509` | `solidFor(tx,ty,ent)` (blocks enemies from entering camp), `hitBox()`, `moveEnt(ent,vx,vy,dt)`. |
| **10** | `FX` | `L510–515` | Floating combat text (`addFloat`), particles (`burst`, `updateParts`), screen shake (`shake`). |
| **11** | `COMBAT` | `L516–587` | Gear helpers (`nftBest`, `swordLv`, `armorLv`, `playerDmg`, `playerArmor`), `attack()` (Warrior cleave / Archer ranged arrow / Healer MP-restoring staff), `useSkill()` (`groundPound`, `quickShot`, `mend`, `bark`), `hurtEnemy()`, `hurtPlayer()`, `killEnemy()`. |
| **12** | `ENEMY AI` | `L588–619` | `updEnemy(e,dt)` (Alley/Archer/Frog/Ninja/Bull/Knight/Brute/Boss behaviors, boss 8-way bone storm & room-leashed minions). |
| **13** | `CHAIN (DogeOS Chikyu testnet, EIP-1193, no library)` | `L620–812` | `LINKS`, `CHAIN`, `CONTRACTS`, `REDSTONE`, `SEL` (30 selectors), ABI helpers (`W32`, `A32`, `words`, `arrAt`, `toWei`, `fromWei`, `unpack`, `keyOfIt`), `wallet`, `chainData`, `connectWallet`, `switchChain`, `disconnectWallet`, `refreshChain`, `chainAct`, and 21 on-chain actions + `marketMenu()` + `stakeMenu()`. |
| **14** | `UI (dialog / menus)` | `L813–1038` | `RECIPES`, `MINTABLE`, `openDialog`, `openMenu`, `uiAct`, `professorMenu`, `shopMenu`, `SCHOOL`/`schoolMenu`, `bankMenu`, `FACTIONS`/`HEIST_STORY`/`factionMenu`/`elderMenu`, `PARTNERS`/`partnerMenu`, `invMenu`, `updateUI`. |
| **15** | `MULTIPLAYER (opt-in, D-040)` | `L1039–1076` | Opt-in `?mp=ws(s)://...` ghost sync (`NET_URL`, `NET_ROOM`, `NET_HZ=10`, `NET_TTL=5`, `NET_MAX=8`, `net`, `netConnect`, `netSend`, `netOnMsg`, `netTick`, `netDraw`). Only section allowed to reference `WebSocket`. |
| **16** | `UPDATE` | `L1077–1145` | Main `update(dt)` simulation step: title particles, `updMarket(dt)`, `netTick(dt)` hook, menu/dialog pause, player movement, rest/regen, fishing, projectiles, pickups, death/respawn. |
| **17** | `RENDER` | `L1146–1302` | Pure rendering (`render()`, `drawWorld()`, `netDraw(list,ox,oy)` hook, `drawSlash()`, `drawFishing()`, `hudTag()`, `drawHUD()`, `drawUI()` with DOGEON Pool DEX card styling, `drawTitle()`, `drawWin()`). |
| **18** | `LOOP` | `L1303–1316` | `newGame()`, `requestAnimationFrame(loop)`, and `window.__DOGEON` test harness hook. |

---

## 2. DOGEOS SOLIDITY (`^0.8.24`) ARCHITECTURE GUIDE & ON-CHAIN DATA FLOW

### A. On-Chain Architecture & Value Flow Diagram (DogeOS Chikyū `0x5fdaf3`)
```text
                        ┌──────────────────────────────────────────────────────┐
                        │        PLAYER WALLET (MetaMask / Bitget Wallet)      │
                        │        DogeOS Chikyu Testnet (chainId: 0x5fdaf3)     │
                        └──────┬───────────────────┬────────────────────┬──────┘
                               │                   │                    │
       1. Mint / Burn Items    │   2. Trade & LP   │  3. Choose Class   │ 4. Stake DOGE
          (0.1 DOGE exact)     │  (NFTs + DOGE)    │  (0.05 DOGE exact) │ & Claim Rewards
                               ▼                   ▼                    ▼
                     ┌─────────────────┐ ┌──────────────────┐ ┌────────────────────┐
                     │  DogeItems.sol  │◄┤   DogeDEX.sol    │ │ DogeProfession.sol │
                     │ (ERC721Enum)    │ │ Listings + x*y=k │ │ 1 Class / Wallet   │
                     └─────────────────┘ └─────────┬────────┘ └────────────────────┘
                      items: 0x2076...F62e         │            prof: 0x7AEF...C055
                                                   │
                        ┌──────────────────────────┼──────────────────────────┐
                        │ 1% Protocol Fee Split    │ RedStone Oracle View     │
                        │ (0.2% Treasury /         │ (latestRoundData 8 dec)  │
                        │  0.8% flushStakerFees()) │                          │
                        ▼                          ▼                          │
              ┌──────────────────┐       ┌────────────────────┐               │
              │ DogeStaking.sol  │       │   IPriceFeed.sol   │               │
              │ MasterChef Vault │       │ RedStone DOGE/USD  │               │
              │ (PREC = 1e12)    │       │ 0x434F...968       │               │
              └──────────────────┘       └────────────────────┘               │
               stake: 0x4a1B...12d                                            │
                        ▲                                                     │
                        └─────────────── 4. stake() / unstake() / claim() ────┘
```

### B. Solidity Security, Storage Packing & CEI Matrix (`pragma solidity ^0.8.24`)

| Contract | Inheritance | Storage / Bit-Packing Pattern | Security & Payment Pattern | Custom Errors |
| :--- | :--- | :--- | :--- | :--- |
| **`IPriceFeed.sol`** | Interface | Stateless view (`decimals()`, `latestRoundData()`) | Read via `try/catch` in `DogeDEX.dogeUsd()` so stale/reverting feeds never revert callers | None |
| **`DogeItems.sol`** | `ERC721Enumerable`, `Ownable`, `ReentrancyGuard` | `struct Item { uint8 itemType; uint8 level; }` (2 bytes in 1 slot); `inventoryOf` packs `(id << 16) \| (type << 8) \| level` into single `uint256` words | Exact fee check (`msg.value == mintFee`); pull-fee `accruedFees` → `withdrawFees()` to `treasury`; `_safeMint` called last (CEI) | `BadItem`, `WrongFee`, `ZeroAddress`, `NothingToWithdraw`, `TransferFailed` |
| **`DogeStaking.sol`** | `ReentrancyGuard` | MasterChef `accRewardPerShare` (`PREC = 1e12`), `residual` for `totalStaked == 0` window, `staked`, `rewardDebt`, `claimable` | `_harvest` + `_setDebt` before state/value changes (CEI); `nonReentrant` on `stake`, `unstake`, `claim` | `ZeroAmount`, `NotEnoughStaked`, `TransferFailed` |
| **`DogeDEX.sol`** | `ReentrancyGuard` | `key = (uint256(itemType) << 8) \| level`; O(1) swap-and-pop `_unlist` via `_listedIdx`; `immutables` for `items`, `dogeUsdFeed`, `treasury`, `stakingPool` | Pull-payments ONLY (`proceeds[addr]` + `withdraw()`); plain `items.transferFrom` after state updates (CEI); 1% protocol fee (`0.2%` project / `0.8%` `stakerFees`) outside `x*y=k` reserve so `k` never shrinks | `ZeroPrice`, `NotListed`, `NotSeller`, `WrongPayment`, `EmptyDeposit`, `MixedPool`, `PoolMissing`, `PoolTooThin`, `NotEnoughDoge`, `NotEnoughShares`, `Slippage`, `ZeroShares`, `ZeroPayout`, `NothingToWithdraw`, `TransferFailed` |
| **`DogeProfession.sol`** | `ReentrancyGuard` | `mapping(address => uint8) professionOf` (`1..3`); `immutable fee` (`0.05 ether`) & `treasury` | One class per wallet forever (`professionOf[msg.sender] != 0` reverts); pull-payment `proceeds` → `withdraw()` | `BadProfession`, `AlreadyChosen`, `WrongFee`, `NotTreasury`, `TransferFailed` |

### C. Contract-by-Contract Specification (`contracts/src/*.sol`)

#### 1. [`contracts/src/IPriceFeed.sol`](./contracts/src/IPriceFeed.sol) (`13` lines)
- Chainlink AggregatorV3-compatible interface for RedStone's DOGE/USD push feed on DogeOS Chikyū (`0x434F8D17c0301cfEa143dba912972E24B827C968`, 8 decimals):
  - `decimals() external view returns (uint8)`
  - `latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)`

#### 2. [`contracts/src/DogeItems.sol`](./contracts/src/DogeItems.sol) (`155` lines — `ERC721Enumerable, Ownable, ReentrancyGuard`)
- **Live Address (`0x5fdaf3`):** `0x207641C60474526a353960F3967d5c412026F62e`
- **Constants & State:**
  - Item types: `HAMMER = 1` (levels `1..4`), `ARMOR = 2` (levels `1..2`), `RAW_FISH = 3` (`lv 1`), `COOKED_FISH = 4` (`lv 1`), `BONE_CHARM = 5` (`lv 1`), `MOON_BISCUIT = 6` (`lv 1`).
  - `uint256 public mintFee;` (initialized to `0.1 ether` in `constructor(uint256 fee, address treasury_)`), `address public treasury;`, `uint256 public nextId = 1;`, `uint256 public accruedFees;`, `mapping(uint256 => Item) public items;`.
- **External/Public Functions:**
  - `maxLevel(uint8 itemType) public pure returns (uint8)`
  - `mint(address to, uint8 itemType, uint8 level) external payable nonReentrant returns (uint256 tokenId)`: requires `to != address(0)`, `level >= 1 && level <= maxLevel(itemType)`, and **`msg.value == mintFee` exactly** (reverts with `WrongFee(msg.value, mintFee)` otherwise). Increments `accruedFees += msg.value` and calls `_safeMint(to, tokenId)`.
  - `burn(uint256 tokenId) external`: deletes `items[tokenId]` and burns via `_update(address(0), tokenId, _msgSender())` (used when eating/consuming food/charm NFTs in-game).
  - `inventoryOf(address owner) external view returns (uint256[] memory packed)`: returns all tokens held by `owner` in a single `eth_call`, bit-packed as **`(tokenId << 16) | (uint256(itemType) << 8) | level`** (`O(balanceOf(owner))` via `ERC721Enumerable`).
  - `withdrawFees() external nonReentrant`: permissionlessly sends `accruedFees` to `treasury`.
  - `setMintFee(uint256 fee) external onlyOwner`, `setTreasury(address t) external onlyOwner`.
  - `tokenURI(uint256 tokenId) public view override returns (string memory)`: fully on-chain base64 JSON + base64 64×64 pixel-art SVG card.

#### 3. [`contracts/src/DogeStaking.sol`](./contracts/src/DogeStaking.sol) (`116` lines — `ReentrancyGuard`)
- **Live Address (`0x5fdaf3`):** `0x4a1BF177c842bD55d933f49ee8297Ec6D190e12d`
- **State & Accumulator Math:**
  - `uint256 private constant PREC = 1e12;`
  - `totalStaked`, `accRewardPerShare`, `residual` (holds rewards that arrive when `totalStaked == 0`, folded into `accRewardPerShare` on the next stake/reward), `totalRewards`.
  - `mapping(address => uint256) public staked;`, `mapping(address => uint256) private rewardDebt;`, `mapping(address => uint256) public claimable;`.
- **External/Public Functions:**
  - `receive() external payable` and `notifyReward() external payable`: both call `_addReward(msg.value)` so `DogeDEX.flushStakerFees()` can push native DOGE directly via `stakingPool.call{value: amt}("")`.
  - `stake() external payable nonReentrant`: harvests existing rewards into `claimable[msg.sender]`, adds `msg.value` to `staked` and `totalStaked`, sets `rewardDebt` **before** folding `residual` (so the first staker receives any orphaned rewards), and emits `Staked`.
  - `unstake(uint256 amount) external nonReentrant`: harvests pending rewards into `claimable`, subtracts `amount` from `staked` and `totalStaked`, updates `rewardDebt`, and transfers `amount` DOGE to `msg.sender`.
  - `claim() external nonReentrant`: harvests pending rewards, zeroes `claimable[msg.sender]`, and sends the reward DOGE to `msg.sender` while keeping principal staked.
  - `pendingRewards(address user) external view returns (uint256)`: returns `claimable[user] + (staked[user] * accRewardPerShare) / PREC - rewardDebt[user]`.

#### 4. [`contracts/src/DogeDEX.sol`](./contracts/src/DogeDEX.sol) (`373` lines — `ReentrancyGuard`)
- **Live Address (`0x5fdaf3`):** `0xaecaABe03eA9b0b8aA0eFdD2104A445DdBbdcF10`
- **Immutables & Fee Constants:**
  - `DogeItems public immutable items;`, `IPriceFeed public immutable dogeUsdFeed;`, `address public immutable treasury;`, `address public immutable stakingPool;`.
  - `FEE_BPS = 200` (**2% LP fee** kept inside the pool reserve), `PROTO_FEE_BPS = 100` (**1% protocol fee** outside the pool curve, split into `PROJECT_BPS = 20` (**0.2% to `proceeds[treasury]`**) and `STAKER_BPS = 80` (**0.8% to `stakerFees`** — exact 1:4 ratio)), `BPS = 10_000`, `SHARES_PER_ITEM = 1e18`, `MIN_FIRST_DOGE = 0.001 ether`, `ORACLE_MAX_AGE = 1 days`.
- **Fixed-Price NFT Listings:**
  - `list(uint256 tokenId, uint256 price) external nonReentrant`: escrows NFT via `items.transferFrom(msg.sender, address(this), tokenId)`.
  - `delist(uint256 tokenId) external nonReentrant`: seller reclaims escrowed NFT.
  - `buy(uint256 tokenId) external payable nonReentrant`: requires `msg.value == l.price`; takes 1% `_accrueProto(l.price)` and credits `l.price - proto` to `proceeds[l.seller]`.
  - `listedCount() external view returns (uint256)` & `activeListings(uint256 offset, uint256 limit) external view returns (uint256[] memory packed, uint256[] memory prices, address[] memory sellers)`.
- **Constant-Product (`x * y = k`) NFT/DOGE AMM Pools (`key = (uint256(itemType) << 8) | level`):**
  - `_poolBuy(uint256 key)`: requires `y = p.ids.length >= 2` (so a pool never drains to 0 items); `cost = (p.doge + (y - 2)) / (y - 1)` (`ceil(x / (y - 1))`); returns `cost + (cost * 200) / 10000`.
  - `buyQuote(uint256 key)`: returns `pp + proj + stk` (`_poolBuy(key)` + 1% protocol fee).
  - `_poolSell(uint256 key)`: `out = p.doge / (p.ids.length + 1)` (`floor(x / (y + 1))`); returns `out - (out * 200) / 10000`.
  - `sellQuote(uint256 key)`: returns `ps - proj - stk` (`_poolSell(key)` - 1% protocol fee).
  - `addLiquidity(uint256[] calldata tokenIds, uint256 minShares) external payable nonReentrant returns (uint256 minted)`:
    - First deposit (`p.shares == 0`): requires `msg.value >= MIN_FIRST_DOGE`; `minted = n * 1e18`; `p.doge += msg.value`.
    - Subsequent deposits: `required = (n * p.doge + y - 1) / y`; `minted = (p.shares * n) / y`; requires `minted >= minShares`; refunds `msg.value - required` to `proceeds[msg.sender]`.
  - `removeLiquidity(uint256 key, uint256 amount, uint256 minItemsOut, uint256 minDogeOut) external nonReentrant`: burns `amount` shares for `nOut = (y * amount) / p.shares` items and `dogeOut = (p.doge * amount) / p.shares` DOGE (credited to `proceeds[msg.sender]`), enforcing `minItemsOut` and `minDogeOut`.
  - `buyFromPool(uint256 key) external payable nonReentrant returns (uint256 tokenId)` & `sellToPool(uint256 tokenId, uint256 minOut) external nonReentrant returns (uint256 payout)`.
  - `poolInfo(uint256 key, address who) external view returns (uint256 doge, uint256 nItems, uint256 shares, uint256 myShares, uint256 buyPrice, uint256 sellPrice)` & `allPools() external view returns (uint256[] memory keys, uint256[] memory doge, uint256[] memory nItems)`.
  - `flushStakerFees() external nonReentrant returns (uint256 amt)`: sends `stakerFees` to `stakingPool.call{value: amt}("")`.
  - `withdraw() external nonReentrant`: pull-payment withdrawal of `proceeds[msg.sender]`.
  - `dogeUsd() public view returns (uint256 price, uint256 updatedAt, bool fresh)` & `poolTvlUsd(uint256 key) external view returns (uint256)`.

#### 5. [`contracts/src/DogeProfession.sol`](./contracts/src/DogeProfession.sol) (`71` lines — `ReentrancyGuard`)
- **Live Address (`0x5fdaf3`):** `0x7AEF681331EFa8C356d27b96BC5B223a2B4FC055`
- **Constants & State:**
  - `WARRIOR = 1`, `ARCHER = 2`, `HEALER = 3`.
  - `uint256 public immutable fee;` (`0.05 ether`, selector `ddca3f43`), `address public immutable treasury;`.
  - `mapping(address => uint8) public professionOf;`, `mapping(uint8 => uint256) public countOf;`, `uint256 public totalChosen;`, `uint256 public proceeds;`.
- **External/Public Functions:**
  - `choose(uint8 profession) external payable nonReentrant`: reverts with `BadProfession()` if `< 1 || > 3`, `AlreadyChosen()` if `professionOf[msg.sender] != 0`, or `WrongFee(msg.value, fee)` if `msg.value != fee`. Permanently binds `professionOf[msg.sender] = profession`.
  - `hasProfession(address who) external view returns (bool)`
  - `roster() external view returns (uint256 warriors, uint256 archers, uint256 healers)`
  - `withdraw() external nonReentrant`: treasury pulls accumulated `proceeds`.

### C. Contract Deployment Order (`contracts/script/Deploy.s.sol`)
If deploying to a fresh chain (not needed for normal TryNoah hosting since `0x5fdaf3` is already live):
1. `items = new DogeItems(0.1 ether, treasury);`
2. `staking = new DogeStaking();` *(must exist before `DogeDEX`)*
3. `dex = new DogeDEX(items, IPriceFeed(feed), treasury, address(staking));`
4. `prof = new DogeProfession(0.05 ether, treasury);`
5. Run `node contracts/apply-deployment.mjs <chainId>` to sync `CONTRACTS` in `index.html`.

---

## 3. LIVE DOGEOS CHIKYŪ REGISTRY, 30 ABI SELECTORS (`SEL`) & EIP-1193 WIRE PROTOCOL

```js
const CHAIN={id:'0x5fdaf3',idDec:6281971,name:'DogeOS Chikyu Testnet',rpc:'https://rpc.testnet.dogeos.com',explorer:'https://dogeos-testnet.l2scan.co',faucet:'https://faucet.testnet.dogeos.com',currency:{name:'Dogecoin',symbol:'DOGE',decimals:18}};
// Support ?chain=local for Foundry Anvil: {id:'0x7a69',name:'Anvil Local (DOGEON dev)',rpc:'http://127.0.0.1:8545',explorer:''}
const CONTRACTS={
  '0x5fdaf3':{
    items:'0x207641C60474526a353960F3967d5c412026F62e',
    dex:'0xaecaABe03eA9b0b8aA0eFdD2104A445DdBbdcF10',
    prof:'0x7AEF681331EFa8C356d27b96BC5B223a2B4FC055',
    stake:'0x4a1BF177c842bD55d933f49ee8297Ec6D190e12d'
  },
  '0x7a69':{items:'0x5FbDB2315678afecb367f032d93F642f64180aa3',dex:'0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',prof:'',stake:''}
};
const REDSTONE={'0x5fdaf3':{feed:'0x434F8D17c0301cfEa143dba912972E24B827C968',adapter:'0xB08342D907D2df47B6F73e25F4fa033978B344B1'}};
const SEL={
  mint:'352926a8',burn:'42966c68',inventoryOf:'7eaebb15',mintFee:'13966db5',
  setApprovalForAll:'a22cb465',isApprovedForAll:'e985e9c5',
  list:'50fd7367',delist:'964bc33f',buy:'d96a094a',activeListings:'aa4df6f0',listedCount:'f36065b3',
  addLiquidity:'c5bb3168',removeLiquidity:'f88bf15a',buyFromPool:'66c1dbf3',sellToPool:'0de77491',
  withdraw:'3ccfd60b',dogeUsd:'435a3613',proceeds:'35adde54',allPools:'c5c63e65',poolInfo:'81ea4ee7',
  chooseProf:'f94e349d',professionOf:'31544fd8',profFee:'ddca3f43',
  stakeDoge:'3a4b66f1',unstakeDoge:'2e17de78',claimStake:'4e71d92d',pendingRewards:'31d7a262',stakedOf:'98807d84',
  flushFees:'6811406e',stakerFeesView:'67f7cf97'
};
```

### Raw Hex ABI Helpers (No ethers.js / viem)
- `W32 = n => BigInt(n).toString(16).padStart(64,'0')`
- `A32 = a => String(a).toLowerCase().replace(/^0x/,'').padStart(64,'0')`
- `words = h => { h=String(h||'0x').replace(/^0x/,''); const o=[]; for(let i=0;i+64<=h.length;i+=64) o.push(BigInt('0x'+h.slice(i,i+64))); return o; }`
- `arrAt(w, slot)`: `const off=Number(w[slot]/32n), n=Number(w[off]); return w.slice(off+1, off+1+n);`
- `toWei = d => BigInt(Math.round(d*1e4))*10n**14n`, `fromWei = w => Number(BigInt(w)/10n**14n)/1e4`
- **Bit-Packed Item Encoding:** `packed = (id << 16) | (type << 8) | level` → `unpack = p => ({id:Number(p>>16n), type:Number((p>>8n)&255n), level:Number(p&255n)})`
- **Pool Key Encoding:** `keyOfIt = it => (BigInt(it.type)<<8n) | BigInt(it.level)`
- **Item Types:** `ITEM_TYPES = {1:'HAMMER', 2:'ARMOR', 3:'RAW FISH', 4:'COOKED FISH', 5:'BONE CHARM', 6:'MOON BISCUIT'}` (`itemName = it => (ITEM_TYPES[it.type]||'ITEM') + (it.type<=2 ? ' LV'+it.level : '')`).
- **Preset DOGE Amounts:** `PRICES = [0.1, 0.25, 0.5, 1, 2, 5, 10, 25, 50]`, `LIST_PAGE = 100`, `LIST_MAX = 500`.

---

## 4. GAMEPLAY, DOGECOIN ART, 3 CLASSES, DOGEON POOL DEX & MULTIPLAYER SPECIFICATION

### 4.1 Controls, Mouse UX & WebAudio (§1–§3)
- **Keyboard:** `WASD`/Arrows move; `Space`/`J` basic attack (`attack()`); `K`/`Q` class skill (`useSkill()`); `E`/`Enter` talk/advance/execute menu row (`uiAct()`); `A`/`D` or `Left`/`Right` adjust menu value (`row.adj(-1/+1)`); `R` rest (`REST_DELAY=3`s stillness, heals `+10 HP/s` up to `REST_CAP=0.6` (60% maxHp) and `+8 MP/s` to 100% maxMp); `I`/`Tab` inventory (`invMenu()`); `F` fish (`startFish()`, `3..5`s); `Escape` close menu/dialog.
- **Mouse (`cvPos`):** Converts client coords to `320×224` space. Clicks start title/win, advance dialogs, hover/scroll/execute menu rows (`x:16..304, y:36..206`, `MENU_ROWS=13`, row height `10`px starting at `y=41`), or click `<`/`>` (`x<82` or `x>238` when `row.adj` exists).
- **Audio (`sfx`):** Lazy `AudioContext` creation; call `AC.resume()` on `keydown` and `click` when `AC.state === 'suspended'`.

### 4.2 3×5 Font, 16×16 Tiles & Exact Dogecoin Pixel Art (§4–§6 + [`docs/ART_STYLE.md`](./docs/ART_STYLE.md))
- **`FONT`:** 3×5 uppercase bitmap font with 1px black shadow (`text`, `textC`).
- **Tile IDs (`T`):** `GRASS:0, FLOWER:1, TALL:2, DIRT:3, STONE:4, WATER:5, TREE:6, ROCK:7, BUSH:8, FENCE:9, WALL:10, DFLOOR:11, GATE:12, TENT:13, FIRE:14, DOOR:15, CRYSTAL:16, PAD:17`. `SOLID = new Set([T.WATER, T.TREE, T.ROCK, T.BUSH, T.FENCE, T.WALL, T.TENT, T.FIRE, T.CRYSTAL])`.
- **Dogecoin Identity (`MOSAIC` & `SPR` — see [`docs/ART_STYLE.md`](./docs/ART_STYLE.md) for measured hex palettes):**
  - `MOSAIC`: 96×96 golden DOGE coin plaza centerpiece at `(CX*16-48, MOS_Y*16-48)` using `HEAD.dog.down` at 4× scale.
  - Shiba Heroes & Trainers: `SPR.hero` (orange `#e8922c`, cream `#fbe8c4` eyebrow dots & smile muzzle, barrel hammer), `SPR.tWarrior` (crimson `#8a1f24` + steel pauldron), `SPR.tArcher` (forest hood `#1f5a34` + bow), `SPR.tHealer` (white/blue `#e8edf4` + halo + mender staff).
  - Camp NPCs: `SPR.merchant` (Wrenchpaw), `SPR.bank` (Great Sphinx), `SPR.sage` (Elder Shibe), `SPR.clover` (Cloverheart / Relotto), `SPR.noah` (Noah AI Brain N-01), `SPR.bitget` (Bitget Wallet Card).
  - Cat Enemies: `SPR.alley`, `SPR.archer`, `SPR.frog`, `SPR.ninja`, `SPR.bull`, `SPR.knight`, `SPR.brute`, `SPR.boss` (2× scale Cat Lord).

### 4.3 Deterministic World Map (`genMap()`, `mulberry(4242)`, §7)
- **Dimensions:** `MW = 80, MH = 60` tiles (`1280×960` px).
- **Sanctuary Camp:** `CAMP = {x0:33, y0:27, x1:47, y1:41}`, center `CX = 40, CY = 34`, campfire `(CX, FY=38)`, mosaic `MOS_Y = 33`, 9 NPC `T.PAD` tiles (`PADS`, `PADS2`, `PADS3`).
- **Northern Dungeon Ruins:** `DUN = {x0:26, y0:2, x1:54, y1:17}`, boss gate row `GATE_ROW = 9` (opens after `P.bruteKills >= 3` and talking to Elder Shibe).
- **5 Fishing Ponds:** 3 base ellipses + `PONDS_EXTRA = [[54,25,3.5,2.5], [24,53,4,2.5]]` with cleared `GRASS` shore rings.

### 4.4 Starter Bag, Enemy Table & Three Distinct Professions (§8–§12)
- **Starter Player State (`newGame()`):** Starts with `wood:3, stone:3, orb:2, scrap:2, horn:2, steel:2` and `bag:[{kind:'wood',qty:3},{kind:'stone',qty:3}]` so every new player can immediately mint a Starter Hammer NFT (`mintNft(1,2,'starter')`).
- **12-Slot Bag (`BAG_SIZE = 12`):** `FOODS` (`raw_fish` +15 HP, `cooked_fish` +25 HP cooked at campfire) stack to `5`; `MAT_TYPES` stack to `20`. Death drops off-chain bag items/materials (`RESPAWN_FRAC = 0.35`); **on-chain wallet NFTs are permanent and never lost on death**.
- **Three Distinct Professions (`CLASSES`, `applyClass`, `syncMaxHp`, `attack`, `useSkill`, `drawWorld`, `drawSlash`, `hudTag`):**
  1. **`WARRIOR` (`id:1`, Demolition Dogs, Sergeant Ironpaw):** `spd:0.95`, `dmg:1.35`, `armor:0.15`, `hp:+25` (`85` Max HP). `Space`: wide melee cleave (`+4 px` reach, `1.35×` knockback, crimson/gold arc). `K`/`Q` (`groundPound()`, `12 MP`): radial AoE (`R=46`).
  2. **`ARCHER` (`id:2`, Kernel Crew, Scout Fleetwhisker):** `spd:1.25`, `dmg:1.0`, `armor:0`, `hp:0` (`60` Max HP). **`Space`: predetermined ranged basic arrow attack (`0 MP`, `atkCd=0.24`s, `speed=280`, grants `combat` XP on hit)** + wooden bow in `drawSlash()`. `K`/`Q` (`quickShot()`, `6 MP`): 3-arrow fan (`angles [-0.22, 0, 0.22]`).
  3. **`HEALER` (`id:3`, Barkitects, Mender Brighttail):** `spd:1.25`, `dmg:0.65`, `armor:0.05`, `hp:-15` (`45` Max HP). `Space`: mystic staff swing (`0.65×` dmg, **restores `+2 MP` on hit**). `K`/`Q` (`mend()`, `10 MP`): heals `Math.round(20 * skillMul(P.skills.bark, 'bark'))` HP anywhere.
- **HUD Class & Skill Cost Tag (`hudTag()` in `drawHUD()`, §17):** Displays active class + `Space` attack + `K` skill MP cost (`WARRIOR [SPC:CLEAVE K:SLAM 12MP]`, `ARCHER [SPC:ARROW K:VOLLEY 6MP]`, `HEALER [SPC:STAFF K:MEND 10MP]`, or `NO CLASS [K:BARK 10MP]`).

### 4.5 DOGEON Pool DEX (`marketMenu`), Bag Boundary (`invMenu`) & DeFi Menus (§13–§14)
- **DOGEON Pool DEX (`marketMenu(n)` at the Sphinx NPC):**
  - Title: `'DOGEON POOL DEX: MINT, SWAP & LP'`, flags `ui.chain = true; ui.pooldex = true;`.
  - Header (`drawUI`): `WALLET: <bal> DOGE` and `ITEMS: <chainData.inv.length>  STAKED: <fromWei(chainData.staked)>`.
  - **Row 0 (Direct / Starter Item Mint):** `MINT < ${itemName(mt)} > NFT (${fromWei(chainData.fee||10n**17n)} DOGE)` (`A/D` or mouse `<`/`>` cycles the 9 `MINTABLE` items; uses `'starter'` wood+stone source if available for Hammer Lv2, else mints directly on `DogeItems`).
  - **Row 1 (Wallet Minted Items Balance):** `WALLET ITEMS (${inv.length}): ${invTxt}` showing `#id ITEM` tokens in `myFree()`.
  - **Pool & Listing Rows (`DogeDEX`, all labels ≤ 50 chars):**
    - `WITHDRAW PROCEEDS: <X> DOGE` (`withdrawProceeds()`)
    - `DELIST <ITEM> #<id>` / `BUY <ITEM> #<id> FOR <X> DOGE`
    - Per active pool (`p.shares > 0n`):
      - `POOL <ITEM>: <N> ITEMS / <X> DOGE (LP <lp>%)`
      - ` SWAP <X> DOGE -> 1 <ITEM> (+<bi>%)` (`buyPool(p)`, price impact vs spot)
      - ` SWAP 1 <ITEM> -> <X> DOGE (-<si>%)` (`sellPool(mine[0], p)`, price impact vs spot)
      - ` ADD <N> ITEMS + <X> DOGE AS LP` (`addLp(ids, need, p)`, 99% `minShares` guard)
      - ` REMOVE MY LP (<lp>%)` (`removeLp(p)`, `minItems` + 99% `minDoge` guard)
    - Per unpooled wallet NFT: `SELL #<id> <ITEM> FOR < <price> > DOGE` and `CREATE POOL: <N> <ITEM> + < <amt> > DOGE`.
  - **Pool DEX Card Styling (`drawUI` when `ui.pooldex === true`):** Selected `#3a2208`/`#ffd860`; `MINT ` `#281a08`/`#ffc850`; `WALLET ITEMS` `#101838`/`#f8e090`; `POOL `/` SWAP`/`CREATE POOL` `#0c2624`/`#80f8c0`.
- **Inventory Bag vs Wallet Boundary (`invMenu()`, §14):** Always renders `ON-CHAIN ITEMS (${nfts.length}): ${nfts.length?'SAFE ON DEATH':'MINT AT SPHINX/FORGE'}` above individual `NFT #id` rows so players see that off-chain bag items drop on death while wallet NFTs are permanent on DogeOS.
- **Sphinx Staking (`stakeMenu`) & Partner NPCs (`partnerMenu`):**
  - `stakeMenu`: `STAKE < ${amt} > DOGE (EARN 0.8% FEES)`, `YOUR STAKE`, `PENDING REWARDS (CLAIM)`, `UNSTAKE ALL`, `SYNC DEX FEES TO STAKERS` (`flushStakerFees()`).
  - `PARTNERS`: Cloverheart (`relotto.app`), Noah (`trynoah.ai` — story explicitly highlights building EVM Solidity smart contracts on DogeOS powered by DOGE), Bitget Wallet Card (`web3.bitget.com`).

### 4.6 Opt-In Ghost Multiplayer (`MULTIPLAYER`, §15 + `server/relay.mjs`)
- Off by default (zero network calls without `?mp=ws(s)://host&room=&name=`).
- Uses `net*`/`NET_*` identifiers (`mp` is reserved for mana in 48 places).
- Keep the two 1-line hooks: `netTick(dt);` inside `update(dt)` (right after `updMarket(dt);`) and `netDraw(list,ox,oy);` inside `drawWorld()` (right before `list.sort(...)`).

---

## G. Canonical Subsystem Ledger (`D-014..D-042`)

| ID | Subsystem | Canonical Symbols (`index.html` / `contracts/src/`) |
|---|---|---|
| D-014..D-015 | Rest cap (60%), 12-slot bag, skill-by-use, 5 fishing ponds, field/dungeon pop | `REST_CAP`, `BAG_SIZE`, `FOODS`, `MAT_TYPES`, `addToBag/bagCount/bagRemove`, `invMenu()`, `SKILL_THRESH`, `PONDS_EXTRA`, `startFish/updFish`, `FIELD_POP/DUN_POP` |
| D-016..D-023 | EIP-1193 DogeOS Chikyū wallet, `DogeItems` + `DogeDEX`, 1-craft-1-item credits, slippage & pagination | `CHAIN`, `CONTRACTS`, `SEL`, `connectWallet/switchChain/disconnectWallet`, `DogeItems.sol`, `DogeDEX.sol`, `creditOk/takeOffChain/putBack`, `apply-deployment.mjs` |
| D-024..D-026 | Grand Heist lore, Elder factions, Partner NPCs (Relotto, Noah, Bitget), RedStone DOGE/USD oracle | `SPR.clover/noah/bitget`, `LINKS`, `bankMenu`, `SCHOOL/schoolMenu`, `FACTIONS/HEIST_STORY`, `PARTNERS`, `REDSTONE/refreshOracle/oracleRow` |
| D-027..D-033 | `DogeProfession.sol`, `DogeStaking.sol`, 1% DEX protocol fee split (0.2% / 0.8%), 4-contract Chikyū deploy | `DogeProfession.sol`, `DogeStaking.sol`, `SPR.tWarrior/tArcher/tHealer`, `CLASSES`, `chooseProfession`, `useSkill/groundPound/quickShot/mend`, `stakeMenu` |
| D-034..D-035 | Pre-decision diagnostic gate (`audit-scan.mjs`), `chainChanged` reload, 100% Web3 sim test coverage | `.agents/skills/analyzer-master/scripts/audit-scan.mjs`, `hookWallet()`, `spawnEnemy()`, `tests/sim.mjs` D-035 scenarios |
| D-036 | **DOGEON Pool DEX, Distinct Class Mechanics, Starter Bag (`WOOD`/`STONE`) Minting, Wallet Items Balance & Mouse UX** | `CLASSES`, `applyClass/syncMaxHp`, `attack()`, `quickShot()`, `drawWorld()`, `drawSlash()`, `MINTABLE`, `marketMenu()`, `stakeMenu()`, `drawUI()`, `cvPos()` |
| D-037 | **Reproducibility & release: generated recreation manifest, blueprint drift guard, dual-brain protocol, shared lessons ledger** | `scripts/trynoah-manifest.mjs` (`--out` / `--verify`), `docs/RECREATION_MANIFEST.md`, `prompts/TRYNOAH_RECREATE.md` (Path A exact vs Path B blueprint), `tests/check.sh` stage 5, `AGENTS.md` §1b, `docs/LESSONS.md`, `scripts/publish-github.sh` |
| D-038 | **GitHub Repo Map + DogeOS Solidity Architecture Guide in `MASTER_PROMPT.md`, Class TTK & MP balance proof, `invMenu` `ON-CHAIN ITEMS` clarity, DOGEON Pool DEX LP-share/price-impact rows, HUD skill MP cost (`hudTag`), & `L-021`/`L-027` gates** | `hudTag()`, `drawHUD()`, `invMenu()`, `marketMenu()`, `PARTNERS.noah`, `MASTER_PROMPT.md` §0–§4, `.agents|.claude/skills/analyzer-master/scripts/audit-scan.mjs`, `tests/sim.mjs` D-038 scenario |
| D-039 | **Dead-code removal & live on-chain E2E proof of the full DeFi loop on DogeOS Chikyū (17/17 PASS)** | `scripts/e2e-chikyu.sh`, `scripts/trynoah-manifest.mjs` (`HUD_H`), `docs/RECREATION_MANIFEST.md` |
| D-040 | **Opt-in ghost multiplayer (`?mp=ws(s)://host&room=&name=`) & zero-dep self-hostable relay** | `NET_URL/NET_ROOM/NET_HZ/NET_TTL/NET_MAX/NET_PEERS`, `net/netConnect/netTick/netDraw`, `server/relay.mjs`, `tests/relay.mjs` (stage 6) |
| D-041 | **Real-browser Chrome smoke test (single-player + 3-player multiplayer, 11/11 PASS)** | `scripts/browser-smoke.sh` (`agent-browser` CDP session + scripted WebSocket peers) |
| D-042 | **Exact Dogecoin art style record (`docs/ART_STYLE.md`) & repository weight pruning (4.30 MB → 1.42 MB, −66%)** | `docs/ART_STYLE.md` (measured hex palettes, 16×10 Shiba head template, 96×96 DOGE coin recipe), pruned non-Solidity skill packs |
