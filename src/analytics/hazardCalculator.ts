import type { InspectionRecord, TrackSection } from '../types';

// Anomaly type weights
const ANOMALY_WEIGHTS: Record<string, number> = {
  tension_crack: 0.40, // Soil slip precursor
  rockfall: 0.35,      // Rockfall debris
  damaged_retaining_wall: 0.15,
  blocked_drain: 0.10,
  rail_misalignment: 0.50, // Permanent-way track shear
  water_seepage: 0.25
};

// Severity multipliers (Phi_i)
const SEVERITY_MULTIPLIERS: Record<string, number> = {
  Low: 1.0,
  Moderate: 1.5,
  High: 2.0,
  Critical: 3.0
};

// Decay constant lambda: 24-hour half-life (in milliseconds)
const DECAY_LAMBDA = Math.LN2 / (24 * 3600 * 1000);

/**
 * Hook B: Railway Section Hazard Coefficient Equation
 * H_S = sum( W_type(i) * Phi_i * e^(-lambda * (T_now - T_i)) )
 */
export function calculateSectionHazardCoefficient(
  section: TrackSection,
  reports: InspectionRecord[],
  nowTimestamp: number = Date.now()
): {
  hazardCoefficient: number;
  status: 'Nominal' | 'Warning' | 'Critical';
  activeContributions: Array<{
    reportId: string;
    anomalyType: string;
    weight: number;
    decayFactor: number;
    contribution: number;
  }>;
} {
  let totalHazard = 0;
  const activeContributions: Array<{
    reportId: string;
    anomalyType: string;
    weight: number;
    decayFactor: number;
    contribution: number;
  }> = [];

  // Filter reports associated with this railway section or nearby geohash/location
  const sectionReports = reports.filter(r => 
    r.trackSectionId === section.id || 
    r.locationName.toLowerCase().includes(section.sectionName.toLowerCase().split(' ')[0]) ||
    r.isGangmanReport
  );

  sectionReports.forEach(report => {
    const ageMs = Math.max(0, nowTimestamp - report.timestamp);
    const decayFactor = Math.exp(-DECAY_LAMBDA * ageMs);
    const phi = SEVERITY_MULTIPLIERS[report.severity] || 1.0;

    report.anomalyTypes.forEach(anomaly => {
      const weight = ANOMALY_WEIGHTS[anomaly] || 0.20;
      const contribution = weight * phi * decayFactor;
      totalHazard += contribution;

      activeContributions.push({
        reportId: report.id,
        anomalyType: anomaly,
        weight,
        decayFactor: Number(decayFactor.toFixed(3)),
        contribution: Number(contribution.toFixed(2))
      });
    });
  });

  const hazardCoefficient = Number(totalHazard.toFixed(1));

  let status: 'Nominal' | 'Warning' | 'Critical' = 'Nominal';
  if (hazardCoefficient >= 10.0) {
    status = 'Critical';
  } else if (hazardCoefficient >= 4.5) {
    status = 'Warning';
  }

  return {
    hazardCoefficient,
    status,
    activeContributions
  };
}
