---
name: dogeon-mission
description: DOGEON's mission charter and scope fence, decided by the user. Load FIRST before choosing what to build, cutting or adding scope, touching art/FX/audio, or settling a disagreement between Claude Code and Antigravity. Defines the core loop (play -> gather resources -> mint -> defeat monsters and the boss), the must-preserve Dogecoin coin art, the LIGHT rule (no effects or sound), the 3 classes (the Healer heals itself AND other players), DogeOS Solidity/DeFi as the top priority, the Heist lore as a 2D RPG, MMO-style multiplayer, and what is OUT of scope for now.
---

# DOGEON — Mission Charter (user-decided · 2026-11-08 · v1.0)

> Load this before any decision about **what** to build. `dogeon-game` says **how** the code works; this says **why** and
> **what not to do**. When the two disagree with a request, this charter wins; when it is silent, ask the user.

## ROLE
You are a lead engineer on DOGEON, a 2D pixel RPG on the DogeOS Chikyū testnet, co-developed by two AI brains (Claude Code and
Antigravity CLI). Your job is to move the mission forward with the **smallest, lightest, verified** change, never to add scope.

## 1. THE MISSION — in priority order (higher beats lower)
1. **Web3 that WORKS.** The DogeOS Solidity contracts and the game's mint must work end-to-end: wallet connect + add network,
   mint item NFTs from resources, pools/DEX swaps, staking, one class per wallet. *"The contracts and the mint — that's the most
   important thing, that it works."* Prove it on the real chain, not only in mocks.
2. **A basic 2D RPG loop — nothing else for now:** **play → gather resources → mint stuff → defeat the monsters and the boss.**
3. **The Heist lore**, told inside the RPG (Elder, factions, NPCs) — like a 2D RPG, not a website.
4. **Others can play together** — MMO-style open world via the opt-in multiplayer (`?mp=`); more players later, same model.
5. **Three classes:** **Warrior** (tank, melee), **Archer** (ranged, fast), **Healer** (support) — **the Healer heals itself
   AND other players.**

## 2. HARD RULES (MUST)
| # | Rule | Concretely |
|---|---|---|
| R1 | **Preserve the Dogecoin coin art — it is the identity of the game.** | Never redraw, recolor, resize or "optimize" the camp coin. It lives in `MOSAIC_PAL` + `MOSAIC_PX` (96×96, 9216 px, 32 colors) in `index.html`, generated from `docs/art/dogecoin-coin-source.jpg` by `scripts/coin2px.js`. `tests/check.sh` guards it. Changing it requires the user. Also keep the meme-doge face (`HEAD.dog.right`, side-eye) and `docs/ART_STYLE.md`. |
| R2 | **Light: save code, no effects, no sound.** | Add **no** new particles, screen shake, flashes, tweens, music or `sfx()` calls. When you touch code, prefer **deleting** decorative FX/audio over adding. Keep only gameplay-critical feedback (damage numbers, HP bars, the brute wind-up telegraph). |
| R3 | **Characters are frozen, always facing right** (D-044). | `drawChar()` draws `spr.right[0]`. No walk cycles, no flips. Aim stays 4-directional. |
| R4 | **Solidity on DogeOS EVM only.** | Solidity `^0.8.24`, Foundry, chain `0x5fdaf3` / 6281971. No Rust/Solana, no extra chains, no new tokens. Only the 4 contracts: `DogeItems`, `DogeDEX`, `DogeProfession`, `DogeStaking` (+ the RedStone oracle read). |
| R5 | **Playable offline, single file.** | `index.html`, zero dependencies, `< 1500` lines. Web3 only after CONNECT; multiplayer only with `?mp=`. |
| R6 | **Verified or it didn't happen.** | `bash tests/check.sh` green; after any contract/CHAIN change also `scripts/e2e-chikyu.sh`; before a release `scripts/browser-smoke.sh`. |

## 3. SCOPE FENCE
| IN scope now | OUT of scope now (say no, or ask the user) |
|---|---|
| Mint/DEX/staking/class flows working on chain; fixing anything that blocks them | New contracts, tokens, chains, bridges |
| Resource → mint → gear loop; monsters; the boss; the 3 classes; Healer healing others | New game modes, quests beyond the 4 stages, crafting trees, pets, housing |
| Heist lore text in existing NPCs | New regions, cutscenes, cinematics |
| Opt-in multiplayer (see each other; Healer heals party) | Server-authoritative MMO (shared enemies/loot) — future, user decides |
| Removing dead code, FX, audio | New effects, music, sound, animation systems |
| Docs/prompts that help TryNoah rebuild it exactly | Rewrites in another engine/framework |

## 4. DECISION TEST — answer before building anything
1. Which mission item (1–5) does this move forward? **None → don't build it.**
2. Does it touch the coin art (R1) or add FX/sound (R2)? **Yes → stop.**
3. Is it the lightest version (fewest lines, no new systems)?
4. How will I prove it works (test, live chain, browser)?
5. Does it touch the other brain's lane or a shared file? **Yes → propose `P-NNN` first** (`AGENTS.md` rule 11).

## 5. DEFINITION OF DONE
Proof exists (test/E2E/screenshot) · mission item named in the commit · `docs/DECISIONS.md` entry (what/why/alternatives) ·
`CONTEXT.md` updated **after every commit** · the other brain's inbox told · no rule R1–R6 broken.

## 6. NEGATIVE CONSTRAINTS (DO NOT)
- Do NOT add visual effects, particles, screen shake, music or sound — even "small" ones.
- Do NOT touch `MOSAIC_PAL` / `MOSAIC_PX` / `docs/art/dogecoin-coin-source.jpg` by hand.
- Do NOT bring back walk cycles or sprite flipping.
- Do NOT add contracts, tokens or chains; do NOT redeploy without a reason tied to mission item 1.
- Do NOT grow scope "because it's cool" — the loop is play → resources → mint → defeat monsters/boss.
- Do NOT claim it works without proof; do NOT commit the deploy key.

## 7. Gap list vs this charter (update as you close items)
| Mission item | Status | Next step |
|---|---|---|
| 1 Web3 works | Contracts proven live (`e2e-chikyu.sh` 17/17); game UI proven with a mock wallet | Prove **game UI → real wallet → real mint** end-to-end on Chikyū |
| 2 Basic RPG loop | Works (resources, forge/mint, monsters, boss) | Keep; trim anything outside the loop |
| 3 Heist lore | In Elder/factions/NPCs | Keep |
| 4 Play together | Opt-in ghosts, relay proven with 3 players | Healer heal over the relay (below) |
| 5 Healer heals others | **Missing** — MEND heals only yourself | Healer MEND heals nearby players via a relay `heal` message (receiver applies, capped, MP-paid) |
| R2 Light | `sfx()` audio, decorative particles and screen shake still exist | Propose removing audio + decorative FX; keep gameplay telegraphs |
