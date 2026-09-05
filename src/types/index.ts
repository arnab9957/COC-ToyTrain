export type AnomalyType = 
  | 'tension_crack' 
  | 'water_seepage' 
  | 'rockfall' 
  | 'damaged_retaining_wall' 
  | 'rail_misalignment' 
  | 'blocked_drain';

export type Language = 'NE' | 'BN' | 'HI' | 'EN';

export type LLMModel = 'gemma-2-2b' | 'gemma-3-4b' | 'llama-3.2-1b' | 'ollama-local';

export type TransitCorridor = 
  | 'NH-55 (Hill Cart Road)' 
  | 'Rohini Road' 
  | 'Pankhabari Road' 
  | 'Teesta Valley (NH-10)' 
  | 'Dudhia Balasun Bridge';

export interface InspectionRecord {
  id: string;
  timestamp: number;
  corridor: TransitCorridor;
  locationName: string;
  latitude: number;
  longitude: number;
  geohash: string;
  anomalyTypes: AnomalyType[];
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  hazardScore: number;
  passable: boolean;
  description: string;
  aiDiagnostic: string;
  language: Language;
  photoHash: string;
  signature: string;
  publicKey: string;
  verified: boolean;
  isGangmanReport: boolean;
  trackSectionId?: string;
  boundingBoxes?: Array<{
    label: string;
    score: number;
    box: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0..1
  }>;
}

export interface BinaryAsset {
  photoHash: string;
  data: ArrayBuffer;
  contentType: string;
}

export interface TrackSection {
  id: string;
  sectionName: string;
  code: string;
  startKm: number;
  endKm: number;
  gangmanId: string;
  hazardCoefficient: number;
  status: 'Nominal' | 'Warning' | 'Critical';
  lastInspected: number;
  reportsCount: number;
}

export interface MeshPeer {
  peerId: string;
  deviceModel: string;
  ipAddress: string;
  cellId: string;
  isBridgeNode: boolean;
  lastSeen: number;
}

export interface EmergencyAlert {
  id: string;
  timestamp: number;
  authority: string;
  title: string;
  message: string;
  severity: 'Critical' | 'Warning';
  corridor: string;
}

export interface CorridorStatus {
  corridor: TransitCorridor;
  passable: boolean;
  activeHazardsCount: number;
  lastReportTimestamp: number;
  summary: string;
  criticalSpots: string[];
}
