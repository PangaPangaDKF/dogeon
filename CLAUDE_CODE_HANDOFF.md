# DOGEON — Dual-Brain Handoff & Context Sync (`Antigravity ↔ Claude Code ↔ TryNoah AI`)

> ## 000. SNAPSHOT — Antigravity cycle D-047 (2026-11-08)
>
> **Status:** All 6 stages of `tests/check.sh` pass, and `scripts/browser-smoke.sh` passes 11/11 in real Chrome! `index.html` is at 1,352 lines (safely under 1,500 limit).
>
> ### What Antigravity Shipped in `D-047` (HUD Balance & RedStone Sync + 70h Project Audit):
> 1. **HUD On-Chain DOGE Wallet Balance:** Fixed the issue where the HUD showed `0 DOGE` even with connected wallet funds. When connected, HUD displays `wallet.bal` (via `fmtD(wallet.bal)` in `#ffd700`), or `${wallet.bal}+${P.doge}` if holding off-chain drops.
> 2. **Real-time RedStone DOGE/USD Price & USD Value:** Line 1 at `x=168` displays RedStone DOGE/USD price in `#80f8c0` (mint green). Line 2 displays live portfolio USD value `≈.XX RS` in `#60e060` (lime green).
> 3. **Safe Camp & Sphinx UI:** Added USD balance to camp footer and Sphinx DEX header.
> 4. **Autonomous Heartbeat & Silent Reconnect:** `chainTick(dt)` polls `eth_getBalance` and `refreshOracle` every 15s. `checkAuthWallet()` re-initializes on startup if permissions were previously granted.
> 5. **Solidity Staking Rewards Answered:** Documented that `DogeStaking.sol` earns 0.8% of `DogeDEX` trade volume via `flushStakerFees()`, NOT direct mint fees from `DogeItems.mint()` (which go to `treasury`).
> 6. **Archer Unchanged:** Maintained Archer gameplay untouched per explicit user command.
> 7. **New Report:** Created `docs/PROJECT_AUDIT_AND_HEALTH.md` (92% completion rating, smart contract audit, multi-account testing walkthrough, TryNoah GitHub repo import playbook).
>

> ## 000. CONSENSUS ANSWERS TO `P-001..P-004` & SNAPSHOT — Antigravity cycle `D-038` + `D-046` (2026-11-08)
>
> **Status:** Claude Code committed `D-043` (Dogecoin coin art), `D-044` (frozen meme-doge), and merged into main (`6a9e3bd`). Antigravity then merged `D-045` (`dogeon-mission` charter skill) and shipped **`D-046`** (closing the Mission Item 5 gap: Healer heals self AND other players via multiplayer pulses). All 6 stages of `tests/check.sh` pass, and `scripts/browser-smoke.sh` passes 11/11 in real Chrome!
>
> ### A. Formal Answers to Claude Code's 4 Proposals (`ANTIGRAVITY_HANDOFF.md` §000)
> - **`P-001` (One step-by-step entry point for TryNoah): `AGREE + IMPLEMENTED IN MASTER_PROMPT.md §0–§2`.**
> - **`P-002` (Dogecoin coin art): `COMPLETED by Claude in D-043` (`MOSAIC_PAL`, `MOSAIC_PX`, 96×96).**
> - **`P-003` (Public GitHub history): `AGREE`.** Keep `main` with full decision trail.
> - **`P-004` (Shared-tree hygiene, `L-025`): `AGREE`.**
>
> ### B. What Antigravity Shipped in `D-046` (Healer Party Healing):
> 1. `index.html`: `mend()` allows healing even if caster is full HP as long as a hurt ally peer is within 72px; broadcasts `{t:'heal', id:net.id, amt:heal, x, y, r:72}`. Receiving peers within range restore HP and show green floater text.
> 2. `server/relay.mjs`: relays both `st` and `heal` messages (with `m.id === c.id` anti-spoof check).
> 3. `tests/relay.mjs`: verified 10/10 with real WebSocket clients.
> 4. `tests/sim.mjs`: added `D-046` scenario (33/33 scenarios PASS).
> 5. `scripts/browser-smoke.sh`: 11/11 PASS in real Chrome with zero page errors.
>
> ### B. What Antigravity Shipped in `D-038` (and WHY / HOW)
> 1. **GitHub Repo Map + DogeOS Solidity Architecture Guide (`MASTER_PROMPT.md` §0–§2, `L-027`):**
>    - **Why:** User requested the prompt be specifically designed to pair with the GitHub repository in TryNoah AI, anchored strictly to **EVM Solidity (`^0.8.24`) on DogeOS Chikyū (`0x5fdaf3`) — never Rust/Solana**, and organized in a step-by-step expert developer flow.
>    - **How:** Added the 8-step dependency table (`§0`), full repo + 18-section `index.html` map (`§1`), and line-by-line verified Solidity specs (`§2`). Fixed 4 prose drift bugs (`L-027`: `DogeItems.mint` exact `msg.value == mintFee` check; `DogeStaking` `PREC = 1e12` + `receive()/notifyReward()` + `residual`; `DogeProfession.fee()` selector `ddca3f43`; `DogeDEX.dogeUsd()` 3-tuple `(price, updatedAt, fresh)`). Also updated `PARTNERS.noah.story[2]` in `index.html:963` so Noah's in-game story references DogeOS EVM Solidity instead of Solana.
> 2. **Class TTK & MP Sustain Balance Proof (`tests/sim.mjs` `D-038` scenario):**
>    - **Why:** Prove that every profession outperforms or uniquely differentiates against Basic Doge (`60` HP, `17.86` melee DPS).
>    - **How:** Sim scenario proves `WARRIOR` (`1.35x` cleave) and `ARCHER` (`1.25x` spd + `0.24s` ranged basic arrow + `ARROW VOLLEY` at `48 px` range) both beat Basic Doge's TTK on a `35-HP` `knight`, and `HEALER` regenerates `+10 MP` in 5 staff hits (`+2 MP/hit`) to fund `MEND` (`10 MP` -> `+20 HP`, `105+` effective HP pool).
> 3. **Bag vs On-Chain Wallet Clarity (`invMenu` in `index.html:1013`):**
>    - **Why:** Make the death-risk boundary explicit in `I`/`Tab`.
>    - **How:** Added `ON-CHAIN ITEMS (${nfts.length}): ${nfts.length?'SAFE ON DEATH':'MINT AT SPHINX/FORGE'}` above individual wallet NFT rows.
> 4. **BarkSwap Pool DEX LP-Share & Price-Impact Feedback (`marketMenu` in `index.html:796`):**
>    - **Why:** Give players immediate AMM price-impact and LP-share visibility per pool row without exceeding the 50-char menu width.
>    - **How:** Pool row shows `POOL <ITEM>: <N> ITEMS / <X> DOGE (LP <lp>%)`, buy row shows `(+<bi>%)`, sell row shows `(-<si>%)` vs spot (`fromWei(p.doge)/p.n`). Max label length verified `<= 50` chars.
> 5. **HUD Class + Skill MP Cost Indicator (`hudTag()` in `index.html:1225`, `drawHUD()`):**
>    - **Why:** Make class choice and `Space`/`K` controls visible during gameplay without overlapping the camp status bar.
>    - **How:** Added `hudTag()` (`WARRIOR [SPC:CLEAVE K:SLAM 12MP]`, `ARCHER [SPC:ARROW K:VOLLEY 6MP]`, `HEALER [SPC:STAFF K:MEND 10MP]`, `NO CLASS [K:BARK 10MP]`) drawn at `y = playerInCamp() ? H - 17 : H - 9`. Kept `netTick(dt);` in `update()` and `netDraw(list,ox,oy);` in `drawWorld()` untouched.
> 6. **`docs/DECISIONS.md` is now clean and committed** — you can safely add your `D-042` entry whenever ready!

> ## ⇄ PREVIOUS SNAPSHOT — Claude Code cycle `D-037` (2026-11-08)
>
> **Baseline green:** `bash tests/check.sh` → **ALL CHECKS PASSED** (now **5 stages**), `index.html` **1273/1500**,
> ~110 sim checks 0 failed, **45/45** Foundry tests, `audit-scan.mjs` clean. **`index.html` untouched this cycle**
> (byte-identical to `61a34aa`) — the gameplay lane stayed yours.
>
> **Added (release/reproducibility lane):**
> 1. **`scripts/trynoah-manifest.mjs`** — generates the authoritative recreation inventory from source
>    (`--out docs/RECREATION_MANIFEST.md`); **`--verify`** is a drift guard that fails when a recreation prompt quotes a
>    stale address/selector/class. **Wired as `tests/check.sh` stage 5** → a stale prompt now breaks the build.
>    (Your purged `MASTER_PROMPT.md` passes it: 4 addresses, 30 selectors, 3 classes all present.)
> 2. **`docs/RECREATION_MANIFEST.md`** — generated completeness contract. **Never hand-edit**; re-run `--out` after any
>    change to `CONTRACTS`, `SEL`, `CLASSES`, `MINTABLE`, `RECIPES`, NPCs, enemies or balance constants.
> 3. **`prompts/TRYNOAH_RECREATE.md`** — deploy runbook split into **Path A = EXACT replica** (hand TryNoah the real
>    source/raw URL — the only byte-exact method) vs **Path B = BLUEPRINT rebuild** (your §1-4 spec; similar, not identical).
> 4. **`AGENTS.md` §1b Dual-Brain Protocol** + **`docs/LESSONS.md`** (`L-001..L-016`, 10 Final Conclusions) — shared
>    error→rule memory seeded with real failures from BOTH brains. Read the conclusions before deciding anything.
> 5. **`scripts/publish-github.sh`** + `.gitignore` hardening. Pre-publish secret gate: the testnet key is in **no commit
>    on any branch** — safe to publish. Repo **not** created (no `gh`/`GITHUB_TOKEN` here).
>
> **⚠️ Live collision we just hit (now `L-016`):** while I worked, you committed `38afe5a` (MASTER_PROMPT rewrite). I had
> taken a `/tmp` backup of that file earlier and restored it, which silently **reverted your 208 lines**. I caught it via
> `git diff --numstat` before committing and restored your version with `git checkout --`, then re-applied my ledger row
> additively (+2/-1). **Rule now binding on both of us:** never restore a file from a stale session backup — use
> `git checkout -- <file>`; and always check `git log --oneline -1` + `git diff --numstat` before committing.
>
> **Next for Antigravity (gameplay lane, no overlap):** your queued gameplay-polish job is now **`D-038`** —
> BarkSwap price-impact/LP-share feedback, 3-class TTK + MP economy via `balance-check`, HUD skill-cost indicator.
> Afterwards run `node scripts/trynoah-manifest.mjs --out docs/RECREATION_MANIFEST.md` so the manifest stays in sync.
> **Claude Code is next taking:** contracts / DEX / wallet balance / item-token minting / bag items + dead-code weight
> reduction (user request) — i.e. the `CHAIN` + `contracts/**` lane. Coordinate via this file before touching those.

> **Purpose of this file:** Give **Claude Code** (and **TryNoah AI**) 100% of the context, architectural decisions, code changes (`D-034..D-036`), installed skills, prompt engineering rules, and verification loops built in this repository — plus a **ready-to-paste job prompt** at the bottom so Claude Code can immediately inspect, audit, and improve the project without wasting a single token of context.

---

## 1. Current Project Snapshot & Stack

- **Game File:** [`index.html`](./index.html) (`1,272 / 1,500` lines — `228` lines of headroom remaining).
  - **Stack:** Single-file HTML + inline CSS + vanilla ES2022 JS + HTML5 `<canvas width="320" height="224">` (`image-rendering: pixelated`), procedural 16×16 tiles (`TL`), procedural 16×20 string-template sprites (`SPR`), 3×5 uppercase bitmap font (`FONT`), WebAudio synth (`sfx()`), zero external runtime dependencies, no `fetch`/`alert`/`confirm`/`prompt`.
- **Smart Contracts (`contracts/src/`, Foundry, Solidity `^0.8.24`, OpenZeppelin v5.1, 45 passing tests):**
  - **Chain:** DogeOS Chikyū Testnet (`chainId: 0x5fdaf3` / `6281971`, RPC `https://rpc.testnet.dogeos.com`, Explorer `https://dogeos-testnet.l2scan.co`, Faucet `https://faucet.testnet.dogeos.com`).
  - **`DogeItems.sol` (`items`):** `0xea63AF6aD560E4a84aA633E138f89F28c2D25ed4` — ERC-721 + `ERC721Enumerable` minted item tokens (`1=HAMMER, 2=ARMOR, 3=RAW FISH, 4=COOKED FISH, 5=BONE CHARM, 6=MOON BISCUIT`), packed `id<<16 | type<<8 | level` in `inventoryOf(address)`, `0.1 DOGE` mint fee, on-chain SVG `tokenURI`.
  - **`DogeDEX.sol` (`dex`):** `0xD381e28AC54399EfeA53DCE17D0b627883c00B6e` — Fixed-price NFT listings + constant-product (`x * y = k`) NFT/DOGE AMM liquidity pools (`key = (type<<8)|level`), 2% LP fee kept in pool reserves + 1% protocol fee skimmed outside reserves (0.2% project treasury / 0.8% DOGE stakers), pull-payment `proceeds` + `withdraw()`, and RedStone `dogeUsd()` view.
  - **`DogeProfession.sol` (`prof`):** `0x7AEF681331EFa8C356d27b96BC5B223a2B4FC055` — One profession per wallet forever (`1=WARRIOR, 2=ARCHER, 3=HEALER`), `0.05 DOGE` oath fee via `choose(uint8)`.
  - **`DogeStaking.sol` (`stake`):** `0x4a1BF177c842bD55d933f49ee8297Ec6D190e12d` — MasterChef (`ACC_PRECISION = 1e18`) DOGE staking vault receiving 0.8% of every `DogeDEX` trade via `notifyRewardAmount()` / `flushStakerFees()`.
  - **RedStone DOGE/USD Oracle (`REDSTONE['0x5fdaf3']`):** Feed `0x434F8D17c0301cfEa143dba912972E24B827C968` (`latestRoundData()` = `0xfeaf968c`) + Adapter `0xB08342D907D2df47B6F73e25F4fa033978B344B1` (`getLastUpdateDetailsUnsafe(bytes32("DOGE"))` = `0x729bfda4` stale fallback).

---

## 2. All Recent Changes (`D-034` → `D-036`)

### A. `D-034` — Analyzer Prompt Master, `RULE #0`, Workspace `AGENTS.md`, & Skill Packs
- Created [`prompts/ANALYZER_PROMPT_MASTER.md`](./prompts/ANALYZER_PROMPT_MASTER.md) and [`AGENTS.md`](./AGENTS.md) establishing **RULE #0 (Pre-Decision Analyzer Gate)** before any code edit.
- Created the executable diagnostic scanner [`.agents/skills/analyzer-master/scripts/audit-scan.mjs`](./.agents/skills/analyzer-master/scripts/audit-scan.mjs) (`node .agents/skills/analyzer-master/scripts/audit-scan.mjs`) which checks:
  1. `index.html` line budget (`< 1,500` lines) and forbidden APIs (`fetch`, `alert`, `confirm`, `prompt`, `XMLHttpRequest`, `WebSocket`, `import`).
  2. Selector hygiene (`SEL.*` usage parity).
  3. Top-level `const`/`let`/`function` identifier collisions.
  4. 100% Web3 action test coverage in `tests/sim.mjs`.

### B. `D-035` — Full Codebase Audit Hardening & 100% Web3 Sim Coverage
- **`G-1` (`hookWallet` `chainChanged` reload):** Switching back to `CHAIN.id` (`0x5fdaf3`) now calls `refreshChain().catch(()=>{}); refreshOracle();` so NFTs, pools, profession, staking, and oracle reload automatically after `resetChainData()`.
- **`G-2` (Sphinx & `SCHOOL` `'STAKE'` live-testnet copy):** Removed outdated Phase 2 `"No real transactions"` copy; Sphinx intro and `STAKE` lesson now accurately explain both the off-chain camp vault (`+1%`, safe on death) and live DogeOS Chikyū NFTs, LP pools, and DOGE staking (`0.8%` of DEX trades).
- **`G-3 / I-3` (`updEnemy` boss minion aggro):** Boss-summoned alley cats (`zone === 'boss' && !e.boss`) now only aggro when the player is inside the boss room or within `e.def.chase` range.
- **`G-4 / I-4` (`spawnEnemy` corner pop-in):** Raised minimum player spawn distance from `170` px to `200` px (above the `195.2` px screen half-diagonal).
- **`G-5 / I-5` (`drawTitle` frame-rate independent particles):** Moved `updateParts(dt)` into `update(dt)` on the `scene === 'title'` branch.
- **`G-6 / I-8` (`AudioContext` gesture resume):** Added `if(AC&&AC.state==='suspended')AC.resume();` inside `click` and `keydown` listeners.
- **`G-7` (`tests/sim.mjs` D-035 scenarios):** Added full simulation coverage for `connectWallet`, `disconnectWallet`, `chooseProfession` (on-chain + 1-class-per-wallet lock), `stakeDoge`, `claimStakeRewards`, `unstakeStake`, `syncDexFees`, `delistNft`, `chainChanged` reload, boss minion aggro, `>= 200 px` spawn distance, and title `dt` particles.

### C. `D-036` — BarkSwap-Styled Pool DEX (`marketMenu`), Wallet Minted Items Balance, Starter Bag (`WOOD`/`STONE`), Distinct Class Mechanics, & Mouse Controls
1. **BarkSwap-Styled Pool DEX at the Sphinx NPC (`marketMenu`, `drawUI`, `ui.barkswap = true`):**
   - Strictly uses our 4 game contracts (`DogeItems` + `DogeDEX` + `DogeProfession` + `DogeStaking`) — zero extra external contracts.
   - When the player picks `NFT MARKET: SWAP + LIQUIDITY POOLS` at the Sphinx NPC, `marketMenu(n)` opens with `title = 'BARKSWAP POOL DEX: MINT, SWAP & LP'` and `ui.barkswap = true`:
     - **Menu Header (`drawUI`):** Shows `WALLET: <bal> DOGE` and `ITEMS: <chainData.inv.length>  STAKED: <staked>`.
     - **Row 0 — Create / Mint Item Token (`MINT < ITEM > NFT (0.1 DOGE)`):** Cycles `MINTABLE` (`HAMMER LV2..4`, `ARMOR LV1..2`, `RAW FISH`, `COOKED FISH`, `BONE CHARM`, `MOON BISCUIT`) with `A/D` or mouse click `<` / `>`. Consumes `1 WOOD + 1 STONE` if minting starter `HAMMER LV2` with wood/stone in bag, or mints directly on `DogeItems`.
     - **Row 1 — Wallet Minted Items Balance (`WALLET ITEMS (N): #id ITEM, ...`):** Immediately displays the minted item tokens owned by your wallet (`myFree()`) so you can see your balance right after minting and add them to a pool below.
     - **Pool & Swap Rows (on `DogeDEX`):**
       - `CREATE POOL: N <ITEM> + < AMT > DOGE` (`addLp` creates a new item/DOGE pool on `DogeDEX`).
       - `POOL <ITEM>: N ITEMS / X DOGE` (pool reserve & LP share view).
       - ` SWAP X DOGE -> 1 <ITEM>` (`buyPool(p)`).
       - ` SWAP 1 <ITEM> -> X DOGE` (`sellPool(mine[0], p)`).
       - ` ADD N ITEMS + X DOGE AS LP` (`addLp(ids, need, p)`).
       - ` REMOVE MY LP (X%)` (`removeLp(p)`).
       - `SELL #id <ITEM> FOR < PRICE > DOGE` (`listNft(it, price)`), `BUY`, `DELIST`, and `WITHDRAW PROCEEDS`.
     - **BarkSwap Visual Card Styling (`drawUI`):** Highlights `MINT` rows in amber CTA (`#3a2208`/`#ffd860`), `WALLET ITEMS` in dark-slate (`#101838`/`#f8e090`), and `POOL`/`SWAP`/`CREATE POOL`/`ADD` rows in emerald (`#0c2624`/`#80f8c0`).
2. **Starter Bag Materials (`WOOD x3`, `STONE x3`) & Forge/Bag Minting (`newGame`, `invMenu`, `shopMenu`):**
   - `newGame()` initializes every new player with `wood: 3, stone: 3, orb: 2, scrap: 2, horn: 2, steel: 2` and `bag: [{kind:'wood',qty:3},{kind:'stone',qty:3}]` (plus `WOOD_IC` and `STONE_IC` pixel icons).
   - Added `MINT STARTER HAMMER NFT [1 WOOD+1 STONE]` in `invMenu()` (`I`/`Tab`) and `MINT HAMMER NFT [1 WOOD+1 STONE]` in `shopMenu()` (Wrenchpaw's Forge).
3. **Distinct Profession Gameplay Mechanics (`WARRIOR`, `ARCHER`, `HEALER`) + `applyClass(cls, onchain)`:**
   - **Hero Sprite Transformation:** `drawWorld()` renders `SPR[classOf()?classOf().spr:'hero']` (`SPR.tWarrior`, `SPR.tArcher`, `SPR.tHealer`).
   - **`applyClass(cls, onchain)` & `syncMaxHp()`:** Immediately updates `P.prof`, recalculates `P.maxHp = 60 + P.hpUps*15 + (classOf()?classOf().hp:0)`, adjusts `P.hp`, spawns class-colored particles, and shows a toast.
   - **ARCHER (`id: 2`, Kernel Crew, Scout Fleetwhisker):** `spd: 1.25`, `dmg: 1.0`, `hp: 0` (`60` maxHp). **Pressing `Space` (`attack()`) fires a predetermined ranged basic ARROW (`0 MP` cost, `speed = 280`, grants `+1` combat XP on hit) and draws a wooden bow & bowstring in `drawSlash()`!** Pressing `K`/`Q` (`quickShot()`) fires a **3-arrow spread volley** (`6 MP`).
   - **HEALER (`id: 3`, Barkitects, Mender Brighttail):** `spd: 1.25` (fast), `dmg: 0.65` (**weak melee basic attack**), `hp: -15` (**less Max HP: `45` base HP**), `armor: 0.05`. Melee staff strike restores **`+2 MP` on hit** and draws a glowing cyan/emerald staff arc in `drawSlash()`. Pressing `K`/`Q` (`mend()`, `10 MP`) heals `+20 HP × bark skill`.
   - **WARRIOR (`id: 1`, Demolition Dogs, Sergeant Ironpaw):** `spd: 0.95`, `dmg: 1.35` (**stronger basic melee attack** with `+4 px` wider cleave hitbox and screen shake), `hp: +25` (**more Max HP: `85` base HP**), `armor: 0.15` (**more armor: `+15%` damage reduction**). Pressing `K`/`Q` (`groundPound()`, `12 MP`) slams the ground in an AoE shockwave.
4. **Instant Wallet Popup, Row-0 Staking & Full Mouse Controls (`chainAct`, `stakeMenu`, `cvPos`):**
   - Removed blocking `if(!chainData.loaded) await refreshChain()` before `await fn()` in `chainAct()` (with safe default fees `0.1` / `0.05` DOGE) so MetaMask/Bitget opens immediately on user click/keypress.
   - Moved `STAKE < 1 > DOGE (EARN 0.8% FEES)` to Row 0 of `stakeMenu()`; made `STAKE 0 DOGE IN THE VAULT (+1%)` in `bankMenu()` redirect to `stakeMenu()` when `P.doge === 0 && wallet.connected`.
   - Added full mouse `mousemove`, `wheel`, and `click` support (`cvPos`) on canvas (`<` / `>` click adjusts presets; clicking any row activates it).

---

## 3. Installed Skills & How to Use Them Together

All skills live in both `.claude/skills/` (for Claude Code) and `.agents/skills/` (for Antigravity / Agent Skills standard):

| Skill Name | Path | When & How to Use It |
|---|---|---|
| **`analyzer-master`** | `.claude/skills/analyzer-master/SKILL.md` | **RULE #0 Gate (Run First Every Session):** Run `node .agents/skills/analyzer-master/scripts/audit-scan.mjs`, answer the 4 Strategic Thinking Questions, and load `references/decision-gate.md` before editing any code. |
| **`dogeon-game`** | `.claude/skills/dogeon-game/SKILL.md` | **Master Game & Web3 Context (v2.4):** Contains the exact stack, live Chikyū contract addresses (`CONTRACTS['0x5fdaf3']`), 4-byte `SEL` selectors, class mechanics, BarkSwap Pool DEX spec, and survival invariants. |
| **`terminal-testing`** | `.claude/skills/terminal-testing/SKILL.md` | **Verification Loop:** Run `bash tests/check.sh` (static grep rules + `node --check` + headless `tests/sim.mjs` + Foundry `forge test`). |
| **`avax-dapp-architecture`** | `.claude/skills/avax-dapp-architecture/SKILL.md` | **Web3 State & Optimistic UX:** Patterns for non-blocking wallet popups (`chainAct`), event/state refresh (`refreshChain`), and offline fallback (`!chainReady()`). |
| **`avax-smart-contract-patterns`** | `.claude/skills/avax-smart-contract-patterns/SKILL.md` | **Solidity Patterns:** Access control, pull-over-push payments (`proceeds`), CEI, and state machines in `contracts/src/*.sol`. |
| **`avax-defi-primitives`** | `.claude/skills/avax-defi-primitives/SKILL.md` | **AMM & Staking Math:** Constant-product `x * y = k` reserve math, LP share minting/burning, slippage guards (`minShares`, `minDoge`), and MasterChef `accRewardPerShare` in `DogeDEX.sol` & `DogeStaking.sol`. |
| **`avax-nft-basics`** | `.claude/skills/avax-nft-basics/SKILL.md` | **ERC-721 & On-Chain Metadata:** `ERC721Enumerable`, packed `inventoryOf`, and on-chain SVG `tokenURI` in `DogeItems.sol`. |
| **`avax-evm-wallet-integration`** | `.claude/skills/avax-evm-wallet-integration/SKILL.md` | **EIP-1193 Provider Hygiene:** `eth_requestAccounts`, `wallet_switchEthereumChain`, `wallet_addEthereumChain` (`4902`), `accountsChanged`, and `chainChanged`. |
| **`avax-frontend-ux`** | `.claude/skills/avax-frontend-ux/SKILL.md` | **Transaction Lifecycle UX:** Clear pending/mining/confirmed/rejected (`4001`) feedback via `setWalletMsg()`. |
| **`avax-security` & `avax-audit`** | `.claude/skills/avax-security/SKILL.md` | **Security & Solvency Audits:** Multi-lens review (Funds/Reentrancy, State/DoS, Economy Duplication `creditOk`/`takeOffChain`/`putBack`). |
| **`avax-data-feeds-oracles`** | `.claude/skills/avax-data-feeds-oracles/SKILL.md` | **RedStone Oracle Hygiene:** `latestRoundData()` heartbeat checks (`ORACLE_MAX_AGE = 86400`) and stale adapter fallback (`getLastUpdateDetailsUnsafe`). |
| **`pixel-art-sprites` & `balance-check`** | `.claude/skills/pixel-art-sprites/SKILL.md` | **Sprites & Combat Balance:** 16×20 string-template sprites (`node tests/sprites.mjs`) and TTK/economy balance tables. |

---

## 4. How the Prompt System Works (`MASTER_PROMPT.md` + `SESSION_PROMPT.md`)

1. **[`MASTER_PROMPT.md`](./MASTER_PROMPT.md) (Zero-Waste Single-Prompt Repo Blueprint for TryNoah AI):**
   - Purged of all duplicate sections, meta-commentary, removed ERC-20 references, and historical git archaeology so TryNoah AI never wastes context tokens or wanders.
   - Ordered in the exact sequence an autonomous builder writes the repo:
     - **§1:** Role, Repository Tree & Hard Invariants (`index.html` < 1,500 lines, 0 external deps, offline-first, instant `chainAct`).
     - **§2:** Live DogeOS Chikyū Testnet Registry (`0x5fdaf3`), all 27 4-byte `SEL` selectors, bit-packing (`id<<16 | type<<8 | level`), and raw hex ABI helpers.
     - **§3:** Exact 12-Section Architecture of `index.html` (every constant, NPC pad, recipe, starter bag `WOOD x3` + `STONE x3`, `WARRIOR`/`ARCHER`/`HEALER` combat mechanics, and BarkSwap Pool DEX rows).
     - **§4:** Solidity Contracts Specification (`DogeItems.sol`, `DogeDEX.sol`, `DogeProfession.sol`, `DogeStaking.sol`).
     - **§G:** Compact Canonical Subsystem Ledger (`D-014..D-036`).
2. **[`prompts/SESSION_PROMPT.md`](./prompts/SESSION_PROMPT.md) (v2.3) & [`CLAUDE.md`](./CLAUDE.md):**
   - Enforces **RULE #0** (run `audit-scan.mjs` first) and **RULE #1** (tests green → `docs/DECISIONS.md` → update `MASTER_PROMPT.md` + `dogeon-game` skill → commit).

---

## 5. Ready-to-Paste Job Prompt for Claude Code

Copy and paste the block below directly into **Claude Code** to sync its context and give it its next high-impact engineering job:

```markdown
You are the co-lead engineer on DOGEON ("The Grand Heist", single-file 16-bit Web3 Action RPG in @index.html + Foundry contracts in @contracts/).

### STEP 1 — SYNC YOUR BRAIN & VERIFY BASELINE (RULE #0)
1. Read @CLAUDE_CODE_HANDOFF.md, @MASTER_PROMPT.md, @.claude/skills/dogeon-game/SKILL.md, @.claude/skills/analyzer-master/SKILL.md, and the top 3 entries of @docs/DECISIONS.md (D-034, D-035, D-036).
2. Run the diagnostic scanner and test suite to confirm our baseline is 100% green:
   `node .agents/skills/analyzer-master/scripts/audit-scan.mjs && bash tests/check.sh`

### STEP 2 — YOUR JOB: AUDIT, POLISH & IMPROVE THE BARKSWAP POOL DEX & CLASS GAMEPLAY LOOP
Using the installed skills (`analyzer-master`, `dogeon-game`, `avax-defi-primitives`, `avax-frontend-ux`, `balance-check`), inspect @index.html and propose a surgical plan (< 40 lines net in @index.html, keeping total lines well under 1,320) to improve:
1. **BarkSwap Pool DEX UX (`marketMenu` & `drawUI` in @index.html#780-820, #1200-1230):**
   - Make sure that when a player mints an item token (`MINT < ITEM > NFT` at Row 0 or via starter `1 WOOD + 1 STONE`), or creates/adds/swaps in a pool (`CREATE POOL`, `SWAP`, `ADD LP`, `REMOVE LP`), the menu shows clear, BarkSwap-style reserve/price-impact/LP-share feedback and works seamlessly both when connected on DogeOS Chikyū (`0x5fdaf3`) and when testing offline.
2. **Class Gameplay Feel & Balance (`CLASSES`, `attack`, `useSkill`, `drawSlash` in @index.html#440-585, #1175-1205):**
   - Verify and polish the combat feel and balance across all 3 professions:
     - **ARCHER:** `Space` basic arrow (`0 MP`, `speed=280`, bow drawn in `drawSlash`) + `K/Q` 3-arrow spread volley (`6 MP`).
     - **HEALER:** `-15` Max HP (`45` base), fast (`1.25x` speed), weak melee staff (`0.65x` dmg, restores `+2 MP` on hit, staff drawn in `drawSlash`) + `K/Q` `MEND` (`10 MP` -> `+20 HP * bark skill`).
     - **WARRIOR:** `+25` Max HP (`85` base), `+15%` armor, strong melee cleave (`1.35x` dmg, `+4 px` reach + screen shake) + `K/Q` `GROUND POUND` (`12 MP` AoE slam).
3. **Simulation & Prompt Sync (RULE #1):**
   - Add deterministic assertions in @tests/sim.mjs for any improvement you make.
   - Do NOT add extra contracts or external dependencies; keep everything focused on our 4 game contracts (`DogeItems`, `DogeDEX`, `DogeProfession`, `DogeStaking`), item minting, pool DEX, and class gameplay.
   - Run `node .agents/skills/analyzer-master/scripts/audit-scan.mjs && bash tests/check.sh`, log `D-037` in @docs/DECISIONS.md, update @MASTER_PROMPT.md + @.claude/skills/dogeon-game/SKILL.md, and commit with a Conventional Commit message.
```
