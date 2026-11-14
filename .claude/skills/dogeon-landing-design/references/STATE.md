# Landing state: what's live, the page map, verified facts, open tasks

Updated: 2026-11-14 (D-110). **Update this file in the same commit as any landing change** (RULE L0).

## 1. Live status
- `https://dogeon.lat/` serves `landing.html`; `https://play.dogeon.lat/` serves the game. Last landing deploy: commit `9aa1436`
  (D-101, lore), deployed by BRAIN and verified live. The final phase (L1–L8) was checked in real Chrome: all videos play,
  tx links open, 1280 px and 390 px layouts are correct, no console errors.
- Deploys are BRAIN's job (`fly deploy -a dogeon-game`). LANDING commits, then asks BRAIN on the board.

## 2. Page map (`landing.html`, top to bottom)
| `id` | Section | What it shows | Truth source (re-check here before changing copy) |
|---|---|---|---|
| (hero) | Badge "A PONZIFI MEME GAME · DOGEOS CHIKYŪ TESTNET", headline, 3 CTAs, camp capture, trailer | `assets/screenshots/hero-camp-coin.png` (user's capture, HUD cropped), `assets/video/trailer-720p.mp4` + `.jpg` (35 s, music, controls, no autoplay) | D-090, D-092, D-098, D-100 |
| `heist` | Lore: main Grand Heist + "DOGEON: THE PONZIFI CHAPTER" + degen Elder quote | text only | D-101, rule T10 |
| `characters` | Warrior / Archer / Healer cards + lazy debuff | `CLASSES`, `atkCd`, lazy timers in `src/game.js` | D-086, D-093 |
| `economy` | "ONE CURRENCY: TESTNET DOGE", 80/20 fee card, testnet-only card | D-097 (no in-game DOGE), `DogeItems` fee split | D-100 |
| `mint` | Meme forge + reroll; **Real mints** block (mint + explorer loops, NFT #13/#12 tx links) | `BUFFS`, `RARITY`, `itemRoll`; tx facts below | D-086, D-098 |
| `faucet` | 3-step quickstart + network table | `CHAIN` in `src/game.js` (T7, enforced by landing-check) | D-085 |
| `resources` | Steel, wood, stone, fish | `GATHER_*`, `kp('f')` | D-086 |
| `pvp` | Full-loot rules + "Party up or go solo" (red-tag rival capture) | relay `pvp`/`party`, `netDraw` tag colors | D-093 |
| `party` | Raid cycle: one Cat Lord per room (+50% HP per extra player), returns 60 s after a kill | D-095, relay `onWorld` | D-098 |
| `staking` | PonziFi-satire staking cards | `DogeStaking`, 80% of mint fees, 0.8% of trades | D-090 |
| `npcs` | NPC roster | `NPCS` in `src/game.js` | D-085 |
| `contracts` | 4 live contracts (no price feed row) | `CONTRACTS['0x5fdaf3']` (landing-check) | D-090 |
| `gallery` | Sanctuary coin + 6 cards (title, warrior loop, archer, Cat Lord victory loop, fishing, play together) | `assets/screenshots/*` (HUD-less), `assets/video/warrior|victory.*` | D-091, D-100 |
| `build` | "Come build on DogeOS" + docs / dogeos.com / source links | `docs.dogeos.com`, `github.com/PangaPangaDKF/dogeon` | D-090, D-094 |
| footer | Links + disclaimer "testnet tokens have no real-world value · not financial advice" | rule T8 | D-090 |
Nav (7): Classes, Economy, NFT Mint, Raid, Staking, Get Started, Build.

## 3. Facts already verified (don't re-derive; cite them)
- **Mints:** NFT #13 tx `0x5025f871b37b0a0a88081d0b4798dfc4b9014f007a0b7341b43e1323c2c30767` (block 9,429,362); NFT #12 tx
  `0xda810f92d27f00d59e2b0ea55499607a7ff1fd4cca194b46a23586287c46e1c0` (block 9,429,348). Both status 1, contract DogeItems
  `0xbF858f66251005D1d20c92B9359A7dbD0E6Dd6C4`, value 1 DOGE, Transfer from `0x0` (BRAIN, `eth_getTransactionReceipt`).
- **Meme rolls (`BUFFS`):** BLAZE 420 +420 HP · NICE 69 +69 ATK · LUCKY 777 +77 HP · MUCH 4.2 +0.42 DEF · SPEED 6.9 +6.9 ATK; curses
  HANGOVER 420 −42 HP · CURSED 69 −6.9 ATK · PAPER 4.2 −0.42 DEF. Rarity ×1 (common) … ×6 (legendary). Roll = hash of the token ID.
- **Classes:** archer +25% move, attack cooldown 0.24 s vs 0.28 s (+17% rate); warrior +35% dmg, +15% armor, +25 HP; healer Mend +20 HP
  to every nearby player (no party check).
- **Parties:** P (or the Elder) → ALPHA / BRAVO / GOLD / SOLO; same party = green tag `#80ff80`, friendly fire off (relay); others red
  `#ff8080`.
- **Economy (D-097):** no in-game DOGE at all; monsters drop materials only; testnet DOGE = mint, DEX, staking, class oath.
- **Fees:** mint 1 DOGE today (say "today": `setMintFee` can change it; the game reads it live) (80% stakers / 20% treasury, mint share reaches stakers only after `withdrawFees()`); DEX trade 3% = 2% LP + 1% protocol (0.8% stakers / 0.2% treasury).
- **Multiplayer cap:** 8 players per **server** (all rooms, `relay.mjs` `total`), max 3 per IP; relay checks PvP range/camp/party and budgets damage (D-109).
- **Drops:** monsters drop whiskers and steel (iron) only; wood/stone come from trees/rocks, quests and the Golden Yarn. Staking presets 0.1–50 DOGE (`PRICES`).
- **Raid (D-095):** Cat Lord returns 60 s after a kill, room restarts at quest 1; HP +50% per extra raider; no timer, no seal.
- **Hosting:** one Fly machine that sleeps when idle (~3 s cold start); 2 custom certs max on the free plan (no `www`).

## 4. Open tasks (LANDING lane)
| ID | Task | Status |
|---|---|---|
| S1 | Audit 2026-11-13 findings (L9): S5-1..S5-10, S5-12 done in D-110. Open: S5-1 recaption → new craft → mint clip when BRAIN recuts `assets/video/mint.*`; S5-11 (delete retired `02/03/05/06` screenshots) is BRAIN's next batch; S5-8 better archer/gather captures if BRAIN records them. | Waiting on BRAIN |
| ~~S2~~ | Mint intro now says craft first, then mint for the fee (D-110). | Done |
| B11 | Green-tag party capture next to the red-tag rival shot. Only if the user supplies one (both players press P, same party). | Waiting on the user |
| B13 | DogeOS logo in Build/footer. **Dropped:** the user has no brand kit. | Dropped |
Scope freeze (user, 2026-11-13): finish and polish only; no new sections or features unless the user asks.
