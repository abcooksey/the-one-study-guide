import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../store';

describe('Flashcard Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.setState({
      flashcards: [],
      initialized: false,
      currentSession: null,
      currentCardIndex: 0,
      isCardFlipped: false,
      sessions: [],
    });
  });

  describe('initializeFlashcards', () => {
    it('loads seed flashcards when not initialized', () => {
      const store = useAppStore.getState();
      expect(store.flashcards.length).toBe(0);

      store.initializeFlashcards();

      const updatedStore = useAppStore.getState();
      expect(updatedStore.flashcards.length).toBeGreaterThan(100);
      expect(updatedStore.initialized).toBe(true);
    });

    it('does not reload flashcards if already initialized', () => {
      const store = useAppStore.getState();
      store.initializeFlashcards();

      const count = useAppStore.getState().flashcards.length;

      // Add a custom card
      store.addFlashcard({
        question: 'Test question',
        answer: 'Test answer',
        category: 'General Trivia',
        difficulty: 'Easy',
        film: 'Trilogy / General',
        edition: 'Both / General',
      });

      // Re-initialize should not remove custom card
      store.initializeFlashcards();
      expect(useAppStore.getState().flashcards.length).toBe(count + 1);
    });
  });

  describe('addFlashcard', () => {
    it('adds a new flashcard with isCustom true', () => {
      const store = useAppStore.getState();

      const card = store.addFlashcard({
        question: 'Who directed the trilogy?',
        answer: 'Peter Jackson',
        category: 'Production',
        difficulty: 'Easy',
        film: 'Trilogy / General',
        edition: 'Both / General',
      });

      expect(card.id).toBeDefined();
      expect(card.isCustom).toBe(true);
      expect(card.question).toBe('Who directed the trilogy?');

      const updatedStore = useAppStore.getState();
      expect(updatedStore.flashcards).toContainEqual(card);
    });
  });

  describe('updateFlashcard', () => {
    it('updates an existing flashcard', () => {
      const store = useAppStore.getState();

      const card = store.addFlashcard({
        question: 'Original question',
        answer: 'Original answer',
        category: 'General Trivia',
        difficulty: 'Easy',
        film: 'Trilogy / General',
        edition: 'Both / General',
      });

      store.updateFlashcard(card.id, { question: 'Updated question' });

      const updated = useAppStore.getState().getFlashcardById(card.id);
      expect(updated?.question).toBe('Updated question');
      expect(updated?.answer).toBe('Original answer');
    });
  });

  describe('deleteFlashcard', () => {
    it('removes a flashcard from the library', () => {
      const store = useAppStore.getState();

      const card = store.addFlashcard({
        question: 'To be deleted',
        answer: 'Bye',
        category: 'General Trivia',
        difficulty: 'Easy',
        film: 'Trilogy / General',
        edition: 'Both / General',
      });

      expect(useAppStore.getState().flashcards).toContainEqual(card);

      store.deleteFlashcard(card.id);

      expect(useAppStore.getState().flashcards).not.toContainEqual(card);
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      const store = useAppStore.getState();
      store.initializeFlashcards();
    });

    it('starts a new session with 20 unique cards', () => {
      const store = useAppStore.getState();

      const success = store.startNewSession('Alex');
      expect(success).toBe(true);

      const updatedStore = useAppStore.getState();
      expect(updatedStore.currentSession).not.toBeNull();
      expect(updatedStore.currentSession?.attempts.length).toBe(20);
      expect(updatedStore.currentSession?.profile).toBe('Alex');

      // Check uniqueness
      const cardIds = updatedStore.currentSession!.attempts.map(
        (a) => a.flashcardId
      );
      const uniqueIds = new Set(cardIds);
      expect(uniqueIds.size).toBe(20);
    });

    it('fails to start session with fewer than 20 cards', () => {
      // Reset to have no cards
      useAppStore.setState({ flashcards: [], initialized: true });

      const store = useAppStore.getState();
      const success = store.startNewSession('Alex');

      expect(success).toBe(false);
      expect(useAppStore.getState().currentSession).toBeNull();
    });

    it('marks answer and locks it for the session', () => {
      const store = useAppStore.getState();
      store.startNewSession('Alex');

      // Flip and mark correct
      store.flipCard();
      store.markAnswer('correct');

      const attempt = useAppStore.getState().getCurrentAttempt();
      expect(attempt?.status).toBe('correct');

      // Try to change answer - should not work
      store.markAnswer('incorrect');

      const attemptAfter = useAppStore.getState().getCurrentAttempt();
      expect(attemptAfter?.status).toBe('correct'); // Still correct
    });

    it('tracks unanswered questions', () => {
      const store = useAppStore.getState();
      store.startNewSession('Alex');

      // All should be unanswered initially
      const unanswered = store.getUnansweredIndices();
      expect(unanswered.length).toBe(20);

      // Answer first question
      store.flipCard();
      store.markAnswer('correct');

      const unansweredAfter = useAppStore.getState().getUnansweredIndices();
      expect(unansweredAfter.length).toBe(19);
    });

    it('cannot complete session with unanswered questions', () => {
      const store = useAppStore.getState();
      store.startNewSession('Alex');

      expect(store.canCompleteSession()).toBe(false);

      // Answer just one
      store.flipCard();
      store.markAnswer('correct');

      expect(useAppStore.getState().canCompleteSession()).toBe(false);
    });

    it('completes session when all questions answered', () => {
      const store = useAppStore.getState();
      store.startNewSession('Alex');

      // Answer all 20 questions
      for (let i = 0; i < 20; i++) {
        store.flipCard();
        store.markAnswer(i % 2 === 0 ? 'correct' : 'incorrect');
        if (i < 19) store.goToNextCard();
      }

      expect(useAppStore.getState().canCompleteSession()).toBe(true);

      store.completeSession();

      const updatedStore = useAppStore.getState();
      expect(updatedStore.currentSession?.isComplete).toBe(true);
      expect(updatedStore.sessions.length).toBe(1);
    });

    it('allows navigation between cards', () => {
      const store = useAppStore.getState();
      store.startNewSession('Alex');

      expect(useAppStore.getState().currentCardIndex).toBe(0);

      store.goToNextCard();
      expect(useAppStore.getState().currentCardIndex).toBe(1);

      store.goToNextCard();
      expect(useAppStore.getState().currentCardIndex).toBe(2);

      store.goToPreviousCard();
      expect(useAppStore.getState().currentCardIndex).toBe(1);

      store.goToCard(10);
      expect(useAppStore.getState().currentCardIndex).toBe(10);
    });

    it('preserves answer when navigating back to card', () => {
      const store = useAppStore.getState();
      store.startNewSession('Alex');

      // Answer first card
      store.flipCard();
      store.markAnswer('correct');

      // Navigate away
      store.goToNextCard();
      store.goToNextCard();

      // Navigate back
      store.goToCard(0);

      const attempt = useAppStore.getState().getCurrentAttempt();
      expect(attempt?.status).toBe('correct');
    });

    it('allows skipping and returning to unanswered cards', () => {
      const store = useAppStore.getState();
      store.startNewSession('Alex');

      // Skip first card
      store.goToNextCard();

      // Answer second card
      store.flipCard();
      store.markAnswer('correct');

      // Check first is still unanswered
      const unanswered = useAppStore.getState().getUnansweredIndices();
      expect(unanswered).toContain(0);

      // Return to first
      store.goToCard(0);

      const attempt = useAppStore.getState().getCurrentAttempt();
      expect(attempt?.status).toBe('unanswered');

      // Now answer it
      store.flipCard();
      store.markAnswer('incorrect');

      const attemptAfter = useAppStore.getState().getCurrentAttempt();
      expect(attemptAfter?.status).toBe('incorrect');
    });
  });

  describe('Performance Stats', () => {
    beforeEach(() => {
      const store = useAppStore.getState();
      store.initializeFlashcards();
    });

    it('returns zero stats when no sessions completed', () => {
      const stats = useAppStore.getState().getPerformanceStats();

      expect(stats.completedRounds).toBe(0);
      expect(stats.totalQuestionsAnswered).toBe(0);
      expect(stats.overallAccuracy).toBe(0);
    });

    it('calculates stats after completing sessions', () => {
      const store = useAppStore.getState();
      store.startNewSession('Alex');

      // Complete first session: 16 correct, 4 incorrect
      for (let i = 0; i < 20; i++) {
        store.flipCard();
        store.markAnswer(i < 16 ? 'correct' : 'incorrect');
        if (i < 19) store.goToNextCard();
      }
      store.completeSession();

      const stats = useAppStore.getState().getPerformanceStats();
      expect(stats.completedRounds).toBe(1);
      expect(stats.totalCorrect).toBe(16);
      expect(stats.totalIncorrect).toBe(4);
      expect(stats.overallAccuracy).toBe(80);
      expect(stats.lastRoundAccuracy).toBe(80);
      expect(stats.accuracyTrend).toEqual([80]);
    });
  });
});
