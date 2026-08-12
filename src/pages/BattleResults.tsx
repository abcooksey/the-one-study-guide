import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBattleStore } from '../store/battleStore';
import { BattleWinnerAnnouncement } from '../components/battle';
import { BattleStats, BattleAttempt } from '../types/battle';
import { BattleResult } from '../types/battlePlayer';
import { getOrCreatePlayer, updatePlayerStats } from '../lib/battlePlayerFirestore';

// Calculate correctness stats from attempts, excluding flagged/unanswered questions
const calculateCorrectnessStats = (attempts: BattleAttempt[]) => {
  const correct = attempts.filter((a) => a.status === 'correct').length;
  // At end of battle, unanswered counts as incorrect
  const incorrect = attempts.filter(
    (a) => a.status === 'incorrect' || a.status === 'unanswered'
  ).length;
  return { correct, answered: correct + incorrect };
};

export default function BattleResults() {
  const navigate = useNavigate();
  const statsUpdatedRef = useRef(false);

  const {
    battle,
    playerKey,
    getPlayerStats,
    getOpponentStats,
    leaveBattle,
  } = useBattleStore();

  // Update player stats when battle completes
  useEffect(() => {
    const updateStats = async () => {
      if (!battle || battle.status !== 'completed' || statsUpdatedRef.current) {
        return;
      }

      if (!battle.player1 || !battle.player2 || !battle.winnerId) {
        return;
      }

      statsUpdatedRef.current = true;

      // Ensure both players have profiles
      await getOrCreatePlayer(battle.player1.name, battle.player1.emoji);
      await getOrCreatePlayer(battle.player2.name, battle.player2.emoji);

      // Calculate results for each player
      const p1Stats = calculateCorrectnessStats(battle.player1.attempts);
      const p2Stats = calculateCorrectnessStats(battle.player2.attempts);

      // Determine results
      let p1Result: BattleResult;
      let p2Result: BattleResult;

      if (battle.winnerId === 'player1') {
        p1Result = 'win';
        p2Result = 'loss';
      } else if (battle.winnerId === 'player2') {
        p1Result = 'loss';
        p2Result = 'win';
      } else {
        p1Result = 'tie';
        p2Result = 'tie';
      }

      // Update stats for both players
      await updatePlayerStats(
        battle.player1.name,
        p1Result,
        p1Stats.correct,
        p1Stats.answered
      );
      await updatePlayerStats(
        battle.player2.name,
        p2Result,
        p2Stats.correct,
        p2Stats.answered
      );
    };

    updateStats();
  }, [battle]);

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
