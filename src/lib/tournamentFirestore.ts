import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  Unsubscribe,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Tournament,
  TournamentPlayer,
  TournamentRound,
  TournamentMatch,
  TournamentSize,
  CreateTournamentInput,
} from '../types/tournament';
import { isFirebaseConfigured } from './firestore';

// Collection path for tournaments
const TOURNAMENTS_COLLECTION = 'tournaments';

/**
 * Generate a unique tournament ID (4 characters to match battle codes)
 */
function generateTournamentId(): string {
  // Use same characters as battle codes - excludes 0, O, 1, I, L to avoid confusion
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Get the document reference for a tournament
 */
const getTournamentDocRef = (tournamentId: string) =>
  doc(db, TOURNAMENTS_COLLECTION, tournamentId);

/**
 * Create a new tournament
 */
export async function createTournament(
  input: CreateTournamentInput
): Promise<string | null> {
  if (!isFirebaseConfigured()) return null;

  try {
    const id = generateTournamentId();

    // Create host as first player
    const hostPlayer: TournamentPlayer = {
      name: input.hostName,
      emoji: input.hostEmoji,
      seed: 1,
      eliminated: false,
    };

    const tournament: Tournament = {
      id,
      name: input.name,
      hostName: input.hostName,
      status: 'registration',
      createdAt: new Date().toISOString(),
      maxPlayers: input.maxPlayers,
      questionsPerRound: input.questionsPerRound || 20,
      players: [hostPlayer],
      rounds: [],
      currentRound: 0,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };

    const docRef = getTournamentDocRef(id);
    await setDoc(docRef, tournament);
    return id;
  } catch (error) {
    console.error('Error creating tournament:', error);
    return null;
  }
}

/**
 * Get a tournament by ID
 */
export async function getTournament(tournamentId: string): Promise<Tournament | null> {
  if (!isFirebaseConfigured()) return null;

  try {
    const docRef = getTournamentDocRef(tournamentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as Tournament;
    }
    return null;
  } catch (error) {
    console.error('Error getting tournament:', error);
    return null;
  }
}

/**
 * Join a tournament
 */
export async function joinTournament(
  tournamentId: string,
  playerName: string,
  playerEmoji: string
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const tournament = await getTournament(tournamentId);
    if (!tournament) return false;

    // Check if registration is open
    if (tournament.status !== 'registration') return false;

    // Check if tournament is full
    if (tournament.players.length >= tournament.maxPlayers) return false;

    // Check if player already joined
    if (tournament.players.some((p) => p.name.toLowerCase() === playerName.toLowerCase())) {
      return true; // Already joined
    }

    // Add new player
    const newPlayer: TournamentPlayer = {
      name: playerName,
      emoji: playerEmoji,
      seed: tournament.players.length + 1,
      eliminated: false,
    };

    const updatedPlayers = [...tournament.players, newPlayer];

    const docRef = getTournamentDocRef(tournamentId);
    await updateDoc(docRef, {
      players: updatedPlayers,
    });

    return true;
  } catch (error) {
    console.error('Error joining tournament:', error);
    return false;
  }
}

/**
 * Leave a tournament (only during registration)
 */
export async function leaveTournament(
  tournamentId: string,
  playerName: string
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const tournament = await getTournament(tournamentId);
    if (!tournament) return false;

    // Can only leave during registration
    if (tournament.status !== 'registration') return false;

    // Host cannot leave (they must cancel)
    if (playerName.toLowerCase() === tournament.hostName.toLowerCase()) return false;

    // Remove player
    const updatedPlayers = tournament.players.filter(
      (p) => p.name.toLowerCase() !== playerName.toLowerCase()
    );

    // Re-seed remaining players
    updatedPlayers.forEach((p, i) => {
      p.seed = i + 1;
    });

    const docRef = getTournamentDocRef(tournamentId);
    await updateDoc(docRef, {
      players: updatedPlayers,
    });

    return true;
  } catch (error) {
    console.error('Error leaving tournament:', error);
    return false;
  }
}

/**
 * Generate bracket for a tournament
 */
function generateBracket(players: TournamentPlayer[], size: TournamentSize): TournamentRound[] {
  const rounds: TournamentRound[] = [];

  // Calculate number of rounds needed
  const numRounds = Math.log2(size);

  // Shuffle players for random seeding
  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

  // Assign seeds based on shuffle order
  shuffledPlayers.forEach((p, i) => {
    p.seed = i + 1;
  });

  // Create first round matches
  const firstRoundMatches: TournamentMatch[] = [];
  const numFirstRoundMatches = size / 2;

  for (let i = 0; i < numFirstRoundMatches; i++) {
    const player1 = shuffledPlayers[i * 2] || null;
    const player2 = shuffledPlayers[i * 2 + 1] || null;

    const match: TournamentMatch = {
      matchId: `R1M${i + 1}`,
      player1Name: player1?.name || null,
      player2Name: player2?.name || null,
      status: 'pending',
      roundNumber: 1,
      matchIndex: i,
    };

    // If only one player (bye), auto-advance
    if (player1 && !player2) {
      match.winner = player1.name;
      match.status = 'completed';
    } else if (!player1 && player2) {
      match.winner = player2.name;
      match.status = 'completed';
    }

    firstRoundMatches.push(match);
  }

  rounds.push({ roundNumber: 1, matches: firstRoundMatches });

  // Create subsequent rounds with empty matches
  let matchesInRound = numFirstRoundMatches / 2;
  for (let round = 2; round <= numRounds; round++) {
    const roundMatches: TournamentMatch[] = [];

    for (let i = 0; i < matchesInRound; i++) {
      roundMatches.push({
        matchId: `R${round}M${i + 1}`,
        player1Name: null,
        player2Name: null,
        status: 'pending',
        roundNumber: round,
        matchIndex: i,
      });
    }

    rounds.push({ roundNumber: round, matches: roundMatches });
    matchesInRound = matchesInRound / 2;
  }

  return rounds;
}

/**
 * Start a tournament (generates bracket and begins)
 */
export async function startTournament(tournamentId: string): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const tournament = await getTournament(tournamentId);
    if (!tournament) return false;

    // Must be in registration
    if (tournament.status !== 'registration') return false;

    // Need at least 2 players
    if (tournament.players.length < 2) return false;

    // Generate bracket
    const rounds = generateBracket(tournament.players, tournament.maxPlayers);

    const docRef = getTournamentDocRef(tournamentId);
    await updateDoc(docRef, {
      status: 'active',
      rounds,
      currentRound: 1,
      players: tournament.players, // Updated with seeds
    });

    return true;
  } catch (error) {
    console.error('Error starting tournament:', error);
    return false;
  }
}

/**
 * Set battle code for a match
 */
export async function setMatchBattleCode(
  tournamentId: string,
  matchId: string,
  battleCode: string
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const tournament = await getTournament(tournamentId);
    if (!tournament) return false;

    // Find and update the match
    const updatedRounds = tournament.rounds.map((round) => ({
      ...round,
      matches: round.matches.map((match) => {
        if (match.matchId === matchId) {
          return { ...match, battleCode, status: 'active' as const };
        }
        return match;
      }),
    }));

    const docRef = getTournamentDocRef(tournamentId);
    await updateDoc(docRef, { rounds: updatedRounds });

    return true;
  } catch (error) {
    console.error('Error setting match battle code:', error);
    return false;
  }
}

/**
 * Complete a match and advance winner
 */
export async function completeMatch(
  tournamentId: string,
  matchId: string,
  winnerName: string
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const tournament = await getTournament(tournamentId);
    if (!tournament) return false;

    let matchRound = 0;
    let matchIndex = 0;

    // Find the match and update it
    const updatedRounds = tournament.rounds.map((round) => ({
      ...round,
      matches: round.matches.map((match, idx) => {
        if (match.matchId === matchId) {
          matchRound = round.roundNumber;
          matchIndex = idx;
          return { ...match, winner: winnerName, status: 'completed' as const };
        }
        return match;
      }),
    }));

    // Mark loser as eliminated
    const loserName = updatedRounds[matchRound - 1].matches[matchIndex].player1Name === winnerName
      ? updatedRounds[matchRound - 1].matches[matchIndex].player2Name
      : updatedRounds[matchRound - 1].matches[matchIndex].player1Name;

    const updatedPlayers = tournament.players.map((p) => {
      if (p.name.toLowerCase() === loserName?.toLowerCase()) {
        return { ...p, eliminated: true, eliminatedInRound: matchRound };
      }
      return p;
    });

    // Advance winner to next round
    const numRounds = updatedRounds.length;
    if (matchRound < numRounds) {
      // Determine next match position
      const nextMatchIndex = Math.floor(matchIndex / 2);
      const isPlayer1 = matchIndex % 2 === 0;

      const nextRound = updatedRounds[matchRound]; // matchRound is 1-indexed, array is 0-indexed
      if (nextRound && nextRound.matches[nextMatchIndex]) {
        if (isPlayer1) {
          nextRound.matches[nextMatchIndex].player1Name = winnerName;
        } else {
          nextRound.matches[nextMatchIndex].player2Name = winnerName;
        }
      }
    }

    // Check if tournament is complete (all matches in final round are done)
    const finalRound = updatedRounds[numRounds - 1];
    const isTournamentComplete = finalRound.matches.every((m) => m.status === 'completed');

    // Determine current round (first round with pending matches)
    let currentRound = numRounds;
    for (let i = 0; i < numRounds; i++) {
      if (updatedRounds[i].matches.some((m) => m.status !== 'completed')) {
        currentRound = i + 1;
        break;
      }
    }

    // Build final rankings if complete
    let finalRankings: string[] | undefined;
    let winner: string | undefined;

    if (isTournamentComplete) {
      winner = finalRound.matches[0].winner;

      // Build rankings from elimination order
      const eliminated = updatedPlayers
        .filter((p) => p.eliminated && p.eliminatedInRound !== undefined)
        .sort((a, b) => (b.eliminatedInRound || 0) - (a.eliminatedInRound || 0))
        .map((p) => p.name);

      finalRankings = [winner!, ...eliminated];
    }

    const docRef = getTournamentDocRef(tournamentId);
    await updateDoc(docRef, {
      rounds: updatedRounds,
      players: updatedPlayers,
      currentRound,
      status: isTournamentComplete ? 'completed' : 'active',
      ...(winner && { winner }),
      ...(finalRankings && { finalRankings }),
    });

    return true;
  } catch (error) {
    console.error('Error completing match:', error);
    return false;
  }
}

/**
 * Subscribe to tournament updates
 */
export function subscribeToTournament(
  tournamentId: string,
  callback: (tournament: Tournament | null) => void
): Unsubscribe | null {
  if (!isFirebaseConfigured()) return null;

  try {
    const docRef = getTournamentDocRef(tournamentId);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as Tournament);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error subscribing to tournament:', error);
        callback(null);
      }
    );
  } catch (error) {
    console.error('Error setting up tournament subscription:', error);
    return null;
  }
}

/**
 * Get active tournaments for a player
 */
export async function getPlayerTournaments(playerName: string): Promise<Tournament[]> {
  if (!isFirebaseConfigured()) return [];

  try {
    const tournamentsRef = collection(db, TOURNAMENTS_COLLECTION);
    const q = query(
      tournamentsRef,
      where('status', 'in', ['registration', 'active']),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const tournaments: Tournament[] = [];
    querySnapshot.forEach((doc) => {
      const tournament = doc.data() as Tournament;
      // Check if player is in this tournament
      if (tournament.players.some((p) => p.name.toLowerCase() === playerName.toLowerCase())) {
        tournaments.push(tournament);
      }
    });

    return tournaments;
  } catch (error) {
    console.error('Error getting player tournaments:', error);
    return [];
  }
}

/**
 * Get the number of rounds in a tournament
 */
export function getNumRounds(size: TournamentSize): number {
  return Math.log2(size);
}

/**
 * Get round name (e.g., "Quarterfinals", "Semifinals", "Finals")
 */
export function getRoundName(roundNumber: number, totalRounds: number): string {
  const roundsFromEnd = totalRounds - roundNumber;
  switch (roundsFromEnd) {
    case 0:
      return 'Finals';
    case 1:
      return 'Semifinals';
    case 2:
      return 'Quarterfinals';
    default:
      return `Round ${roundNumber}`;
  }
}
