import { useState, useEffect } from 'react';
import { QuestionData } from './QuestionReview';
import { addPracticeFlag, getUserPracticeFlags } from '../../lib/practiceFlagsFirestore';

interface QuestionDetailProps {
  data: QuestionData;
  questionNumber: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  battleId: string;
  battleStartedAt?: string;
}

export default function QuestionDetail({
  data,
  questionNumber,
  totalQuestions,
  onPrevious,
  onNext,
  battleId,
  battleStartedAt,
}: QuestionDetailProps) {
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [flaggingInProgress, setFlaggingInProgress] = useState<string | null>(null);

  const { flashcard, playerResults } = data;

  // Get current player name for practice flags
  const currentPlayer = playerResults.find((pr) => pr.isCurrentPlayer);
  const currentPlayerName = currentPlayer?.playerName || '';

  // Load existing flags on mount
  useEffect(() => {
    const loadFlags = async () => {
      if (!currentPlayerName) return;
      try {
        const flags = await getUserPracticeFlags(currentPlayerName);
        setFlaggedQuestions(new Set(flags.map((f) => f.flashcardId)));
      } catch (error) {
        console.error('Error loading practice flags:', error);
      }
    };
    loadFlags();
  }, [currentPlayerName]);

  if (!flashcard) {
    return (
      <div className="bg-white border border-parchment-200 rounded-xl p-6 text-center text-charcoal-500">
        Question data not available
      </div>
    );
  }

  // Calculate time from battle start to when player answered
  const getAnswerTime = (answeredAt: string | undefined): number | null => {
    if (!answeredAt || !battleStartedAt) return null;
    const start = new Date(battleStartedAt).getTime();
    const answered = new Date(answeredAt).getTime();
    const diff = (answered - start) / 1000;
    return diff > 0 ? diff : null;
  };

  const handleFlag = async (flashcardId: string) => {
    if (!currentPlayerName || flaggingInProgress) return;

    setFlaggingInProgress(flashcardId);
    try {
      await addPracticeFlag(currentPlayerName, flashcardId, battleId);
      setFlaggedQuestions((prev) => new Set(prev).add(flashcardId));
    } catch (error) {
      console.error('Error flagging question:', error);
    } finally {
      setFlaggingInProgress(null);
    }
  };

  return (
    <div className="bg-white border border-parchment-200 rounded-xl overflow-hidden">
      {/* Navigation Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-parchment-50 border-b border-parchment-200">
        <button
          onClick={onPrevious}
          disabled={questionNumber === 1}
          className="text-charcoal-500 hover:text-charcoal-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Q{questionNumber - 1}
        </button>
        <span className="font-medium text-charcoal-700">
          Question {questionNumber} of {totalQuestions}
        </span>
        <button
          onClick={onNext}
          disabled={questionNumber === totalQuestions}
          className="text-charcoal-500 hover:text-charcoal-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Q{questionNumber + 1} →
        </button>
      </div>

      {/* Question Card */}
      <div className="p-6">
        <div className="text-xs text-charcoal-500 mb-2">
          {flashcard.category} · {flashcard.film}
        </div>
        <p className="text-lg text-charcoal-900 mb-4">{flashcard.question}</p>
        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <span className="text-green-600 shrink-0">✓</span>
          <span className="text-green-800 font-medium">{flashcard.answer}</span>
        </div>
      </div>

      {/* Player Results - Horizontal on desktop, responsive grid */}
      <div
        className={`border-t border-parchment-200 grid divide-x divide-parchment-200 ${
          playerResults.length <= 2
            ? 'grid-cols-2'
            : 'grid-cols-2 md:grid-cols-4'
        }`}
      >
        {playerResults.map((result) => {
          const isCorrect = result.attempt.status === 'correct';
          const timeSeconds = getAnswerTime(result.attempt.answeredAt);
          const showFlagButton =
            result.isCurrentPlayer &&
            !isCorrect &&
            !flaggedQuestions.has(flashcard.id);
          const isFlagged = flaggedQuestions.has(flashcard.id);
          const isFlagging = flaggingInProgress === flashcard.id;

          return (
            <div
              key={result.playerKey}
              className={`p-4 text-center ${
                result.isCurrentPlayer ? 'bg-parchment-50' : ''
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <img
                  src={result.playerEmoji}
                  alt={result.playerName}
                  className="w-8 h-8 object-contain"
                />
                <span className="font-medium text-sm text-charcoal-800">
                  {result.playerName}
                  {result.isCurrentPlayer && (
                    <span className="text-forest-600 text-xs ml-1">(You)</span>
                  )}
                </span>
              </div>

              <div
                className={`text-lg font-bold ${
                  isCorrect ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isCorrect ? '✓ Correct' : '✗ Incorrect'}
              </div>

              {timeSeconds !== null && (
                <div className="text-sm text-charcoal-500 mt-1">
                  ⏱ {timeSeconds.toFixed(1)}s
                </div>
              )}

              {showFlagButton && (
                <button
                  onClick={() => handleFlag(flashcard.id)}
                  disabled={isFlagging}
                  className="mt-3 text-xs text-brass-600 hover:text-brass-700 flex items-center justify-center gap-1 mx-auto disabled:opacity-50"
                >
                  <span>🚩</span>
                  {isFlagging ? 'Flagging...' : 'Flag for Practice'}
                </button>
              )}

              {isFlagged && result.isCurrentPlayer && !isCorrect && (
                <div className="mt-3 text-xs text-charcoal-400 flex items-center justify-center gap-1">
                  <span>✓</span> Flagged
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
