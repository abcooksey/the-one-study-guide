import { motion } from 'framer-motion';
import { BattlePlayer } from '../../types/battle';

interface OpponentProgressProps {
  opponent: BattlePlayer | null;
  totalQuestions: number;
  compact?: boolean;  // For displaying multiple opponents
}

export default function OpponentProgress({
  opponent,
  totalQuestions,
  compact = false,
}: OpponentProgressProps) {
  if (!opponent) return null;

  const answered = opponent.attempts.filter((a) => a.status !== 'unanswered').length;
  const correct = opponent.attempts.filter((a) => a.status === 'correct').length;
  const progress = (answered / totalQuestions) * 100;
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const isFinished = Boolean(opponent.finishedAt);

  if (compact) {
    // Compact layout for multiple opponents
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur border border-parchment-200 rounded-lg px-3 py-2 shadow-sm"
      >
        <div className="flex items-center gap-2">
          {/* Opponent avatar and name */}
          <img src={opponent.emoji} alt={opponent.name} className="w-6 h-6 object-contain" />
          <span className="font-medium text-charcoal-700 text-xs truncate max-w-[60px]">
            {opponent.name}
          </span>

          {/* Progress bar */}
          <div className="flex-1 min-w-[50px]">
            <div className="h-1.5 bg-parchment-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className={`h-full rounded-full ${
                  isFinished ? 'bg-forest-500' : 'bg-brass-400'
                }`}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-charcoal-500">{answered}/{totalQuestions}</span>
            {isFinished && (
              <span className="bg-forest-100 text-forest-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                Done
              </span>
            )}
          </div>
        </div>

        {/* Connection status */}
        {!opponent.isConnected && (
          <div className="mt-1 flex items-center gap-1 text-[10px] text-red-500">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Disconnected
          </div>
        )}
      </motion.div>
    );
  }

  // Full layout for single opponent
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 backdrop-blur border border-parchment-200 rounded-xl px-4 py-3 shadow-sm"
    >
      <div className="flex items-center gap-3">
        {/* Opponent avatar */}
        <div className="flex items-center gap-2">
          <img src={opponent.emoji} alt={opponent.name} className="w-8 h-8 object-contain" />
          <span className="font-medium text-charcoal-700 text-sm">
            {opponent.name}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex-1">
          <div className="h-2 bg-parchment-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              className={`h-full rounded-full ${
                isFinished ? 'bg-forest-500' : 'bg-brass-400'
              }`}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-sm">
          <span className="text-charcoal-500">
            {answered}/{totalQuestions}
          </span>
          {answered > 0 && (
            <span
              className={`font-medium ${
                accuracy >= 70
                  ? 'text-green-600'
                  : accuracy >= 50
                  ? 'text-brass-600'
                  : 'text-red-600'
              }`}
            >
              {accuracy}%
            </span>
          )}
          {isFinished && (
            <span className="bg-forest-100 text-forest-700 px-2 py-0.5 rounded-full text-xs font-medium">
              Done
            </span>
          )}
        </div>
      </div>

      {/* Connection status */}
      {!opponent.isConnected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 flex items-center gap-1 text-xs text-red-500"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Opponent disconnected
        </motion.div>
      )}
    </motion.div>
  );
}
