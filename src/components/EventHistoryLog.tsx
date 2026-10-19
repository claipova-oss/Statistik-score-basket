import React, { useState } from 'react';
import { Undo2, Trash2, Filter, Clock, ShieldAlert } from 'lucide-react';
import { MatchEvent, Team } from '../types/basketball';

interface EventHistoryLogProps {
  events: MatchEvent[];
  teamA: Team;
  teamB: Team;
  onUndoLastEvent: () => void;
  onDeleteEvent: (eventId: string) => void;
}

export const EventHistoryLog: React.FC<EventHistoryLogProps> = ({
  events,
  teamA,
  teamB,
  onUndoLastEvent,
  onDeleteEvent,
}) => {
  const [filter, setFilter] = useState<'all' | 'A' | 'B' | 'points' | 'fouls'>('all');

  const filteredEvents = events.filter((e) => {
    if (filter === 'A') return e.teamId === 'A';
    if (filter === 'B') return e.teamId === 'B';
    if (filter === 'points') return e.pointsDelta > 0;
    if (filter === 'fouls') return e.type === 'FOUL';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        
        {/* Header & Undo */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">Riwayat Pertandingan (Play-by-Play)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Catatan kronologis setiap poin, pelanggaran, dan peristiwa pertandingan.
            </p>
          </div>

          <button
            onClick={onUndoLastEvent}
            disabled={events.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors border border-slate-700 active:scale-95 shadow-sm"
          >
            <Undo2 className="w-4 h-4 text-orange-400" />
            <span>Batalkan Aksi Terakhir (Undo)</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 py-3 overflow-x-auto text-xs">
          <span className="text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </span>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
              filter === 'all' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Semua ({events.length})
          </button>
          <button
            onClick={() => setFilter('A')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
              filter === 'A' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {teamA.name}
          </button>
          <button
            onClick={() => setFilter('B')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
              filter === 'B' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {teamB.name}
          </button>
          <button
            onClick={() => setFilter('points')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
              filter === 'points' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Hanya Poin
          </button>
          <button
            onClick={() => setFilter('fouls')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
              filter === 'fouls' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Hanya Pelanggaran
          </button>
        </div>

        {/* Timeline List */}
        <div className="space-y-2 mt-2 max-h-[550px] overflow-y-auto pr-1">
          {filteredEvents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              Belum ada riwayat aktivitas yang tercatat.
            </div>
          ) : (
            filteredEvents.map((item, index) => {
              const isTeamA = item.teamId === 'A';
              const team = isTeamA ? teamA : teamB;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-950/80 hover:bg-slate-950 rounded-xl border border-slate-800/80 transition-all text-xs sm:text-sm group"
                >
                  {/* Left: Time and Quarter */}
                  <div className="flex items-center gap-3">
                    <div className="text-center font-mono w-14 shrink-0">
                      <span className="text-[11px] font-bold text-orange-400 block">{item.quarter}</span>
                      <span className="text-[10px] text-slate-400">{item.gameTimeFormatted}</span>
                    </div>

                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: team.primaryColor }}
                    />

                    {/* Description */}
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span className="text-slate-300">{team.name}</span>
                        {item.playerName && (
                          <span className="text-orange-400 font-normal">
                            (#{item.playerNumber} {item.playerName})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{item.note}</p>
                    </div>
                  </div>

                  {/* Right: Running Score & Delete */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right font-scoreboard font-bold text-base text-white tabular-nums bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      {item.teamAScoreAfter} - {item.teamBScoreAfter}
                    </div>

                    <button
                      onClick={() => onDeleteEvent(item.id)}
                      title="Hapus dan koreksi peristiwa ini"
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors opacity-70 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
