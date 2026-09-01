// Battle History Types
// Tracks individual battle records for each player

export interface BattleHistoryEntry {
  battleId: string;
  date: string;                    // ISO timestamp
  opponents: string[];             // Other player names
  placement: 1 | 2 | 3 | 4;
  totalPlayers: number;
  correct: number;
  answered: number;
  accuracy: number;
  duration: number;                // milliseconds
}

export interface HeadToHeadRecord {
  opponentName: string;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;                 // percentage
}

export interface BattleHistoryStats {
  totalBattles: number;
  totalWins: number;
  winRate: number;                 // percentage
  averageAccuracy: number;         // percentage
  averagePlacement: number;
}
