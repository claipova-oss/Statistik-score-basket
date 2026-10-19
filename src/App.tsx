import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScoreboardHeader } from './components/ScoreboardHeader';
import { ScoreboardDisplay } from './components/ScoreboardDisplay';
import { CourtRosterControls } from './components/CourtRosterControls';
import { BoxScoreTable } from './components/BoxScoreTable';
import { EventHistoryLog } from './components/EventHistoryLog';
import { RosterUploadModal } from './components/RosterUploadModal';
import { GameSettingsModal } from './components/GameSettingsModal';
import { Team, Player, MatchEvent, Quarter, GameSettings } from './types/basketball';
import { INITIAL_TEAMS, INITIAL_PLAYERS, INITIAL_SETTINGS } from './utils/defaultData';
import { playArenaBuzzer, playWhistleSound, playScoreBeep } from './utils/audio';

const STORAGE_KEY = 'hoopscore_basketball_state_v1';

export default function App() {
  // Load saved state or default
  const [teamA, setTeamA] = useState<Team>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).teamA;
    } catch {}
    return INITIAL_TEAMS.teamA;
  });

  const [teamB, setTeamB] = useState<Team>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).teamB;
    } catch {}
    return INITIAL_TEAMS.teamB;
  });

  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).players;
    } catch {}
    return INITIAL_PLAYERS;
  });

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).settings;
    } catch {}
    return INITIAL_SETTINGS;
  });

  const [quarter, setQuarter] = useState<Quarter>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).quarter;
    } catch {}
    return 'Q1';
  });

  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && typeof JSON.parse(saved).secondsRemaining === 'number') {
        return JSON.parse(saved).secondsRemaining;
      }
    } catch {}
    return INITIAL_SETTINGS.quarterMinutes * 60;
  });

  const [shotClock, setShotClock] = useState<number>(() => {
    return INITIAL_SETTINGS.shotClockSeconds;
  });

  const [events, setEvents] = useState<MatchEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).events || [];
    } catch {}
    return [];
  });

  const [possession, setPossession] = useState<'A' | 'B' | null>('A');
  const [activeTab, setActiveTab] = useState<'court' | 'boxscore' | 'history'>('court');
  const [isClockRunning, setIsClockRunning] = useState(false);
  const [isShotClockRunning, setIsShotClockRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Auto-save state to localStorage
  useEffect(() => {
    try {
      const state = {
        teamA,
        teamB,
        players,
        settings,
        quarter,
        secondsRemaining,
        events,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving game state', e);
    }
  }, [teamA, teamB, players, settings, quarter, secondsRemaining, events]);

  // Main game clock interval
  useEffect(() => {
    let timer: number | null = null;
    if (isClockRunning) {
      timer = window.setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsClockRunning(false);
            if (settings.soundEnabled) {
              playArenaBuzzer();
            }
            return 0;
          }
          return prev - 1;
        });

        // Countdown shot clock together if active
        if (settings.enableShotClock) {
          setShotClock((prevShot) => {
            if (prevShot <= 1) {
              if (settings.soundEnabled) {
                playWhistleSound();
              }
              return 0;
            }
            return prevShot - 1;
          });
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isClockRunning, settings.soundEnabled, settings.enableShotClock]);

  // Keyboard shortcut listener (Spacebar = Play/Pause, B = Buzzer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsClockRunning((prev) => !prev);
      } else if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        playArenaBuzzer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Format MM:SS
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Fullscreen Handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Sound horn
  const handlePlayBuzzer = () => {
    playArenaBuzzer();
  };

  // Reset clock for the current quarter
  const handleResetClock = () => {
    setIsClockRunning(false);
    setSecondsRemaining(settings.quarterMinutes * 60);
    setShotClock(settings.shotClockSeconds);
  };

  // Record point from player
  const handlePlayerScore = (player: Player, points: 1 | 2 | 3) => {
    if (settings.soundEnabled) {
      playScoreBeep();
    }

    const isTeamA = player.teamId === 'A';

    // Update Player stats
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === player.id) {
          return {
            ...p,
            points: p.points + points,
            ftMade: points === 1 ? p.ftMade + 1 : p.ftMade,
            fg2Made: points === 2 ? p.fg2Made + 1 : p.fg2Made,
            fg3Made: points === 3 ? p.fg3Made + 1 : p.fg3Made,
          };
        }
        return p;
      })
    );

    // Update Team score
    let newScoreA = teamA.score;
    let newScoreB = teamB.score;

    if (isTeamA) {
      newScoreA += points;
      setTeamA((prev) => ({ ...prev, score: prev.score + points }));
      setPossession('B'); // switch possession
    } else {
      newScoreB += points;
      setTeamB((prev) => ({ ...prev, score: prev.score + points }));
      setPossession('A'); // switch possession
    }

    // Reset shot clock after basket
    if (settings.enableShotClock) {
      setShotClock(settings.shotClockSeconds);
    }

    // Add event log
    const typeLabel = points === 1 ? '1 Poin (Free Throw)' : points === 2 ? '2 Poin (Field Goal)' : '3 Poin (3-Pointer)';
    const newEvent: MatchEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      gameTimeFormatted: formatTime(secondsRemaining),
      quarter,
      teamId: player.teamId,
      playerId: player.id,
      playerName: player.name,
      playerNumber: player.number,
      type: points === 1 ? '1PT' : points === 2 ? '2PT' : '3PT',
      pointsDelta: points,
      teamAScoreAfter: newScoreA,
      teamBScoreAfter: newScoreB,
      note: `${typeLabel} oleh #${player.number} ${player.name}`,
    };

    setEvents((prev) => [newEvent, ...prev]);
  };

  // Record foul from player
  const handlePlayerFoul = (player: Player) => {
    if (settings.soundEnabled) {
      playWhistleSound();
    }

    const isTeamA = player.teamId === 'A';

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === player.id) {
          return {
            ...p,
            fouls: p.fouls + 1,
          };
        }
        return p;
      })
    );

    // Update team fouls for this quarter
    if (isTeamA) {
      setTeamA((prev) => ({ ...prev, fouls: prev.fouls + 1 }));
      setPossession('B');
    } else {
      setTeamB((prev) => ({ ...prev, fouls: prev.fouls + 1 }));
      setPossession('A');
    }

    const newEvent: MatchEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      gameTimeFormatted: formatTime(secondsRemaining),
      quarter,
      teamId: player.teamId,
      playerId: player.id,
      playerName: player.name,
      playerNumber: player.number,
      type: 'FOUL',
      pointsDelta: 0,
      teamAScoreAfter: teamA.score,
      teamBScoreAfter: teamB.score,
      note: `Pelanggaran (Personal Foul) oleh #${player.number} ${player.name} (Foul ke-${player.fouls + 1})`,
    };

    setEvents((prev) => [newEvent, ...prev]);
  };

  // Player substitution
  const handlePlayerSub = (playerOutId: string, playerInId: string) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === playerOutId) return { ...p, isOnCourt: false };
        if (p.id === playerInId) return { ...p, isOnCourt: true };
        return p;
      })
    );

    const playerOut = players.find((p) => p.id === playerOutId);
    const playerIn = players.find((p) => p.id === playerInId);

    if (playerOut && playerIn) {
      const newEvent: MatchEvent = {
        id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        gameTimeFormatted: formatTime(secondsRemaining),
        quarter,
        teamId: playerOut.teamId,
        playerId: playerIn.id,
        playerName: playerIn.name,
        playerNumber: playerIn.number,
        type: 'CORRECTION',
        pointsDelta: 0,
        teamAScoreAfter: teamA.score,
        teamBScoreAfter: teamB.score,
        note: `Pergantian: #${playerIn.number} ${playerIn.name} masuk menggantikan #${playerOut.number} ${playerOut.name}`,
      };
      setEvents((prev) => [newEvent, ...prev]);
    }
  };

  // Add new player dynamically
  const handleAddPlayer = (teamId: 'A' | 'B', name: string, number: number, position = 'G') => {
    const newPlayer: Player = {
      id: `p-${teamId}-${Date.now()}`,
      teamId,
      name,
      number,
      position,
      isOnCourt: players.filter((p) => p.teamId === teamId && p.isOnCourt).length < 5,
      points: 0,
      ftMade: 0,
      fg2Made: 0,
      fg3Made: 0,
      fouls: 0,
    };
    setPlayers((prev) => [...prev, newPlayer]);
  };

  // Team quick point add (team-level button)
  const handleTeamPointAdd = (teamId: 'A' | 'B', points: number) => {
    if (settings.soundEnabled) playScoreBeep();

    let newScoreA = teamA.score;
    let newScoreB = teamB.score;

    if (teamId === 'A') {
      newScoreA = Math.max(0, newScoreA + points);
      setTeamA((prev) => ({ ...prev, score: Math.max(0, prev.score + points) }));
    } else {
      newScoreB = Math.max(0, newScoreB + points);
      setTeamB((prev) => ({ ...prev, score: Math.max(0, prev.score + points) }));
    }

    const team = teamId === 'A' ? teamA : teamB;
    const actionLabel = points > 0 ? `+${points} Poin Tim` : `${points} Poin (Koreksi)`;

    const newEvent: MatchEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      gameTimeFormatted: formatTime(secondsRemaining),
      quarter,
      teamId,
      type: points === 1 ? '1PT' : points === 2 ? '2PT' : points === 3 ? '3PT' : 'CORRECTION',
      pointsDelta: points,
      teamAScoreAfter: newScoreA,
      teamBScoreAfter: newScoreB,
      note: `${actionLabel} untuk ${team.name}`,
    };

    setEvents((prev) => [newEvent, ...prev]);
  };

  // Team foul add
  const handleTeamFoulAdd = (teamId: 'A' | 'B') => {
    if (settings.soundEnabled) playWhistleSound();
    if (teamId === 'A') {
      setTeamA((prev) => ({ ...prev, fouls: prev.fouls + 1 }));
    } else {
      setTeamB((prev) => ({ ...prev, fouls: prev.fouls + 1 }));
    }
  };

  // Team timeout use
  const handleTeamTimeoutUse = (teamId: 'A' | 'B') => {
    if (settings.soundEnabled) playArenaBuzzer();
    setIsClockRunning(false);

    if (teamId === 'A') {
      setTeamA((prev) => ({ ...prev, timeoutsLeft: Math.max(0, prev.timeoutsLeft - 1) }));
    } else {
      setTeamB((prev) => ({ ...prev, timeoutsLeft: Math.max(0, prev.timeoutsLeft - 1) }));
    }

    const team = teamId === 'A' ? teamA : teamB;
    const newEvent: MatchEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      gameTimeFormatted: formatTime(secondsRemaining),
      quarter,
      teamId,
      type: 'TIMEOUT',
      pointsDelta: 0,
      teamAScoreAfter: teamA.score,
      teamBScoreAfter: teamB.score,
      note: `Time Out diminta oleh ${team.name}`,
    };

    setEvents((prev) => [newEvent, ...prev]);
  };

  // Undo last event
  const handleUndoLastEvent = () => {
    if (events.length === 0) return;
    const [lastEvent, ...rest] = events;
    revertEvent(lastEvent);
    setEvents(rest);
  };

  // Delete specific event by id
  const handleDeleteEvent = (eventId: string) => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return;
    revertEvent(target);
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const revertEvent = (event: MatchEvent) => {
    // Revert points from team
    if (event.pointsDelta !== 0) {
      if (event.teamId === 'A') {
        setTeamA((prev) => ({ ...prev, score: Math.max(0, prev.score - event.pointsDelta) }));
      } else {
        setTeamB((prev) => ({ ...prev, score: Math.max(0, prev.score - event.pointsDelta) }));
      }
    }

    // Revert points / foul from player if assigned
    if (event.playerId) {
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === event.playerId) {
            let pts = p.points;
            let ft = p.ftMade;
            let fg2 = p.fg2Made;
            let fg3 = p.fg3Made;
            let fls = p.fouls;

            if (event.type === '1PT') {
              pts = Math.max(0, pts - 1);
              ft = Math.max(0, ft - 1);
            } else if (event.type === '2PT') {
              pts = Math.max(0, pts - 2);
              fg2 = Math.max(0, fg2 - 1);
            } else if (event.type === '3PT') {
              pts = Math.max(0, pts - 3);
              fg3 = Math.max(0, fg3 - 1);
            } else if (event.type === 'FOUL') {
              fls = Math.max(0, fls - 1);
            }

            return {
              ...p,
              points: pts,
              ftMade: ft,
              fg2Made: fg2,
              fg3Made: fg3,
              fouls: fls,
            };
          }
          return p;
        })
      );
    }

    // If foul was reverted, also decrease team fouls
    if (event.type === 'FOUL') {
      if (event.teamId === 'A') {
        setTeamA((prev) => ({ ...prev, fouls: Math.max(0, prev.fouls - 1) }));
      } else {
        setTeamB((prev) => ({ ...prev, fouls: Math.max(0, prev.fouls - 1) }));
      }
    }

    // If timeout was reverted, add timeout back
    if (event.type === 'TIMEOUT') {
      if (event.teamId === 'A') {
        setTeamA((prev) => ({ ...prev, timeoutsLeft: prev.timeoutsLeft + 1 }));
      } else {
        setTeamB((prev) => ({ ...prev, timeoutsLeft: prev.timeoutsLeft + 1 }));
      }
    }
  };

  // Reset match completely
  const handleResetMatch = () => {
    setIsClockRunning(false);
    setQuarter('Q1');
    setSecondsRemaining(settings.quarterMinutes * 60);
    setShotClock(settings.shotClockSeconds);
    setPossession('A');
    setEvents([]);

    setTeamA((prev) => ({ ...prev, score: 0, fouls: 0, timeoutsLeft: 5 }));
    setTeamB((prev) => ({ ...prev, score: 0, fouls: 0, timeoutsLeft: 5 }));

    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        points: 0,
        ftMade: 0,
        fg2Made: 0,
        fg3Made: 0,
        fouls: 0,
      }))
    );
  };

  // Apply new uploaded roster
  const handleApplyRoster = (
    updatedA: Partial<Team>,
    updatedB: Partial<Team>,
    newPlayers: Player[]
  ) => {
    setTeamA((prev) => ({ ...prev, ...updatedA, score: 0, fouls: 0 }));
    setTeamB((prev) => ({ ...prev, ...updatedB, score: 0, fouls: 0 }));
    setPlayers(newPlayers);
    setEvents([]);
    setQuarter('Q1');
    setSecondsRemaining(settings.quarterMinutes * 60);
    setShotClock(settings.shotClockSeconds);
    setIsClockRunning(false);
  };

  // Update teams from settings
  const handleUpdateTeams = (updatedA: Partial<Team>, updatedB: Partial<Team>) => {
    setTeamA((prev) => ({ ...prev, ...updatedA }));
    setTeamB((prev) => ({ ...prev, ...updatedB }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <ScoreboardHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetMatch={handleResetMatch}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Main Scoreboard Arena Display */}
      <ScoreboardDisplay
        teamA={teamA}
        teamB={teamB}
        quarter={quarter}
        setQuarter={setQuarter}
        secondsRemaining={secondsRemaining}
        setSecondsRemaining={setSecondsRemaining}
        isClockRunning={isClockRunning}
        setIsClockRunning={setIsClockRunning}
        shotClock={shotClock}
        setShotClock={setShotClock}
        isShotClockRunning={isShotClockRunning}
        setIsShotClockRunning={setIsShotClockRunning}
        possession={possession}
        setPossession={setPossession}
        settings={settings}
        onTeamPointAdd={handleTeamPointAdd}
        onTeamFoulAdd={handleTeamFoulAdd}
        onTeamTimeoutUse={handleTeamTimeoutUse}
        onPlayBuzzer={handlePlayBuzzer}
        onResetClock={handleResetClock}
      />

      {/* Dynamic Content Views */}
      <main className="flex-1 pb-16">
        {activeTab === 'court' && (
          <CourtRosterControls
            teamA={teamA}
            teamB={teamB}
            players={players}
            settings={settings}
            onPlayerScore={handlePlayerScore}
            onPlayerFoul={handlePlayerFoul}
            onPlayerSub={handlePlayerSub}
            onAddPlayer={handleAddPlayer}
          />
        )}

        {activeTab === 'boxscore' && (
          <BoxScoreTable
            teamA={teamA}
            teamB={teamB}
            players={players}
            events={events}
            quarter={quarter}
            gameTimeFormatted={formatTime(secondsRemaining)}
          />
        )}

        {activeTab === 'history' && (
          <EventHistoryLog
            events={events}
            teamA={teamA}
            teamB={teamB}
            onUndoLastEvent={handleUndoLastEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        )}
      </main>

      {/* Modals */}
      <RosterUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        teamA={teamA}
        teamB={teamB}
        onApplyRoster={handleApplyRoster}
      />

      <GameSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        teamA={teamA}
        teamB={teamB}
        onUpdateTeams={handleUpdateTeams}
        onResetMatch={handleResetMatch}
      />
    </div>
  );
}
