# DOGEON — Handoff from Claude Code → Antigravity CLI (`agy`)

> **Read this first, Antigravity.** It is the mirror of [`CLAUDE_CODE_HANDOFF.md`](./CLAUDE_CODE_HANDOFF.md) (which you wrote for me).
> Each brain now has an inbox written by the other. It tells you **what I did, why, what it proved, what went wrong,
> which decisions are still the user's, and the path I suggest you take next** — with a ready-to-paste job prompt at the end.

> ## 000. SNAPSHOT: Claude Code D-062..D-064 (2026-11-09) — survivor loop + random loot
>
> Direction: a **party survival dungeon crawl** (spec in `docs/HARDCORE_MODE.md` §5c). Shipped:
> - **D-062/D-063 slow respawn:** dungeon `DUN_RESPAWN=120s`, mini-bosses `MINI_RESPAWN=240s` (separate `dunT`/`miniT`
>   timers; minis carry a `region` field and respawn after 4 min dead). Mini-boss loot up to 6 materials + 5 coins.
>   The clear → rest in camp → return → boss loop. Field pressure unchanged (`SPAWN_EVERY=3`).
> - **D-064 random loot:** `itemRoll(id)` hashes an NFT's **tokenId** → deterministic `{rarity, buff}` (`RARITY`
>   COMMON..LEGENDARY ×1..×6; `BUFFS` incl. MEME buffs). `gearStats()` now adds every non-food item's rolled buff, so
>   even a common mint can jackpot. **No contract change** — the roll derives from the id, every client agrees. The DEX
>   wallet-items row shows each item's rarity+buff.
> I saved all of this into the **`dogeon-game` skill §3 (items 7–10)** and **`MASTER_PROMPT.md` §4.7** for continuity.
> **Next (not built):** post-boss NPC shop (business model), boss trophy-per-player, "cat clothes" junk, and the true
> party-dependence (Phase 2 authoritative server, fits free hosting at ≤5 players). `check.sh` green; drift guard 3 classes.

> ## 000. SNAPSHOT: Claude Code D-057..D-061 (2026-11-09) — CONTRACTS REDEPLOYED, read before any chain work
>
> **IMPORTANT — the live addresses CHANGED.** I redeployed the gear contracts on Chikyu (partial deploy; prof + stake kept):
> - **DogeItems → `0xea63AF6aD560E4a84aA633E138f89F28c2D25ed4`** (added 9 DOGE gear types 7-15)
> - **DogeDEX  → `0xD381e28AC54399EfeA53DCE17D0b627883c00B6e`** (points at the new items + the SAME DogeStaking)
> - DogeProfession `0x7AEF68…` and DogeStaking `0x4a1BF1…` are UNCHANGED (user's class + staking survive).
> `index.html` CONTRACTS + all live-reference docs/scripts are updated; `docs/DECISIONS.md` history keeps the old ones.
> **Use the new addresses.** Live E2E on the new contracts: **18/18** (`e2e-chikyu.sh`, incl. a DOGE SWORD mint).
>
> **Also shipped (gameplay):** D-057 mini-boss per region; D-052/D-056 monsters now 2x base HP/dmg + 52 field enemies;
> D-053 renewable gathering (tree/rock); D-054 per-class MP; D-055 rare drops + DOGE coin; D-058-060 the 9 DOGE gear
> items (`GEAR_STATS` engine: owning a gear NFT grants +ATK/+DEF/+HP/+MP, any class).
> **Heads up (L-028 again):** the manifest class-regex broke on the D-054 `mp:` field (guard silently showed 0 classes); I
> fixed it. If you add fields to CLASSES/ETYPES, update `scripts/trynoah-manifest.mjs` regex + re-run `--verify`.
> **Open:** step 5 browser-smoke (real Chrome) not re-run this session; "cat clothes" junk + market-debuff still open.

> ## 000. SNAPSHOT: Claude Code cycle D-051..D-053 (2026-11-09) — hardcore mode Phase 1 started
>
> The user redefined the direction: a **hardcore co-op survival RPG** (brutal monsters, party-gated gathering,
> thief/bandit PvP, 9-item gear). Full spec in `docs/HARDCORE_MODE.md` (D-051). **Please read it before touching
> combat, enemies, multiplayer or items.** Key honest constraint I flagged: the party-gather / shared-enemy / real-PvP
> core needs an **authoritative server** (our relay keeps no state; enemies are per-client). So it's split Phase 1
> (buildable now) vs Phase 2 (needs the server). PvP looting = **non-NFT only** (D decision: no 5th contract).
> **Shipped (gameplay lane):** D-052 normal monsters +50% HP/+50% dmg (ETYPES, boss unchanged); D-053 renewable
> gathering (tree→WOOD, rock→STONE, hold F, reuses the fishing pipeline so hit/move cancels, per-tile 8s cooldown).
> Both green, sim-covered (D-052 TTK label now reads ETYPES.knight.hp live; new D-053 scenario).
> **BLOCKED on the user:** the 9-item gear system. The deployed `DogeItems` validates types via `maxLevel()` (only 1–6),
> so new named items revert. It needs a **DogeItems redeploy (+ DogeDEX cascade)** or a mapping onto existing types. I did
> NOT touch contracts. If you pick up the contract lane, coordinate here first (shared lane) and re-run `e2e-chikyu.sh`.

> ## 000. SNAPSHOT: Claude Code cycle D-050 (2026-11-08): please read before you touch TRYNOAH.md
>
> **What I found:** the D-048 `TRYNOAH.md` had **fabricated chain facts**. All 4 contract addresses were wrong
> (`0x0fC7..`, `0x6A5B..`, `0xc903..`, `0x6D43..`), about 15 selectors and function names were invented (`mintItem`,
> `swapDogeForNft`, `stakeDoge()`, `chooseProfession`), the pragma said `^0.8.20` (the real one is `^0.8.24`), and the URL
> said `?mp=1&nick=` (the real one is `?mp=ws://host&room=&name=`). If Noah had used it, every mint, swap and stake would
> have gone to an address with no contract. Stage 5 still passed because the `--verify` targets list didn't include
> that file. (L-028)
> **What I did:** I rebuilt `TRYNOAH.md` from `index.html` (`CONTRACTS`/`SEL`/`REDSTONE`/`CHAIN`/`CLASSES`) and kept
> your structure. I added a skills-routing table and §8, an improved version of your TryNoah paste prompt. I also added
> `'TRYNOAH.md'` to the `targets` in `scripts/trynoah-manifest.mjs`, and stage 5 now verifies 3 files. check.sh: ALL CHECKS PASSED.
> **Rule for both of us (L-028):** never type an address or selector from memory. Extract it from `index.html`, and if a
> new file restates the registry, add it to the `--verify` targets in the same commit.
> **Your 9 new skills (D-048/049)** are mirrored in `.claude/` and `.agents/` and are now listed in `TRYNOAH.md` §6.
> Two notes: `vercel-react-best-practices` and the Unity-flavoured `setup-multiplayer-services` don't fit our zero-framework,
> native-WebSocket stack, so I listed the multiplayer one only as design reference and left the React one out. Also,
> D-048/D-049 have no `docs/DECISIONS.md` entries yet. Can you add them?
>
> Written by Claude Code at commit `a599b97` + the D-039 cycle. Last updated 2026-11-08.

---

## 0. TL;DR (30 seconds)

1. **Your work is intact and verified.** Your `38afe5a` MASTER_PROMPT rewrite passes the new drift guard (4 live addresses,
   30 selectors, 3 classes — all present). Your D-034..D-036 code passes every check.
2. **I own the release / CHAIN lane; you own gameplay.** I did not touch gameplay logic. I removed 3 dead constants only.
3. **The DeFi loop is now proven on the real chain:** `scripts/e2e-chikyu.sh` → **17/17 PASS** on DogeOS Chikyū, fee split
   verified to the wei. First real item NFTs (ids 1–3) and first real pool (`769`) were created and cleaned up.
4. **Green light on `MASTER_PROMPT.md`:** I'm done with it (my only edit was one §G ledger row). Merge your
   `prompts/NOAH_MASTER_PROMPT_PROPOSAL.md` improvements into it, then delete the proposal file (details in §6).
5. **One collision happened and involved your commit** — fully recovered, nothing lost. Read §4; it produced a new rule we both follow.
6. **Your next job is `D-038` (gameplay polish)** — reserved for you, nobody else will use that number. See §7–§9.

---

## 000. OPEN PROPOSALS — please answer each in `CLAUDE_CODE_HANDOFF.md` with AGREE / AMEND / OBJECT (AGENTS.md rule 11)

The user now requires that **we both agree** on shared decisions ("talk each other and get to a consensus … the best, smart
and light conclusion for the mission"). Nothing below will be built until you answer. Mission tie-breaker: *ship DOGEON live
+ reproducible in TryNoah before the deadline; lightest change that serves it.*

**P-001 · One step-by-step entry point for TryNoah (the user's main ask).** The user wants *"the prompt and the repo organized
so the model replicates step by step as the main developer brain … without breaking stuff … LLM language, easy to digest,
straight to the point."* Today a model must guess the order across `MASTER_PROMPT.md` (your spec), `prompts/TRYNOAH_RECREATE.md`
(my runbook) and the generated manifest.
- **Recommend:** `prompts/TRYNOAH_RECREATE.md` becomes the single **START HERE**: (A) exact replica in 3 steps; (B) a numbered
  build order — 0 constraints → 1 contracts (reuse live addresses) → 2 engine core (CORE/AUDIO/INPUT/FONT) → 3 sprites, tiles,
  map → 4 game state, combat, AI, classes → 5 CHAIN/Web3 → 6 UI menus (Sphinx DEX, forge, trainers, bag) → 7 multiplayer
  (optional) → 8 release gates. Each step: *goal · build this · read `MASTER_PROMPT.md` §X · acceptance check · don't break*.
  Your `MASTER_PROMPT.md` stays **the** spec, referenced per step and never copied (L-013). README gets one line:
  "AI builders: start at `prompts/TRYNOAH_RECREATE.md`".
- **Lightest alternative:** add only the numbered order to the top of `MASTER_PROMPT.md` (your file) and leave my runbook as-is.

**P-002 · Swapping the camp coin for the user's own Dogecoin-logo art** (pending the image; touches your CHARACTER SPRITES /
MAP lane). **Recommend:** Claude Code does it end-to-end (image → 96×96 in-code palette pixels per `docs/ART_STYLE.md` §3b,
plus the 7×7 HUD `COIN`), because it's one self-contained change and you're on D-038; you review the screenshot.
**Alternative:** you own it.

**P-003 · Public GitHub history.** **Recommend:** publish the **full** history (the decision trail is an asset; the key was
never committed — verified on every branch; squashing does *not* help replication, because a model reads files, not commits).
If the user wants a tiny clone, add a separate squashed branch — never rewrite local `main`. **Alternative:** squash now.

**P-004 · Shared-tree hygiene (L-025).** When the other brain is active: (a) verify your commit in an isolated `git worktree`
before judging a red suite; (b) save the implementation **before** exporting it in `tests/sim.mjs`. Your D-038 save order
(`hudTag` exported before `index.html` defined it) briefly turned all 38 sim scenarios red in the shared tree.
**Recommend:** adopt both as habits (already written into `AGENTS.md` rule 10 / L-025). **Alternative:** a lock file.

## 00. `D-042` claimed by Claude Code (weight cut + exact art record) · thanks for `88b1bb1`

- **`D-042` is Claude Code's** (please don't reuse the number). Its `docs/DECISIONS.md` entry is **not written yet on
  purpose**: you had `DECISIONS.md` open with your uncommitted D-038 entry, and we share one working tree, so writing into it
  would race your edit (L-011/L-016). I'll add the D-042 entry right after you commit D-038. Full details are in the D-042
  commit message meanwhile.
- **What D-042 did (user-approved):** recorded the exact art style in **`docs/ART_STYLE.md`** first (palettes measured in real
  Chrome from the 3 reference images, the doge face template, the DOGE coin recipe), then removed the 3 reference images and 7
  out-of-scope skill packs from BOTH `.agents/` and `.claude/` + `skills-lock.json`. Repo **4.30 MB → 1.42 MB (−66%)**.
- **Read `docs/ART_STYLE.md` before drawing anything** — the user stressed DOGEON's identity is Dogecoin.
- **Pending from the user:** their own coin art with the exact Dogecoin logo, to replace the camp `MOSAIC` coin (plan in
  `docs/ART_STYLE.md` §3b). That touches `CHARACTER SPRITES`/`MAP` — coordinate here before either of us starts it.
- **Thank you for `88b1bb1`:** prompt convergence done and L-021 closed with a real gate. That's the loop working.

## 0a. `D-041` real-browser smoke test (uses your `agent-browser` install — thank you)

- `bash scripts/browser-smoke.sh` → **11/11 PASS in real Chrome**: zero page errors, Enter starts, starter bag, basic doge,
  K skill spends MP, and 3-player multiplayer in both directions. Screenshots: `tests/out/smoke-camp.png`,
  `tests/out/smoke-multiplayer.png` (gitignored). **Please run it after your D-038 gameplay changes** — the fake-canvas sim
  can't catch real-browser render errors. It uses its own browser session, so it won't hijack yours.
- Heads-up for D-038 balance work (L-024): the hero spawns directly north of the campfire (a SOLID tile), so "walk down"
  from spawn is blocked by design. Don't mistake that for a movement bug.

## 0b. `D-040` multiplayer option (read before touching `update`/`drawWorld`)

- **Shipped:** opt-in ghost multiplayer. `?mp=ws(s)://host&room=heist&name=YOU` → up to 8 players per room see each other's
  doge (class sprite, facing, walk, HP, name). **Off by default — zero network without `?mp`.** Host: `node server/relay.mjs`
  (zero deps; serves the game + relay on :8787). Proof: `tests/relay.mjs` 9/9 with REAL WebSocket clients (3 players), sim 5/5.
- **Two one-line hooks live in YOUR lane's functions — please keep them when you edit there:**
  - `update()`: `netTick(dt);` right after `updMarket(dt);` (before the UI early-return, so players stay visible in menus).
  - `drawWorld()`: `netDraw(list,ox,oy);` right before `list.sort(...)` (ghosts join the y-sort).
  I did **not** touch `drawHUD` (your D-038 HUD work is safe).
- **Names:** `net*` / `NET_*` on purpose — `mp` means **mana** in 48 places. Please don't reintroduce `mp` for multiplayer.
- **`tests/check.sh` is now 6 stages:** stage 1 allows `WebSocket` **only** inside the `MULTIPLAYER` section (like wallet calls
  only in CHAIN); stage 6 runs the real relay test. Don't move `WebSocket` elsewhere and don't "fix" the rule away.
- **Found in your tooling (L-021):** `audit-scan.mjs` doesn't actually scan forbidden APIs although its docs/handoff say it does.
  Either add that scan (scope `WebSocket` to MULTIPLAYER exactly like `check.sh`) or fix the description. Your call — your lane.
- **For your MASTER_PROMPT merge (§6):** add §G rows for **D-039** and **D-040**, plus one paragraph pointing to
  `prompts/TRYNOAH_RECREATE.md` §5b for the multiplayer option/protocol (don't restate it — one source of truth).
- **Not built (user's cost/deadline call):** shared enemies/loot/server combat. Next step if the user wants a real MMO:
  Colyseus (MIT, self-hostable) — documented in the runbook, coordinate here before starting.

---

## 1. What I did, and WHY

### D-037 — Reproducibility & release (`a599b97`)
The user's goal shifted from building features to **shipping and reproducing** the project in TryNoah AI. The core risk I found:
**a hand-written recreation prompt silently goes stale.** Change one contract address and `MASTER_PROMPT.md` would keep
telling Noah the old one, and nobody would notice. "Nothing is missing" was an unverifiable claim. So:

| Added | What it does | Why |
|---|---|---|
| `scripts/trynoah-manifest.mjs` | Derives the full inventory **from source**: 17 sections, `CONTRACTS` (both chains), 30 `SEL`, every external/public Solidity fn, class stats, items/mintables/recipes, NPCs, enemies, constants, 21 real on-chain actions, all sim scenarios. `--out` writes it, **`--verify`** is a drift guard. | Facts that are *generated* can't drift; facts that are *written* always do. |
| `tests/check.sh` **stage 5** | Runs `--verify` on every check. | A stale Noah prompt now **fails the build** instead of shipping wrong addresses. |
| `docs/RECREATION_MANIFEST.md` | The generated completeness contract. | **Never hand-edit.** Re-run `--out` after changing any registry/stat. |
| `prompts/TRYNOAH_RECREATE.md` | Deploy runbook: **Path A = exact replica** (hand Noah the real source) vs **Path B = blueprint rebuild** (your spec prompt). Static-host steps + browser acceptance test + live-chain proof. | No prose prompt can clone 1,273 lines of hand-tuned canvas code byte-for-byte. The user wants it *exact*, so the honest method is Path A; your MASTER_PROMPT powers Path B. |
| `AGENTS.md` §1b | 10-rule Dual-Brain Protocol. | Real collisions happened (§4). |
| `docs/LESSONS.md` | Shared error→rule ledger, **L-001..L-018**, + 11 Final Conclusions. | User rule: *"every error you see add it as a note … learn from that … from both sides."* |
| `scripts/publish-github.sh` | One-command GitHub publish behind a hard secret gate + the test suite. | Repo creation needs a token neither of us has; the step is reduced to one command for the user. |

### D-039 — Dead code + live on-chain proof (this cycle)
- **Removed** `SWORD_COST`, `ARMOR_COST` (leftovers of the Phase-1 DOGE shop that your forge `RECIPES` replaced — they would
  mislead a Noah rebuild into recreating a shop that doesn't exist) and `TS=16` (tiles use literal 16). Proven dead first;
  every reader updated (`CLAUDE.md`, manifest script, regenerated manifest).
- **Added `scripts/e2e-chikyu.sh`:** the sim drives a **mock** wallet, so it can't prove the deployed bytecode. This runs the
  real loop: stake → mint 3 RAW FISH → approve → create pool → swap both ways → fee → `flushStakerFees()` → reward → `claim()`
  → `withdraw()` → remove LP → unstake. **17/17 PASS.**

---

## 2. Proof (so you can trust the baseline without re-deriving it)

```
bash tests/check.sh            → ALL CHECKS PASSED (5 stages)
                                  static rules · node --check · ~110 sim checks 0 failed/0 warnings · 45/45 forge · drift guard
bash scripts/e2e-chikyu.sh     → 17 passed, 0 failed   (needs DEPLOY_KEY in env; testnet throwaway only)
node .agents/skills/analyzer-master/scripts/audit-scan.mjs → 1273/1500 lines, selector parity OK, 0 collisions
```
**Fee split, verified on-chain to the wei:** stakers' 0.8% = `0.0001632` (buy) + `0.000158368` (sell) = `0.000321568` =
exactly `stakerFees` = exactly `pendingRewards`. Project 0.2% = `0.000080392`. Ratio **4.000**. The DEX is correct.

Also seen on-chain: `professionOf(deployer) = 2` → your on-chain class oath works (that wallet is ARCHER forever).

---

## 3. What I deliberately did NOT do (and why) — please don't do these unilaterally either

These need **the user's** decision, not ours:

| Pending decision | Facts | Why we must ask |
|---|---|---|
| **Delete `docs/art/` reference images** | ✅ **Done in D-042 (user approved).** The exact look is recorded first in `docs/ART_STYLE.md` (measured palettes, doge face template, coin recipe); originals restorable from git history. | User asked for the exact Dogecoin art style to be preserved — read `docs/ART_STYLE.md` before drawing anything. |
| **Prune skill packs** | ✅ **Done in D-042 (user approved):** removed `rust-best-practices`, `game-design-document`, `caveman-compress`, `megacave`, `ultracave`, `cavecrew`, `migration` from BOTH mirrors + `skills-lock.json`. Repo 4.30 MB → 1.42 MB. | If you relied on one of those, tell the user — reinstalling is one `npx skills add`. |
| **Multiplayer → real MMO** | ✅ The *option* shipped in D-040 (ghosts, self-hosted relay, 3+ players proven). Still the user's call: a shared world (enemies/loot) needs an authoritative server (Colyseus) — the cost the user said to defer. | Don't build it without the user asking; coordinate here first. |

---

## 4. The collision that involved your commit (transparent account) → `L-016`

While I was working, you committed `38afe5a`. Earlier I had copied `MASTER_PROMPT.md` to `/tmp` for a drift-guard negative
test and restored it from that copy — **which silently reverted your 208-line rewrite in my working tree.** My next commit
would have shipped that revert under my name.

**Caught before committing** by `git log -1` (HEAD had moved) + `git diff --numstat` (`+208/-358` on a file I meant to add
2 lines to). Fixed with `git checkout -- MASTER_PROMPT.md CLAUDE_CODE_HANDOFF.md`, then re-applied only my additions
(ledger `+2/-1`, handoff `+32/-0`). **Nothing of yours was lost.**

**New binding rule for both of us (`AGENTS.md` §1b rule 10):** before every commit run `git log --oneline -1` and
`git diff --numstat`; an additive change that shows deletions means you're reverting the other brain — stop. Never restore a
file from a backup made earlier in the session; use `git checkout -- <file>`.

And a symmetric thank-you: your `NOAH_MASTER_PROMPT_PROPOSAL.md` header says you kept it separate *"to avoid any merge or edit
conflicts while Claude finishes its pass"* — that is exactly the protocol working. I read it; I did not touch it.

---

## 5. Lessons you should load before deciding (full list: `docs/LESSONS.md`)

- **L-001** Gate offline fallbacks on `!chainReady() || !addrs().x` — never on "contract not deployed".
- **L-002** Changing a serialized shape (`CONTRACTS`, `SEL`, deployment JSON) → grep every parser in the same commit.
- **L-008** No state changes in `render()` (you found this one — G-5).
- **L-009** Derive thresholds from the geometry they protect (you found this one — G-4).
- **L-013/L-014** One source of truth, generated not written; never imply a prose prompt is byte-exact.
- **L-016/L-017** Pre-commit collision check; a "file modified on disk" warning is a cue to check, not a verdict.
- **L-018** Mocks prove logic, only the live chain proves deployment → run `e2e-chikyu.sh` after contract/CHAIN changes.

When **you** hit an error, append `L-019+` with root cause → RULE → what enforces it. Claim the number with
`grep -oE 'L-0[0-9]+' docs/LESSONS.md | sort -u | tail -1`.

---

## 6. Converging the three TryNoah prompt artifacts (please do this first)

We now have three files that all talk to Noah. Three competing prompts = guaranteed drift (L-013). Suggested split:

| File | Role | Owner |
|---|---|---|
| `MASTER_PROMPT.md` | **The** spec prompt (Path B rebuild) + §G ledger. Single source for "what to build". | **You** (green light — I'm done with it) |
| `prompts/TRYNOAH_RECREATE.md` | The runbook: Path A exact deploy, hosting, acceptance tests, live-chain proof, publish. Points at MASTER_PROMPT for the spec; never restates addresses. | Claude Code |
| `prompts/NOAH_MASTER_PROMPT_PROPOSAL.md` | Your audit + candidate. **Merge its improvements into `MASTER_PROMPT.md`, keep the Part-1 audit findings as a short note in `docs/DECISIONS.md`, then delete this file.** | You |

When merging, keep these in `MASTER_PROMPT.md` §G (your proposal's ledger stops at `D-036`):
- my `D-037` row (already there), and add a `D-039` row: *dead `SWORD_COST/ARMOR_COST/TS` removed; `scripts/e2e-chikyu.sh` live
  proof 17/17*.
- Do **not** mention `SWORD_COST` / `ARMOR_COST` / `TS` anywhere — they no longer exist.

Then run `node scripts/trynoah-manifest.mjs --verify` — it must say OK for `MASTER_PROMPT.md`.

---

## 7. Suggested path for you — `D-038` (gameplay lane), in priority order

The user's priority list right now: *contracts, DEX, wallet balance, item minting, character gameplay, bag items, everything
fitting DogeOS, remove dead weight, keep the test→fix→improve-Noah-prompt loop running.* I took contracts/DEX/minting proof.
These are yours and are high-leverage:

1. **Class gameplay feel & balance (biggest player-visible win).** Use `balance-check`. Measure time-to-kill per enemy type
   for basic doge vs WARRIOR / ARCHER / HEALER, and MP economy per minute (MEND/GROUND POUND/VOLLEY costs vs camp-only MP
   refill). The user stated: *basic doge = weak attack; monsters are always strong; professions make you stronger.* Assert it:
   add sim checks that each profession beats the basic doge's TTK on the same enemy.
2. **Bag items ↔ chain clarity.** The bag shows WOOD/STONE + materials; minted items live in the wallet. Make the boundary
   obvious in `invMenu` (e.g., an "ON-CHAIN ITEMS (N)" row mirroring the Pool DEX's `WALLET ITEMS`), so players understand
   "bag = off-chain, at risk on death; wallet NFTs = on-chain, safe". Pure UI — no contract change.
3. **DOGEON Pool DEX row feedback.** Show price impact and LP share per pool row (the data is already in `chainData.pools`:
   `doge`, `n`, `shares`, `mine`, `buy`, `sell`). Keep labels ≤ 50 chars.
4. **HUD skill-cost indicator** (class + `K/Q` MP cost), so the class choice is visible in play.

For every change: sim assertion first, `bash tests/check.sh` (5 stages), then `node scripts/trynoah-manifest.mjs --out
docs/RECREATION_MANIFEST.md` so Noah's manifest stays in sync, then update `MASTER_PROMPT.md` (the "improve the Noah prompt
after each fix" loop the user asked for).

**Avoid without coordinating via this file:** `contracts/**`, the `CHAIN` section of `index.html`, `scripts/**`,
`prompts/TRYNOAH_RECREATE.md`, and anything multiplayer — those are in my lane right now.

---

## 8. How to use the new tools (teach-yourself in 2 minutes)

```bash
# 1. Is any recreation prompt stale? (also runs inside tests/check.sh as stage 5)
node scripts/trynoah-manifest.mjs --verify

# 2. Regenerate the Noah completeness manifest after you change CLASSES / MINTABLE / RECIPES / NPCs / constants
node scripts/trynoah-manifest.mjs --out docs/RECREATION_MANIFEST.md

# 3. Prove the DEPLOYED contracts still work (after any contract / CHAIN change or redeploy)
DEPLOY_KEY=<testnet throwaway key> bash scripts/e2e-chikyu.sh        # never commit or print the key

# 4. Publish to GitHub (only when the user provides a token)
bash scripts/publish-github.sh <user>/<repo>     # refuses to push if a secret is tracked; runs the suite first

# 5. Before EVERY commit (L-016)
git log --oneline -1 && git diff --numstat       # HEAD moved? an additive edit showing deletions? → stop
```

---

## 9. Roadmap to the deadline (both brains)

| # | Item | Lane | Status |
|---|---|---|---|
| 1 | Release tooling: manifest, drift guard, runbook, protocol, lessons, publish script | Claude | ✅ D-037 |
| 2 | Dead code (game) + live on-chain E2E of the full DeFi loop | Claude | ✅ D-039 |
| 3 | Converge the 3 Noah prompt files into MASTER_PROMPT + runbook | **Antigravity** | ⏳ §6 |
| 4 | Class balance, bag↔wallet clarity, DOGEON Pool DEX feedback, HUD skill cost | **Antigravity** | ⏳ D-038 |
| 5 | Multiplayer: research open-source options + an opt-in "host a server" option | Claude | ✅ D-040 |
| 5b | Real-browser smoke (Chrome via your `agent-browser`): play + 3-player multiplayer, 11/11 | Claude | ✅ D-041 |
| 6 | Project weight (art + skill packs) | **User decides** | ❓ §3 |
| 7 | GitHub repo | User (token) | 🔑 one command ready |
| 8 | TryNoah deploy (Path A) + browser acceptance test | User / either | after 3–7 |

---

## 10. Ready-to-paste job prompt for Antigravity

```markdown
You are the gameplay-lane engineer on DOGEON (@index.html). Claude Code owns contracts/CHAIN/release/multiplayer right now.

STEP 1 — Sync (RULE #0):
- Read @ANTIGRAVITY_HANDOFF.md (this file), @AGENTS.md §1b (Dual-Brain Protocol), and @docs/LESSONS.md "Final Conclusions".
- `git status --short && git log --oneline -3` — if the tree has edits you didn't make, do NOT touch those files.
- `node .agents/skills/analyzer-master/scripts/audit-scan.mjs && bash tests/check.sh` must be green (5 stages).

STEP 2 — Converge the Noah prompts (handoff §6):
- Merge @prompts/NOAH_MASTER_PROMPT_PROPOSAL.md improvements into @MASTER_PROMPT.md; keep the D-037 §G row, add D-039;
  never mention SWORD_COST/ARMOR_COST/TS; delete the proposal file; `node scripts/trynoah-manifest.mjs --verify` must be OK.
- Commit that alone (one logical change).

STEP 3 — D-038 gameplay polish (handoff §7), in this order:
1. Class balance with `balance-check`: sim assertions that each profession beats the basic doge's time-to-kill; MP economy.
2. Bag vs wallet clarity in `invMenu` ("ON-CHAIN ITEMS (N)" row). 3. DOGEON Pool DEX price-impact + LP-share per row.
4. HUD class + K/Q MP cost.
For each: failing sim assertion first → fix → `bash tests/check.sh` → `node scripts/trynoah-manifest.mjs --out
docs/RECREATION_MANIFEST.md` → update @MASTER_PROMPT.md → log D-038 in @docs/DECISIONS.md → commit.

RULES: claim D-NNN before coding; pre-commit `git log -1 && git diff --numstat`; append any error you hit to
@docs/LESSONS.md as L-019+; leave a clean tree and update @CLAUDE_CODE_HANDOFF.md "CURRENT SNAPSHOT" with your next suggestion.
Do NOT touch contracts/**, the CHAIN or MULTIPLAYER sections, server/**, scripts/**, prompts/TRYNOAH_RECREATE.md without
coordinating here. KEEP the one-line hooks `netTick(dt);` in update() and `netDraw(list,ox,oy);` in drawWorld() when you edit those.
The suite is 6 stages now (stage 6 = real multiplayer relay); all must pass.
```
