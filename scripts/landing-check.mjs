// Landing truth check (D-085, dogeon-landing-design skill §6/§7). Zero deps.
//   node scripts/landing-check.mjs          -> exit 1 on any FAIL
// Ties landing.html to the game's own source so the marketing page cannot drift from the real chain config:
//   T5/T7 chain params (RPC, explorer, faucet, chainId) and contract addresses must equal CHAIN / CONTRACTS / REDSTONE
//   in src/game.js · T3 every referenced asset exists · B1 no emoji icons · B2 no "NN //" eyebrows · B3 nav <= 7 links
//   T6 play CTAs use /play (or https://play.dogeon.lat once live) · no unknown external hosts.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const page = readFileSync(join(root, 'landing.html'), 'utf8');
const game = readFileSync(join(root, 'src', 'game.js'), 'utf8');
let fails = 0;
const ok = m => console.log(`  OK   ${m}`);
const bad = (m, extra = []) => { fails++; console.log(`  FAIL ${m}`); for (const e of extra.slice(0, 8)) console.log(`       ${e}`); };
const lineOf = i => page.slice(0, i).split('\n').length;

// --- source of truth from the game ---
const chain = Object.fromEntries([...(game.match(/const CHAIN=\{([^}]*)\}/) || [, ''])[1].matchAll(/(\w+):'([^']*)'/g)].map(m => [m[1], m[2]]));
const live = Object.fromEntries([...((game.match(/'0x5fdaf3':\{([^}]*)\}/) || [, ''])[1]).matchAll(/(\w+):'(0x[0-9a-fA-F]{40})'/g)].map(m => [m[1], m[2]]));
const feed = (game.match(/feed:'(0x[0-9a-fA-F]{40})'/) || [])[1];
const host = u => { try { return new URL(u.startsWith('http') ? u : 'https://' + u.toLowerCase()).host; } catch { return ''; } };
const RPC = chain.rpc, EXPL = chain.explorer, FAUCET = 'https://' + host(chain.faucet || '');
console.log('=== LANDING TRUTH CHECK ===');
console.log(`  source: chain ${chain.id} · rpc ${RPC} · explorer ${EXPL} · faucet ${FAUCET}`);

// T7: chain params
const rpcUrls = [...page.matchAll(/rpcUrls:\s*\[\s*'([^']+)'/g)];
if (!rpcUrls.length) bad('add-network JS has no rpcUrls');
else if (rpcUrls.every(m => m[1] === RPC)) ok(`add-network rpcUrls = ${RPC}`);
else bad(`add-network rpcUrls must be ${RPC} (src/game.js CHAIN.rpc)`, rpcUrls.map(m => `line ${lineOf(m.index)}: ${m[1]}`));
const chainIds = [...page.matchAll(/chainId:\s*'(0x[0-9a-f]+)'/g)];
if (chainIds.length && chainIds.every(m => m[1] === chain.id)) ok(`chainId = ${chain.id}`); else bad(`chainId must be ${chain.id}`, chainIds.map(m => `line ${lineOf(m.index)}: ${m[1]}`));

// allowed external hosts: the game's own chain hosts + known first-party/brand links + fonts
const allowed = new Set([host(RPC), host(EXPL), host(FAUCET), 'dogeos.com', 'www.dogeos.com', 'heist.dogeos.com', 'docs.dogeos.com',
  'fonts.googleapis.com', 'fonts.gstatic.com', 'dogeon.lat', 'play.dogeon.lat', 'github.com', 'redstone.finance', 'www.redstone.finance',
  'metamask.io', 'trynoah.ai', 'relotto.app', 'web3.bitget.com', 'www.bitget.com', 'x.com', 'twitter.com']);
const urls = [...page.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].filter(m => !/^(www\.)?w3\.org$/i.test(m[1]));
const unknown = urls.filter(m => !allowed.has(m[1].toLowerCase()));
if (!unknown.length) ok(`all ${urls.length} external URLs use known hosts`);
else bad('unknown external hosts (wrong chain URLs or unvetted links) — use CHAIN.rpc / explorer / faucet from src/game.js',
  [...new Map(unknown.map(m => [m[1], m])).values()].map(m => `line ${lineOf(m.index)}: ${m[1]}`));

// T5: contract addresses
const addrs = new Set([...page.matchAll(/(?<![0-9a-fA-F])0x[0-9a-fA-F]{40}(?![0-9a-fA-F])/g)]  /* 40-hex addresses only, not 64-hex tx hashes (D-098) */.map(m => m[0].toLowerCase()));
const want = Object.entries(live).filter(([, v]) => v); // RedStone feed optional: the landing shows no price data (D-089)
const miss = want.filter(([, v]) => !addrs.has(v.toLowerCase())).map(([k]) => k);
miss.length ? bad(`contract addresses missing/stale: ${miss.join(', ')}`) : ok(`all ${want.length} live contract addresses present (CONTRACTS['0x5fdaf3'])`);
const known = new Set(want.map(([, v]) => v.toLowerCase()).concat(feed ? [feed.toLowerCase()] : []).concat((game.match(/0x[0-9a-fA-F]{40}/g) || []).map(a => a.toLowerCase())));
const stray = [...addrs].filter(a => !known.has(a));
stray.length ? bad('addresses on the page that the game does not use', stray) : ok('no stray addresses');

// T3: assets exist
const assets = [...new Set([...page.matchAll(/(?:src|href)="(assets\/[^"]+)"/g)].map(m => m[1]))];
const gone = assets.filter(a => !existsSync(join(root, a)));
gone.length ? bad('missing asset files', gone) : ok(`${assets.length} referenced assets exist`);

// R1/R2: the coin comes only from assets/icons/dogecoin.png (exported from src/game.js MOSAIC); no inline copy, no FX around it (D-094)
const coinCopy = /MOSAIC_PX|MOSAIC_PAL/.test(page), fx = [...page.matchAll(/\.arc\(|\.ellipse\(|createRadialGradient|shadowBlur/g)];
coinCopy ? bad('inline copy of the coin pixel data; use assets/icons/dogecoin.png (node scripts/landing-icons.mjs)') : ok('coin art comes from the game export');
fx.length ? bad('canvas FX (arc/ellipse/radial gradient/shadowBlur) on the landing; R2', fx.map(m => `line ${lineOf(m.index)}: ${m[0]}`)) : ok('no canvas FX');
// B1/B2/B3/T6 design rules
const emoji = [...page.matchAll(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{23E9}-\u{23FA}]️?/gu)];
emoji.length ? bad(`${emoji.length} emoji (use pixel icons from assets/icons/, made by scripts/landing-icons.mjs)`, emoji.map(m => `line ${lineOf(m.index)}: ${m[0]}`)) : ok('no emoji icons');
const eyebrows = [...page.matchAll(/section-tag[^>]*>\s*\d\d\s*\/\//g)];
eyebrows.length ? bad(`${eyebrows.length} numbered "NN //" eyebrows (numbers only for real sequences)`) : ok('no decorative numbered eyebrows');
const nav = (page.match(/<ul class="nav-links">([\s\S]*?)<\/ul>/) || [, ''])[1].match(/<li>/g) || [];
nav.length <= 7 ? ok(`nav has ${nav.length} links`) : bad(`nav has ${nav.length} links (max 7; it wraps at 1280px)`);
const ctas = [...page.matchAll(/href="([^"]*)"[^>]*>\s*(?:PLAY|Play)[^<]*</g)].map(m => m[1]);
const badCta = ctas.filter(h => !(h === '/play' || h.startsWith('/play?') || h.startsWith('https://play.dogeon.lat')));
ctas.length && !badCta.length ? ok(`${ctas.length} play CTAs -> /play or https://play.dogeon.lat`) : bad('play CTAs must go to /play (or https://play.dogeon.lat once its cert is Issued)', badCta);

console.log(fails ? `\n${fails} landing problem(s).` : '\nLanding matches the game.');
process.exit(fails ? 1 : 0);
