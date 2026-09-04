import { TournamentPlayer, Tournament } from '../../types/tournament';
import { getFanCounts } from '../../lib/tournamentFirestore';

interface TournamentLeaderboardProps {
  players: TournamentPlayer[];
  finalRankings?: string[];
  currentPlayerName?: string;
  showStats?: boolean;
  tournament?: Tournament;
}

// Calculate matches won/played for a player
function calculateMatchStats(
  playerName: string,
  tournament: Tournament
): { matchesWon: number; matchesPlayed: number } {
  let matchesWon = 0;
  let matchesPlayed = 0;

  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      const isPlayer1 = match.player1Name?.toLowerCase() === playerName.toLowerCase();
      const isPlayer2 = match.player2Name?.toLowerCase() === playerName.toLowerCase();

      if ((isPlayer1 || isPlayer2) && match.status === 'completed') {
        matchesPlayed++;
        if (match.winner?.toLowerCase() === playerName.toLowerCase()) {
          matchesWon++;
        }
      }
    }
  }

  return { matchesWon, matchesPlayed };
}

// Calculate current rankings during active tournament
function calculateCurrentRankings(
  players: TournamentPlayer[],
  tournament: Tournament
): { player: TournamentPlayer; rank: number; stats: { matchesWon: number; matchesPlayed: number } }[] {
  // Calculate stats for all players
  const playersWithStats = players.map(player => ({
    player,
    stats: calculateMatchStats(player.name, tournament),
  }));

  // Separate active and eliminated players
  const activePlayers = playersWithStats.filter(p => !p.player.eliminated);
  const eliminatedPlayers = playersWithStats.filter(p => p.player.eliminated);

  // Sort active players by wins (descending)
  activePlayers.sort((a, b) => b.stats.matchesWon - a.stats.matchesWon);

  // Sort eliminated players by elimination round (later = better, so descending)
  eliminatedPlayers.sort((a, b) =>
    (b.player.eliminatedInRound || 0) - (a.player.eliminatedInRound || 0)
  );

  // Combine: active players first, then eliminated
  const ranked = [...activePlayers, ...eliminatedPlayers];

  // Assign ranks
  return ranked.map((p, index) => ({
    ...p,
    rank: index + 1,
  }));
}

const getOrdinalSuffix = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

const getOrdinal = (n: number): string => {
  return `${n}${getOrdinalSuffix(n)}`;
};

export default function TournamentLeaderboard({
  players,
  finalRankings,
  currentPlayerName,
  showStats = false,
  tournament,
}: TournamentLeaderboardProps) {
  // Tournament is complete if finalRankings exists
  const isComplete = !!finalRankings;

  // Build display data
  let displayPlayers: {
    player: TournamentPlayer | undefined;
    rank: number;
    stats: { matchesWon: number; matchesPlayed: number } | null;
  }[];

  if (isComplete && finalRankings) {
    // Completed tournament: use final rankings
    displayPlayers = finalRankings.map((name, index) => {
      const player = players.find(p => p.name.toLowerCase() === name.toLowerCase());
      return {
        player,
        rank: index + 1,
        stats: tournament && player ? calculateMatchStats(player.name, tournament) : null,
      };
    });
  } else if (tournament) {
    // Active tournament: calculate current rankings
    displayPlayers = calculateCurrentRankings(players, tournament);
  } else {
    // Fallback: just list players without ranking
    displayPlayers = players.map((player, index) => ({
      player,
      rank: index + 1,
      stats: null,
    }));
  }

  // Check if any matches have been played yet
  const hasMatchesPlayed = displayPlayers.some(p => p.stats && p.stats.matchesPlayed > 0);

  // Get fan counts for remaining players
  const fanCounts = tournament ? getFanCounts(tournament) : {};

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  const getRankStyle = (rank: number, eliminated: boolean, isComplete: boolean) => {
    // During active tournament, use neutral styling
    if (!isComplete) {
      if (eliminated) {
        return 'bg-parchment-50 border-parchment-200';
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
        {isComplete ? 'Final Standings' : 'Current Standings'}
      </h3>
      {displayPlayers.map(({ player, rank, stats }) => {
        if (!player) return null;

        const isCurrentPlayer = currentPlayerName &&
          player.name.toLowerCase() === currentPlayerName.toLowerCase();

        return (
          <div
            key={player.name}
            className={`
              flex items-center justify-between p-3 rounded-lg border
              ${getRankStyle(rank, player.eliminated, isComplete)}
              ${player.eliminated && !isComplete ? 'opacity-70' : ''}
              ${isCurrentPlayer ? 'ring-2 ring-brass-400' : ''}
            `}
          >
            <div className="flex items-center gap-3">
              {/* Rank indicator */}
              <span className="text-lg w-8 text-center font-medium text-charcoal-500">
                {isComplete && getRankEmoji(rank) ? (
                  getRankEmoji(rank)
                ) : hasMatchesPlayed ? (
                  getOrdinal(rank)
                ) : (
                  '--'
                )}
              </span>

              {/* Player avatar */}
              <img
                src={player.emoji}
                alt={player.name}
                className="w-8 h-8 object-contain"
              />

              {/* Player info */}
              <div className="flex flex-col">
                <span className={`font-medium ${
                  player.eliminated && !isComplete ? 'text-charcoal-500' : 'text-charcoal-900'
                }`}>
                  {player.name}
                  {isCurrentPlayer && (
                    <span className="text-brass-600 text-sm ml-1">(You)</span>
                  )}
                </span>

                {/* Stats line */}
                <span className="text-xs text-charcoal-500">
                  {isComplete && rank === 1 ? (
                    <>
                      <span className="text-yellow-700 font-medium">Champion!</span>
                      {stats && ` · ${stats.matchesWon}/${stats.matchesPlayed} matches won`}
                    </>
                  ) : player.eliminated ? (
                    <>
                      {player.forfeited ? (
                        <span className="text-orange-600">Forfeited</span>
                      ) : (
                        <>Eliminated in Round {player.eliminatedInRound || '?'}</>
                      )}
                      {stats && ` · ${stats.matchesWon}/${stats.matchesPlayed} matches won`}
                    </>
                  ) : (
                    <>
                      <span className="text-green-600">Still competing</span>
                      {stats && ` · ${stats.matchesWon}/${stats.matchesPlayed} matches won`}
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Right side badge */}
            <div className="flex flex-col items-end gap-1">
              {isComplete && rank <= 3 && (
                <div className={`
                  px-2 py-1 rounded text-xs font-medium
                  ${rank === 1 ? 'bg-yellow-100 text-yellow-700' : ''}
                  ${rank === 2 ? 'bg-gray-100 text-gray-600' : ''}
                  ${rank === 3 ? 'bg-amber-100 text-amber-700' : ''}
                `}>
                  {getOrdinal(rank)}
                </div>
              )}
              {/* Fan count for active players */}
              {!isComplete && !player.eliminated && fanCounts[player.name] > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                  <span>📣</span>
                  <span>{fanCounts[player.name]} fan{fanCounts[player.name] !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
