/**
 * PahadSathi Zero-Trust Cryptographic Engine
 * Uses Browser WebCrypto API for on-device ECDSA (P-256) / SHA-256 signing and verification.
 * Enforces Hook A: Peer nodes verify signatures offline before inserting into Yjs CRDT registries.
 */

let keyPair: CryptoKeyPair | null = null;
let exportedPublicKeyHex: string = '';

// Helper to convert ArrayBuffer to Hex string
export function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper to convert Hex string to ArrayBuffer
export function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(Math.ceil(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer as ArrayBuffer;
}

// SHA-256 hash helper for photo binary assets
export async function computeSHA256(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

// Initialize on-device key pair
export async function initDeviceKeyPair(): Promise<{ publicKeyHex: string }> {
  if (keyPair && exportedPublicKeyHex) {
    return { publicKeyHex: exportedPublicKeyHex };
  }

  keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify']
  );

  const exported = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  exportedPublicKeyHex = bufferToHex(exported);
  return { publicKeyHex: exportedPublicKeyHex };
}

// Sign a report payload
export async function signReportPayload(payload: {
  geohash: string;
  timestamp: number;
  passable: boolean;
  photoHash: string;
}): Promise<{ signatureHex: string; publicKeyHex: string }> {
  if (!keyPair) {
    await initDeviceKeyPair();
  }

  const messageStr = `${payload.geohash}:${payload.timestamp}:${payload.passable}:${payload.photoHash}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(messageStr);

  const signatureBuffer = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    keyPair!.privateKey,
    data
  );

  return {
    signatureHex: bufferToHex(signatureBuffer),
    publicKeyHex: exportedPublicKeyHex
  };
}

// Verify a report payload signature (Zero-Trust Hook A)
export async function verifyReportSignature(
  payload: {
    geohash: string;
    timestamp: number;
    passable: boolean;
    photoHash: string;
  },
  signatureHex: string,
  publicKeyHex: string
): Promise<boolean> {
  try {
    const messageStr = `${payload.geohash}:${payload.timestamp}:${payload.passable}:${payload.photoHash}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(messageStr);

    const publicBuffer = hexToBuffer(publicKeyHex);
    const importedPublicKey = await crypto.subtle.importKey(
      'spki',
      publicBuffer,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['verify']
    );

    const signatureBuffer = hexToBuffer(signatureHex);
    const isValid = await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      importedPublicKey,
      signatureBuffer,
      data
    );

    return isValid;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}
