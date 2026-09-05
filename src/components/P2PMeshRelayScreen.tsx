import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { createQWBPQRCode, calculateHRWBridgeNode } from '../services/meshSync';
import { signReportPayload, verifyReportSignature } from '../services/crypto';
import type { MeshPeer } from '../types';

const MOCK_PEERS: MeshPeer[] = [
  { peerId: 'peer-ghoom-01', deviceModel: 'Redmi Note 12 Pro', ipAddress: '192.168.43.14', cellId: 'CELL-GHOOM-A', isBridgeNode: true, lastSeen: Date.now() },
  { peerId: 'peer-kurseong-04', deviceModel: 'Samsung Galaxy A54', ipAddress: '192.168.43.88', cellId: 'CELL-GHOOM-A', isBridgeNode: false, lastSeen: Date.now() - 4000 },
  { peerId: 'peer-tindharia-09', deviceModel: 'iPhone 14 (Gangman Unit)', ipAddress: '192.168.43.102', cellId: 'CELL-GHOOM-A', isBridgeNode: false, lastSeen: Date.now() - 12000 }
];

export const P2PMeshRelayScreen: React.FC = () => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'qr' | 'peers' | 'tamper'>('qr');
  const [tamperStatus, setTamperStatus] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    createQWBPQRCode('offer', 'peer-local-device-01', 'v=0\r\no=- 12345 2 IN IP4 192.168.43.14\r\ns=-\r\nt=0 0')
      .then((dataUrl) => setQrCodeDataUrl(dataUrl));
  }, []);

  const bridgeNode = calculateHRWBridgeNode(MOCK_PEERS, 'CELL-GHOOM-A');

  const handleRunTamperTest = async () => {
    setIsVerifying(true);
    setTamperStatus('Generating original signed report payload via WebCrypto ECDSA (P-256)...');

    const samplePayload = {
      geohash: 'tu11a',
      timestamp: Date.now(),
      passable: false,
      photoHash: 'photo-hash-eb5562a'
    };

    const { signatureHex, publicKeyHex } = await signReportPayload(samplePayload);

    setTimeout(async () => {
      const isValid = await verifyReportSignature(samplePayload, signatureHex, publicKeyHex);
      const tamperedPayload = { ...samplePayload, passable: true };
      const isTamperedValid = await verifyReportSignature(tamperedPayload, signatureHex, publicKeyHex);

      setIsVerifying(false);
      if (isValid && !isTamperedValid) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        setTamperStatus(
          'SUCCESS: Original report signature VALID ✅ | Tampered payload signature REJECTED ❌\n(Hook A Zero-Trust Cryptographic Enforcement Passed!)'
        );
      }
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full gap-gap-default">
      {/* Sub-Header Ribbon */}
      <section className="flex flex-col gap-1.5 p-3.5 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_#000]">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-blue-600 text-[24px]">hub</span>
            <h1 className="font-mono text-base font-extrabold uppercase text-black truncate">
              Offline Mesh Transmission Hub
            </h1>
          </div>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-400 text-xs font-mono rounded uppercase font-bold">
            READY TO SHARE
          </span>
        </div>
        <p className="text-xs font-mono text-gray-700 pt-1 border-t border-gray-200">
          Local Node IP: <strong className="text-blue-700 font-bold">192.168.43.14</strong> • Direct Peer-to-Peer Transmission
        </p>
      </section>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 font-mono">
        <button
          type="button"
          onClick={() => setActiveTab('qr')}
          className={`flex-1 py-2.5 px-2 rounded-lg text-xs uppercase font-extrabold border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer transition-colors ${
            activeTab === 'qr' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-gray-100'
          }`}
        >
          QR Connect
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('peers')}
          className={`flex-1 py-2.5 px-2 rounded-lg text-xs uppercase font-extrabold border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer transition-colors ${
            activeTab === 'peers' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-gray-100'
          }`}
        >
          Peers ({MOCK_PEERS.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tamper')}
          className={`flex-1 py-2.5 px-2 rounded-lg text-xs uppercase font-extrabold border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer transition-colors ${
            activeTab === 'tamper' ? 'bg-emerald-600 text-white' : 'bg-white text-black hover:bg-gray-100'
          }`}
        >
          Security Check
        </button>
      </div>

      {/* TAB 1: QWBP QR CODE */}
      {activeTab === 'qr' && (
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-md flex flex-col items-center text-center gap-3">
            <span className="font-headline-sm text-headline-sm font-extrabold text-on-surface uppercase">
              55-Byte SDP Offer QR Code
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
              Scan this compressed QWBP QR code on Phone 2 to establish direct WebRTC data channel without internet!
            </p>

            <div className="p-3 bg-surface-container-lowest border-4 border-on-surface rounded-xl shadow-lg inline-block">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QWBP QR Code" className="w-52 h-52 mx-auto" />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center font-label-sm text-label-sm text-on-surface-variant">
                  Generating QWBP SDP...
                </div>
              )}
            </div>

            <div className="w-full p-2.5 bg-surface-container-low rounded-lg border border-outline-variant/30 text-left font-label-sm text-label-sm space-y-1">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>Protocol: QWBP v1.0 (Quick WebRTC Bootstrap)</span>
                <span className="text-tertiary font-bold">55 Bytes</span>
              </div>
              <p className="text-[11px] text-on-surface-variant font-mono">
                ICE Candidates: <span className="text-on-surface font-bold">192.168.43.14:5004 (Direct IPv4 LAN)</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MESH ROSTER & HRW BRIDGE ELECTION */}
      {activeTab === 'peers' && (
        <div className="flex flex-col gap-3">
          <div className="p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl shadow-sm space-y-1">
            <span className="font-headline-sm text-headline-sm uppercase text-on-surface font-bold block">
              Cellular Mesh Topology (Max 10 Peers/Cell)
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Highest Random Weight (HRW) Elected Bridge Node:{' '}
              <strong className="text-tertiary">{bridgeNode?.peerId}</strong>
            </p>
          </div>

          <div className="space-y-2">
            {MOCK_PEERS.map((peer) => (
              <div
                key={peer.peerId}
                className="p-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-sm flex items-center justify-between font-label-sm text-label-sm"
              >
                <div>
                  <span className="font-bold text-on-surface block">{peer.peerId} ({peer.deviceModel})</span>
                  <span className="text-on-surface-variant text-[11px] font-mono">LAN IP: {peer.ipAddress}</span>
                </div>
                {peer.isBridgeNode ? (
                  <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-bold rounded">
                    HRW BRIDGE NODE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-tertiary-container text-on-tertiary-container font-bold rounded">
                    PEER CONNECTED
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: HOOK A ZERO-TRUST TAMPER TEST */}
      {activeTab === 'tamper' && (
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-md space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-[24px]">verified_user</span>
              <h3 className="font-headline-sm text-headline-sm uppercase text-on-surface font-extrabold">
                Hook A: Zero-Trust ECDSA Cryptographic Security
              </h3>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Every logged report is signed locally via ECDSA P-256 / WebCrypto. Neighboring mesh nodes verify the payload signature before accepting Yjs CRDT updates, discarding tampered records!
            </p>

            <button
              type="button"
              onClick={handleRunTamperTest}
              disabled={isVerifying}
              className="w-full min-h-[56px] px-4 py-3 bg-tertiary text-on-tertiary font-headline-sm text-headline-sm uppercase rounded-xl flex items-center justify-center gap-3 shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">lock</span>
              <span>{isVerifying ? 'Verifying Signature...' : 'Run Hook A Tamper Detection Test'}</span>
            </button>

            {tamperStatus && (
              <div className="p-3 bg-surface-container-low rounded border border-outline-variant/30 font-label-sm text-label-sm text-on-surface leading-relaxed whitespace-pre-line font-mono">
                {tamperStatus}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
