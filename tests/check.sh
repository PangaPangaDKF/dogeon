#!/usr/bin/env bash
# DOGEON quick check — runs on Git Bash (Windows) and Ubuntu/WSL.
#   bash tests/check.sh
# 1) static rules from CLAUDE.md  2) JS syntax  3) headless simulation (tests/sim.mjs)
set -u
cd "$(dirname "$0")/.."
fails=0
ok()   { printf '  \033[32mPASS\033[0m %s\n' "$1"; }
bad()  { printf '  \033[31mFAIL\033[0m %s\n' "$1"; fails=$((fails+1)); }
note() { printf '  \033[33mINFO\033[0m %s\n' "$1"; }

echo "== 1. static rules (CLAUDE.md §2) =="
for pat in 'alert(' 'confirm(' 'prompt(' 'fetch(' 'XMLHttpRequest' 'import('; do
  if grep -qF "$pat" src/game.js; then bad "forbidden call found: $pat"; else ok "no $pat"; fi
done
# R2 (mission charter): no useless effects. Anti-aliased blobs / glows break the crisp 16-bit look + cost frames in MP (D-075)
for pat in 'ctx.arc(' 'ctx.ellipse(' 'createRadialGradient' 'shadowBlur'; do
  if grep -qF "$pat" src/game.js; then bad "useless FX forbidden (R2 light): $pat"; else ok "no $pat (R2: light, no useless effects)"; fi
done
# WebSocket is allowed ONLY inside the opt-in MULTIPLAYER section (D-040), the way wallet calls live only in CHAIN (D-016)
if awk '/\/\/ =+ MULTIPLAYER/{m=1;next} /\/\/ =+ /{m=0} !m' src/game.js | grep -qF 'WebSocket'; then
  bad "WebSocket used outside the opt-in MULTIPLAYER section"; else ok "WebSocket only inside the opt-in MULTIPLAYER section"; fi
# the DOGE coin = the user's Dogecoin-logo art as in-code pixels (D-043): must stay exactly 96x96 with <= 32 colours
if node - <<'EOF'
const s = require('fs').readFileSync('src/game.js', 'utf8');
const pal = (s.match(/const MOSAIC_PAL='([^']+)'/) || [, ''])[1].split(',');
const m = s.slice(s.indexOf('const MOSAIC_PX=')).match(/^const MOSAIC_PX=\n([\s\S]*?);\n/);
const px = m ? m[1].replace(/[\s+']/g, '') : '';
process.exit(px.length === 9216 && /^[0-9a-v.]+$/.test(px) && pal.length >= 2 && pal.length <= 32 && pal.every(h => /^[0-9a-f]{6}$/.test(h)) ? 0 : 1);
EOF
then ok "DOGE coin art data intact (96x96 = 9216 px, <= 32 colours)"; else bad "DOGE coin art data corrupted (MOSAIC_PX / MOSAIC_PAL)"; fi
if grep -Eq '(src|href)="https?://' index.html; then bad "external asset URL found"; else ok "no external assets"; fi
lines=$(wc -l < src/game.js | tr -d ' ')
note "src/game.js is $lines lines of game code (index.html is a thin shell since the D-074 module split)"

echo "== 2. JavaScript syntax =="
if ! command -v node >/dev/null 2>&1; then
  bad "node not found (Ubuntu: sudo apt install nodejs)"; echo; exit 1
fi
tmp="$(mktemp -d)"
if node --check src/game.js 2> "$tmp/err.txt"; then ok "node --check src/game.js"; else bad "syntax error:"; cat "$tmp/err.txt"; fi
rm -rf "$tmp"

echo "== 3. headless simulation =="
if node tests/sim.mjs "$@"; then ok "simulation"; else bad "simulation (see FAIL lines above)"; fi

echo "== 4. contracts (forge test) =="
FORGE="$(command -v forge || echo "$HOME/.foundry/bin/forge")"
if [ -x "$FORGE" ] || [ -x "$FORGE.exe" ]; then
  if [ -d contracts/lib/openzeppelin-contracts ]; then
    if (cd contracts && "$FORGE" test >/tmp/forge.txt 2>&1); then ok "forge test ($(grep -o '[0-9]* tests passed' /tmp/forge.txt | tail -1))"; else bad "forge test"; tail -20 /tmp/forge.txt; fi
  else note "contracts/lib missing: see contracts/README.md setup"; fi
else note "forge not installed: contracts not tested"; fi

echo "== 5. recreation-prompt drift guard (D-037) =="
if node scripts/trynoah-manifest.mjs --verify >/tmp/drift.txt 2>&1; then
  ok "recreation prompts match source ($(grep -c '^  OK' /tmp/drift.txt) file(s) verified)"
else bad "recreation prompts quote stale contract addresses/selectors/classes"; cat /tmp/drift.txt; fi

echo "== 6. multiplayer relay, real WebSocket clients (D-040) =="
if node tests/relay.mjs >/tmp/relay.txt 2>&1; then
  if grep -q SKIP /tmp/relay.txt; then note "$(cat /tmp/relay.txt)"; else ok "relay: $(grep -c '  PASS' /tmp/relay.txt) checks (3 players, rooms, anti-spoof, cap)"; fi
else bad "multiplayer relay"; cat /tmp/relay.txt; fi

echo
if [ "$fails" -eq 0 ]; then printf '\033[32mALL CHECKS PASSED\033[0m\n'; else printf '\033[31m%s CHECK(S) FAILED\033[0m\n' "$fails"; fi
exit "$fails"
