#!/usr/bin/env bash
# DOGEON real-browser smoke test (D-041) — REAL Chrome via agent-browser, not the fake-canvas sim.
#
#   bash scripts/browser-smoke.sh          # needs agent-browser (npm i -g agent-browser && agent-browser install) + Node 22+
#
# The headless sim (tests/sim.mjs) uses a fake canvas, so a real-browser runtime error would slip past it and break a
# TryNoah/static deploy. This proves, in real Chrome: the page loads with zero page errors; Enter starts the game; the
# starter bag is there; the K skill works; and opt-in multiplayer with 3 players (this browser + 2 scripted players)
# works in BOTH directions. Screenshots land in tests/out/ (gitignored). Uses its own browser session (never the shared one).
set -uo pipefail
cd "$(dirname "$0")/.."
command -v agent-browser >/dev/null 2>&1 || { echo "SKIP: agent-browser not installed"; exit 0; }
PORT="${PORT:-8791}"; S="dogeon-smoke-$$"; OUT=tests/out; mkdir -p "$OUT"
pass=0; fail=0; RELAY=""; BOTS=""
ok()  { printf '  \033[32mPASS\033[0m %s\n' "$1"; pass=$((pass+1)); }
bad() { printf '  \033[31mFAIL\033[0m %s\n' "$1"; fail=$((fail+1)); }
ab()  { agent-browser --session "$S" "$@" 2>&1; }
ev()  { ab eval "$1" | tail -1 | tr -d '"\r'; }
noerr() { [ -z "$(ab errors | tr -d '[:space:]')" ]; }
cleanup() { ab close >/dev/null; [ -n "$RELAY" ] && kill "$RELAY" 2>/dev/null; [ -n "$BOTS" ] && kill "$BOTS" 2>/dev/null; }
trap cleanup EXIT

PORT=$PORT MAX_ROOM=8 node server/relay.mjs >/dev/null 2>&1 & RELAY=$!
for _ in $(seq 1 40); do curl -sf "http://localhost:$PORT/health" >/dev/null 2>&1 && break; sleep 0.25; done
echo "== DOGEON real-browser smoke (Chrome, session $S, port $PORT) =="

# ---------- 1. single player ----------
ab open "http://localhost:$PORT/" >/dev/null; ab wait --load load >/dev/null; ab set viewport 960 672 >/dev/null; ab wait 800 >/dev/null
noerr && ok "page loads with zero page errors" || bad "page errors on load: $(ab errors)"
[ "$(ev 'scene')" = "title" ] && ok "title screen shown" || bad "no title screen"
ab press Enter >/dev/null; ab wait 1200 >/dev/null
[ "$(ev 'scene')" = "play" ] && ok "Enter starts the game" || bad "Enter did not start the game"
[ "$(ev "bagCount('wood')+','+bagCount('stone')")" = "3,3" ] && ok "starter bag: WOOD x3, STONE x3" || bad "starter bag missing"
[ "$(ev 'String(P.prof)')" = "null" ] && ok "spawns as the basic doge (no class)" || bad "unexpected class at spawn"
m0=$(ev 'Math.round(P.mp)'); ab press k >/dev/null; ab wait 400 >/dev/null; m1=$(ev 'Math.round(P.mp)')
[ "${m1:-0}" -lt "${m0:-0}" ] && ok "K skill fires and spends MP ($m0 -> $m1)" || bad "K skill did not spend MP ($m0 -> $m1)"
ab screenshot "$OUT/smoke-camp.png" >/dev/null
noerr && ok "zero page errors during play" || bad "page errors during play: $(ab errors)"

# ---------- 2. multiplayer: this browser + 2 scripted players in room "smoke" ----------
cat > "$OUT/bots.mjs" <<'EOF'
import { writeFileSync } from 'node:fs';
const [url, out] = process.argv.slice(2), seen = {};
const mk = (id, n, c, x) => new Promise(res => { const ws = new WebSocket(url);
  ws.onopen = () => { ws.send(JSON.stringify({ t: 'join', room: 'smoke', id })); res({ ws, id, n, c, x }); };
  ws.onmessage = e => { try { const m = JSON.parse(e.data); if (m.t === 'st') seen[m.n] = (seen[m.n] || 0) + 1; } catch {} }; });
const ps = [await mk('p2warrior', 'WARRIOR2', 'warrior', 610), await mk('p3healer', 'HEALER3', 'healer', 690)];
let t = 0; const iv = setInterval(() => { t++;
  for (const p of ps) p.ws.send(JSON.stringify({ t: 'st', id: p.id, x: p.x, y: 575, d: 'down', m: 1, c: p.c, h: 75, n: p.n, dead: 0 }));
  writeFileSync(out, JSON.stringify({ receivedFrom: seen }));
  if (t >= 200) { clearInterval(iv); for (const p of ps) p.ws.close(); setTimeout(() => process.exit(0), 200); } }, 100);
EOF
rm -f "$OUT/bots.json"
node "$OUT/bots.mjs" "ws://localhost:$PORT" "$OUT/bots.json" & BOTS=$!
ab open "http://localhost:$PORT/?mp=ws://localhost:$PORT&room=smoke&name=BROWSER" >/dev/null; ab wait --load load >/dev/null
ab press Enter >/dev/null; ab wait 2500 >/dev/null
[ "$(ev 'String(net.on)')" = "true" ] && ok "browser connected to the relay (?mp)" || bad "browser did not connect"
peers=$(ev "Object.values(net.peers).map(p=>p.n+':'+p.c).sort().join(',')")
[ "$peers" = "HEALER3:healer,WARRIOR2:warrior" ] && ok "browser sees the other 2 players with their classes ($peers)" || bad "peers seen: $peers"
got=$(node -e "try{console.log(require('./$OUT/bots.json').receivedFrom.BROWSER||0)}catch(e){console.log(0)}")
[ "${got:-0}" -gt 5 ] && ok "the other players receive this browser's state ($got msgs)" || bad "bots received $got msgs from the browser"
ab screenshot "$OUT/smoke-multiplayer.png" >/dev/null
noerr && ok "zero page errors in multiplayer" || bad "page errors in multiplayer: $(ab errors)"

echo; echo "== $pass passed, $fail failed ==  (screenshots: $OUT/smoke-camp.png, $OUT/smoke-multiplayer.png)"
exit "$fail"
