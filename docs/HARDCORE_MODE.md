# DOGEON — Hardcore Co-op Survival Design (user vision, 2026-11-09)

> Captured from the user's design brief. This is a **multi-session plan**, not one change. It organizes the vision into
> systems, flags the hard technical constraints honestly, and splits the work into **Phase 1 (buildable now, any
> architecture)** and **Phase 2 (needs an authoritative server)**. Read with `dogeon-mission` (the charter) — this
> **expands** the multiplayer scope the charter deferred, which is the user's deliberate call (confirm, then update the charter).

---

## 1. The vision in one paragraph

A **hardcore, multiplayer-first** survival RPG. Normal monsters are brutal — hard to kill even for 3 players, and there
are too many of them. Resources are scarce and valuable: to gather wood / fish / flowers / ore you must **not get hit**,
so you need a **party** (someone tanks while you harvest). Items have real value because getting them is hard teamwork.
There are **9 craftable/mintable gear items** (3 themed per class) that grant **+HP / +MP / +ATK / +DEF**; any class can
use any weapon, but each class has different HP/MP. With **no class** you're a weaker but fully playable lone doge who can
still grow strong. The **DOGE market** (exact RedStone price) is a heavy live modifier. **PvP is for thieves and bandits**:
kill a player and you can take their dropped loot. Death leaves a **body for 5 seconds**; a nearby player can loot it, and
**only non-minted items drop** (NFTs are safe — see the theft constraint). Each region has a **mini-boss**.

---

## 2. The architecture fork (decide this first — it gates everything)

The current multiplayer (`server/relay.mjs` + `netTick`) is a **dumb relay**: it keeps no state and only rebroadcasts each
player's own position. **Enemies, loot and combat are simulated separately in every browser.** So, as built, a friend
**cannot** tank the cats attacking you — their doge is a cosmetic ghost.

| | **Path A — Authoritative server (the real vision)** | **Path B — Keep the light relay (approximation)** |
|---|---|---|
| **Shared enemies** (friend tanks your mobs) | Yes — monsters live on the server, everyone sees the same ones | No — each player has their own cats; co-op is cosmetic |
| **Real PvP kills / looting a player** | Yes — server rules who died and who loots | Only faked locally (cheatable) |
| **"Need a party to gather safely"** | Works as designed | Doesn't really work (your friend can't block your mobs) |
| **Cost / effort** | ~$7/mo always-on (Render/Railway) + real dev work (server-side enemy sim, anti-cheat); open-source base: Colyseus (MIT) | $0–$7/mo, little new code |
| **Mission-charter fit** | Expands the deferred "server-authoritative MMO" — user decision | Matches the current "opt-in ghosts" scope |

**Recommendation:** build **Phase 1** now (everything below that is architecture-independent and makes the solo + co-op
game genuinely hardcore and fun), *then* commit to **Path A** for Phase 2 once the hardcore loop is proven. This de-risks a
big server investment behind a game that's already good solo.

---

## 3. Systems design

### 3.1 Classes & the lone doge  *(Phase 1 — mostly exists)*
- **No class = a weaker lone doge**, fully playable, can still grow via skills/gear. (Exists: basic doge, 60 HP.)
- Three classes with **different HP/MP** (today: Warrior 85 HP, Archer 60, Healer 45; MP via `P.maxMp`). Keep per-class HP;
  add **per-class MP** so Healer/Archer skills feel distinct.
- **Any class can use any weapon.** Weapons give stats; class only sets HP/MP and the K/Q skill. (Today gear is hammer/armor
  only — generalize so an Archer can equip a warhammer, etc.)

### 3.2 The 9-item gear system  *(Phase 1 — core, mission priority #1)*
Exactly **3 themed items per class = 9**, all mintable NFTs on `DogeItems`, each granting a mix of **+HP / +MP / +ATK / +DEF**.
Owning = wearing (D-019). Any class may equip any of them. **Every item name is prefixed `DOGE ` (user, 2026-11-09).**

| Class theme | Items (names as minted) | Grants |
|---|---|---|
| Warrior | **DOGE SWORD** · **DOGE LEATHER ARMOR** · **DOGE SHIELD** | +ATK · +DEF +HP · +DEF (block) |
| Archer | **DOGE BOW** · **DOGE HEMP SHIRT** · **DOGE QUIVER** | +ATK(ranged) · +SPD +DEF · +MP / extra arrow |
| Healer | **DOGE STAFF** · **DOGE ROBE** · **DOGE WHIP** | +MP +heal · +MP +DEF · +ATK +MP-on-hit |

> Naming rule: on the redeploy, `DogeItems.typeName()` returns these `DOGE `-prefixed names, so the on-chain metadata and the
> in-game menus match exactly. (The current placeholder items HAMMER/ARMOR/CHARM stay un-prefixed until that redeploy, to avoid
> an on-chain/off-chain name mismatch and to keep the sim's name assertions stable.)

- **May need contract work:** the item system adds gear types beyond today's 6. Check whether `DogeItems` accepts new
  `itemType` bytes without a redeploy; if not, that's a contract change (mission priority #1 — do it carefully, re-run
  `e2e-chikyu.sh`). This is the DEX's reason to exist: rare items → mint → trade/pool.

### 3.3 Brutal monsters  *(Phase 1 — local AI + numbers)*
- **Hard to kill, many of them.** Rebalance `ETYPES` (more HP, harder hits, smarter chase). Verify with `balance-check`.
- **Flee at ≤20% HP**, **recover HP if left alone for 5 s**, then **return to fight**. (New AI states in `updEnemy`.)
- **Stronger on a kill:** killing a player grants the monster a permanent buff (dmg/HP/speed).
- **Carry items:** a monster that picks up a dropped item gets **+30% damage, resistance and speed** per item held; killing
  it drops what it carried. (Full "monsters pick up *your* dropped items" is shared-world → Phase 2; local version Phase 1.)
- **Mini-boss per region:** a bigger, faster, stronger elite guarding each area.

### 3.4 Drops & economy  *(Phase 1)*
- **Rare, mostly junk.** Most normal monsters drop **nothing**; occasionally **cat clothes** (near-worthless — it's cat gear)
  or, rarely, **a single coin**. Scarcity is the point.
- **Market = heavy debuff.** Use the **exact RedStone DOGE/USD** price (not just the simulated walk). Each item a monster
  holds raises its danger; **when DOGE pumps, players move faster** (bull buff, already partly present — strengthen).

### 3.5 Gathering under fire  *(Phase 1 light; true party-gather = Phase 2)*
- Harvesting (wood from logs, ore from rocks, flowers, fishing) **cancels if you take a hit** (fishing already does this —
  extend the pattern to new nodes). Nodes renew on a timer so the **gather → mint** loop is sustainable.
- The "**bring a party so one tanks while you harvest**" fantasy only truly works with **shared enemies → Phase 2**. In
  Phase 1 it's brutal solo/interruptible.

### 3.6 Death, body & looting  *(PvE drop Phase 1 for self; cross-player looting = Phase 2)*
- On death, leave a **body for 5 s**. A nearby player can loot it. **Only non-minted (non-NFT) items drop**; NFTs stay in the
  wallet (see 3.7). Cross-player looting needs peers to agree on the body → authoritative → **Phase 2**.

### 3.7 PvP — thieves & bandits  *(Phase 2 — needs server + the NFT-theft decision)*
- Outside camp, players can damage each other; **camp stays a safe no-PvP zone** (invariant). Kill someone → take their
  **dropped (non-NFT) loot**.
- **Stealing an NFT is not trivially possible.** You **cannot transfer another player's NFT without their on-chain
  signature.** Honest options:
  1. **PvP escrow contract (opt-in):** to enter bandit zones you deposit chosen NFTs into an escrow that releases them to
     your killer. Trustless, on-chain — but a **new 5th contract** (charter R4 currently caps us at 4; user decision).
  2. **No NFT theft:** only non-NFT loot drops; NFTs are always safe. Simplest and honest; matches "only non-minted items
     can drop."
  - **Do NOT** fake an NFT transfer client-side — it would be dishonest and wouldn't survive a wallet check.

---

## 4. Phased build plan

**Phase 1 — hardcore single/co-op, no new architecture (do these as separate, tested sessions):**
1. **9-item gear system** + any-weapon + per-class MP + stat bonuses (mission #1; check `DogeItems` for new types).
2. **Brutal monster rebalance** + flee/recover/return AI + stronger-on-kill + per-held-item buff + mini-boss per region.
3. **Rare drop tables** (nothing / cat-clothes junk / rare coin) + **market debuff** on exact RedStone price + bull speed.
4. **Renewable gathering nodes** (wood/stone/flower/ore) that cancel on hit → feed the mint loop.

**Phase 2 — needs the authoritative server (one architecture decision, then build):**
5. Shared enemies (real party tanking/gathering).  6. Real PvP kills + cross-player body looting.
7. NFT theft via opt-in escrow (if chosen).  8. Monsters picking up players' dropped items in the shared world.

---

## 5. Open decisions for the user
1. **Architecture:** approve "Phase 1 now on the current relay, then Path A authoritative server for Phase 2"? Or go
   straight to Path A?
2. **NFT theft:** escrow contract (new 5th contract) vs. non-NFT loot only?
3. **Item stats:** confirm/adjust the 9-item table in §3.2 (exact +HP/+MP/+ATK/+DEF numbers).
4. This expands the charter's multiplayer scope — update `dogeon-mission` to say so once confirmed.

---

## 5b. NEXT STEP (deferred by the user) — the DogeItems redeploy
The 9 named gear NFTs (sword, leather armor, shield, staff, robe, whip, bow, light hemp shirt, quiver) need a **redeploy of
`DogeItems` (+ `DogeDEX`, which depends on it)** with the new gear types, because the live `DogeItems.maxLevel()` only accepts
types 1–6 and reverts on anything else. The user chose **"build stats now, redeploy later"** (D-054), so the stat engine is
being built on the existing items first. When ready: redeploy → update `CONTRACTS` in `index.html` + `TRYNOAH.md`/manifest/docs
→ re-run `scripts/e2e-chikyu.sh` (17/17) + `scripts/browser-smoke.sh` → coordinate the shared contract lane with Antigravity.

**Progress so far (Phase 1):** D-052 monsters +50% · D-053 renewable gathering · D-054 per-class Max MP · D-055 rare drops · D-056 2x HP/dmg + 52 field enemies · D-057 mini-boss per region · D-058-060 9 DOGE gear items (deployed + stat engine) +
rare DOGE coin. Still open in Phase 1: market as a heavier debuff on the exact RedStone price, "cat clothes" junk drop,
bigger/clearer gear stat bonuses, the 9 `DOGE `-named items (contract redeploy IN PROGRESS), "cat clothes" junk.

## 6. First recommended slice
**Start with the 9-item gear system (§3.2).** It's architecture-independent, it's mission priority #1 (the real use-case for
minting and the DEX), and brutal monsters (§3.3) have far more meaning once gear matters. Everything else builds on it.
