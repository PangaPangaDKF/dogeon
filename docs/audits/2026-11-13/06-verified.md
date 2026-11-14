# Verified findings · 2026-11-13 · HEAD 4300c2c
## Summary: 68 reported (+1 new) → 56 real (0 crit, 6 high, 19 med, 31 low), 1 fixed (S3-1), 1 intended, 0 rejected, 2 duplicate, 9 info

How this list was built (read-only; only this file was written):
- Read reports 00–05 in full. Re-opened every cited `file:line` at HEAD `4300c2c`. `git diff a3bbc4e 4300c2c` touches only `server/relay.mjs`, `tests/relay.mjs` and docs, so the game line numbers in 00–03 still hold.
- `bash tests/check.sh` → `✓ 0 failed, 0 warnings (seed 4242)`, `PASS relay: 15 checks`, `ALL CHECKS PASSED`. `cd contracts && forge test` → `47 tests passed, 0 failed, 0 skipped`. `node tests/relay.mjs` → `PASS bad escape — GET /%, /assets/%E0%A4%A, /src/%zz.js -> 400; relay still up`, `✓ relay: 0 failed`.
- S3-1 before/after (scratchpad copies, own random ports, both PIDs killed by me): old `a3bbc4e` relay `GET /% -> 000`, `old relay exited`, `URIError: URI malformed`; HEAD relay `GET /% -> 400`, `/health 200`.
- Gameplay probes (scratch script, loads the real `src/game.js` in a `vm` with the sim's seeded RNG; no repo file touched):
  `S4-1 start hp 54/60 -> after 4s rest hp 36 mp 8` · `S4-2 10/85 | healer 10/45 mp 30/50 | warrior 50/85 mp 20/20 | healer 45/45 mp 50/50 | warrior 85/85 mp 20/20` ·
  `S4-9 yarns after cycle 1 stage 1` · `S4-4 full bag quest2: wood 0 -> 0 steel 2 -> 6` · `S3-2 client: stage 0 player in boss room gets stage 4 won true`.
- `itemRoll` re-run from the game's own code: `61 UNCOMMON: HANGOVER 420 hp -63`, `126 RARE: HANGOVER 420 hp -96.6`, `3 RARE: NICE 69 atk 158.7`, `hp curses 1..500: 31 <=-45: 12`.
- FONT probe: `"&" false "—" false "≈" false ";" false` (`[ ] # $ %` true). Images opened: `assets/video/mint.jpg` (row `MINT HAMMER NFT 1 WOOD+1 STONE (1 DOGE)`), `assets/screenshots/06-sphinx-defi.png` (`DOGE $0.299`, `RAID 30M`, `VAULT`, `(+1%)`, `EARN 0.8%`), `07-fishing.png` (no player).
- Decisions applied: contracts frozen as a plan (`docs/CONTRACTS_V2_PLAN.md`), testnet only, D-095…D-107, mod suite (`docs/DECISIONS.md:401,411`), D-036/D-070 (healer MP, salmon), D-060/D-064 (gear bonuses sum).

## REAL (fix these)
| Rank | ID | Severity | Title | Where | Lane | Contracts? | Proof |
|---|---|---|---|---|---|---|---|
| 1 | S3-2 | HIGH | Any client kills the shared Cat Lord from anywhere and resets the room's quests every 60 s | `server/relay.mjs:47-57,126`; `src/game.js:1162-1164` | BRAIN | no | PROVEN (S3) + probe |
| 2 | S3-7 | HIGH | 8 sockets fill the whole server (cap is global); pings bypass rate and idle | `server/relay.mjs:116-118,146,222` | BRAIN | no | PROVEN (S3) + TRACED |
| 3 | S3-4 | HIGH | PvP trusts the attacker's self-reported position (hit from camp / teleport) | `server/relay.mjs:59-64,126` | BRAIN | no | PROVEN (S3) + TRACED |
| 4 | S4-2 | HIGH | Switching class at trainers is a free full HP + MP refill | `src/game.js:470,472,917` | BRAIN | no | PROVEN (probe) |
| 5 | S4-1 | HIGH | Resting cuts HP above 60% down to 60% | `src/game.js:1231` | BRAIN | no | PROVEN (probe) |
| 6 | S2-2 | HIGH | Gear rolls have no floor: cursed NFT makes Max HP ≤ 0, damage ×3.5, own hits heal cats | `src/game.js:807-808,470,560,580` | BRAIN | no | PROVEN (rolls) + TRACED |
| 7 | S2-4 | MEDIUM | Bag offers `[USE, BURNS]` on DOGE gear NFTs 7–15: burns them for nothing | `src/game.js:1109,824-828` | BRAIN | no | TRACED |
| 8 | S2-3 | MEDIUM | DogeMaster re-roll burns first, mints in a 2nd tx; reject = item lost | `src/game.js:830` | BRAIN | plan item (atomic reroll) | TRACED |
| 9 | S2-1 | MEDIUM (was HIGH) | `?mod=1` opens the mod menu for anyone in production (99 mats → craft → mint, god mode) | `src/game.js:724-725,1036-1044,1252` | BRAIN | no | TRACED |
| 10 | S3-6 | MEDIUM | Loot piles never expire; at 48 piles every later death drops nothing | `server/relay.mjs:34,70` | BRAIN | no | PROVEN (S3) + TRACED |
| 11 | S3-3 | MEDIUM (was HIGH) | Receiver trusts peer `heal` `amt` and `r` (unbounded heal from anywhere) | `src/game.js:1181-1183`; `server/relay.mjs:127` | BRAIN | no | PROVEN (S3) + TRACED |
| 12 | S3-8 | MEDIUM (was HIGH) | Multiplayer auto-connects on any http(s) host; CLAUDE.md §2 / code comment say opt-in | `src/game.js:1133-1140` | BRAIN | no | TRACED |
| 13 | S3-9 | MEDIUM | No reconnect backoff: a refused/closed socket reopens next frame | `src/game.js:1192,1196` | BRAIN | no | TRACED |
| 14 | S4-4 | MEDIUM | Quest/Yarn wood+stone silently lost when the bag is full | `src/game.js:435,416,1088,1090,1272` | BRAIN | no | PROVEN (probe) |
| 15 | S4-6 | MEDIUM | NPC text contradicts rules (ORB/SCRAP/HORN, DOGE vault, death text, hardcoded 1 DOGE) | `src/game.js:892,895,576,1104` | BRAIN | no | TRACED |
| 16 | V-1 (new) | MEDIUM | HUD and menus value the wallet's testnet DOGE in USD (`≈$`) and show `DOGE $` always | `src/game.js:1381-1383,1408` | BRAIN | no | TRACED |
| 17 | S2-5 | MEDIUM | Staking menus say EARN/YIELD, no testnet/no-value/NFA line, omit mint-fee source | `src/game.js:779,781,849,853-854,970` | BRAIN | no | TRACED |
| 18 | S2-6 | MEDIUM | Game never flushes mint fees to stakers (`withdrawFees` not wired) | `src/game.js:728,782,858` | BRAIN | no | TRACED (grep 0 hits) |
| 19 | S1-1 | MEDIUM | Just-in-time stake → flush → claim → unstake in one tx takes most pending fees | `contracts/src/DogeStaking.sol:74-110` | BRAIN | plan item (§3) | TRACED |
| 20 | S1-2 | MEDIUM | A 1-wei stake into an empty vault takes the whole `residual` | `contracts/src/DogeStaking.sol:45-46,79-83` | BRAIN | plan item (§3) | PROVEN (test) + TRACED |
| 21 | S5-1 | MEDIUM | Landing "real mint" loop + trailer show the removed `1 WOOD+1 STONE` mint row | `landing.html:886-892,849`; `assets/video/mint.*` | BRAIN (media) + LANDING | no | PROVEN (image) |
| 22 | S5-2 | MEDIUM | Contracts table credits DogeItems with rolls/reroll it does not have | `landing.html:1188,849` | LANDING | no | TRACED |
| 23 | S5-3 | MEDIUM | Burn-to-reroll described as one random action (2 txs, full fee, loss on reject, predictable) | `landing.html:876-877` | LANDING | no | TRACED |
| 24 | S5-4 | MEDIUM | Staking copy: "earn", "any amount", "Web3 interface", unconditional 80% | `landing.html:1085,1088,1094-1095,1100` | LANDING | no | TRACED |
| 25 | S5-5 | MEDIUM | "Each server room holds up to 8" (false) and "server referees every PvP hit" (overstated) | `landing.html:1056,1041` | LANDING | no | TRACED |
| 26 | S4-5 | LOW (was MED) | Missing glyphs `& — ≈ ;`; 91-char title toast; long menu rows overflow | `src/game.js:45-47,1217,1029,1031,1383` | BRAIN | no | PROVEN (FONT probe) |
| 27 | S4-7 | LOW (was MED) | `docs/GAME_GUIDE.md` stale (22 cats, orb drops, "capped" heal, old HP table, "earn") | `docs/GAME_GUIDE.md:47,90,96,125,147,169-176` | BRAIN | no | TRACED |
| 28 | S4-9 | LOW | Unpicked Golden Yarn survives the raid cycle → double reward next run | `src/game.js:638,1162` | BRAIN | no | PROVEN (probe) |
| 29 | S3-5 | LOW (was MED) | Living player can create loot piles (`loot` has no `dead` check) | `server/relay.mjs:66-75` | BRAIN | no | PROVEN (S3) |
| 30 | S3-10 | LOW (was MED) | Duplicate player ids allowed in a room | `server/relay.mjs:114-119` | BRAIN | no | TRACED |
| 31 | S3-11 | LOW | Raid-cycle timer not cleared when the room empties | `server/relay.mjs:55,101` | BRAIN | no | TRACED |
| 32 | S3-12 | LOW | `/health` lists every room name and count | `server/relay.mjs:163` | BRAIN | no | PROVEN (S3) |
| 33 | S3-13 | LOW | No security headers (nosniff, frame-ancestors) | `server/relay.mjs:162-205` | BRAIN | no | TRACED |
| 34 | S3-14 | LOW | Container runs as root, base image unpinned | `Dockerfile:1-9` | BRAIN | no | TRACED |
| 35 | S3-15 | LOW | Relay header + MULTIPLAYER comment stale (no state, 20 msg/s, per-room, loot NOT built) | `server/relay.mjs:4,8-11`; `src/game.js:1133-1136` | BRAIN | no | TRACED |
| 36 | S3-1r | LOW | Residual of S3-1: `tests/serve.mjs` still decodes unguarded in an async handler | `tests/serve.mjs:15-16` | BRAIN | no | TRACED |
| 37 | S2-7 | LOW | Mint/oath fee sent from defaults before `chainData.loaded`; `10n**17n` fallback | `src/game.js:739,741,830,932` | BRAIN | no | TRACED |
| 38 | S2-8 | LOW | Refund edges while a mint is pending (stranded credit, fish lost on full bag, fish back after death) | `src/game.js:812-822,940` | BRAIN | no | TRACED |
| 39 | S4-11 | LOW | Sim gaps let S4-1/S4-2/S4-4/S4-9 pass green; vacuous `P.doge` checks; `ui = null` pattern (merges S2-9) | `tests/sim.mjs:529-532,673-677` | BRAIN | no | PROVEN (green suite + probes) |
| 40 | S4-10 | LOW | Title screen and dialog portraits draw left/down/animated frames (R3) | `src/game.js:1398,1436-1441` | BRAIN | no | TRACED |
| 41 | S4-8 | LOW | CLAUDE.md §4 + skills describe removed systems; §4 healer MP sentence self-contradicts | `CLAUDE.md` §4; `dogeon-game` §3.3; `src/game.js:500,635` | BRAIN | no | TRACED |
| 42 | S0-1 | LOW | `deployments/6281971.json` says `mintFee` 0.1 DOGE (live is 1 DOGE per D-071) | `contracts/deployments/6281971.json:6` | BRAIN | no | TRACED |
| 43 | S1-6 | LOW | Deploy script defaults to 0.1 DOGE and never calls `setStakingPool` | `contracts/script/Deploy.s.sol:12,20,25,30` | BRAIN | plan item (§6) | TRACED |
| 44 | S1-3 | LOW (was MED) | DogeItems owner can repoint/freeze the stakers' 80% at will | `contracts/src/DogeItems.sol:96-130` | BRAIN | plan item (§2) | PROVEN (test) + TRACED |
| 45 | S1-4 | LOW | `setMintFee` unbounded (0 = free mint) | `contracts/src/DogeItems.sol:121-124` | BRAIN | plan item (§2) | TRACED |
| 46 | S1-7 | LOW | No invariant tests (N2); staking rounding unproven | `contracts/test/*` | BRAIN | plan item (tests) | PROVEN (grep 0 `invariant_`) / SUSPECTED |
| 47 | S1-8 | LOW | `dogeUsd()` can revert on a code-less feed; `poolTvlUsd` ignores `fresh` | `contracts/src/DogeDEX.sol:346-361` | BRAIN | plan item (§4) | SUSPECTED / TRACED |
| 48 | S1-9 | LOW | Single-step `Ownable`, silent profession withdraw, stale "index.html" comment | `DogeItems.sol:6,15,18`; `DogeProfession.sol:64` | BRAIN | plan item | TRACED |
| 49 | S0-2 | LOW | Mission charter points at `index.html` and lists healer-heals-others as Missing | `.claude/skills/dogeon-mission/SKILL.md:28,32,71` | BRAIN | no | TRACED |
| 50 | S0-4 | LOW | D-106 / audit skill dated 2026-11-14 and point at `docs/audits/2026-11-14/` | `docs/DECISIONS.md:53,58`; `dogeon-audit/SKILL.md:8,86` | BRAIN | no | TRACED |
| 51 | S5-6 | LOW | "Monsters drop wood, stone"; network table "in-game economy" | `landing.html:811,967` | LANDING | no | TRACED |
| 52 | S5-7 | LOW | "piercing arrows", NPCs "in the ruins", "extraction" raid, "<60 s" setup | `landing.html:759,1117,656,913` | LANDING | no | TRACED |
| 53 | S5-8 | LOW | Gallery captions promise mechanics the captures don't show; title capture outdated | `landing.html:1250-1313` | LANDING (+BRAIN captures) | no | PROVEN (images) |
| 54 | S5-9 | LOW | Hero lacks "not financial advice"; pulsing green dot looks like live server status | `landing.html:661,673`; CSS `:271-278` | LANDING | no | TRACED |
| 55 | S5-10 | LOW | Fees hardcoded on the page; json disagrees | `landing.html:827,849,888,1100,1198` | LANDING (+BRAIN json) | no | TRACED |
| 56 | S5-11 | LOW | Retired screenshots with price/vault/yield still deployed and still TRAILER_SCRIPT refs | `assets/screenshots/{02,03,05,06}*.png`; `docs/TRAILER_SCRIPT.md:80-82` | LANDING + BRAIN | no | PROVEN (image) |
| 57 | S5-12 | LOW | No `rel=noopener noreferrer` (19 `_blank`, 0 noopener); gallery not keyboard-usable; img sizes; hidden canvas keeps running | `landing.html` | LANDING | no | PROVEN (grep) |

(57 rows = 56 REAL + the S3-1 residual counted under S3-1's line, not as a new ID.)

### FIXED
- **S3-1 · was CRITICAL · FIXED in D-107 (`4300c2c`).** `server/relay.mjs:180` `let dec; try { dec = decodeURIComponent(pathname); } catch { res.writeHead(400); return res.end("bad request"); }` plus the `handle()` try/catch at `:152-155` and stream `error` handlers at `:192,195`. Proof: old relay `GET /% -> 000` + `URIError: URI malformed` + process exit; HEAD relay `GET /% -> 400`, `/health 200`; `tests/relay.mjs` `PASS bad escape` (fails on the old code because the process dies). Residual: `tests/serve.mjs:16` (dev server, 127.0.0.1) has the same unguarded decode → row 36.

## Details (one block per REAL finding: evidence, scenario, smallest fix, the test that should fail first)

### S3-2 · HIGH · Forged boss kill + room-wide quest reset
- Evidence: `c.p = { x: m.x, y: m.y, dead: !!m.dead }` (relay `:126`) is the only position; `bhit` gate is `inBossRoom(me)` (`:48`); `MAX_HIT = 60`, `MAX_RATE = 30`. No quest/gate check. Client: `netBoss` → `if(zoneOf(P.x,P.y)==='boss')killEnemy(e)` → `if(state.stage<4)state.stage=4` (`:638`); probe `stage 0 … gets stage 4 won true`. 60 s later `{t:'cycle'}` → `bossCycle` sets every client at stage ≥ 1 back to stage 1 (`:1162`).
- Scenario: a script sends one `st` at tile (40,5) and 6–8 `bhit` → boss dead for the room → every minute all players lose quest progress (stage 2 brute hunts reset to 1). Guard checked and absent: none on the relay.
- Fix: relay rate-cap `bhit` per client (e.g. ≤ 3/s), reject `st` jumps > class speed × Δt (+ knockback margin), require N s inside the boss room; optional: send `cycle` only to clients that were in the raid.
- Test first: `tests/relay.mjs` "bhit rejected after position jump" and "boss damage rate cap per client".

### S3-7 · HIGH · Server-wide 8-socket cap is a one-person DoS
- Evidence: `let total = 0; for (const s of rooms.values()) total += s.size; … if (total >= MAX_ROOM || r.size >= MAX_ROOM)` (`:116-118`); pings answered at `:146` without touching `c.count`; `sock.setTimeout(IDLE_MS…)` (`:222`) resets on any inbound byte; upgrade handler (`:212-224`) checks no Origin or per-IP count.
- Scenario: 8 sockets join any rooms and ping every 20 s → every other player gets `SERVER FULL (8/8 PLAYERS)` indefinitely.
- Fix: per-IP join cap (`fly-client-ip`), count control frames in `MAX_RATE`, reset idle only on `st`; decide per-room vs per-server and make code, comment (`:4`) and landing agree.
- Test first: `tests/relay.mjs` "9 pings/s count toward MAX_RATE" and "idle socket with pings only is dropped after IDLE_MS".

### S3-4 · HIGH · PvP range/camp checks use self-reported positions
- Evidence: `if (!o || !me || … inCamp(me) || inCamp(o.p)) return; … if (!near(me, o.p, PVP_RANGE)) return;` (`:61-63`) where `me` is the last client-sent `st`. Victim camp safety holds (`inCamp(o.p)` is the victim's own report). God-mode half is DUPLICATE of S2-1.
- Scenario: cheater stands in camp, sends `st` next to a fishing victim + `pvp dmg:40` each 0.9 s → victim dies and drops a pile.
- Fix: same speed check on `st` as S3-2; rate-limit `pvp` to the swing cooldown; reject `pvp` when the previous `st` was in camp.
- Test first: `tests/relay.mjs` "pvp ignored after position jump".

### S4-2 · HIGH · Class switch heals
- Evidence: `syncMaxHp(){…d=base-P.maxHp;P.maxHp=base;if(d>0)P.hp+=d;…}` (`:470`, same in `syncMaxMp :472`); offline `SWITCH TO ${c.name} (LOCAL)` → `applyClass` (`:917`). Probe: `10/85 → … → warrior 85/85 mp 20/20`. D-028/D-036 allow free local switching, not healing; §4 says healing is rest-to-60% or food.
- Fix: when max rises, keep current: `P.maxHp=base;P.hp=Math.min(P.hp,base)` (same for MP). Also covers heals from `refreshChain` gear changes.
- Test first: sim "class switch does not heal": warrior at 10 HP → healer → warrior → HP ≤ 10, MP unchanged.

### S4-1 · HIGH · Rest lowers HP to the cap
- Evidence: `const hpCap=Math.ceil(P.maxHp*REST_CAP);P.hp=Math.min(hpCap,P.hp+REST_HP*dt);` (`:1231`). Probe: `start hp 54/60 -> after 4s rest hp 36`. §4: heal "up to 60%".
- Scenario: eat to 54/60 (or MEND to full), rest to refill MP → HP drops to 36. Every class must rest for MP.
- Fix: `if(P.hp<hpCap)P.hp=Math.min(hpCap,P.hp+REST_HP*dt);`
- Test first: sim "rest above cap keeps HP" (start 90%, rest 5 s, HP unchanged, MP up).

### S2-2 · HIGH (narrowed) · No floor on rolled gear stats
- Evidence: `gearStats()` adds `itemRoll(it.id)` for every non-food NFT (`:808`); `syncMaxHp` uses it with no clamp (`:470`); `hurtPlayer` `(1-Math.min(0.8,…+gearStats().def))` has no lower bound (`:560`); `attack` `SWORD_DMG[swordLv()]+gatk()` can go negative and `damageEnemy` does `e.hp-=dmg` (`:625`). Rolls: `#61 hp -63`, `#126 hp -96.6`; PAPER 4.2 LEGENDARY = def −2.52 → damage ×3.52; CURSED 69 LEGENDARY = atk −41.4 → hits heal cats.
- Narrowed: summing every item's bonus is documented (D-060 "bonuses sum", D-064, dogeon-game §3.8) → that part is INTENDED, not a bug.
- Scenario: healer (45 HP) whose mint lands on #61 → `P.maxHp=-18`; respawn sets `ceil(-18×0.35)=-6`; rest/food cap at a negative number; every hit kills. Escape only by listing/selling the NFT.
- Fix: clamp: `P.maxHp=Math.max(10,Math.round(base))`, def sum ≥ 0 (or ≥ −0.5), `sdmg ≥ 1`; round stats for the HUD.
- Test first: sim with a mocked `chainData.inv=[{id:61,type:5,level:1}]` on a healer → `P.maxHp ≥ 10`.

### S2-4 · MEDIUM · Gear NFTs 7–15 burn on "USE"
- Evidence: `it.type<=2?'(OWNED = EQUIPPED)':'[USE, BURNS]'` (`:1109`); `useNft` has branches for food, 5, 6 only (`:824-828`).
- Scenario: player buys a DOGE SWORD listing, presses Enter in the bag → NFT burned, +4 ATK and its roll gone.
- Fix: treat `GEAR_STATS[it.type]` like types 1–2 (info row, no burn); drop or wire the unused `MINTABLE`.
- Test first: sim "gear NFT row has no burn act".

### S2-3 · MEDIUM · Two-step re-roll loses the item on reject
- Evidence: `await etx(…SEL.burn…,0);await etx(…SEL.mint…,chainData.fee||10n**17n);` (`:830`).
- Scenario: player rejects the 2nd prompt or lacks 1 DOGE → the burn already mined → item gone, message just says "rejected".
- Fix: check `wallet.bal >= chainData.fee` and `chainData.loaded` before the burn; on 2nd-step failure say `BURN DONE, MINT FAILED`; drop the `10n**17n` fallback. Atomic `reroll` stays a v2 plan item (already in plan §2 table).
- Test first: sim with mock eth that rejects the 2nd `eth_sendTransaction` → message names the burned id.

### S2-1 · MEDIUM (was HIGH) · Mod menu on the public URL
- Evidence: `IS_MOD=…/[?&](mod|master)=1\b/.test(location.search)` (`:724`); `if(isMod()&&kp('m'))modMenu();` (`:1252`); `GIVE 99 ALL MATERIALS`, `GOD MODE`, `INSTA-KILL BOSS` (`:1036-1044`); `chooseProfession` skips the lock for mods (`:776`).
- Why re-ranked: the mod suite is a documented test tool (`DECISIONS.md:401,411`); the client is untrusted anyway (console can set `P.steel`); `DogeItems.mint` is already permissionless (D-104 open). But D-104 removed the mod's free credits, so giving free mats to every visitor contradicts that decision; and a sworn mod wallet wastes gas on a reverting `choose`.
- Fix: `IS_MOD = DEV_LOCAL && …` (keep the `MASTER_ADDR` path as convenience), keep the class-lock check for mods.
- Test first: sim boot with `search:'?mod=1'` (no `chain=local`) → `isMod()===false`.

### S3-6 · MEDIUM · Loot piles never expire
- Evidence: `… || w.loot.size >= LOOT_CAP) continue;` (`:70`); piles leave only via `take`.
- Scenario: long-lived room collects 48 piles in corners (or a griefer fills them) → honest deaths drop nothing; materials already zeroed by `respawn`.
- Fix: per-pile TTL (≈120 s) and evict oldest when full.
- Test first: `tests/relay.mjs` "loot piles expire / oldest evicted at cap".

### S3-3 · MEDIUM (was HIGH) · Peer heal not validated
- Evidence: relay `if (m.t === 'st' || m.t === 'heal') return broadcast(c, text);` (`:127`); client `Math.hypot(P.x-m.x,P.y-m.y)<=(m.r||72)` and `const amt=Math.max(1,m.amt|0)` (`:1182-1183`).
- Why re-ranked: a self-heal through a 2nd tab gives nothing a console edit can't; cross-player effect is only healing. Still breaks D-040 "peer data is untrusted → validate".
- Fix: client ignores `m.r` (fixed 72), caps `amt` at `Math.ceil(20*skillMul max)`, requires the sender's ghost within 72 px and class `healer`.
- Test first: sim "heal amt/radius clamped" with a mock socket sending `{amt:99999,r:1e9}`.

### S3-8 · MEDIUM (was HIGH) · Auto-multiplayer vs written law
- Evidence: `defaultMp` returns `ws(s)://location.host` for any http(s) page (`:1139`); comment `:1133-1135` and CLAUDE.md §2 say "OFF unless ?mp … ZERO network calls". Change came from commit `a58869c` (D-077), which has no D-077 entry in `docs/DECISIONS.md` (grep: 0).
- Why re-ranked: intentional for the live relay host; harm is the law/doc mismatch plus failed WebSocket attempts on hosts without a relay (GitHub Pages workflow publishes `.`; TryNoah sandbox), amplified by S3-9.
- Fix: BRAIN decides: either auto-connect only when served by the relay (e.g. relay injects a flag), or write the D-077 entry and update CLAUDE.md §2, the comment and the sim.
- Test first: sim with `location={protocol:'https:',host:'x.github.io',search:''}` → `NET_URL===''` (if opt-in is restored).

### S3-9 · MEDIUM · Reconnect loop without backoff
- Evidence: `ws.onclose=()=>{…net.ws=null;…}` (`:1192`) and `if(!net.ws)netConnect();` each frame (`:1196`); `full` only toasts.
- Scenario: relay full or absent → each client opens a new socket per frame/RTT, re-toasting `SERVER FULL`.
- Fix: `net.retryT` exponential backoff 2 s → 60 s; stop after `full` until the player asks.
- Test first: sim with a mock WebSocket that closes immediately → ≤ 2 constructions in 5 s.

### S4-4 · MEDIUM · Rewards lost on a full bag
- Evidence: `function giveMats(o){for(const [m,v] of Object.entries(o))matAdd(m,v);}` ignores `addToBag`'s `false` (`:435`, `:416`). Probe: `wood 0 -> 0 steel 2 -> 6`. Same for Yarn (`:1272`) and relay `got` (`matAdd` result ignored, floater says +1). Gathering shows `BAG FULL!` (not silent), so that part is fine.
- Fix: return the overflow and drop it as ground items at the player; check before the `got` floater.
- Test first: sim "quest 2 reward with a full bag lands on the ground".

### S4-6 · MEDIUM · Stale NPC lines
- Evidence: `'Bring me ORB, SCRAP, HORN or STEEL from fallen foes.'` (`:892`) but `ETYPES` drop only `whisk`/`steel` (`:437-443`); `'Pool your DOGE for safekeeping — pooled DOGE is safe when you die.'` (`:895`) after D-097 removed the vault; respawn text implies unminted gear is lost (`:576`); `'…THEN MINT (1 DOGE).'` hardcoded (`:1104`).
- Fix: rewrite the three lines; use the live fee at `:1104`. Drift guard (`scripts/trynoah-manifest.mjs` STALE list) can block `ORB, SCRAP, HORN` and `Pool your DOGE`.
- Test first: sim text scan for those phrases → 0.

### V-1 (new) · MEDIUM · USD value of testnet DOGE in the HUD and menus
- Law: N5 ("Never show … a USD price"), T8 spirit, "testnet tokens, no real-world value".
- Evidence: HUD `text('DOGE $'+curP.toFixed(…),168,3,…)` and `if(wBal){const u=(wallet.bal||0)*curP;text('≈$'+…)` (`:1382-1383`); menu header `WALLET: … DOGE (≈$${((wallet.bal||0)*cp).toFixed(2)})` (`:1408`). `curP` is the RedStone mainnet DOGE/USD price when loaded.
- Scenario: a connected player with 100 testnet DOGE sees `≈$25` → the game itself prices testnet DOGE as real money. (The `≈` glyph is missing too, so it renders as `$25`.) The simulated `DOGE $` market is kept by D-097 as a difficulty mechanic, so only the wallet valuation is clearly wrong; whether to keep the `$` ticker at all is a user call (D-024 vs N5).
- Fix: remove the `≈$` wallet valuation in HUD and menu; show the bull/bear % instead (the offline branch already does).
- Test first: sim with a connected mock wallet → no HUD/menu string matches `/\$\d/` next to the wallet balance.

### S2-5 · MEDIUM · "Earn/yield" staking text
- Evidence: `'DOGE STAKING: EARN 0.8% OF DEX FEES'` (`:849`), `STAKE < … > DOGE (EARN 0.8% FEES)` (`:853`), `NOW EARNING DEX FEES` (`:779`), `SUCH YIELD` (`:781`), Sphinx row `:970`; no TESTNET/NO VALUE/NFA row in `stakeMenu`; text names only DEX fees.
- Fix: "SHARE OF FEES (TESTNET, NO VALUE)", one disclaimer row, "0.8% OF DEX TRADES + 80% OF MINT FEES"; update the sim regex.
- Test first: sim "stakeMenu has no EARN/YIELD and has TESTNET".

### S2-6 · MEDIUM · Mint fees never synced from the game
- Evidence: `grep -c 'withdrawFees\|476343ee' src/game.js` → `0`; SYNC row only when `chainData.dexFees>0n`.
- Scenario: mint fees pile up in DogeItems; in-game stakers see 0 pending; whoever scripts the flush in their own tx (S1-1) or into an empty vault (S1-2) takes them.
- Fix: add `withdrawFees:'476343ee'` + `accruedFees` read; SYNC row calls whichever source is > 0. Contract auto-sync stays S1-1's plan item.
- Test first: mock-eth sim "SYNC row flushes items fees when accruedFees > 0".

### S1-1 · MEDIUM · JIT staking (plan item)
- Evidence: `stake()`/`claim()`/`unstake()` have no lock or fee (`DogeStaking.sol:74-110`); sources are flushed by anyone (`DogeItems.withdrawFees`, `DogeDEX.flushStakerFees`).
- Fix (plan §3): sync sources inside stake/unstake, plus the planned deposit/withdraw fee. Test: Foundry "JIT stake-flush-claim-unstake gets ≤ fair share".

### S1-2 · MEDIUM · Residual sniping (plan item)
- Evidence: `_setDebt` before `accRewardPerShare += (residual * PREC) / totalStaked;` (`:79-83`); `test_RewardWithNoStakersBecomesResidualThenPaid` passes (whole residual to the first staker). No minimum stake.
- Fix (plan §3): residual → treasury or streamed, or a minimum first stake. Test: Foundry "1-wei stake does not take residual".

### S5-1 · MEDIUM · Mint proof shows a removed path
- Evidence: `assets/video/mint.jpg` shows `MINT HAMMER NFT 1 WOOD+1 STONE (1 DOGE)`; `grep "1 WOOD+1 STONE" src/game.js` → 0 (D-104 removed it).
- Fix: BRAIN recaptures CRAFT → `MINT HAMMER LV2 NFT x1` → explorer; LANDING captions/hides the loop until then. Test: landing-check asserts no poster text from the STALE list (manual until OCR-free).

### S5-2 · MEDIUM · Contract table overclaims
- Evidence: `9 Gear NFT Types, Rarity/Meme Rolls & Burn-to-Reroll` (`:1188`); DogeItems has 15 types, no roll/reroll function; roll is `itemRoll` client-side (`src/game.js:807`).
- Fix: "ERC-721 items: 15 types; mint for the fee, burn"; say rolls derive from the token id in the game. Drop "verified".

### S5-3 · MEDIUM · Re-roll copy
- Evidence: "burns your debuffed ERC-721 NFT on-chain and triggers a fresh random mint" (`:877`) vs two txs (`src/game.js:830`); `uint256 public nextId` (`DogeItems.sol:44`) makes the next roll computable.
- Fix: say two transactions, full mint fee, reject = item gone, roll comes from the new token id; remove "random".

### S5-4 · MEDIUM · Staking copy
- Evidence: `PONZIFI YIELD` (`:1085`), "earn testnet DOGE" (`:1088`), "Stake any amount … or the Web3 interface" (`:1094-1095`) vs `PRICES=[0.1…50]` presets and no other interface; "Stakers receive 80% of every 1 DOGE mint fee" (`:1100`) only after someone calls `withdrawFees`.
- Fix: retag satire, "get a share of", "0.1 to 50 DOGE at the Sphinx", add the flush condition.

### S5-5 · MEDIUM · Multiplayer claims
- Evidence: "Each server room holds up to 8 players" (`:1056`) vs global `total` cap (`relay.mjs:116-118`); "the server referees every PvP hit" (`:1041`) vs S3-4.
- Fix: "Up to 8 players on the server at once"; "the server checks range and camp". Re-sync if BRAIN changes S3-7.

### LOW rows (short)
- **S4-5:** FONT lacks `& — ≈ ;` (probe); titles at `:860,1029,1031,1148` lose `&`; 91-char toast at `:1217`. Re-ranked LOW: cosmetic. Fix: add glyphs or substitute; shorten toast; sim "all UI strings use FONT glyphs".
- **S4-7:** GAME_GUIDE stale; the auditor's line numbers are off by 4–15 (e.g. "22 cats" is `:47`, "capped" `:90`, orb drops `:96`, "earn" `:125`, opt-in `:147`, HP table `:169-176`), but every quoted text exists. Re-ranked LOW: doc, not shipped in game. Fix: regenerate from `src/game.js:366-446`.
- **S4-9:** `items.push({…kind:'yarn',life:9999…})` (`:638`) not cleared by `bossCycle` (`:1162`); probe `yarns after cycle 1`. Fix: filter yarn in `bossCycle`. Test: sim "yarn cleared on cycle".
- **S3-5:** `if (!me || !Array.isArray(m.items)) return;` no `me.dead` (`:67`). Re-ranked LOW: the sender only gains what a console edit gives; no other player loses anything. Fix: accept `loot` once per death (`c.p.dead` + flag). Test: relay "loot only from a dead sender".
- **S3-10:** join checks only the id regex (`:114,119`). Re-ranked LOW: the victim's own 10 Hz `st` restores its ghost within ~0.1 s after a spoofed `bye`; PvP `find` may target the wrong socket. Fix: refuse an id already in the room. Test: relay "duplicate id refused".
- **S3-11:** `drop` does `world.delete(c.room)` (`:101`) without `clearTimeout(w.cycle)` (`:55`); the old timer's `toRoom(room…)` reaches a new group with the same room name. Fix: clear it. Test: relay "cycle timer cleared when room empties".
- **S3-12:** `/health` returns room names (`:163`). Fix: `{ok, players}` only.
- **S3-13:** only `content-type`/range headers. Fix: `nosniff`, `referrer-policy`, `frame-ancestors 'self'` on HTML.
- **S3-14:** no `USER` in `Dockerfile`. Fix: `USER node`.
- **S3-15:** relay header says "NO game state", "≤ 20 msgs/s", "MAX_ROOM players per room" (`:4,8-11`) vs `MAX_RATE = 30`, `world` map, global cap; game comment `:1133-1136` says MP OFF and loot NOT built. Fix: rewrite both.
- **S3-1 residual:** `tests/serve.mjs:15-16` `createServer(async (req,res)=>{ const url = decodeURIComponent(…)` → unhandled rejection on `/%` (dev only, 127.0.0.1). Fix: same try/catch as D-107.
- **S2-7:** `chainData` defaults `fee:10n**18n`, `profFee:5n*10n**16n` (`:739,741`); `mintRows` shows `FEE` until loaded but `mintNft` sends the default; `burnAndReroll` falls back to 0.1 DOGE. A wrong fee reverts and refunds, so no loss. Fix: hide mint/oath rows until `chainData.loaded`.
- **S2-8:** `catch(e){if(!e.sent||e.reverted){…putBack…}else addToBag(src,1);}` (`:822`) ignores a full bag; CRAFT rows not gated by `wallet.busy` (`:940`). Traced (a): one stranded credit, no dupe. Fix: block CRAFT while busy; drop the fish on the ground if the bag is full.
- **S4-11 (+S2-9):** rest test starts at 10 HP; no tests for class-switch HP, full-bag rewards, yarn after cycle, glyphs, `?mod=1`, reject refund, re-roll partial failure; `g.P.doge !== dogeBefore` compares `undefined`s (`tests/sim.mjs:529-532,673-677`; harmless because `checkFrame` throws if `doge` exists); 11 `api.get().ui = null`. Fix: add the "test first" cases listed above.
- **S4-10:** `SPR.ninja.left[Math.floor(time*5)%2]`, `SPR.hero.down[0]`, `SPR.merchant/bank/sage.down[0]` (`:1436-1441`), dialog `SPR[n.spr].down[0]` (`:1398`) vs R3/D-044 "always right, no walk cycles". Fix: `.right[0]`.
- **S4-8:** CLAUDE.md §4 still has "lose 50% of carried DOGE", "coin drops (8%)", "frog→ORB…", "Golden Yarn +150 DOGE"; §4 Healer text says both "+2 MP on hit" and "MP refills ONLY by resting" (see S4-3); comments `:500` "never respawns", `:635` "+ 5 coins". Fix: one docs commit aligned with D-089/D-095/D-097.
- **S0-1:** `"mintFee": 100000000000000000` vs D-071 1 DOGE. Game reads the fee live, so no play impact. Fix: correct the json (or regenerate from chain).
- **S1-6:** `vm.envOr("MINT_FEE_WEI", uint256(0.1 ether))`; no `items.setStakingPool(address(staking))` in the script. Plan §6 "deploy script v2".
- **S1-3:** `setStakingPool` unchecked, no delay; push to two recipients in one tx. Re-ranked LOW: the owner is the project deployer on testnet and every change emits an event; it is an admin-trust note, not a player exploit. Plan §2: immutable pool or 2-step + per-recipient pull.
- **S1-4:** `setMintFee` unbounded. Plan §2: `MIN_FEE>0`, `MAX_FEE`.
- **S1-7:** no `invariant_`/`StdInvariant` in `contracts/test` (grep 0); rounding shortfall SUSPECTED (≤ n wei per segment). Plan §6: add handler invariants for all four contracts now.
- **S1-8:** `try dogeUsdFeed.latestRoundData()` cannot catch decode of empty returndata from a code-less address; `poolTvlUsd` ignores `fresh`. Live feed has code and the game falls back (S2 confirmed), so LOW. Plan §4.
- **S1-9:** `Ownable` not `Ownable2Step`; `DogeProfession.withdraw` no event; `keep in sync with ITEM_TYPES in index.html` (`DogeItems.sol:18`). Plan item.
- **S0-2:** charter R1/R5 cite `index.html`; §7 row 5 "Missing" though MEND heals peers (`:619`). Fix: update three cells.
- **S0-4:** D-106 "2026-11-14" and "First run: `docs/audits/2026-11-14/`"; this run is `2026-11-13`. Fix with the audit's D-entry.
- **S5-6, S5-7, S5-8, S5-9, S5-10, S5-11, S5-12:** quoted text verified at the cited landing lines (see table); images 06-sphinx-defi/07-fishing/mint.jpg opened and match the claims; 4 retired PNGs have 0 references in `landing.html` but remain in `assets/` (served by `relay.mjs:182`) and in `docs/TRAILER_SCRIPT.md:80-82`. Fixes as in `05-landing.md` (LANDING lane copy/a11y; BRAIN for captures, json and TRAILER_SCRIPT refs).

## INTENDED / REJECTED / DUPLICATE (one line each, with the reason)
- **S4-3 · INTENDED** — staff +2 MP per hit is written into CLAUDE.md §4 and D-036; salmon MP is D-070; MEND heals in the field by design ("paid in MP"). The only defect is the self-contradicting §4 sentence, folded into S4-8.
- **S2-2 (stacking part) · INTENDED** — "bonuses sum" is D-060/D-064 and dogeon-game §3.8; only the missing floor stays REAL.
- **S1-5 · DUPLICATE** of the known D-104 open item (`DogeItems.mint` permissionless; plan §2). Useful add for plan §4: warn LPs not to seed v1 pools above the mint fee.
- **S2-9 · DUPLICATE** of S4-11 (sim gaps), merged.
- **S3-4 (god-mode half) · DUPLICATE** of S2-1.
- **S3-10 (partial) · REJECTED part**: "kick the victim off everyone's screen" — the victim's next `st` (100 ms) re-adds the ghost; the rest stays REAL-LOW.
- **S4-7 (citation) · REJECTED line numbers only**: several GAME_GUIDE line refs are off by 4–15; the quoted text exists, so the finding stands with corrected lines.
- **S3 handoff "+150 DOGE yarn"** — already DISPUTED by stage 4 and correct: `YARN_MATS={wood:3,stone:3,steel:3}` (`:434`).
- **INFO (no action):** S0-3 (1475/1500 lines: fixes go to a new `src/*.js`), S1-10 (stray NFTs/DOGE stuck in DEX; also why donation attacks fail), S2-10 (N6 wallet safety holds), S2-11 (`SEL.stakedOf` bytes = `staked(address)`; label only), S3-16 (traversal, frame parser, server-only messages hold), S4-12 (offline death scatters ≤ 4 steel/whiskers; `P.wantClass` is written but never read), S4-13 (what holds), S5-13 (landing-check guards no numbers), S5-14 (T5/T7/T8/T9 hold).

## Coverage gaps the pipeline did not check
- **Live state:** no RPC reads, so the live `mintFee`, profession `fee`, `stakingPool`, owner, the old pre-D-071 DEX balances, and the D-098 tx receipts are unverified (S0-1, S1-3, S1-6, S5-10 depend on them). A read-only `cast call` session would close this.
- **Live host:** `dogeon.lat` / Fly not probed (S3-1 fix live status per D-107 only; whether Fly's proxy forwards raw `%` unknown).
- **Anvil e2e** (`SKIP chain e2e`) and `scripts/browser-smoke.sh` / `scripts/e2e-chikyu.sh` not run: list/buy/LP/swap/withdraw and real-wallet reject paths (S2-3, S2-8, `!e.sent` refund) are traced only.
- **S2-2 in situ:** gear-stat effects were traced and the rolls proven; no run with a mocked connected wallet holding token #61.
- **Staking rounding (S1-7)** needs a new invariant test file; not written (read-only).
- **Balance/TTK** (`balance-check` skill), real-browser rendering of missing glyphs and phone-width landing layout, video frames beyond posters.
- **New code surfaces not in any stage:** `scripts/trailer/*`, `scripts/landing-check.mjs` internals, `.github/workflows/deploy.yml` beyond the publish path, `docs/PLAYER_DATA_PLAN.md`.
