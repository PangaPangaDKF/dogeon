# DOGEON — Phase 4 Brief: "The Grand Heist"

Version 1.1 · 2026-11-07 (built in D-024) · Rewritten from the user's request (images in `docs/art/`). Read with `CLAUDE.md` and the
`dogeon-game` skill. Facts about partners are sourced in §6. Anything marked *unverified* must be phrased carefully in-game.

## 1. Vision (the user's idea, sharpened)
DOGEON is a **2D pixel-art fantasy RPG set in the lore of DogeOS's Grand Heist**, with a **DeFi and educational purpose**.
The Fat Cats hoard the doge world's value; the player is a shibe of the pack who takes back what is theirs by fighting,
fishing, crafting and trading. Every partner app of the DogeOS ecosystem appears as an NPC in camp: it tells a short story,
teaches one idea in plain words, and offers its link. The DeFi NPC (the Sphinx) is the player's door to the real chain:
connect a wallet, get the DogeOS testnet added automatically, claim testnet DOGE, swap, provide liquidity, stake, and find
the builder docs. Prices come from **RedStone**, the oracle that brings DeFi data to DogeOS.

**Player should feel:** "I'm in on the Heist. I learn what an LP, a swap, an oracle and an RPC are by doing them, in a game."

## 2. Goals
- **G1 Lore.** The Elder Shibe becomes the Keeper of the Heist: the story ("Take Back What Is Yours"), the three factions
  (Demolition Dogs, Kernel Crew, Barkitects) with their archive entries, a JOIN FACTION choice, and the link heist.dogeos.com.
  Title subtitle becomes "THE GRAND HEIST". The cat enemies are the Fat Cats' army; the Cat Lord is the fattest cat.
- **G2 Sphinx = DogeOS DeFi hub (the main NPC).** One menu: CONNECT WALLET (auto add + switch to DogeOS testnet RPC),
  wallet status, GET TESTNET DOGE (faucet link), NFT MARKET (LP + swap), STAKE (vault), RedStone price, DOGEOS.COM,
  BUILD ON DOGEOS (docs), and SPHINX SCHOOL (lessons: wallet, RPC/testnet, faucet, swap, LP, stake, oracle).
- **G3 Cloverheart (ReLotto).** Green-robed lucky guide (image 1). Story about ReLotto + link.
- **G4 Noah (trynoah.ai).** AI brain cube "MODEL N-01" (image 2). Story about building an app from one prompt + link.
- **G5 Bitget Wallet Card.** Card character (image 3). Story about the Bitget Wallet and its card + download link; tells the
  player they can use it (or any EVM wallet) to connect at the Sphinx.
- **G6 RedStone as the DEX price technology.** The DEX contract exposes the DOGE/USD price from a RedStone push feed
  (Chainlink-compatible `latestRoundData`) and USD views of pools; the game shows the oracle price when connected and
  keeps the offline simulation otherwise. Feed address is deploy-time config (never hard-coded guesses).

## 3. Constraints (unchanged unless stated)
- One HTML file, art drawn in code (pixel art from the user's images, no image files loaded by the game), pixel font only.
- Links open only on an explicit player action (menu select → `window.open(url,'_blank','noopener')`), and the URL is always
  printed in the menu so it works even when popups are blocked. No fetch from game code; chain reads go through the wallet.
- Game must stay fully playable offline / without a wallet. Hard mode, MVP, DOGE references everywhere.
- Third-party brands: show names and links as the user asked; draw original pixel characters inspired by the images;
  do not copy other companies' logos (e.g. card-network logos) into the art.
- Never ask for or store private keys. Deploys stay a user step (`contracts/README.md`).

## 4. Resolved ambiguities
1. "Stake": the existing Sphinx vault (pool/unpool DOGE, safe on death, +1% yield) is presented as STAKE / UNSTAKE.
2. "Main NPC with connect + RPC": the Sphinx. CONNECT already adds + switches the chain (D-016); now it is the first row,
   followed by faucet, LP/swap, stake, links and school.
3. Factions are lore + identity (shown in the HUD/menus); no stat perks (MVP rule).
4. RedStone push feed on DogeOS: use it if a verified feed address exists; otherwise ship the integration with the feed
   address configurable (deploy env `DOGE_USD_FEED`) and say so in-game ("ORACLE NOT CONFIGURED").

## 5. Acceptance criteria
- [x] 3 new NPCs in camp with sprites matching the images, each with story pages + an OPEN LINK row showing the URL.
- [x] Elder: Heist lore, 3 faction archive entries, JOIN FACTION, heist.dogeos.com link; title says THE GRAND HEIST.
- [x] Sphinx: connect (auto RPC), faucet, market (LP/swap), stake, dogeos.com, docs, school lessons, oracle row.
- [x] DogeDEX reads a RedStone-compatible feed (views only, no effect on funds); forge tests with a mock feed.
- [x] Game reads the oracle through the wallet when connected; offline unchanged. Tests: sim + forge + anvil e2e green.
- [x] RULE #1 closeout per iteration; CONTEXT.md updated.

## 6. Sources (research workflow wf_c2140321-d6d, details in D-024)
- Grand Heist: https://heist.dogeos.com/ (factions + weaknesses from the site bundle). DogeOS: https://www.dogeos.com/ ,
  https://docs.dogeos.com/en/getting-started/overview , faucet https://faucet.testnet.dogeos.com , explorer https://dogeos-testnet.l2scan.co
- RedStone: https://www.redstone.finance/blog/redstone-enables-defi-in-the-dogecoin-ecosystem-with-dogeos/ , https://docs.redstone.finance/ ,
  feed manifest redstone-oracles-monorepo relayer-manifests-multi-feed/dogeOsTestnetMultiFeed.json. DOGE feed
  0x434F8D17c0301cfEa143dba912972E24B827C968 (8 dec). It was stale on 2026-11-07: latestRoundData reverts and the adapter's last push is $0.0716.
- Relotto: https://relotto.app/ (recycling rewards; not in the DogeOS ecosystem list, so no partnership claim).
- Noah AI: https://trynoah.ai/ , https://docs.trynoah.ai/ (AI dApp builder; not a Solana fork; listed on dogeos.com/ecosystem).
- Bitget Wallet: https://web3.bitget.com/pt-BR/wallet-download , https://web3.bitget.com/card , EVM provider docs (window.bitkeep.ethereum).
