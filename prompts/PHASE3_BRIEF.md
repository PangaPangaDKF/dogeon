# DOGEON — Phase 3 Brief: "Doge Chain"

Version 1.0 · 2026-11-07 · Built from user request. This phase transitions from simulated web3 to
real on-chain gameplay on DogeOS Chikyū testnet while adding survival mechanics (fishing, inventory,
skill-by-use progression). Paste it or point to `@prompts/PHASE3_BRIEF.md` to drive any session.

---

> **SCOPE RULE (carried from Phase 2):** MVP only. Minimalist and light. Basic style, hard mode.
> DOGE / Ð coin references everywhere. Art drawn in code. Full access granted.
> **Phase 3 update:** the "zero network calls" constraint is lifted for wallet + contract interactions.
> ethers.js v6 loaded from CDN. Solidity contracts in a `contracts/` folder (Foundry). The game
> `index.html` stays as ONE file with a CDN `<script>` tag for ethers.

## 1. Role
Same as Phase 2: lead engineer + pixel artist. Ship in small verified committed iterations.
Loop: plan → build → test → log → commit → improve prompt/skill.

## 2. Context
- Read `CLAUDE.md`, `CONTEXT.md`, `dogeon-game` skill, last 5 entries of `docs/DECISIONS.md`.
- Phase 2 is complete (749 lines, 20 tests, 14 commits). Published artifact exists.

## 3. Goals (user's words, organized)

### G1 — Rest nerf
Rest no longer fully heals. Cap HP recovery at ~60% of maxHp. Rest is a stopgap, not a full heal.
The main way to top off HP is now eating food (G4).

### G2 — Inventory
Visible inventory (press I or Tab). Grid of slots. Holds food, gear, materials. Items can be
used (eat food), equipped, or dropped.

### G3 — Skill-by-use progression (Tibia / Cambria style)
No character levels. Instead, skills improve by doing:
- **Combat skill**: increases by landing hammer hits. Higher skill = more damage.
- **Fishing skill**: increases by successful catches. Higher skill = faster catch, better fish.
- **Bark skill**: increases by using bark. Higher skill = more bark damage.
Skill XP accumulates per action. Thresholds for levels (e.g., 10/25/50/100 actions).
Small bonuses per level (~5-10% per tier). Show skill levels in inventory or HUD.

### G4 — Fishing
- Water tiles on the map (ponds in the field, river near camp).
- Press F near water to start fishing. Shows a progress bar (3-5 seconds).
- Getting hit interrupts fishing immediately. Moving cancels it.
- Successful catch → food item (RAW FISH) goes to inventory.
- Eat food from inventory to heal (RAW FISH = +15 HP, COOKED FISH = +25 HP).
- Cooking: use the campfire (stand near fire, open inventory, "cook" action on raw fish).
- **The trick:** the map is always full of enemies. Fishing spots are outside camp.
  You can't fish safely. This makes food scarce and full HP nearly impossible.
- Enemy populations increased slightly to maintain pressure.

### G5 — Real wallet connection
- Load ethers.js v6 from CDN (`https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.4/ethers.umd.min.js`).
- Detect `window.ethereum` (MetaMask / injected provider).
- Connect button in the Sphinx DEX menu.
- On connect, auto-add DogeOS Chikyū testnet RPC if not present:
  | Field | Value |
  |-------|-------|
  | Chain Name | DogeOS Chikyū Testnet |
  | Chain ID | 6281971 (0x5fdaf3) |
  | RPC URL | https://rpc.testnet.dogeos.com |
  | Currency | DOGE |
  | Explorer | https://dogeos-testnet.l2scan.co |
- Switch to the chain after adding.
- Show connected address (truncated) in wallet panel.
- Faucet link: https://faucet.testnet.dogeos.com

### G6 — Items as NFTs (on-chain)
- Solidity contract: `DogeItems.sol` (ERC-721).
- Each crafted gear or food item is mintable as an NFT.
- The Mechanic NPC calls the contract's `mint()` function with a DOGE fee.
- Minted items show a token ID in inventory. Items exist both in-game and on-chain.
- You can view your NFTs in the Sphinx DEX wallet panel.

### G7 — On-chain swap & LP
- No free store. You can only buy items if someone has created a liquidity pool first.
- Solidity contract: `DogeDEX.sol` — simple order-book or AMM for NFT↔DOGE trades.
- Sphinx DEX menu: CREATE POOL (deposit DOGE + set item price floor), ADD LIQUIDITY,
  SWAP (buy/sell NFTs for DOGE), REMOVE LIQUIDITY.
- All transactions are real testnet transactions.

### G8 — Crafter mints on-chain
- The Mechanic (crafter) calls `DogeItems.mint()` when you forge gear.
- Burns materials (still in-game) + pays a DOGE fee (on-chain tx).
- The minted NFT appears in your inventory with its token ID.
- Food items from fishing can also be minted ("preserve" them as NFTs to trade).

### G9 — Process
- Commit every iteration, log every decision, improve prompt/skill.
- Update CLAUDE.md, CONTEXT.md, tests.

## 4. Constraints
- `index.html` stays as one file. CDN script for ethers.js v6 is the only external dependency.
- `contracts/` folder with Foundry for Solidity. Separate from the game file.
- Camp stays safe. Fishing happens OUTSIDE camp (that's the risk).
- Pixel font, uppercase, ≤75 chars per line. All existing rules from CLAUDE.md §5 apply.
- On-chain features gracefully degrade: game is fully playable without a wallet connected.
  Wallet features are additive (mint, trade). Core gameplay works offline.

## 5. Resolved ambiguities
1. **Rest cap:** 60% of maxHp. Resting from 0 to 60% is fine; beyond that, eat food.
   If HP is already above 60%, rest does nothing for HP (still recovers MP fully).
2. **Inventory size:** 12 slots. Materials (orb/scrap/horn/steel) stack. Food stacks (max 5 per slot).
   Gear doesn't stack (hammer, armor are equipped, not in bag — or shown as equipped slots).
3. **Fishing spots:** 4-6 water ponds scattered in the field. One near (but outside) camp fence.
   Water = new tile type (T.WATER). Player can't walk on water; press F facing water.
4. **Skill levels:** 4 tiers each. Combat: 0/10/25/50/100 hits. Fishing: 0/5/15/30/60 catches.
   Bark: 0/8/20/45/80 uses. Bonuses: +8% per tier (so tier 4 = +32%).
5. **Food types:** RAW FISH (+15 HP), COOKED FISH (+25 HP). Cooking = stand near campfire + use.
   Future: more food types from different fishing spots (not in MVP).
6. **NFT contract:** Simple ERC-721 with `mint(address to, uint256 itemType)` payable.
   Item types encoded as uint256 (1=hammer, 2=armor, 3=raw_fish, 4=cooked_fish, etc.).
   Mint fee: 0.1 DOGE (testnet). Owner = deployer can set fees.
7. **DEX contract:** Simple fixed-price listing. Not a full AMM for MVP.
   `list(tokenId, price)`, `buy(tokenId)` payable, `delist(tokenId)`.
   "Create LP" = list items for sale. "Swap" = buy listed items.
8. **Graceful degradation:** All wallet/chain features are behind a `wallet.connected` check.
   Game loads and plays fully without ethers.js if CDN is blocked. Menu says "CONNECT WALLET"
   where on-chain actions would be, and shows "SIMULATED" fallback for offline play.
9. **Cooking mechanic:** Stand within 20px of campfire + open inventory + select raw fish + "COOK".
   This means you must be in camp to cook (fire is in camp), adding another reason to return.
10. **Enemy pressure:** Field population bumped from 18 to 22. Spawn timer from 4s to 3s.
    Fishing spots are surrounded by enemies. Ninja spawns slightly increased near water.

## 6. DogeOS Chikyū Testnet reference
- **Chain ID:** 6281971 (hex: 0x5fdaf3)
- **RPC:** https://rpc.testnet.dogeos.com
- **Explorer:** https://dogeos-testnet.l2scan.co
- **Currency:** DOGE (18 decimals, native gas token)
- **Faucet:** https://faucet.testnet.dogeos.com (42.069 DOGE daily)
- **Architecture:** EVM-compatible ZK rollup settling to Dogecoin L1
- **Tooling:** Foundry / Hardhat work with standard config

## 7. Work plan (one commit each, tests green after every step)
- **IT-0** This brief. Phase 3 kickoff.
- **IT-1** Rest nerf (cap at 60% HP) + inventory system (12 slots, I key) + skill-by-use tracking.
- **IT-2** Fishing mechanic: water tiles, fishing action, food items, cooking at campfire.
- **IT-3** Wallet connection: ethers.js CDN, window.ethereum, chain add, connect/disconnect in Sphinx.
- **IT-4** Solidity contracts: DogeItems (ERC-721) + DogeDEX (listings). Foundry project in `contracts/`.
- **IT-5** Wire game UI to contracts: Mechanic mints NFTs, Sphinx lists/buys, wallet panel shows NFTs.
- **IT-6** Tests for all new mechanics + docs update + balance pass.

## 8. Acceptance criteria
- [ ] Rest caps HP recovery at 60% maxHp. MP still recovers fully. (IT-1)
- [ ] Inventory opens with I/Tab, shows 12 slots, food/materials visible. (IT-1)
- [ ] Combat/fishing/bark skills track usage and give tier bonuses. (IT-1)
- [ ] Water tiles on map. F near water starts fishing. Hit interrupts. Catch → RAW FISH in inventory. (IT-2)
- [ ] RAW FISH eaten from inventory heals +15 HP. COOKED FISH (cooked at fire) heals +25 HP. (IT-2)
- [ ] Wallet connects via window.ethereum. DogeOS Chikyū auto-added. Address shown. (IT-3)
- [ ] Mechanic forge calls DogeItems.mint() on-chain. NFT appears in inventory with token ID. (IT-5)
- [ ] Sphinx DEX: list NFT for DOGE, buy listed NFT. Real testnet transactions. (IT-5)
- [ ] Game works fully without wallet (graceful degradation). (IT-3)
- [ ] `bash tests/check.sh` → ALL CHECKS PASSED with new scenarios. (IT-6)

## 9. Definition of done (per iteration)
Tests green → `docs/DECISIONS.md` entry → Conventional Commit → one improvement to brief/prompt/skill
if the iteration taught something → short report.

## Sources (DogeOS testnet info)
- [Chainlist — DogeOS Chikyū Testnet](https://chainlist.org/chain/6281971)
- [GitHub — ethereum-lists/chains PR #8860](https://github.com/ethereum-lists/chains/pull/8860)
- [CrowdfundInsider — DogeOS Testnet](https://www.crowdfundinsider.com/2026/10/314700-dogeos-testnet-brings-ethereum-eth-style-contracts-to-dogecoin-without-altering-base-chain/)
- [CryptoBriefing — Dogecoin DogeOS testnet launch](https://cryptobriefing.com/dogecoin-dogeos-testnet-launch-upgrade/)
- [TrustSwap — DogeOS Guides](https://trustswap.com/dogeos)
