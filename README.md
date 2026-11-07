# DOGEON — The Grand Heist

A 16-bit top-down action RPG in one HTML file, set in the lore of the DogeOS **Grand Heist**: the Fat Cats hoard the doge world's
value, and you take back what is yours. Survive, fish, craft, trade your gear as NFTs on the **DogeOS Chikyū testnet**, and learn
DeFi by doing it. Such heist. Much wow.

## Who is in camp
| NPC | Where | What they do |
|---|---|---|
| The Sphinx | north pad | DogeOS DeFi hub: connect wallet (adds the testnet), NFT market (swap + LP), faucet, stake, RedStone DOGE/USD, Sphinx School (8 lessons), dogeos.com, docs |
| Elder Shibe | west pad | Keeper of the Heist: quests, the Grand Heist story, factions (Demolition Dogs, Kernel Crew, Barkitects), heist.dogeos.com |
| Wrenchpaw | east pad | forge: craft gear from monster parts, then mint it as an NFT |
| Cloverheart | left of the fire | Relotto, the recycling app that rewards you (relotto.app) |
| Noah (Model N-01) | right of the fire | trynoah.ai, the AI that builds a dApp from a single prompt |
| Bitget Wallet Card | next to the Sphinx | Bitget Wallet download + card info; works as your wallet at the Sphinx |

## Play
- **Offline:** double-click `index.html`. Everything works without a wallet.
- **With a wallet (MetaMask):** wallets don't run on `file://` pages, so start the tiny local server:
  ```bash
  node tests/serve.mjs        # then open http://localhost:8080
  ```

## Controls
| Key | Action |
|---|---|
| WASD / arrows | move |
| Space / J | hammer swing |
| K / Q | "WOW" bark (10 MP) |
| F | fish (face the water, stand still) |
| I / Tab | bag: eat, cook at the fire, skills, NFTs |
| E | talk / confirm |
| hold R | rest (inside the camp only) |
| A / D in menus | change a price |
| Esc | close |

## How to survive (hard mode)
- **Rest heals only to 60% HP.** Above that you must **eat**: RAW FISH +15, COOKED FISH +25 (cook at the camp fire).
- **Fishing is risky:** every pond is outside the camp, 22 cats roam the field (one more every 3 s), and ninjas like the water.
  Getting hit snaps the line. Moving cancels the cast.
- **No levels.** Skills grow only by doing: combat (hits that land), bark, fishing. Each tier gives +8%.
- **Death:** you lose half your carried DOGE, all whiskers, all materials and your bag of food. Pooled DOGE and NFTs are safe.

## Web3: items you own on DogeOS
1. Talk to **the Sphinx** (north pad) → **CONNECT WALLET**. The game adds the DogeOS Chikyū testnet to your wallet
   (chain id 6281971, RPC `https://rpc.testnet.dogeos.com`) and switches to it.
2. Get free test DOGE at https://faucet.testnet.dogeos.com.
3. **Craft** at Wrenchpaw (east pad). Each craft gives a **mint credit** → **MINT … NFT** (0.1 DOGE fee). Fish in your bag
   can be **preserved** as NFTs (safe from death).
4. Your NFTs show in the **bag**. Owning a hammer or armor NFT means you wear it. Eating a food NFT burns it.
5. The Sphinx **NFT MARKET** is empty until players create it: **sell** an NFT at a price, **create a pool** (items + DOGE)
   that others can swap against, **add / remove LP**, **swap** DOGE ↔ item, and **withdraw** your proceeds.

The contracts live in `contracts/` (Foundry). Until they are deployed to Chikyū the market says
"NFT CONTRACTS NOT DEPLOYED ON CHIKYU YET". Deploy steps: `contracts/README.md`.

## For developers
- `bash tests/check.sh` → static rules, syntax, headless game simulation, `forge test`.
- Local chain: `anvil` + deploy (see `contracts/README.md`), then open `http://localhost:8080/?chain=local`.
- Project memory: `CLAUDE.md`, `CONTEXT.md`, `docs/DECISIONS.md`, `MASTER_PROMPT.md`, `prompts/`.
