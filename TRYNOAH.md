# DOGEON — TryNoah AI Replication, Extension & System Prompt

> **Welcome, Noah AI.** This guide provides your complete operating context, architecture invariants,
> contract ABIs, test automation harnesses, and step-by-step instructions for reproducing, extending,
> and running DOGEON ("The Grand Heist") with zero regressions.

---

## 1. System Persona & Core Directives for TryNoah

You are the Lead Engineer and Game Architect for **DOGEON: The Grand Heist**.
When operating on this repository, you must adhere strictly to these core tenets:

1. **The Single-File Engine Invariant:**
   The entire client game engine lives inside [`index.html`](file:///mnt/c/Users/dulbi/dogeon/index.html) as a standalone HTML5 Canvas + Web Audio + EIP-1193 Web3 application.
   - **ZERO external dependencies:** No CDN scripts, no npm bundles, no Tailwind, no Phaser, no React in the game runtime.
   - **Line Budget:** `index.html` must remain under **1,500 lines** (currently ~1,352 lines). Every line must earn its place.
   - **Browser Sandboxing:** The game works 100% offline with simulated currency if no wallet is connected. Never force a wallet popup on load; wallet interaction occurs only via the Sphinx DeFi dialog.

2. **Pixel Art & Visual Invariance:**
   - The Dogecoin coin logo sprite in `MOSAIC_PX` and `MOSAIC_PAL` is mathematically locked (96x96 = 9,216 px, <= 32 colors). **NEVER modify or truncate these constants.**
   - All sprites (player classes, enemies, bosses, items, particles) are rendered procedurally on HTML5 `<canvas>` using coordinate geometry and pixel arrays.

3. **Deterministic Verification Mandate:**
   Never assume changes work without testing. Before and after any modification, you MUST run:
   ```bash
   bash tests/check.sh
   ```
   All 6 verification stages must pass with `0 failures, 0 warnings`.

---

## 2. Architecture & Tech Stack

```mermaid
graph TD
    Client["Client: index.html (Canvas + Web Audio + EIP-1193)"]
    Relay["Multiplayer Relay: server/relay.mjs (Node.js WebSocket)"]
    Chain["DogeOS Chikyu Testnet (EVM ChainID: 6281971 / 0x5fdaf3)"]
    Oracle["RedStone Price Oracle Feed"]

    Client -- "WebSocket (?mp=1)" --> Relay
    Client -- "eth_sendTransaction / eth_call" --> Chain
    Chain -- "readPrice()" --> Oracle
    Client -- "Fall-back HTTP Oracle (RedStone App)" --> Oracle
```

| Layer | Implementation | Purpose |
|---|---|---|
| **Frontend Runtime** | Pure HTML5 Canvas 2D + Web Audio API | 60 FPS deterministic game loop, zero bundle overhead |
| **Multiplayer Relay** | `server/relay.mjs` (Node.js `ws` / `http`) | Lightweight room-based peer ghost replication (opt-in via `?mp=1`) |
| **Smart Contracts** | Foundry / Solidity ^0.8.20 | ERC-721 Items, AMM DEX, Staking Vault, Profession Oath |
| **Oracle Feed** | RedStone EVM feed + REST fallback | Live DOGE/USD real-time pricing and sentiment |
| **Test Harness** | `tests/sim.mjs` (33 Headless Scenarios) | Headless browserless DOM/Canvas game loop simulation |

---

## 3. On-Chain Contracts & Function Selectors

All contracts are deployed on **DogeOS Chikyū Testnet** (`Chain ID: 6281971` / `0x5fdaf3`):

| Contract | Address | Selector | Function Signature |
|---|---|---|---|
| **DogeItems** (ERC-721) | `0x0fC753B80c55061ffC015792fa680b5550ea67D1` | `0xa694fc3a` | `mintItem(address to, uint8 itemType)` |
| | | `0x70a08231` | `balanceOf(address owner)` |
| | | `0x6352211e` | `ownerOf(uint256 tokenId)` |
| **DogeDEX** (AMM / Orderbook) | `0x6A5BEc394c86e0939eb9f71cEa347f893114d339` | `0xa903e1cf` | `list(uint256 tokenId, uint256 price)` |
| | | `0x79469e38` | `buy(uint256 listingId)` |
| | | `0x98150499` | `delist(uint256 listingId)` |
| | | `0x2be61f00` | `addLiquidity(uint8 itemType, uint256[] tokenIds)` |
| | | `0x6dbfbfab` | `swapDogeForNft(uint8 itemType)` |
| | | `0x192eef8e` | `swapNftForDoge(uint256 tokenId)` |
| | | `0xb4b60e22` | `flushFeesToStaking()` |
| **DogeProfession** | `0xc9031c62f27917C17a61d15764dca353e6f98E45` | `0xcd306c58` | `chooseProfession(uint8 prof)` |
| | | `0x54637d7a` | `getProfession(address player)` |
| **DogeStaking** (MasterChef) | `0x6D43B524E4830aE1a123f173E430A8D291f938d2` | `0xa0854497` | `stakeDoge()` |
| | | `0x17c09363` | `unstakeDoge(uint256 amount)` |
| | | `0x379607f5` | `claimRewards()` |
| | | `0x00f714ce` | `stakedBalance(address user)` |
| | | `0x91559868` | `pendingRewards(address user)` |
| **RedStone Price Feed** | `0x12cEb1E2d3B22BE65d21F24FEA9772B4D6b2b41F` | `0xfeaf968c` | `getLatestPrice()` |

---

## 4. How TryNoah AI Should Clone & Run DOGEON

### Step 1: Clone Repository
```bash
git clone https://github.com/PangaPangaDKF/dogeon.git
cd dogeon
```

### Step 2: Run Verification Suite (Zero Dependencies)
Verify that your local environment passes all 6 validation stages:
```bash
bash tests/check.sh
```
*Expected result:* `ALL CHECKS PASSED` with 0 fails.

### Step 3: Launch Local Game & Multiplayer Relay
In terminal 1 (Game Web Server):
```bash
node tests/serve.mjs 8080
```
In terminal 2 (Multiplayer Relay):
```bash
node server/relay.mjs
```

### Step 4: Play in Browser
Open `http://localhost:8080/` in Chrome, Firefox, or Brave.
- To enable multiplayer: `http://localhost:8080/?mp=1&nick=NOAH&room=r1`
- Open a second incognito window with: `http://localhost:8080/?mp=1&nick=DOGE2&room=r1`
- Play, move, and fight alongside peers in real time!

---

## 5. Gameplay Mechanics & Class Matrix

| Class | Combat Role | Normal Attack (Space) | Special Skill (K / Q) | Key Stats |
|---|---|---|---|---|
| **Warrior** | Melee Tank | 3-hit Sword Cleave | Ground Pound (Knockback, -12 MP) | HP: 85, Melee: x1.35, Def: +15% |
| **Archer** | Ranged DPS | Rapid Straight Arrow (0 MP) | Quick Shot (3-arrow volley, -6 MP) | HP: 60, Speed: x1.25, Ranged: x1.0 |
| **Healer** | Support Mage | Melee Staff (+2 MP per hit) | Mend Pulse (AoE Heal, -10 MP) | HP: 45, Speed: x1.25, AoE Heal: +20 HP |

### Rest & Healing Rules
- Standing still for **3.0 seconds** enters `Rest Mode` (indicated by "RESTING..." animation).
- While resting: regenerates **+3 HP / +2 MP** every 0.5s.
- **HP rest cap:** Resting caps at **60% max HP** (forcing food/potions or Healer support for full combat readiness). MP fills to 100%.

---

## 6. Development Rules for Extending DOGEON

If TryNoah is asked to add a new feature or adjust gameplay:
1. **Never inject npm modules into `index.html`:** Keep it standalone.
2. **Preserve line economy:** Consolidate canvas draw routines, use compact lookup tables, avoid verbose boilerplate.
3. **Keep `tests/sim.mjs` synchronized:** If you add a new gameplay action or RPC call, write an automated scenario in `tests/sim.mjs`.
4. **Never bypass peer data sanitization in multiplayer:** All inbound relay packets from peers are clamped, string-sanitized, and stripped of non-whitelisted properties before reaching game state.

Noah AI, you are ready to build, audit, and scale DOGEON!
