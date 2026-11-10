---
name: dogeon-hardcore-mechanics
description: Decision-making and mechanics enforcement skill for DOGEON ("The Grand Heist"). Use whenever designing, balancing, reviewing, or implementing gameplay systems, resource gathering, drop tables, combat difficulty, death penalties, master/mod suites, or Web3 item permanence. Preserves the core vision of DOGEON as an unforgiving, high-stakes, hardcore retro Action RPG.
---

# DOGEON — Hardcore Mechanics & Design Decision Skill

Version: 1.1 (2026-11-09)
Scope: Preserves the core vision, gameplay tension, and economic balance of DOGEON as a hardcore retro pixel Action RPG on DogeOS.

---

## 1. The Core Hardcore Vision (Non-Negotiable Axioms)

DOGEON is NOT a relaxed idle clicker or a casual web game. It is a **hardcore survival Action RPG** where the wilderness is lethal, resources are scarce, and death carries severe consequences.

### Axiom 1: No Risk, No Reward (Vulnerable Gathering)
- **Camp is the only safe zone.** Anywhere outside the wooden fence, enemies roam and hunt the player.
- **Resource nodes (trees, rocks, ponds) are surrounded by enemy patrols.** Players cannot mindlessly harvest; they must clear the perimeter first.
- **Gathering requires standing still.** Taking damage immediately interrupts and cancels gathering or fishing.
- **Longer gathering commitment:** Gathering (`GATHER_DUR >= 3.5s`) and node renewal cooldowns (`GATHER_CD >= 14s`) ensure players remain exposed to ambushes.

### Axiom 2: Extreme Scarcity & On-Chain Currency Purity
- **Single Currency Rule:** The only real currency is **Testnet DOGE** residing in the player's wallet (`wallet.bal`). There is no infinite arcade currency.
- **1 DOGE Mint Fee & Staking Split:** Every NFT mint costs `1 TESTNET DOGE` (`10^18` wei). Accrued mint fees split 80% to stakers (`DogeStaking`) and 20% to the project treasury.
- **Material Streamlining:** Materials are strictly `steel` (iron), `wood`, `stone`, and `whisk` (whiskers), plus fish. `orb`, `scrap`, and `horn` are removed.
- **Resource Guarantees:** Rocks guaranteed drop iron (`kind: 'steel'`), and monsters have an iron drop chance (`~25%`) to fuel crafting without inflating wealth.
- **Meme numbers drive high-stakes burn/re-roll loops:**
  - Iconic buffs: `420` (HP), `69` (ATK), `777` (LUCK/HP), `4.2` (DEF), `6.9` (ATK/SPD).
  - Cursed debuffs: Negative variants (`-420`, `-69`, `-0.42`, `-6.9`, `-777`) punish players and incentivize burning NFTs at the DogeMaster NPC to re-roll stats.
- **Economic Sinks:** Mints cost 1 DOGE, profession oaths cost DOGE (`0.05 DOGE`), DEX trades incur a 3% fee (2% LP, 0.8% stakers, 0.2% treasury).

### Axiom 3: Brutal Death Penalty vs Web3 Permanence & PvP Looting
- **Dungeon Raid Timer & Sealing:**
  - The northern dungeon operates on a raid instance cycle: boss gates open for 30 minutes (`RAID_OPEN = 1800s`), then seal shut for 5 hours (`RAID_SEAL = 18000s`).
  - When sealed, boss gates are solid and impassable (`solidFor` blocks entry).
- **PvP Material Loot Theft:**
  - When killed by monsters or other players, carried materials (`steel`, `whisk`, `wood`, `stone`) scatter on the ground as lootable pickups for rivals to steal.
  - Carried fish and food are lost on death.
  - Respawn health and mana are depleted (`RESPAWN_FRAC = 0.35` -> 35% HP/MP).
- **On-Chain Permanence:**
  - ONLY on-chain ERC-721 NFTs stored in the player's self-custody Web3 wallet survive death. NFTs NEVER drop on death.
  - Staked DOGE in the `DogeStaking` contract survives death and earns 0.8% of DEX fees + 80% of mint fees.

### Axiom 4: Anti-Sloth & Timed Lazy Debuff
- **Timed Lazy Debuff:** Going AFK or standing idle for >180 seconds activates `P.lazyT = 60s` (-15% movement speed).
- **Shaking it off:** Moving and active input ticks down the debuff duration faster (`1.5x`). Engaging in combat and hitting an enemy immediately clears `P.lazyT` and restores full vigor.

### Axiom 5: Master / Mod Governance & Chain Authentication
- **Deployer / Mod Permissions:**
  - Master address: `MASTER_ADDR = 0x7be839793765f18e36cc97b5312d094f6ae282ca`.
  - Only the authenticated deployer/mod wallet can access the in-game Test Suite (`modMenu`) via key `M`.
  - On-chain smart contract administration (`setStakingPool`, `setTreasury`, `setMintFee`, `withdrawFees`) is strictly restricted to `onlyOwner` (the mod/deployer address).
  - Master capabilities: God mode, instant mat grant, unrestricted profession switching (bypassing on-chain 1-class lock), instant boss defeat, and NFT craft credit grants.
  - **Never expose private keys in client source code.** Authentication is verified cryptographically via EIP-1193 wallet address matching.

---

## 2. Hardcore Decision-Making Gate (Pre-Commit Checklist)

Before making any game balance change or accepting a mechanics proposal, evaluate these 5 questions:

1. **Does this make the game too easy or safe?**
   - ❌ *Reject:* Safe AFK farming spots, auto-dodge, safe gathering zones outside camp, or health regen outside camp.
   - ✅ *Approve:* Increased enemy aggression near valuable nodes, dash/charge telegraphed attacks that demand player skill.

2. **Does this preserve the line budget and technical constraints?**
   - ❌ *Reject:* Adding npm packages, external sprites/audio, or exceeding 1,500 lines in `index.html`.
   - ✅ *Approve:* Compact procedural algorithms, raw canvas rendering, WebAudio oscillators.

3. **Does this maintain the risk/reward boundary?**
   - ❌ *Reject:* Free on-chain re-rolls without burning tokens, risk-free NFT mints.
   - ✅ *Approve:* Burn-to-reroll mechanics (sacrificing cursed NFTs to roll for meme god-rolls).

4. **Is visual feedback immediate and distinct?**
   - ❌ *Reject:* Ambiguous text styling where NFTs look identical to common bag items.
   - ✅ *Approve:* Red text highlighting (`#ff4040`) + 3x3 red diamond pixel icons for all NFT tokens, recipes, and meme re-rolls in UI menus.

5. **Are test invariants verified?**
   - All 6 stages of `bash tests/check.sh` must remain 100% green with 0 failures and 0 warnings.

---

## 3. UI & Visual Hierarchy Rules

- **NFT Visual Priority:** Every NFT item (equipped gear, wallet NFTs, mint recipes, DogeMaster sacrifices) must be highlighted in vibrant red (`#ff4040`, selection `#ff9090`, background `#300808` / `#8c1414`) with a 3x3 red diamond pixel icon.
- **Mint Rows:** Gold highlight (`#ffd860`) with gold dot icon.
- **Liquidity & Staking Pools:** Cyan highlight (`#80f8c0`) with cyan dot icon.
- **Materials:** Steel/Iron (`#a0a8b0`), Whiskers (`#e0e0ff`), Wood (`#c08a4a`), Stone (`#c0c8d0`).
- **Currency:** Testnet DOGE in wallet (`#ffd700`), Vaulted (`#b0a060`).
