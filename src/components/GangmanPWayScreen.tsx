import React, { useState } from 'react';
import type { TrackSection, InspectionRecord, Language, AnomalyType } from '../types';
import { calculateSectionHazardCoefficient } from '../analytics/hazardCalculator';

interface GangmanPWayScreenProps {
  language: Language;
  sections: TrackSection[];
  inspections: InspectionRecord[];
  onAddGangmanReport: (record: InspectionRecord) => void;
  onSimulateStationSync: () => void;
}

export const GangmanPWayScreen: React.FC<GangmanPWayScreenProps> = ({
  language,
  sections,
  inspections,
  onAddGangmanReport,
  onSimulateStationSync
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<'routine' | 'monitor' | 'critical'>('monitor');
  const [selectedAnomalies, setSelectedAnomalies] = useState<AnomalyType[]>(['tension_crack', 'blocked_drain']);
  const [selectedSectionId, setSelectedSectionId] = useState<string>(sections[0]?.id || 'sec-dhr-02');
  const [description, setDescription] = useState('');
  const [isRelockingGps, setIsRelockingGps] = useState(false);
  const [coords, setCoords] = useState({ lat: 26.95318, lon: 88.27412, geohash: 'tu327b9x', acc: '±1.8m (RTK-FINE)' });
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const selectedSection = sections.find((s) => s.id === selectedSectionId) || sections[0];

  const toggleAnomalyCheck = (anomalyId: AnomalyType) => {
    setSelectedAnomalies((prev) =>
      prev.includes(anomalyId) ? prev.filter((a) => a !== anomalyId) : [...prev, anomalyId]
    );
  };

  // Dynamic Hazard Calculation logic based on Stitch prototype formula
  const getSeverityWeight = () => {
    if (selectedSeverity === 'critical') return 7.8;
    if (selectedSeverity === 'monitor') return 3.5;
    return 1.2;
  };

  const getAnomalySum = () => {
    const weights: Record<AnomalyType, number> = {
      tension_crack: 0.40,
      rockfall: 0.55,
      blocked_drain: 0.25,
      damaged_retaining_wall: 0.45,
      rail_misalignment: 0.80,
      water_seepage: 0.35
    };
    return selectedAnomalies.reduce((sum, key) => sum + (weights[key] || 0), 0);
  };

  const baseWeight = getSeverityWeight();
  const anomalySum = getAnomalySum();
  const slopeMultiplier = 1.8;
  let calculatedHs = Math.min(9.95, Math.max(0.8, baseWeight + (anomalySum * slopeMultiplier * 2.5)));
  const formattedHs = calculatedHs.toFixed(2);
  const meterPct = Math.min(100, Math.max(5, (calculatedHs / 10) * 100));

  let hazardTag = 'AMBER CAUTION';
  let hazardTagClass = 'bg-secondary-container text-on-secondary-container';
  let meterBarClass = 'bg-secondary-container';
  let advisoryText = 'Speed restriction required: 10 km/h for DHR Toy Train B-Class steam rakes.';

  if (calculatedHs >= 8.0) {
    hazardTag = 'HALT / CRITICAL';
    hazardTagClass = 'bg-error-container text-on-error-container';
    meterBarClass = 'bg-error';
    advisoryText = 'TRAIN SUSPENSION MANDATORY: Immediate red signal flag at Sonada Station.';
  } else if (calculatedHs < 4.5) {
    hazardTag = 'ROUTINE PASS';
    hazardTagClass = 'bg-tertiary-container text-on-tertiary-container';
    meterBarClass = 'bg-tertiary';
    advisoryText = 'Normal gauge operational limits. Line speed up to 25 km/h permitted.';
  }

  const handleRelockGps = () => {
    setIsRelockingGps(true);
    setTimeout(() => {
      const rLat = (26.95310 + Math.random() * 0.00030).toFixed(5);
      const rLon = (88.27410 + Math.random() * 0.00030).toFixed(5);
      setCoords({
        lat: parseFloat(rLat),
        lon: parseFloat(rLon),
        geohash: `tu327b${Math.floor(Math.random() * 80 + 10)}`,
        acc: '±1.4m (RTK-FINE)'
      });
      setIsRelockingGps(false);
      showToast('High-Accuracy RTK Fix Acquired (±1.4m)');
    }, 750);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleEnqueueAudit = (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = Date.now();

    const newRecord: InspectionRecord = {
      id: `gangman-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp,
      corridor: 'NH-55 (Hill Cart Road)',
      locationName: selectedSection?.sectionName || 'Whistle Khola KP 34.2',
      latitude: coords.lat,
      longitude: coords.lon,
      geohash: coords.geohash,
      anomalyTypes: selectedAnomalies,
      severity: selectedSeverity === 'critical' ? 'Critical' : selectedSeverity === 'monitor' ? 'High' : 'Low',
      hazardScore: calculatedHs,
      passable: selectedSeverity !== 'critical',
      description: description || `Gangman P-Way Audit: Logged ${selectedAnomalies.join(', ')} along DHR ${selectedSection?.code}.`,
      aiDiagnostic: `⚠️ GANGMAN P-WAY AUDIT (DHR)\nSection ${selectedSection?.code} chainage KP 34.2 (Hs: ${formattedHs}). Direct action enqueued.`,
      language,
      photoHash: `gangman-hash-${timestamp}`,
      signature: 'gangman-sig-valid-01',
      publicKey: 'gangman-pub-key-01',
      verified: true,
      isGangmanReport: true,
      trackSectionId: selectedSection?.id
    };

    onAddGangmanReport(newRecord);
    setDescription('');
    showToast('ENTRY STORED IN Y-CRDT DB & BROADCAST TO MESH');
  };

  const handleTriggerGatewaySync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      onSimulateStationSync();
      setIsSyncing(false);
      showToast('✅ Auto-Sync Complete! Queued inspection logs pushed via HTTP.');
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full gap-gap-default">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed top-24 left-4 right-4 z-50 p-3 bg-on-surface text-surface-container-lowest rounded-xl font-label-md text-label-md uppercase tracking-wider flex items-center gap-2 shadow-xl animate-bounce">
          <span className="material-symbols-outlined text-tertiary-fixed text-[20px]">cloud_done</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Heritage & Sector Badge Header */}
      <section className="bg-surface-container-high rounded-xl p-3 shadow-md flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary-container text-[28px]">railway_alert</span>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface uppercase">
                Gangman's P-Way Logbook
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">
                DHR UNESCO HERITAGE TRANSIT DIV. #04
              </span>
            </div>
          </div>
          <span className="px-2 py-1 bg-primary text-on-primary font-label-sm text-label-sm rounded uppercase tracking-wider font-extrabold shadow-sm">
            P-WAY C1
          </span>
        </div>

        {/* Section Telemetry Ribbon */}
        <div className="bg-surface-container-lowest rounded-lg p-2.5 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center justify-between font-label-md text-label-md text-on-surface font-bold">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-primary">route</span>
              KURSEONG ⟶ SONADA ALIGNMENT
            </span>
            <span className="bg-surface-variant px-1.5 py-0.5 rounded text-on-surface font-extrabold">
              CHAINAGE KP 34.2
            </span>
          </div>
          <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
            <span>Ghoom High-Curve Sector</span>
            <span className="font-bold text-tertiary">TRACK GAUGE: 610mm (2FT NARROW)</span>
          </div>
        </div>
      </section>

      {/* Target Section Selector */}
      <div className="flex flex-col gap-1 p-3 bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant/30">
        <label className="font-headline-sm text-headline-sm uppercase text-on-surface">Target DHR Railway Section</label>
        <select
          value={selectedSectionId}
          onChange={(e) => setSelectedSectionId(e.target.value)}
          className="w-full bg-surface-container-low border border-outline-variant/40 rounded p-2 font-label-sm text-label-sm text-on-surface outline-none cursor-pointer"
        >
          {sections.map((sec) => (
            <option key={sec.id} value={sec.id}>
              {sec.code} - {sec.sectionName} (Km {sec.startKm} - {sec.endKm})
            </option>
          ))}
        </select>
      </div>

      {/* Step 1: Severity Matrix Selector (Min 56px touch target cards) */}
      <section className="bg-surface-container-lowest rounded-xl p-3 shadow-md flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-headline-sm text-headline-sm text-on-surface uppercase flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[12px] flex items-center justify-center font-bold">1</span>
            Severity Matrix
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Single Selection</span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {/* Routine */}
          <label
            onClick={() => setSelectedSeverity('routine')}
            className={`flex items-center justify-between p-3 min-h-[56px] ${
              selectedSeverity === 'routine' ? 'bg-surface-container border-2 border-tertiary' : 'bg-surface-container-low'
            } rounded-xl cursor-pointer shadow-sm active:scale-[0.98] transition-all`}
          >
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-tertiary shadow-sm" />
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-surface">LOW / ROUTINE</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Scheduled seasonal monitoring</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[24px]">
              {selectedSeverity === 'routine' ? 'check_circle' : 'radio_button_unchecked'}
            </span>
          </label>

          {/* Monitor / Warning */}
          <label
            onClick={() => setSelectedSeverity('monitor')}
            className={`flex items-center justify-between p-3 min-h-[56px] ${
              selectedSeverity === 'monitor' ? 'bg-secondary-fixed border-2 border-secondary' : 'bg-secondary-fixed/70'
            } rounded-xl cursor-pointer shadow-sm active:scale-[0.98] transition-all`}
          >
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-secondary-container shadow-sm" />
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-secondary-fixed">MODERATE / MONITOR</span>
                <span className="font-body-sm text-body-sm text-on-secondary-fixed-variant">Speed caution flag advisory</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-secondary text-[24px]">
              {selectedSeverity === 'monitor' ? 'check_circle' : 'radio_button_unchecked'}
            </span>
          </label>

          {/* Critical Corridor Halt */}
          <label
            onClick={() => setSelectedSeverity('critical')}
            className={`flex items-center justify-between p-3 min-h-[56px] ${
              selectedSeverity === 'critical' ? 'bg-error-container border-2 border-error' : 'bg-error-container/70'
            } rounded-xl cursor-pointer shadow-sm active:scale-[0.98] transition-all`}
          >
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-error animate-pulse shadow-sm" />
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-error-container uppercase">CRITICAL / HALT CORRIDOR</span>
                <span className="font-body-sm text-body-sm text-on-error-container">Immediate red lamp flagout required</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-error-container text-[24px]">
              {selectedSeverity === 'critical' ? 'check_circle' : 'radio_button_unchecked'}
            </span>
          </label>
        </div>
      </section>

      {/* Step 2: Anomaly Category Checkboxes */}
      <section className="bg-surface-container-lowest rounded-xl p-3 shadow-md flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-headline-sm text-headline-sm text-on-surface uppercase flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[12px] flex items-center justify-center font-bold">2</span>
            Track Anomaly Types
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">MULTI-CHECK</span>
        </div>

        <div className="flex flex-col gap-2">
          {[
            { id: 'tension_crack' as AnomalyType, title: 'Soil Slip Under Track Sleeper', desc: 'Ballast erosion on down-valley slope edge', factor: '+0.40' },
            { id: 'rockfall' as AnomalyType, title: 'Boulder / Rockfall Obstruction', desc: 'Up-slope shale detachment over track bed', factor: '+0.55' },
            { id: 'blocked_drain' as AnomalyType, title: 'Blocked Mountain Drain (Jhora)', desc: 'Mud overflow scouring stone substructure', factor: '+0.25' },
            { id: 'damaged_retaining_wall' as AnomalyType, title: 'Damaged Stone Retaining Wall', desc: 'Bulging masonry revetment under rail bench', factor: '+0.45' },
            { id: 'rail_misalignment' as AnomalyType, title: 'Rail Gauge Distortion / Buckling', desc: 'Spread exceeding ±8mm tolerance limit', factor: '+0.80' }
          ].map((item) => (
            <label
              key={item.id}
              onClick={() => toggleAnomalyCheck(item.id)}
              className="flex items-center justify-between p-3 min-h-[56px] bg-surface-container-low rounded-xl cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedAnomalies.includes(item.id)}
                  onChange={() => {}}
                  className="w-6 h-6 rounded accent-primary cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface">{item.title}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{item.desc}</span>
                </div>
              </div>
              <span className="font-label-sm text-label-sm px-2 py-0.5 bg-surface-container-high rounded text-on-surface font-extrabold">
                {item.factor}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Step 3: WICG High-Accuracy Geolocation Lock */}
      <section className="bg-surface-container-lowest rounded-xl p-3 shadow-md flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="font-headline-sm text-headline-sm text-on-surface uppercase flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[12px] flex items-center justify-center font-bold">3</span>
            WICG Geo-Lock Rig
          </span>
          <span className="px-2 py-0.5 bg-tertiary-container text-on-tertiary-container font-label-sm text-label-sm rounded font-extrabold">
            LOCK ENGAGED
          </span>
        </div>

        {/* Geohash & Coordinate Readout Strip */}
        <div className="bg-surface-container-high rounded-lg p-3 flex flex-col gap-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface font-bold">
              GEOHASH: <span className="text-primary font-extrabold">{coords.geohash}</span>
            </span>
            <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-surface-container-lowest rounded text-tertiary font-extrabold">
              ACC: {coords.acc}
            </span>
          </div>
          <div className="font-body-md text-body-md text-on-surface font-extrabold font-mono">
            {coords.lat}° N, {coords.lon}° E
          </div>
          <div className="flex items-center gap-1 text-on-surface-variant font-body-sm text-body-sm pt-1">
            <span className="material-symbols-outlined text-[16px] text-secondary">alt_route</span>
            <span className="font-bold text-on-surface">KP 34.2 Near Whistle Khola Culvert #12</span>
          </div>
        </div>

        {/* High-Accuracy Relock Trigger (≥56px) */}
        <button
          type="button"
          onClick={handleRelockGps}
          disabled={isRelockingGps}
          className="w-full min-h-[56px] px-4 py-3 bg-surface-container-high text-primary font-headline-sm text-headline-sm uppercase rounded-xl flex items-center justify-center gap-2 shadow-sm active:bg-surface-container-highest active:scale-[0.98] transition-all cursor-pointer"
        >
          <span className={`material-symbols-outlined text-[24px] ${isRelockingGps ? 'animate-spin' : ''}`}>
            satellite_alt
          </span>
          <span>{isRelockingGps ? 'Locking Satellite Constellation...' : 'Re-Lock Geolocation (WICG Fine)'}</span>
        </button>
      </section>

      {/* Local Geotechnical Hazard Calculator Widget */}
      <section className="bg-surface-container rounded-xl p-3 shadow-md flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary-container text-[20px]">calculate</span>
            <span className="font-headline-sm text-headline-sm text-on-surface uppercase">Geotechnical Hazard Calc</span>
          </div>
          <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded font-extrabold ${hazardTagClass}`}>
            {hazardTag}
          </span>
        </div>

        {/* Hazard Coefficient Metric & Breakdown */}
        <div className="bg-surface-container-lowest rounded-lg p-3 flex flex-col gap-2 shadow-sm">
          <div className="flex items-baseline justify-between">
            <span className="font-body-md text-body-md text-on-surface-variant font-bold">Track Hazard Coefficient (Hs)</span>
            <span className="font-display-mobile text-display-mobile text-secondary-container font-extrabold font-mono">
              {formattedHs}
            </span>
          </div>

          {/* Meter Progress Bar */}
          <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden flex">
            <div className={`h-full ${meterBarClass} transition-all duration-300`} style={{ width: `${meterPct}%` }} />
          </div>
          <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant font-bold">
            <span>0.0 ROUTINE</span>
            <span>5.0 CAUTION</span>
            <span>10.0 HALT CORRIDOR</span>
          </div>

          {/* Real-time formula breakdown */}
          <div className="p-2 bg-surface-container rounded text-on-surface font-body-sm text-body-sm flex flex-col gap-0.5">
            <span className="font-bold text-on-surface font-label-sm text-label-sm">TELEMETRY DECOMPOSITION:</span>
            <span className="text-on-surface-variant font-body-sm text-body-sm font-mono">
              Hs: Base({baseWeight.toFixed(1)}) + Factors({anomalySum.toFixed(2)}) &times; Slope({slopeMultiplier}) ={' '}
              <strong className="text-on-surface">{formattedHs}</strong>
            </span>
          </div>

          {/* Operational Directive Message */}
          <div className="flex items-center gap-2 p-2 bg-secondary-fixed rounded text-on-secondary-fixed">
            <span className="material-symbols-outlined text-[20px] text-secondary shrink-0">speed</span>
            <span className="font-body-sm text-body-sm font-bold">{advisoryText}</span>
          </div>
        </div>
      </section>

      {/* Step 4: Primary Offline Persistence CTA (Touch target ≥56px) */}
      <section className="flex flex-col gap-2">
        <div className="p-3 bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant/30 space-y-1">
          <label className="font-headline-sm text-headline-sm uppercase text-on-surface block">Gangman Field Notes</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Record track gauge displacement, ballast washout..."
            className="w-full bg-surface-container-low border border-outline-variant/40 rounded p-2 font-label-sm text-label-sm text-on-surface outline-none"
          />
        </div>

        <button
          type="button"
          onClick={handleEnqueueAudit}
          className="w-full min-h-[56px] px-4 py-3 bg-primary-container text-on-primary-container font-headline-sm text-headline-sm uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]">save</span>
          <span>Enqueue To Offline Work Logbook</span>
        </button>
        <div className="flex items-center justify-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
          <span className="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
          <span>INDEXEDDB &amp; Y-CRDT AUTO-MESH PERSISTENCE ARMED</span>
        </div>
      </section>

      {/* Inspection History Preview (Cached Logs) */}
      <section className="bg-surface-container-lowest rounded-xl p-3 shadow-md flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-headline-sm text-headline-sm text-on-surface uppercase flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[20px]">history_edu</span>
            Cached Gang Records (Past 3 Shifts)
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">SECTOR #04</span>
        </div>
        <div className="flex flex-col gap-2">
          {inspections.slice(0, 4).map((record) => (
            <div key={record.id} className="bg-surface-container-low p-2.5 rounded-lg flex flex-col gap-1 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface font-bold truncate">
                  {record.locationName}
                </span>
                <span className={`px-1.5 py-0.2 font-label-sm text-label-sm rounded font-extrabold uppercase shrink-0 ${
                  record.severity === 'Critical' ? 'bg-error-container text-on-error-container' : record.severity === 'High' ? 'bg-secondary-container text-on-secondary-container' : 'bg-tertiary-container text-on-tertiary-container'
                }`}>
                  {record.severity}
                </span>
              </div>
              <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
                <span>{new Date(record.timestamp).toLocaleTimeString()} • Gang Audit</span>
                <span className="font-bold text-on-surface">Hs {record.hazardScore.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hook B: Section Hazard Coefficient Dashboard */}
      <section className="bg-surface-container-lowest rounded-xl p-3 shadow-md border border-outline-variant/30 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
          <div>
            <h3 className="font-headline-sm text-headline-sm uppercase text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[22px]">monitoring</span>
              <span>Hook B: Section Hazard Dashboard (H_S)</span>
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Evaluates track risk with 24-hour temporal decay &lambda;
            </p>
          </div>

          <button
            type="button"
            onClick={handleTriggerGatewaySync}
            disabled={isSyncing}
            className="h-touch-target-min px-3 py-2 bg-surface-container-highest text-on-surface font-label-sm text-label-sm uppercase font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">dns</span>
            <span>{isSyncing ? 'Syncing...' : 'Station Gateway Sync'}</span>
          </button>
        </div>

        <div className="space-y-3">
          {sections.map((sec) => {
            const { hazardCoefficient, status, activeContributions } = calculateSectionHazardCoefficient(sec, inspections);

            return (
              <div
                key={sec.id}
                className="p-3 bg-surface-container-low rounded-xl shadow-sm border border-outline-variant/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold px-1.5 py-0.5 bg-on-surface text-surface rounded">
                      {sec.code}
                    </span>
                    <h4 className="font-headline-sm text-headline-sm text-on-surface inline-block ml-2">{sec.sectionName}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-label-sm text-label-sm font-bold uppercase ${
                    status === 'Critical' ? 'bg-error-container text-on-error-container' : status === 'Warning' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-tertiary-container text-on-tertiary-container'
                  }`}>
                    {status} (H_S: {hazardCoefficient})
                  </span>
                </div>

                <div className="font-body-sm text-body-sm text-on-surface-variant flex justify-between">
                  <span>Gangman Unit: {sec.gangmanId}</span>
                  <span>Chainage: Km {sec.startKm} - {sec.endKm}</span>
                </div>

                {activeContributions.length > 0 && (
                  <div className="pt-1.5 border-t border-outline-variant/20 flex flex-wrap gap-1">
                    {activeContributions.map((c, i) => (
                      <span key={i} className="font-mono text-[9px] px-1.5 py-0.5 bg-surface-container text-on-surface rounded font-bold">
                        {c.anomalyType} = +{c.contribution}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
