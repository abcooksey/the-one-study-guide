import {
  doc,
  collection,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { isFirebaseConfigured } from './firestore';

// Collection path: battlePlayers/{playerName}/practiceFlags/{flashcardId}
const BATTLE_PLAYERS_COLLECTION = 'battlePlayers';
const PRACTICE_FLAGS_SUBCOLLECTION = 'practiceFlags';

export interface PracticeFlag {
  flashcardId: string;
  flaggedAt: string;
  flaggedFromBattleId: string;
  correctStreak: number;
}

/**
 * Normalize player name to use as document ID (lowercase, trimmed)
 */
function normalizePlayerName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Get practice flags collection reference for a player
 */
function getPracticeFlagsRef(playerName: string) {
  const normalizedName = normalizePlayerName(playerName);
  return collection(db, BATTLE_PLAYERS_COLLECTION, normalizedName, PRACTICE_FLAGS_SUBCOLLECTION);
}

/**
 * Get a specific practice flag document reference
 */
function getPracticeFlagDocRef(playerName: string, flashcardId: string) {
  const normalizedName = normalizePlayerName(playerName);
  return doc(db, BATTLE_PLAYERS_COLLECTION, normalizedName, PRACTICE_FLAGS_SUBCOLLECTION, flashcardId);
}

/**
 * Add a practice flag for a flashcard
 */
export async function addPracticeFlag(
  playerName: string,
  flashcardId: string,
  battleId: string
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const flagRef = getPracticeFlagDocRef(playerName, flashcardId);

    // Check if flag already exists
    const existingFlag = await getDoc(flagRef);
    if (existingFlag.exists()) {
      // Already flagged, don't overwrite
      return true;
    }

    const flag: PracticeFlag = {
      flashcardId,
      flaggedAt: new Date().toISOString(),
      flaggedFromBattleId: battleId,
      correctStreak: 0,
    };

    await setDoc(flagRef, flag);
    return true;
  } catch (error) {
    console.error('Error adding practice flag:', error);
    return false;
  }
}

/**
 * Remove a practice flag
 */
export async function removePracticeFlag(
  playerName: string,
  flashcardId: string
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const flagRef = getPracticeFlagDocRef(playerName, flashcardId);
    await deleteDoc(flagRef);
    return true;
  } catch (error) {
    console.error('Error removing practice flag:', error);
    return false;
  }
}

/**
 * Get all practice flags for a player
 */
export async function getUserPracticeFlags(playerName: string): Promise<PracticeFlag[]> {
  if (!isFirebaseConfigured()) return [];

  try {
    const flagsRef = getPracticeFlagsRef(playerName);
    const snapshot = await getDocs(flagsRef);

    return snapshot.docs.map((doc) => doc.data() as PracticeFlag);
  } catch (error) {
    console.error('Error getting practice flags:', error);
    return [];
  }
}

/**
 * Get a specific practice flag
 */
export async function getPracticeFlag(
  playerName: string,
  flashcardId: string
): Promise<PracticeFlag | null> {
  if (!isFirebaseConfigured()) return null;

  try {
    const flagRef = getPracticeFlagDocRef(playerName, flashcardId);
    const doc = await getDoc(flagRef);

    if (doc.exists()) {
      return doc.data() as PracticeFlag;
    }
    return null;
  } catch (error) {
    console.error('Error getting practice flag:', error);
    return null;
  }
}

/**
 * Increment correct streak for a flagged question
 * If streak reaches 2, delete the flag
 */
export async function incrementCorrectStreak(
  playerName: string,
  flashcardId: string
): Promise<{ removed: boolean; newStreak: number }> {
  if (!isFirebaseConfigured()) return { removed: false, newStreak: 0 };

  try {
    const flagRef = getPracticeFlagDocRef(playerName, flashcardId);
    const flagDoc = await getDoc(flagRef);

    if (!flagDoc.exists()) {
      return { removed: false, newStreak: 0 };
    }

    const currentFlag = flagDoc.data() as PracticeFlag;
    const newStreak = currentFlag.correctStreak + 1;

    if (newStreak >= 2) {
      // Delete the flag - user has answered correctly 2 times
      await deleteDoc(flagRef);
      return { removed: true, newStreak };
    } else {
      // Increment the streak
      await updateDoc(flagRef, {
        correctStreak: newStreak,
      });
      return { removed: false, newStreak };
    }
  } catch (error) {
    console.error('Error incrementing correct streak:', error);
    return { removed: false, newStreak: 0 };
  }
}

/**
 * Reset correct streak when user answers incorrectly
 */
export async function resetCorrectStreak(
  playerName: string,
  flashcardId: string
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const flagRef = getPracticeFlagDocRef(playerName, flashcardId);
    const flagDoc = await getDoc(flagRef);

    if (!flagDoc.exists()) {
      return false;
    }

    await updateDoc(flagRef, {
      correctStreak: 0,
    });
    return true;
  } catch (error) {
    console.error('Error resetting correct streak:', error);
    return false;
  }
}

/**
 * Check if a flashcard is flagged for practice
 */
export async function isFlashcardFlagged(
  playerName: string,
  flashcardId: string
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const flagRef = getPracticeFlagDocRef(playerName, flashcardId);
    const flagDoc = await getDoc(flagRef);
    return flagDoc.exists();
  } catch (error) {
    console.error('Error checking if flashcard is flagged:', error);
    return false;
  }
}

/**
 * Get flagged flashcard IDs for a player (for quick lookup)
 */
export async function getFlaggedFlashcardIds(playerName: string): Promise<Set<string>> {
  const flags = await getUserPracticeFlags(playerName);
  return new Set(flags.map((f) => f.flashcardId));
}
