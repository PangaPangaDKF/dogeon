// Tiny zero-dependency static server so browser wallets (MetaMask) can inject into the page.
// Wallet extensions do not inject into file:// pages by default.
//   node tests/serve.mjs          -> http://localhost:8080
//   node tests/serve.mjs 9000     -> http://localhost:9000
// Binds to 127.0.0.1 only (not reachable from other machines).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.argv[2]) || 8080;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.md': 'text/plain; charset=utf-8' };

createServer(async (req, res) => {
  let url; try { url = decodeURIComponent((req.url || '/').split('?')[0]); } catch { res.writeHead(400).end('bad request'); return; } // D-112 S3-1r
  const rel = normalize(url === '/' ? '/index.html' : url).replace(/^([/\\])+/, '');
  const file = join(root, rel);
  if (!file.startsWith(root) || rel.startsWith('.') ) { res.writeHead(403).end('forbidden'); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' }).end(body);
  } catch { res.writeHead(404).end('not found'); }
}).listen(port, '127.0.0.1', () => console.log(`DOGEON on http://localhost:${port}  (Ctrl+C to stop)`));
