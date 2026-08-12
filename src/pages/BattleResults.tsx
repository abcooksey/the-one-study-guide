import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBattleStore } from '../store/battleStore';
import { BattleWinnerAnnouncement } from '../components/battle';
import { BattleStats, BattleAttempt, PlayerKey } from '../types/battle';
import { BattleResult } from '../types/battlePlayer';
import { getOrCreatePlayer, updatePlayerStats } from '../lib/battlePlayerFirestore';
import { getActivePlayers } from '../lib/battleFirestore';

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
    getStatsForPlayer,
    leaveBattle,
  } = useBattleStore();

  // Update player stats when battle completes
  useEffect(() => {
    const updateStats = async () => {
      if (!battle || battle.status !== 'completed' || statsUpdatedRef.current) {
        return;
      }

      if (!battle.rankings || battle.rankings.length < 2) {
        return;
      }

      statsUpdatedRef.current = true;

      // Get all active players
      const activePlayers = getActivePlayers(battle);

      // Ensure all players have profiles
      for (const { player } of activePlayers) {
        await getOrCreatePlayer(player.name, player.emoji);
      }

      // Update stats for each player based on their placement
      for (const { key, player } of activePlayers) {
        const rankIndex = battle.rankings.indexOf(key);
        if (rankIndex === -1) continue;

        const placement = (rankIndex + 1) as BattleResult; // 1, 2, 3, or 4
        const stats = calculateCorrectnessStats(player.attempts);

        await updatePlayerStats(
          player.name,
          placement,
          stats.correct,
          stats.answered
        );
      }
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

  // Build stats map for all players
  const playerStats: Record<PlayerKey, BattleStats | null> = {
    player1: getStatsForPlayer('player1'),
    player2: getStatsForPlayer('player2'),
    player3: getStatsForPlayer('player3'),
    player4: getStatsForPlayer('player4'),
  };

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
          rankings={battle.rankings || []}
          players={{
            player1: battle.player1,
            player2: battle.player2,
            player3: battle.player3,
            player4: battle.player4,
          }}
          playerStats={playerStats}
          currentPlayerKey={playerKey}
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
