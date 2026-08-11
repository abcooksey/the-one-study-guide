import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
  Flashcard,
  Session,
  SessionAttempt,
  PerformanceStats,
  AttemptStatus,
  Category,
  Difficulty,
  Film,
  Edition,
  Profile,
} from '../types';
import { createSeedFlashcards } from '../data/seedQuestions';

const QUESTIONS_PER_ROUND = 20;

interface FlashcardInput {
  question: string;
  answer: string;
  category: Category;
  difficulty: Difficulty;
  film: Film;
  edition: Edition;
  explanation?: string;
  source?: string;
}

interface AppState {
  // Flashcards
  flashcards: Flashcard[];
  initialized: boolean;

  // Current Session
  currentSession: Session | null;
  currentCardIndex: number;
  isCardFlipped: boolean;

  // Session History
  sessions: Session[];

  // Actions - Flashcards
  initializeFlashcards: () => void;
  addFlashcard: (input: FlashcardInput) => Flashcard;
  updateFlashcard: (id: string, input: Partial<FlashcardInput>) => void;
  deleteFlashcard: (id: string) => void;

  // Actions - Session
  startNewSession: (profile: Profile) => boolean;
  flipCard: () => void;
  unflipCard: () => void;
  goToCard: (index: number) => void;
  goToNextCard: () => void;
  goToPreviousCard: () => void;
  markAnswer: (status: 'correct' | 'incorrect') => void;
  completeSession: () => void;
  abandonSession: () => void;

  // Computed
  getPerformanceStats: (profile?: Profile) => PerformanceStats;
  getCurrentAttempt: () => SessionAttempt | null;
  getUnansweredIndices: () => number[];
  canCompleteSession: () => boolean;
  getFlashcardById: (id: string) => Flashcard | undefined;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      flashcards: [],
      initialized: false,
      currentSession: null,
      currentCardIndex: 0,
      isCardFlipped: false,
      sessions: [],

      initializeFlashcards: () => {
        const state = get();
        if (!state.initialized || state.flashcards.length === 0) {
          const seedFlashcards = createSeedFlashcards();
          set({
            flashcards: seedFlashcards,
            initialized: true,
          });
        }
      },

      addFlashcard: (input) => {
        const now = new Date().toISOString();
        const newFlashcard: Flashcard = {
          id: uuidv4(),
          ...input,
          isCustom: true,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          flashcards: [...state.flashcards, newFlashcard],
        }));

        return newFlashcard;
      },

      updateFlashcard: (id, input) => {
        set((state) => ({
          flashcards: state.flashcards.map((f) =>
            f.id === id
              ? { ...f, ...input, updatedAt: new Date().toISOString() }
              : f
          ),
        }));
      },

      deleteFlashcard: (id) => {
        set((state) => ({
          flashcards: state.flashcards.filter((f) => f.id !== id),
        }));
      },

      startNewSession: (profile: Profile) => {
        const state = get();
        const availableFlashcards = state.flashcards;

        if (availableFlashcards.length < QUESTIONS_PER_ROUND) {
          return false;
        }

        // Randomly select 20 unique flashcards
        const shuffled = [...availableFlashcards].sort(() => Math.random() - 0.5);
        const selectedCards = shuffled.slice(0, QUESTIONS_PER_ROUND);

        const attempts: SessionAttempt[] = selectedCards.map((card) => ({
          flashcardId: card.id,
          status: 'unanswered' as AttemptStatus,
        }));

        const newSession: Session = {
          id: uuidv4(),
          profile,
          startedAt: new Date().toISOString(),
          attempts,
          isComplete: false,
        };

        set({
          currentSession: newSession,
          currentCardIndex: 0,
          isCardFlipped: false,
        });

        return true;
      },

      flipCard: () => {
        set({ isCardFlipped: true });
      },

      unflipCard: () => {
        set({ isCardFlipped: false });
      },

      goToCard: (index) => {
        const state = get();
        if (!state.currentSession) return;

        if (index >= 0 && index < state.currentSession.attempts.length) {
          set({ currentCardIndex: index, isCardFlipped: false });
        }
      },

      goToNextCard: () => {
        const state = get();
        if (!state.currentSession) return;

        if (state.currentCardIndex < state.currentSession.attempts.length - 1) {
          set({ currentCardIndex: state.currentCardIndex + 1, isCardFlipped: false });
        }
      },

      goToPreviousCard: () => {
        const state = get();
        if (!state.currentSession) return;

        if (state.currentCardIndex > 0) {
          set({ currentCardIndex: state.currentCardIndex - 1, isCardFlipped: false });
        }
      },

      markAnswer: (status) => {
        const state = get();
        if (!state.currentSession) return;

        const attempt = state.currentSession.attempts[state.currentCardIndex];

        // Cannot change answer if already answered
        if (attempt.status !== 'unanswered') return;

        const updatedAttempts = [...state.currentSession.attempts];
        updatedAttempts[state.currentCardIndex] = {
          ...attempt,
          status,
          answeredAt: new Date().toISOString(),
        };

        set({
          currentSession: {
            ...state.currentSession,
            attempts: updatedAttempts,
          },
        });
      },

      completeSession: () => {
        const state = get();
        if (!state.currentSession) return;

        // Check if all questions are answered
        const hasUnanswered = state.currentSession.attempts.some(
          (a) => a.status === 'unanswered'
        );
        if (hasUnanswered) return;

        const completedSession: Session = {
          ...state.currentSession,
          completedAt: new Date().toISOString(),
          isComplete: true,
        };

        // Only persist sessions for Alex and Angus, not Guest
        const shouldPersist = completedSession.profile !== 'Guest';

        set({
          sessions: shouldPersist
            ? [...state.sessions, completedSession]
            : state.sessions,
          currentSession: completedSession,
        });
      },

      abandonSession: () => {
        set({
          currentSession: null,
          currentCardIndex: 0,
          isCardFlipped: false,
        });
      },

      getPerformanceStats: (profile?: Profile) => {
        const state = get();
        const completedSessions = state.sessions.filter(
          (s) => s.isComplete && (profile ? s.profile === profile : true)
        );

        if (completedSessions.length === 0) {
          return {
            totalQuestionsAnswered: 0,
            totalCorrect: 0,
            totalIncorrect: 0,
            completedRounds: 0,
            overallAccuracy: 0,
            accuracyTrend: [],
          };
        }

        let totalCorrect = 0;
        let totalIncorrect = 0;
        const accuracyTrend: number[] = [];

        completedSessions.forEach((session) => {
          let sessionCorrect = 0;
          let sessionIncorrect = 0;

          session.attempts.forEach((attempt) => {
            if (attempt.status === 'correct') {
              totalCorrect++;
              sessionCorrect++;
            } else if (attempt.status === 'incorrect') {
              totalIncorrect++;
              sessionIncorrect++;
            }
          });

          const sessionTotal = sessionCorrect + sessionIncorrect;
          if (sessionTotal > 0) {
            accuracyTrend.push(
              Math.round((sessionCorrect / sessionTotal) * 100)
            );
          }
        });

        const totalAnswered = totalCorrect + totalIncorrect;
        const overallAccuracy =
          totalAnswered > 0
            ? Math.round((totalCorrect / totalAnswered) * 100)
            : 0;

        const lastRoundAccuracy =
          accuracyTrend.length > 0
            ? accuracyTrend[accuracyTrend.length - 1]
            : undefined;

        return {
          totalQuestionsAnswered: totalAnswered,
          totalCorrect,
          totalIncorrect,
          completedRounds: completedSessions.length,
          overallAccuracy,
          lastRoundAccuracy,
          accuracyTrend,
        };
      },

      getCurrentAttempt: () => {
        const state = get();
        if (!state.currentSession) return null;
        return state.currentSession.attempts[state.currentCardIndex];
      },

      getUnansweredIndices: () => {
        const state = get();
        if (!state.currentSession) return [];

        return state.currentSession.attempts
          .map((attempt, index) => ({ attempt, index }))
          .filter(({ attempt }) => attempt.status === 'unanswered')
          .map(({ index }) => index);
      },

      canCompleteSession: () => {
        const state = get();
        if (!state.currentSession) return false;

        return !state.currentSession.attempts.some(
          (a) => a.status === 'unanswered'
        );
      },

      getFlashcardById: (id) => {
        const state = get();
        return state.flashcards.find((f) => f.id === id);
      },
    }),
    {
      name: 'lotr-trivia-storage',
      partialize: (state) => ({
        flashcards: state.flashcards,
        initialized: state.initialized,
        sessions: state.sessions,
      }),
    }
  )
);
