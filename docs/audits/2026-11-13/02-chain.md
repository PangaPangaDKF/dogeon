# Stage 2 — Game ↔ chain integration · 2026-11-13 · HEAD a3bbc4e
## Scope covered
- Read in full: CHAIN section `src/game.js:674-885` (`CHAIN`, `wallet`, `eth`, `walletErr`, `switchChain`, `refreshBal`, `hookWallet`,
  `connectWallet`, `disconnectWallet`, `chainTick`, `checkAuthWallet`, `walletRows`, `DEV_LOCAL`, `MASTER_ADDR`, `IS_MOD`, `isMod`, `CONTRACTS`,
  `SEL`, `ITEM_TYPES`, ABI helpers `W32/A32/words/arrAt/toWei/fromWei/unpack`, `chainData`, `ecall`, `etx`, `refreshChain`, `chooseProfession`,
  `stakeDoge/unstakeStake/claimStakeRewards/syncDexFees`, `chainAct`, `ensureApproved`, `nftBest/swordLv/armorLv`, `GEAR_STATS/RARITY/BUFFS/itemRoll/gearStats`,
  `addCredit/creditOk/takeOffChain/putBack`, `mintNft`, `useNft`, `burnAndReroll`, `listNft…withdrawProceeds`, `MINTABLE`, `stakeMenu`, `marketMenu`).
  UI callers: `professorMenu` 906-921, `RECIPES` 923-931, `mintRows` 932, `shopMenu` 936, `bankMenu` 966, `elderMenu` 1021, `dogeMasterMenu` 1031,
  `modMenu` 1036, `invMenu` 1094, `update` mod key 1252, `syncMaxHp/syncMaxMp` 470/472, `hurtPlayer` 558-564, `respawn` 566-572,
  MULTIPLAYER `netBoss` (for the handoff only).
- Contract side re-checked for every call the game makes: `DogeItems.mint/burn/inventoryOf/withdrawFees`, `DogeDEX.list/delist/buy/activeListings/poolInfo/
  allPools/addLiquidity/removeLiquidity/buyFromPool/sellToPool`, `DogeProfession.choose/withdraw`, `DogeStaking` public vars.
- `cast sig` for all 30 `SEL` entries + `withdrawFees()`: every value matches (e.g. `0x352926a8 mint(address,uint8,uint8)`,
  `0xc5bb3168 addLiquidity(uint256[],uint256)`, `0xf88bf15a removeLiquidity(uint256,uint256,uint256,uint256)`, `0xf94e349d choose(uint8)`,
  `0x98807d84 staked(address)` = `SEL.stakedOf`; `cast sig "stakedOf(address)"` → `0xaf500ba3`, so the label differs from the contract name but the bytes are right),
  `0x476343ee withdrawFees()` (not in `SEL`).
- ABI layouts checked by hand: `addLiquidity` calldata `W32(64)+W32(min)+W32(len)+ids` = correct head offset 0x40; `poolInfo` return order
  `(doge,nItems,shares,myShares,buyPrice,sellPrice)` = game's `w[0..5]`; `activeListings` `(packed,prices,sellers)` = `arrAt(lw,0/1/2)`.
- `CONTRACTS['0x5fdaf3']` (`src/game.js:727`) = `contracts/deployments/6281971.json` addresses (items, dex, prof, stake): match.
- `node tests/sim.mjs` → exit 0, `✓ 0 failed, 0 warnings (seed 4242)`; the anvil scenario printed
  `SKIP  chain e2e: anvil not running or contracts not deployed (see contracts/README.md)`.
- Scratch script (outside the repo) evaluating the game's own `RARITY/BUFFS/itemRoll` (lines 802-807) for token ids 1..500 (output in S2-2).

## Earlier findings re-checked
| ID | Verdict | Evidence |
|---|---|---|
| S0-1 (json says 0.1 DOGE) | CONFIRMED (no game impact) + EXTENDED | `refreshChain` reads `mintFee()` live (`:751-763`, `chainData.fee=words(fee)[0]`). But `burnAndReroll` (`:830`) still hardcodes `chainData.fee||10n**17n` (0.1 DOGE) → S2-7. |
| S0-2, S0-4 | OUT OF SCOPE | Docs only. |
| S0-3 (25 lines left) | CONFIRMED | Fixes below that add code should go to a new `src/*.js`. |
| D-104 game guard | CONFIRMED, with one hole | `mintNft` throws without `'credit'` or a `FOOD_TYPE` source (`:818`); sim `PASS no free mint — … 0 transactions` and `PASS market no free mint`. Hole: `?mod=1` (S2-1). |
| S1 selectors (30 match) | CONFIRMED | Re-ran `cast sig` (Scope). |
| S1-1 / S1-2 (JIT + residual sniping) | EXTENDED | The game never calls `DogeItems.withdrawFees()` (no selector, grep `withdrawFees\|476343ee` in `src/game.js` → 0 hits), so mint fees (the main reward source) sit in DogeItems until an outsider flushes them — exactly the timing S1-1/S1-2 exploit. S2-6. |
| S1-3 (owner can redirect 80%) | OUT OF SCOPE (contract) | Game text never mentions mint fees at all (S2-5). |
| S1-4 (fee can be 0) | EXTENDED | If fee became 0: rows show `0 DOGE`, `mintNft` sends 0 (ok), but `burnAndReroll` sends 0.1 DOGE → `WrongFee` after the burn already landed (S2-3). |
| S1-5 (any tier for the fee) | CONFIRMED + EXTENDED | Game amplifies it: every owned non-food NFT adds its rolled buff, uncapped (S2-2). |
| S1-6 (script not wired) | CONFIRMED no game impact | `CONTRACTS['0x7a69']` has `prof:'',stake:''`; game reads the live fee on anvil too. |
| S1-7, S1-9 | OUT OF SCOPE | Contract tests / hygiene. |
| S1-8 (`dogeUsd` may revert) | CONFIRMED handled in game | `refreshOracle` falls back feed → adapter; sim `PASS oracle fallback — … from LAST PUSH (feed reverted as stale)`. |
| S1-10 (plain transfers stuck) | CONFIRMED safe in game | Game sends NFTs to the DEX only through `list/addLiquidity/sellToPool`; no `transferFrom` selector in `SEL`. |

## Findings
### S2-1 · HIGH · `?mod=1` turns any browser into the master mod menu: free materials → craft → mint (N0 bypass), god mode, boss "won"
- Law: N0 (game side, D-104), CLAUDE.md §4 (death/camp/hardcore rules), dogeon-mission scope   - Where: `src/game.js:724-725`, `:1036-1044`, `:1252`, `:776`   - Proof: TRACED
- Evidence: `const IS_MOD=(()=>{try{return /[?&](mod|master)=1\b/.test(location.search);}…` and
  `const isMod=()=>IS_MOD||(wallet.connected&&wallet.addr&&wallet.addr.toLowerCase()===MASTER_ADDR);`. `update`: `if(isMod()&&kp('m'))modMenu();`.
  Mod rows: `GIVE 99 ALL MATERIALS` (`matAdd('wood',40);matAdd('stone',40);P.whisk=99;P.steel=99`), `GOD MODE` (`P.god` → `hurtPlayer` returns at `:559`),
  `INSTA-KILL BOSS & SUMMON DOGEMASTER` (`state.won=true`), `GIVE MAX GEAR STATS`. `chooseProfession`: `if(chainData.profession&&!isMod())` → mod skips the lock check.
- Failure scenario (hops): any player opens `https://…/?mod=1` → presses M → GIVE 99 MATERIALS → forge `CRAFT HAMMER LV2` (`:940` burns the gifted mats,
  `addCredit(1,2)`) → `MINT HAMMER LV2 NFT` → `mintNft(1,2,'credit')` passes `creditOk` → real mint. Repeat (after a mint `P.sword` drops to 1, so the
  recipe reappears) → unlimited crafted NFTs with zero gameplay. The D-104 rule "every mint spends materials" is gone for anyone who types 4 characters.
  God mode also applies in multiplayer PvP (handoff). With mod on and a wallet already sworn, the oath row sends `choose()` → reverts `AlreadyChosen`, gas lost.
  No on-chain privilege is attached to `isMod` (gate is client-side only; checked: no tx path besides the class-lock skip reads `isMod`).
- Fix (smallest): gate mod on a dev build only: `IS_MOD = DEV_LOCAL && /[?&]mod=1/…` (and keep the `MASTER_ADDR` wallet path, which is still
  client-spoofable, so treat it as a convenience, not security). Keep the class-lock check for mods too.   - Lane: BRAIN   - Contracts: no

### S2-2 · HIGH · `gearStats` sums the random roll of EVERY owned NFT with no floor or cap: one cursed item makes Max HP ≤ 0; copies stack without limit
- Law: CLAUDE.md §4 (NFT items: owning gear = wearing it; healing/death rules), N4 (no dupes: an item "worn" many times)   - Where: `src/game.js:808`, `:470`, `:560`, `:580`   - Proof: PROVEN (rolls) + TRACED (effect)
- Evidence: `for(const it of chainData.inv){…if(it.type!==3&&it.type!==4){const r=itemRoll(it.id);s[r.buff.s]+=r.amount;}}` and
  `syncMaxHp(){…base=60+(c?c.hp:0)+P.hpUps*15+gearStats().hp…P.maxHp=base;…else P.hp=Math.min(P.hp,P.maxHp);}`. Death only checks `P.hp<=0` inside `hurtPlayer` (`:564`).
  Running the game's own `itemRoll` (scratch script): `#61 UNCOMMON: HANGOVER 420 hp -63`, `#126 RARE: HANGOVER 420 hp -96.6`,
  `hp-curse ids in 1..500: 31 of which <= -45: 12`; `#3 RARE: NICE 69 atk 158.7`, `#5 COMMON: NICE 69 atk 69`, `atk>=60 count in 1..500: 35`.
- Failure scenario: (a) a HEALER (45 base) mints anything that lands on token #61 → `P.maxHp = 45-63 = -18`, `P.hp=-18`; rest caps at 60% of a negative
  number, food is `min(maxHp,…)`, respawn sets `ceil(-18*0.35) = -6` → every hit kills; even a WARRIOR (85) dies this way with #126. The only escape is
  listing/selling the NFT. ~2.4% of ids (≤ -45) do this to a healer. Non-integer Max HP (`-96.6`) also leaks into the HUD.
  (b) Crafting HAMMER LV2 repeatedly (2 steel + 1 wood + 1 DOGE each; `takeOffChain` drops `P.sword` to 1 so the recipe reappears) gives N hammers, each
  adding its own roll: `swordLv` takes the max, but `gatk()` adds every roll → a handful of mints gives +69…+158 ATK on top of `SWORD_DMG`. With
  S1-5 (console mint) it is just DOGE → power.
- Fix (smallest): one item per slot: per type keep only the best-rolled owned item (or only the item `nftBest` picks), clamp the sum
  (`hp ≥ -(base-1)`, i.e. `P.maxHp = Math.max(10, Math.round(base))`), and round stats. Add a sim case with token #61 on a healer.   - Lane: BRAIN   - Contracts: no

### S2-3 · MEDIUM · DogeMaster re-roll burns first and mints in a second tx: a rejected or reverted mint loses the NFT for nothing
- Law: N4 (failed tx path must not lose the input), N1 (fee from chain, not hardcoded)   - Where: `src/game.js:830`, `:1031-1035`   - Proof: TRACED
- Evidence: `function burnAndReroll(it){return chainAct(…,async()=>{await etx(addrs().items,SEL.burn+W32(it.id),0);await etx(addrs().items,SEL.mint+A32(wallet.addr)+W32(it.type)+W32(it.level),chainData.fee||10n**17n);});}`
- Failure scenario: player sacrifices a LEGENDARY-cursed HAMMER LV4 → burn mines → wallet pops the 1 DOGE mint → player rejects (4001), lacks 1 DOGE,
  or the fee changed (S1-4: if `mintFee()` is 0, `0n||10n**17n` sends 0.1 → `WrongFee`) → message `YOU REJECTED IT IN THE WALLET.`; the hammer is gone,
  no new one, nothing tells the player the burn already happened. Also burns food/charm NFTs the same way (all of `myFree()` are listed).
- Fix (smallest): check `wallet.bal >= fee` before the burn, use `chainData.fee` only (no fallback), and on a failed second step show
  `BURN DONE, MINT FAILED: #id IS GONE` — or better (plan item) a single `DogeItems.reroll(id)` that burns + mints atomically (v2 §2 "craft by burning").
  - Lane: BRAIN   - Contracts: plan item (atomic reroll) / no (UI guard)

### S2-4 · MEDIUM · Bag menu offers `[USE, BURNS]` on DOGE gear NFTs (types 7–15): it burns them and gives nothing
- Law: CLAUDE.md §4 (owning gear = wearing it), N4 (no loss on a game path)   - Where: `src/game.js:1109`, `:824-828`, `:845`   - Proof: TRACED
- Evidence: `invMenu`: `…(f?`[EAT …, BURNS]`:it.type<=2?'(OWNED = EQUIPPED)':'[USE, BURNS]'),isNft:true,act:it.type<=2?()=>…:()=>{useNft(it);…}` — only
  types 1–2 are treated as gear. `useNft` then `etx(…SEL.burn…)` and applies `if(food)… else if(it.type===5)… else if(it.type===6)…` → nothing for 7–15.
- Failure scenario: player buys a `DOGE SWORD` (type 7) listing on the Sphinx DEX → opens I → presses Enter on `NFT #N DOGE SWORD [USE, BURNS]` expecting
  to equip it → NFT burned, +4 ATK and its roll gone. Side note: no recipe makes types 7–15 (`RECIPES` only has `nft:[1,x]`, `[2,x]`, `[5,1]`, `[6,1]`) and
  `MINTABLE` is referenced only by `tests/sim.mjs:684`, so in-game these items exist only via console mint (D-104/S1-5) or the DEX.
- Fix (smallest): treat `GEAR_STATS[it.type]` like types 1–2 (`(OWNED = EQUIPPED)` info row, no burn); drop or wire `MINTABLE`.   - Lane: BRAIN   - Contracts: no

### S2-5 · MEDIUM · Staking menus use "EARN"/"YIELD" language and carry no testnet / no-value / not-advice line; they describe only the DEX fee
- Law: N5 (no "earn" language; every menu keeps "testnet tokens, no real-world value, not financial advice"), T1 truth   - Where: `src/game.js:779`, `:781`, `:849`, `:853-854`, `:970`   - Proof: TRACED
- Evidence: `'DOGE STAKING: EARN 0.8% OF DEX FEES'`, `` `STAKE < ${amt} > DOGE (EARN 0.8% FEES)` ``, `'STAKED … DOGE. NOW EARNING DEX FEES.'`,
  `'CLAIMED DEX-FEE REWARDS. SUCH YIELD.'`, `'TRADING DRIVES THE YIELD.'`, Sphinx row `'ON-CHAIN STAKING: EARN 0.8% OF DEX FEES'`. No row in `stakeMenu`
  contains TESTNET / NO VALUE / NOT FINANCIAL ADVICE (grep). `'…PROJECT KEEPS 0.2%.'` omits that stakers also get 80% of every 1 DOGE mint fee (and the treasury 20%).
- Failure scenario: a player reads the Sphinx menu as a yield product ("earn 0.8%") with no disclaimer; the real main reward source (mint fees) is not mentioned,
  so the menu is both promotional and wrong about where rewards come from.
- Fix (smallest): retitle `DOGE STAKING: SHARE OF FEES (TESTNET, NO VALUE)`, replace EARN/YIELD with "SHARE", add one info row
  `TESTNET DOGE, NO REAL VALUE, NOT FINANCIAL ADVICE`, and say "0.8% OF DEX TRADES + 80% OF MINT FEES". Keep lines ≤ 50 chars. Update the sim regex at `PASS stakeMenu row 0`.   - Lane: BRAIN   - Contracts: no

### S2-6 · MEDIUM · The game never flushes mint fees to stakers (`DogeItems.withdrawFees()` has no selector or row); only DEX fees are synced
- Law: N2/N5 (fees reach stakers as documented), S1-1/S1-2 window   - Where: `src/game.js:728` (`SEL`), `:782`, `:858`   - Proof: TRACED (+ `cast sig` `0x476343ee withdrawFees()`)
- Evidence: `syncDexFees` calls only `etx(addrs().dex,SEL.flushFees,0)`; `stakeMenu` shows the SYNC row only `if(chainData.dexFees>0n)`; `refreshChain` reads
  `stakerFeesView` from the DEX but never `accruedFees()` from DogeItems. grep `withdrawFees|476343ee` in `src/game.js` → 0 hits.
- Failure scenario: 50 players each mint once → 50 DOGE sit in `DogeItems.accruedFees`; stakers' `PENDING REWARDS` stays 0 in the game forever; the first
  outsider who scripts `stake → withdrawFees → claim → unstake` (S1-1) or stakes 1 wei into an empty vault (S1-2) takes the pile. Honest in-game stakers
  have no button to make the pile arrive while they are staked.
- Fix (smallest): add `withdrawFees:'476343ee'` and `accruedFees` to `SEL`, read it in `refreshChain`, and make the SYNC row call both flushes (skip either
  that is 0, since `withdrawFees` reverts `NothingToWithdraw`). The contract fix (auto-sync on stake) stays S1-1's plan item.   - Lane: BRAIN   - Contracts: no (plan item already in S1-1)

### S2-7 · LOW · Fee shown/sent from hardcoded defaults before the chain is loaded
- Law: N1 (user sees the true fee before signing; never hardcode 0.1/1)   - Where: `src/game.js:739`, `:741`, `:830`, `:932`   - Proof: TRACED
- Evidence: `chainData={…fee:10n**18n,…profFee:5n*10n**16n…}` (also in `resetChainData`); `mintRows`: `const fee=chainData.loaded?fromWei(chainData.fee)+' DOGE':'FEE'`;
  `mintNft` sends `chainData.fee` regardless of `loaded`; `burnAndReroll` falls back to `10n**17n`; the prof read is in a silent `try{}catch(e){}` (`:764-766`) so a failed read keeps 0.05.
- Failure scenario: player opens the forge right after connect (`refreshChain` still running) → row says `MINT HAMMER LV2 NFT x1 (FEE)` → the wallet asks 1 DOGE
  (default). If the live fee differs the tx reverts and the credit is refunded (safe), but the player signed without seeing the number in-game.
- Fix (smallest): hide/disable mint and oath rows until `chainData.loaded`; drop the `10n**17n` fallback.   - Lane: BRAIN   - Contracts: no

### S2-8 · LOW · Refund edge cases while a mint is pending: stranded credit, lost fish on full bag, fish returned after death
- Law: N4 (refund exactly once, never lose the input on reject/revert), CLAUDE.md §4 death   - Where: `src/game.js:812-814`, `:822`, `:940`   - Proof: TRACED
- Evidence: `catch(e){if(!e.sent||e.reverted){if(src==='credit'){P.credits[k]++;putBack(type,level);}else addToBag(src,1);}throw e;}`; `putBack`: `if(t===2)P.armor=l`;
  `creditOk`: `if(t===2)return P.armor===l`; forge CRAFT rows are not gated by `wallet.busy`.
- Failure scenario: (a) craft ARMOR LV1 → MINT (pending, `P.armor` 1→0) → craft ARMOR LV1 again (`req P.armor<1`) → reject → `credits['2:1']=2`, `P.armor=1`
  → one mint works, then `P.armor=0` hides the second credit forever (one craft's materials lost; no dupe). (b) `PRESERVE RAW FISH` → bag fills while pending →
  revert → `addToBag` returns false, ignored → fish gone. (c) die while pending → bag cleared → revert → fish reappears after death.
- Fix (smallest): block CRAFT while `wallet.busy`; on refund, if `addToBag` fails drop the fish on the ground at the player (or keep it as a credit).   - Lane: BRAIN   - Contracts: no

### S2-9 · LOW · Sim coverage gaps on the money paths
- Law: CLAUDE.md §6, dogeon-solidity §3 step 4   - Where: `tests/sim.mjs` (scenario at ~`:880-935` SKIPs without anvil; `:515-530`, `:584-586`)   - Proof: PROVEN (`SKIP  chain e2e: anvil not running…`)
- Evidence: this run did not execute `useNft` on chain, `listNft`, `buyListing`, `addLp`, `buyPool`, `sellPool`, `removeLp`, `withdrawProceeds` (only inside the
  skipped anvil scenario); mock scenarios cover `chooseProfession`, staking, `delistNft`, mint revert/unknown refund. Not covered anywhere: mint **reject (4001)**
  refund (`!e.sent` path), `burnAndReroll` partial failure (S2-3), gear `[USE, BURNS]` (S2-4), `?mod=1` (S2-1), cursed/stacked `gearStats` (S2-2).
  The mod test checks `g.P.doge !== dogeBefore`, but `P.doge` no longer exists (D-097) → `undefined === undefined`, a check that cannot fail.
- Fix (smallest): add mock-eth scenarios for the five uncovered paths; run the anvil e2e in the release gate.   - Lane: BRAIN   - Contracts: no

### S2-10 · INFO · Wallet safety (N6) and chain params hold
- Law: N6, N7, CLAUDE.md §2 (D-016)   - Where: `src/game.js:677-731`, `:792`   - Proof: TRACED
- Evidence: only `eth_requestAccounts/eth_accounts/eth_chainId/eth_getBalance/eth_call/eth_sendTransaction/eth_getTransactionReceipt/wallet_switchEthereumChain/
  wallet_addEthereumChain/wallet_revokePermissions` are used; no `personal_sign`/`eth_sign`/typed data, no key or mnemonic. `wallet_addEthereumChain` uses `CHAIN`
  (`0x5fdaf3`, `rpc.testnet.dogeos.com`, `dogeos-testnet.l2scan.co`, DOGE 18). `setApprovalForAll` is given only to the DEX, and every DEX pull uses
  `items.transferFrom(msg.sender, …)` (`DogeDEX.sol` list/addLiquidity/sellToPool). Double-submit is blocked: `chainAct` checks and sets `wallet.busy`
  synchronously, and credit/bag checks run inside it. `refreshChain` drops results if the account changed (`wallet.addr!==me`). Offline class pick is free (N7).
  Note: a shared link with `?chain=local` makes the wallet prompt to add "Anvil Local" at `http://127.0.0.1:8545` (user must approve; no funds at risk).
- Fix: none.   - Lane: BRAIN   - Contracts: no

### S2-11 · INFO · Selectors and addresses match; one label drift
- Law: dogeon-solidity §3.8, T5   - Where: `src/game.js:727-728`   - Proof: PROVEN (`cast sig`, Scope)
- Evidence: all 30 `SEL` values = `cast sig`; `SEL.stakedOf` = `0x98807d84` = `staked(address)` (the public mapping), not `stakedOf(address)` (`0xaf500ba3`).
- Fix (smallest): rename the key to `staked` with a comment, or leave it; the bytes are right.   - Lane: BRAIN   - Contracts: no

## Not checked (and why)
- Live chain state (`mintFee`, `fee`, owner, whether `MASTER_ADDR` is the deployer): no RPC by rule.
- The anvil end-to-end scenario (`anvil` not running; starting it is not in the allowed command list), so list/buy/LP/swap/withdraw were checked by reading only.
- `scripts/browser-smoke.sh`, `scripts/e2e-chikyu.sh` (need Chrome / deploy key).
- Wallet quirks where `eth_sendTransaction` throws after broadcast (would be refunded as "not sent"): SUSPECTED only, depends on the wallet; proving needs a real wallet.

## Handoff to the next stage
- **Stage 3 (server):** (1) `netBoss` (`src/game.js` MULTIPLAYER, `m.t==='boss'` with `m.dead`) calls `killEnemy` → `state.won=true` → unlocks DogeMaster (burn+mint rows).
  Check in `server/relay.mjs` that no client can forge a boss death. (2) Death loot `netSend({t:'loot',items})` (`respawn` `:568`) carries materials that feed
  CRAFT → credit → real mint: check the relay caps loot per death and rejects piles from players who did not die (N0 via the relay). (3) `?mod=1` god mode +
  PvP (S2-1): the relay referees PvP; check whether a client that ignores damage can still be "hit" server-side. (4) Confirmed by sim: the wallet address is never sent (`PASS net opt-in … wallet address never sent`).
- **Stage 4 (gameplay):** S2-2 negative Max HP and buff stacking; `P.credits`, `P.sword/armor`, `hpUps` survive death (`respawn :571` clears only mats/bag) — check vs §4;
  sim `P.doge` dead check (S2-9).
- **Stage 5 (landing):** the landing must not use "earn"/APY for staking either (S2-5), and should say rewards come from mint fees (80%) and DEX fees (0.8%).
