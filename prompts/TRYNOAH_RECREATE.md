# DOGEON — TryNoah AI Recreation & Deployment Runbook (D-037)

> **Scope:** how to recreate DOGEON ("The Grand Heist") inside **TryNoah AI** (or any LLM app builder) and deploy it,
> *without missing a single feature, contract, selector or gameplay rule* — and how to **prove** nothing was missed.
>
> Companions: [`MASTER_PROMPT.md`](../MASTER_PROMPT.md) §A (the spec prompt) · [`docs/RECREATION_MANIFEST.md`](../docs/RECREATION_MANIFEST.md)
> (auto-generated inventory) · [`CLAUDE_CODE_HANDOFF.md`](../CLAUDE_CODE_HANDOFF.md) (dual-brain context).

---

## 0. Read this first — the honest truth about "recreate it exactly"

There are **two different goals**, and they need **two different methods**. Mixing them up is the #1 way to end up
with a lookalike that silently lost features.

| | **Path A — EXACT REPLICA** | **Path B — BLUEPRINT REBUILD** |
|---|---|---|
| **Method** | Hand TryNoah the **real source files** and tell it to host them unchanged. | Paste `MASTER_PROMPT.md` §A and let the model **write** the app from the spec. |
| **Result** | **Byte-identical.** Every pixel, balance number, selector and quirk preserved. | **Functionally similar, NOT identical.** An LLM re-derives 1,274 lines of hand-tuned code; sprites, timings and edge cases will differ. |
| **Use when** | You want *this* game live (the normal case). | You want a fresh variant, or TryNoah must own/extend the codebase. |

> ⚠️ **No prose prompt — however detailed — can reproduce 1,274 lines of hand-tuned canvas code byte-for-byte.**
> If the goal is "replicate exactly as developed", **use Path A.** Use §A only to *regenerate or extend*.
> This runbook therefore leads with Path A and keeps Path B as the fallback.

---

## 1. Path A — EXACT replica (recommended)

DOGEON is a **single static file with zero dependencies**, which makes exact deployment trivial: there is no build
step, no npm install, no bundler, no server code. `index.html` *is* the whole app.

### A1. What to hand over
| File | Size | Why it is required |
|---|---|---|
| `index.html` | ~123 KB | The entire game: engine, sprites, audio, UI, Web3/EIP-1193 layer. **Ship verbatim.** |
| `contracts/src/DogeItems.sol` | ~7.5 KB | ERC-721 items. Already deployed — only needed to redeploy or audit. |
| `contracts/src/DogeDEX.sol` | ~18 KB | Listings + `x*y=k` NFT/DOGE pools + 1% protocol fee. |
| `contracts/src/DogeProfession.sol` | ~3 KB | One class per wallet. |
| `contracts/src/DogeStaking.sol` | ~4.6 KB | MasterChef DOGE staking vault. |
| `contracts/src/IPriceFeed.sol` | ~0.6 KB | RedStone feed interface. |

Total ≈ **158 KB** (~40k tokens) — fits a large-context builder in one or two messages.

### A2. Prompt to paste into TryNoah (Path A)
```text
Host this exact application. It is a single, self-contained, zero-dependency static web app.

HARD RULES — do not "improve" it:
1. Serve `index.html` byte-for-byte as given. Do NOT reformat, minify, split, re-indent, "modernize",
   add a framework/bundler/package.json, or inject analytics, CDNs, fonts or polyfills.
2. It must be served over http(s) from a real origin (NOT file://) — browser wallets do not inject into file://.
3. No build step. No server-side code. No environment variables. Static hosting only.
4. The Solidity files are already deployed to DogeOS Chikyū testnet and are included for reference only.
   Do NOT redeploy or change the addresses baked into index.html.

The app is a 16-bit canvas RPG + DeFi hub that talks to the user's own wallet (EIP-1193) only after they
click CONNECT. It is fully playable with no wallet. Deploy it and give me the public URL.

<paste the full contents of index.html here>
```

### A3. Deploy targets (any static host works)
- **Netlify:** drag-and-drop the folder, or `netlify deploy --prod --dir .` (publish dir = repo root; `index.html` is the entry).
- **Vercel / Cloudflare Pages / GitHub Pages:** point at the repo root, framework preset **"Other / None"**, no build command.
- **Requirement in all cases:** HTTPS origin so `window.ethereum` is injected. No other config needed.

### A4. Post-deploy acceptance test (run in the browser)
> Steps 1–4 (+ multiplayer) are automated in **`bash scripts/browser-smoke.sh`** (real Chrome via `agent-browser`, D-041):
> last run **11/11 PASS** with zero page errors. Point it at a deployed URL by serving that build, or run it locally first.
1. Page loads at 320×224 scaled, pixelated, **zero console errors**.
2. Title → `Enter` → you spawn in camp as the basic doge.
3. Walk out, `Space` to hit a cat, pick up a whisker, hold `R` in camp to rest (caps at 60% HP).
4. `I` → bag shows `WOOD x3` / `STONE x3`.
5. Talk (`E`) to a faction trainer → pick a class **offline** (free) → sprite changes, HUD class tag updates.
6. Sphinx (`E`) → `CONNECT WALLET` → wallet prompts to **add/switch to DogeOS Chikyū (0x5fdaf3)**.
7. Sphinx → `NFT MARKET: SWAP + LIQUIDITY POOLS` → DOGEON Pool DEX opens; Row 0 mints an item (0.1 DOGE).
8. Sphinx → `ON-CHAIN STAKING` → stake / claim / unstake.

---

## 2. Path B — BLUEPRINT rebuild (only if TryNoah must author the code)

1. Paste **all of `MASTER_PROMPT.md` §A** (the single-prompt full-stack blueprint). It already carries the exact
   stack rules, the 4 live Chikyū addresses, all 30 four-byte selectors, class stats and the DOGEON Pool DEX spec.
2. Then paste **`docs/RECREATION_MANIFEST.md`** as the completeness contract and instruct:
   *"Implement every row of this manifest. When done, list each item and mark it DONE or MISSING."*
3. Expect to iterate — see §3 to find what it dropped.

---

## 3. Proving nothing was missed (the completeness gate)

`docs/RECREATION_MANIFEST.md` is **generated from the source**, never hand-written, so it cannot drift:

```bash
node scripts/trynoah-manifest.mjs --out docs/RECREATION_MANIFEST.md   # regenerate the inventory
node scripts/trynoah-manifest.mjs --verify                            # fail if a prompt quotes a stale address/selector/class
```

`--verify` is wired into `bash tests/check.sh`, so a stale recreation prompt now **breaks the build** instead of
silently shipping wrong contract addresses.

The manifest pins, straight from code: the 17 `index.html` sections · every `CONTRACTS` address (both chains) ·
all 30 `SEL` selectors · the RedStone feed + adapter · every external/public Solidity function · exact per-class
stats · item types, mintables and forge recipes · NPCs, enemy types and balance constants · every on-chain action
and menu function · and the full list of headless sim scenarios that must pass.

### 3b. Live on-chain proof (the contracts the app talks to really work)

The headless sim drives a **mock** wallet, so it proves logic but not the deployed bytecode. The live contracts are proven
separately with `scripts/e2e-chikyu.sh`, which runs the exact loop the game's UI exposes on DogeOS Chikyū:

```bash
DEPLOY_KEY=<testnet throwaway key> bash scripts/e2e-chikyu.sh   # never paste this key into TryNoah
```
Last run (D-039): **17/17 PASS** — stake → mint 3 item NFTs → approve → create pool → swap DOGE→item → swap item→DOGE →
protocol fee accrues → `flushStakerFees()` → staker reward → `claim()` → `withdraw()` → remove LP → unstake. The 1% fee
split was verified **to the wei** (project 0.2% : stakers 0.8% = exactly 1 : 4). So a Path-A deploy needs no contract work:
the addresses baked into `index.html` are live and correct.

**Checklist to call a recreation complete**
- [ ] Every manifest §1–§8 row exists in the rebuild.
- [ ] Wallet connect adds **and** switches to `0x5fdaf3`; app still fully playable with the wallet rejected.
- [ ] All 3 professions: offline free pick, on-chain `choose()` binds one class per wallet forever.
- [ ] DOGEON Pool DEX: mint → wallet items row → create pool → swap both ways → add/remove LP → withdraw proceeds.
- [ ] Staking: stake, claim, unstake, and `flushStakerFees()` sync.
- [ ] `node scripts/trynoah-manifest.mjs --verify` exits 0.
- [ ] After any redeploy: `bash scripts/e2e-chikyu.sh` → all PASS (fee split 1:4 on-chain).
- [ ] No legacy DOGE-shop constants (`SWORD_COST`/`ARMOR_COST` were removed in D-039 — gear comes only from forge `RECIPES`).
- [ ] Multiplayer stays **off** without `?mp=`; with it, two browser tabs on the same relay see each other (§5b).

---

## 4. Contract redeployment (only if you need a *fresh* chain)

The live Chikyū addresses are already baked into `index.html`, so **skip this** for a normal deploy.

```bash
cd contracts
forge test                                   # 45 tests must pass
forge script script/Deploy.s.sol --rpc-url chikyu --broadcast --private-key <YOUR_TESTNET_KEY>
node apply-deployment.mjs 6281971            # writes the new addresses into index.html
cd .. && bash tests/check.sh                 # must stay green
node scripts/trynoah-manifest.mjs --out docs/RECREATION_MANIFEST.md   # refresh the manifest
```

**Key hygiene (non-negotiable):** the deploy key is a **testnet throwaway**. Never commit it, never put it in
`index.html`, never paste it into TryNoah or any hosted builder. Deploy order matters: `DogeStaking` must exist
before `DogeDEX` (the DEX takes `stakingPool` as an immutable constructor arg).

---

## 5b. Multiplayer option (D-040) — optional, self-hosted, costs Noah nothing

`index.html` already contains an **opt-in** multiplayer mode that is **off by default**, so a Path-A deploy needs no
extra work and makes zero network calls unless a player opts in.

- **Turn it on:** open the game with `?mp=wss://YOUR-RELAY&room=heist&name=YOU`. Up to 8 players per room (env
  `MAX_ROOM`) see each other's doge: class sprite, facing, walk animation, HP bar and name.
- **Host the relay (zero dependencies):** `node server/relay.mjs` → one process serves **both** the game page and the
  WebSocket relay on `:8787`. Local test with friends on the same network: `http://<your-ip>:8787/?mp=ws://<your-ip>:8787`.
  On the internet, the page must use `wss://` → run the relay behind TLS (Caddy/nginx) or on a host that terminates TLS
  (Render, Fly.io, Railway, a VPS). Health check: `GET /health`.
- **What it is NOT:** shared enemies, shared loot and server-side combat. Those need an *authoritative* server (the
  open-source path is [Colyseus](https://github.com/colyseus/colyseus), MIT, self-hostable) and were deliberately left out:
  too expensive to build before the deadline. Serverless P2P alternative: [Trystero](https://github.com/dmotz/trystero)
  (MIT) — rejected because it is a library and would break the zero-dependency rule.
- **Protocol (for a Path-B rebuild):** client → `{t:'join',room,id}` once, then `{t:'st',id,x,y,d,m,c,h,n,dead}` at 10 Hz;
  relay → other players' `st` messages and `{t:'bye',id}` / `{t:'full'}`. The relay only forwards a client's **own** id
  (no spoofing). Clients must treat peer data as untrusted (whitelist ids, finite coords, sanitized names, capped peers).
- **Proof:** `node tests/relay.mjs` (real WebSocket clients: 3 players see each other, room isolation, anti-spoof, room
  cap, bye) and the sim's D-040 scenario (off by default, opt-in relays state, hostile data rejected). Both run in
  `tests/check.sh` (stages 3 and 6).

## 5. Publishing the GitHub repo

`scripts/publish-github.sh` does it in one command once you have a token (see that script's header). It is
intentionally **not** run automatically because repo creation needs credentials this environment does not hold.

Before any public push, the pre-publish gate (already verified clean for this repo) must hold:
```bash
git log --all -p -S"<your key>" --oneline | head   # must print nothing
git ls-files | grep -iE "\.env|key|secret|\.pem"   # must print nothing
```
