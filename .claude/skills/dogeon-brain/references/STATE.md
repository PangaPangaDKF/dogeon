# BRAIN state (update in every closeout)

As of 2026-11-14, HEAD after D-113. Status: **launch-ready**; last step is the user's live playtest (≤ 8 players, RUNBOOK §8).

## 1. What's live
| Thing | Where | Notes |
|---|---|---|
| Landing | https://dogeon.lat | `landing.html`, LANDING lane |
| Game | https://play.dogeon.lat (also `/play`) | `index.html` shell + `src/game.js` (1477 / 1500 lines: new code → new `src/*.js` classic script) |
| Relay | same Fly app, WebSocket on the serving host | `server/relay.mjs`, zero deps |
| Host | Fly app `dogeon-game`, one machine `8911334f6dd3d8`, sleeps when idle (~3 s cold start) | `fly.toml`, `Dockerfile` (`node:22.23.4-bookworm-slim`, `USER node`) |
| Chain | DogeOS Chikyū testnet `0x5fdaf3` (6281971), RPC `https://rpc.testnet.dogeos.com`, explorer `https://dogeos-testnet.l2scan.co` | addresses = `CONTRACTS['0x5fdaf3']` in `src/game.js` (never from memory) |
| Repo | https://github.com/PangaPangaDKF/dogeon (`main`) | pushed after every deploy |

## 2. Numbers (re-check only when you change them)
- Tests: sim 59 scenarios (`tests/sim.mjs`, seed 4242), relay 23 checks (`tests/relay.mjs`), forge 47 (`contracts/test`), drift guard 5 files.
- Game: `FIELD_POP` 52, ruins 6, mini-bosses + ruins respawn 20 s, `BOSS_RESPAWN` 60 s, boss 320 HP (+50% per extra raider in the room),
  mint fee 1 testnet DOGE (read live as `chainData.fee`), `YARN_MATS` 3/3/3, start kit 2 steel + bag 3 wood + 3 stone.
- Relay limits (D-109/D-111/D-112): 8 seats per server, 3 per IP (`MAX_PER_IP`), 30 msgs/s, 1 KB frames, no `st` for 30 s → dropped,
  moves ≤ 200 px/s + 40 px, boss damage ≤ 120/s per player (`BOSS_DPS`), PvP ≤ 80/s, heal ≤ 20 HP / 72 px, loot only on death,
  piles expire 120 s (`LOOT_TTL_S`), unique ids per room, `/health` = counts only, `nosniff` + referrer policy.
- Mod mode: only the connected `MASTER_ADDR` wallet (D-111). No URL switch.

## 3. Verified facts you can reuse
- Real mints on chain: NFT #12 `0xda810f92d27f00d59e2b0ea55499607a7ff1fd4cca194b46a23586287c46e1c0` (block 9,429,348) and #13
  `0x5025f871b37b0a0a88081d0b4798dfc4b9014f007a0b7341b43e1323c2c30767` (block 9,429,362): status 1, DogeItems, 1 DOGE, Transfer from 0x0.
- Fee routes: mint 80% stakers / 20% treasury (pushed by `withdrawFees()`, game row `SEND MINT FEES TO STAKERS`); DEX 2% LP + 1% protocol
  (0.2% treasury / 0.8% stakers via `flushStakerFees()`); profession 100% treasury. `DogeDEX.items`/`stakingPool` are immutable.
- Audit 2026-11-13 (`docs/audits/2026-11-13/06-verified.md`): 56 verified; all non-contract items fixed (D-107, D-109, D-110, D-111, D-112).

## 4. Open and deferred (by the user's decisions)
| Item | Status | Where |
|---|---|---|
| Live playtest ≤ 8 players | **next, user** | RUNBOOK §8 |
| Contracts v2 (10 audit items: open mint, JIT staking, residual, atomic re-roll, owner powers, deploy script, invariants, oracle, Ownable2Step, fee push) | deferred to after launch, **first when work restarts** | `docs/CONTRACTS_V2_PLAN.md` §0 |
| Player saves (browser autosave → sign-in-to-save) | deferred, user to approve | `docs/PLAYER_DATA_PLAN.md` |
| Mint clip shows the removed `1 WOOD+1 STONE` row (S5-1) | captioned on the landing; no new recording (user) | `assets/video/mint.*` |
| Moving cursor in healer/archer captures | accepted | re-record with OBS "Capture Cursor" off for a v2 trailer |
| Shared field enemies (MMO) | out of scope until the user asks | CLAUDE.md §2 |
