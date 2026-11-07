---
name: terminal-testing
description: Teach the user how to test DOGEON (and small web projects in general) from the terminal on Windows (Git Bash / PowerShell) and on Ubuntu (WSL). Use when the user asks how to run tests, how to verify a change, how to use Ubuntu/WSL, why a test failed, or how to write a new test. Explains every command as it goes, in plain words, with short exercises.
---

# Terminal testing — teaching skill

Version: 1.0 (2026-11-07). Teaching mode: **explain each command before running it, show the real output,
then say what it means.** Never use caveman/terse style while teaching. Offer one small exercise at the end.

## 0. The three terminals on this machine
| Terminal | How to open | Project path | Good for |
|---|---|---|---|
| **Git Bash** (Linux-like shell on Windows) | VS Code terminal ▸ dropdown ▸ Git Bash | `/c/Users/dulbi/dogeon` | `bash tests/check.sh`, git |
| **PowerShell** (Windows native) | VS Code default terminal | `C:\Users\dulbi\dogeon` | `node tests/sim.mjs`, git, `wsl` |
| **Ubuntu 24.04 (WSL)** (real Linux) | Start menu ▸ Ubuntu, or `wsl` in PowerShell, or VS Code ▸ "WSL: Connect to WSL" | `/mnt/c/Users/dulbi/dogeon` | Testing like a Linux server/CI would |

`/mnt/c/` in Ubuntu is your Windows C: drive. Same files, seen from Linux.

## 1. The test suite (what exists and why)
- `tests/check.sh` — one command that runs everything:
  1. **static rules** with `grep` (no `alert(`, `fetch(`, external URLs… the CLAUDE.md constraints),
  2. **syntax check**: pulls the `<script>` out of `index.html` with `awk` and runs `node --check`,
  3. **headless simulation**: `node tests/sim.mjs`.
- `tests/sim.mjs` — runs the *real* game code in Node with a fake canvas (`vm` module), simulates
  minutes of play in milliseconds, and checks invariants **every frame** (no NaN position, HP ≤ max,
  no enemy inside camp, camp is safe, bank math, boss can be beaten, menu labels fit).
  - `PASS` = good. `FAIL` = a rule broke → exit code 1. `WARN` = known issue we haven't fixed yet.
  - `--seed N` changes the random play. If a seed fails, that seed **reproduces** the bug every time.

## 2. Lessons (run them with the user, one at a time)

### Lesson 1 — run the tests
```bash
cd /c/Users/dulbi/dogeon          # Git Bash   (Ubuntu: cd /mnt/c/Users/dulbi/dogeon)
bash tests/check.sh               # run everything
echo $?                           # exit code of the last command: 0 = success, anything else = failure
```
Explain: CI systems and git hooks only look at the exit code. That's why tests must `exit 1` on failure.

### Lesson 2 — run one piece, read the output
```bash
node tests/sim.mjs                # just the simulation
node tests/sim.mjs --seed 7       # different random play
for s in 1 2 3 4 5; do node tests/sim.mjs --seed $s > /dev/null || echo "seed $s FAILED"; done
```
Explain: `>` sends output to a file (`/dev/null` = trash). `||` runs the right side only if the left failed.
A `for` loop over seeds is a cheap "fuzz test".

### Lesson 3 — Ubuntu (WSL) basics
```powershell
wsl -l -v                                   # (PowerShell) list Linux distros
wsl -d Ubuntu                               # open Ubuntu
```
```bash
uname -a; cat /etc/os-release | head -2    # prove you are on Linux
node -v || sudo apt update && sudo apt install -y nodejs   # install node if missing
cd /mnt/c/Users/dulbi/dogeon && bash tests/check.sh
```
Useful Linux commands: `pwd` (where am I), `ls -la` (list), `cat file`, `less file` (q to quit),
`grep -n "updEnemy" index.html` (find text with line numbers), `wc -l index.html` (count lines),
`which node` (where is a program), `man grep` (manual).

### Lesson 4 — play-test in a real browser from the terminal
```bash
python3 -m http.server 8000      # Ubuntu or Git Bash; serves the folder
# open http://localhost:8000 in your Windows browser (WSL forwards localhost)
# Ctrl+C stops the server
```
Or `npx serve .`. Then open DevTools (F12) ▸ Console: **zero red errors** is the bar.
Console cheats for fast testing (from CLAUDE.md): `state.gateOpen=true; P.x=40*16+8; P.y=7*16+8`,
`P.fud=999`, `P.sword=4`, `P.hp=1` (test death).

### Lesson 5 — tests + git together
```bash
git status                         # what changed
git diff                           # the exact changes (q to quit)
bash tests/check.sh && git commit -am "fix: ..."   # commit ONLY if tests pass
git stash; bash tests/check.sh; git stash pop      # "was it already broken before my change?"
git bisect start; git bisect bad; git bisect good <old-hash>
git bisect run bash tests/check.sh                 # git finds the commit that broke it, automatically
git bisect reset
```

### Lesson 6 — write a new test (the habit that matters most)
1. Reproduce the bug by hand and write down the steps.
2. Add a `scenario('name', () => { ... })` in `tests/sim.mjs` that does those steps through `api`
   (`api.press('e')`, `api.hold('d', true)`, `api.step(1/60)`, `api.get().P`, `api.talk(npc)`).
3. Run it: it should FAIL (or WARN) **before** the fix. That proves the test can see the bug.
4. Fix the game. Run again: PASS. Commit the test and the fix together.
5. Known-but-unfixed? Use `warn()`. Once fixed, change it to `fail()` so the bug can never return.

## 3. Troubleshooting
| Symptom | Cause / fix |
|---|---|
| `$'\r': command not found` in Ubuntu | Windows line endings (CRLF). `.gitattributes` forces LF for `*.sh`; fix a file with `sed -i 's/\r$//' tests/check.sh` |
| `node: command not found` | Install Node (Windows: nodejs.org; Ubuntu: `sudo apt install nodejs`) |
| Colors look like `[32m` | Your terminal doesn't render ANSI colors; harmless |
| Sim FAIL with a stack trace | Read the first line: it names the frame and the rule. Re-run with the same `--seed` to reproduce |
| Browser shows nothing, keys do nothing | Click the canvas (focus) — the title screen says so too |

## 4. Exercises to offer
- Run the suite in both Git Bash and Ubuntu and compare outputs.
- Find the line of `updEnemy` with `grep -n` and open it in VS Code with Ctrl+G.
- Break something on purpose (e.g. set `if(ent.enemy&&inCampT(tx,ty))return false;`), run the tests, watch
  "camp safety" FAIL, then `git checkout index.html` to undo.
