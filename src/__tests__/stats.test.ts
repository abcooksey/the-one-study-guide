import { describe, it, expect } from 'vitest';
import {
  calculateSessionAccuracy,
  calculateSessionCorrect,
  calculateSessionIncorrect,
  getTrendDescription,
  getOverallTrend,
} from '../utils/stats';
import { Session, PerformanceStats } from '../types';

describe('calculateSessionAccuracy', () => {
  it('returns 0 for session with no answered questions', () => {
    const session: Session = {
      id: '1',
      profile: 'Alex',
      startedAt: new Date().toISOString(),
      attempts: [
        { flashcardId: 'a', status: 'unanswered' },
        { flashcardId: 'b', status: 'unanswered' },
      ],
      isComplete: false,
    };
    expect(calculateSessionAccuracy(session)).toBe(0);
  });

  it('calculates 100% when all answers are correct', () => {
    const session: Session = {
      id: '1',
      profile: 'Alex',
      startedAt: new Date().toISOString(),
      attempts: [
        { flashcardId: 'a', status: 'correct' },
        { flashcardId: 'b', status: 'correct' },
        { flashcardId: 'c', status: 'correct' },
      ],
      isComplete: true,
    };
    expect(calculateSessionAccuracy(session)).toBe(100);
  });

  it('calculates 0% when all answers are incorrect', () => {
    const session: Session = {
      id: '1',
      profile: 'Alex',
      startedAt: new Date().toISOString(),
      attempts: [
        { flashcardId: 'a', status: 'incorrect' },
        { flashcardId: 'b', status: 'incorrect' },
      ],
      isComplete: true,
    };
    expect(calculateSessionAccuracy(session)).toBe(0);
  });

  it('calculates partial accuracy correctly', () => {
    const session: Session = {
      id: '1',
      profile: 'Alex',
      startedAt: new Date().toISOString(),
      attempts: [
        { flashcardId: 'a', status: 'correct' },
        { flashcardId: 'b', status: 'correct' },
        { flashcardId: 'c', status: 'incorrect' },
        { flashcardId: 'd', status: 'incorrect' },
      ],
      isComplete: true,
    };
    expect(calculateSessionAccuracy(session)).toBe(50);
  });

  it('ignores unanswered questions in accuracy calculation', () => {
    const session: Session = {
      id: '1',
      profile: 'Alex',
      startedAt: new Date().toISOString(),
      attempts: [
        { flashcardId: 'a', status: 'correct' },
        { flashcardId: 'b', status: 'unanswered' },
        { flashcardId: 'c', status: 'incorrect' },
      ],
      isComplete: false,
    };
    expect(calculateSessionAccuracy(session)).toBe(50);
  });
});

describe('calculateSessionCorrect', () => {
  it('counts correct answers', () => {
    const session: Session = {
      id: '1',
      profile: 'Alex',
      startedAt: new Date().toISOString(),
      attempts: [
        { flashcardId: 'a', status: 'correct' },
        { flashcardId: 'b', status: 'correct' },
        { flashcardId: 'c', status: 'incorrect' },
        { flashcardId: 'd', status: 'unanswered' },
      ],
      isComplete: false,
    };
    expect(calculateSessionCorrect(session)).toBe(2);
  });
});

describe('calculateSessionIncorrect', () => {
  it('counts incorrect answers', () => {
    const session: Session = {
      id: '1',
      profile: 'Alex',
      startedAt: new Date().toISOString(),
      attempts: [
        { flashcardId: 'a', status: 'correct' },
        { flashcardId: 'b', status: 'incorrect' },
        { flashcardId: 'c', status: 'incorrect' },
        { flashcardId: 'd', status: 'unanswered' },
      ],
      isComplete: false,
    };
    expect(calculateSessionIncorrect(session)).toBe(2);
  });
});

describe('getTrendDescription', () => {
  it('returns null with insufficient data', () => {
    const stats: PerformanceStats = {
      totalQuestionsAnswered: 20,
      totalCorrect: 16,
      totalIncorrect: 4,
      completedRounds: 1,
      overallAccuracy: 80,
      lastRoundAccuracy: 80,
      accuracyTrend: [80],
    };
    expect(getTrendDescription(stats)).toBeNull();
  });

  it('describes significant improvement', () => {
    const stats: PerformanceStats = {
      totalQuestionsAnswered: 40,
      totalCorrect: 34,
      totalIncorrect: 6,
      completedRounds: 2,
      overallAccuracy: 85,
      lastRoundAccuracy: 90,
      accuracyTrend: [60, 90],
    };
    expect(getTrendDescription(stats)).toContain('improvement');
  });

  it('describes decline', () => {
    const stats: PerformanceStats = {
      totalQuestionsAnswered: 40,
      totalCorrect: 28,
      totalIncorrect: 12,
      completedRounds: 2,
      overallAccuracy: 70,
      lastRoundAccuracy: 50,
      accuracyTrend: [90, 50],
    };
    expect(getTrendDescription(stats)).toContain('dropped');
  });

  it('describes consistency', () => {
    const stats: PerformanceStats = {
      totalQuestionsAnswered: 40,
      totalCorrect: 32,
      totalIncorrect: 8,
      completedRounds: 2,
      overallAccuracy: 80,
      lastRoundAccuracy: 80,
      accuracyTrend: [80, 80],
    };
    expect(getTrendDescription(stats)).toContain('Consistent');
  });
});

describe('getOverallTrend', () => {
  it('returns insufficient with less than 3 rounds', () => {
    const stats: PerformanceStats = {
      totalQuestionsAnswered: 40,
      totalCorrect: 32,
      totalIncorrect: 8,
      completedRounds: 2,
      overallAccuracy: 80,
      lastRoundAccuracy: 80,
      accuracyTrend: [80, 80],
    };
    expect(getOverallTrend(stats)).toBe('insufficient');
  });

  it('detects improving trend', () => {
    const stats: PerformanceStats = {
      totalQuestionsAnswered: 100,
      totalCorrect: 80,
      totalIncorrect: 20,
      completedRounds: 5,
      overallAccuracy: 80,
      lastRoundAccuracy: 95,
      accuracyTrend: [60, 65, 75, 85, 95],
    };
    expect(getOverallTrend(stats)).toBe('improving');
  });

  it('detects declining trend', () => {
    const stats: PerformanceStats = {
      totalQuestionsAnswered: 100,
      totalCorrect: 70,
      totalIncorrect: 30,
      completedRounds: 5,
      overallAccuracy: 70,
      lastRoundAccuracy: 50,
      accuracyTrend: [95, 85, 75, 65, 50],
    };
    expect(getOverallTrend(stats)).toBe('declining');
  });

  it('detects stable trend', () => {
    const stats: PerformanceStats = {
      totalQuestionsAnswered: 100,
      totalCorrect: 80,
      totalIncorrect: 20,
      completedRounds: 5,
      overallAccuracy: 80,
      lastRoundAccuracy: 80,
      accuracyTrend: [78, 80, 82, 79, 81],
    };
    expect(getOverallTrend(stats)).toBe('stable');
  });
});
