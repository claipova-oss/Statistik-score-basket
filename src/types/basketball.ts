export type TeamId = 'A' | 'B';

export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'OT1' | 'OT2' | 'OT3';

export interface Player {
  id: string;
  teamId: TeamId;
  number: number;
  name: string;
  position?: string;
  isOnCourt: boolean;
  // Stats
  points: number;
  ftMade: number;
  fg2Made: number;
  fg3Made: number;
  fouls: number;
}

export interface Team {
  id: TeamId;
  name: string;
  shortName: string;
  primaryColor: string; // Tailwind hex or color code
  textColor: string;
  score: number;
  timeoutsLeft: number;
  fouls: number; // current quarter team fouls
}

export type MatchEventType = '1PT' | '2PT' | '3PT' | 'FOUL' | 'TIMEOUT' | 'QUARTER_CHANGE' | 'CORRECTION';

export interface MatchEvent {
  id: string;
  timestamp: number;
  gameTimeFormatted: string; // e.g. "08:42"
  quarter: Quarter;
  teamId: TeamId;
  playerId?: string;
  playerName?: string;
  playerNumber?: number;
  type: MatchEventType;
  pointsDelta: number;
  teamAScoreAfter: number;
  teamBScoreAfter: number;
  note: string;
}

export interface GameSettings {
  quarterMinutes: number; // default 10
  enableShotClock: boolean;
  shotClockSeconds: number; // default 24
  maxPersonalFouls: number; // default 5
  bonusFoulThreshold: number; // default 5
  soundEnabled: boolean;
}

export interface ParsedRosterRow {
  team: string; // "A" or "B" or Team Name
  number: number;
  name: string;
  position?: string;
  starter?: boolean;
}
