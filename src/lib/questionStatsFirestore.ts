import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { isFirebaseConfigured } from './firestore';

// Collection path: questionStats/{flashcardId}
const QUESTION_STATS_COLLECTION = 'questionStats';

export interface QuestionStats {
  flashcardId: string;
  timesAsked: number;      // Total times this question was asked in battles
  timesCorrect: number;    // Total times answered correctly
  totalTimeMs: number;     // Sum of all answer times (for average calculation)
  lastUpdated: string;     // ISO timestamp of last update
}

/**
 * Get document reference for question stats
 */
function getQuestionStatsDocRef(flashcardId: string) {
  return doc(db, QUESTION_STATS_COLLECTION, flashcardId);
}

/**
 * Get stats for a specific question
 */
export async function getQuestionStats(flashcardId: string): Promise<QuestionStats | null> {
  if (!isFirebaseConfigured()) return null;

  try {
    const docRef = getQuestionStatsDocRef(flashcardId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as QuestionStats;
    }
    return null;
  } catch (error) {
    console.error('Error getting question stats:', error);
    return null;
  }
}

/**
 * Update question stats after a battle
 * Uses Firestore increment to handle concurrent updates
 */
export async function updateQuestionStats(
  flashcardId: string,
  updates: {
    incrementTimesAsked: number;
    incrementTimesCorrect: number;
    incrementTotalTimeMs: number;
  }
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const docRef = getQuestionStatsDocRef(flashcardId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Update existing stats
      await updateDoc(docRef, {
        timesAsked: increment(updates.incrementTimesAsked),
        timesCorrect: increment(updates.incrementTimesCorrect),
        totalTimeMs: increment(updates.incrementTotalTimeMs),
        lastUpdated: new Date().toISOString(),
      });
    } else {
      // Create new stats document
      const newStats: QuestionStats = {
        flashcardId,
        timesAsked: updates.incrementTimesAsked,
        timesCorrect: updates.incrementTimesCorrect,
        totalTimeMs: updates.incrementTotalTimeMs,
        lastUpdated: new Date().toISOString(),
      };
      await setDoc(docRef, newStats);
    }

    return true;
  } catch (error) {
    console.error('Error updating question stats:', error);
    return false;
  }
}

/**
 * Calculate difficulty rating based on stats
 * Returns a value from 0 (very easy) to 100 (very hard)
 */
export function calculateDifficultyRating(stats: QuestionStats): number {
  if (stats.timesAsked === 0) return 50; // Default to medium if no data

  const incorrectRate = 1 - (stats.timesCorrect / stats.timesAsked);
  return Math.round(incorrectRate * 100);
}

/**
 * Check if a question is "hard" based on cross-session data
 * A question is considered hard if incorrect rate > 50%
 */
export async function isHardQuestion(flashcardId: string): Promise<boolean> {
  const stats = await getQuestionStats(flashcardId);
  if (!stats || stats.timesAsked < 3) return false; // Need at least 3 attempts for meaningful data

  const incorrectRate = 1 - (stats.timesCorrect / stats.timesAsked);
  return incorrectRate > 0.5;
}

/**
 * Get average answer time for a question (in seconds)
 */
export async function getAverageAnswerTime(flashcardId: string): Promise<number | null> {
  const stats = await getQuestionStats(flashcardId);
  if (!stats || stats.timesAsked === 0) return null;

  return (stats.totalTimeMs / stats.timesAsked) / 1000;
}

/**
 * Batch update question stats for all questions in a battle
 * Called by the host after battle completion
 */
export async function updateBattleQuestionStats(
  questionIds: string[],
  playerResults: Array<{
    questionIndex: number;
    isCorrect: boolean;
    answerTimeMs: number | null;
  }[]>
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    // Aggregate stats per question
    const statsUpdates = new Map<string, {
      timesAsked: number;
      timesCorrect: number;
      totalTimeMs: number;
    }>();

    // Initialize for all questions
    for (const qId of questionIds) {
      statsUpdates.set(qId, { timesAsked: 0, timesCorrect: 0, totalTimeMs: 0 });
    }

    // Process each player's results
    for (const results of playerResults) {
      for (const result of results) {
        const qId = questionIds[result.questionIndex];
        const stats = statsUpdates.get(qId);
        if (stats) {
          stats.timesAsked++;
          if (result.isCorrect) stats.timesCorrect++;
          if (result.answerTimeMs) stats.totalTimeMs += result.answerTimeMs;
        }
      }
    }

    // Update each question's stats
    const updatePromises = Array.from(statsUpdates.entries()).map(
      ([flashcardId, updates]) =>
        updateQuestionStats(flashcardId, {
          incrementTimesAsked: updates.timesAsked,
          incrementTimesCorrect: updates.timesCorrect,
          incrementTotalTimeMs: updates.totalTimeMs,
        })
    );

    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error('Error batch updating question stats:', error);
    return false;
  }
}
