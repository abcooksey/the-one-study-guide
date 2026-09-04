import { motion } from 'framer-motion';
import { Tournament, TournamentPlayer } from '../../types/tournament';

interface TournamentPodiumProps {
  tournament: Tournament;
}

const getMedalEmoji = (placement: number): string => {
  switch (placement) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return '';
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

export default function TournamentPodium({ tournament }: TournamentPodiumProps) {
  const rankings = buildRankings(tournament);

  // Get player data by name
  const getPlayer = (name: string): TournamentPlayer | undefined => {
    return tournament.players.find(p => p.name.toLowerCase() === name.toLowerCase());
  };

  // Podium data (top 3)
  const podiumPlayers = rankings.slice(0, 3).map((name, idx) => ({
    name,
    placement: idx + 1,
    player: getPlayer(name),
  }));

  // Handle edge cases
  if (podiumPlayers.length === 0) {
    return null;
  }

  // Single player - show champion card instead of podium
  if (podiumPlayers.length === 1) {
    const { name, player } = podiumPlayers[0];
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <motion.div
          animate={{ rotate: [0, -5, 5, -5, 0] }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-6xl mb-4"
        >
          🏆
        </motion.div>
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-yellow-400 shadow-lg ring-4 ring-yellow-300 ring-opacity-50 flex items-center justify-center mb-3">
          {player?.emoji ? (
            <img src={player.emoji} alt={name} className="w-14 h-14 object-contain" />
          ) : (
            <span className="text-3xl">👤</span>
          )}
        </div>
        <p className="font-bold text-yellow-800 text-xl">{name}</p>
        <p className="text-charcoal-500 text-sm">Tournament Champion</p>
      </motion.div>
    );
  }

  // Reorder for podium display: 2nd, 1st, 3rd
  const podiumOrder = [
    podiumPlayers[1], // 2nd place (left)
    podiumPlayers[0], // 1st place (center)
    podiumPlayers.length > 2 ? podiumPlayers[2] : null, // 3rd place (right) - may not exist
  ].filter(Boolean) as typeof podiumPlayers;

  const podiumHeights: Record<number, string> = {
    1: 'h-32',
    2: 'h-24',
    3: 'h-20',
  };

  // Animation delays for drum roll effect: 3rd → 2nd → 1st
  const getDelay = (displayIdx: number, placement: number): number => {
    // displayIdx 0 = 2nd place, 1 = 1st place, 2 = 3rd place
    if (placement === 3) return 0;      // 3rd appears first
    if (placement === 2) return 0.3;    // 2nd appears second
    return 0.6;                          // Champion appears last
  };

  return (
    <div className="flex items-end justify-center gap-2 sm:gap-4 px-4">
      {podiumOrder.map((entry, displayIdx) => {
        const { name, placement, player } = entry;
        const colors = getPlacementColors(placement);
        const height = podiumHeights[placement];
        const delay = getDelay(displayIdx, placement);

        return (
          <motion.div
            key={name}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: 'spring', stiffness: 200 }}
            className="flex flex-col items-center"
          >
            {/* Player avatar and name */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.2, type: 'spring' }}
              className="mb-2 text-center"
            >
              <div className={`
                w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-2 flex items-center justify-center
                bg-gradient-to-br ${colors.bg} border-2 ${colors.border} shadow-lg
                ${placement === 1 ? 'ring-4 ring-yellow-300 ring-opacity-50' : ''}
              `}>
                {player?.emoji ? (
                  <img src={player.emoji} alt={name} className="w-12 h-12 sm:w-14 sm:h-14 object-contain" />
                ) : (
                  <span className="text-2xl sm:text-3xl">👤</span>
                )}
              </div>
              <p className={`font-bold ${colors.text} text-sm sm:text-base truncate max-w-[80px] sm:max-w-[100px]`}>
                {name}
              </p>
            </motion.div>

            {/* Podium block */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: delay + 0.1, duration: 0.3 }}
              style={{ transformOrigin: 'bottom' }}
              className={`
                w-20 sm:w-28 ${height} rounded-t-lg
                bg-gradient-to-b ${colors.bg} border-2 ${colors.border} border-b-0
                flex flex-col items-center justify-center shadow-lg
              `}
            >
              <span className="text-3xl sm:text-4xl">{getMedalEmoji(placement)}</span>
              <span className={`font-bold ${colors.text} text-lg`}>
                {placement === 1 ? '1st' : placement === 2 ? '2nd' : '3rd'}
              </span>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
