#!/usr/bin/env node
// DOGEON relay test (D-040): starts server/relay.mjs and connects REAL WebSocket clients (Node's built-in client, the
// actual RFC 6455 protocol — not a mock). Proves: 3 players in one room all see each other; rooms are isolated; nobody
// receives their own echo; a player cannot spoof another's id; garbage JSON is tolerated; a 4th player is refused when
// MAX_ROOM=3; leaving broadcasts "bye"; /health reports rooms; the same process serves the game page.
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
if (typeof WebSocket === 'undefined') { console.log('  SKIP relay test: this Node has no global WebSocket (Node 22+ needed)'); process.exit(0); }
const PORT = 20000 + Math.floor(Math.random() * 20000);
let fails = 0;
const pass = (n, d) => console.log(`  PASS  ${n} — ${d}`);
const fail = (n, d) => { fails++; console.log(`  FAIL  ${n} — ${d}`); };
const wait = ms => new Promise(r => setTimeout(r, ms));

const srv = spawn(process.execPath, [join(root, 'server/relay.mjs')],
  { env: { ...process.env, PORT: String(PORT), MAX_ROOM: '3' }, stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error('relay did not start')), 8000);
  srv.stdout.on('data', d => { if (String(d).includes('relay on')) { clearTimeout(t); res(); } });
  srv.on('exit', code => rej(new Error('relay exited ' + code)));
});

const client = (id, room) => new Promise((res, rej) => {
  const ws = new WebSocket(`ws://127.0.0.1:${PORT}`), c = { ws, id, got: [] };
  ws.onmessage = e => { try { c.got.push(JSON.parse(e.data)); } catch {} };
  ws.onopen = () => { ws.send(JSON.stringify({ t: 'join', room, id })); res(c); };
  ws.onerror = () => rej(new Error('connect failed: ' + id));
});
const st = (c, x, asId) => c.ws.send(JSON.stringify({ t: 'st', id: asId || c.id, x, y: 100, d: 'down', m: 1, c: 'archer', h: 80, n: c.id.toUpperCase(), dead: 0 }));
const saw = (c, id, x) => c.got.some(m => m.t === 'st' && m.id === id && (x === undefined || m.x === x));

try {
  const a = await client('alice', 'r1'), b = await client('bob', 'r1'), c = await client('cara', 'r1'), x = await client('xavi', 'r2');
  await wait(150);
  st(a, 11); st(b, 22); st(c, 33); st(x, 99);
  a.ws.send(JSON.stringify({ t: 'heal', id: a.id, amt: 20, x: 11, y: 100, r: 72 }));
  await wait(300);
  if (saw(a, 'bob') && saw(a, 'cara') && saw(b, 'alice') && saw(b, 'cara') && saw(c, 'alice') && saw(c, 'bob'))
    pass('3 players', 'alice, bob and cara (room r1) each receive the other two');
  else fail('3 players', JSON.stringify({ a: a.got, b: b.got, c: c.got }));
  if (b.got.some(m => m.t === 'heal' && m.id === 'alice' && m.amt === 20))
    pass('healer heal relay', 'healer pulse relayed to other players in the room');
  else fail('healer heal relay', 'heal pulse not relayed to room peers');
  if (!saw(a, 'xavi') && !saw(x, 'alice')) pass('room isolation', 'room r2 never sees r1 and vice versa');
  else fail('room isolation', 'cross-room leak');
  if (!saw(a, 'alice')) pass('no echo', 'a player never receives its own state'); else fail('no echo', 'own state echoed back');

  st(a, 55, 'bob'); await wait(250); // alice pretends to be bob
  if (!saw(c, 'bob', 55)) pass('anti-spoof', "state sent under another player's id is not relayed");
  else fail('anti-spoof', 'spoofed id relayed');

  a.ws.send('{not json'); await wait(100); st(a, 77); await wait(250);
  if (saw(b, 'alice', 77)) pass('garbage tolerated', 'malformed JSON ignored, connection survives');
  else fail('garbage tolerated', 'sender stopped being relayed after garbage');

  const d = await client('dave', 'r1'); await wait(300);
  if (d.got.some(m => m.t === 'full') || d.ws.readyState >= 2) pass('room cap', '4th player refused when MAX_ROOM=3');
  else fail('room cap', '4th player admitted to a full room');

  b.ws.close(); await wait(350);
  if (a.got.some(m => m.t === 'bye' && m.id === 'bob')) pass('bye', 'the others are told when bob leaves');
  else fail('bye', 'no bye broadcast');

  const h = await (await fetch(`http://127.0.0.1:${PORT}/health`)).json();
  if (h.ok && h.rooms.some(r => r.room === 'r1')) pass('health', JSON.stringify(h.rooms)); else fail('health', JSON.stringify(h));
  const page = await (await fetch(`http://127.0.0.1:${PORT}/?mp=ws://127.0.0.1:${PORT}`)).text();
  const gameRes = await fetch(`http://127.0.0.1:${PORT}/src/game.js`); // D-074: game code is an external module
  const game = await gameRes.text();
  if (page.includes('src/game.js') && page.includes('<canvas') && gameRes.ok && game.includes('MULTIPLAYER (opt-in, D-040)'))
    pass('game served', 'one process serves the index.html shell + src/game.js and the relay');
  else fail('game served', `shell@/ ok=${page.includes('src/game.js')}, /src/game.js status=${gameRes.status}`);
  for (const cl of [a, c, x, d]) try { cl.ws.close(); } catch {}
} catch (e) { fail('relay', e.message); }
finally { srv.kill(); }

console.log(fails ? `✗ ${fails} relay check(s) failed` : '✓ relay: 0 failed');
process.exit(fails ? 1 : 0);
