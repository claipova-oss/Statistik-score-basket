import React from 'react';
import { Volume2, VolumeX, Maximize, Minimize, Settings, Upload, RotateCcw, FileText } from 'lucide-react';

interface ScoreboardHeaderProps {
  activeTab: 'court' | 'boxscore' | 'history';
  setActiveTab: (tab: 'court' | 'boxscore' | 'history') => void;
  onOpenUpload: () => void;
  onOpenSettings: () => void;
  onResetMatch: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const ScoreboardHeader: React.FC<ScoreboardHeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
  onOpenSettings,
  onResetMatch,
  soundEnabled,
  onToggleSound,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <header className="no-print bg-slate-900 border-b border-slate-800 text-white select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center font-scoreboard font-black text-xl text-white shadow-sm">
            H
          </div>
          <div className="flex flex-col">
            <span className="font-scoreboard text-xl font-bold tracking-tight text-white leading-tight">
              HOOPSCORE<span className="text-orange-500 font-black">ID</span>
            </span>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Pencatat Poin Basket Sederhana
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('court')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'court'
                ? 'bg-orange-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Papan Skor & Lapangan
          </button>
          <button
            onClick={() => setActiveTab('boxscore')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'boxscore'
                ? 'bg-orange-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Statistik & Box Score
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-orange-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Riwayat Pertandingan
          </button>
        </nav>

        {/* Zone 3: Primary Action & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Buzzer Aktif' : 'Buzzer Hening'}
            aria-label="Toggle Buzzer Sound"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-orange-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh (Papan Skor)'}
            aria-label="Toggle Fullscreen"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors hidden sm:flex items-center justify-center"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            title="Pengaturan Pertandingan"
            aria-label="Settings"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Reset Game */}
          <button
            onClick={onResetMatch}
            title="Mulai Pertandingan Baru"
            aria-label="Reset Match"
            className="p-2 text-slate-300 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Upload Roster CTA */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs sm:text-sm px-3.5 py-2 rounded-lg transition-colors shadow-sm whitespace-nowrap"
          >
            <Upload className="w-4 h-4" />
            <span>Unggah Roster</span>
          </button>
        </div>
      </div>
    </header>
  );
};
