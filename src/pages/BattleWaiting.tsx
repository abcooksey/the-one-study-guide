import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBattleStore } from '../store/battleStore';
import { BattlePlayer } from '../types/battle';

const WAITING_MESSAGES = [
  "Your opponents are still battling through Middle-earth...",
  "The fellowship is still on their journey...",
  "Even Gandalf needed time to answer the Balrog...",
  "Patience, young hobbit. Your opponents aren't finished yet...",
  "The Eagles are coming... but your opponents aren't done yet!",
];

// Component for displaying a single opponent's progress
function OpponentWaitingCard({ opponent, totalQuestions }: { opponent: BattlePlayer; totalQuestions: number }) {
  const opponentProgress = opponent.attempts.filter((a) => a.status !== 'unanswered').length;
  const progressPercent = (opponentProgress / totalQuestions) * 100;
  const isFinished = Boolean(opponent.finishedAt);

  return (
    <div className="bg-white/80 rounded-xl p-4 border border-parchment-200">
      <div className="flex items-center justify-center gap-3 mb-3">
        <img src={opponent.emoji} alt={opponent.name} className="w-10 h-10 object-contain" />
        <span className="font-medium text-charcoal-800">{opponent.name}</span>
        {isFinished && (
          <span className="bg-forest-100 text-forest-700 px-2 py-0.5 rounded-full text-xs font-medium">
            Done
          </span>
        )}
      </div>

      <div className="mb-2">
        <div className="h-2 bg-parchment-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full rounded-full ${isFinished ? 'bg-forest-500' : 'bg-brass-400'}`}
          />
        </div>
      </div>

      <p className="text-sm text-charcoal-500 text-center">
        {opponentProgress} of {totalQuestions} answered
      </p>
    </div>
  );
}

export default function BattleWaiting() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();

  const { battle, playerKey, getPlayerStats, getOpponents, leaveBattle } = useBattleStore();

  const opponents = getOpponents();
  const playerStats = getPlayerStats();
  const totalQuestions = battle?.questionIds.length ?? 20;

  // Navigate to results when battle is completed
  useEffect(() => {
    if (battle?.status === 'completed') {
      navigate(`/battle/${code}/results`);
    }
  }, [battle?.status, code, navigate]);

  // Redirect if no battle
  useEffect(() => {
    if (!battle) {
      navigate('/');
    }
  }, [battle, navigate]);

  // Get a random waiting message
  const waitingMessage = WAITING_MESSAGES[Math.floor(Math.random() * WAITING_MESSAGES.length)];

  if (!battle || !playerKey) {
    return null;
  }

  // Check how many opponents are still playing
  const opponentsStillPlaying = opponents.filter(o => !o.finishedAt).length;

  const handleLeave = () => {
    leaveBattle();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-100 to-parchment-200 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur border-b border-parchment-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <h1 className="font-serif font-bold text-charcoal-900 text-lg">
            Battle Mode
          </h1>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-2xl w-full">
          {/* Celebration for finishing */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="text-6xl mb-6"
          >
            ..
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900 mb-4"
          >
            You're Done!
          </motion.h2>

          {/* Your stats */}
          {playerStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-4 border border-parchment-200 mb-6 max-w-sm mx-auto"
            >
              <div className="flex justify-center gap-8 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{playerStats.correct}</div>
                  <div className="text-sm text-charcoal-500">Correct</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{playerStats.incorrect}</div>
                  <div className="text-sm text-charcoal-500">Incorrect</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-charcoal-900">{playerStats.accuracy}%</div>
                  <div className="text-sm text-charcoal-500">Accuracy</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Waiting message */}
          {opponentsStillPlaying > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-charcoal-600 mb-8 italic"
            >
              "{waitingMessage}"
            </motion.p>
          )}

          {/* Opponents progress */}
          {opponents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`grid gap-4 mb-6 ${
                opponents.length === 1
                  ? 'grid-cols-1 max-w-sm mx-auto'
                  : opponents.length === 2
                    ? 'grid-cols-1 md:grid-cols-2 max-w-xl mx-auto'
                    : 'grid-cols-1 md:grid-cols-3'
              }`}
            >
              {opponents.map((opponent) => (
                <OpponentWaitingCard
                  key={opponent.name}
                  opponent={opponent}
                  totalQuestions={totalQuestions}
                />
              ))}
            </motion.div>
          )}

          {/* Animated waiting indicator */}
          {opponentsStillPlaying > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-1 mb-4"
            >
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                className="w-2 h-2 bg-brass-400 rounded-full"
              />
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                className="w-2 h-2 bg-brass-400 rounded-full"
              />
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                className="w-2 h-2 bg-brass-400 rounded-full"
              />
            </motion.div>
          )}

          {/* Leave button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            onClick={handleLeave}
            className="mt-4 text-charcoal-500 hover:text-charcoal-700 text-sm underline"
          >
            Leave Battle
          </motion.button>
        </div>
      </div>
    </div>
  );
}
