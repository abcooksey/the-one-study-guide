import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Tournament, TournamentPlayer } from '../../types/tournament';
import { getActiveTournaments, getCompletedTournaments, isTournamentPlayerActive } from '../../lib/tournamentFirestore';
import { useTournamentStore } from '../../store/tournamentStore';

interface RejoinModalProps {
  tournament: Tournament;
  onClose: () => void;
  onRejoinAsPlayer: (player: TournamentPlayer) => void;
  onJoinAsSpectator: () => void;
  onJoinAsNewPlayer: () => void;
}

function RejoinModal({ tournament, onClose, onRejoinAsPlayer, onJoinAsSpectator, onJoinAsNewPlayer }: RejoinModalProps) {
  const isWaiting = tournament.status === 'waiting_for_players';
  const spotsAvailable = tournament.maxPlayers - tournament.players.length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="font-serif font-bold text-xl text-charcoal-900 mb-2">
            {isWaiting ? 'Join Tournament' : 'Rejoin Tournament'}
          </h3>
          <p className="text-charcoal-600 text-sm mb-6">
            {tournament.name}
          </p>

          {/* Join as New Player - only for waiting_for_players */}
          {isWaiting && spotsAvailable > 0 && (
            <div className="mb-6">
              <button
                onClick={onJoinAsNewPlayer}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-brass-400 bg-brass-50 hover:bg-brass-100 transition-colors"
              >
                <span className="text-xl">⚔️</span>
                <div className="text-left">
                  <span className="font-semibold text-brass-800 block">Join as New Player</span>
                  <span className="text-xs text-brass-600">{spotsAvailable} spot{spotsAvailable !== 1 ? 's' : ''} available</span>
                </div>
              </button>
            </div>
          )}

          {/* Select Player - Rejoin as existing */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-charcoal-700 mb-3">
              {isWaiting ? 'Or rejoin as existing player:' : 'Select your player:'}
            </h4>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {tournament.players.map((player) => {
                const isActive = isTournamentPlayerActive(player);
                // Forfeited players can't rejoin, but naturally eliminated players can (as VIP spectators)
                const isDisabled = player.forfeited || isActive;
                const isEliminated = player.eliminated && !player.forfeited;

                return (
                  <button
                    key={player.name}
                    onClick={() => onRejoinAsPlayer(player)}
                    disabled={isDisabled}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                      isDisabled
                        ? 'border-charcoal-200 bg-charcoal-50 opacity-50 cursor-not-allowed'
                        : isEliminated
                          ? 'border-purple-200 bg-purple-50 hover:border-purple-400 hover:bg-purple-100'
                          : 'border-purple-200 bg-purple-50 hover:border-purple-400 hover:bg-purple-100'
                    }`}
                  >
                    <img
                      src={player.emoji}
                      alt={player.name}
                      className="w-8 h-8 object-contain"
                    />
                    <div className="text-left">
                      <span className="font-medium text-charcoal-800 text-sm block">
                        {player.name}
                      </span>
                      {player.forfeited && (
                        <span className="text-xs text-orange-600">Forfeited</span>
                      )}
                      {isEliminated && (
                        <span className="text-xs text-purple-600">VIP Spectator 🍿</span>
                      )}
                      {!player.eliminated && isActive && (
                        <span className="text-xs text-green-600">Online</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spectator Option */}
          <div className="border-t border-parchment-200 pt-4">
            <button
              onClick={onJoinAsSpectator}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-charcoal-200 bg-charcoal-50 hover:bg-charcoal-100 transition-colors"
            >
              <span className="text-xl">👁️</span>
              <span className="font-medium text-charcoal-700">Watch as Spectator</span>
            </button>
          </div>

          {/* Cancel */}
          <button
            onClick={onClose}
            className="mt-4 w-full text-center text-charcoal-500 hover:text-charcoal-700 text-sm"
          >
            Cancel
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function TournamentCard({
  tournament,
  onSelect
}: {
  tournament: Tournament;
  onSelect: () => void;
}) {
  const activePlayers = tournament.players.filter(p => !p.eliminated).length;
  const isWaiting = tournament.status === 'waiting_for_players';
  const spotsNeeded = tournament.maxPlayers - tournament.players.length;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-md active:scale-[0.99] ${
        isWaiting
          ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-white hover:border-amber-400'
          : 'border-purple-300 bg-gradient-to-br from-purple-50 to-white hover:border-purple-400'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-charcoal-900 truncate">{tournament.name}</h4>
          <div className="flex items-center gap-3 text-sm text-charcoal-600 mt-1">
            <span>{activePlayers}/{tournament.maxPlayers} players</span>
            {tournament.status === 'active' && (
              <span className="text-purple-600 font-medium">Round {tournament.currentRound}</span>
            )}
            {isWaiting && (
              <span className="text-amber-600 font-medium">Code: {tournament.id}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-3">
          {/* Status badge */}
          {isWaiting ? (
            <span className="text-xs px-2 py-1 rounded-full font-medium bg-amber-100 text-amber-700 flex items-center gap-1 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {spotsNeeded} spot{spotsNeeded !== 1 ? 's' : ''} left
            </span>
          ) : (
            <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700 whitespace-nowrap">
              Live
            </span>
          )}
          {/* Tap affordance chevron */}
          <span className="text-charcoal-400 text-lg">›</span>
        </div>
      </div>

      {/* Player avatars - overlapping */}
      <div className="flex items-center mt-3 -space-x-2">
        {tournament.players.slice(0, 5).map((player, idx) => (
          <img
            key={player.name}
            src={player.emoji}
            alt={player.name}
            title={player.name}
            className={`w-7 h-7 rounded-full border-2 border-white object-contain bg-parchment-100 ${
              player.eliminated ? 'opacity-50 grayscale' : ''
            }`}
            style={{ zIndex: 5 - idx }}
          />
        ))}
        {tournament.players.length > 5 && (
          <div className="w-7 h-7 rounded-full border-2 border-white bg-charcoal-100 flex items-center justify-center text-xs font-medium text-charcoal-600" style={{ zIndex: 0 }}>
            +{tournament.players.length - 5}
          </div>
        )}
      </div>
    </button>
  );
}

function CompactWinnerCard({
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

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <button
      onClick={onSelect}
      className="bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-200 rounded-xl p-3 text-center hover:shadow-md hover:border-yellow-400 transition-all active:scale-[0.98]"
    >
      {/* Winner avatar with trophy */}
      <div className="relative inline-block mb-2">
        {winnerPlayer ? (
          <img
            src={winnerPlayer.emoji}
            alt={winnerPlayer.name}
            className="w-14 h-14 rounded-full border-2 border-yellow-400 object-contain bg-white shadow-sm"
          />
        ) : (
          <div className="w-14 h-14 rounded-full border-2 border-yellow-400 bg-yellow-100 flex items-center justify-center text-2xl">
            👤
          </div>
        )}
        <span className="absolute -top-1 -right-1 text-base">🏆</span>
      </div>

      {/* Winner name */}
      <p className="font-bold text-charcoal-900 text-sm truncate">
        {tournament.winner}
      </p>

      {/* Contextual stats */}
      <p className="text-xs text-charcoal-600 mt-0.5">
        Won {tournament.players.length}-player bracket
      </p>

      {/* Timestamp */}
      <p className="text-xs text-charcoal-400 mt-1">
        {getRelativeTime(tournament.createdAt)}
      </p>

      {/* Participant avatars */}
      <div className="flex justify-center -space-x-2 mt-2">
        {tournament.players.slice(0, 4).map((player, idx) => (
          <img
            key={player.name}
            src={player.emoji}
            alt={player.name}
            title={player.name}
            className="w-6 h-6 rounded-full border-2 border-white object-contain bg-parchment-100"
            style={{ zIndex: 4 - idx }}
          />
        ))}
        {tournament.players.length > 4 && (
          <div className="w-6 h-6 rounded-full border-2 border-white bg-charcoal-100 flex items-center justify-center text-xs font-medium text-charcoal-600" style={{ zIndex: 0 }}>
            +{tournament.players.length - 4}
          </div>
        )}
      </div>
    </button>
  );
}

export default function ActiveTournaments() {
  const navigate = useNavigate();
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [completedTournaments, setCompletedTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const { loadTournament, loadTournamentAsSpectator } = useTournamentStore();

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      setError(null);
      try {
        const [active, completed] = await Promise.all([
          getActiveTournaments(),
          getCompletedTournaments(),
        ]);
        console.log('Fetched tournaments:', { active, completed });
        setActiveTournaments(active);
        setCompletedTournaments(completed);
      } catch (err) {
        console.error('Error fetching tournaments:', err);
        setError('Failed to load tournaments');
      }
      setLoading(false);
    };

    fetchTournaments();

    // Refresh every 30 seconds
    const interval = setInterval(fetchTournaments, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRejoinAsPlayer = async (player: TournamentPlayer) => {
    if (!selectedTournament) return;

    // Load the tournament with this player
    const success = await loadTournament(selectedTournament.id, player.name);
    if (success) {
      navigate(`/tournament/${selectedTournament.id}`);
    }
    setSelectedTournament(null);
  };

  const handleJoinAsSpectator = () => {
    if (!selectedTournament) return;
    navigate(`/tournament/${selectedTournament.id}?spectator=true`);
    setSelectedTournament(null);
  };

  const handleJoinAsNewPlayer = () => {
    if (!selectedTournament) return;
    // Navigate to tournament join flow with the tournament ID pre-filled
    navigate(`/tournament/${selectedTournament.id}`);
    setSelectedTournament(null);
  };

  const handleViewCompletedTournament = async (tournament: Tournament) => {
    // Load as spectator to view results
    await loadTournamentAsSpectator(tournament.id);
    navigate(`/tournament/${tournament.id}?spectator=true`);
  };

  if (loading) {
    return (
      <div className="mt-6 text-center text-charcoal-500 text-sm">
        Loading tournaments...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 text-center text-red-500 text-sm">
        {error}
      </div>
    );
  }

  // Don't show anything if no tournaments at all
  if (activeTournaments.length === 0 && completedTournaments.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Active Tournaments */}
      {activeTournaments.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-charcoal-700 mb-3 flex items-center gap-2">
            <span>🏆</span>
            Tournaments In Progress
          </h3>

          <div className="space-y-3">
            {activeTournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                onSelect={() => setSelectedTournament(tournament)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Winners - Compact horizontal layout */}
      {completedTournaments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-charcoal-700 flex items-center gap-2">
              <span>🎉</span>
              Recent Winners
            </h3>
            <Link
              to="/tournament/history"
              className="text-sm text-brass-600 hover:text-brass-700 font-medium"
            >
              See All →
            </Link>
          </div>

          {/* 3-across grid for compact winner cards */}
          <div className="grid grid-cols-3 gap-3">
            {completedTournaments.slice(0, 3).map((tournament) => (
              <CompactWinnerCard
                key={tournament.id}
                tournament={tournament}
                onSelect={() => handleViewCompletedTournament(tournament)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rejoin Modal - only for active/waiting tournaments */}
      {selectedTournament && selectedTournament.status !== 'completed' && (
        <RejoinModal
          tournament={selectedTournament}
          onClose={() => setSelectedTournament(null)}
          onRejoinAsPlayer={handleRejoinAsPlayer}
          onJoinAsSpectator={handleJoinAsSpectator}
          onJoinAsNewPlayer={handleJoinAsNewPlayer}
        />
      )}
    </div>
  );
}
