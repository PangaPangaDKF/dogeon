# DOGEON — Gameplay Trailer Script & Production Guide

Version: 2.0 (2026-11-12, D-083) · Governed by the `dogeon-landing-design` skill (truth rules T1–T6).
Target: a **45–60 s** trailer for the landing hero, YouTube and X, plus a **15–30 s** vertical cut.
The game is **silent by design (R2)**: all music is added in the edit.

---

## 0. The one promise (every shot serves it)
> **A 16-bit action RPG where what you craft becomes a REAL on-chain NFT, and you can play it right now, free, with friends.**

Show the fusion; don't explain it. The craft → mint → wallet moment is the shot nothing else has.

## 1. The three tools and what each one is for
| Tool | Job | Never use it for |
|---|---|---|
| **OBS Studio** (free) | Every gameplay shot: real captures | n/a |
| **nano banana** (Gemini image) | Thumbnail, key art, end-card background, title-card plates | Gameplay shots, or redrawing the coin or sprites as if they were in-game (T3/T4) |
| **Canva** | The edit: timeline, music, beat cuts, text cards, 9:16 resize, export | Generating fake gameplay |

AI video tools (Veo and similar) are out: AI footage presented as gameplay would break T3 and mislead players.

---

## 2. Trailer script (cut to your music; timecodes are a guide)
| # | Time | Visual | On-screen text | Source |
|---|---|---|---|---|
| 1 | 0:00–0:03 | **HOOK.** Hero stands on the giant camp Dogecoin, then dashes out the south gate. | (none) | CAPTURE S1 |
| 2 | 0:03–0:06 | Fast combat flash: one hammer hit, damage numbers. | `SUCH HEIST. MUCH DOGE.` | CAPTURE S2 + Canva card |
| 3 | 0:06–0:14 | **One move per class:** Warrior Ground Pound → Archer 3-arrow volley → Healer Mend. | `3 CLASSES. 1 PER WALLET.` | CAPTURE S3a/b/c |
| 4 | 0:14–0:20 | **The loop:** kill a cat → pick up the drop → `F GATHER` a tree → `F FISH` at a pond. | `FIGHT. GATHER. FISH.` | CAPTURE S4 |
| 5 | 0:20–0:28 | **THE PAYOFF:** bag or Sphinx market → MINT → MetaMask confirm → the NFT row in the wallet list. | `REAL NFTs. REAL DEFI.` | CAPTURE S5 (the real mint) |
| 6 | 0:28–0:34 | **Menace:** the market turns BEAR (red tint), cats speed up, the brute winds up and charges. | `THE MARKET FIGHTS BACK.` | CAPTURE S6 |
| 7 | 0:34–0:48 | **CLIMAX:** 3-player Cat Lord raid. Arrows, slams, the boss HP bar draining, summons under 50%. Fastest cuts, music drop. | `BRING FRIENDS.` | CAPTURE S7 |
| 8 | 0:48–0:52 | Victory: Golden Yarn drop, "WOW" floaters, the party together. | (none) | CAPTURE S8 |
| 9 | 0:52–1:00 | **END CARD (hold 3 s):** logo, `dogeon.lat`, `PLAY FREE · 1–8 PLAYERS`, "Built on DogeOS". | `DOGEON.LAT · PLAY FREE` | nano banana background + Canva text |

Text-card rules: 4 words or fewer, pixel font, on a beat, 6 cards at most. Every claim is true in the code: 3 classes and one per
wallet (D-078), 1–8 players (relay cap), real mint (DogeItems on Chikyū), market sentiment (`updMarket`).

**Vertical 9:16 cut (15–30 s):** shots 1 → 3 → 5 → 7 → 9. Keep the action centered when you capture.

---

## 3. Scenes to capture (OBS), with exact staging
### Setup once
1. OBS → Settings → Video: base and output **1920×1080**, **60 fps**. Output: MP4, recording quality "High".
2. Start the server: `node server/relay.mjs`, then open `http://localhost:8787/play` in **Chrome** and press **F11** (fullscreen).
   The game snaps itself to a whole-number scale (4× = 1280×896 at 1080p), so pixels stay sharp.
3. OBS source: **Window Capture** (Chrome). Right-click the source → **Scale Filtering → Point**, so OBS never blurs the pixels.
4. Record each scene 5–10 s longer than you need and trim in Canva.
5. The console commands below go in Chrome DevTools (F12 → Console) and are for staging only. Use a session **without** your
   real wallet connected for S3 (class swaps), because classes are one per wallet on-chain.

| Scene | What to record | Staging |
|---|---|---|
| **S1** coin hook | Hero on the coin, then walking south out of camp | Start a game and walk onto the coin in the camp center. |
| **S2** combat flash | 2–3 hammer hits on a cat, with damage numbers | Walk out of camp and hit the first cat. |
| **S3a** Warrior | `K` Ground Pound in a group of cats | Console: `applyClass('warrior'); P.mp=P.maxMp` |
| **S3b** Archer | `K` 3-arrow volley | `applyClass('archer'); P.mp=P.maxMp` |
| **S3c** Healer | Take a hit, then `K` Mend (HP goes up) | `applyClass('healer'); P.mp=P.maxMp` |
| **S4** loop | Kill → pick up the drop → `F` at a tree → `F` at a pond, catch a fish | Field near water. |
| **S5** **real mint** | Bag (`I`) or Sphinx market → MINT → MetaMask popup → confirm → NFT row appears | **Real wallet on Chikyū with at least 1.1 testnet DOGE.** This capture is also the mission item 1 proof: send the tx hash to Claude to verify on-chain. Record it on `https://dogeon.lat` or locally. |
| **S6** bear market | Red tint, faster cats, the brute's wind-up and dash | Console: `mkt.hist=Array(29).fill(mkt.p*2)` (the next market tick reads BEAR) |
| **S7** 3-player raid | Three doges fighting the Cat Lord | Second terminal: `node scripts/trailer-bots.mjs ws://localhost:8787 trailer boss` (2 bots circle the boss chamber). Open `http://localhost:8787/play?room=trailer&name=YOU`, then in the console: `state.gateOpen=true; P.x=40*16+8; P.y=7*16+8` to jump to the boss. For a real 3-human raid, two friends open the same `room=trailer` URL instead of bots. |
| **S8** victory | Boss dies, Golden Yarn drops, floaters | Continue S7 until the kill. |

Bots alone with no boss: run `node scripts/trailer-bots.mjs` (they circle the camp) for a lively 3-player camp shot.
Also save **stills** of S1, S5 and S7 (OBS screenshot hotkey or Win+Shift+S) as references for nano banana and the thumbnail.

---

## 4. nano banana (Gemini image): art, not gameplay
Open Gemini and choose the image model ("Nano Banana"). If your plan has **Nano Banana Pro**, use it: it renders text better and
outputs at higher resolution. **Always attach a real screenshot as the reference.**

### What to make
| Asset | Ratio / size | Reference to attach |
|---|---|---|
| A1 YouTube thumbnail | 16:9 (1280×720) | S7 still or `assets/screenshots/05-boss.png` |
| A2 End-card background | 16:9 (1920×1080) | `assets/screenshots/02-camp-coin.png` |
| A3 Vertical poster / end card | 9:16 (1080×1920) | `02-camp-coin.png` |
| A4 Title-card plate (no text) | 16:9 | any field screenshot |

### Prompt template (copy it, then fill the brackets)
```
Use the attached screenshot from my 16-bit pixel-art game DOGEON as the exact style and content reference.
Create a [16:9 YouTube thumbnail] composition.
Keep the attached game frame EXACTLY as it is: same pixels, same sprites, hard pixel edges, no smoothing,
no redrawing, and do NOT change the golden Dogecoin coin in any way.
Around the game frame, add: [a dark navy-to-black background (#020307) with a thin glowing DogeOS-yellow (#ffd500) border
and subtle cyan (#0bdafe) scanlines]. Leave clear empty space [on the right third] for a title.
No extra characters, no text, no logos.
```
Variants: for **A2**, ask for "empty space in the center for the logo and URL". For **A4**, ask for "the screenshot blurred and
darkened 60% behind a clean empty area for one line of text".

### Rules (truth rules T3/T4)
- If the model alters the game frame or the coin, **discard the result**. Place the real screenshot on top in Canva and use the AI
  image only as the background around it.
- Have nano banana make plates **with no text**, and set all text in Canva, so spelling and font stay exact.
- Never caption an AI image as gameplay.

---

## 5. Canva: edit, cut and export
1. **Create a design → Video (1920×1080).**
2. **Uploads:** drag in the OBS clips (S1–S8), the nano banana plates (A2, A4) and `assets/screenshots/*`.
3. **Music:** Canva → Audio → search "chiptune" or "8-bit" (Canva's library is licensed for use in Canva designs), or upload a
   royalty-free track from Pixabay Music. Pick 120–140 BPM, and **put the music on the timeline first**.
4. **Order the clips** following the script in §2, and trim each clip to its action (split with **S**).
5. **Beat Sync** (Canva Pro: select the audio → Beat Sync) snaps cuts to the music. Without Pro, cut by hand on the beat markers.
6. **Text cards:** add the card text from §2 in a pixel font. With Canva Pro, upload **Press Start 2P** (free on Google Fonts) to
   Brand Kit → Fonts; without Pro, search Canva's fonts for a pixel style. Use white or `#ffd500` on dark, centered, 0.6–1 s per card.
7. **Keep pixels sharp:** keep clips at 100% or "fit", and skip Canva's blur and glow effects on gameplay.
8. **End card (0:52–1:00):** A2 background + "DOGEON" + `dogeon.lat` + `PLAY FREE · 1–8 PLAYERS`, held at least 3 s.
9. **Export:** Share → Download → **MP4, 1080p**, named `dogeon-trailer-16x9.mp4`.
10. **Vertical cut:** Resize (Pro: Magic Switch) to 1080×1920, keep shots 1, 3, 5, 7 and 9, and recenter each clip on the action.
    Export `dogeon-trailer-9x16.mp4`.
11. **Thumbnail:** finish A1 in Canva (add "DOGEON" and "PLAY FREE") and download a 1280×720 PNG.

---

## 6. Delivery
| File | Goes to |
|---|---|
| `dogeon-trailer-16x9.mp4` (60 s or less, 1080p, H.264) | YouTube, X, and the landing hero (backlog B7: self-hosted `<video>` with a poster) |
| `dogeon-trailer-9x16.mp4` (15–30 s) | X, TikTok, Reels |
| `thumbnail-1280x720.png` | YouTube; also a candidate for `og:image` |
Give Claude the file paths to wire them into the landing.

## 7. Checklist before publishing
- [ ] Hooks within 3 s and ends on `dogeon.lat` held for 3 s.
- [ ] S5 shows a **real** mint, and the tx hash was verified on-chain.
- [ ] Every gameplay frame is a real capture; AI art appears only in the thumbnail, end card and plates.
- [ ] The Dogecoin coin was never altered by AI.
- [ ] Text cards are spelled right and say only true things.
- [ ] Music is licensed for this use and credited if its license asks.
- [ ] A 9:16 cut exists.

## Changelog
- 2.0 (2026-11-12, D-083): Tool split (OBS / nano banana / Canva); scene-by-scene staging with console commands checked against
  `src/game.js` (`applyClass`, `mkt.hist`, `state.gateOpen`); `trailer-bots.mjs` gains a `boss` mode so the bots join the raid shot;
  nano banana prompt template and truth rules; step-by-step Canva edit; OBS Point scaling; S5 doubles as the real-mint proof.
- 1.0 (D-081 follow-up): First shot list and recording setup.
