# DOGEON — Hosting, Multiplayer Scaling & Local Sharing Guide

> **Target Audience:** Developers, Game Hosts, and TryNoah AI  
> **Scope:** How to host DOGEON on Vercel, deploy persistent multiplayer relays, scale room capacity to 100+ players, and share your local WSL environment instantly with anyone in the world.

---

## 1. Hosting Architecture Overview

DOGEON has a decoupled 2-tier architecture:
1. **Frontend Game Client (`index.html`):** Static HTML5 Canvas + Web Audio + EIP-1193 Web3.
2. **Multiplayer Relay Server (`server/relay.mjs`):** Lightweight Node.js WebSocket room hub.

```
                      ┌─────────────────────────────────────┐
                      │        Vercel / GitHub Pages        │
                      │         (index.html static)         │
                      └──────────────────┬──────────────────┘
                                         │ Loads in browser
                                         ▼
┌──────────────────┐               ┌───────────┐               ┌──────────────────┐
│  Player 1 (Web)  │◄─────────────►│ WebSocket │◄─────────────►│  Player 2 (Web)  │
│  localhost:8080  │  wss://relay  │   Relay   │  wss://relay  │   Remote Friend  │
└──────────────────┘               └───────────┘               └──────────────────┘
```

---

## 2. Can Vercel Host DOGEON? (Frontend vs Relay)

### A. Frontend on Vercel: 100% YES (Instant & Zero Config)
Vercel is an ideal host for `index.html`:
- **Zero build step:** No `npm run build` or bundler needed.
- **Global Edge CDN:** Sub-20ms load times worldwide.
- **Automatic HTTPS:** Required for MetaMask and browser wallets to inject.

#### Deploying Frontend to Vercel in 60 Seconds:
1. Push your repository to GitHub (`https://github.com/PangaPangaDKF/dogeon`).
2. Go to [vercel.com](https://vercel.com) -> **Add New Project** -> Select `dogeon`.
3. Set **Framework Preset** to **Other** (Root directory: `./`).
4. Click **Deploy**. Your game is live at `https://dogeon.vercel.app`!

### B. Multiplayer Relay on Vercel: NO (Serverless WebSocket Limitation)
- **Why?** Vercel functions are serverless; they execute on HTTP request and shut down within 10–60 seconds. Persistent WebSockets cannot remain open on serverless functions.
- **Solution:** Host `server/relay.mjs` on a free persistent container platform (Render, Fly.io, Railway, or PartyKit), then configure `index.html` to connect to it.

---

## 3. Persistent Hosts for `server/relay.mjs`

To run the multiplayer relay 24/7 on the web for free or low cost:

### Option 1: Render.com (Recommended Free Tier)
1. Go to [render.com](https://render.com) and create a **Web Service**.
2. Connect `https://github.com/PangaPangaDKF/dogeon`.
3. Set:
   - **Environment:** `Node`
   - **Build Command:** `npm install ws`
   - **Start Command:** `node server/relay.mjs`
   - **Port:** `8787`
4. Render provides an SSL domain like `https://dogeon-relay.onrender.com`.
5. Connect your players using:
   ```
   https://dogeon.vercel.app/?mp=1&relay=wss://dogeon-relay.onrender.com&nick=ALICE
   ```

### Option 2: PartyKit (Serverless Persistent WebSockets)
PartyKit is designed specifically for stateful multiplayer games and runs globally on Cloudflare Workers Durable Objects. The logic in `relay.mjs` maps directly to PartyKit room connections with zero server maintenance.

---

## 4. Instant Local Sharing (No Cloud Deploy Needed!)

If you are developing locally on WSL and want your friends or another account on your phone/laptop to join immediately:

### Method A: Cloudflare Tunnels (`cloudflared`) — Best & Free
You already have `cloudflared` installed locally at `/home/panga/cloudflared`.

1. **Share Game Frontend:**
   ```bash
   /home/panga/cloudflared tunnel --url http://localhost:8080
   ```
   Cloudflare outputs a public URL: `https://xxxx-xxxx.trycloudflare.com`. Anyone can open this link and play!

2. **Share Multiplayer Relay:**
   ```bash
   /home/panga/cloudflared tunnel --url http://localhost:8787
   ```
   Cloudflare outputs a public relay URL: `https://relay-xxxx.trycloudflare.com`.

3. **Combined Link:**
   Send this link to your friend or test account:
   ```text
   https://xxxx-xxxx.trycloudflare.com/?mp=1&relay=wss://relay-xxxx.trycloudflare.com&nick=FRIEND
   ```

### Method B: ngrok
You also have `ngrok` installed at `/home/panga/ngrok`:
```bash
/home/panga/ngrok http 8080
```

---

## 5. Scaling to More Players (100+ Players Architecture)

The current relay supports room broadcasting. To comfortably host dozens or hundreds of simultaneous players on a 2D canvas:

### 1. Room Sharding & Capacity Capping
Canvas rendering degrades when 50+ sprites are drawn on screen simultaneously.
- **Room Size Limit:** Cap rooms to **12 to 16 active players** per room (e.g., `?room=town_1`, `?room=dungeon_2`).
- **Dynamic Lobby Matchmaking:** When a room reaches 16 players, new entrants automatically join the next room partition.

### 2. Spatial Viewport Filtering (Area-of-Interest)
In `server/relay.mjs`, instead of broadcasting every player's movement to all room members, partition the 1200x900 map into 4 quadrants (300x225):
```javascript
function getQuadrant(x, y) {
  return `${Math.floor(x / 400)}_${Math.floor(y / 300)}`;
}
// Only broadcast state packets to players within adjacent quadrants.
```

### 3. Tick-Rate Throttling & Client Interpolation
- Broadcast position updates at **10 Hz to 15 Hz** (every 66–100ms) rather than 60 Hz.
- The client smoothly interpolates (`lerp`) peer positions between packets:
  ```javascript
  peer.x += (peer.targetX - peer.x) * 0.25;
  peer.y += (peer.targetY - peer.y) * 0.25;
  ```
- This cuts server bandwidth and CPU usage by **75%** while keeping motion fluid.

### 4. Party & Squad Channels
Create direct party subgroups so that Healer `MEND` pulses and Warrior `GROUND POUND` knockbacks only evaluate proximity among friendly party members.
