#!/usr/bin/env node
// Bundled diagnostic script for the `analyzer-master` skill (agentskills@1.0).
// Checks: line budget, static rules, SEL/contract parity, orphan identifiers, and test coverage gaps in tests/sim.mjs.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const sim = readFileSync(join(root, 'tests', 'sim.mjs'), 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
const js = scriptMatch ? scriptMatch[1] : '';

console.log('=== DOGEON ANALYZER-MASTER DIAGNOSTIC SCAN ===');

// 1. Line budget & section sizes
const lines = html.split('\n');
console.log(`\n[1] Line Budget: ${lines.length} / 1500 lines (${1500 - lines.length} lines remaining before ES-module split)`);
const sections = [];
lines.forEach((line, idx) => {
  const m = line.match(/^\/\/\s*=+\s*(.+?)\s*=+/);
  if (m) sections.push({ name: m[1], line: idx + 1 });
});
for (let i = 0; i < sections.length; i++) {
  const end = i + 1 < sections.length ? sections[i + 1].line - 1 : lines.length;
  sections[i].span = end - sections[i].line + 1;
}
console.log('    Largest sections:', sections.sort((a, b) => b.span - a.span).slice(0, 5).map(s => `${s.name} (${s.span}L)`).join(', '));

// 2. SEL selector usage check
const selBlock = js.match(/const SEL=\{([^}]+)\}/);
const unusedSel = [];
if (selBlock) {
  for (const entry of selBlock[1].split(',')) {
    const k = entry.split(':')[0].trim();
    const re = new RegExp(`\\bSEL\\.${k}\\b`, 'g');
    const count = (js.match(re) || []).length;
    if (count === 0) unusedSel.push(k);
  }
}
console.log(`[2] Selector Hygiene: ${unusedSel.length === 0 ? 'OK (all SEL.* keys used)' : 'UNUSED SEL keys: ' + unusedSel.join(', ')}`);

// 3. Duplicate top-level declarations
const decls = {};
for (const line of js.split('\n')) {
  const m = line.match(/^(?:async\s+)?function\s+([A-Za-z0-9_]+)|^(?:const|let)\s+([A-Za-z0-9_]+)\s*=/);
  const name = m && (m[1] || m[2]);
  if (name) decls[name] = (decls[name] || 0) + 1;
}
const dupes = Object.entries(decls).filter(([, c]) => c > 1).map(([n]) => n);
console.log(`[3] Top-Level Collisions: ${dupes.length === 0 ? 'OK (0 collisions)' : 'COLLISION: ' + dupes.join(', ')}`);

// 4. Web3 action coverage in tests/sim.mjs
const chainActions = [
  'connectWallet', 'disconnectWallet', 'mintNft', 'useNft',
  'listNft', 'delistNft', 'buyListing', 'addLp', 'removeLp',
  'buyPool', 'sellPool', 'withdrawProceeds',
  'chooseProfession', 'stakeDoge', 'unstakeStake', 'claimStakeRewards', 'syncDexFees'
];
const simScenarios = sim.slice(sim.indexOf('// ---------- scenarios ----------'));
const uncalledInSim = chainActions.filter(fn => !new RegExp(`\\b${fn}\\b`).test(simScenarios));
console.log(`[4] Web3 Action Test Coverage in sim.mjs:`);
if (uncalledInSim.length === 0) {
  console.log('    OK — all Web3 action functions referenced in sim.mjs');
} else {
  console.log(`    GAP DETECTED — Never tested in tests/sim.mjs: ${uncalledInSim.join(', ')}`);
}
