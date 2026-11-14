# Stage 1 — Smart contracts · 2026-11-13 · HEAD a3bbc4e
## Scope covered
- Read in full: `contracts/src/DogeItems.sol` (202), `DogeDEX.sol` (373), `DogeProfession.sol` (71), `DogeStaking.sol` (116), `IPriceFeed.sol` (13),
  `contracts/script/Deploy.s.sol` (50), `contracts/foundry.toml`, `contracts/deployments/6281971.json` + `31337.json`; test files
  `contracts/test/*.t.sol` (test list + the fuzz/split/residual tests read in full). Plan `docs/CONTRACTS_V2_PLAN.md`; D-071 note in `docs/DECISIONS.md:347`.
- Skills applied: `dogeon-solidity` N0–N7 + money map, `solidity-security` checklist, `solidity-auditor` method (3 passes, below).
- `cd contracts && forge test -vv` → `Ran 4 test suites in 1.56s (1.72s CPU time): 47 tests passed, 0 failed, 0 skipped (47 total tests)`.
- Targeted run `forge test --match-test "test_RewardWithNoStakersBecomesResidualThenPaid|test_WithdrawFeesWithStakingPoolSplit|test_ProtocolFeeSplitsAndFlushesToStakers|testFuzz_PrincipalAlwaysReturnable|testFuzz_PoolInvariant|test_OnlyOwnerAdmin|test_LateStakerDoesNotStealPastRewards"`
  → `7 tests passed, 0 failed` (fuzz runs 512/513).
- `cast sig` for every function the game uses: all 30 entries of `SEL` (`src/game.js:728`) match the contract signatures (e.g. `0x352926a8 mint(address,uint8,uint8)`, `0xc5bb3168 addLiquidity(uint256[],uint256)`, `0x67f7cf97 stakerFees()`, `0xf36065b3 listedCount()`).
- No RPC call made (live `mintFee`, `stakingPool`, owner not read).

**Pass 1 — value flow (N0: spends → gets; who may call)**
| Function | Spends | Gets | Caller |
|---|---|---|---|
| `DogeItems.mint(to,type,lvl)` :77 | exactly `mintFee` | 1 NFT of ANY valid type/level | anyone (D-104 gap) |
| `DogeItems.burn(id)` :89 | the NFT | nothing | owner/approved |
| `DogeItems.withdrawFees()` :96 | — | moves `accruedFees` 80% → `stakingPool`, 20% → `treasury` (push) | anyone |
| `setMintFee/setTreasury/setStakingPool` :116-130 | — | owner changes price / fee recipients | owner (evented, unbounded) |
| `DogeDEX.list/delist/buy` :128/137/147 | NFT escrow / exact price | listing / NFT back / NFT; seller gets price−1% in `proceeds` | owner of NFT / seller / anyone |
| `addLiquidity(ids,minShares)` :252 | n NFTs + DOGE (first ≥0.001; later ceil(n·x/y), excess → proceeds) | `n·1e18` or `floor(S·n/y)` shares | anyone |
| `removeLiquidity` :289 | shares | `floor(y·s/S)` NFTs + `floor(x·s/S)` DOGE (→ proceeds) | LP |
| `buyFromPool(key)` :311 | `≥ buyQuote` (pool price + 1%) | 1 NFT, excess → proceeds | anyone |
| `sellToPool(id,minOut)` :327 | 1 NFT | pool payout − 1% → proceeds | anyone |
| `flushStakerFees()` :112 | — | pushes `stakerFees` to `DogeStaking` | anyone |
| `DogeDEX.withdraw()` :365 | — | own `proceeds` | anyone (pull) |
| `DogeProfession.choose(id)` :40 | exactly `fee` | class, once per wallet | anyone |
| `DogeProfession.withdraw()` :64 | — | `proceeds` → treasury | treasury only |
| `DogeStaking.stake()` :74 | `msg.value` | stake + **all of `residual`** if any | anyone |
| `unstake(a)` / `claim()` :89/:102 | — | principal / harvested rewards | staker |
| `receive()` / `notifyReward()` :33/:37 | DOGE | becomes reward for current stakers (or `residual`) | anyone |
Only `mint` creates value without a gameplay input (known, D-104). Every other path is backed by DOGE or an NFT. N1 exact fee holds on
`mint`, `choose`, listing `buy`; pool buys take `≥ quote` with refund to proceeds (documented).

**Pass 2 — attacks.** CEI + `nonReentrant` hold on every value-moving external in all four contracts (state written before `call`/`transferFrom`;
`_safeMint` is last and behind `nonReentrant`). `DogeStaking.receive()` is not guarded but only adds rewards (harmless donation). DEX: duplicate
ids, foreign ids, pool-held ids and burned ids in `addLiquidity`/`list`/`sellToPool` all revert in OZ v5 `transferFrom` (`from` must be owner);
reserves are internal (`p.doge`, `p.ids`), so donations cannot inflate shares; `y > 0` whenever `shares > 0` (floor in `removeLiquidity`);
round trips lose DOGE; D-022 regressions pass. Findings: S1-1, S1-2, S1-3, S1-4, S1-6, S1-8.
**Pass 3 — solvency (N2).** DEX traced exact: `balance == Σ p.doge + Σ proceeds + stakerFees` across all 9 paths (no path breaks it).
DogeItems: `balance == accruedFees`. DogeProfession: `balance == proceeds`. DogeStaking: rounding direction not fully proven (S1-7).
Test coverage gaps: S1-7.

## Earlier findings re-checked
| ID | Verdict | Evidence |
|---|---|---|
| S0-1 (json/script say 0.1 DOGE fee) | CONFIRMED + EXTENDED | `deployments/6281971.json` `"mintFee": 100000000000000000`; `Deploy.s.sol:20` `vm.envOr("MINT_FEE_WEI", uint256(0.1 ether))`; and the script never calls `setStakingPool` (see S1-6). Live value still unverified (no RPC). |
| D-104 known gap (permissionless mint) | EXTENDED | Not re-reported; consequences for the DEX and gear in S1-5. |
| S0-2, S0-3, S0-4 | OUT OF SCOPE | Docs/game line cap; no contract impact. |
| D-022 audit (zero-share theft, slippage, pagination) | CONFIRMED fixed | `test_Audit_*` 4 tests pass in the full run; code at `DogeDEX.sol:261-273, 295-296, 332`. |

## Findings
### S1-1 · MEDIUM · Just-in-time staking takes most of the pending fee pile in one transaction
- Law: N5 (honest, pro-rata PonziFi), N2 fairness   - Where: `contracts/src/DogeStaking.sol:74-84,89-100`, `DogeDEX.sol:112-118`, `DogeItems.sol:96-114`   - Proof: TRACED
- Evidence: fees are not streamed; they wait in `DogeDEX.stakerFees` and `DogeItems.accruedFees` until anyone calls the permissionless
  `flushStakerFees()` / `withdrawFees()`. `stake()` has no lock and no fee; `unstake(uint256)` and `claim()` work in the same block.
- Failure scenario (hops): attacker contract, one tx: `stake{value: B}()` → `dex.flushStakerFees()` → `items.withdrawFees()` (both push into
  `receive()` → `_addReward`, `accRewardPerShare += r·1e12/(T+B)`) → `claim()` → `unstake(B)`. With T = 10 DOGE staked by honest players,
  B = 990 DOGE and 50 DOGE of pending mint fees (80% = 40 DOGE to stakers), the attacker gets 39.6 DOGE and long-term stakers 0.4 DOGE.
  Capital comes back in the same tx, so the only cost is gas.
- Fix (smallest): in v2, sync the sources inside `stake/unstake` (pull pending fees before changing `totalStaked`) and keep the §3 deposit/withdraw
  fee (1%+1% makes JIT unprofitable unless pending fees > 2% of the whole stake). Add "auto-sync sources on every stake change" to v2 §3.
  - Lane: BRAIN   - Contracts: plan item (`CONTRACTS_V2_PLAN.md` §3)

### S1-2 · MEDIUM · A 1-wei stake takes the whole `residual` (all fees that arrived while nobody staked)
- Law: N5, N0 (gets a pile for ~nothing spent)   - Where: `contracts/src/DogeStaking.sol:45-46,79-83`   - Proof: PROVEN (behaviour) + TRACED (1 wei)
- Evidence: `_setDebt(msg.sender); // debt set BEFORE folding residual, so this staker is entitled to the orphaned rewards` then
  `accRewardPerShare += (residual * PREC) / totalStaked;`. `test_RewardWithNoStakersBecomesResidualThenPaid` PASS: 1 DOGE residual → `pendingRewards(alice) == 1 ether` after she stakes.
  Nothing in `stake()` bounds the amount, so the same holds for `msg.value = 1`.
- Failure scenario: staking empty (start, or everyone left) → 100 mints → `withdrawFees()` sends 80 DOGE to staking → `residual = 80 ether`.
  Bot watching the mempool stakes 1 wei right after, `claim()` → 80 DOGE. Long-term stakers who join a block later get 0.
- Fix (smallest): send residual to treasury, or stream it over time, or require a minimum first stake. Add to v2 §3 (residual rule + invariant term already listed).
  - Lane: BRAIN   - Contracts: plan item (§3)

### S1-3 · MEDIUM · DogeItems owner can redirect or freeze the stakers' 80% of mint fees at any time
- Law: N5 (stakers' share), N3 (pull payments for treasuries), owner powers   - Where: `contracts/src/DogeItems.sol:96-119,126-130`   - Proof: PROVEN (redirect) + TRACED (freeze)
- Evidence: `function setStakingPool(address s) external onlyOwner { emit ...; stakingPool = s; }` — no check, no delay. `test_WithdrawFeesWithStakingPoolSplit`
  PASS: an arbitrary EOA (`makeAddr("stakingPool")`) set as pool receives exactly 80% of the fee. `withdrawFees` pushes to both
  recipients in one tx: `if (!ok1) revert TransferFailed(); ... if (!ok2) revert TransferFailed();`.
- Failure scenario: (a) owner calls `setStakingPool(ownerEOA)` (or `0` → 100% treasury) before `withdrawFees()` → all accrued mint fees skip
  stakers; the landing/skill promise "80% DogeStaking" is broken silently except for one event. (b) `setTreasury(contractWithoutReceive)` or a
  reverting pool → every `withdrawFees()` reverts, so the stakers' share is stuck too, until the owner changes it.
  `DogeDEX.stakingPool`/`treasury` are immutable, so only DogeItems has this power.
- Fix (smallest): v2 DogeItems: `stakingPool` immutable (or 2-step timelocked change) and per-recipient pull balances (`owed[recipient]`), so one
  bad recipient cannot block the other. Add to v2 §2 "Fee route".   - Lane: BRAIN   - Contracts: plan item (§2)

### S1-4 · LOW · `setMintFee` has no bounds: 0 makes minting free, any value is allowed
- Law: N1 ("owner-settable only with event + hard maximum"), N0   - Where: `contracts/src/DogeItems.sol:121-124`   - Proof: PROVEN (unbounded set) + TRACED (0)
- Evidence: `function setMintFee(uint256 fee) external onlyOwner { emit MintFeeChanged(mintFee, fee); mintFee = fee; }`; `test_OnlyOwnerAdmin` PASS sets `0.2 ether` with no limit.
  Constructor takes any `fee` too (`:61-64`).
- Failure scenario: `setMintFee(0)` → `mint` with `msg.value == 0` passes `:80` → unlimited free NFTs (breaks N0 even more than D-104). Users
  are protected from a surprise raise only by the exact-fee check (a signed tx with the old fee reverts — good).
- Fix (smallest): `MIN_FEE > 0` and `MAX_FEE` constants checked in constructor and setter. v2 §2 / §7 numbers.   - Lane: BRAIN   - Contracts: plan item (§2)

### S1-5 · MEDIUM · EXTENDS D-104: permissionless mint caps every DEX pool price at the mint fee and makes on-chain gear progression flat
- Law: N0, N4, CLAUDE.md §4 (NFT items: owning gear = wearing it)   - Where: `contracts/src/DogeItems.sol:68-86`, `DogeDEX.sol:224-230,327-340`   - Proof: TRACED
- Evidence: `maxLevel(HAMMER) == 4` and `mint` charges the same `mintFee` for `HAMMER LV4` as for `LV1`; `sellToPool` pays `floor(x/(y+1))·0.98 − 1%` to anyone holding a matching NFT.
- Failure scenario: (1) Pool HAMMER LV4 with 3 items + 9 DOGE → `sellQuote ≈ 9/4·0.98·0.99 = 2.18 DOGE`. A bot loops `mint{1 DOGE}(bot,1,4)` → `sellToPool` while
  `sellQuote > mintFee + gas`, draining LP DOGE until the item price is ≈ 1.03 DOGE. So LP DOGE always leaks to minters above that price, and no
  pool or listing can hold a price above ~mintFee. (2) `swordLv/armorLv` read the best owned NFT, so any wallet "wears" the top hammer and armor
  for 2 DOGE without playing.
- Fix (smallest): already v2 §2 (`mintBase` only base items + `craft` by burning, caps). Add to §2 "Why": "DEX pools of high tiers are drained by
  mint-and-sell while v1 is live", and in §4 warn LPs not to seed v1 pools above the mint fee.   - Lane: BRAIN   - Contracts: plan item (§2, §4)

### S1-6 · LOW · Deploy script does not wire `setStakingPool` and defaults to the old 0.1 DOGE fee
- Law: N2/N5 (fee route as documented), T5 (one source of truth)   - Where: `contracts/script/Deploy.s.sol:12,20,25,30-31`   - Proof: TRACED
- Evidence: `uint256 fee = vm.envOr("MINT_FEE_WEI", uint256(0.1 ether));`, `items = new DogeItems(fee, treasury);`, `staking = new DogeStaking();` — no
  `items.setStakingPool(address(staking))` anywhere in the script (grep: only the test calls it). D-071 says the live wiring was a manual call.
- Failure scenario: `forge script ... --broadcast` on anvil (`?chain=local`) or a redeploy → mint fee 0.1 DOGE and 100% of mint fees to treasury,
  while the skill/landing say 1 DOGE and 80% stakers; `deployments/*.json` records the wrong fee (S0-1).
- Fix (smallest): v2 deploy script: default `1 ether`, call `items.setStakingPool(address(staking))` inside the broadcast, assert both before writing the json.
  - Lane: BRAIN   - Contracts: plan item (§6 phase 4 "deploy script v2")

### S1-7 · LOW · N2 solvency is not covered by invariant tests; staking rounding direction is unproven
- Law: N2 ("prove it with a Foundry invariant test"), dogeon-solidity §4 checklist   - Where: `contracts/test/DogeDEX.t.sol:243-271`, `contracts/test/DogeStaking.t.sol:90-106`, `DogeStaking.sol:54-64`   - Proof: TRACED (gaps) / SUSPECTED (rounding)
- Evidence: no `StdInvariant`/`invariant_*` anywhere (grep). DEX fuzz checks only `assertGe(address(dex).balance, x + dex.proceeds(bob), "insolvent");` —
  one pool, no add/remove LP, no listings, ignores `proceeds(treasury)`, `proceeds(alice)`, `stakerFees`. Staking fuzz has one reward, never calls `claim()`, and
  only checks `assertLe(address(st).balance, rw + 2)` (an upper bound — it cannot catch a shortfall).
  Per-user payout is `floor(s·A_end/P) − floor(s·A_start/P)`, which can exceed the exact share by < 1 wei per stake segment, while the accumulator floor leaves dust in the other direction.
- Failure scenario (suspected): many stakers with odd amounts and many small rewards → Σ claimable exceeds balance by a few wei → the last
  `unstake`/`claim` hits `TransferFailed` (`_pay` :112-115). Would be proven by `invariant_StakingSolvent`.
- Fix (smallest): add handler-based invariants (runs ≥ 256, depth ≥ 50): `invariant_DexSolvent: balance == Σp.doge + Σproceeds + stakerFees`;
  `invariant_StakingSolvent: balance ≥ totalStaked + Σ pendingRewards + residual` (and every user can `claim`+`unstake`); `invariant_ItemsFees: balance == accruedFees`;
  `invariant_ProfessionFees: balance == proceeds`. If the staking one fails, round pending down or cap `_pay` at balance. v2 §6 phases 2–3 already ask for this; extend to v1 tests now.
  - Lane: BRAIN   - Contracts: plan item (§3 invariant, §6) — tests only, no contract code for v1

### S1-8 · LOW · `dogeUsd()` can revert despite "never reverts"; `poolTvlUsd` uses a stale price
- Law: CLAUDE.md §4 Oracle (display only), honest UI   - Where: `contracts/src/DogeDEX.sol:344-361`   - Proof: SUSPECTED (revert) / TRACED (stale)
- Evidence: `try dogeUsdFeed.latestRoundData() returns (...) {...} catch { return (0, 0, false); }` — a feed with no code or with short/malformed return data fails in
  the caller's ABI decode, which `try/catch` does not catch. `poolTvlUsd`: `(uint256 p,,) = dogeUsd(); return (2 * _pools[key].doge * p) / 1e18;` ignores `fresh`.
  `answeredInRound`/`decimals()` are not checked (8 assumed). Feed is immutable.
- Failure scenario: if the configured feed address has no code (wrong env `DOGE_USD_FEED`, or a chain where RedStone is absent), every `dogeUsd()`
  and `poolTvlUsd()` call reverts; with an old price, TVL shows a stale USD number with no flag. Swaps are unaffected (prices come from reserves).
  `test_OracleFreshStaleBroken` covers revert/zero/old feeds that have code, not a code-less address.
- Fix (smallest): `if (address(dogeUsdFeed).code.length == 0) return (0,0,false);` and return 0 from `poolTvlUsd` when `!fresh`. v2 §4 DEX redeploy.
  - Lane: BRAIN   - Contracts: plan item (§4)

### S1-9 · LOW · Hygiene: single-step ownership, silent profession withdraw, stale comments
- Law: docs hygiene, N3 events   - Where: `DogeItems.sol:6,15,18`, `DogeProfession.sol:64-70`, `Deploy.s.sol:12`, `DogeItems.sol:164-180`   - Proof: TRACED
- Evidence: `Ownable` (not `Ownable2Step`; `renounceOwnership` inherited) → a typo in `transferOwnership` or a renounce freezes fee/pool forever.
  `DogeProfession.withdraw` emits no event and succeeds with `proceeds == 0` (sends 0). Comment `keep in sync with ITEM_TYPES in index.html` — table lives at `src/game.js:729`.
  `_color` has no `MOON_BISCUIT` branch (falls to gold `#f0c030`).
- Fix (smallest): v2: `Ownable2Step`, `Withdrawn` event + `NothingToWithdraw` in Profession, fix comments.   - Lane: BRAIN   - Contracts: plan item (§2, §4)

### S1-10 · INFO · NFTs sent to the DEX by plain `transferFrom`, and forced DOGE, are stuck forever
- Law: INFO   - Where: `contracts/src/DogeDEX.sol:14-16` (no admin, no rescue), no `receive` in DogeDEX/DogeItems   - Proof: TRACED
- Evidence: reserves are internal (`p.ids`, `p.doge`), so an NFT transferred directly (not via `list/addLiquidity/sellToPool`) is owned by the DEX but in no list;
  `safeTransferFrom` to the DEX reverts (no `onERC721Received`). This is also why donation/inflation attacks fail — good — but user mistakes are unrecoverable.
- Fix (smallest): none for v1 (the original sender is not recorded on chain, so a safe rescue is not possible); say in the UI and docs "only send items to the DEX through its rows".
  - Lane: BRAIN   - Contracts: no (doc) / optional plan item (§4)

## Not checked (and why)
- Live on-chain state (actual `mintFee`, `stakingPool`, `owner`, balances, whether the old DogeDEX from before D-071 still holds user NFTs/DOGE): no RPC by rule. Stage 6 or the user's `scripts/e2e-chikyu.sh` can confirm.
- OpenZeppelin library code under `contracts/lib/` (pinned dependency; behaviour of OZ v5 `transferFrom`/`_update` used from memory of v5 semantics, consistent with passing `test_CannotListOthersItem`).
- Staking rounding (S1-7) not proven: proving needs a new test file, which this read-only stage may not add.
- `src/mocks/MockPriceFeed.sol`: test/local only, not deployed on Chikyū (Deploy uses it only when `chainid == 31337`).

## Handoff to the next stage
Contract facts stage 2 must check the game against (`src/game.js` CHAIN 674-885):
- **Selectors:** all 30 `SEL` entries match `cast sig` (see Scope). `DogeItems.withdrawFees()` (`0x476343ee`) is NOT in `SEL`: mint fees only reach stakers when someone else calls it — check whether `syncDexFees`/SYNC row should also call it (S1-1/S1-2 timing).
- **DogeItems.mint(address to,uint8 type,uint8 level)** payable: reverts `ZeroAddress` (to=0), `BadItem` (level 0 or > `maxLevel`: HAMMER 4, ARMOR 2, types 3–15 → 1, else 0), `WrongFee(sent,fee)` unless `msg.value == mintFee()` exactly. Game must read `mintFee()` live, never hardcode 0.1/1 (S0-1, S1-4). Mint uses `_safeMint` (contract wallets need `onERC721Received`).
- **burn(uint256)**: owner/approved only; deletes item data.
- **DogeDEX**: `list(id,price>0)` needs approval, escrows; `delist` seller only; `buy(id)` needs `msg.value == price` exactly (seller nets price − 1%).
  `addLiquidity(uint256[] ids, uint256 minShares)`: all ids same (type,level) else `MixedPool`; first deposit `msg.value ≥ 0.001 DOGE` → `n·1e18` shares; later
  `required = ceil(n·x/y)`, excess → `proceeds` (not refunded directly). `removeLiquidity(key, amount, minItemsOut, minDogeOut)`: DOGE goes to `proceeds`.
  `buyFromPool(key)`: send `≥ buyQuote(key)`; reverts `PoolTooThin` if y < 2; excess → `proceeds`. `sellToPool(id, minOut)`: `ZeroPayout` if pool payout 0, `Slippage` if net < minOut.
  All DOGE payouts are pull: player must call `withdraw()`; fees: 2% LP (in reserves) + 1% protocol (0.2% treasury / 0.8% `stakerFees`). Check that the game passes non-zero
  `minShares`/`minOut`/`minDogeOut` (it computes 99% for addLiquidity at `src/game.js:835`; sellPool passes `p.sell` as minOut at `:842` — stale quote ⇒ revert, not loss).
- **DogeProfession.choose(uint8 1..3)**: exact `fee()` (json says 0.05 DOGE, not re-verified), `AlreadyChosen` forever, `BadProfession` otherwise.
- **DogeStaking**: `stake()` payable `>0`; `unstake(uint256)` reverts `NotEnoughStaked`/`ZeroAmount`; `claim()` reverts `ZeroAmount` if nothing; no lock, no fee. Game must not show APY/“earn” (N5).
- Known chain-side abuse the game cannot stop (do not re-report as game bugs): D-104 + S1-5 (mint any tier for the fee), S1-1/S1-2 (JIT and residual sniping).
- Stage 6: S1-3 and S1-6 depend on the live owner/stakingPool state — verify with a read-only `cast call` only if the verifier is allowed RPC.
