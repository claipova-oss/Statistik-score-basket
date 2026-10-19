import React, { useState, useRef } from 'react';
import { Upload, FileText, Download, CheckCircle, AlertCircle, Copy, Sparkles, X, Users } from 'lucide-react';
import { Player, Team } from '../types/basketball';
import { parseRosterCSV, getSampleCSVTemplate, downloadFile } from '../utils/csvParser';
import { INITIAL_PLAYERS, INITIAL_TEAMS } from '../utils/defaultData';

interface RosterUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamA: Team;
  teamB: Team;
  onApplyRoster: (
    updatedTeamA: Partial<Team>,
    updatedTeamB: Partial<Team>,
    newPlayers: Player[]
  ) => void;
}

export const RosterUploadModal: React.FC<RosterUploadModalProps> = ({
  isOpen,
  onClose,
  teamA,
  teamB,
  onApplyRoster,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'manual'>('upload');
  const [targetScope, setTargetScope] = useState<'both' | 'A' | 'B'>('both');
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  
  // Custom team names & colors editable in modal
  const [editTeamAName, setEditTeamAName] = useState(teamA.name);
  const [editTeamAColor, setEditTeamAColor] = useState(teamA.primaryColor);
  const [editTeamBName, setEditTeamBName] = useState(teamB.name);
  const [editTeamBColor, setEditTeamBColor] = useState(teamB.primaryColor);

  // Parsed result preview
  const [previewData, setPreviewData] = useState<{
    playersA: Omit<Player, 'points' | 'ftMade' | 'fg2Made' | 'fg3Made' | 'fouls'>[];
    playersB: Omit<Player, 'points' | 'ftMade' | 'fg2Made' | 'fg3Made' | 'fouls'>[];
    detectedTeamA?: string;
    detectedTeamB?: string;
    warnings: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessText = (content: string, originName?: string) => {
    if (originName) setFileName(originName);
    const result = parseRosterCSV(content, targetScope === 'both' ? 'A' : targetScope);
    
    // If targeted to a specific team, merge into that team
    if (targetScope === 'A' && result.playersB.length > 0) {
      result.playersA.push(...result.playersB.map(p => ({ ...p, teamId: 'A' as const })));
      result.playersB = [];
    } else if (targetScope === 'B' && result.playersA.length > 0) {
      result.playersB.push(...result.playersA.map(p => ({ ...p, teamId: 'B' as const })));
      result.playersA = [];
    }

    if (result.teamAName) setEditTeamAName(result.teamAName);
    if (result.teamBName) setEditTeamBName(result.teamBName);

    setPreviewData(result);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        handleProcessText(text, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const template = getSampleCSVTemplate();
    downloadFile(template, 'template_roster_basket.csv');
  };

  const handleLoadSampleData = () => {
    setEditTeamAName(INITIAL_TEAMS.teamA.name);
    setEditTeamBName(INITIAL_TEAMS.teamB.name);
    setEditTeamAColor(INITIAL_TEAMS.teamA.primaryColor);
    setEditTeamBColor(INITIAL_TEAMS.teamB.primaryColor);
    
    const parsedA = INITIAL_PLAYERS.filter(p => p.teamId === 'A');
    const parsedB = INITIAL_PLAYERS.filter(p => p.teamId === 'B');

    setPreviewData({
      playersA: parsedA,
      playersB: parsedB,
      detectedTeamA: INITIAL_TEAMS.teamA.name,
      detectedTeamB: INITIAL_TEAMS.teamB.name,
      warnings: [],
    });
    setFileName('contoh_roster_resmi.csv');
  };

  const handleConfirmApply = () => {
    if (!previewData) return;

    const fullPlayers: Player[] = [
      ...previewData.playersA.map(p => ({
        ...p,
        teamId: 'A' as const,
        points: 0,
        ftMade: 0,
        fg2Made: 0,
        fg3Made: 0,
        fouls: 0,
      })),
      ...previewData.playersB.map(p => ({
        ...p,
        teamId: 'B' as const,
        points: 0,
        ftMade: 0,
        fg2Made: 0,
        fg3Made: 0,
        fouls: 0,
      })),
    ];

    onApplyRoster(
      {
        name: editTeamAName.trim() || teamA.name,
        primaryColor: editTeamAColor,
        shortName: (editTeamAName.trim() || teamA.name).substring(0, 3).toUpperCase(),
      },
      {
        name: editTeamBName.trim() || teamB.name,
        primaryColor: editTeamBColor,
        shortName: (editTeamBName.trim() || teamB.name).substring(0, 3).toUpperCase(),
      },
      fullPlayers
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl text-white relative my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Upload className="w-5 h-5 text-orange-500" />
              Unggah Nama Pemain & Tim
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Impor data roster pemain via file CSV / Excel atau tempel teks dari pesan/catatan.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Sample / Template Helpers */}
        <div className="my-4 flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950/70 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-orange-400" />
              <span>Unduh Template CSV</span>
            </button>
            <button
              onClick={handleLoadSampleData}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Muat Contoh Roster</span>
            </button>
          </div>

          {/* Scope Selector */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 mr-1 hidden sm:inline">Target:</span>
            <button
              onClick={() => setTargetScope('both')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                targetScope === 'both' ? 'bg-orange-600 text-white font-semibold' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Kedua Tim
            </button>
            <button
              onClick={() => setTargetScope('A')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                targetScope === 'A' ? 'bg-orange-600 text-white font-semibold' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Tim A Saja
            </button>
            <button
              onClick={() => setTargetScope('B')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                targetScope === 'B' ? 'bg-orange-600 text-white font-semibold' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Tim B Saja
            </button>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-800 mb-4">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-4 text-xs sm:text-sm font-semibold transition-colors border-b-2 -mb-[2px] ${
              activeTab === 'upload'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Unggah File (.CSV / .TXT)
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 px-4 text-xs sm:text-sm font-semibold transition-colors border-b-2 -mb-[2px] ${
              activeTab === 'paste'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Tempel Teks (Copy-Paste)
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-2.5 px-4 text-xs sm:text-sm font-semibold transition-colors border-b-2 -mb-[2px] ${
              activeTab === 'manual'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Atur Nama & Warna Tim
          </button>
        </div>

        {/* Content Tabs */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-orange-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-950/50 flex flex-col items-center justify-center group"
            >
              <Upload className="w-10 h-10 text-slate-500 group-hover:text-orange-400 mb-3 transition-colors" />
              <p className="text-sm font-semibold text-slate-200 group-hover:text-white">
                Klik untuk memilih file CSV atau seret ke sini
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Mendukung file .csv, .txt (kolom dipisah koma atau tab)
              </p>
              {fileName && (
                <div className="mt-3 px-3 py-1 bg-orange-950/60 border border-orange-800/80 rounded-lg text-xs text-orange-300 font-medium">
                  File terpilih: {fileName}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="font-semibold text-slate-300 block mb-1">Format Kolom Rekomendasi:</span>
              <code className="text-orange-300 font-mono">Tim, Nomor, Nama Pemain, Posisi (PG/SG/SF/PF/C), Starter (Ya/Tidak)</code>
              <p className="mt-1">
                Contoh: <code className="text-slate-300 font-mono">Tim A, 23, Budi Santoso, PG, Ya</code>
              </p>
            </div>
          </div>
        )}

        {activeTab === 'paste' && (
          <div className="space-y-3">
            <textarea
              rows={6}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder={`Salin daftar pemain dari Excel, Google Sheets, atau chat dan tempel di sini.\nContoh:\nTim A, 23, Budi Santoso, PG, Ya\nTim A, 7, Andi Pratama, SG, Ya\nTim B, 3, Eko Purwanto, PG, Ya`}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
            />
            <div className="flex justify-end">
              <button
                onClick={() => handleProcessText(pastedText, 'Teks Tempelan')}
                disabled={!pastedText.trim()}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Proses Roster</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'manual' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            {/* Team A settings */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block">
                Tim A (Tuan Rumah)
              </span>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nama Tim A:</label>
                <input
                  type="text"
                  value={editTeamAName}
                  onChange={(e) => setEditTeamAName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Warna Jersey / Aksen:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editTeamAColor}
                    onChange={(e) => setEditTeamAColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                  />
                  <span className="text-xs font-mono text-slate-300">{editTeamAColor}</span>
                </div>
              </div>
            </div>

            {/* Team B settings */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                Tim B (Tamu)
              </span>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nama Tim B:</label>
                <input
                  type="text"
                  value={editTeamBName}
                  onChange={(e) => setEditTeamBName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Warna Jersey / Aksen:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editTeamBColor}
                    onChange={(e) => setEditTeamBColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                  />
                  <span className="text-xs font-mono text-slate-300">{editTeamBColor}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Preview Section */}
        {previewData && (
          <div className="mt-5 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Pratinjau Hasil Pembacaan Roster
              </h3>
              <span className="text-xs text-slate-400">
                Total {previewData.playersA.length + previewData.playersB.length} Pemain Terbaca
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-1">
              {/* Preview Team A */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-1.5 border-b border-slate-800 mb-2">
                  <span>{editTeamAName} (Tim A)</span>
                  <span className="text-orange-400">{previewData.playersA.length} pemain</span>
                </div>
                <div className="space-y-1 text-xs">
                  {previewData.playersA.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-slate-300">
                      <span>#{p.number} {p.name}</span>
                      <span className="text-slate-500 font-mono">{p.position || '-'} {p.isOnCourt && '★'}</span>
                    </div>
                  ))}
                  {previewData.playersA.length === 0 && (
                    <span className="text-slate-500 italic">Tidak ada pemain terbaca.</span>
                  )}
                </div>
              </div>

              {/* Preview Team B */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-1.5 border-b border-slate-800 mb-2">
                  <span>{editTeamBName} (Tim B)</span>
                  <span className="text-blue-400">{previewData.playersB.length} pemain</span>
                </div>
                <div className="space-y-1 text-xs">
                  {previewData.playersB.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-slate-300">
                      <span>#{p.number} {p.name}</span>
                      <span className="text-slate-500 font-mono">{p.position || '-'} {p.isOnCourt && '★'}</span>
                    </div>
                  ))}
                  {previewData.playersB.length === 0 && (
                    <span className="text-slate-500 italic">Tidak ada pemain terbaca.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs sm:text-sm font-medium transition-colors"
          >
            Batal
          </button>

          <button
            onClick={handleConfirmApply}
            disabled={!previewData || (previewData.playersA.length === 0 && previewData.playersB.length === 0)}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-orange-950/50 transition-all flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Terapkan Roster ke Pertandingan</span>
          </button>
        </div>

      </div>
    </div>
  );
};
