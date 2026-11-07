# DOGEON — Session Prompt (living document)

Version: 1.2 · 2026-11-07 · Changelog at the bottom. **Improve this file whenever a session teaches us something.**

> ## RULE #1 — Feature closeout (user rule, never skip)
> Every finished feature, before starting the next one:
> 1. **Tests green** (`bash tests/check.sh`), quote the result line.
> 2. **`docs/DECISIONS.md` entry** with: the feature, the change, the reference (user request / brief goal / image / source URL),
>    the **files** touched, and the **code** (function names, constants, line ranges).
> 3. **Improve this prompt + the `dogeon-game` skill** (bump version, changelog line) with anything the feature taught.
> 4. Update `CLAUDE.md` (code map + rules) and `CONTEXT.md` if architecture or rules changed.
> 5. **Commit** (Conventional Commit) with a body listing files + what changed. One feature = one commit.

Paste block A at the start of a fresh Claude Code session, then add a task block from B.

---

## A. Session opener (paste every time)
```
Project: DOGEON (single-file 16-bit action RPG, index.html). You are the lead engineer.
Before anything else:
1. Load the `dogeon-game` skill and read @CLAUDE.md and the last 5 entries of @docs/DECISIONS.md.
2. Restate my task in 2-3 lines with acceptance criteria. If something is ambiguous, ask (max 3 questions) BEFORE planning.
3. Plan mode if more than one code section is touched. Wait for my OK.

Rules:
- Surgical diffs only. No reformatting, no renaming untouched code, no new dependencies in the game.
- Verify before claiming: run `bash tests/check.sh`, quote the result line, and give me the manual browser test steps.
  If you are not sure a bug exists, prove it (test, console, or node one-liner) before reporting it.
- If the change fixes a WARN in tests/sim.mjs, promote it to fail(). If it adds a rule, add a test.
- Log the decision in docs/DECISIONS.md (what / why / tool / alternatives), then commit (Conventional Commits).
- End with: files changed + one-line summary each, how I test it, commit hash, and one suggestion to improve
  this prompt or the dogeon-game skill (apply it if it's clearly good, and log it under Process).
```

## B. Task blocks
**Feature**
```
Feature: <one sentence>. Player should feel: <...>.
Acceptance: <observable 1>; <observable 2>; zero console errors; core loop still works; tests pass.
Touch only: <sections>. New numbers go in the balance tables.
```
**Bug**
```
Bug: <what happens>. Repro: <keys / console>. Expected: <...>. Error: <paste>.
Find the root cause (2-3 sentences), write a failing scenario in tests/sim.mjs first, then the smallest fix.
```
**Balance** — use the `balance-check` skill and MASTER_PROMPT C4. Output a table old → new → reason. No edits until I approve.
**Sprite** — use `pixel-art-sprites` adapted to our string templates (MASTER_PROMPT C3). Show it on the title screen at 3×.
**Review** — MASTER_PROMPT C6 + `code-review`. Severity-ranked, fix only critical, then commit.

## C. LLM best practices this prompt encodes (why each rule exists)
1. **One task per session** — long chats drift; memory lives in files (CLAUDE.md, skill, DECISIONS.md), not in the chat.
2. **Restate + acceptance criteria first** — catches misunderstanding before any code exists.
3. **Plan before build** — fixing a plan costs seconds; fixing code costs a session.
4. **Precise pointers** (`@index.html#120-160`, section names) — less context = better and cheaper answers.
5. **Verify, don't trust** — the model must run the tests and quote results. "Should work" isn't done.
6. **Prove bugs before reporting** — LLMs produce confident false positives (see DECISIONS D-005).
7. **Small diffs, one commit per logical change** — easy to review, easy to revert, `git bisect`-friendly.
8. **Tests as memory** — every fixed bug becomes a hard check so a later session can't reintroduce it.
9. **Decisions in writing** — the "why" survives model and session changes; future you can audit it.
10. **The system improves itself** — every session ends with one improvement to the prompt or skill.
11. **Ask for options on taste** — art/feel: request 2-3 variants, pick, iterate.
12. **Stay original** — no ripped assets or logos.

13. **Rename collisions before adding state** — grep a field name before reusing it (`P.inv` was i-frames, not inventory; see D-014).

## Changelog
- 1.2 (2026-11-07) — RULE #1 feature closeout (user). Practice 13: grep before naming new state (from D-014).
- 1.1 (2026-11-07) — Added "prove bugs before reporting" after a false positive in the first review (D-005);
  added test-promotion rule (WARN → FAIL); skill routing.
- 1.0 (2026-11-07) — Distilled from MASTER_PROMPT.md §B–D into a reusable opener.
