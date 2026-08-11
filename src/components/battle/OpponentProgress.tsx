import { motion } from 'framer-motion';
import { BattlePlayer } from '../../types/battle';

interface OpponentProgressProps {
  opponent: BattlePlayer | null;
  totalQuestions: number;
}

export default function OpponentProgress({
  opponent,
  totalQuestions,
}: OpponentProgressProps) {
  if (!opponent) return null;

  const answered = opponent.attempts.filter((a) => a.status !== 'unanswered').length;
  const correct = opponent.attempts.filter((a) => a.status === 'correct').length;
  const progress = (answered / totalQuestions) * 100;
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const isFinished = Boolean(opponent.finishedAt);

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
