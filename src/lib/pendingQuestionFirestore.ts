import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  getDocs,
  onSnapshot,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { PendingQuestion, QuestionImport } from '../types/pendingQuestion';
import { Flashcard } from '../types';
import { isFirebaseConfigured } from './firestore';
import { v4 as uuidv4 } from 'uuid';

// Collection path for pending questions
const PENDING_QUESTIONS_COLLECTION = 'pendingQuestions';

/**
 * Get the document reference for a pending question
 */
const getPendingQuestionDocRef = (id: string) =>
  doc(db, PENDING_QUESTIONS_COLLECTION, id);

/**
 * Get all pending questions (status = 'pending')
 */
export async function getPendingQuestions(): Promise<PendingQuestion[]> {
  if (!isFirebaseConfigured()) {
    console.log('Firebase not configured, returning empty array');
    return [];
  }

  try {
    const questionsRef = collection(db, PENDING_QUESTIONS_COLLECTION);
    // Simple query without composite index requirement
    const q = query(questionsRef);
    const querySnapshot = await getDocs(q);

    const questions: PendingQuestion[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as PendingQuestion;
      if (data.status === 'pending') {
        questions.push(data);
      }
    });
    // Sort by createdAt descending
    questions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return questions;
  } catch (error) {
    console.error('Error getting pending questions:', error);
    return [];
  }
}

/**
 * Get a single pending question by ID
 */
export async function getPendingQuestion(id: string): Promise<PendingQuestion | null> {
  if (!isFirebaseConfigured()) return null;

  try {
    const docRef = getPendingQuestionDocRef(id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as PendingQuestion;
    }
    return null;
  } catch (error) {
    console.error('Error getting pending question:', error);
    return null;
  }
}

/**
 * Add a single pending question
 */
export async function addPendingQuestion(
  question: QuestionImport,
  similarQuestionIds?: string[],
  similarityScores?: number[]
): Promise<string | null> {
  if (!isFirebaseConfigured()) return null;

  try {
    const id = uuidv4();
    const pendingQuestion: PendingQuestion = {
      id,
      ...question,
      status: 'pending',
      similarQuestionIds,
      similarityScores,
      createdAt: new Date().toISOString(),
    };

    const docRef = getPendingQuestionDocRef(id);
    await setDoc(docRef, pendingQuestion);
    return id;
  } catch (error) {
    console.error('Error adding pending question:', error);
    return null;
  }
}

/**
 * Bulk import questions to pending queue
 */
export async function bulkImportPendingQuestions(
  questions: QuestionImport[],
  existingFlashcards: Flashcard[]
): Promise<number> {
  if (!isFirebaseConfigured()) {
    console.error('Firebase not configured, cannot import questions');
    return 0;
  }

  console.log('Starting bulk import of', questions.length, 'questions');

  try {
    const batch = writeBatch(db);
    let count = 0;

    for (const question of questions) {
      const id = uuidv4();

      // Find similar questions
      const { similarIds, scores } = findSimilarQuestions(question.question, existingFlashcards);

      const pendingQuestion: PendingQuestion = {
        id,
        ...question,
        status: 'pending',
        similarQuestionIds: similarIds,
        similarityScores: scores,
        createdAt: new Date().toISOString(),
      };

      const docRef = getPendingQuestionDocRef(id);
      batch.set(docRef, pendingQuestion);
      count++;
    }

    await batch.commit();
    console.log('Successfully imported', count, 'questions to Firestore');
    return count;
  } catch (error) {
    console.error('Error bulk importing questions:', error);
    return 0;
  }
}

/**
 * Update a pending question
 */
export async function updatePendingQuestion(
  id: string,
  updates: Partial<PendingQuestion>
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const docRef = getPendingQuestionDocRef(id);
    await updateDoc(docRef, updates);
    return true;
  } catch (error) {
    console.error('Error updating pending question:', error);
    return false;
  }
}

/**
 * Approve a pending question (change status to approved)
 */
export async function approvePendingQuestion(id: string): Promise<boolean> {
  return updatePendingQuestion(id, {
    status: 'approved',
    reviewedAt: new Date().toISOString(),
  });
}

/**
 * Reject a pending question
 */
export async function rejectPendingQuestion(id: string, notes?: string): Promise<boolean> {
  return updatePendingQuestion(id, {
    status: 'rejected',
    reviewedAt: new Date().toISOString(),
    reviewNotes: notes,
  });
}

/**
 * Delete a pending question permanently
 */
export async function deletePendingQuestion(id: string): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const docRef = getPendingQuestionDocRef(id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting pending question:', error);
    return false;
  }
}

/**
 * Subscribe to pending questions for real-time updates
 */
export function subscribeToPendingQuestions(
  callback: (questions: PendingQuestion[]) => void
): Unsubscribe | null {
  if (!isFirebaseConfigured()) {
    console.log('Firebase not configured for pending questions subscription');
    callback([]);
    return null;
  }

  try {
    const questionsRef = collection(db, PENDING_QUESTIONS_COLLECTION);
    // Simple query without composite index requirement
    const q = query(questionsRef);

    return onSnapshot(
      q,
      (querySnapshot) => {
        const questions: PendingQuestion[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as PendingQuestion;
          if (data.status === 'pending') {
            questions.push(data);
          }
        });
        // Sort by createdAt descending
        questions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        console.log('Loaded pending questions:', questions.length);
        callback(questions);
      },
      (error) => {
        console.error('Error subscribing to pending questions:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up pending questions subscription:', error);
    return null;
  }
}

/**
 * Convert an approved pending question to a flashcard
 */
export function pendingQuestionToFlashcard(pending: PendingQuestion): Flashcard {
  const now = new Date().toISOString();
  return {
    id: pending.id,
    question: pending.question,
    answer: pending.answer,
    category: pending.category,
    difficulty: pending.difficulty,
    film: pending.film,
    edition: pending.edition,
    explanation: pending.explanation,
    source: pending.source,
    isCustom: false,
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================
// Duplicate Detection Utilities
// ============================================

/**
 * Tokenize text for comparison (lowercase, remove punctuation, split into words)
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 2); // Filter out very short words
}

/**
 * Calculate Jaccard similarity between two sets
 */
function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Calculate similarity score between two questions
 */
export function calculateSimilarity(question1: string, question2: string): number {
  const tokens1 = new Set(tokenize(question1));
  const tokens2 = new Set(tokenize(question2));
  return jaccardSimilarity(tokens1, tokens2);
}

/**
 * Find similar questions from existing flashcards
 * Returns IDs and similarity scores for questions with similarity > threshold
 */
export function findSimilarQuestions(
  newQuestion: string,
  existingFlashcards: Flashcard[],
  threshold: number = 0.4
): { similarIds: string[]; scores: number[] } {
  const similarIds: string[] = [];
  const scores: number[] = [];

  const newTokens = new Set(tokenize(newQuestion));

  for (const flashcard of existingFlashcards) {
    const existingTokens = new Set(tokenize(flashcard.question));
    const similarity = jaccardSimilarity(newTokens, existingTokens);

    if (similarity >= threshold) {
      similarIds.push(flashcard.id);
      scores.push(Math.round(similarity * 100));
    }
  }

  // Sort by similarity score descending
  const combined = similarIds.map((id, i) => ({ id, score: scores[i] }));
  combined.sort((a, b) => b.score - a.score);

  return {
    similarIds: combined.map((c) => c.id),
    scores: combined.map((c) => c.score),
  };
}

/**
 * Get count of pending questions
 */
export async function getPendingQuestionCount(): Promise<number> {
  if (!isFirebaseConfigured()) return 0;

  try {
    const questionsRef = collection(db, PENDING_QUESTIONS_COLLECTION);
    const q = query(questionsRef);
    const querySnapshot = await getDocs(q);
    let count = 0;
    querySnapshot.forEach((doc) => {
      const data = doc.data() as PendingQuestion;
      if (data.status === 'pending') {
        count++;
      }
    });
    return count;
  } catch (error) {
    console.error('Error getting pending question count:', error);
    return 0;
  }
}
