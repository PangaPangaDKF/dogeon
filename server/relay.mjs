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
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = +process.env.PORT || 8787;
const MAX_ROOM = +process.env.MAX_ROOM || 8;
const MAX_BYTES = 1024, MAX_RATE = 20, IDLE_MS = 30000;
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'; // RFC 6455 §1.3
const PAGE = join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
const rooms = new Map(); // room -> Set<client>

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
    if (!r.size) rooms.delete(c.room);
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
    const r = rooms.get(room) || new Set();
    if (r.size >= MAX_ROOM) { send(c, JSON.stringify({ t: 'full' })); return drop(c); }
    c.room = room; c.id = m.id; r.add(c); rooms.set(room, r);
    return;
  }
  if (m.t === 'st' && m.id === c.id) broadcast(c, text); // only your OWN state is relayed (no id spoofing); clients validate fields
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
