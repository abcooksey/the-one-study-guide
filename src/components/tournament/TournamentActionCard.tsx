import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tournament, TournamentMatch, TournamentPlayer } from '../../types/tournament';
import { getRoundName, getFanCounts, setRootingFor } from '../../lib/tournamentFirestore';

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

// Get active match for a player (if they're currently battling)
const getActiveMatchForPlayer = (tournament: Tournament, playerName: string): TournamentMatch | null => {
  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      if (match.status === 'active' && match.battleCode) {
        if (
          match.player1Name?.toLowerCase() === playerName.toLowerCase() ||
          match.player2Name?.toLowerCase() === playerName.toLowerCase()
        ) {
          return match;
        }
      }
    }
  }
  return null;
};

// Get any live match in the tournament
const getAnyLiveMatch = (tournament: Tournament): TournamentMatch | null => {
  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      if (match.status === 'active' && match.battleCode) {
        return match;
      }
    }
  }
  return null;
};

// Get all live matches count
const getLiveMatchCount = (tournament: Tournament): number => {
  let count = 0;
  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      if (match.status === 'active' && match.battleCode) {
        count++;
      }
    }
  }
  return count;
};

// Get upcoming match for a player
const getUpcomingMatchForPlayer = (tournament: Tournament, playerName: string): { match: TournamentMatch; roundName: string } | null => {
  const numRounds = tournament.rounds.length;
  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      if (match.status === 'pending') {
        if (
          match.player1Name?.toLowerCase() === playerName.toLowerCase() ||
          match.player2Name?.toLowerCase() === playerName.toLowerCase()
        ) {
          return { match, roundName: getRoundName(round.roundNumber, numRounds) };
        }
      }
    }
  }
  return null;
};

// Eliminated player card with "Pick Your Champion" feature
function EliminatedCard({
  tournament,
  currentPlayerName,
  placement,
}: {
  tournament: Tournament;
  currentPlayerName: string;
  placement: number;
}) {
  const [isPickingChampion, setIsPickingChampion] = useState(false);
  const [isSettingChampion, setIsSettingChampion] = useState(false);

  const currentPlayer = tournament.players.find(
    p => p.name.toLowerCase() === currentPlayerName.toLowerCase()
  );
  const myChampion = currentPlayer?.rootingFor;

  // Get remaining players (not eliminated)
  const remainingPlayers = tournament.players.filter(p => !p.eliminated);

  // Get fan counts for all remaining players
  const fanCounts = getFanCounts(tournament);

  // Check if my champion is currently in a live match
  const championMatch = myChampion ? getActiveMatchForPlayer(tournament, myChampion) : null;
  const championPlayer = myChampion
    ? tournament.players.find(p => p.name.toLowerCase() === myChampion.toLowerCase())
    : null;

  // Get any live match (for when no champion selected or champion not playing)
  const anyLiveMatch = getAnyLiveMatch(tournament);
  const liveMatchCount = getLiveMatchCount(tournament);

  // Get champion's upcoming match
  const championUpcoming = myChampion ? getUpcomingMatchForPlayer(tournament, myChampion) : null;

  // Count others rooting for my champion (excluding me)
  const othersRootingForMyChampion = myChampion
    ? Math.max(0, (fanCounts[myChampion] || 0) - 1)
    : 0;

  const placementText = placement === 2 ? '2nd' : placement === 3 ? '3rd' : `${placement}th`;

  const handlePickChampion = async (champion: TournamentPlayer) => {
    setIsSettingChampion(true);
    await setRootingFor(tournament.id, currentPlayerName, champion.name);
    setIsSettingChampion(false);
    setIsPickingChampion(false);
  };

  // Helper to get player by name
  const getPlayer = (name: string | null) =>
    name ? tournament.players.find(p => p.name.toLowerCase() === name.toLowerCase()) : null;

  // Render a match card for watching
  const renderMatchCard = (match: TournamentMatch, isChampionMatch: boolean) => {
    const player1 = getPlayer(match.player1Name);
    const player2 = getPlayer(match.player2Name);

    return (
      <a
        href={`/battle/${match.battleCode}/spectate?tournament=${tournament.id}`}
        className={`block rounded-xl p-4 transition-all ${
          isChampionMatch
            ? 'bg-green-50 border-2 border-green-300 hover:border-green-400'
            : 'bg-white border border-purple-200 hover:border-purple-300'
        }`}
      >
        {isChampionMatch && (
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-green-700 text-xs font-semibold uppercase tracking-wide">
              Your Champion is Live
            </span>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            {player1?.emoji && (
              <img src={player1.emoji} alt={player1.name} className="w-8 h-8 object-contain" />
            )}
            <span className="font-medium text-charcoal-800">{match.player1Name}</span>
          </div>
          <span className="text-charcoal-400 text-sm">vs</span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-charcoal-800">{match.player2Name}</span>
            {player2?.emoji && (
              <img src={player2.emoji} alt={player2.name} className="w-8 h-8 object-contain" />
            )}
          </div>
        </div>

        <div className={`text-center font-semibold py-2 px-4 rounded-lg ${
          isChampionMatch
            ? 'bg-green-600 text-white'
            : 'bg-purple-600 text-white'
        }`}>
          Watch Live
        </div>
      </a>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200 shadow-lg"
    >
      {/* Compact Header */}
      <div className="text-center mb-5">
        <div className="text-3xl mb-2">🍿</div>
        <h2 className="text-lg font-serif font-bold text-purple-800">
          You're a VIP Spectator
        </h2>
        <p className="text-charcoal-500 text-sm">
          You placed {placementText} in this tournament
        </p>
      </div>

      {/* Main Content Area */}
      {remainingPlayers.length > 0 && (
        <AnimatePresence mode="wait">
          {/* State 1: No champion selected, not picking */}
          {!myChampion && !isPickingChampion && (
            <motion.div
              key="no-champion"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Primary CTA: Pick Your Champion */}
              <button
                onClick={() => setIsPickingChampion(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-md"
              >
                Pick Your Champion
              </button>
              <p className="text-charcoal-500 text-sm text-center">
                Who do you think will win?
              </p>

              {/* Show live match if available */}
              {anyLiveMatch && (
                <div className="pt-4 border-t border-purple-200">
                  <p className="text-charcoal-600 text-sm mb-3 flex items-center justify-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    {liveMatchCount} match{liveMatchCount !== 1 ? 'es' : ''} live now
                  </p>
                  {renderMatchCard(anyLiveMatch, false)}
                </div>
              )}
            </motion.div>
          )}

          {/* State 2: Picking champion */}
          {isPickingChampion && (
            <motion.div
              key="picker"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <p className="text-purple-800 font-semibold text-center mb-4">
                Who are you rooting for?
              </p>
              <div className={`grid gap-3 mb-4 ${
                remainingPlayers.length <= 2 ? 'grid-cols-2' :
                remainingPlayers.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
              }`}>
                {remainingPlayers.map(player => (
                  <button
                    key={player.name}
                    onClick={() => handlePickChampion(player)}
                    disabled={isSettingChampion}
                    className="bg-white hover:bg-purple-50 border-2 border-purple-200 hover:border-purple-400 rounded-xl p-4 transition-all disabled:opacity-50 text-center"
                  >
                    <img
                      src={player.emoji}
                      alt={player.name}
                      className="w-12 h-12 mx-auto mb-2 object-contain"
                    />
                    <p className="font-semibold text-charcoal-800 text-sm truncate">
                      {player.name}
                    </p>
                    {fanCounts[player.name] > 0 && (
                      <p className="text-xs text-purple-600 mt-1">
                        📣 {fanCounts[player.name]}
                      </p>
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIsPickingChampion(false)}
                className="w-full py-2 text-charcoal-500 text-sm hover:text-charcoal-700 font-medium"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {/* State 3: Champion selected, champion is LIVE */}
          {myChampion && !isPickingChampion && championMatch && (
            <motion.div
              key="champion-live"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* Champion Card with Live Match */}
              <div className="bg-white rounded-xl p-5 border-2 border-green-400 shadow-sm">
                {/* Centered champion display */}
                <div className="text-center mb-4">
                  {/* Avatar with ring and live badge */}
                  <div className="relative inline-block mb-3">
                    {championPlayer && (
                      <div className="w-16 h-16 rounded-full ring-4 ring-green-400 ring-offset-2 overflow-hidden bg-green-50">
                        <img
                          src={championPlayer.emoji}
                          alt={myChampion}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    {/* Live badge */}
                    <span className="absolute -bottom-1 -right-1 flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                      </span>
                      LIVE
                    </span>
                  </div>

                  {/* Champion info */}
                  <p className="text-charcoal-500 text-sm">Your Champion</p>
                  <p className="font-bold text-charcoal-900 text-lg">{myChampion}</p>

                  {/* Social proof */}
                  {othersRootingForMyChampion > 0 && (
                    <p className="text-charcoal-400 text-sm mt-1">
                      {othersRootingForMyChampion} other{othersRootingForMyChampion !== 1 ? 's' : ''} cheering
                    </p>
                  )}
                </div>

                {/* Watch CTA */}
                <a
                  href={`/battle/${championMatch.battleCode}/spectate?tournament=${tournament.id}`}
                  className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors mb-3"
                >
                  Watch {myChampion}'s Match
                </a>

                {/* Change action */}
                <button
                  onClick={() => setIsPickingChampion(true)}
                  className="w-full text-charcoal-500 text-sm hover:text-charcoal-700 transition-colors"
                >
                  Change
                </button>
              </div>
            </motion.div>
          )}

          {/* State 4: Champion selected, NOT live */}
          {myChampion && !isPickingChampion && !championMatch && (
            <motion.div
              key="champion-idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              {/* Champion Card */}
              <div className="bg-white rounded-xl p-5 border border-purple-300 shadow-sm">
                {/* Centered champion display */}
                <div className="text-center">
                  {/* Avatar with ring and megaphone badge */}
                  <div className="relative inline-block mb-3">
                    {championPlayer && (
                      <div className="w-16 h-16 rounded-full ring-4 ring-purple-300 ring-offset-2 overflow-hidden bg-purple-50">
                        <img
                          src={championPlayer.emoji}
                          alt={myChampion}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    {/* Megaphone badge */}
                    <span className="absolute -bottom-1 -right-1 text-lg bg-white rounded-full p-0.5 shadow-sm">
                      📣
                    </span>
                  </div>

                  {/* Champion info */}
                  <p className="text-charcoal-500 text-sm">Your Champion</p>
                  <p className="font-bold text-charcoal-900 text-lg">{myChampion}</p>

                  {/* Social proof */}
                  {othersRootingForMyChampion > 0 && (
                    <p className="text-charcoal-400 text-sm mt-1">
                      {othersRootingForMyChampion} other{othersRootingForMyChampion !== 1 ? 's' : ''} cheering
                    </p>
                  )}

                  {/* Change action */}
                  <button
                    onClick={() => setIsPickingChampion(true)}
                    className="mt-3 text-purple-600 text-sm hover:text-purple-700 hover:underline transition-colors"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Show live matches or upcoming info */}
              <div className="pt-4 border-t border-purple-200">
                {anyLiveMatch ? (
                  <>
                    <p className="text-charcoal-600 text-sm mb-3 flex items-center justify-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      {liveMatchCount} match{liveMatchCount !== 1 ? 'es' : ''} live now
                    </p>
                    {renderMatchCard(anyLiveMatch, false)}
                  </>
                ) : championUpcoming ? (
                  <div className="text-center text-charcoal-600">
                    <p className="text-sm">
                      <span className="font-medium">{myChampion}</span> plays next in {championUpcoming.roundName}
                    </p>
                  </div>
                ) : (
                  <p className="text-center text-charcoal-500 text-sm">
                    Waiting for next round to start
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}

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
      <EliminatedCard
        tournament={tournament}
        currentPlayerName={currentPlayerName}
        placement={status.placement}
      />
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
