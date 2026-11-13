---
name: dogeon-landing-design
description: Own design skill for DOGEON's public face — the landing page (landing.html on dogeon.lat), the gameplay trailer, key art and social assets. Load before designing, reviewing, writing copy for, or changing landing.html, assets/, docs/TRAILER_SCRIPT.md, or any marketing image or video. Holds the read-first list, the real design tokens, truth rules that tie every claim to the game code, LLM design practices, the review checklist, the verification commands and the open backlog. Must be updated in the same commit as every landing, trailer or art change.
---

# DOGEON Landing & Trailer Design Skill

Version: 1.8 (2026-11-13) · Owner: the landing-page lane (Claude Code) · Pair with `prompts/LANDING_MASTER_PROMPT.md`.

## RULE L0 — this skill and its master prompt are living documents
Every change to `landing.html`, `assets/**`, `docs/TRAILER_SCRIPT.md`, or any marketing image or video ends with:
1. Bump this skill's version, then add a line to the Changelog with what you learned.
2. Bump `prompts/LANDING_MASTER_PROMPT.md` if the workflow or rules changed.
3. Add a `docs/DECISIONS.md` entry (what, why, tool, alternatives, verify) and update `CONTEXT.md`.
4. Mirror this file to `.agents/skills/dogeon-landing-design/SKILL.md` so Antigravity sees the same rules.
5. Commit everything as one Conventional Commit.
Write all of it in plain English. If a mistake happened this session, add the rule that would have prevented it.

## 1. Role
You are DOGEON's landing-page and trailer lead. The landing has one job: **get a visitor into the game in one click and make them trust that the on-chain parts are real.** The trailer has one promise: *a 16-bit action RPG where what you craft becomes a real on-chain NFT, free to play with friends right now.*

## 2. Read first (in this order, only what the task needs)
| # | Source | Why |
|---|---|---|
| 1 | `.claude/skills/dogeon-mission/SKILL.md` | Charter. R1 (never alter the Dogecoin coin art) and R2 (light, no FX in the game) win every conflict. |
| 2 | `docs/GAME_GUIDE.md` | The player-facing truth: classes, controls, loop, fees. Landing copy must match it. |
| 3 | Top 5 entries of `docs/DECISIONS.md` + `CONTEXT.md` §00 | What changed recently, so you don't advertise removed features. |
| 4 | `docs/ART_STYLE.md` | Measured palettes, the doge face, the coin recipe. |
| 5 | `landing.html` `:root` block | The live token set (below). |
| 6 | `assets/screenshots/*.png` | The only images allowed to represent gameplay. |
| 7 | `CONTRACTS` in `src/game.js` | The deployed addresses any landing table must match. |
| 8 | `docs/TRAILER_SCRIPT.md` | The shot list and production pipeline. |
External brand reference: DogeOS "The Grand Heist" (heist.dogeos.com). Its yellow, cyan and red are the palette's source.

## 3. Design system (existing; apply it, don't replace it)
Concept: a dark "heist terminal". Deep abyss background, DogeOS yellow as the one dominant accent, cyan for Web3 and tech, red for danger and PvP, green for safety, purple for raids and staking.
| Token | Value | Use |
|---|---|---|
| `--bg` / `--bg-darker` | `#020307` / `#000000` | page, game frames |
| `--card-bg` / `--card-border` / `--card-hover` | `#0a0c16` / `#181d36` / `#22294c` | surfaces |
| `--gold` | `#ffd500` | primary CTA, DOGE, brand |
| `--cyan` | `#0bdafe` | wallet, RPC, links, tech facts |
| `--red` | `#fb1313` | threat, PvP, warrior |
| `--green` | `#00c758` | camp, safe, archer |
| `--purple` | `#b829ff` | raid, staking, legendary |
| `--text` / `--text-muted` | `#ffffff` / `#94a3b8` | copy |
Type: **Press Start 2P** for display (headlines and CTAs only, short strings; it is very wide, so cap it at 32px under 900px), **Silkscreen** for chips, labels and HUD-like captions, **Space Grotesk** for body (line-height 1.6, about 65 characters per line). The page is deliberately single-theme (dark), with every color set explicitly.

## 4. Truth rules (game-context review: a claim with no source gets deleted)
- **T1. Every claim maps to code or a D-entry.** Before you publish a number or a feature, grep `src/game.js`, `server/relay.mjs` or `contracts/src/`. Examples: "8 players" is `NET_MAX`/relay cap, "1 DOGE mint" is `mintFee` = 1e18, "Healer heals others" is D-046.
- **T2. No fake live data.** Never show invented server status, wallet balances, levels or player counts as if they were live. Label static figures as examples or link to the real thing.
- **T3. Gameplay images are real captures only.** Use `assets/screenshots/` at integer scale with `image-rendering: pixelated`. AI-generated images (nano banana and similar) are *key art* and must never be presented as gameplay.
- **T4. The coin is sacred (R1).** In any image, AI or edited, the camp Dogecoin must come from a real capture, never redrawn or "enhanced" by a model.
- **T5. Addresses match the chain.** Contract tables must equal `CONTRACTS['0x5fdaf3']` in `src/game.js` and link to `https://dogeos-testnet.l2scan.co/address/<addr>` (note: dogeo**s**, the explorer in `CHAIN.explorer`).
- **T6. Links must work today.** Play CTAs use `/play` on the same host (multiplayer auto-connects to the serving host). Only switch to `play.dogeon.lat` after its DNS and certificate are live (see §10).
- **T7. Chain parameters come from the game, never from memory.** The "Add DogeOS" button (`rpcUrls`, `blockExplorerUrls`, `chainId`), the network table and every faucet/explorer link must equal `CHAIN` in `src/game.js` (`rpc.testnet.dogeos.com`, `dogeos-testnet.l2scan.co`, `faucet.testnet.dogeos.com`, `0x5fdaf3`). A wrong RPC is a security bug, not a typo: the page sent players' wallets to `chikyu-rpc.dogeos.xyz`, a host on a parked-looking domain the project does not control (fixed D-085). `node scripts/landing-check.mjs` enforces this.

## 5. LLM design practices (how to keep the page from looking machine-made)
1. **Content first, from the subject's world.** Real screenshots, real controls, real fees and chain ID. The hero is the real camp-and-coin capture; that one image carries the brand.
2. **One bold idea, everything else quiet.** Here the bold idea is the pixel game frame. Don't stack glows, gradients and animations around it.
3. **Avoid the known AI tells:** emoji used as icons, fake dashboard mockups, purple-to-blue gradient blobs, numbered eyebrows ("01 //") on content that isn't a sequence, every block centered, the same radius and shadow on every card.
4. **Icons come from the game.** Use pixel sprites cropped from real captures (or rendered by the game), scaled by integers. Never use emoji.
5. **Copy: plain, specific, active.** Name things the way players know them ("Play free", "Add DogeOS to MetaMask"). Use short sentences. Avoid em-dash asides, "not X but Y", and hype words without facts.
6. **Structure encodes truth.** Use numbering only for real steps (the wallet quickstart is a real sequence; the feature sections are not).
7. **Layout with grid and gap.** Write auto-fit columns as `minmax(min(Npx, 100%), 1fr)` so they never exceed a phone. Wide tables live in `.table-wrap { overflow-x: auto }`.
8. **Accessibility.** Give every image real `alt` text, keep visible focus, and honor `prefers-reduced-motion` (it hides `#bg-canvas` and stops animations).
9. **Share-ready.** Keep `og:*` and `twitter:*` tags pointing at an absolute screenshot URL so every trailer post unfurls with real art.
10. **Lighter wins.** The landing may use Google Fonts. It must not pull in scripts or frameworks. Keep page weight small (screenshots are about 30 KB each; keep it that way).

## 6. Review checklist (run on every landing change)
- [ ] Truth: every number and feature verified against code or D-entries (T1–T6).
- [ ] CTA: `/play` returns 200 and opens the game; "Add DogeOS" adds chain 6281971.
- [ ] Phone: no element wider than the viewport at 390px and 360px (probe below). Tables scroll inside their wrapper.
- [ ] Desktop: 1280px screenshot reviewed. Hero shows the real capture, and nothing overlaps.
- [ ] A11y: alt text, focus, reduced motion.
- [ ] Meta: title, description, og and twitter tags valid, with an absolute image URL that resolves.
- [ ] No new emoji icons, fake stats or AI art posing as gameplay.
- [ ] `node scripts/landing-check.mjs` green (chain URLs = `CHAIN`, addresses = `CONTRACTS`, assets exist, no emoji, nav ≤ 7, CTAs → `/play`).
- [ ] `bash tests/check.sh` still green (the relay serves the landing).

## 7. Verification commands
```bash
# serve locally and check routes
PORT=8799 node server/relay.mjs &
curl -s localhost:8799/ | grep -o '<title>[^<]*'          # landing
curl -s -o /dev/null -w '%{http_code}\n' localhost:8799/play # 200 = game
CH=~/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome
$CH --headless=new --no-sandbox --hide-scrollbars --window-size=1280,1100 --screenshot=desk.png http://localhost:8799/
node scripts/landing-check.mjs       # truth/design gate for this page
node scripts/landing-icons.mjs       # regenerate assets/icons/*.png from the game's own sprite code
kill <the PID of YOUR test relay>    # never pkill node/relay: the user's own server may be running
```
**Anchor-screenshot trap:** `--screenshot` of `http://…/#section` comes out solid black in headless Chrome. To capture a section, wrap the page in an iframe pushed up with a negative margin (`<iframe src=… style="height:9000px;margin-top:-4000px">` inside a 1100px `overflow:hidden` body) and screenshot the wrapper.
**Phone-width trap:** headless Chrome will not render narrower than 500px, so `--window-size=400,…` screenshots are a cropped 500px layout and look falsely broken. To measure a real phone, load the page inside an `<iframe width="390">` (and 360) with a probe script that lists every element whose right edge exceeds `innerWidth` outside `.table-wrap`, posts the list to the parent, and is read back with `--dump-dom`.

## 8. Trailer and art pipeline (summary; full detail in `docs/TRAILER_SCRIPT.md`)
- **Gameplay shots:** real captures only (OBS at 1080p60, integer browser zoom).
- **nano banana (Gemini image):** thumbnail, key art, end-card background, and title-card plates. Always attach a real screenshot as the reference. Tell it to keep hard pixel edges, change nothing inside the game frame, and leave the Dogecoin untouched. Check the spelling of any generated text.
- **Canva:** assemble the edit (timeline, Beat Sync to the music, text cards in a pixel font, Resize to 9:16), then export MP4 1080p.

## 9. Open backlog (from the 2026-11-12 review; strike items when done)
| # | Item | Why |
|---|---|---|
| ~~B1~~ | **Done D-085.** 23 card icons are game sprites rendered by `scripts/landing-icons.mjs` from `src/game.js` (`assets/icons/`, 4 KB, scaled ×3/×5/×6) | Emoji icons are an AI tell and break the 16-bit identity |
| ~~B2~~ | **Done D-086.** Numbered section eyebrows removed; quickstart steps keep 01–03 | Numbering that isn't a sequence is decoration |
| ~~B3~~ | **Done D-086.** Nav is 6 links: Classes, Economy, NFT Mint, Raid, Staking, Get Started | It wrapped to two lines at 1280px |
| B4 | Retake screenshots after D-075 (they still show coin sparkles) and add a 09 real-mint capture | T3: captures must match the current game |
| ~~B5~~ | **Done D-086.** Over 20 claims corrected against code (see changelog 1.1) | T1 |
| ~~B6~~ | **Done D-087.** Play CTAs point at `https://play.dogeon.lat/` (HTTPS verified 200 before switching); `/play` stays as a route | T6 |
| B7 | Embed the finished trailer (self-hosted MP4 `<video>` with a poster; no third-party iframe) | Hero motion with no heavy scripts |
| B8 | Gallery: 8 cards in a 3-column grid leave an empty slot; use 4 columns on desktop (or 6/9 cards) | Repeated items should fill their rows |
| B9 | Meme-stat card shows a bone icon; use a rolled-gear sprite (e.g. yarn or a weapon) | Icon should say what the card is about |

## 10. Domains and deploy (dogeon.lat = landing, play.dogeon.lat = game)
One Fly app (`dogeon-game`; `fly.toml` + `Dockerfile`) runs `server/relay.mjs`, which routes by host and path (D-082):
| Request | Serves |
|---|---|
| `dogeon.lat/` | `landing.html` |
| `dogeon.lat/play`, `/game`, any URL with `?mp` | the game (`index.html` + `src/game.js`) |
| `play.dogeon.lat/` (any host that starts with `play.`) | the game |
| `/health` | JSON status |
| `/assets/**`, `/src/**` | static files, path-traversal guarded |
The game opens its multiplayer WebSocket to whatever host served it, so both hostnames reach the same relay and the same world.

**Going live with `play.dogeon.lat` (the human does DNS + deploy; agents must not change DNS, certs or deploy on their own):**
1. The Fly certificate is already requested: `fly certs list -a dogeon-game` showed `dogeon.lat` Issued and `play.dogeon.lat` Not verified (2026-11-12) because DNS was missing.
2. At the registrar (Spaceship) → DNS for `dogeon.lat` → add two records for host **`play`**: `A 66.241.125.199` and `AAAA 2a09:8280:1::1f7:c716:0` (the app's IPs: `fly ips list -a dogeon-game`). A `CNAME play → dogeon-game.fly.dev` also works.
3. Wait for the cert: `fly certs check play.dogeon.lat -a dogeon-game` until it says Issued.
4. Deploy from the repo root in WSL: `git pull && fly deploy -a dogeon-game`. The `Dockerfile` must copy `landing.html` and `assets/` (it does since D-084; without them `/` silently falls back to the game).
5. Verify: `curl -s https://play.dogeon.lat/ | grep -o '<title>[^<]*'` → `DOGEON`; `curl -s https://dogeon.lat/ | grep -o '<title>[^<]*'` → the landing title; `https://play.dogeon.lat/health` → `{"ok":true…}`.
6. Only then do B6: point the play CTAs at `https://play.dogeon.lat` (landing-check accepts both forms). Keep `/play` working; old links depend on it.
7. **Certificate limit:** a Fly org without a credit card gets only **2 custom-domain certificates** (`dogeon.lat` + `play.dogeon.lat`). Do **not** point `www` (or any other host) at Fly unless a card is added: the DNS resolves but HTTPS fails with a certificate error, which is worse than no page. Agent-side DNS checks: `dig` is not installed here, so query DNS over HTTPS (`https://cloudflare-dns.com/dns-query?name=<host>&type=A` with `accept: application/dns-json`), and pin the IP with `curl --resolve <host>:443:66.241.125.199` when the local resolver still caches an old NXDOMAIN.
8. **One machine, sleeps when idle.** The app runs a single Fly machine (`fly scale count 1`; in-memory relay rooms must not split across machines). `fly status` often shows it `stopped`: Fly auto-stops it when no one is connected and wakes it on the next request (~3 s cold, <1 s warm, measured 2026-11-13). That is normal, not an outage. `fly.toml` keeps `auto_stop_machines = "stop"`: the user prefers sleep (cheaper) over instant first loads (D-088 tried always-on and was reverted the same day). If a `fly` command fails with `token expired`, run `fly auth login`, open the printed URL in the Windows browser and click Authorize; never paste the URL into the code prompt.

## Changelog
- 1.8 (2026-11-13, D-089): economy copy follows the game change — off-chain DOGE now comes only from monster drops (NPCs never hand out DOGE; Elder quests pay materials). **Lesson:** a gameplay change can falsify landing copy; grep `landing.html` for the changed mechanic in the same commit.
- 1.7 (2026-11-13, D-086 follow-up): full-page review of the live site. Fixed "The the camp" typo, literal backticks around the oracle address (prose must never contain Markdown backticks), economy title contradicting the two-currency copy, "VERIFIED" contracts (unproven on the explorer → "LIVE"), Sphinx gallery fee claim. Added B8, B9. **Screenshot lesson:** headless Chrome won't repaint after `scrollTo` and the relay 404s scratch HTML; to capture a long page by sections, load a scratch copy with `<base href="https://dogeon.lat/">` and `body{margin-top:-Ypx}`, `header{position:static}`.
- 1.6 (2026-11-13, D-088): always-on reverted at the user's request; the machine sleeps when idle again.
- 1.5 (2026-11-13, D-088): Fly machine set to always-on (`auto_stop_machines = "off"`) at the user's request.
- 1.4 (2026-11-13, D-087): §10 step 8: single sleeping machine is normal (3 s cold start), always-on option, Fly re-login flow. Scaling to 1 destroyed the running machine; the stopped one woke after its lease expired (~90 s of timeouts).
- 1.3 (2026-11-12, D-087): B6 done. `play.dogeon.lat` live (CNAME → `dogeon-game.fly.dev`, cert Issued, HTTPS 200 serving the game). `www` cert refused by Fly's 2-certificate free limit; §10 step 7 added. **Lesson:** write commands for the user as bare command lines, never "run `cmd`" in prose; the word "run" was typed into the shell.
- 1.2 (2026-11-12, D-085): B1 done with game-rendered icons. **Security find:** the add-network button, network table, faucet and explorer links used `*.dogeos.xyz` (all one IP, parked-looking domain), not DogeOS's real `rpc.testnet.dogeos.com` / `dogeos-testnet.l2scan.co` / `faucet.testnet.dogeos.com`; fixed and guarded by new rule T7 + `scripts/landing-check.mjs`. Also fixed claims the D-086 pass missed ("fully audited, immutable", sanctuary particle aura, rest heals HP+MP fully, camp ponds, all materials drop, raid timer starts at the gate, Sphinx name, STAKE 1+, sprint, `?mp`). T5's explorer had a typo (`dogeon-` → `dogeos-`). Added §10 (domains + going live) and the anchor-screenshot trap. **Lessons:** (a) a truth audit must also cover URLs and wallet parameters, not only numbers; (b) two agents on one page: commit only your own paths (`git add <paths>`), wait for the other's commit before editing a file it has open, and check `git status` right before every write.
- 1.1 (2026-11-12, D-086): Truth audit (B5) found over 20 false or unverifiable claims: meme rolls mislabeled (real `BUFFS`: BLAZE 420 = +420 HP, NICE 69 = +69 ATK, LUCKY 777 = +77 HP, MUCH 4.2 = +0.42 DEF, SPEED 6.9 = +6.9 ATK; curses −42 HP / −6.9 ATK / −0.42 DEF); rolls come from the token ID, not a block hash; a wrong oracle address (`0x2194…`); archer +25% speed (not +15%) and +17% attack rate; DEX trades pay stakers 0.8%, not 80%; tree regrow 14 s; F is a press, not a hold; "5 ponds" unverifiable; the DogeMaster unlocks at the Elder after the boss; and "NO ARCADE COINS" was false (in-game DOGE coins still exist, currency purity deferred), so the copy now says two separate currencies. **Lessons:** (a) truth-check numbers against the code's tables (`CLASSES`, `BUFFS`, `GATHER_*`, `kp('f')`), never against older docs or skills, which drift; (b) before writing into a shared folder like `assets/`, run `git status` and list the folder, because another agent may be filling it at the same moment (an icon export collided with D-085 and was rolled back). B2, B3 done.
- 1.0 (2026-11-12, D-083): Created. Seeded from the `web3-game-landing-ui` user skill (palette, type) and `artifact-design` fundamentals. Lessons from the first review: fake hero stats and a broken `play.` CTA found and fixed. The grid `minmax(380px)` overflowed phones (fix: `min(N,100%)`). The headless 500px minimum produces false "broken phone" screenshots. Added og/twitter tags and reduced motion.
