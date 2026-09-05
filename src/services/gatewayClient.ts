import type { InspectionRecord, EmergencyAlert, TrackSection } from '../types';

export interface GatewayHealth {
  status: string;
  stationId: string;
  stationName: string;
  timestamp: number;
  backhaulAvailable: boolean;
  connectedPeers: number;
  totalQueuedReports: number;
  activeAlerts: number;
}

export interface SyncResponse {
  status: string;
  acceptedCount: number;
  idempotentCount: number;
  totalStored: number;
  timestamp: number;
}

// Determine Gateway API Base URL dynamically
const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // In dev mode with Vite proxy, use relative path '/api'
    return '/api/gateway';
  }
  return 'http://localhost:8080/api/gateway';
};

// 1. Fetch Station Gateway Health Status
export async function fetchGatewayHealth(): Promise<GatewayHealth | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/health`, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-cache'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[GatewayClient] Health check failed (station gateway unreachable or offline):', err);
    return null;
  }
}

// 2. Fetch Synchronized Inspection Reports from Gateway
export async function fetchGatewayReports(): Promise<InspectionRecord[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/reports`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.reports || [];
  } catch (err) {
    console.warn('[GatewayClient] Failed to fetch gateway reports:', err);
    return [];
  }
}

// 3. Fetch Active Emergency Alerts from Gateway
export async function fetchGatewayAlerts(): Promise<EmergencyAlert[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/alerts`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.alerts || [];
  } catch (err) {
    console.warn('[GatewayClient] Failed to fetch gateway alerts:', err);
    return [];
  }
}

// 4. Fetch DHR Permanent-Way Track Sections from Gateway
export async function fetchGatewayTrackSections(): Promise<TrackSection[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/track-sections`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.sections || [];
  } catch (err) {
    console.warn('[GatewayClient] Failed to fetch track sections:', err);
    return [];
  }
}

// 5. Idempotent Sync of Single Inspection Record to Station Gateway
export async function syncReportToGateway(record: InspectionRecord): Promise<SyncResponse | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: record.id,
        timestamp: record.timestamp,
        payload: record
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    
    // Also push to WebSocket mesh if active
    sendWebSocketMessage('REPORT_PUSH', { record });
    return result;
  } catch (err) {
    console.warn('[GatewayClient] Failed to sync report to station gateway:', err);
    return null;
  }
}

// 6. Idempotent Sync of Batch Payload Array to Station Gateway
export async function syncBatchToGateway(records: Array<{ id: string; timestamp: number; payload: any }>): Promise<SyncResponse | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(records)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[GatewayClient] Failed to sync batch to station gateway:', err);
    return null;
  }
}

// 7. Post Emergency Broadcast to Gateway & Mesh
export async function postEmergencyBroadcast(alert: Partial<EmergencyAlert>): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    
    // Also push to WebSocket mesh
    sendWebSocketMessage('EMERGENCY_BROADCAST', { alert: data.alert || alert });
    return true;
  } catch (err) {
    console.warn('[GatewayClient] Failed to broadcast emergency alert:', err);
    return false;
  }
}

// 8. Post Gangman P-Way Audit Telemetry Update
export async function postGangmanTelemetry(payload: {
  sectionId: string;
  anomalyTypes: string[];
  severity: string;
  hazardScore: number;
  gangmanId: string;
}): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/gangman`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.warn('[GatewayClient] Failed to post Gangman telemetry:', err);
    return false;
  }
}

// =========================================================================
// Real-Time WebSocket Mesh & Signaling Connection
// =========================================================================

let wsInstance: WebSocket | null = null;
let reconnectTimer: any = null;
const messageListeners = new Set<(msg: any) => void>();

export interface GatewayClientCallbacks {
  onPeerCount?: (count: number) => void;
  onNewReport?: (record: InspectionRecord) => void;
  onEmergencyAlert?: (alert: EmergencyAlert) => void;
  onTrackUpdate?: (section: TrackSection) => void;
  onStatusChange?: (online: boolean) => void;
}

export function initGatewayWebSocket(callbacks?: GatewayClientCallbacks): () => void {
  if (typeof window === 'undefined') return () => {};

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // Use Vite proxied /ws endpoint in dev or direct host in production
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  function connect() {
    try {
      wsInstance = new WebSocket(wsUrl);

      wsInstance.onopen = () => {
        console.log('[Gateway WS] Connected to Station Gateway Signaling Relay');
        callbacks?.onStatusChange?.(true);
      };

      wsInstance.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'PEER_COUNT' || msg.type === 'CONNECTED') {
            const count = msg.count || msg.peerCount;
            if (typeof count === 'number') {
              callbacks?.onPeerCount?.(count);
            }
          } else if (msg.type === 'NEW_REPORT' && msg.record) {
            callbacks?.onNewReport?.(msg.record);
          } else if (msg.type === 'EMERGENCY_ALERT' && msg.alert) {
            callbacks?.onEmergencyAlert?.(msg.alert);
          } else if (msg.type === 'TRACK_UPDATE' && msg.section) {
            callbacks?.onTrackUpdate?.(msg.section);
          }

          // Trigger general listeners
          messageListeners.forEach(listener => listener(msg));
        } catch (err) {
          console.error('[Gateway WS] Error handling message:', err);
        }
      };

      wsInstance.onclose = () => {
        console.log('[Gateway WS] Disconnected. Scheduling reconnect in 3s...');
        callbacks?.onStatusChange?.(false);
        wsInstance = null;
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connect, 3000);
      };

      wsInstance.onerror = (err) => {
        console.warn('[Gateway WS] Connection error:', err);
        wsInstance?.close();
      };
    } catch (err) {
      console.warn('[Gateway WS] Failed to create WebSocket:', err);
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, 3000);
    }
  }

  connect();

  return () => {
    clearTimeout(reconnectTimer);
    if (wsInstance) {
      wsInstance.close();
      wsInstance = null;
    }
  };
}

export function sendWebSocketMessage(type: string, data: Record<string, any> = {}) {
  if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
    wsInstance.send(JSON.stringify({
      type,
      senderId: `client-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      ...data
    }));
  }
}

export function subscribeToGatewayMessages(callback: (msg: any) => void): () => void {
  messageListeners.add(callback);
  return () => {
    messageListeners.delete(callback);
  };
}
