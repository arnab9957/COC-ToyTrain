import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  X, 
  Wifi, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle, 
  Copy, 
  Radio, 
  Cpu, 
  Lock,
  RefreshCw,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { createQWBPQRCode, calculateHRWBridgeNode } from '../services/meshSync';
import { signReportPayload, verifyReportSignature } from '../services/crypto';
import type { MeshPeer } from '../types';

interface P2PMeshModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MOCK_PEERS: MeshPeer[] = [
  { peerId: 'peer-ghoom-01', deviceModel: 'Redmi Note 12 Pro', ipAddress: '192.168.43.14', cellId: 'CELL-GHOOM-A', isBridgeNode: true, lastSeen: Date.now() },
  { peerId: 'peer-kurseong-04', deviceModel: 'Samsung Galaxy A54', ipAddress: '192.168.43.88', cellId: 'CELL-GHOOM-A', isBridgeNode: false, lastSeen: Date.now() - 4000 },
  { peerId: 'peer-tindharia-09', deviceModel: 'iPhone 14 (Gangman Unit)', ipAddress: '192.168.43.102', cellId: 'CELL-GHOOM-A', isBridgeNode: false, lastSeen: Date.now() - 12000 }
];

export const P2PMeshModal: React.FC<P2PMeshModalProps> = ({ isOpen, onClose }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'qr' | 'peers' | 'tamper'>('qr');
  const [tamperStatus, setTamperStatus] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      createQWBPQRCode('offer', 'peer-local-device-01', 'v=0\r\no=- 12345 2 IN IP4 192.168.43.14\r\ns=-\r\nt=0 0')
        .then(dataUrl => setQrCodeDataUrl(dataUrl));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const bridgeNode = calculateHRWBridgeNode(MOCK_PEERS, 'CELL-GHOOM-A');

  // Test Hook A Zero-Trust Tamper Detection
  const handleRunTamperVerificationTest = async () => {
    setIsVerifying(true);
    setTamperStatus('Generating original signed report payload via WebCrypto ECDSA...');

    const samplePayload = {
      geohash: 'tu11a',
      timestamp: Date.now(),
      passable: false,
      photoHash: 'photo-hash-eb5562a'
    };

    const { signatureHex, publicKeyHex } = await signReportPayload(samplePayload);

    setTimeout(async () => {
      // Test 1: Verify unaltered payload
      const isValid = await verifyReportSignature(samplePayload, signatureHex, publicKeyHex);
      
      // Test 2: Simulate malicious tamper attack (changing passable: true)
      const tamperedPayload = { ...samplePayload, passable: true };
      const isTamperedValid = await verifyReportSignature(tamperedPayload, signatureHex, publicKeyHex);

      setIsVerifying(false);
      if (isValid && !isTamperedValid) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        setTamperStatus('SUCCESS: Original report signature VALID ✅ | Tampered payload signature REJECTED ❌ (Zero-Trust Enforcement Passed!)');
      }
    }, 1200);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content border-sky-500/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-600 rounded-lg">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Air-Gapped P2P Mesh & QWBP Signaling</h3>
              <p className="text-xs text-slate-400">QR WebRTC Bootstrap Protocol & Yjs CRDT Synchronization</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800 mb-4">
          <button
            onClick={() => setActiveTab('qr')}
            className={`btn text-xs py-1.5 px-3 rounded-md flex-1 font-bold ${
              activeTab === 'qr' ? 'btn-primary' : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" /> QR Signaling
          </button>
          
          <button
            onClick={() => setActiveTab('peers')}
            className={`btn text-xs py-1.5 px-3 rounded-md flex-1 font-bold ${
              activeTab === 'peers' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Mesh Roster
          </button>

          <button
            onClick={() => setActiveTab('tamper')}
            className={`btn text-xs py-1.5 px-3 rounded-md flex-1 font-bold ${
              activeTab === 'tamper' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" /> Hook A Test
          </button>
        </div>

        {/* TAB 1: QWBP QR CODE */}
        {activeTab === 'qr' && (
          <div className="space-y-4 text-center">
            <p className="text-xs text-slate-300">
              Scan this compressed 55-byte SDP offer QR code on Phone 2 to bind direct WebRTC link without internet!
            </p>

            <div className="p-4 bg-white rounded-xl inline-block shadow-2xl border-4 border-sky-500">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QWBP QR Code" className="w-52 h-52 mx-auto" />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-slate-500 text-xs">
                  Generating QWBP SDP...
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-left text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400 font-mono">
                <span>Protocol: QWBP v1.0</span>
                <span>Payload: 55 Bytes</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Unmasked Local IPv4: <span className="font-mono text-emerald-400">192.168.43.14</span> (bypassed mDNS)
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE PEER ROSTER & HRW ELECTION */}
        {activeTab === 'peers' && (
          <div className="space-y-4">
            <div className="p-3 bg-purple-950/40 rounded-lg border border-purple-800/60 text-xs space-y-1">
              <span className="font-bold text-purple-300 block">Cellular Mesh Topology (Max 10 Peers/Cell)</span>
              <p className="text-[11px] text-purple-200">
                Elected HRW Bridge Node: <span className="font-mono font-bold text-emerald-400">{bridgeNode?.peerId}</span>
              </p>
            </div>

            <div className="space-y-2">
              {MOCK_PEERS.map((peer) => (
                <div key={peer.peerId} className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{peer.peerId} ({peer.deviceModel})</span>
                    <span className="text-slate-400 font-mono text-[11px]">LAN IP: {peer.ipAddress}</span>
                  </div>
                  {peer.isBridgeNode ? (
                    <span className="badge badge-purple">HRW Bridge Node</span>
                  ) : (
                    <span className="badge badge-green">Peer Connected</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: HOOK A ZERO-TRUST TAMPER TEST */}
        {activeTab === 'tamper' && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-lg text-xs space-y-2">
              <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Hook A: Zero-Trust Cryptographic Report Verification</span>
              </h4>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Click below to simulate a tamper attack. We generate a report signed via WebCrypto ECDSA, tamper with the passable text, and verify signature rejection!
              </p>
            </div>

            <button
              onClick={handleRunTamperVerificationTest}
              disabled={isVerifying}
              className="btn btn-success w-full py-2.5 text-xs font-bold"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Testing Cryptographic Verification...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Run Hook A Tamper Detection Test</span>
                </>
              )}
            </button>

            {tamperStatus && (
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-emerald-300 leading-relaxed whitespace-pre-line">
                {tamperStatus}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
