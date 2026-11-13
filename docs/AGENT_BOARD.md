# DOGEON Agent Board (BRAIN ↔ LANDING mailbox)

Rules: `.claude/skills/dogeon-agent-sync/SKILL.md`. Append-only. Newest log entry at the bottom.
BRAIN = herdr terminal `CLaudote` (heavy work, decisions, deploy). LANDING = herdr terminal `dogeon` (`landing.html` only).

## Status
- BRAIN: B1 (D-097, remove in-game DOGE) in progress; new tasks B3–B4 below.
- LANDING: L1–L4 + L6 done (`01f2b59`, D-098). L5 waits for D-097. Then a 2-line copy fix, and you can deploy.
- Deploy: after D-097 is committed and LANDING's L5 commit (or deploy now and again after L5; your call).

## D-numbers
| D | Lane | What |
|---|---|---|
| D-095 | BRAIN | Raid cycle, 60 s Cat Lord respawn (committed `7d05d41`) |
| D-096 | BRAIN | Relay serves video with Range, trailer pipeline + original music, `assets/video/`, this board + sync skill |
| D-097 | BRAIN | Remove all in-game (off-chain) DOGE: no coin drops, no Golden Yarn DOGE, no vault, no carried DOGE |
| D-098 | LANDING | Reserved for L1–L6 |
| D-099+ | | Next free: reserve here first |

## Tasks for LANDING (`landing.html` only)
**L1. Trailer in the hero (B7).** Under the hero screenshot, add
`<video controls preload="metadata" playsinline poster="assets/video/trailer-720p.jpg" src="assets/video/trailer-720p.mp4">`
(35 s, 1280×720, 3.2 MB, H.264 + AAC music). No autoplay (it has sound). Keep the hero image; the video goes below it.
Alt or caption: "DOGEON trailer: real gameplay captures, real testnet mint."

**L2. Gallery loops (B4).** Four silent loops (640 px wide, ≤ 171 KB each), each with a `.jpg` poster of the same name:
| File | Shows (only say this) |
|---|---|
| `assets/video/mint.mp4` | Forge menu → wallet "Transaction request" → "MINTING" → "MINTED HAMMER LV2 NFT! TO THE MOON." (6 s) |
| `assets/video/verified.mp4` | DogeOS explorer: tx `0x5025f871…c30767`, Success, "Transferred #13 DOGEI" (2.5 s) |
| `assets/video/warrior.mp4` | Warrior class kills a mini-boss in the field, "MINI-BOSS SLAIN! SUCH LOOT." (3 s) |
| `assets/video/victory.mp4` | Warrior vs the Cat Lord → "VICTORY!" banner (4.5 s) |
Use `<video autoplay muted loop playsinline preload="none" poster="…jpg">`. Make each loop replace the gallery screenshot that shows
the same thing (your call which cards). With `prefers-reduced-motion: reduce`, show the poster only (pause it and remove autoplay in JS).
The lightbox may keep showing posters.

**L3. On-chain proof in the NFT Mint section.** "Real mints on DogeOS Chikyū testnet": token #13 →
`https://dogeos-testnet.l2scan.co/tx/0x5025f871b37b0a0a88081d0b4798dfc4b9014f007a0b7341b43e1323c2c30767`, and token #12 →
`https://dogeos-testnet.l2scan.co/tx/0xda810f92d27f00d59e2b0ea55499607a7ff1fd4cca194b46a23586287c46e1c0`.
BRAIN verified both with `eth_getTransactionReceipt` on `rpc.testnet.dogeos.com`: status 1, contract DogeItems
`0xbF858f66251005D1d20c92B9359A7dbD0E6Dd6C4`, value exactly 1 DOGE, ERC-721 Transfer from `0x0`, blocks 9,429,348 (#12) and 9,429,362 (#13).

**L4. `#party` raid cards (B12).** The "30-MINUTE EXTRACTION WINDOW" and "5-HOUR GATE SEAL LOCKOUT" cards are false since D-095
(`7d05d41`). The truth: 60 s after the Cat Lord dies he returns at full HP and the whole server room restarts the heist at quest 1
(slay 8 cats → 3 brutes → gate opens → Cat Lord); the gate closes and anyone in the chamber is moved out; HUD shows `BOSS IN 45S`
then `RAID ON`. Boss HP grows with raiders (+50% per extra player in the room, `server/relay.mjs` `onWorld`). No timer, no lockout.

**L5. No in-game DOGE (user, 2026-11-13).** Wait for BRAIN's D-097 commit (it will be logged below). Then remove every landing claim
that the game gives, drops, stores or spends off-chain DOGE (coin drops, "two currencies", the camp vault, Golden Yarn "+150 DOGE",
losing 50% DOGE on death). Testnet DOGE is used ONLY for minting, the DEX, staking and class choice (the web3 parts).

**L6. Closeout.** RULE L0 for your lane (skill version + changelog with B4/B7/B12 struck, mirror to `.agents/`), your D-098 entry,
`node scripts/landing-check.mjs`, the 390/360 px overflow probe, 1280 px renders of the hero and gallery, `bash tests/check.sh`.
Commit only your paths. Then report below and `hc send` BRAIN (terminal `CLaudote`) if it's idle. BRAIN deploys; you don't.

## Tasks for BRAIN
- B3. **Recut media that shows in-game DOGE** (false after D-097): `assets/video/victory.mp4` + `victory.jpg` and the poster `trailer-720p.jpg`
  show the toast "GOLDEN YARN! +150 DOGE"; the trailer itself has that frame in the boss scene. Crop the toast band or use frames
  without it; also remove the mouse cursor seen in the victory and warrior frames. Keep the same file names. Then tell me, and I'll
  put the victory loop on the Cat Lord gallery card and switch the trailer poster back to `trailer-720p.jpg` (interim: `05-boss.png`).
- B4. When D-097 is committed, log its hash here and `hc send` me; L5 is 2 lines in `#economy` (the "TWO CURRENCIES" title and
  its sentence about in-game DOGE coins); I'll do it on my next turn.
- B1. D-097: remove all in-game DOGE (in progress).
- B2. Deploy after L1–L6 are committed: `fly deploy -a dogeon-game`; verify `/`, `/play`, `/health`, a video with Range (206).

## Log
- 2026-11-13 01:40 · BRAIN · `7d05d41` D-095 raid cycle committed (check.sh ALL CHECKS PASSED: sim 0 failed, relay 12/12).
- 2026-11-13 01:40 · BRAIN · D-096 (this commit): relay serves `assets/**.mp4|webm` with Range (200 / 206 / 416; tests/relay.mjs
  "video range" + "assets traversal" pass, 14/14). Trailer pipeline `scripts/trailer/` (build.sh, cards.mjs with the game's
  FONT/LOGO, music.mjs = original 120 BPM chiptune, cuts on the beat). Masters (not in git): `tests/out/trailer/` and
  `C:\Users\dulbi\Videos\dogeon-trailer-16x9.mp4` (35 s) / `dogeon-short-9x16.mp4` (30 s). Landing files: `assets/video/` (above).
  Tests run: tests/relay.mjs 0 failed; volumedetect mean −16 dB / peak −0.1 dB; durations 35.00 / 30.00 s. → LANDING: L1–L6.
- 2026-11-13 · LANDING · `01f2b59` D-098: L1 trailer (interim poster 05-boss.png), L2 warrior loop + mint/verified loops in a new proof block
  (victory held: shows "+150 DOGE"), L3 NFT #13/#12 tx links, L4 raid cards for D-095, reduced-motion fallback, landing-check now
  ignores 64-hex tx hashes. Tests: landing-check OK; overflow 0 at 390/360px; relay video 200 + Range 206; check.sh ALL CHECKS PASSED
  (relay 14/14). L5 waits for D-097. → BRAIN: B3 (recut media without in-game DOGE), B4 (ping me when D-097 lands).
