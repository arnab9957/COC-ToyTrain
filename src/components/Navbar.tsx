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
      {/* Top Header matching Stitch UI design */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] border-b border-outline-variant/30">
        <div className="max-w-2xl mx-auto h-24 px-4 flex flex-col justify-between py-2">
          {/* Top Row: Logo & Profile Status */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/logo.jpg"
                alt="PahadSathi Emblem"
                style={{
                  width: '36px',
                  height: '36px',
                  minWidth: '36px',
                  minHeight: '36px',
                  maxWidth: '36px',
                  maxHeight: '36px',
                  objectFit: 'cover',
                  borderRadius: '8px'
                }}
                className="shadow-sm shrink-0 border border-black/10"
              />
              <div className="flex flex-col truncate">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-headline-sm text-base text-on-surface uppercase tracking-tight font-extrabold">
                    PahadSathi
                  </span>
                  <span className="px-1.5 py-0.5 bg-on-surface text-surface-container-lowest font-label-sm text-[10px] rounded font-bold uppercase">
                    OFFLINE PWA
                  </span>
                </div>
                <span className="font-body-sm text-[11px] text-on-surface-variant font-bold truncate mt-0.5">
                  पहाड साथी • DARJEELING SECTOR
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm">
                <span className="material-symbols-outlined text-[18px]">person</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Language Selector, Mesh Status, Storage Status */}
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex items-center">
              <select
                value={language.toLowerCase()}
                onChange={(e) => setLanguage(e.target.value.toUpperCase() as Language)}
                className="h-7 pl-2 pr-6 bg-surface-container-lowest text-on-surface font-label-md text-xs rounded border border-outline-variant/40 appearance-none outline-none cursor-pointer font-bold shadow-sm"
              >
                <option value="ne">नेपाली (Nepali)</option>
                <option value="bn">বাংলা (Bengali)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="en">English</option>
              </select>
              <span className="material-symbols-outlined absolute right-1 pointer-events-none text-[16px] text-on-surface">
                expand_more
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-on-surface text-surface-container-lowest rounded shrink-0">
              <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
              <span className="font-label-sm text-[11px] uppercase font-bold">⚡ MESH: {meshPeersCount} PEERS</span>
            </div>

            <div className="flex items-center gap-1 px-2 py-0.5 bg-tertiary-container text-on-tertiary-container rounded shrink-0 font-bold text-[11px]">
              <span>💾 {storageFreePercent}% FREE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-surface-container-lowest border-t border-outline-variant/40 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto flex items-center justify-around h-full px-1">
          {[
            { id: 'route-board', label: 'Road Status', icon: 'map' },
            { id: 'geo-camera', label: 'Camera AI', icon: 'photo_camera' },
            { id: 'p2p-mesh', label: 'Mesh Relay', icon: 'hub' },
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
                    ? 'text-primary font-extrabold border-t-2 border-primary bg-primary/5'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span className={`material-symbols-outlined ${isActive ? 'text-[24px]' : 'text-[22px]'}`}>{item.icon}</span>
                <span className="font-label-sm text-[10px] mt-0.5 font-bold uppercase tracking-tight">
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




