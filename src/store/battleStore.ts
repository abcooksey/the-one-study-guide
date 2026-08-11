import { create } from 'zustand';
import { Unsubscribe } from 'firebase/firestore';
import {
  Battle,
  BattlePlayer,
  BattleAttempt,
  WinnerResult,
  CreateBattlePlayerInput,
  BattleStats,
} from '../types/battle';
import { Flashcard } from '../types';
import {
  createBattle as createBattleFirestore,
  getBattle,
  joinBattle as joinBattleFirestore,
  setPlayerReady,
  startCountdown,
  startBattle,
  updatePlayerProgress,
  completeBattle,
  updatePlayerHeartbeat,
  subscribeToBattle,
  battleExists,
} from '../lib/battleFirestore';
import { generateBattleCode } from '../utils/battleCode';

const QUESTIONS_PER_BATTLE = 20;
const HEARTBEAT_INTERVAL = 5000; // 5 seconds
const COUNTDOWN_SECONDS = 10;

interface BattleState {
  // Current battle state (synced from Firestore)
  battle: Battle | null;
  playerKey: 'player1' | 'player2' | null;

  // UI state
  isLoading: boolean;
  error: string | null;
  countdownSeconds: number;

  // Subscriptions and intervals
  unsubscribe: Unsubscribe | null;
  heartbeatInterval: NodeJS.Timeout | null;
  countdownInterval: NodeJS.Timeout | null;

  // Actions
  createBattle: (player: CreateBattlePlayerInput, flashcards: Flashcard[]) => Promise<string | null>;
  joinBattle: (code: string, player: CreateBattlePlayerInput) => Promise<boolean>;
  setReady: (isReady: boolean) => Promise<void>;
  markAnswer: (flashcardId: string, status: 'correct' | 'incorrect') => Promise<void>;
  goToQuestion: (index: number) => Promise<void>;
  finishBattle: () => Promise<void>;
  leaveBattle: () => void;

  // Internal actions
  subscribeToBattleUpdates: (code: string) => void;
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
  handleBattleUpdate: (battle: Battle | null) => void;
  checkAndStartCountdown: () => void;
  startCountdownTimer: () => void;
  determineWinner: () => WinnerResult;

  // Computed
  getCurrentQuestionIndex: () => number;
  getAttempts: () => BattleAttempt[];
  getOpponent: () => BattlePlayer | null;
  getPlayerStats: () => BattleStats | null;
  getOpponentStats: () => BattleStats | null;
  canFinish: () => boolean;
  isHost: () => boolean;
}

export const useBattleStore = create<BattleState>()((set, get) => ({
  battle: null,
  playerKey: null,
  isLoading: false,
  error: null,
  countdownSeconds: COUNTDOWN_SECONDS,
  unsubscribe: null,
  heartbeatInterval: null,
  countdownInterval: null,

  createBattle: async (player, flashcards) => {
    set({ isLoading: true, error: null });

    try {
      // Generate unique code
      let code = generateBattleCode();
      let attempts = 0;
      const maxAttempts = 10;

      while (await battleExists(code) && attempts < maxAttempts) {
        code = generateBattleCode();
        attempts++;
      }

      if (attempts >= maxAttempts) {
        set({ error: 'Could not generate unique battle code', isLoading: false });
        return null;
      }

      // Select 20 random questions
      const availableFlashcards = flashcards.filter((f) => !f.flag);
      if (availableFlashcards.length < QUESTIONS_PER_BATTLE) {
        set({ error: 'Not enough flashcards available', isLoading: false });
        return null;
      }

      const shuffled = [...availableFlashcards].sort(() => Math.random() - 0.5);
      const selectedIds = shuffled.slice(0, QUESTIONS_PER_BATTLE).map((f) => f.id);

      // Create player 1
      const player1: BattlePlayer = {
        name: player.name,
        emoji: player.emoji,
        isReady: false,
        isConnected: true,
        lastHeartbeat: new Date().toISOString(),
        currentQuestionIndex: 0,
        attempts: selectedIds.map((id) => ({
          flashcardId: id,
          status: 'unanswered' as const,
        })),
      };

      // Create battle
      const battle: Battle = {
        id: code,
        status: 'waiting',
        questionIds: selectedIds,
        player1,
        player2: null,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      };

      const success = await createBattleFirestore(battle);
      if (!success) {
        set({ error: 'Failed to create battle', isLoading: false });
        return null;
      }

      set({ playerKey: 'player1', isLoading: false });
      get().subscribeToBattleUpdates(code);
      get().startHeartbeat();

      return code;
    } catch (error) {
      console.error('Error creating battle:', error);
      set({ error: 'Failed to create battle', isLoading: false });
      return null;
    }
  },

  joinBattle: async (code, player) => {
    set({ isLoading: true, error: null });

    try {
      // Check if battle exists and is joinable
      const existingBattle = await getBattle(code);
      if (!existingBattle) {
        set({ error: 'Battle not found', isLoading: false });
        return false;
      }

      if (existingBattle.status !== 'waiting') {
        set({ error: 'Battle has already started', isLoading: false });
        return false;
      }

      if (existingBattle.player2) {
        set({ error: 'Battle is full', isLoading: false });
        return false;
      }

      // Create player 2 with same question structure
      const player2: BattlePlayer = {
        name: player.name,
        emoji: player.emoji,
        isReady: false,
        isConnected: true,
        lastHeartbeat: new Date().toISOString(),
        currentQuestionIndex: 0,
        attempts: existingBattle.questionIds.map((id) => ({
          flashcardId: id,
          status: 'unanswered' as const,
        })),
      };

      const success = await joinBattleFirestore(code, player2);
      if (!success) {
        set({ error: 'Failed to join battle', isLoading: false });
        return false;
      }

      set({ playerKey: 'player2', isLoading: false });
      get().subscribeToBattleUpdates(code);
      get().startHeartbeat();

      return true;
    } catch (error) {
      console.error('Error joining battle:', error);
      set({ error: 'Failed to join battle', isLoading: false });
      return false;
    }
  },

  setReady: async (isReady) => {
    const { battle, playerKey } = get();
    if (!battle || !playerKey) return;

    await setPlayerReady(battle.id, playerKey, isReady);
    // The update will come through the subscription
  },

  markAnswer: async (flashcardId, status) => {
    const { battle, playerKey } = get();
    if (!battle || !playerKey) return;

    const player = battle[playerKey];
    if (!player) return;

    const attemptIndex = player.attempts.findIndex((a) => a.flashcardId === flashcardId);
    if (attemptIndex === -1) return;

    // Only allow marking if unanswered
    if (player.attempts[attemptIndex].status !== 'unanswered') return;

    const newAttempts = [...player.attempts];
    newAttempts[attemptIndex] = {
      ...newAttempts[attemptIndex],
      status,
      answeredAt: new Date().toISOString(),
    };

    await updatePlayerProgress(battle.id, playerKey, {
      attempts: newAttempts,
    });
  },

  goToQuestion: async (index) => {
    const { battle, playerKey } = get();
    if (!battle || !playerKey) return;

    await updatePlayerProgress(battle.id, playerKey, {
      currentQuestionIndex: index,
    });
  },

  finishBattle: async () => {
    const { battle, playerKey } = get();
    if (!battle || !playerKey) return;

    // Mark player as finished
    await updatePlayerProgress(battle.id, playerKey, {
      finishedAt: new Date().toISOString(),
    });

    // The opponent finishing or both finishing will trigger winner determination
    // through the subscription handler
  },

  leaveBattle: () => {
    const state = get();

    // Stop all subscriptions and intervals
    if (state.unsubscribe) {
      state.unsubscribe();
    }
    get().stopHeartbeat();

    // Clear countdown if running
    if (state.countdownInterval) {
      clearInterval(state.countdownInterval);
    }

    // Reset state
    set({
      battle: null,
      playerKey: null,
      isLoading: false,
      error: null,
      countdownSeconds: COUNTDOWN_SECONDS,
      unsubscribe: null,
      heartbeatInterval: null,
      countdownInterval: null,
    });
  },

  subscribeToBattleUpdates: (code) => {
    const unsubscribe = subscribeToBattle(code, (battle) => {
      get().handleBattleUpdate(battle);
    });

    if (unsubscribe) {
      set({ unsubscribe });
    }
  },

  startHeartbeat: () => {
    const interval = setInterval(async () => {
      const { battle, playerKey } = get();
      if (battle && playerKey) {
        await updatePlayerHeartbeat(battle.id, playerKey);
      }
    }, HEARTBEAT_INTERVAL);

    set({ heartbeatInterval: interval });
  },

  stopHeartbeat: () => {
    const { heartbeatInterval } = get();
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      set({ heartbeatInterval: null });
    }
  },

  handleBattleUpdate: (battle) => {
    if (!battle) {
      // Battle was deleted or doesn't exist
      get().leaveBattle();
      return;
    }

    const previousBattle = get().battle;
    set({ battle });

    // Check if both players are ready and we need to start countdown
    if (battle.status === 'ready' && battle.player1?.isReady && battle.player2?.isReady) {
      // Only host triggers countdown
      if (get().isHost()) {
        get().checkAndStartCountdown();
      }
    }

    // Handle countdown to active transition
    if (battle.status === 'countdown' && previousBattle?.status !== 'countdown') {
      get().startCountdownTimer();
    }

    // Check if battle should complete (both players finished)
    if (battle.status === 'active') {
      const p1Finished = battle.player1?.finishedAt;
      const p2Finished = battle.player2?.finishedAt;

      if (p1Finished && p2Finished) {
        // Both finished - determine winner (only host does this)
        if (get().isHost()) {
          const winner = get().determineWinner();
          completeBattle(battle.id, winner);
        }
      }
    }
  },

  checkAndStartCountdown: async () => {
    const { battle } = get();
    if (!battle) return;

    // Trigger countdown
    await startCountdown(battle.id);
  },

  startCountdownTimer: () => {
    // Clear any existing countdown
    const { countdownInterval, battle } = get();
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    if (!battle?.countdownStartedAt) {
      set({ countdownSeconds: COUNTDOWN_SECONDS });
      return;
    }

    // Calculate remaining time based on server timestamp for synchronization
    const countdownStartTime = new Date(battle.countdownStartedAt).getTime();
    const calculateRemainingSeconds = () => {
      const elapsed = (Date.now() - countdownStartTime) / 1000;
      return Math.max(0, Math.ceil(COUNTDOWN_SECONDS - elapsed));
    };

    // Set initial countdown based on elapsed time
    set({ countdownSeconds: calculateRemainingSeconds() });

    const interval = setInterval(async () => {
      const { battle } = get();
      const remaining = calculateRemainingSeconds();

      if (remaining <= 0) {
        clearInterval(interval);
        set({ countdownInterval: null, countdownSeconds: 0 });

        // Start the battle (only host does this)
        if (battle && get().isHost()) {
          await startBattle(battle.id);
        }
      } else {
        set({ countdownSeconds: remaining });
      }
    }, 100); // Check more frequently for accuracy

    set({ countdownInterval: interval });
  },

  determineWinner: () => {
    const { battle } = get();
    if (!battle || !battle.player1 || !battle.player2) return 'tie';

    const p1Correct = battle.player1.attempts.filter((a) => a.status === 'correct').length;
    const p2Correct = battle.player2.attempts.filter((a) => a.status === 'correct').length;

    // Primary: Most correct answers
    if (p1Correct > p2Correct) return 'player1';
    if (p2Correct > p1Correct) return 'player2';

    // Tie-breaker: Who finished first
    const p1Time = battle.player1.finishedAt ? new Date(battle.player1.finishedAt).getTime() : Infinity;
    const p2Time = battle.player2.finishedAt ? new Date(battle.player2.finishedAt).getTime() : Infinity;

    if (p1Time < p2Time) return 'player1';
    if (p2Time < p1Time) return 'player2';

    // True tie
    return 'tie';
  },

  getCurrentQuestionIndex: () => {
    const { battle, playerKey } = get();
    if (!battle || !playerKey) return 0;

    const player = battle[playerKey];
    return player?.currentQuestionIndex ?? 0;
  },

  getAttempts: () => {
    const { battle, playerKey } = get();
    if (!battle || !playerKey) return [];

    const player = battle[playerKey];
    return player?.attempts ?? [];
  },

  getOpponent: () => {
    const { battle, playerKey } = get();
    if (!battle || !playerKey) return null;

    const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
    return battle[opponentKey] ?? null;
  },

  getPlayerStats: () => {
    const { battle, playerKey } = get();
    if (!battle || !playerKey) return null;

    const player = battle[playerKey];
    if (!player) return null;

    const correct = player.attempts.filter((a) => a.status === 'correct').length;
    const incorrect = player.attempts.filter((a) => a.status === 'incorrect').length;
    const total = correct + incorrect;

    const startTime = battle.battleStartedAt ? new Date(battle.battleStartedAt).getTime() : 0;
    const endTime = player.finishedAt ? new Date(player.finishedAt).getTime() : Date.now();

    return {
      correct,
      incorrect,
      totalTime: endTime - startTime,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  },

  getOpponentStats: () => {
    const { battle, playerKey } = get();
    if (!battle || !playerKey) return null;

    const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
    const opponent = battle[opponentKey];
    if (!opponent) return null;

    const correct = opponent.attempts.filter((a) => a.status === 'correct').length;
    const incorrect = opponent.attempts.filter((a) => a.status === 'incorrect').length;
    const total = correct + incorrect;

    const startTime = battle.battleStartedAt ? new Date(battle.battleStartedAt).getTime() : 0;
    const endTime = opponent.finishedAt ? new Date(opponent.finishedAt).getTime() : Date.now();

    return {
      correct,
      incorrect,
      totalTime: endTime - startTime,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  },

  canFinish: () => {
    const { battle, playerKey } = get();
    if (!battle || !playerKey) return false;

    const player = battle[playerKey];
    if (!player) return false;

    // Can finish when all questions are answered
    return !player.attempts.some((a) => a.status === 'unanswered');
  },

  isHost: () => {
    return get().playerKey === 'player1';
  },
}));
