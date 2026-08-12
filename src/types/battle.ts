// Battle Mode Types
// Real-time multiplayer mode where 2-4 players compete head-to-head

export type BattleStatus =
  | 'waiting'    // 1 player, waiting for 2-4 total
  | 'ready'      // 2+ players joined, waiting for all to ready up
  | 'countdown'  // All ready, countdown in progress
  | 'active'     // Battle in progress
  | 'completed'  // Battle finished
  | 'abandoned'; // Player(s) disconnected

// Expanded PlayerKey type for 2-4 players
export type PlayerKey = 'player1' | 'player2' | 'player3' | 'player4';

// Placement result for stats tracking (1st, 2nd, 3rd, 4th)
export type PlacementResult = 1 | 2 | 3 | 4;

export interface BattleAttempt {
  flashcardId: string;
  status: 'correct' | 'incorrect' | 'unanswered';
  answeredAt?: string;
}

export interface BattlePlayer {
  name: string;
  emoji: string;
  isReady: boolean;
  isConnected: boolean;
  lastHeartbeat: string;
  currentQuestionIndex: number;
  attempts: BattleAttempt[];
  finishedAt?: string;
}

export interface Battle {
  id: string;                    // 4-digit code (e.g., "7A3K")
  status: BattleStatus;
  questionIds: string[];         // 20 flashcard IDs in order

  // Player slots - keep named fields for Firestore compatibility
  player1: BattlePlayer;
  player2: BattlePlayer | null;
  player3: BattlePlayer | null;
  player4: BattlePlayer | null;

  // Battle configuration
  maxPlayers: 2 | 3 | 4;         // Set by host when creating

  countdownStartedAt?: string;
  battleStartedAt?: string;

  // Results - ordered array of player keys by rank (1st to last)
  // e.g., ['player3', 'player1', 'player4', 'player2']
  rankings?: PlayerKey[];

  expiresAt: string;             // TTL for cleanup (1 hour)
}

// For creating a new player when joining a battle
export interface CreateBattlePlayerInput {
  name: string;
  emoji: string;
  isReturningPlayer?: boolean;  // Flag for stats tracking
}

// Battle statistics for results page
export interface BattleStats {
  correct: number;
  incorrect: number;
  totalTime: number; // milliseconds from start to finish
  accuracy: number;  // percentage
}
