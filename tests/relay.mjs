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
  { env: { ...process.env, PORT: String(PORT), MAX_ROOM: '3', BOSS_RESPAWN_S: '1', MAX_PER_IP: '50' }, stdio: ['ignore', 'pipe', 'pipe'] });
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

  // D-095 raid cycle: only the relay can restart a room's heist, and only after the Cat Lord dies
  a.ws.send(JSON.stringify({ t: 'cycle', id: a.id })); await wait(200); // a player tries to fake a cycle
  if (!c.got.some(m => m.t === 'cycle')) pass('cycle anti-spoof', 'a client-sent {t:cycle} is never relayed');
  else fail('cycle anti-spoof', 'client-sent cycle reached another player');
  const y = await client('yuri', 'r3'); await wait(150); // bob left, so a 3rd slot is free; yuri is alone in r3
  st(y, 40 * 16 + 8); await wait(150); // yuri stands in the boss chamber
  // D-108: damage is budgeted (BOSS_DPS 120/s): a burst of 8 x 60 in 0.3 s must NOT kill a 320-HP boss
  for (let i = 0; i < 8; i++) { y.ws.send(JSON.stringify({ t: 'bhit', id: y.id, dmg: 60 })); await wait(40); }
  await wait(150);
  const hpBurst = (y.got.filter(m => m.t === 'boss').at(-1) || {}).hp;
  if (hpBurst >= 140) pass('boss dps cap', `8 hits of 60 (480 dmg) in ~0.4 s -> boss alive at ${hpBurst}/320 (budget 120/s + 1 s burst)`); else fail('boss dps cap', `boss HP ${hpBurst} after a 0.3 s burst`);
  for (let i = 0; i < 12; i++) { st(y, 40 * 16 + 8); y.ws.send(JSON.stringify({ t: 'bhit', id: y.id, dmg: 60 })); await wait(300); } // legit pace
  await wait(200);
  const dead = y.got.some(m => m.t === 'boss' && m.dead === 1);
  await wait(1300); // BOSS_RESPAWN_S=1 for the test (60 s in production)
  if (dead && y.got.some(m => m.t === 'cycle') && !a.got.some(m => m.t === 'cycle'))
    pass('raid cycle', 'Cat Lord killed in r3 -> relay sends {t:cycle} to r3 after the respawn delay; r1 untouched');
  else fail('raid cycle', JSON.stringify({ dead, y: y.got.filter(m => m.t !== 'st'), aCycle: a.got.some(m => m.t === 'cycle') }));

  const h = await (await fetch(`http://127.0.0.1:${PORT}/health`)).json();
  if (h.ok && h.rooms.some(r => r.room === 'r1')) pass('health', JSON.stringify(h.rooms)); else fail('health', JSON.stringify(h));
  const page = await (await fetch(`http://127.0.0.1:${PORT}/?mp=ws://127.0.0.1:${PORT}`)).text();
  const gameRes = await fetch(`http://127.0.0.1:${PORT}/src/game.js`); // D-074: game code is an external module
  const game = await gameRes.text();
  if (page.includes('src/game.js') && page.includes('<canvas') && gameRes.ok && game.includes('MULTIPLAYER (opt-in, D-040)'))
    pass('game served', 'one process serves the index.html shell + src/game.js and the relay');
  else fail('game served', `shell@/ ok=${page.includes('src/game.js')}, /src/game.js status=${gameRes.status}`);
  // D-096: landing videos — mp4 is served, with byte ranges (iOS Safari needs 206 to play <video>)
  const vu = `http://127.0.0.1:${PORT}/assets/video/mint.mp4`;
  const full = await fetch(vu), part = await fetch(vu, { headers: { range: 'bytes=0-99' } }), bad = await fetch(vu, { headers: { range: 'bytes=999999999-' } });
  const len = +full.headers.get('content-length');
  if (full.status === 200 && full.headers.get('content-type') === 'video/mp4' && full.headers.get('accept-ranges') === 'bytes' && len > 1000
      && part.status === 206 && (await part.arrayBuffer()).byteLength === 100 && part.headers.get('content-range') === `bytes 0-99/${len}` && bad.status === 416)
    pass('video range', `mp4 200 (${len} B), Range 0-99 -> 206, past-end -> 416`);
  else fail('video range', `full=${full.status} ${full.headers.get('content-type')} part=${part.status} ${part.headers.get('content-range')} bad=${bad.status}`);
  // D-108: a teleport (camp -> boss chamber in one update) is ignored, so its boss hits do nothing
  const tp = await client('tele', 'r9'); await wait(100); st(tp, 40 * 16 + 8); await wait(100);
  tp.ws.send(JSON.stringify({ t: 'st', id: 'tele', x: 40 * 16 + 8, y: 34 * 16 + 8, d: 'down', dead: 0 })); await wait(80); // walk into camp (legit respawn spot)
  tp.ws.send(JSON.stringify({ t: 'st', id: 'tele', x: 40 * 16 + 8, y: 100, d: 'down', dead: 0 })); await wait(80); // camp -> chamber instantly
  for (let i = 0; i < 3; i++) { tp.ws.send(JSON.stringify({ t: 'bhit', id: 'tele', dmg: 60 })); await wait(40); }
  await wait(200);
  if (!tp.got.some(m => m.t === 'boss')) pass('teleport ignored', 'camp -> boss chamber in 80 ms is rejected; its boss hits do nothing');
  else fail('teleport ignored', JSON.stringify(tp.got.filter(m => m.t === 'boss')));
  try { tp.ws.close(); } catch {}
  // D-107: a malformed percent-escape must not crash the relay (audit 2026-11-13 S3: GET /% killed the process)
  let bad400 = 0; for (const u of ['/%', '/assets/%E0%A4%A', '/src/%zz.js']) { try { const r = await fetch(`http://127.0.0.1:${PORT}${u}`); if (r.status === 400) bad400++; } catch {} }
  const alive = await fetch(`http://127.0.0.1:${PORT}/health`).then(r => r.ok).catch(() => false);
  if (bad400 === 3 && alive) pass('bad escape', 'GET /%, /assets/%E0%A4%A, /src/%zz.js -> 400; relay still up');
  else fail('bad escape', `400s=${bad400}/3 alive=${alive}`);
  const trav = await fetch(`http://127.0.0.1:${PORT}/assets/..%2f..%2fserver%2frelay.mjs`);
  if (trav.status !== 200 || !(await trav.text()).includes('BOSS_HP')) pass('assets traversal', `status ${trav.status}`); else fail('assets traversal', 'served a file outside assets/');
  for (const cl of [a, c, x, d]) try { cl.ws.close(); } catch {}
} catch (e) { fail('relay', e.message); }
finally { srv.kill(); }

// D-108: per-IP seat cap + "pings alone don't keep a seat", on a second relay with small limits
const PORT2 = PORT + 1;
const srv2 = spawn(process.execPath, [join(root, 'server/relay.mjs')], { env: { ...process.env, PORT: String(PORT2), MAX_PER_IP: '2', ST_IDLE_S: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
try {
  await new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('relay 2 did not start')), 8000); srv2.stdout.on('data', d => { if (String(d).includes('relay on')) { clearTimeout(t); res(); } }); });
  const c2 = (id) => new Promise((res, rej) => { const ws = new WebSocket(`ws://127.0.0.1:${PORT2}`), c = { ws, id, got: [] };
    ws.onmessage = e => { try { c.got.push(JSON.parse(e.data)); } catch {} }; ws.onopen = () => { ws.send(JSON.stringify({ t: 'join', room: 'ip', id })); res(c); }; ws.onerror = () => rej(new Error('c2 ' + id)); });
  const p1 = await c2('pa'), p2 = await c2('pb'); await wait(150); const p3 = await c2('pc'); await wait(300);
  if (p3.got.some(m => m.t === 'full') && !p1.got.some(m => m.t === 'full')) pass('per-ip cap', '3rd seat from one IP refused (MAX_PER_IP=2)'); else fail('per-ip cap', JSON.stringify(p3.got));
  const live = setInterval(() => { try { p1.ws.send(JSON.stringify({ t: 'st', id: 'pa', x: 10, y: 10, dead: 0 })); } catch {} }, 200); // pa plays, pb only idles
  await wait(2200); clearInterval(live);
  if (p2.ws.readyState >= 2 && p1.ws.readyState === 1) pass('idle seat', 'a joined client that sends no state is dropped; the active one stays');
  else fail('idle seat', `idle=${p2.ws.readyState} active=${p1.ws.readyState}`);
  for (const k of [p1, p2, p3]) try { k.ws.close(); } catch {}
} catch (e) { fail('relay 2', e.message); }
finally { srv2.kill(); }

console.log(fails ? `✗ ${fails} relay check(s) failed` : '✓ relay: 0 failed');
process.exit(fails ? 1 : 0);
