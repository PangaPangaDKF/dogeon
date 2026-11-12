# DOGEON — Gameplay Trailer Script & Production Guide

> For whoever records/edits the trailer (you + Antigravity). Target: a **45–60 s** gameplay trailer for the landing hero,
> YouTube and X. Game copy & mechanics: [`GAME_GUIDE.md`](./GAME_GUIDE.md). The game is **silent by design (R2)** — all music
> is added in post, never captured from the game.

---

## 0. The one promise (every shot serves this)
> **"A 16-bit action RPG where everything you craft is a REAL on-chain NFT — and you can play it right now, free, with friends."**

Lead with the fusion that nothing else has: **pixel RPG feel + real DeFi/NFTs**. Don't explain it in text — show a craft → mint → wallet moment.

## 1. RPG-trailer best practices this script follows
1. **Hook in the first 3 seconds.** Open on motion + identity (hero + the giant Dogecoin), never on a static logo.
2. **Show, don't tell.** Gameplay footage carries it; ≤ 6 text cards, each ≤ 4 words, in the game's pixel font.
3. **Cut to the beat.** Pick the music first, then cut on its beats; pace **accelerates** toward the boss.
4. **Micro three-act** (≈55 s): Hook → World & loop → Escalation/climax → CTA. One idea per shot.
5. **End card held 3 s:** logo + `dogeon.lat` + "PLAY FREE". The URL is the payoff.
6. **Two aspect ratios:** shoot **16:9** (landing/YouTube) and crop a **9:16** vertical for X/TikTok. Keep action centered so it survives the crop.
7. **Crisp pixels:** capture the browser at a large **integer** zoom, 1080p, 60 fps, so the 320×224 art stays sharp.

---

## 2. Shot list (timecodes are a guide — cut to your music)

| # | Time | Shot | How to stage it |
|---|---|---|---|
| 1 | 0:00–0:03 | **HOOK.** Hero standing on the giant camp Dogecoin, camera on the coin, then hero dashes out the gate. | Title → Enter → walk onto the coin at `CX,CY`, then north out of camp. |
| 2 | 0:03–0:06 | Text card **"SUCH HEIST. MUCH DOGE."** over a quick combat flash. | Overlay in pixel font, on a beat. |
| 3 | 0:06–0:14 | **Combat montage, one hit per class:** Warrior cleave → Archer arrow volley → Healer mend pulse. | Three short clips; use `applyClass` per take, or 3 players. Show the `K`/`Q` skill each time. |
| 4 | 0:14–0:20 | **The loop:** kill a cat → whisker drops → pick it up → fishing cast at a pond. | Field + a pond. Quick cuts. |
| 5 | 0:20–0:28 | **The hook payoff — ON-CHAIN:** open the bag/forge, mint a Hammer NFT, cut to the DEX swapping DOGE ↔ item. Text card **"REAL NFTs. REAL DEFI."** | Sphinx → DOGEON Pool DEX. Show the mint confirmation + an item row. |
| 6 | 0:28–0:34 | **World/menace:** market turns **bear** (red tint), enemies get faster; brute telegraphs its red flash then dashes. | Trigger/wait for bear sentiment; frame the brute wind-up. |
| 7 | 0:34–0:48 | **CLIMAX — 3-player Cat Lord raid.** Three doges hammering the boss, arrow spreads, HP bar draining, boss summons help under 50%. | Multiplayer scene (setup in §3). This is the peak — longest shot, fastest cuts, music drop. |
| 8 | 0:48–0:52 | Victory — Golden Yarn drop, "WOW" floaters, party together. | Right after the boss dies. |
| 9 | 0:52–0:60 | **END CARD (hold 3 s):** DOGEON logo, tagline, **`dogeon.lat`**, "PLAY FREE — 1–8 PLAYERS". | Static; biggest, cleanest text. The call to action. |

**Text cards to make (pixel font, on-beat, ≤4 words):** `SUCH HEIST. MUCH DOGE.` · `REAL NFTs. REAL DEFI.` · `FIGHT. CRAFT. MINT.` · `BRING FRIENDS.` · `DOGEON.LAT — PLAY FREE`.

---

## 3. What you need (setup)

**Record (pick one):**
- **OBS Studio** (free, best quality) — capture the browser window, 1920×1080, 60 fps, MP4. Recommended.
- Or the browser's built-in MediaRecorder (lower effort, lower quality).

**Edit (free):** CapCut, DaVinci Resolve, or Windows Clipchamp. You only need cuts + text + one music track.

**Music (royalty-free chiptune/synth — credit per the license):** Pixabay Music, FreePD, or Incompetech. Pick an upbeat 8-bit track ~120–140 BPM; cut shots 6–8 to its build/drop.

**Visuals you already have:** 7 screenshots in `tests/out/landing/` for static cuts or the thumbnail.

### Staging the 3-player raid (shot 7)
```bash
# 1. serve game + relay
node server/relay.mjs                         # http://localhost:8787
# 2. add two ghost bots that walk the scene
node scripts/trailer-bots.mjs                 # botshadow + botpixel
# 3. open YOUR player in the same room (this is the one you record)
#    http://localhost:8787/?mp=ws://localhost:8787&room=trailer&name=YOU
```
Then jump to the boss in the browser console (from `CLAUDE.md` §6.4):
```js
state.gateOpen = true; P.x = 40*16+8; P.y = 7*16+8;   // teleport to the Cat Lord
```
(For a real 3-human raid, three people open the same `room=trailer` URL instead of bots.)

### Capture tips
- Browser at an **integer** zoom (e.g. 200–300%) so pixels stay crisp; hide bookmarks/toolbars (F11 fullscreen).
- Record **more than you need** per shot (5–8 s) — trim in the edit.
- Keep the key action **centered** so the 9:16 vertical crop still works.

---

## 4. Delivery
- **Main:** 16:9, 1080p, 45–60 s, MP4 (H.264). → landing hero + YouTube.
- **Vertical:** 9:16 crop, 15–30 s (shots 1, 3, 7, 9). → X/TikTok.
- **Thumbnail:** `tests/out/landing/05-boss.png` or the hero-on-coin frame.

## 5. Checklist before publishing
- [ ] Hooks in ≤3 s, ends on `dogeon.lat` held 3 s.
- [ ] Shows a real mint/DEX moment (the differentiator).
- [ ] Boss raid is the climax, cut to the music.
- [ ] Music is royalty-free and credited if required.
- [ ] A 9:16 vertical cut exists.
- [ ] No captured game audio (there is none — music is post only).
