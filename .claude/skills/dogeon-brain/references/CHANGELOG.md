# dogeon-brain changelog and lessons (newest first)

## 1.0 · 2026-11-14 · D-113 — skill created (BRAIN handoff kit)
Built from the BRAIN sessions D-095 … D-112. Lessons that became rules:
- **Session crash recovery:** Claude Code keeps every session as `.jsonl` (`claude --resume`). Run agents under `hc run --bg` so closing
  a terminal window doesn't kill them; read a dead session's tail to resume exactly where it stopped (D-095 closeout).
- **D-numbers:** reserve on the board and commit that line BEFORE writing the number into code (D-109: LANDING took D-108 mid-task and a
  pushed commit kept the wrong number).
- **Truth beats speed:** media and copy drift when rules change: after D-097 the victory clip still showed "+150 DOGE" (LANDING caught it,
  D-099). Grep media and copy for any mechanic you remove.
- **One source of truth for state:** two counters for wood/stone (bag vs `P.wood`) made the forge lie (D-103). Route every read/write
  through one helper.
- **Spend → get:** the game had 4 free mint paths (D-104). Guard at the single choke point (`mintNft`), not in each menu.
- **Audit first, then fix by severity**, test-first, one D-number per batch; hotfix a proven live CRITICAL immediately (D-107).
- **Never trust the client** in the relay: positions, damage, heals, loot and ids are all validated server-side (D-109, D-111, D-112).
- **Minified one-line functions:** a `//` comment inserted mid-line silently comments out the rest; `node --check` after every edit.
- **Test harness traps:** `api.get()` is a copy; `__api` lives in a template string (no backticks); relay tests share one IP (raise
  `MAX_PER_IP` for the main relay, test caps on a second relay).
- **Ask vs act:** contracts, game rules, scope and public promises need the user's yes; implementation, order and verification don't.
