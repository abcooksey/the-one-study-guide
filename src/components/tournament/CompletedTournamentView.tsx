import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Tournament } from '../../types/tournament';
import TournamentPodium from './TournamentPodium';
import TournamentLeaderboard from './TournamentLeaderboard';

interface CompletedTournamentViewProps {
  tournament: Tournament;
  playerName?: string;
  onReturnHome: () => void;
}

// Build rankings from finalRankings or derive from elimination order
function buildRankings(tournament: Tournament): string[] {
  if (tournament.finalRankings && tournament.finalRankings.length > 0) {
    return [...tournament.finalRankings];
  }

  // Fallback: build from winner and eliminated players
  const rankings: string[] = [];
  if (tournament.winner) {
    rankings.push(tournament.winner);
  }

  const eliminated = tournament.players
    .filter(p => p.eliminated && p.eliminatedInRound !== undefined)
    .sort((a, b) => (b.eliminatedInRound || 0) - (a.eliminatedInRound || 0))
    .map(p => p.name);

  rankings.push(...eliminated);
  return rankings;
}

const getOrdinalSuffix = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

const getPlacementMessage = (placement: number, totalPlayers: number): { title: string; subtitle: string; emoji: string } => {
  switch (placement) {
    case 1:
      return {
        title: 'Champion!',
        subtitle: 'You dominated the competition!',
        emoji: '🏆',
      };
    case 2:
      return {
        title: 'Runner-Up!',
        subtitle: 'So close to victory!',
        emoji: '🥈',
      };
    case 3:
      return {
        title: 'Bronze Finish!',
        subtitle: 'You made the podium!',
        emoji: '🥉',
      };
    case 4:
      return {
        title: '4th Place',
        subtitle: 'Just missed the podium!',
        emoji: '4️⃣',
      };
    default: {
      const totalRounds = Math.ceil(Math.log2(totalPlayers));
      const roundReached = Math.max(1, totalRounds - Math.floor(Math.log2(placement)));
      return {
        title: `${placement}${getOrdinalSuffix(placement)} Place`,
        subtitle: `You made it to Round ${roundReached}!`,
        emoji: '⭐',
      };
    }
  }
};

const getPlacementColors = (placement: number): { bg: string; border: string; text: string } => {
  switch (placement) {
    case 1:
      return { bg: 'from-yellow-100 to-yellow-200', border: 'border-yellow-400', text: 'text-yellow-800' };
    case 2:
      return { bg: 'from-gray-100 to-gray-200', border: 'border-gray-400', text: 'text-gray-700' };
    case 3:
      return { bg: 'from-amber-100 to-amber-200', border: 'border-amber-500', text: 'text-amber-800' };
    default:
      return { bg: 'from-parchment-50 to-parchment-100', border: 'border-parchment-300', text: 'text-charcoal-700' };
  }
};

export default function CompletedTournamentView({
  tournament,
  playerName,
  onReturnHome,
}: CompletedTournamentViewProps) {
  const confettiTriggered = useRef(false);
  const rankings = buildRankings(tournament);

  // Get current player's placement (1-indexed)
  const currentPlayerPlacement = playerName
    ? rankings.findIndex(name => name.toLowerCase() === playerName.toLowerCase()) + 1
    : 0;

  // Check if player is a participant
  const isParticipant = playerName && currentPlayerPlacement > 0;

  // Get current player data
  const currentPlayer = playerName
    ? tournament.players.find(p => p.name.toLowerCase() === playerName.toLowerCase())
    : undefined;

  // Check if current player forfeited
  const didForfeit = currentPlayer?.forfeited === true;

  // Fire confetti on mount (skip if player forfeited)
  useEffect(() => {
    if (confettiTriggered.current) return;
    if (didForfeit) return; // Don't celebrate for the player who forfeited
    confettiTriggered.current = true;

    const colors = ['#FFD700', '#FFA500', '#FF6347', '#87CEEB', '#98FB98', '#DDA0DD'];

    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
    });

    // Continuous streams from sides for 3 seconds
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, [didForfeit]);

  return (
    <div className="space-y-6">
      {/* Personalized Result Card - only for participants */}
      {isParticipant && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="max-w-md mx-auto"
        >
          {(() => {
            const message = getPlacementMessage(currentPlayerPlacement, tournament.players.length);
            const colors = getPlacementColors(currentPlayerPlacement);

            return (
              <div className={`
                bg-gradient-to-br ${colors.bg} rounded-2xl p-6 border-2 ${colors.border}
                text-center shadow-lg
              `}>
                <div className="flex items-center justify-center gap-3 mb-3">
                  {currentPlayer?.emoji && (
                    <img src={currentPlayer.emoji} alt="You" className="w-12 h-12 object-contain" />
                  )}
                  <div className="text-left">
                    <p className="text-sm text-charcoal-500">Your Result</p>
                    <p className={`text-2xl font-bold ${colors.text}`}>{message.title}</p>
                  </div>
                  <span className="text-4xl">{message.emoji}</span>
                </div>
                <p className="text-charcoal-600">{message.subtitle}</p>
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* Podium Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden"
      >
        <div className="bg-parchment-50 px-4 py-3 text-center border-b border-parchment-200">
          <h3 className="text-lg font-serif font-bold text-charcoal-800 tracking-wide">
            🏆 Final Results
          </h3>
        </div>
        <div className="p-6">
          <TournamentPodium tournament={tournament} />
        </div>
      </motion.div>

      {/* Enhanced Participants Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-white rounded-xl p-6 shadow-sm"
      >
        <TournamentLeaderboard
          players={tournament.players}
          finalRankings={rankings}
          currentPlayerName={playerName}
          showStats={true}
          tournament={tournament}
        />
      </motion.div>

      {/* Return Home Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center pt-4"
      >
        <button
          onClick={onReturnHome}
          className="btn-brass btn-lg"
        >
          Return Home
        </button>
      </motion.div>
    </div>
  );
}
