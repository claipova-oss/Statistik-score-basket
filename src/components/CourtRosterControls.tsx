import React, { useState } from 'react';
import { UserCheck, ArrowRightLeft, Plus, AlertTriangle, ShieldAlert, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { Player, Team, GameSettings } from '../types/basketball';

interface CourtRosterControlsProps {
  teamA: Team;
  teamB: Team;
  players: Player[];
  settings: GameSettings;
  onPlayerScore: (player: Player, points: 1 | 2 | 3) => void;
  onPlayerFoul: (player: Player) => void;
  onPlayerSub: (playerOutId: string, playerInId: string) => void;
  onAddPlayer: (teamId: 'A' | 'B', name: string, number: number, position?: string) => void;
}

export const CourtRosterControls: React.FC<CourtRosterControlsProps> = ({
  teamA,
  teamB,
  players,
  settings,
  onPlayerScore,
  onPlayerFoul,
  onPlayerSub,
  onAddPlayer,
}) => {
  const [subModalPlayerOut, setSubModalPlayerOut] = useState<Player | null>(null);
  const [showBenchA, setShowBenchA] = useState(false);
  const [showBenchB, setShowBenchB] = useState(false);

  // New player inline inputs
  const [showAddPlayerTeam, setShowAddPlayerTeam] = useState<'A' | 'B' | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');
  const [newPlayerPosition, setNewPlayerPosition] = useState('G');

  const teamAPlayers = players.filter((p) => p.teamId === 'A');
  const teamBPlayers = players.filter((p) => p.teamId === 'B');

  const teamAOnCourt = teamAPlayers.filter((p) => p.isOnCourt);
  const teamABench = teamAPlayers.filter((p) => !p.isOnCourt);

  const teamBOnCourt = teamBPlayers.filter((p) => p.isOnCourt);
  const teamBBench = teamBPlayers.filter((p) => !p.isOnCourt);

  const handleSubSelect = (benchPlayer: Player) => {
    if (subModalPlayerOut) {
      onPlayerSub(subModalPlayerOut.id, benchPlayer.id);
      setSubModalPlayerOut(null);
    }
  };

  const submitNewPlayer = (teamId: 'A' | 'B') => {
    const num = parseInt(newPlayerNumber, 10);
    if (!newPlayerName.trim() || isNaN(num)) return;
    onAddPlayer(teamId, newPlayerName.trim(), num, newPlayerPosition);
    setNewPlayerName('');
    setNewPlayerNumber('');
    setShowAddPlayerTeam(null);
  };

  const renderPlayerRow = (player: Player, team: Team) => {
    const isFouledOut = player.fouls >= settings.maxPersonalFouls;
    const isFoulTrouble = player.fouls === settings.maxPersonalFouls - 1;

    return (
      <div
        key={player.id}
        className={`p-3 rounded-xl border transition-all ${
          isFouledOut
            ? 'bg-red-950/20 border-red-800/60 opacity-80'
            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2.5">
          {/* Player Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-scoreboard font-black text-sm text-white shrink-0 shadow-sm"
              style={{ backgroundColor: team.primaryColor }}
            >
              #{player.number}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-white truncate">
                  {player.name}
                </span>
                {player.position && (
                  <span className="text-[10px] text-slate-400 uppercase font-mono">
                    {player.position}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{player.points} PTS</span>
                <span>·</span>
                <span className={isFouledOut ? 'text-red-400 font-bold' : isFoulTrouble ? 'text-amber-400 font-semibold' : ''}>
                  {player.fouls} PF {isFouledOut && '(FOUL OUT)'}
                </span>
              </div>
            </div>
          </div>

          {/* Sub Button */}
          <button
            onClick={() => setSubModalPlayerOut(player)}
            title="Ganti Pemain (Sub)"
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/80 transition-colors text-xs flex items-center gap-1 shrink-0"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ganti</span>
          </button>
        </div>

        {/* Action Tap Buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => onPlayerScore(player, 1)}
            disabled={isFouledOut}
            className="bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-40 text-slate-200 font-scoreboard font-bold text-sm py-1.5 rounded-lg border border-slate-700/80 transition-all flex flex-col items-center justify-center"
          >
            +1 FT
          </button>
          <button
            onClick={() => onPlayerScore(player, 2)}
            disabled={isFouledOut}
            className="bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-40 text-slate-200 font-scoreboard font-bold text-sm py-1.5 rounded-lg border border-slate-700/80 transition-all flex flex-col items-center justify-center"
          >
            +2 FG
          </button>
          <button
            onClick={() => onPlayerScore(player, 3)}
            disabled={isFouledOut}
            className="bg-orange-600/90 hover:bg-orange-500 active:scale-95 disabled:opacity-40 text-white font-scoreboard font-bold text-sm py-1.5 rounded-lg border border-orange-500/80 transition-all flex flex-col items-center justify-center shadow-sm"
          >
            +3 PT
          </button>
          <button
            onClick={() => onPlayerFoul(player)}
            disabled={isFouledOut}
            className={`py-1.5 rounded-lg font-scoreboard font-bold text-sm transition-all flex flex-col items-center justify-center active:scale-95 ${
              isFoulTrouble
                ? 'bg-amber-900/60 hover:bg-amber-800/80 text-amber-200 border border-amber-700'
                : 'bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-900/60'
            }`}
          >
            +1 Foul
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 select-none">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ================= TEAM A ON-COURT ================= */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: teamA.primaryColor }}
                />
                <h3 className="font-bold text-lg text-white">
                  Pemain di Lapangan: {teamA.name}
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {teamAOnCourt.length}/5 Pemain
              </span>
            </div>

            {/* Warning if on-court count is not 5 */}
            {teamAOnCourt.length !== 5 && (
              <div className="mb-3 p-2.5 bg-amber-950/30 border border-amber-800/60 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Perhatian: Standar bola basket adalah 5 pemain di lapangan (saat ini {teamAOnCourt.length}).
                </span>
              </div>
            )}

            {/* List of active players */}
            <div className="space-y-2.5">
              {teamAOnCourt.map((p) => renderPlayerRow(p, teamA))}
              {teamAOnCourt.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Belum ada pemain di lapangan untuk {teamA.name}.
                </div>
              )}
            </div>
          </div>

          {/* Bench & Add Player Section Team A */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowBenchA(!showBenchA)}
                className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <span>Bangku Cadangan ({teamABench.length})</span>
                {showBenchA ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setShowAddPlayerTeam(showAddPlayerTeam === 'A' ? null : 'A')}
                className="text-xs font-medium text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tambah Pemain</span>
              </button>
            </div>

            {/* Collapsible Bench List */}
            {showBenchA && (
              <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                {teamABench.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Tidak ada pemain cadangan.</p>
                ) : (
                  teamABench.map((benchP) => (
                    <div
                      key={benchP.id}
                      className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-scoreboard font-bold text-slate-300 w-6">#{benchP.number}</span>
                        <span className="text-white font-medium">{benchP.name}</span>
                        {benchP.position && <span className="text-slate-400 font-mono text-[10px]">{benchP.position}</span>}
                        <span className="text-slate-400">· {benchP.points} PTS · {benchP.fouls} PF</span>
                      </div>
                      <button
                        onClick={() => {
                          // swap with first on-court or just put on court
                          const firstOnCourt = teamAOnCourt[0];
                          if (firstOnCourt) onPlayerSub(firstOnCourt.id, benchP.id);
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-medium"
                      >
                        Masuk Lapangan
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Inline Add Player Team A */}
            {showAddPlayerTeam === 'A' && (
              <div className="mt-3 p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                <span className="font-semibold text-white block mb-2">Tambah Pemain ke {teamA.name}</span>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <input
                    type="number"
                    placeholder="No"
                    value={newPlayerNumber}
                    onChange={(e) => setNewPlayerNumber(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-center font-scoreboard"
                  />
                  <input
                    type="text"
                    placeholder="Nama Lengkap"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    className="col-span-2 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                  />
                  <select
                    value={newPlayerPosition}
                    onChange={(e) => setNewPlayerPosition(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-white"
                  >
                    <option value="PG">PG</option>
                    <option value="SG">SG</option>
                    <option value="SF">SF</option>
                    <option value="PF">PF</option>
                    <option value="C">C</option>
                    <option value="G">Guard</option>
                    <option value="F">Forward</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddPlayerTeam(null)}
                    className="px-2.5 py-1 text-slate-400 hover:text-white"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => submitNewPlayer('A')}
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded font-medium"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= TEAM B ON-COURT ================= */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: teamB.primaryColor }}
                />
                <h3 className="font-bold text-lg text-white">
                  Pemain di Lapangan: {teamB.name}
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {teamBOnCourt.length}/5 Pemain
              </span>
            </div>

            {/* Warning if on-court count is not 5 */}
            {teamBOnCourt.length !== 5 && (
              <div className="mb-3 p-2.5 bg-amber-950/30 border border-amber-800/60 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Perhatian: Standar bola basket adalah 5 pemain di lapangan (saat ini {teamBOnCourt.length}).
                </span>
              </div>
            )}

            {/* List of active players */}
            <div className="space-y-2.5">
              {teamBOnCourt.map((p) => renderPlayerRow(p, teamB))}
              {teamBOnCourt.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Belum ada pemain di lapangan untuk {teamB.name}.
                </div>
              )}
            </div>
          </div>

          {/* Bench & Add Player Section Team B */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowBenchB(!showBenchB)}
                className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <span>Bangku Cadangan ({teamBBench.length})</span>
                {showBenchB ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setShowAddPlayerTeam(showAddPlayerTeam === 'B' ? null : 'B')}
                className="text-xs font-medium text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tambah Pemain</span>
              </button>
            </div>

            {/* Collapsible Bench List */}
            {showBenchB && (
              <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                {teamBBench.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Tidak ada pemain cadangan.</p>
                ) : (
                  teamBBench.map((benchP) => (
                    <div
                      key={benchP.id}
                      className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-scoreboard font-bold text-slate-300 w-6">#{benchP.number}</span>
                        <span className="text-white font-medium">{benchP.name}</span>
                        {benchP.position && <span className="text-slate-400 font-mono text-[10px]">{benchP.position}</span>}
                        <span className="text-slate-400">· {benchP.points} PTS · {benchP.fouls} PF</span>
                      </div>
                      <button
                        onClick={() => {
                          const firstOnCourt = teamBOnCourt[0];
                          if (firstOnCourt) onPlayerSub(firstOnCourt.id, benchP.id);
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-medium"
                      >
                        Masuk Lapangan
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Inline Add Player Team B */}
            {showAddPlayerTeam === 'B' && (
              <div className="mt-3 p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                <span className="font-semibold text-white block mb-2">Tambah Pemain ke {teamB.name}</span>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <input
                    type="number"
                    placeholder="No"
                    value={newPlayerNumber}
                    onChange={(e) => setNewPlayerNumber(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-center font-scoreboard"
                  />
                  <input
                    type="text"
                    placeholder="Nama Lengkap"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    className="col-span-2 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                  />
                  <select
                    value={newPlayerPosition}
                    onChange={(e) => setNewPlayerPosition(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-white"
                  >
                    <option value="PG">PG</option>
                    <option value="SG">SG</option>
                    <option value="SF">SF</option>
                    <option value="PF">PF</option>
                    <option value="C">C</option>
                    <option value="G">Guard</option>
                    <option value="F">Forward</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddPlayerTeam(null)}
                    className="px-2.5 py-1 text-slate-400 hover:text-white"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => submitNewPlayer('B')}
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded font-medium"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ================= MODAL SUB GANTI PEMAIN ================= */}
      {subModalPlayerOut && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl text-white">
            <h3 className="text-lg font-bold mb-1">Pergantian Pemain (Sub)</h3>
            <p className="text-xs text-slate-400 mb-4">
              Pilih pemain cadangan yang akan menggantikan{' '}
              <span className="text-orange-400 font-semibold">
                #{subModalPlayerOut.number} {subModalPlayerOut.name}
              </span>
              :
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {(subModalPlayerOut.teamId === 'A' ? teamABench : teamBBench).length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Tidak ada pemain cadangan yang tersedia di bangku.
                </div>
              ) : (
                (subModalPlayerOut.teamId === 'A' ? teamABench : teamBBench).map((benchP) => (
                  <button
                    key={benchP.id}
                    onClick={() => handleSubSelect(benchP)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-orange-500 hover:bg-slate-800/80 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-scoreboard font-black text-lg text-slate-300 w-8">
                        #{benchP.number}
                      </span>
                      <div>
                        <span className="font-medium text-sm text-white block">
                          {benchP.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {benchP.position || 'Pemain'} · {benchP.points} PTS · {benchP.fouls} PF
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-orange-400 bg-orange-950/40 px-2.5 py-1 rounded-md border border-orange-800/50">
                      Pilih
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSubModalPlayerOut(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
