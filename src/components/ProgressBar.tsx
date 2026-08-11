import { SessionAttempt } from '../types';

interface ProgressBarProps {
  attempts: SessionAttempt[];
  currentIndex: number;
  onGoToCard: (index: number) => void;
}

export default function ProgressBar({
  attempts,
  currentIndex,
  onGoToCard,
}: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-charcoal-700">
          Question {currentIndex + 1} of {attempts.length}
        </span>
        <span className="text-sm text-charcoal-500">
          {attempts.filter((a) => a.status !== 'unanswered').length} answered
        </span>
      </div>

      <div
        className="flex gap-1"
        role="group"
        aria-label="Question progress"
      >
        {attempts.map((attempt, index) => (
          <button
            key={index}
            onClick={() => onGoToCard(index)}
            className={`
              progress-segment flex-1 h-3 rounded-sm transition-all
              ${attempt.status === 'correct' ? 'bg-green-500' : ''}
              ${attempt.status === 'incorrect' ? 'bg-red-500' : ''}
              ${attempt.status === 'unanswered' ? 'bg-parchment-300 hover:bg-parchment-400' : ''}
              ${index === currentIndex ? 'ring-2 ring-brass-400 ring-offset-1 scale-110' : ''}
            `}
            aria-label={`Question ${index + 1}: ${attempt.status}`}
            aria-current={index === currentIndex ? 'true' : 'false'}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 mt-3">
        <div className="flex items-center gap-1.5 text-xs text-charcoal-500">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span>Correct</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-charcoal-500">
          <div className="w-3 h-3 rounded-sm bg-red-500" />
          <span>Incorrect</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-charcoal-500">
          <div className="w-3 h-3 rounded-sm bg-parchment-300" />
          <span>Unanswered</span>
        </div>
      </div>
    </div>
  );
}
