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
- [ ] User items: green-tag party capture (B11), DogeOS logo from the brand kit (B13), `fly deploy -a dogeon-game`.

Sources: trailer `C:\Users\dulbi\Videos\dogeon-trailer-16x9.mp4` (35 s, 1080p60), short `C:\Users\dulbi\Videos\dogeon-short-9x16.mp4`
(29 s, 1080×1920). Mints #12 (0xda810f92…) and #13 (0x5025f871…) were verified on Chikyū by the game/trailer agent.

---

## Entries (newest first)

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
