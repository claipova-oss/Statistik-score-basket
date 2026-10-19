import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, ArrowLeft, ArrowRight, Plus, Minus, BellRing } from 'lucide-react';
import { Team, Quarter, GameSettings } from '../types/basketball';

interface ScoreboardDisplayProps {
  teamA: Team;
  teamB: Team;
  quarter: Quarter;
  setQuarter: (q: Quarter) => void;
  secondsRemaining: number;
  setSecondsRemaining: (sec: number | ((prev: number) => number)) => void;
  isClockRunning: boolean;
  setIsClockRunning: (running: boolean) => void;
  shotClock: number;
  setShotClock: (sec: number | ((prev: number) => number)) => void;
  isShotClockRunning: boolean;
  setIsShotClockRunning: (running: boolean) => void;
  possession: 'A' | 'B' | null;
  setPossession: (p: 'A' | 'B' | null) => void;
  settings: GameSettings;
  onTeamPointAdd: (teamId: 'A' | 'B', points: number) => void;
  onTeamFoulAdd: (teamId: 'A' | 'B') => void;
  onTeamTimeoutUse: (teamId: 'A' | 'B') => void;
  onPlayBuzzer: () => void;
  onResetClock: () => void;
}

const QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4', 'OT1', 'OT2'];

export const ScoreboardDisplay: React.FC<ScoreboardDisplayProps> = ({
  teamA,
  teamB,
  quarter,
  setQuarter,
  secondsRemaining,
  setSecondsRemaining,
  isClockRunning,
  setIsClockRunning,
  shotClock,
  setShotClock,
  possession,
  setPossession,
  settings,
  onTeamPointAdd,
  onTeamFoulAdd,
  onTeamTimeoutUse,
  onPlayBuzzer,
  onResetClock,
}) => {
  const [showTimeAdjust, setShowTimeAdjust] = useState(false);

  // Format MM:SS or SS.S
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleNextQuarter = () => {
    const curIdx = QUARTERS.indexOf(quarter);
    if (curIdx < QUARTERS.length - 1) {
      setQuarter(QUARTERS[curIdx + 1]);
      setSecondsRemaining(settings.quarterMinutes * 60);
      setShotClock(settings.shotClockSeconds);
      setIsClockRunning(false);
    }
  };

  const handlePrevQuarter = () => {
    const curIdx = QUARTERS.indexOf(quarter);
    if (curIdx > 0) {
      setQuarter(QUARTERS[curIdx - 1]);
    }
  };

  const adjustSeconds = (delta: number) => {
    setSecondsRemaining((prev) => Math.max(0, prev + delta));
  };

  const resetShotClock = (seconds: number) => {
    setShotClock(seconds);
  };

  return (
    <section className="bg-slate-950 border-b border-slate-800 text-white p-4 sm:p-6 shadow-xl relative overflow-hidden select-none">
      {/* Background Court Line Graphic */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full border-8 border-white" />
        <div className="absolute h-full w-[2px] bg-white" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          
          {/* ================= TEAM A CARD ================= */}
          <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
            {/* Team Info Header */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: teamA.primaryColor }}
                  />
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                    Tuan Rumah (Home)
                  </span>
                </div>
                {possession === 'A' && (
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold px-2 py-0.5 rounded">
                    POSESSI BOLA
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold truncate tracking-tight text-white" title={teamA.name}>
                {teamA.name}
              </h2>
            </div>

            {/* Score Big Display */}
            <div className="my-3 text-center">
              <div className="font-scoreboard font-black text-6xl sm:text-7xl lg:text-8xl tabular-nums text-white tracking-tighter drop-shadow-sm">
                {teamA.score}
              </div>
            </div>

            {/* Team Fouls, Timeouts & Possession */}
            <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-b border-slate-800/80 mb-3">
              <div className="flex items-center justify-between bg-slate-800/60 px-2.5 py-1.5 rounded-lg">
                <span className="text-slate-400">Pelanggaran Tim</span>
                <span className={`font-bold font-scoreboard text-base tabular-nums ${teamA.fouls >= settings.bonusFoulThreshold ? 'text-red-400' : 'text-slate-200'}`}>
                  {teamA.fouls}
                  {teamA.fouls >= settings.bonusFoulThreshold && (
                    <span className="text-[10px] ml-1 bg-red-950 text-red-400 border border-red-800 px-1 py-0.2 rounded font-sans">
                      BONUS
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-800/60 px-2.5 py-1.5 rounded-lg">
                <span className="text-slate-400">Time Out</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold font-scoreboard text-base tabular-nums text-slate-200">
                    {teamA.timeoutsLeft}
                  </span>
                  <button
                    onClick={() => onTeamTimeoutUse('A')}
                    disabled={teamA.timeoutsLeft <= 0}
                    title="Gunakan Time Out"
                    className="ml-1 text-[10px] px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 rounded text-white transition-colors"
                  >
                    Pakai
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Scoring Buttons */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                onClick={() => onTeamPointAdd('A', 1)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-scoreboard font-bold text-base sm:text-lg py-2 rounded-lg transition-colors border border-slate-700 active:scale-95 flex flex-col items-center justify-center leading-none"
              >
                +1
                <span className="text-[9px] font-sans font-normal text-slate-400 mt-0.5">FT</span>
              </button>
              <button
                onClick={() => onTeamPointAdd('A', 2)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-scoreboard font-bold text-base sm:text-lg py-2 rounded-lg transition-colors border border-slate-700 active:scale-95 flex flex-col items-center justify-center leading-none"
              >
                +2
                <span className="text-[9px] font-sans font-normal text-slate-400 mt-0.5">FG</span>
              </button>
              <button
                onClick={() => onTeamPointAdd('A', 3)}
                className="bg-orange-600/90 hover:bg-orange-500 text-white font-scoreboard font-bold text-base sm:text-lg py-2 rounded-lg transition-colors border border-orange-500/60 active:scale-95 flex flex-col items-center justify-center leading-none shadow-sm"
              >
                +3
                <span className="text-[9px] font-sans font-normal text-orange-200 mt-0.5">3PT</span>
              </button>
              <button
                onClick={() => onTeamPointAdd('A', -1)}
                disabled={teamA.score <= 0}
                title="Koreksi Kurangi 1 Poin"
                className="bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 text-slate-400 hover:text-red-400 font-scoreboard font-bold text-base sm:text-lg py-2 rounded-lg transition-colors border border-slate-700/60 active:scale-95 flex flex-col items-center justify-center leading-none"
              >
                -1
                <span className="text-[9px] font-sans font-normal text-slate-400 mt-0.5">Undo</span>
              </button>
            </div>
          </div>

          {/* ================= CENTER CONSOLE (CLOCK, QUARTER, SHOT CLOCK) ================= */}
          <div className="lg:col-span-4 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between items-center text-center shadow-lg">
            
            {/* Quarter Selector */}
            <div className="w-full flex items-center justify-between bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={handlePrevQuarter}
                disabled={QUARTERS.indexOf(quarter) === 0}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-800 rounded-lg transition-colors"
                title="Kuartal Sebelumnya"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                  Kuartal:
                </span>
                <span className="font-scoreboard font-black text-xl text-orange-400 tracking-wider">
                  {quarter}
                </span>
              </div>

              <button
                onClick={handleNextQuarter}
                disabled={QUARTERS.indexOf(quarter) === QUARTERS.length - 1}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-800 rounded-lg transition-colors"
                title="Kuartal Selanjutnya"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Game Clock Display */}
            <div className="my-2 flex flex-col items-center">
              <div
                className={`font-digital font-black text-6xl sm:text-7xl lg:text-7xl tracking-wider tabular-nums ${
                  secondsRemaining <= 10 && secondsRemaining > 0
                    ? 'text-red-500 animate-pulse'
                    : secondsRemaining === 0
                    ? 'text-red-500'
                    : 'text-amber-400'
                }`}
              >
                {formatTime(secondsRemaining)}
              </div>

              {/* Main Clock Controls */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setIsClockRunning(!isClockRunning)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md active:scale-95 ${
                    isClockRunning
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isClockRunning ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" /> Jeda (Pause)
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" /> Mulai (Start)
                    </>
                  )}
                </button>

                <button
                  onClick={onResetClock}
                  title="Reset Waktu Kuartal"
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={onPlayBuzzer}
                  title="Bunyikan Klakson / Buzzer Arena"
                  className="p-2.5 bg-red-600/90 hover:bg-red-500 text-white rounded-xl border border-red-500 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                >
                  <BellRing className="w-4 h-4" />
                  <span className="hidden sm:inline">Buzzer</span>
                </button>
              </div>

              {/* Toggle Time Fine Adjustments */}
              <div className="mt-2">
                <button
                  onClick={() => setShowTimeAdjust(!showTimeAdjust)}
                  className="text-[11px] text-slate-400 hover:text-slate-200 underline underline-offset-2 transition-colors"
                >
                  {showTimeAdjust ? 'Sembunyikan Pengatur Waktu' : 'Sesuaikan Detik/Menit'}
                </button>
              </div>

              {showTimeAdjust && (
                <div className="flex items-center gap-1 mt-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => adjustSeconds(-60)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                  >
                    -1m
                  </button>
                  <button
                    onClick={() => adjustSeconds(-10)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                  >
                    -10s
                  </button>
                  <button
                    onClick={() => adjustSeconds(10)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                  >
                    +10s
                  </button>
                  <button
                    onClick={() => adjustSeconds(60)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                  >
                    +1m
                  </button>
                </div>
              )}
            </div>

            {/* Shot Clock & Possession Switcher */}
            <div className="w-full grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
              {/* Shot Clock */}
              {settings.enableShotClock ? (
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Shot Clock
                  </span>
                  <div className={`font-digital font-black text-2xl tabular-nums ${shotClock <= 5 ? 'text-red-500 animate-pulse' : 'text-red-400'}`}>
                    {shotClock}s
                  </div>
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={() => resetShotClock(24)}
                      className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 rounded text-slate-200 border border-slate-700"
                    >
                      24s
                    </button>
                    <button
                      onClick={() => resetShotClock(14)}
                      className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 rounded text-slate-200 border border-slate-700"
                    >
                      14s
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-center text-xs text-slate-500">
                  Shot Clock Nonaktif
                </div>
              )}

              {/* Possession Arrow Selector */}
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Penguasaan Bola
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <button
                    onClick={() => setPossession('A')}
                    className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
                      possession === 'A'
                        ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    ◀ {teamA.shortName || 'A'}
                  </button>
                  <button
                    onClick={() => setPossession('B')}
                    className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
                      possession === 'B'
                        ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {teamB.shortName || 'B'} ▶
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* ================= TEAM B CARD ================= */}
          <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
            {/* Team Info Header */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                {possession === 'B' ? (
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold px-2 py-0.5 rounded">
                    POSESSI BOLA
                  </span>
                ) : <div />}
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                    Tamu (Away)
                  </span>
                  <div
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: teamB.primaryColor }}
                  />
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold truncate tracking-tight text-white text-right" title={teamB.name}>
                {teamB.name}
              </h2>
            </div>

            {/* Score Big Display */}
            <div className="my-3 text-center">
              <div className="font-scoreboard font-black text-6xl sm:text-7xl lg:text-8xl tabular-nums text-white tracking-tighter drop-shadow-sm">
                {teamB.score}
              </div>
            </div>

            {/* Team Fouls, Timeouts & Possession */}
            <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-b border-slate-800/80 mb-3">
              <div className="flex items-center justify-between bg-slate-800/60 px-2.5 py-1.5 rounded-lg">
                <span className="text-slate-400">Pelanggaran Tim</span>
                <span className={`font-bold font-scoreboard text-base tabular-nums ${teamB.fouls >= settings.bonusFoulThreshold ? 'text-red-400' : 'text-slate-200'}`}>
                  {teamB.fouls}
                  {teamB.fouls >= settings.bonusFoulThreshold && (
                    <span className="text-[10px] ml-1 bg-red-950 text-red-400 border border-red-800 px-1 py-0.2 rounded font-sans">
                      BONUS
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-800/60 px-2.5 py-1.5 rounded-lg">
                <span className="text-slate-400">Time Out</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold font-scoreboard text-base tabular-nums text-slate-200">
                    {teamB.timeoutsLeft}
                  </span>
                  <button
                    onClick={() => onTeamTimeoutUse('B')}
                    disabled={teamB.timeoutsLeft <= 0}
                    title="Gunakan Time Out"
                    className="ml-1 text-[10px] px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 rounded text-white transition-colors"
                  >
                    Pakai
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Scoring Buttons */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                onClick={() => onTeamPointAdd('B', 1)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-scoreboard font-bold text-base sm:text-lg py-2 rounded-lg transition-colors border border-slate-700 active:scale-95 flex flex-col items-center justify-center leading-none"
              >
                +1
                <span className="text-[9px] font-sans font-normal text-slate-400 mt-0.5">FT</span>
              </button>
              <button
                onClick={() => onTeamPointAdd('B', 2)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-scoreboard font-bold text-base sm:text-lg py-2 rounded-lg transition-colors border border-slate-700 active:scale-95 flex flex-col items-center justify-center leading-none"
              >
                +2
                <span className="text-[9px] font-sans font-normal text-slate-400 mt-0.5">FG</span>
              </button>
              <button
                onClick={() => onTeamPointAdd('B', 3)}
                className="bg-orange-600/90 hover:bg-orange-500 text-white font-scoreboard font-bold text-base sm:text-lg py-2 rounded-lg transition-colors border border-orange-500/60 active:scale-95 flex flex-col items-center justify-center leading-none shadow-sm"
              >
                +3
                <span className="text-[9px] font-sans font-normal text-orange-200 mt-0.5">3PT</span>
              </button>
              <button
                onClick={() => onTeamPointAdd('B', -1)}
                disabled={teamB.score <= 0}
                title="Koreksi Kurangi 1 Poin"
                className="bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 text-slate-400 hover:text-red-400 font-scoreboard font-bold text-base sm:text-lg py-2 rounded-lg transition-colors border border-slate-700/60 active:scale-95 flex flex-col items-center justify-center leading-none"
              >
                -1
                <span className="text-[9px] font-sans font-normal text-slate-400 mt-0.5">Undo</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
