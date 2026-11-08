# DOGEON — Dual-Brain Lessons Ledger (shared error → rule memory)

> **Purpose (user rule):** *"every error you see add it as a note for dual decisions and learn from that to be able to
> make better decisions from both sides and get to a final conclusion, also save the context of the changes and the why."*
>
> Both brains (**Antigravity CLI** and **Claude Code**) append here. An error is only "closed" when it has become a
> **rule enforced by something automatic** (a test, a script, a skill line) — not just a note. Read §Final Conclusions
> before any decision; read the matching entries before touching that area.
>
> **Format:** `L-NNN · date · brain · area` → *What happened* / *Root cause* / **RULE** / *Enforced by*.
> Never delete an entry; supersede it with a newer one and link both.

---

## A. Web3 / on-chain integration

### L-001 · 2026-11-08 · Claude Code · offline fallback gated on the wrong condition
- **What happened:** After the profession contract was deployed, `CONTRACTS['0x5fdaf3'].prof` stopped being empty.
  `chooseProfession()` gated the free LOCAL class pick on `if(!addrs().prof)`, so the moment the contract went live,
  **offline players could no longer pick a class at all** — it fell through to the wallet path and silently did nothing.
- **Root cause:** The offline branch was keyed to *"the contract does not exist"* instead of *"the player has no wallet"*.
  Those are the same thing only before the first deploy, so the bug was invisible until deployment.
- **RULE:** Gate every offline fallback on **`!chainReady() || !addrs().x`** — never on a contract address being absent.
  Whenever a `CONTRACTS[]` entry changes from empty to real, **re-run the offline paths**.
- **Enforced by:** `tests/sim.mjs` profession scenario runs against the *live* addresses (it caught this); `dogeon-game`
  skill v2.2 "Web3 lesson"; `docs/DECISIONS.md` D-032.

### L-002 · 2026-11-08 · Claude Code · serialized-shape change broke every parser of it
- **What happened:** `contracts/apply-deployment.mjs` silently stopped matching `CONTRACTS` twice — first when `prof`
  was added to the object, then again when `stake` was added — because its regex pinned the exact key list.
- **Root cause:** A shape was duplicated in a regex far from its definition; nothing linked the two.
- **RULE:** When you change a serialized/parsed shape (`CONTRACTS`, `SEL`, deployment JSON, packed `id<<16|type<<8|level`),
  **grep for every reader/parser of it in the same commit** (`apply-deployment.mjs`, `tests/sim.mjs`, `scripts/*.mjs`).
- **Enforced by:** `scripts/trynoah-manifest.mjs --verify` (stage 5 of `tests/check.sh`) now fails if any consumer drifts.

### L-003 · 2026-11-08 · Antigravity · live state not reloaded on chain switch (G-1)
- **What happened:** Switching the wallet away from Chikyū and back left NFTs, pools, profession, staking and the oracle
  blank, because `resetChainData()` cleared state and nothing re-fetched it.
- **Root cause:** The `chainChanged` handler treated "back on the right chain" as a no-op instead of a reload trigger.
- **RULE:** Every `accountsChanged` / `chainChanged` path must end in a **refresh** (`refreshChain()` + `refreshOracle()`),
  not just a reset. Account/chain switch is a first-class state transition, not an edge case.
- **Enforced by:** `tests/sim.mjs` "chainChanged reload" + "account switch" scenarios.

### L-004 · 2026-11-08 · Antigravity · stale user-facing copy after going live (G-2)
- **What happened:** The Sphinx intro and the `STAKE` lesson still said *"This is a SIMULATED DEX. No real transactions."*
  long after real contracts were deployed — actively lying to the player.
- **Root cause:** Docs/UI copy was not part of the deploy checklist.
- **RULE:** A deploy is not finished until **player-visible copy** matches reality. Treat UI strings as deliverables.
- **Enforced by:** `tests/sim.mjs` "sphinx dialog" asserts the copy describes both the off-chain vault and live contracts.

---

## B. Solidity / DeFi math

### L-005 · 2026-11-08 · Claude Code · reward accounting ordered wrong (first staker got nothing)
- **What happened:** `DogeStaking.stake()` folded orphaned `residual` rewards into `accRewardPerShare` **after** setting
  the new staker's `rewardDebt`, so their debt absorbed the very rewards they were owed → `pendingRewards == 0`.
- **Root cause:** In accumulator (MasterChef) math, *order is the logic*. "Update debt" and "distribute" are not commutative.
- **RULE:** In any accumulator, set `rewardDebt` **before** increasing `accRewardPerShare`, and always write a test for
  the *first* and *last* participant (the boundary cases where accumulators break).
- **Enforced by:** `contracts/test/DogeStaking.t.sol::test_RewardWithNoStakersBecomesResidualThenPaid`.

### L-006 · 2026-11-08 · Claude Code · fee added without protecting the audited invariant
- **Context/why:** A 1% protocol fee (0.2% treasury / 0.8% stakers) had to be added to an **already-audited, already-deployed** DEX.
- **Decision that worked:** Skim the fee **outside** the pool reserves — `p.doge` still moves by exactly the old pool
  price/payout — so the constant-product curve, `k`-invariant and solvency proofs from the D-022 audit stayed valid
  byte-for-byte. Only the public quotes changed.
- **RULE:** When adding economics to audited code, find the formulation that leaves the **proven invariant untouched**;
  re-run the invariant fuzz test as the acceptance gate. Rejected alternative: taking the fee from reserves (would have
  changed `k` and voided the audit).
- **Enforced by:** `testFuzz_PoolInvariant` (k never drops, DEX stays solvent) + `test_ProtocolFeeSplitsAndFlushesToStakers`.

### L-007 · 2026-11-08 · Claude Code · Foundry cheatcode consumed by an argument call
- **What happened:** `prof.choose{value:FEE}(prof.ARCHER())` — the `prof.ARCHER()` **argument** is itself an external
  call, so it consumed the preceding `vm.prank` / `vm.expectRevert`, and `choose` ran as the test contract. 5 tests
  failed for a reason that had nothing to do with the contract.
- **RULE:** Never put an external call in the **arguments** of a call that a cheatcode targets. Use plain literals
  (`1`/`2`/`3`) and assert the constants separately.
- **Enforced by:** `contracts/test/DogeProfession.t.sol` comment + literal class ids.

---

## C. Game engine / determinism

### L-008 · 2026-11-08 · Antigravity · frame-rate-dependent simulation (G-5 / I-5)
- **What happened:** Title-screen particles were updated inside `render()` with a hardcoded `1/60`, so they ran denser
  and faster on 120/144 Hz displays.
- **RULE:** **Nothing that changes state may live in `render()`.** All state advances in `update(dt)` with the real `dt`.
- **Enforced by:** `tests/sim.mjs` "title particles dt".

### L-009 · 2026-11-08 · Antigravity · magic number smaller than the geometry it guarded (G-4 / I-4)
- **What happened:** Enemies had to spawn ≥ `170` px from the player, but the screen half-diagonal is `195.2` px — so
  cats visibly popped into existence at screen corners.
- **RULE:** A distance/threshold constant must be **derived from the geometry it protects** and asserted against it,
  not guessed. (Now `≥ 200` px > `195.2` px.)
- **Enforced by:** `tests/sim.mjs` "spawn distance" (60 spawns, min measured 217.6 px).

### L-010 · 2026-11-08 · Antigravity · unbounded aggro on summoned entities (G-3 / I-3)
- **What happened:** Boss-summoned cats (`zone:'boss'`) chased the player across the entire map forever and were never culled.
- **RULE:** Every spawned entity needs an explicit **leash** (range or zone) and a cull condition at creation time.
- **Enforced by:** `tests/sim.mjs` "boss minion aggro".

---

## D. Tooling, process & the two-brain workflow

### L-011 · 2026-11-08 · Claude Code → both · uncommitted work is unowned work
- **What happened:** Claude Code's session died with edits to `index.html` **uncommitted**. Antigravity then committed
  the whole working tree, sweeping those edits into *his* commit (`61a34aa`). They happened to be compatible — pure luck.
- **RULE:** **Always hand off a clean tree.** Commit before stopping. If `git status` is dirty and you did not make those
  edits, the other brain is mid-flight: **do not touch those files**, and never `checkout`/`stash`/revert them.
- **Enforced by:** `AGENTS.md` §1b rules 1–2 (Dual-Brain Protocol).

### L-012 · 2026-11-08 · both · duplicate decision numbers are a real collision
- **What happened:** Claude Code drafted a `D-033` (dead-code removal) while Antigravity independently used `D-033`/`D-034`
  for the Analyzer gate. Only the crash avoided a clash.
- **RULE:** **Claim the number first.** `grep -oE 'D-0[0-9]+' docs/DECISIONS.md | sort -u | tail -1`, write the `### D-NNN`
  heading, *then* code.
- **Enforced by:** `AGENTS.md` §1b rule 3.

### L-013 · 2026-11-08 · Claude Code · a verifier must encode intent per file, not a blanket rule
- **What happened:** The new drift guard required *every* recreation prompt to quote all addresses/selectors. But
  `prompts/TRYNOAH_RECREATE.md` deliberately **delegates** to §A + the manifest, so the guard failed a file that was correct.
- **Root cause:** I encoded "all files must contain the facts" instead of "files that *claim* to carry the registry must".
- **RULE:** A checker's scope must match each file's **declared role**. And prefer **one source of truth**: restating
  addresses in a second doc is the very drift the guard exists to prevent.
- **Enforced by:** `scripts/trynoah-manifest.mjs` target list + the comment explaining the exclusion.

### L-014 · 2026-11-08 · Claude Code · prose cannot clone code (the TryNoah honesty rule)
- **What happened:** The goal "recreate the project exactly, without missing a single feature" was being pursued purely
  through a prose blueprint. No prompt can reproduce 1,274 lines of hand-tuned canvas code byte-for-byte.
- **RULE:** Separate **EXACT replica** (hand over the real source / raw URL — the only byte-exact method) from
  **BLUEPRINT rebuild** (spec prompt, functionally similar). State which one you are doing. Back any "nothing missed"
  claim with a **generated** manifest, never a hand-written list.
- **Enforced by:** `prompts/TRYNOAH_RECREATE.md` §0 (Path A vs Path B) + `docs/RECREATION_MANIFEST.md` (generated) +
  `--verify` in `tests/check.sh` stage 5.

### L-015 · 2026-11-08 · Claude Code · environment hazards on Windows / sandbox
- **What happened (several):** `curl … | bash` was blocked by the permission classifier (piping a remote script to a
  shell); `grep -c` returning `0` exits non-zero and silently broke an `&&` chain; `wc` hit a cygwin fork error; the
  headless sim exceeded the 120 s foreground limit; the VS Code extension host hard-crashed (`0xC0000409`) under memory pressure.
- **RULE:** Fetch **verifiable artifacts** (release zip) instead of piping remote scripts; append `|| true` to counting
  greps used in chains; run long suites with `run_in_background` instead of chaining sleeps; **commit after every green
  step** so a crash costs at most one step.
- **Enforced by:** habit + `AGENTS.md` §1b rule 2; `docs/DECISIONS.md` D-025 (Foundry install note).

### L-016 · 2026-11-08 · Claude Code · a stale session backup silently reverted the other brain's commit
- **What happened:** To negative-test the drift guard, Claude Code copied `MASTER_PROMPT.md` to `/tmp/mp.bak`, tampered
  the original, then restored it from the backup. **Meanwhile Antigravity committed `38afe5a`**, a 208-line rewrite of that
  same file. The restore wrote the *pre-rewrite* content back to disk, so the working tree now **reverted his commit** —
  and the next `git commit` would have shipped that revert under Claude Code's name.
- **How it was caught:** before committing, `git log --oneline -1` showed an unexpected HEAD (`38afe5a`), and
  `git diff --numstat` showed `MASTER_PROMPT.md +208/-358` where only `+2` was intended. A purely additive change must
  never show large deletions.
- **Fix:** `git checkout -- MASTER_PROMPT.md CLAUDE_CODE_HANDOFF.md` (restore the **true current** state from HEAD, not
  the stale backup), then re-applied only the intended additions: ledger `+2/-1`, handoff `+32/-0`. Both his files intact.
- **RULE:** (1) **Never restore a file from a backup taken earlier in the session** — another agent may have committed in
  between. Restore with `git checkout -- <file>` / `git stash`, which reflect HEAD. (2) **Before every commit**, run
  `git log --oneline -1` (did HEAD move under you?) and `git diff --numstat` (does every file's +/- match your intent?).
  An additive edit that shows deletions is a red flag — stop and inspect.
- **Enforced by:** `AGENTS.md` §1b rule 10 (pre-commit diff check); this entry.

### L-017 · 2026-11-08 · Claude Code · "file modified on disk" is a question, not an answer
- **What happened:** Twice in D-039 the edit tool warned that `index.html` / `CLAUDE.md` had "been modified on disk since you
  last read it". That could mean the other brain is editing live (stop!) **or** merely that it *committed* changes since this
  brain's last read in an earlier session (harmless). Guessing either way is wrong: guessing "harmless" risks a collision,
  guessing "collision" stalls work.
- **How it was resolved:** `git log --oneline -1` (HEAD unchanged at `a599b97`) + `git diff --numstat` (exactly the 2 lines I
  wrote) proved it was the old committed changes. No live edit.
- **RULE:** Treat the warning as a **trigger to run the collision check**, then decide on evidence: HEAD moved or the numstat
  contains lines you didn't write → the other brain is active (stop, read, report); otherwise proceed.
- **Enforced by:** `AGENTS.md` §1b rule 10.

### L-018 · 2026-11-08 · Claude Code · a green mock suite is not proof the deployed contracts work
- **What happened:** ~110 sim checks were green, but they drive a **mock** wallet. On the real chain the DEX had **zero pools**
  and the wallet **zero items** — the mint → LP → swap → fee → reward loop had never actually run on DogeOS.
- **Fix:** `scripts/e2e-chikyu.sh` runs the full loop against the deployed contracts: 17/17 PASS, fee split verified to the wei.
- **RULE:** Keep **two** proofs: the fast deterministic sim (logic, every commit) **and** a live on-chain E2E (deployed bytecode,
  after any contract/CHAIN change or redeploy). A mock can't catch a wrong selector, a fee-order bug or a bad deploy.
- **Enforced by:** `scripts/e2e-chikyu.sh` (run it after every redeploy and before a release / TryNoah handoff).

### L-019 · 2026-11-08 · Claude Code · a "missed" negative test can be the test's bug
- **What happened:** To prove the new rule "`WebSocket` only inside MULTIPLAYER", I planted a leak *before* the `UPDATE`
  marker. The rule "missed" it — because that line sits at the tail of the MULTIPLAYER section, where it is allowed. The rule
  was right; the test was wrong. "Fixing" the rule would have broken it.
- **RULE:** When a negative test passes unexpectedly, **print where the fault landed** (e.g. `grep -n -B1`) before touching
  the rule. Plant faults in at least two different places (I re-ran with leaks inside UPDATE and inside CORE: both caught).
- **Enforced by:** this entry + the D-040 negative tests recorded in `docs/DECISIONS.md`.

### L-020 · 2026-11-08 · Claude Code · "differs from HEAD" ≠ "my test touched it"; Git Bash /tmp ≠ Windows /tmp
- **What happened:** After running negative tests on a copy, `git diff --quiet index.html` said the real file "changed" — a
  false alarm, because it legitimately held my uncommitted feature. Separately, native Windows `node` could not open
  `/tmp/neg.html` (Git Bash maps `/tmp` elsewhere; node looked for `C:\tmp`).
- **RULE:** To prove a test didn't contaminate a file, grep for the **specific fault marker**, not for "any diff". For files
  shared between Git Bash and native tools, use the session scratchpad path (or `cygpath -w`), never `/tmp`.
- **Enforced by:** this entry.

### L-021 · 2026-11-08 · Claude Code (found in Antigravity's tooling) · a documented check that does not exist
- **What happened:** The D-034 handoff says `audit-scan.mjs` checks forbidden APIs (`fetch`, `WebSocket`, …). Its code does
  not — it checks line budget, selector parity, collisions and sim coverage. The only real enforcement is `tests/check.sh`
  stage 1. Anyone trusting the description would have assumed double coverage.
- **RULE:** Before relying on a check, **read its code or make it fail once.** A doc claim is not a guard.
- **Action for Antigravity:** either add the forbidden-API scan to `audit-scan.mjs` (scoping `WebSocket` to MULTIPLAYER the
  way `check.sh` does) or correct the description in `CLAUDE_CODE_HANDOFF.md` / the `analyzer-master` skill.

### L-022 · 2026-11-08 · Claude Code · name collisions by MEANING, not just by syntax
- **What happened:** The multiplayer state was first named `mp` / `MP_*` / `mpTick`. It compiled fine — but `mp` already
  means **mana** in 48 places (`P.mp`, `SKILL_MP`, `noMp`, `maxMp`). A reader, Antigravity or a TryNoah rebuild could easily
  conflate "multiplayer" with "mana points".
- **RULE:** When naming, grep for **semantic** collisions (same abbreviation, different meaning), not only identifier
  clashes. Pick a free namespace — here `net*` / `NET_*` (the URL param stays `?mp=` because it is user-facing and unambiguous).
- **Enforced by:** `CLAUDE.md` code map + `AGENTS.md` §1 note ("`mp` means mana").

### L-023 · 2026-11-08 · Claude Code · new features must not shift a seeded RNG
- **What happened (avoided by design):** the sim seeds `Math.random`; many checks depend on exact seeded outcomes
  ("29 enemies at 648,600", "ninjas 37%", "min 217.6 px"). Generating the multiplayer id at load would have consumed one
  random number in *every* game and shifted all of them.
- **RULE:** A feature that needs randomness must draw it **lazily, only when the feature is enabled**. Then spot-check that
  seeded values are byte-identical before and after (they were).
- **Enforced by:** the lazy `net.id` in `netConnect()`; the D-040 determinism spot-check.

### L-024 · 2026-11-08 · Claude Code · an "obvious bug" that a screenshot disproved
- **What happened:** In the first real-Chrome run, holding `S` for 1.5 s moved the hero only 3 px. It looked like a broken
  input or a stalled `requestAnimationFrame` in headless Chrome. The screenshot showed the hero standing on top of the
  campfire: spawn is tile (40,37) and the fire is a SOLID tile at (40,38), directly south. Correct collision, not a bug.
- **RULE:** Before reporting a gameplay "bug" from numbers alone, **look at the frame** (screenshot / `tests/sprites.mjs`) and
  check the map tile in the direction of travel. Many "movement bugs" are level geometry.
- **Corollary (multiplayer testing):** Chrome pauses `requestAnimationFrame` in **background tabs**, and the game only
  broadcasts from its rAF loop — so two tabs in one browser is a bad multiplayer test. Use one real browser player plus
  scripted WebSocket players (what `scripts/browser-smoke.sh` does).
- **Enforced by:** `scripts/browser-smoke.sh` (saves `tests/out/smoke-*.png` every run).

---

## Final Conclusions (the distilled decision rules for BOTH brains)

1. **An invariant is only real if a machine checks it.** Every lesson above ends in a test, a script stage, or a skill
   line. A note nobody runs is a note nobody keeps. (L-001…L-010)
2. **Deployment changes behaviour, not just addresses.** The moment something goes live, re-walk the offline path, the
   account/chain-switch path, and the player-visible copy. (L-001, L-003, L-004)
3. **Order is logic in accounting code.** For accumulators and fees, test the first participant, the last participant,
   and the empty state. (L-005)
4. **Protect proven invariants when extending audited code** — choose the formulation that leaves `k`/solvency untouched
   and let the fuzz test be the gate. (L-006)
5. **Derive constants from the geometry/economics they guard; never guess a magic number.** (L-009)
6. **State changes only in `update(dt)`; `render()` is pure.** (L-008)
7. **One source of truth, generated not written.** Duplicated facts drift; generated facts cannot. (L-002, L-013, L-014)
8. **Clean tree in, clean tree out; claim your `D-NNN` before coding.** A dirty tree means the other brain is working —
   read, don't write. And before every commit, check `git log -1` + `git diff --numstat`: if HEAD moved or an additive
   edit shows deletions, you are about to revert someone. Restore from `git`, never from a stale backup. (L-011, L-012, L-016)
9. **Say which mode you are in: exact replica or rebuild.** Never imply byte-exactness from a prose spec. (L-014)
10. **Prove the bug before fixing it, and fix the class, not the instance** — then encode the class as a rule here.
11. **Mocks prove logic; only the live chain proves deployment.** Run `scripts/e2e-chikyu.sh` after any contract or CHAIN change.
    A tool warning about changed files is a cue to run the collision check, not a verdict. (L-017, L-018)
12. **Verify the verifier.** A negative test that "passes" may have planted the fault in the wrong place; a documented
    check may not exist; "differs from HEAD" may be your own legit work. Make each check fail once on purpose. (L-019..L-021)
13. **Names carry meaning; randomness carries state.** Grep new names for semantic clashes (`mp` = mana) and keep new
    features off the seeded RNG unless enabled. (L-022, L-023)
