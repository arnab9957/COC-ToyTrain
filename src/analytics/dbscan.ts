import type { InspectionRecord } from '../types';

const EARTH_RADIUS_METERS = 6371000;

// Converts degrees to radians
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Computes geodesic distance in meters between two lat/lng points using Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Generates character 3-shingles for Jaccard Similarity comparison
 */
function get3Shingles(text: string): Set<string> {
  const sanitized = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  const shingles = new Set<string>();
  for (let i = 0; i <= sanitized.length - 3; i++) {
    shingles.add(sanitized.substring(i, i + 3));
  }
  return shingles;
}

/**
 * Calculates Jaccard Similarity ratio J(A, B) between two texts
 */
export function calculateJaccardSimilarity(textA: string, textB: string): number {
  const shinglesA = get3Shingles(textA);
  const shinglesB = get3Shingles(textB);

  if (shinglesA.size === 0 && shinglesB.size === 0) return 1.0;
  if (shinglesA.size === 0 || shinglesB.size === 0) return 0.0;

  let intersectionSize = 0;
  shinglesA.forEach((shingle) => {
    if (shinglesB.has(shingle)) {
      intersectionSize++;
    }
  });

  const unionSize = shinglesA.size + shinglesB.size - intersectionSize;
  return intersectionSize / unionSize;
}

export interface ClusterResult {
  clusterId: string;
  centroidLat: number;
  centroidLng: number;
  locationName: string;
  reports: InspectionRecord[];
  deduplicatedReport: InspectionRecord;
  hasConflict: boolean;
}

/**
 * Phase 1 & Phase 2 Spatial Haversine DBSCAN + Jaccard Deduplication Pipeline
 * EPSILON = 30 meters, MinPts = 2
 */
export function performDBSCANClustering(
  records: InspectionRecord[],
  epsilonMeters: number = 30,
  minPts: number = 2
): ClusterResult[] {
  const visited = new Set<string>();
  const clusteredRecords = new Set<string>();
  const clusters: ClusterResult[] = [];

  records.forEach((record) => {
    if (visited.has(record.id)) return;
    visited.add(record.id);

    // Find region neighbors within 30m epsilon
    const neighbors = records.filter(
      (other) =>
        calculateHaversineDistance(
          record.latitude,
          record.longitude,
          other.latitude,
          other.longitude
        ) <= epsilonMeters
    );

    if (neighbors.length >= minPts) {
      const clusterId = `cluster-${record.geohash}-${record.id.substring(0, 5)}`;
      const clusterMembers: InspectionRecord[] = [...neighbors];

      clusterMembers.forEach((member) => {
        visited.add(member.id);
        clusteredRecords.add(member.id);
      });

      // Calculate centroid
      const totalLat = clusterMembers.reduce((acc, r) => acc + r.latitude, 0);
      const totalLng = clusterMembers.reduce((acc, r) => acc + r.longitude, 0);
      const centroidLat = totalLat / clusterMembers.length;
      const centroidLng = totalLng / clusterMembers.length;

      // Jaccard Fuzzy Deduplication: Pick most descriptive report
      let bestReport = clusterMembers[0];
      let maxLen = bestReport.description.length;

      for (let i = 1; i < clusterMembers.length; i++) {
        const current = clusterMembers[i];
        const similarity = calculateJaccardSimilarity(
          bestReport.description,
          current.description
        );

        if (similarity >= 0.75) {
          // If similar, choose the longer / newest valid cryptographic signature report
          if (current.description.length > maxLen) {
            bestReport = current;
            maxLen = current.description.length;
          }
        }
      }

      // Check if reports in cluster have conflicting passable statuses
      const hasPassableConflict = clusterMembers.some(
        (m) => m.passable !== bestReport.passable
      );

      clusters.push({
        clusterId,
        centroidLat,
        centroidLng,
        locationName: bestReport.locationName,
        reports: clusterMembers,
        deduplicatedReport: bestReport,
        hasConflict: hasPassableConflict
      });
    }
  });

  // Handle unclustered noise points as single-member clusters
  records.forEach((record) => {
    if (!clusteredRecords.has(record.id)) {
      clusters.push({
        clusterId: `single-${record.id}`,
        centroidLat: record.latitude,
        centroidLng: record.longitude,
        locationName: record.locationName,
        reports: [record],
        deduplicatedReport: record,
        hasConflict: false
      });
    }
  });

  return clusters;
}
