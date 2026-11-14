# DOGEON Contracts v2: Plan (PLAN ONLY, nothing built yet)

Status: proposal, 2026-11-13 (D-105). Rules: skill `dogeon-solidity` (nerve **N0 SPEND → GET** first). Testnet only; PonziFi is satire.
Every number marked **(tunable)** is a proposal for the user to approve before code is written.

## 0. FIRST when development restarts (user decision 2026-11-14: contracts frozen until after launch)
From the audit `docs/audits/2026-11-13/06-verified.md` (all verified REAL; none is exploitable for real money: testnet only).
Fix these before any other v2 work, each with a failing Foundry test first (skill `dogeon-solidity` §3):
| # | ID | What | Where it lands |
|---|---|---|---|
| 1 | D-104 / S1-5 | `DogeItems.mint` is open: any item/level for the fee (breaks N0 on chain) | §2 `mintBase` caps + `craft` by burn |
| 2 | S1-1 | Just-in-time stake → flush → claim → unstake in one tx takes most pending fees | §3 positions + lock tiers; fees accrue to weight held before the deposit |
| 3 | S1-2 | A 1-wei stake into an empty vault takes the whole `residual` | §3 minimum stake + residual to treasury or streamed |
| 4 | S2-3 | Re-roll = burn tx + mint tx; a rejected 2nd step loses the item | §2 atomic `reroll(burnId)` |
| 5 | S1-3, S1-4 | Owner can repoint/freeze stakers' 80% (`setStakingPool/setTreasury`), `setMintFee` unbounded (0 = free) | §2: immutable or timelocked, bounded fee, events |
| 6 | S1-6, S0-1 | Deploy script defaults to 0.1 DOGE and never calls `setStakingPool`; `deployments/6281971.json` says 0.1 | §6 deploy script v2 |
| 7 | S1-7 | No invariant tests (N2); staking rounding unproven | §3 invariant suite |
| 8 | S1-8 | `dogeUsd()` can revert on a code-less feed; `poolTvlUsd` ignores `fresh` | §4 DEX v2 |
| 9 | S1-9 | Single-step `Ownable`, silent profession withdraw (no event), stale comments | all v2 contracts: `Ownable2Step`, events |
| 10 | S2-6 (game side done in D-111 if wired) | Mint fees reach stakers only when someone calls `withdrawFees()` | §2 push on mint or keeper |

## 1. Why v2
- `DogeItems.mint` lets anyone mint any item/level for 1 DOGE (breaks N0 on chain; the game itself was fixed in D-104).
- Staking is free in and free out with no lock, so the PonziFi loop has no "nerve": nothing rewards patience or charges impatience.
- Fees from the class oath go 100% to the treasury; stakers never see them.

## 2. DogeItems v2: "the forge on chain" (spend → get)
| Function | Caller spends | Caller gets | Limits |
|---|---|---|---|
| `mintBase(type)` | base fee (1 DOGE, tunable) | one **base** item: HAMMER LV2, ARMOR LV1, RAW FISH, BONE CHARM, MOON BISCUIT | **per-wallet cap: 3 base mints per 24 h** (tunable); global cap per type (tunable, e.g. 10 000) |
| `craft(type, level, burnIds[])` | burns the recipe's input NFTs + craft fee (0.5 DOGE, tunable) | one upgraded item | recipe table on chain (below); inputs must be owned/approved and match exactly |
| `reroll(burnId)` | burns 1 NFT + reroll fee (1 DOGE, tunable) | one DOGE-gear item (types 7–15), roll from the new token id | — |
| `migrate(oldIds[])` | escrows v1 NFTs into v2 (transferred, locked forever) | the same type/level in v2 | v1 only, one-time per token (spend → get: the v1 token is given up) |
| `burn(id)` | the NFT | nothing (eating food) | owner/approved |
Recipes (tunable): HAMMER LV3 = 2× HAMMER LV2 · HAMMER LV4 = 2× HAMMER LV3 · ARMOR LV2 = 2× ARMOR LV1 · COOKED FISH = 1× RAW FISH.
Top tiers are naturally scarce: a LV4 hammer burns 4 base hammers and 3 fees. Optional meme caps: HAMMER LV4 max supply 420.
The game keeps the off-chain materials gate (D-104) in front of `mintBase`; option B below can bind it on chain later.
Fee route (unchanged idea, now pulled): 80% stakers / 20% treasury via `withdrawFees()` (anyone can trigger).

## 3. DogeStaking v2: "the PonziFi vault" (time choice + fees)
Positions: each `stake(lockTier)` opens a position `{amount, weight, unlockAt}` (max 10 open positions per wallet, gas bound).
| Lock tier | Lock time | Reward weight | Early exit ("skip the time") fee |
|---|---|---|---|
| FLEX | none | 1.00× | — (withdraw fee only) |
| WEEK | 7 days | 1.25× | up to 5% × remaining time / lock time |
| MONTH | 30 days | 1.60× | up to 10% × remaining / lock |
| QUARTER | 90 days | 2.00× | up to 20% × remaining / lock |
(all tunable)
- **Deposit fee 1%**, **withdraw fee 1%** (tunable). Early-exit fee = `maxPenalty × (unlockAt − now) / lockTime` (linear, falls to 0 at unlock).
- Where fees go (the transparent "ponzi": the next fren pays): **80% to the remaining stakers' accumulator, 20% treasury** (tunable).
  Rewards are paid by weight (`amount × multiplier`), so long locks earn a bigger slice of every fee.
- Reward sources, and only these (N2, no emissions): DogeItems mint/craft/reroll fees (80%), DEX protocol fee (0.8%), profession
  fee (new: 50% to stakers, tunable), staking deposit/withdraw/early-exit fees (80%).
- Rewards are claimable any time (`claim(positionId)`); principal only at unlock, or early with the fee.
- Display: the game/landing may show *trailing fees received in the last 7 days*, never an APY or a promise; every screen keeps the
  testnet / not-financial-advice line (N5).
- Invariant (Foundry): `address(this).balance >= Σ principal + Σ claimable + undistributed residual`; fuzz deposits/exits/rewards in
  random order; early exit never pays more than principal − fee; weights sum equals `totalWeight`.

## 4. The other contracts
- **DogeDEX**: logic unchanged; redeployed only because it stores the items address (immutable) → point it to DogeItems v2 and
  DogeStaking v2. Existing pools/listings of v1 items stay readable on v1; players migrate items first (§2 `migrate`).
- **DogeProfession**: optional v2 only to route 50% of the oath fee to stakers; the one-class-per-wallet rule stays. If not
  redeployed, the treasury forwards its share manually (documented, not code).

## 5. Option B (later): materials on chain via server vouchers
The relay becomes authoritative for gathering/kills/craft (server-side inventory), then signs EIP-712 vouchers
`Mint{wallet, type, level, nonce, expiry}`; `mintWithVoucher(v, sig)` checks signer + nonce + expiry + fee. This is the only way
N0 can cover wood/steel themselves. Cost: a server-authoritative inventory (large rewrite of `server/relay.mjs` + anti-cheat).

## 6. Phases (each ends with tests green + DECISIONS entry + commit)
1. **Approve numbers** (user): table in §7.
2. **DogeItems v2** + tests (unit, fuzz on recipes/caps, invariant "no token without fee or burn") + `solidity-auditor` 3 passes.
3. **DogeStaking v2** + tests (positions, weights, early-exit math, solvency invariant) + audit.
4. **DEX/Profession wiring** + deploy script v2 + anvil end-to-end + game: CHAIN section (`mintBase`, `craft`, `reroll`, `migrate`,
   staking tiers UI with lock picker and "SKIP LOCK (FEE x DOGE)" row), sim with mocks, `SEL` + drift guard.
5. **Testnet deploy** (user's keystore, N6) → `apply-deployment.mjs` → `scripts/e2e-chikyu.sh` → BRAIN deploys the game →
   LANDING updates the contracts table and the PonziFi/staking copy (board tasks).
6. **Migration window**: players move v1 items with `migrate`; v1 stays read-only.

## 7. Numbers the user must approve (all proposals)
| Item | Proposal |
|---|---|
| Base mint fee / craft fee / reroll fee | 1 / 0.5 / 1 DOGE |
| Base mint cap per wallet | 3 per 24 h |
| Global caps | 10 000 per base type; HAMMER LV4 420 |
| Recipes | 2 lower items → 1 higher (hammer, armor); 1 raw fish → cooked |
| Stake deposit / withdraw fee | 1% / 1% |
| Lock tiers and weights | FLEX 1.0×, 7 d 1.25×, 30 d 1.6×, 90 d 2.0× |
| Max early-exit fee | 5% / 10% / 20% (linear to 0) |
| Fee split | 80% stakers / 20% treasury (all sources); profession 50% stakers |
