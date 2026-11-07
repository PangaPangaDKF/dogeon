---
name: dogeon-game
description: Full context for DOGEON ("The Cat Invasion"), the single-file 16-bit Shiba-vs-cats action RPG in index.html. Load before planning, designing, balancing, drawing sprites, fixing bugs or reviewing anything in this repo. Contains the game's pillars, design invariants, architecture map, which skill to use for which job, the decision-log protocol and the self-improvement rule.
---

# DOGEON — game context skill

Version: 2.1 (2026-11-07). Bump the version and add a line to `docs/DECISIONS.md` § Process whenever you edit this file.

**RULE #1 (user):** after every finished feature → tests green → DECISIONS entry (feature, change, reference, files, code) →
improve `prompts/SESSION_PROMPT.md` + this skill → update `CLAUDE.md`/`CONTEXT.md` → commit. Never batch features.

**Current phase:** Phase 4 "The Grand Heist" — `prompts/PHASE4_BRIEF.md` (Heist lore, partner NPCs, Sphinx DeFi hub, RedStone).
Phase 3 "Doge Chain" (`prompts/PHASE3_BRIEF.md`) is complete: survival + real web3 on DogeOS Chikyū.

## 1. The game in one breath
Top-down action RPG, Sega Genesis look (320×224, 16×16 tiles, outlined chunky pixels, blue dialog boxes),
inspired by the *feel* of Crusader of Centy but with 100% original art made in code. You are an original
half-human Shiba Inu with the "doge" look. Half-human cats invaded. Doge-speak humor ("such X, much Y, wow").

**Core loop:** safe camp → fight cats → whiskers drop → back to camp → bank trades whiskers for FUD →
shop upgrades → heal ONLY by resting in camp → push further (field → brutes → ruins → Cat Lord).

## 2. Design pillars (use these to judge every idea)
1. **Hard but fair ("tryhard").** Every death must be readable: telegraphs (brute flashes red 0.55 s), i-frames, knockback.
2. **Camp = sanctuary, outside = risk.** The risk/return trip is the game. Anything that lets you heal or bank outside the camp weakens the core loop. Push back on it.
3. **Greed vs safety.** Carried FUD is at risk (50% lost on death); vault FUD is safe. New systems should feed this tension.
4. **Readable 16-bit.** If it doesn't read at 16×20 px with a dark outline, it doesn't ship.
5. **Zero dependencies.** One HTML file, opens anywhere, no network. Dev tests may use Node.

## 3. Invariants (never break without the user explicitly changing them)
The source of truth is `CLAUDE.md` §4. Summary: no potions/regen · rest heals HP only to 60% (`REST_CAP`), food heals the rest ·
camp fully safe (enemies can't enter, damage or shoot in) · death = −50% carried DOGE + all whiskers + materials + bag food (NFTs safe) ·
whisker = 3 DOGE · skills grow only by use (no XP levels, per-skill tiers in `SKILL_THRESH`) · fishing only outside camp, any hit
or move cancels it · quest stages 0→4 · populations field 22 / ruins 6, refill every 3 s ·
controls WASD/Space-J/K-Q/E/R/I-Tab/F/Esc. Field names: `P.iT` = i-frames, `P.bag` = inventory (grep before naming new state).
`tests/sim.mjs` enforces several of these automatically. When you add an invariant, add a check.
**Tests:** a test for "X cancels Y" must first assert Y started (else it passes vacuously). When you rename state, grep `tests/` too.
**Web3 rules (D-016):** wallet only via `window.ethereum` in the CHAIN section, only after CONNECT; no ethers.js, no fetch;
every on-chain row has an offline label; async results go through `setWalletMsg()`; test with `mockEth()` in `tests/sim.mjs`.
MetaMask needs http://localhost (`node tests/serve.mjs`). Anything needing the user's wallet/key (deploy, faucet) → skip, leave steps.
**Map RNG:** `genMap()` is seeded; add new terrain AFTER all `r()` passes and diff vs the approved map (D-017).
**Contracts (D-018):** `contracts/` Foundry, solc 0.8.24 cancun, OZ v5.1 in gitignored `lib/` (`forge install` per README).
DogeItems types 1..6 + `inventoryOf` packed `id<<16|type<<8|level`; DogeDEX listings + pools key `type<<8|level`, pull payments.
Game calls use precomputed selectors (`cast sig`), never ethers. Never put a private key in the repo; deploy = user step.
Test locally: `anvil` + `forge script ... --unlocked`. `bash tests/check.sh` stage 4 runs `forge test`.
**Game ↔ chain (D-019):** CHAIN section holds `CONTRACTS`, `SEL`, raw ABI helpers, `etx` (send+receipt), `chainAct` (one tx at a time),
`refreshChain` → `chainData`. Gear NFT owned = worn (`swordLv/armorLv`). Mint needs a forge credit or bag food (only playing gets stuff).
Dev: `node tests/serve.mjs` + `anvil` + deploy, open `http://localhost:8080/?chain=local`. Sim e2e runs when anvil is up.
**Item economy (D-021):** one craft = one item. Minting removes the off-chain effect (`takeOffChain`), refunds only on a sure failure
(`e.sent && !e.reverted` = keep). Reset `chainData` on account/chain change. Review every item path for duplication.
**Audited contract API (D-022):** `addLiquidity(ids,minShares)`, `removeLiquidity(key,amt,minItems,minDoge)`, `activeListings(offset,limit)`,
`listedCount()`; first LP = 1e18 shares/item, min 0.001 DOGE; sells with payout 0 revert. Always pass slippage guards from the game.
**Phase 4 (D-024):** lore = DogeOS Grand Heist (Fat Cats, factions Demolition Dogs / Kernel Crew / Barkitects). Camp NPCs: Sphinx (DeFi hub),
Elder (Heist), Wrenchpaw (forge), Cloverheart (Relotto), Noah (trynoah.ai), Bitget Wallet Card. Links only via `openLink()` from a menu
row, URL printed too. RedStone DOGE/USD: DogeDEX `dogeUsd()` (never reverts) → feed → adapter last push; mark STALE past 24 h; the oracle
is display/safety only, never the swap price. Partner text must be sourced; no partnership claims without a source.
**Feature ledger:** every feature also gets a row in `MASTER_PROMPT.md` §G (user rule).
**Web3 refs (IT-3/IT-4):** user-supplied avaxskills.com index — use only chain-agnostic EVM skills (`evm-foundry`, `nft-basics`,
`security`, `audit`, `testing`, `evm-wallet-integration`); DogeOS is not Avalanche, so ignore subnet/Warp/Fuji specifics.

## 4. Architecture quick map
Single `<script>` in `index.html`, sections marked `// ===== NAME =====` (CORE, AUDIO, INPUT, PIXEL FONT,
CHARACTER SPRITES, TILES, MAP, GAME STATE, COLLISION, FX, COMBAT, ENEMY AI, UI, UPDATE, RENDER, LOOP).
Full table in `CLAUDE.md` §3. Key facts:
- Globals: `state` (gate/stage/won), `P` (player), `enemies projs items parts floats`, `ui`, `cam`, `scene`.
- `update(dt)` returns early when `ui` is open → the world pauses (side effects in `render()` don't!).
- Input: `keys` held, `pressed` this frame only, cleared at end of `loop`.
- Entities: `(x,y)` = collision box center, feet at `y+hh`. `enemy:true` makes camp tiles solid.
- Balance numbers live in tables at the top of GAME STATE (`SWORD_*`, `ARMOR_*`, `ETYPES`).
- Remove entities with `.filter()` after loops, never `splice` inside.

## 5. Which skill / template for which job
| Job | Use |
|---|---|
| New feature | `prompts/SESSION_PROMPT.md` + plan mode; `game-feel`, `game-ui-ux`, `input-systems`, `save-systems`, `dialogue-systems` as relevant |
| Combat / feel | `design-action-combat`, `game-feel`, `game-dev-combat-animation` |
| Enemies / boss AI | `tune-enemy-ai`, `game-ai`, `design-game-encounters` |
| Balance / economy | `balance-check`, MASTER_PROMPT C4 template, `game-design-theory` |
| Sprites / tiles | `pixel-art-sprites` (adapt to our string-template system and palette roles) |
| Levels / ruins rooms | `level-design`, `author-game-levels` |
| Design doc / pitch | `game-design-document` (writes `docs/GDD.md`) |
| Audio | `audio-design`, `build-game-audio-feedback` |
| Testing | `terminal-testing` (this repo), `test-playable-web-games` for browser checks |
| Terse low-token mode | `caveman` (only when the user asks for it; never for teaching explanations) |
| Finding more skills | `find-skills` |

## 6. Working protocol (every session)
1. Read `CLAUDE.md`, this skill, and the last ~5 entries of `docs/DECISIONS.md`.
2. Restate the task with acceptance criteria. Plan mode if more than one section is touched.
3. Smallest surgical diff. New numbers go in the balance tables.
4. Verify: `bash tests/check.sh` (must print ALL CHECKS PASSED), then the manual browser steps from `CLAUDE.md` §6.
   If the change fixes a WARN in `tests/sim.mjs`, promote it to `fail()` in the same commit.
5. **Log** a decision entry in `docs/DECISIONS.md` (template there): what changed, why, which tool/skill/model, alternatives rejected.
6. **Commit** with a Conventional Commit message (`feat:`, `fix:`, `test:`, `docs:`, `chore:`), one logical change per commit.
7. **Improve the system:** if anything in this session would have gone better with a clearer rule, update this skill,
   `prompts/SESSION_PROMPT.md` or `CLAUDE.md` in the same or a follow-up commit, and log it under § Process.
8. Tell the user: what changed (files + short diff summary), how to test it by hand, and the commit hash.

## 7. Known issues (keep in sync with `docs/DECISIONS.md` and `tests/sim.mjs` WARN lines)
See `docs/DECISIONS.md` § "Open issues". Don't fix them silently inside another task. Each one gets its own commit.

## 8. Originality guardrail
Original characters only. No ripped Crusader of Centy sprites, music, maps or names, and no Dogecoin logo.
"Inspired by the feel" is OK. "Recreate level X" is not.
