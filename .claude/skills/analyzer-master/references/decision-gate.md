# Analyzer Master — On-Demand Domain Checklists

Load this reference only when planning changes in the corresponding domain.

## A. Solidity & Web3 (`contracts/` + `CHAIN` section)
1. **Checks-Effects-Interactions (CEI) & Reentrancy:** Every state-changing external function has `nonReentrant` and updates storage before external calls (`call{value}`, `_safeMint`, `transferFrom`).
2. **Pull Over Push Payments:** Credit `proceeds[user]` and expose `withdraw()`; never push native DOGE to arbitrary addresses inside a trade/mint loop.
3. **AMM & Fee Solvency (`DogeDEX` + `DogeStaking`):**
   - `k = x * y` must never decrease across `buyFromPool` / `sellToPool`.
   - Protocol fee (`1%` = `0.2%` project + `0.8%` stakers) is skimmed **outside** pool reserves `p.doge`.
   - Slippage guards (`minShares`, `minItemsOut`, `minDogeOut`, `minOut`) must be passed by `index.html`.
4. **No Off-Chain/On-Chain Item Duplication:**
   - Minting a crafted item calls `takeOffChain(type, level)` before `etx()`.
   - Refund off-chain credit/food **only** when `!e.sent || e.reverted` (never on unknown receipt timeout).
   - Reset `chainData` on `accountsChanged`, `chainChanged`, and `disconnectWallet()`.
5. **Offline Playability Invariant:**
   - Gate every local fallback on `!chainReady() || !addrs().<contract>`, never on `!addrs().<contract>` alone, so the game remains 100% playable without a wallet even when live Chikyū addresses are populated.

## B. 16-Bit Gameplay & Balance (`GAME STATE`, `COMBAT`, `ENEMY AI`, `UI`)
1. **Camp Sanctuary & Healing Invariant:**
   - Enemies and enemy projectiles (`kind === 'bone'`) cannot enter or damage the player inside `CAMP`.
   - Resting (`R` in camp, 3s delay) heals HP up to **60% (`REST_CAP`)** and MP to **100%**.
   - Healer `MEND` heals above 60% HP by spending MP, which only refills by resting in camp.
2. **Frame-Rate Independence:**
   - All movement, timers, and particle updates (`updateParts(dt)`) must run inside `update(dt)` scaled by `dt`, never inside `render()`.
3. **UI & Font Constraints:**
   - All strings rendered via `text()` / `textC()` must use characters present in `FONT` (uppercase, digits, basic punctuation + `#`, `^`).
   - Menu labels must be `<= 50` chars (`<= 58` for dynamic market rows) with no floating-point noise.

## C. Pixel Art & Seeded Map (`CHARACTER SPRITES`, `TILES`, `MAP`)
1. **Seeded Map Determinism:** `genMap()` uses `mulberry(4242)`. Never insert new `r()` calls before existing terrain passes; carve new features *after* vegetation passes.
2. **Visual Verification:** After any sprite or tile edit, run `node tests/sprites.mjs index.html tests/out/sprites.png` and inspect the PNG visually.
