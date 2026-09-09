import { useMemo } from 'react';
import { QuestionData } from './QuestionReview';

interface QuestionNavigatorProps {
  questionData: QuestionData[];
  selectedIndex: number;
  onSelectQuestion: (index: number) => void;
}

export default function QuestionNavigator({
  questionData,
  selectedIndex,
  onSelectQuestion,
}: QuestionNavigatorProps) {
  // Get unique players from first question
  const players = useMemo(() => {
    if (questionData.length === 0) return [];
    return questionData[0].playerResults.map((pr) => ({
      key: pr.playerKey,
      name: pr.playerName,
      emoji: pr.playerEmoji,
      isCurrentPlayer: pr.isCurrentPlayer,
    }));
  }, [questionData]);

  if (questionData.length === 0) return null;

  return (
    <div className="bg-white border border-parchment-200 rounded-xl p-4 overflow-x-auto">
      {/* Player Rows */}
      <div className="space-y-2">
        {players.map((player, playerIndex) => (
          <div key={player.key} className="flex items-center gap-2">
            {/* Player Avatar + Name */}
            <div className="flex items-center gap-2 min-w-[100px] shrink-0">
              <img
                src={player.emoji}
                alt={player.name}
                className="w-6 h-6 object-contain"
              />
              <span
                className={`text-sm font-medium truncate max-w-[70px] ${
                  player.isCurrentPlayer
                    ? 'text-forest-700'
                    : 'text-charcoal-700'
                }`}
              >
                {player.name}
              </span>
            </div>

            {/* Correctness Indicators */}
            <div className="flex gap-1">
              {questionData.map((q, qIndex) => {
                const result = q.playerResults[playerIndex];
                if (!result) return null;

                const isCorrect = result.attempt.status === 'correct';
                const isSelected = qIndex === selectedIndex;

                return (
                  <button
                    key={qIndex}
                    onClick={() => onSelectQuestion(qIndex)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all shrink-0 ${
                      isCorrect
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-red-100 text-red-700 border border-red-300'
                    } ${
                      isSelected
                        ? 'ring-2 ring-brass-400 ring-offset-1'
                        : 'hover:ring-1 hover:ring-parchment-400'
                    }`}
                    aria-label={`Question ${qIndex + 1}, ${
                      isCorrect ? 'correct' : 'incorrect'
                    } for ${player.name}`}
                  >
                    {isCorrect ? '✓' : '✗'}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Question Numbers Row */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-parchment-200">
        <div className="min-w-[100px] shrink-0" /> {/* Spacer for alignment */}
        <div className="flex gap-1">
          {questionData.map((_, qIndex) => (
            <button
              key={qIndex}
              onClick={() => onSelectQuestion(qIndex)}
              className={`w-6 h-6 flex items-center justify-center text-xs shrink-0 transition-colors ${
                qIndex === selectedIndex
                  ? 'text-brass-700 font-bold'
                  : 'text-charcoal-400 hover:text-charcoal-600'
              }`}
              aria-label={`Go to question ${qIndex + 1}`}
            >
              {qIndex + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
