import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Unsubscribe,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { BattlePlayerProfile, BattleResult, LeaderboardEntry } from '../types/battlePlayer';
import { isFirebaseConfigured } from './firestore';

// Collection path for battle players
const BATTLE_PLAYERS_COLLECTION = 'battlePlayers';

/**
 * Get the document reference for a battle player
 * Uses lowercase name as document ID for case-insensitive lookup
 */
const getPlayerDocRef = (playerName: string) =>
  doc(db, BATTLE_PLAYERS_COLLECTION, playerName.toLowerCase());

/**
 * Create a new player profile with default stats
 */
const createDefaultPlayer = (name: string, emoji: string): BattlePlayerProfile => ({
  name: name.toLowerCase(),
  displayName: name,
  emoji,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  totalBattles: 0,
  wins: 0,
  losses: 0,
  firstPlaces: 0,
  secondPlaces: 0,
  thirdPlaces: 0,
  fourthPlaces: 0,
  totalCorrect: 0,
  totalAnswered: 0,
  winStreak: 0,
  longestWinStreak: 0,
});

/**
 * Get an existing player by name
 */
export async function getPlayer(name: string): Promise<BattlePlayerProfile | null> {
  if (!isFirebaseConfigured()) return null;

  try {
    const docRef = getPlayerDocRef(name);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as BattlePlayerProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting player:', error);
    return null;
  }
}

/**
 * Get or create a player profile
 * If player exists, returns existing profile (ignores emoji parameter)
 * If player doesn't exist, creates new profile with given name and emoji
 */
export async function getOrCreatePlayer(
  name: string,
  emoji: string
): Promise<BattlePlayerProfile | null> {
  if (!isFirebaseConfigured()) return null;

  try {
    const existingPlayer = await getPlayer(name);
    if (existingPlayer) {
      return existingPlayer;
    }

    // Create new player
    const newPlayer = createDefaultPlayer(name, emoji);
    const docRef = getPlayerDocRef(name);
    await setDoc(docRef, newPlayer);
    return newPlayer;
  } catch (error) {
    console.error('Error getting or creating player:', error);
    return null;
  }
}

/**
 * Get all players for returning player dropdown
 */
export async function getAllPlayers(): Promise<BattlePlayerProfile[]> {
  if (!isFirebaseConfigured()) return [];

  try {
    const playersRef = collection(db, BATTLE_PLAYERS_COLLECTION);
    const q = query(playersRef, orderBy('displayName'));
    const querySnapshot = await getDocs(q);

    const players: BattlePlayerProfile[] = [];
    querySnapshot.forEach((doc) => {
      players.push(doc.data() as BattlePlayerProfile);
    });
    return players;
  } catch (error) {
    console.error('Error getting all players:', error);
    return [];
  }
}

/**
 * Get top N players by wins for leaderboard
 */
export async function getLeaderboard(maxPlayers: number = 5): Promise<LeaderboardEntry[]> {
  if (!isFirebaseConfigured()) return [];

  try {
    const playersRef = collection(db, BATTLE_PLAYERS_COLLECTION);
    const q = query(playersRef, orderBy('wins', 'desc'), limit(maxPlayers));
    const querySnapshot = await getDocs(q);

    const entries: LeaderboardEntry[] = [];
    let rank = 1;
    querySnapshot.forEach((doc) => {
      const player = doc.data() as BattlePlayerProfile;
      // Only include players who have played at least one battle
      if (player.totalBattles > 0) {
        const correctnessPercent =
          player.totalAnswered > 0
            ? Math.round((player.totalCorrect / player.totalAnswered) * 100)
            : 0;
        entries.push({ rank: rank++, player, correctnessPercent });
      }
    });
    return entries;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}

/**
 * Update player stats after a battle
 * Uses atomic increments for counters to prevent race conditions
 * @param playerName - The player's name
 * @param placement - The player's placement (1, 2, 3, or 4)
 * @param correct - Number of correct answers
 * @param answered - Total questions answered
 */
export async function updatePlayerStats(
  playerName: string,
  placement: BattleResult,
  correct: number,
  answered: number
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    // We still need to read for streak logic (conditional updates)
    const player = await getPlayer(playerName);
    if (!player) {
      console.error('Player not found:', playerName);
      return false;
    }

    // Use atomic increments for counters to prevent race conditions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {
      totalBattles: increment(1),
      totalCorrect: increment(correct),
      totalAnswered: increment(answered),
      updatedAt: new Date().toISOString(),
    };

    // Update placement-specific counters with atomic increments
    switch (placement) {
      case 1:
        updates.firstPlaces = increment(1);
        updates.wins = increment(1);
        // Streak logic requires knowing current value
        const newWinStreak = player.winStreak + 1;
        updates.winStreak = newWinStreak;
        // Update longest streak if current exceeds it
        if (newWinStreak > player.longestWinStreak) {
          updates.longestWinStreak = newWinStreak;
        }
        break;
      case 2:
        updates.secondPlaces = increment(1);
        updates.losses = increment(1);
        updates.winStreak = 0;  // Reset streak on non-win
        break;
      case 3:
        updates.thirdPlaces = increment(1);
        updates.losses = increment(1);
        updates.winStreak = 0;
        break;
      case 4:
        updates.fourthPlaces = increment(1);
        updates.losses = increment(1);
        updates.winStreak = 0;
        break;
    }

    const docRef = getPlayerDocRef(playerName);
    await updateDoc(docRef, updates);
    return true;
  } catch (error) {
    console.error('Error updating player stats:', error);
    return false;
  }
}

/**
 * Subscribe to leaderboard changes for real-time updates (limited)
 */
export function subscribeToLeaderboard(
  callback: (entries: LeaderboardEntry[]) => void,
  maxPlayers: number = 5
): Unsubscribe | null {
  if (!isFirebaseConfigured()) return null;

  try {
    const playersRef = collection(db, BATTLE_PLAYERS_COLLECTION);
    const q = query(playersRef, orderBy('wins', 'desc'), limit(maxPlayers));

    return onSnapshot(
      q,
      (querySnapshot) => {
        const entries: LeaderboardEntry[] = [];
        let rank = 1;
        querySnapshot.forEach((doc) => {
          const player = doc.data() as BattlePlayerProfile;
          // Only include players who have played at least one battle
          if (player.totalBattles > 0) {
            const correctnessPercent =
              player.totalAnswered > 0
                ? Math.round((player.totalCorrect / player.totalAnswered) * 100)
                : 0;
            entries.push({ rank: rank++, player, correctnessPercent });
          }
        });
        callback(entries);
      },
      (error) => {
        console.error('Error subscribing to leaderboard:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up leaderboard subscription:', error);
    return null;
  }
}

/**
 * Subscribe to ALL players for full leaderboard with pagination
 */
export function subscribeToAllLeaderboard(
  callback: (entries: LeaderboardEntry[]) => void
): Unsubscribe | null {
  if (!isFirebaseConfigured()) return null;

  try {
    const playersRef = collection(db, BATTLE_PLAYERS_COLLECTION);
    const q = query(playersRef, orderBy('wins', 'desc'));

    return onSnapshot(
      q,
      (querySnapshot) => {
        const entries: LeaderboardEntry[] = [];
        let rank = 1;
        querySnapshot.forEach((doc) => {
          const player = doc.data() as BattlePlayerProfile;
          // Only include players who have played at least one battle
          if (player.totalBattles > 0) {
            const correctnessPercent =
              player.totalAnswered > 0
                ? Math.round((player.totalCorrect / player.totalAnswered) * 100)
                : 0;
            entries.push({ rank: rank++, player, correctnessPercent });
          }
        });
        callback(entries);
      },
      (error) => {
        console.error('Error subscribing to all leaderboard:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up all leaderboard subscription:', error);
    return null;
  }
}

/**
 * Delete a player profile completely
 * @param playerName - The player's name to delete
 */
export async function deletePlayer(playerName: string): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const docRef = getPlayerDocRef(playerName);
    await deleteDoc(docRef);
    console.log(`Deleted player: ${playerName}`);
    return true;
  } catch (error) {
    console.error('Error deleting player:', error);
    return false;
  }
}
