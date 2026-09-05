import Dexie, { type Table } from 'dexie';
import type { InspectionRecord, BinaryAsset, TrackSection, EmergencyAlert } from '../types';

export class PahadSathiDatabase extends Dexie {
  inspections!: Table<InspectionRecord, string>;
  binaryAssets!: Table<BinaryAsset, string>;
  trackSections!: Table<TrackSection, string>;
  emergencyAlerts!: Table<EmergencyAlert, string>;
  syncQueue!: Table<{ id: string; timestamp: number; payload: any; retryCount: number }, string>;

  constructor() {
    super('PahadSathiDatabase');
    
    this.version(1).stores({
      inspections: 'id, timestamp, corridor, locationName, geohash, severity, hazardScore, passable, isGangmanReport, trackSectionId',
      binaryAssets: 'photoHash', // SHA-256 hash as primary key for ArrayBuffer storage
      trackSections: 'id, code, status, hazardCoefficient',
      emergencyAlerts: 'id, timestamp, severity, corridor',
      syncQueue: 'id, timestamp'
    });
  }
}

export const db = new PahadSathiDatabase();

// Seed initial Darjeeling Himalayan Railway permanent-way track sections if empty
export async function initializeDatabaseSeed() {
  const sectionsCount = await db.trackSections.count();
  if (sectionsCount === 0) {
    const initialSections: TrackSection[] = [
      {
        id: 'sec-dhr-01',
        sectionName: 'Tindharia Workshop Sinking Curve',
        code: 'DHR-TDH-01',
        startKm: 24.5,
        endKm: 27.2,
        gangmanId: 'GANGMAN-UNIT-04',
        hazardCoefficient: 2.1,
        status: 'Nominal',
        lastInspected: Date.now() - 3600000 * 2,
        reportsCount: 1
      },
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
      },
      {
        id: 'sec-dhr-03',
        sectionName: 'Ghoom High-Altitude Summit Curve',
        code: 'DHR-GHM-03',
        startKm: 68.1,
        endKm: 71.4,
        gangmanId: 'GANGMAN-UNIT-02',
        hazardCoefficient: 5.2,
        status: 'Warning',
        lastInspected: Date.now() - 3600000 * 5,
        reportsCount: 2
      },
      {
        id: 'sec-dhr-04',
        sectionName: 'Kurseong Station Railway Section',
        code: 'DHR-KRG-04',
        startKm: 46.2,
        endKm: 48.9,
        gangmanId: 'GANGMAN-UNIT-06',
        hazardCoefficient: 1.8,
        status: 'Nominal',
        lastInspected: Date.now() - 3600000 * 1,
        reportsCount: 0
      }
    ];
    await db.trackSections.bulkAdd(initialSections);
  }

  const alertsCount = await db.emergencyAlerts.count();
  if (alertsCount === 0) {
    const initialAlerts: EmergencyAlert[] = [
      {
        id: 'alt-01',
        timestamp: Date.now() - 1800000,
        authority: 'Gorkha Territorial Administration (GTA)',
        title: 'Flash Flood Warning at Teesta Valley (NH-10)',
        message: 'Heavy monsoonal downpour triggered swelling Jhoras near 29th Mile. Debris flow expected. Avoid night travel.',
        severity: 'Critical',
        corridor: 'Teesta Valley (NH-10)'
      },
      {
        id: 'alt-02',
        timestamp: Date.now() - 5400000,
        authority: 'DHR Permanent-Way Inspection Cell',
        title: 'Paglajhora Sinking Track Caution',
        message: 'Active tension crack propagation detected along Hill Cart Road. Speed restriction of 5 km/h enforced for Gangmen and light vehicles.',
        severity: 'Warning',
        corridor: 'NH-55 (Hill Cart Road)'
      }
    ];
    await db.emergencyAlerts.bulkAdd(initialAlerts);
  }
}
