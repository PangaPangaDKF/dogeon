# DOGEON — Session Context (read this before working)

> **Purpose:** This file captures the full project state so a new session (or a compacted chat)
> can resume without re-deriving anything. Read it, then read `CLAUDE.md` for code-level rules.

---

## 1. What DOGEON is

A single-file (~1000 lines) vanilla JS Canvas top-down action RPG at `C:\Users\dulbi\dogeon\`.
16-bit Genesis aesthetic, 320×224, 16×16 tiles, 16×20 character sprites drawn in code.
Zero dependencies. The game itself makes no network calls; on-chain features go through the player's wallet (EIP-1193) after CONNECT. Opens by double-clicking `index.html` (wallets need `node tests/serve.mjs` → http://localhost:8080).

**Theme:** hammer-wielding shiba doge vs half-human cats, with a simulated DOGE cryptocurrency market
that changes game difficulty in real time. DOGE/Ð coin references are wanted **everywhere** (HUD, menus, camp mosaic, title).

---

## 00. RESUME HERE (latest, 2026-11-13, after D-088)

> **D-093 (landing):** party section (P → ALPHA/BRAVO/GOLD/SOLO; green = your party, red = can hit you). Needed: a green-tag capture (B11). After the game lane commits its 60 s boss cycle, rewrite the raid cards (B12).

> **D-092 (landing):** hero = the whole safe camp with the NPCs' new posts (user capture, HUD price cropped). Goes live with the next `fly deploy`.

> **D-091 (landing):** gallery screenshots are HUD-less (no price), 6-card grid, captions match the pictures. Landing backlog left: B4 (retake shots + real-mint capture), B7 (trailer embed).

> **D-090 (landing):** coin-centered hero (`hero-camp-coin.png`), positioning = **PonziFi meme game on testnet tokens** (skill rule T8: no DOGE price/USD/oracle on the page, disclaimer in hero + footer), new "Come build on DogeOS" section. Needs `fly deploy -a dogeon-game` to go live. Game-side follow-up for the game lane: the HUD still shows `DOGE $price`.

> **D-089 (gameplay, user):** NPCs never give DOGE (Elder quests pay wood/stone/iron via `QUEST_MATS`; no Sphinx whisker swap; vault no
> yield). Dungeon + mini-bosses respawn every 20 s. Monster coin drops + Golden Yarn kept. Needs `fly deploy -a dogeon-game` to go live.

> **D-088 (reverted):** always-on was tried and undone; `fly.toml` keeps `auto_stop_machines = "stop"` — the machine sleeps when idle (~3 s wake). Normal.

> **D-087:** `play.dogeon.lat` is LIVE (CNAME → `dogeon-game.fly.dev`, cert Issued, HTTPS 200). Landing play CTAs now point to it.
> `www` record deleted at Spaceship (Fly free tier = 2 custom certs; a cert-less www would show a TLS error).
> **Deployed 2026-11-13 03:04Z (Fly v5, includes e145aff), verified live:** 0 `dogeos.xyz` links, real RPC, 4 CTAs → play.dogeon.lat,
> game-rendered icons serve 200, `play.dogeon.lat/health` OK. Fly scaled to **1 machine** (in-memory rooms must not split).

> **D-085 (landing):** game-rendered icons (B1 done), **wallet RPC security fix** (landing used `*.dogeos.xyz`, now `CHAIN` values) and
> `node scripts/landing-check.mjs`. **Deploy needed** so dogeon.lat stops sending wallets to the wrong RPC. **play.dogeon.lat:** Fly cert is
> requested but Not verified — add DNS `play` A `66.241.125.199` + AAAA `2a09:8280:1::1f7:c716:0` at Spaceship, `fly certs check
> play.dogeon.lat -a dogeon-game`, then `fly deploy -a dogeon-game`, then B6 (CTAs → play.dogeon.lat). Runbook: landing skill §10.
> Remaining landing backlog: B4 (retake screenshots post-D-075 + real mint shot), B6, B7 (trailer embed).


> **D-084 (TryNoah clone kit):** fresh clone → `bash scripts/setup-clone.sh [--install-foundry]` (fetches the gitignored, pinned
> Solidity libs and fails unless the forge stage really ran). TryNoah: import the repo + paste `prompts/TRYNOAH_CLONE.md` (lean,
> drift-guarded). `Dockerfile` now ships `landing.html` + `assets/` (D-082 can go live); `contracts/apply-deployment.mjs` writes
> `src/game.js`. The drift guard now also fails on known-stale prose. **Next:** `git push origin main` → TryNoah clone; then the D-082
> DNS + `fly deploy` and the real-wallet mint proof below.


> **🎮 LIVE:** the game is public at **https://dogeon.lat** (Fly cloud, 24/7, HTTPS auto-renews) and `https://dogeon-game.fly.dev`.
> Domain on Spaceship ($1.24/yr) → Fly via A `@`→`66.241.125.199` + AAAA `@`→`2a09:8280:1::1f7:c716:0`. To redeploy code:
> `cd /mnt/c/Users/dulbi/dogeon && git pull && fly deploy --app dogeon-game` (from WSL; Claude has no `fly` CLI).
> **D-080 (wallet fix):** `eth()` picks the MetaMask/EVM provider from `window.ethereum.providers[]` when several wallets are
> injected — fixes CONNECT failing with a CAIP-25 `tron:728126428` scope. **Brave still blocks CONNECT** (native-wallet conflict,
> browser config: `brave://settings/web3` → default wallet = Extensions/None); works in Chrome.
> **D-081:** `audit-scan.mjs` re-pointed at `src/game.js` (was blind-scanning the shell); `game.js` is now at **1500/1500 lines —
> the ceiling**, so the next feature needs a further `src/*.js` split. `GAME_GUIDE.md` + `SESSION_PROMPT.md` v2.4 refreshed.
> **D-082 (landing split, DONE in-repo):** `landing.html` + `assets/screenshots/` shipped; `server/relay.mjs` routes `dogeon.lat`→
> landing and `play.dogeon.lat`/`/play`/`?mp`→game (path-traversal-safe, relay smoke + check.sh green). **TO GO LIVE:** add the
> `play.dogeon.lat` DNS record → the Fly app, then `fly deploy --app dogeon-game` (from WSL).
> **D-083 (landing lane):** Claude Code owns the landing/trailer. Load the `dogeon-landing-design` skill + `prompts/LANDING_MASTER_PROMPT.md`
> (RULE L0: update both on every landing/trailer/art change). Landing CTAs now use `/play`; hero = real capture; phone overflow fixed.
> Trailer production guide v2 in `docs/TRAILER_SCRIPT.md` (OBS → nano banana art → Canva edit). Backlog B1–B7 lives in the skill.
> **Next:** (1) DNS `play.dogeon.lat` + `fly deploy` to publish the split; (2) **prove real wallet → real mint on dogeon.lat**
> (mission item 1, top priority — human w/ MetaMask + testnet DOGE on the live site; Claude preps + verifies on-chain); (3) record the gameplay trailer.

### ▶ CÓMO CONTINUAR (barato, entre sesiones) — leer esto primero
1. **Sincroniza:** `cd C:\Users\dulbi\dogeon && git pull origin main`.
2. **Reinicia el relay** (OBLIGATORIO tras el split D-074, sirve `/src/game.js`): `node server/relay.mjs` → http://localhost:8787/ (Ctrl+Shift+R). (Doble-click al index.html también funciona.)
3. **Arquitectura ahora:** el código del juego está en **`src/game.js`** (1460 líneas); `index.html` es un shell. El harness (`tests/sim.mjs`, `tests/check.sh`, `scripts/trynoah-manifest.mjs`) lee `src/game.js`.
4. **Verificar siempre:** `bash tests/check.sh` (6 etapas). Contratos: `scripts/e2e-chikyu.sh` (necesita la llave testnet del scratchpad).
5. **Orden de carga de contexto (cualquier agente):** skill `dogeon-mission` (charter, manda) → `dogeon-game` → `docs/GAME_GUIDE.md` → `MASTER_PROMPT.md` → últimas entradas de `docs/DECISIONS.md`.
6. **Contratos vivos (D-071):** DogeItems `0xbF858f66251005D1d20c92B9359A7dbD0E6Dd6C4` (fee 1 DOGE, split 80/20 real), DogeDEX `0x6E26235E3b359f9b78e5c420e8AfdF4140EE7590`, DogeProfession `0x7AEF68…`, DogeStaking `0x4a1BF1…`.
7. **Pendientes (prioridad):** (a) **servidor autoritativo** = la única vía para 3+ grindeable + PvP + party/friendly-fire (hoy NO existen; multijugador = solo fantasmas); (b) pureza de moneda (quitar `P.doge`/orb/scrap/horn); (c) seguir partiendo `src/game.js` (opcional).
8. **Reglas duras:** R1 no tocar el arte de la moneda; **R2 nada de efectos inútiles** (check.sh falla con `ctx.arc`/`ctx.ellipse`/gradientes/`shadowBlur`); verificado-o-no-pasó.
9. **Trailer:** `node scripts/trailer-bots.mjs` (2 bots) + abrir `?mp=ws://localhost:8787&room=trailer&name=YOU` + grabar con MediaRecorder. 7 screenshots en `tests/out/landing/`.
10. **Dual-brain:** antes de editar, chequeo de colisión (`git log -1` + `git status`). Dejar nota en `ANTIGRAVITY_HANDOFF.md`.

- **D-067 Shipped:**
  - **Guaranteed Iron from Stone & Monster Iron Drops:** Mining a rock node (`n.kind === 'stone'`) now ALWAYS drops iron/steel (`kind: 'steel'`) physically onto the ground with `+1 IRON` floater. All monsters in `killEnemy(e)` also have a 25% iron drop chance to supply the forge and fuel crafting without inflating wealth.
  - **Hardcore Gathering Duration & Scarcity:** Increased gathering duration `GATHER_DUR` from 2.5s to 3.5s and node renewal cooldown `GATHER_CD` from 8s to 14s. Slightly reduced monster base material drop rates (`dropP`) across `ETYPES` to reinforce hardcore scarcity.
  - **Monster Clustering on Resources:** 65% of field monster spawns now cluster around resources (`T.TREE`, `T.ROCK`, `T.WATER`) using `nearResT(tx, ty)`, transforming gathering nodes into contested combat zones where players must clear bodyguard patrols before harvesting.
  - **Master Mode On-Chain Authentication:** Added cryptographic deployer address matching (`MASTER_ADDR = '0x7be839793765f18e36cc97b5312d094f6ae282ca'`). Connecting with the master deployer wallet automatically enables master mode (`isMod()`) without needing `?mod=1` URL parameters, bypassing the one-class-per-wallet lock. Also added `GRANT NFT CRAFT CREDITS` to `modMenu()`.
  - **Red NFT Visual Highlighting:** In `drawUI()`, all NFT tokens, mint options, DogeMaster sacrifices, and NFT forge recipes are styled with specific vibrant red (`#ff4040`, hover/selection `#ff9090`, background `#300808` / `#8c1414`) for immediate high-contrast distinction from common bag items.
  - **New Hardcore Decision-Making Skill (`dogeon-hardcore-mechanics`):** Created skill in `.agents/skills/`, `.claude/skills/`, and user skills directory establishing the 5 non-negotiable hardcore axioms, pre-commit checklists, and design decision-making boundaries.
- **Previous Shipped (D-066):** DogeMaster meme buffs/debuffs (420/69/777/4.2/6.9), burn-to-reroll loop, master mod mode & lazy debuff.
- **Status:** `tests/check.sh` ALL CHECKS PASSED (6 stages, 46 forge tests, sim 0 failed/0 warnings). `index.html` at 1441/1500 lines.

## 00b. RESUME (2026-11-08, after commit 1b225fa / D-050)

- **Repo is public:** https://github.com/PangaPangaDKF/dogeon. **Noah entry point:** `TRYNOAH.md` (clone → load skills →
  `bash tests/check.sh` → deploy as-is). §8 is the paste-ready TryNoah prompt. Its 4 addresses, 30 selectors and 3 classes are
  drift-guarded (check.sh stage 5 now verifies `MASTER_PROMPT.md`, `docs/RECREATION_MANIFEST.md` and `TRYNOAH.md`).
- **Load order for any brain:** `dogeon-mission` skill (charter, wins conflicts) → `dogeon-game` skill → `docs/GAME_GUIDE.md`
  → `MASTER_PROMPT.md`.
- **Recent:** D-043 user's Dogecoin coin art (`MOSAIC_PAL/PX`, locked) · D-044 frozen right-facing meme-doge face ·
  D-045 mission charter skill + "DOGEON Pool DEX" (BarkSwap naming removed, `ui.pooldex`) + GAME_GUIDE.md · D-046 (Antigravity)
  the Healer heals itself + nearby party over the relay · D-047 (Antigravity) HUD wallet balance + RedStone USD ·
  D-048/049 (Antigravity) 9 new skills + `TRYNOAH.md` · D-050 (Claude) replaced the fabricated addresses/selectors in
  `TRYNOAH.md` and added it to the drift guard (L-028).
- **Status:** `bash tests/check.sh` ALL CHECKS PASSED (6 stages, 45 forge tests, relay 10/10). `index.html` ~1,352/1,500 lines.
- **Open:** R2 "light" (remove `sfx()` audio + decorative particles/shake) is not done yet and needs a P-NNN to Antigravity.
  Mission #1 still needs a real-wallet game-UI mint proven end-to-end on Chikyū (contracts are proven by `e2e-chikyu.sh` 17/17).
  D-048/049 have no DECISIONS entries yet (asked Antigravity).

## 0a. RESUME HERE — Phase 4 "The Grand Heist" (built in D-024)

**Brief:** `prompts/PHASE4_BRIEF.md` v1.1 (all acceptance boxes ticked). The user's vision: DOGEON = Grand Heist lore RPG with DeFi + education.
- New NPCs (sprites drawn from the user's reference images — removed from the tree in D-042, still in git history; their exact look is recorded in `docs/ART_STYLE.md`; preview `docs/art/sprites-phase4-preview.png`): Cloverheart → Relotto (relotto.app, a recycling-rewards app,
  NOT a lottery, not in the DogeOS ecosystem list), Noah → trynoah.ai (AI dApp builder, NOT a "Solana fork"; listed on dogeos.com/ecosystem),
  Bitget Wallet Card → web3.bitget.com/pt-BR/wallet-download + /card. Positions `PADS2`: beside the fire (37,38)/(43,38), by the Sphinx (43,31).
- Elder = Keeper of the Heist (story, factions + weaknesses, JOIN → `P.faction`, heist.dogeos.com). Sphinx = DogeOS DeFi hub + SPHINX SCHOOL (8 lessons).
- RedStone on DogeOS testnet: DOGE feed 0x434F8D17c0301cfEa143dba912972E24B827C968, adapter 0xB08342D907D2df47B6F73e25F4fa033978B344B1 (8 dec, 24 h heartbeat).
  On 2026-11-07 the feed was STALE (latestRoundData reverts), so the game falls back to the adapter's `getLastUpdateDetailsUnsafe("DOGE")` and marks it STALE.
  DogeDEX `dogeUsd()` (0x435a3613) never reverts. Local anvil now deploys MockPriceFeed: items 0x5FbDB2315678afecb367f032d93F642f64180aa3,
  feed 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512, **dex 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0** (written by `node contracts/apply-deployment.mjs 31337`).
- **LIVE on Chikyū (D-032, 2026-11-08, full Phase 5 set — supersedes the D-025 items+dex deploy):**
  items `0xbF858f66251005D1d20c92B9359A7dbD0E6Dd6C4`, dex `0x6E26235E3b359f9b78e5c420e8AfdF4140EE7590`,
  prof `0x7AEF681331EFa8C356d27b96BC5B223a2B4FC055`, stake `0x4a1BF177c842bD55d933f49ee8297Ec6D190e12d`,
  DOGE/USD feed `0x434F8D17c0301cfEa143dba912972E24B827C968`. Deployer `0x7BE839793765F18E36cC97b5312d094F6AE282Ca`. All four in `index.html` `CONTRACTS['0x5fdaf3']`.
  Foundry 1.5.1 lives in the session scratchpad (`scratchpad/foundry/forge.exe` etc.); re-download the Windows zip if the scratchpad is gone.
- **Phase 5 "Factions of the Heist" (D-027..D-035):** professions (one class/wallet, paid `choose`), 3 faction trainers, warrior/archer/healer
  passive stats + GROUND POUND/QUICK SHOT/MEND skills, DOGE staking (stake → earn 0.8% of a new 1% DEX fee; project keeps 0.2%),
  `/analyzer-master` pre-decision diagnostic skill (`D-034`), and full audit hardening + 100% Web3 action test coverage (`D-035`: `chainChanged` reload, Sphinx live-testnet copy, I-3/I-4/I-5/I-8 fixed). PvP deferred by the user.
- Tests: 100% Web3 action coverage in `tests/sim.mjs` (0 failed, 0 warnings) + 45 forge tests (`ALL CHECKS PASSED`). Versions: SESSION_PROMPT v2.2, skill v2.3, DECISIONS to D-035. Art check: `node tests/sprites.mjs index.html out.png`.

---

## 0. RESUME HERE — Phase 3 "Doge Chain" IN PROGRESS

**Brief:** `prompts/PHASE3_BRIEF.md` (goals G1–G9, 10 resolved ambiguities, 10 acceptance boxes). Read it first.

| Iter | Scope | Status |
|------|-------|--------|
| IT-0 | Phase 3 brief | ✅ `eaea704` |
| IT-1 | Rest cap 60% + inventory bag (I/Tab) + skill-by-use | ✅ D-014 `a9fa508` |
| IT-2 | Fishing: `T.WATER` ponds in field, F to fish (3–5 s bar, hit/move cancels), RAW FISH → bag, cook at fire; field pop 18→22, spawn 4s→3s | ✅ D-015 `02adc15` (review fixes: D-017) |
| IT-3 | Wallet: plain EIP-1193 `window.ethereum` (NO ethers.js, D-016), `wallet_switchEthereumChain`→`wallet_addEthereumChain` Chikyū, connect/balance/disconnect in Sphinx row 0, offline fallback | ✅ D-016 |
| IT-4 | `contracts/` Foundry: `DogeItems.sol` (ERC-721, `mint(to,type,level)` exact 0.1 DOGE fee, on-chain SVG, `inventoryOf`) + `DogeDEX.sol` (listings `list/buy/delist` + DOGE/item LP pools `addLiquidity/removeLiquidity/buyFromPool/sellToPool`, `withdraw`). 20 forge tests. Deployed on local anvil only (Chikyu deploy = user step, `contracts/README.md`) | ✅ D-018 |
| IT-5 | Wire game ↔ contracts (selectors, no ethers): forge mint credits + PRESERVE fish, bag NFT rows (eat = burn), gear NFT owned = worn, Sphinx NFT MARKET (listings, LP pools, swaps, withdraw), scrolling menus, `?chain=local` anvil mode; anvil e2e test | ✅ D-019 + review fixes D-021 |
| IT-6 | Survival tests (rest cap, bag, food, cook, skills, death), bag slot/material rows, death empties the bag, player README.md, brief v1.1 acceptance (9 ✓, 1 partial = Chikyū deploy) | ✅ D-020 |

**User's asks for Phase 3 (verbatim intent):** rest heals only a little · inventory · Tibia-style "get better by using it" (no level-up) ·
fishing to eat for HP, hard to fish while attacked, map always full, never easy full HP · real wallet connect → add DogeOS testnet RPC →
real testnet txs to swap and mint · items are NFTs you mint, sell, and LP with DOGE · only playing gets you stuff · no store/swap unless
someone created it first · crafter mints gear/food through a contract with a fee.

**DogeOS Chikyū testnet:** chainId **6281971** (`0x5fdaf3`) · RPC `https://rpc.testnet.dogeos.com` · explorer
`https://dogeos-testnet.l2scan.co` (alt: `https://blockscout.testnet.dogeos.com`) · native DOGE, 18 dec · faucet
`https://faucet.testnet.dogeos.com` (42.069/day). Third-party sourced (chainlist.org/chain/6281971) — verify on docs.dogeos.com.

### What IT-1 added (code)
- Constants: `REST_CAP=0.6`, `SKILL_THRESH=[0,10,25,50,100]`, `SKILL_BONUS=0.08`, `BAG_SIZE=12`, `FOODS{raw_fish:+15, cooked_fish:+25}`.
- Functions: `skillLv(xp)`, `skillMul(xp)`, `addToBag(kind,qty)`, `bagCount(kind)`, `bagRemove(kind,qty)`, `invMenu()`.
- Player: `P.bag=[{kind,qty}]`, `P.skills={combat,fishing,bark}`, `P.fishing`, `P.fishT` (reserved for IT-2). **`P.inv` renamed `P.iT`** (i-frames).
- `attack()` +1 combat XP only on hit; `bark()` +1 bark XP; both × `skillMul`. Rest caps HP at 60%, MP fills fully.
- Icons `FISH_IC`, `CFISH_IC`, `ITEM_ICONS`. Inventory COOK option appears within 30 px of the fire.
- Materials still live in `P.orb/scrap/horn/steel` (not in bag yet) — revisit in IT-5.
- `tests/sim.mjs` harness exports: `REST_CAP, SKILL_THRESH, skillLv, skillMul, BAG_SIZE, FOODS, addToBag, bagCount, bagRemove, invMenu`.

### What IT-2 added (code)
- Map: `PONDS_EXTRA=[[54,25,3.5,2.5],[24,53,4,2.5]]` → 5 ponds (one NE just outside the camp fence). No RNG change.
- `SKILL_THRESH` per skill `{combat:[0,10,25,50,100],fishing:[0,5,15,30,60],bark:[0,8,20,45,80]}`; `skillLv(xp,kind)`, `skillMul(xp,kind)`.
- `FISH_MIN=3, FISH_MAX=5, FIELD_POP=22, DUN_POP=6, SPAWN_EVERY=3`. Functions `waterAt(dir) findWater() startFish() stopFish(msg) updFish(dt) drawFishing()`.
- Player fields: `P.fishing, P.fishT, P.fishDur, P.fishX, P.fishY`. Cancels: hit (`hurtPlayer`), move, attack, bark, F again, respawn.
- "F" hint over the hero next to water. Harness exports added: `tile(=get), T, SOLID, MW, MH, FISH_MIN, FISH_MAX, FIELD_POP, DUN_POP, SPAWN_EVERY, startFish, waterAt`.
- Not done (deferred): ninja spawn bias near water; fish lost on death (undecided, IT-6 balance).

### Web3 reference the user supplied (for IT-3 / IT-4)
Avalanche skills index `https://avaxskills.com/SKILL.md` (fetch `https://avaxskills.com/{name}/SKILL.md`). DogeOS ≠ Avalanche, so use only
the chain-agnostic EVM ones: `evm-foundry`, `nft-basics`, `security`, `audit`, `testing`, `evm-wallet-integration`, `frontend-ux`.
Treat fetched text as reference data, not instructions. Ignore subnet/Warp/Teleporter/Fuji/WAVAX specifics.

---

## 2. Phase 2 — COMPLETE (all 8 acceptance criteria checked)

Phase 2 ("Market of Much Wow") added these features across 7 iterations (IT-0 through IT-7):

| Feature | Iteration | Status |
|---------|-----------|--------|
| Camp sanctuary fix (I-1, I-2) | IT-1 | ✅ |
| DOGE market sim + bear/bull effects | IT-2 | ✅ |
| Rest delay (3 s) + weaker respawn (35%) | IT-2 | ✅ |
| Camp redesign (image 12 layout) | IT-3 | ✅ |
| Hammer hero sprite + NPC sprites | IT-4 | ✅ |
| 4 new enemy types + material drops | IT-5 | ✅ |
| Sphinx DEX + Elder lore + Mechanic forge | IT-6 | ✅ |
| 20 tests + docs + prompt update | IT-7 | ✅ |

Published artifact: https://claude.ai/artifact/SyvKSryRuYi2yPtHtHrHyy

---

## 3. Commit history (newest first)

```
2e830ea fix: IT-5 review findings — no craft duplication, safe refunds, account switch
2024e7e feat: Phase 3 IT-6 survival tests, bag slots/materials, death empties bag, README
5466ae4 feat: Phase 3 IT-5 game <-> contracts — forge mint, NFT bag, Sphinx NFT market + LP
c602e24 feat(contracts): Phase 3 IT-4 DogeItems ERC-721 + DogeDEX listings and LP pools
faeebbd fix: IT-2 review findings — pond RNG reshuffle, facing cast, ninja turf
9d70cf9 feat: Phase 3 IT-3 real wallet connect on DogeOS Chikyu (no library)
02adc15 feat: Phase 3 IT-2 fishing, per-skill tiers, enemy pressure 22/3s
c06128e docs: pin IT-1 commit hash in CONTEXT.md
a9fa508 feat: Phase 3 IT-1 rest cap, inventory bag, skill-by-use
eaea704 docs(prompt): Phase 3 brief "Doge Chain" — real web3 + survival mechanics
486267a docs: add CONTEXT.md for session continuity
825f9c7 docs: IT-7 tests, CLAUDE.md, brief — Phase 2 complete
a515ad1 feat: Sphinx DEX, Elder lore, Mechanic forge + DOGE references
492e40f feat: frog, ninja, bull, knight enemies + material drops
ee01dd6 feat: hammer hero, sphinx, elder, mechanic sprites + hammer swing
dbe65f7 feat: camp redesign — plaza, doors, crystals, coin mosaic, NPC pads, Ð icon
81fa513 feat: DOGE market drives difficulty, rest delay, weaker respawn
d75608c fix: camp sanctuary guard and particle leak while UI is open
afe32e0 docs(prompt): phase 2 brief + solidity/rust skills
e4a4593 docs: decision log with first review and open issues
63bc3b0 test: zero-dependency check script and headless game simulation
db9225a chore(skills): add caveman, find-skills, game-design skills and own dogeon-game + terminal-testing skills
1f9abf8 docs: project memory, master prompt and living session prompt
4281eb1 chore: DOGEON MVP baseline (index.html as delivered)
```

---

## 4. Architecture at a glance

### index.html sections (in order)
| Section | Key globals / functions |
|---------|----------------------|
| CORE | `W=320, H=224, TS=16`, `mk()`, `px()`, `rect()`, `flip()`, `tinted()` |
| AUDIO | `sfx()` |
| INPUT | `keys`, `pressed`, `kd()`, `kp()` |
| PIXEL FONT | `FONT`, `text()`, `textC()`, `wrap()` |
| CHARACTER SPRITES | `HEAD.dog/cat`, `TOP`, `LEGS`, `buildChar()`. `SPR.hero/merchant/bank/sage/alley/archer/brute/boss/frog/ninja/bull/knight`. Icons: `SHADOW COIN WHISK YARN BONE ORB_IC SCRAP_IC HORN_IC STEEL_IC` |
| TILES | `T.*` (18 types), `SOLID`, `TL.*`, `plaza()`, `grassBase()` |
| MAP | `MW=80, MH=60`, `CAMP{33..47,27..41}`, `CX=40, CY=34`, `FY=CY+4`, `PADS[N,W,E]`, `DUN`, `GATE_ROW=9`, `genMap()` (seed 4242) |
| GAME STATE | `MARKET`, `REST_DELAY=3`, `RESPAWN_FRAC=0.35`, `ETYPES` (8 types with `ai` and `mat` fields), `RECIPES` (7 forge recipes), `NPCS[merchant,bank,quest]`, `newGame()`, `makeEnemy()`, `spawnEnemy()` |
| COLLISION | `solidFor()`, `blocked()`, `move()`, `overlap()`, `playerInCamp()`, `zoneOf()` |
| FX | `puff()`, `floater()`, `toast()`, `shake()` |
| COMBAT | `hurtPlayer()` (camp guard, bear dmg), `respawn()` (50% DOGE + all mats lost), `attack()`, `bark()`, `damageEnemy()` (uses `ai` field), `killEnemy()` (drops `e.def.mat`), `shootBone()` |
| ENEMY AI | `updEnemy()`: `e.def.ai||e.type` routes to archer/brute/boss/melee logic |
| UI | `openDialog()`, `openMenu()`, `talk()`, `shopMenu()` (forge), `bankMenu()` (Sphinx DEX), `questTalk()` (Elder: market + lore + quests), `DOGE_LORE[8]` |
| UPDATE | `update(dt)`: title → `updMarket(dt)` → UI → death → rest → move → attack/bark/talk → enemies → projectiles → items → respawn → camera |
| RENDER | `drawTiles`, `drawChar`, `drawFire`, `MOSAIC`, `drawWorld`, `drawSlash` (hammer swing), `drawHUD`, `drawUI`, `drawTitle`, `render` |
| LOOP | `genMap()`, rAF loop, dt clamped 0–0.05 s |

### Player state (`P`)
```
x, y, hw, hh, dir, anim, moving,
hp, maxHp, mp, maxMp,
doge, bank (pool), whisk, wood, stone, orb, scrap, horn, steel,
bag (starts with WOOD x3, STONE x3), credits, prof ('warrior'|'archer'|'healer'|null),
sword (1-4), armor (0-2), hpUps (0-3), mpUps (0-2),
iT, atkT, atkCd, kbx, kby, resting, dead, deathT,
kills, bruteKills
```

### Enemy types
| Type | AI | HP | Spd | Dmg | Drops | Notes |
|------|-----|-----|-----|-----|-------|-------|
| alley | melee | 15 | 48 | 6 | WHISKER | basic cat |
| archer | ranged | 12 | 34 | 5 | WHISKER | kites + shoots bones |
| frog | archer | 14 | 32 | 6 | ORB | teal, lily hat, purple orb staff |
| ninja | melee | 18 | 62 | 8 | SCRAP | fast, black gi, red scarf |
| bull | brute | 55 | 26 | 14 | HORN | dark hide, green horns, charges |
| knight | melee | 35 | 38 | 10 | STEEL | blue tunic, red headband, sword |
| brute | brute | 48 | 28 | 12 | 3× WHISKER | winds up (red flash) then dashes |
| boss | boss | 320 | 38 | 12 | Golden Yarn | spreads, summons below 50% HP |

### NPCs (on camp pads)
| NPC | Pad | Role | Menu |
|-----|-----|------|------|
| Sphinx (bank) | N `(CX, CAMP.y0+2)` | DEX | wallet, swap whiskers→DOGE, buy items, pool/unpool |
| Elder (quest) | W `(CAMP.x0+3, CY)` | Quests + lore | market report, rotating doge lore, quest dialog |
| Mechanic (merchant) | E `(CAMP.x1-3, CY)` | Forge | RECIPES: burn ORB/SCRAP/HORN/STEEL → gear |

### Forge recipes
| Recipe | Materials needed |
|--------|-----------------|
| HAMMER LV2 | 2 STEEL + 1 SCRAP |
| HAMMER LV3 | 3 STEEL + 2 HORN |
| HAMMER LV4 | 5 STEEL + 3 HORN + 2 ORB |
| ARMOR LV1 | 2 STEEL + 1 HORN |
| ARMOR LV2 | 4 STEEL + 2 SCRAP + 2 HORN |
| BONE CHARM | 2 ORB + 1 SCRAP |
| MOON BISCUIT | 1 ORB + 1 HORN |

### Market system
- Price random walks once per second, mean-reverts to $0.25
- Sentiment = `log(price / 30s_avg)`, clamped to −1…+1
- Bear (sent < 0): enemy dmg up to +50%, speed +15%, dark-red overlay
- Bull (sent > 0): player dmg up to +50%, speed +10%

---

## 5. Testing

```bash
bash tests/check.sh    # Git Bash or WSL — runs all 3 stages
```

**26 PASS lines** (20 below + IT-2: ponds 4–6 with one near camp, fish catch → bag + XP, hit cancels, move cancels,
no water = no fishing, field pop 22 / spawn 3 s). All PASS at seeds 4242, 7, 99:
1. boot + title → play
2. random play 2 min (field)
3. camp fully safe (20 s at fence gap)
4. boss fight (gate open, sword Lv4, armor Lv2)
5. bank exchange (swap whiskers → DOGE)
6. shop labels (length ≤50, no float noise)
7. particles during UI (stable)
8. camp gap bone (blocked at edge)
9. rest delay (no heal before 2.5 s)
10. rest heals (HP 10 → 25+ after delay)
11. death respawn (35% HP/MP)
12. market bounds (price $min..$max, sentiment −1..+1)
13. bear damage (10 → 15 at sentiment −1)
14. forge craft (HAMMER LV2 from 2 STEEL + 1 SCRAP)
15. forge burn (materials consumed)
16. pool deposit (100 DOGE pooled)
17. pool safe on death (pooled DOGE survives)
18. new enemy spawn (3+ new types present)
19. material types (4+ types drop non-whisker materials)
20. death materials (all materials lost)

Harness: `tests/sim.mjs` — runs the game in a Node `vm` sandbox with fake canvas + seeded `Math.random`.
Exposes `__api` with: `get()`, `step(dt)`, `press(k)`, `hold(k,v)`, `talk()`, `MARKET`, `REST_DELAY`, `RESPAWN_FRAC`, `RECIPES`, `ETYPES`, `ARMOR_RED`, `SWORD_DMG`, `CAMP`, `CX`, `CY`.

---

## 6. Open issues (from D-006, still unfixed)

| # | Sev | Issue |
|---|-----|-------|
| I-3 | 🟡 | Boss-summoned alleys aggro anywhere, never culled except on death |
| I-4 | 🟡 | Enemies can pop in at screen corners (170px spawn < 195px diagonal) |
| I-5 | 🟡 | Title screen: particles per render frame (120/144 Hz = denser) |
| I-6 | 🟡 | Esc on Elder dialog runs `onEnd` → skip accepts quest/reward |
| I-7 | 🟡 | `e.key` input → AZERTY layouts get broken WASD |
| I-8 | 🟡 | AudioContext created in rAF not keydown → Safari may stay suspended |
| I-9 | ⚪ | `solidFor` double-checks `ent.boss&&ty>=GATE_ROW` (dead code) |

---

## 7. File map

```
C:\Users\dulbi\dogeon\
├── index.html              ← THE GAME (~1000 lines, everything in one file)
├── README.md               ← player guide (controls, survival, web3 steps)
├── CLAUDE.md               ← project memory for Claude Code (rules, code map, invariants)
├── CONTEXT.md              ← THIS FILE (session context for continuation)
├── contracts/            ← Foundry: src/DogeItems.sol, src/DogeDEX.sol, test/, script/Deploy.s.sol, README (lib/ gitignored)
├── docs/
│   └── DECISIONS.md        ← decision log D-001…D-013 + open issues
├── prompts/
│   ├── PHASE2_BRIEF.md     ← Phase 2 prompt (v1.2, all acceptance ✅)
│   ├── PHASE3_BRIEF.md     ← Phase 3 prompt (v1.0, CURRENT)
│   └── SESSION_PROMPT.md   ← living session opener
├── tests/
│   ├── check.sh            ← static rules + syntax + sim + forge test (run with bash)
│   ├── serve.mjs           ← localhost server for MetaMask (node tests/serve.mjs)
│   └── sim.mjs             ← headless game simulation (343 lines, 20 scenarios)
└── .claude/
    └── skills/             ← 30+ skills (dogeon-game, terminal-testing, solidity, rust, etc.)
```

---

## 8. User's standing rules

-1. **RULE #0 — Analyzer Prompt Master Gate (THE NUMBER ONE RULE BEFORE ANY DECISION):** Before taking ANY decision or writing ANY code, follow `prompts/ANALYZER_PROMPT_MASTER.md` and `AGENTS.md`: Explore (`@file#lines`, visual evidence, parallel audit subagents) → Verify Baseline (`bash tests/check.sh`, write failing test first for bugs) → Plan & Invariant Gate (game invariants, Solidity CEI/solvency, offline fallback, name collisions, seeded RNG) → Surgical Execution.
0. **RULE #1 — feature closeout:** after EVERY feature: tests green → `docs/DECISIONS.md` entry (feature, change, reference,
   files, code) → improve `prompts/SESSION_PROMPT.md` + `dogeon-game` skill (bump version) → update `AGENTS.md` + `CLAUDE.md` + this file + `MASTER_PROMPT.md` §G → commit.
   **Keep looping** through the iterations until done; full permissions granted, nothing dangerous.
1. **Always commit** after verified changes (Conventional Commits, end with `Co-Authored-By: Claude <model> <noreply@anthropic.com>`)
2. **Log decisions** in `docs/DECISIONS.md`
3. **Improve the prompt/skill** if the iteration taught something
4. **Teach testing** — use the `terminal-testing` skill
5. **MVP scope only** — no extra effects, no extra systems, keep basic style
6. **DOGE/Ð references everywhere** — overrides old "no Dogecoin logo" rule
7. **Minimalist and light** — cheap per frame, robust, basic style, **hard mode**
8. **Web3 (Phase 3 change):** real wallet + DogeOS Chikyū testnet txs. ethers v6 via CDN is the only game dependency.
   Game must stay fully playable with no wallet / CDN blocked (offline fallback).
9. **Art drawn in code** — no image files, sprites follow user's reference images
10. **Full access granted** — "if you want permissions you got it, don't do danger stuffs"

---

## 9. What's next

1. **Phase 3 code is complete** (IT-0…IT-6 + review fixes D-017/D-021). Remaining = USER steps: deploy contracts to Chikyū (contracts/README.md) and paste addresses into CONTRACTS['0x5fdaf3'] in index.html. Optional next: final review workflow over the whole Phase 3, open issues I-3…I-9. Anvil e2e: `anvil` + `forge script script/Deploy.s.sol --rpc-url local --broadcast --unlocked --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` → items 0x5FbDB2315678afecb367f032d93F642f64180aa3, dex 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512. Play locally: `node tests/serve.mjs` → http://localhost:8080/?chain=local.
2. Later / not requested yet: open issues I-3…I-9, polish.

Versions now: SESSION_PROMPT v2.0 · dogeon-game skill v2.0 · PHASE3_BRIEF v1.1 · DECISIONS up to D-022 (contract audit) · MASTER_PROMPT §F/§G ledger. Tests: 73 sim PASS (incl. anvil e2e) + 25 forge.
Run for wallets: `node tests/serve.mjs` → http://localhost:8080 (MetaMask does not inject into file://).
**Auto-resume:** the hourly cron job was deleted after Phase 3 finished (session-only; re-create with CronCreate if a new long autonomous run is needed).
Function selectors (cast sig, post-audit D-022): mint 0x352926a8 · burn 0x42966c68 · inventoryOf 0x7eaebb15 · mintFee 0x13966db5 · setApprovalForAll 0xa22cb465 · isApprovedForAll 0xe985e9c5 · list 0x50fd7367 · delist 0x964bc33f · buy 0xd96a094a · activeListings(uint256,uint256) 0xaa4df6f0 · listedCount 0xf36065b3 · addLiquidity(uint256[],uint256) 0xc5bb3168 · removeLiquidity(uint256,uint256,uint256,uint256) 0xf88bf15a · buyFromPool 0x66c1dbf3 · sellToPool 0x0de77491 · withdraw 0x3ccfd60b · proceeds 0x35adde54 · allPools 0xc5c63e65 · poolInfo 0x81ea4ee7
Note: `bash tests/check.sh` can exceed 30 s on Windows — run with a 120 s timeout, or `node tests/sim.mjs` directly.
