import { TournamentPlayer } from '../../types/tournament';

interface TournamentLeaderboardProps {
  players: TournamentPlayer[];
  finalRankings?: string[];
  currentPlayerName?: string;
}

export default function TournamentLeaderboard({
  players,
  finalRankings,
  currentPlayerName,
}: TournamentLeaderboardProps) {
  // Only show ranked display when tournament is complete (finalRankings exists)
  const isComplete = !!finalRankings;

  // If we have final rankings, use those for ordering
  // Otherwise, just show players in their current order (no fake rankings)
  const displayPlayers = finalRankings
    ? finalRankings.map((name, index) => ({
        player: players.find((p) => p.name.toLowerCase() === name.toLowerCase()),
        rank: index + 1,
      }))
    : players.map((player) => ({
        player,
        rank: null, // No rank during active tournament
      }));

  const getRankEmoji = (rank: number | null) => {
    if (rank === null) return null;
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `${rank}th`;
    }
  };

  const getRankStyle = (rank: number | null, eliminated: boolean) => {
    // During active tournament (no rank), use status-based styling
    if (rank === null) {
      if (eliminated) {
        return 'bg-red-50 border-red-200';
      }
      return 'bg-white border-parchment-200';
    }

    // For final rankings, use medal styling
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-400';
      case 2:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-400';
      case 3:
        return 'bg-gradient-to-r from-amber-100 to-amber-200 border-amber-400';
      default:
        return 'bg-parchment-50 border-parchment-200';
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-charcoal-700 mb-3">
        {isComplete ? 'Final Standings' : 'Participants'}
      </h3>
      {displayPlayers.map(({ player, rank }) => {
        if (!player) return null;

        const isCurrentPlayer = currentPlayerName &&
          player.name.toLowerCase() === currentPlayerName.toLowerCase();

        return (
          <div
            key={player.name}
            className={`
              flex items-center justify-between p-3 rounded-lg border
              ${getRankStyle(rank, player.eliminated)}
              ${player.eliminated ? 'opacity-60' : ''}
              ${isCurrentPlayer ? 'ring-2 ring-brass-400' : ''}
            `}
          >
            <div className="flex items-center gap-3">
              {/* Show rank emoji only when tournament is complete */}
              {rank !== null ? (
                <span className="text-lg w-8 text-center">{getRankEmoji(rank)}</span>
              ) : (
                <span className="w-8 text-center">
                  {player.eliminated ? (
                    <span className="text-red-400 text-sm">✗</span>
                  ) : (
                    <span className="text-green-500 text-sm">●</span>
                  )}
                </span>
              )}
              <img
                src={player.emoji}
                alt={player.name}
                className="w-8 h-8 object-contain"
              />
              <span
                className={`font-medium ${
                  player.eliminated ? 'line-through text-charcoal-500' : 'text-charcoal-900'
                }`}
              >
                {player.name}
                {isCurrentPlayer && (
                  <span className="text-brass-600 text-sm ml-1">(You)</span>
                )}
              </span>
            </div>
            {player.eliminated && player.eliminatedInRound && (
              <span className="text-xs text-charcoal-400">
                Out in Round {player.eliminatedInRound}
              </span>
            )}
            {!player.eliminated && !isComplete && (
              <span className="text-xs text-green-600 font-medium">
                Still in
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
