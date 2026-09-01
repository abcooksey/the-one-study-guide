import { Link } from 'react-router-dom';
import { TournamentMatch, TournamentPlayer } from '../../types/tournament';

interface TournamentMatchCardProps {
  match: TournamentMatch;
  currentPlayerName?: string;
  tournamentId?: string;
  players?: TournamentPlayer[];
}

export default function TournamentMatchCard({
  match,
  currentPlayerName,
  tournamentId,
  players = [],
}: TournamentMatchCardProps) {
  const isPlayerInMatch =
    currentPlayerName &&
    (match.player1Name?.toLowerCase() === currentPlayerName.toLowerCase() ||
      match.player2Name?.toLowerCase() === currentPlayerName.toLowerCase());

  const getPlayerEmoji = (name: string | null): string | undefined => {
    if (!name) return undefined;
    const player = players.find(p => p.name.toLowerCase() === name.toLowerCase());
    return player?.emoji;
  };

  const getStatusBadge = () => {
    switch (match.status) {
      case 'pending':
        if (!match.player1Name || !match.player2Name) {
          return (
            <span className="text-xs bg-charcoal-100 text-charcoal-500 px-2 py-0.5 rounded">
              Waiting
            </span>
          );
        }
        return (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
            Ready
          </span>
        );
      case 'active':
        return (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded animate-pulse">
            Live
          </span>
        );
      case 'completed':
        return (
          <span className="text-xs bg-charcoal-100 text-charcoal-600 px-2 py-0.5 rounded">
            Done
          </span>
        );
    }
  };

  const renderPlayer = (name: string | null, isWinner: boolean) => {
    const emoji = getPlayerEmoji(name);
    const isCurrentPlayer = name?.toLowerCase() === currentPlayerName?.toLowerCase();

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

    return (
      <div className="flex items-center gap-2">
        <div className={`
          w-7 h-7 rounded-full flex items-center justify-center overflow-hidden
          ${isWinner ? 'ring-2 ring-green-400 bg-green-50' : 'bg-parchment-100'}
          ${isCurrentPlayer && !isWinner ? 'ring-2 ring-brass-300 bg-brass-50' : ''}
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
            ${isWinner ? 'font-semibold text-green-700' : ''}
            ${match.winner && !isWinner ? 'text-charcoal-400 line-through' : 'text-charcoal-800'}
            ${isCurrentPlayer && !match.winner ? 'text-brass-700 font-medium' : ''}
          `}
        >
          {name}
          {isCurrentPlayer && <span className="text-xs ml-1 text-brass-500">(You)</span>}
        </span>
        {isWinner && <span className="text-green-600 text-sm">✓</span>}
      </div>
    );
  };

  return (
    <div
      className={`
        rounded-xl border p-3 transition-all
        ${match.status === 'active' ? 'border-green-300 bg-green-50/50' : 'border-parchment-200'}
        ${isPlayerInMatch && match.status === 'pending' ? 'bg-brass-50/50 border-brass-200' : ''}
        ${isPlayerInMatch && match.status === 'completed' ? 'bg-parchment-50/50' : ''}
        ${!isPlayerInMatch && match.status !== 'active' ? 'bg-white' : ''}
      `}
    >
      {/* Header row: Your Match label (left) + Status badge (right) */}
      <div className="flex items-center justify-between mb-2">
        {isPlayerInMatch ? (
          <span className="text-xs text-brass-600 font-semibold">
            ⚔️ Your Match
          </span>
        ) : (
          <span></span>
        )}
        {getStatusBadge()}
      </div>

      {/* Players */}
      <div className="space-y-2">
        {renderPlayer(match.player1Name, match.winner === match.player1Name)}
        <div className="text-xs text-charcoal-300 text-center font-medium">vs</div>
        {renderPlayer(match.player2Name, match.winner === match.player2Name)}
      </div>

      {/* Spectate link for active matches (non-participants only) */}
      {match.battleCode && match.status === 'active' && !isPlayerInMatch && (
        <Link
          to={`/battle/${match.battleCode}/spectate`}
          className="mt-2 block text-center text-xs text-brass-600 hover:text-brass-700 underline"
        >
          Watch live
        </Link>
      )}

      {/* Rejoin link for participants in active match */}
      {match.battleCode && match.status === 'active' && isPlayerInMatch && (
        <Link
          to={`/battle/${match.battleCode}?tournament=${tournamentId}&match=${match.matchId}`}
          className="mt-2 block text-center text-xs text-green-600 hover:text-green-700 font-medium"
        >
          Rejoin battle →
        </Link>
      )}
    </div>
  );
}
