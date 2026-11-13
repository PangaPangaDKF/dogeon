# DOGEON → TryNoah AI: Lean Exact-Clone Prompt (D-084)

> **The one file to use for cloning.** Paste everything inside the fence as the first message/project prompt in TryNoah,
> after importing <https://github.com/PangaPangaDKF/dogeon>. It is ~1.5k tokens and drift-guarded: stage 5 of
> `tests/check.sh` fails if an address, selector or class name here stops matching `src/game.js`, or if a known-stale
> phrase creeps back. Deeper docs (`TRYNOAH.md`, `prompts/TRYNOAH_RECREATE.md`, `MASTER_PROMPT.md`) are for
> extending/rebuilding, not for cloning — loading them wastes tokens.
>
> **Scope: the GAME only.** The landing page (`landing.html`, `assets/`, `prompts/LANDING_MASTER_PROMPT.md`,
> `dogeon-landing-design` skill) is a separate project with its own lane; the clone never creates, edits or verifies it.

```text
ROLE: You host and maintain DOGEON, imported from https://github.com/PangaPangaDKF/dogeon.
GOAL: an EXACT clone running live. Do NOT rebuild, rewrite or improve it. Copy -> set up -> verify -> serve.

== GROUND TRUTH (verified from source; wins over anything older in the repo) ==
- The game = TWO files: index.html (18-line shell) + src/game.js (~162 KB, 1500 lines, loaded with
  <script src="src/game.js">, a classic script, NOT an ES module). Plain JS + Canvas 2D, 320x224.
- Zero runtime dependencies. No build, no npm install, no package.json, no bundler, no framework.
- server/relay.mjs = zero-dep Node server: the game at "/play" (or any "play.*" host or "?mp="), /health,
  plus the multiplayer WebSocket relay.
- OUT OF SCOPE — the landing page is a SEPARATE project. landing.html, assets/, prompts/LANDING_MASTER_PROMPT.md,
  docs/TRAILER_SCRIPT.md and the dogeon-landing-design skill belong to it. Do NOT create, rebuild, edit, read
  or verify a landing page. Leave those files as they are (the relay may serve them at "/"; ignore that).
  Your job is the GAME only.
- Chain: DogeOS Chikyu testnet, chainId 0x5fdaf3 (6281971), RPC https://rpc.testnet.dogeos.com.
  Contracts are ALREADY DEPLOYED and hardcoded in src/game.js CONTRACTS. NEVER redeploy or edit them:
    DogeItems      0xbF858f66251005D1d20c92B9359A7dbD0E6Dd6C4  (ERC-721 items, mint fee 1 DOGE)
    DogeDEX        0x6E26235E3b359f9b78e5c420e8AfdF4140EE7590  (listings + x*y=k pools, 1% protocol fee)
    DogeProfession 0x7AEF681331EFa8C356d27b96BC5B223a2B4FC055  (one class per wallet, 0.05 DOGE)
    DogeStaking    0x4a1BF177c842bD55d933f49ee8297Ec6D190e12d  (MasterChef DOGE staking)
    RedStone feed  0x434F8D17c0301cfEa143dba912972E24B827C968 · adapter 0xB08342D907D2df47B6F73e25F4fa033978B344B1
- Selectors (SEL, raw 4-byte, no ethers/viem): mint 352926a8 burn 42966c68 inventoryOf 7eaebb15
  mintFee 13966db5 setApprovalForAll a22cb465 isApprovedForAll e985e9c5 list 50fd7367 delist 964bc33f
  buy d96a094a activeListings aa4df6f0 listedCount f36065b3 addLiquidity c5bb3168 removeLiquidity f88bf15a
  buyFromPool 66c1dbf3 sellToPool 0de77491 withdraw 3ccfd60b dogeUsd 435a3613 proceeds 35adde54
  allPools c5c63e65 poolInfo 81ea4ee7 chooseProf f94e349d professionOf 31544fd8 profFee ddca3f43
  stakeDoge 3a4b66f1 unstakeDoge 2e17de78 claimStake 4e71d92d pendingRewards 31d7a262 stakedOf 98807d84
  flushFees 6811406e stakerFeesView 67f7cf97
- Classes: WARRIOR (85 HP, GROUND POUND 12 MP) · ARCHER (60 HP, Space = arrow, ARROW VOLLEY 6 MP) ·
  HEALER (45 HP, MEND 10 MP heals self + nearby party). MP refills only by resting in camp.
- Multiplayer is OFF unless the URL has ?mp=ws(s)://host. With the relay: ghosts, one shared Cat Lord
  per room, PvP, death-loot piles, Healer MEND pulses.
- Other facts: characters always face right (no walk cycle); FIELD_POP=52; 15 item types; 47 forge
  tests; Solidity 0.8.24, evm_version cancun, OpenZeppelin v5.1.0, forge-std v1.17.0.

== READ ONLY THESE (token budget) ==
1. .agents/skills/dogeon-mission/SKILL.md — the charter (what NOT to do). It wins conflicts.
2. docs/RECREATION_MANIFEST.md — generated from source; the completeness checklist.
3. Only if you must change code: .agents/skills/dogeon-game/SKILL.md, then ONLY the
   `// ===== NAME =====` section of src/game.js you touch (grep the header, read that line range).
DO NOT READ: landing.html, assets/, prompts/LANDING_MASTER_PROMPT.md, contracts/lib, contracts/out, contracts/cache, contracts/broadcast, docs/DECISIONS.md (150 KB
history), CONTEXT.md, docs/LESSONS.md, the ~50 other skill folders, tests/out. Never paste src/game.js into chat.

== TASK ==
STEP 1 Environment + baseline: run `bash scripts/setup-clone.sh --install-foundry`.
  It checks Node 18+, installs Foundry if missing, fetches the pinned Solidity libs, and runs
  `bash tests/check.sh`. It must end with "baseline green". If it fails, quote the failing stage and STOP.
  Do not edit any file to make it pass. (No Foundry allowed? use --no-contracts and say so.)
STEP 2 Serve (tell me which):
  B) RECOMMENDED, identical to production: `node server/relay.mjs` (PORT env, default 8787) behind HTTPS
     (and WSS for multiplayer), or `docker build -t dogeon . && docker run -p 8080:8080 dogeon`.
  A) Static only: publish the repo root over HTTPS (must serve index.html AND src/game.js). Game only,
     no multiplayer.
STEP 3 Acceptance on the live URL (game at /play for B, / for A). Report PASS/FAIL per line:
  1 zero console errors  2 Enter starts in camp  3 I/Tab shows WOOD x3 + STONE x3
  4 a trainer sets a class offline and the sprite changes  5 Sphinx CONNECT WALLET adds/switches to 0x5fdaf3
  6 Sphinx NFT MARKET row 0 mints an item (1 DOGE)  7 ON-CHAIN STAKING stake/claim
  8 (B) two tabs on /play?mp=wss://<host>&room=t with different &name= see each other
STEP 4 Completeness: list each section heading of docs/RECREATION_MANIFEST.md as DONE / MISSING.

== HARD RULES ==
- Serve files byte-for-byte: no reformat, minify, split, rename, "modernize"; no CDN, analytics, fonts.
- No fetch/alert/confirm/prompt/XMLHttpRequest/import in game code; WebSocket only in MULTIPLAYER.
- Never touch MOSAIC_PAL / MOSAIC_PX (the Dogecoin coin art). No new effects, particles or sound.
- Never ask for, store or paste a private key. The wallet is touched only after the player clicks CONNECT.
- src/game.js is at its 1500-line cap: new code goes in a new src/*.js classic script — ask me first.
- Unsure? ASK, or grep the source. Never guess an address, selector, constant or file path.

== OUTPUT FORMAT ==
Short. Per step: the command, the last lines of its output, PASS/FAIL. No essays, no restating this
prompt, no code dumps.
```

## Steps for you (the human), in order

1. `git push origin main` — TryNoah clones GitHub, not your disk.
2. In TryNoah: import `https://github.com/PangaPangaDKF/dogeon`.
3. Paste the fenced prompt above. Answer its "A or B?" with **B** for a production-identical clone.
4. Check its STEP 3 table yourself on the URL it gives you (wallet steps need MetaMask + testnet DOGE from
   https://faucet.testnet.dogeos.com; Brave's built-in wallet blocks CONNECT — use Chrome or set
   `brave://settings/web3` → Extensions).

Local dry run of the same environment: `git clone https://github.com/PangaPangaDKF/dogeon.git && cd dogeon && bash scripts/setup-clone.sh`.
