# Stage 4 — Gameplay invariants & code health · 2026-11-13 · HEAD 4300c2c
## Scope covered
- HEAD moved `a3bbc4e` → `4300c2c` (D-107). `git diff a3bbc4e 4300c2c --stat -- src/ tests/sim.mjs` → empty: `src/game.js` and `tests/sim.mjs` are unchanged, so the line numbers in reports 00–03 still apply to the game.
- Read in full: `src/game.js` GAME STATE 365-529, COLLISION 530-549, FX 551-555, COMBAT 557-640, ENEMY AI 642-672, UI 886-1130, MULTIPLAYER 1132-1209 (gameplay hooks only), UPDATE 1210-1289, RENDER 1291-1462, INPUT 36-43, FONT 44-51; plus the CHAIN gear/credit helpers 796-830 and `refreshChain`/`chooseProfession` 751-777.
  Also `tests/sim.mjs` (harness 1-135 and the invariant scenarios), `docs/GAME_GUIDE.md` (187 lines), CLAUDE.md §4, skills `dogeon-game`, `dogeon-mission`, `dogeon-hardcore-mechanics`. Reports 00-03 read first.
- `node tests/sim.mjs` → exit 0, 55 scenarios, 130 PASS, `✓ 0 failed, 0 warnings (seed 4242)`; one `SKIP  chain e2e: anvil not running or contracts not deployed`.
- Probes. These are scratch scripts outside the repo. Each one loads the real `src/game.js` in a `vm` sandbox with the sim's seeded RNG. Output lines:
  - `A camp? true hp before 54` / `A hp after 4s rest 36 cap 36`
  - `B in-camp gather/fish spots: 0 []`
  - `C full bag quest2 reward: wood 0 -> 0 stone 0 -> 0 steel 2 -> 6`
  - `D yarn items after cycle: 1 stage 1`
  - `E full HP, rest for MP 5s: hp 36 mp 16.0`
  - `F boss kill at stage 0 -> stage 4 won true`
  - `G warrior hp 10/85 mp 0/20 | -> healer hp 10/45 mp 30/50 | -> warrior hp 50/85 mp 20/20 | -> healer -> warrior hp 85/85 mp 20/20 inCamp true`
  - `H healer in field after 20 s of staff hits: hp 45 / 45 (60% cap 27) mends 2`
  - Glyph scan: compared every UI string to the `FONT` keys. `itemRoll` re-run: `61 UNCOMMON: HANGOVER 420 hp -63`, `126 RARE: HANGOVER 420 hp -96.6`, `3 RARE: NICE 69 atk 158.7`.
  - FX check, recent commits (added/removed `sfx(`/`shake(`/`puff(`/`parts.push` lines): `51c78bc +0 -0`, `27fb13c +2 -2`, `b907819 +0 -0`, `ab8e136 +5 -7`, `7d05d41 +4 -6`, `ec29747 +1 -1`.

### Invariant map (CLAUDE.md §4 → code → sim → how it breaks)
| Invariant | Enforced at | Sim proof | Break / gap |
|---|---|---|---|
| Camp fully safe | `hurtPlayer` guard `:559`; `solidFor` camp tiles for `ent.enemy` and bones `:531`, `:1263`; enemies never hurt in camp `:671` | `camp is fully safe` (20 s), `in-flight bone…`, per-frame `checkFrame` (no enemy tile in camp) | Holds offline. MP: S3-4 (spoofed PvP position) |
| Rest: 3 s, +10 HP/s to 60%, +8 MP/s | `update` `:1229-1232` | `rest needs REST_DELAY…`, `rest caps HP at 60%…` (both start **below** the cap) | **S4-1** (rest cuts HP down to 60%), **S4-2** (class switch heals) |
| Above 60% only food | `invMenu` eat `:1101`; `useNft` `:824` | `food: RAW +15, COOKED +25…` | S4-2, S4-3, S3-3 |
| MP refills only in camp | rest `:1231` | none | **S4-3** (staff +2 MP/hit `:590`, salmon MP `:410-411`, class switch `:472`) |
| Skills by use | `attack :590`, arrows `:1265`, skills `:594/602/609/617`, fish/gather `:398/:403` | `skills grow only by use…` | holds |
| Fishing / gathering outside camp, cancels on hit/move/attack | `startFish :383`, `hurtPlayer :561`, move `:1237`, `attack :579` | `fishing: …snaps…`, `D-053…`, map ponds not in camp | Probe B: 0 gather/fish spots inside camp (PROVEN). No sim asserts it for trees/rocks |
| Bag 12 slots, food 5, others 20 | `addToBag :413` | `inventory: … 12 slots…` | **S4-4** (rewards lost when the bag is full) |
| Death: lose whiskers, materials, bag; 35% HP/MP | `respawn :566-576` | `death respawns…`, `death loses all materials`, `death empties the bag` | Whiskers are not asserted. Offline, up to 4 steel + 4 whiskers drop on the ground for 30 s (S4-12 docs) |
| No in-game DOGE (D-097) | no `P.doge/P.bank`, no coin items | `checkFrame` per frame + D-097 scenario | holds. Grep finds 0 hits for `P.doge` in `src/game.js` |
| One wood/stone counter (D-103) | `BAG_MATS`/`matN/matAdd/matTake :415-416` | `D-103…` | holds. Grep finds 0 hits for `P.wood`/`P.stone` |
| Spend → get (D-104) | `mintNft :815-823`, `creditOk :812`, `mintRows :932` | `no free mint`, `market no free mint` | `?mod=1` hole (S2-1). Off-chain side holds |
| Raid cycle 60 s (D-095) | `killEnemy :638`, `update :1223`, `bossCycle :1162` | `D-095: raid cycle…` | **S4-9** (yarn left behind). Probe F: a boss kill at any stage sets stage 4 (reachable only via MP/mod, see S3-2) |
| Classes | `CLASSES :450-462`, `syncMaxHp/Mp :470-472`, `attack :578`, `useSkill :599` | `faction trainers…`, `class skills…`, `D-054…`, `D-038…` | S4-2, S2-2 (negative Max HP) |
| Quests 0→4 | `questTalk :1081-1093`, `killEnemy :636-637`, `QUEST_MATS :376` | `D-089: NPCs never give DOGE…` | S4-4 (full bag) |
| Populations 52/6, 3 s / 20 s | `:376`, `update :1276-1278`, `newGame :491-495` | `enemy pressure…`, `D-089: fast respawn…`, `D-057…` | holds |
| Controls | `update :1229-1252`, `updateUI :1113-1129` | random play, inventory, skills | `kp('q')` both closes menus and casts the skill. Harmless, because menus pause the world |
| Entity removal after loops | `:1258`, `:1267`, `:1274`, `groundPound :605` (runs outside the enemy loop) | — | holds. No `splice` inside an entity loop (`bagRemove` splices its own index loop backwards, which is safe) |
| R2 light | — | check.sh static rule | Recent commits added no FX or sound (net 0). Existing: 51 `sfx(`, 6 `shake(`, 8 `puff(`, 4 `parts.push` (mission §7 gap, not new) |
| R3 frozen right | `drawChar :1300` | — | **S4-10** (title screen and dialog portraits) |

## Earlier findings re-checked
| ID | Verdict | Evidence |
|---|---|---|
| S0-1, S0-4 | OUT OF SCOPE | Deploy metadata / dates. |
| S0-2 (charter says index.html, healer-heals-others "Missing") | CONFIRMED | `mend` sends `{t:'heal'…}` at `:619`. Receiver at `:1181-1185`. The charter row is stale. |
| S0-3 (25 lines to the cap) | CONFIRMED | `wc -l src/game.js` = 1475. Every fix below must go to a new `src/*.js`. |
| S1-1…S1-10 | OUT OF SCOPE | Contracts. S1-5 is relevant only through S2-2. |
| S2-1 (`?mod=1` mod menu) | CONFIRMED | `:1036-1044`, `:1252`. Gameplay effects: GOD MODE skips `hurtPlayer` (`:559`), `INSTA-KILL BOSS` sets `stage=4` without `bossT` (so no raid cycle), and the mod class switches skip the oath. |
| S2-2 (uncapped gear rolls, negative Max HP) | CONFIRMED + EXTENDED | Re-ran `itemRoll`: `61 … hp -63`, `126 … hp -96.6`. Extended by S4-2: `syncMaxHp` also adds every positive Max HP delta to current HP. |
| S2-3, S2-5, S2-6, S2-7, S2-10, S2-11 | OUT OF SCOPE | Chain/tx paths. |
| S2-4 (gear NFTs 7–15 offered `[USE, BURNS]`) | CONFIRMED | `:1109` checks only `it.type<=2`. `useNft :824-828` has no branch for 7–15. |
| S2-8 (refund edge cases) | EXTENDED | (b) a fish lost on a full bag is one case of a wider pattern: quest, yarn, gather and relay rewards are all lost on a full bag (S4-4). |
| S2-9 (sim gaps, vacuous `P.doge` check) | CONFIRMED + EXTENDED | `tests/sim.mjs:529-532`, `:673-677` compare `undefined` with `undefined`. More gaps in S4-11. |
| S2 handoff: credits, `P.sword/armor`, `hpUps` survive death | CONFIRMED (matches §4; misleading text) | `respawn :571` clears only whiskers, steel, legacy mats and the bag. §4 lists only DOGE, whiskers, materials and the bag, so crafted gear surviving is consistent. But the respawn dialog `:576` says to "Mint gear… they live on chain and stay safe!", which implies unminted gear is lost (S4-6). |
| S3-2 (forged boss kill resets the room) | EXTENDED | Probe F: `killEnemy(boss)` at stage 0 → `stage 4 won true` (`:638` `if(state.stage<4)state.stage=4`). Any player in the boss room when the relay says dead gets the win, the yarn and DogeMaster, whatever their quest stage. |
| S3-3 (heal amt/r trusted) | CONFIRMED | `:1182-1183` `Math.hypot(...)<=(m.r||72)`, `amt=Math.max(1,m.amt|0)` with no upper bound. `docs/GAME_GUIDE.md:95` says the heal is "capped", which is false (S4-7). |
| S3-4, S3-5, S3-6, S3-7, S3-9…S3-14 | OUT OF SCOPE | Relay. |
| S3-1 (relay crash) | OUT OF SCOPE (BRAIN reports it fixed in D-107) | `4300c2c` touches only `server/relay.mjs`, `tests/relay.mjs` and docs. Not re-tested here. |
| S3-8 (MP on by default) | CONFIRMED (docs side) | `:1139` auto-connects. `GAME_GUIDE.md:132-133` says both "opt-in" and "auto-connects" in one sentence (S4-7). |
| S3-15 (stale MP comments) | CONFIRMED | `:1133-1136` still says "OFF unless the URL has ?mp" and "Shared enemies and loot … NOT built". |
| S3 handoff: Golden Yarn gives "+150 off-chain DOGE" | DISPUTED | Since D-097 the yarn pays `YARN_MATS={wood:3,stone:3,steel:3}` (`:434`, pickup `:1272`). There is no DOGE. Only CLAUDE.md §4 still says +150 DOGE (S4-8). |

## Findings
### S4-1 · HIGH · Resting cuts HP above 60% down to 60% (resting to refill MP costs HP)
- Law: CLAUDE.md §4 Healing (rest heals *up to* 60%), core loop   - Where: `src/game.js:1231`   - Proof: PROVEN
- Evidence: `const hpCap=Math.ceil(P.maxHp*REST_CAP);P.hp=Math.min(hpCap,P.hp+REST_HP*dt);`. Probe A: `hp before 54` → `hp after 4s rest 36 cap 36`. Probe E: full HP, rest for MP → `hp 36 mp 16.0`.
- Failure scenario: the player eats a cooked fish to 54/60 (or a Healer MENDs to full), then holds R in camp to refill MP. After 3 s their HP snaps to 36 (60%), so food or MP spent above the cap is thrown away. Healers and warriors must rest for MP, so this hits every class. The HUD shows `HP CAPPED AT 60%. EAT FOOD FOR MORE.`, which is accurate but punishing.
- Fix (smallest): `if(P.hp<hpCap)P.hp=Math.min(hpCap,P.hp+REST_HP*dt);`. Add a sim case that starts at 90% HP and asserts HP does not drop.   - Lane: BRAIN   - Contracts: no

### S4-2 · HIGH · Switching class at the trainers is a free full heal and MP refill (bypasses REST_CAP and REST_DELAY)
- Law: CLAUDE.md §4 Healing ("heal ONLY by resting… 60% maxHp only"; above that, food), hardcore Axiom 1   - Where: `src/game.js:470`, `:472`, `:473`, `:917`, `:775`   - Proof: PROVEN
- Evidence: `syncMaxHp(){…d=base-P.maxHp;P.maxHp=base;if(d>0)P.hp+=d;…}` (same in `syncMaxMp`). Offline local switch: `SWITCH TO ${c.name} (LOCAL)` → `applyClass(n.cls,false)`. Probe G: `warrior hp 10/85 mp 0/20 | -> healer hp 10/45 mp 30/50 | -> warrior hp 50/85 | -> healer -> warrior hp 85/85`.
- Failure scenario: a no-wallet player (the default, N7) comes back to camp at 10 HP. Talking to Mender, then Ironpaw, twice, gives 85/85 HP and full MP in a few seconds: no rest delay, no 60% cap, no food. The same `d>0 → hp+=d` rule also heals whenever Max HP rises for any other reason: a `refreshChain` that sees a new +HP gear NFT (each `invMenu` open calls it, `:1112`), a delist after a list, or `useNft` of a charm. With S2-2 rolls (+420×mult HP) that is a large heal anywhere.
- Fix (smallest): never raise current HP or MP when the max rises (`P.maxHp=base;P.hp=Math.min(P.hp,base)`). Keep the "+HP" only as headroom to fill by resting or eating. Add a sim case: switch class at 10 HP, expect HP unchanged.   - Lane: BRAIN   - Contracts: no

### S4-3 · MEDIUM · "MP refills ONLY by resting in camp" is false: staff hits and salmon refill MP in the field, so the Healer sustains above 60% indefinitely
- Law: CLAUDE.md §4 Classes ("MP refills ONLY by resting in camp, so the camp-sanctuary + greed-vs-safety invariants still hold"), `GAME_GUIDE.md:72`   - Where: `src/game.js:590`, `:410-411`, `:1101`, `:618`   - Proof: PROVEN
- Evidence: `if(hit){P.skills.combat++;if(P.prof==='healer')P.mp=Math.min(P.maxMp,P.mp+2);}`. `raw_salmon:{…mp:10}`, `cooked_salmon:{…mp:25}` can be eaten anywhere. MEND heals to `P.maxHp`, not 60%. Probe H (healer in the field, MP 0, HP 10, hitting a dummy): `hp 45 / 45 (60% cap 27)` after 20 s.
- Failure scenario: a healer hits any field cat with the staff and MENDs every 5 hits, reaching full HP without going back to camp. The written law says this cannot happen. The §4 Healer text even says both "+2 MP on hit" and "MP refills ONLY in camp".
- Fix (smallest): this is a user decision. Either (a) keep +2 MP and salmon MP and rewrite the law ("MP refills by resting, staff hits and salmon; MEND is the only field heal above 60%"), or (b) cap MEND at `REST_CAP` when outside camp. Add a sim case for whichever rule is chosen.   - Lane: BRAIN   - Contracts: no

### S4-4 · MEDIUM · Rewards vanish silently when the bag is full (quest payouts, Golden Yarn, gathering, relay loot)
- Law: CLAUDE.md §4 Quests/Inventory, N0 (spend → get: the work was done, nothing given), S2-8 pattern   - Where: `src/game.js:435`, `:1088`, `:1090`, `:1272`, `:396-399`, `:1178`, `:1273`   - Proof: PROVEN (quest) + TRACED (others)
- Evidence: `function giveMats(o){for(const [m,v] of Object.entries(o))matAdd(m,v);}`, where `matAdd` returns `addToBag(...)`, which is `false` when full, and nothing checks it. Probe C (12 slots of fish): `wood 0 -> 0 stone 0 -> 0 steel 2 -> 6`. Gathering sets `gatherCD` **before** `addToBag` fails (`:396`, `:399`). Relay `got` removes the pile, then `matAdd(m.k,1)` is ignored and the floater still says `+1 WOOD` (`:1178`). Item pickup sets `it.life=0` before `matAdd` (`:1271-1273`).
- Failure scenario: a player carrying 12 stacks of fish finishes quest 2. The dialog says "Take 4 WOOD, 4 STONE, 4 IRON" (`:1090`), but only iron arrives. The Golden Yarn toast says "3 WOOD, 3 STONE, 3 IRON", but wood and stone are lost. In multiplayer, a stolen wood pile disappears for everyone.
- Fix (smallest): make `giveMats` return what did not fit and drop the rest as ground items at the player (`items.push({kind,…life:30})`). Check `addToBag` before starting the node cooldown, and before the floater on `got`. Add sim: quest reward with a full bag.   - Lane: BRAIN   - Contracts: no

### S4-5 · MEDIUM · Glyphs missing from FONT (`&`, `—`, `≈`, `;`) and labels/toasts wider than the screen
- Law: CLAUDE.md §5 ("All visible text uses the pixel font… ≤ 75 chars"), stage-4 method (glyphs, overflow)   - Where: `src/game.js:45-47` (FONT), uses at `:830`, `:860`, `:1027`, `:1029`, `:1031-1032`, `:1043`, `:1107`, `:1148`, `:1254` (`&`); `:895`, `:1038`, `:1217` (`—`); `:1383`, `:1389`, `:1408` (`≈`); `:961` (`;`); widths `:1217`, `:1033`   - Proof: TRACED (glyph scan vs FONT keys; `textRaw` skips unknown glyphs but still advances, `:48`)
- Evidence: FONT has `[ ] # ^ % $ * "` but no `&`, `—`, `≈`, `;`. Menu titles render as `PARTY   SQUAD`, `DOGEMASTER: MEME FORGE   RE-ROLL`, `DOGEON POOL DEX: MINT, SWAP   LP`. The HUD/menu wallet line renders as `( $12.34)`. The title toast `CLASS IS ONE-PER-WALLET, ON-CHAIN. YOU START A WEAK NOVICE — SWEAR YOUR CLASS AT A TRAINER.` is 91 chars, so its box is `91*4+12=376 px` on a 320 px screen. A row like `SACRIFICE #123 DOGE LEATHER ARMOR [LEGENDARY: DIAMOND PAWS] -> RE-ROLL` (~70 chars × 4 px from x=49) runs past the 284 px box. Sim checks glyphs only for `[ ]`, `# ^` and the ponzi pages (`tests/sim.mjs:310`, `:605`, `:1030`).
- Failure scenario: players see gaps in the DogeMaster, party and Pool DEX titles and a broken "≈$" price; the first toast after Enter is cut off at both screen edges.
- Fix (smallest): add `&` and `;` glyphs, and replace `—` with `-` and `≈` with `~` (or add glyphs). Shorten the title toast to ≤ 75 chars. Clip menu labels to 58 chars (`(284-49)/4`). Add a sim check that every row/toast/dialog string uses only FONT glyphs and fits its box.   - Lane: BRAIN   - Contracts: no

### S4-6 · MEDIUM · In-game NPC text contradicts the current rules (D-097, D-055/D-067 drops)
- Law: CLAUDE.md §4 Economy (no in-game DOGE, D-097), dogeon-landing T1 truth applied to the game, R5   - Where: `src/game.js:892`, `:895`, `:576`, `:1104`   - Proof: TRACED
- Evidence: Mechanic first talk: `'Bring me ORB, SCRAP, HORN or STEEL from fallen foes.'`, but no recipe uses orb/scrap/horn (`RECIPES :923-931`) and no enemy drops them (`ETYPES :436-444`). Sphinx first talk: `'Pool your DOGE for safekeeping — pooled DOGE is safe when you die.'`, but the vault was removed in D-097. Respawn: `'Mint gear and preserve fish as NFTs: they live on chain and stay safe!'`, but crafted unminted gear (`P.sword/armor/hpUps`) already survives death (`:571`). Material rows hardcode `'… THEN MINT (1 DOGE).'` while the fee is read live (`:1104` vs `:932`).
- Failure scenario: a new player hunts frogs for "ORB" that never drops, and looks for a DOGE vault that no longer exists.
- Fix (smallest): rewrite the three dialog lines (Mechanic: "STEEL, WOOD, STONE, WHISKERS"; Sphinx: drop the pool-for-safekeeping page; respawn: "Materials and food are gone; your gear and NFTs remain") and use `chainData.fee` in `:1104`.   - Lane: BRAIN   - Contracts: no

### S4-7 · MEDIUM · `docs/GAME_GUIDE.md` (player-facing truth) is stale in ten places
- Law: T1 truth (guide feeds the landing and TryNoah rebuild), R5   - Where: `docs/GAME_GUIDE.md` lines cited   - Proof: TRACED
- Evidence vs code:
  1. `:51` "22 cats roam it" vs `FIELD_POP=52` (`:376`).
  2. `:52` mini-bosses not mentioned (`MINIS :501`).
  3. `:72` "MP only refills by resting in camp" vs `:590`, `:410-411` (S4-3).
  4. `:95` Healer heal "capped" vs `:1183` (S3-3).
  5. `:101-102` "frogs → orb, ninjas → scrap, bulls → horn, knights → steel" vs `ETYPES` (frog→whisk, ninja/bull/knight→steel, + 25% iron `:634`).
  6. `:113` item types omit DOGE gear 7–15 (`ITEM_TYPES :729`).
  7. `:30` "`F` Fish" omits tree/rock gathering (D-053, `:382-386`), and `:71` omits salmon foods (`:410-411`).
  8. `:132` "Multiplayer is opt-in; the deployed site auto-connects" (S3-8), and `:139` "Up to 8 players per room" (S3-7: 8 per server).
  9. `:156-165` enemy HP table is the pre-D-056 half values (alley 15 vs 30, bull 55 vs 110, brute 48 vs 96 …), drops stale, boss "arrow spreads" vs bones (`:659`).
  10. `:126` staking "earn" (S2-5).
- Failure scenario: the landing stage copies these numbers; a player expects 15-HP cats and orb drops.
- Fix (smallest): regenerate §3, §4, §6, §10 from the tables at `src/game.js:368-446`; add a `landing-check`-style assertion for FIELD_POP and the ETYPES HP values.   - Lane: BRAIN   - Contracts: no

### S4-8 · LOW · CLAUDE.md §4 and skills describe removed systems (DOGE death loss, coin drops, vault, orb/scrap/horn, +150 DOGE yarn, raid timer)
- Law: CLAUDE.md "keep this file accurate", R5   - Where: `CLAUDE.md` §4 Death / Economy / Starter Bag / Quests; `.claude/skills/dogeon-game/SKILL.md` §3.3; `.claude/skills/dogeon-hardcore-mechanics/SKILL.md` Axiom 2–3   - Proof: TRACED
- Evidence: §4 "Death: lose 50% of carried DOGE … Pooled DOGE is safe", "off-chain DOGE comes only from monster coin drops (8%) and the Golden Yarn", "frog→ORB, ninja→SCRAP, bull→HORN", "Starter … plus starter orb/scrap/horn/steel", "4 complete (Golden Yarn +150 DOGE)". The code has none of these (`newGame :488` gives `steel:2,orb:0,scrap:0,horn:0`; `YARN_MATS :434`). dogeon-game §3.3 "`orb:2, scrap:2, horn:2, steel:2`". Hardcore Axiom 3 "RAID_OPEN = 1800s … RAID_SEAL = 18000s" vs `BOSS_RESPAWN=60` (`:446`) and GAME_GUIDE "There is no raid timer". Code comments are stale too: `:500` "never respawns" (mini-bosses respawn every 20 s, `:1278`), `:635` "+ 5 coins".
- Failure scenario: the next agent "restores" a 50% DOGE death penalty or orb drops because the law file says so (S3's handoff already inherited "+150 DOGE").
- Fix (smallest): one docs commit aligning §4, both skills and the two comments with D-089/D-095/D-097.   - Lane: BRAIN   - Contracts: no

### S4-9 · LOW · An unpicked Golden Yarn survives the raid cycle, so the next kill pays double
- Law: CLAUDE.md §4 Quests (one yarn per kill), D-095   - Where: `src/game.js:638`, `:1162`   - Proof: PROVEN
- Evidence: `items.push({…kind:'yarn',life:9999,t:0})`. `bossCycle` resets stage and gate but not `items`. Probe D: `yarn items after cycle: 1 stage 1`.
- Failure scenario: a player kills the boss, gets teleported out by the cycle before walking onto the yarn (the yarn drops where the boss died). On the next run they pick up two yarns: +6/+6/+6.
- Fix (smallest): in `bossCycle`, `items=items.filter(i=>i.kind!=='yarn')` (or give the yarn directly in `killEnemy`).   - Lane: BRAIN   - Contracts: no

### S4-10 · LOW · R3: the title screen and dialog portraits draw non-right, animated sprite frames
- Law: dogeon-mission R3 / D-044 ("frozen, always facing right, no walk cycles, no flips")   - Where: `src/game.js:1436-1441`, `:1398`   - Proof: TRACED
- Evidence: `SPR.ninja.left[Math.floor(time*5)%2]`, `SPR.frog.right[Math.floor(time*3)%2]`, `SPR.bull.left[0]`, `SPR.alley.left[0]`, `SPR.hero.down[0]`, `SPR.merchant/bank/sage.down[0]`; dialog `SPR[n.spr].down[0]`. In-world `drawChar :1300` is compliant.
- Failure scenario: the first screen every player sees shows flipped and walking cats, against the user's frozen-right rule.
- Fix (smallest): use `.right[0]` in those seven draws.   - Lane: BRAIN   - Contracts: no

### S4-11 · LOW · Sim gaps and weak patterns let S4-1, S4-2 and S4-4 pass green
- Law: CLAUDE.md §6, RULE #0 (failing test first), dogeon-game §4 harness rule   - Where: `tests/sim.mjs:948-955`, `:368-378`, `:529-532`, `:673-677`, `:672` (+11 more `api.get().ui = null`)   - Proof: PROVEN (sim green while probes A/C/D/G show the bugs)
- Evidence: the rest test starts at `P.hp = 10`, never above the cap. `death loses all materials` sets `orb/scrap/horn/steel`, but not whiskers or bag wood/stone, and does not check the offline ground drop. There is no test for class-switch HP, full-bag rewards, yarn after a cycle, glyph/width of all UI text, gathering inside camp, or `?mod=1`. `g.P.doge !== dogeBefore` compares `undefined`s. There are 12 `api.get().ui = null`, which the dogeon-game skill §3.6 says "only mutates the wrapper", so the real `ui` stays open. Chain e2e `SKIP`s without anvil (S2-9).
- Failure scenario: a regression in rest, death or rewards ships with `ALL CHECKS PASSED`.
- Fix (smallest): add cases `rest above cap keeps HP`, `class switch does not heal`, `quest/yarn reward with full bag`, `yarn cleared on cycle`, `all UI strings in FONT and ≤ box width`, `no gather/fish node reachable from camp`, `death clears whiskers + bag mats`. Replace `ui = null` with `press('escape')` and drop the `P.doge` comparisons.   - Lane: BRAIN   - Contracts: no

### S4-12 · INFO · Death and class details that differ from the written law but look intended
- Law: CLAUDE.md §4 Death / Classes   - Where: `src/game.js:569-571`, `:1217`   - Proof: TRACED
- Evidence: offline death drops `min(4,P.steel)` steel and `min(4,whisk)` whiskers as ground items (life 30 s). §4 says "lose all", while the hardcore skill says materials "scatter". The title `[C] CLASS:` picker stores `P.wantClass`, which nothing reads (grep: one hit). The toast then says you start as a novice anyway.
- Failure scenario: players think the title class choice did something.
- Fix (smallest): write the scatter rule into §4; remove the title class picker or apply it as the local pick.   - Lane: BRAIN   - Contracts: no

### S4-13 · INFO · What holds
- Camp safety (sim plus per-frame camp check). No fish or gather node can be reached from inside the camp (probe B: 0 spots). D-097 has no `P.doge`/`P.bank`/coins anywhere. D-103 keeps one wood/stone counter (no `P.wood`/`P.stone`). D-104 game guard holds (except S2-1). Populations and respawn timers match §4. Dead entities are filtered after loops. `dt` is clamped (`:1468`). Keys are cleared on `blur` (`:40`). No new FX or sound in the last six game commits.

## Not checked (and why)
- Real browser behaviour (rendering of the missing glyphs, mouse rows, stuck keys on alt-tab): `scripts/browser-smoke.sh` needs agent-browser. Glyph and width findings are traced from `textRaw` and the 4 px advance.
- Anvil chain e2e (`SKIP`), wallet paths (stage 2), relay referee (stage 3).
- Balance tuning (TTK, drop rates) beyond the invariants; the `balance-check` skill was not run.
- PvP/heal behaviour against a live relay: S3 proved it, not re-run.

## Handoff to the next stage
- **Stage 5 (landing):** compare `landing.html` against these code facts. Do not use `docs/GAME_GUIDE.md`, which is stale (S4-7).
  - Populations: field `FIELD_POP=52`, ruins `DUN_POP=6`, field refill `SPAWN_EVERY=3` s, ruins + mini-boss refill `DUN_RESPAWN=MINI_RESPAWN=20` s (`src/game.js:376`). Mini-bosses: 3.5× HP, 1.6× damage, 6 drops (`:502`).
  - Healing: `REST_DELAY=3` s, `REST_HP=10`/s, `REST_MP=8`/s, `REST_CAP=0.6`, `RESPAWN_FRAC=0.35` (`:371`). Foods: raw fish 15, cooked fish 25, raw salmon 25 HP + 10 MP, cooked salmon 50 HP + 25 MP (`:407-412`). Bag 12 slots, stacks 5 food / 20 other (`:406`, `:413`).
  - Enemy HP: alley 30, archer 24, frog 28, ninja 36, bull 110, knight 70, brute 96, Cat Lord 320. Drops: whiskers (alley/archer/frog/brute×3) or steel (ninja/bull/knight), each gated by `dropP` 0.2–0.45, plus 25% iron (`:436-444`, `:633-634`). No coins (D-097).
  - Classes (`:450-462`, base HP 60 / MP 30 at `:470-472`): Warrior 85 HP / 20 MP, 0.95× speed, 1.35× damage, 15% armor, Ground Pound 12 MP. Archer 60 / 30, 1.25×, arrows 0 MP, Volley 6 MP. Healer 45 / 50, 1.25×, 0.65× damage, 5% armor, +2 MP per staff hit, Mend 10 MP → +20 HP × bark skill (`:598`, `:618`).
  - Gear: `SWORD_DMG=[0,5,8,12,18]`, `ARMOR_RED=[0,0.25,0.45]` (`:368`). Recipes (`:923-931`): Hammer Lv2 = 2 steel + 1 wood, Lv3 = 4 steel + 2 stone, Lv4 = 6 steel + 4 whiskers, Armor Lv1 = 2 steel + 2 wood, Lv2 = 5 steel + 3 stone, Bone Charm = 3 whiskers + 2 stone, Moon Biscuit = 2 whiskers + 2 wood. Starter kit: 3 wood, 3 stone, 2 steel (`:488`).
  - Quests: 8 cats → +2 wood/stone/iron; 3 brutes → +4 each + gate; Cat Lord → Golden Yarn +3 each (`:376`, `:434`). Raid cycle `BOSS_RESPAWN=60` s (`:446`). No raid timer.
  - Market: bear up to +50% enemy damage / +15% speed, bull up to +50% player damage / +10% speed (`:370`). Lazy: 180 s idle → 60 s at −15% speed (`:1254`, `:466`). Gathering 3.5 s, node cooldown 14 s (`:381`). Fishing 3–5 s (`:376`).
  - Multiplayer: auto-on over http(s) (`:1139`, S3-8), `NET_MAX=8` ghosts drawn, server cap 8 total (S3-7). Healer heals peers (`:619`), but the receiver does not cap the heal (S3-3), so the landing must not say "capped".
  - Mint fee is read live (`:751`, `:932`). The landing must not hardcode it differently from the chain, and the game itself hardcodes "1 DOGE" once (`:1104`).
- **Stage 6 (verifier):** re-run probes A and G first (the HIGH ones). Both reproduce in a few lines with the sim harness: set `P.hp=54` and hold `r` in camp for 4 s; or `applyClass('warrior')`, set `P.hp=10`, then pick healer and then warrior at the trainers.
