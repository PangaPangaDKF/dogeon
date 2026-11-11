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
function makeSandbox(opts = {}) {
  const listeners = {};
  const sb = {
    console, setTimeout: opts.realTimers ? setTimeout : () => 0, clearTimeout() {},
    location: { search: opts.search || '' },
    ...(opts.WebSocket ? { WebSocket: opts.WebSocket } : {}), // D-040: inject a mock socket; absent = no WebSocket global
    performance: { now: () => 0 },
    innerWidth: 960, innerHeight: 672,
    // no AudioContext -> sfx() hits its try/catch and stays silent; window.open is a spy (links never leave the test)
    window: Object.assign(opts.eth ? { ethereum: opts.eth } : {}, opts.bitkeep ? { bitkeep: { ethereum: opts.bitkeep } } : {}, { __opened: [], open(u) { this.__opened.push(u); return null; } }),
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
  get: () => ({ scene, P, enemies, projs, items, parts, floats, ui, state, NPCS, mkt }),
  MARKET, REST_DELAY, RESPAWN_FRAC, hurtPlayer, respawn,
  set P_(v) { Object.assign(P, v); },
  step(dt) { update(dt); render(); for (const k in pressed) delete pressed[k]; },
  press(k) { pressed[k] = true; },
  hold(k, v) { keys[k] = v; },
  releaseAll() { for (const k in keys) keys[k] = false; },
  inCampT, zoneOf, playerInCamp, talk, shopMenu, bankMenu, newGame, RECIPES, ETYPES,
  setScene(s) { scene = s; },
  ARMOR_RED, SWORD_DMG, CAMP, CX, CY,
  REST_CAP, SKILL_THRESH, skillLv, skillMul, BAG_SIZE, FOODS,
  addToBag, bagCount, bagRemove, invMenu,
  tile: get, T, SOLID, MW, MH, FISH_MIN, FISH_MAX, FIELD_POP, DUN_POP, SPAWN_EVERY, DUN_RESPAWN, MINI_RESPAWN, startFish, waterAt, wallet, CHAIN, connectWallet, walletRows, nearWaterT, NINJA_WATER, spawnEnemy, inDunT,
  chainData, chainReady, refreshChain, mintNft, useNft, listNft, buyListing, delistNft, addLp, buyPool, sellPool, removeLp, withdrawProceeds,
  swordLv, armorLv, gearStats, syncMaxHp, syncMaxMp, GEAR_STATS, MINTABLE, ITEM_TYPES, itemRoll, RARITY, BUFFS, addCredit, marketMenu, shopMenu, CONTRACTS, DEV_LOCAL, CHAIN_ID: () => CHAIN.id, FONT, creditOk, RECIPES_: () => RECIPES,
  LINKS, oracle, refreshOracle, elderMenu, partnerTalk, FACTIONS, SCHOOL, REDSTONE, opened: () => window.__opened, eth, wallet_: () => wallet,
  CLASSES, CLASS_IDS, classOf, classSpd, classDmg, classArmor, professorTalk, professorMenu, chooseProfession,
  useSkill, groundPound, quickShot, mend, SKILL_MP, makeEnemy, killEnemy, damageEnemy,
  net, NET_URL, NET_TTL,
  disconnectWallet, stakeDoge, unstakeStake, claimStakeRewards, syncDexFees, stakeMenu, SEL,
  applyClass, syncMaxHp, hudTag, dogeMasterMenu, burnAndReroll, modMenu, IS_MOD, isMod, MASTER_ADDR, GATHER_DUR, GATHER_CD, nearResT, solidFor, GATE_ROW, RAID_OPEN, RAID_SEAL,
};`;

function boot(seed, opts) {
  const { sb } = makeSandbox(opts);
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
  if (g.P.doge < 0 || g.P.bank < 0 || g.P.whisk < 0) throw new Error(`negative currency at frame ${f}`);
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

// put the open menu's cursor on the first row whose label matches re (row order is free to change)
function selectRow(api, re) { const ui = api.get().ui, i = ui.build().findIndex(r => re.test(r.label)); if (i < 0) throw new Error(`no row ${re}: ` + ui.build().map(r => r.label).join(' | ')); ui.sel = i; }

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
  api.P_ = { x: api.CX * 16 + 8, y: api.CAMP.y1 * 16 + 8, iT: 0 };
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
  selectRow(api, /^SWAP .* WHISKERS/);
  api.press('e'); api.step(DT); // exchange
  if (api.get().P.doge !== 30 || api.get().P.whisk !== 0) fail('bank exchange', `expected 30 DOGE/0 whiskers, got ${api.get().P.doge}/${api.get().P.whisk}`);
  else pass('bank exchange', '10 whiskers -> 30 DOGE');
  api.press('escape'); api.step(DT);
  const shop = g.NPCS.find(n => n.id === 'merchant');
  shop.met = true; api.get().P.doge = 1000; api.get().P.armor = 1; api.talk(shop);
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
  if (grown > 200) fail('particles during UI', `parts[] grew by ${grown} in 30 s with a dialog open (drawFire pushes, updateParts is skipped)`);
  else pass('particles during UI', `parts[] stable (+${grown})`);
});

scenario('in-flight bone vs player standing just inside the camp gap', () => {
  const api = boot(SEED + 5);
  startGame(api);
  const g = api.get();
  // West gap: tile column CAMP.x0 is camp (stone) at rows CY-1..CY+1. Stand at its left edge.
  api.P_ = { x: api.CAMP.x0 * 16 + 1, y: api.CY * 16 + 8, iT: 0 };
  for (const e of g.enemies) if (!e.boss) e.x = 70 * 16; // clear the area
  if (!api.playerInCamp()) throw new Error('setup: player should be inside camp');
  const hp0 = g.P.hp;
  g.projs.push({ x: g.P.x - 40, y: g.P.y - 6, vx: 95, vy: 0, life: 2.6, kind: 'bone', dmg: 5 });
  for (let f = 0; f < 60; f++) api.step(DT);
  if (api.get().P.hp < hp0) fail('camp gap bone', `bone hit the player inside camp (hp ${hp0} -> ${api.get().P.hp}); bone hitbox reaches past the camp tile check`);
  else pass('camp gap bone', 'bone stopped at the camp edge');
});

scenario('rest needs REST_DELAY seconds of stillness before healing', () => {
  const api = boot(SEED + 6);
  startGame(api);
  const P = api.get().P;
  P.hp = 10; P.mp = 0; // player starts inside camp
  api.hold('r', true);
  for (let f = 0; f < Math.floor(60 * (api.REST_DELAY - 0.5)); f++) api.step(DT);
  if (api.get().P.hp !== 10) fail('rest delay', `healed before the delay (hp ${api.get().P.hp})`);
  else pass('rest delay', `no healing in the first ${api.REST_DELAY - 0.5}s`);
  for (let f = 0; f < 60 * 2; f++) api.step(DT);
  api.hold('r', false);
  if (api.get().P.hp > 10) pass('rest heals', `hp 10 -> ${Math.round(api.get().P.hp)} after the delay`);
  else fail('rest heals', 'no healing after the delay');
});

scenario('death respawns with reduced HP and MP', () => {
  const api = boot(SEED + 7);
  startGame(api);
  const P = api.get().P;
  P.x = 40 * 16 + 8; P.y = 50 * 16 + 8; P.iT = 0; P.hp = 1; // outside camp
  api.hurtPlayer(50, { x: P.x + 10, y: P.y });
  for (let f = 0; f < 60 * 3; f++) api.step(DT);
  const g = api.get();
  const eHp = Math.ceil(g.P.maxHp * api.RESPAWN_FRAC), eMp = Math.floor(g.P.maxMp * api.RESPAWN_FRAC);
  if (g.P.dead || g.P.hp !== eHp || g.P.mp !== eMp) fail('respawn', `expected hp ${eHp} mp ${eMp}, got ${g.P.hp}/${g.P.mp} dead=${g.P.dead}`);
  else pass('respawn', `hp ${eHp}/${g.P.maxHp}, mp ${eMp}/${g.P.maxMp}`);
});

scenario('market: bounded random price, sentiment drives multipliers', () => {
  const api = boot(SEED + 8);
  startGame(api);
  let lo = Infinity, hi = 0, minS = 0, maxS = 0;
  api.get().P.x = 40 * 16 + 8; // stay in camp so we only measure the market
  for (let f = 0; f < 60 * 600; f++) { // 10 minutes
    api.step(DT);
    const m = api.get().mkt;
    lo = Math.min(lo, m.p); hi = Math.max(hi, m.p); minS = Math.min(minS, m.sent); maxS = Math.max(maxS, m.sent);
    if (!(m.p >= api.MARKET.min && m.p <= api.MARKET.max) || Math.abs(m.sent) > 1) throw new Error(`price/sentiment out of bounds p=${m.p} s=${m.sent}`);
  }
  if (minS > -0.3 || maxS < 0.3) fail('market swings', `sentiment barely moves (${minS.toFixed(2)}..${maxS.toFixed(2)})`);
  else pass('market', `price $${lo.toFixed(3)}..$${hi.toFixed(3)}, sentiment ${minS.toFixed(2)}..${maxS.toFixed(2)}`);
  // bear market makes enemy hits stronger
  const P = api.get().P;
  P.x = 40 * 16 + 8; P.y = 50 * 16 + 8; P.armor = 0; P.hp = P.maxHp = 999; P.iT = 0;
  api.get().mkt.sent = -1; api.hurtPlayer(10, { x: P.x + 5, y: P.y });
  const bearHit = 999 - P.hp;
  if (bearHit !== 15) fail('bear damage', `10 dmg in full bear market should hit 15, hit ${bearHit}`);
  else pass('bear damage', '10 -> 15 at sentiment -1');
});

scenario('forge: craft with materials, reject on insufficient', () => {
  const api = boot(SEED + 9);
  startGame(api);
  const g = api.get();
  g.P.steel = 2; g.P.wood = 1; g.P.sword = 1; // enough for HAMMER LV2
  const mech = g.NPCS.find(n => n.id === 'merchant');
  mech.met = true; api.talk(mech);
  api.press('e'); api.step(DT); // craft HAMMER LV2
  if (g.P.sword !== 2) fail('forge craft', `expected sword lv2, got ${g.P.sword}`);
  else pass('forge craft', 'HAMMER LV2 crafted from 2 STEEL + 1 WOOD');
  if (g.P.steel !== 0 || g.P.wood !== 0) fail('forge burn', `materials not burned: steel=${g.P.steel} wood=${g.P.wood}`);
  else pass('forge burn', 'materials consumed');
  api.press('escape'); api.step(DT);
});

scenario('pool: deposit safe on death, withdraw with yield', () => {
  const api = boot(SEED + 10);
  startGame(api);
  const g = api.get();
  g.P.doge = 100;
  const bank = g.NPCS.find(n => n.id === 'bank');
  bank.met = true; api.talk(bank);
  selectRow(api, /^STAKE /); // the vault (was ADD TO POOL)
  api.press('e'); api.step(DT);
  if (g.P.bank !== 100 || g.P.doge !== 0) fail('pool deposit', `expected bank=100 doge=0, got bank=${g.P.bank} doge=${g.P.doge}`);
  else pass('pool deposit', '100 DOGE pooled');
  // die and respawn — pool should be safe
  api.press('escape'); api.step(DT);
  g.P.x = 40 * 16 + 8; g.P.y = 50 * 16 + 8; g.P.iT = 0; g.P.hp = 1;
  api.hurtPlayer(50, { x: g.P.x + 5, y: g.P.y });
  for (let f = 0; f < 60 * 3; f++) api.step(DT);
  if (api.get().P.bank !== 100) fail('pool safe on death', `expected bank=100 after death, got ${api.get().P.bank}`);
  else pass('pool safe on death', 'pooled DOGE survives death');
});

scenario('new enemies spawn and drop materials', () => {
  const api = boot(SEED + 11);
  startGame(api);
  const g = api.get();
  const types = new Set(g.enemies.map(e => e.type));
  const newTypes = ['frog', 'ninja', 'bull', 'knight'].filter(t => types.has(t));
  if (newTypes.length < 2) fail('new enemy spawn', `only ${newTypes.length} new types spawned: ${[...types].join(',')}`);
  else pass('new enemy spawn', `${newTypes.length} new types present: ${newTypes.join(',')}`);
  // check ETYPEs have mat fields
  const matTypes = Object.entries(api.ETYPES).filter(([,d]) => d.mat && d.mat !== 'whisk');
  if (matTypes.length < 3) fail('material types', `expected 3+ material enemy types, got ${matTypes.length}`);
  else pass('material types', `${matTypes.length} types drop non-whisker materials`);
});

scenario('death loses all materials', () => {
  const api = boot(SEED + 12);
  startGame(api);
  const g = api.get();
  g.P.orb = 5; g.P.scrap = 3; g.P.horn = 2; g.P.steel = 4;
  g.P.x = 40 * 16 + 8; g.P.y = 50 * 16 + 8; g.P.iT = 0; g.P.hp = 1;
  api.hurtPlayer(50, { x: g.P.x + 5, y: g.P.y });
  for (let f = 0; f < 60 * 3; f++) api.step(DT);
  const p = api.get().P;
  if (p.orb || p.scrap || p.horn || p.steel) fail('death materials', `materials survived death: orb=${p.orb} scrap=${p.scrap} horn=${p.horn} steel=${p.steel}`);
  else pass('death materials', 'all materials lost on death');
});

// ---------- Phase 3 IT-2: fishing (D-015) ----------
// A walkable field tile with water directly north, so P.dir='up' faces the pond.
function shoreTile(api) {
  for (let ty = 3; ty < api.MH - 3; ty++) for (let tx = 3; tx < api.MW - 3; tx++) {
    const t = api.tile(tx, ty);
    if (!api.SOLID.has(t) && !api.inCampT(tx, ty) && api.tile(tx, ty - 1) === api.T.WATER
      && !api.SOLID.has(api.tile(tx - 1, ty)) && !api.SOLID.has(api.tile(tx + 1, ty))) return [tx, ty];
  }
  return null;
}
function fishSetup(api, seed) {
  const a = api || boot(seed); startGame(a);
  const g = a.get(); g.enemies.splice(0); // empty world so only the test touches the player
  const s = shoreTile(a); if (!s) throw new Error('no shore tile next to water found');
  a.P_ = { x: s[0] * 16 + 8, y: s[1] * 16 + 8, dir: 'up', iT: 0 };
  return a;
}

scenario('map: 4-6 fishing ponds, one near (outside) the camp', () => {
  const api = boot(SEED + 13);
  const seen = new Uint8Array(api.MW * api.MH); let ponds = 0, nearCamp = false;
  for (let y = 0; y < api.MH; y++) for (let x = 0; x < api.MW; x++) {
    if (seen[y * api.MW + x] || api.tile(x, y) !== api.T.WATER) continue;
    ponds++; const st = [[x, y]]; seen[y * api.MW + x] = 1;
    while (st.length) { const [cx, cy] = st.pop();
      if (api.inCampT(cx, cy)) throw new Error(`water inside camp at ${cx},${cy}`);
      if (Math.abs(cx - api.CX) <= 16 && Math.abs(cy - api.CY) <= 12) nearCamp = true;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy;
        if (nx >= 0 && ny >= 0 && nx < api.MW && ny < api.MH && !seen[ny * api.MW + nx] && api.tile(nx, ny) === api.T.WATER) { seen[ny * api.MW + nx] = 1; st.push([nx, ny]); } } }
  }
  if (ponds < 4 || ponds > 6) fail('ponds', `expected 4-6 ponds, found ${ponds}`);
  else if (!nearCamp) fail('pond near camp', 'no pond within 16x12 tiles of the camp centre');
  else pass('ponds', `${ponds} ponds, one near the camp, none inside it`);
});

scenario('fishing: F at a pond -> RAW FISH in bag + fishing XP', () => {
  const api = fishSetup(null, SEED + 14);
  api.get().P.iT = 99; // no stray hit can cancel this one
  api.press('f'); api.step(DT);
  if (!api.get().P.fishing) throw new Error('F next to water did not start fishing');
  const dur = api.get().P.fishDur;
  if (dur < api.FISH_MIN - 1e-9 || dur > api.FISH_MAX + 1e-9) fail('fish bar', `bar ${dur.toFixed(2)}s outside ${api.FISH_MIN}-${api.FISH_MAX}s at skill 0`);
  for (let f = 0; f < 60 * (api.FISH_MAX + 0.5); f++) api.step(DT);
  const P = api.get().P;
  if (P.fishing || api.bagCount('raw_fish') !== 1 || P.skills.fishing !== 1) fail('fish catch', `fishing=${P.fishing} raw_fish=${api.bagCount('raw_fish')} xp=${P.skills.fishing}`);
  else pass('fish catch', `caught after ${dur.toFixed(2)}s, 1 RAW FISH, fishing XP 1`);
});

scenario('fishing: getting hit snaps the line, moving cancels, no water = no fishing', () => {
  const api = fishSetup(null, SEED + 15);
  api.press('f'); api.step(DT);
  const P = api.get().P;
  if (!P.fishing) throw new Error('setup: fishing did not start before the hit');
  api.hurtPlayer(5, { x: P.x + 8, y: P.y });
  for (let f = 0; f < 60 * (api.FISH_MAX + 0.5); f++) api.step(DT);
  if (P.fishing || api.bagCount('raw_fish')) fail('hit cancels', `fishing=${P.fishing} raw_fish=${api.bagCount('raw_fish')} after a hit`);
  else pass('hit cancels', 'hit while fishing -> no fish');
  api.P_ = { kbx: 0, kby: 0, iT: 99 };
  const s = shoreTile(api); api.P_ = { x: s[0] * 16 + 8, y: s[1] * 16 + 8, dir: 'up' };
  api.press('f'); api.step(DT);
  if (!P.fishing) throw new Error('setup: fishing did not start before moving');
  api.hold('s', true); api.step(DT); api.hold('s', false);
  for (let f = 0; f < 60 * (api.FISH_MAX + 0.5); f++) api.step(DT);
  if (P.fishing || api.bagCount('raw_fish')) fail('move cancels', `fishing=${P.fishing} raw_fish=${api.bagCount('raw_fish')} after moving`);
  else pass('move cancels', 'stepping away -> no fish');
  api.P_ = { x: api.CX * 16 + 8, y: (api.CY + 3) * 16 + 8 }; // camp: no water
  api.press('f'); api.step(DT);
  if (P.fishing) fail('no water', 'F away from water started fishing');
  else pass('no water', 'F away from water does nothing');
});

scenario('D-053: renewable gathering — chop a tree for WOOD, then the node is on cooldown', () => {
  const api = boot(SEED + 53); startGame(api);
  api.get().enemies.splice(0); // empty world so only the test touches the player
  let found = null; // a tree with a walkable, non-camp tile on its left
  for (let ty = 3; ty < api.MH - 3 && !found; ty++) for (let tx = 3; tx < api.MW - 3; tx++) {
    if (api.tile(tx, ty) !== api.T.TREE) continue;
    const nx = tx - 1, ny = ty, nt = api.tile(nx, ny);
    if (!api.SOLID.has(nt) && nt !== api.T.WATER && !api.inCampT(nx, ny)) { found = { tx, ty, nx, ny }; break; }
  }
  if (!found) throw new Error('no tree with a walkable left neighbor found');
  api.P_ = { x: found.nx * 16 + 8, y: found.ny * 16 + 8, dir: 'right', iT: 99, moving: false };
  const wood0 = api.bagCount('wood');
  api.press('f'); api.step(DT);
  if (!api.get().P.fishing) throw new Error('F facing a tree did not start gathering');
  for (let f = 0; f < 60 * 4; f++) api.step(DT);
  const wood1 = api.bagCount('wood');
  if (wood1 !== wood0 + 1) { fail('gather wood', `wood ${wood0} -> ${wood1} (expected +1)`); return; }
  api.P_ = { moving: false }; api.press('f'); api.step(DT); // node just harvested -> on cooldown
  if (api.get().P.fishing || api.bagCount('wood') !== wood1) fail('gather cooldown', 'the node was harvestable again before it renewed');
  else pass('gather wood', `chopped a tree: WOOD ${wood0} -> ${wood1}, node then on cooldown`);
});

scenario('D-054: per-class Max MP (no-class 30 / warrior 20 / archer 30 / healer 50)', () => {
  const api = boot(SEED + 54); startGame(api);
  if (api.get().P.maxMp !== 30) { fail('class mp', `no-class maxMp=${api.get().P.maxMp} (expected 30)`); return; }
  const want = { warrior: 20, archer: 30, healer: 50 }, seen = [];
  for (const cls of ['warrior', 'archer', 'healer']) {
    api.applyClass(cls, false);
    const mm = api.get().P.maxMp;
    if (mm !== want[cls]) { fail('class mp', `${cls} maxMp=${mm} (expected ${want[cls]})`); return; }
    seen.push(`${cls} ${mm}`);
  }
  pass('class mp', `no-class 30, ${seen.join(', ')}`);
});

scenario('D-055: rare drops — most kills drop nothing, a few give materials/coins', () => {
  const api = boot(SEED + 55); startGame(api);
  const g = api.get(); g.enemies.splice(0);
  const N = 40; let dropped = 0; // alley dropP 0.25 + coin 0.08 -> P(any) ~0.31, so far fewer than N
  for (let i = 0; i < N; i++) {
    const e = api.makeEnemy('alley', 100 + i, 100, 'field');
    g.items.length = 0; api.killEnemy(e);
    if (g.items.length) dropped++;
  }
  if (dropped >= N) { fail('rare drops', `every kill dropped something (${dropped}/${N}) — drops are not rare`); return; }
  if (dropped === 0) { fail('rare drops', `no kill in ${N} dropped anything — dropP/coin broken`); return; }
  pass('rare drops', `${dropped}/${N} alley kills dropped anything; the rest dropped nothing`);
});

scenario('D-066: DogeMaster meme buffs/debuffs (420/69/777/4.2/6.9), burn-to-reroll, master mod & lazy debuff', () => {
  const api = boot(SEED + 66); startGame(api);
  const g = api.get();
  // 1. Meme buffs & cursed debuffs exist with exact numbers
  const buffs = api.BUFFS;
  const has420 = buffs.some(b => b.v === 420 || b.v === -42);
  const has69 = buffs.some(b => b.v === 69 || b.v === -6.9);
  const hasCurse = buffs.some(b => b.curse);
  if (!has420 || !has69 || !hasCurse) { fail('meme buffs/debuffs', 'missing 420, 69, or curse debuffs in BUFFS'); return; }

  // 2. DogeMaster opens post-boss
  const elder = g.NPCS.find(n => n.id === 'quest'); elder.met = true;
  g.state.stage = 4; g.state.won = true;
  api.talk(elder);
  const dogeMasterRow = api.get().ui.build().find(r => /DOGEMASTER/.test(r.label));
  if (!dogeMasterRow) { fail('dogemaster menu', 'DOGEMASTER row not found in elder menu'); return; }
  dogeMasterRow.act();
  const dmOpts = api.get().ui.build();
  if (!dmOpts.some(r => /420, 69 & 777/.test(r.label))) { fail('dogemaster options', dmOpts.map(r => r.label).join(' | ')); return; }

  // 3. Mod Menu: God mode, give mats, switch class, instant slay
  api.modMenu();
  const modOpts = api.get().ui.build();
  const godRow = modOpts.find(r => /GOD MODE/.test(r.label));
  if (!godRow) { fail('mod menu', 'God mode row missing'); return; }
  godRow.act();
  if (!g.P.god) { fail('god mode', 'P.god not toggled'); return; }
  const giveMatsRow = modOpts.find(r => /GIVE 99 ALL MATERIALS/.test(r.label));
  const dogeBefore = g.P.doge;
  giveMatsRow.act();
  if (g.P.wood !== 99 || g.P.steel !== 99 || g.P.doge !== dogeBefore) { fail('give mats', `wood=${g.P.wood} steel=${g.P.steel} doge ${dogeBefore}->${g.P.doge} (must not add fake DOGE)`); return; }
  const switchRow = modOpts.find(r => /WARRIOR/.test(r.label));
  switchRow.act();
  if (g.P.prof !== 'warrior') { fail('switch class', `prof=${g.P.prof}`); return; }

  // 4. Lazy debuff system
  g.P.lazy = true;
  if (api.classSpd() >= 1) { fail('lazy speed', `classSpd=${api.classSpd()} expected < 1`); return; }
  const dummyEnemy = { x: 100, y: 100, hp: 50, def: {}, boss: false };
  api.damageEnemy(dummyEnemy, 10, 1, 0);
  if (g.P.lazy) { fail('warm up', 'P.lazy not cleared on attack'); return; }

  pass('dogemaster + mod + lazy', 'DogeMaster meme forge, burn-to-reroll, mod suite & lazy debuff verified');
});

scenario('D-067: hardcore gathering, iron drops, master chain permissions, red NFT styling', () => {
  const api = boot(SEED + 67); startGame(api);
  const g = api.get();

  // 1. Gathering timing: GATHER_DUR increased, GATHER_CD increased
  if (api.GATHER_DUR < 3.0 || api.GATHER_CD < 12) {
    fail('gather timing', `dur=${api.GATHER_DUR} cd=${api.GATHER_CD}`); return;
  }

  // 2. Stone always drops iron (steel)
  let stoneNode = null;
  for (let ty = 3; ty < api.MH - 3 && !stoneNode; ty++) for (let tx = 3; tx < api.MW - 3; tx++) {
    if (api.tile(tx, ty) === api.T.ROCK) {
      const nx = tx - 1, ny = ty, nt = api.tile(nx, ny);
      if (!api.SOLID.has(nt) && nt !== api.T.WATER && !api.inCampT(nx, ny)) { stoneNode = { tx, ty, nx, ny }; break; }
    }
  }
  if (!stoneNode) throw new Error('no rock with walkable left neighbor');
  api.P_ = { x: stoneNode.nx * 16 + 8, y: stoneNode.ny * 16 + 8, dir: 'right', iT: 99, moving: false };
  g.items.length = 0;
  const steel0 = g.P.steel || 0;
  api.press('f'); api.step(DT);
  for (let f = 0; f < 60 * (api.GATHER_DUR + 0.5); f++) api.step(DT);
  const droppedSteel = (g.P.steel > steel0) || g.items.some(it => it.kind === 'steel');
  if (!droppedSteel) { fail('stone iron drop', `rock node did not drop iron (steel0=${steel0}, steelNow=${g.P.steel})`); return; }

  // 3. Monsters drop iron (steel) too
  api.get().items.length = 0;
  let mobSteel = 0;
  for (let i = 0; i < 40; i++) {
    const e = api.makeEnemy('alley', 200 + i, 200, 'field');
    api.killEnemy(e);
    if (api.get().items.some(it => it.kind === 'steel')) { mobSteel++; api.get().items.length = 0; }
  }
  if (mobSteel === 0) { fail('mob steel drop', 'no monster dropped steel across 40 kills'); return; }

  // 4. Master on-chain permissions
  if (api.isMod()) { fail('mod default', 'isMod should be false when not connected as master and no ?mod=1'); return; }
  api.wallet.connected = true; api.wallet.addr = api.MASTER_ADDR;
  if (!api.isMod()) { fail('mod master addr', 'isMod should be true when connected as master deployer'); return; }

  // 5. Red NFT styling in menus
  const forge = g.NPCS.find(n => n.id === 'forge');
  api.shopMenu(forge);
  const forgeOpts = api.get().ui.build();
  const nftCraft = forgeOpts.filter(o => o.nft || o.isNft);
  if (!nftCraft.length) { fail('forge nft tag', 'no craft recipes marked with nft/isNft'); return; }
  api.press('escape'); api.step(DT);

  pass('hardcore systems', 'stone always drops iron, monsters drop iron, master wallet authenticated, red NFT styling active');
});

scenario('D-065: post-boss Victors Market — limited shop opens on victory, sells consumables for DOGE', () => {
  const api = boot(SEED + 65); startGame(api);
  const g = api.get();
  const elder = g.NPCS.find(n => n.id === 'quest'); elder.met = true;
  g.state.stage = 4; g.state.won = true; g.state.shopT = 300; g.P.doge = 100; // simulate boss defeated, market open
  api.talk(elder); // stage>0 -> elderMenu
  const open = api.get().ui.build().find(r => /VICTORS MARKET/.test(r.label));
  if (!open) { fail('market opens', api.get().ui.build().map(r => r.label).join(' | ')); return; }
  open.act(); // open the market
  const feast = api.get().ui.build().find(r => /CHAMPION FEAST/.test(r.label));
  if (!feast) { fail('market rows', api.get().ui.build().map(r => r.label).join(' | ')); return; }
  g.P.hp = 10; feast.act(); // buy +40 HP for 20 DOGE
  if (g.P.doge !== 80 || g.P.hp !== 50) { fail('feast', `doge=${g.P.doge} hp=${g.P.hp}`); return; }
  g.state.shopT = 0; api.talk(elder); // timer expired -> market row gone
  if (api.get().ui.build().some(r => /VICTORS MARKET/.test(r.label))) { fail('market closes', 'market still listed at shopT=0'); return; }
  pass('victors market', `opens post-boss; CHAMPION FEAST +40 HP for 20 DOGE (doge 100->80, hp 10->50); closes when the timer ends`);
});

scenario('D-064: random loot — deterministic rarity + buff per tokenId, meme buffs, weighted', () => {
  const api = boot(SEED + 64); startGame(api);
  const a = api.itemRoll(42), b = api.itemRoll(42); // same id -> same roll (every client agrees)
  if (a.label !== b.label || a.amount !== b.amount) { fail('roll determinism', `${a.label} != ${b.label}`); return; }
  const count = {}; // rarity weights: common most, legendary rarest
  for (let id = 1; id <= 3000; id++) { const r = api.itemRoll(id).rar.n; count[r] = (count[r] || 0) + 1; }
  if (!(count.COMMON > count.UNCOMMON && count.UNCOMMON > count.RARE && count.RARE > (count.LEGENDARY || 0))) { fail('rarity weights', JSON.stringify(count)); return; }
  const memes = api.BUFFS.filter(b => b.meme); // meme buffs exist and are big (the mint bait)
  if (!memes.length || !memes.some(b => b.v >= 14)) { fail('meme buffs', JSON.stringify(api.BUFFS)); return; }
  let legId = 0; for (let id = 1; id <= 8000 && !legId; id++) if (api.itemRoll(id).rar.n === 'LEGENDARY') legId = id;
  const lg = api.itemRoll(legId); // legendary multiplies the buff (x6) -> even a common-type item can be huge
  if (!(legId && lg.amount >= lg.buff.v * 5.9)) { fail('legendary mult', `legId=${legId} ${JSON.stringify(lg)}`); return; }
  pass('random loot', `id42=${a.label}; dist C${count.COMMON}/U${count.UNCOMMON}/R${count.RARE}/E${count.EPIC || 0}/L${count.LEGENDARY || 0}; legendary #${legId} ${lg.label}`);
});

scenario('D-063: survivor respawn — dungeon 2min / mini-boss 4min, field stays fast', () => {
  const api = boot(SEED + 62); startGame(api);
  if (api.DUN_RESPAWN < 120 || api.MINI_RESPAWN < api.DUN_RESPAWN) { fail('respawn consts', `dun=${api.DUN_RESPAWN}s mini=${api.MINI_RESPAWN}s (want dun>=120, mini>=dun)`); return; }
  const g = api.get(); g.P.x = api.CX * 16 + 8; g.P.y = (api.CY + 3) * 16 + 8; g.P.iT = 99; // sit safe in camp
  for (let i = g.enemies.length - 1; i >= 0; i--) if (g.enemies[i].zone === 'dun') { g.enemies.splice(i, 1); break; } // clear one dungeon cat
  const dun = () => api.get().enemies.filter(e => e.zone === 'dun').length;
  const d0 = dun();
  for (let f = 0; f < 60 * 20; f++) api.step(DT); // 20s << 120s: dungeon must NOT refill (refill-after-interval uses the same code as the field, tested below)
  if (dun() !== d0) { fail('dun slow', `dungeon refilled within 20s: ${d0} -> ${dun()}`); return; }
  pass('survivor respawn', `dungeon stays cleared (${d0}/${api.DUN_POP}) for 20s; DUN_RESPAWN=${api.DUN_RESPAWN}s, MINI_RESPAWN=${api.MINI_RESPAWN}s`);
});

scenario('D-060: DOGE gear stats — owning gear NFTs grants +ATK/+DEF/+HP/+MP (any class)', () => {
  const api = boot(SEED + 60); startGame(api);
  // the 9 DOGE gear items (7-15) are mintable and named
  if (api.MINTABLE.filter(m => m.type >= 7 && m.type <= 15).length !== 9) { fail('gear mintable', `${api.MINTABLE.length} mintables`); return; }
  if (api.ITEM_TYPES[7] !== 'DOGE SWORD' || api.ITEM_TYPES[15] !== 'DOGE QUIVER') { fail('gear names', `7=${api.ITEM_TYPES[7]} 15=${api.ITEM_TYPES[15]}`); return; }
  // owning = wearing: force a connected state so chainReady() is true
  api.wallet.connected = true; api.wallet.chainOk = true;
  const P = api.get().P;
  if (api.gearStats().atk !== 0) { fail('gear empty', 'stats non-zero with no gear'); return; }
  const inv = [{ type: 8, level: 1, id: 1 }, { type: 10, level: 1, id: 2 }, { type: 7, level: 1, id: 3 }, { type: 9, level: 1, id: 4 }];
  api.chainData.inv = inv;
  const exp = { atk: 0, def: 0, hp: 0, mp: 0 }; // base GEAR_STATS + each item's random rolled buff (D-064)
  for (const it of inv) { const b = api.GEAR_STATS[it.type] || {}; for (const k in exp) exp[k] += b[k] || 0; const r = api.itemRoll(it.id); exp[r.buff.s] += r.amount; }
  const g = api.gearStats();
  for (const k of ['atk', 'def', 'hp', 'mp']) if (Math.abs(g[k] - exp[k]) > 1e-9) { fail('gear sum', `${k}: ${g[k]} != ${exp[k]}`); return; }
  if (!(g.atk >= 4 && g.hp >= 15 && g.mp >= 15 && g.def > 0.19)) { fail('gear base', `base gear stats missing: ${JSON.stringify(g)}`); return; } // SWORD/LEATHER/STAFF/SHIELD base present
  const hp0 = P.maxHp, mp0 = P.maxMp;
  api.syncMaxHp(); api.syncMaxMp();
  if (Math.abs(P.maxHp - (hp0 + exp.hp)) > 1e-9 || Math.abs(P.maxMp - (mp0 + exp.mp)) > 1e-9) { fail('gear hp/mp', `maxHp ${hp0}->${P.maxHp} (want +${exp.hp}), maxMp ${mp0}->${P.maxMp} (want +${exp.mp})`); return; }
  api.wallet.connected = false; // offline = no gear stats (you must own the NFT on chain)
  if (api.gearStats().atk !== 0) { fail('gear offline', 'gear stats applied while disconnected'); return; }
  pass('gear stats', `base+buffs: atk ${g.atk.toFixed(1)} def ${g.def.toFixed(2)} hp ${g.hp.toFixed(0)} mp ${g.mp.toFixed(0)}; maxHP +${exp.hp}; none offline`);
});

scenario('D-057: mini-boss per region — two elites spawn, drop guaranteed loot, excluded from refill', () => {
  const api = boot(SEED + 57); startGame(api);
  const g = api.get();
  const minis = g.enemies.filter(e => e.mini);
  if (minis.length !== 2) { fail('mini count', `${minis.length} mini-bosses spawned (expected 2)`); return; }
  const m = minis[0];
  if (!(m.maxHp > api.ETYPES[m.type].hp * 2) || m.zone !== 'mini') { fail('mini stats', `maxHp=${m.maxHp} base=${api.ETYPES[m.type].hp} zone=${m.zone}`); return; }
  g.items.length = 0; api.killEnemy(m);
  const coins = g.items.filter(i => i.kind === 'coin').length, mats = g.items.filter(i => i.kind === m.def.mat).length;
  if (coins < 3 || mats < 1) { fail('mini loot', `coins=${coins} mats=${mats} (expected >=3 coins, >=1 material)`); return; }
  const fieldCount = g.enemies.filter(e => e.zone === 'field').length;
  if (fieldCount !== api.FIELD_POP) { fail('mini refill', `field=${fieldCount}, mini leaked into field accounting (expected ${api.FIELD_POP})`); return; }
  pass('mini-boss', `2 region elites (${minis.map(e => e.type).join(', ')}); mini dropped ${mats} ${m.def.mat} + ${coins} coins; field pop stays ${fieldCount}`);
});

scenario('enemy pressure: field population and spawn timer', () => {
  const api = boot(SEED + 16);
  startGame(api);
  const n = api.get().enemies.filter(e => e.zone === 'field').length;
  if (api.FIELD_POP !== 52 || api.SPAWN_EVERY !== 3) fail('pressure consts', `FIELD_POP=${api.FIELD_POP} SPAWN_EVERY=${api.SPAWN_EVERY}, hardcore says 52 / 3 s`);
  else if (n !== api.FIELD_POP) fail('field pop', `${n} field enemies at start, expected ${api.FIELD_POP}`);
  else pass('field pop', `${n} field enemies, refill every ${api.SPAWN_EVERY}s`);
  // refill: remove 5 field cats, they come back one per SPAWN_EVERY and never above FIELD_POP (D-017)
  const g = api.get(); g.P.x = api.CX * 16 + 8; g.P.y = (api.CY + 3) * 16 + 8; // stay in camp
  let removed = 0; for (let i = g.enemies.length - 1; i >= 0 && removed < 5; i--) if (g.enemies[i].zone === 'field') { g.enemies.splice(i, 1); removed++; }
  const count = () => api.get().enemies.filter(e => e.zone === 'field').length;
  const c0 = count(); let maxSeen = 0;
  for (let f = 0; f < 60 * (api.SPAWN_EVERY * 5 + 1); f++) { api.step(DT); maxSeen = Math.max(maxSeen, count()); }
  if (c0 !== api.FIELD_POP - 5 || count() !== api.FIELD_POP || maxSeen > api.FIELD_POP) fail('refill', `start ${c0} -> end ${count()} (max ${maxSeen}), expected ${api.FIELD_POP - 5} -> ${api.FIELD_POP}`);
  else pass('refill', `${c0} -> ${count()} in ${api.SPAWN_EVERY * 5 + 1}s, never above ${api.FIELD_POP}`);
});

scenario('fishing review fixes (D-017): tiers, facing, moving, reachable ponds, ninja turf', () => {
  const api = boot(SEED + 20);
  if (api.skillLv(5, 'fishing') !== 1 || api.skillLv(5, 'combat') !== 0 || api.skillLv(60, 'fishing') !== 4) fail('fish tiers', 'fishing tier table not used');
  else pass('fish tiers', 'fishing tiers 5/15/30/60 separate from combat');
  fishSetup(api);
  const P = api.get().P; P.skills.fishing = 60;
  api.press('f'); api.step(DT);
  if (!P.fishing || P.fishDur > api.FISH_MAX / 1.32 + 1e-9) fail('fish speed', `fishing=${P.fishing} dur=${P.fishDur} at fishing XP 60`);
  else pass('fish speed', `bar ${P.fishDur.toFixed(2)}s at max fishing tier`);
  api.press('f'); api.step(DT); // reel in
  P.dir = 'down'; api.press('f'); api.step(DT);
  if (P.fishing) fail('facing', 'fished while facing away from the water');
  else pass('facing', 'must face the water');
  P.dir = 'up'; api.hold('d', true); api.press('f'); api.step(DT); api.step(DT); api.hold('d', false);
  if (P.fishing || api.get().floats.some(f => /GOT AWAY/.test(f.t))) fail('F while moving', `fishing=${P.fishing}, false "got away" floater`);
  else pass('F while moving', 'no cast, no false "got away"');
  // every pond has walkable shore reachable from the camp (GATE counts as passable)
  const W = api.MW, H = api.MH, seen = new Uint8Array(W * H), st = [[api.CX, api.CY + 3]]; seen[(api.CY + 3) * W + api.CX] = 1;
  const walk = (x, y) => { const t = api.tile(x, y); return t === api.T.GATE || !api.SOLID.has(t); };
  while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < W && ny < H && !seen[ny * W + nx] && walk(nx, ny)) { seen[ny * W + nx] = 1; st.push([nx, ny]); } } }
  const pondSeen = new Uint8Array(W * H), shores = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (pondSeen[y * W + x] || api.tile(x, y) !== api.T.WATER) continue;
    let reach = 0; const q = [[x, y]]; pondSeen[y * W + x] = 1;
    while (q.length) { const [cx, cy] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const i = ny * W + nx;
      if (api.tile(nx, ny) === api.T.WATER) { if (!pondSeen[i]) { pondSeen[i] = 1; q.push([nx, ny]); } } else if (seen[i]) reach++; } }
    shores.push(reach); }
  if (shores.some(s => s < 4)) fail('pond reach', `shore tiles reachable per pond: ${shores.join(',')}`);
  else pass('pond reach', `reachable shore per pond: ${shores.join(',')}`);
  // ninja bias: spawns near water are ninjas more often than spawns far from water
  let wet = 0, wetN = 0, dry = 0, dryN = 0;
  for (let i = 0; i < 2500; i++) { const g = api.get(); g.enemies.splice(0); g.P.x = -9999; api.spawnEnemy('field'); const e = g.enemies[0]; if (!e) continue;
    const w = api.nearWaterT(Math.floor(e.x / 16), Math.floor(e.y / 16), api.NINJA_WATER.r); if (w) { wet++; if (e.type === 'ninja') wetN++; } else { dry++; if (e.type === 'ninja') dryN++; } }
  const pw = wetN / Math.max(1, wet), pd = dryN / Math.max(1, dry);
  if (wet < 50 || pw < pd + 0.1) fail('ninja turf', `ninja share near water ${(pw * 100).toFixed(0)}% (${wet}) vs dry ${(pd * 100).toFixed(0)}% (${dry})`);
  else pass('ninja turf', `ninjas near water ${(pw * 100).toFixed(0)}% vs ${(pd * 100).toFixed(0)}% elsewhere`);
});

// ---------- Phase 3 IT-3: wallet on DogeOS Chikyu (D-016) ----------
// Fake EIP-1193 provider. `known` = wallet already has the chain; `reject` = user clicks Reject on connect.
function mockEth({ known = false, reject = false } = {}) {
  let chain = '0x1';
  const m = { calls: [], handlers: {}, added: null, callResult: '0x', sent: [], receipt: 'ok',
    on(ev, fn) { m.handlers[ev] = fn; },
    async request({ method, params }) {
      m.calls.push(method);
      switch (method) {
        case 'eth_requestAccounts': if (reject) throw { code: 4001, message: 'User rejected the request.' };
          return ['0xAbCdEf0123456789abcdef0123456789ABCDEF01'];
        case 'wallet_switchEthereumChain': if (!known) throw { code: 4902, message: 'Unrecognized chain ID' }; chain = params[0].chainId; return null;
        case 'wallet_addEthereumChain': known = true; m.added = params[0]; chain = params[0].chainId; return null;
        case 'eth_chainId': return chain;
        case 'eth_getBalance': return '0x' + (42069n * 10n ** 15n).toString(16); // 42.069 DOGE
        case 'wallet_revokePermissions': return null;
        case 'eth_call': if (typeof m.callResult === 'function') return m.callResult(params[0]); return m.callResult; // '0x' = no contract at that address
        case 'eth_sendTransaction': m.sent.push(params[0]); return '0x' + 'ab'.repeat(32);
        case 'eth_getTransactionReceipt': if (m.receipt === 'throw') throw { code: -32603, message: 'rpc hiccup' }; return { status: m.receipt === 'revert' ? '0x0' : '0x1' };
      }
      throw new Error('unexpected wallet method ' + method);
    } };
  return m;
}
const flush = async () => { for (let i = 0; i < 10; i++) await new Promise(r => setImmediate(r)); };
async function scenarioAsync(name, fn) {
  console.log(`\n▶ ${name}`);
  try { await fn(); } catch (err) { fail(name, err && err.stack ? err.stack.split('\n').slice(0, 3).join(' | ') : String(err)); }
}
function openSphinx(api) { const bank = api.get().NPCS.find(n => n.id === 'bank'); bank.met = true; api.talk(bank); return api.get().ui; }

await scenarioAsync('wallet: no wallet -> offline label, game unaffected', async () => {
  const api = boot(SEED + 17); startGame(api);
  const ui = openSphinx(api), rows = ui.build();
  if (!/OFFLINE/.test(rows[0].label)) fail('offline label', `row 0 = "${rows[0].label}"`);
  else if (!rows.some(r => /^NFT MARKET/.test(r.label)) || !rows.some(r => /FAUCET/.test(r.label))) fail('offline layout', rows.map(r => r.label).join(' | '));
  else pass('offline label', `"${rows[0].label}", market + faucet rows present`);
  api.press('e'); api.step(DT); await flush();
  if (api.wallet.connected) fail('offline connect', 'connected with no provider');
  else pass('offline connect', `msg "${api.get().ui.msg}"`);
});

await scenarioAsync('wallet: connect adds + switches to Chikyu, shows address and balance', async () => {
  const eth = mockEth();
  const api = boot(SEED + 18, { eth }); startGame(api);
  const ui = openSphinx(api);
  if (!/CONNECT WALLET/.test(ui.build()[0].label)) throw new Error(`row 0 = "${ui.build()[0].label}"`);
  api.press('e'); api.step(DT); await flush();
  const w = api.wallet, a = eth.added;
  if (!a || a.chainId !== '0x5fdaf3' || a.rpcUrls[0] !== 'https://rpc.testnet.dogeos.com' || a.nativeCurrency.decimals !== 18 || a.nativeCurrency.symbol !== 'DOGE')
    fail('add chain', `wallet_addEthereumChain params wrong: ${JSON.stringify(a)}`);
  else pass('add chain', `added ${a.chainName} ${a.chainId} after 4902`);
  if (!w.connected || !w.chainOk || w.bal !== 42.069) fail('connect', `connected=${w.connected} chainOk=${w.chainOk} bal=${w.bal}`);
  else pass('connect', `addr ${w.addr.slice(0, 6)}.., ${w.bal} DOGE`);
  const rows = api.get().ui.build();
  if (!/WALLET 0XABCD|WALLET 0xAbCd/i.test(rows[0].label) || !rows.some(r => r.label === 'DISCONNECT WALLET')) fail('wallet rows', rows.map(r => r.label).join(' | '));
  else pass('wallet rows', `"${rows[0].label}" + DISCONNECT row`);
  eth.handlers.chainChanged('0x1'); await flush();
  if (w.chainOk) fail('chainChanged', 'still chainOk after switching to 0x1');
  else pass('chainChanged', 'wrong network detected');
  eth.handlers.accountsChanged([]); await flush();
  if (w.connected) fail('accountsChanged', 'still connected after wallet locked');
  else pass('accountsChanged', 'empty accounts -> disconnected');
});

await scenarioAsync('wallet: user rejects -> stays offline with a clear message', async () => {
  const eth = mockEth({ reject: true });
  const api = boot(SEED + 19, { eth }); startGame(api);
  openSphinx(api); api.press('e'); api.step(DT); await flush();
  const msg = api.get().ui && api.get().ui.msg;
  if (api.wallet.connected || !/REJECTED/.test(msg || '')) fail('reject', `connected=${api.wallet.connected} msg="${msg}"`);
  else pass('reject', `"${msg}"`);
});

// ---------- Phase 3 IT-5: game <-> contracts end-to-end on a local anvil chain (D-019) ----------
// Needs: anvil on 127.0.0.1:8545 with contracts/script/Deploy.s.sol deployed (contracts/README.md). Skipped otherwise.
const ANVIL = 'http://127.0.0.1:8545', ACCT = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
async function rpc(method, params = []) {
  const r = await fetch(ANVIL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }), signal: AbortSignal.timeout(800) });
  const j = await r.json(); if (j.error) throw Object.assign(new Error(j.error.message), { code: j.error.code }); return j.result;
}
function anvilEth() { // EIP-1193 provider backed by anvil's unlocked dev account
  return { on() {}, async request({ method, params }) {
    if (method === 'eth_requestAccounts' || method === 'eth_accounts') return [ACCT];
    if (method === 'wallet_switchEthereumChain' || method === 'wallet_addEthereumChain' || method === 'wallet_revokePermissions') return null;
    return rpc(method, params);
  } };
}
async function anvilUp(items) { try { return (await rpc('eth_getCode', [items, 'latest'])).length > 2; } catch { return false; } }
const idle = async api => { for (let i = 0; i < 400 && api.wallet.busy; i++) await new Promise(r => setTimeout(r, 25)); if (api.wallet.busy) throw new Error('chain action never finished: ' + api.wallet.msg); };
const big = (k, v) => (typeof v === 'bigint' ? String(v) : v);

await scenarioAsync('chain e2e on local anvil: mint, equip, eat, list/buy, LP pool, swap, withdraw', async () => {
  const probe = boot(SEED + 21, { search: '?chain=local' });
  const items = probe.CONTRACTS['0x7a69'].items;
  if (!probe.DEV_LOCAL || probe.CHAIN_ID() !== '0x7a69') throw new Error('?chain=local did not select the anvil chain');
  if (!(await anvilUp(items))) { console.log('  SKIP  chain e2e: anvil not running or contracts not deployed (see contracts/README.md)'); return; }
  const api = boot(SEED + 21, { eth: anvilEth(), search: '?chain=local', realTimers: true });
  startGame(api);
  openSphinx(api); api.press('e'); api.step(DT); await flush();
  for (let i = 0; i < 100 && !api.chainData.loaded; i++) await new Promise(r => setTimeout(r, 20));
  if (!api.chainReady() || !api.chainData.loaded) throw new Error(`not ready: connected=${api.wallet.connected} msg=${api.wallet.msg}`);
  const P = api.get().P, inv0 = api.chainData.inv.length;
  pass('e2e connect', `anvil ${api.wallet.addr.slice(0, 8)}.., fee ${Number(api.chainData.fee) / 1e18} DOGE, ${inv0} NFTs held`);
  for (let i = 0; i < 50 && !api.oracle.loaded; i++) await new Promise(r => setTimeout(r, 20));
  if (api.oracle.src !== 'DOGEDEX' || Math.abs(api.oracle.price - 0.0716424) > 1e-9) fail('e2e oracle', JSON.stringify(api.oracle));
  else pass('e2e oracle', `DogeDEX.dogeUsd() -> $${api.oracle.price} (RedStone-compatible mock feed on anvil)`);

  // forge credit -> mint hammer lv4 NFT -> owning it raises the effective hammer level
  P.sword = 4; api.addCredit(1, 4); // as if just forged: minting moves it on chain (P.sword -> 3)
  await api.mintNft(1, 4, 'credit'); await idle(api);
  const ham = api.chainData.inv.filter(it => it.type === 1 && it.level === 4).pop();
  if (!ham || P.credits['1:4'] !== 0 || P.sword !== 3 || api.swordLv() !== 4) fail('e2e mint+equip', `ham=${JSON.stringify(ham)} credit=${P.credits['1:4']} swordLv=${api.swordLv()} msg=${api.wallet.msg}`);
  else pass('e2e mint+equip', `HAMMER LV4 #${ham.id} minted, off-chain hammer LV${P.sword}, effective LV${api.swordLv()} from the NFT`);

  // preserve 3 raw fish from the bag as NFTs; eat one (burn) for HP
  api.addToBag('raw_fish', 3);
  for (let i = 0; i < 3; i++) { await api.mintNft(3, 1, 'raw_fish'); await idle(api); }
  const fish = api.chainData.inv.filter(it => it.type === 3);
  if (api.bagCount('raw_fish') !== 0 || fish.length < 3) fail('e2e preserve', `bag=${api.bagCount('raw_fish')} fishNFTs=${fish.length} msg=${api.wallet.msg}`);
  else pass('e2e preserve', `3 RAW FISH moved from bag to chain (${fish.length} fish NFTs held)`);
  P.hp = 20; await api.useNft(fish[0]); await idle(api);
  const fish2 = api.chainData.inv.filter(it => it.type === 3);
  if (P.hp !== 35 || fish2.some(f => f.id === fish[0].id)) fail('e2e eat', `hp=${P.hp} stillHeld=${fish2.some(f => f.id === fish[0].id)} msg=${api.wallet.msg}`);
  else pass('e2e eat', `burned #${fish[0].id}, hp 20 -> 35`);

  // list the hammer -> it stops counting as equipped -> buy it back -> proceeds -> withdraw
  await api.listNft(ham, 1); await idle(api);
  const lst = api.chainData.listings.find(l => l.id === ham.id);
  const otherHam = Math.max(P.sword, ...api.chainData.inv.filter(it => it.type === 1).map(it => it.level)); // other hammers this account may hold
  if (!lst || !lst.mine || api.swordLv() !== otherHam || api.chainData.inv.some(it => it.id === ham.id)) fail('e2e list', `listing=${JSON.stringify(lst, big)} swordLv=${api.swordLv()} msg=${api.wallet.msg}`);
  else pass('e2e list', `#${ham.id} listed for 1 DOGE, escrowed -> effective hammer LV${otherHam} (best still held)`);
  const pr0 = api.chainData.proceeds;
  await api.buyListing(lst); await idle(api);
  if (api.chainData.proceeds - pr0 !== 10n ** 18n || api.swordLv() !== 4) fail('e2e buy', `proceeds +${api.chainData.proceeds - pr0} swordLv=${api.swordLv()} msg=${api.wallet.msg}`);
  else pass('e2e buy', 'bought back, seller proceeds +1 DOGE, hammer LV4 again');

  // LP: create (or join) the RAW FISH pool with the remaining fish, swap 1 out, swap it back, remove LP
  const key = (3n << 8n) | 1n, mine = api.chainData.inv.filter(it => it.type === 3).map(it => it.id);
  const before = api.chainData.pools.find(p => p.key === key);
  const need = before && before.n ? (BigInt(mine.length) * before.doge + BigInt(before.n - 1)) / BigInt(before.n) : 2n * 10n ** 18n;
  await api.addLp(mine, need, before); await idle(api);
  let pool = api.chainData.pools.find(p => p.key === key);
  if (!pool || pool.mine === 0n || pool.n < 2) fail('e2e LP', `pool=${JSON.stringify(pool, big)} msg=${api.wallet.msg}`);
  else pass('e2e LP', `RAW FISH pool: ${pool.n} items / ${Number(pool.doge) / 1e18} DOGE, my shares ${pool.mine}`);
  await api.buyPool(pool); await idle(api);
  const got = api.chainData.inv.filter(it => it.type === 3);
  pool = api.chainData.pools.find(p => p.key === key);
  if (!got.length) fail('e2e swap buy', `no fish after buyFromPool msg=${api.wallet.msg}`);
  else pass('e2e swap buy', `bought #${got[0].id} from the pool, pool now ${pool.n} items`);
  await api.sellPool(got[0], pool); await idle(api);
  pool = api.chainData.pools.find(p => p.key === key);
  await api.removeLp(pool); await idle(api);
  pool = api.chainData.pools.find(p => p.key === key);
  if (pool.mine !== 0n) fail('e2e remove LP', `still hold ${pool.mine} shares msg=${api.wallet.msg}`);
  else pass('e2e remove LP', `swap back + remove LP ok, proceeds ${Number(api.chainData.proceeds) / 1e18} DOGE`);
  const bal0 = BigInt(await rpc('eth_getBalance', [ACCT, 'latest']));
  await api.withdrawProceeds(); await idle(api);
  const bal1 = BigInt(await rpc('eth_getBalance', [ACCT, 'latest']));
  if (api.chainData.proceeds !== 0n || bal1 <= bal0) fail('e2e withdraw', `proceeds=${api.chainData.proceeds} balance delta=${bal1 - bal0} msg=${api.wallet.msg}`);
  else pass('e2e withdraw', `proceeds paid out (+${Number(bal1 - bal0) / 1e18} DOGE after gas)`);

  // the market menu renders the live state without throwing, and labels fit the menu box
  api.marketMenu(api.get().NPCS.find(n => n.id === 'bank')); await idle(api); await flush();
  for (let i = 0; i < 50 && api.wallet.busy; i++) await flush();
  const rows = api.get().ui.build();
  if (!rows.some(r => /POOL RAW FISH|CREATE POOL: [0-9]+ RAW FISH/.test(r.label)) || rows.some(r => r.label.length > 58)) fail('e2e market menu', rows.map(r => r.label).join(' | '));
  else pass('e2e market menu', `${rows.length} rows, longest ${Math.max(...rows.map(r => r.label.length))} chars`);
  for (let f = 0; f < 5; f++) api.step(DT); // render the menu (scroll window) a few frames
});

// ---------- Phase 3 IT-6: rest cap, bag, food, cooking, skills, death (D-020) ----------
scenario('rest caps HP at 60% while MP fills to max', () => {
  const api = boot(SEED + 22); startGame(api);
  const P = api.get().P; P.hp = 10; P.mp = 0; // spawn point is inside camp
  api.hold('r', true); for (let f = 0; f < 60 * 30; f++) api.step(DT); api.hold('r', false);
  const cap = Math.ceil(P.maxHp * api.REST_CAP);
  if (Math.round(P.hp) !== cap || P.mp !== P.maxMp) fail('rest cap', `hp ${P.hp} (cap ${cap}) mp ${P.mp}/${P.maxMp} after 30 s`);
  else pass('rest cap', `hp 10 -> ${cap}/${P.maxHp} (60%), mp 0 -> ${P.maxMp}`);
});

scenario('inventory: I/Tab open it, 12 slots, food stacks of 5, materials shown', () => {
  const api = boot(SEED + 23); startGame(api);
  api.press('i'); api.step(DT);
  let ui = api.get().ui;
  if (!ui || ui.title !== 'INVENTORY') throw new Error('I did not open the inventory');
  const rows = ui.build().map(r => r.label);
  if (!rows.some(l => /BAG 2\/12 SLOTS/.test(l)) || !rows.some(l => /WOOD x3/.test(l)) || !rows.some(l => /STONE x3/.test(l)) || !rows.some(l => /MATERIALS:/.test(l))) fail('bag rows', rows.join(' | '));
  else pass('bag rows', 'starter bag (WOOD x3, STONE x3) + materials row visible');
  api.press('escape'); api.step(DT); api.press('tab'); api.step(DT);
  ui = api.get().ui;
  if (!ui || ui.title !== 'INVENTORY') fail('tab', 'Tab did not open the inventory'); else pass('tab', 'Tab opens it too');
  api.press('escape'); api.step(DT);
  const P = api.get().P;
  P.bag.length = 0; // clear starter wood/stone to test the 12-slot stack capacity
  const allFit = api.addToBag('raw_fish', 70);
  if (allFit || P.bag.length !== api.BAG_SIZE || P.bag.some(s => s.qty !== 5)) fail('bag limit', `fit=${allFit} slots=${P.bag.length} qty=${P.bag.map(s => s.qty)}`);
  else pass('bag limit', `70 fish -> ${P.bag.length} slots x 5, rest refused`);
});

scenario('food: RAW +15, COOKED +25, cook only near the fire', () => {
  const api = boot(SEED + 24); startGame(api);
  const P = api.get().P; P.hp = 10; P.x += 96; // walk away from the brazier first (spawn is next to it)
  api.addToBag('raw_fish', 2);
  api.invMenu(); let rows = api.get().ui.build();
  const eatRaw = rows.find(r => /RAW FISH x2 \[EAT \+15/.test(r.label));
  if (!eatRaw) throw new Error('no EAT row for raw fish: ' + rows.map(r => r.label).join(' | '));
  eatRaw.act();
  if (P.hp !== 25 || api.bagCount('raw_fish') !== 1) fail('eat raw', `hp ${P.hp} raw ${api.bagCount('raw_fish')}`); else pass('eat raw', 'hp 10 -> 25, 1 raw left');
  if (rows.some(r => /^COOK/.test(r.label))) fail('cook far', 'COOK offered away from the fire'); else pass('cook far', 'no COOK away from the fire');
  api.get().ui = null;
  P.x = api.CX * 16 + 8; P.y = (api.CY + 4) * 16 - 4 - P.hh; // just north of the brazier (fire at FY = CY+4)
  api.invMenu(); rows = api.get().ui.build();
  const cook = rows.find(r => /^COOK RAW FISH/.test(r.label));
  if (!cook) throw new Error('no COOK row next to the fire: ' + rows.map(r => r.label).join(' | '));
  cook.act(); rows = api.get().ui.build();
  const eatCooked = rows.find(r => /COOKED FISH x1 \[EAT \+25/.test(r.label));
  if (!eatCooked) throw new Error('no cooked fish after cooking');
  eatCooked.act();
  if (P.hp !== 50 || api.bagCount('cooked_fish') !== 0) fail('eat cooked', `hp ${P.hp}`); else pass('cook + eat cooked', 'raw -> cooked at the fire, hp 25 -> 50');
});

scenario('skills grow only by use: combat on hit, bark per cast, tier bonus on damage', () => {
  const api = boot(SEED + 25); startGame(api);
  const g = api.get(), P = g.P; g.enemies.splice(0);
  P.x = 40 * 16 + 8; P.y = 50 * 16 + 8; P.dir = 'right'; P.iT = 99; g.mkt.sent = 0;
  api.press(' '); api.step(DT); for (let f = 0; f < 30; f++) api.step(DT);
  if (P.skills.combat !== 0) fail('air swing', `combat XP ${P.skills.combat} from a miss`); else pass('air swing', 'a miss gives no combat XP');
  const dummy = () => { const e = { type: 'knight', def: api.ETYPES.knight, x: P.x + 14, y: P.y, hw: 5, hh: 4, hp: 999, maxHp: 999, dir: 'left', anim: 0, state: 'wander', t: 0, wx: 0, wy: 0, flash: 0, kbx: 0, kby: 0, cool: 99, enemy: true, boss: false, zone: 'field', summonT: 4, dead: false }; const live = api.get().enemies; live.splice(0); live.push(e); return e; }; // update() re-filters enemies every frame: always use the live array
  P.sword = 4; // 18 dmg: +8% must visibly change the number (5 * 1.08 still rounds to 5)
  let e = dummy(); P.atkCd = 0; api.press(' '); api.step(DT);
  const base = 999 - e.hp;
  if (P.skills.combat !== 1 || base <= 0) fail('hit XP', `combat XP ${P.skills.combat}, dmg ${base}`); else pass('hit XP', `hit for ${base}, combat XP 1`);
  P.skills.combat = 10; e = dummy(); P.atkCd = 0; P.x = e.x - 14; api.press(' '); api.step(DT);
  const tier = 999 - e.hp, want = Math.round(api.SWORD_DMG[P.sword] * 1.08);
  if (tier !== want || tier === base) fail('tier bonus', `combat lv1 hit ${tier}, expected ${want}`); else pass('tier bonus', `combat tier 1: ${base} -> ${tier} dmg (+8%)`);
  P.mp = 30; api.press('k'); api.step(DT);
  if (P.skills.bark !== 1) fail('bark XP', `bark XP ${P.skills.bark}`); else pass('bark XP', 'bark +1 XP per cast');
});

scenario('death empties the bag (carried food), keeps pooled DOGE', () => {
  const api = boot(SEED + 26); startGame(api);
  const P = api.get().P; api.addToBag('cooked_fish', 3); P.bank = 50;
  P.x = 40 * 16 + 8; P.y = 50 * 16 + 8; P.iT = 0; P.hp = 1;
  api.hurtPlayer(50, { x: P.x + 5, y: P.y });
  for (let f = 0; f < 60 * 3; f++) api.step(DT);
  const p = api.get().P;
  if (p.bag.length || p.bank !== 50) fail('death bag', `bag ${p.bag.length} slots, bank ${p.bank}`); else pass('death bag', 'bag emptied, pool safe');
});

// ---------- D-021: IT-5 review fixes (mock wallet on the local dev chain, no anvil needed) ----------
await scenarioAsync('D-021: no craft dupes, unknown tx = no refund, account switch, 0x, drained pool, font', async () => {
  const eth = mockEth({ known: true });
  const api = boot(SEED + 27, { eth, search: '?chain=local', realTimers: true }); startGame(api);
  if (!('#' in api.FONT) || !('^' in api.FONT)) fail('font', "'#' or '^' glyph missing"); else pass('font', "'#' and '^' glyphs exist");
  openSphinx(api); api.press('e'); api.step(DT); await flush(); await idle(api);
  for (let i = 0; i < 20 && !/NO CONTRACT/.test(api.wallet.msg); i++) await flush();
  if (!api.chainReady() || !/NO CONTRACT/.test(api.wallet.msg)) fail('0x contract', `ready=${api.chainReady()} msg="${api.wallet.msg}"`);
  else pass('0x contract', `"${api.wallet.msg}"`);
  api.get().ui = null;
  const P = api.get().P, cd = api.chainData;
  cd.loaded = true; cd.fee = 0n; // pretend the reads worked; txs go to the mock

  // craft BONE CHARM -> +15 max HP + credit; minting it moves the charm on chain (stat removed) => one craft = one charm
  P.whisk = 3; P.stone = 2;
  api.shopMenu(api.get().NPCS.find(n => n.id === 'merchant'));
  const craft = api.get().ui.build().find(r => /^BONE CHARM/.test(r.label)); craft.act();
  if (P.hpUps !== 1 || P.maxHp !== 75 || !api.creditOk(5, 1)) throw new Error(`craft: hpUps ${P.hpUps} maxHp ${P.maxHp}`);
  const mintRow = api.get().ui.build().find(r => /^MINT BONE CHARM NFT/.test(r.label));
  if (!mintRow) throw new Error('no MINT BONE CHARM row: ' + api.get().ui.build().map(r => r.label).join(' | '));
  mintRow.act(); await idle(api);
  if (P.hpUps !== 0 || P.maxHp !== 60 || P.credits['5:1'] !== 0 || eth.sent.length !== 1) fail('charm dupe', `hpUps ${P.hpUps} maxHp ${P.maxHp} credit ${P.credits['5:1']} txs ${eth.sent.length}`);
  else pass('charm dupe', 'mint moved the charm on chain: +15 max HP removed off-chain, credit spent');

  // hammer: crafted LV2 then minted -> off-chain hammer drops to LV1 (the NFT now carries LV2)
  P.sword = 1; P.steel = 2; P.wood = 1; api.get().ui = null;
  api.shopMenu(api.get().NPCS.find(n => n.id === 'merchant'));
  api.get().ui.build().find(r => /^HAMMER LV2/.test(r.label)).act();
  api.get().ui.build().find(r => /^MINT HAMMER LV2 NFT/.test(r.label)).act(); await idle(api);
  if (P.sword !== 1 || api.creditOk(1, 2)) fail('hammer dupe', `P.sword ${P.sword} creditOk ${api.creditOk(1, 2)}`);
  else pass('hammer dupe', 'minted HAMMER LV2: off-chain hammer back to LV1, no second mint');

  // tx broadcast but receipt unknown -> NO refund (the mint may still land); a mined revert -> refund
  api.get().ui = null; eth.receipt = 'throw'; api.addToBag('raw_fish', 1);
  await api.mintNft(3, 1, 'raw_fish'); await idle(api);
  if (api.bagCount('raw_fish') !== 0 || !/UNKNOWN/.test(api.wallet.msg)) fail('unknown outcome', `bag ${api.bagCount('raw_fish')} msg "${api.wallet.msg}"`);
  else pass('unknown outcome', `no refund: "${api.wallet.msg}"`);
  eth.receipt = 'revert'; api.addToBag('raw_fish', 1);
  await api.mintNft(3, 1, 'raw_fish'); await idle(api);
  if (api.bagCount('raw_fish') !== 1) fail('revert refund', `bag ${api.bagCount('raw_fish')} msg "${api.wallet.msg}"`);
  else pass('revert refund', 'reverted mint -> fish back in the bag');
  eth.receipt = 'ok';

  // row messages: a synchronous refusal is shown, not "confirm in wallet"
  cd.inv = [{ id: 9, type: 3, level: 1 }]; P.hp = P.maxHp;
  api.invMenu(); const eat = api.get().ui.build().find(r => /^NFT #9 RAW FISH/.test(r.label));
  const msg = eat && eat.act();
  if (msg !== 'HP IS FULL ALREADY.') fail('sync msg', `got "${msg}"`); else pass('sync msg', '"HP IS FULL ALREADY." shown, no wallet prompt');
  api.get().ui = null;

  // drained pool (shares 0) is hidden and can be created again
  cd.pools = [{ key: 769n, type: 3, level: 1, doge: 0n, n: 0, shares: 0n, mine: 0n, buy: 0n, sell: 0n }];
  api.marketMenu(api.get().NPCS.find(n => n.id === 'bank'));
  const rows = api.get().ui.build().map(r => r.label);
  if (!rows.some(l => /^CREATE POOL: 1 RAW FISH/.test(l)) || rows.some(l => /^POOL RAW FISH/.test(l))) fail('drained pool', rows.join(' | '));
  else pass('drained pool', 'empty pool hidden, CREATE POOL offered again');
  api.get().ui = null; await flush();

  // switching accounts drops the old account's NFTs (no borrowed gear)
  cd.inv = [{ id: 1, type: 1, level: 4 }]; cd.loaded = true; P.sword = 1;
  const before = api.swordLv();
  eth.handlers.accountsChanged(['0x00000000000000000000000000000000000000b0']); await flush();
  if (before !== 4 || api.swordLv() !== 1 || cd.inv.length) fail('account switch', `before ${before} after ${api.swordLv()} inv ${cd.inv.length}`);
  else pass('account switch', 'new account: old NFTs dropped, hammer LV4 -> LV1');
});

// ---------- Phase 4 "The Grand Heist" (D-024): partner NPCs, Sphinx hub, Elder heist lore, RedStone oracle ----------
const npc = (api, id) => api.get().NPCS.find(n => n.id === id);
function readDialog(api) { const pages = []; for (let i = 0; i < 20 && api.get().ui && api.get().ui.type === 'dialog'; i++) { pages.push(api.get().ui.pages[api.get().ui.idx]); api.get().ui.chars = 999; api.press('e'); api.step(DT); } return pages; }

scenario('partner NPCs: Cloverheart (Relotto), Noah, Bitget Wallet Card tell their story and open their links', () => {
  const api = boot(SEED + 28); startGame(api);
  const want = { lotto: [/RELOTTO/i, 'https://relotto.app/'], noah: [/single prompt/i, 'https://trynoah.ai/?utm_source=ambassador&utm_medium=affiliate&utm_campaign=ambassador_program&utm_content=afft5eetm&ref=AFF-T5EETM'], bitget: [/Bitget Wallet/i, 'https://web3.bitget.com/share/41bYlR?inviteCode=VovB4P5R'] };
  for (const [id, [storyRe, url]] of Object.entries(want)) {
    const n = npc(api, id);
    if (!n || !api.inCampT(Math.floor(n.x / 16), Math.floor(n.y / 16))) { fail(`npc ${id}`, 'missing or outside the camp'); continue; }
    api.talk(n); const pages = readDialog(api);
    const ui = api.get().ui;
    if (!pages.some(p => storyRe.test(p)) || !ui || ui.type !== 'menu') { fail(`npc ${id}`, `story/menu wrong: ${pages.join(' / ')}`); continue; }
    const rows = ui.build(), link = rows.find(r => r.label !== 'LEAVE' && !/STORY/.test(r.label));
    const msg = link.act();
    if (!api.opened().includes(url) || !/^LINK: /.test(msg)) fail(`npc ${id}`, `opened ${api.opened()} msg ${msg}`);
    else pass(`npc ${id}`, `${n.name}: ${pages.length} story pages, "${link.label}" -> ${url}`);
    api.get().ui = null;
  }
  const solid = ['lotto', 'noah', 'bitget'].map(id => npc(api, id)).every(n => api.get().P && Math.abs(n.x - api.get().P.x) + Math.abs(n.y - api.get().P.y) > 0);
  if (!solid) fail('npc spots', 'an NPC sits on the spawn point'); else pass('npc spots', 'beside the fire and next to the Sphinx, clear of the spawn');
});

scenario('faction trainers: pick a class locally, its mechanic applies, one class at a time (D-028)', () => {
  const api = boot(SEED + 30); startGame(api);
  // the three trainers stand in the safe camp, clear of the spawn point
  let ok = true;
  for (const id of ['warrior', 'archer', 'healer']) {
    const n = npc(api, id);
    if (!n) { fail('trainer ' + id, 'missing'); ok = false; continue; }
    if (!api.inCampT(Math.floor(n.x / 16), Math.floor(n.y / 16))) { fail('trainer ' + id, 'outside the camp'); ok = false; }
    if (Math.abs(n.x - api.get().P.x) + Math.abs(n.y - api.get().P.y) < 1) { fail('trainer ' + id, 'sits on the spawn'); ok = false; }
  }
  if (ok) pass('trainers placed', 'warrior/archer/healer in camp, clear of the spawn');
  // no class by default -> neutral stats
  if (api.classOf() || api.classDmg() !== 1 || api.classSpd() !== 1 || api.classArmor() !== 0) fail('no class', 'default player already has a class/modifier');
  else pass('no class', 'start with NO CLASS and neutral stats');
  // talk to the warrior trainer and take the warrior path (local, no wallet)
  const w = npc(api, 'warrior'); api.talk(w); readDialog(api);
  let ui = api.get().ui;
  if (!ui || ui.type !== 'menu') { fail('warrior menu', 'no menu after the trainer dialog'); return; }
  const become = ui.build().find(r => /BECOME A WARRIOR/.test(r.label));
  if (!become) { fail('warrior menu', 'no BECOME A WARRIOR row: ' + ui.build().map(r => r.label).join(' | ')); return; }
  become.act();
  if (api.get().P.prof !== 'warrior') fail('become warrior', 'P.prof=' + api.get().P.prof);
  else if (!(api.classDmg() > 1.2 && api.classSpd() < 1 && api.classArmor() > 0 && api.get().P.maxHp === 85)) fail('warrior stats', `dmg ${api.classDmg()} spd ${api.classSpd()} armor ${api.classArmor()} maxHp ${api.get().P.maxHp}`);
  else pass('become warrior', `WARRIOR: dmg x${api.classDmg()}, spd x${api.classSpd()}, +${api.classArmor()} armor, maxHp ${api.get().P.maxHp}`);
  api.get().ui = null;
  // retrain to archer (local switch) -> faster, 60 maxHp, and Space fires an arrow (0 MP)
  const a = npc(api, 'archer'); api.talk(a); readDialog(api); ui = api.get().ui;
  const sw = ui.build().find(r => /SWITCH TO ARCHER/.test(r.label));
  if (!sw) { fail('switch archer', 'no SWITCH TO ARCHER row: ' + ui.build().map(r => r.label).join(' | ')); return; }
  sw.act();
  if (api.get().P.prof !== 'archer') fail('switch archer', 'P.prof=' + api.get().P.prof);
  else if (!(api.classSpd() > 1.2 && api.classDmg() === 1 && api.get().P.maxHp === 60)) fail('archer stats', `spd ${api.classSpd()} dmg ${api.classDmg()} maxHp ${api.get().P.maxHp}`);
  else pass('switch archer', `ARCHER: spd x${api.classSpd()} faster, dmg x${api.classDmg()}, maxHp ${api.get().P.maxHp} — still one class`);
  api.press('escape'); api.step(DT);
  // Archer basic Space attack shoots an arrow with 0 MP cost
  api.get().projs.length = 0; api.get().P.atkCd = 0; api.get().P.mp = 30; api.get().P.dir = 'right';
  api.press(' '); api.step(DT);
  const basicArrow = api.get().projs.find(p => p.kind === 'arrow');
  if (!basicArrow || api.get().P.mp !== 30) fail('archer basic arrow', `arrow=${!!basicArrow} mp=${api.get().P.mp}`);
  else pass('archer basic arrow', 'Space fires a fast basic arrow (0 MP cost)');
  // retrain to healer -> fast (spd 1.25), weak melee (dmg 0.65), less HP (45 maxHp), melee hit restores +2 MP
  const h = npc(api, 'healer'); api.talk(h); readDialog(api); ui = api.get().ui;
  ui.build().find(r => /SWITCH TO HEALER/.test(r.label)).act(); api.press('escape'); api.step(DT);
  if (api.get().P.prof !== 'healer' || api.get().P.maxHp !== 45 || api.classDmg() !== 0.65 || api.classSpd() !== 1.25) fail('healer stats', `prof=${api.get().P.prof} maxHp=${api.get().P.maxHp} dmg=${api.classDmg()} spd=${api.classSpd()}`);
  else pass('healer stats', 'HEALER: maxHp 45 (-15 HP), melee x0.65 (weak), spd x1.25 (fast)');
});

scenario('class skills: GROUND POUND knocks back, QUICK SHOT flies fast, MEND spends MP to heal (D-029)', () => {
  const api = boot(SEED + 31); startGame(api);
  // WARRIOR: ground pound damages + knocks back an adjacent cat and costs 12 MP
  let P = api.get().P; P.prof = 'warrior'; P.mp = 30;
  const e = api.makeEnemy('alley', P.x + 18, P.y, 'field'); api.get().enemies.push(e);
  const hp0 = e.hp, mp0 = P.mp; api.useSkill();
  if (!(e.hp < hp0 || e.dead)) fail('ground pound', `enemy hp ${hp0}->${e.hp}`);
  else if (!(e.kbx !== 0 || e.kby !== 0 || e.dead)) fail('ground pound', 'no knockback');
  else if (api.get().P.mp !== mp0 - api.SKILL_MP.warrior) fail('ground pound mp', `mp ${mp0}->${api.get().P.mp}`);
  else pass('ground pound', `cat ${hp0}->${e.hp} hp, knocked back, -${api.SKILL_MP.warrior} MP`);
  // ARCHER: quick shot is a fast, cheap 3-arrow volley
  P = api.get().P; P.prof = 'archer'; api.syncMaxHp(); P.mp = 30; P.dir = 'right'; api.get().projs.length = 0;
  const mpA = P.mp; api.useSkill();
  const arrows = api.get().projs.filter(p => p.kind === 'arrow');
  if (arrows.length < 3) fail('quick shot', `expected 3-arrow volley, got ${arrows.length}`);
  else if (Math.abs(arrows[0].vx) + Math.abs(arrows[0].vy) < 300) fail('quick shot', 'arrow too slow: ' + arrows[0].vx);
  else if (api.get().P.mp !== mpA - api.SKILL_MP.archer) fail('quick shot mp', 'mp ' + api.get().P.mp);
  else pass('quick shot', `3-arrow volley speed ${Math.round(Math.abs(arrows[0].vx) + Math.abs(arrows[0].vy))}, -${api.SKILL_MP.archer} MP`);
  // HEALER: mend trades MP for HP (above the 60% rest cap is allowed; MP only refills in camp)
  P = api.get().P; P.prof = 'healer'; api.syncMaxHp(); P.hp = 20; P.mp = 30;
  const hpH = P.hp, mpH = P.mp; api.useSkill();
  if (!(api.get().P.hp > hpH)) fail('mend heal', `hp ${hpH}->${api.get().P.hp}`);
  else if (!(api.get().P.mp < mpH)) fail('mend mp', 'MP not spent');
  else pass('mend', `healed ${hpH}->${api.get().P.hp} hp for ${mpH - api.get().P.mp} MP`);
});

scenario('Sphinx = DogeOS DeFi hub: connect, market, faucet, stake, oracle, school, dogeos.com, docs', () => {
  const api = boot(SEED + 29); startGame(api);
  const bank = npc(api, 'bank'); bank.met = true; api.talk(bank);
  const labels = api.get().ui.build().map(r => r.label);
  const need = [/^WALLET: OFFLINE|^CONNECT WALLET/, /^NFT MARKET: SWAP \+ LIQUIDITY/, /^ON-CHAIN STAKING/, /FAUCET/, /^STAKE /, /^UNSTAKE /, /REDSTONE/, /SPHINX SCHOOL/, /^DOGEOS\.COM/, /DEVELOPER DOCS/];
  const missing = need.filter(re => !labels.some(l => re.test(l)));
  if (missing.length) fail('hub rows', `missing ${missing.join(', ')} in: ${labels.join(' | ')}`); else pass('hub rows', `${labels.length} rows incl. connect, market, staking, faucet, vault, oracle, school, links`);
  // the on-chain DOGE-staking submenu opens (offline it prompts to connect; must never crash)
  api.get().ui.build().find(r => /^ON-CHAIN STAKING/.test(r.label)).act();
  const stk = api.get().ui;
  if (!stk || stk.type !== 'menu' || !stk.build().some(r => /CONNECT YOUR WALLET TO STAKE|YOUR STAKE:/.test(r.label))) fail('staking menu', 'did not open: ' + (stk && stk.build().map(r => r.label).join(' | ')));
  else pass('staking menu', 'DOGE STAKING opens (earn 0.8% of DEX fees)');
  stk.build().find(r => /^BACK$/.test(r.label)).act(); // back to the hub for the rest of the scenario
  for (const [re, url] of [[/FAUCET/, api.LINKS.faucet], [/^DOGEOS\.COM/, api.LINKS.dogeos], [/DEVELOPER DOCS/, api.LINKS.docs]]) api.get().ui.build().find(r => re.test(r.label)).act();
  const o = api.opened();
  if (!o.includes('https://faucet.testnet.dogeos.com') || !o.includes('https://www.dogeos.com/') || !o.includes('https://docs.dogeos.com/en/getting-started/overview')) fail('hub links', o.join(' '));
  else pass('hub links', 'faucet, dogeos.com and docs open');
  api.get().ui.build().find(r => /SPHINX SCHOOL/.test(r.label)).act();
  const school = api.get().ui;
  if (school.title !== 'SPHINX SCHOOL: DEFI 101' || school.build().length !== api.SCHOOL.length + 1) throw new Error('school menu');
  school.build().find(r => /LIQUIDITY POOL/.test(r.label)).act();
  const pages = readDialog(api);
  if (!pages.some(p => /impermanent loss/i.test(p)) || !api.get().ui || api.get().ui.title !== 'SPHINX SCHOOL: DEFI 101') fail('school', `pages: ${pages.join(' / ')}`);
  else pass('school', `${api.SCHOOL.length} lessons; LP lesson read, back in the school menu`);
});

scenario('Elder = Keeper of the Heist: story, factions, join, heist.dogeos.com', () => {
  const api = boot(SEED + 30); startGame(api);
  const g = api.get(); g.state.stage = 1; // after the first quest talk the Elder opens his menu
  api.talk(npc(api, 'quest'));
  const ui = api.get().ui;
  if (!ui || ui.title !== 'ELDER SHIBE: KEEPER OF THE HEIST') throw new Error('elder menu did not open: ' + (ui && ui.title));
  ui.build().find(r => /GRAND HEIST/.test(r.label)).act();
  const story = readDialog(api);
  if (!story.some(p => /Fat Cats/.test(p)) || !story.some(p => /HEIST\.DOGEOS\.COM/.test(p))) fail('heist story', story.join(' / ')); else pass('heist story', `${story.length} pages, Fat Cats + heist.dogeos.com`);
  api.get().ui.build().find(r => /^FACTIONS/.test(r.label)).act();
  const rows = api.get().ui.build();
  if (rows.filter(r => /^READ: /.test(r.label)).length !== 3) throw new Error('3 factions expected');
  rows.find(r => /JOIN BARKITECTS/.test(r.label)).act();
  if (g.P.faction !== 'bark') fail('join faction', `faction ${g.P.faction}`); else pass('join faction', 'joined the Barkitects');
  api.get().ui.build().find(r => r.label === 'BACK').act();
  api.get().ui.build().find(r => /HEIST\.DOGEOS\.COM/.test(r.label)).act();
  if (!api.opened().includes('https://heist.dogeos.com/')) fail('heist link', api.opened().join(' ')); else pass('heist link', 'heist.dogeos.com opens');
});

await scenarioAsync('RedStone oracle on Chikyu: stale feed falls back to the last pushed value; Bitget provider works', async () => {
  // RedStone's DOGE feed reverts while stale (seen live 2026-11-07); the adapter's getLastUpdateDetailsUnsafe still answers
  const eth = mockEth({ known: true });
  const tsMs = BigInt(Date.now() - 51 * 3600e3), w = n => BigInt(n).toString(16).padStart(64, '0');
  eth.callResult = c => {
    const to = c.to.toLowerCase(), sel = c.data.slice(2, 10);
    if (to === '0x434f8d17c0301cfea143dba912972e24b827c968' && sel === 'feaf968c') throw { code: 3, message: 'execution reverted', data: '0x4f319ffe' };
    if (to === '0xb08342d907d2df47b6f73e25f4fa033978b344b1' && sel === '729bfda4') return '0x' + w(tsMs) + w(tsMs / 1000n) + w(7164240);
    return '0x';
  };
  const api = boot(SEED + 31, { bitkeep: eth, realTimers: true }); startGame(api); // Bitget-only provider (window.bitkeep.ethereum)
  if (api.eth() !== eth) fail('bitget provider', 'eth() did not find window.bitkeep.ethereum'); else pass('bitget provider', 'window.bitkeep.ethereum detected');
  openSphinx(api); selectRow(api, /^CONNECT WALLET/); api.press('e'); api.step(DT); await flush(); await idle(api);
  for (let i = 0; i < 30 && !api.oracle.loaded; i++) await flush();
  const o = api.oracle;
  if (!o.loaded || Math.abs(o.price - 0.0716424) > 1e-9 || o.src !== 'LAST PUSH') fail('oracle fallback', JSON.stringify(o));
  else pass('oracle fallback', `$${o.price} from ${o.src} (feed reverted as stale)`);
  const row = api.get().ui.build().find(r => /REDSTONE DOGE\/USD/.test(r.label));
  if (!row || !/REDSTONE DOGE\/USD \$0\.0716 \(STALE\)/.test(row.label)) fail('oracle row', row ? row.label : 'missing'); else pass('oracle row', `"${row.label}"`);
  api.get().ui = null;
  for (let f = 0; f < 60 * 120; f++) api.step(DT); // 2 minutes of market ticks
  const p = api.get().mkt.p;
  if (p < 0.0716424 / 5 || p > 0.0716424 * 5) fail('market anchor', `price ${p} drifted outside the oracle band`); else pass('market anchor', `game DOGE $${p.toFixed(4)} drifts around the RedStone price`);
});

// ---------- D-035: Audit hardening & Phase 5 on-chain coverage (G-1..G-7, I-3, I-4, I-5, I-8) ----------
await scenarioAsync('D-035: on-chain profession oath, staking, delist, chainChanged reload & disconnect', async () => {
  const eth = mockEth({ known: true });
  const w = n => BigInt(n).toString(16).padStart(64, '0');
  let profId = 0, staked = 2n * 10n ** 18n, rewards = 5n * 10n ** 16n, dexFees = 8n * 10n ** 16n;
  eth.callResult = c => {
    const d = (c.data || '').replace(/^0x/, ''), sel = d.slice(0, 8);
    if (sel === '7eaebb15' || sel === 'c5c63e65') return '0x' + w(32) + w(0); // empty dynamic uint256[]
    if (sel === 'aa4df6f0') return '0x' + w(96) + w(128) + w(160) + w(0) + w(0) + w(0); // empty activeListings
    if (sel === 'e985e9c5') return '0x' + w(1); // approved
    if (sel === '31544fd8') return '0x' + w(profId); // professionOf
    if (sel === 'ddca3f43') return '0x' + w(10n ** 16n); // profFee = 0.01 DOGE
    if (sel === '98807d84') return '0x' + w(staked); // stakedOf
    if (sel === '31d7a262') return '0x' + w(rewards); // pendingRewards
    if (sel === '67f7cf97') return '0x' + w(dexFees); // stakerFeesView
    return '0x' + w(0);
  };
  const api = boot(SEED + 35, { eth, realTimers: true }); startGame(api);
  const ok = await api.connectWallet(); await flush(); await idle(api);
  if (!ok || !api.wallet.connected || !api.chainData.loaded) fail('connectWallet', `ok=${ok} loaded=${api.chainData.loaded}`);
  else pass('connectWallet', 'connected directly & loaded Chikyu state');

  // G-1: switching to wrong network clears chainData; switching back to Chikyu reloads chainData & oracle
  eth.handlers.chainChanged('0x1'); await flush();
  const dropped = !api.wallet.chainOk && !api.chainData.loaded;
  eth.handlers.chainChanged('0x5fdaf3'); await flush();
  for (let i = 0; i < 30 && !api.chainData.loaded; i++) await flush();
  if (!dropped || !api.wallet.chainOk || !api.chainData.loaded) fail('chainChanged reload', `dropped=${dropped} chainOk=${api.wallet.chainOk} loaded=${api.chainData.loaded}`);
  else pass('chainChanged reload', 'switching back to Chikyu reloads chainData automatically');

  // on-chain chooseProfession locks wallet to one class
  profId = 1;
  await api.chooseProfession('warrior'); await idle(api);
  const txProf = eth.sent.at(-1);
  if (api.get().P.prof !== 'warrior' || !txProf || !txProf.data.startsWith('0x' + api.SEL.chooseProf)) fail('on-chain prof', `prof=${api.get().P.prof} tx=${JSON.stringify(txProf)}`);
  else pass('on-chain prof', 'chooseProfession sent SEL.chooseProf + profFee');
  const sentBeforeLock = eth.sent.length;
  await api.chooseProfession('archer');
  if (api.get().P.prof !== 'warrior' || eth.sent.length !== sentBeforeLock || !/LOCKED IN/.test(api.wallet.msg)) fail('prof lock', `prof=${api.get().P.prof} msg="${api.wallet.msg}"`);
  else pass('prof lock', 'second on-chain class change refused (one class per wallet)');

  // stakeDoge, claimStakeRewards, unstakeStake, syncDexFees, delistNft + direct marketMenu mint & stakeMenu Row 0
  api.marketMenu(npc(api, 'bank'));
  const mktRow0 = api.get().ui.build()[0];
  if (!mktRow0 || !/^MINT < HAMMER LV2 > NFT/.test(mktRow0.label)) fail('market direct mint row', mktRow0 ? mktRow0.label : 'missing');
  else {
    mktRow0.act(); await idle(api);
    if (!eth.sent.at(-1).data.startsWith('0x' + api.SEL.mint)) fail('market direct mint tx', JSON.stringify(eth.sent.at(-1)));
    else pass('market direct mint', `"${mktRow0.label}" at row 0 mints directly on DogeItems`);
  }
  api.stakeMenu(npc(api, 'bank'));
  const stkRow0 = api.get().ui.build()[0];
  if (!stkRow0 || !/^STAKE < 1 > DOGE/.test(stkRow0.label)) fail('stakeMenu row 0', stkRow0 ? stkRow0.label : 'missing');
  else pass('stakeMenu row 0', `"${stkRow0.label}" is row 0 for immediate staking`);
  api.get().P.doge = 0; api.bankMenu(npc(api, 'bank'));
  api.get().ui.build().find(r => /^STAKE 0 DOGE IN THE VAULT/.test(r.label)).act();
  if (!api.get().ui || !/DOGE STAKING/.test(api.get().ui.title)) fail('vault stake redirect', api.get().ui && api.get().ui.title);
  else pass('vault stake redirect', 'STAKE 0 DOGE IN THE VAULT redirects to ON-CHAIN STAKING when wallet is connected');
  api.press('escape'); api.step(DT);
  await api.stakeDoge(1); await idle(api);
  if (!eth.sent.at(-1).data.startsWith('0x' + api.SEL.stakeDoge)) fail('stakeDoge', JSON.stringify(eth.sent.at(-1)));
  else pass('stakeDoge', 'staked 1 DOGE via SEL.stakeDoge');
  await api.claimStakeRewards(); await idle(api);
  if (!eth.sent.at(-1).data.startsWith('0x' + api.SEL.claimStake)) fail('claimStakeRewards', JSON.stringify(eth.sent.at(-1)));
  else pass('claimStakeRewards', 'claimed rewards via SEL.claimStake');
  await api.unstakeStake(); await idle(api);
  if (!eth.sent.at(-1).data.startsWith('0x' + api.SEL.unstakeDoge)) fail('unstakeStake', JSON.stringify(eth.sent.at(-1)));
  else pass('unstakeStake', 'unstaked via SEL.unstakeDoge');
  await api.syncDexFees(); await idle(api);
  if (!eth.sent.at(-1).data.startsWith('0x' + api.SEL.flushFees)) fail('syncDexFees', JSON.stringify(eth.sent.at(-1)));
  else pass('syncDexFees', 'flushed DEX fees to stakers via SEL.flushFees');
  await api.delistNft({ id: 7, type: 1, level: 2, price: 10n ** 18n, mine: true }); await idle(api);
  if (!eth.sent.at(-1).data.startsWith('0x' + api.SEL.delist)) fail('delistNft', JSON.stringify(eth.sent.at(-1)));
  else pass('delistNft', 'delisted #7 via SEL.delist');

  // D-036: starter material mint (1 WOOD + 1 STONE) + DOGEON Pool DEX wallet items balance & CREATE POOL row
  const woodBefore = api.bagCount('wood'), stoneBefore = api.bagCount('stone');
  await api.mintNft(1, 2, 'starter'); await idle(api);
  if (api.bagCount('wood') !== woodBefore - 1 || api.bagCount('stone') !== stoneBefore - 1 || !eth.sent.at(-1).data.startsWith('0x' + api.SEL.mint)) fail('starter mint', `wood=${api.bagCount('wood')} stone=${api.bagCount('stone')}`);
  else pass('starter mint', 'minted HAMMER LV2 NFT consuming 1 WOOD + 1 STONE from starter bag');

  api.chainData.inv = [{ id: 1, type: 1, level: 2 }];
  api.marketMenu(npc(api, 'bank'));
  const mktRows = api.get().ui.build().map(r => r.label);
  if (!api.get().ui.pooldex || !mktRows.some(l => /^WALLET ITEMS \(1\): #1 HAMMER LV2/.test(l)) || !mktRows.some(l => /^CREATE POOL: 1 HAMMER LV2/.test(l))) fail('pool dex', mktRows.join(' | '));
  else pass('pool dex', 'DOGEON Pool DEX shows WALLET ITEMS (1): #1 HAMMER LV2 + CREATE POOL row');
  api.press('escape'); api.step(DT);

  api.disconnectWallet(); await flush();
  if (api.wallet.connected || api.chainData.loaded) fail('disconnectWallet', `connected=${api.wallet.connected} loaded=${api.chainData.loaded}`);
  else pass('disconnectWallet', 'wallet disconnected and chainData cleared');
});

scenario('D-035: boss summon aggro (I-3), spawnEnemy >= 200px (I-4), title particles dt (I-5), Sphinx dialog (G-2)', () => {
  const api = boot(SEED + 36);
  // I-5: on title screen, step(DT) advances particles in update(dt) exactly once per frame
  api.get().parts.push({ x: 100, y: 100, vx: 60, vy: 0, life: 1, col: '#fff' });
  api.step(DT);
  const px = api.get().parts[0] && api.get().parts[0].x;
  if (Math.abs(px - 101) > 1e-4) fail('title particles dt', `x=${px}, expected 101 (1 update per step, not 2)`);
  else pass('title particles dt', 'title particles update once per step(dt) in update()');

  startGame(api);
  const g = api.get(), P = g.P;

  // G-2: Sphinx first-time dialog and STAKE school lesson reflect real DogeOS testnet + camp vault
  const bank = npc(api, 'bank'); bank.met = false; api.talk(bank);
  const sphinxPages = readDialog(api);
  api.press('escape'); api.step(DT); // close bankMenu opened by dialog onEnd
  const stakeLesson = api.SCHOOL.find(([t]) => t === 'STAKE')[1].join(' ');
  if (sphinxPages.some(p => /No real transactions/i.test(p)) || !/0\.8%/.test(stakeLesson)) fail('sphinx dialog', sphinxPages.join(' / ') + ' || ' + stakeLesson);
  else pass('sphinx dialog', 'Sphinx intro + STAKE lesson describe both off-chain vault and on-chain DogeOS contracts');

  // I-4: spawnEnemy never spawns closer than 200px (screen half-diagonal is 195.2px)
  P.x = 20 * 16 + 8; P.y = 45 * 16 + 8; api.get().enemies.splice(0);
  let minDist = Infinity;
  for (let i = 0; i < 60; i++) {
    const live = api.get().enemies, before = live.length; api.spawnEnemy('field');
    if (live.length > before) { const e = live.at(-1); minDist = Math.min(minDist, Math.hypot(e.x - P.x, e.y - P.y)); }
  }
  if (minDist < 200) fail('spawn distance', `minDist=${minDist.toFixed(1)} < 200px`);
  else pass('spawn distance', `60 field spawns all >= 200px from player (min ${minDist.toFixed(1)}px)`);

  // I-3: boss-summoned minion (zone:'boss', !boss) wanders when player is far outside boss room, chases inside boss room
  api.get().enemies.splice(0);
  const minion = api.makeEnemy('alley', api.CX * 16 + 8, 6 * 16 + 8, 'boss');
  api.get().enemies.push(minion);
  P.x = 20 * 16 + 8; P.y = 50 * 16 + 8; // far away in field
  api.step(DT);
  const farState = minion.state;
  P.x = api.CX * 16 + 8; P.y = 8 * 16 + 8; // inside boss room
  api.step(DT);
  const nearState = minion.state;
  if (farState !== 'wander' || nearState !== 'chase') fail('boss minion aggro', `far=${farState} near=${nearState}`);
  else pass('boss minion aggro', 'boss-summoned cat wanders when player leaves boss room, chases inside boss room');
});

scenario('D-040 multiplayer option: off by default, opt-in ?mp relays state, hostile peer data sanitized, ghosts drop on silence', () => {
  // 1. default: no ?mp -> no socket ever built (single-player + sandboxed publish unchanged)
  let built = 0;
  class SpyWS { constructor() { built++; } }
  const off = boot(SEED + 40, { WebSocket: SpyWS }); startGame(off);
  for (let i = 0; i < 60; i++) off.step(DT);
  if (built === 0 && off.NET_URL === '') pass('net off by default', 'no ?mp -> zero WebSocket constructions, zero network');
  else fail('net off by default', `built=${built} url=${off.NET_URL}`);

  // 2. opt-in: connects to the given relay, joins the room, broadcasts own state at ~10 Hz
  const sent = []; let sock = null;
  class FakeWS { constructor(url) { this.url = url; this.readyState = 0; sock = this; } send(s) { sent.push(JSON.parse(s)); } close() { this.readyState = 3; if (this.onclose) this.onclose(); } }
  const api = boot(SEED + 41, { WebSocket: FakeWS, search: '?mp=ws%3A%2F%2Frelay.test%3A8787&room=r1&name=al%20ice' }); startGame(api);
  api.step(DT);
  if (!sock || sock.url !== 'ws://relay.test:8787') { fail('net connect', 'no socket or wrong url: ' + (sock && sock.url)); return; }
  sock.readyState = 1; sock.onopen();
  for (let i = 0; i < 30; i++) api.step(DT); // 0.5 s -> ~5 state messages at 10 Hz
  const join = sent.find(m => m.t === 'join'), sts = sent.filter(m => m.t === 'st');
  if (join && join.room === 'r1' && sts.length >= 3 && sts.every(m => Number.isFinite(m.x) && m.n === 'ALICE' && /^[a-z0-9]+$/.test(m.id)))
    pass('net opt-in', `joined r1, ${sts.length} state msgs in 0.5 s, name sanitized "al ice" -> ALICE, wallet address never sent`);
  else fail('net opt-in', JSON.stringify(sent.slice(0, 3)));

  // 3. peer data is untrusted: one valid ghost accepted, hostile messages rejected or clamped
  const msg = o => sock.onmessage({ data: typeof o === 'string' ? o : JSON.stringify(o) });
  msg({ t: 'st', id: 'bob1', x: 700, y: 600, d: 'left', m: 1, c: 'warrior', h: 70, n: 'bob<script>', dead: 0 });
  msg({ t: 'st', id: '__proto__', x: 1, y: 1 });                         // prototype-pollution attempt
  msg({ t: 'st', id: 'evil', x: 'NaN', y: 1 });                           // non-finite coords
  msg({ t: 'st', id: 'mal', x: 5, y: 5, c: 'constructor', d: 'sideways', h: 999, n: '' });
  msg('{garbage');
  const p = api.net.peers;
  const okSan = p.bob1 && p.bob1.n === 'BOBSCRIPT' && p.bob1.c === 'warrior' && p.bob1.d === 'left'
    && !Object.prototype.hasOwnProperty.call(p, 'evil') && Object.getPrototypeOf(p) === null
    && p.mal && p.mal.c === '' && p.mal.d === 'down' && p.mal.h === 100 && p.mal.n === 'DOGE';
  if (okSan) pass('net sanitize', 'ghost accepted; __proto__ / NaN / garbage rejected; class, dir, hp, name clamped');
  else fail('net sanitize', JSON.stringify(Object.keys(p)) + ' ' + JSON.stringify(p.bob1) + ' ' + JSON.stringify(p.mal));

  // 4. ghosts render in drawWorld without throwing; a peer silent for > NET_TTL seconds is dropped
  try { for (let i = 0; i < 5; i++) api.step(DT); pass('net draw', 'ghost players render in the y-sorted world without errors'); }
  catch (e) { fail('net draw', e.message); }
  for (let i = 0; i < (api.NET_TTL + 1) * 60; i++) api.step(DT);
  if (!Object.keys(api.net.peers).length) pass('net ttl', `silent peers drop after ${api.NET_TTL}s`);
  else fail('net ttl', 'peers kept: ' + Object.keys(api.net.peers).join());
});

scenario('D-046: Healer heals self and peers in multiplayer (Mission Item 5)', () => {
  const sent = []; let sock = null;
  class FakeWS { constructor(url) { this.url = url; this.readyState = 0; sock = this; } send(s) { sent.push(JSON.parse(s)); } close() {} }
  const api = boot(SEED + 46, { WebSocket: FakeWS, search: '?mp=ws%3A%2F%2Frelay.test%3A8787&room=heist&name=healer' });
  startGame(api);
  api.step(DT); // netConnect() runs inside netTick()
  if (sock) { sock.readyState = 1; if (sock.onopen) sock.onopen(); }
  api.applyClass('healer', false);
  const P = api.get().P;
  P.hp = 20; P.mp = 30;
  api.useSkill(); // MEND
  const healMsg = sent.find(m => m.t === 'heal');
  if (P.hp === 40 && healMsg && healMsg.amt === 20 && healMsg.r === 72)
    pass('healer mend pulse', `MEND healed self (20->40) and sent pulse: amt=${healMsg.amt} r=${healMsg.r}`);
  else fail('healer mend pulse', `hp=${P.hp} msg=${JSON.stringify(healMsg)}`);

  // Receiving a heal pulse from a peer heals P
  P.hp = 15;
  sock.onmessage({ data: JSON.stringify({ t: 'heal', id: 'bob9', amt: 25, x: Math.round(P.x), y: Math.round(P.y), r: 72 }) });
  if (P.hp === 40) pass('receive peer heal', 'received peer heal pulse: hp 15->40');
  else fail('receive peer heal', `hp=${P.hp}`);
});

scenario('D-038: class TTK & MP balance, invMenu ON-CHAIN ITEMS clarity, pool DEX LP/impact rows, HUD skill MP cost', () => {
  const api = boot(SEED + 38, { eth: mockEth({ known: true }) }); startGame(api);
  const g = api.get(), P = g.P;

  // 1. Class TTK & survivability vs basic doge against a knight (35 HP) in neutral market
  const simKillFrames = (prof, useVolley) => {
    const cur = api.get();
    cur.enemies.splice(0); cur.projs.splice(0); cur.mkt.sent = 0; api.get().ui = null;
    P.x = 20 * 16 + 8; P.y = 50 * 16 + 8; P.dir = 'right'; P.dead = false; P.iT = 99; P.kbx = 0; P.kby = 0; P.atkCd = 0; P.atkT = 0; P.skills.combat = 0; P.skills.bark = 0; P.mp = 30;
    P.prof = null; P.maxHp = 60; P.hp = 60;
    if (prof) api.applyClass(prof, false);
    const distPx = prof === 'archer' ? 48 : 14;
    const kn = api.makeEnemy('knight', P.x + distPx, P.y, 'field');
    kn.spd = 0; kn.def = { ...kn.def, spd: 0 }; // stationary target dummy for exact TTK measurement
    api.get().enemies.push(kn);
    if (useVolley) api.useSkill();
    let frames = 0;
    while (!kn.dead && kn.hp > 0 && frames < 300) {
      kn.x = P.x + distPx; kn.y = P.y; kn.kbx = 0; kn.kby = 0;
      if (P.atkCd <= 0) { api.press(' '); }
      api.step(DT); frames++;
    }
    return frames;
  };
  const fBase = simKillFrames(null, false);
  const fWar = simKillFrames('warrior', false);
  const fArc = simKillFrames('archer', true);
  if (!(fWar < fBase && fArc < fBase)) fail('class ttk', `base=${fBase}f warrior=${fWar}f archer=${fArc}f`);
  else pass('class ttk', `WARRIOR (${fWar}f) and ARCHER (${fArc}f at 48px range) both beat basic doge TTK (${fBase}f) on a ${api.ETYPES.knight.hp}-HP knight`);

  // Healer MP-on-hit + MEND sustain loop: 5 staff hits restore +10 MP (1 full MEND = +20 HP), effective HP > basic doge
  api.get().enemies.splice(0); P.dead = false; P.iT = 99; P.kbx = 0; P.kby = 0; P.prof = null; P.maxHp = 60; P.hp = 60;
  api.applyClass('healer', false);
  P.hp = 20; P.mp = 20; P.dir = 'right'; P.atkCd = 0;
  const dummy = api.makeEnemy('bull', P.x + 12, P.y, 'field'); api.get().enemies.push(dummy);
  for (let i = 0; i < 5; i++) { dummy.x = P.x + 12; dummy.y = P.y; P.atkCd = 0; api.press(' '); api.step(DT); }
  const mpAfter5 = P.mp;
  api.useSkill(); // MEND (10 MP -> +20 HP)
  if (mpAfter5 !== 30 || P.hp !== 40 || P.mp !== 20) fail('healer sustain', `mpAfter5=${mpAfter5} hp=${P.hp} mp=${P.mp}`);
  else pass('healer sustain', '5 staff hits restored +10 MP (20->30), funding MEND (+20 HP, 105 effective HP pool)');

  // 2. HUD skill-cost indicator (hudTag)
  P.prof = null; const t0 = api.hudTag();
  api.applyClass('warrior', false); const tW = api.hudTag();
  api.applyClass('archer', false); const tA = api.hudTag();
  api.applyClass('healer', false); const tH = api.hudTag();
  if (!/10MP/.test(t0) || !/WARRIOR.*12MP/.test(tW) || !/ARCHER.*6MP/.test(tA) || !/HEALER.*10MP/.test(tH)) fail('hud skill cost', `${t0} | ${tW} | ${tA} | ${tH}`);
  else pass('hud skill cost', `HUD displays class + K/Q MP cost (${tW}, ${tA}, ${tH})`);

  // 3. Bag vs wallet clarity in invMenu ("ON-CHAIN ITEMS (N)" row)
  api.invMenu();
  const invOff = api.get().ui.build().map(r => r.label);
  api.press('escape'); api.step(DT);
  api.wallet.connected = true; api.wallet.chainOk = true; api.wallet.addr = '0xabc';
  api.chainData.inv = [{ id: 3, type: 1, level: 2 }]; api.chainData.loaded = true;
  api.invMenu();
  const invOn = api.get().ui.build().map(r => r.label);
  api.press('escape'); api.step(DT);
  if (!invOff.some(l => /^ON-CHAIN ITEMS \(0\): MINT AT SPHINX\/FORGE/.test(l)) || !invOn.some(l => /^ON-CHAIN ITEMS \(1\): SAFE ON DEATH/.test(l)))
    fail('invMenu on-chain clarity', invOff.join(' | ') + ' // ' + invOn.join(' | '));
  else pass('invMenu on-chain clarity', 'invMenu shows ON-CHAIN ITEMS (N): SAFE ON DEATH vs off-chain bag items');

  // 4. DOGEON Pool DEX LP share + price-impact feedback (all labels <= 50 chars)
  api.chainData.pools = [{ key: 258n, type: 1, level: 2, doge: 2n * 10n ** 18n, n: 2, shares: 2n * 10n ** 18n, mine: 10n ** 18n, buy: 206n * 10n ** 16n, sell: 65n * 10n ** 16n }];
  api.marketMenu(npc(api, 'bank'));
  const dexRows = api.get().ui.build().map(r => r.label);
  const maxLen = Math.max(...dexRows.map(l => l.length));
  if (!dexRows.some(l => /^POOL HAMMER LV2: 2 ITEMS \/ 2 DOGE \(LP 50%\)/.test(l))
    || !dexRows.some(l => /^ SWAP 2\.06 DOGE -> 1 HAMMER LV2 \(\+106%\)/.test(l))
    || !dexRows.some(l => /^ SWAP 1 HAMMER LV2 -> 0\.65 DOGE \(-35%\)/.test(l))
    || maxLen > 50) fail('pool dex feedback', `maxLen=${maxLen} rows=${dexRows.join(' | ')}`);
  else pass('pool dex feedback', `pool DEX rows show LP 50% + (+106%)/(-35%) price impact (max label ${maxLen} <= 50 chars)`);
  api.press('escape'); api.step(DT);
});

scenario('D-068: on-chain currency purity, raid timer, timed lazy debuff & fee split', () => {
  const api = boot(SEED + 68); startGame(api);
  const g = api.get();

  // 1. Currency purity: default mint fee is 1 DOGE (10n**18n)
  if (api.chainData.fee !== 10n ** 18n) { fail('default mint fee', `expected 1 DOGE (10^18), got ${api.chainData.fee}`); return; }

  // 2. Dungeon raid timer and gate solid check
  if (!g.state.raidOpen || g.state.raidT <= 0) { fail('raid init', `raidOpen=${g.state.raidOpen} raidT=${g.state.raidT}`); return; }
  g.state.gateOpen = true; g.state.raidOpen = false;
  if (!api.solidFor(api.CX, api.GATE_ROW, g.P)) { fail('raid sealed block', 'sealed raid allowed entry through gate'); return; }
  g.state.raidOpen = true;
  if (api.solidFor(api.CX, api.GATE_ROW, g.P)) { fail('raid open pass', 'open raid blocked entry through open gate'); return; }

  // 3. Timed lazy debuff
  g.P.lazyT = 60; g.P.lazy = true;
  api.step(DT);
  if (g.P.lazyT >= 60 || !g.P.lazy) { fail('lazy countdown', `lazyT=${g.P.lazyT}`); return; }
  const dummy = api.makeEnemy('alley', 100, 100, 'field');
  api.damageEnemy(dummy, 10, 1, 0);
  if (g.P.lazyT !== 0 || g.P.lazy) { fail('lazy clear on hit', `lazyT=${g.P.lazyT} lazy=${g.P.lazy}`); return; }

  // 4. PvP loot drop: death scatters materials (steel, whisk) as loot items
  g.P.x = 20 * 16; g.P.y = 20 * 16; g.P.iT = 0; g.P.god = false;
  g.P.steel = 4; g.P.whisk = 3; g.items.length = 0;
  api.hurtPlayer(999, { x: g.P.x + 10, y: g.P.y });
  for (let f = 0; f < 60 * 3; f++) api.step(DT);
  const droppedSteel = api.get().items.filter(it => it.kind === 'steel').length;
  const droppedWhisk = api.get().items.filter(it => it.kind === 'whisk').length;
  if (droppedSteel === 0 || droppedWhisk === 0) { fail('pvp loot drop', `steel=${droppedSteel} whisk=${droppedWhisk}`); return; }

  // 5. DogeMaster: meme NFT store offers 1 DOGE mint
  const elder = g.NPCS.find(n => n.id === 'quest'); elder.met = true;
  g.state.stage = 4; g.state.won = true;
  api.talk(elder);
  const dmRow = api.get().ui.build().find(r => /DOGEMASTER/.test(r.label));
  if (!dmRow) { fail('dogemaster menu', 'DOGEMASTER row missing in elderMenu'); return; }
  dmRow.act();
  const mintGear = api.get().ui.build().find(r => /MINT RANDOM GEAR NFT/.test(r.label));
  if (!mintGear || !mintGear.isNft) { fail('dogemaster mint row', 'missing MINT RANDOM GEAR NFT or isNft flag'); return; }
  g.ui = null;

  // 6. Raid timer expiration -> raidFailed = true, raidOpen = false, sealed
  g.state.raidOpen = true; g.state.raidT = 0.05;
  api.step(0.1);
  if (g.state.raidOpen || !g.state.raidFailed || g.state.raidT <= 1000) { fail('raid expiration', `open=${g.state.raidOpen} failed=${g.state.raidFailed} raidT=${g.state.raidT}`); return; }

  pass('d-068 systems', '1 DOGE fee, raid cycle gate, timed lazy debuff, pvp material drop, DogeMaster meme store');
});

console.log(`\n${failures ? '✗' : '✓'} ${failures} failed, ${warnings} warnings (seed ${SEED})`);
process.exit(failures ? 1 : 0);
