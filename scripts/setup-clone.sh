#!/usr/bin/env bash
# DOGEON — one-command environment setup for a fresh clone (D-084). Linux / WSL / macOS / Git Bash / TryNoah sandbox.
#
#   git clone https://github.com/PangaPangaDKF/dogeon.git && cd dogeon && bash scripts/setup-clone.sh
#
# What it does (nothing else, no npm install, no global changes except optional Foundry):
#   1. checks git + bash + Node >= 18 (the game itself needs NOTHING; Node is only for tests + the relay server)
#   2. checks Foundry (`forge`); installs it only with --install-foundry (official foundryup, into ~/.foundry)
#   3. fetches the gitignored Solidity libs at the EXACT pinned versions into contracts/lib
#      (OpenZeppelin v5.1.0, forge-std v1.17.0) — without them tests/check.sh silently skips the contract stage
#   4. runs `bash tests/check.sh` and fails unless ALL CHECKS PASSED *and* the forge stage really ran
#   5. prints how to run the game
# Flags: --install-foundry  install Foundry if missing   ·   --no-contracts  skip libs + forge (game-only clone)
set -euo pipefail
cd "$(dirname "$0")/.."

OZ_TAG=v5.1.0; FSTD_TAG=v1.17.0
INSTALL_FOUNDRY=0; NO_CONTRACTS=0
for a in "$@"; do case "$a" in
  --install-foundry) INSTALL_FOUNDRY=1 ;;
  --no-contracts) NO_CONTRACTS=1 ;;
  -h|--help) sed -n 2,16p "$0"; exit 0 ;;
  *) echo "unknown flag: $a"; exit 2 ;;
esac; done

ok()  { printf '  \033[32mOK\033[0m   %s\n' "$1"; }
die() { printf '  \033[31mFAIL\033[0m %s\n' "$1"; exit 1; }

echo "== 1. toolchain =="
command -v git >/dev/null || die "git not found"
ok "git $(git --version | awk '{print $3}')"
command -v node >/dev/null || die "node not found — install Node 18+ (https://nodejs.org or: sudo apt install nodejs)"
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
[ "$NODE_MAJOR" -ge 18 ] || die "node $(node --version) is too old — need 18+"
ok "node $(node --version)"
[ -f src/game.js ] && [ -f index.html ] || die "run this from a DOGEON clone (src/game.js + index.html missing)"
ok "game files present: index.html (shell) + src/game.js ($(wc -l < src/game.js | tr -d ' ') lines)"

FORGE=""
if [ "$NO_CONTRACTS" = 0 ]; then
  echo "== 2. Foundry =="
  FORGE="$(command -v forge || true)"; [ -z "$FORGE" ] && [ -x "$HOME/.foundry/bin/forge" ] && FORGE="$HOME/.foundry/bin/forge"
  if [ -z "$FORGE" ] && [ "$INSTALL_FOUNDRY" = 1 ]; then
    curl -L https://foundry.paradigm.xyz | bash
    "$HOME/.foundry/bin/foundryup"
    FORGE="$HOME/.foundry/bin/forge"
  fi
  [ -n "$FORGE" ] || die "forge not found — rerun with --install-foundry, or --no-contracts for a game-only clone"
  ok "$("$FORGE" --version | head -1)"

  echo "== 3. Solidity libs (pinned) =="
  fetch() { # name repo tag
    local dir="contracts/lib/$1"
    if [ -d "$dir" ]; then ok "$1 already present"; return; fi
    git clone -q --depth 1 --branch "$3" "https://github.com/$2.git" "$dir"
    rm -rf "$dir/.git"
    ok "$1 $3"
  }
  mkdir -p contracts/lib
  fetch openzeppelin-contracts OpenZeppelin/openzeppelin-contracts "$OZ_TAG"
  fetch forge-std foundry-rs/forge-std "$FSTD_TAG"
fi

echo "== 4. full verification (tests/check.sh) =="
LOG="$(mktemp)"
bash tests/check.sh | tee "$LOG"
grep -q 'ALL CHECKS PASSED' "$LOG" || die "tests/check.sh did not pass — do not continue, report the failing stage"
if [ "$NO_CONTRACTS" = 0 ]; then
  grep -q 'PASS.*forge test' "$LOG" || die "forge stage did not run (see INFO line above) — contracts were NOT tested"
fi
ok "baseline green"

cat <<'EOF'

== 5. run it ==
  Game + landing + multiplayer relay (one process, zero deps):
    node server/relay.mjs                      # PORT env, default 8787
    http://localhost:8787/          -> landing page
    http://localhost:8787/play      -> the game
    http://localhost:8787/play?mp=ws://localhost:8787&room=heist&name=A   -> multiplayer (open 2 tabs, other name=)
    http://localhost:8787/health    -> JSON
  Game only, static: any static server over the repo root (must serve index.html AND src/game.js).
  Container: docker build -t dogeon . && docker run -p 8080:8080 dogeon
  Wallets do NOT inject into file:// — use http(s) for CONNECT WALLET (DogeOS Chikyu, chainId 0x5fdaf3).
EOF
