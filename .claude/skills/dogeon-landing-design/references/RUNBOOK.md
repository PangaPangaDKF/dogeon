# Landing runbook: recipes that cost tokens to rediscover

## 1. Verify a landing change (the 3 gates)
```bash
node scripts/landing-check.mjs                 # truth gate: CHAIN params, CONTRACTS, assets exist, no emoji/eyebrows, nav ≤ 7,
                                               # CTAs, coin art from the game export, no canvas FX
node scripts/landing-probe.mjs                 # true 390/360 px overflow check (exit 1 lists the offending elements)
bash tests/check.sh                            # whole-project suite (~5 min; run it in the background and wait)
node scripts/landing-probe.mjs --shot '#mint' --out /tmp/mint.png    # 1280 px screenshot of one section, then Read the PNG
```
Local server for route checks: `PORT=8799 node server/relay.mjs &` then `curl` `/`, `/play`, `/health`, `assets/video/x.mp4` with
`-H 'Range: bytes=0-99'` (expect 206). Kill **your own** PID only; never `pkill node` (the user's relay may be running).

## 2. Screenshot and browser traps
- **Phone width:** headless Chrome won't lay out below ~500 px, so a `--window-size=390` screenshot is a cropped 500 px page that looks
  broken. Use `landing-probe.mjs`: it loads the page in an `<iframe width=390>`.
- **Sections:** `--screenshot` of `…/#anchor` comes out black, and `scrollTo` doesn't repaint. `landing-probe.mjs --shot` shifts the body
  up with a negative margin instead.
- **Video:** Playwright's Chromium can't decode H.264, so videos render black in local screenshots (posters still show). For real
  playback use the user's Windows Chrome headless with its own profile (never touch the user's profile):
  `"/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --user-data-dir='C:\Users\dulbi\AppData\Local\Temp\x\prof'
  --autoplay-policy=no-user-gesture-required --virtual-time-budget=30000 --dump-dom 'C:\…\test.html'`, where `test.html` creates
  `<video muted>` elements for each live URL and prints `videoWidth`, `duration` and whether `currentTime` advances after `play()`.
  Paths passed to Windows Chrome must be Windows paths; delete the temp folder afterwards.
- **iOS Safari** paints nothing for `preload="metadata"` without a `poster`; every `<video>` needs one.
- **Tag colors and other pixel facts:** measure, don't guess. Load the PNG into a canvas in headless Chrome, count pixels by color with
  `getImageData`, and compare with the code's palette (D-093 found a "party" capture was really a red rival tag).

## 3. Cropping a user screenshot (HUD, price, wallet)
No PIL here, and Playwright's ffmpeg can't read PNG. Crop in headless Chrome: a scratch HTML loads the PNG (copied next to it), draws
`drawImage(img, 0, y0, w, h, 0, 0, w, h)` with `imageSmoothingEnabled=false`, writes `toDataURL()` into a `<pre>`, read it with
`--dump-dom`, base64-decode in Python. In-game shots at 3×: the HUD is the top 54 px (`HUD_H` 18 game px) and the hint band is the
bottom 54 px. Keep the user's framing; crop only what rule T8 forbids (price, `$` values, wallet/address lines).

## 4. Domains and deploy (BRAIN deploys; LANDING only verifies)
One Fly app `dogeon-game` runs `server/relay.mjs`, which routes by host and path (D-082):
| Request | Serves |
|---|---|
| `dogeon.lat/` | `landing.html` |
| `dogeon.lat/play`, `/game`, any URL with `?mp` | the game (`index.html` + `src/game.js`) |
| `play.dogeon.lat/` (any host starting `play.`) | the game |
| `/health` | JSON status |
| `/assets/**` (incl. mp4/webm with Range), `/src/**` | static files, path-traversal guarded |
- DNS at Spaceship: `@` A `66.241.125.199` + AAAA `2a09:8280:1::1f7:c716:0`; `play` CNAME `dogeon-game.fly.dev`. No `www`: the free plan allows
  only 2 custom certificates, and a cert-less host shows a TLS error.
- One machine (`fly scale count 1`; relay rooms live in memory). It sleeps when idle (`auto_stop_machines = "stop"`, user's choice;
  ~3 s cold start). `fly status` showing `stopped` is normal.
- DNS checks without `dig`: DNS over HTTPS (`https://cloudflare-dns.com/dns-query?name=<host>&type=A`, header
  `accept: application/dns-json`); pin an IP with `curl --resolve <host>:443:66.241.125.199` if the local resolver caches NXDOMAIN.
- When writing commands for the user, put bare command lines in a code block; never "run `cmd`" in prose (the word "run" got typed).
- If a `fly` command says `token expired`: `fly auth login`, open the printed URL in the Windows browser, click Authorize.

## 5. Media and art (BRAIN produces; LANDING places)
- Gameplay = real captures only. BRAIN's pipeline: `scripts/trailer/` (cards with the game font, original chiptune, beat cuts) →
  `assets/video/` (trailer 720p with music; silent loops ≤ 6 s, 640 px, each with a `.jpg` poster). Full shot list: `docs/TRAILER_SCRIPT.md`.
- Place loops as `<video autoplay muted loop playsinline preload="none" poster>`; the trailer as `<video controls preload="metadata"
  playsinline poster>`. A small script at the end of `landing.html` keeps loops on their poster under `prefers-reduced-motion`.
- Check every delivered frame against the truth rules before placing it (D-098 held back clips that showed in-game DOGE and a cursor).
- Icons: `node scripts/landing-icons.mjs` renders `assets/icons/*.png` (incl. `dogecoin.png`) from `src/game.js`. Never hand-draw.
- AI art (nano banana etc.) only as labeled key art (thumbnails, end cards), never as gameplay, never redrawing the coin.

## 6. Two agents (skill `dogeon-agent-sync`)
- Board `docs/AGENT_BOARD.md` = tasks + D-number reservations; `docs/HANDOFF_LOOP.md` = turn log (newest first).
- `hc ls` shows terminals (LANDING = `dogeon`, BRAIN = `CLaudote`); `hc send <address> "…"` only when the other is `done`/`idle`.
- Commit only your paths: `git commit -m … -- <paths>`. Never `git add -A`, stash, reset or touch the other lane's uncommitted files.
