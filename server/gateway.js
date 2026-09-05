import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
// Serve static frontend build files
app.use(express.static(path.join(__dirname, '../dist')));

// Station Gateway Health Endpoint
app.get('/api/gateway/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    stationId: 'GHOOM-STATION-GW-01',
    stationName: 'Ghoom Railway Station Gateway',
    timestamp: Date.now(),
    backhaulAvailable: false, // Disconnected monsoonal mesh state
    connectedPeers: wss.clients.size
  });
});

// Idempotent Station Sync Queue Endpoint
const syncStore = new Map();

app.post('/api/gateway/sync', (req, res) => {
  const { id, timestamp, payload } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Missing sync payload ID' });
  }

  if (syncStore.has(id)) {
    return res.json({ status: 'IDEMPOTENT_ALREADY_STORED', id });
  }

  syncStore.set(id, { timestamp, payload, receivedAt: Date.now() });
  console.log(`[Station Gateway] Received offline queued report: ${id}`);
  res.json({ status: 'ACCEPTED', id, totalQueued: syncStore.size });
});

// Local WebSocket P2P Signaling Relay
const peers = new Set();

wss.on('connection', (ws) => {
  peers.add(ws);
  console.log(`[Local Signaling] New peer connected. Active peers: ${peers.size}`);

  ws.on('message', (message) => {
    // Broadcast signaling message to all other connected peers on local Wi-Fi router
    for (const peer of peers) {
      if (peer !== ws && peer.readyState === WebSocket.OPEN) {
        peer.send(message.toString());
      }
    }
  });

  ws.on('close', () => {
    peers.delete(ws);
    console.log(`[Local Signaling] Peer disconnected. Active peers: ${peers.size}`);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`================================================================`);
  console.log(` PAHADSATHI STATION GATEWAY RUNNING ON PORT http://0.0.0.0:${PORT}`);
  console.log(` Station Hub: Ghoom / Kurseong Station Zero-WAN LAN Gateway`);
  console.log(`================================================================`);
});
