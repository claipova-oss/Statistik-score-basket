import React, { useState } from 'react';
import { Printer, Download, Share2, Award, Check } from 'lucide-react';
import { Team, Player, MatchEvent } from '../types/basketball';
import { generateMatchReportCSV, downloadFile } from '../utils/csvParser';

interface BoxScoreTableProps {
  teamA: Team;
  teamB: Team;
  players: Player[];
  events: MatchEvent[];
  quarter: string;
  gameTimeFormatted: string;
}

export const BoxScoreTable: React.FC<BoxScoreTableProps> = ({
  teamA,
  teamB,
  players,
  events,
  quarter,
  gameTimeFormatted,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);

  const teamAPlayers = players.filter((p) => p.teamId === 'A');
  const teamBPlayers = players.filter((p) => p.teamId === 'B');

  // Find Top Scorers
  const topScorerA = teamAPlayers.length > 0 ? [...teamAPlayers].sort((a, b) => b.points - a.points)[0] : null;
  const topScorerB = teamBPlayers.length > 0 ? [...teamBPlayers].sort((a, b) => b.points - a.points)[0] : null;

  // Totals calculations
  const totalFtA = teamAPlayers.reduce((sum, p) => sum + p.ftMade, 0);
  const total2PtA = teamAPlayers.reduce((sum, p) => sum + p.fg2Made, 0);
  const total3PtA = teamAPlayers.reduce((sum, p) => sum + p.fg3Made, 0);
  const totalFoulsA = teamAPlayers.reduce((sum, p) => sum + p.fouls, 0);

  const totalFtB = teamBPlayers.reduce((sum, p) => sum + p.ftMade, 0);
  const total2PtB = teamBPlayers.reduce((sum, p) => sum + p.fg2Made, 0);
  const total3PtB = teamBPlayers.reduce((sum, p) => sum + p.fg3Made, 0);
  const totalFoulsB = teamBPlayers.reduce((sum, p) => sum + p.fouls, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const csvContent = generateMatchReportCSV(teamA, teamB, players, events, quarter, gameTimeFormatted);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadFile(csvContent, `rekap_basket_${teamA.shortName}_vs_${teamB.shortName}_${dateStr}.csv`);
  };

  const handleShareSummary = () => {
    const text = `🏀 *HASIL PERTANDINGAN BASKET*\n` +
      `*${teamA.name}* ${teamA.score} - ${teamB.score} *${teamB.name}*\n` +
      `Babak: ${quarter} (${gameTimeFormatted})\n\n` +
      `⭐ *Top Scorer ${teamA.name}:* ${topScorerA ? `#${topScorerA.number} ${topScorerA.name} (${topScorerA.points} Poin)` : '-'}\n` +
      `⭐ *Top Scorer ${teamB.name}:* ${topScorerB ? `#${topScorerB.number} ${topScorerB.name} (${topScorerB.points} Poin)` : '-'}\n\n` +
      `Dibuat dengan HoopScore ID.`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const renderTeamTable = (team: Team, teamPlayers: Player[], totals: { ft: number; fg2: number; fg3: number; fouls: number }) => (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg overflow-hidden">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div
            className="w-4 h-4 rounded-full border border-white/20"
            style={{ backgroundColor: team.primaryColor }}
          />
          <h3 className="text-lg font-bold text-white tracking-tight">
            {team.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Total Skor:</span>
          <span className="font-scoreboard font-black text-2xl text-orange-400 tabular-nums">
            {team.score}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold">
              <th className="py-2 px-3 text-center w-12">No</th>
              <th className="py-2 px-3">Nama Pemain</th>
              <th className="py-2 px-2 text-center w-14">Pos</th>
              <th className="py-2 px-3 text-center font-bold text-white">PTS</th>
              <th className="py-2 px-2 text-center text-slate-400">1PT</th>
              <th className="py-2 px-2 text-center text-slate-400">2PT</th>
              <th className="py-2 px-2 text-center text-slate-400">3PT</th>
              <th className="py-2 px-2 text-center text-slate-400">Fouls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {teamPlayers.map((player) => {
              const isTop = topScorerA?.id === player.id || topScorerB?.id === player.id;
              return (
                <tr
                  key={player.id}
                  className={`hover:bg-slate-800/50 transition-colors ${
                    player.isOnCourt ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  <td className="py-2 px-3 text-center font-bold font-scoreboard text-slate-300">
                    #{player.number}
                  </td>
                  <td className="py-2 px-3 font-sans font-medium text-white flex items-center gap-1.5">
                    <span className="truncate max-w-[140px] sm:max-w-none">{player.name}</span>
                    {player.isOnCourt && (
                      <span className="text-[9px] bg-slate-800 text-slate-300 px-1 py-0.2 rounded font-sans">
                        Court
                      </span>
                    )}
                    {isTop && player.points > 0 && (
                      <span title="Top Scorer">
                        <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center text-slate-400 uppercase text-xs">
                    {player.position || '-'}
                  </td>
                  <td className="py-2 px-3 text-center font-bold font-scoreboard text-base text-orange-400 tabular-nums">
                    {player.points}
                  </td>
                  <td className="py-2 px-2 text-center tabular-nums text-slate-300">
                    {player.ftMade}
                  </td>
                  <td className="py-2 px-2 text-center tabular-nums text-slate-300">
                    {player.fg2Made}
                  </td>
                  <td className="py-2 px-2 text-center tabular-nums text-slate-300">
                    {player.fg3Made}
                  </td>
                  <td className={`py-2 px-2 text-center tabular-nums font-bold ${
                    player.fouls >= 5 ? 'text-red-400' : player.fouls === 4 ? 'text-amber-400' : 'text-slate-300'
                  }`}>
                    {player.fouls}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-700 font-bold text-white bg-slate-950/60 font-mono">
              <td colSpan={3} className="py-2.5 px-3 font-sans uppercase text-xs text-slate-400">
                Total Tim ({team.name})
              </td>
              <td className="py-2.5 px-3 text-center font-scoreboard text-lg text-orange-400 tabular-nums">
                {team.score}
              </td>
              <td className="py-2.5 px-2 text-center tabular-nums">{totals.ft}</td>
              <td className="py-2.5 px-2 text-center tabular-nums">{totals.fg2}</td>
              <td className="py-2.5 px-2 text-center tabular-nums">{totals.fg3}</td>
              <td className="py-2.5 px-2 text-center tabular-nums">{team.fouls}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 select-none">
      {/* Action Header */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-6 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white">Box Score & Statistik Pertandingan</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Rekap perolehan poin per pemain, lemparan bebas, 2-poin, 3-poin, dan catatan pelanggaran (fouls).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShareSummary}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors border border-slate-700"
          >
            {copiedShare ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedShare ? 'Tersalin!' : 'Salin Ringkasan'}</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors border border-slate-700"
          >
            <Download className="w-4 h-4 text-orange-400" />
            <span>Unduh CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Lembar Skor</span>
          </button>
        </div>
      </div>

      {/* Printable Scoreboard Header for Print Mode */}
      <div className="hidden print-only mb-6 text-center">
        <h1 className="text-2xl font-black uppercase tracking-tight">LEMBAR RESMI PERTANDINGAN BASKET</h1>
        <p className="text-sm text-gray-600">
          {teamA.name} ({teamA.score}) vs {teamB.name} ({teamB.score}) — Babak: {quarter}
        </p>
        <p className="text-xs text-gray-500">Dicetak pada {new Date().toLocaleString('id-ID')}</p>
      </div>

      {/* Grid of 2 Team Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {renderTeamTable(teamA, teamAPlayers, {
          ft: totalFtA,
          fg2: total2PtA,
          fg3: total3PtA,
          fouls: totalFoulsA,
        })}
        {renderTeamTable(teamB, teamBPlayers, {
          ft: totalFtB,
          fg2: total2PtB,
          fg3: total3PtB,
          fouls: totalFoulsB,
        })}
      </div>

      {/* Comparative Summary Strip */}
      <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-white mb-4">Komparasi Statistik Tembakan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Tembakan 3 Poin (3PT Made)</span>
            <div className="flex items-center justify-center gap-3 font-scoreboard font-bold text-xl tabular-nums">
              <span className="text-orange-400">{total3PtA} ({total3PtA * 3} pts)</span>
              <span className="text-slate-600">vs</span>
              <span className="text-blue-400">{total3PtB} ({total3PtB * 3} pts)</span>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Field Goal 2 Poin (2PT Made)</span>
            <div className="flex items-center justify-center gap-3 font-scoreboard font-bold text-xl tabular-nums">
              <span className="text-orange-400">{total2PtA} ({total2PtA * 2} pts)</span>
              <span className="text-slate-600">vs</span>
              <span className="text-blue-400">{total2PtB} ({total2PtB * 2} pts)</span>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Lemparan Bebas (FT Made)</span>
            <div className="flex items-center justify-center gap-3 font-scoreboard font-bold text-xl tabular-nums">
              <span className="text-orange-400">{totalFtA} pts</span>
              <span className="text-slate-600">vs</span>
              <span className="text-blue-400">{totalFtB} pts</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
