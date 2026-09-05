import React from 'react';
import type { Language } from '../types';

export type TabMode = 'route-board' | 'geo-camera' | 'p2p-mesh' | 'gangman-log' | 'vault-diagnostics';

interface NavbarProps {
  activeTab: TabMode;
  setActiveTab: (tab: TabMode) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  meshPeersCount: number;
  storageFreePercent: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  meshPeersCount,
  storageFreePercent
}) => {
  return (
    <>
      {/* Sleek Top Header */}
      <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b-2 border-black shadow-sm">
        <div className="max-w-7xl mx-auto h-16 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3">
          {/* Logo & Branding */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-blue-600 border-2 border-black flex items-center justify-center text-white font-extrabold shadow-[2px_2px_0px_#000] shrink-0">
              <span className="material-symbols-outlined text-[20px]">mountain_flag</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="font-mono text-sm sm:text-base text-black font-extrabold tracking-tight truncate">
                  PahadSathi
                </span>
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono border border-emerald-400 rounded font-bold uppercase shrink-0">
                  OFFLINE
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-gray-600 font-bold font-mono truncate">
                पहाड साथी • Darjeeling Corridor
              </span>
            </div>
          </div>

          {/* Top Controls: Language & Mesh Telemetry */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="relative">
              <select
                value={language.toLowerCase()}
                onChange={(e) => setLanguage(e.target.value.toUpperCase() as Language)}
                className="h-8 pl-2 pr-6 bg-gray-100 text-black text-xs font-mono font-bold rounded-lg border-2 border-black appearance-none outline-none cursor-pointer shadow-[1.5px_1.5px_0px_#000]"
              >
                <option value="ne">नेपाली</option>
                <option value="bn">বাংলা</option>
                <option value="hi">हिन्दी</option>
                <option value="en">English</option>
              </select>
              <span className="material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[16px] text-black">
                expand_more
              </span>
            </div>

            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-900 border-2 border-black rounded-lg text-[11px] sm:text-xs font-mono font-bold shadow-[1.5px_1.5px_0px_#000]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="whitespace-nowrap">{meshPeersCount} PEERS</span>
            </div>
          </div>
        </div>
      </header>

      {/* Sleek Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full z-50 bg-white border-t-2 border-black shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto flex items-center justify-around h-16 px-2">
          {[
            { id: 'route-board', label: 'Routes', icon: 'map' },
            { id: 'geo-camera', label: 'Camera AI', icon: 'photo_camera' },
            { id: 'p2p-mesh', label: 'Offline Mesh', icon: 'hub' },
            { id: 'gangman-log', label: 'Gangman Log', icon: 'engineering' },
            { id: 'vault-diagnostics', label: 'Vault', icon: 'storage' }
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabMode)}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all cursor-pointer ${
                  isActive
                    ? 'text-blue-700 font-extrabold bg-blue-50/80 border-t-2 border-blue-700'
                    : 'text-gray-600 hover:text-black hover:bg-gray-50'
                }`}
              >
                <span className={`material-symbols-outlined ${isActive ? 'text-[24px]' : 'text-[22px]'}`}>{item.icon}</span>
                <span className="text-[11px] font-mono mt-0.5 font-bold uppercase tracking-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
