import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TournamentMatch, TournamentPlayer } from '../../types/tournament';
import { useLiveMatchScores, PlayerScore } from '../../hooks/useLiveMatchScores';

interface TournamentMatchCardProps {
  match: TournamentMatch;
  currentPlayerName?: string;
  tournamentId?: string;
  players?: TournamentPlayer[];
  animationDelay?: number;
}

type CardStyleConfig = {
  cardStyle: string;
  badgeStyle: string;
  badgeText: string;
  showPulse?: boolean;
  showPing?: boolean;
};

export default function TournamentMatchCard({
  match,
  currentPlayerName,
  tournamentId,
  players = [],
  animationDelay = 0,
}: TournamentMatchCardProps) {
  const isPlayerInMatch =
    currentPlayerName &&
    (match.player1Name?.toLowerCase() === currentPlayerName.toLowerCase() ||
      match.player2Name?.toLowerCase() === currentPlayerName.toLowerCase());

  // Only show "Your Match" UI for active/pending matches, not completed ones
  const showYourMatchUI = isPlayerInMatch && match.status !== 'completed';

  // Subscribe to live scores for active matches
  const liveScores = useLiveMatchScores(match.battleCode, match.status === 'active');

  const getPlayerEmoji = (name: string | null): string | undefined => {
    if (!name) return undefined;
    const player = players.find(p => p.name.toLowerCase() === name.toLowerCase());
    return player?.emoji;
  };

  const getStatusConfig = (): CardStyleConfig => {
    switch (match.status) {
      case 'pending':
        if (!match.player1Name || !match.player2Name) {
          // Waiting for players (TBD)
          return {
            cardStyle: 'bg-parchment-50 border-dashed border-parchment-300 opacity-75',
            badgeStyle: 'bg-charcoal-100 text-charcoal-500',
            badgeText: 'Awaiting Players',
          };
        }
        // Both players joined, ready to start
        return {
          cardStyle: 'bg-amber-50 border-amber-300 shadow-md',
          badgeStyle: 'bg-amber-100 text-amber-700',
          badgeText: 'Ready',
          showPulse: true,
        };
      case 'active':
        return {
          cardStyle: 'bg-green-50 border-green-400 ring-2 ring-green-200',
          badgeStyle: 'bg-green-500 text-white',
          badgeText: 'LIVE',
          showPing: true,
        };
      case 'completed':
        return {
          cardStyle: 'bg-parchment-50 border-parchment-200',
          badgeStyle: 'bg-charcoal-100 text-charcoal-600',
          badgeText: 'Complete',
        };
      default:
        return {
          cardStyle: 'bg-white border-parchment-200',
          badgeStyle: 'bg-charcoal-100 text-charcoal-500',
          badgeText: '',
        };
    }
  };

  const statusConfig = getStatusConfig();

  const renderStatusBadge = () => {
    return (
      <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${statusConfig.badgeStyle}`}>
        {statusConfig.showPulse && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        )}
        {statusConfig.showPing && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
        )}
        {statusConfig.badgeText}
        {match.status === 'completed' && <span className="ml-0.5">✓</span>}
      </span>
    );
  };

  const getPlayerScore = (playerName: string | null): PlayerScore | null => {
    if (!playerName || !liveScores) return null;
    // Match by name (case insensitive)
    if (liveScores.player1?.name.toLowerCase() === playerName.toLowerCase()) {
      return liveScores.player1;
    }
    if (liveScores.player2?.name.toLowerCase() === playerName.toLowerCase()) {
      return liveScores.player2;
    }
    return null;
  };

  const renderLiveScore = (playerName: string | null) => {
    const score = getPlayerScore(playerName);
    if (!score || !match.status || match.status !== 'active') return null;

    const progressPercent = liveScores.totalQuestions > 0
      ? (score.answered / liveScores.totalQuestions) * 100
      : 0;

    // Determine if this player is in the lead
    const otherScore = playerName === match.player1Name
      ? getPlayerScore(match.player2Name)
      : getPlayerScore(match.player1Name);
    const isLeading = otherScore && score.correct > otherScore.correct;

    return (
      <div className="flex items-center gap-2 mt-1">
        <div className="flex-1 h-1.5 bg-parchment-200 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${isLeading ? 'bg-green-500' : 'bg-charcoal-300'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        {/* Crown for leader, runner for chaser */}
        <span className="text-sm w-5 text-center">{isLeading ? '👑' : '🏃'}</span>
        {score.finished && (
          <span className="text-xs bg-charcoal-100 text-charcoal-600 px-1.5 py-0.5 rounded">
            Done
          </span>
        )}
      </div>
    );
  };

  const renderPlayer = (name: string | null, isWinner: boolean) => {
    const emoji = getPlayerEmoji(name);
    const isCurrentPlayer = name?.toLowerCase() === currentPlayerName?.toLowerCase();
    const isLoser = match.winner && !isWinner && name;

    if (!name) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-charcoal-100 flex items-center justify-center">
            <span className="text-charcoal-400 text-xs">?</span>
          </div>
          <span className="text-charcoal-400 italic text-sm">TBD</span>
        </div>
      );
    }

    // Completed match - winner styling
    if (isWinner && match.status === 'completed') {
      return (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex flex-col"
        >
          <div className="flex items-center gap-2 bg-gradient-to-r from-forest-50 to-green-50 -mx-1 px-1 py-1 rounded-lg">
            <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-green-400 bg-green-50">
              {emoji ? (
                <img src={emoji} alt={name} className="w-5 h-5 object-contain" />
              ) : (
                <span className="text-sm">👤</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-green-700 truncate">
                {name}
              </span>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">
                👑 Winner
              </span>
            </div>
          </div>
        </motion.div>
      );
    }

    // Completed match - loser styling
    if (isLoser) {
      return (
        <div className="flex items-center gap-2 opacity-50">
          <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden bg-parchment-100 grayscale">
            {emoji ? (
              <img src={emoji} alt={name} className="w-5 h-5 object-contain" />
            ) : (
              <span className="text-sm">👤</span>
            )}
          </div>
          <span className="text-sm text-charcoal-400 line-through truncate">
            {name}
          </span>
        </div>
      );
    }

    // Active or pending match
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <div className={`
            w-7 h-7 rounded-full flex items-center justify-center overflow-hidden
            ${isCurrentPlayer ? 'ring-2 ring-brass-300 bg-brass-50' : 'bg-parchment-100'}
          `}>
            {emoji ? (
              <img src={emoji} alt={name} className="w-5 h-5 object-contain" />
            ) : (
              <span className="text-sm">👤</span>
            )}
          </div>
          <span
            className={`
              text-sm truncate
              ${isCurrentPlayer ? 'text-brass-700 font-medium' : 'text-charcoal-800'}
            `}
          >
            {name}
            {isCurrentPlayer && <span className="text-xs ml-1 text-brass-500">(You)</span>}
          </span>
        </div>
        {renderLiveScore(name)}
      </div>
    );
  };

  const renderSpectatorCount = () => {
    if (match.status !== 'active' || liveScores.spectatorCount === 0) return null;
    return (
      <span className="text-xs text-charcoal-400 flex items-center gap-1">
        <span>👁️</span>
        <span>{liveScores.spectatorCount} watching</span>
      </span>
    );
  };

  const cardContent = (
    <div
      className={`
        rounded-xl border p-3 transition-all
        ${statusConfig.cardStyle}
      `}
    >
      {/* Header row: Your Match label (left) + Status badge (right) */}
      <div className="flex items-center justify-between mb-2">
        {showYourMatchUI ? (
          <span className="text-xs font-bold text-brass-700 flex items-center gap-1 shimmer-badge">
            <span>⚔️</span>
            <span>YOUR MATCH</span>
          </span>
        ) : (
          renderSpectatorCount() || <span></span>
        )}
        {renderStatusBadge()}
      </div>

      {/* Players */}
      <div className="space-y-2">
        {renderPlayer(match.player1Name, match.winner === match.player1Name)}
        <div className="text-xs text-charcoal-300 text-center font-medium">vs</div>
        {renderPlayer(match.player2Name, match.winner === match.player2Name)}
      </div>

      {/* Watch Live button for active matches (non-participants only) */}
      {match.battleCode && match.status === 'active' && !isPlayerInMatch && (
        <Link
          to={`/battle/${match.battleCode}/spectate`}
          className="mt-3 flex items-center justify-center px-3 py-2 bg-white hover:bg-parchment-50 border border-brass-400 text-brass-700 rounded-lg text-sm font-medium transition-colors"
        >
          Watch Live
        </Link>
      )}

      {/* Rejoin link for participants in active match */}
      {match.battleCode && match.status === 'active' && isPlayerInMatch && (
        <Link
          to={`/battle/${match.battleCode}?tournament=${tournamentId}&match=${match.matchId}`}
          className="mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <span>⚡</span>
          Rejoin Battle
        </Link>
      )}
    </div>
  );

  // Wrap in animated glow for "Your Match" when pending or active (not completed)
  if (showYourMatchUI) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: animationDelay * 0.1, duration: 0.3 }}
      >
        <motion.div
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(196, 142, 66, 0)',
              '0 0 0 4px rgba(196, 142, 66, 0.3)',
              '0 0 0 0 rgba(196, 142, 66, 0)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="rounded-xl"
        >
          {cardContent}
        </motion.div>
      </motion.div>
    );
  }

  // Regular card with entrance animation
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay * 0.1, duration: 0.3 }}
    >
      {cardContent}
    </motion.div>
  );
}
