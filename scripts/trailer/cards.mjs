// Renders trailer text cards with DOGEON's own FONT (3x5) and LOGO (5x7) tables, read from src/game.js.
// Usage: node cards.mjs <game.js> <outdir> <ffmpeg>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const [, , gameJs, out, FF] = process.argv;
const src = readFileSync(gameJs, 'utf8');
const grab = name => { const i = src.indexOf(`const ${name}={`); let d = 0, j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}' && !--d) return eval('(' + src.slice(j, k + 1) + ')'); } };
const FONT = grab('FONT'), LOGO = grab('LOGO');
mkdirSync(out, { recursive: true });

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function canvas(W, H, bg) { const b = Buffer.alloc(W * H * 4); if (bg) { const [r, g, bl] = hex(bg); for (let i = 0; i < W * H; i++) b.set([r, g, bl, 255], i * 4); } return { W, H, b }; }
function rect(c, x, y, w, h, col, a = 255) { const [r, g, b] = hex(col);
  for (let yy = Math.max(0, y); yy < Math.min(c.H, y + h); yy++) for (let xx = Math.max(0, x); xx < Math.min(c.W, x + w); xx++) c.b.set([r, g, b, a], (yy * c.W + xx) * 4); }
const tw = (s, sc) => s.length * 4 * sc - sc;
function textRaw(c, s, x, y, col, sc) { let cx = x; for (const ch of s) { const gl = FONT[ch]; if (gl) for (let r = 0; r < 5; r++) for (let k = 0; k < 3; k++) if (gl[r] & (4 >> k)) rect(c, cx + k * sc, y + r * sc, sc, sc, col); cx += 4 * sc; } }
function textC(c, s, cx, y, col, sc, shadow = '#000000') { s = s.toUpperCase(); const x = Math.round(cx - tw(s, sc) / 2); if (shadow) textRaw(c, s, x + sc, y + sc, shadow, sc); textRaw(c, s, x, y, col, sc); }
function logoC(c, cx, y, s, col, hi) { let x = Math.round(cx - (6 * 6 * s - s) / 2);
  for (const ch of 'DOGEON') { const g = LOGO[ch]; for (let r = 0; r < 7; r++) for (let k = 0; k < 5; k++) if (g[r][k] === '1') { rect(c, x + k * s + s, y + r * s + s, s, s, '#000000'); rect(c, x + k * s, y + r * s, s, s, r < 2 ? hi : col); } x += 6 * s; } }
function save(c, name) { const raw = `${out}/${name}.rgba`; writeFileSync(raw, c.b);
  execFileSync(FF, ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${c.W}x${c.H}`, '-i', raw, `${out}/${name}.png`]); }

const GOLD = '#ffd500', CYAN = '#0bdafe', WHITE = '#ffffff', BG = '#020307', MUTED = '#94a3b8';
// Full-screen title cards (16:9 and 9:16). Lines: [text, color, scale]
function card(name, lines, W, H) { const c = canvas(W, H, BG); const gap = s => s * 3;
  const total = lines.reduce((a, [, , s]) => a + 5 * s + gap(s), 0) - gap(lines.at(-1)[2]); let y = Math.round((H - total) / 2);
  for (const [t, col, s] of lines) { textC(c, t, W / 2, y, col, s); y += 5 * s + gap(s); } save(c, name); }
// Transparent lower-third tag on a dark band (overlays on gameplay)
function tag(name, t, col, W, H, y, s) { const c = canvas(W, H); const w = tw(t, s) + 8 * s, x = Math.round((W - w) / 2);
  rect(c, x, y - 3 * s, w, 11 * s, BG, 215); rect(c, x, y - 3 * s, w, s, col); textC(c, t, W / 2, y, col, s); save(c, name); }

for (const [W, H, k] of [[1920, 1080, 'h'], [1080, 1920, 'v']]) {
  const big = k === 'h' ? 16 : 12, mid = k === 'h' ? 10 : 8;
  card(`${k}_hook`, [['SUCH HEIST.', GOLD, big], ['MUCH DOGE.', WHITE, big]], W, H);
  card(`${k}_classes`, [['3 CLASSES.', GOLD, big], ['1 PER WALLET.', WHITE, big]], W, H);
  card(`${k}_craft`, [['CRAFT IT.', WHITE, big], ['MINT IT.', GOLD, big], ['REAL NFT ON DOGEOS', CYAN, mid]], W, H);
  card(`${k}_boss`, [['SLAY THE', WHITE, big], ['CAT LORD.', GOLD, big]], W, H);
  for (const [n, col] of [['warrior', '#ff8060'], ['archer', '#80e080'], ['healer', '#80d0ff']]) tag(`${k}_t_${n}`, n, col, W, H, k === 'h' ? 960 : 1420, k === 'h' ? 8 : 9);
  tag(`${k}_t_tx`, 'VERIFIED ON-CHAIN', CYAN, W, H, k === 'h' ? 960 : 1420, k === 'h' ? 7 : 6);
  tag(`${k}_t_bag`, 'NFTS SAFE ON DEATH', GOLD, W, H, k === 'h' ? 960 : 1420, k === 'h' ? 7 : 6);
  // End card: game logo + URL + truthful facts + T8 testnet disclaimer
  { const c = canvas(W, H, BG); const s = k === 'h' ? 20 : 15, ly = k === 'h' ? 300 : 640;
    logoC(c, W / 2, ly, s, GOLD, '#fff2a0');
    let y = ly + 7 * s + (k === 'h' ? 90 : 110);
    textC(c, 'PLAY.DOGEON.LAT', W / 2, y, CYAN, k === 'h' ? 10 : 9); y += k === 'h' ? 100 : 110;
    textC(c, 'PLAY FREE - 1 TO 8 PLAYERS', W / 2, y, WHITE, k === 'h' ? 6 : 5); y += k === 'h' ? 60 : 70;
    textC(c, 'BUILT ON DOGEOS', W / 2, y, GOLD, k === 'h' ? 6 : 5);
    textC(c, 'TESTNET TOKENS. NO REAL-WORLD VALUE. NOT FINANCIAL ADVICE.', W / 2, H - (k === 'h' ? 70 : 120), MUTED, k === 'h' ? 3 : 3, null);
    save(c, `${k}_end`); }
}
console.log('cards ok');
{ const c = canvas(1080, 1920); logoC(c, 540, 110, 10, GOLD, '#fff2a0'); textC(c, 'PLAY.DOGEON.LAT', 540, 1790, CYAN, 6); save(c, 'v_brand'); }
