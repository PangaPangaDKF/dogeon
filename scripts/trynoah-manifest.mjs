#!/usr/bin/env node
// DOGEON — TryNoah Recreation Manifest & Blueprint Drift Guard (D-037)
//
//   node scripts/trynoah-manifest.mjs              # print the Markdown manifest
//   node scripts/trynoah-manifest.mjs --out FILE   # write the manifest to FILE
//   node scripts/trynoah-manifest.mjs --verify     # drift guard: blueprint facts must match the source (exit 1 on drift)
//
// WHY: a prose recreation prompt silently goes stale the moment an address, selector or class stat
// changes. This derives the authoritative inventory straight from index.html / contracts/src/*.sol and
// asserts that MASTER_PROMPT.md §A (and prompts/TRYNOAH_RECREATE.md) quote the SAME facts. Zero deps.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rd = p => readFileSync(join(root, p), 'utf8');
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };

const html = rd('index.html');
const sim = existsSync(join(root, 'tests/sim.mjs')) ? rd('tests/sim.mjs') : '';

// ---------- extractors ----------
const block = (src, start) => { // balanced {...} or [...] starting at the first brace after `start`
  const i = src.indexOf(start); if (i < 0) return '';
  const open = src.slice(i).search(/[{[]/); if (open < 0) return '';
  const s = i + open, oc = src[s], cc = oc === '{' ? '}' : ']';
  let d = 0;
  for (let j = s; j < src.length; j++) {
    if (src[j] === oc) d++;
    else if (src[j] === cc && --d === 0) return src.slice(s, j + 1);
  }
  return '';
};

const sections = [...html.matchAll(/\/\/ ={5,}\s*(.+?)\s*={5,}/g)].map(m => m[1]);

const contracts = {};
for (const chain of block(html, 'const CONTRACTS=').matchAll(/'(0x[0-9a-f]+)':\{([^}]*)\}/g)) {
  contracts[chain[1]] = Object.fromEntries([...chain[2].matchAll(/(\w+):'([^']*)'/g)].map(m => [m[1], m[2]]));
}
const sel = Object.fromEntries([...block(html, 'const SEL=').matchAll(/(\w+):'([0-9a-f]{8})'/g)].map(m => [m[1], m[2]]));
const redstone = Object.fromEntries([...block(html, 'const REDSTONE=').matchAll(/(\w+):'(0x[0-9a-fA-F]{40})'/g)].map(m => [m[1], m[2]]));

const clsBlock = block(html, 'const CLASSES=');
const classes = [...clsBlock.matchAll(/(\w+):\{id:(\d+),name:'([^']+)'[^}]*?spr:'(\w+)',trainer:'([^']+)',\s*spd:([\d.]+),dmg:([\d.]+),armor:([\d.-]+),hp:(-?\d+),skill:'([^']+)'/g)]
  .map(m => ({ key: m[1], id: +m[2], name: m[3], spr: m[4], trainer: m[5], spd: +m[6], dmg: +m[7], armor: +m[8], hp: +m[9], skill: m[10] }));

const mintable = [...block(html, 'const MINTABLE=').matchAll(/\{type:(\d+),level:(\d+)\}/g)].map(m => ({ type: +m[1], level: +m[2] }));
const itemTypes = Object.fromEntries([...block(html, 'const ITEM_TYPES=').matchAll(/(\d+):'([^']+)'/g)].map(m => [m[1], m[2]]));
const npcs = [...block(html, 'const NPCS=').matchAll(/id:'([\w]+)'/g)].map(m => m[1]);
const etypes = [...block(html, 'const ETYPES=').matchAll(/^\s{2}(\w+):\{/gm)].map(m => m[1]);
const recipes = [...block(html, 'const RECIPES=').matchAll(/name:'([^']+)'/g)].map(m => m[1]);
const links = Object.fromEntries([...block(html, 'const LINKS=').matchAll(/(\w+):'([^']+)'/g)].map(m => [m[1], m[2]]));

const num = re => { const m = html.match(re); return m ? m[1] : '?'; };
const consts = {
  W: num(/\bW=(\d+)/), H: num(/\bH=(\d+)/), HUD_H: num(/HUD_H=(\d+)/),
  MW: num(/MW=(\d+)/), MH: num(/MH=(\d+)/),
  REST_CAP: num(/REST_CAP=([\d.]+)/), REST_DELAY: num(/REST_DELAY=([\d.]+)/), RESPAWN_FRAC: num(/RESPAWN_FRAC=([\d.]+)/),
  FIELD_POP: num(/FIELD_POP=(\d+)/), DUN_POP: num(/DUN_POP=(\d+)/), SPAWN_EVERY: num(/SPAWN_EVERY=(\d+)/),
  BAG_SIZE: num(/BAG_SIZE=(\d+)/), ORACLE_MAX_AGE: num(/ORACLE_MAX_AGE=(\d+)/),
  NET_HZ: num(/NET_HZ=(\d+)/), NET_TTL: num(/NET_TTL=(\d+)/), NET_MAX: num(/NET_MAX=(\d+)/),
};

// A function is a real on-chain action only if its OWN body talks to the chain (etx / ecall / chainAct /
// eth().request). Name-matching alone wrongly swept in helpers like addToBag/syncMaxHp/useSkill.
const fnHits = [...html.matchAll(/^(?:async )?function (\w+)\(/gm)];
const chainFns = fnHits.filter((m, i) => {
  const body = html.slice(m.index + m[0].length, i + 1 < fnHits.length ? fnHits[i + 1].index : html.length);
  return /\b(etx|ecall|chainAct)\(|eth\(\)\.request/.test(body);
}).map(m => m[1]);
const menuFns = [...html.matchAll(/^function (\w*[Mm]enu)\(/gm)].map(m => m[1]);

// Solidity surface
const solDir = join(root, 'contracts/src');
const sol = {};
if (existsSync(solDir)) {
  const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(join(d, e.name)) : (e.name.endsWith('.sol') ? [join(d, e.name)] : []));
  for (const f of walk(solDir)) {
    const src = readFileSync(f, 'utf8'), name = (src.match(/\n(?:abstract )?(?:contract|interface) (\w+)/) || [])[1];
    if (!name) continue;
    sol[name] = {
      file: f.replace(root + '\\', '').replace(root + '/', '').replace(/\\/g, '/'),
      fns: [...src.matchAll(/function (\w+)\(([^)]*)\)\s+(external|public)/g)].map(m => `${m[1]}(${m[2].replace(/\s+/g, ' ').trim()})`),
    };
  }
}

const simScenarios = [...sim.matchAll(/scenario\(\s*'([^']+)'/g)].map(m => m[1]);
// WebSocket is allowed only inside the opt-in MULTIPLAYER section (D-040), like wallet calls only in CHAIN (D-016)
const htmlNoNet = html.replace(/\/\/ =+ MULTIPLAYER[\s\S]*?(?=\/\/ =+ )/, '');
const forbidden = ['fetch(', 'alert(', 'confirm(', 'prompt(', 'XMLHttpRequest', 'WebSocket', 'import('].filter(a => {
  if (a === 'prompt(' ) return html.includes('window.prompt(');       // SESSION/MASTER prompt words are fine
  if (a === 'confirm(') return html.includes('window.confirm(');
  if (a === 'WebSocket') return htmlNoNet.includes(a);
  return html.includes(a);
});
const relayPresent = existsSync(join(root, 'server/relay.mjs'));

// ---------- manifest ----------
const live = contracts['0x5fdaf3'] || {};
const md = () => {
  const L = [];
  L.push('<!-- GENERATED by scripts/trynoah-manifest.mjs — do not hand-edit. Re-run after any source change. -->');
  L.push('# DOGEON — Authoritative Recreation Manifest\n');
  L.push(`Derived from source on ${new Date().toISOString().slice(0, 10)}. \`index.html\` = **${html.split('\n').length} lines**, ${sections.length} sections, ${simScenarios.length} sim scenarios.\n`);
  L.push(`**Forbidden-API check:** ${forbidden.length ? '❌ ' + forbidden.join(', ') : '✅ none present (no fetch/alert/confirm/prompt/XHR/import; WebSocket only inside the opt-in MULTIPLAYER section)'}\n`);
  if (relayPresent) L.push('**Multiplayer option (D-040):** OFF by default. `?mp=ws(s)://host[:port]&room=NAME&name=NAME` turns on ghost multiplayer over the browser\'s native WebSocket (no library). Self-host with zero deps: `node server/relay.mjs` (serves the game page + relay; `PORT`, `MAX_ROOM` env). Shared enemies/loot are out of scope (would need an authoritative server, e.g. Colyseus).\n');

  L.push('## 1. Code sections of `index.html` (implement all, in order)');
  L.push(sections.map((s, i) => `${i + 1}. \`${s}\``).join(' · ') + '\n');

  L.push('## 2. Live contract registry (`CONTRACTS`)');
  L.push('| chain | key | address |');
  L.push('|---|---|---|');
  for (const [c, m] of Object.entries(contracts)) for (const [k, v] of Object.entries(m)) L.push(`| \`${c}\` | \`${k}\` | \`${v || '(unset)'}\` |`);
  if (Object.keys(redstone).length) { L.push('\n**RedStone oracle:**'); for (const [k, v] of Object.entries(redstone)) L.push(`- \`${k}\`: \`${v}\``); }
  L.push('');

  L.push(`## 3. ABI selectors (${Object.keys(sel).length} × 4-byte, precomputed — no ethers/viem)`);
  L.push('```js');
  L.push('const SEL={' + Object.entries(sel).map(([k, v]) => `${k}:'${v}'`).join(',') + '};');
  L.push('```\n');

  L.push('## 4. Solidity surface (contracts/src)');
  for (const [n, d] of Object.entries(sol)) {
    L.push(`### \`${n}\` — \`${d.file}\``);
    L.push(d.fns.length ? d.fns.map(f => `- \`${f}\``).join('\n') : '- (no external/public functions)');
  }
  L.push('');

  L.push('## 5. Professions (exact stats — `CLASSES`)');
  L.push('| key | id | name | sprite | trainer | speed | dmg | armor | ±maxHP | K/Q skill |');
  L.push('|---|---|---|---|---|---|---|---|---|---|');
  for (const c of classes) L.push(`| \`${c.key}\` | ${c.id} | ${c.name} | \`${c.spr}\` | ${c.trainer} | ${c.spd}x | ${c.dmg}x | +${c.armor} | ${c.hp >= 0 ? '+' : ''}${c.hp} | ${c.skill} |`);
  L.push('');

  L.push('## 6. Items, mintables, recipes');
  L.push(`- **Item types:** ${Object.entries(itemTypes).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
  L.push(`- **Mintable at DOGEON Pool DEX Row 0 (${mintable.length}):** ${mintable.map(m => `${itemTypes[m.type] || m.type} LV${m.level}`).join(' · ')}`);
  L.push(`- **Forge recipes (${recipes.length}):** ${recipes.join(' · ')}`);
  L.push('');

  L.push('## 7. World, NPCs, enemies, balance constants');
  L.push(`- **NPCs (${npcs.length}):** ${npcs.join(' · ')}`);
  L.push(`- **Enemy types (${etypes.length}):** ${etypes.join(' · ')}`);
  L.push(`- **Constants:** ${Object.entries(consts).map(([k, v]) => `\`${k}=${v}\``).join(' · ')}`);
  L.push('');

  L.push('## 8. Required functions');
  L.push(`- **On-chain actions (${chainFns.length}):** ${[...new Set(chainFns)].map(f => `\`${f}()\``).join(' · ')}`);
  L.push(`- **Menus (${menuFns.length}):** ${[...new Set(menuFns)].map(f => `\`${f}()\``).join(' · ')}`);
  L.push(`- **Outbound links (${Object.keys(links).length}):** ${Object.keys(links).join(' · ')}`);
  L.push('');

  L.push(`## 9. Verification parity (${simScenarios.length} headless sim scenarios must pass)`);
  L.push(simScenarios.map(s => `- ${s}`).join('\n'));
  return L.join('\n') + '\n';
};

// ---------- drift guard ----------
if (args.includes('--verify')) {
  // Only files that are SUPPOSED to carry the registry verbatim. prompts/TRYNOAH_RECREATE.md is deliberately
  // excluded: it delegates to §A + the manifest instead of restating addresses (restating them is what causes drift).
  // Checking the generated manifest catches "an address changed but nobody re-ran --out".
  const targets = ['MASTER_PROMPT.md', 'docs/RECREATION_MANIFEST.md'].filter(f => existsSync(join(root, f)));
  let bad = 0;
  console.log('=== TRYNOAH BLUEPRINT DRIFT GUARD ===');
  if (forbidden.length) { console.log(`  FAIL forbidden API in index.html: ${forbidden.join(', ')}`); bad++; }
  for (const f of targets) {
    const txt = rd(f);
    const missAddr = Object.entries(live).filter(([, v]) => v && !txt.includes(v)).map(([k]) => k);
    const missSel = Object.entries(sel).filter(([, v]) => !txt.includes(v)).map(([k]) => k);
    const missCls = classes.filter(c => !txt.includes(c.name)).map(c => c.name);
    if (missAddr.length || missSel.length || missCls.length) {
      bad++;
      console.log(`  FAIL ${f}`);
      if (missAddr.length) console.log(`    missing/stale live addresses: ${missAddr.join(', ')}`);
      if (missSel.length) console.log(`    missing selectors: ${missSel.join(', ')}`);
      if (missCls.length) console.log(`    missing classes: ${missCls.join(', ')}`);
    } else {
      console.log(`  OK   ${f} — ${Object.keys(live).length} live addresses, ${Object.keys(sel).length} selectors, ${classes.length} classes all present`);
    }
  }
  if (!targets.length) { console.log('  FAIL no blueprint file found'); bad++; }
  console.log(bad ? `\n${bad} blueprint drift problem(s) — update the prompt(s) from source.` : '\nNo drift: the recreation prompts match the source exactly.');
  process.exit(bad ? 1 : 0);
}

const out = opt('--out');
if (out) { writeFileSync(join(root, out), md()); console.log(`manifest written to ${out}`); }
else process.stdout.write(md());
