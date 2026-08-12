import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Unsubscribe,
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
  ties: 0,
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
 */
export async function updatePlayerStats(
  playerName: string,
  result: BattleResult,
  correct: number,
  answered: number
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const player = await getPlayer(playerName);
    if (!player) {
      console.error('Player not found:', playerName);
      return false;
    }

    const updates: Partial<BattlePlayerProfile> = {
      totalBattles: player.totalBattles + 1,
      totalCorrect: player.totalCorrect + correct,
      totalAnswered: player.totalAnswered + answered,
      updatedAt: new Date().toISOString(),
    };

    if (result === 'win') {
      updates.wins = player.wins + 1;
      updates.winStreak = player.winStreak + 1;
      // Update longest streak if current exceeds it
      if ((updates.winStreak || 0) > player.longestWinStreak) {
        updates.longestWinStreak = updates.winStreak;
      }
    } else if (result === 'loss') {
      updates.losses = player.losses + 1;
      updates.winStreak = 0; // Reset on loss
      // longestWinStreak stays unchanged
    } else {
      // Tie - no effect on streaks
      updates.ties = player.ties + 1;
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
 * Subscribe to leaderboard changes for real-time updates
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
