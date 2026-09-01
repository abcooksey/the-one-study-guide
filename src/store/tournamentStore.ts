import { create } from 'zustand';
import { Unsubscribe } from 'firebase/firestore';
import {
  Tournament,
  TournamentMatch,
  CreateTournamentInput,
} from '../types/tournament';
import {
  createTournament as createTournamentFirestore,
  getTournament,
  joinTournament as joinTournamentFirestore,
  leaveTournament as leaveTournamentFirestore,
  startTournament as startTournamentFirestore,
  setMatchBattleCode,
  completeMatch as completeMatchFirestore,
  subscribeToTournament,
  getNumRounds,
  getRoundName,
} from '../lib/tournamentFirestore';

interface TournamentState {
  // Current tournament state (synced from Firestore)
  tournament: Tournament | null;
  playerName: string | null;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Subscription
  unsubscribe: Unsubscribe | null;

  // Actions
  createTournament: (input: CreateTournamentInput) => Promise<string | null>;
  joinTournament: (tournamentId: string, name: string, emoji: string) => Promise<boolean>;
  leaveTournament: () => Promise<boolean>;
  startTournament: () => Promise<boolean>;
  createMatchBattle: (matchId: string, battleCode: string) => Promise<boolean>;
  completeMatch: (matchId: string, winnerName: string) => Promise<boolean>;
  loadTournament: (tournamentId: string, playerName: string) => Promise<boolean>;
  clearTournament: () => void;

  // Computed
  isHost: () => boolean;
  isRegistrationOpen: () => boolean;
  canStart: () => boolean;
  getCurrentMatch: () => TournamentMatch | null;
  getPlayerMatch: () => TournamentMatch | null;
  getNumRounds: () => number;
  getRoundName: (roundNumber: number) => string;
}

export const useTournamentStore = create<TournamentState>()((set, get) => ({
  tournament: null,
  playerName: null,
  isLoading: false,
  error: null,
  unsubscribe: null,

  createTournament: async (input) => {
    set({ isLoading: true, error: null });

    try {
      const tournamentId = await createTournamentFirestore(input);
      if (!tournamentId) {
        set({ error: 'Failed to create tournament', isLoading: false });
        return null;
      }

      // Subscribe to updates
      const unsubscribe = subscribeToTournament(tournamentId, (tournament) => {
        set({ tournament });
      });

      set({
        playerName: input.hostName,
        unsubscribe,
        isLoading: false,
      });

      return tournamentId;
    } catch (error) {
      console.error('Error creating tournament:', error);
      set({ error: 'Failed to create tournament', isLoading: false });
      return null;
    }
  },

  joinTournament: async (tournamentId, name, emoji) => {
    set({ isLoading: true, error: null });

    try {
      const success = await joinTournamentFirestore(tournamentId, name, emoji);
      if (!success) {
        set({ error: 'Failed to join tournament', isLoading: false });
        return false;
      }

      // Subscribe to updates
      const unsubscribe = subscribeToTournament(tournamentId, (tournament) => {
        set({ tournament });
      });

      set({
        playerName: name,
        unsubscribe,
        isLoading: false,
      });

      return true;
    } catch (error) {
      console.error('Error joining tournament:', error);
      set({ error: 'Failed to join tournament', isLoading: false });
      return false;
    }
  },

  leaveTournament: async () => {
    const { tournament, playerName, unsubscribe } = get();
    if (!tournament || !playerName) return false;

    const success = await leaveTournamentFirestore(tournament.id, playerName);
    if (success) {
      if (unsubscribe) unsubscribe();
      set({
        tournament: null,
        playerName: null,
        unsubscribe: null,
      });
    }
    return success;
  },

  startTournament: async () => {
    const { tournament } = get();
    if (!tournament) return false;

    set({ isLoading: true, error: null });

    const success = await startTournamentFirestore(tournament.id);
    if (!success) {
      set({ error: 'Failed to start tournament', isLoading: false });
      return false;
    }

    set({ isLoading: false });
    return true;
  },

  createMatchBattle: async (matchId, battleCode) => {
    const { tournament } = get();
    if (!tournament) return false;

    return setMatchBattleCode(tournament.id, matchId, battleCode);
  },

  completeMatch: async (matchId, winnerName) => {
    const { tournament } = get();
    if (!tournament) return false;

    return completeMatchFirestore(tournament.id, matchId, winnerName);
  },

  loadTournament: async (tournamentId, playerName) => {
    set({ isLoading: true, error: null });

    try {
      const tournament = await getTournament(tournamentId);
      if (!tournament) {
        set({ error: 'Tournament not found', isLoading: false });
        return false;
      }

      // Verify player is in tournament
      const isPlayer = tournament.players.some(
        (p) => p.name.toLowerCase() === playerName.toLowerCase()
      );
      if (!isPlayer) {
        set({ error: 'You are not in this tournament', isLoading: false });
        return false;
      }

      // Subscribe to updates
      const unsubscribe = subscribeToTournament(tournamentId, (t) => {
        set({ tournament: t });
      });

      set({
        tournament,
        playerName,
        unsubscribe,
        isLoading: false,
      });

      return true;
    } catch (error) {
      console.error('Error loading tournament:', error);
      set({ error: 'Failed to load tournament', isLoading: false });
      return false;
    }
  },

  clearTournament: () => {
    const { unsubscribe } = get();
    if (unsubscribe) unsubscribe();

    set({
      tournament: null,
      playerName: null,
      unsubscribe: null,
      isLoading: false,
      error: null,
    });
  },

  isHost: () => {
    const { tournament, playerName } = get();
    if (!tournament || !playerName) return false;
    return tournament.hostName.toLowerCase() === playerName.toLowerCase();
  },

  isRegistrationOpen: () => {
    const { tournament } = get();
    return tournament?.status === 'registration';
  },

  canStart: () => {
    const { tournament } = get();
    if (!tournament) return false;
    return (
      tournament.status === 'registration' &&
      tournament.players.length >= 2 &&
      get().isHost()
    );
  },

  getCurrentMatch: () => {
    const { tournament } = get();
    if (!tournament || tournament.status !== 'active') return null;

    // Find first pending match in current round
    const currentRound = tournament.rounds[tournament.currentRound - 1];
    if (!currentRound) return null;

    return currentRound.matches.find((m) => m.status === 'pending') || null;
  },

  getPlayerMatch: () => {
    const { tournament, playerName } = get();
    if (!tournament || !playerName || tournament.status !== 'active') return null;

    // Find match where player is participating and not complete
    for (const round of tournament.rounds) {
      for (const match of round.matches) {
        if (match.status !== 'completed') {
          const isPlayer1 = match.player1Name?.toLowerCase() === playerName.toLowerCase();
          const isPlayer2 = match.player2Name?.toLowerCase() === playerName.toLowerCase();
          if (isPlayer1 || isPlayer2) {
            return match;
          }
        }
      }
    }
    return null;
  },

  getNumRounds: () => {
    const { tournament } = get();
    if (!tournament) return 0;
    return getNumRounds(tournament.maxPlayers);
  },

  getRoundName: (roundNumber) => {
    const totalRounds = get().getNumRounds();
    return getRoundName(roundNumber, totalRounds);
  },
}));
