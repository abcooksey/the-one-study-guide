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
import { Battle, BattlePlayer, BattleAttempt, BattleStatus, WinnerResult } from '../types/battle';
import { isFirebaseConfigured } from './firestore';

// Collection path for battles
const BATTLES_COLLECTION = 'battles';

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
 * Update player 2 when they join
 */
export async function joinBattle(
  battleCode: string,
  player2: BattlePlayer
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const docRef = getBattleDocRef(battleCode);
    await updateDoc(docRef, {
      player2,
      status: 'ready',
    });
    return true;
  } catch (error) {
    console.error('Error joining battle:', error);
    return false;
  }
}

/**
 * Set player ready status
 */
export async function setPlayerReady(
  battleCode: string,
  playerKey: 'player1' | 'player2',
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
  playerKey: 'player1' | 'player2',
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
 * Complete the battle with winner determination
 */
export async function completeBattle(
  battleCode: string,
  winnerId: WinnerResult
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const docRef = getBattleDocRef(battleCode);
    await updateDoc(docRef, {
      status: 'completed',
      winnerId,
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
  playerKey: 'player1' | 'player2'
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
  playerKey: 'player1' | 'player2'
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
