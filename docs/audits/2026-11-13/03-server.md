# Stage 3 — Server & security · 2026-11-13 · HEAD a3bbc4e
## Scope covered
- Read in full: `server/relay.mjs` (220 lines), `Dockerfile`, `.dockerignore`, `fly.toml`, `docker-compose.yml`, `.github/workflows/deploy.yml`,
  `tests/relay.mjs`, `tests/serve.mjs`, MULTIPLAYER section `src/game.js:1132-1209` (`defaultMp`, `netSend`, `netPvp`, `bossCycle`, `netBoss`,
  `netConnect` message handlers, `netTick`, `netDraw`), plus the callers `hurtPlayer` `:558`, `respawn` `:567-568`, `mend` `:614-619`, boss hit `:624`, `killEnemy` boss branch `:638`.
- Reports 00, 01, 02 read in full before starting.
- `node tests/relay.mjs` (own random port) → 14 PASS lines, `✓ relay: 0 failed`.
- Two proof scripts (scratchpad only, each started its own relay on a random port 41000–49999 and either saw it exit or killed only its own PID; `ps` afterwards: `gone`):
  - `1 boss msgs seen by honest player: [{"t":"boss","hp":0,"max":480,"dead":1}] count 8`
  - `2 living player forged piles 12 got msgs 12`
  - `3 heal relayed to honest: [{"t":"heal","amt":99999,"x":0,"y":0,"r":1000000000,"id":"griefer"}]`
  - `4 hurt delivered: [{"t":"hurt","id":"griefer","dmg":40,"x":300,"y":300}]`
  - `A living griefer piles accepted: 48 | honest death pile delivered? false`
  - `6 9th player in an empty room got: [{"t":"full","msg":"SERVER FULL (8/8 PLAYERS)"}]`
  - `B 500 pings in one burst (MAX_RATE=30) -> pong frames: 500 socket open: true`
  - `9 relay exited? 1 stderr: URIError: URI malformed` and `C GET /% -> relay exit code 1`
  - `8 health: {"ok":true,"rooms":[{"room":"r1","players":2},{"room":"room0","players":1},...]}`

## Earlier findings re-checked
| ID | Verdict | Evidence |
|---|---|---|
| S0-1…S0-4 | OUT OF SCOPE | Docs/fee/line-cap items; none touch relay or MULTIPLAYER. |
| S0 handoff D-096 (Range) | CONFIRMED sound | `relay.mjs:181-186`: suffix `bytes=-N` clamps to 0, start ≥ size → 416, end clamped; test `video range … past-end -> 416` passed. Traversal blocked by `normalize` + `^/assets/` regex + `startsWith` (test `assets traversal — status 404`). But see S3-1: the `decodeURIComponent` one line above crashes the process. |
| S0 handoff D-095 (boss cycle) | EXTENDED | Cycle works (test `raid cycle` PASS) but any client can trigger it (S3-2) and the timer survives room deletion (S3-11). |
| S1-1…S1-10 | OUT OF SCOPE | Contract findings. |
| S2-1 (god mode / `?mod=1`) | EXTENDED | The relay has no player HP model: `hurt` is applied only by the victim's own client (`src/game.js:1176` → `hurtPlayer` returns at `:559` when `P.god`). A mod/god client is unkillable in PvP while it still hits others; nothing server-side can see it. See S3-4. |
| S2-10 (wallet never sent) | CONFIRMED | `netTick` `:1199` `st` fields are `t,id,x,y,d,m,c,h,n,pt,dead`; `join` is `t,room,id,party`. No address. `partyMenu` shows the wallet only locally. |
| S2 handoff (1) forged boss death | CONFIRMED → S3-2 | PROVEN, line 1 above. |
| S2 handoff (2) loot cap / non-dead piles | CONFIRMED → S3-5, S3-6 | PROVEN, lines 2 and A above. |
| S2 handoff (3) god mode in PvP | CONFIRMED → S3-4 | TRACED. |

## Findings
### S3-1 · CRITICAL · One HTTP request with a bad `%` escape kills the relay (game, landing and every room go down)
- Law: CLAUDE.md §2 (D-040 self-hosted relay), OWASP DoS   - Where: `server/relay.mjs:175`   - Proof: PROVEN
- Evidence: `const p = normalize(decodeURIComponent(pathname)).replace(...)` runs for every path not matched earlier, with no `try`. Output: `C GET /% -> relay exit code 1`, stderr `URIError: URI malformed`.
- Failure scenario: anyone sends `GET /%` (or `/%E0%A4%A`) → uncaught throw in the request handler → Node exits → all WebSockets drop, boss/loot state lost, landing page down. On Fly the machine restarts, so a loop of one request per second keeps the site down. (Not tried against the live host; whether Fly's proxy forwards the raw `%` is SUSPECTED.)
- Fix (smallest): wrap the decode: `let d; try { d = decodeURIComponent(pathname); } catch { res.writeHead(400); return res.end('bad request'); }`. Add `process.on('uncaughtException', …)` logging only as a backstop. Same bug, lower risk, in `tests/serve.mjs:16` (async handler → unhandled rejection; bound to 127.0.0.1).   - Lane: BRAIN   - Contracts: no

### S3-2 · HIGH · Any client can kill the shared Cat Lord in under a second from anywhere, and reset the whole room's quest every 60 s
- Law: D-076 (relay referees the boss), D-095, CLAUDE.md §4 (quests)   - Where: `server/relay.mjs:126`, `:47-57`; `src/game.js:1150`, `:1163-1164`   - Proof: PROVEN
- Evidence: position is taken from the client's own `st` with no movement check: `c.p = { x: m.x, y: m.y, dead: !!m.dead }`. The only boss gate is `inBossRoom(me)`; each `bhit` takes up to `MAX_HIT = 60`, and `MAX_RATE = 30`/s. Proof line: `[{"t":"boss","hp":0,"max":480,"dead":1}]` after one `st` at tile (40,5) and 10 `bhit` with `dmg:999`. The relay never checks quest stage or the ruins gate.
- Failure scenario: griefer sends `st` with boss-room coords (gate closed, quest 0) + 8 `bhit` → boss dead for the room → 60 s later the relay sends `cycle` → `bossCycle()` sets every client with `stage>=1` back to `stage=1, kills=0, gateOpen=false`. Repeat each minute → no one in that room can ever pass quest 2. Honest players standing in the boss room also get a free `killEnemy` (Golden Yarn, `state.won` → DogeMaster rows, `:638`).
- Fix (smallest): server side, cap boss damage per player per second (e.g. ≤ 2 hits/s, MAX_HIT stays), reject position jumps larger than `speed × dt` between `st` messages, and require the player to have been in the boss room for N seconds. Optionally make `cycle` only reset clients that were in the raid.   - Lane: BRAIN   - Contracts: no

### S3-3 · HIGH · `heal` is relayed verbatim and the receiver trusts `amt` and `r`: any peer can full-heal anyone anywhere (breaks the 60% rest cap)
- Law: CLAUDE.md §4 Healing (REST_CAP, "no regen"), D-040 (peer data is untrusted)   - Where: `server/relay.mjs:127`; `src/game.js:1181-1183`   - Proof: PROVEN (relay) + TRACED (client)
- Evidence: relay `if (m.t === 'st' || m.t === 'heal') return broadcast(c, text);`. Client: `if(!P.dead&&Math.hypot(P.x-m.x,P.y-m.y)<=(m.r||72)){const amt=Math.max(1,m.amt|0);P.hp=Math.min(P.maxHp,P.hp+amt);`. Proof line 3: `{"t":"heal","amt":99999,"x":0,"y":0,"r":1000000000}` reached the other player. The honest healer sends `amt ≈ 20×skillMul`, `r:72` (`:619`) and pays MP; nothing checks that the sender is a healer, has MP, or is near.
- Failure scenario: a player opens a second tab in the same room and sends `heal` with `r:1e9, amt:99999` every second → the main tab is at full HP in the field and at the boss, without resting or food. A rival can also heal an opponent mid-PvP.
- Fix (smallest): client: `amt = Math.min(HEAL_MAX, …)`, ignore `m.r` and use a fixed 72 px, require the sender's last known ghost to be within 72 px and of class `healer`; relay: rate-limit `heal` to the MEND cooldown and check the sender's `st` position.   - Lane: BRAIN   - Contracts: no

### S3-4 · HIGH · PvP trusts the attacker's self-reported position, and the victim alone decides whether it takes damage
- Law: D-076 (relay referees PvP range/camp), CLAUDE.md §4 (camp safety), extends S2-1   - Where: `server/relay.mjs:59-64`, `:126`; `src/game.js:1176`, `:559`   - Proof: PROVEN (teleport hit) + TRACED (god mode)
- Evidence: `if (!near(me, o.p, PVP_RANGE)) return;` where `me` is the last `st` the attacker sent. Proof line 4: after `st {x:300,y:300}` the victim got `{"t":"hurt","dmg":40}` regardless of where the attacker really is. `inCamp(me)` uses the same spoofed point, so an attacker can sit in camp while reporting a field position. The relay holds no HP: a client with `P.god` (S2-1) or a patched `hurtPlayer` ignores every hit.
- Failure scenario: cheater stands safe in camp, sends `st` next to a victim fishing in the field + `pvp dmg:40` → victim loses ~40 HP per i-frame window (0.9 s), dies, drops loot (S3-5), which the cheater then takes. Honest players cannot hurt the cheater back.
- Fix (smallest): server speed check on `st` (max tiles/s by class + knockback margin), reject `pvp` if the attacker's previous `st` was in camp, rate-limit `pvp` per attacker to the swing cooldown. True HP authority is a bigger design change (note it for the v2 plan of the relay, not contracts).   - Lane: BRAIN   - Contracts: no

### S3-5 · MEDIUM · Death-loot piles can be created by a living player who never died: free materials → craft → mint
- Law: N0 SPEND → GET (via the relay), D-076 ("nothing is duplicated")   - Where: `server/relay.mjs:66-75`   - Proof: PROVEN
- Evidence: `if (!me || !Array.isArray(m.items)) return;` — no `me.dead` check, no record of what the player carried, 12 items per message. Proof line 2: `living player forged piles 12 got msgs 12`; each `got` → `matAdd(m.k,1)` (`src/game.js:1180`).
- Failure scenario: script sends `loot` with 12 `steel` at its own spot, then 12 `take` → +12 STEEL; repeat at ~2 rounds/s (rate cap 30) → materials for any recipe → forge credit → real NFT mint. Severity is MEDIUM, not HIGH, because the single-player client already trusts the console and `?mod=1` (S2-1) gives the same; but the relay comment promises server authority here.
- Fix (smallest): accept `loot` only once per death: require the sender's last `st` to have `dead:1` and set a `c.dropped` flag cleared on the next `st` with `dead:0`; cap total items per death to the client's own cap (3 per kind × 4 kinds = 12).   - Lane: BRAIN   - Contracts: no

### S3-6 · MEDIUM · Loot piles never expire; 48 junk piles make every later death drop nothing
- Law: CLAUDE.md §4 Death (loss should be recoverable by others in MP, D-076)   - Where: `server/relay.mjs:34` (`LOOT_CAP = 48`), `:70`   - Proof: PROVEN
- Evidence: `... || w.loot.size >= LOOT_CAP) continue;` and piles are only removed by `take`. Proof line A: `A living griefer piles accepted: 48 | honest death pile delivered? false`.
- Failure scenario: a griefer (or simply many deaths in a far corner) fills 48 piles at map coords (20,20). From then on an honest player's death sends `loot` but the relay accepts none; `respawn` already zeroed the materials, so they vanish for everyone until the room empties.
- Fix (smallest): give each pile a TTL (e.g. 120 s, like the 30 s single-player `life`) and evict the oldest when full instead of refusing new ones. Combined with S3-5.   - Lane: BRAIN   - Contracts: no

### S3-7 · HIGH · Eight idle sockets fill the whole server; no per-IP cap, no Origin check, and pings keep them alive
- Law: OWASP DoS, CLAUDE.md §2 (D-040 caps peers)   - Where: `server/relay.mjs:116-118`, `:146`, `:206-216`   - Proof: PROVEN
- Evidence: `let total = 0; for (const s of rooms.values()) total += s.size; ... if (total >= MAX_ROOM || r.size >= MAX_ROOM)` — `MAX_ROOM` (8) is a server-wide total, not per room. Proof line 6: a 9th player joining an empty room got `SERVER FULL (8/8 PLAYERS)`. The upgrade handler checks no `Origin`, so any web page can open these sockets from its visitors. Ping frames bypass `MAX_RATE` (proof B: 500 pongs, socket still open) and reset the 30 s idle timer.
- Failure scenario: one person opens 8 sockets (or embeds a page that does), joins with any ids and sends a ping every 20 s → nobody else can play multiplayer, indefinitely.
- Fix (smallest): decide whether 8 is per room or per server and make the message match; add a per-IP limit (e.g. 2 joins, use `x-forwarded-for`/`fly-client-ip` behind Fly), count control frames in `MAX_RATE`, and only reset idle on `st`. Optional: allow-list `Origin` to the serving host.   - Lane: BRAIN   - Contracts: no

### S3-8 · HIGH · Multiplayer is ON by default on any http(s) page; CLAUDE.md §2 and the code comment say it is opt-in
- Law: CLAUDE.md §2 (D-040: "only when the URL has `?mp`… Without `?mp` the game makes zero network calls"), sandboxed-publish rule   - Where: `src/game.js:1139-1140`, comment `:1134`   - Proof: TRACED
- Evidence: `const defaultMp=()=>{const p=netParam('mp');if(p==='off')return '';if(p)return p;try{if(...location.host&&(location.protocol==='http:'||location.protocol==='https:'))return (location.protocol==='https:'?'wss://':'ws://')+location.host;}...`. Introduced by `a58869c feat(ux): single-URL auto-multiplayer… (D-077)`; no D-entry or CLAUDE.md update records the law change (only a passing note in `docs/DECISIONS.md:269`). The sim's "net off by default" check passes only because the sim has no http `location`.
- Failure scenario: the GitHub Pages build (`deploy.yml` publishes `.`), a TryNoah sandbox, or `node tests/serve.mjs` → the game opens `wss://<page host>` with no `?mp`. That is a network call from game code in a "no network calls" publish target. With S3-9 it retries in a loop.
- Fix (smallest): either restore opt-in (auto only when served by the relay, e.g. the relay injects a flag or the path is `/play`), or record the change as a D-entry and update CLAUDE.md §2 + the code comment + the sim to test an http `location`. BRAIN decides; the law and the code must agree.   - Lane: BRAIN   - Contracts: no

### S3-9 · MEDIUM · No reconnect backoff: a closed or refused socket is re-opened on the next frame
- Law: CLAUDE.md §5 (never block/spam), OWASP DoS (self-inflicted)   - Where: `src/game.js:1196` (`if(!net.ws)netConnect();`), `:1188` (`ws.onclose=()=>{…net.ws=null;…}`)   - Proof: TRACED
- Evidence: hops: `onclose` sets `net.ws=null` → next `update` → `netTick` → `netConnect()` → `new WebSocket(NET_URL)`. `full` only shows a toast; the relay then drops the socket (`relay.mjs:118`).
- Failure scenario: server full (S3-7) or no relay at the host (S3-8 on GitHub Pages / `tests/serve.mjs`) → every client reconnects at up to frame rate, each refused join triggers a fresh upgrade + `full` toast. Many players amplify load on the relay exactly when it is full.
- Fix (smallest): exponential backoff (`net.retryT`, 2 s → 60 s), and stop retrying after `full` until the player chooses to reconnect.   - Lane: BRAIN   - Contracts: no

### S3-10 · MEDIUM · Player ids are not unique per room: a peer can impersonate another player's ghost and kick it off everyone's screen
- Law: D-040 (anti-spoof), D-076   - Where: `server/relay.mjs:114-119`, `:123`, `:60`, `:100`   - Proof: TRACED
- Evidence: join only checks the regex `^[a-z0-9]{1,12}$`; nothing checks that the id is unused in the room. Line 123 (`if (m.id !== c.id) return;`) only binds an id to its own socket. Ids are broadcast in every `st`. `pvp` picks the first socket with `o.id === m.to`. On disconnect, `bye` with that id is sent (`:100`) and clients `delete net.peers[m.id]`.
- Failure scenario: griefer reads victim id `abc123` from any `st`, joins the same room with id `abc123`, sends `st` with a far position and name `DOGE` → everyone's ghost for the victim jumps around; on disconnect, `bye abc123` removes the real victim from all screens until its next `st`; PvP against the victim may land on the griefer instead. The existing `anti-spoof` test covers only a different-id message on one socket.
- Fix (smallest): on join, refuse (or reassign) an id already in the room; better, let the relay assign ids.   - Lane: BRAIN   - Contracts: no

### S3-11 · LOW · Raid-cycle timer outlives its room: a new group reusing the room name gets a surprise quest reset
- Law: D-095, CLAUDE.md §4 (quests)   - Where: `server/relay.mjs:55`, `:101`   - Proof: TRACED
- Evidence: `w.cycle = setTimeout(() => { w.boss = null; toRoom(room, JSON.stringify({ t: 'cycle' })); }, BOSS_RESET_MS);` sends by room name; `drop` does `world.delete(c.room)` but never `clearTimeout(w.cycle)`.
- Failure scenario: last raider leaves within 60 s of the kill → a new group joins `heist` → the old timer fires → their clients run `bossCycle()` and drop to quest 1.
- Fix (smallest): `clearTimeout(w.cycle)` in `drop` before `world.delete`.   - Lane: BRAIN   - Contracts: no

### S3-12 · LOW · `/health` lists every room name and its player count
- Law: OWASP information disclosure   - Where: `server/relay.mjs:156-158`   - Proof: PROVEN (line 8 above)
- Evidence: `rooms: [...rooms].map(([room, s]) => ({ room, players: s.size }))`.
- Failure scenario: a friend group uses `?room=secret-raid` as a private room → anyone reads `/health`, joins it, and griefs (S3-2…S3-4).
- Fix (smallest): `/health` returns `{ok:true, players:N}` only.   - Lane: BRAIN   - Contracts: no

### S3-13 · LOW · No security headers on any response
- Law: OWASP secure headers   - Where: `server/relay.mjs:157`, `:164`, `:170`, `:185`, `:188`, `:198`   - Proof: TRACED
- Evidence: headers are only `content-type` (+ range headers). No `X-Content-Type-Options: nosniff`, no CSP / `frame-ancestors`, no `Referrer-Policy`.
- Failure scenario: the game page (which talks to `window.ethereum`) can be framed by another site for clickjacking; wallet popups are separate windows so funds risk is low.
- Fix (smallest): add `x-content-type-options: nosniff`, `referrer-policy: no-referrer`, `content-security-policy: frame-ancestors 'self'` to HTML responses (a full CSP needs `connect-src` for the relay + wallet RPC; test before tightening).   - Lane: BRAIN   - Contracts: no

### S3-14 · LOW · Container runs as root; base image not pinned
- Law: container hardening   - Where: `Dockerfile:1-9`   - Proof: TRACED
- Evidence: `FROM node:22-bookworm-slim` … `CMD ["node", "server/relay.mjs"]` with no `USER`. Good: only `index.html landing.html src assets server` are copied, no secrets; `.dockerignore` excludes `contracts/ docs/ .git/ .agents/ .claude/`.
- Failure scenario: any future RCE in the relay runs as root inside the VM.
- Fix (smallest): add `USER node` before `CMD`; optionally pin the image digest.   - Lane: BRAIN   - Contracts: no

### S3-15 · LOW · Stale docs: relay header says "keeps NO game state", "≤ 20 msgs/s"; MULTIPLAYER comment says shared loot is "NOT built"
- Law: R5 / docs truth   - Where: `server/relay.mjs:8-11` vs `:21` (`MAX_RATE = 30`) and `:29-44`; `src/game.js:1133-1136`   - Proof: TRACED
- Evidence: `// Limits: payload <= 1 KB, <= 20 msgs/s per client` vs `MAX_RATE = 30`; `It keeps NO game state` vs `world` map with boss and loot since D-076.
- Failure scenario: next agent reasons from the comment and misses the server-authority surface audited here.
- Fix (smallest): rewrite both header comments to match D-076/D-095/D-077.   - Lane: BRAIN   - Contracts: no

### S3-16 · INFO · Things that hold
- Static serving: traversal via `..`, `%2e%2e%2f` and backslashes is normalised away before the `^/assets/` and `src/` regexes; `startsWith(join(ROOT,…))` double-checks; no symlinks in `assets/ server/ src/` (`find -type l` empty). Range handler correct (D-096).
- Frame parser: unmasked/fragmented frames and 64-bit lengths drop the socket, payload ≤ 1024 B, garbage JSON ignored (test PASS).
- Client side: server-only messages (`boss`, `cycle`, `hurt`, `loot`, `gone`, `got`) cannot be forged by peers — the relay forwards only `st` and `heal`; `hurt` is clamped to 40 and still blocked by camp/i-frames; peer names pass `netClean`, ids are regex-checked, `peers` is `Object.create(null)` and capped at 32. Fly state is in memory only: a restart (or S3-1) wipes boss and loot, which is acceptable for testnet.
- GitHub Pages workflow publishes the whole repo (`path: '.'`) including `docs/` and `contracts/broadcast/`; the repo is public and no secret files are tracked (`.gitignore` covers `.env*`, `*.key`, `*.pem`). Hygiene only.

## Not checked (and why)
- Live Fly host (`dogeon-game`): not probed; attacking production is outside a read-only audit. Whether Fly's proxy normalises `/%` before the app (S3-1) is unverified.
- Browser behaviour of the reconnect loop (S3-9) not measured in Chrome (`scripts/browser-smoke.sh` not run: needs agent-browser).
- S3-10 not run as a script (code path is short and unambiguous).

## Handoff to the next stage
- **Stage 4 (gameplay) — what the relay enforces vs leaves to the client:**
  - Relay enforces: room/global player cap, payload size and message rate (text frames only), id binding per socket, boss HP pool + `MAX_HIT` 60 per hit, PvP camp/party/48 px range **on self-reported positions**, PvP damage cap 40, loot kinds/12 per message/48 per room, single winner per pile.
  - Client alone decides: its own position and speed, HP/death (and god mode), whether a `hurt` applies, heal amount/radius (S3-3), quest stage/gate (the relay never checks it before `bhit`), materials from `got`, everything about crafting and minting.
  - Check in stage 4: `bossCycle()` (`src/game.js:1162`) resets `stage`, `kills`, `bruteKills`, `gateOpen` but not carried materials, credits or `P.sword/armor` — confirm this matches §4 quests. `netBoss` gives `killEnemy` (Golden Yarn +150 off-chain DOGE, `:638`) to anyone standing in the boss room when the relay says dead — verify vs D-089/§4 economy. `mend` heals peers by `p.h<100` from untrusted ghosts (`:615`).
  - Sim coverage to add (proposed test names): `relay: bhit rejected after position jump`, `relay: boss damage rate cap per player`, `relay: loot only from a dead sender, once per death`, `relay: loot piles expire`, `relay: duplicate id refused in room`, `relay: malformed %-escape returns 400 and server stays up`, `relay: ping counts toward MAX_RATE`, `relay: cycle timer cleared when room empties`, `client: heal amt/radius clamped`, `client: reconnect backoff after full/close`, `net off by default under an http location`.
