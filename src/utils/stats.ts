import { Session, PerformanceStats } from '../types';

export const calculateSessionAccuracy = (session: Session): number => {
  // Only count correct and incorrect answers (exclude unanswered and flagged)
  const scoredAttempts = session.attempts.filter(
    (a) => a.status === 'correct' || a.status === 'incorrect'
  );
  if (scoredAttempts.length === 0) return 0;

  const correct = scoredAttempts.filter((a) => a.status === 'correct').length;
  return Math.round((correct / scoredAttempts.length) * 100);
};

export const calculateSessionCorrect = (session: Session): number => {
  return session.attempts.filter((a) => a.status === 'correct').length;
};

export const calculateSessionIncorrect = (session: Session): number => {
  return session.attempts.filter((a) => a.status === 'incorrect').length;
};

export const calculateSessionFlagged = (session: Session): number => {
  return session.attempts.filter((a) => a.status === 'flagged').length;
};

export const getTrendDescription = (stats: PerformanceStats): string | null => {
  const { accuracyTrend } = stats;

  if (accuracyTrend.length < 2) {
    return null;
  }

  // Get the last few rounds for trend analysis
  const recentRounds = accuracyTrend.slice(-5);

  if (recentRounds.length < 2) {
    return null;
  }

  const lastRound = recentRounds[recentRounds.length - 1];
  const previousRound = recentRounds[recentRounds.length - 2];

  const difference = lastRound - previousRound;

  if (difference > 10) {
    return 'Significant improvement from your previous round';
  } else if (difference > 0) {
    return 'Slight improvement from your previous round';
  } else if (difference < -10) {
    return 'Performance dropped from your previous round';
  } else if (difference < 0) {
    return 'Slight decline from your previous round';
  }

  return 'Consistent with your previous round';
};

export const getOverallTrend = (
  stats: PerformanceStats
): 'improving' | 'declining' | 'stable' | 'insufficient' => {
  const { accuracyTrend } = stats;

  if (accuracyTrend.length < 3) {
    return 'insufficient';
  }

  // Calculate moving average trend
  const recentRounds = accuracyTrend.slice(-5);
  const firstHalf = recentRounds.slice(0, Math.ceil(recentRounds.length / 2));
  const secondHalf = recentRounds.slice(Math.floor(recentRounds.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const difference = secondAvg - firstAvg;

  if (difference > 5) {
    return 'improving';
  } else if (difference < -5) {
    return 'declining';
  }

  return 'stable';
};

export const formatAccuracy = (accuracy: number): string => {
  return `${accuracy}%`;
};

export const getAccuracyColor = (accuracy: number): string => {
  if (accuracy >= 80) return 'text-green-600';
  if (accuracy >= 60) return 'text-yellow-600';
  return 'text-red-600';
};
