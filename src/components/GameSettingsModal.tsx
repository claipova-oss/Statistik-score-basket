import React, { useState } from 'react';
import { Settings, X, CheckCircle, RotateCcw } from 'lucide-react';
import { GameSettings, Team } from '../types/basketball';

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onSaveSettings: (newSettings: GameSettings) => void;
  teamA: Team;
  teamB: Team;
  onUpdateTeams: (teamA: Partial<Team>, teamB: Partial<Team>) => void;
  onResetMatch: () => void;
}

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  teamA,
  teamB,
  onUpdateTeams,
  onResetMatch,
}) => {
  const [quarterMinutes, setQuarterMinutes] = useState(settings.quarterMinutes);
  const [enableShotClock, setEnableShotClock] = useState(settings.enableShotClock);
  const [shotClockSeconds, setShotClockSeconds] = useState(settings.shotClockSeconds);
  const [maxPersonalFouls, setMaxPersonalFouls] = useState(settings.maxPersonalFouls);
  const [bonusFoulThreshold, setBonusFoulThreshold] = useState(settings.bonusFoulThreshold);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);

  const [teamAName, setTeamAName] = useState(teamA.name);
  const [teamBName, setTeamBName] = useState(teamB.name);
  const [teamAColor, setTeamAColor] = useState(teamA.primaryColor);
  const [teamBColor, setTeamBColor] = useState(teamB.primaryColor);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      quarterMinutes,
      enableShotClock,
      shotClockSeconds,
      maxPersonalFouls,
      bonusFoulThreshold,
      soundEnabled,
    });

    onUpdateTeams(
      {
        name: teamAName.trim() || teamA.name,
        primaryColor: teamAColor,
        shortName: (teamAName.trim() || teamA.name).substring(0, 3).toUpperCase(),
      },
      {
        name: teamBName.trim() || teamB.name,
        primaryColor: teamBColor,
        shortName: (teamBName.trim() || teamB.name).substring(0, 3).toUpperCase(),
      }
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl text-white relative my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-bold">Pengaturan Pertandingan</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="space-y-4 py-4 text-xs sm:text-sm">
          
          {/* Quarter Length */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <label className="font-semibold text-slate-200 block mb-1">
              Durasi Tiap Kuartal (Menit):
            </label>
            <div className="flex items-center gap-2 mt-2">
              {[5, 8, 10, 12].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setQuarterMinutes(mins)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                    quarterMinutes === mins
                      ? 'bg-orange-600 border-orange-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  {mins} Menit {mins === 10 ? '(FIBA)' : mins === 12 ? '(NBA)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Shot Clock */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-200 block">Shot Clock (24 Detik)</span>
              <span className="text-xs text-slate-400">Aktifkan batas waktu penyerangan 24s/14s</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableShotClock}
                onChange={(e) => setEnableShotClock(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {/* Foul Limits */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <label className="font-semibold text-slate-200 block mb-1">
                Batas Foul Pemain (Foul Out):
              </label>
              <select
                value={maxPersonalFouls}
                onChange={(e) => setMaxPersonalFouls(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value={5}>5 Fouls (Standar FIBA)</option>
                <option value={6}>6 Fouls (Standar NBA)</option>
              </select>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <label className="font-semibold text-slate-200 block mb-1">
                Ambang Bonus Team Foul:
              </label>
              <select
                value={bonusFoulThreshold}
                onChange={(e) => setBonusFoulThreshold(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value={4}>4 Fouls</option>
                <option value={5}>5 Fouls (Standar)</option>
              </select>
            </div>
          </div>

          {/* Team Name Customization */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="font-semibold text-slate-200 block">Nama & Warna Tim</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tim A (Home):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={teamAColor}
                    onChange={(e) => setTeamAColor(e.target.value)}
                    className="w-7 h-7 rounded bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={teamAName}
                    onChange={(e) => setTeamAName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Tim B (Away):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={teamBColor}
                    onChange={(e) => setTeamBColor(e.target.value)}
                    className="w-7 h-7 rounded bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={teamBName}
                    onChange={(e) => setTeamBName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Reset Game Section */}
          <div className="pt-2">
            <button
              onClick={() => {
                if (window.confirm('Yakin ingin mereset skor, riwayat, dan statistik pertandingan ini ke awal?')) {
                  onResetMatch();
                  onClose();
                }
              }}
              className="w-full py-2.5 px-4 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-900/60 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset & Mulai Pertandingan Baru (0 - 0)</span>
            </button>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>

      </div>
    </div>
  );
};
