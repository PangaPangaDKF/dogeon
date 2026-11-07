# DOGEON contracts (DogeOS Chikyū testnet)

Two contracts, built and tested with Foundry. Design notes are in `docs/DECISIONS.md` D-018.

| Contract | What it does |
|---|---|
| `src/DogeItems.sol` | ERC-721 (OpenZeppelin v5.1). The Mechanic mints gear and food: `mint(to, itemType, level)` with an **exact 0.1 DOGE fee** that goes to the treasury. Metadata (JSON + SVG card) is fully on-chain. ERC721Enumerable. `inventoryOf(owner)` (O(balance)) returns packed `(id<<16 \| type<<8 \| level)`. `burn(id)` uses an item up. |
| `src/DogeDEX.sol` | The Sphinx DEX. **Listings**: `list`, `buy` (exact price), `delist`. **Pools (LP with DOGE)**: one pool per (type, level). `addLiquidity(ids[], minShares)` + DOGE gives shares (first LP: 1e18 per item, min 0.001 DOGE), `removeLiquidity(key, shares, minItems, minDoge)`, `buyFromPool` / `sellToPool` on a constant-product curve with a 2% fee for LPs. Listings paginated: `activeListings(offset, limit)`, `listedCount()`. Pull payments: `withdraw()`. No admin. Nothing is for sale until a player creates it. Audited in D-022. |

Item types: 1 HAMMER (lv 1-4) · 2 ARMOR (lv 1-2) · 3 RAW FISH · 4 COOKED FISH · 5 BONE CHARM · 6 MOON BISCUIT (lv 1).

## Setup (once)
```bash
cd contracts
forge install foundry-rs/forge-std --no-git
forge install OpenZeppelin/openzeppelin-contracts@v5.1.0 --no-git
forge test            # 25 tests incl. 2 fuzz tests + 5 audit regressions (k never drops, DEX stays solvent)
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
4. Copy `items` and `dex` from `deployments/6281971.json` into `CONTRACTS` in `index.html` (CHAIN section) and commit.
5. Optional: verify on Blockscout: `forge verify-contract <addr> src/DogeItems.sol:DogeItems --chain-id 6281971 --verifier blockscout --verifier-url https://blockscout.testnet.dogeos.com/api/`

Chain facts (checked live 2026-11-07): chainId `0x5fdaf3` (6281971), RPC `https://rpc.testnet.dogeos.com`, Cancun opcodes supported.
