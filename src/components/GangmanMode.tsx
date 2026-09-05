import React, { useState } from 'react';
import { 
  Train, 
  ShieldAlert, 
  Activity, 
  CheckCircle, 
  RefreshCw, 
  MapPin, 
  Wrench, 
  Clock, 
  Zap, 
  Radio, 
  Server,
  Layers
} from 'lucide-react';
import type { TrackSection, InspectionRecord, Language } from '../types';
import { calculateSectionHazardCoefficient } from '../analytics/hazardCalculator';

interface GangmanModeProps {
  language: Language;
  sections: TrackSection[];
  inspections: InspectionRecord[];
  onAddGangmanReport: (record: InspectionRecord) => void;
  onSimulateStationSync: () => void;
}

export const GangmanMode: React.FC<GangmanModeProps> = ({
  language,
  sections,
  inspections,
  onAddGangmanReport,
  onSimulateStationSync
}) => {
  const [selectedSectionId, setSelectedSectionId] = useState(sections[0]?.id || 'sec-dhr-02');
  const [anomalyType, setAnomalyType] = useState<'rail_misalignment' | 'tension_crack' | 'rockfall' | 'blocked_drain'>('rail_misalignment');
  const [description, setDescription] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const selectedSection = sections.find(s => s.id === selectedSectionId) || sections[0];

  // Handle Gangman Track Audit Log Submission
  const handleLogTrackInspection = (e: React.FormEvent) => {
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
      anomalyTypes: [anomalyType],
      severity: anomalyType === 'rail_misalignment' ? 'Critical' : 'High',
      hazardScore: 8.8,
      passable: anomalyType !== 'rail_misalignment',
      description: description || `Gangman P-Way Audit: Detected ${anomalyType.replace(/_/g, ' ')} along ${selectedSection.code}.`,
      aiDiagnostic: `⚠️ GANGMAN P-WAY AUDIT (DHR)\nSection ${selectedSection.code} requires immediate track alignment verification by Unit ${selectedSection.gangmanId}.`,
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

  // Station Gateway Auto-Sync Simulator (C1 Logic)
  const handleTriggerGatewaySync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg('Pinging Ghoom Station Gateway endpoint (http://192.168.43.1:8080)...');

    setTimeout(() => {
      onSimulateStationSync();
      setIsSyncing(false);
      setSyncStatusMsg('✅ Auto-Sync Complete! 4 inspection logs pushed via idempotent HTTP POST.');
      setTimeout(() => setSyncStatusMsg(null), 5000);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="card bg-gradient-to-r from-purple-950/80 via-slate-900 to-slate-900 border-purple-500/40 p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600 rounded-xl shadow-lg shadow-purple-600/30">
              <Train className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">Gangman Track Logbook (C1)</h2>
                <span className="badge bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  DHR Permanent-Way Inspection
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Darjeeling Himalayan Railway (DHR) Section-Wise Track Dashboard & Geotechnical Hazard Calculator
              </p>
            </div>
          </div>

          <button
            onClick={handleTriggerGatewaySync}
            disabled={isSyncing}
            className="btn bg-purple-600 hover:bg-purple-700 text-white text-xs py-2 px-4 shadow-lg shadow-purple-600/20"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Syncing with Station Hub...</span>
              </>
            ) : (
              <>
                <Server className="w-4 h-4" />
                <span>Station Wi-Fi Gateway Auto-Sync</span>
              </>
            )}
          </button>
        </div>

        {syncStatusMsg && (
          <div className="mt-3 p-2.5 bg-emerald-950/80 border border-emerald-500/40 rounded-lg text-xs font-mono text-emerald-300">
            {syncStatusMsg}
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form to log permanent-way audit */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Wrench className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-white text-base">New Track Inspection Entry</h3>
            </div>

            <form onSubmit={handleLogTrackInspection} className="space-y-4">
              {/* Select Track Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target DHR Railway Section
                </label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                >
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.code} - {sec.sectionName} (Km {sec.startKm} - {sec.endKm})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Anomaly */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Track / Slope Anomaly Type
                </label>
                <select
                  value={anomalyType}
                  onChange={(e) => setAnomalyType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="rail_misalignment">DHR Rail Shear / Misalignment (W = 0.50)</option>
                  <option value="tension_crack">Tension Crack / Dhar Slip (W = 0.40)</option>
                  <option value="rockfall">Rockfall Debris / Pahira (W = 0.35)</option>
                  <option value="blocked_drain">Swelling Jhora / Blocked Drain (W = 0.10)</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Gangman Field Inspection Notes
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Record track gauge displacement, ballast washout, or retaining wall movement..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="btn bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white w-full py-2.5 text-sm font-bold shadow-lg shadow-purple-600/30"
              >
                <Train className="w-4 h-4" />
                <span>Log Permanent-Way Audit</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: HOOK B Section Hazard Coefficient Dashboard */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  <span>HOOK B: Section Hazard Coefficient Dashboard (H_S)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Calculates real-time geotechnical risk score with 24-hour temporal decay &lambda;
                </p>
              </div>
              <span className="badge badge-purple font-mono">Formal Equation H_S</span>
            </div>

            {/* Formula Teaser Box */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-purple-200">
              H_S = &sum; W_type(i) &middot; &Phi;_i &middot; e<sup>-&lambda; (T_now - T_i)</sup>
            </div>

            {/* Section Risk Cards List */}
            <div className="space-y-3">
              {sections.map((section) => {
                const { hazardCoefficient, status, activeContributions } = calculateSectionHazardCoefficient(section, inspections);

                return (
                  <div
                    key={section.id}
                    className={`p-4 rounded-xl border space-y-3 transition-all ${
                      status === 'Critical'
                        ? 'bg-red-950/30 border-red-500/60 shadow-lg shadow-red-950/40'
                        : status === 'Warning'
                        ? 'bg-amber-950/30 border-amber-500/60'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-purple-300 border border-slate-700">
                            {section.code}
                          </span>
                          <h4 className="font-bold text-sm text-white">{section.sectionName}</h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Assigned: <span className="text-slate-200 font-semibold">{section.gangmanId}</span> | Km {section.startKm} to {section.endKm}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Hazard Score H_S</span>
                          <span className={`text-lg font-extrabold font-mono ${
                            status === 'Critical' ? 'text-red-400' :
                            status === 'Warning' ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {hazardCoefficient}
                          </span>
                        </div>

                        <span className={`badge ${
                          status === 'Critical' ? 'badge-red' :
                          status === 'Warning' ? 'badge-amber' : 'badge-green'
                        }`}>
                          {status === 'Critical' ? 'CRITICAL (RED ALERT)' :
                           status === 'Warning' ? 'WARNING (AMBER)' : 'NOMINAL (GREEN)'}
                        </span>
                      </div>
                    </div>

                    {/* Active Contributions breakdown */}
                    {activeContributions.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1">
                        <span className="text-[11px] font-semibold text-slate-400 block">
                          Active Hazard Contribution Vectors:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeContributions.map((c, i) => (
                            <span key={i} className="text-[10px] font-mono px-2 py-0.5 bg-slate-950 text-slate-300 rounded border border-slate-800">
                              {c.anomalyType} (W={c.weight}, &lambda;={c.decayFactor}) = +{c.contribution}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
