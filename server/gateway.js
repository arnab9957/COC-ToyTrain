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

app.use(express.json({ limit: '10mb' }));

// CORS middleware for local Vite dev server
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static frontend build files when in production
app.use(express.static(path.join(__dirname, '../dist')));

// In-Memory Synchronized Stores
const syncStore = new Map();
const alertsStore = new Map([
  [
    'alt-01',
    {
      id: 'alt-01',
      timestamp: Date.now() - 1800000,
      authority: 'Gorkha Territorial Administration (GTA)',
      title: 'Flash Flood Warning at Teesta Valley (NH-10)',
      message: 'Heavy monsoonal downpour triggered swelling Jhoras near 29th Mile. Debris flow expected. Avoid night travel.',
      severity: 'Critical',
      corridor: 'Teesta Valley (NH-10)'
    }
  ],
  [
    'alt-02',
    {
      id: 'alt-02',
      timestamp: Date.now() - 5400000,
      authority: 'DHR Permanent-Way Inspection Cell',
      title: 'Paglajhora Sinking Track Caution',
      message: 'Active tension crack propagation detected along Hill Cart Road. Speed restriction of 5 km/h enforced for Gangmen and light vehicles.',
      severity: 'Warning',
      corridor: 'NH-55 (Hill Cart Road)'
    }
  ]
]);

const trackSectionsStore = new Map([
  [
    'sec-dhr-01',
    {
      id: 'sec-dhr-01',
      sectionName: 'Tindharia Workshop Sinking Curve',
      code: 'DHR-TDH-01',
      startKm: 24.5,
      endKm: 27.2,
      gangmanId: 'GANGMAN-UNIT-04',
      hazardCoefficient: 2.1,
      status: 'Nominal',
      lastInspected: Date.now() - 7200000,
      reportsCount: 1
    }
  ],
  [
    'sec-dhr-02',
    {
      id: 'sec-dhr-02',
      sectionName: 'Paglajhora Sinking Zone (NH-55)',
      code: 'DHR-PGJ-02',
      startKm: 34.0,
      endKm: 36.8,
      gangmanId: 'GANGMAN-UNIT-09',
      hazardCoefficient: 11.4,
      status: 'Critical',
      lastInspected: Date.now() - 1800000,
      reportsCount: 4
    }
  ],
  [
    'sec-dhr-03',
    {
      id: 'sec-dhr-03',
      sectionName: 'Ghoom High-Altitude Summit Curve',
      code: 'DHR-GHM-03',
      startKm: 68.1,
      endKm: 71.4,
      gangmanId: 'GANGMAN-UNIT-02',
      hazardCoefficient: 5.2,
      status: 'Warning',
      lastInspected: Date.now() - 18000000,
      reportsCount: 2
    }
  ],
  [
    'sec-dhr-04',
    {
      id: 'sec-dhr-04',
      sectionName: 'Kurseong Station Railway Section',
      code: 'DHR-KRG-04',
      startKm: 46.2,
      endKm: 48.9,
      gangmanId: 'GANGMAN-UNIT-06',
      hazardCoefficient: 1.8,
      status: 'Nominal',
      lastInspected: Date.now() - 3600000,
      reportsCount: 0
    }
  ]
]);

// Helper: Broadcast to all connected WebSocket clients
function broadcastToAll(messageObj, exceptWs = null) {
  const payload = JSON.stringify(messageObj);
  for (const client of wss.clients) {
    if (client !== exceptWs && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// Helper: Broadcast peer count update
function broadcastPeerCount() {
  broadcastToAll({
    type: 'PEER_COUNT',
    count: wss.clients.size,
    timestamp: Date.now()
  });
}

// 1. Station Gateway Health Endpoint
app.get('/api/gateway/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    stationId: 'GHOOM-STATION-GW-01',
    stationName: 'Ghoom Railway Station Gateway',
    timestamp: Date.now(),
    backhaulAvailable: false, // Disconnected monsoonal air-gap state
    connectedPeers: wss.clients.size,
    totalQueuedReports: syncStore.size,
    activeAlerts: alertsStore.size
  });
});

// 2. Idempotent Station Sync Queue Endpoint (Supports Single & Batch Payloads)
app.post('/api/gateway/sync', (req, res) => {
  const body = req.body;
  const items = Array.isArray(body) ? body : [body];
  let acceptedCount = 0;
  let idempotentCount = 0;

  for (const item of items) {
    const recordId = item.id || (item.payload && item.payload.id);
    if (!recordId) continue;

    const payload = item.payload || item;
    const isNew = !syncStore.has(recordId);

    syncStore.set(recordId, {
      id: recordId,
      timestamp: item.timestamp || payload.timestamp || Date.now(),
      payload,
      receivedAt: Date.now()
    });

    if (isNew) {
      acceptedCount++;
      // If report links to a track section, update the section hazard score
      if (payload.trackSectionId && trackSectionsStore.has(payload.trackSectionId)) {
        const sec = trackSectionsStore.get(payload.trackSectionId);
        sec.reportsCount = (sec.reportsCount || 0) + 1;
        sec.lastInspected = Date.now();
        if (payload.hazardScore) {
          sec.hazardCoefficient = Math.max(sec.hazardCoefficient, payload.hazardScore);
          if (sec.hazardCoefficient > 7.5) sec.status = 'Critical';
          else if (sec.hazardCoefficient > 3.0) sec.status = 'Warning';
        }
      }
      // Broadcast new report to connected mesh peers in real time
      broadcastToAll({
        type: 'NEW_REPORT',
        record: payload,
        timestamp: Date.now()
      });
    } else {
      idempotentCount++;
    }
  }

  console.log(`[Station Gateway] Sync processed: ${acceptedCount} new, ${idempotentCount} existing. Total in store: ${syncStore.size}`);

  res.json({
    status: 'ACCEPTED',
    acceptedCount,
    idempotentCount,
    totalStored: syncStore.size,
    timestamp: Date.now()
  });
});

// 3. Fetch all synchronized reports from Station Gateway
app.get('/api/gateway/reports', (req, res) => {
  const reports = Array.from(syncStore.values()).map(entry => entry.payload);
  res.json({
    stationId: 'GHOOM-STATION-GW-01',
    count: reports.length,
    reports
  });
});

// 4. Emergency Broadcasts Endpoint
app.get('/api/gateway/alerts', (req, res) => {
  const alerts = Array.from(alertsStore.values());
  res.json({ alerts });
});

app.post('/api/gateway/broadcast', (req, res) => {
  const alert = req.body;
  if (!alert.id) {
    alert.id = `alt-${Date.now()}`;
  }
  alert.timestamp = alert.timestamp || Date.now();
  alertsStore.set(alert.id, alert);

  console.log(`[Station Gateway] EMERGENCY BROADCAST POSTED: ${alert.title}`);

  // Broadcast to all connected WebSocket clients
  broadcastToAll({
    type: 'EMERGENCY_ALERT',
    alert,
    timestamp: Date.now()
  });

  res.json({ status: 'BROADCAST_SENT', alert });
});

// 5. Gangman Track Sections Telemetry Endpoints
app.get('/api/gateway/track-sections', (req, res) => {
  res.json({ sections: Array.from(trackSectionsStore.values()) });
});

app.post('/api/gateway/gangman', (req, res) => {
  const { sectionId, anomalyTypes, severity, hazardScore, gangmanId } = req.body;
  if (sectionId && trackSectionsStore.has(sectionId)) {
    const sec = trackSectionsStore.get(sectionId);
    sec.reportsCount += 1;
    sec.lastInspected = Date.now();
    sec.hazardCoefficient = hazardScore || sec.hazardCoefficient;
    sec.status = severity === 'Critical' ? 'Critical' : severity === 'High' ? 'Warning' : 'Nominal';
    
    broadcastToAll({
      type: 'TRACK_UPDATE',
      section: sec,
      timestamp: Date.now()
    });

    return res.json({ status: 'TRACK_SECTION_UPDATED', section: sec });
  }

  res.status(404).json({ error: 'Track section not found' });
});

// 6. Local WebSocket P2P Signaling & Real-Time Sync Relay
wss.on('connection', (ws) => {
  console.log(`[Local Signaling] New peer connected. Active peers: ${wss.clients.size}`);
  
  // Notify client of current state
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    stationId: 'GHOOM-STATION-GW-01',
    peerCount: wss.clients.size,
    timestamp: Date.now()
  }));

  broadcastPeerCount();

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'PING':
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
          break;

        case 'REPORT_PUSH':
          if (message.record && message.record.id) {
            syncStore.set(message.record.id, {
              id: message.record.id,
              timestamp: message.record.timestamp || Date.now(),
              payload: message.record,
              receivedAt: Date.now()
            });
          }
          broadcastToAll({
            type: 'NEW_REPORT',
            record: message.record,
            senderId: message.senderId,
            timestamp: Date.now()
          }, ws);
          break;

        case 'EMERGENCY_BROADCAST':
          if (message.alert && message.alert.id) {
            alertsStore.set(message.alert.id, message.alert);
          }
          broadcastToAll({
            type: 'EMERGENCY_ALERT',
            alert: message.alert,
            senderId: message.senderId,
            timestamp: Date.now()
          }, ws);
          break;

        case 'WEBRTC_SIGNAL':
        case 'CRDT_SYNC':
        case 'CHIRP_SIGNAL':
        default:
          // Relay message to other peers on the local Wi-Fi router
          broadcastToAll(message, ws);
          break;
      }
    } catch (err) {
      console.error('[WebSocket] Message parsing error:', err);
    }
  });

  ws.on('close', () => {
    console.log(`[Local Signaling] Peer disconnected. Active peers: ${wss.clients.size}`);
    broadcastPeerCount();
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`================================================================`);
  console.log(` PAHADSATHI STATION GATEWAY RUNNING ON PORT http://0.0.0.0:${PORT}`);
  console.log(` Station Hub: Ghoom / Kurseong Station Zero-WAN LAN Gateway`);
  console.log(` Health: http://localhost:${PORT}/api/gateway/health`);
  console.log(` Reports: http://localhost:${PORT}/api/gateway/reports`);
  console.log(` Alerts: http://localhost:${PORT}/api/gateway/alerts`);
  console.log(`================================================================`);
});
