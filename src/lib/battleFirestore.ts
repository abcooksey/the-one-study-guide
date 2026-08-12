import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  Unsubscribe,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Battle, BattlePlayer, BattleAttempt, BattleStatus, PlayerKey } from '../types/battle';
import { isFirebaseConfigured } from './firestore';

// Collection path for battles
const BATTLES_COLLECTION = 'battles';

// All player keys for iteration
const ALL_PLAYER_KEYS: PlayerKey[] = ['player1', 'player2', 'player3', 'player4'];

/**
 * Get the document reference for a battle
 */
const getBattleDocRef = (battleCode: string) => doc(db, BATTLES_COLLECTION, battleCode);

/**
 * Check if a battle exists
 */
export async function battleExists(battleCode: string): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const docRef = getBattleDocRef(battleCode);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error('Error checking battle existence:', error);
    return false;
  }
}

/**
 * Create a new battle
 */
export async function createBattle(battle: Battle): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const docRef = getBattleDocRef(battle.id);
    await setDoc(docRef, battle);
    return true;
  } catch (error) {
    console.error('Error creating battle:', error);
    return false;
  }
}

/**
 * Get a battle by code
 */
export async function getBattle(battleCode: string): Promise<Battle | null> {
  if (!isFirebaseConfigured()) return null;

  try {
    const docRef = getBattleDocRef(battleCode);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as Battle;
    }
    return null;
  } catch (error) {
    console.error('Error getting battle:', error);
    return null;
  }
}

/**
 * Get the count of active players in a battle
 */
export function getPlayerCount(battle: Battle): number {
  let count = 0;
  for (const key of ALL_PLAYER_KEYS) {
    if (battle[key]) count++;
  }
  return count;
}

/**
 * Get the next available player slot
 */
export function getNextAvailableSlot(battle: Battle): PlayerKey | null {
  // Default to 4 if maxPlayers not set (backwards compatibility)
  const maxPlayers = battle.maxPlayers ?? 4;

  // Start from player2 since player1 is always the host
  for (const key of ['player2', 'player3', 'player4'] as PlayerKey[]) {
    if (!battle[key]) {
      // Also check if this slot is within maxPlayers
      const slotIndex = ALL_PLAYER_KEYS.indexOf(key);
      if (slotIndex < maxPlayers) {
        return key;
      }
    }
  }
  return null;
}

/**
 * Check if battle is full
 */
export function isBattleFull(battle: Battle): boolean {
  const count = getPlayerCount(battle);
  // Default to 4 if maxPlayers not set (backwards compatibility)
  const maxPlayers = battle.maxPlayers ?? 4;
  console.log('isBattleFull check:', { count, maxPlayers, rawMaxPlayers: battle.maxPlayers, isFull: count >= maxPlayers });
  return count >= maxPlayers;
}

/**
 * Get all active players (non-null) with their keys
 */
export function getActivePlayers(battle: Battle): Array<{ key: PlayerKey; player: BattlePlayer }> {
  const players: Array<{ key: PlayerKey; player: BattlePlayer }> = [];
  for (const key of ALL_PLAYER_KEYS) {
    const player = battle[key];
    if (player) {
      players.push({ key, player });
    }
  }
  return players;
}

/**
 * Join a battle - finds next available slot
 */
export async function joinBattle(
  battleCode: string,
  player: BattlePlayer
): Promise<{ success: boolean; playerKey: PlayerKey | null }> {
  if (!isFirebaseConfigured()) return { success: false, playerKey: null };

  try {
    // Get current battle state
    const battle = await getBattle(battleCode);
    if (!battle) {
      return { success: false, playerKey: null };
    }

    // Find next available slot
    const nextSlot = getNextAvailableSlot(battle);
    if (!nextSlot) {
      return { success: false, playerKey: null };
    }

    // Determine new status: 'ready' if 2+ players will be present
    const currentCount = getPlayerCount(battle);
    const newStatus = currentCount >= 1 ? 'ready' : battle.status;

    const docRef = getBattleDocRef(battleCode);
    await updateDoc(docRef, {
      [nextSlot]: player,
      status: newStatus,
    });

    return { success: true, playerKey: nextSlot };
  } catch (error) {
    console.error('Error joining battle:', error);
    return { success: false, playerKey: null };
  }
}

/**
 * Set player ready status
 */
export async function setPlayerReady(
  battleCode: string,
  playerKey: PlayerKey,
  isReady: boolean
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const docRef = getBattleDocRef(battleCode);
    await updateDoc(docRef, {
      [`${playerKey}.isReady`]: isReady,
    });
    return true;
  } catch (error) {
    console.error('Error setting player ready:', error);
    return false;
  }
}

/**
 * Start the countdown phase
 */
export async function startCountdown(battleCode: string): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const docRef = getBattleDocRef(battleCode);
    await updateDoc(docRef, {
      status: 'countdown',
      countdownStartedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error starting countdown:', error);
    return false;
  }
}

/**
 * Start the battle (after countdown)
 */
export async function startBattle(battleCode: string): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const docRef = getBattleDocRef(battleCode);
    await updateDoc(docRef, {
      status: 'active',
      battleStartedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error starting battle:', error);
    return false;
  }
}

/**
 * Update player progress during battle
 */
export async function updatePlayerProgress(
  battleCode: string,
  playerKey: PlayerKey,
  updates: {
    currentQuestionIndex?: number;
    attempts?: BattleAttempt[];
    lastHeartbeat?: string;
    finishedAt?: string;
  }
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const docRef = getBattleDocRef(battleCode);
    const updateData: { [key: string]: number | string | BattleAttempt[] } = {};

    if (updates.currentQuestionIndex !== undefined) {
      updateData[`${playerKey}.currentQuestionIndex`] = updates.currentQuestionIndex;
    }
    if (updates.attempts !== undefined) {
      updateData[`${playerKey}.attempts`] = updates.attempts;
    }
    if (updates.lastHeartbeat !== undefined) {
      updateData[`${playerKey}.lastHeartbeat`] = updates.lastHeartbeat;
    }
    if (updates.finishedAt !== undefined) {
      updateData[`${playerKey}.finishedAt`] = updates.finishedAt;
    }

    await updateDoc(docRef, updateData);
    return true;
  } catch (error) {
    console.error('Error updating player progress:', error);
    return false;
  }
}

/**
 * Complete the battle with rankings
 */
export async function completeBattle(
  battleCode: string,
  rankings: PlayerKey[]
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const docRef = getBattleDocRef(battleCode);
    await updateDoc(docRef, {
      status: 'completed',
      rankings,
    });
    return true;
  } catch (error) {
    console.error('Error completing battle:', error);
    return false;
  }
}

/**
 * Update battle status
 */
export async function updateBattleStatus(
  battleCode: string,
  status: BattleStatus
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const docRef = getBattleDocRef(battleCode);
    await updateDoc(docRef, { status });
    return true;
  } catch (error) {
    console.error('Error updating battle status:', error);
    return false;
  }
}

/**
 * Update player connection status (heartbeat)
 */
export async function updatePlayerHeartbeat(
  battleCode: string,
  playerKey: PlayerKey
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const docRef = getBattleDocRef(battleCode);
    await updateDoc(docRef, {
      [`${playerKey}.isConnected`]: true,
      [`${playerKey}.lastHeartbeat`]: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error updating heartbeat:', error);
    return false;
  }
}

/**
 * Mark player as disconnected
 */
export async function markPlayerDisconnected(
  battleCode: string,
  playerKey: PlayerKey
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const docRef = getBattleDocRef(battleCode);
    await updateDoc(docRef, {
      [`${playerKey}.isConnected`]: false,
    });
    return true;
  } catch (error) {
    console.error('Error marking player disconnected:', error);
    return false;
  }
}

/**
 * Remove a player from the battle (set their slot to null)
 */
export async function removePlayerFromBattle(
  battleCode: string,
  playerKey: PlayerKey
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  // Don't allow removing the host (player1)
  if (playerKey === 'player1') {
    console.warn('Cannot remove host from battle');
    return false;
  }

  try {
    const docRef = getBattleDocRef(battleCode);
    await updateDoc(docRef, {
      [playerKey]: null,
    });
    return true;
  } catch (error) {
    console.error('Error removing player from battle:', error);
    return false;
  }
}

/**
 * Check if a player's heartbeat is stale (older than threshold)
 */
export function isHeartbeatStale(player: BattlePlayer, thresholdMs: number = 15000): boolean {
  if (!player.lastHeartbeat) return true;
  const lastHeartbeat = new Date(player.lastHeartbeat).getTime();
  return Date.now() - lastHeartbeat > thresholdMs;
}

/**
 * Subscribe to battle changes (real-time updates)
 */
export function subscribeToBattle(
  battleCode: string,
  callback: (battle: Battle | null) => void
): Unsubscribe | null {
  if (!isFirebaseConfigured()) return null;

  try {
    const docRef = getBattleDocRef(battleCode);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as Battle);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error subscribing to battle:', error);
        callback(null);
      }
    );
  } catch (error) {
    console.error('Error setting up battle subscription:', error);
    return null;
  }
}

/**
 * Delete a battle (for cleanup)
 */
export async function deleteBattle(battleCode: string): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const docRef = getBattleDocRef(battleCode);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting battle:', error);
    return false;
  }
}
