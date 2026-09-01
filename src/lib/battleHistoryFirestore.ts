import {
  doc,
  setDoc,
  collection,
  query,
  orderBy,
  getDocs,
  where,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import { BattleHistoryEntry, HeadToHeadRecord, BattleHistoryStats } from '../types/battleHistory';
import { isFirebaseConfigured } from './firestore';

// Collection paths
const BATTLE_PLAYERS_COLLECTION = 'battlePlayers';
const BATTLE_HISTORY_SUBCOLLECTION = 'battleHistory';

/**
 * Get the subcollection reference for a player's battle history
 */
const getHistoryCollectionRef = (playerName: string) =>
  collection(db, BATTLE_PLAYERS_COLLECTION, playerName.toLowerCase(), BATTLE_HISTORY_SUBCOLLECTION);

/**
 * Save a battle history entry for a player
 */
export async function saveBattleHistoryEntry(
  playerName: string,
  entry: BattleHistoryEntry
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const historyRef = doc(
      db,
      BATTLE_PLAYERS_COLLECTION,
      playerName.toLowerCase(),
      BATTLE_HISTORY_SUBCOLLECTION,
      entry.battleId
    );
    await setDoc(historyRef, entry);
    return true;
  } catch (error) {
    console.error('Error saving battle history entry:', error);
    return false;
  }
}

/**
 * Get all battle history entries for a player
 */
export async function getBattleHistory(
  playerName: string,
  maxEntries: number = 50
): Promise<BattleHistoryEntry[]> {
  if (!isFirebaseConfigured()) return [];

  try {
    const historyRef = getHistoryCollectionRef(playerName);
    const q = query(historyRef, orderBy('date', 'desc'), limit(maxEntries));
    const querySnapshot = await getDocs(q);

    const entries: BattleHistoryEntry[] = [];
    querySnapshot.forEach((doc) => {
      entries.push(doc.data() as BattleHistoryEntry);
    });
    return entries;
  } catch (error) {
    console.error('Error getting battle history:', error);
    return [];
  }
}

/**
 * Get battle history filtered by opponent name
 */
export async function getBattleHistoryWithOpponent(
  playerName: string,
  opponentName: string,
  maxEntries: number = 50
): Promise<BattleHistoryEntry[]> {
  if (!isFirebaseConfigured()) return [];

  try {
    const historyRef = getHistoryCollectionRef(playerName);
    const q = query(
      historyRef,
      where('opponents', 'array-contains', opponentName.toLowerCase()),
      orderBy('date', 'desc'),
      limit(maxEntries)
    );
    const querySnapshot = await getDocs(q);

    const entries: BattleHistoryEntry[] = [];
    querySnapshot.forEach((doc) => {
      entries.push(doc.data() as BattleHistoryEntry);
    });
    return entries;
  } catch (error) {
    console.error('Error getting battle history with opponent:', error);
    return [];
  }
}

/**
 * Calculate head-to-head records against all opponents
 */
export async function getHeadToHeadRecords(
  playerName: string
): Promise<HeadToHeadRecord[]> {
  const history = await getBattleHistory(playerName, 100);
  if (history.length === 0) return [];

  // Group battles by opponent
  const opponentStats: Record<string, { wins: number; losses: number }> = {};

  for (const entry of history) {
    for (const opponent of entry.opponents) {
      const key = opponent.toLowerCase();
      if (!opponentStats[key]) {
        opponentStats[key] = { wins: 0, losses: 0 };
      }

      // Win = 1st place
      if (entry.placement === 1) {
        opponentStats[key].wins++;
      } else {
        opponentStats[key].losses++;
      }
    }
  }

  // Convert to HeadToHeadRecord array
  const records: HeadToHeadRecord[] = Object.entries(opponentStats).map(
    ([name, stats]) => ({
      opponentName: name,
      wins: stats.wins,
      losses: stats.losses,
      totalGames: stats.wins + stats.losses,
      winRate: Math.round((stats.wins / (stats.wins + stats.losses)) * 100),
    })
  );

  // Sort by total games descending
  records.sort((a, b) => b.totalGames - a.totalGames);

  return records;
}

/**
 * Calculate overall battle history stats
 */
export async function getBattleHistoryStats(
  playerName: string
): Promise<BattleHistoryStats> {
  const history = await getBattleHistory(playerName, 100);

  if (history.length === 0) {
    return {
      totalBattles: 0,
      totalWins: 0,
      winRate: 0,
      averageAccuracy: 0,
      averagePlacement: 0,
    };
  }

  const totalBattles = history.length;
  const totalWins = history.filter((e) => e.placement === 1).length;
  const totalAccuracy = history.reduce((sum, e) => sum + e.accuracy, 0);
  const totalPlacement = history.reduce((sum, e) => sum + e.placement, 0);

  return {
    totalBattles,
    totalWins,
    winRate: Math.round((totalWins / totalBattles) * 100),
    averageAccuracy: Math.round(totalAccuracy / totalBattles),
    averagePlacement: Number((totalPlacement / totalBattles).toFixed(1)),
  };
}
