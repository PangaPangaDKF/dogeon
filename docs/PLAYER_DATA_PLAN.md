# Player data, login and the wallet: Plan (PLAN ONLY, nothing built yet)

Status: proposal, 2026-11-14 (D-106). Related rules: `dogeon-solidity` N6 (wallet safety), N7 (the game never needs a wallet).

## Today (facts)
- Progress lives only in memory: a page reload starts a new game. No `localStorage`, no server save, no login.
- What survives already: NFTs (DogeItems), the class oath (DogeProfession), staked DOGE (DogeStaking), all on chain per wallet.
- The wallet is optional (N7): you can play the whole loop without one; minting, DEX, staking and the class oath need it.

## Options
| # | How | Login | Cross-device | Cost | Cheating | Fits rules |
|---|---|---|---|---|---|---|
| A | **Browser save** (`localStorage`, autosave every ~10 s + on quest/death) | none | no (one browser) | tiny, client only | a player can edit their own save (single-player only matters to them) | N7 ✅ |
| B | **Sign-In With Ethereum** (EIP-4361): the wallet signs a fixed readable message (domain, nonce, expiry), free, no gas; the relay keeps a session and stores the save keyed by address (Fly volume, JSON/SQLite) | wallet signature | yes | server storage + endpoints + tests | the client still reports its own progress unless the server validates it | N6 ✅ (fixed SIWE text only), N7 ✅ if optional |
| C | **Save on chain** | wallet tx | yes | gas on every save | same | too heavy; only NFTs/class/stake belong on chain |
| D | **Server-authoritative inventory** (the relay simulates gathering, kills, crafting) | SIWE | yes | large rewrite | blocks cheating; also enables `CONTRACTS_V2_PLAN.md` option B (signed mint vouchers) | best long-term |

## Recommendation
1. **Now:** A (guest autosave in the browser). Small, offline-safe, keeps N7: anyone plays in one click.
2. **Next:** B as an optional "SIGN IN TO SAVE" row at the Sphinx: one free signature, then the save follows the wallet across
   devices. Wallet-first players get persistence; guests keep playing. Data kept: wallet address + game state only (no email).
3. **Later, with contracts v2:** D, so the server can vouch for materials and sign mint vouchers (N0 for wood/steel on chain).

## Decision for the user
- Keep N7 (wallet optional) or make the wallet required to play? Recommendation: keep it optional; require a signature only to
  save across devices. A required wallet adds a big first-minute drop-off for a free testnet game.
- Approve A now? (It is a game change: autosave + "NEW GAME / CONTINUE" on the title screen.)
