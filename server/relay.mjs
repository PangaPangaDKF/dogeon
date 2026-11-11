#!/usr/bin/env node
// DOGEON multiplayer relay (D-040) — zero dependencies: a minimal RFC 6455 WebSocket server on Node's built-in http/crypto.
//
//   node server/relay.mjs                       # PORT=8787 by default; MAX_ROOM=8 players per room
//   open http://localhost:8787/?mp=ws://localhost:8787&room=heist&name=YOU
//
// One process serves BOTH the game page ("/") and the relay, so a host only runs this one command for their friends.
// It keeps NO game state and never sees a wallet or key: it rebroadcasts each player's own small position message
// {t:'st', id, x, y, d, m, c, h, n, dead} to the other players in the same room. Shared enemies/loot would need an
// authoritative server (e.g. Colyseus) — intentionally out of scope (D-040).
// Limits: payload <= 1 KB, <= 20 msgs/s per client, MAX_ROOM players per room, idle clients dropped after 30 s.
// For an https:// page you need wss:// — put this behind TLS (Caddy/nginx), or use a host that terminates TLS (Render, Fly…).
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = +process.env.PORT || 8787;
const MAX_ROOM = +process.env.MAX_ROOM || 8;
const MAX_BYTES = 1024, MAX_RATE = 30, IDLE_MS = 30000;
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'; // RFC 6455 §1.3
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = join(ROOT, 'index.html');
const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const rooms = new Map(); // room -> Set<client>

// ---- D-076 shared world: the relay is the referee for the 3 things players fight over ----
// 1) ONE Cat Lord per room (server owns its HP; clients send hits, server clamps + broadcasts),
// 2) PvP (server checks range, camp sanctuary and party: same party = friendly fire OFF),
// 3) death loot (server owns dropped piles; first valid "take" wins, so nothing is duplicated).
// Tile maths mirror src/game.js: CAMP tiles 33..47 x 27..41, boss room = DUN x 26..54, y 2..8 (GATE_ROW 9).
const BOSS_HP = 320, BOSS_RESET_MS = 30 * 60 * 1000, MAX_HIT = 60, MAX_PVP = 40, PVP_RANGE = 48, TAKE_RANGE = 28, LOOT_CAP = 48;
const LOOT_KINDS = ['steel', 'whisk', 'wood', 'stone'];
const tileIn = (p, x0, y0, x1, y1) => { const tx = Math.floor(p.x / 16), ty = Math.floor(p.y / 16); return tx >= x0 && tx <= x1 && ty >= y0 && ty <= y1; };
const inCamp = p => tileIn(p, 33, 27, 47, 41);
const inBossRoom = p => tileIn(p, 26, 2, 54, 8);
const near = (a, b, r) => Math.hypot(a.x - b.x, a.y - b.y) <= r;
const world = new Map(); // room -> { boss: {hp,max,dead,t} | null, loot: Map<lid,{k,x,y}>, lid }
const W = room => { let w = world.get(room); if (!w) { w = { boss: null, loot: new Map(), lid: 0 }; world.set(room, w); } return w; };
const toRoom = (room, s) => { const r = rooms.get(room); if (r) for (const o of r) send(o, s); };
const bossMsg = b => JSON.stringify({ t: 'boss', hp: b.hp, max: b.max, dead: b.dead ? 1 : 0 });
const lootMsg = list => JSON.stringify({ t: 'loot', items: list });
function onWorld(c, m) {
  const w = W(c.room), me = c.p, now = Date.now();
  if (m.t === 'bhit') { // shared boss: only a living player standing in the boss room can hurt it
    if (!me || me.dead || !inBossRoom(me)) return;
    if (w.boss && w.boss.dead && now - w.boss.t > BOSS_RESET_MS) w.boss = null; // the Cat Lord returns for the next raid
    if (!w.boss) { const n = rooms.get(c.room)?.size || 1; const max = Math.round(BOSS_HP * (1 + 0.5 * (n - 1))); w.boss = { hp: max, max, dead: false, t: now }; } // more raiders = tougher boss
    if (w.boss.dead) return send(c, bossMsg(w.boss));
    w.boss.hp = Math.max(0, w.boss.hp - Math.min(MAX_HIT, Math.max(1, m.dmg | 0)));
    if (!w.boss.hp) { w.boss.dead = true; w.boss.t = now; }
    return toRoom(c.room, bossMsg(w.boss));
  }
  if (m.t === 'pvp') { // PvP: in range, both outside camp, both alive, NOT the same party
    const o = [...(rooms.get(c.room) || [])].find(o => o.id === m.to && o !== c);
    if (!o || !me || !o.p || me.dead || o.p.dead || inCamp(me) || inCamp(o.p)) return;
    if (c.party && c.party === o.party) return; // friendly fire OFF inside a party
    if (!near(me, o.p, PVP_RANGE)) return;
    return send(o, JSON.stringify({ t: 'hurt', id: c.id, dmg: Math.min(MAX_PVP, Math.max(1, m.dmg | 0)), x: me.x, y: me.y }));
  }
  if (m.t === 'loot') { // a dying player's carried materials become shared piles (NFTs never drop: they live on chain)
    if (!me || !Array.isArray(m.items)) return;
    const out = [];
    for (const it of m.items.slice(0, 12)) {
      if (!it || !LOOT_KINDS.includes(it.k) || !Number.isFinite(it.x) || !Number.isFinite(it.y) || !near(me, it, 40) || w.loot.size >= LOOT_CAP) continue;
      const lid = 'l' + (++w.lid), pile = { k: it.k, x: Math.round(it.x), y: Math.round(it.y) };
      w.loot.set(lid, pile); out.push({ lid, ...pile });
    }
    if (out.length) toRoom(c.room, lootMsg(out));
    return;
  }
  if (m.t === 'take') { // first valid claim wins; everyone else is told the pile is gone
    const pile = w.loot.get(m.lid);
    if (!pile || !me || me.dead || !near(me, pile, TAKE_RANGE)) return;
    w.loot.delete(m.lid);
    send(c, JSON.stringify({ t: 'got', lid: m.lid, k: pile.k }));
    return toRoom(c.room, JSON.stringify({ t: 'gone', lid: m.lid }));
  }
}

function frame(str, op = 0x1) { // server -> client frames are never masked
  const p = Buffer.from(str), n = p.length;
  const h = n < 126 ? Buffer.from([0x80 | op, n]) : Buffer.from([0x80 | op, 126, n >> 8, n & 255]);
  return Buffer.concat([h, p]);
}
const send = (c, s) => { if (!c.dead) try { c.sock.write(frame(s)); } catch {} };
const broadcast = (c, s) => { const r = rooms.get(c.room); if (r) for (const o of r) if (o !== c) send(o, s); };

function drop(c) {
  if (c.dead) return;
  c.dead = true;
  const r = rooms.get(c.room);
  if (r) {
    r.delete(c);
    if (c.id) for (const o of r) send(o, JSON.stringify({ t: 'bye', id: c.id }));
    if (!r.size) { rooms.delete(c.room); world.delete(c.room); }
  }
  try { c.sock.end(); } catch {} // end() flushes pending frames (e.g. {t:'full'}) before closing
}

function onMessage(c, text) {
  const now = Date.now();
  if (now - c.win > 1000) { c.win = now; c.count = 0; }
  if (++c.count > MAX_RATE) return drop(c); // flooding -> disconnect
  let m;
  try { m = JSON.parse(text); } catch { return; } // garbage is ignored, not fatal
  if (!m || typeof m !== 'object') return;
  if (!c.room) { // the first message must be a join
    if (m.t !== 'join' || typeof m.id !== 'string' || !/^[a-z0-9]{1,12}$/.test(m.id)) return drop(c);
    const room = typeof m.room === 'string' && /^[\w-]{1,24}$/.test(m.room) ? m.room : 'heist';
    let total = 0; for (const s of rooms.values()) total += s.size;
    const r = rooms.get(room) || new Set();
    if (total >= MAX_ROOM || r.size >= MAX_ROOM) { send(c, JSON.stringify({ t: 'full', msg: 'SERVER FULL (8/8 PLAYERS)' })); return drop(c); }
    c.room = room; c.id = m.id; c.party = typeof m.party === 'string' && /^[A-Z0-9.-]{1,12}$/.test(m.party) ? m.party : ''; r.add(c); rooms.set(room, r);
    const w = W(room); if (w.boss) send(c, bossMsg(w.boss)); if (w.loot.size) send(c, lootMsg([...w.loot].map(([lid, p]) => ({ lid, ...p })))); // late joiners see the same world
    return;
  }
  if (m.id !== c.id) return; // only your OWN state/events (no id spoofing)
  if (m.t === 'party') { c.party = typeof m.party === 'string' && /^[A-Z0-9.-]{0,12}$/.test(m.party) ? m.party : ''; return; }
  if (m.t === 'st' && typeof m.pt === 'string') c.party = /^[A-Z0-9.-]{0,12}$/.test(m.pt) ? m.pt : '';
  if (m.t === 'st' && Number.isFinite(m.x) && Number.isFinite(m.y)) c.p = { x: m.x, y: m.y, dead: !!m.dead }; // last known position = what PvP/boss/loot checks use
  if (m.t === 'st' || m.t === 'heal') return broadcast(c, text); // clients validate fields
  onWorld(c, m); // only your OWN state/events are relayed (no id spoofing); clients validate fields
}

function onData(c, chunk) {
  c.buf = Buffer.concat([c.buf, chunk]);
  while (c.buf.length >= 2 && !c.dead) {
    const b0 = c.buf[0], b1 = c.buf[1], op = b0 & 0x0f;
    if (!(b0 & 0x80) || !(b1 & 0x80)) return drop(c); // no fragmentation; client frames MUST be masked (RFC 6455 §5.1)
    let len = b1 & 0x7f, off = 2;
    if (len === 126) { if (c.buf.length < 4) return; len = c.buf.readUInt16BE(2); off = 4; }
    else if (len === 127) return drop(c); // 64-bit lengths are never needed for these tiny messages
    if (len > MAX_BYTES) return drop(c);
    if (c.buf.length < off + 4 + len) return; // wait for the rest of the frame
    const mask = c.buf.subarray(off, off + 4);
    const data = Buffer.from(c.buf.subarray(off + 4, off + 4 + len));
    for (let i = 0; i < len; i++) data[i] ^= mask[i & 3];
    c.buf = c.buf.subarray(off + 4 + len);
    if (op === 0x8) return drop(c); // close
    if (op === 0x9) { try { c.sock.write(frame(data.toString(), 0xA)); } catch {} continue; } // ping -> pong
    if (op === 0x1) onMessage(c, data.toString('utf8'));
  }
}

const server = createServer((req, res) => {
  const url = req.url || '/';
  if ((url === '/' || url.startsWith('/?') || url === '/index.html') && existsSync(PAGE)) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(readFileSync(PAGE));
  }
  if (url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, rooms: [...rooms].map(([room, s]) => ({ room, players: s.size })) }));
  }
  // static game modules under src/ (e.g. /src/game.js) — path-traversal safe, served from ROOT
  const p = normalize(decodeURIComponent(url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  if (/^[/\\]?src[/\\][\w.\-/\\]+\.(js|mjs|css|json|png|svg)$/.test(p)) {
    const file = join(ROOT, p);
    if (file.startsWith(join(ROOT, 'src')) && existsSync(file)) {
      res.writeHead(200, { 'content-type': MIME[extname(file)] || 'text/plain' });
      return res.end(readFileSync(file));
    }
  }
  res.writeHead(404); res.end('not found');
});

server.on('upgrade', (req, sock, head) => {
  const key = req.headers['sec-websocket-key'];
  if (!key || String(req.headers.upgrade || '').toLowerCase() !== 'websocket') return sock.destroy();
  const accept = createHash('sha1').update(key + GUID).digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n\r\n`);
  const c = { sock, buf: Buffer.alloc(0), room: '', id: '', win: Date.now(), count: 0, dead: false };
  sock.on('data', d => onData(c, d));
  sock.on('close', () => drop(c));
  sock.on('error', () => drop(c));
  sock.setTimeout(IDLE_MS, () => drop(c)); // the game sends 10 Hz; silence means the tab is gone
  if (head && head.length) onData(c, head);
});

server.listen(PORT, () => console.log(`DOGEON relay on :${PORT}  ->  http://localhost:${PORT}/?mp=ws://localhost:${PORT}&room=heist`));
