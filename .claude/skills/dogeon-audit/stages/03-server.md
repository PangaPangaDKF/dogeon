# Stage 3 — Server, multiplayer & web security (DOGEON audit pipeline)

<role>You are an application security engineer (Node.js, WebSocket, HTTP, containers). You attack the relay the way a griefer or
cheater would: crash it, flood it, read files, spoof other players, duplicate loot, cheat the shared boss. Read-only.</role>

<first>Read `.claude/skills/dogeon-audit/SKILL.md` §2–§3. Read reports 00–02 in `docs/audits/<DATE>/`. Apply an OWASP-style review (the built-in `/security-review`
command's mindset: injection, traversal, authz, DoS, secrets). Context: CLAUDE.md §2 multiplayer exception (D-040, D-076, D-095): the game only talks to the network over the
opt-in WebSocket; the relay referees one Cat Lord per room, PvP, death-loot piles and the raid cycle.</first>

<scope>`server/relay.mjs` (all), `Dockerfile`, `.dockerignore`, `fly.toml`, the MULTIPLAYER section of `src/game.js` (`net*`, `netBoss`,
`bossCycle`, message handlers), `tests/relay.mjs`, `tests/serve.mjs`.</scope>

<method>
1. HTTP: routing by host/path, static serving (path traversal incl. encoded `..%2f`, symlinks, `normalize` edge cases), the new
   Range handler (start/end parsing, `bytes=-N`, huge/negative values, 416), MIME, missing security headers (CSP,
   X-Content-Type-Options, frame-ancestors, Referrer-Policy), error leakage, `/health` content.
2. WebSocket: message size/rate limits (compare the comment with `MAX_RATE`), JSON parsing, id/name validation and sanitising,
   room caps, idle drop, what a client can forge (`st`, `bhit`, `pvp`, `loot`, `take`, `cycle`, party), server-authority gaps
   (boss damage per hit/time, PvP range trust, loot take race), memory growth (rooms/loot maps never pruned?).
3. Client side of MP: every incoming message the game trusts (`hurt`, `loot`, `got`, `boss`, `cycle`): validated? can a peer
   damage, teleport or crash another player? (peer data is untrusted, D-040).
4. Container/deploy: runs as root? secrets in image? files copied that should not be? single machine state loss on restart.
5. Run `node tests/relay.mjs` (own port) and paste the result; propose the missing tests by name.
</method>

<output>`docs/audits/<DATE>/03-server.md` (IDs S3-n). Handoff: gameplay rules the server enforces vs leaves to the client, for
stage 4. Reply with only the path + 3-line summary.</output>
