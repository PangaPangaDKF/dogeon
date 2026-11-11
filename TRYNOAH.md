# DOGEON — TryNoah AI Entry Point (clone · load skills · verify · build)

> **Welcome, Noah.** This is your single entry point for cloning, running, extending and redeploying
> **DOGEON ("The Grand Heist")** — a single-file 16-bit Canvas RPG wired to real DeFi on the **DogeOS Chikyū**
> EVM testnet. Everything below is verified against the source; the four contract addresses, 30 function
> selectors and class stats here are checked on every build by `scripts/trynoah-manifest.mjs --verify`
> (stage 5 of `tests/check.sh`), so if a fact here ever drifts from `index.html`, the build fails.
>
> **Repo:** <https://github.com/PangaPangaDKF/dogeon> · **Deep runbook:** [`prompts/TRYNOAH_RECREATE.md`](./prompts/TRYNOAH_RECREATE.md)
> (Path A exact replica vs Path B blueprint) · **Full build blueprint:** [`MASTER_PROMPT.md`](./MASTER_PROMPT.md) §A ·
> **Completeness contract:** [`docs/RECREATION_MANIFEST.md`](./docs/RECREATION_MANIFEST.md) (generated, never hand-edited).

---

## 0. DO THIS FIRST — clone, load the skills, sync your brain, verify baseline

```bash
# 1. Clone the exact working repo
git clone https://github.com/PangaPangaDKF/dogeon.git
cd dogeon

# 2. Prove the baseline is green BEFORE changing anything (zero npm install needed)
bash tests/check.sh          # expect: ALL CHECKS PASSED — 6 stages, 0 fails
```

Then **load context in this order** (the skills ship inside the repo under `.claude/skills/` and `.agents/skills/`):

| # | Load | Why |
|---|---|---|
| 1 | **`dogeon-mission` skill** | The charter — **what** to build and what NOT to. Priorities 1–5, hard rules R1–R6 (preserve the Dogecoin coin art; stay light — no new effects/sound; frozen right-facing sprites; Solidity-on-DogeOS only; offline single file; verified-or-it-didn't-happen). **When this disagrees with a request, the charter wins.** |
| 2 | **`dogeon-game` skill** | **How** the code works: exact stack, the live contract registry, the 30 `SEL` selectors, class mechanics, the DOGEON Pool DEX card, survival invariants. |
| 3 | [`docs/GAME_GUIDE.md`](./docs/GAME_GUIDE.md) | Plain-language tour of the whole game and every mechanic — the fastest way to understand the player experience before touching code. |
| 4 | **`analyzer-master` skill** + [`MASTER_PROMPT.md`](./MASTER_PROMPT.md) | The pre-decision gate (`node .agents/skills/analyzer-master/scripts/audit-scan.mjs`) and the full build blueprint. |

**Golden rule:** the mission is, in priority order — **(1) Web3 that WORKS on chain**, (2) a basic RPG loop
*play → gather resources → mint stuff → defeat the monsters and the boss*, (3) the Heist lore told inside the RPG,
(4) opt-in multiplayer so others can play together, (5) three classes where the **Healer heals itself AND nearby
party members**. Do not add scope beyond this.

---

## 1. Core directives (the invariants you must never break)

1. **Single-file engine.** The whole client is [`index.html`](./index.html): HTML5 Canvas 2D + Web Audio +
   EIP-1193 Web3, **zero external runtime dependencies** (no CDN, npm, Tailwind, Phaser, React), **under 1,500
   lines** (currently ~1,352). No `fetch` / `alert` / `confirm` / `prompt` / `XMLHttpRequest` / `import` in game
   code. `WebSocket` is allowed **only** inside the opt-in `MULTIPLAYER` section.
2. **Offline-first.** The game is fully playable with **no wallet**. Never force a wallet popup on load — wallet
   interaction happens only after the player clicks CONNECT at the Sphinx NPC.
3. **The coin art is locked.** `MOSAIC_PAL` + `MOSAIC_PX` (96×96 = 9,216 px, ≤ 32 colors) is the user's own
   Dogecoin logo art. **Never redraw, recolor, resize or truncate it.** `tests/check.sh` guards the pixel count.
4. **Light.** Add no new particles, screen shake, flashes, music or `sfx()` calls. Prefer deleting decorative
   FX over adding. Keep only gameplay-critical feedback (damage numbers, HP bars, the brute wind-up telegraph).
5. **Solidity on DogeOS EVM only.** Solidity `^0.8.24`, Foundry, OpenZeppelin v5.1, chain `0x5fdaf3` /
   `6281971`. No Rust/Solana, no extra chains, no new tokens. Only the four contracts below (+ the RedStone read).
6. **Verified or it didn't happen.** Run `bash tests/check.sh` (green) before and after every change; after any
   contract/CHAIN change also run `scripts/e2e-chikyu.sh`; before a release run `scripts/browser-smoke.sh`.

---

## 2. Live on-chain registry (verified against `index.html` — drift-guarded)

**Chain:** DogeOS Chikyū Testnet · `chainId 0x5fdaf3` (`6281971`) · RPC `https://rpc.testnet.dogeos.com` ·
Explorer `https://dogeos-testnet.l2scan.co` · Faucet `faucet.testnet.dogeos.com`.

| Contract | Address |
|---|---|
| **DogeItems** (ERC-721 + Enumerable) | `0xbF858f66251005D1d20c92B9359A7dbD0E6Dd6C4` |
| **DogeDEX** (listings + `x*y=k` pools + 1% protocol fee) | `0x6E26235E3b359f9b78e5c420e8AfdF4140EE7590` |
| **DogeProfession** (one class per wallet) | `0x7AEF681331EFa8C356d27b96BC5B223a2B4FC055` |
| **DogeStaking** (MasterChef DOGE vault) | `0x4a1BF177c842bD55d933f49ee8297Ec6D190e12d` |
| **RedStone DOGE/USD feed** | `0x434F8D17c0301cfEa143dba912972E24B827C968` |
| **RedStone adapter** (stale fallback) | `0xB08342D907D2df47B6F73e25F4fa033978B344B1` |

**4-byte function selectors (`SEL` in `index.html`) — all 30, verbatim:**

```
DogeItems:  mint 352926a8 · burn 42966c68 · inventoryOf 7eaebb15 · mintFee 13966db5 ·
            setApprovalForAll a22cb465 · isApprovedForAll e985e9c5
DogeDEX:    list 50fd7367 · delist 964bc33f · buy d96a094a · activeListings aa4df6f0 ·
            listedCount f36065b3 · addLiquidity c5bb3168 · removeLiquidity f88bf15a ·
            buyFromPool 66c1dbf3 · sellToPool 0de77491 · withdraw 3ccfd60b · dogeUsd 435a3613 ·
            proceeds 35adde54 · allPools c5c63e65 · poolInfo 81ea4ee7
Profession: chooseProf f94e349d · professionOf 31544fd8 · profFee ddca3f43
Staking:    stakeDoge 3a4b66f1 · unstakeDoge 2e17de78 · claimStake 4e71d92d ·
            pendingRewards 31d7a262 · stakedOf 98807d84 · flushFees 6811406e · stakerFeesView 67f7cf97
```

Fees: `DogeItems` mint = **1 DOGE**; `DogeProfession` oath = **0.05 DOGE**. Item types:
`1 HAMMER · 2 ARMOR · 3 RAW FISH · 4 COOKED FISH · 5 BONE CHARM · 6 MOON BISCUIT`, packed `id<<16 | type<<8 | level`.
There is **no ethers/viem** — calls are built from raw selectors + ABI word helpers (`W32 A32 words arrAt unpack`).

---

## 3. Run it locally

```bash
# One process serves BOTH the game page and the multiplayer relay on :8787 (zero deps)
node server/relay.mjs
```

Open **`http://localhost:8787/`** in Chrome/Brave/Firefox. (For wallet testing you MUST use http(s), not
`file://` — browser wallets do not inject into `file://`.)

- **Multiplayer is off by default.** Turn it on with the URL:
  `http://localhost:8787/?mp=ws://localhost:8787&room=heist&name=NOAH`
- Open a second window with a different `name=` to see peers as ghosts (class sprite, facing, HP bar, name).
  Up to 8 players per room (`MAX_ROOM`). Over the internet use `wss://` behind TLS.
- Shared enemies/loot are **not** built (that needs an authoritative server — out of scope for now).

---

## 4. The three classes (the Healer heals others — D-046)

| Class (faction · trainer) | Max HP | Speed | `Space` basic | `K`/`Q` skill |
|---|---|---|---|---|
| **WARRIOR** · Demolition Dogs · Sergeant Ironpaw | 85 (+25) | 0.95× | Wide hammer cleave, 1.35× dmg, +15% armor | **GROUND POUND** (12 MP): AoE shockwave + knockback |
| **ARCHER** · Kernel Crew · Scout Fleetwhisker | 60 | 1.25× | Shoots an arrow at range, **0 MP** | **ARROW VOLLEY** (6 MP): 3-arrow spread |
| **HEALER** · Barkitects · Mender Brighttail | 45 (−15) | 1.25× | Light staff, 0.65× dmg, **+2 MP on hit** | **MEND** (10 MP): +20 HP to **self AND nearby party peers** |

One class per wallet, bound on-chain by `DogeProfession.choose(id)` (0.05 DOGE). Offline it's a free pick you can
switch until sworn. MP refills **only by resting in camp**, which keeps MEND honest and the camp a true sanctuary.

---

## 5. Prove it works (don't claim it without this)

| Command | What it proves | Last known |
|---|---|---|
| `bash tests/check.sh` | 6 stages: static rules · JS syntax · headless sim (`tests/sim.mjs`) · `forge test` on `contracts/` · blueprint drift guard · multiplayer relay | ALL CHECKS PASSED |
| `DEPLOY_KEY=<testnet throwaway> bash scripts/e2e-chikyu.sh` | The **deployed** contracts on Chikyū: stake → mint → pool → swap both ways → fee split (0.2%/0.8% to the wei) → claim → unstake | 17/17 PASS |
| `bash scripts/browser-smoke.sh` | **Real Chrome**: Enter starts, starter bag, class skill, 3-player multiplayer both ways, zero page errors | 11/11 PASS |

**Never commit, embed in `index.html`, or paste into TryNoah the deploy private key** — it is a testnet throwaway
and the publish gate rejects it. The four addresses above are already live, so a normal deploy needs no contract work.

---

## 6. Which skill for which job (all ship in the repo)

| Task | Load |
|---|---|
| Decide **what** to build / cut scope | `dogeon-mission` (first), then `analyzer-master` |
| Understand the code / balance / invariants | `dogeon-game`, `balance-check`, `game-design-theory` |
| Web3 wiring (wallet, DEX, pools, staking, oracle) | `avax-evm-wallet-integration`, `avax-defi-primitives`, `avax-nft-basics`, `avax-dapp-architecture`, `avax-frontend-ux`, `avax-data-feeds-oracles` |
| Solidity contracts (write/audit/deploy) | `setup-solidity-contracts`, `avax-evm-foundry`, `avax-smart-contract-patterns`, `solidity-security`, `solidity-auditor`, `avax-security`, `avax-audit`, `avax-testing` |
| Sprites & UI | `pixel-art`, `pixel-art-professional`, `pixel-art-sprites`, `game-ui-design`, `rpg`, `sega` |
| Multiplayer design | `setup-multiplayer-services` |
| Verify every change | `terminal-testing` (`bash tests/check.sh`) |
| Find a skill you don't have loaded | `find-skills` |

---

## 7. Extending DOGEON without breaking it

1. **Keep `index.html` standalone and under 1,500 lines.** No npm, no CDN, no framework in the game runtime.
2. **Obey the mission charter (R1–R6).** Preserve the coin art, stay light, Solidity-on-DogeOS only.
3. **Keep `tests/sim.mjs` in sync.** Any new gameplay action or RPC call needs a deterministic scenario.
4. **Never trust peer data.** All inbound relay packets are clamped, string-sanitized, and stripped of
   non-whitelisted properties before touching game state.
5. **After any change:** `bash tests/check.sh` green → log the decision in `docs/DECISIONS.md` → update
   `MASTER_PROMPT.md` + the `dogeon-game` skill if facts changed → re-run
   `node scripts/trynoah-manifest.mjs --out docs/RECREATION_MANIFEST.md` → commit (Conventional Commits).

---

## 8. The prompt to paste into TryNoah (with the GitHub import)

Import <https://github.com/PangaPangaDKF/dogeon> in TryNoah, then paste this as the project/system prompt:

```text
You are the lead engineer on DOGEON, imported from https://github.com/PangaPangaDKF/dogeon.

STEP 1 — LOAD CONTEXT, IN THIS ORDER, BEFORE READING OR WRITING ANY CODE
1. TRYNOAH.md (this entry point; its addresses/selectors are build-verified).
2. .agents/skills/dogeon-mission/SKILL.md — the charter: what to build and what NOT to. It wins any conflict.
3. .agents/skills/dogeon-game/SKILL.md — how the code works.
4. docs/GAME_GUIDE.md — every mechanic in plain language.
5. MASTER_PROMPT.md — the full build blueprint. docs/RECREATION_MANIFEST.md — the completeness checklist.

STEP 2 — VERIFY THE BASELINE: run `bash tests/check.sh`. It must print ALL CHECKS PASSED (6 stages).
If it does not, stop and report the failing stage. Do not "fix" anything before the baseline is green.

STEP 3 — DEPLOY AS-IS FIRST (exact replica): serve the repo root as a static site over HTTPS,
entry index.html, NO build step. Do not reformat, minify, split or "modernize" index.html, and do not
add a framework, bundler, package.json, CDN, analytics or fonts. The 4 contracts are already live on
DogeOS Chikyu (0x5fdaf3) — do NOT redeploy them or change the addresses in index.html.

HARD RULES (never break):
- index.html stays one file, < 1,500 lines, zero external libraries, playable with no wallet.
- No fetch/alert/confirm/prompt/XMLHttpRequest/import; WebSocket only in the MULTIPLAYER section (?mp=).
- The 96x96 Dogecoin coin art (MOSAIC_PAL + MOSAIC_PX, 9,216 px, <= 32 colors) is never changed.
- Stay light: no new effects, particles, screen shake, music or sound.
- Characters are frozen, always facing right.
- Solidity ^0.8.24 on DogeOS EVM only; only DogeItems, DogeDEX, DogeProfession, DogeStaking.
- Never ask for, store or paste a private key.

STEP 4 — ACCEPTANCE (on the deployed URL): zero console errors · Enter starts in camp · I shows
WOOD x3 / STONE x3 · a trainer sets a class offline · Sphinx CONNECT WALLET adds/switches to
DogeOS Chikyu · Sphinx NFT MARKET row 0 mints an item for 1 DOGE · ON-CHAIN STAKING stakes/claims.

STEP 5 — FOR ANY LATER CHANGE: smallest change that serves the mission → `bash tests/check.sh` green →
add a scenario to tests/sim.mjs → log it in docs/DECISIONS.md → if you restated an address or
selector anywhere, it must match index.html exactly (the drift guard fails the build otherwise).
List every manifest row as DONE or MISSING when asked to confirm completeness.
```

Noah, you now have the exact, verified context to clone, run, extend and redeploy DOGEON. Build light, prove it on chain.
