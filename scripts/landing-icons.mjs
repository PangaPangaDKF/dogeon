// Landing icons rendered BY THE GAME'S OWN CODE (D-085, landing skill §5.4 "icons come from the game", backlog B1).
//   node scripts/landing-icons.mjs            -> writes assets/icons/<name>.png (transparent, native pixel size)
// Loads src/game.js in a sandbox with a tiny pixel-canvas stub (same idea as tests/sprites.mjs), then dumps the
// sprite/icon/tile canvases the game itself built. Nothing is drawn by hand, so the landing can never drift from
// the real art. Scale them in CSS by an integer with image-rendering: pixelated. Zero dependencies.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import zlib from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'assets', 'icons');
const code = readFileSync(join(root, 'src', 'game.js'), 'utf8');

const parse = c => { // '#rgb' | '#rrggbb' | 'rgba(r,g,b,a)' -> [r,g,b,a]
  if (!c) return null;
  if (c[0] === '#') { const h = c.length === 4 ? c.slice(1).split('').map(x => x + x).join('') : c.slice(1, 7); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 255]; }
  const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
  const [r, g, b, a = 1] = m[1].split(',').map(Number); return [r, g, b, Math.round(a * 255)];
};
const over = (dst, src) => { // source-over blend for the few translucent shadow pixels
  if (!dst || src[3] === 255) return src; const a = src[3] / 255, da = dst[3] / 255, oa = a + da * (1 - a);
  return [0, 1, 2].map(i => Math.round((src[i] * a + dst[i] * da * (1 - a)) / oa)).concat(Math.round(oa * 255));
};
function canvas() {
  const cv = { width: 0, height: 0, style: {}, px: null, addEventListener() {}, focus() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 672 }) };
  const ctx = { fillStyle: '#000', imageSmoothingEnabled: false,
    fillRect(x, y, w, h) { const col = parse(this.fillStyle); if (!col || !cv.px) return;
      for (let j = Math.max(0, y | 0); j < Math.min(cv.height, (y + h) | 0); j++) for (let i = Math.max(0, x | 0); i < Math.min(cv.width, (x + w) | 0); i++) cv.px[j * cv.width + i] = over(cv.px[j * cv.width + i], col); },
    drawImage(src, dx = 0, dy = 0) { if (!src || !src.px) return;
      for (let j = 0; j < src.height; j++) for (let i = 0; i < src.width; i++) { const c = src.px[j * src.width + i]; const X = i + (dx | 0), Y = j + (dy | 0);
        if (c && cv.px && X >= 0 && Y >= 0 && X < cv.width && Y < cv.height) cv.px[Y * cv.width + X] = over(cv.px[Y * cv.width + X], c); } } };
  cv.getContext = () => new Proxy(ctx, { get: (t, k) => k in t ? t[k] : () => ({ data: [] }), set: (t, k, v) => (t[k] = v, true) });
  return new Proxy(cv, { set(t, k, v) { t[k] = v; if ((k === 'width' || k === 'height') && t.width && t.height) t.px = new Array(t.width * t.height).fill(null); return true; } });
}
const sb = { console: { log() {}, warn() {}, error: console.error }, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0,
  location: { search: '', hostname: 'localhost', protocol: 'http:', host: 'localhost' }, performance: { now: () => 0 }, innerWidth: 960, innerHeight: 672,
  navigator: { userAgent: 'node' }, window: {}, localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  document: { getElementById: canvas, createElement: canvas, addEventListener() {}, body: { appendChild() {} } },
  addEventListener() {}, removeEventListener() {}, requestAnimationFrame: () => 0, Math, Date, JSON };
sb.globalThis = sb; sb.window = sb; vm.createContext(sb);
vm.runInContext(code + '\n;globalThis.__X={SPR,COIN,WHISK,YARN,ORB_IC,SCRAP_IC,HORN_IC,STEEL_IC,FISH_IC,CFISH_IC,BONE,TL,MOSAIC};', sb);
const X = sb.__X;

// name -> canvas. Characters use right[0]: the game draws every character frozen facing right (D-044, mission R3).
const ch = k => X.SPR[k].right[0];
const ICONS = {
  warrior: ch('tWarrior'), archer: ch('tArcher'), healer: ch('tHealer'), hero: ch('hero'),
  elder: ch('sage'), sphinx: ch('bank'), mechanic: ch('merchant'), cat: ch('alley'), boss: ch('boss'), brute: ch('brute'),
  coin: X.COIN, whisker: X.WHISK, yarn: X.YARN, orb: X.ORB_IC, scrap: X.SCRAP_IC, horn: X.HORN_IC, steel: X.STEEL_IC,
  fish: X.FISH_IC, cookedfish: X.CFISH_IC, bone: X.BONE[0], tree: X.TL.tree[0], rock: X.TL.rock[0], gate: X.TL.gate[0],
  dogecoin: X.MOSAIC, // the camp coin (MOSAIC_PX, R1): exported as-is, never redrawn
};

const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
const crc = b => { let x = 0xffffffff; for (const v of b) x = crcT[(x ^ v) & 255] ^ (x >>> 8); return (x ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
const png = cv => { // RGBA, 8-bit, transparent where the game drew nothing
  const W = cv.width, H = cv.height, raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = cv.px[y * W + x] || [0, 0, 0, 0], o = y * (W * 4 + 1) + 1 + x * 4; raw[o] = c[0]; raw[o + 1] = c[1]; raw[o + 2] = c[2]; raw[o + 3] = c[3]; }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
};

mkdirSync(outDir, { recursive: true });
let bytes = 0;
for (const [name, cv] of Object.entries(ICONS)) {
  if (!cv || !cv.px || !cv.px.some(Boolean)) throw new Error(`icon ${name} rendered empty`);
  const b = png(cv); bytes += b.length; writeFileSync(join(outDir, `${name}.png`), b);
}
console.log(`wrote ${Object.keys(ICONS).length} icons to assets/icons/ (${bytes} bytes total): ${Object.entries(ICONS).map(([n, c]) => `${n} ${c.width}x${c.height}`).join(', ')}`);
