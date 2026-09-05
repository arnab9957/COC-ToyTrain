import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { createQWBPQRCode, calculateHRWBridgeNode } from '../services/meshSync';
import { signReportPayload, verifyReportSignature } from '../services/crypto';
import { postEmergencyBroadcast, sendWebSocketMessage } from '../services/gatewayClient';
import type { MeshPeer } from '../types';

const MOCK_PEERS: MeshPeer[] = [
  { peerId: 'GTA-Bridge-01', deviceModel: 'Railway Station Gateway', ipAddress: '192.168.43.14', cellId: 'CELL-94D', isBridgeNode: true, lastSeen: Date.now() },
  { peerId: 'Commuter-Sumo-821', deviceModel: 'Mobile Transit Node', ipAddress: '192.168.43.88', cellId: 'CELL-94D', isBridgeNode: false, lastSeen: Date.now() - 4000 },
  { peerId: 'Railway-Walk-04', deviceModel: 'Gangman Field Node', ipAddress: '192.168.43.102', cellId: 'CELL-94D', isBridgeNode: false, lastSeen: Date.now() - 12000 },
  { peerId: 'Tindharia-Workshop', deviceModel: 'Relay Mesh Node', ipAddress: '192.168.43.190', cellId: 'CELL-94D', isBridgeNode: false, lastSeen: Date.now() - 25000 }
];

export const P2PMeshRelayScreen: React.FC = () => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [mode, setMode] = useState<'visual' | 'hotspot' | 'chirp'>('visual');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [tamperStatus, setTamperStatus] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [proxyEnabled, setProxyEnabled] = useState(true);
  const [crdtLogs, setCrdtLogs] = useState<Array<{ text: string; sub?: string; color: string }>>([
    { text: '> RX_SYNC_STEP_1 from GTA-Bridge-01', sub: '+12 ops', color: 'text-tertiary-fixed' },
    { text: '> Merging 6 gangman hazard vectors... OK', sub: 'state: stable', color: 'text-inverse-on-surface' },
    { text: '> P2P Flood Mesh ready for relay', sub: '0 dropped', color: 'text-secondary-fixed-dim' }
  ]);

  useEffect(() => {
    createQWBPQRCode('offer', 'peer-local-device-01', 'v=0\r\no=- 12345 2 IN IP4 192.168.43.14\r\ns=-\r\nt=0 0')
      .then((dataUrl) => setQrCodeDataUrl(dataUrl));
  }, []);

  const bridgeNode = calculateHRWBridgeNode(MOCK_PEERS, 'CELL-94D');

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

  const handleEmergencyBroadcast = async () => {
    const alert = {
      id: `alert-${Date.now()}`,
      timestamp: Date.now(),
      authority: 'PahadSathi Local Transit Relay',
      title: '🚨 CRITICAL CORRIDOR ALERT: MESH BROADCAST',
      message: 'Active rockfall hazard reported. Traffic halted on NH-55 / Rohini alignment.',
      severity: 'Critical' as const,
      corridor: 'NH-55 (Hill Cart Road)' as const
    };

    await postEmergencyBroadcast(alert);

    const newLog = {
      text: '>> FLOODING CRITICAL EMERGENCY BROADCAST...',
      sub: 'STATION ROUTED',
      color: 'text-secondary-fixed-dim font-bold'
    };
    setCrdtLogs((prev) => [newLog, ...prev]);
  };

  const handleChirpBroadcast = () => {
    sendWebSocketMessage('CHIRP_SIGNAL', { frequency: '19.5kHz', data: 'DARJEELING_EMERGENCY_55B' });

    const newLog = {
      text: '>> ULTRASONIC CHIRP (18-20 kHz) TRANSMITTED',
      sub: '55B RELAYED',
      color: 'text-tertiary-fixed font-bold'
    };
    setCrdtLogs((prev) => [newLog, ...prev]);
  };

  return (
    <div className="flex flex-col w-full gap-gap-compact">
      {/* Offline Tactical Telemetry Header */}
      <div className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-xl shadow-md">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-3 h-3 rounded-full bg-secondary-container animate-ping shrink-0" />
          <div className="flex flex-col truncate">
            <span className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-tight truncate">
              OFFLINE P2P MESH ENGINE
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">
              AIR-GAP PROTOCOL // CELL 94-D DARJEELING
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 bg-tertiary-container text-on-tertiary-container rounded-lg shadow-sm shrink-0">
          <span className="material-symbols-outlined text-[16px]">wifi_tethering</span>
          <span className="font-label-sm text-label-sm uppercase font-extrabold tracking-widest">LIVE MESH</span>
        </div>
      </div>

      {/* Interconnection Mode Switcher Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-surface-container-high rounded-xl shadow-sm">
        <button
          type="button"
          onClick={() => setMode('visual')}
          className={`flex items-center justify-center gap-1 h-touch-target-min px-1.5 rounded-lg shadow-sm transition-all text-center cursor-pointer ${
            mode === 'visual'
              ? 'bg-surface-container-lowest text-on-surface font-label-md text-label-md'
              : 'bg-transparent text-on-surface-variant font-label-md text-label-md hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px] text-primary">qr_code_scanner</span>
          <span className="font-headline-sm uppercase tracking-tight text-[11px] leading-tight">VISUAL QR</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('hotspot')}
          className={`flex items-center justify-center gap-1 h-touch-target-min px-1.5 rounded-lg transition-all text-center cursor-pointer ${
            mode === 'hotspot'
              ? 'bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm'
              : 'bg-transparent text-on-surface-variant font-label-md text-label-md hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">sensors</span>
          <span className="font-headline-sm uppercase tracking-tight text-[11px] leading-tight">HOTSPOT</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('chirp')}
          className={`flex items-center justify-center gap-1 h-touch-target-min px-1.5 rounded-lg transition-all text-center cursor-pointer ${
            mode === 'chirp'
              ? 'bg-surface-container-lowest text-tertiary font-label-md text-label-md shadow-sm'
              : 'bg-transparent text-tertiary font-label-md text-label-md hover:bg-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px] text-tertiary animate-pulse">graphic_eq</span>
          <span className="font-headline-sm uppercase tracking-tight text-[11px] leading-tight text-tertiary font-bold">
            CHIRP FSK (RAIN/FOG)
          </span>
        </button>
      </div>

      {/* Workflow Section: Visual / Hotspot / Chirp Signaling Container */}
      <div className="flex flex-col gap-3">
        {mode === 'visual' && (
          <>
            {/* Step 1: SDP Offer Card */}
            <div className="flex flex-col p-4 bg-surface-container-lowest rounded-xl shadow-md">
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-primary text-on-primary font-label-sm text-label-sm rounded uppercase font-bold">
                    STEP 01
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-tight">
                    MY SDP OFFER QR
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">V4 • 55B RAW</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
                {/* High-Contrast Brutalist QR Presentation */}
                <div className="relative p-3 bg-surface-container-lowest border-2 border-on-surface rounded-lg shadow-lg flex flex-col items-center justify-center shrink-0">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="QWBP QR Code" className="w-36 h-36 object-contain" />
                  ) : (
                    <svg className="w-36 h-36" fill="currentColor" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                      <rect fill="#1b1b1b" height="28" rx="2" width="28" x="5" y="5" />
                      <rect fill="#ffffff" height="20" rx="1" width="20" x="9" y="9" />
                      <rect fill="#1b1b1b" height="12" rx="1" width="12" x="13" y="13" />
                      <rect fill="#1b1b1b" height="28" rx="2" width="28" x="67" y="5" />
                      <rect fill="#ffffff" height="20" rx="1" width="20" x="71" y="9" />
                      <rect fill="#1b1b1b" height="12" rx="1" width="12" x="75" y="13" />
                      <rect fill="#1b1b1b" height="28" rx="2" width="28" x="5" y="67" />
                      <rect fill="#ffffff" height="20" rx="1" width="20" x="9" y="71" />
                      <rect fill="#1b1b1b" height="12" rx="1" width="12" x="13" y="75" />
                      <rect fill="#004ac6" height="8" width="8" x="38" y="8" />
                      <rect fill="#1b1b1b" height="6" width="6" x="50" y="8" />
                      <rect fill="#1b1b1b" height="6" width="6" x="38" y="20" />
                      <rect fill="#004ac6" height="6" width="10" x="48" y="20" />
                      <rect fill="#1b1b1b" height="6" width="6" x="10" y="38" />
                      <rect fill="#1b1b1b" height="6" width="8" x="20" y="48" />
                      <rect fill="#004ac6" height="14" width="6" x="30" y="38" />
                      <rect fill="#1b1b1b" height="8" width="8" x="40" y="38" />
                      <rect fill="#1b1b1b" height="6" width="6" x="52" y="38" />
                      <rect fill="#004ac6" height="6" width="14" x="64" y="38" />
                      <rect fill="#1b1b1b" height="8" width="8" x="82" y="38" />
                      <rect fill="#1b1b1b" height="6" width="16" x="40" y="50" />
                      <rect fill="#1b1b1b" height="10" width="8" x="60" y="50" />
                      <rect fill="#004ac6" height="12" width="6" x="74" y="48" />
                      <rect fill="#1b1b1b" height="6" width="6" x="84" y="52" />
                      <rect fill="#1b1b1b" height="8" width="8" x="38" y="66" />
                      <rect fill="#004ac6" height="14" width="6" x="50" y="66" />
                      <rect fill="#1b1b1b" height="6" width="12" x="62" y="66" />
                      <rect fill="#1b1b1b" height="12" width="12" x="78" y="66" />
                      <rect fill="#004ac6" height="6" width="8" x="38" y="78" />
                      <rect fill="#1b1b1b" height="12" width="10" x="62" y="78" />
                      <rect fill="#1b1b1b" height="6" width="14" x="42" y="88" />
                      <rect fill="#004ac6" height="8" width="8" x="82" y="82" />
                    </svg>
                  )}
                  <div className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-primary text-on-primary font-label-sm text-label-sm rounded uppercase font-bold shadow-sm">
                    QWBP-55
                  </div>
                </div>

                {/* Telemetry Details & Air-Gap Instructions */}
                <div className="flex flex-col justify-between flex-1 w-full gap-2">
                  <div className="p-2.5 bg-surface-container rounded-lg">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                      Offer Payload Hash:
                    </span>
                    <div className="font-label-md text-label-md text-on-surface break-all font-mono">
                      0x49E2-SDP-DTLS-WEBRTC-CH94D
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 rounded-full bg-tertiary" />
                      <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                        MTU: 1280 • STUN-Free Direct Airframe
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-surface-container-low rounded-lg text-on-surface-variant font-label-sm text-label-sm">
                    <span>ICE Candidate: 192.168.43.14:5004</span>
                    <span className="text-tertiary font-bold">55 Bytes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Neighbor Answer Scanner */}
            <div className="flex flex-col p-4 bg-surface-container-lowest rounded-xl shadow-md">
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container font-label-sm text-label-sm rounded uppercase font-bold">
                    STEP 02
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-tight">
                    SCAN NEIGHBOR'S ANSWER QR
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-tertiary uppercase font-extrabold">CAMERA READY</span>
              </div>
              {/* Prominent 56px Action Button */}
              <button
                type="button"
                onClick={() => setScannerOpen(!scannerOpen)}
                className="w-full h-touch-target-min flex items-center justify-center gap-2 bg-primary-container text-on-primary-container font-headline-sm text-headline-sm uppercase tracking-wide rounded-xl shadow-lg active:translate-y-0.5 transition-transform cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">
                  {scannerOpen ? 'close' : 'photo_camera'}
                </span>
                <span>
                  {scannerOpen ? 'CLOSE OPTICAL SCANNER' : 'OPEN INTEGRATED CAMERA SCANNER (30 FPS)'}
                </span>
              </button>

              {/* Viewfinder Visual Emulation Container */}
              {scannerOpen && (
                <div className="flex flex-col items-center justify-center relative mt-3 h-52 bg-surface-container-highest rounded-xl overflow-hidden shadow-inner border border-outline-variant/30">
                  {/* Target Reticle Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-36 h-36 border-2 border-dashed border-primary/70 rounded-lg flex items-center justify-center relative">
                      <div className="w-full h-0.5 bg-secondary-container/90 animate-pulse absolute top-1/2" />
                      <div className="absolute -top-3 left-2 px-1 bg-surface-container-highest text-on-surface font-label-sm text-label-sm uppercase">
                        VIEWFINDER // AUTO-SYNC
                      </div>
                    </div>
                  </div>
                  <div className="z-10 flex flex-col items-center gap-1.5 p-3 bg-surface-container/90 rounded-lg shadow-sm">
                    <span className="material-symbols-outlined text-primary text-[28px] animate-bounce">
                      center_focus_strong
                    </span>
                    <span className="font-label-md text-label-md text-on-surface font-bold uppercase">
                      ALIGN OPPOSING QR ANSWER
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                      OPTICAL FPS: 30.2 • LIGHT EXPOSURE: AUTO
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-on-surface-variant">
                    <span className="font-label-sm text-label-sm uppercase">QWBP PROTOCOL DECODER v2.4</span>
                    <span className="font-label-sm text-label-sm text-tertiary font-bold">READY</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {mode === 'chirp' && (
          <div className="flex flex-col p-4 bg-surface-container-lowest rounded-xl shadow-md border-2 border-tertiary gap-3">
            <div className="flex items-center justify-between pb-1 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-tertiary text-on-tertiary font-label-sm text-label-sm rounded uppercase font-extrabold">
                  FEATURE #3
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-tight">
                  CHIRP AUDIO FSK SIGNALING
                </span>
              </div>
              <span className="px-2 py-0.5 bg-tertiary-container text-on-tertiary-container font-label-sm text-label-sm rounded uppercase font-bold">
                RAIN/FOG PROVEN
              </span>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Optical camera obscured by mountain rain or heavy fog? Signal the 55-byte SDP offer directly over acoustic ultrasound frequencies.
            </p>

            {/* Ultrasonic Chirp Transmitter Action Area */}
            <div className="flex flex-col p-3 bg-surface-container rounded-lg gap-2 border border-surface-variant/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[20px]">volume_up</span>
                  <span className="font-label-md text-label-md text-on-surface uppercase font-bold">
                    18-20 kHz Ultrasonic/Audio FSK
                  </span>
                </div>
                <span className="px-1.5 py-0.5 bg-on-surface text-surface-container-lowest font-label-sm text-label-sm rounded font-mono">
                  55B PAYLOAD
                </span>
              </div>

              {/* Pulsing Audio Waveform Visualizer */}
              <div className="h-12 bg-inverse-surface rounded flex items-center justify-around px-3 overflow-hidden relative">
                <div className="w-1.5 h-6 bg-tertiary-fixed rounded animate-pulse" />
                <div className="w-1.5 h-9 bg-tertiary-fixed rounded animate-pulse" />
                <div className="w-1.5 h-4 bg-tertiary-fixed rounded animate-pulse" />
                <div className="w-1.5 h-8 bg-tertiary-fixed rounded animate-pulse" />
                <div className="w-1.5 h-10 bg-secondary-fixed-dim rounded animate-pulse" />
                <div className="w-1.5 h-5 bg-tertiary-fixed rounded animate-pulse" />
                <div className="w-1.5 h-9 bg-tertiary-fixed rounded animate-pulse" />
                <div className="w-1.5 h-7 bg-tertiary-fixed rounded animate-pulse" />
                <div className="w-1.5 h-3 bg-tertiary-fixed rounded animate-pulse" />
                <div className="w-1.5 h-8 bg-secondary-fixed-dim rounded animate-pulse" />
                <div className="w-1.5 h-10 bg-tertiary-fixed rounded animate-pulse" />
                <div className="w-1.5 h-5 bg-tertiary-fixed rounded animate-pulse" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleChirpBroadcast}
                  className="flex items-center justify-center gap-1.5 h-touch-target-min px-2 bg-tertiary text-on-tertiary font-headline-sm text-headline-sm uppercase tracking-tight rounded-lg shadow-sm hover:opacity-95 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">campaign</span>
                  <span className="text-xs sm:text-sm font-bold">BROADCAST 55B SDP CHIRP</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert('Listening for acoustic ultrasound FSK carrier on microphone (18.5kHz FFT)...')}
                  className="flex items-center justify-center gap-1.5 h-touch-target-min px-2 bg-surface-container-highest text-on-surface font-headline-sm text-headline-sm uppercase tracking-tight rounded-lg shadow-sm hover:bg-surface-variant transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-primary text-[20px]">mic</span>
                  <span className="text-xs sm:text-sm font-bold">LISTEN &amp; DECODE CHIRP (FFT)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === 'hotspot' && (
          <div className="flex flex-col p-4 bg-surface-container-lowest rounded-xl shadow-md gap-3 border border-outline-variant/30">
            <div className="flex items-center justify-between pb-1 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-primary text-on-primary font-label-sm text-label-sm rounded uppercase font-bold">
                  HOTSPOT AD-HOC
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-tight">
                  Wi-Fi Direct / Local AP
                </span>
              </div>
              <span className="px-2 py-0.5 bg-tertiary-container text-on-tertiary-container font-label-sm text-label-sm rounded uppercase font-bold">
                SSID ACTIVE
              </span>
            </div>
            <div className="p-3 bg-surface-container rounded-lg space-y-1 font-mono text-xs">
              <p className="text-on-surface font-bold">SSID: PahadSathi-Mesh-94D</p>
              <p className="text-on-surface-variant">Gateway IP: 192.168.43.1 • Subnet: 255.255.255.0</p>
              <p className="text-tertiary font-semibold">WebSockets / mDNS Discovery: Listening on port 8080</p>
            </div>
          </div>
        )}
      </div>

      {/* Local Routing Table (Darjeeling Ridge Cell) */}
      <div className="flex flex-col p-4 bg-surface-container-lowest rounded-xl shadow-md gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">alt_route</span>
            <span className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-tight">
              ACTIVE ROUTING TABLE
            </span>
          </div>
          <div className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded font-label-sm text-label-sm uppercase self-start sm:self-auto font-mono">
            CELL: 94-D DARJEELING RIDGE (HRW BRIDGE: {bridgeNode?.peerId})
          </div>
        </div>

        {/* Tabular List of Connected Peers */}
        <div className="flex flex-col gap-2">
          {MOCK_PEERS.map((peer, idx) => (
            <div key={peer.peerId} className="flex flex-col p-3 bg-surface-container rounded-lg shadow-sm gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${idx === 3 ? 'bg-secondary-container' : 'bg-tertiary'}`} />
                  <span className="font-headline-sm text-headline-sm text-on-surface truncate">{peer.peerId}</span>
                  <span className="px-1.5 py-0.5 bg-surface-container-lowest text-on-surface font-label-sm text-label-sm rounded uppercase shrink-0">
                    {idx === 0 ? 'DIRECT' : `${idx} HOP${idx > 1 ? 'S' : ''}`}
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-tertiary-container text-on-tertiary-container font-label-sm text-label-sm rounded uppercase font-bold shrink-0">
                  {idx === 3 ? 'LATENT' : idx === 0 ? '1.2 MB/S DC' : 'SYNCED'}
                </span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                <span>ROLE: {peer.deviceModel}</span>
                <span className={`font-mono font-semibold ${idx === 3 ? 'text-secondary' : 'text-tertiary'}`}>
                  {idx === 3 ? 'Synchronizing Clock...' : idx === 0 ? 'WebRTC Connected' : `${14 - idx * 4} Reports Exchanged`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Altruistic Mesh Routing: Pay It Forward Proxy Lending Card (Feature #6) */}
      <div className="flex flex-col p-4 bg-surface-container-lowest rounded-xl shadow-md border-2 border-primary gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-surface-container-high">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 bg-primary text-on-primary font-label-sm text-label-sm rounded uppercase font-extrabold shrink-0">
              FEATURE #6
            </span>
            <span className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-tight truncate">
              ALTRUISTIC "PAY IT FORWARD" PROXY UPLINK
            </span>
          </div>
          <span className="px-2 py-0.5 bg-secondary-container text-on-secondary font-label-sm text-label-sm rounded uppercase font-bold self-start sm:self-auto shrink-0 animate-pulse">
            RIDGE NODE DETECTED
          </span>
        </div>

        {/* Status Notice */}
        <div className="flex items-start gap-2 p-2.5 bg-surface-container rounded-lg border-l-4 border-secondary-container">
          <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">satellite_alt</span>
          <div className="flex flex-col text-on-surface">
            <span className="font-headline-sm text-headline-sm uppercase text-xs sm:text-sm font-bold">
              Ridge Node Ghoom-Peak-09 has 1-bar 2G/BSoD backhaul.
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant font-medium mt-0.5">
              Advertising WebRTC Proxy Tunnel! Mesh packets can hop to cellular uplink.
            </span>
          </div>
        </div>

        {/* Lending Toggle & Metric Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-surface-container-low rounded-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-[20px]">forward_to_inbox</span>
            <span className="font-label-md text-label-md text-on-surface font-bold uppercase">
              14 Offline Packets Lent &amp; Buffered for Egress
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">LEND CELLULAR:</span>
            <button
              type="button"
              onClick={() => setProxyEnabled(!proxyEnabled)}
              className={`px-2.5 py-1 ${proxyEnabled ? 'bg-tertiary text-on-tertiary' : 'bg-surface-variant text-on-surface'} font-label-sm text-label-sm rounded uppercase font-extrabold shadow-sm flex items-center gap-1 cursor-pointer`}
            >
              <span className={`w-2 h-2 rounded-full ${proxyEnabled ? 'bg-tertiary-fixed animate-ping' : 'bg-outline'}`} />
              <span>{proxyEnabled ? 'ENABLED' : 'DISABLED'}</span>
            </button>
          </div>
        </div>

        {/* Live Proxy Dispatch Queue */}
        <div className="flex flex-col gap-1.5 p-3 bg-inverse-surface text-inverse-on-surface rounded-lg font-mono text-[11px]">
          <div className="flex items-center justify-between text-tertiary-fixed font-bold border-b border-surface-variant/20 pb-1">
            <span>PIGGYBACK PROXY DISPATCH QUEUE &gt;&gt; GTA CENTRAL CLOUD</span>
            <span className="text-[9px] text-outline-variant uppercase">TUNNEL ACTIVE</span>
          </div>
          <div className="flex items-center justify-between text-surface-bright py-0.5">
            <span className="truncate">[QUEUED] Gangman Track Hazard #402 (Batasia Loop)</span>
            <span className="text-tertiary-fixed shrink-0 font-bold">PROXYING</span>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant py-0.5">
            <span className="truncate">[QUEUED] Sumo Commuter SOS Ping #88-Kurseong</span>
            <span className="text-secondary-fixed-dim shrink-0 font-bold">BUFFERED</span>
          </div>
        </div>
      </div>

      {/* Critical Emergency Relay Broadcaster Zone */}
      <div className="flex flex-col p-4 bg-surface-container-lowest rounded-xl shadow-lg gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">security</span>
            <span className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-tight">
              CRITICAL RELAY BROADCAST
            </span>
          </div>
          <span className="px-2 py-0.5 bg-on-surface text-surface-container-lowest font-label-sm text-label-sm rounded font-bold uppercase">
            Ed25519
          </span>
        </div>
        {/* Cryptographic GTA Public Key Verification Badge */}
        <div className="flex items-center justify-between p-2.5 bg-surface-container rounded-lg">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0">verified</span>
            <span className="font-label-sm text-label-sm text-on-surface font-mono truncate">
              Key: 8b21-4f1e-9a02-darj-auth
            </span>
          </div>
          <span className="px-1.5 py-0.5 bg-tertiary-container text-on-tertiary-container font-label-sm text-label-sm rounded font-bold uppercase shrink-0">
            VERIFIED GTA DISASTER CELL
          </span>
        </div>
        {/* High-Impact Emergency Broadcast Button */}
        <button
          type="button"
          onClick={handleEmergencyBroadcast}
          className="w-full h-touch-target-min flex items-center justify-center gap-2 bg-secondary-container text-on-secondary font-headline-sm text-headline-sm uppercase tracking-wider rounded-xl shadow-xl active:translate-y-0.5 transition-transform cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]">crisis_alert</span>
          <span className="text-center">BROADCAST EMERGENCY ALERT (P2P FLOOD ROUTING)</span>
        </button>

        {/* Hook A Cryptographic Tamper Test Trigger */}
        <button
          type="button"
          onClick={handleRunTamperTest}
          disabled={isVerifying}
          className="w-full h-touch-target-min px-3 py-2 bg-tertiary text-on-tertiary font-headline-sm text-headline-sm uppercase rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">lock</span>
          <span>{isVerifying ? 'Verifying ECDSA Signature...' : 'RUN HOOK A TAMPER DETECTION TEST'}</span>
        </button>

        {tamperStatus && (
          <div className="p-3 bg-surface-container rounded border border-outline-variant/30 font-label-sm text-label-sm text-on-surface leading-relaxed whitespace-pre-line font-mono">
            {tamperStatus}
          </div>
        )}

        {/* Real-time Yjs CRDT Vector Clock & Sync Readout Log */}
        <div className="flex flex-col p-3 bg-inverse-surface text-inverse-on-surface rounded-lg shadow-inner gap-1.5 font-mono">
          <div className="flex items-center justify-between text-[11px] pb-1 border-b border-surface-variant/20">
            <span className="text-tertiary-fixed font-bold">Yjs CRDT VECTOR CLOCK: [GTA:412, SLG:209, KUR:88]</span>
            <span className="text-on-surface-variant text-[10px]">
              {new Date().toLocaleTimeString()} NPT
            </span>
          </div>
          <div className="flex flex-col gap-1 text-[11px] leading-tight max-h-32 overflow-y-auto">
            {crdtLogs.map((log, idx) => (
              <div key={idx} className={`flex items-center justify-between ${log.color}`}>
                <span>{log.text}</span>
                {log.sub && <span className="text-[9px] text-outline-variant shrink-0 ml-2">{log.sub}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
