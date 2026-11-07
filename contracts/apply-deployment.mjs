// Copies deployed contract addresses into the game's CONTRACTS config (index.html, CHAIN section).
//   node contracts/apply-deployment.mjs              -> uses deployments/6281971.json (DogeOS Chikyu)
//   node contracts/apply-deployment.mjs 31337        -> local anvil
//   node contracts/apply-deployment.mjs 6281971 --html other.html --dir some/deployments   (used by tests)
// Checks before writing: both addresses look like addresses, the chain is one the game knows,
// and (unless --no-rpc) the RPC really has contract code at both addresses.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const chainId = Number(args.find(a => /^\d+$/.test(a)) || 6281971);
const html = opt('--html', join(here, '..', 'index.html'));
const dir = opt('--dir', join(here, 'deployments'));
const RPC = { 6281971: 'https://rpc.testnet.dogeos.com', 31337: 'http://127.0.0.1:8545' };
const die = m => { console.error('ERROR: ' + m); process.exit(1); };

if (!RPC[chainId]) die(`unknown chain ${chainId} (expected 6281971 or 31337)`);
let dep;
try { dep = JSON.parse(readFileSync(join(dir, `${chainId}.json`), 'utf8')); } catch { die(`no ${join(dir, chainId + '.json')} — run the forge deploy script first`); }
const isAddr = a => typeof a === 'string' && /^0x[0-9a-fA-F]{40}$/.test(a);
if (!isAddr(dep.items) || !isAddr(dep.dex)) die('deployment file has no valid items/dex addresses');
if (Number(dep.chainId) !== chainId) die(`deployment file is for chain ${dep.chainId}, not ${chainId}`);

if (!args.includes('--no-rpc')) {
  for (const [name, a] of [['items', dep.items], ['dex', dep.dex]]) {
    const r = await fetch(RPC[chainId], { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getCode', params: [a, 'latest'] }) }).then(x => x.json()).catch(e => ({ error: { message: String(e) } }));
    if (r.error) die(`RPC check failed for ${name}: ${r.error.message}`);
    if (!r.result || r.result === '0x') die(`no contract code at ${name} ${a} on chain ${chainId}`);
  }
}

const hex = '0x' + chainId.toString(16);
let src = readFileSync(html, 'utf8');
const re = new RegExp(`'${hex}':\\{items:'[^']*',dex:'[^']*'\\}`);
if (!re.test(src)) die(`CONTRACTS entry for ${hex} not found in ${html}`);
src = src.replace(re, `'${hex}':{items:'${dep.items}',dex:'${dep.dex}'}`);
writeFileSync(html, src);
console.log(`CONTRACTS['${hex}'] = { items: ${dep.items}, dex: ${dep.dex} } written to ${html}`);
console.log('Next: bash tests/check.sh, then commit index.html + contracts/deployments/' + chainId + '.json');
