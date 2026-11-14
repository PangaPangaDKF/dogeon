---
name: dogeon-solidity
description: DOGEON's own Solidity rulebook. Load before writing, changing, reviewing, testing or deploying any DOGEON smart contract (DogeItems, DogeDEX, DogeProfession, DogeStaking or a v2), before changing any game code that sends a transaction, and before planning fees, rewards, staking, mints or PonziFi mechanics. Holds the fundamental "nerves" (N0 SPEND -> GET first), the live money map of the 4 deployed contracts, the gameplay-to-chain flow, the v2 roadmap, and the build/test/audit/deploy workflow. Routes to the installed solidity-security, solidity-auditor, setup-solidity-contracts and avax-* skills.
---

# DOGEON Solidity Skill

Version: 1.0 (2026-11-13, D-105) · Owner: BRAIN lane · Mirror: `.agents/skills/dogeon-solidity/SKILL.md`
Plan for the next contracts: `docs/CONTRACTS_V2_PLAN.md`. Mission: DogeOS Solidity/DeFi is DOGEON's top priority (`dogeon-mission`).

## 0. The nerves (fundamental moves; every contract and every tx path obeys them, in this order)
**N0. SPEND → GET (user rule, 2026-11-13).** Nothing is ever minted, credited or paid out of nothing. Every new token, share or
reward is backed by something the caller *spent* in the same transaction or earlier: DOGE paid (`msg.value`), NFTs burned or
escrowed, or fees other players paid. No free mint, no owner "airdrop" of new value, no infinite supply: every mint path has a
price, a burn, a cap, or all three. If a function can create value without a matching input, it is a bug, even if `onlyOwner`.
- Off-chain things (wood, steel, kills) cannot be proven on chain from a browser game. So the contract enforces what it *can*:
  the fee, burned NFT inputs, per-wallet and global caps. The game enforces the materials (D-104, `mintNft` needs a forge credit
  or a caught food). The only way to bind materials on chain is a server-signed voucher (plan option B), never trust in the client.
**N1. Exact payment.** `msg.value == fee` (no silent overpay, no underpay). Fees are constants or owner-settable with an event and
a hard maximum. Users always see the fee before signing (the game shows `(1 DOGE)` on every mint row).
**N2. Solvency invariant.** A contract that holds user DOGE must always satisfy `balance >= principal owed + rewards owed + fees owed`.
Rewards come only from fees that already arrived (no emissions, no promised APY). Prove it with a Foundry invariant test.
**N3. Checks → Effects → Interactions + `nonReentrant` + pull payments.** State changes before any external call; payouts via
`call` at the end; treasuries *pull* (`withdraw`) instead of being pushed.
**N4. No dupes across the chain/game border.** One craft = one mint (`creditOk`/`takeOffChain`/`putBack`); a failed or rejected tx
refunds the credit; an unknown outcome refunds nothing (no double spend).
**N5. Honest PonziFi (satire on testnet).** The "ponzi" is a transparent meme: later players' fees pay earlier stakers, and the code
says so. Never show a promised APY, a USD price, or "earn" language; every page and menu keeps "testnet tokens, no real-world
value, not financial advice" (landing rule T8).
**N6. Wallet safety.** Never ask for, store or log a private key or mnemonic. Deploys use Foundry's encrypted keystore
(`cast wallet import dogeon --interactive`) or `DEPLOY_KEY` in the user's own shell, never a file in the repo.
**N7. The game never needs a wallet.** Every on-chain feature is additive; offline play stays complete (CLAUDE.md §4).

## 1. Live contracts (DogeOS Chikyū testnet, chain 6281971 = 0x5fdaf3) and their money
Addresses: `CONTRACTS['0x5fdaf3']` in `src/game.js` (and `contracts/deployments/6281971.json`). Never copy them from memory.
| Contract | Takes | Gives | Fee route |
|---|---|---|---|
| `DogeItems` (ERC-721) | `mint(to,type,level)` exact `mintFee` (1 DOGE) | one item NFT | `withdrawFees()` (anyone): **80% DogeStaking, 20% treasury** |
| `DogeDEX` | listings (`list/buy/delist`), pools (`addLiquidity/removeLiquidity/buyFromPool/sellToPool`) | items / DOGE / LP shares | 2% LP fee stays in the pool; **+1% protocol**: 0.2% treasury, 0.8% stakers via `flushStakerFees()` |
| `DogeProfession` | `choose(id)` exact fee, one per wallet forever | class 1/2/3 | 100% treasury (pull) |
| `DogeStaking` | `stake()` any DOGE | pro-rata share of fees (MasterChef `accRewardPerShare`) | no deposit/withdraw fee, no lock (v2 changes this) |
**Known gap (open, D-104):** `DogeItems.mint` is permissionless for any type/level at the fee: it breaks N0 on chain. Fix = v2 plan §2.

## 2. Gameplay → chain flow (what the game does today)
`play → gather (F) / kill → materials in bag (wood, stone) and P.steel/P.whisk → CRAFT at the forge (burns materials, + credit)
→ MINT row (1 DOGE + gas, DogeItems.mint) → NFT = equipped (swordLv/armorLv) → list/pool/swap on DogeDEX (Sphinx) → fees →
DogeStaking rewards → stake/claim at the Sphinx`. Food: catch fish → `PRESERVE AS NFT` (fish leaves the bag) → eat = burn.
Class oath: `DogeProfession.choose` once per wallet. DogeMaster (after the Cat Lord): burn an NFT → re-roll a new one (burn + fee).
No in-game DOGE exists (D-097): the only DOGE is the wallet's testnet DOGE. Game code: CHAIN section of `src/game.js`
(`etx`, `ecall`, `SEL` 4-byte selectors precomputed, `chainAct`, `mintNft`, `mintRows`, `stakeMenu`, `marketMenu`).

## 3. Workflow (every contract change)
1. Load this skill + `dogeon-mission`. Read the contract and its test file. Write the change as a plan entry first if it moves money.
2. Write the failing Foundry test first (unit + fuzz). For anything holding DOGE add/extend an **invariant test** for N2.
3. Implement with OpenZeppelin v5.1 (pinned), Solidity version as in `foundry.toml`, custom errors, events for every state change.
4. `cd contracts && forge test` (all green) → `bash tests/check.sh` (stage 4 runs forge) → game sim against anvil mocks.
5. Audit: `solidity-auditor` in loop mode (3 passes) + the `solidity-security` checklist. Fix or document every finding (DECISIONS).
6. Local deploy: `anvil` + `forge script script/Deploy.s.sol --rpc-url local --broadcast` → `?chain=local` in the game.
7. Testnet deploy is the **user's** step (N6): keystore account, then `node apply-deployment.mjs`, `bash tests/check.sh`,
   `DEPLOY_KEY=… bash scripts/e2e-chikyu.sh`, then BRAIN deploys the game and logs it (skill `dogeon-agent-sync`).
8. New selectors → `SEL` in `src/game.js` (precomputed `cast sig`), drift guard (`scripts/trynoah-manifest.mjs`) stays green.

## 4. Review checklist (paste into the PR/commit message)
- [ ] N0: every path that creates tokens/shares/rewards names what was spent (fee, burn, escrow, fees from others). Caps where minting.
- [ ] N1: exact fees, owner-settable only with event + max bound.
- [ ] N2: invariant test for solvency passes (runs ≥ 256, depth ≥ 50).
- [ ] N3: CEI, `nonReentrant` on every external that moves value, pull payments for treasuries.
- [ ] N4: game refunds on reject/revert, never on unknown outcome.
- [ ] N5: no APY promise, no price, testnet disclaimer in every UI that shows the feature.
- [ ] Gas: no unbounded loops over users; per-user position lists capped.
- [ ] Events for indexers; custom errors; NatSpec on externals.

## 5. Installed skills to route to
`solidity-security` (patterns, vulnerabilities), `solidity-auditor` (multi-pass audit, ledger), `setup-solidity-contracts`
(OpenZeppelin/Foundry setup), `avax-testing` / `avax-evm-foundry` (fuzz, invariant, cast), `avax-nft-basics`,
`avax-defi-primitives` (staking/AMM ideas; DogeOS is EVM, so they apply), `analyzer-master` (pre-decision gate).

## Changelog
- 1.0 (2026-11-13, D-105): created at the user's request: N0 SPEND → GET as the fundamental move, nerves N1–N7, money map, gameplay flow, workflow, checklist, routing. Plan: `docs/CONTRACTS_V2_PLAN.md`.
