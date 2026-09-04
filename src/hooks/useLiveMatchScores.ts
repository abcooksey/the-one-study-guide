import { useState, useEffect } from 'react';
import { subscribeToBattle, getActivePlayers } from '../lib/battleFirestore';
import { Battle, BattlePlayer } from '../types/battle';

export interface PlayerScore {
  name: string;
  correct: number;
  answered: number;
  finished: boolean;
}

export interface LiveMatchScores {
  player1: PlayerScore | null;
  player2: PlayerScore | null;
  totalQuestions: number;
  isLoading: boolean;
  spectatorCount: number;
}

function calculatePlayerScore(player: BattlePlayer | null): PlayerScore | null {
  if (!player) return null;

  const attempts = player.attempts || [];
  const correct = attempts.filter(a => a.status === 'correct').length;
  const answered = attempts.filter(a => a.status !== 'unanswered').length;

  return {
    name: player.name,
    correct,
    answered,
    finished: !!player.finishedAt,
  };
}

/**
 * Hook to subscribe to real-time battle scores for a tournament match
 * @param battleCode - The battle code to subscribe to (undefined if match not active)
 * @param isActive - Whether the match is currently active
 */
export function useLiveMatchScores(
  battleCode: string | undefined,
  isActive: boolean
): LiveMatchScores {
  const [scores, setScores] = useState<LiveMatchScores>({
    player1: null,
    player2: null,
    totalQuestions: 0,
    isLoading: true,
    spectatorCount: 0,
  });

  useEffect(() => {
    // Only subscribe if match is active and has a battle code
    if (!isActive || !battleCode) {
      setScores({
        player1: null,
        player2: null,
        totalQuestions: 0,
        isLoading: false,
        spectatorCount: 0,
      });
      return;
    }

    setScores(prev => ({ ...prev, isLoading: true }));

    const unsubscribe = subscribeToBattle(battleCode, (battle: Battle | null) => {
      if (!battle) {
        setScores({
          player1: null,
          player2: null,
          totalQuestions: 0,
          isLoading: false,
          spectatorCount: 0,
        });
        return;
      }

      // Get the active players in the battle
      const activePlayers = getActivePlayers(battle);
      const p1 = activePlayers[0]?.player || null;
      const p2 = activePlayers[1]?.player || null;

      setScores({
        player1: calculatePlayerScore(p1),
        player2: calculatePlayerScore(p2),
        totalQuestions: battle.questionIds?.length || 20,
        isLoading: false,
        spectatorCount: battle.spectators?.length || 0,
      });
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [battleCode, isActive]);

  return scores;
}
