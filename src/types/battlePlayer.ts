// Battle Player Profile Types
// Tracks player statistics across multiple battle sessions

import { PlacementResult } from './battle';

export interface BattlePlayerProfile {
  name: string;                    // Unique identifier, max 5 chars, lowercase
  displayName: string;             // Original casing for display
  emoji: string;                   // Character avatar path
  createdAt: string;               // ISO timestamp
  updatedAt: string;               // ISO timestamp

  // Statistics
  totalBattles: number;
  wins: number;                    // Total wins (= firstPlaces, kept for leaderboard compatibility)
  losses: number;                  // 2nd, 3rd, or 4th place finishes

  // Placement tracking
  firstPlaces: number;             // Only this counts as "win"
  secondPlaces: number;
  thirdPlaces: number;
  fourthPlaces: number;

  // Correctness tracking
  totalCorrect: number;            // Sum of all correct answers
  totalAnswered: number;           // Sum of (correct + incorrect), excludes flagged

  // Streak tracking
  winStreak: number;               // Current consecutive wins (1st places)
  longestWinStreak: number;        // Best streak ever achieved
}

export interface LeaderboardEntry {
  rank: number;
  player: BattlePlayerProfile;
  correctnessPercent: number;
}

// Placement-based result type
export type BattleResult = PlacementResult;  // 1, 2, 3, or 4

export interface BattleStatsUpdate {
  result: BattleResult;
  correct: number;
  incorrect: number;
}
