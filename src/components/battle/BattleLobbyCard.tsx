import { motion } from 'framer-motion';
import { BattlePlayer } from '../../types/battle';

interface BattleLobbyCardProps {
  player: BattlePlayer | null;
  isCurrentPlayer: boolean;
  isWaiting?: boolean;
  onToggleReady?: () => void;
}

export default function BattleLobbyCard({
  player,
  isCurrentPlayer,
  isWaiting = false,
  onToggleReady,
}: BattleLobbyCardProps) {
  if (isWaiting || !player) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-parchment-100 border-2 border-dashed border-parchment-300 rounded-xl p-6 text-center"
      >
        <div className="text-4xl mb-3 animate-pulse">...</div>
        <p className="text-charcoal-500 font-medium">Waiting for opponent</p>
        <p className="text-charcoal-400 text-sm mt-1">
          Share the battle code with a friend
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        relative bg-white rounded-xl p-6 text-center
        border-2 transition-colors
        ${player.isReady
          ? 'border-green-400 bg-green-50'
          : 'border-parchment-300'
        }
      `}
    >
      {/* Ready badge */}
      {player.isReady && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full"
        >
          READY
        </motion.div>
      )}

      <img src={player.emoji} alt={player.name} className="w-20 h-20 object-contain mx-auto mb-3" />
      <h3 className="text-xl font-bold text-charcoal-900">{player.name}</h3>

      {isCurrentPlayer && (
        <p className="text-charcoal-400 text-sm mt-1">(You)</p>
      )}

      {/* Connection status */}
      <div className="flex items-center justify-center gap-2 mt-3 text-sm">
        <span
          className={`w-2 h-2 rounded-full ${
            player.isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-charcoal-500">
          {player.isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Ready button for current player */}
      {isCurrentPlayer && onToggleReady && (
        <button
          onClick={onToggleReady}
          className={`
            mt-4 w-full py-3 rounded-xl font-semibold transition-all
            ${player.isReady
              ? 'bg-parchment-200 text-charcoal-600 hover:bg-parchment-300'
              : 'bg-forest-600 text-white hover:bg-forest-700'
            }
          `}
        >
          {player.isReady ? 'Cancel Ready' : "I'm Ready!"}
        </button>
      )}
    </motion.div>
  );
}
