import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tournament } from '../types/tournament';
import { getAllCompletedTournaments } from '../lib/tournamentFirestore';
import { useTournamentStore } from '../store/tournamentStore';

function CompletedTournamentCard({
  tournament,
  onSelect
}: {
  tournament: Tournament;
  onSelect: () => void;
}) {
  // Find the winner player data
  const winnerPlayer = tournament.players.find(
    p => p.name.toLowerCase() === tournament.winner?.toLowerCase()
  );

  // Get other participants (non-winners)
  const otherPlayers = tournament.players.filter(
    p => p.name.toLowerCase() !== tournament.winner?.toLowerCase()
  );

  // Format date
  const createdDate = new Date(tournament.createdAt);
  const formattedDate = createdDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: createdDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });

  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-4 rounded-lg border border-yellow-200 bg-gradient-to-br from-yellow-50 to-white hover:border-yellow-400 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-charcoal-900">{tournament.name}</h4>
          <p className="text-xs text-charcoal-500">
            Hosted by {tournament.hostName} · {formattedDate}
          </p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700">
          {tournament.players.length} players
        </span>
      </div>

      {/* Winner highlight */}
      <div className="flex items-center gap-3 mb-3 p-2 bg-yellow-100/50 rounded-lg">
        <div className="relative">
          {winnerPlayer && (
            <img
              src={winnerPlayer.emoji}
              alt={winnerPlayer.name}
              className="w-10 h-10 rounded-full border-2 border-yellow-400 object-contain bg-white"
            />
          )}
          <span className="absolute -top-1 -right-1 text-sm">🏆</span>
        </div>
        <div>
          <p className="text-xs text-yellow-700 font-medium">Winner</p>
          <p className="font-semibold text-charcoal-900">{tournament.winner}</p>
        </div>
      </div>

      {/* Other participants */}
      {otherPlayers.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-charcoal-500">Participants:</span>
          <div className="flex -space-x-2">
            {otherPlayers.slice(0, 5).map((player, idx) => (
              <img
                key={player.name}
                src={player.emoji}
                alt={player.name}
                title={player.name}
                className="w-6 h-6 rounded-full border-2 border-white object-contain bg-parchment-100"
                style={{ zIndex: 5 - idx }}
              />
            ))}
            {otherPlayers.length > 5 && (
              <div className="w-6 h-6 rounded-full border-2 border-white bg-charcoal-100 flex items-center justify-center text-xs font-medium text-charcoal-600">
                +{otherPlayers.length - 5}
              </div>
            )}
          </div>
        </div>
      )}
    </button>
  );
}

export default function TournamentHistory() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const { loadTournamentAsSpectator } = useTournamentStore();

  useEffect(() => {
    const loadTournaments = async () => {
      setLoading(true);
      const data = await getAllCompletedTournaments();
      setTournaments(data);
      setLoading(false);
    };
    loadTournaments();
  }, []);

  const handleViewTournament = async (tournament: Tournament) => {
    await loadTournamentAsSpectator(tournament.id);
    navigate(`/tournament/${tournament.id}?spectator=true`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-100 to-parchment-200">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur border-b border-parchment-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="text-charcoal-600 hover:text-charcoal-900 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="font-serif font-bold text-charcoal-900 text-lg flex items-center gap-2">
            <span>🏆</span>
            Tournament History
          </h1>
          <div className="w-6" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brass-600 mx-auto"></div>
            <p className="mt-4 text-charcoal-500">Loading tournament history...</p>
          </div>
        ) : tournaments.length === 0 ? (
          /* Fun empty state */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="mb-6">
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
                className="text-6xl mb-4 inline-block"
              >
                🏆
              </motion.div>
            </div>

            <h2 className="text-2xl font-serif font-bold text-charcoal-900 mb-3">
              No Tournament Champions Yet!
            </h2>

            <p className="text-charcoal-600 mb-2 max-w-md mx-auto">
              The arena awaits its first champion.
            </p>
            <p className="text-charcoal-500 text-sm mb-8 max-w-md mx-auto italic">
              "One does not simply walk into a tournament... they run." — Boromir, probably
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/"
                className="btn-brass inline-flex items-center justify-center gap-2"
              >
                <span>🏆</span>
                Create a Tournament
              </Link>
            </div>

            <div className="mt-12 pt-8 border-t border-parchment-200">
              <p className="text-xs text-charcoal-400">
                Completed tournaments will appear here
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-sm text-charcoal-600 mb-4">
              {tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''} completed
            </p>

            <div className="space-y-3">
              {tournaments.map((tournament, index) => (
                <motion.div
                  key={tournament.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <CompletedTournamentCard
                    tournament={tournament}
                    onSelect={() => handleViewTournament(tournament)}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
