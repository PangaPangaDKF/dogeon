// Trailer helper: spawns ghost "bots" that walk around the camp so you can record a lively
// multiplayer scene without needing friends online. Zero deps (Node 22+ native WebSocket).
//   node scripts/trailer-bots.mjs [ws://localhost:8787] [room]
// Then open the game in the SAME room and record:
//   http://localhost:8787/?mp=ws://localhost:8787&room=trailer&name=YOU
const url = process.argv[2] || 'ws://localhost:8787';
const room = process.argv[3] || 'trailer';
const CX = 40 * 16 + 8, CY = 34 * 16 + 8; // camp centre in pixels
const bots = [ // id must be lowercase alphanumeric <=12 chars (relay join rule: /^[a-z0-9]{1,12}$/)
  { id: 'botshadow', n: 'SHADOW', c: 'warrior', r: 44, ph: 0, spd: 1.3 },
  { id: 'botpixel', n: 'PIXEL', c: 'archer', r: 62, ph: Math.PI, spd: -1.0 },
];
const dirOf = (dx, dy) => Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
for (const b of bots) {
  const ws = new WebSocket(url);
  ws.onopen = () => {
    ws.send(JSON.stringify({ t: 'join', room, id: b.id }));
    console.log(`bot ${b.n} (${b.c}) joined room "${room}"`);
    let t = b.ph, px = CX, py = CY;
    setInterval(() => {
      t += 0.06 * b.spd;
      const x = Math.round(CX + Math.cos(t) * b.r), y = Math.round(CY + Math.sin(t) * b.r * 0.7);
      const d = dirOf(x - px, y - py); px = x; py = y;
      ws.send(JSON.stringify({ t: 'st', id: b.id, x, y, d, m: 1, c: b.c, h: 100, n: b.n, dead: 0 }));
    }, 100); // 10 Hz, matches NET_HZ
  };
  ws.onerror = e => console.error(`bot ${b.n} error:`, e.message || e);
  ws.onclose = () => console.log(`bot ${b.n} disconnected`);
}
console.log(`\ntrailer bots running on ${url} (room "${room}"). Ctrl+C to stop.`);
console.log(`open the game and record:\n  http://localhost:8787/?mp=${url}&room=${room}&name=YOU\n`);
