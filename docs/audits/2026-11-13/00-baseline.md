# Stage 0 — Baseline · 2026-11-13 · HEAD a3bbc4e

## Scope covered
- Read: `.claude/skills/dogeon-audit/SKILL.md` (§2–§3), `stages/00-baseline.md`, `CLAUDE.md` (on disk), `.claude/skills/dogeon-mission/SKILL.md`,
  `.claude/skills/dogeon-solidity/SKILL.md` §0–§2, `docs/DECISIONS.md` (open issues + D-095…D-106), `docs/AGENT_BOARD.md` (Status, D-numbers, BRAIN tasks).
- HEAD: `a3bbc4e docs(audit): 7-stage sequential audit pipeline (skill + project agents) and player-data plan (D-106)`.
- `git status --short`: **clean** (no output, before and after the test run).
- Line counts: `src/game.js` 1475 (only file in `src/`) · `server/relay.mjs` 220 · `landing.html` 1516 · `contracts/src/DogeDEX.sol` 373 ·
  `DogeItems.sol` 202 · `DogeProfession.sol` 71 · `DogeStaking.sol` 116 · `IPriceFeed.sol` 13. Tests: `tests/sim.mjs` 1576, `tests/relay.mjs` 104,
  `contracts/test/*.t.sol` 425/175/105/107.
- `bash tests/check.sh` → exit 0, summary lines:
  - Stage 1 static rules: all PASS (no alert/confirm/prompt/fetch/XHR/import(, no ctx.arc/ellipse/radial gradient/shadowBlur, WebSocket only in
    MULTIPLAYER, `DOGE coin art data intact (96x96 = 9216 px, <= 32 colours)`, no external assets); INFO `src/game.js is 1475 lines`.
  - Stage 2: `PASS node --check src/game.js`.
  - Stage 3 sim: 55 scenarios, 130 PASS lines, `✓ 0 failed, 0 warnings (seed 4242)`.
  - Stage 4: `PASS forge test (47 tests passed)`.
  - Stage 5: `PASS recreation prompts match source (5 file(s) verified)`.
  - Stage 6: `PASS relay: 14 checks (3 players, rooms, anti-spoof, cap)`.
  - `ALL CHECKS PASSED`.
- Also ran `node scripts/landing-check.mjs` → `Landing matches the game.`

## Earlier findings re-checked
| ID | Verdict | Evidence |
|---|---|---|
| — | — | Stage 0 is the first report of this run; no earlier findings. |

## Findings
### S0-1 · LOW · Deployment record says the mint fee is 0.1 DOGE; the live contract (D-071) charges 1 DOGE
- Law: N1 (user sees the true fee), T5 (addresses/params from one source)   - Where: `contracts/deployments/6281971.json:6`, `contracts/script/Deploy.s.sol:12`   - Proof: TRACED
- Evidence: json `"mintFee": 100000000000000000,` (0.1 DOGE); Deploy.s.sol `/// Deploys DogeItems (0.1 DOGE mint fee, ...`; DECISIONS D-071: "Redeployed ... DogeItems `0xbF85…` (1 DOGE fee) ... `mintFee=1e18`". Addresses in the json match `CONTRACTS['0x5fdaf3']` (`src/game.js:727`); only the fee field is stale (file last changed 2026-11-10 21:38).
- Failure scenario: a tool, doc or the landing reads the fee from the deployments json → shows 0.1 DOGE while the wallet asks for 1 DOGE. The game itself reads `mintFee()` on chain in `refreshChain` (`src/game.js:751`), so play is not affected.
- Fix (smallest): set `mintFee` to `1000000000000000000` in the json and fix the script comment (or re-generate from chain). Stage 1/2 should confirm the on-chain value is not readable here (no RPC call was made).   - Lane: BRAIN   - Contracts: no (metadata only)

### S0-2 · LOW · Mission charter points at `index.html` and lists Healer-heals-others as missing
- Law: R1, R5 (docs that define the laws must match the code)   - Where: `.claude/skills/dogeon-mission/SKILL.md:28`, `:32`, `:71`   - Proof: TRACED
- Evidence: R1 says the coin "lives in `MOSAIC_PAL` + `MOSAIC_PX` ... in `index.html`" — they are at `src/game.js:283-284`. R5 says "`index.html` ... `< 1500` lines" — the cap now applies to `src/game.js` (CLAUDE.md §5). §7 row 5 says Healer healing others is "**Missing**", but sim scenario `D-046: Healer heals self and peers in multiplayer` (`tests/sim.mjs:1434`) passes.
- Failure scenario: an auditor or agent following the charter literally greps `index.html` for the coin, finds nothing, and either reports a false R1 break or starts a "missing" Healer feature that already exists.
- Fix (smallest): update the three cells to `src/game.js` and mark row 5 done (D-046).   - Lane: BRAIN   - Contracts: no

### S0-3 · INFO · `src/game.js` is 25 lines below its 1500-line cap
- Law: CLAUDE.md §5 / R5   - Where: `src/game.js` (1475 lines)   - Proof: PROVEN (`wc -l`, check.sh INFO line)
- Failure scenario: any fix from this audit that adds lines to `src/game.js` may cross the cap; fixes must go to a new `src/*.js` classic script.
- Fix (smallest): none now; later stages should size their fixes with this in mind.   - Lane: BRAIN   - Contracts: no

### S0-4 · INFO · D-106 and the audit skill are dated 2026-11-14 and name `docs/audits/2026-11-14/` as the first run
- Law: docs hygiene   - Where: `docs/DECISIONS.md:45,50`, `.claude/skills/dogeon-audit/SKILL.md:8,86`   - Proof: TRACED
- Evidence: today is 2026-11-13 and this run writes to `docs/audits/2026-11-13/` (only folder in `docs/audits/`).
- Fix (smallest): align the date/path in D-106 when the audit is logged.   - Lane: BRAIN   - Contracts: no

## Known open items (already logged — do NOT re-report as new)
- `DogeItems.mint` is permissionless for any type/level at the fee (breaks N0 on chain) — D-104 open item, `docs/CONTRACTS_V2_PLAN.md` §2.
- No player-data persistence (nothing saved between sessions) — `docs/PLAYER_DATA_PLAN.md` (D-106).
- `scripts/browser-smoke.sh` and `scripts/e2e-chikyu.sh` were not re-run recently (not run in this stage either: they need Chrome / a deploy key and a live chain).
- DECISIONS open issues I-6 (Esc on Elder dialog runs `onEnd`) and I-7 (`e.key` breaks AZERTY) are still open, logged since D-006.
- Media: healer/archer captures still show a moving cursor (D-099 note).

## Not checked (and why)
- No RPC/chain reads (read-only rule; would confirm S0-1's live fee). `browser-smoke.sh`, `e2e-chikyu.sh`: need Chrome / wallet key; out of contract.
- No deep code review: that is stages 1–5. Line numbers below are from `grep` on HEAD `a3bbc4e`.

## Handoff to the next stage
Scope map (all line numbers at HEAD `a3bbc4e`; recent D-entries to look at first in brackets).

**Stage 1 — Contracts** · laws N0–N7, R4, CLAUDE.md §4 (economy, staking) · first: D-104 (on-chain N0 gap, known), D-105 (v2 plan), D-071 (live = 1 DOGE fee, 80/20 split), S0-1.
- `contracts/src/DogeItems.sol`: `constructor` 61, `maxLevel` 68, `mint` 77, `burn` 89, `withdrawFees` 96, `setStakingPool` 116, `setMintFee` 121, `setTreasury` 126, `inventoryOf` 135, `tokenURI` 183.
- `contracts/src/DogeDEX.sol`: `constructor` 86, `_protoSplit` 94, `_accrueProto` 101, `flushStakerFees` 112, `list` 128, `delist` 137, `buy` 147, `_unlist` 158, `activeListings` 174, `_poolBuy` 216, `_poolSell` 225, `buyQuote` 233, `sellQuote` 241, `addLiquidity` 252, `removeLiquidity` 289, `buyFromPool` 311, `sellToPool` 327, `dogeUsd` 346, `withdraw` 365.
- `contracts/src/DogeProfession.sol`: `constructor` 34, `choose` 40, `withdraw` 64. `contracts/src/DogeStaking.sol`: `notifyReward` 37, `_addReward` 41, `_harvest` 54, `pendingRewards` 67, `stake` 74, `unstake` 89, `claim` 102, `_pay` 112. `IPriceFeed.sol`.
- Tests `contracts/test/*.t.sol` (47 pass); `contracts/deployments/6281971.json`, `contracts/script/Deploy.s.sol`.

**Stage 2 — Game ↔ chain** · laws N0, N1, N4, N6, N7, CLAUDE.md §4 (NFT items, wallet), §2 (D-016) · first: D-104 (`mintNft` source guard, `mintRows`, removed free paths), D-103 (bag counter `matN/matAdd/matTake`), D-097 (no in-game DOGE), D-095.
- CHAIN section `src/game.js:674-885`: `CHAIN` 677, `wallet` 678, `eth` 679, `setWalletMsg` 683, `switchChain` 684, `refreshBal` 694, `hookWallet` 695, `connectWallet` 698, `disconnectWallet` 710, `walletRows` 715, `DEV_LOCAL` 722, `CONTRACTS` 727, `SEL` 728, `chainData` 739, `ecall` 742, `etx` 743, `refreshChain` 751, `chooseProfession` 774, `stakeDoge` 779, `unstakeStake` 780, `claimStakeRewards` 781, `syncDexFees` 782 (calls `flushStakerFees`), `chainAct` 784, `ensureApproved` 792, `nftBest` 796, `swordLv/armorLv` 797, `addCredit` 810, `creditOk` 812, `takeOffChain` 813, `putBack` 814, `mintNft` 815, `useNft` 824, `burnAndReroll` 830, `listNft` 832, `delistNft` 833, `buyListing` 834, `addLp` 836, `removeLp` 839, `buyPool` 841, `sellPool` 842, `withdrawProceeds` 843, `chainBlockRow` 844, `stakeMenu` 849, `marketMenu` 860.
- UI callers: `professorMenu` 906, `RECIPES` 923, `mintRows` 932, `shopMenu` 936, `bankMenu` 966, `refreshOracle` 985, `oracleRow` 995, `dogeMasterMenu` 1031 (opened from `elderMenu` 1029 when `state.won`), `invMenu` 1094.
- Check `SEL` against `cast sig` for each used function; addresses vs `contracts/deployments/6281971.json`.

**Stage 3 — Server & security** · laws CLAUDE.md §2 (D-040 multiplayer confinement, no network without `?mp`), D-076 (relay referees boss/PvP/loot), R5, N6 · first: D-095 (boss respawn/room reset in relay), D-096 (video Range serving, `assets/**` path regex).
- `server/relay.mjs`: constants 19-44 (`MAX_ROOM`, `MAX_BYTES`, `MAX_RATE`, `IDLE_MS`, `BOSS_HP`, `BOSS_RESET_MS`, `LOOT_KINDS`, `inCamp`, `inBossRoom`), `onWorld` 45, `frame` 86, `send/broadcast` 91-92, `drop` 94, `onMessage` 106, `onData` 131, HTTP `createServer` 151 (`/health` ~156, game routes ~163, landing ~169, `assets` regex + Range ~176-194, `src/*.js` ~195), `upgrade` handler 206, `listen` 220.
- `Dockerfile` (9 lines), `fly.toml` (17 lines), `tests/serve.mjs`, `tests/relay.mjs`.
- MULTIPLAYER section `src/game.js:1132-1209`: `netParam` 1138, `NET_URL` 1140, `netClean` 1143, `netConnect` 1165, `netTick` 1194, `netDraw` 1201. Also `openLink` 950 (`noopener`).

**Stage 4 — Gameplay invariants** · laws CLAUDE.md §4 (healing, camp safety, death, economy/no in-game DOGE, fishing, inventory, quests, populations, classes), R1–R3, R5, N0 (game side), N7 · first: D-104, D-103, D-097, D-095, D-089 (20 s respawns, NPCs never give DOGE); S0-3 (line cap).
- GAME STATE 365-529: `MARKET` 370, `REST_DELAY/REST_CAP/RESPAWN_FRAC` 371, `skillLv/skillMul` 373-374, `FIELD_POP/DUN_POP/SPAWN_EVERY/DUN_RESPAWN/MINI_RESPAWN/QUEST_MATS` 376, `waterAt` 379, `startFish` 383, `stopFish` 392, `updFish` 393, `BAG_SIZE` 406, `FOODS` 407, `addToBag` 413, `bagCount` 414, `matN/matAdd/matTake` 416, `bagRemove` 417, `YARN_MATS` 434, `giveMats` 435, `ETYPES` 436, `CLASSES` 450, `classOf` 465, `syncMaxHp` 470, `applyClass` 473, `newGame` 486, `makeEnemy` 498, `spawnEnemy` 512, `summon` 528.
- COLLISION 530: `solidFor` 531, `blocked` 532, `move` 538, `playerInCamp` 548, `zoneOf` 549. COMBAT 557: `hurtPlayer` 558, `respawn` 566, `attack` 578, `bark` 592, `useSkill` 599, `damageEnemy` 622, `killEnemy` 630, `shootBone` 640. ENEMY AI `updEnemy` 643. UPDATE `update` 1211. RENDER `drawChar` 1299, `drawHUD` 1373, `render` 1449. Coin art `MOSAIC_PAL/MOSAIC_PX` 283-284 (R1).
- Story/quests: `HEIST_STORY` 1005, `PONZI_STORY` 1010, `factionMenu` 1017, `elderMenu` 1021, `questTalk` 1081.
- Coverage: `tests/sim.mjs` (55 scenarios; index at lines 132-1532). Known open I-6, I-7.

**Stage 5 — Landing truth** · laws T1–T10 (T5 addresses = `CONTRACTS`, T7 chain params = `CHAIN` 677, T8 no price/testnet disclaimer), N5, R1 · first: D-101 (PonziFi lore + T10), D-100 (no in-game DOGE copy), D-098 (real-mint tx proofs), D-097, D-095 (`#party` raid cycle), S0-1 (fee in json).
- `landing.html` sections: `#heist` 691, `#characters` 724, `#economy` 806, `#mint` 844 (tx links 900-901), `#faucet` 908, `#resources` 981, `#pvp` 1015, `#party` 1051, `#staking` 1083, `#npcs` 1112, `#contracts` 1167 (explorer address links 1187-1202), `#gallery` 1212, `#build` 1336.
- Compare against `CONTRACTS` (`src/game.js:727`), `CHAIN` (677), `LINKS` (946), `assets/`; tool `scripts/landing-check.mjs` (passes now).
