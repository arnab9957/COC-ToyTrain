import React, { useState } from 'react';
import type { TrackSection, InspectionRecord, Language } from '../types';
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
  const [selectedAnomalies, setSelectedAnomalies] = useState<string[]>(['soil_slip', 'drain_block']);
  const [selectedSectionId, setSelectedSectionId] = useState<string>(sections[0]?.id || 'sec-dhr-02');
  const [description, setDescription] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const selectedSection = sections.find((s) => s.id === selectedSectionId) || sections[0];

  const toggleAnomalyCheck = (anomaly: string) => {
    setSelectedAnomalies((prev) =>
      prev.includes(anomaly) ? prev.filter((a) => a !== anomaly) : [...prev, anomaly]
    );
  };

  const handleLogPWayAudit = (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = Date.now();

    const newRecord: InspectionRecord = {
      id: `gangman-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp,
      corridor: 'NH-55 (Hill Cart Road)',
      locationName: selectedSection.sectionName,
      latitude: 26.8921,
      longitude: 88.2714,
      geohash: 'tu11a',
      anomalyTypes: selectedAnomalies.includes('gauge_spread') ? ['rail_misalignment'] : ['tension_crack'],
      severity: selectedSeverity === 'critical' ? 'Critical' : selectedSeverity === 'monitor' ? 'High' : 'Low',
      hazardScore: selectedSeverity === 'critical' ? 9.2 : 6.4,
      passable: selectedSeverity !== 'critical',
      description: description || `Gangman P-Way Audit: Logged ${selectedAnomalies.join(', ')} along DHR ${selectedSection.code}.`,
      aiDiagnostic: `⚠️ GANGMAN P-WAY AUDIT (DHR)\nSection ${selectedSection.code} chainage KP 34.2 requires track inspection by Unit ${selectedSection.gangmanId}.`,
      language,
      photoHash: `gangman-hash-${timestamp}`,
      signature: 'gangman-sig-valid-01',
      publicKey: 'gangman-pub-key-01',
      verified: true,
      isGangmanReport: true,
      trackSectionId: selectedSection.id
    };

    onAddGangmanReport(newRecord);
    setDescription('');
  };

  const handleTriggerGatewaySync = () => {
    setIsSyncing(true);
    setSyncStatusMsg('Pinging Ghoom Station Gateway endpoint (http://192.168.43.1:8080)...');

    setTimeout(() => {
      onSimulateStationSync();
      setIsSyncing(false);
      setSyncStatusMsg('✅ Auto-Sync Complete! Queued inspection logs pushed via idempotent HTTP POST.');
      setTimeout(() => setSyncStatusMsg(null), 5000);
    }, 1500);
  };

  return (
    <div className="flex flex-col w-full gap-gap-default">
      {/* Heritage & Sector Badge Header */}
      <section className="bg-surface-container-high rounded-xl p-3 shadow-md flex flex-col gap-2 border border-outline-variant/30">
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

      {/* Target Section Dropdown */}
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

      {/* Audit Submission Form */}
      <form onSubmit={handleLogPWayAudit} className="flex flex-col gap-4">
        {/* Step 1: Severity Matrix Selector */}
        <section className="bg-surface-container-lowest rounded-xl p-3 shadow-md flex flex-col gap-2 border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <span className="font-headline-sm text-headline-sm text-on-surface uppercase flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[12px] flex items-center justify-center font-bold">1</span>
              Severity Matrix
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">Single Selection</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'routine', title: 'LOW / ROUTINE', desc: 'Scheduled seasonal monitoring', bg: 'bg-surface-container-low', text: 'text-on-surface' },
              { id: 'monitor', title: 'MODERATE / MONITOR', desc: 'Speed caution flag advisory', bg: 'bg-secondary-fixed', text: 'text-on-secondary-fixed' },
              { id: 'critical', title: 'CRITICAL / HALT CORRIDOR', desc: 'Immediate red lamp flagout required', bg: 'bg-error-container', text: 'text-on-error-container' }
            ].map((sev) => (
              <label
                key={sev.id}
                onClick={() => setSelectedSeverity(sev.id as any)}
                className={`flex items-center justify-between p-3 min-h-[56px] ${sev.bg} rounded-xl cursor-pointer shadow-sm active:scale-[0.98] transition-all`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-4 h-4 rounded-full ${
                    selectedSeverity === sev.id ? 'bg-primary shadow' : 'bg-surface-variant'
                  }`} />
                  <div className="flex flex-col">
                    <span className={`font-headline-sm text-headline-sm ${sev.text}`}>{sev.title}</span>
                    <span className={`font-body-sm text-body-sm opacity-90 ${sev.text}`}>{sev.desc}</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[24px]">
                  {selectedSeverity === sev.id ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Step 2: Track Anomaly Checkboxes */}
        <section className="bg-surface-container-lowest rounded-xl p-3 shadow-md flex flex-col gap-2 border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <span className="font-headline-sm text-headline-sm text-on-surface uppercase flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[12px] flex items-center justify-center font-bold">2</span>
              Track Anomaly Types
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">MULTI-CHECK</span>
          </div>

          <div className="flex flex-col gap-2">
            {[
              { id: 'soil_slip', title: 'Soil Slip Under Track Sleeper', desc: 'Ballast erosion on down-valley slope edge', factor: '+0.40' },
              { id: 'boulder', title: 'Boulder / Rockfall Obstruction', desc: 'Up-slope shale detachment over track bed', factor: '+0.55' },
              { id: 'drain_block', title: 'Blocked Mountain Drain (Jhora)', desc: 'Mud overflow scouring stone substructure', factor: '+0.25' },
              { id: 'stone_wall', title: 'Damaged Stone Retaining Wall', desc: 'Bulging masonry revetment under rail bench', factor: '+0.45' },
              { id: 'gauge_spread', title: 'Rail Gauge Distortion / Buckling', desc: 'Spread exceeding ±8mm tolerance limit', factor: '+0.80' }
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

        {/* Text Notes */}
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

        {/* Submit Audit Button */}
        <button
          type="submit"
          className="w-full min-h-[56px] px-4 py-3 bg-primary text-on-primary font-headline-sm text-headline-sm uppercase rounded-xl flex items-center justify-center gap-3 shadow-md cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]">railway_alert</span>
          <span>Log Permanent-Way Audit</span>
        </button>
      </form>

      {/* Station Wi-Fi Gateway Auto-Sync & HOOK B Section Hazard Coefficient Dashboard */}
      <section className="bg-surface-container-lowest rounded-xl p-3 shadow-md border border-outline-variant/30 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
          <div>
            <h3 className="font-headline-sm text-headline-sm uppercase text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[22px]">monitoring</span>
              <span>Hook B: Section Hazard Coefficient Dashboard (H_S)</span>
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

        {syncStatusMsg && (
          <div className="p-2.5 bg-tertiary-container text-on-tertiary-container rounded font-label-sm text-label-sm font-bold">
            {syncStatusMsg}
          </div>
        )}

        <div className="p-2.5 bg-surface-container-low rounded font-mono text-xs text-on-surface">
          Equation: H_S = &sum; W_type(i) &middot; &Phi;_i &middot; e<sup>-&lambda; (T_now - T_i)</sup>
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
