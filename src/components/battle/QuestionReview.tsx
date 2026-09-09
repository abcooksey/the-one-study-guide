import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Battle, PlayerKey, BattleAttempt } from '../../types/battle';
import { Flashcard } from '../../types';
import { getActivePlayers } from '../../lib/battleFirestore';
import QuestionNavigator from './QuestionNavigator';
import QuestionDetail from './QuestionDetail';
import CategoryInsights from './CategoryInsights';

interface QuestionReviewProps {
  battle: Battle;
  playerKey: PlayerKey;
  flashcards: Flashcard[];
}

export interface PlayerResult {
  playerKey: PlayerKey;
  playerName: string;
  playerEmoji: string;
  attempt: BattleAttempt;
  isCurrentPlayer: boolean;
}

export interface QuestionData {
  flashcard: Flashcard | undefined;
  playerResults: PlayerResult[];
  index: number;
}

export interface CategoryInsightData {
  best: { category: string; accuracy: number } | null;
  worst: { category: string; accuracy: number } | null;
  sharedStruggle: { category: string; accuracy: number } | null;
}

function calculateCategoryInsights(
  questionData: QuestionData[],
  currentPlayerKey: PlayerKey
): CategoryInsightData {
  // Track category stats for current player
  const categoryStats = new Map<string, { correct: number; total: number }>();
  // Track category stats for all players combined
  const allPlayersStats = new Map<string, { correct: number; total: number }>();

  for (const q of questionData) {
    if (!q.flashcard) continue;
    const category = q.flashcard.category;

    // Initialize if needed
    if (!categoryStats.has(category)) {
      categoryStats.set(category, { correct: 0, total: 0 });
    }
    if (!allPlayersStats.has(category)) {
      allPlayersStats.set(category, { correct: 0, total: 0 });
    }

    // Current player stats
    const currentPlayerResult = q.playerResults.find(
      (pr) => pr.playerKey === currentPlayerKey
    );
    if (currentPlayerResult) {
      const stat = categoryStats.get(category)!;
      stat.total++;
      if (currentPlayerResult.attempt.status === 'correct') {
        stat.correct++;
      }
    }

    // All players combined stats
    for (const pr of q.playerResults) {
      const stat = allPlayersStats.get(category)!;
      stat.total++;
      if (pr.attempt.status === 'correct') {
        stat.correct++;
      }
    }
  }

  // Calculate accuracies for current player
  const playerAccuracies: { category: string; accuracy: number; total: number }[] = [];
  categoryStats.forEach((stats, category) => {
    if (stats.total > 0) {
      playerAccuracies.push({
        category,
        accuracy: Math.round((stats.correct / stats.total) * 100),
        total: stats.total,
      });
    }
  });

  // Calculate accuracies for all players
  const allAccuracies: { category: string; accuracy: number; total: number }[] = [];
  allPlayersStats.forEach((stats, category) => {
    if (stats.total > 0) {
      allAccuracies.push({
        category,
        accuracy: Math.round((stats.correct / stats.total) * 100),
        total: stats.total,
      });
    }
  });

  // Sort to find best and worst for current player
  const sortedByAccuracy = [...playerAccuracies].sort((a, b) => b.accuracy - a.accuracy);
  const best = sortedByAccuracy.length > 0 ? sortedByAccuracy[0] : null;
  const worst =
    sortedByAccuracy.length > 1
      ? sortedByAccuracy[sortedByAccuracy.length - 1]
      : null;

  // Find shared struggle (everyone did poorly on this category)
  const sharedStruggle = allAccuracies
    .filter((a) => a.accuracy < 50 && a.total >= 2)
    .sort((a, b) => a.accuracy - b.accuracy)[0] || null;

  return {
    best: best ? { category: best.category, accuracy: best.accuracy } : null,
    worst: worst && worst.accuracy < best!.accuracy
      ? { category: worst.category, accuracy: worst.accuracy }
      : null,
    sharedStruggle: sharedStruggle
      ? { category: sharedStruggle.category, accuracy: sharedStruggle.accuracy }
      : null,
  };
}

export default function QuestionReview({
  battle,
  playerKey,
  flashcards,
}: QuestionReviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

  // Get flashcard map for quick lookup
  const flashcardMap = useMemo(
    () => new Map(flashcards.map((f) => [f.id, f])),
    [flashcards]
  );

  // Build question data with player results
  const questionData = useMemo(() => {
    const activePlayers = getActivePlayers(battle);

    return battle.questionIds.map((qId, index) => {
      const flashcard = flashcardMap.get(qId);
      const playerResults: PlayerResult[] = activePlayers.map(({ key, player }) => ({
        playerKey: key,
        playerName: player.name,
        playerEmoji: player.emoji,
        attempt: player.attempts[index] || {
          flashcardId: qId,
          status: 'unanswered' as const,
        },
        isCurrentPlayer: key === playerKey,
      }));
      return { flashcard, playerResults, index };
    });
  }, [battle, flashcardMap, playerKey]);

  // Calculate category insights for current player
  const categoryInsights = useMemo(
    () => calculateCategoryInsights(questionData, playerKey),
    [questionData, playerKey]
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isExpanded) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSelectedQuestionIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSelectedQuestionIndex((i) =>
        Math.min(questionData.length - 1, i + 1)
      );
    }
  };

  return (
    <motion.div
      className="mt-8"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Question Review"
    >
      {/* Expand/Collapse Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-4 bg-white border border-parchment-200 rounded-xl
                   flex items-center justify-center gap-2 hover:bg-parchment-50
                   transition-colors"
        aria-expanded={isExpanded}
      >
        <span className="font-medium text-charcoal-700">Review Questions</span>
        <svg
          className={`w-5 h-5 text-charcoal-500 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-4">
              {/* Category Insights */}
              <CategoryInsights insights={categoryInsights} />

              {/* Question Navigator */}
              <QuestionNavigator
                questionData={questionData}
                selectedIndex={selectedQuestionIndex}
                onSelectQuestion={setSelectedQuestionIndex}
              />

              {/* Question Detail */}
              <QuestionDetail
                data={questionData[selectedQuestionIndex]}
                questionNumber={selectedQuestionIndex + 1}
                totalQuestions={questionData.length}
                onPrevious={() =>
                  setSelectedQuestionIndex((i) => Math.max(0, i - 1))
                }
                onNext={() =>
                  setSelectedQuestionIndex((i) =>
                    Math.min(questionData.length - 1, i + 1)
                  )
                }
                battleId={battle.id}
                battleStartedAt={battle.battleStartedAt}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
