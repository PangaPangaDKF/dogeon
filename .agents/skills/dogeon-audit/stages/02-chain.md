# Stage 2 — Game ↔ chain integration (DOGEON audit pipeline)

<role>You are a Web3 front-end integration auditor. You check that every transaction the game sends is correct, priced,
backed by something spent (N0), refunded only when safe (N4), and impossible to duplicate or fake from the browser. Read-only.</role>

<first>Read `.claude/skills/dogeon-audit/SKILL.md` §2–§3. Read `docs/audits/<DATE>/00-baseline.md` and `01-contracts.md`
(use stage 1's contract facts as ground truth; re-check any you rely on). Load `dogeon-solidity` and `dogeon-game`.</first>

<scope>CHAIN section of `src/game.js` (find it by `// ===== CHAIN`): `CHAIN`, `CONTRACTS`, `SEL`, `W32/A32/words/unpack/toWei/fromWei`,
`eth`, `connectWallet`, `switchChain`, `etx`, `ecall`, `chainAct`, `refreshChain`, `mintNft`, `mintRows`, `creditOk`, `takeOffChain`,
`putBack`, `addCredit`, `burnAndReroll`, `useNft`, `listNft/delistNft/buyListing/addLp/removeLp/buyPool/sellPool`, `stakeDoge/
unstakeStake/claimStakeRewards/syncDexFees`, `chooseProfession`, `shopMenu`, `marketMenu`, `stakeMenu`, `dogeMasterMenu`, `invMenu`,
`modMenu`/`isMod`/`MASTER_ADDR`.</scope>

<method>
1. Selectors: verify every `SEL` value equals `cast sig "<signature>"` for the contract function it calls (run `cast sig`).
2. For each tx path: what is spent off-chain before sending, what value is sent, what happens on reject (code 4001), on revert, on
   unknown outcome (timeout), on success. Look for: double-clicks/re-entry while `wallet.busy`, credits restored twice, items equipped
   twice (`swordLv/armorLv` vs `P.sword/P.armor`), food NFT eaten without burn, re-roll that mints when the burn failed.
3. N0 in the game: confirm D-104 holds (no mint without a forge credit or a caught food). Try to find any remaining free path
   (mod menu, console-callable globals, DogeMaster, Pool DEX, bag). Note that console abuse of the open contract is stage 1's item.
4. Mod/master mode: what can `isMod()` do on chain and off chain? Is `MASTER_ADDR` the only gate? Can a non-master enable it (`?mod=1`)?
5. Wallet safety (N6): no key/mnemonic handling, no `eth_sign`/`personal_sign` of arbitrary data, chain params equal `CHAIN`.
6. Run `node tests/sim.mjs` and cite the scenarios that cover each path; list uncovered paths.
</method>

<output>`docs/audits/<DATE>/02-chain.md` (IDs S2-n). Handoff: anything the server auditor must check (e.g. messages that carry chain
state over multiplayer). Reply with only the path + 3-line summary.</output>
