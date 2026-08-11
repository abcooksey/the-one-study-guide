import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import StatCard from '../components/StatCard';
import {
  calculateSessionAccuracy,
  calculateSessionCorrect,
  calculateSessionIncorrect,
  getTrendDescription,
} from '../utils/stats';

const profileEmoji: Record<string, string> = {
  Alex: '👑',
  Angus: '⚔️',
  Guest: '🧙',
};

export default function SessionResults() {
  const navigate = useNavigate();
  const [showIncorrect, setShowIncorrect] = useState(false);

  const currentSession = useAppStore((state) => state.currentSession);
  const getFlashcardById = useAppStore((state) => state.getFlashcardById);
  const getPerformanceStats = useAppStore((state) => state.getPerformanceStats);
  const abandonSession = useAppStore((state) => state.abandonSession);
  const flashcards = useAppStore((state) => state.flashcards);

  useEffect(() => {
    if (!currentSession || !currentSession.isComplete) {
      navigate('/');
    }
  }, [currentSession, navigate]);

  if (!currentSession || !currentSession.isComplete) {
    return null;
  }

  const isGuest = currentSession.profile === 'Guest';
  // Get stats for the current profile (excluding Guest)
  const stats = getPerformanceStats(isGuest ? undefined : currentSession.profile);

  const sessionAccuracy = calculateSessionAccuracy(currentSession);
  const sessionCorrect = calculateSessionCorrect(currentSession);
  const sessionIncorrect = calculateSessionIncorrect(currentSession);
  const trendDescription = !isGuest ? getTrendDescription(stats) : null;

  const incorrectAttempts = currentSession.attempts.filter(
    (a) => a.status === 'incorrect'
  );

  const handleStartNewRound = () => {
    abandonSession();
    navigate('/');
  };

  const handleReturnHome = () => {
    abandonSession();
    navigate('/');
  };

  const getAccuracyMessage = (accuracy: number): string => {
    if (accuracy === 100) return 'Perfect score! You are a true scholar of Middle-earth!';
    if (accuracy >= 90) return 'Excellent! Your knowledge of the films is impressive.';
    if (accuracy >= 80) return 'Great job! You know your way around Middle-earth.';
    if (accuracy >= 70) return 'Good work! Keep practicing to master the trilogy.';
    if (accuracy >= 60) return 'Not bad! There is more to discover about the films.';
    if (accuracy >= 50) return 'A fair attempt. The road goes ever on...';
    return 'The journey continues. Keep learning and try again!';
  };

  const previousRoundAccuracy =
    stats.accuracyTrend.length >= 2
      ? stats.accuracyTrend[stats.accuracyTrend.length - 2]
      : null;

  const improvement =
    previousRoundAccuracy !== null && !isGuest
      ? sessionAccuracy - previousRoundAccuracy
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-100 to-parchment-200 py-8 sm:py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl">{profileEmoji[currentSession.profile]}</span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-charcoal-900">
              {currentSession.profile}'s Round Complete!
            </h1>
          </div>
          <p className="text-charcoal-600">{getAccuracyMessage(sessionAccuracy)}</p>
          {isGuest && (
            <p className="text-charcoal-400 text-sm mt-2">
              Playing as Guest — results not saved
            </p>
          )}
        </motion.div>

        {/* Main Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card text-center mb-8"
        >
          <div className="text-6xl sm:text-7xl font-bold text-forest-600 mb-2">
            {sessionAccuracy}%
          </div>
          <div className="text-xl text-charcoal-700">
            {sessionCorrect} / {sessionCorrect + sessionIncorrect} Correct
          </div>

          {improvement !== null && (
            <div
              className={`mt-4 text-sm ${
                improvement > 0
                  ? 'text-green-600'
                  : improvement < 0
                  ? 'text-red-600'
                  : 'text-charcoal-500'
              }`}
            >
              {improvement > 0 && '↑ '}
              {improvement < 0 && '↓ '}
              {improvement === 0
                ? 'Same as previous round'
                : `${Math.abs(improvement)}% ${
                    improvement > 0 ? 'improvement' : 'decrease'
                  } from previous round`}
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          <StatCard
            value={sessionCorrect}
            label="Correct"
            color="success"
          />
          <StatCard
            value={sessionIncorrect}
            label="Incorrect"
            color="danger"
          />
          {!isGuest && (
            <>
              <StatCard
                value={stats.completedRounds}
                label="Total Rounds"
              />
              <StatCard
                value={`${stats.overallAccuracy}%`}
                label="Overall Accuracy"
              />
            </>
          )}
        </motion.div>

        {/* Historical Context - only for non-Guest */}
        {!isGuest && stats.completedRounds > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card mb-8"
          >
            <h2 className="font-serif font-bold text-lg text-charcoal-900 mb-4">
              {currentSession.profile}'s Progress
            </h2>

            {trendDescription && (
              <p className="text-charcoal-600 mb-4">{trendDescription}</p>
            )}

            {/* Mini trend chart */}
            <div className="bg-parchment-50 rounded-lg p-4">
              <div className="flex items-end justify-between h-16 gap-1">
                {stats.accuracyTrend.slice(-10).map((accuracy, index) => {
                  const isLatest =
                    index === stats.accuracyTrend.slice(-10).length - 1;
                  return (
                    <div
                      key={index}
                      className={`flex-1 rounded-t transition-all ${
                        isLatest
                          ? 'bg-brass-500'
                          : 'bg-forest-400 hover:bg-forest-500'
                      }`}
                      style={{ height: `${accuracy}%` }}
                      title={`Round: ${accuracy}%`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-charcoal-400">
                <span>Previous rounds</span>
                <span>This round</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Incorrect Questions Review */}
        {sessionIncorrect > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card mb-8"
          >
            <button
              onClick={() => setShowIncorrect(!showIncorrect)}
              className="w-full flex items-center justify-between"
            >
              <h2 className="font-serif font-bold text-lg text-charcoal-900">
                Review Incorrect ({sessionIncorrect})
              </h2>
              <span className="text-charcoal-500">
                {showIncorrect ? '▲' : '▼'}
              </span>
            </button>

            {showIncorrect && (
              <div className="mt-4 space-y-4">
                {incorrectAttempts.map((attempt, index) => {
                  const card = getFlashcardById(attempt.flashcardId);
                  if (!card) return null;

                  return (
                    <div
                      key={index}
                      className="bg-red-50 border border-red-200 rounded-lg p-4"
                    >
                      <div className="font-medium text-charcoal-900 mb-2">
                        {card.question}
                      </div>
                      <div className="text-green-700 text-sm">
                        <span className="font-medium">Answer:</span> {card.answer}
                      </div>
                      {card.explanation && (
                        <div className="text-charcoal-500 text-xs mt-2">
                          {card.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={handleStartNewRound}
            disabled={flashcards.length < 20}
            className="btn-brass btn-lg"
          >
            Start Another Round
          </button>
          <button onClick={handleReturnHome} className="btn-secondary btn-lg">
            Return Home
          </button>
        </motion.div>
      </div>
    </div>
  );
}
