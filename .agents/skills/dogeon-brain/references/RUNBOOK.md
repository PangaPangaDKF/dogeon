# BRAIN runbook (copy-paste recipes; prefer these over improvising)

## 1. Tests
```bash
bash tests/check.sh                 # everything: static rules, syntax, sim, forge, drift guard, relay (~3–5 min; run in background)
node tests/sim.mjs 2>&1 | grep -E "FAIL|failed"      # game only
node tests/relay.mjs                # relay only (own port; also starts a 2nd relay with tiny limits)
cd contracts && forge test          # contracts only
node scripts/trynoah-manifest.mjs --verify            # drift guard alone; --out docs/RECREATION_MANIFEST.md regenerates it
```
Sim API notes: `api.get()` returns a COPY (`api.get().ui = null` does nothing; use `api.closeUI()`); hold keys with `api.hold(k,true)`;
`boot(seed, { search: '?x=1' })` sets the URL; the `__api` object is inside a template string: no backticks in its comments.

## 2. Reproduce a server bug safely
`PORT=87xx node server/relay.mjs &` then curl/WebSocket it; kill only that PID. Never probe the live site with a crashing request.

## 3. Editing big one-line functions in `src/game.js`
Use a Python script with exact `assert s.count(a)==1` replacements (scratchpad file, then `python3 file`). Never append a `//` comment
in the middle of a minified line: it swallows the rest of the line (happened twice: always `node --check` right after).

## 4. Deploy + live verify
```bash
~/.fly/bin/fly deploy -a dogeon-game
curl -s https://dogeon.lat/health                                   # {"ok":true,"rooms":N,"players":M}
curl -s https://dogeon.lat/ | grep -o '<title>[^<]*'; curl -s https://play.dogeon.lat/ | grep -o '<title>[^<]*'
curl -s -o /dev/null -w '%{http_code}\n' https://dogeon.lat/%       # 400 (crash guard)
curl -s -o /dev/null -w '%{http_code}\n' -H 'Range: bytes=0-9' https://dogeon.lat/assets/video/mint.mp4   # 206
curl -s https://play.dogeon.lat/src/game.js | grep -c '<a string from your change>'
git push origin main
```
`fly` token expired → `fly auth login`, open the URL in the Windows browser. The machine sleeps when idle: first curl may take ~3 s.

## 5. Chain checks (read-only, public RPC)
```bash
curl -s -X POST https://rpc.testnet.dogeos.com -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getTransactionReceipt","params":["0x<hash>"]}'
cast sig "withdrawFees()"           # selectors for SEL in src/game.js (add new ones to the 4 recreation prompts too)
```

## 6. Media pipeline
ffmpeg is not installed system-wide: `python3 -m venv <scratch>/venv && <scratch>/venv/bin/pip install imageio-ffmpeg`, then
`FF=<path from imageio_ffmpeg.get_ffmpeg_exe()> SRC=<captures dir> bash scripts/trailer/build.sh` → `tests/out/trailer/` masters +
`assets/video/` landing files. Cards use the game's own FONT/LOGO; `music.mjs` is the original chiptune (cuts on the 0.5 s beat).
Render a real game menu headless: a scratch HTML in `tests/out/` with `<canvas id="c">` + `../../../src/game.js`, then call
`newGame(); scene='play'; shopMenu(...)` from a timeout (no key events), and Chrome `--allow-file-access-from-files --screenshot`.

## 7. Two-agent loop
```bash
hc ls                                   # find LANDING (where "dogeon / 1"); status working | done | idle
hc read <addr> --lines 120              # its screen/history
hc send <addr> "BOARD (from BRAIN): ..."  # only when it is done/idle and its input box is empty
```
Wait ≥ 30 min in the background (wakes you when done):
`sleep 1860; cd <repo>; git log --oneline -6; tail -12 docs/AGENT_BOARD.md` with `run_in_background: true`. Stop it if LANDING reports early.

## 8. Live playtest with up to 8 players (the user's last pre-launch step)
1. **Same network?** The relay allows 3 seats per IP. For a LAN party raise it for the session, then restore:
   `fly secrets set MAX_PER_IP=8 -a dogeon-game` … after the test: `fly secrets unset MAX_PER_IP -a dogeon-game` (each restarts the machine).
2. Everyone opens `https://play.dogeon.lat/?room=test` (same room). A 9th player must see "SERVER FULL".
3. Check, with notes: everyone sees everyone (names, classes, HP); the healer's MEND heals a nearby ally (+≤20); PvP outside camp hurts,
   inside camp never; a party (`P`) has friendly fire off; dying drops a loot pile others can take (once); the Cat Lord dies at a normal
   pace with 3+ raiders (HP scales +50% per raider; each player ≤ 120 dmg/s), then everyone sees `BOSS IN 60S`, the room restarts at
   quest 1 and the gate closes; nobody gets kicked while playing normally (a frozen tab is dropped after 30 s, that's expected).
4. Fewer friends? Fill seats with bots: `node scripts/trailer-bots.mjs wss://play.dogeon.lat test boss` (2 bots per run, from your IP).
5. Watch `fly logs -a dogeon-game` during the session; any crash = BRAIN bug. Report findings as a list; BRAIN fixes, tests, deploys.
