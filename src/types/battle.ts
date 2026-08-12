// Battle Mode Types
// Real-time multiplayer mode where two players compete head-to-head

export type BattleStatus =
  | 'waiting'    // Player 1 created, waiting for player 2
  | 'ready'      // Both players joined, waiting for ready confirmation
  | 'countdown'  // Both ready, countdown in progress
  | 'active'     // Battle in progress
  | 'completed'  // Battle finished
  | 'abandoned'; // One or both players left

export type WinnerResult = 'player1' | 'player2' | 'tie';

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
  player1: BattlePlayer;
  player2: BattlePlayer | null;
  countdownStartedAt?: string;
  battleStartedAt?: string;
  winnerId?: WinnerResult;
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
