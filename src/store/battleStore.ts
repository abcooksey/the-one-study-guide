import { create } from 'zustand';
import { Unsubscribe } from 'firebase/firestore';
import {
  Battle,
  BattlePlayer,
  BattleAttempt,
  PlayerKey,
  CreateBattlePlayerInput,
  BattleStats,
  PlacementResult,
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
  getActivePlayers,
  isBattleFull,
  removePlayerFromBattle,
  markPlayerDisconnected,
  isHeartbeatStale,
} from '../lib/battleFirestore';
import { generateBattleCode } from '../utils/battleCode';

const QUESTIONS_PER_BATTLE = 20;
const HEARTBEAT_INTERVAL = 5000; // 5 seconds
const COUNTDOWN_SECONDS = 10;
const STALE_HEARTBEAT_THRESHOLD = 15000; // 15 seconds

// All player keys for iteration
const ALL_PLAYER_KEYS: PlayerKey[] = ['player1', 'player2', 'player3', 'player4'];

interface BattleState {
  // Current battle state (synced from Firestore)
  battle: Battle | null;
  playerKey: PlayerKey | null;

  // UI state
  isLoading: boolean;
  error: string | null;
  countdownSeconds: number;

  // Subscriptions and intervals
  unsubscribe: Unsubscribe | null;
  heartbeatInterval: NodeJS.Timeout | null;
  countdownInterval: NodeJS.Timeout | null;

  // Actions
  createBattle: (player: CreateBattlePlayerInput, flashcards: Flashcard[], maxPlayers?: 2 | 3 | 4) => Promise<string | null>;
  joinBattle: (code: string, player: CreateBattlePlayerInput) => Promise<boolean>;
  setReady: (isReady: boolean) => Promise<void>;
  startGame: () => Promise<void>;  // Any player can start when 2+ ready
  markAnswer: (flashcardId: string, status: 'correct' | 'incorrect') => Promise<void>;
  goToQuestion: (index: number) => Promise<void>;
  finishBattle: () => Promise<void>;
  leaveBattle: () => void;

  // Internal actions
  subscribeToBattleUpdates: (code: string) => void;
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
  setupBeforeUnload: () => void;
  cleanupBeforeUnload: () => void;
  cleanupStalePlayers: (battle: Battle) => void;
  handleBattleUpdate: (battle: Battle | null) => void;
  checkAndStartCountdown: () => void;
  startCountdownTimer: () => void;
  determineRankings: () => PlayerKey[];

  // Computed
  getCurrentQuestionIndex: () => number;
  getAttempts: () => BattleAttempt[];
  getOpponents: () => BattlePlayer[];
  getPlayer: (key: PlayerKey) => BattlePlayer | null;
  getActivePlayerKeys: () => PlayerKey[];
  getPlayerStats: () => BattleStats | null;
  getStatsForPlayer: (key: PlayerKey) => BattleStats | null;
  getPlacement: (key: PlayerKey) => PlacementResult | null;
  allPlayersFinished: () => boolean;
  canFinish: () => boolean;
  canStartGame: () => boolean;  // True when 2+ players joined and all ready
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

  createBattle: async (player, flashcards, maxPlayers = 4) => {
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

      // Create battle with expanded player slots
      const battle: Battle = {
        id: code,
        status: 'waiting',
        questionIds: selectedIds,
        player1,
        player2: null,
        player3: null,
        player4: null,
        maxPlayers,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      };

      console.log('Creating battle with maxPlayers:', maxPlayers, battle);

      const success = await createBattleFirestore(battle);
      if (!success) {
        set({ error: 'Failed to create battle', isLoading: false });
        return null;
      }

      set({ playerKey: 'player1', isLoading: false });
      get().subscribeToBattleUpdates(code);
      get().startHeartbeat();
      get().setupBeforeUnload();

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

      if (existingBattle.status !== 'waiting' && existingBattle.status !== 'ready') {
        set({ error: 'Battle has already started', isLoading: false });
        return false;
      }

      // Debug logging
      console.log('Battle data:', {
        id: existingBattle.id,
        maxPlayers: existingBattle.maxPlayers,
        player1: !!existingBattle.player1,
        player2: !!existingBattle.player2,
        player3: !!existingBattle.player3,
        player4: !!existingBattle.player4,
        isFull: isBattleFull(existingBattle),
      });

      if (isBattleFull(existingBattle)) {
        set({ error: 'Battle is full', isLoading: false });
        return false;
      }

      // Create new player with same question structure
      const newPlayer: BattlePlayer = {
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

      const result = await joinBattleFirestore(code, newPlayer);
      if (!result.success || !result.playerKey) {
        set({ error: 'Failed to join battle', isLoading: false });
        return false;
      }

      set({ playerKey: result.playerKey, isLoading: false });
      get().subscribeToBattleUpdates(code);
      get().startHeartbeat();
      get().setupBeforeUnload();

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

  startGame: async () => {
    const { battle } = get();
    if (!battle) return;

    // Verify we can start (2+ players, all ready)
    if (!get().canStartGame()) return;

    // Trigger countdown - any player can do this
    await startCountdown(battle.id);
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

    // The opponent(s) finishing or all finishing will trigger rankings determination
    // through the subscription handler
  },

  leaveBattle: () => {
    const state = get();

    // Stop all subscriptions and intervals
    if (state.unsubscribe) {
      state.unsubscribe();
    }
    get().stopHeartbeat();
    get().cleanupBeforeUnload();

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

  setupBeforeUnload: () => {
    const handleBeforeUnload = () => {
      const { battle, playerKey } = get();
      if (battle && playerKey) {
        // Mark player as disconnected when they close the browser
        // Using sendBeacon for reliability during page unload
        markPlayerDisconnected(battle.id, playerKey);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    // Store the handler reference for cleanup
    (window as Window & { __battleBeforeUnload?: () => void }).__battleBeforeUnload = handleBeforeUnload;
  },

  cleanupBeforeUnload: () => {
    const handler = (window as Window & { __battleBeforeUnload?: () => void }).__battleBeforeUnload;
    if (handler) {
      window.removeEventListener('beforeunload', handler);
      delete (window as Window & { __battleBeforeUnload?: () => void }).__battleBeforeUnload;
    }
  },

  cleanupStalePlayers: async (battle: Battle) => {
    // Only the host cleans up stale players to avoid race conditions
    if (!get().isHost()) return;

    // Don't cleanup during active battles or completed battles
    if (battle.status === 'active' || battle.status === 'completed') return;

    const allKeys: PlayerKey[] = ['player2', 'player3', 'player4'];

    for (const key of allKeys) {
      const player = battle[key];
      if (player && isHeartbeatStale(player, STALE_HEARTBEAT_THRESHOLD)) {
        console.log(`Removing stale player: ${player.name} (${key})`);
        await removePlayerFromBattle(battle.id, key);
      }
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

    // Clean up stale players (only host does this during lobby phase)
    get().cleanupStalePlayers(battle);

    // Handle countdown to active transition
    if (battle.status === 'countdown' && previousBattle?.status !== 'countdown') {
      get().startCountdownTimer();
    }

    // Check if battle should complete (all players finished)
    if (battle.status === 'active' && get().allPlayersFinished()) {
      // All finished - determine rankings (only host does this)
      if (get().isHost()) {
        const rankings = get().determineRankings();
        completeBattle(battle.id, rankings);
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

  determineRankings: (): PlayerKey[] => {
    const { battle } = get();
    if (!battle) return [];

    // Get all active players with their keys
    const activePlayers = getActivePlayers(battle);

    // Calculate scores for each player
    const scores = activePlayers.map(({ key, player }) => {
      const correct = player.attempts.filter((a) => a.status === 'correct').length;
      const finishTime = player.finishedAt
        ? new Date(player.finishedAt).getTime()
        : Infinity; // Unfinished = last place

      return { key, correct, finishTime };
    });

    // Sort: most correct first, then fastest time
    scores.sort((a, b) => {
      if (b.correct !== a.correct) {
        return b.correct - a.correct; // Higher correct = better
      }
      return a.finishTime - b.finishTime; // Lower time = better
    });

    // Return ordered player keys
    return scores.map((s) => s.key);
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

  getOpponents: (): BattlePlayer[] => {
    const { battle, playerKey } = get();
    if (!battle || !playerKey) return [];

    const opponents: BattlePlayer[] = [];
    for (const key of ALL_PLAYER_KEYS) {
      if (key !== playerKey && battle[key]) {
        opponents.push(battle[key]!);
      }
    }
    return opponents;
  },

  getPlayer: (key: PlayerKey): BattlePlayer | null => {
    const { battle } = get();
    if (!battle) return null;
    return battle[key] ?? null;
  },

  getActivePlayerKeys: (): PlayerKey[] => {
    const { battle } = get();
    if (!battle) return [];

    const keys: PlayerKey[] = [];
    for (const key of ALL_PLAYER_KEYS) {
      if (battle[key]) {
        keys.push(key);
      }
    }
    return keys;
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

  getStatsForPlayer: (key: PlayerKey): BattleStats | null => {
    const { battle } = get();
    if (!battle) return null;

    const player = battle[key];
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

  getPlacement: (key: PlayerKey): PlacementResult | null => {
    const { battle } = get();
    if (!battle || !battle.rankings) return null;

    const index = battle.rankings.indexOf(key);
    if (index === -1) return null;

    return (index + 1) as PlacementResult;
  },

  allPlayersFinished: (): boolean => {
    const { battle } = get();
    if (!battle) return false;

    const activePlayers = getActivePlayers(battle);
    return activePlayers.length >= 2 && activePlayers.every(({ player }) => player.finishedAt);
  },

  canFinish: () => {
    const { battle, playerKey } = get();
    if (!battle || !playerKey) return false;

    const player = battle[playerKey];
    if (!player) return false;

    // Can finish when all questions are answered
    return !player.attempts.some((a) => a.status === 'unanswered');
  },

  canStartGame: () => {
    const { battle } = get();
    if (!battle) return false;

    // Can only start from 'ready' status (not already counting down or active)
    if (battle.status !== 'ready') return false;

    // Need at least 2 players
    const activePlayers = getActivePlayers(battle);
    if (activePlayers.length < 2) return false;

    // All joined players must be ready
    return activePlayers.every(({ player }) => player.isReady);
  },

  isHost: () => {
    return get().playerKey === 'player1';
  },
}));
