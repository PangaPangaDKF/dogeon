// Landing layout probe (LANDING lane, D-102). Zero deps; drives a local headless Chromium.
//   node scripts/landing-probe.mjs                      -> overflow check at 390 and 360 px (exit 1 if anything overflows)
//   node scripts/landing-probe.mjs --widths 390,360,320
//   node scripts/landing-probe.mjs --file /tmp/copy.html                      -> probe another copy (e.g. a negative test)
//   node scripts/landing-probe.mjs --shot '#heist' [--out /tmp/heist.png] [--width 1280]   -> screenshot one section
// Why an iframe: headless Chrome won't lay out narrower than ~500 px, so a 390 px window renders a cropped 500 px page.
// An <iframe width=390> gives the page a true 390 px viewport. Elements inside .table-wrap may scroll sideways (allowed).
// Chrome: $CHROME, else the newest Playwright Chromium in ~/.cache/ms-playwright. Playwright's build can't decode H.264,
// so videos render black here; check posters, and use a real browser for playback.
import { readFileSync, writeFileSync, mkdtempSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const findChrome = () => {
  if (process.env.CHROME && existsSync(process.env.CHROME)) return process.env.CHROME;
  const base = join(homedir(), '.cache', 'ms-playwright');
  const dirs = existsSync(base) ? readdirSync(base).filter(d => /^chromium-\d+$/.test(d)).sort().reverse() : [];
  for (const d of dirs) for (const sub of ['chrome-linux64', 'chrome-linux']) { const p = join(base, d, sub, 'chrome'); if (existsSync(p)) return p; }
  console.error('No Chromium found. Set CHROME=/path/to/chrome or run: npx playwright install chromium'); process.exit(2);
};
const chrome = findChrome();
const tmp = mkdtempSync(join(tmpdir(), 'landing-probe-'));
const page = readFileSync(arg('--file', join(root, 'landing.html')), 'utf8').replace('<head>', `<head><base href="file://${root}/">`);
const run = (extra, target) => execFileSync(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files',
  '--hide-scrollbars', ...extra, `file://${target}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 60000 });

const shot = arg('--shot');
if (shot) {
  const out = arg('--out', join(tmp, 'shot.png')), w = arg('--width', '1280');
  const sel = JSON.stringify(shot);
  writeFileSync(join(tmp, 'shot.html'), page.replace('</body>', `<script>addEventListener('load',()=>{const el=document.querySelector(${sel});if(!el)return;` +
    `const y=el.getBoundingClientRect().top+scrollY-40;document.body.style.marginTop=(-y)+'px';const h=document.querySelector('header');if(h)h.style.position='static';})</script></body>`));
  run([`--window-size=${w},900`, '--virtual-time-budget=5000', `--screenshot=${out}`], join(tmp, 'shot.html'));
  console.log(`screenshot of ${shot} at ${w}px -> ${out}`);
  process.exit(0);
}

const probe = `<script>addEventListener('load',()=>setTimeout(()=>{const W=innerWidth,o=[];document.querySelectorAll('body *').forEach(e=>{` +
  `const r=e.getBoundingClientRect();if(r.right>W+1&&r.width>0&&!e.closest('.table-wrap'))o.push(e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\\s+/).join('.'):'')+' right='+Math.round(r.right))});` +
  `parent.postMessage(JSON.stringify({W,over:o.length,list:o.slice(0,10)}),'*')},1500))</script>`;
writeFileSync(join(tmp, 'measure.html'), page.replace('</body>', probe + '</body>'));
let bad = 0;
for (const w of arg('--widths', '390,360').split(',').map(Number)) {
  writeFileSync(join(tmp, 'frame.html'), `<pre id="R">timeout</pre><iframe src="measure.html" width="${w}" height="900" style="border:0"></iframe>` +
    `<script>addEventListener('message',e=>R.textContent=e.data)</script>`);
  const dom = run(['--window-size=800,900', '--virtual-time-budget=5000', '--dump-dom'], join(tmp, 'frame.html'));
  const m = dom.match(/<pre id="R">([^<]*)<\/pre>/);
  let r; try { r = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')); } catch { console.log(`  FAIL ${w}px: probe did not report`); bad++; continue; }
  if (r.over) { bad++; console.log(`  FAIL ${w}px: ${r.over} element(s) wider than the screen`); r.list.forEach(x => console.log('       ' + x)); }
  else console.log(`  OK   ${w}px: nothing overflows`);
}
process.exit(bad ? 1 : 0);
