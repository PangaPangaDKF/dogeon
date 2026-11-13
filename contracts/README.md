# DOGEON contracts (DogeOS Chikyū testnet)

Four contracts, built and tested with Foundry. Design notes are in `docs/DECISIONS.md` D-018.

| Contract | What it does |
|---|---|
| `src/DogeItems.sol` | ERC-721 (OpenZeppelin v5.1). The Mechanic mints gear and food: `mint(to, itemType, level)` with an **exact fee** (deploy default 0.1 DOGE via `MINT_FEE_WEI`; **live Chikyū = 1 DOGE**, set with `setMintFee`) that goes to the treasury. Metadata (JSON + SVG card) is fully on-chain. ERC721Enumerable. `inventoryOf(owner)` (O(balance)) returns packed `(id<<16 \| type<<8 \| level)`. `burn(id)` uses an item up. |
| `src/DogeDEX.sol` | The Sphinx DEX. **Listings**: `list`, `buy` (exact price), `delist`. **Pools (LP with DOGE)**: one pool per (type, level). `addLiquidity(ids[], minShares)` + DOGE gives shares (first LP: 1e18 per item, min 0.001 DOGE), `removeLiquidity(key, shares, minItems, minDoge)`, `buyFromPool` / `sellToPool` on a constant-product curve with a 2% fee for LPs. Listings paginated: `activeListings(offset, limit)`, `listedCount()`. Pull payments: `withdraw()`. No admin. Nothing is for sale until a player creates it. Audited in D-022. **RedStone oracle (D-024):** `dogeUsd()` (never reverts; `fresh=false` if missing/stale) and `poolTvlUsd(key)`, display only. Feed set at deploy: env `DOGE_USD_FEED`, else RedStone DOGE `0x434F8D17c0301cfEa143dba912972E24B827C968` on Chikyū, else a mock on anvil. |
| `src/DogeProfession.sol` | The faction/class registry (D-027). `choose(uint8)` picks **1 WARRIOR / 2 ARCHER / 3 HEALER**, payable with an exact fee (env `PROF_FEE_WEI`, default 0.05 DOGE), **one per wallet forever**. The game reads `professionOf(addr)` to drive your mechanic + skill. `roster()` = (warriors, archers, healers). Pull-payment treasury (`withdraw`). `ReentrancyGuard`. No admin. |
| `src/DogeStaking.sol` | Stake DOGE, earn the holders' share of DEX fees (D-030). `stake()` / `unstake(amount)` / `claim()` / `pendingRewards(addr)`, MasterChef accumulator, pull-style payouts, `receive()` credits rewards. No admin, no lockup. |

**DEX protocol fee (D-030):** every DogeDEX trade pays a **1% protocol fee** on top of the 2% LP fee, split **0.2% to the project treasury** and **0.8% to DOGE stakers**. It is skimmed outside the pool reserves, so the constant-product curve, k-invariant and solvency are unchanged. `flushStakerFees()` pushes the stakers' slice into `DogeStaking`. The DEX constructor takes `(items, feed, treasury, stakingPool)`.

Item types: 1 HAMMER (lv 1-4) · 2 ARMOR (lv 1-2) · 3 RAW FISH · 4 COOKED FISH · 5 BONE CHARM · 6 MOON BISCUIT (lv 1) · 7-15 DOGE gear (SWORD, LEATHER ARMOR, SHIELD, STAFF, ROBE, WHIP, BOW, HEMP SHIRT, QUIVER).

## Setup (once)
```bash
cd contracts
# easiest: bash ../scripts/setup-clone.sh (pinned versions). Manual:
forge install foundry-rs/forge-std@v1.17.0 --no-git
forge install OpenZeppelin/openzeppelin-contracts@v5.1.0 --no-git
forge test            # 47 tests incl. 4 fuzz tests, 5 audit regressions, 3 oracle, 9 profession, 7 staking (k never drops, DEX stays solvent)
```

## Try it locally (no wallet, no real DOGE)
```bash
anvil                                    # terminal 1: local chain 31337
forge script script/Deploy.s.sol --rpc-url local --broadcast --unlocked \
  --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266   # terminal 2
```
Addresses land in `deployments/31337.json`.

## Deploy to DogeOS Chikyū (your step — needs your funded testnet wallet)
1. Get test DOGE: https://faucet.testnet.dogeos.com
2. Import your key into Foundry's **encrypted** keystore (it never goes into a file in this repo):
   `cast wallet import dogeon --interactive`
3. Deploy:
   `forge script script/Deploy.s.sol --rpc-url chikyu --broadcast --account dogeon --sender <YOUR_ADDRESS>`
4. Write the addresses into the game (checks both have contract code on Chikyū first):
   `node apply-deployment.mjs` (from `contracts/`), then `bash ../tests/check.sh` and commit `src/game.js` + `deployments/6281971.json`.
5. Optional: verify on Blockscout: `forge verify-contract <addr> src/DogeItems.sol:DogeItems --chain-id 6281971 --verifier blockscout --verifier-url https://blockscout.testnet.dogeos.com/api/`

Chain facts (checked live 2026-11-07): chainId `0x5fdaf3` (6281971), RPC `https://rpc.testnet.dogeos.com`, Cancun opcodes supported.
