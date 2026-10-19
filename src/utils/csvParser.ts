import { Player, Team, MatchEvent, ParsedRosterRow } from '../types/basketball';

/**
 * Parses CSV or tab-separated text into structured roster data.
 * Supports flexible formats:
 * - Header row optional (detects 'tim', 'nomor', 'nama', 'posisi' etc.)
 * - Comma, semicolon, or tab delimited.
 * - Handles lines like: "Tim A, 23, Budi Santoso, PG, Ya" or "7, Andi Pratama, SG"
 */
export function parseRosterCSV(content: string, defaultTeamId: 'A' | 'B' = 'A'): {
  teamAName?: string;
  teamBName?: string;
  playersA: Omit<Player, 'points' | 'ftMade' | 'fg2Made' | 'fg3Made' | 'fouls'>[];
  playersB: Omit<Player, 'points' | 'ftMade' | 'fg2Made' | 'fg3Made' | 'fouls'>[];
  warnings: string[];
} {
  const lines = content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));

  const warnings: string[] = [];
  const playersA: Omit<Player, 'points' | 'ftMade' | 'fg2Made' | 'fg3Made' | 'fouls'>[] = [];
  const playersB: Omit<Player, 'points' | 'ftMade' | 'fg2Made' | 'fg3Made' | 'fouls'>[] = [];
  let detectedTeamAName: string | undefined;
  let detectedTeamBName: string | undefined;

  if (lines.length === 0) {
    return { playersA, playersB, warnings: ['File kosong atau format tidak terbaca.'] };
  }

  // Detect delimiter
  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

  // Check if first row is header
  let startIndex = 0;
  const firstCols = firstLine.split(delimiter).map(c => c.trim().toLowerCase());
  const isHeader = firstCols.some(c => 
    c.includes('tim') || c.includes('team') || 
    c.includes('nomor') || c.includes('no') || c.includes('num') || 
    c.includes('nama') || c.includes('name') || c.includes('player')
  );

  let colMap = {
    team: -1,
    number: -1,
    name: -1,
    position: -1,
    starter: -1,
  };

  if (isHeader) {
    startIndex = 1;
    firstCols.forEach((col, idx) => {
      if (col.includes('tim') || col.includes('team')) colMap.team = idx;
      else if (col.includes('nomor') || col.includes('no') || col.includes('jersey') || col === '#') colMap.number = idx;
      else if (col.includes('nama') || col.includes('name') || col.includes('pemain') || col.includes('player')) colMap.name = idx;
      else if (col.includes('pos') || col.includes('role')) colMap.position = idx;
      else if (col.includes('start') || col.includes('inti')) colMap.starter = idx;
    });
  }

  // If no header detected or some columns missing, infer by default order
  // Common orders:
  // 4 cols: Team, Number, Name, Position
  // 3 cols: Number, Name, Position (assigned to defaultTeamId)
  // 2 cols: Number, Name
  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i];
    const cols = rawLine.split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());
    if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

    let teamVal = '';
    let numVal: number | undefined;
    let nameVal = '';
    let posVal = '';
    let isStarter = false;

    if (isHeader && (colMap.name !== -1 || colMap.number !== -1)) {
      if (colMap.team !== -1 && cols[colMap.team]) teamVal = cols[colMap.team];
      if (colMap.number !== -1 && cols[colMap.number]) {
        const parsed = parseInt(cols[colMap.number].replace(/\D/g, ''), 10);
        if (!isNaN(parsed)) numVal = parsed;
      }
      if (colMap.name !== -1 && cols[colMap.name]) nameVal = cols[colMap.name];
      if (colMap.position !== -1 && cols[colMap.position]) posVal = cols[colMap.position];
      if (colMap.starter !== -1 && cols[colMap.starter]) {
        const s = cols[colMap.starter].toLowerCase();
        isStarter = s.startsWith('y') || s.startsWith('s') || s === '1' || s === 'true' || s === 'ya';
      }
    } else {
      // Heuristic column mapping:
      if (cols.length >= 4) {
        // [Team, Number, Name, Position]
        teamVal = cols[0];
        const parsed = parseInt(cols[1].replace(/\D/g, ''), 10);
        numVal = isNaN(parsed) ? undefined : parsed;
        nameVal = cols[2];
        posVal = cols[3];
        if (cols[4]) {
          const s = cols[4].toLowerCase();
          isStarter = s.startsWith('y') || s.startsWith('s') || s === '1' || s === 'true' || s === 'ya';
        }
      } else if (cols.length === 3) {
        // Could be [Number, Name, Position] or [Team, Number, Name]
        const firstIsNum = !isNaN(parseInt(cols[0].replace(/\D/g, ''), 10));
        if (firstIsNum) {
          numVal = parseInt(cols[0].replace(/\D/g, ''), 10);
          nameVal = cols[1];
          posVal = cols[2];
        } else {
          teamVal = cols[0];
          const secondIsNum = parseInt(cols[1].replace(/\D/g, ''), 10);
          numVal = isNaN(secondIsNum) ? undefined : secondIsNum;
          nameVal = cols[2];
        }
      } else if (cols.length === 2) {
        // [Number, Name] or [Name, Number]
        const firstNum = parseInt(cols[0].replace(/\D/g, ''), 10);
        const secondNum = parseInt(cols[1].replace(/\D/g, ''), 10);
        if (!isNaN(firstNum)) {
          numVal = firstNum;
          nameVal = cols[1];
        } else if (!isNaN(secondNum)) {
          numVal = secondNum;
          nameVal = cols[0];
        } else {
          nameVal = `${cols[0]} ${cols[1]}`;
        }
      } else if (cols.length === 1) {
        nameVal = cols[0];
      }
    }

    if (!nameVal && numVal === undefined) {
      continue;
    }

    if (numVal === undefined) {
      numVal = (teamVal.toLowerCase().includes('b') ? playersB.length : playersA.length) + 1;
    }

    if (!nameVal) {
      nameVal = `Pemain #${numVal}`;
    }

    // Determine target team: 'A' or 'B'
    let assignedTeam: 'A' | 'B' = defaultTeamId;
    const lowerTeam = teamVal.toLowerCase();

    if (lowerTeam.includes('tim b') || lowerTeam === 'b' || lowerTeam.includes('away') || lowerTeam.includes('tamu')) {
      assignedTeam = 'B';
      if (teamVal.length > 2 && !detectedTeamBName) detectedTeamBName = teamVal;
    } else if (lowerTeam.includes('tim a') || lowerTeam === 'a' || lowerTeam.includes('home') || lowerTeam.includes('tuan rumah')) {
      assignedTeam = 'A';
      if (teamVal.length > 2 && !detectedTeamAName) detectedTeamAName = teamVal;
    } else if (teamVal) {
      // If teamVal matches or defines a custom name
      if (!detectedTeamAName) {
        detectedTeamAName = teamVal;
        assignedTeam = 'A';
      } else if (teamVal === detectedTeamAName) {
        assignedTeam = 'A';
      } else {
        if (!detectedTeamBName) detectedTeamBName = teamVal;
        assignedTeam = 'B';
      }
    }

    const playerId = `p-${assignedTeam}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const currentList = assignedTeam === 'A' ? playersA : playersB;

    // By default first 5 are on court unless explicitly marked
    const onCourt = isStarter || currentList.filter(p => p.isOnCourt).length < 5;

    currentList.push({
      id: playerId,
      teamId: assignedTeam,
      number: numVal,
      name: nameVal,
      position: posVal || undefined,
      isOnCourt: onCourt,
    });
  }

  return {
    teamAName: detectedTeamAName,
    teamBName: detectedTeamBName,
    playersA,
    playersB,
    warnings,
  };
}

/**
 * Returns a ready-to-download sample CSV template string
 */
export function getSampleCSVTemplate(): string {
  return `Tim,Nomor,Nama,Posisi,Starter
Tim A,23,Budi Santoso,PG,Ya
Tim A,7,Andi Pratama,SG,Ya
Tim A,15,Reza Rahadian,SF,Ya
Tim A,34,Fajar Alfian,PF,Ya
Tim A,55,Doni Firmansyah,C,Ya
Tim A,10,Dimas Anggara,PG,Tidak
Tim A,12,Gilang Dirga,SF,Tidak
Tim A,8,Kevin Sanjaya,SG,Tidak
Tim B,3,Eko Purwanto,PG,Ya
Tim B,11,Bambang Pamungkas,SG,Ya
Tim B,21,Satria Bagus,SF,Ya
Tim B,33,Hendro Siswanto,PF,Ya
Tim B,45,Wahyu Subo,C,Ya
Tim B,6,Rian Ardianto,PG,Tidak
Tim B,9,Bagus Kahfi,SF,Tidak
Tim B,14,Bagas Kaffa,SG,Tidak`;
}

/**
 * Download text or CSV as a file in browser
 */
export function downloadFile(content: string, filename: string, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates Match Summary CSV for export
 */
export function generateMatchReportCSV(
  teamA: Team,
  teamB: Team,
  players: Player[],
  events: MatchEvent[],
  quarter: string,
  timeRemaining: string
): string {
  const dateStr = new Date().toLocaleString('id-ID');
  let csv = `LAPORAN PERTANDINGAN BASKET - HOOPSCORE ID\n`;
  csv += `Tanggal,${dateStr}\n`;
  csv += `Status,${quarter} (${timeRemaining})\n`;
  csv += `Skor Akhir,${teamA.name} ${teamA.score} - ${teamB.score} ${teamB.name}\n\n`;

  // Box Score Team A
  csv += `BOX SCORE: ${teamA.name.toUpperCase()}\n`;
  csv += `No,Nama,Posisi,Total Poin,1 Poin (FT),2 Poin (FG),3 Poin (3PT),Fouls\n`;
  const teamAPlayers = players.filter(p => p.teamId === 'A');
  teamAPlayers.forEach(p => {
    csv += `${p.number},"${p.name}",${p.position || '-'},${p.points},${p.ftMade},${p.fg2Made},${p.fg3Made},${p.fouls}\n`;
  });
  csv += `TOTAL,${teamA.name},-,${teamA.score},${teamAPlayers.reduce((s, p) => s + p.ftMade, 0)},${teamAPlayers.reduce((s, p) => s + p.fg2Made * 2, 0)},${teamAPlayers.reduce((s, p) => s + p.fg3Made * 3, 0)},${teamA.fouls}\n\n`;

  // Box Score Team B
  csv += `BOX SCORE: ${teamB.name.toUpperCase()}\n`;
  csv += `No,Nama,Posisi,Total Poin,1 Poin (FT),2 Poin (FG),3 Poin (3PT),Fouls\n`;
  const teamBPlayers = players.filter(p => p.teamId === 'B');
  teamBPlayers.forEach(p => {
    csv += `${p.number},"${p.name}",${p.position || '-'},${p.points},${p.ftMade},${p.fg2Made},${p.fg3Made},${p.fouls}\n`;
  });
  csv += `TOTAL,${teamB.name},-,${teamB.score},${teamBPlayers.reduce((s, p) => s + p.ftMade, 0)},${teamBPlayers.reduce((s, p) => s + p.fg2Made * 2, 0)},${teamBPlayers.reduce((s, p) => s + p.fg3Made * 3, 0)},${teamB.fouls}\n\n`;

  // Play by play history
  csv += `RIWAYAT PERISTIWA / PLAY-BY-PLAY\n`;
  csv += `Waktu,Kuartal,Tim,Pemain,Peristiwa,Skor Saat Itu\n`;
  events.slice().reverse().forEach(e => {
    const teamName = e.teamId === 'A' ? teamA.name : teamB.name;
    const playerStr = e.playerNumber ? `#${e.playerNumber} ${e.playerName}` : '-';
    csv += `${e.gameTimeFormatted},${e.quarter},"${teamName}","${playerStr}","${e.note}",${e.teamAScoreAfter}-${e.teamBScoreAfter}\n`;
  });

  return csv;
}
