import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBattleStore } from '../store/battleStore';
import { useAppStore } from '../store';
import { useTournamentStore } from '../store/tournamentStore';
import { BattleWinnerAnnouncement } from '../components/battle';
import { BattleStats, BattleAttempt, PlayerKey } from '../types/battle';
import { BattleResult } from '../types/battlePlayer';
import { BattleHistoryEntry } from '../types/battleHistory';
import { getOrCreatePlayer, updatePlayerStats } from '../lib/battlePlayerFirestore';
import { getActivePlayers } from '../lib/battleFirestore';
import { saveBattleHistoryEntry } from '../lib/battleHistoryFirestore';

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
  const [searchParams] = useSearchParams();
  const statsUpdatedRef = useRef(false);
  const tournamentUpdatedRef = useRef(false);
  const [rematchCode, setRematchCode] = useState<string | null>(null);
  const [isCreatingRematch, setIsCreatingRematch] = useState(false);

  // State to track when data has stabilized from Firestore sync
  const [isDataStable, setIsDataStable] = useState(false);
  const lastRankingsRef = useRef<string | null>(null);

  // Check if this is a tournament battle
  const tournamentId = searchParams.get('tournament');
  const matchId = searchParams.get('match');

  const {
    battle,
    playerKey,
    getStatsForPlayer,
    leaveBattle,
    createRematch,
    lastBattleConfig,
  } = useBattleStore();

  const flashcards = useAppStore((state) => state.flashcards);
  const { completeMatch } = useTournamentStore();

  // Update player stats and save battle history when battle completes (only host does this to avoid race conditions)
  useEffect(() => {
    const updateStats = async () => {
      // Only the host (player1) updates stats to prevent duplicate updates
      if (playerKey !== 'player1') {
        return;
      }

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

      // Calculate battle duration (from battleStartedAt to now)
      const battleStartTime = battle.battleStartedAt
        ? new Date(battle.battleStartedAt).getTime()
        : Date.now();

      // Update stats and save history for each player
      for (const { key, player } of activePlayers) {
        const rankIndex = battle.rankings.indexOf(key);
        if (rankIndex === -1) continue;

        const placement = (rankIndex + 1) as BattleResult; // 1, 2, 3, or 4
        const stats = calculateCorrectnessStats(player.attempts);

        // Update player stats
        await updatePlayerStats(
          player.name,
          placement,
          stats.correct,
          stats.answered
        );

        // Get opponent names for this player
        const opponentNames = activePlayers
          .filter(({ key: k }) => k !== key)
          .map(({ player: p }) => p.name.toLowerCase());

        // Calculate player's finish time
        const finishTime = player.finishedAt
          ? new Date(player.finishedAt).getTime()
          : Date.now();
        const duration = finishTime - battleStartTime;

        // Create history entry
        const historyEntry: BattleHistoryEntry = {
          battleId: battle.id,
          date: new Date().toISOString(),
          opponents: opponentNames,
          placement: placement as 1 | 2 | 3 | 4,
          totalPlayers: activePlayers.length,
          correct: stats.correct,
          answered: stats.answered,
          accuracy: stats.answered > 0
            ? Math.round((stats.correct / stats.answered) * 100)
            : 0,
          duration,
        };

        // Save to player's battle history
        await saveBattleHistoryEntry(player.name, historyEntry);
      }
    };

    updateStats();
  }, [battle, playerKey]);

  // Handle tournament match completion
  useEffect(() => {
    const advanceTournamentWinner = async () => {
      // Only the host handles tournament updates
      if (playerKey !== 'player1') return;

      if (!battle || battle.status !== 'completed' || tournamentUpdatedRef.current) return;
      if (!tournamentId || !matchId || !battle.rankings) return;

      tournamentUpdatedRef.current = true;

      // Get the winner (first in rankings)
      const winnerKey = battle.rankings[0];
      const winnerPlayer = battle[winnerKey];
      if (!winnerPlayer) return;

      // Complete the tournament match
      await completeMatch(matchId, winnerPlayer.name);
    };

    advanceTournamentWinner();
  }, [battle, playerKey, tournamentId, matchId, completeMatch]);

  // Wait for rankings to stabilize (same value for 500ms) to prevent race conditions
  useEffect(() => {
    if (!battle || battle.status !== 'completed' || !battle.rankings) {
      setIsDataStable(false);
      return;
    }

    const rankingsKey = battle.rankings.join(',');

    if (lastRankingsRef.current !== rankingsKey) {
      // Rankings changed - reset and wait for stabilization
      lastRankingsRef.current = rankingsKey;
      setIsDataStable(false);
    }

    // Always set a timer to mark as stable after 500ms
    // This handles both initial load and subsequent updates
    const timer = setTimeout(() => {
      setIsDataStable(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [battle?.rankings?.join(','), battle?.status]);

  // Redirect if no battle data - only if data is stable and still no valid battle
  useEffect(() => {
    // Give time for data to load before redirecting
    if (!battle) {
      const timer = setTimeout(() => {
        if (!battle) {
          navigate('/');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [battle, navigate]);

  // Show loading until data is stable to prevent race condition display issues
  if (!battle || !playerKey || battle.status !== 'completed' || !isDataStable) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-parchment-100 to-parchment-200 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-charcoal-600">Loading results...</p>
        </div>
      </div>
    );
  }

  // Build stats map using rankings order to ensure consistency
  const playerStats: Record<PlayerKey, BattleStats | null> = {
    player1: null,
    player2: null,
    player3: null,
    player4: null,
  };

  // Only populate stats for players that exist in rankings
  if (battle.rankings) {
    for (const key of battle.rankings) {
      playerStats[key] = getStatsForPlayer(key);
    }
  }

  const handleReturnHome = () => {
    leaveBattle();
    navigate('/');
  };

  const handleReturnToTournament = () => {
    leaveBattle();
    if (tournamentId) {
      navigate(`/tournament/${tournamentId}`);
    }
  };

  const handleRematch = async () => {
    if (!battle || !playerKey) return;

    const currentPlayer = battle[playerKey];
    if (!currentPlayer) return;

    setIsCreatingRematch(true);

    const code = await createRematch(
      { name: currentPlayer.name, emoji: currentPlayer.emoji },
      flashcards
    );

    setIsCreatingRematch(false);

    if (code) {
      setRematchCode(code);
    }
  };

  const handleGoToRematch = () => {
    if (rematchCode) {
      navigate(`/battle/${rematchCode}`);
    }
  };

  const handleCopyRematchCode = () => {
    if (rematchCode) {
      navigator.clipboard.writeText(rematchCode);
    }
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
          {/* Tournament battle - single button to return */}
          {tournamentId ? (
            <button
              onClick={handleReturnToTournament}
              className="btn-primary btn-lg"
            >
              Return to Tournament
            </button>
          ) : !rematchCode ? (
            <>
              <button
                onClick={handleRematch}
                disabled={isCreatingRematch}
                className="btn-primary btn-lg"
              >
                {isCreatingRematch ? 'Creating...' : 'Rematch'}
              </button>
              <button
                onClick={handleReturnHome}
                className="btn-secondary btn-lg"
              >
                Return Home
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-parchment-200">
                <p className="text-charcoal-600 text-sm mb-2 text-center">
                  Share this code with your opponent{lastBattleConfig && lastBattleConfig.opponentNames.length > 0 && 's'}:
                </p>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="font-mono text-3xl font-bold text-primary-600 tracking-wider">
                    {rematchCode}
                  </span>
                  <button
                    onClick={handleCopyRematchCode}
                    className="p-2 hover:bg-parchment-100 rounded-lg transition-colors"
                    title="Copy code"
                  >
                    <svg className="w-5 h-5 text-charcoal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                {lastBattleConfig && lastBattleConfig.opponentNames.length > 0 && (
                  <p className="text-charcoal-500 text-xs text-center mb-4">
                    Waiting for: {lastBattleConfig.opponentNames.join(', ')}
                  </p>
                )}
                <button
                  onClick={handleGoToRematch}
                  className="btn-primary w-full"
                >
                  Go to Lobby
                </button>
              </div>
              <button
                onClick={handleReturnHome}
                className="text-charcoal-500 hover:text-charcoal-700 text-sm"
              >
                Cancel and Return Home
              </button>
            </div>
          )}
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
