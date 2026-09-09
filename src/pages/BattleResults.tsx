import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBattleStore } from '../store/battleStore';
import { useAppStore } from '../store';
import { useTournamentStore } from '../store/tournamentStore';
import { BattleWinnerAnnouncement, QuestionReview } from '../components/battle';
import RematchInviteModal from '../components/battle/RematchInviteModal';
import { BattleStats, BattleAttempt, PlayerKey } from '../types/battle';
import { BattleResult } from '../types/battlePlayer';
import { BattleHistoryEntry } from '../types/battleHistory';
import { getOrCreatePlayer, updatePlayerStats } from '../lib/battlePlayerFirestore';
import { getActivePlayers } from '../lib/battleFirestore';
import { saveBattleHistoryEntry } from '../lib/battleHistoryFirestore';
import { updateQuestionStats } from '../lib/questionStatsFirestore';

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
  const [isCreatingRematch, setIsCreatingRematch] = useState(false);

  // State to track when data has stabilized from Firestore sync
  const [isDataStable, setIsDataStable] = useState(false);
  const lastRankingsRef = useRef<string | null>(null);

  // Rematch invite state
  const [showRematchInvite, setShowRematchInvite] = useState(false);
  const [rematchInviteData, setRematchInviteData] = useState<{
    code: string;
    initiatorName: string;
    initiatorEmoji?: string;
  } | null>(null);
  const processedRematchCodeRef = useRef<string | null>(null);

  // Check if this is a tournament battle
  const tournamentId = searchParams.get('tournament');
  const matchId = searchParams.get('match');

  const {
    battle,
    playerKey,
    getStatsForPlayer,
    leaveBattle,
    createRematch,
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

      // Update question statistics for cross-session difficulty tracking
      for (let i = 0; i < battle.questionIds.length; i++) {
        const questionId = battle.questionIds[i];
        let correctCount = 0;
        let totalTimeMs = 0;

        for (const { player } of activePlayers) {
          const attempt = player.attempts[i];
          if (attempt && attempt.status === 'correct') correctCount++;
          if (attempt && attempt.answeredAt && battle.battleStartedAt) {
            const answerTime = new Date(attempt.answeredAt).getTime();
            const startTime = new Date(battle.battleStartedAt).getTime();
            totalTimeMs += answerTime - startTime;
          }
        }

        await updateQuestionStats(questionId, {
          incrementTimesAsked: activePlayers.length,
          incrementTimesCorrect: correctCount,
          incrementTotalTimeMs: totalTimeMs,
        });
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

  // Detect when another player initiates a rematch (not for tournament battles)
  useEffect(() => {
    // Skip for tournament battles
    if (tournamentId) return;

    // Check if a rematch was initiated
    if (
      battle?.rematchBattleCode &&
      battle?.rematchInitiatedBy &&
      processedRematchCodeRef.current !== battle.rematchBattleCode
    ) {
      // Get current player's name
      const currentPlayer = playerKey ? battle[playerKey] : null;
      const currentPlayerName = currentPlayer?.name?.toLowerCase();
      const initiatorName = battle.rematchInitiatedBy.toLowerCase();

      // Only show invite if someone ELSE initiated the rematch
      if (currentPlayerName && initiatorName !== currentPlayerName) {
        // Find the initiator's emoji
        const initiatorPlayer = getActivePlayers(battle).find(
          ({ player }) => player.name.toLowerCase() === initiatorName
        );

        setRematchInviteData({
          code: battle.rematchBattleCode,
          initiatorName: battle.rematchInitiatedBy,
          initiatorEmoji: initiatorPlayer?.player.emoji,
        });
        setShowRematchInvite(true);
        processedRematchCodeRef.current = battle.rematchBattleCode;
      }
    }
  }, [battle?.rematchBattleCode, battle?.rematchInitiatedBy, playerKey, tournamentId, battle]);

  // Handle accepting rematch invite - must be before any early returns (hooks rule)
  const handleAcceptRematch = useCallback(async () => {
    if (!rematchInviteData?.code || !battle || !playerKey) return;

    // Get current player's info to use for joining
    const currentPlayer = battle[playerKey];
    if (!currentPlayer) return;

    setShowRematchInvite(false);

    // Actually join the rematch battle with our existing player info
    const { joinBattle } = useBattleStore.getState();
    const success = await joinBattle(rematchInviteData.code, {
      name: currentPlayer.name,
      emoji: currentPlayer.emoji,
    });

    if (success) {
      navigate(`/battle/${rematchInviteData.code}`);
    }
  }, [rematchInviteData, navigate, battle, playerKey]);

  // Handle declining rematch invite - must be before any early returns (hooks rule)
  const handleDeclineRematch = useCallback(() => {
    setShowRematchInvite(false);
    setRematchInviteData(null);
  }, []);

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

    // Pass the original battle code so other players get notified
    const code = await createRematch(
      { name: currentPlayer.name, emoji: currentPlayer.emoji },
      flashcards,
      battle.id
    );

    setIsCreatingRematch(false);

    if (code) {
      // Navigate immediately to the new lobby
      navigate(`/battle/${code}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-100 to-parchment-200">
      {/* Rematch Invite Modal */}
      {showRematchInvite && rematchInviteData && (
        <RematchInviteModal
          initiatorName={rematchInviteData.initiatorName}
          initiatorEmoji={rematchInviteData.initiatorEmoji}
          onAccept={handleAcceptRematch}
          onDecline={handleDeclineRematch}
        />
      )}

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
          ) : (
            <>
              <button
                onClick={handleRematch}
                disabled={isCreatingRematch || showRematchInvite}
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
          )}
        </motion.div>

        {/* Question Review Section */}
        <QuestionReview
          battle={battle}
          playerKey={playerKey}
          flashcards={flashcards}
        />

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
