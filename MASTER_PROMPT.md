# DOGEON ("The Grand Heist") — Zero-Waste Master Prompt for TryNoah AI

Copy this file directly into **TryNoah AI** (or any autonomous coding model) to clone the complete **DOGEON** repository (`index.html` + `contracts/src/*.sol` + `tests/*`) with zero context waste and 100% deterministic parity.

---

## 1. ROLE, REPOSITORY TREE & HARD INVARIANTS

Build **DOGEON ("The Grand Heist")**, a 16-bit Sega Genesis-style top-down Web3 Action RPG and DeFi Hub on **DogeOS Chikyū Testnet (`chainId: 0x5fdaf3` / `6281971`)**.

### Repository Layout
```text
index.html                         # Entire playable RPG + Web3 DeFi client in ONE file (< 1,500 lines, 0 external deps)
contracts/
  src/
    DogeItems.sol                  # ERC721Enumerable game items (type 1..6), 0.1 DOGE mint fee, on-chain SVG tokenURI
    DogeDEX.sol                    # Fixed-price NFT listings + constant-product (x*y=k) item/DOGE AMM pools + RedStone view
    DogeProfession.sol             # Permanent 1-class-per-wallet registry (1=WARRIOR, 2=ARCHER, 3=HEALER), 0.05 DOGE fee
    DogeStaking.sol                # MasterChef (1e18 accRewardPerShare) native DOGE staking earning 0.8% of DEX volume
tests/
  check.sh                         # Static rules + node --check + node tests/sim.mjs + forge test
  sim.mjs                          # Deterministic headless VM simulation (seed 4242) with mockEth() E2E Web3 assertions
  serve.mjs                        # Zero-dep localhost HTTP server so browser wallets inject window.ethereum
```

### Hard Invariants (NEVER VIOLATE)
1. **Single-File Zero-Dependency Frontend (`index.html` < 1,500 lines):**
   - Native resolution `<canvas id="c" width="320" height="224">` with `image-rendering: pixelated` and integer CSS scaling (`Math.max(1, Math.min(Math.floor(innerWidth/320), Math.floor(innerHeight/224)))`).
   - **FORBIDDEN in `index.html`:** `alert(`, `confirm(`, `prompt(`, `fetch(`, `XMLHttpRequest`, `import(`, external `<script src>`, `<link href>`, external images, fonts, or audio files (`WebSocket` is allowed ONLY inside the opt-in `MULTIPLAYER` section when `?mp=` is set). All graphics, fonts, maps, and sounds are procedural in JS.
2. **Strict Contract Scope:**
   - Use ONLY the 4 game contracts (`DogeItems`, `DogeDEX`, `DogeProfession`, `DogeStaking`) + the RedStone oracle (`feed` + `adapter`). Do NOT add extra contracts or external ERC-20 tokens.
3. **Offline-First Invariant:**
   - Touch `window.ethereum || window.bitkeep?.ethereum` ONLY after the player explicitly selects `CONNECT WALLET`.
   - Every Web3 feature (`chooseProfession`, `marketMenu`, `stakeMenu`, `invMenu`, `shopMenu`, `refreshOracle`) MUST work or degrade cleanly when offline (`!chainReady()`).
4. **Instant Wallet Popup (`chainAct`):**
   - Inside `chainAct(done, fn)`, NEVER `await refreshChain()` before `await fn()`. Call `await fn()` immediately using cached/default fees (`chainData.fee = 10n**17n`, `chainData.profFee = 5n*10n**16n`) so MetaMask/Bitget opens on the user gesture without delay.

---

## 2. LIVE DOGEOS CHIKYŪ TESTNET REGISTRY & ABI ENCODING

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

## 3. EXACT 12-SECTION ARCHITECTURE OF `index.html`

Structure `<script>` in `index.html` into these 12 sections in order:

### Section 1 & 2: Canvas, Input (Keyboard + Mouse) & WebAudio
- **Controls:**
  - `WASD` / Arrow keys: 4-dir movement (`dirOf(vx,vy)`).
  - `Space` / `J`: basic attack (`attack()`).
  - `K` / `Q`: class skill (`useSkill()` — `GROUND POUND`, `ARROW VOLLEY`, `MEND`, or default `bark()` `WOW` wave if no class).
  - `E` / `Enter`: talk to nearby NPC / advance dialog / execute selected menu row (`uiAct()`).
  - `A` / `D` or `Left` / `Right` inside menus: adjust row value (`row.adj(-1)` / `row.adj(1)`).
  - `R`: rest (`P.resting = true`; heals after `REST_DELAY = 3`s of stillness at `+10 HP/s` up to `REST_CAP = 0.6` (60% maxHp) and `+8 MP/s` up to 100% maxMp).
  - `I` / `Tab`: toggle 12-slot inventory menu (`invMenu()`).
  - `F`: cast fishing line (`startFish()`) when standing still facing a `T.WATER` tile (`FISH_MIN=3..FISH_MAX=5`s divided by fishing skill multiplier).
  - `Escape`: close active menu or dialog.
  - **Mouse (`cvPos`):** Convert client coordinates to `320×224` canvas space. On title/win screen, click starts/restarts. In dialogs, click advances. In menus (`x:16..304, y:36..206`, `MENU_ROWS=13`, row height `10`px starting at `y=41`), `mousemove` selects the hovered row, `wheel` scrolls `ui.sel`, clicking `<`/`>` (`x<82` or `x>238` when `row.adj` exists) calls `row.adj(-1/+1)`, and clicking a row executes `uiAct()`.
- **Audio (`sfx(freq, dur, type='square', vol=0.05, slide=0)`):** Lazy `AudioContext` creation; call `ac.resume()` on both `keydown` and `mousedown` when `ac.state === 'suspended'`.

### Section 3, 4 & 5: 3×5 Bitmap Font, 16×16 Tile Atlas & 16×20 Sprites
- **`FONT`:** 3×5 bitmask table for `A-Z`, `0-9`, and punctuation `. , ! ? : - + / ( ) ' $ % # ^ < > [ ] |`. Render with `text(str, x, y, col='#fff', scale=1)` and `textC(str, y, col, scale)`.
- **Tile IDs (`T`):** `GRASS:0, FLOWER:1, TALL:2, DIRT:3, STONE:4, WATER:5, TREE:6, ROCK:7, BUSH:8, FENCE:9, WALL:10, DFLOOR:11, GATE:12, TENT:13, FIRE:14, DOOR:15, CRYSTAL:16, PAD:17`. `SOLID = new Set([T.WATER, T.TREE, T.ROCK, T.BUSH, T.FENCE, T.WALL, T.TENT, T.FIRE, T.CRYSTAL])`.
- **`MOSAIC`:** 96×96 golden coin floor mosaic rendered at `(CX*16-48, MOS_Y*16-48)` inside the camp using `HEAD.dog.down` at 4× scale.
- **Character Sprites (`SPR`):** Built via `buildChar({head, pal, acc})` (`[down0, down1, up0, up1, side0, side1]` + mirrored left frames) or `staticSpr(rows, pal)`:
  - Player & Class Sprites: `SPR.hero`, `SPR.tWarrior` (crimson helm + heavy pauldrons), `SPR.tArcher` (forest hood + quiver/feather), `SPR.tHealer` (teal mystic hood + cyan staff orb).
  - Camp NPCs: `SPR.merchant` (Wrenchpaw), `SPR.bank` (Great Sphinx), `SPR.sage` (Elder Shibe), `SPR.clover` (Cloverheart / Relotto), `SPR.noah` (Noah AI Brain N-01), `SPR.bitget` (Bitget Wallet Card).
  - Enemies: `SPR.alley`, `SPR.archer`, `SPR.frog`, `SPR.ninja`, `SPR.bull`, `SPR.knight`, `SPR.brute`, `SPR.boss` (24×28 Cat Lord).

### Section 6: Deterministic Map Generation (`genMap()`, `mulberry(4242)`)
- **Dimensions:** `MW = 80, MH = 60` tiles (`1280×960` px).
- **Sanctuary Camp:** `CAMP = {x0:33, y0:27, x1:47, y1:41}`, center `CX = 40, CY = 34`, campfire brazier at `(CX, FY=38)`, mosaic center `MOS_Y = 33`. 3-tile-wide cardinal gates flanked by `T.DOOR`, corner `T.TENT`s, 4 `T.CRYSTAL`s, and 9 `T.PAD` tiles:
  - `PADS = [[40,29], [36,34], [44,34]]` (Sphinx N, Elder W, Wrenchpaw E)
  - `PADS2 = [[37,38], [43,38], [43,31]]` (Cloverheart, Noah, Bitget Card)
  - `PADS3 = [[36,40], [44,40], [40,31]]` (Warrior trainer SW, Archer trainer SE, Healer trainer N)
- **Northern Dungeon Ruins:** `DUN = {x0:26, y0:2, x1:54, y1:17}`, boss gate row `GATE_ROW = 9` (`T.GATE` at `Math.abs(x-CX)<=1`, opens after `P.bruteKills >= 3` and talking to Elder Shibe).
- **5 Fishing Ponds:** 3 base ellipses `(64,44,7,4.5)`, `(13,46,4.5,3.2)`, `(12,14,3.5,3)` + 2 post-vegetation ponds `PONDS_EXTRA = [[54,25,3.5,2.5], [24,53,4,2.5]]` with cleared `GRASS` shore rings (`d < 2.2`).

### Section 7 & 8: Game State, Starter Bag, Classes, Combat & Market Simulation
- **Starter Player State (`newGame()`):**
  ```js
  P={x:CX*16+8,y:(CY+3)*16+8,hw:5,hh:4,dir:'down',anim:0,moving:false,
     hp:60,maxHp:60,mp:30,maxMp:30,doge:0,bank:0,whisk:0,
     wood:3,stone:3,orb:2,scrap:2,horn:2,steel:2,
     sword:1,armor:0,hpUps:0,mpUps:0,iT:0,atkT:0,atkCd:0,kbx:0,kby:0,
     resting:false,dead:false,deathT:0,kills:0,bruteKills:0,
     bag:[{kind:'wood',qty:3},{kind:'stone',qty:3}],
     skills:{combat:0,fishing:0,bark:0},fishing:false,fishT:0,credits:{},faction:null,prof:null};
  ```
- **12-Slot Bag (`BAG_SIZE = 12`):** `FOODS = {raw_fish:{name:'RAW FISH',heal:15,col:'#80c0e0'}, cooked_fish:{name:'COOKED FISH',heal:25,col:'#f0a040'}}`. Food stacks to `5`; materials (`wood, stone, orb, scrap, horn, steel`) stack to `20` (`MAT_TYPES`). Campfire (`dist(P.x,P.y,CX*16+8,FY*16+8)<28`) cooks `raw_fish` → `cooked_fish` on `E` or from `invMenu()`.
- **Enemy Table (`ETYPES`) & Spawning:**
  - `alley` (`15 HP, 6 dmg, whisk`), `archer` (`12 HP, 5 dmg, whisk`, shoots `bone`), `frog` (`14 HP, 6 dmg, orb`, shoots `spit`), `ninja` (`18 HP, 62 spd, 8 dmg, scrap`, `+25%` spawn near ponds `NINJA_WATER={r:4,p:0.25}`), `bull` (`55 HP, 14 dmg, horn`), `knight` (`35 HP, 10 dmg, steel`), `brute` (`48 HP, 12 dmg, 3× whisk`), `boss` (`320 HP, 12 dmg`, 8-way radial bones + summons 2 `alley` minions below 50% HP that only chase when player is in `zone==='boss'`).
  - `FIELD_POP = 22`, `DUN_POP = 6`, `SPAWN_EVERY = 3`s, minimum spawn distance `dist(x,y,P.x,P.y) >= 200` px.
  - **Camp Safety:** `solidFor(tx,ty,ent)` blocks `ent.enemy && inCampT(tx,ty)`; enemy projectiles vanish on `inCampT`; `hurtPlayer()` returns immediately if `playerInCamp()`.
- **Three Distinct Professions (`CLASSES`, `applyClass`, `syncMaxHp`, `attack`, `useSkill`, `drawWorld`, `drawSlash`):**
  - `syncMaxHp()`: `base = 60 + (classOf()?.hp || 0) + P.hpUps * 15`; adjusts `P.maxHp` and `P.hp`.
  - `drawWorld()`: draws `SPR[classOf()?.spr || 'hero']` so choosing a class visibly transforms the player character.
  - **1. `WARRIOR` (`id:1`, Demolition Dogs, Sergeant Ironpaw):**
    - Stats: `spd: 0.95`, `dmg: 1.35`, `armor: 0.15`, `hp: +25` (`85` base Max HP).
    - `Space` (`attack()`): heavy melee cleave (`+4 px` reach, `1.35×` knockback, `shake(0.08)`, golden/crimson arc in `drawSlash`).
    - `K`/`Q` (`groundPound()`, `12 MP`): radial AoE (`R=46`) damaging + knocking back all nearby enemies.
  - **2. `ARCHER` (`id:2`, Kernel Crew, Scout Fleetwhisker):**
    - Stats: `spd: 1.25`, `dmg: 1.0`, `armor: 0`, `hp: 0` (`60` base Max HP).
    - **`Space` (`attack()`): predetermined ranged basic attack (`0 MP` cost, `atkCd = 0.24`s)!** Fires a fast `'arrow'` projectile (`basic: true`, `speed = 280`, grants `P.skills.combat++` on hit) and draws a wooden bow + string in `drawSlash()`.
    - `K`/`Q` (`quickShot()`, `6 MP`): fires a 3-arrow fan (`angles [-0.22, 0, 0.22]`, `speed = 300`).
  - **3. `HEALER` (`id:3`, Barkitects, Mender Brighttail):**
    - Stats: `spd: 1.25` (fast), `dmg: 0.65` (weak melee), `armor: 0.05`, `hp: -15` (`45` base Max HP).
    - `Space` (`attack()`): light mystic staff swing (`0.65×` damage, **restores `+2 MP` on hit**, draws glowing emerald/cyan staff in `drawSlash()`).
    - `K`/`Q` (`mend()`, `10 MP`): heals `Math.round(20 * skillMul(P.skills.bark, 'bark'))` HP anywhere.
- **Skill-by-Use Multipliers (`SKILL_BONUS = 0.08` per tier):**
  - `SKILL_THRESH = {combat:[0,10,25,50,100], fishing:[0,5,15,30,60], bark:[0,8,20,45,80]}`.
- **Simulated Market (`MARKET`) + RedStone Anchor:**
  - Ticks once per second (`updMarket(dt)`), mean-reverting toward `oracle.loaded ? oracle.price : 0.25`. Sentiment `mkt.sent ∈ [-1, 1]` scales enemy damage (`+50%` in bear) and player damage (`+50%` in bull).

### Section 9 & 10: Web3 Actions & BarkSwap-Styled Pool DEX (`marketMenu`)
- **Forge Recipes (`RECIPES` at Wrenchpaw `shopMenu`) & 1-Craft-1-Item Rule (`D-021`):**
  - `HAMMER LV2` (`2 STEEL + 1 SCRAP`, `nft:[1,2]`), `HAMMER LV3` (`3 STEEL + 2 HORN`, `nft:[1,3]`), `HAMMER LV4` (`5 STEEL + 3 HORN + 2 ORB`, `nft:[1,4]`), `DOGE ARMOR LV1` (`2 STEEL + 1 HORN`, `nft:[2,1]`), `DOGE ARMOR LV2` (`4 STEEL + 2 SCRAP + 2 HORN`, `nft:[2,2]`), `BONE CHARM` (`2 ORB + 1 SCRAP`, `nft:[5,1]`), `MOON BISCUIT` (`1 ORB + 1 HORN`, `nft:[6,1]`).
  - Crafting grants `P.credits['type:level']`. Minting with `src==='credit'` calls `takeOffChain(t,l)` before `etx` and only refunds (`putBack`) if `!e.sent || e.reverted`.
  - **Starter Mint (`mintNft(1, 2, 'starter')`):** Consumes `1 WOOD + 1 STONE` from `P.bag` (refunded if `!e.sent || e.reverted`), available in `invMenu()`, `shopMenu()`, and `marketMenu()` Row 0.
  - **Gear Auto-Equip:** `swordLv() = Math.max(P.sword, Math.min(4, nftBest(1)))`, `armorLv() = Math.max(P.armor, Math.min(2, nftBest(2)))`.
- **BarkSwap-Styled Pool DEX (`marketMenu(n)` at the Sphinx NPC):**
  - Title: `'BARKSWAP POOL DEX: MINT, SWAP & LP'`, flags `ui.chain = true; ui.barkswap = true;`.
  - Header (`drawUI`): `WALLET: <bal> DOGE` and `ITEMS: <chainData.inv.length>  STAKED: <fromWei(chainData.staked)>`.
  - **Row 0 (Direct / Starter Item Mint):** `MINT < ${itemName(mt)} > NFT (${fromWei(chainData.fee||10n**17n)} DOGE)` (`A/D` or mouse `<`/`>` cycles `MINTABLE`; uses `'starter'` source if `mt` is Hammer Lv2 and player has Wood+Stone, else mints directly on `DogeItems`).
  - **Row 1 (Wallet Minted Items Balance):** `WALLET ITEMS (${inv.length}): ${invTxt}` showing `#id ITEM` tokens currently in `chainData.inv`.
  - **Marketplace & Pool Rows (`DogeDEX`):**
    - `WITHDRAW PROCEEDS: <X> DOGE` (`withdrawProceeds()`, when `chainData.proceeds > 0n`)
    - `DELIST <ITEM> #<id>` (`delistNft`) / `BUY <ITEM> #<id> FOR <X> DOGE` (`buyListing`)
    - For each active pool (`p.shares > 0n`):
      - `POOL <ITEM>: <N> ITEMS / <X> DOGE`
      - ` SWAP <X> DOGE -> 1 <ITEM>` (`buyPool(p)`)
      - ` SWAP 1 <ITEM> -> <X> DOGE` (`sellPool(mine[0], p)`)
      - ` ADD <N> ITEMS + <X> DOGE AS LP` (`addLp(ids, need, p)` with `minShares = 99%` slippage guard)
      - ` REMOVE MY LP (<pct>%)` (`removeLp(p)` with `minItems` and `99% minDoge` guard)
    - For each unpooled wallet NFT:
      - `SELL #<id> <ITEM> FOR < <price> > DOGE` (`listNft(it, price)`)
      - `CREATE POOL: <N> <ITEM> + < <amt> > DOGE` (`addLp(ids, toWei(amt))`)
  - **BarkSwap Card Styling in `drawUI()` (`when ui.barkswap === true`):**
    - Selected row: `#3a2208` fill with `#ffd860` text.
    - `MINT ` row: `#281a08` fill with `#ffc850` text.
    - `WALLET ITEMS` row: `#101838` fill with `#f8e090` text.
    - `POOL ` / ` SWAP` / `CREATE POOL` rows: `#0c2624` fill with `#80f8c0` text.
- **Sphinx DeFi Hub (`bankMenu`) & Staking (`stakeMenu`):**
  - `bankMenu`: Connect/Wallet rows, `NFT MARKET: SWAP + LIQUIDITY POOLS` (`marketMenu`), `ON-CHAIN STAKING: EARN 0.8% OF DEX FEES` (`stakeMenu`), Faucet link, Camp Vault stake/unstake (`+1%`, redirects to `stakeMenu` if `P.doge===0 && wallet.connected`), Whiskers->DOGE swap (`1 whisk = 3 DOGE`), Bone Charm (`50 DOGE`), Moon Biscuit (`40 DOGE`), `oracleRow()`, `SPHINX SCHOOL: DEFI 101 LESSONS` (8 lessons), DogeOS links, `DISCONNECT WALLET`.
  - `stakeMenu`: Row 0 is `STAKE < ${amt} > DOGE (EARN 0.8% FEES)` (`stakeDoge(amt)`), followed by `YOUR STAKE`, `PENDING REWARDS (CLAIM)` (`claimStakeRewards()`), conditional `UNSTAKE ALL` (`unstakeStake()`), and conditional `SYNC DEX FEES TO STAKERS` (`syncDexFees()`).
- **Elder Heist Hub (`elderMenu`) & Partner NPCs (`partnerMenu`):**
  - Elder (`quest`): 5-page `HEIST_STORY`, 3 `FACTIONS` (`DEMOLITION DOGS`, `KERNEL CREW`, `BARKITECTS`), `JOIN <FACTION>`, and `OPEN HEIST.DOGEOS.COM`.
  - Partners: Cloverheart (`https://relotto.app/`, `https://app.relotto.app`), Noah (`https://trynoah.ai/?utm_source=ambassador&utm_medium=affiliate&utm_campaign=ambassador_program&utm_content=afft5eetm&ref=AFF-T5EETM`), Bitget Wallet Card (`https://web3.bitget.com/share/41bYlR?inviteCode=VovB4P5R`, `https://web3.bitget.com/card`).
- **Opt-In Multiplayer (`MULTIPLAYER` section, `D-040`):**
  - Off by default (zero network calls without `?mp=ws(s)://host&room=&name=`). Uses native `WebSocket` (`net*`/`NET_*` identifiers; `netTick(dt)` in `update()`, `netDraw(list,ox,oy)` in `drawWorld()`) with the zero-dep self-hostable relay `server/relay.mjs`. See [`prompts/TRYNOAH_RECREATE.md`](./prompts/TRYNOAH_RECREATE.md) §5b for protocol and deployment details.

---

## 4. SOLIDITY CONTRACTS SPECIFICATION (`contracts/src/*.sol`)

1. **`DogeItems.sol` (`ERC721Enumerable`):**
   - `uint256 public constant mintFee = 0.1 ether;`
   - `mint(address to, uint8 itemType, uint8 level) payable returns (uint256 id)`: requires `itemType ∈ 1..6`, valid `level`, `msg.value >= mintFee`; refunds excess DOGE; packs `(id << 16) | (itemType << 8) | level`.
   - `burn(uint256 id)`: owner/approved burns consumable NFT.
   - `inventoryOf(address owner) external view returns (uint256[] memory packed)`.
   - `tokenURI(uint256 id)`: returns `data:application/json;base64,...` with on-chain SVG badge.
2. **`DogeDEX.sol` (`ReentrancyGuard`, `IERC721Receiver`):**
   - Fixed-price listings: `list(uint256 id, uint256 price)`, `delist(uint256 id)`, `buy(uint256 id) payable`, `listedCount()`, `activeListings(uint256 offset, uint256 limit)`.
   - Constant-product AMM pools (`key = (uint16(itemType) << 8) | uint16(level)`):
     - `addLiquidity(uint256[] calldata ids, uint256 minShares) payable returns (uint256 mintedShares)` (`1e18` shares per item on new pool, `MIN_FIRST_DOGE = 1e12`).
     - `removeLiquidity(uint256 key, uint256 shareAmt, uint256 minItems, uint256 minDoge)`.
     - `buyFromPool(uint256 key) payable returns (uint256 id)` & `sellToPool(uint256 id, uint256 minOut)`: **2% LP fee** stays in pool reserves + **1% protocol fee** outside reserves split **20% treasury (`0.2%`) / 80% stakers (`0.8%`)**.
     - Pull-payment `proceeds[seller]` + `withdraw()`; `flushStakerFees()` forwards accrued staker fees to `DogeStaking.notifyRewardAmount{value}()` (fallback-safe if no stakers).
     - `dogeUsd() view returns (uint256 price8, uint256 updatedAt)` reads RedStone feed on Chikyū.
3. **`DogeProfession.sol`:**
   - `uint256 public constant profFee = 0.05 ether;`
   - `mapping(address => uint8) public professionOf;` (`1 = WARRIOR`, `2 = ARCHER`, `3 = HEALER`).
   - `choose(uint8 classId) external payable`: reverts with `AlreadyChosen()` if `professionOf[msg.sender] != 0` or `InvalidClass()` if `classId < 1 || classId > 3`.
4. **`DogeStaking.sol` (`ReentrancyGuard`):**
   - MasterChef accumulator `accRewardPerShare` (`1e18` precision).
   - `stake() external payable`, `unstake(uint256 amount)`, `claim()`, `notifyRewardAmount() external payable`, `pendingRewards(address user) external view returns (uint256)`.

---

## G. Canonical Subsystem Ledger (`D-014..D-041`)

| ID | Subsystem | Canonical Symbols (`index.html` / `contracts/src/`) |
|---|---|---|
| D-014..D-015 | Rest cap (60%), 12-slot bag, skill-by-use, 5 fishing ponds, field/dungeon pop | `REST_CAP`, `BAG_SIZE`, `FOODS`, `MAT_TYPES`, `addToBag/bagCount/bagRemove`, `invMenu()`, `SKILL_THRESH`, `PONDS_EXTRA`, `startFish/updFish`, `FIELD_POP/DUN_POP` |
| D-016..D-023 | EIP-1193 DogeOS Chikyū wallet, `DogeItems` + `DogeDEX`, 1-craft-1-item credits, slippage & pagination | `CHAIN`, `CONTRACTS`, `SEL`, `connectWallet/switchChain/disconnectWallet`, `DogeItems.sol`, `DogeDEX.sol`, `creditOk/takeOffChain/putBack`, `apply-deployment.mjs` |
| D-024..D-026 | Grand Heist lore, Elder factions, Partner NPCs (Relotto, Noah, Bitget), RedStone DOGE/USD oracle | `SPR.clover/noah/bitget`, `LINKS`, `bankMenu`, `SCHOOL/schoolMenu`, `FACTIONS/HEIST_STORY`, `PARTNERS`, `REDSTONE/refreshOracle/oracleRow` |
| D-027..D-033 | `DogeProfession.sol`, `DogeStaking.sol`, 1% DEX protocol fee split (0.2% / 0.8%), 4-contract Chikyū deploy | `DogeProfession.sol`, `DogeStaking.sol`, `SPR.tWarrior/tArcher/tHealer`, `CLASSES`, `chooseProfession`, `useSkill/groundPound/quickShot/mend`, `stakeMenu` |
| D-034..D-035 | Pre-decision diagnostic gate (`audit-scan.mjs`), `chainChanged` reload, 100% Web3 sim test coverage | `.agents/skills/analyzer-master/scripts/audit-scan.mjs`, `hookWallet()`, `spawnEnemy()`, `tests/sim.mjs` D-035 scenarios |
| D-036 | **BarkSwap Pool DEX, Distinct Class Mechanics, Starter Bag (`WOOD`/`STONE`) Minting, Wallet Items Balance & Mouse UX** | `CLASSES`, `applyClass/syncMaxHp`, `attack()`, `quickShot()`, `drawWorld()`, `drawSlash()`, `MINTABLE`, `marketMenu()`, `stakeMenu()`, `drawUI()`, `cvPos()` |
| D-037 | **Reproducibility & release: generated recreation manifest, blueprint drift guard, dual-brain protocol, shared lessons ledger** | `scripts/trynoah-manifest.mjs` (`--out` / `--verify`), `docs/RECREATION_MANIFEST.md`, `prompts/TRYNOAH_RECREATE.md` (Path A exact vs Path B blueprint), `tests/check.sh` stage 5, `AGENTS.md` §1b, `docs/LESSONS.md` (L-001..L-016), `scripts/publish-github.sh` |
| D-039 | **Dead-code removal & live on-chain E2E proof of the full DeFi loop on DogeOS Chikyū (17/17 PASS)** | `scripts/e2e-chikyu.sh`, `scripts/trynoah-manifest.mjs` (`HUD_H`), `docs/RECREATION_MANIFEST.md` |
| D-040 | **Opt-in ghost multiplayer (`?mp=ws(s)://host&room=&name=`) & zero-dep self-hostable relay** | `NET_URL/NET_ROOM/NET_HZ/NET_TTL/NET_MAX/NET_PEERS`, `net/netConnect/netTick/netDraw`, `server/relay.mjs`, `tests/relay.mjs` (stage 6) |
| D-041 | **Real-browser Chrome smoke test (single-player + 3-player multiplayer, 11/11 PASS)** | `scripts/browser-smoke.sh` (`agent-browser` CDP session + scripted WebSocket peers) |
