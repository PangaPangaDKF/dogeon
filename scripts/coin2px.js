// DOGEON art converter (D-043): turns a round coin artwork into 96x96 in-code pixel art for MOSAIC in index.html.
// Run in REAL Chrome on the image page, e.g. with agent-browser:
//   node -e "require('http').createServer((q,s)=>{s.end(require('fs').readFileSync('docs/art/dogecoin-coin-source.jpg'))}).listen(8793)" &
//   agent-browser open http://localhost:8793/  &&  agent-browser eval --stdin < scripts/coin2px.js > coin.json
// Output JSON: { centre, radius, pal:[32 hex], rows:"9216 chars, one per pixel, '.' = transparent", png:preview }.
// How it measures the ring: a RADIAL PROFILE (fraction of 360 angles that are bright gold at each radius) — robust to the
// dark inner rim and to the gold crystals around the coin (see docs/LESSONS.md L-027). Then stepwise downscale (area
// averaging), median-cut to 32 colours, 4 k-means refinement passes, luminance-weighted nearest colour.
(() => {
  const SIZE = 96, N = window.__N || 32, CH = '0123456789abcdefghijklmnopqrstuv';
  const im = document.images[0], W = im.naturalWidth, H = im.naturalHeight;
  const src = document.createElement('canvas'); src.width = W; src.height = H;
  const sg = src.getContext('2d'); sg.drawImage(im, 0, 0); const sd = sg.getImageData(0, 0, W, H).data;
  const at = (x, y) => { const i = (Math.round(y) * W + Math.round(x)) * 4; return [sd[i], sd[i + 1], sd[i + 2]]; };
  const gold = ([r, g, b]) => r >= 215 && g >= 165 && b <= 120;
  // --- measure the ring. INPUT CONTRACT: the coin is cropped and CENTRED in the image (like
  // docs/art/dogecoin-coin-source.jpg). Centre = image centre; the ring = the outermost radius where most of the 360
  // angles are bright gold (radial profile). Overrides: set window.__CX / __CY / __R before running.
  // (An earlier ray-fit was framing-dependent and silently failed on the crop — docs/LESSONS.md L-027.)
  const cx = window.__CX || W / 2, cy = window.__CY || H / 2;
  let R = window.__R || 0;
  if (!R) { for (let r = Math.round(Math.min(W, H) * 0.3); r < Math.min(W, H) / 2; r++) { let n = 0;
      for (let k = 0; k < 360; k++) { const t = k * Math.PI / 180; if (gold(at(cx + Math.cos(t) * r, cy + Math.sin(t) * r))) n++; }
      if (n / 360 > 0.5) R = r; }
    R = Math.min(R + 6, Math.min(W, H) / 2); } // + the thin dark outline just outside the gold band
  // --- stepwise downscale (clean area averaging) ---
  let cur = document.createElement('canvas'); cur.width = cur.height = Math.round(R * 2);
  let g = cur.getContext('2d'); g.drawImage(im, cx - R, cy - R, R * 2, R * 2, 0, 0, cur.width, cur.height);
  while (cur.width / 2 >= SIZE * 1.2) { const n = document.createElement('canvas'); n.width = n.height = Math.round(cur.width / 2);
    const ng = n.getContext('2d'); ng.imageSmoothingQuality = 'high'; ng.drawImage(cur, 0, 0, n.width, n.height); cur = n; }
  const fin = document.createElement('canvas'); fin.width = fin.height = SIZE; const fg = fin.getContext('2d');
  fg.imageSmoothingQuality = 'high'; fg.drawImage(cur, 0, 0, SIZE, SIZE);
  const fd = fg.getImageData(0, 0, SIZE, SIZE).data, inside = [], px = [];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const ok = Math.hypot(x - (SIZE - 1) / 2, y - (SIZE - 1) / 2) <= SIZE / 2 - 0.5; inside.push(ok);
    if (ok) { const i = (y * SIZE + x) * 4; px.push([fd[i], fd[i + 1], fd[i + 2]]); } }
  // --- median cut to N boxes, then k-means refinement (deterministic) ---
  let boxes = [px.slice()];
  while (boxes.length < N) {
    let bi = -1, best = -1, ch = 0;
    boxes.forEach((b, i) => { if (b.length < 2) return; for (let c = 0; c < 3; c++) { let lo = 255, hi = 0; for (const p of b) { lo = Math.min(lo, p[c]); hi = Math.max(hi, p[c]); }
      const s = (hi - lo) * Math.sqrt(b.length); if (s > best) { best = s; bi = i; ch = c; } } });
    if (bi < 0) break; const b = boxes[bi].sort((p, q) => p[ch] - q[ch]), m = b.length >> 1; boxes.splice(bi, 1, b.slice(0, m), b.slice(m));
  }
  let pal = boxes.map(b => [0, 1, 2].map(c => b.reduce((s, p) => s + p[c], 0) / b.length));
  const near = p => { let bi = 0, bd = 1e9; pal.forEach((q, i) => { const d = (p[0] - q[0]) ** 2 * 0.3 + (p[1] - q[1]) ** 2 * 0.59 + (p[2] - q[2]) ** 2 * 0.11; if (d < bd) { bd = d; bi = i; } }); return bi; };
  for (let it = 0; it < 4; it++) { const acc = pal.map(() => [0, 0, 0, 0]);
    for (const p of px) { const k = near(p); acc[k][0] += p[0]; acc[k][1] += p[1]; acc[k][2] += p[2]; acc[k][3]++; }
    pal = pal.map((q, i) => acc[i][3] ? [acc[i][0] / acc[i][3], acc[i][1] / acc[i][3], acc[i][2] / acc[i][3]] : q); }
  pal = pal.map(q => q.map(v => Math.round(v)));
  // --- encode + preview ---
  let rows = '', k = 0; const pv = document.createElement('canvas'); pv.width = pv.height = SIZE * 4; const pg = pv.getContext('2d');
  pg.fillStyle = '#b8b0a0'; pg.fillRect(0, 0, pv.width, pv.height); // stone-floor backdrop to judge the edge
  const hex = q => '#' + q.map(v => v.toString(16).padStart(2, '0')).join('');
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    if (!inside[y * SIZE + x]) { rows += '.'; continue; }
    const i = near(px[k++]); rows += CH[i]; pg.fillStyle = hex(pal[i]); pg.fillRect(x * 4, y * 4, 4, 4); }
  return JSON.stringify({ source: W + 'x' + H, centre: [Math.round(cx), Math.round(cy)], radius: Math.round(R), size: SIZE,
    colours: pal.length, pal: pal.map(hex), rows, png: pv.toDataURL('image/png') });
})()
