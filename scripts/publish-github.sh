#!/usr/bin/env bash
# DOGEON — publish this repo to GitHub (D-037)
#
#   bash scripts/publish-github.sh <github-user>/<repo> [--private]
#
# Needs ONE of:
#   * the GitHub CLI, authenticated:  gh auth login
#   * or a classic/fine-grained PAT with "repo" scope:  export GITHUB_TOKEN=ghp_xxx
#
# It REFUSES to push if a private key or secret file is detected anywhere in history.
# Nothing here is run automatically: repo creation needs credentials the agent environment does not hold.
set -euo pipefail

SLUG="${1:-}"
VIS="public"
[[ "${2:-}" == "--private" ]] && VIS="private"
if [[ -z "$SLUG" || "$SLUG" != */* ]]; then
  echo "usage: bash scripts/publish-github.sh <github-user>/<repo> [--private]" >&2
  exit 2
fi
cd "$(dirname "$0")/.."

# ---------- 1. hard secret gate (never publish a key) ----------
echo "== pre-publish secret gate =="
FAIL=0
if git ls-files | grep -iE '\.env$|\.env\.|(^|/)key|secret|\.pem$|mnemonic' ; then
  echo "  !! secret-looking TRACKED file above — remove it before publishing" >&2; FAIL=1
fi
# any 64-hex blob in tracked text files (private keys are 64 hex chars)
if git grep -InE '(^|[^0-9a-fA-F])[0-9a-fA-F]{64}([^0-9a-fA-F]|$)' -- . \
   ':(exclude)contracts/deployments/*' ':(exclude)contracts/broadcast/*' ':(exclude)skills-lock.json' \
   ':(exclude)*.lock' ':(exclude)contracts/out/*' 2>/dev/null | head -5 ; then
  echo "  !! 64-hex blob(s) above look like private keys — review before publishing" >&2; FAIL=1
fi
[[ $FAIL -eq 0 ]] && echo "  OK: no tracked secrets detected"
[[ $FAIL -eq 1 ]] && { echo "ABORTED: refusing to publish with possible secrets."; exit 1; }

# ---------- 2. verification gate (don't publish a red build) ----------
echo "== verification gate =="
node scripts/trynoah-manifest.mjs --verify
bash tests/check.sh | tail -3

# ---------- 3. create + push ----------
echo "== creating $SLUG ($VIS) =="
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  gh repo create "$SLUG" "--$VIS" --source=. --remote=origin --push
else
  : "${GITHUB_TOKEN:?need gh auth login, or export GITHUB_TOKEN=<PAT with repo scope>}"
  OWNER="${SLUG%%/*}"; NAME="${SLUG##*/}"
  PRIV=false; [[ "$VIS" == "private" ]] && PRIV=true
  # user repo; for an org use /orgs/$OWNER/repos
  curl -fsSL -X POST https://api.github.com/user/repos \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -d "{\"name\":\"$NAME\",\"private\":$PRIV,\"description\":\"DOGEON — The Grand Heist: single-file 16-bit Web3 action RPG + DeFi hub on DogeOS Chikyu\"}" >/dev/null
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://${GITHUB_TOKEN}@github.com/${SLUG}.git"
  git push -u origin "$(git rev-parse --abbrev-ref HEAD)"
  # don't leave the token sitting in .git/config
  git remote set-url origin "https://github.com/${SLUG}.git"
fi

echo "== done =="
echo "repo:  https://github.com/$SLUG"
echo "raw index.html (hand this to TryNoah for an EXACT replica):"
echo "  https://raw.githubusercontent.com/$SLUG/$(git rev-parse --abbrev-ref HEAD)/index.html"
