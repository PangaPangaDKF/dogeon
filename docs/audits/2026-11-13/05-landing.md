# Stage 5 — Landing truth & public face · 2026-11-13 · HEAD 4300c2c
## Scope covered
- Reports 00–04 read in full first. Skills: `dogeon-audit` §2–§3, `dogeon-landing-design` T1–T10 + checklist, `dogeon-agent-sync` (lanes).
- `landing.html` read in full: `<head>`/meta 1-20, CSS spot-checks (`.status-dot` 271-278, grids 303-313/486, video/shot 600-616, reduced motion 617-620),
  body 623-1516 (hero, `#heist`, `#characters`, `#economy`, `#mint`, `#faucet`, `#resources`, `#pvp`, `#party`, `#staking`, `#npcs`, `#contracts`, `#gallery`, `#build`, footer, both scripts).
- `assets/**`: listed all files with sizes; PNG sizes read from the IHDR header (hero 788×509 = `og:image` size; gallery 960×564, `01-title`/`02`/`06` 960×672; `dogecoin.png` 96×96, shown at 192 = 2×).
  Opened (Read) `01-title.png`, `hero-camp-coin.png`, `04-archer-bow.png`, `07-fishing.png`, `08-multiplayer-3p.png`, `06-sphinx-defi.png`, posters `mint.jpg`, `victory.jpg`, `trailer-720p.jpg`.
- `docs/TRAILER_SCRIPT.md` (154 lines), `scripts/trailer/build.sh` segments 36-56, `scripts/trailer/cards.mjs` 35-38, `scripts/landing-check.mjs` (via its output).
- Code compared: `src/game.js` tables 366-474, gather 381-403, `newGame` 486-503, combat 557-640, projectiles 1260-1268, `CHAIN` 677, `CONTRACTS/SEL/ITEM_TYPES/PRICES` 727-730, `RARITY/BUFFS/itemRoll/gearStats` 800-808,
  `stakeMenu` 849-858, `mintRows/shopMenu` 932-945, `elderMenu/dogeMasterMenu` 1021-1035, MULTIPLAYER `NET_LOOT` 1146, `partyMenu` 1148-1150, `bossCycle` 1162, update 1250-1255, HUD 1385, title hints 1445.
  Contracts: `DogeItems.sol` 19-34, 77-88 and function list; `DogeDEX.sol` 26-34, 93-118, 147-153; `deployments/6281971.json`. Relay: `server/relay.mjs` 20, 25-38, 48-50, 61, 118, 161-204; `Dockerfile`.
- Commands: `node scripts/landing-check.mjs` → exit 0. Output lines: `OK   add-network rpcUrls = https://rpc.testnet.dogeos.com`, `OK   chainId = 0x5fdaf3`,
  `OK   all 30 external URLs use known hosts`, `OK   all 4 live contract addresses present (CONTRACTS['0x5fdaf3'])`, `OK   no stray addresses`, `OK   27 referenced assets exist`,
  `OK   coin art comes from the game export`, `OK   no canvas FX`, `OK   no emoji icons`, `OK   no decorative numbered eyebrows`, `OK   nav has 7 links`,
  `OK   2 play CTAs -> /play or https://play.dogeon.lat`, `Landing matches the game.`
  `node -e` → `6281971 64 64` (0x5fdaf3 = 6281971; both proof tx hashes are 64 hex). `grep "1 WOOD+1 STONE" src/game.js` → 0 hits.
  `grep -o 'target="_blank"' | wc -l` → 19; `grep -c 'rel="noopener'` → 0.

### Claim map (landing claim → proof)
| Landing claim (`landing.html:line`) | Verdict | Code / D-entry |
|---|---|---|
| Up to 8 players **per server** (660, 674) | TRUE | `relay.mjs:118` total cap (S3-7) |
| 8 players **per room** (1054, 1056) | FALSE | same line: 8 is server-wide → S5-5 |
| Chain ID 6281971 / 0x5fdaf3, RPC, explorer, faucet (676, 955-972, 1450-1458, 928) | TRUE | `CHAIN` `src/game.js:677`; landing-check |
| 4 contract addresses + explorer links (1187-1202) | TRUE | `CONTRACTS` `:727`; landing-check |
| DogeItems role "9 gear types, rarity/meme rolls & burn-to-reroll" (1188) | FALSE | 15 types, no roll/reroll on chain → S5-2 |
| Warrior 135% dmg, +15% armor, Ground Pound 12 MP (744-748) | TRUE | `CLASSES :451-453`, `SKILL_MP :597` |
| Archer 125% speed, +17% attack rate, Volley 6 MP (762-766) | TRUE | `:455`, `atkCd` 0.24 vs 0.28 `:579` |
| Archer "piercing arrows" (759) | FALSE | arrow dies on first hit `:1265` → S5-7 |
| Healer 50 MP, +2 MP per hit, Mend +20 HP to you and nearby (780-784, 1043) | TRUE (base value) | `:459`, `:590`, `mend :614-619` (×bark skill up to 1.32) |
| Lazy: 180 s idle → 60 s at −15% speed (796-797) | TRUE | `:1254-1255`, `classSpd :466` |
| No in-game DOGE; testnet DOGE for mint, pools, stake, class (811, 819) | TRUE | D-097; S4-13 |
| Monsters drop "whiskers, wood, stone, iron" (811) | PARTLY FALSE | monsters drop whiskers/steel only `:436-444`, `:633-634` → S5-6 |
| Mint fee 1 DOGE, 80/20 split; pool trades 2% LP + 1% protocol split 80/20 (827-828) | TRUE in contract, conditional in practice | `DogeDEX.sol:27-30`; D-071; S1-3, S2-6 → S5-4, S5-10 |
| Meme rolls BLAZE 420 +420 HP … SPEED 6.9; curses −42/−6.9/−0.42; rarity ×1…×6 (858-868) | TRUE (computed by the game client) | `BUFFS/RARITY :802-805` |
| Burn-to-reroll "burns … and triggers a fresh random mint" (876-877) | MISLEADING | two txs, full fee, predictable roll → S5-3 |
| NFTs never drop on death (881, 1028) | TRUE | `respawn :571` (chain items untouched) |
| Real mint proof: forge → MINT HAMMER (891-892) | OUTDATED PATH | capture predates D-104 → S5-1 |
| Gather wood 3.5 s, regrow 14 s, hit cancels; rock gives 1 iron (993-998) | TRUE | `GATHER_DUR/CD :381`, `:396-397`, `hurtPlayer :561` |
| MP death pile: up to 3 of each of steel/wood/stone/whiskers (1026) | TRUE in MP | `respawn :568`, `NET_LOOT :1146` (offline: 4 steel + 4 whiskers, `:569-570`) |
| Camp safe, rest to 60% HP and full MP (1027, 1239-1240) | TRUE | `:559`, `:1229-1232`, `REST_CAP :371` (see S4-1) |
| P or Elder → party ALPHA/BRAVO/GOLD/SOLO; green/red tags (1040-1042) | TRUE | `:1027`, `:1148-1150`, `:1251` |
| "Server referees every PvP hit" (1041) | OVERSTATED | S3-4 → S5-5 |
| Slay 8 cats, 3 brutes, gate; boss +50% HP per extra player; returns in 60 s, room restarts at quest 1, `BOSS IN 45S` / `RAID ON` (1064-1075) | TRUE | `QUEST_MATS :376`, `relay.mjs:50`, `BOSS_RESPAWN :446`, `bossCycle :1162`, HUD `:1385` |
| Stake "any amount", "via the Sphinx or the Web3 interface", "earn" (1088-1095) | PARTLY FALSE | `PRICES :730` presets only; no other interface → S5-4 |
| Instant claim/unstake, no lockup (1104-1105) | TRUE today | `DogeStaking` v1 (D-105 plans locks; see S5-13) |
| DogeMaster unlocks at the Elder after the boss (1139) | TRUE | `elderMenu :1028` (`state.won`) |
| NPCs "in camp and in the ruins" (1117) | FALSE | all `NPCS` on camp pads `:306-308`, `:475-484` → S5-7 |
| Profession oath 0.05 DOGE (1198) | MATCHES json/default, not read live | `deployments/6281971.json:8`, `chainData.profFee` default → S5-10 |
| Title card "320×224, zero external runtime dependencies" (1256) | TRUE | CLAUDE.md §2; check.sh static rules (S0) |

## Earlier findings re-checked
| ID | Verdict | Evidence |
|---|---|---|
| S0-1 (json says 0.1 DOGE fee) | CONFIRMED, landing side | Landing says 1 DOGE in 4 places (827, 849, 888, 1100), which matches D-071, not the json. No RPC read here, so the live fee is still unverified → S5-10. |
| S0-2, S0-3, S0-4 | OUT OF SCOPE | Charter/line cap/dates. |
| S0 handoff for stage 5 (D-101, D-100, D-098, D-097, D-095) | CONFIRMED | Lore keeps the Heist + PonziFi split with testnet lines (697-718); no in-game DOGE copy (811); raid cards match D-095 (1060-1077); tx links well formed (64 hex). The D-098 mint capture is the gap (S5-1). |
| S1-1, S1-2 (JIT / 1-wei residual sniping) | EXTENDED | The landing promises stakers "80% of every 1 DOGE mint fee" (1100, 827) with no hint of the timing (S5-4). |
| S1-3 (owner can redirect the 80%) | EXTENDED | "split by the contract" (827) reads as fixed; `setStakingPool` is owner-settable (S5-4). |
| S1-4 (fee unbounded) | EXTENDED | Hardcoded "1 DOGE" on the page can drift from the chain (S5-10). |
| S1-5 (any tier mintable for the fee) | CONFIRMED, no landing claim breaks | The landing never says the contract enforces crafting. But it also never says the game asks you to craft first (S5-1). |
| S1-6, S1-7, S1-8, S1-9, S1-10 | OUT OF SCOPE | Contract hygiene/tests. The landing no longer mentions the oracle (T8 holds). |
| S2-2 (curses can push Max HP ≤ 0) | CONFIRMED, INFO for landing | The landing lists curses as a fun reroll reason (868, 876). It does not mention that a cursed roll can make a Healer unplayable. No copy change needed if BRAIN clamps the stats. |
| S2-3 (reroll burns first, mints in a second tx) | EXTENDED | The landing describes reroll as one atomic action (876-877, 1139) → S5-3. |
| S2-5 (EARN/YIELD language) | CONFIRMED on the landing | "earn testnet DOGE" (1088), tag "PONZIFI YIELD" (1085) → S5-4. The S2 handoff asked for "rewards come from mint fees (80%) and DEX fees (0.8%)"; the landing already says that (1100). |
| S2-6 (game never flushes mint fees) | EXTENDED | So "stakers receive 80% of every mint fee" is only true after an outsider calls `withdrawFees()` (S5-4). |
| S2-1, S2-4, S2-7…S2-11 | OUT OF SCOPE | Game/chain paths with no landing claim. |
| S3-1 (relay crash on `%`) | CONFIRMED fixed at HEAD | `server/relay.mjs:180` `let dec; try { dec = decodeURIComponent(pathname); } catch { res.writeHead(400); ...` (read only, not re-run). The landing is served by this relay, so the fix also covers `dogeon.lat`. |
| S3-4 (PvP trusts self-reported positions) | EXTENDED | "the server referees every PvP hit" (1041) overstates it (S5-5). Camp immunity for a victim inside camp holds: `relay.mjs:61` checks `inCamp(o.p)` on the victim's own position. |
| S3-7 (8 is a server-wide cap) | CONFIRMED | The hero says "per server" (correct); `#party` says "each server room holds up to 8" (wrong) → S5-5. |
| S3-8 (MP auto-on) | CONFIRMED, landing matches code | "multiplayer connects on its own" (934) is true. The law conflict (CLAUDE.md §2) is BRAIN's call; if BRAIN restores opt-in, this line must change. |
| S3-12, S3-13 (no security headers) | CONFIRMED, INFO for landing | The landing's "+ DogeOS RPC" button page can be framed (no `frame-ancestors`). Low risk: `wallet_addEthereumChain` always shows a wallet prompt. |
| S3-14 (Dockerfile) | CONFIRMED | `COPY index.html landing.html ./` and `COPY assets ./assets` (so retired screenshots ship too, S5-11). |
| S3-2, S3-3, S3-5, S3-6, S3-9…S3-11, S3-15, S3-16 | OUT OF SCOPE | Relay internals. |
| S4-1 (rest cuts HP to 60%) | CONFIRMED, INFO | "HP back to 60%" (1027, 1240) happens to describe the bug. After BRAIN's fix, "up to 60%" is the precise wording. |
| S4-3 (MP refills outside camp) | CONFIRMED, landing matches code | The landing advertises the staff MP siphon (777, 782). If BRAIN picks option (b) (cap MEND in the field), the Healer card must add it. |
| S4-7 (GAME_GUIDE stale) | EXTENDED | The landing skill names `docs/GAME_GUIDE.md` its second truth source (§2 row 2). Several landing errors match the guide (S5-6 drops). LANDING should use the stage-4 handoff numbers, not the guide. |
| S4-10 (title screen non-right sprites) | CONFIRMED in a landing asset | `01-title.png` shows left-facing cats (gallery card 1). It is a real capture, so T3 holds, but see S5-8. |
| S4-2, S4-4, S4-5, S4-6, S4-8, S4-9, S4-11, S4-12, S4-13 | OUT OF SCOPE | Game internals with no landing claim. |

## Findings
### S5-1 · MEDIUM · The "real mint" proof loop and the trailer show a mint path that D-104 removed
- Law: T1, T3 (captures must show today's game), N0 / D-104 (spend → get)   - Where: `landing.html:886-892`, `:849`; `assets/video/mint.mp4` + `mint.jpg`; `scripts/trailer/build.sh:45-48` (`$MINT` segments), `scripts/trailer/cards.mjs:37`   - Proof: TRACED
- Evidence: the poster `assets/video/mint.jpg` shows the selected forge row `MINT HAMMER NFT 1 WOOD+1 STONE (1 DOGE)`. `grep "1 WOOD+1 STONE" src/game.js` → 0 hits. Today the forge only offers `MINT ${itemName} NFT x${credits} (${fee})` for crafted credits (`src/game.js:932-933`). The media commit `59b94ff` (2026-11-13 01:37) predates D-104 `51c78bc` (2026-11-13 22:25). The copy at `:849` says "Mint verified ERC-721 gear NFTs for 1 Testnet DOGE" and never says you must craft first.
- Failure scenario: a visitor watches the proof loop or the trailer's "CRAFT IT. MINT IT." beat, joins, and looks for a "mint for 1 wood + 1 stone" row. It does not exist. The page's "trust that the on-chain parts are real" proof now shows a removed feature. The tx hashes themselves are still real history.
- Fix (smallest): BRAIN recaptures S5 (CRAFT HAMMER LV2 at the forge → `MINT HAMMER LV2 NFT x1 (1 DOGE)` → wallet → explorer) and rebuilds `assets/video/mint.*` and the trailer. Until then, LANDING captions the loop "Recorded before D-104 …" or hides it. Change `:849` to "Craft gear at the forge, then mint it as an ERC-721 for the mint fee".   - Lane: BRAIN (media) + LANDING (copy)   - Contracts: no

### S5-2 · MEDIUM · The contracts table and mint copy credit DogeItems with things it does not do on chain
- Law: T1, T5 (the contract table is the trust anchor), landing role "make them trust that the on-chain parts are real"   - Where: `landing.html:1188`, `:849`, `:858`   - Proof: TRACED
- Evidence: the table row says `DogeItems (ERC-721)` = `9 Gear NFT Types, Rarity/Meme Rolls & Burn-to-Reroll`. `DogeItems.sol:19-34` defines 15 types (hammer, armor, raw/cooked fish, bone charm, moon biscuit and 9 DOGE gear). Its functions are `maxLevel, mint, burn, withdrawFees, setStakingPool, setMintFee, setTreasury, inventoryOf, typeName, _color, tokenURI`. There is no rarity, roll or reroll. The roll is computed by the game client: `function itemRoll(id){…}` (`src/game.js:806`). Reroll is `burnAndReroll` (`:830`), a burn tx followed by a separate mint tx. `:849` also says "Mint **verified** ERC-721", but skill changelog 1.7 dropped "VERIFIED" because explorer source verification was never shown.
- Failure scenario: a builder (the `#build` section invites them) reads the contract on the explorer to find the meme-roll logic and finds none. The page looks like it overclaims on-chain features, which is the trust the landing exists to build.
- Fix (smallest): row → "ERC-721 items: 15 types (gear, food, charms); mint for the fee, burn". Under the meme rolls, add: "The game derives each item's roll from its token ID (open source), so every player sees the same roll." Drop "verified" unless the explorer shows verified source.   - Lane: LANDING   - Contracts: no

### S5-3 · MEDIUM · Burn-to-reroll is described as one random action; it is two transactions, costs a full mint fee, can lose the NFT, and the new roll is predictable
- Law: N1 (the user sees the true cost), N4 (a failed path must not lose the input; S2-3), T1   - Where: `landing.html:874-877`, `:850`, `:1139`; `src/game.js:830`; `contracts/src/DogeItems.sol:81`   - Proof: TRACED
- Evidence: landing: "burns your debuffed ERC-721 NFT on-chain and triggers a fresh random mint." Code: `await etx(…SEL.burn…,0);await etx(…SEL.mint…,chainData.fee||10n**17n);`. Contract: `tokenId = nextId++;`, and the roll is `itemRoll(tokenId)`, so the next roll can be computed before minting.
- Failure scenario: a player sacrifices an item and rejects the second wallet prompt (not expecting a 1 DOGE charge). The item is burned and nothing replaces it (S2-3). A sharper player computes `itemRoll(nextId)` and mints only when the next id is LEGENDARY, so the roll is not "random".
- Fix (smallest): copy: "Burns the item, then asks for a second transaction to mint a new one for the mint fee. Reject the second and the old item is gone. The new roll comes from the new token ID." Remove "random". The game-side guard (S2-3) and an atomic reroll (v2 plan) stay BRAIN items.   - Lane: LANDING (copy) + BRAIN (S2-3)   - Contracts: plan item (already in S2-3)

### S5-4 · MEDIUM · Staking copy says "earn", promises 80% of every mint fee unconditionally, and invents an amount choice and a "Web3 interface"
- Law: N5 (no "earn" language; honest PonziFi), T8 (no yield promise), T1   - Where: `landing.html:1085`, `:1088`, `:1094-1095`, `:1099-1100`, `:827`; `src/game.js:730`, `:849-858`   - Proof: TRACED
- Evidence: `PONZIFI YIELD`, "Stake testnet DOGE, **earn** testnet DOGE from everyone else's mint and trade fees", "Stake any amount of Testnet DOGE directly via the Great Sphinx in camp or the Web3 interface", "Stakers receive 80% of every 1 DOGE mint fee". Code facts: the Sphinx offers only `PRICES=[0.1,0.25,0.5,1,2,5,10,25,50]` (`:730`, used by `stakeMenu :852`). No other staking interface exists in the repo. Mint fees reach stakers only when someone calls `DogeItems.withdrawFees()`, which the game never does (S2-6). A same-block stake/flush/claim/unstake or a 1-wei stake into an empty vault takes the pile (S1-1, S1-2), and the owner can repoint `stakingPool` (S1-3).
- Failure scenario: a player stakes 1 DOGE expecting a steady share of every mint, sees `PENDING REWARDS: 0` forever in the game (no flush), while a bot that flushes in its own tx collects the mint fees.
- Fix (smallest): retag `PONZIFI SATIRE`. Replace "earn" with "get a share of". Say "Pick 0.1 to 50 testnet DOGE at the Sphinx" and drop "Web3 interface". Add: "Mint fees reach stakers when anyone flushes them on chain (`withdrawFees`); DEX fees sync from the Sphinx." Keep the testnet disclaimer in the section.   - Lane: LANDING (+ BRAIN S2-5/S2-6 in game)   - Contracts: plan item (S1-1/S1-2/S1-3 already)

### S5-5 · MEDIUM · Multiplayer claims: "each server room holds up to 8 players" is false, and "the server referees every PvP hit" overstates the relay
- Law: T1, D-076, S3-7, S3-4   - Where: `landing.html:1054-1056`, `:1041`; `server/relay.mjs:118`, `:61`, `:126`   - Proof: TRACED (S3-7's PROVEN probe: a 9th player joining an empty room got `SERVER FULL (8/8 PLAYERS)`)
- Evidence: `if (total >= MAX_ROOM || r.size >= MAX_ROOM) { send(c, … 'SERVER FULL (8/8 PLAYERS)' …` where `total` counts every room. The hero (660, 674) correctly says "per server", but `#party` says "Each server room holds up to **8 players**". For PvP, the relay checks range and camp only on positions the clients report themselves, and the victim's client applies the damage (S3-4).
- Failure scenario: two friend groups each make a private `?room=` expecting 8 slots each. The 9th player overall gets SERVER FULL. Players who read "the server referees every hit" assume cheaters cannot teleport-hit them.
- Fix (smallest): `#party` → "Up to 8 players on the server at once; the whole room shares one Cat Lord". `:1041` → "the server checks range and camp for every PvP hit". If BRAIN changes the cap to per-room (S3-7), switch back.   - Lane: LANDING (copy); BRAIN decides S3-7   - Contracts: no

### S5-6 · LOW · Economy copy drift: monsters do not drop wood or stone, and the network table still says "in-game economy"
- Law: T1, D-097, D-067   - Where: `landing.html:811`, `:967`; `src/game.js:436-444`, `:633-634`   - Proof: TRACED
- Evidence: "Monsters drop materials only (whiskers, wood, stone, iron)". `ETYPES` gives `mat:'whisk'` or `mat:'steel'`, and `killEnemy` adds 25% `steel`. Wood and stone come only from gathering (`nodeAt :382`), quests (`QUEST_MATS :376`) and the Golden Yarn (`YARN_MATS :434`). The table row `DOGE (18 Decimals) | Gas and in-game economy` contradicts "There is no in-game DOGE" (811) on the same page.
- Failure scenario: a player farms cats for stone, gets none, and reads the page as wrong elsewhere too.
- Fix (smallest): "Monsters drop whiskers and iron; trees and rocks give wood and stone." Table note → "Gas, mints, pools, staking".   - Lane: LANDING   - Contracts: no

### S5-7 · LOW · Small false or unsupported feature lines
- Law: T1   - Where: `landing.html:759`, `:1117`, `:913`, `:656` + meta `:7`   - Proof: TRACED
- Evidence: (a) Archer "unleash **piercing** arrows". In the code, `if(p.kind==='arrow'){p.life=0;break;}` (`src/game.js:1265`) stops each arrow at the first enemy. (b) "Interact with key characters in camp **and in the ruins**". Every `NPCS` entry sits on `PADS/PADS2/PADS3` inside the camp (`:306-308`, `:475-484`). (c) "Getting setup takes less than 60 seconds with MetaMask, Rabby, or Bitget Wallet": no test or D-entry backs the time or the Rabby/Bitget support (the button does handle `window.bitkeep`, `:1436`). (d) "SURVIVE THE EXTRACTION RAID" and meta "dungeon extraction raid": since D-095 there is no extraction timer (skill changelog 1.15 removed the "30-minute extraction timer" caption). "Carry loot back to camp" still fits the word loosely.
- Failure scenario: small trust leaks. Archers expect pierce, and players look for NPCs in the ruins.
- Fix (smallest): "fast arrows"; "in camp"; "takes a minute"; keep "raid" and drop "extraction" (or define it as "carry your loot home to camp").   - Lane: LANDING   - Contracts: no

### S5-8 · LOW · Gallery captions promise more than their pictures show; the title capture is out of date
- Law: T1, skill changelog 1.10 ("check each gallery caption against what its picture actually shows")   - Where: `landing.html:1278-1285`, `:1306-1313`, `:1250-1256`   - Proof: PROVEN (images opened)
- Evidence: `04-archer-bow.png` shows one archer and three cats with no arrow or volley in flight. The caption says "picking off feline patrols … with arrow spread volleys". `07-fishing.png` shows a pond, trees and a fence with **no player**. The caption says "Mining guaranteed iron from stone, chopping lumber, and fishing". `01-title.png` hints `K BARK` with no `P PARTY`. The current title shows `WASD MOVE  SPACE SLASH  K BARK/SKILL  F FISH  I BAG  P PARTY` (`src/game.js:1445`), and the cats face left (S4-10).
- Failure scenario: the gallery cards labeled as mechanics show scenery.
- Fix (smallest): recapture archer mid-volley and a gather/fish bar (BRAIN media), or caption what is shown ("The field pond outside camp").   - Lane: LANDING (captions) / BRAIN (captures)   - Contracts: no

### S5-9 · LOW · Hero lacks "not financial advice"; a pulsing green dot makes a static cap look like live server status
- Law: T8 (hero AND footer keep "testnet, no real-world value, not financial advice"), T2 (no fake live data)   - Where: `landing.html:658-662`, `:672-674`; CSS `:271-278`   - Proof: TRACED
- Evidence: hero text ends "Everything runs on free testnet DOGE with no real-world value." (no NFA). The footer `:1405` has all three. `<span class="status-dot"></span> UP TO 8 PLAYERS PER SERVER` uses a green `box-shadow` dot with `animation: pulse 1.5s infinite`, which is the usual "server online" signal. Nothing checks the server.
- Failure scenario: visitors read the dot as "server up" when the Fly machine may be asleep (skill §10 step 8) or full (S3-7).
- Fix (smallest): append "Not financial advice." to the hero line. Remove the dot or make it static grey.   - Lane: LANDING   - Contracts: no

### S5-10 · LOW · Fees are hardcoded on the page while the game reads them live and the deployment record disagrees
- Law: N1, T1 (one source of truth), S0-1, S1-4   - Where: `landing.html:827`, `:849`, `:888`, `:1100` ("1 DOGE"), `:1198` ("0.05 DOGE"); `contracts/deployments/6281971.json` (`mintFee` 0.1, `profFee` 0.05); `src/game.js:751` (`refreshChain` reads `mintFee()`)   - Proof: TRACED (live value not read: no RPC)
- Evidence: the landing says 1 DOGE (D-071), the json says `100000000000000000`, and `setMintFee` is unbounded (S1-4). `:888` claims "Each mint paid exactly 1 testnet DOGE". BRAIN checked the receipts in D-098, but this stage did not re-verify them.
- Failure scenario: the owner changes the fee or a redeploy uses the script default of 0.1 (S1-6). The page then states a wrong price in five places, and landing-check stays green.
- Fix (smallest): say "the mint fee (1 testnet DOGE today; the game shows the live fee before you sign)". Once S0-1 is fixed, add a landing-check assertion that the page's number equals `deployments/6281971.json`.   - Lane: LANDING (+ BRAIN for the json)   - Contracts: no

### S5-11 · LOW · Retired screenshots with a DOGE price, in-game DOGE and the old raid timer are still deployed
- Law: T8 ("images count too"), D-097, D-095   - Where: `assets/screenshots/06-sphinx-defi.png`, `02-camp-coin.png`, `03-combat-warrior.png`, `05-boss.png` (unreferenced by `landing.html`); `Dockerfile` `COPY assets ./assets`; `server/relay.mjs:182` serves `/assets/**`; `docs/TRAILER_SCRIPT.md` §4 table   - Proof: PROVEN (image opened) + TRACED (served)
- Evidence: `06-sphinx-defi.png` shows `DOGE $0.299`, `RAID 30M`, `+20% BULL`, `CARRIED: 0 DOGE`, `VAULT: 0`, `STAKE 0 DOGE IN THE VAULT (+1%)`, `BUY BONE CHARM (50 DOGE)`, `EARN 0.8% OF DEX FEES`. It is reachable at `https://dogeon.lat/assets/screenshots/06-sphinx-defi.png`. `02-camp-coin.png` (960×672, HUD not cropped) and `05-boss.png` are still the reference images that TRAILER_SCRIPT §4 tells nano banana to use.
- Failure scenario: a search engine or a shared link surfaces a price and a "+1% vault" yield from the official domain, which T8 forbids. AI key art made from `02-camp-coin.png` carries the HUD price.
- Fix (smallest): delete the four unreferenced PNGs (LANDING owns `assets/screenshots/`), and point TRAILER_SCRIPT §4 at `hero-camp-coin.png` / `assets/video/victory.jpg` (BRAIN owns that doc).   - Lane: LANDING + BRAIN   - Contracts: no

### S5-12 · LOW · Web-quality and accessibility hygiene
- Law: skill §5.8 (accessibility, reduced motion), §6 checklist   - Where: `landing.html` 19 × `target="_blank"` (e.g. `:644`, `:928`, `:1187`), `:1250/1264/1278/1292/1306/1320` (`div onclick`), `:1251/1279/1307/1321` (img without size), `:1508`, `:617-619` + `:1482-1497`, footer `h4` after `h2`   - Proof: TRACED (`grep` counts in Scope)
- Evidence: 0 `rel="noopener"` (modern browsers imply `noopener`, but the referrer is still sent to the external sites). Gallery tiles open the lightbox only by mouse: a `div` with `onclick`, no `tabindex`/`role="button"`/Enter handler. The lightbox `alt="Enlarged DOGEON Screenshot"` is generic. The four gallery `<img>` have no `width`/`height` (layout shift). Under reduced motion the CSS hides `#bg-canvas`, but the `requestAnimationFrame(render)` loop keeps running. Footer `h4` headings skip from the `#build` `h2`.
- Failure scenario: keyboard and screen-reader users cannot open the gallery. Phones burn CPU on a hidden canvas.
- Fix (smallest): `rel="noopener noreferrer"` on external links; make gallery tiles `<button>` (or `tabindex=0` + key handler) and pass the card's alt to the lightbox; add `width="960" height="564"` (672 for the title); skip `initCanvas` when `matchMedia('(prefers-reduced-motion: reduce)')` matches.   - Lane: LANDING   - Contracts: no

### S5-13 · INFO · landing-check guards URLs and addresses but no numbers; v2 plans will falsify today's staking copy
- Law: T1 tooling   - Where: `scripts/landing-check.mjs` (76 lines; checks in Scope), `docs/CONTRACTS_V2_PLAN.md` (D-105: staking locks, fees)   - Proof: PROVEN (green while S5-4…S5-7 stand)
- Evidence: all 12 checks are URL, address, asset, emoji, nav or CTA checks. None compares a number (player cap, class stats, fee split, buff values) with code. Separately, "No lockup lock-in traps … withdraw … at any time" (1104-1105) is true for v1 but becomes false when the D-105 locks ship.
- Fix (smallest): add assertions: `8 players` ↔ `MAX_ROOM` + server-wide wording; class numbers ↔ `CLASSES`/`SKILL_MP`; buff list ↔ `BUFFS`; `0.8%`/`80%` ↔ `DogeDEX.sol` `STAKER_BPS` and DogeItems split. Put "update landing staking cards" in the v2 deploy checklist.   - Lane: LANDING (check) / BRAIN (v2 checklist)   - Contracts: no

### S5-14 · INFO · What holds
- T5/T7: chain id, RPC, explorer, faucet and all four addresses equal `CHAIN`/`CONTRACTS`. Explorer links use `dogeos-testnet.l2scan.co/address/` and `/tx/` with 64-hex hashes. (Name strings differ slightly, `DogeOS Chikyū Testnet`/`DOGE` vs the game's `DogeOS Chikyu Testnet`/`Dogecoin`, which is harmless.)
- T8: no price, USD or oracle text on the page. PonziFi is framed as satire with testnet lines in the hero, lore, economy and footer (S5-4 and S5-9 are wording gaps).
- T9: coin art is the game export (`dogecoin.png` 96×96 at 2×, pixelated). No `MOSAIC` data or canvas FX (landing-check).
- T3: every gameplay image and poster opened is a real capture. The hero is HUD-cropped (only the bottom hint line remains). Trailer and victory posters show no price or DOGE.
- Class numbers, buffs/rarity, lazy debuff, gather timings, iron-from-stone, MP death pile, party rules, raid cycle (+50% HP, 60 s, quest-1 reset, `BOSS IN`/`RAID ON`), DogeMaster unlock and NFT-safe-on-death all match code (claim map).
- Only external requests: Google Fonts (3 families, `display=swap`). Both scripts are inline and small. The trailer uses `preload="metadata"` with a poster. Loops use `preload="none"` + poster, and reduced motion strips autoplay. Grids use `minmax(min(N,100%),1fr)`, and wide tables sit in `.table-wrap`.
- Serving: `/` → `landing.html`, `play.*`/`/play` → game (`relay.mjs:167-174`). `Dockerfile` ships `landing.html` + `assets/`. The D-107 decode guard is present (`relay.mjs:180`).

## Not checked (and why)
- Live site, live RPC and link targets: no network or RPC calls (read-only contract). The D-098 tx receipts, the live `mintFee`/`fee`, explorer source verification, and the HTTP status of `docs.dogeos.com/en/getting-started/overview`, `github.com/PangaPangaDKF/dogeon`, `heist.dogeos.com` were not fetched.
- Rendering: no headless Chrome run (not in the allowed command list), so phone-width overflow (390/360 px) and the 1280 px desktop were reviewed only from CSS. Video frames beyond the posters were not extracted (ffmpeg not in the allowed list), so frame-by-frame T8 checks of `trailer-720p.mp4`/`warrior.mp4` rely on D-099/D-100.
- `bash tests/check.sh` not re-run in this stage (stage 4 ran the sim at this HEAD; the landing is not part of the sim).
- `og:image` absolute URL resolution (needs network).

## Handoff to the next stage
- **Stage 6 (verifier):** nothing new to probe; the list to verify is S5-1 … S5-12 (S5-13/S5-14 are INFO).
  - Fastest checks: S5-1 open `assets/video/mint.jpg` and `grep -n "1 WOOD+1 STONE" src/game.js` (0 hits). S5-2 `grep -n "function " contracts/src/DogeItems.sol` (no roll/reroll). S5-5 `server/relay.mjs:118` + `landing.html:1056`. S5-7(a) `src/game.js:1265` `if(p.kind==='arrow'){p.life=0;break;}`. S5-11 open `assets/screenshots/06-sphinx-defi.png`.
  - Try to disprove S5-3's "predictable roll": `DogeItems.sol:81` `tokenId = nextId++` + `itemRoll(id)` `src/game.js:806`. `DogeItems.sol:44` `uint256 public nextId = 1;` makes the next id a free view call (the game itself never reads it: 0 hits in `src/game.js`).
- **LANDING board tasks (for BRAIN to post after stage 6):** S5-2, S5-3, S5-4, S5-5, S5-6, S5-7, S5-9, S5-10 (copy), S5-8 captions, S5-11 delete the four PNGs, S5-12 a11y, S5-13 landing-check numbers. **BRAIN:** S5-1 recapture the mint + rebuild the trailer, S5-8 recaptures, S5-11 TRAILER_SCRIPT §4 refs, S3-7 cap decision (drives S5-5 wording), S0-1 json fee (drives S5-10).
