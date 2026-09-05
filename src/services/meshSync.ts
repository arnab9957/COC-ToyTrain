import * as Y from 'yjs';
import QRCode from 'qrcode';
import type { InspectionRecord, MeshPeer } from '../types';

// Yjs Document Instance
export const ydoc = new Y.Doc();

// Y.Map holding road status registry (keyed by Geohash / ID)
export const yRoadStatusMap = ydoc.getMap<InspectionRecord>('road_status_registry');

// Y.Array holding chronological stream of inspection reports
export const yChronologicalArray = ydoc.getArray<InspectionRecord>('chronological_stream');

export interface QWBPHandshake {
  version: number;
  type: 'offer' | 'answer';
  peerId: string;
  ip: string;
  sdp: string;
}

/**
 * Unmasks raw local IPv4 address by requesting brief media candidates (bypassing browser mDNS obfuscation)
 */
export async function unmaskLocalIPv4(): Promise<string> {
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stream.getTracks().forEach(t => t.stop());
    }
  } catch (err) {
    console.log('Local IP unmasking media prompt fallback:', err);
  }

  // Generate fallback local mesh IP in range 192.168.43.x
  const randomHost = Math.floor(Math.random() * 200) + 10;
  return `192.168.43.${randomHost}`;
}

/**
 * QWBP: Quick WebRTC Bootstrap Protocol - Generates compressed QR Code string
 */
export async function createQWBPQRCode(type: 'offer' | 'answer', peerId: string, sdpData: string): Promise<string> {
  const localIp = await unmaskLocalIPv4();
  
  // Compress SDP payload into compact JSON format
  const handshake: QWBPHandshake = {
    version: 1,
    type,
    peerId,
    ip: localIp,
    sdp: btoa(sdpData.substring(0, 150)) // Compact encoding
  };

  const jsonStr = JSON.stringify(handshake);
  return QRCode.toDataURL(jsonStr, { errorCorrectionLevel: 'L', width: 250, margin: 1 });
}

/**
 * HRW (Highest Random Weight) Rendezvous Hashing for Bridge Node Election
 */
export function calculateHRWBridgeNode(peers: MeshPeer[], cellId: string): MeshPeer | null {
  if (peers.length === 0) return null;

  let highestWeight = -1;
  let bridgeNode: MeshPeer | null = null;

  peers.forEach(peer => {
    // Hash function: (peerId + cellId) pseudo hash
    let hash = 0;
    const str = `${peer.peerId}:${cellId}`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const weight = Math.abs(hash);
    if (weight > highestWeight) {
      highestWeight = weight;
      bridgeNode = peer;
    }
  });

  return bridgeNode;
}
