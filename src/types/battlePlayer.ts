// Battle Player Profile Types
// Tracks player statistics across multiple battle sessions

export interface BattlePlayerProfile {
  name: string;                    // Unique identifier, max 5 chars, lowercase
  displayName: string;             // Original casing for display
  emoji: string;                   // Character avatar path
  createdAt: string;               // ISO timestamp
  updatedAt: string;               // ISO timestamp

  // Statistics
  totalBattles: number;
  wins: number;
  losses: number;
  ties: number;

  // Correctness tracking
  totalCorrect: number;            // Sum of all correct answers
  totalAnswered: number;           // Sum of (correct + incorrect), excludes flagged

  // Streak tracking
  winStreak: number;               // Current consecutive wins
  longestWinStreak: number;        // Best streak ever achieved
}

export interface LeaderboardEntry {
  rank: number;
  player: BattlePlayerProfile;
  correctnessPercent: number;
}

export type BattleResult = 'win' | 'loss' | 'tie';

export interface BattleStatsUpdate {
  result: BattleResult;
  correct: number;
  incorrect: number;
}
