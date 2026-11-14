# DOGEON — The Game & Every Mechanic (plain language)

> What DOGEON is, how you play it, and how each system works — for players, for the two AI brains building it, and for
> TryNoah AI rebuilding it. Code-level details: [`CLAUDE.md`](../CLAUDE.md) §3. Why decisions were made:
> [`docs/DECISIONS.md`](./DECISIONS.md). What we're allowed to build: the `dogeon-mission` skill.

---

## 1. The game in one paragraph

You are a Shiba Inu ("doge") in **DOGEON — The Grand Heist**, a 16-bit top-down pixel RPG. The Fat Cats have taken the doge
world's value and locked it away. You leave a **safe camp**, fight half-human cats in the field, collect **resources**, bring
them home, **craft and mint** gear, trade it, and push deeper until you beat the **Cat Lord**. Everything you mint is a real
**NFT on the DogeOS Chikyū testnet**, and the whole DeFi layer (market, liquidity pools, staking) is real and on-chain.
The game is **fully playable with no wallet** — the chain adds ownership on top.

**Play it now:** the game is live at **https://dogeon.lat** (hosted on Fly, 24/7). Share the link and others can join.

**The core loop, which is the whole game right now:**
> **play → gather resources → mint stuff → defeat the monsters and the boss**

---

## 2. Controls

| Key | Action |
|---|---|
| `WASD` / arrows | Move |
| `Space` / `J` | Basic attack (differs per class) |
| `K` / `Q` | Class skill (costs MP) |
| `E` / `Enter` | Talk / confirm |
| hold `R` | Rest (only inside camp) |
| `I` / `Tab` | Bag (eat, cook, mint, skills) |
| `F` | Fish (facing water) or gather a tree / rock next to you, standing still |
| `A` / `D` in menus | Change an amount or item |
| `Esc` | Close |
| Mouse | Hover rows, click to pick, click `<` `>` to change amounts |

Characters are **frozen facing right** (a deliberate style choice) — but you still move and aim in all four directions.

---

## 3. The world

- **The camp (safe).** Enemies cannot enter, cannot hit you, and their arrows stop at the fence. The giant **Dogecoin** on the
  plaza floor is the game's identity art. All NPCs live here.
- **The field.** 52 cats roam it, one more spawns every 3 seconds out of sight, plus a **mini-boss** (a brute; a knight in the
  ruins) that comes back 20 s after it falls. Trees and rocks to gather, five fishing ponds, all outside the camp.
- **The ruins (north).** Opens at quest stage 2. Six tougher enemies, then the **Cat Lord** boss behind the gate.

### Who is in camp
| NPC | What they do |
|---|---|
| **The Sphinx** (north) | The DeFi hub: connect wallet + add the DogeOS network, the DOGEON Pool DEX, staking, faucet, DOGE/USD oracle, an 8-lesson DeFi school |
| **Elder Shibe** (west) | Quests, the Grand Heist story, the three factions |
| **Wrenchpaw** (east) | The forge: turn monster materials into gear, then mint it |
| **Sergeant Ironpaw / Scout Fleetwhisker / Mender Brighttail** | The three class trainers (see §5) |
| **Cloverheart / Noah / Bitget Card** | Partner NPCs with their stories and links |

---

## 4. Survival rules (this is a hard game on purpose)

- **Resting only heals to 60%.** Hold `R` inside camp for 3 s, then +10 HP/s up to 60% of max, and MP back to full. Moving resets it.
- **Above 60% you must eat.** Raw fish +15 HP, cooked fish +25 HP (cook at the campfire from the bag). No potions, no regen.
- **MP refills by resting in camp**, plus two field sources by design: the Healer's staff (+2 MP per hit) and cooked salmon.
- **Death costs you:** all whiskers, all materials, and your whole bag. **Safe from death:** your wallet's testnet DOGE, DOGE staked
  on-chain, and every NFT in your wallet. There is no in-game DOGE to lose. You wake at the campfire with 35% HP/MP.
- **The market changes the difficulty.** A simulated DOGE price (anchored to the real RedStone DOGE/USD when you're connected)
  drifts every second. **Bear:** cats hit up to +50% harder and move +15% faster, screen tints red. **Bull:** you hit up to
  +50% harder and move +10% faster.
- **No character levels.** Skills grow only by using them: combat (hits that land), bark, fishing. Each tier adds +8%.

---

## 5. The three classes (professions)

You start as a **basic doge** with a weak attack — fully playable. Talk to a trainer to pick a class: **free offline**, and you
can switch. Connect a wallet and you can **swear it on-chain** (`DogeProfession.choose`, a small DOGE fee + gas) — then it is
**one class per wallet, forever**.

| | **Warrior** (Demolition Dogs) | **Archer** (Kernel Crew) | **Healer** (Barkitects) |
|---|---|---|---|
| Max HP | 85 (+25) | 60 | 45 (−15) |
| Speed | 0.95× | **1.25×** | **1.25×** |
| `Space` | Heavy wide cleave, 1.35× damage | **Shoots arrows at range, 0 MP** | Light staff hit, 0.65× damage, **+2 MP on hit** |
| `K` / `Q` | **Ground Pound** (12 MP): shockwave, damages + knocks back everything around you | **Arrow Volley** (6 MP): 3-arrow spread | **Mend** (10 MP): heal HP anywhere |
| Armor | +15% damage reduction | — | +5% |

> **Healer heals the party (D-046, built).** In multiplayer, Mend heals nearby **other players** too: the heal pulse is
> relayed and each receiver applies it (max 20 HP within 72 px of where the healer stands, paid in the caster's MP). Solo, it heals you.

---

## 6. Resources, crafting and minting

**Where resources come from:** alley, archer and frog cats drop **whiskers**, brutes 3; ninjas, bulls and knights drop **steel**
(iron), and any monster has a 25% iron chance. Gather **wood** from trees and **stone** from rocks (`F`). Fishing gives **fish**.
Every new player starts with **2 steel + 3 wood + 3 stone**: enough to craft and mint a Hammer Lv2 on day one.

**Your bag** holds 12 slots (food stacks 5, materials 20). Bag contents are **lost on death** — wallet NFTs are not.

**Every mint spends something (D-104): you spend, you get.** Each mint is a `DogeItems` transaction: 1 testnet DOGE fee + gas.
1. **Craft at Wrenchpaw** (burns the recipe's materials, e.g. Hammer Lv2 = 2 steel + 1 wood), then pick its `MINT … NFT (1 DOGE)` row.
2. **Preserve a caught fish** from your bag as an NFT (the fish leaves the bag).
3. **DogeMaster re-roll** (after the boss): burn one of your NFTs to mint a new one.
There is no free mint: nothing can be minted without crafting or catching it first, and one craft = one mint.

Item types: Hammer (Lv1–4), Armor (Lv1–2), Raw Fish, Cooked Fish, Bone Charm, Moon Biscuit, and the DOGE gear set (Sword,
Leather Armor, Shield, Staff, Robe, Whip, Bow, Hemp Shirt, Quiver) from the DogeMaster re-roll.

**Owning gear = wearing it.** If your wallet holds a Hammer Lv3 NFT, you swing a Lv3 hammer. Eating a food NFT burns it.
One craft always equals one item — minting removes the off-chain copy, so nothing is ever duplicated.

---

## 7. The DeFi layer (real, on DogeOS Chikyū)

At the Sphinx:

- **Connect wallet** — adds and switches to DogeOS Chikyū (chain `0x5fdaf3` / 6281971) for you. MetaMask, Bitget Wallet, any
  EIP-1193 wallet. Get free test DOGE from the faucet link.
- **DOGEON Pool DEX** — mint items, see your wallet's items, **create a pool** (items + DOGE), **swap** DOGE ↔ item against a
  constant-product curve, **add/remove liquidity**, list items for a fixed price, and withdraw proceeds. Each row shows price
  impact and your LP share. Nothing is for sale until a player creates it.
- **Fees:** every trade pays **2% to liquidity providers** (kept in the pool) plus a **1% protocol fee** split
  **0.2% to the project treasury / 0.8% to DOGE stakers**. Verified on-chain to the wei.
- **Staking** — stake testnet DOGE; stakers share 0.8% of every DEX trade and 80% of mint fees (pushed by `SEND MINT FEES TO
  STAKERS`). Claim or unstake any time. Staked DOGE is safe on death. Testnet only, no real value, not financial advice.
- **Oracle** — RedStone DOGE/USD is shown for information and anchors the in-game market; **swap prices always come from the
  pool reserves**, never the oracle.
- **No in-game DOGE:** monsters never drop DOGE and no NPC gives or sells anything for DOGE. Testnet DOGE from the faucet is
  used only for minting, the DEX, staking and the class oath.

---

## 8. Quests

NPCs never hand out DOGE: there is no game token, and every mint or trade uses real testnet DOGE. Quests pay materials for the forge. Dungeon cats and mini-bosses come back every 20 seconds.

0 Talk to Elder Shibe → 1 slay 8 cats (+2 wood, stone and iron) → 2 slay 3 brutes (+4 wood, stone and iron, opens the ruins gate) → 3 defeat the Cat Lord →
4 complete (Golden Yarn: +3 wood, stone and iron for minting).

**Raid cycle:** 60 seconds after the Cat Lord falls he comes back at full HP, and the heist restarts at quest 1 for everyone in the
room: the gate closes and anyone in the chamber is moved out. The HUD shows `BOSS IN 45S`, then `RAID ON`. There is no raid timer.

---

## 9. Playing with other people

The game is **live at https://dogeon.lat** — share that link and others can join. Served over http(s) the game joins
the relay on its own host automatically (`?mp=off` disables it; opened as a file it stays offline). To self-host:

```bash
node server/relay.mjs      # serves the game AND the relay on port 8787, no install needed
```

Then open `http://<host>:8787/?mp=ws://<host>:8787&room=heist&name=YOURNAME` (use `wss://` over HTTPS). Up to 8 players per
server (all rooms together, max 3 per network) see each other's doge — class sprite, movement, HP bar and name.

**Shared & server-authoritative (D-076):** the relay runs a real referee — a **shared Cat Lord raid** (one boss, HP scaled to
the number of raiders), **open-world PvP** outside the camp, and **parties** (`?party=NAME`) with friendly-fire disabled between
allies. The **Healer heals the party** (D-046).

**Still per-player:** ordinary field cats and their loot — each player fights their own. A fully shared field is the next step.

---

## 10. Enemies

| Enemy | HP | Behaviour | Drops |
|---|---|---|---|
| Alley cat | 30 | Chases you | Whisker |
| Archer cat | 24 | Keeps distance, shoots bones | Whisker |
| Frog | 28 | Kites and shoots | Whisker |
| Ninja | 36 | Fast, likes the ponds | Steel |
| Bull | 110 | Winds up, then charges | Steel |
| Knight | 70 | Tanky melee | Steel |
| Brute | 96 | Flashes red, then dashes | 3 whiskers |
| **Cat Lord** (boss) | 320 (+50% per extra raider) | Bone spreads; summons help below 50% HP | Golden Yarn (3 wood, 3 stone, 3 iron) |
Drops are rare (each type has its own chance), and any monster may also drop iron (25%). HP values are `ETYPES` in `src/game.js`.

Everything is readable: brutes telegraph before dashing, you get invulnerability frames and knockback after a hit.

---

## 11. Art style (short version)

320×224 internal resolution, 16×16 tiles, 16×20 characters, a 3×5 uppercase font, everything drawn **in code** — no image
files ship with the game. Shibas are doge-orange with cream faces and the signature eyebrow dots and side-eye; cats are the
cold-palette opposites. The camp Dogecoin is the user's own artwork converted to pixels and must never be redrawn by hand.
Full details, with measured palettes: [`docs/ART_STYLE.md`](./ART_STYLE.md).
