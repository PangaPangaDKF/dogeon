// Renders game sprites to a PNG preview (no deps): node tests/sprites.mjs index.html docs/art/sprites-preview.png
import { readFileSync, writeFileSync } from 'node:fs'; import vm from 'node:vm'; import zlib from 'node:zlib';
const [, , htmlPath, outPath] = process.argv;
const code = readFileSync(htmlPath, 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const parse = c => { if (!c || c[0] !== '#') return null; const h = c.length === 4 ? c.slice(1).split('').map(x => x + x).join('') : c.slice(1, 7); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
function canvas() {
  const cv = { width: 0, height: 0, style: {}, px: null, addEventListener() {}, focus() {} };
  const ctx = { fillStyle: '#000', imageSmoothingEnabled: false,
    fillRect(x, y, w, h) { const col = parse(this.fillStyle); if (!col || !cv.px) return; for (let j = Math.max(0, y | 0); j < Math.min(cv.height, (y + h) | 0); j++) for (let i = Math.max(0, x | 0); i < Math.min(cv.width, (x + w) | 0); i++) cv.px[j * cv.width + i] = col; },
    drawImage(src, dx = 0, dy = 0) { if (!src.px) return; for (let j = 0; j < src.height; j++) for (let i = 0; i < src.width; i++) { const c = src.px[j * src.width + i]; if (c && cv.px) { const X = i + dx, Y = j + dy; if (X >= 0 && Y >= 0 && X < cv.width && Y < cv.height) cv.px[Y * cv.width + X] = c; } } },
    save() {}, restore() {}, scale() {}, translate() {}, clearRect() {}, getImageData() { return { data: [] }; }, putImageData() {}, createImageData() { return { data: [] }; } };
  cv.getContext = () => new Proxy(ctx, { get: (t, k) => k in t ? t[k] : () => {}, set: (t, k, v) => (t[k] = v, true) });
  return new Proxy(cv, { set(t, k, v) { t[k] = v; if ((k === 'width' || k === 'height') && t.width && t.height) t.px = new Array(t.width * t.height).fill(null); return true; } });
}
const sb = { console, setTimeout: () => 0, location: { search: '' }, performance: { now: () => 0 }, innerWidth: 960, innerHeight: 672, window: {}, document: { getElementById: canvas, createElement: canvas }, addEventListener() {}, requestAnimationFrame: () => 0 };
sb.globalThis = sb; vm.createContext(sb); vm.runInContext(code + '\nglobalThis.__S=SPR;', sb);
const S = sb.__S, pick = [['hero', 'down'], ['bank', 'down'], ['sage', 'down'], ['clover', 'down'], ['clover', 'right'], ['noah', 'down'], ['bitget', 'down']];
const SC = 8, W = pick.length * 18 * SC, H = 22 * SC, img = Buffer.alloc(W * H * 3, 40);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = (y * W + x) * 3; img[o] = 88; img[o + 1] = 176; img[o + 2] = 64; } // grass green bg
pick.forEach(([k, d], n) => { const c = S[k][d][0]; for (let j = 0; j < 20; j++) for (let i = 0; i < 16; i++) { const col = c.px[j * 16 + i]; if (!col) continue; for (let a = 0; a < SC; a++) for (let b = 0; b < SC; b++) { const X = (n * 18 + 1 + i) * SC + b, Y = (1 + j) * SC + a, o = (Y * W + X) * 3; img[o] = col[0]; img[o + 1] = col[1]; img[o + 2] = col[2]; } } });
const raw = Buffer.alloc((W * 3 + 1) * H); for (let y = 0; y < H; y++) { raw[y * (W * 3 + 1)] = 0; img.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3); }
const crc = b => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } let x = 0xffffffff; for (const v of b) x = t[(x ^ v) & 255] ^ (x >>> 8); return (x ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
writeFileSync(outPath, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log('wrote', outPath, W, 'x', H, 'sprites:', pick.map(p => p.join(':')).join(' '));
