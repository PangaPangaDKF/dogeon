# DOGEON — Two-Agent Handoff Loop (final phase)

Two Claude Code sessions work this phase in turns, about an hour apart, until it is done:
- **Landing agent** (session `dogeon-c2`): landing.html, assets/, trailer integration, landing skill/prompt.
- **Game/trailer agent** (the other session): src/game.js, server/, tests/, contracts, trailer production.

## Protocol (every turn, both agents)
1. Read `CONTEXT.md` §00, then this file from the newest entry down. Run `git status -s && git log --oneline -8`.
2. Never edit a file the other agent has uncommitted. Commit only your own paths (`git commit -- <paths>`). Claim the next free
   D-number in `docs/DECISIONS.md` before using it.
3. Verify before you report: `bash tests/check.sh`, plus `node scripts/landing-check.mjs` and the 390/360px overflow probe
   (landing skill §7) for landing work.
4. End the turn by appending an entry below: **Done**, **Verified**, **Next for the other agent** (concrete tasks),
   **Needs the user** (only what an agent can't do: wallet clicks, DNS/deploy, downloads).
5. If another session shows up in `ListAgents`, also send the entry by SendMessage.

## Phase goal: done when every box is checked
- [ ] Relay serves video: mp4/webm in the assets regex + MIME map, HTTP Range (206) for iOS Safari, a test in `tests/relay.mjs`.
- [ ] Hero trailer: self-hosted `<video controls preload="metadata" playsinline poster>`, H.264 720p, ≤ 8 MB (B7).
- [ ] 3–4 muted looping clips (≤ 6 s, ≤ 1 MB, no audio, poster, reduced-motion fallback) replace matching gallery shots (B4).
- [ ] Real mint proof on the landing: token #13, full tx hash linked to the Chikyū explorer (no truncated or invented values).
- [ ] Raid cards in `#party` match the D-095 raid cycle (60 s Cat Lord respawn, no 30-min timer / 5-h seal) (B12).
- [ ] No price anywhere in clips or copy (T8); captions say only what the clip shows (T1).
- [ ] Deploy: the game/trailer agent runs `fly deploy -a dogeon-game` after both agents have committed, then verifies dogeon.lat and play.dogeon.lat.

Scope freeze (user, 2026-11-13): **nothing new gets added.** Finish and polish only. Dropped: DogeOS brand-kit logo (B13, no kit) and
the green-tag party capture (B11, optional; use it only if the user supplies one). Extra Doge coin art is optional and only from sources
whose license clearly allows it; otherwise the landing keeps the game's own coin as it is.

Sources: trailer `C:\Users\dulbi\Videos\dogeon-trailer-16x9.mp4` (35 s, 1080p60), short `C:\Users\dulbi\Videos\dogeon-short-9x16.mp4`
(29 s, 1080×1920). Mints #12 (0xda810f92…) and #13 (0x5025f871…) were verified on Chikyū by the game/trailer agent.

---

## Entries (newest first)

### 2026-11-13 02:10 · BRAIN (`CLaudote`) → LANDING
- **Done:** `ab8e136` D-097 no in-game DOGE. D-099: your B3 (victory/warrior/trailer/poster recut: no "+150 DOGE" toast, no "+1 DOGE"
  floaters or coins, cursor erased in warrior + boss shots). D-097's DECISIONS entry was added in D-099's commit (your D-098 moved HEAD).
- **Verified:** check.sh ALL CHECKS PASSED; frame sheets of the new loop + posters reviewed.
- **Next for you:** L5 + L7 in `docs/AGENT_BOARD.md` (D-100 reserved). Report + `hc send` me. I deploy right after.
- **Needs the user:** nothing until the deploy.

### 2026-11-13 · Landing agent (LANDING, herdr `dogeon`) → BRAIN
- **Done:** `01f2b59` (D-098): trailer under the hero, warrior loop in the gallery, a "Real mints on DogeOS Chikyū testnet" block with
  the mint + explorer loops and full tx links for NFT #13/#12, raid cards rewritten for D-095, reduced-motion fallback, landing-check
  fix for tx hashes, skill v1.14.
- **Verified:** landing-check OK; overflow probe 0 at 390/360px; relay serves the videos (200, Range → 206); `bash tests/check.sh` ALL
  CHECKS PASSED (relay 14/14).
- **Held back (truth):** `victory.mp4/.jpg` and `trailer-720p.jpg` show "GOLDEN YARN! +150 DOGE", false after your D-097, plus a mouse
  cursor. The trailer uses `05-boss.png` as its poster until you recut.
- **Next for you:** board tasks **B3** (recut those frames, same file names) and **B4** (commit D-097, log the hash, ping me). After my
  L5 (2 lines), deploy.
- **Needs the user:** nothing.

### 2026-11-13 01:45 · Game/trailer agent (BRAIN, herdr `CLaudote`) → landing agent
- **Done:** `7d05d41` D-095 raid cycle. `59b94ff` D-096: relay serves `assets/**.mp4|webm` with Range (200/206/416) + 2 relay tests;
  trailer pipeline `scripts/trailer/` with an **original 120 BPM chiptune** (no license to track; cuts on the beat); landing files in
  `assets/video/` (posters are `.jpg`, not PNG: smaller, same frame):
  `trailer-720p.mp4` 35 s 3.2 MB H.264+AAC music (+ `trailer-720p.jpg`, the VICTORY frame) · `mint.mp4` 6 s 41 KB forge → wallet
  request → MINTED · `verified.mp4` 2.5 s 19 KB explorer tx #13 · `warrior.mp4` 3 s 171 KB mini-boss kill · `victory.mp4` 4.5 s
  171 KB Cat Lord → VICTORY (each + `.jpg`). All silent loops, 640 px, no HUD price/USD/address.
  Full hashes: #13 `0x5025f871b37b0a0a88081d0b4798dfc4b9014f007a0b7341b43e1323c2c30767` (block 9,429,362),
  #12 `0xda810f92d27f00d59e2b0ea55499607a7ff1fd4cca194b46a23586287c46e1c0` (block 9,429,348); both status 1, DogeItems, 1 DOGE, mint from 0x0.
- **Verified:** `bash tests/check.sh` ALL CHECKS PASSED (sim 0 failed, relay 14/14 incl. video range + assets traversal).
- **New user rule (2026-11-13):** the game must have **no in-game DOGE at all** (no coin drops, no Golden Yarn DOGE, no vault, no DOGE
  lost on death). Testnet DOGE is only for mint, DEX, staking and class choice. I'm doing it now as D-097 (game lane).
- **Next for you:** tasks **L1–L6** in `docs/AGENT_BOARD.md` (hero video, 4 loops, mint proof, `#party` cards, then L5 = drop
  in-game-DOGE copy after my D-097 lands, closeout). Your D-number is **D-098** (reserved there). The two-lane rules are in skill
  `dogeon-agent-sync`: use this file as the turn log and `AGENT_BOARD.md` for tasks and D-numbers.
- **Coin art:** skipped. No source with a clear license; the landing keeps the game's own coin (your D-094 research agrees).
- **Needs the user:** nothing now. I deploy after your L6 commit.

### 2026-11-13 · Landing agent (dogeon-c2): user's work split (overrides my previous note)
- **The landing agent does no video/audio editing.** It only wires finished files into `landing.html` and checks them.
- **Game/trailer agent owns:** the relay video route (mp4/webm + Range 206 + test); all cuts in `assets/video/`: the hero trailer
  (720p H.264 with the final **music**, ≤ 8 MB, poster PNG) and 3–4 silent loops (≤ 6 s, ≤ 1 MB, no audio, poster PNG; no HUD
  `DOGE $…` frames); the full tx hashes of mints #12/#13 written here; the deploy (`fly deploy -a dogeon-game`) once both agents
  have committed.
- **Optional Doge coin art:** only if you can source images whose license clearly allows use on this site (record source + license
  here and put the files in `assets/art/`). If not, skip it. The landing stays as it is.
- When your files are in place, list them here (path, duration, size, what each clip shows). I'll implement them on my next turn.


### 2026-11-13 · Landing agent (dogeon-c2) → game/trailer agent
- **Done:** D-090…D-094 on the landing: coin-centered hero (whole camp), PonziFi/testnet positioning with no price data (rule T8),
  "Come build on DogeOS", HUD-less 6-card gallery, party section (P → ALPHA/BRAVO/GOLD/SOLO; your capture had a **red** tag, so it is
  captioned as a rival), coin art exported from the game (`assets/icons/dogecoin.png`), and landing-check guards for coin data and FX.
- **Verified:** landing-check OK; overflow probe 0 at 390/360px; check.sh stages 1–6 pass.
- **Next for you (game/trailer agent):**
  1. Commit your in-progress D-095 work (raid cycle; CLAUDE.md, DECISIONS, GAME_GUIDE, relay, game.js, tests).
  2. In `server/relay.mjs` (your lane): serve `.mp4`/`.webm` from `assets/` (regex + MIME), add HTTP Range → 206 with
     `Accept-Ranges`/`Content-Range`, and add a relay test. Today an mp4 under `assets/` returns 404.
  3. Write the full tx hash of mint #13 (and #12) into this file, so the landing can link them exactly.
  4. Optional, if you have ffmpeg: export from the trailer a 720p H.264 hero cut (≤ 8 MB) and 3–4 silent loops (≤ 6 s, ≤ 1 MB) into
     `assets/video/`, plus poster PNGs. Crop or skip any frame that shows a HUD `DOGE $…` line. If you don't, say so and I'll cut them.
- **Needs the user:** green-tag party capture (both players press P and pick the same party); the DogeOS logo file from
  https://dogeos.notion.site/brandkit; `fly deploy -a dogeon-game` once both agents have committed.
- **My next turn (~1 h):** read your entry, wire the video route + clips into the landing, add the mint proof, rewrite the raid cards
  for D-095, run every check, and append the next entry here.
