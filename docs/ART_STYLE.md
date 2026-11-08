# DOGEON — Exact Art Style Record (D-042)

> **Why this file exists (user, verbatim intent):** *"before deleting the art images references please take a note of exactly
> how the art is, it is very important to have the exact art style because dogeon is a game for doge coin as a core."*
>
> The three source images in `docs/art/` were removed from the working tree in D-042 to cut repo weight (1.54 MB). They are
> **not lost**: `git show 6889294:docs/art/npc-noah-ai.jpg > noah.jpg` (same for the other two) restores any of them from history.
> This file is now the authority on the look. Colors below were **measured**, not guessed: reference images were sampled in
> real Chrome (canvas, 4-bit-per-channel buckets), and in-game colors were read straight from `index.html`.

---

## 1. The non-negotiables (any rebuild must keep these)

| Rule | Exact value |
|---|---|
| Era / feel | Sega Genesis 16-bit, top-down action RPG (feel inspired by *Crusader of Centy*, art 100% original) |
| Internal resolution | **320×224**, scaled with `image-rendering: pixelated`, integer scale when possible |
| Grid | Tiles **16×16**; characters **16×20**; boss drawn at **2×**; camp coin mosaic **96×96** |
| Outline | Every character has a 1-px dark outline: Shibas `#1a0e08`, cats `#120c16` |
| Shading | 2–3 shades per material, light from the **top-left** |
| Pixels | Integer coordinates only, **no anti-aliasing**, no `ctx.arc` for sprites, no gradients inside sprites |
| Text | 3×5 **uppercase** bitmap font (`FONT`), black drop shadow, ≤ 75 chars/line |
| Assets | Everything drawn **in code** (string templates + palettes). No image files in the shipped game. |
| Identity | **Dogecoin is the core**: orange Shiba "doge" heroes vs half-human cats; gold DOGE coin everywhere (HUD, camp mosaic, title) |

---

## 2. The DOGE look (hero and every Shiba NPC)

Built from the 16×10 head template `HEAD.dog.down` + a body template, colored by palette roles:

```
 0  ...OO......OO...     O = outline        #1a0e08
 1  ..OFFO....OFFO..     F = fur (doge orange) #e8922c
 2  ..OFPFOOOOFPFO..     P = inner ear (pink)  #f0a0a0
 3  .OFFFFFFFFFFFFO.     C = cream face/belly  #fbe8c4
 4  .OFCFFFFFFFFCFO.     <- the two C pixels at cols 3 and 12 are the CREAM EYEBROW DOTS (signature Shiba marking)
 5  .OFFEFCCCCFEFFO.     E = eye               #140c0c
 6  .OFCCCCNNCCCCFO.     N = nose (2 px)       #140c0c
 7  ..OCCCCCCCCCCO..
 8  ...OCCCCCCCCO...     cream muzzle widens toward the chin = the "doge" smile shape
 9  ....OOOOOOOO....
```

**Hero palette (`SPR.hero`):** fur `#e8922c`, cream `#fbe8c4`, tail `#fbe8c4`, tunic `#6a4a2a`, tunic accent `#fbe8c4`,
belt `#b08a50`, legs `#2856a8`. Accessories: sleepy half-closed eyes (top eye pixel painted fur `#e8922c`) and a **barrel
hammer** on the right shoulder — handle `#7a4a1a` / `#5a3414`, barrel head `#c09060` with top band `#a07040`.

Walk cycle: front/back frames `[0,1,0,2]`, side `[0,1,0,1]` (sides have no frame 2 — never index it).

---

## 3. The DOGE coin (camp centerpiece) — current in-code version

`MOSAIC` (96×96 px, drawn on the camp plaza floor, walkable, centered on tile `(40,33)`):

| Ring (distance `d` from center 47.5,47.5) | Color |
|---|---|
| `d > 46` outer rim | `#7a5010` (dark bronze) |
| `41 < d ≤ 46` gold band, **upper half** (`y < 44`) | `#fff0a0` (highlight — light from the top) |
| `41 < d ≤ 46` gold band, lower half | `#f0c030` |
| `40 < d ≤ 41` inner rim | `#7a5010` |
| interior | `#e8b838`, with a 6-px tile grid `#d8a028` (`x%6===0 || y%6===0`) = the "mosaic tiles" |

On top: the doge head (`HEAD.dog.down`) at **4× scale**, origin `(16,28)`, palette outline `#5a3410`, fur `#e8922c`,
cream `#fbe8c4`, ear `#f0a0a0`, eyes/nose `#1a0e08`.

`COIN` HUD icon (7×7): body `#f0c030`, outline `#7a5010`, shown left of the DOGE balance (`#f8d050` text).

### 3b. Planned replacement — the user's own Dogecoin-logo coin art (PENDING the image)
The user wants the camp coin replaced by **"the exact art image I made with the exact Dogecoin logo."** That image is not in
the repo yet. Plan once it is provided (keeps the zero-asset rule):
1. Put the original in `docs/art/doge-coin-source.png` (kept as the reference for this one asset).
2. Convert it to **in-code pixel art at the coin's real size (96×96)**: sample in Chrome, quantize to a ≤ 32-color palette
   that respects the gold/bronze ramp above, emit a palette + one string per row (same format as the sprite templates).
3. Draw it in `MOSAIC` instead of the procedural coin; derive the 7×7 `COIN` HUD icon from the same palette.
4. Verify visually (`scripts/browser-smoke.sh` screenshot) and keep it walkable floor decoration.

---

## 4. The three source references → how each became a game sprite

### 4a. Cloverheart, The Lucky Guide (Relotto) — `npc-cloverheart-relotto.png` (432×414, painted illustration)
- **Depicts:** an orange Shiba (cream muzzle, sharp ears) in a **deep-green hooded robe** with gold trim and buckles, a
  **glowing green four-leaf clover** emblem on the chest, holding a **staff topped by a large glowing clover**, a glowing
  map in the other paw; dungeon-market background. Banner: "CLOVERHEART, The Lucky Guide"; tag "such dungeon".
- **Measured palette (dominant):** background darks `#0b0b09 #262a36 #191c28 #1b2535`; parchment/fur light `#ede4c9`;
  tan `#d7b887 #dbc597`. (The greens/glow are smaller areas than the dark background, so they sit below the top 14.)
- **In-game (`SPR.clover`):** fur `#e8922c`, cream `#fbe8c4`, robe `#2e8b3e`, robe accent `#9cff7a`, belt `#6a4a20`,
  legs `#1e5a28`. Accessories: hood sides `#1e5a28` with highlight `#2e8b3e`; clover staff shaft `#6a4a20`, leaves `#48d848`,
  glow `#7cf07c`, bright heart `#c8ffb8`.

### 4b. Noah, the AI Brain (Model N-01) — `npc-noah-ai.jpg` (1828×576, 3D render)
- **Depicts:** a floating **rounded cube** (dark slate-teal shell) with a **holographic glowing brain** on its top face; each
  side face has a rounded screen with a **yellow→light-blue gradient** and a bold black stylized **"N"** with a wave; **cyan
  edge lights on one side, yellow on the other**; plaque "MODEL N-01"; sci-fi lab background with holographic charts.
- **Measured palette (dominant):** shell/teal `#364a56 #293b46 #455b67 #3a5665 #566b77`; deep shadow `#1b2c35`.
- **In-game (`SPR.noah`, static, gentle bob):** outline `#0e1a24`; top face `#3a6474`, body `#24404e`; screen ramp
  `#f8d878` → `#d8e8a8` → `#9fd0ff` (yellow to blue, top to bottom); the N in outline color; edge lights cyan `#40e0ff` (left)
  and yellow `#ffd040` (right); brain hologram `#9fd8ff` with highlights `#e0f4ff` and `#5ab0e8`.

### 4c. The Bitget Wallet Card — `npc-bitget-card.png` (2700×1674, flat vector)
- **Depicts:** a navy card with concentric chevron line patterns, a big **bright cyan chevron ">"**, silver EMV chip with
  contactless waves, Mastercard circles (red/orange) top-right, "Bitget Wallet" wordmark bottom-left.
- **Measured palette:** navy `#001f29` (70%), **cyan `#00f0ff`** (9%), line navy `#0a2a37 #123343`, Mastercard red `#eb001b`,
  orange `#f79e1b`, overlap `#ff5f00`, chip silver `#c7c8c8 #b8b8b9 #d4d5d6`.
- **In-game (`SPR.bitget`, a walking card):** outline `#000c12`, body `#00202c` (≈ card navy), stripe lines `#0b3a4a`,
  **chevron `#00f0ff` — byte-identical to the card**, chip `#c8c8c8`/`#909090`, white eyes, little legs. (Mastercard marks are
  intentionally NOT drawn: third-party trademark, not needed for the character.)

### 4d. Result — `sprites-phase4-preview.png` (kept, 5.6 KB, linked from docs)
The rendered row hero · Sphinx · Elder · Cloverheart (front) · Cloverheart (side) · Noah · Bitget card. Measured background
grass `#58b040`; it confirms outline `#1a0e08`, fur `#e8922c`, cream `#fbe8c4`, Sphinx blue `#2151a8` and gold `#f0c030`.

---

## 5. All character palettes (exact, from `index.html`)

`basePal` (shared by every Shiba): outline `O #1a0e08`, eye `E #140c0c`, nose `N #140c0c`, ear `P #f0a0a0`, whisker `W #e8e8f0`.

| Sprite | Fur F | Cream C | Tunic T | Accent A | Belt B | Legs L | Signature accessory |
|---|---|---|---|---|---|---|---|
| `hero` | `#e8922c` | `#fbe8c4` | `#6a4a2a` | `#fbe8c4` | `#b08a50` | `#2856a8` | barrel hammer, sleepy eyes |
| `bank` (Sphinx) | `#e8c030` | `#fff0a0` | `#2050a8` | `#f0c030` | `#f0c030` | `#e8c030` | striped gold/blue nemes, cyan gem `#40c8ff` |
| `sage` (Elder) | `#a09890` | `#d0ccc4` | `#c4a878` | `#a08860` | `#7a5a2a` | `#3a3430` | white beard, round glasses, cane |
| `merchant` (Wrenchpaw) | `#c97a2a` | `#f4dcb0` | `#2856a8` | `#204898` | `#6a5030` | `#204898` | goggles `#d0d0d0`/`#60e0e0`, wrench |
| `clover` | `#e8922c` | `#fbe8c4` | `#2e8b3e` | `#9cff7a` | `#6a4a20` | `#1e5a28` | green hood + glowing clover staff |
| `tWarrior` | `#e8922c` | `#fbe8c4` | `#8a1f24` | `#d84038` | `#4a4a54` | `#5a1418` | red headband `#e02828`, steel pauldron `#b8bcc8` |
| `tArcher` | `#e8922c` | `#fbe8c4` | `#1f5a34` | `#49b86a` | `#3a2a18` | `#153f24` | forest hood `#17432a`, bow `#caa060` |
| `tHealer` | `#e8922c` | `#fbe8c4` | `#e8edf4` | `#4aa8e0` | `#b0c0d0` | `#9fb4c8` | halo `#9ff0ff`, mender staff `#d0dae8`/`#50e0b0` |

Cats use `catPal` (outline `#120c16`, nose `#e06080`, eyes `R #ff3030`) — the visual opposite of the warm doge palette.

---

## 6. Rules for anyone adding art (Antigravity, Claude Code, TryNoah)

1. Start from a template (`HEAD.dog`/`HEAD.cat` + `TOP` + `LEGS`) and a palette; add details in `acc(g,dir,frame)`.
2. Reuse the doge fur `#e8922c` and cream `#fbe8c4` for every Shiba unless the character is a deliberate exception
   (Sphinx gold, Elder gray, Wrenchpaw darker orange).
3. Keep the cream eyebrow dots and the 2-px nose — they are what make it read as "doge" at 16 px.
4. Gold ramp for anything DOGE/coin: `#7a5010` (rim) → `#d8a028` → `#e8b838` → `#f0c030` → `#fff0a0` (top highlight).
5. Check every new sprite visually: `node tests/sprites.mjs index.html tests/out/sprites.png` and
   `bash scripts/browser-smoke.sh` (real Chrome screenshot).
