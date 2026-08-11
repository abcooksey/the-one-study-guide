import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBattleStore } from '../store/battleStore';
import { BattleWinnerAnnouncement } from '../components/battle';
import { BattleStats } from '../types/battle';

export default function BattleResults() {
  const navigate = useNavigate();

  const {
    battle,
    playerKey,
    getPlayerStats,
    getOpponentStats,
    leaveBattle,
  } = useBattleStore();

  // Redirect if no battle data
  useEffect(() => {
    if (!battle || battle.status !== 'completed') {
      navigate('/');
    }
  }, [battle, navigate]);

  if (!battle || !playerKey || battle.status !== 'completed') {
    return null;
  }

  const player1Stats = getPlayerStats();
  const player2Stats = getOpponentStats();

  // If stats are somehow missing, create defaults
  const defaultStats: BattleStats = {
    correct: 0,
    incorrect: 0,
    totalTime: 0,
    accuracy: 0,
  };

  const finalPlayer1Stats = playerKey === 'player1'
    ? (player1Stats || defaultStats)
    : (player2Stats || defaultStats);

  const finalPlayer2Stats = playerKey === 'player1'
    ? (player2Stats || defaultStats)
    : (player1Stats || defaultStats);

  const handlePlayAgain = () => {
    leaveBattle();
    navigate('/battle');
  };

  const handleReturnHome = () => {
    leaveBattle();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-100 to-parchment-200">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur border-b border-parchment-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="w-16" />
          <h1 className="font-serif font-bold text-charcoal-900 text-lg">
            Battle Results
          </h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <BattleWinnerAnnouncement
          winnerId={battle.winnerId || 'tie'}
          player1={battle.player1}
          player2={battle.player2!}
          currentPlayerKey={playerKey}
          player1Stats={finalPlayer1Stats}
          player2Stats={finalPlayer2Stats}
        />

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
        >
          <button
            onClick={handlePlayAgain}
            className="btn-brass btn-lg"
          >
            Play Again
          </button>
          <button
            onClick={handleReturnHome}
            className="btn-secondary btn-lg"
          >
            Return Home
          </button>
        </motion.div>

        {/* Fun fact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-12 text-center"
        >
          <p className="text-charcoal-500 text-sm">
            Remember: "All's well that ends better." - Tolkien (probably)
          </p>
        </motion.div>
      </div>
    </div>
  );
}
