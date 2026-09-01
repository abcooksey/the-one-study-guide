import { motion } from 'framer-motion';
import { Tournament, TournamentMatch } from '../../types/tournament';
import { getRoundName } from '../../lib/tournamentFirestore';

interface TournamentActionCardProps {
  tournament: Tournament;
  currentPlayerName: string;
  onStartMatch: (match: TournamentMatch) => void;
}

type PlayerStatus =
  | { type: 'match_ready'; match: TournamentMatch; opponent: string; roundName: string }
  | { type: 'match_in_progress'; match: TournamentMatch; opponent: string; battleCode: string }
  | { type: 'waiting'; waitingFor: string[] }
  | { type: 'eliminated'; placement: number }
  | { type: 'champion' };

export default function TournamentActionCard({
  tournament,
  currentPlayerName,
  onStartMatch,
}: TournamentActionCardProps) {
  const numRounds = tournament.rounds.length;

  // Find the current player's status
  const getPlayerStatus = (): PlayerStatus => {
    const player = tournament.players.find(
      p => p.name.toLowerCase() === currentPlayerName.toLowerCase()
    );

    // Check if player is eliminated
    if (player?.eliminated) {
      const activePlayers = tournament.players.filter(p => !p.eliminated).length;
      const placement = activePlayers + 1; // Rough placement
      return { type: 'eliminated', placement };
    }

    // Check if player won
    if (tournament.winner?.toLowerCase() === currentPlayerName.toLowerCase()) {
      return { type: 'champion' };
    }

    // Find player's current match
    for (const round of tournament.rounds) {
      for (const match of round.matches) {
        const isPlayer1 = match.player1Name?.toLowerCase() === currentPlayerName.toLowerCase();
        const isPlayer2 = match.player2Name?.toLowerCase() === currentPlayerName.toLowerCase();

        if (isPlayer1 || isPlayer2) {
          const opponent = isPlayer1 ? match.player2Name : match.player1Name;

          // Match is ready to start
          if (match.status === 'pending' && match.player1Name && match.player2Name) {
            return {
              type: 'match_ready',
              match,
              opponent: opponent || 'Unknown',
              roundName: getRoundName(round.roundNumber, numRounds),
            };
          }

          // Match is in progress
          if (match.status === 'active' && match.battleCode) {
            return {
              type: 'match_in_progress',
              match,
              opponent: opponent || 'Unknown',
              battleCode: match.battleCode,
            };
          }

          // Match completed, player won - look for next match
          if (match.status === 'completed' && match.winner?.toLowerCase() === currentPlayerName.toLowerCase()) {
            continue; // Check next round
          }
        }
      }
    }

    // Player is waiting for earlier matches to complete
    const pendingMatches: string[] = [];
    for (const round of tournament.rounds) {
      for (const match of round.matches) {
        if (match.status === 'pending' && (!match.player1Name || !match.player2Name)) {
          // This match is waiting for players from previous round
          continue;
        }
        if (match.status === 'active' || (match.status === 'pending' && match.player1Name && match.player2Name)) {
          if (match.player1Name && match.player2Name) {
            pendingMatches.push(`${match.player1Name} vs ${match.player2Name}`);
          }
        }
      }
    }

    return { type: 'waiting', waitingFor: pendingMatches };
  };

  const status = getPlayerStatus();

  // Render based on status
  if (status.type === 'champion') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-yellow-100 via-yellow-200 to-amber-200 rounded-2xl p-8 border-2 border-yellow-400 shadow-xl text-center"
      >
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-3xl font-serif font-bold text-yellow-800 mb-2">
          You're the Champion!
        </h2>
        <p className="text-yellow-700 text-lg">
          Congratulations! You won the tournament!
        </p>
      </motion.div>
    );
  }

  if (status.type === 'eliminated') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-charcoal-50 to-charcoal-100 rounded-2xl p-6 border border-charcoal-200 shadow-lg text-center"
      >
        <div className="text-4xl mb-3">😔</div>
        <h2 className="text-xl font-serif font-bold text-charcoal-700 mb-2">
          You've Been Eliminated
        </h2>
        <p className="text-charcoal-500 mb-4">
          You finished in {status.placement === 2 ? '2nd' : status.placement === 3 ? '3rd' : `${status.placement}th`} place
        </p>
        <p className="text-charcoal-400 text-sm">
          You can still watch the remaining matches below!
        </p>
      </motion.div>
    );
  }

  if (status.type === 'match_in_progress') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-300 shadow-xl"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-green-700 font-semibold text-lg">MATCH IN PROGRESS</span>
        </div>

        <div className="text-center mb-6">
          <p className="text-charcoal-600 mb-1">You're playing against</p>
          <p className="text-2xl font-bold text-charcoal-900">{status.opponent}</p>
        </div>

        <a
          href={`/battle/${status.battleCode}?tournament=${tournament.id}&match=${status.match.matchId}`}
          className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-4 px-8 rounded-xl text-center transition-colors shadow-lg"
        >
          Rejoin Your Battle
        </a>
      </motion.div>
    );
  }

  if (status.type === 'match_ready') {
    // Get player emojis
    const currentPlayer = tournament.players.find(
      p => p.name.toLowerCase() === currentPlayerName.toLowerCase()
    );
    const opponentPlayer = tournament.players.find(
      p => p.name.toLowerCase() === status.opponent.toLowerCase()
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-parchment-200 overflow-hidden"
      >
        {/* Round label */}
        <div className="bg-parchment-50 px-4 py-3 text-center border-b border-parchment-200">
          <h3 className="text-lg font-serif font-bold text-charcoal-800 tracking-wide">
            ⚔️ {status.roundName}
          </h3>
        </div>

        {/* VS Matchup */}
        <div className="p-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* You */}
            <motion.div
              className="flex-1 text-center"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="bg-gradient-to-br from-brass-100 to-brass-50 w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center border-2 border-brass-300 shadow-md">
                {currentPlayer?.emoji ? (
                  <img src={currentPlayer.emoji} alt="You" className="w-14 h-14 object-contain" />
                ) : (
                  <span className="text-3xl">👤</span>
                )}
              </div>
              <p className="font-bold text-charcoal-800">You</p>
              <p className="text-xs text-charcoal-400">{currentPlayerName}</p>
            </motion.div>

            {/* VS Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              className="flex-shrink-0"
            >
              <div className="bg-gradient-to-br from-charcoal-800 to-charcoal-900 w-14 h-14 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">VS</span>
              </div>
            </motion.div>

            {/* Opponent */}
            <motion.div
              className="flex-1 text-center"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="bg-gradient-to-br from-rose-100 to-rose-50 w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center border-2 border-rose-300 shadow-md">
                {opponentPlayer?.emoji ? (
                  <img src={opponentPlayer.emoji} alt={status.opponent} className="w-14 h-14 object-contain" />
                ) : (
                  <span className="text-3xl">👤</span>
                )}
              </div>
              <p className="font-bold text-charcoal-800">{status.opponent}</p>
              <p className="text-xs text-charcoal-400">Opponent</p>
            </motion.div>
          </div>

          {/* Start Button */}
          <motion.button
            onClick={() => onStartMatch(status.match)}
            className="w-full bg-brass-600 hover:bg-brass-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            Start Match
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Waiting status
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-parchment-50 to-parchment-100 rounded-2xl p-6 border border-parchment-300 shadow-lg"
    >
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-2xl">⏳</span>
        <span className="text-charcoal-700 font-semibold text-lg">Waiting for Your Match</span>
      </div>

      <p className="text-charcoal-500 text-center mb-4">
        Your next match will be ready once these matches finish:
      </p>

      <div className="space-y-2">
        {status.waitingFor.slice(0, 3).map((matchup, i) => (
          <div key={i} className="bg-white/60 rounded-lg px-4 py-2 text-center text-charcoal-600">
            {matchup}
          </div>
        ))}
      </div>

      <p className="text-charcoal-400 text-sm text-center mt-4">
        You can watch the bracket progress below
      </p>
    </motion.div>
  );
}
