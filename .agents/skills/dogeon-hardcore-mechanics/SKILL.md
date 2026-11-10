---
name: dogeon-hardcore-mechanics
description: Decision-making and mechanics enforcement skill for DOGEON ("The Grand Heist"). Use whenever designing, balancing, reviewing, or implementing gameplay systems, resource gathering, drop tables, combat difficulty, death penalties, master/mod suites, or Web3 item permanence. Preserves the core vision of DOGEON as an unforgiving, high-stakes, hardcore retro Action RPG.
---

# DOGEON — Hardcore Mechanics & Design Decision Skill

Version: 1.0 (2026-11-09)
Scope: Preserves the core vision, gameplay tension, and economic balance of DOGEON as a hardcore retro pixel Action RPG on DogeOS.

---

## 1. The Core Hardcore Vision (Non-Negotiable Axioms)

DOGEON is NOT a relaxed idle clicker or a casual web game. It is a **hardcore survival Action RPG** where the wilderness is lethal, resources are scarce, and death carries severe consequences.

### Axiom 1: No Risk, No Reward (Vulnerable Gathering)
- **Camp is the only safe zone.** Anywhere outside the wooden fence, enemies roam and will hunt the player.
- **Resource nodes (trees, rocks, ponds) are surrounded by enemy patrols.** Players cannot mindlessly harvest; they must clear the perimeter first.
- **Gathering requires standing still.** Taking damage immediately interrupts and cancels gathering or fishing.
- **Longer gathering commitment:** Gathering (`GATHER_DUR >= 3.5s`) and node renewal cooldowns (`GATHER_CD >= 14s`) ensure players remain exposed to ambushes.

### Axiom 2: Extreme Scarcity & Intentional Economy
- **Monsters do not shower loot:** Normal enemies drop materials rarely (`dropP <= 0.35`). A single DOGE coin drop is rare (`COIN_DROP_P <= 0.08`).
- **Resource guarantees are purposeful:** Rocks guaranteed drop iron (`kind: 'steel'`), and monsters have an iron drop chance (`~25%`) to supply the forge and fuel crafting without inflating overall wealth.
- **Meme numbers drive high-stakes burn/re-roll loops:**
  - Iconic buffs: `420` (HP), `69` (ATK), `777` (LUCK/HP), `4.2` (DEF), `6.9` (ATK/SPD).
  - Cursed debuffs: Negative variants (`-42`, `-6.9`, `-0.42`) punish players and incentivize burning NFTs at the DogeMaster NPC to re-roll stats.
- **Economic Sinks:** Mints cost DOGE (`0.1 DOGE`), profession oaths cost DOGE (`0.05 DOGE`), DEX trades incur a 3% fee (2% LP, 0.8% stakers, 0.2% treasury).

### Axiom 3: Brutal Death Penalty vs Web3 Permanence
- **Death penalty:**
  - 50% of carried DOGE coins are lost.
  - Carried whiskers and bag materials (Wood, Stone, Orb, Scrap, Horn, Steel) are completely dropped and wiped on death.
  - Carried fish and food are lost on death.
  - Respawn health and mana are depleted (`RESPAWN_FRAC = 0.35` -> 35% HP/MP).
- **On-Chain Permanence:**
  - ONLY on-chain ERC-721 NFTs (crafted gear, preserved fish tokens) stored in the player's wallet survive death.
  - Vaulted DOGE in the Sphinx off-chain bank survives death.
  - Staked DOGE in the `DogeStaking` contract survives death and earns 0.8% of DEX fees.

### Axiom 4: Anti-Sloth & Player Engagement
- **Lazy Doge Debuff:** Standing idle for >180 seconds activates `P.lazy` (-15% movement speed). The sloth debuff can only be cleared by attacking an enemy or gathering resources.

### Axiom 5: Master / Mod Governance & Chain Authentication
- **Master permissions are for testing and contract owner governance:**
  - Master address: `0x7be839793765f18e36cc97b5312d094f6ae282ca` (DogeOS Chikyū deployer).
  - Connecting with `MASTER_ADDR` automatically authenticates Master Mode without needing URL params.
  - URL fallback: `?mod=1` or `?master=1`.
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
   - ✅ *Approve:* Red text highlighting (`#ff4040`) for all NFT tokens, recipes, and meme re-rolls in UI menus.

5. **Are test invariants verified?**
   - All 6 stages of `bash tests/check.sh` must remain 100% green with 0 failures and 0 warnings.

---

## 3. UI & Visual Hierarchy Rules

- **NFT Visual Priority:** Every NFT item (equipped gear, wallet NFTs, mint recipes, DogeMaster sacrifices) must be highlighted in vibrant red (`#ff4040`, selection `#ff9090`, background `#300808` / `#8c1414`).
- **Materials:** Orb (`#d080ff`), Scrap (`#c0c8d0`), Horn (`#60e060`), Steel/Iron (`#a0a8b0`), Wood (`#c08a4a`), Stone (`#c0c8d0`).
- **Currency:** Carried DOGE (`#f8d050`), Wallet DOGE (`#ffd700`), Vaulted (`#b0a060`).
