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
  meshPeersCount
}) => {
  return (
    <>
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto h-full px-4 flex items-center justify-between gap-3">
          {/* Logo & App Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/logo.jpg"
              alt="PahadSathi Logo"
              style={{
                width: '36px',
                height: '36px',
                minWidth: '36px',
                minHeight: '36px',
                maxWidth: '36px',
                maxHeight: '36px',
                objectFit: 'cover',
                borderRadius: '10px'
              }}
              className="border border-gray-300 shadow-sm shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-sans text-base text-gray-900 font-extrabold tracking-tight truncate">
                  PahadSathi
                </span>
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-sans border border-emerald-300 rounded-full font-bold uppercase shrink-0">
                  OFFLINE
                </span>
              </div>
              <span className="text-[11px] text-gray-500 font-medium font-sans truncate mt-0.5">
                पहाड साथी • Hill Safety Navigation
              </span>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <select
                value={language.toLowerCase()}
                onChange={(e) => setLanguage(e.target.value.toUpperCase() as Language)}
                className="h-9 pl-2.5 pr-7 bg-amber-50 text-gray-900 text-xs font-sans font-bold rounded-lg border border-amber-300 appearance-none outline-none cursor-pointer shadow-sm focus:ring-2 focus:ring-amber-400"
              >
                <option value="ne">🇳🇵 नेपाली</option>
                <option value="bn">🇮🇳 বাংলা</option>
                <option value="hi">🇮🇳 हिन्दी</option>
                <option value="en">🇬🇧 English</option>
              </select>
              <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[18px] text-gray-700">
                expand_more
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-around h-full px-2">
          {[
            { id: 'route-board', label: 'Road Status', icon: 'map' },
            { id: 'geo-camera', label: 'Camera AI', icon: 'photo_camera' },
            { id: 'p2p-mesh', label: 'Mesh', icon: 'hub' },
            { id: 'gangman-log', label: 'Field Log', icon: 'engineering' },
            { id: 'vault-diagnostics', label: 'Vault', icon: 'storage' }
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabMode)}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'text-blue-600 font-bold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <div className={`flex items-center justify-center px-3 py-0.5 rounded-full transition-all ${
                  isActive ? 'bg-blue-100 text-blue-700' : ''
                }`}>
                  <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                </div>
                <span className="text-[10px] font-sans mt-0.5 font-bold tracking-tight">
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



