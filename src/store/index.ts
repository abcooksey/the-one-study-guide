import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
  Flashcard,
  Session,
  SessionAttempt,
  PerformanceStats,
  DetailedStats,
  StatBreakdown,
  AttemptStatus,
  Category,
  Difficulty,
  Film,
  Edition,
  Profile,
  DifficultyMode,
  FlagReason,
  FlashcardFlag,
  FILMS,
  CATEGORIES,
} from '../types';
import { createSeedFlashcards } from '../data/seedQuestions';
import {
  isFirebaseConfigured,
  loadAppData,
  loadAllSessions,
  saveAppData,
  saveProfileSessions,
  subscribeToAppData,
  subscribeToProfileSessions,
} from '../lib/firestore';

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
  deletedSeedIds: string[]; // Track deleted seed questions so they don't get re-added

  // Current Session
  currentSession: Session | null;
  currentCardIndex: number;
  isCardFlipped: boolean;

  // Session History
  sessions: Session[];

  // Cloud Sync
  cloudSyncEnabled: boolean;
  cloudSyncLoading: boolean;
  lastSyncedAt: string | null;

  // Actions - Flashcards
  initializeFlashcards: () => void;
  addFlashcard: (input: FlashcardInput) => Flashcard;
  updateFlashcard: (id: string, input: Partial<FlashcardInput>) => void;
  deleteFlashcard: (id: string) => void;
  flagFlashcard: (id: string, reason: FlagReason, description: string | undefined, profile: Profile) => void;
  unflagFlashcard: (id: string) => void;
  getFlaggedFlashcards: () => Flashcard[];

  // Actions - Session
  startNewSession: (profile: Profile, difficultyMode: DifficultyMode) => boolean;
  flipCard: () => void;
  unflipCard: () => void;
  goToCard: (index: number) => void;
  goToNextCard: () => void;
  goToPreviousCard: () => void;
  markAnswer: (status: 'correct' | 'incorrect') => void;
  markAttemptFlagged: () => void;
  completeSession: () => void;
  abandonSession: () => void;

  // Actions - Cloud Sync
  initializeCloudSync: () => Promise<void>;
  syncFlashcardsToCloud: () => Promise<void>;
  syncSessionsToCloud: (profile: Profile) => Promise<void>;

  // Computed
  getPerformanceStats: (profile?: Profile) => PerformanceStats;
  getDetailedStats: (profile: Profile) => DetailedStats;
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
      deletedSeedIds: [],
      currentSession: null,
      currentCardIndex: 0,
      isCardFlipped: false,
      sessions: [],
      cloudSyncEnabled: false,
      cloudSyncLoading: false,
      lastSyncedAt: null,

      initializeCloudSync: async () => {
        if (!isFirebaseConfigured()) {
          console.log('Firebase not configured, using local storage only');
          return;
        }

        set({ cloudSyncLoading: true });

        try {
          // Load initial data from cloud
          const [appData, cloudSessions] = await Promise.all([
            loadAppData(),
            loadAllSessions(),
          ]);

          const state = get();

          // If cloud has data, use it; otherwise upload local data
          if (appData && appData.flashcards.length > 0) {
            set({
              flashcards: appData.flashcards,
              initialized: appData.initialized,
              deletedSeedIds: appData.deletedSeedIds || [],
            });
          } else if (state.flashcards.length > 0) {
            // Upload local data to cloud
            await saveAppData(state.flashcards, state.initialized, state.deletedSeedIds);
          }

          // Merge sessions from cloud with local (dedupe by id)
          if (cloudSessions.length > 0) {
            const existingIds = new Set(state.sessions.map((s) => s.id));
            const newSessions = cloudSessions.filter((s) => !existingIds.has(s.id));
            if (newSessions.length > 0) {
              set({ sessions: [...state.sessions, ...newSessions] });
            }
          } else if (state.sessions.length > 0) {
            // Upload local sessions to cloud
            const alexSessions = state.sessions.filter((s) => s.profile === 'Alex');
            const angusSessions = state.sessions.filter((s) => s.profile === 'Angus');
            await Promise.all([
              alexSessions.length > 0 ? saveProfileSessions('Alex', alexSessions) : Promise.resolve(),
              angusSessions.length > 0 ? saveProfileSessions('Angus', angusSessions) : Promise.resolve(),
            ]);
          }

          // Set up real-time listeners for cross-device sync
          subscribeToAppData((data) => {
            if (data) {
              set({
                flashcards: data.flashcards,
                initialized: data.initialized,
                deletedSeedIds: data.deletedSeedIds || [],
                lastSyncedAt: new Date().toISOString(),
              });
            }
          });

          subscribeToProfileSessions('Alex', (sessions) => {
            const state = get();
            const nonAlexSessions = state.sessions.filter((s) => s.profile !== 'Alex');
            set({
              sessions: [...nonAlexSessions, ...sessions],
              lastSyncedAt: new Date().toISOString(),
            });
          });

          subscribeToProfileSessions('Angus', (sessions) => {
            const state = get();
            const nonAngusSessions = state.sessions.filter((s) => s.profile !== 'Angus');
            set({
              sessions: [...nonAngusSessions, ...sessions],
              lastSyncedAt: new Date().toISOString(),
            });
          });

          set({
            cloudSyncEnabled: true,
            cloudSyncLoading: false,
            lastSyncedAt: new Date().toISOString(),
          });

          console.log('Cloud sync initialized successfully');
        } catch (error) {
          console.error('Error initializing cloud sync:', error);
          set({ cloudSyncLoading: false });
        }
      },

      syncFlashcardsToCloud: async () => {
        if (!isFirebaseConfigured()) return;
        const state = get();
        await saveAppData(state.flashcards, state.initialized, state.deletedSeedIds);
      },

      syncSessionsToCloud: async (profile: Profile) => {
        if (!isFirebaseConfigured() || profile === 'Guest') return;
        const state = get();
        const profileSessions = state.sessions.filter((s) => s.profile === profile);
        await saveProfileSessions(profile, profileSessions);
      },

      initializeFlashcards: () => {
        const state = get();
        const seedFlashcards = createSeedFlashcards();

        if (!state.initialized || state.flashcards.length === 0) {
          // First time initialization - load all seed questions
          set({
            flashcards: seedFlashcards,
            initialized: true,
          });
          // Sync to cloud after initialization
          get().syncFlashcardsToCloud();
        } else {
          // Already initialized - check for new seed questions and merge them
          const existingQuestions = new Set(
            state.flashcards.map((f) => f.question.toLowerCase().trim())
          );

          // Also check against deleted seeds so they don't get re-added
          const deletedSeeds = new Set(state.deletedSeedIds);

          const newQuestions = seedFlashcards.filter(
            (seed) => {
              const questionKey = seed.question.toLowerCase().trim();
              return !existingQuestions.has(questionKey) && !deletedSeeds.has(questionKey);
            }
          );

          if (newQuestions.length > 0) {
            set({
              flashcards: [...state.flashcards, ...newQuestions],
            });
            // Sync to cloud after adding new questions
            get().syncFlashcardsToCloud();
            console.log(`Added ${newQuestions.length} new seed questions to the library.`);
          }
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

        // Sync to cloud
        get().syncFlashcardsToCloud();

        return newFlashcard;
      },

      updateFlashcard: (id, input) => {
        const state = get();
        const flashcardToUpdate = state.flashcards.find((f) => f.id === id);

        // If the question text is being changed, track the original text
        // so the seed question doesn't get re-added
        let deletedSeedIds = state.deletedSeedIds;
        if (flashcardToUpdate && input.question && input.question !== flashcardToUpdate.question) {
          const originalKey = flashcardToUpdate.question.toLowerCase().trim();
          if (!deletedSeedIds.includes(originalKey)) {
            deletedSeedIds = [...deletedSeedIds, originalKey];
          }
        }

        set({
          flashcards: state.flashcards.map((f) =>
            f.id === id
              ? { ...f, ...input, updatedAt: new Date().toISOString() }
              : f
          ),
          deletedSeedIds,
        });

        // Sync to cloud
        get().syncFlashcardsToCloud();
      },

      deleteFlashcard: (id) => {
        const state = get();
        const flashcardToDelete = state.flashcards.find((f) => f.id === id);

        // Track the question text so seed questions don't get re-added
        const deletedSeedIds = flashcardToDelete
          ? [...state.deletedSeedIds, flashcardToDelete.question.toLowerCase().trim()]
          : state.deletedSeedIds;

        set({
          flashcards: state.flashcards.filter((f) => f.id !== id),
          deletedSeedIds,
        });

        // Sync to cloud
        get().syncFlashcardsToCloud();
      },

      flagFlashcard: (id, reason, description, profile) => {
        const flag: FlashcardFlag = {
          reason,
          description,
          flaggedAt: new Date().toISOString(),
          flaggedBy: profile,
        };

        set((state) => ({
          flashcards: state.flashcards.map((f) =>
            f.id === id
              ? { ...f, flag, updatedAt: new Date().toISOString() }
              : f
          ),
        }));

        // Sync to cloud
        get().syncFlashcardsToCloud();
      },

      unflagFlashcard: (id) => {
        set((state) => ({
          flashcards: state.flashcards.map((f) =>
            f.id === id
              ? { ...f, flag: undefined, updatedAt: new Date().toISOString() }
              : f
          ),
        }));

        // Sync to cloud
        get().syncFlashcardsToCloud();
      },

      getFlaggedFlashcards: () => {
        const state = get();
        return state.flashcards.filter((f) => f.flag !== undefined);
      },

      startNewSession: (profile: Profile, difficultyMode: DifficultyMode) => {
        const state = get();
        // Exclude flagged flashcards from sessions
        const availableFlashcards = state.flashcards.filter((f) => !f.flag);

        if (availableFlashcards.length < QUESTIONS_PER_ROUND) {
          return false;
        }

        // Group flashcards by difficulty
        const easyCards = availableFlashcards.filter((f) => f.difficulty === 'Easy');
        const mediumCards = availableFlashcards.filter((f) => f.difficulty === 'Medium');
        const hardCards = availableFlashcards.filter((f) => f.difficulty === 'Hard');

        // Shuffle each difficulty pool
        const shuffleArray = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
        const shuffledEasy = shuffleArray(easyCards);
        const shuffledMedium = shuffleArray(mediumCards);
        const shuffledHard = shuffleArray(hardCards);

        let selectedCards: Flashcard[] = [];

        if (difficultyMode === 'progressive') {
          // Equal mix: 7 easy, 7 medium, 6 hard - ordered easy → medium → hard
          const easy = shuffledEasy.slice(0, 7);
          const medium = shuffledMedium.slice(0, 7);
          const hard = shuffledHard.slice(0, 6);
          selectedCards = [...easy, ...medium, ...hard];

          // If we don't have enough of each difficulty, fill with random from others
          if (selectedCards.length < QUESTIONS_PER_ROUND) {
            const allShuffled = shuffleArray(availableFlashcards);
            const selectedIds = new Set(selectedCards.map((c) => c.id));
            for (const card of allShuffled) {
              if (!selectedIds.has(card.id)) {
                selectedCards.push(card);
                if (selectedCards.length >= QUESTIONS_PER_ROUND) break;
              }
            }
          }
        } else if (difficultyMode === 'warmup') {
          // 5 easy first, then 15 random from remaining
          const easyWarmup = shuffledEasy.slice(0, 5);
          const usedIds = new Set(easyWarmup.map((c) => c.id));

          // Get remaining cards (excluding the 5 easy warmup cards)
          const remaining = shuffleArray(
            availableFlashcards.filter((f) => !usedIds.has(f.id))
          ).slice(0, 15);

          selectedCards = [...easyWarmup, ...remaining];

          // If we don't have enough easy cards, just use random
          if (selectedCards.length < QUESTIONS_PER_ROUND) {
            const allShuffled = shuffleArray(availableFlashcards);
            const selectedIds = new Set(selectedCards.map((c) => c.id));
            for (const card of allShuffled) {
              if (!selectedIds.has(card.id)) {
                selectedCards.push(card);
                if (selectedCards.length >= QUESTIONS_PER_ROUND) break;
              }
            }
          }
        } else if (difficultyMode === 'weakness') {
          // Weakness mode: prioritize questions from weak categories and films
          const detailedStats = get().getDetailedStats(profile);

          // Get weak areas (accuracy below 70%, sorted by accuracy ascending)
          const weakFilms = detailedStats.byFilm
            .filter((s) => s.accuracy < 70)
            .sort((a, b) => a.accuracy - b.accuracy)
            .map((s) => s.name);

          const weakCategories = detailedStats.byCategory
            .filter((s) => s.accuracy < 70)
            .sort((a, b) => a.accuracy - b.accuracy)
            .map((s) => s.name);

          // Score each flashcard based on weakness (lower accuracy = higher priority)
          const scoredCards = availableFlashcards.map((card) => {
            let score = 0;

            // Add score based on film weakness (weak films get higher scores)
            const filmIndex = weakFilms.indexOf(card.film);
            if (filmIndex !== -1) {
              score += (weakFilms.length - filmIndex) * 10; // Most weak = highest score
            }

            // Add score based on category weakness
            const catIndex = weakCategories.indexOf(card.category);
            if (catIndex !== -1) {
              score += (weakCategories.length - catIndex) * 10;
            }

            // Add small random factor to mix things up
            score += Math.random() * 5;

            return { card, score };
          });

          // Sort by score descending (highest weakness priority first)
          scoredCards.sort((a, b) => b.score - a.score);

          // Take top 20 questions
          selectedCards = scoredCards.slice(0, QUESTIONS_PER_ROUND).map((sc) => sc.card);

          // Shuffle the selected cards so weak areas are mixed throughout
          selectedCards = shuffleArray(selectedCards);
        } else {
          // Random mode: completely random selection
          const shuffled = shuffleArray(availableFlashcards);
          selectedCards = shuffled.slice(0, QUESTIONS_PER_ROUND);
        }

        const attempts: SessionAttempt[] = selectedCards.map((card) => ({
          flashcardId: card.id,
          status: 'unanswered' as AttemptStatus,
        }));

        const newSession: Session = {
          id: uuidv4(),
          profile,
          difficultyMode,
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

      markAttemptFlagged: () => {
        const state = get();
        if (!state.currentSession) return;

        const attempt = state.currentSession.attempts[state.currentCardIndex];

        // Can flag regardless of current status (unanswered, correct, or incorrect)
        const updatedAttempts = [...state.currentSession.attempts];
        updatedAttempts[state.currentCardIndex] = {
          ...attempt,
          status: 'flagged',
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

        // Sync to cloud
        if (shouldPersist) {
          get().syncSessionsToCloud(completedSession.profile);
        }
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

      getDetailedStats: (profile: Profile) => {
        const state = get();
        const completedSessions = state.sessions.filter(
          (s) => s.isComplete && s.profile === profile
        );

        // Initialize tracking maps
        const filmStats: Map<Film, { correct: number; total: number }> = new Map();
        const categoryStats: Map<Category, { correct: number; total: number }> = new Map();

        // Initialize with all films and categories
        FILMS.forEach((film) => filmStats.set(film, { correct: 0, total: 0 }));
        CATEGORIES.forEach((cat) => categoryStats.set(cat, { correct: 0, total: 0 }));

        // Process all attempts from completed sessions
        completedSessions.forEach((session) => {
          session.attempts.forEach((attempt) => {
            // Only count correct and incorrect (exclude unanswered and flagged)
            if (attempt.status !== 'correct' && attempt.status !== 'incorrect') return;

            const flashcard = state.flashcards.find((f) => f.id === attempt.flashcardId);
            if (!flashcard) return;

            const isCorrect = attempt.status === 'correct';

            // Update film stats
            const filmStat = filmStats.get(flashcard.film);
            if (filmStat) {
              filmStat.total++;
              if (isCorrect) filmStat.correct++;
            }

            // Update category stats
            const catStat = categoryStats.get(flashcard.category);
            if (catStat) {
              catStat.total++;
              if (isCorrect) catStat.correct++;
            }
          });
        });

        // Convert to StatBreakdown arrays, filtering out empty categories
        const byFilm: StatBreakdown[] = Array.from(filmStats.entries())
          .filter(([, stats]) => stats.total > 0)
          .map(([name, stats]) => ({
            name,
            correct: stats.correct,
            total: stats.total,
            accuracy: Math.round((stats.correct / stats.total) * 100),
          }))
          .sort((a, b) => b.total - a.total);

        const byCategory: StatBreakdown[] = Array.from(categoryStats.entries())
          .filter(([, stats]) => stats.total > 0)
          .map(([name, stats]) => ({
            name,
            correct: stats.correct,
            total: stats.total,
            accuracy: Math.round((stats.correct / stats.total) * 100),
          }))
          .sort((a, b) => b.total - a.total);

        return { byFilm, byCategory };
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
        deletedSeedIds: state.deletedSeedIds,
        sessions: state.sessions,
      }),
    }
  )
);
