// DOGEON headless simulation test — zero dependencies (Node >= 18).
// Runs the REAL game code from index.html inside a Node `vm` sandbox with a fake canvas,
// drives it with scripted + random input, and checks design invariants every frame.
//
//   node tests/sim.mjs            # run all scenarios
//   node tests/sim.mjs --seed 7   # different random seed
//   node tests/sim.mjs --verbose  # print per-scenario stats
//
// Exit code 0 = all HARD checks passed. WARN lines are known issues (see docs/DECISIONS.md);
// when one gets fixed, promote it from warn() to fail() so it can never come back.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const args = process.argv.slice(2);
const SEED = Number(args[args.indexOf('--seed') + 1]) || 4242;
const VERBOSE = args.includes('--verbose');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error('FAIL could not find <script> in index.html'); process.exit(1); }
const GAME = m[1];

// ---------- fake browser ----------
function fakeCtx() {
  return new Proxy({}, {
    get: (t, k) => (k in t ? t[k] : (t[k] = () => {})),
    set: (t, k, v) => { t[k] = v; return true; },
  });
}
function fakeCanvas() { return { width: 0, height: 0, style: {}, getContext: () => fakeCtx(), addEventListener() {}, focus() {} }; }
function makeSandbox() {
  const listeners = {};
  const sb = {
    console, setTimeout: () => 0, clearTimeout() {},
    performance: { now: () => 0 },
    innerWidth: 960, innerHeight: 672,
    window: {}, // no AudioContext -> sfx() hits its try/catch and stays silent
    document: { getElementById: () => fakeCanvas(), createElement: () => fakeCanvas() },
    addEventListener: (type, fn) => { (listeners[type] ||= []).push(fn); },
    requestAnimationFrame: () => 0,
  };
  sb.globalThis = sb;
  return { sb, listeners };
}

// Harness appended to the game script so it shares the game's top-level scope.
const HARNESS = String.raw`
globalThis.__api = {
  get: () => ({ scene, P, enemies, projs, items, parts, floats, ui, state, NPCS }),
  set P_(v) { Object.assign(P, v); },
  step(dt) { update(dt); render(); for (const k in pressed) delete pressed[k]; },
  press(k) { pressed[k] = true; },
  hold(k, v) { keys[k] = v; },
  releaseAll() { for (const k in keys) keys[k] = false; },
  inCampT, zoneOf, playerInCamp, talk, shopMenu, bankMenu, newGame,
  setScene(s) { scene = s; },
  ARMOR_RED, SWORD_DMG, CAMP, CX, CY,
};`;

function boot(seed) {
  const { sb } = makeSandbox();
  vm.createContext(sb);
  // Deterministic Math.random so failures are reproducible with --seed.
  vm.runInContext(`(()=>{let a=${seed >>> 0};Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})();`, sb);
  vm.runInContext(GAME + '\n' + HARNESS, sb, { filename: 'index.html<script>' });
  return sb.__api;
}

// ---------- reporting ----------
let failures = 0, warnings = 0;
const fail = (name, msg) => { failures++; console.log(`  FAIL  ${name}: ${msg}`); };
const warn = (name, msg) => { warnings++; console.log(`  WARN  ${name}: ${msg}`); };
const pass = (name, msg = '') => console.log(`  PASS  ${name}${msg ? ' — ' + msg : ''}`);

function checkFrame(api, name, f) {
  const g = api.get();
  if (!Number.isFinite(g.P.x) || !Number.isFinite(g.P.y)) throw new Error(`player position NaN at frame ${f}`);
  if (g.P.hp > g.P.maxHp + 1e-6) throw new Error(`hp ${g.P.hp} > maxHp ${g.P.maxHp} at frame ${f}`);
  if (g.P.fud < 0 || g.P.bank < 0 || g.P.whisk < 0) throw new Error(`negative currency at frame ${f}`);
  for (const e of g.enemies) {
    const tx = Math.floor(e.x / 16), ty = Math.floor(e.y / 16);
    if (api.inCampT(tx, ty)) throw new Error(`${e.type} entered the camp at tile ${tx},${ty} (frame ${f})`);
  }
}

function scenario(name, fn) {
  console.log(`\n▶ ${name}`);
  try { fn(); } catch (err) { fail(name, err && err.stack ? err.stack.split('\n').slice(0, 3).join(' | ') : String(err)); }
}

const DT = 1 / 60;
const MOVE = ['w', 'a', 's', 'd'];

function startGame(api) {
  api.press('enter'); api.step(DT);
  if (api.get().scene !== 'play') throw new Error('Enter on title did not start the game');
}

function randomPlay(api, frames, name, rnd = Math.random) {
  let maxParts = 0;
  for (let f = 0; f < frames; f++) {
    if (f % 20 === 0) { api.releaseAll(); for (const k of MOVE) if (rnd() < 0.3) api.hold(k, true); }
    if (rnd() < 0.08) api.press(' ');
    if (rnd() < 0.02) api.press('k');
    if (rnd() < 0.01) api.press('e');
    api.step(DT);
    checkFrame(api, name, f);
    maxParts = Math.max(maxParts, api.get().parts.length);
  }
  return { maxParts };
}

// ---------- scenarios ----------
scenario('boot + title -> play', () => {
  const api = boot(SEED);
  for (let i = 0; i < 30; i++) api.step(DT); // title screen renders
  startGame(api);
  const g = api.get();
  pass('boot', `${g.enemies.length} enemies spawned, player at ${g.P.x},${g.P.y}`);
});

scenario('random play 2 minutes (field)', () => {
  const api = boot(SEED);
  startGame(api);
  api.P_ = { x: 40 * 16 + 8, y: 45 * 16 + 8 }; // just south of camp
  const r = randomPlay(api, 60 * 120, 'field');
  const g = api.get();
  pass('field', `kills tracked=${g.P.kills}, whiskers=${g.P.whisk}, hp=${Math.ceil(g.P.hp)}, maxParts=${r.maxParts}`);
});

scenario('camp is fully safe (20 s standing at the fence gap)', () => {
  const api = boot(SEED + 1);
  startGame(api);
  // stand on the south gap tile just inside the fence (row CAMP.y1), most exposed safe spot
  api.P_ = { x: api.CX * 16 + 8, y: api.CAMP.y1 * 16 + 8, inv: 0 };
  const hp0 = api.get().P.hp;
  let hitsEdge = 0;
  for (let f = 0; f < 60 * 20; f++) {
    // pull enemies close so the test actually pressures the camp
    if (f % 60 === 0) for (const e of api.get().enemies.slice(0, 6)) if (!e.boss) { e.x = api.CX * 16 + 8 + (f % 120 ? 20 : -20); e.y = (api.CAMP.y1 + 3) * 16 + 8; }
    api.step(DT);
    checkFrame(api, 'camp', f);
    if (api.get().P.hp < hp0) hitsEdge++;
  }
  if (!api.get().P.dead && api.get().P.hp === hp0) pass('camp safety', 'no damage taken inside the fence');
  else fail('camp safety', `player took damage inside camp (hp ${api.get().P.hp}/${hp0})`);
});

scenario('boss fight (gate open, sword Lv4, armor Lv2)', () => {
  const api = boot(SEED + 2);
  startGame(api);
  const g0 = api.get();
  g0.state.gateOpen = true; g0.state.stage = 3;
  api.P_ = { x: 40 * 16 + 8, y: 7 * 16 + 8, sword: 4, armor: 2, maxHp: 105, hp: 105 };
  let sawSummon = false;
  for (let f = 0; f < 60 * 90; f++) {
    const g = api.get();
    if (g.ui) api.press('e'); // close death dialogs
    const boss = g.enemies.find(e => e.boss);
    if (boss) { // chase the boss and slash
      api.releaseAll();
      if (boss.x < g.P.x - 10) api.hold('a', true); if (boss.x > g.P.x + 10) api.hold('d', true);
      if (boss.y < g.P.y - 10) api.hold('w', true); if (boss.y > g.P.y + 10) api.hold('s', true);
      if (f % 6 === 0) api.press(' ');
      if (g.P.hp < 30 && !g.P.dead) g.P.hp = g.P.maxHp; // test cheat: keep fighting, we test code paths not skill
    }
    if (g.enemies.some(e => e.zone === 'boss' && !e.boss)) sawSummon = true;
    api.step(DT);
    checkFrame(api, 'boss', f);
    if (api.get().state.won) break;
  }
  const g = api.get();
  if (g.state.won && g.state.stage === 4) pass('boss', `defeated, summon phase reached=${sawSummon}`);
  else warn('boss', `boss not defeated in 90 s of scripted play (hp left ${g.enemies.find(e => e.boss)?.hp})`);
});

scenario('economy: bank + shop flows', () => {
  const api = boot(SEED + 3);
  startGame(api);
  const g = api.get();
  g.P.whisk = 10;
  const bank = g.NPCS.find(n => n.id === 'bank');
  bank.met = true; api.talk(bank);
  api.press('e'); api.step(DT); // exchange
  if (api.get().P.fud !== 30 || api.get().P.whisk !== 0) fail('bank exchange', `expected 30 FUD/0 whiskers, got ${api.get().P.fud}/${api.get().P.whisk}`);
  else pass('bank exchange', '10 whiskers -> 30 FUD');
  api.press('escape'); api.step(DT);
  const shop = g.NPCS.find(n => n.id === 'merchant');
  shop.met = true; api.get().P.fud = 1000; api.get().P.armor = 1; api.talk(shop);
  const labels = api.get().ui.build().map(o => o.label);
  // Menu row: label starts at x=48, price is right-aligned near x=250 -> keep labels <= 50 chars, no float noise.
  const bad = labels.filter(l => l.length > 50 || /\d\.\d{3,}/.test(l));
  if (bad.length) fail('shop labels', `label too long or shows float noise: "${bad[0]}"`);
  else pass('shop labels', `${labels.length} labels fit, no float noise`);
});

scenario('world pauses cleanly while a dialog is open', () => {
  const api = boot(SEED + 4);
  startGame(api);
  const g = api.get();
  const sage = g.NPCS.find(n => n.id === 'quest');
  api.talk(sage);
  const p0 = api.get().parts.length;
  for (let f = 0; f < 60 * 30; f++) api.step(DT); // 30 s reading a dialog
  const grown = api.get().parts.length - p0;
  if (grown > 200) warn('particles during UI', `parts[] grew by ${grown} in 30 s with a dialog open (drawFire pushes, updateParts is skipped)`);
  else pass('particles during UI', `parts[] stable (+${grown})`);
});

scenario('in-flight bone vs player standing just inside the camp gap', () => {
  const api = boot(SEED + 5);
  startGame(api);
  const g = api.get();
  // West gap: tile column CAMP.x0 is camp (stone) at rows CY-1..CY+1. Stand at its left edge.
  api.P_ = { x: api.CAMP.x0 * 16 + 1, y: api.CY * 16 + 8, inv: 0 };
  for (const e of g.enemies) if (!e.boss) e.x = 70 * 16; // clear the area
  if (!api.playerInCamp()) throw new Error('setup: player should be inside camp');
  const hp0 = g.P.hp;
  g.projs.push({ x: g.P.x - 40, y: g.P.y - 6, vx: 95, vy: 0, life: 2.6, kind: 'bone', dmg: 5 });
  for (let f = 0; f < 60; f++) api.step(DT);
  if (api.get().P.hp < hp0) warn('camp gap bone', `bone hit the player inside camp (hp ${hp0} -> ${api.get().P.hp}); bone hitbox reaches past the camp tile check`);
  else pass('camp gap bone', 'bone stopped at the camp edge');
});

console.log(`\n${failures ? '✗' : '✓'} ${failures} failed, ${warnings} warnings (seed ${SEED})`);
process.exit(failures ? 1 : 0);
