import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTournamentStore } from '../store/tournamentStore';
import { useBattleStore } from '../store/battleStore';
import { useAppStore } from '../store';
import { BracketView, TournamentLeaderboard, TournamentActionCard, CompletedTournamentView } from '../components/tournament';
import { BattleNameModal, BattleCodeDisplay, BattleCodeInput } from '../components/battle';
import { TournamentSize, TournamentMatch, CreateTournamentInput } from '../types/tournament';

import { Tournament } from '../types/tournament';

type LobbyMode = 'choose' | 'create' | 'join';

// Step cards explaining how tournaments work
function HowItWorks() {
  const steps = [
    {
      icon: '⚔️',
      title: 'Battle',
      description: 'Face off in a trivia duel',
      iconBg: 'bg-rose-100',
    },
    {
      icon: '🏃',
      title: 'Advance',
      description: 'Winners move to the next round',
      iconBg: 'bg-sky-100',
    },
    {
      icon: '👑',
      title: 'Victory',
      description: 'Last one standing is crowned',
      iconBg: 'bg-yellow-100',
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {steps.map((step, index) => (
        <motion.div
          key={step.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
          className="bg-white rounded-xl p-4 flex-1 shadow-sm border border-parchment-200
            flex items-center sm:flex-col sm:text-center gap-3 sm:gap-2"
        >
          <div className="hidden sm:block text-xs font-medium text-charcoal-400 uppercase tracking-wide mb-1">
            Step {index + 1}
          </div>
          <div className={`${step.iconBg} w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-2xl sm:text-3xl`}>
            {step.icon}
          </div>
          <div className="flex-1 sm:flex-none">
            <div className="font-semibold text-charcoal-800">
              <span className="sm:hidden text-charcoal-400 font-normal mr-1">{index + 1}.</span>
              {step.title}
            </div>
            <p className="text-sm text-charcoal-500">{step.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Forfeit confirmation modal
function ForfeitConfirmationModal({
  isOpen,
  isRegistration,
  onConfirm,
  onCancel,
  isLoading,
}: {
  isOpen: boolean;
  isRegistration: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center mb-4">
            <div className="text-4xl mb-3">
              {isRegistration ? '👋' : '🏳️'}
            </div>
            <h3 className="font-serif font-bold text-xl text-charcoal-900">
              {isRegistration ? 'Withdraw from Tournament?' : 'Forfeit & Leave?'}
            </h3>
          </div>

          <p className="text-charcoal-600 text-sm text-center mb-6">
            {isRegistration ? (
              <>
                Your spot will be given to another player.
                <span className="block mt-2 font-medium text-charcoal-800">
                  This cannot be undone.
                </span>
              </>
            ) : (
              <>
                You will forfeit any remaining matches and be marked as eliminated.
                <span className="block mt-2 font-medium text-charcoal-800">
                  This cannot be undone.
                </span>
              </>
            )}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-lg border border-charcoal-200 text-charcoal-700 font-medium hover:bg-charcoal-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Leaving...' : isRegistration ? 'Withdraw' : 'Forfeit & Leave'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Cancel tournament confirmation modal (host only)
function CancelConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  isLoading,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center mb-4">
            <div className="text-4xl mb-3">🚫</div>
            <h3 className="font-serif font-bold text-xl text-charcoal-900">
              Cancel Tournament?
            </h3>
          </div>

          <p className="text-charcoal-600 text-sm text-center mb-6">
            This will end the tournament for all players.
            <span className="block mt-2 font-medium text-charcoal-800">
              This cannot be undone.
            </span>
          </p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-lg border border-charcoal-200 text-charcoal-700 font-medium hover:bg-charcoal-50 transition-colors"
            >
              Keep Tournament
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Cancelling...' : 'Cancel Tournament'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Waiting for players banner
function WaitingBanner({ tournament }: { tournament: Tournament }) {
  const spotsNeeded = tournament.maxPlayers - tournament.players.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6"
    >
      <div className="flex items-center justify-center gap-3">
        <span className="text-2xl">⏳</span>
        <div className="text-center">
          <p className="font-medium text-amber-800">
            Waiting for {spotsNeeded} more player{spotsNeeded !== 1 ? 's' : ''} to join
          </p>
          <p className="text-sm text-amber-600 mt-1">
            Share code: <span className="font-mono font-bold">{tournament.id}</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Active tournament view with action card
function ActiveTournamentView({
  tournament,
  playerName,
  onStartMatch,
  onTakeBreak,
  onForfeit,
  isPlayerEliminated,
}: {
  tournament: Tournament;
  playerName: string;
  onStartMatch: (match: TournamentMatch) => void;
  onTakeBreak: () => void;
  onForfeit: () => void;
  isPlayerEliminated: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* YOUR NEXT ACTION - Most prominent element */}
      <TournamentActionCard
        tournament={tournament}
        currentPlayerName={playerName}
        onStartMatch={onStartMatch}
      />

      {/* How it works - collapsible */}
      <HowItWorks />

      {/* Bracket section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-parchment-50 px-4 py-3 text-center border-b border-parchment-200">
          <h3 className="text-lg font-serif font-bold text-charcoal-800 tracking-wide">
            🏆 Tournament Bracket
          </h3>
        </div>
        <div className="p-6">
          <BracketView
            tournament={tournament}
            currentPlayerName={playerName}
          />
        </div>
      </div>

      {/* Participants section */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <TournamentLeaderboard
          players={tournament.players}
          currentPlayerName={playerName}
          tournament={tournament}
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onTakeBreak}
          className="px-4 py-2 rounded-lg border border-charcoal-200 text-charcoal-600 text-sm font-medium hover:bg-charcoal-50 transition-colors"
        >
          Take a Break
        </button>
        {!isPlayerEliminated && (
          <button
            onClick={onForfeit}
            className="px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
          >
            Forfeit & Leave
          </button>
        )}
      </div>
    </div>
  );
}

// Spectator view - read-only tournament view
function SpectatorTournamentView({
  tournament,
  onLeave,
}: {
  tournament: Tournament;
  onLeave: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Spectator badge */}
      <div className="flex justify-center">
        <div className="bg-charcoal-100 text-charcoal-700 px-4 py-2 rounded-full flex items-center gap-2">
          <span className="text-xl">👁️</span>
          <span className="font-medium">Watching as Spectator</span>
        </div>
      </div>

      {/* Bracket section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-parchment-50 px-4 py-3 text-center border-b border-parchment-200">
          <h3 className="text-lg font-serif font-bold text-charcoal-800 tracking-wide">
            🏆 Tournament Bracket
          </h3>
        </div>
        <div className="p-6">
          <BracketView
            tournament={tournament}
            currentPlayerName={undefined}
          />
        </div>
      </div>

      {/* Participants section */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <TournamentLeaderboard
          players={tournament.players}
          currentPlayerName={undefined}
          tournament={tournament}
        />
      </div>

      {/* Leave button */}
      <div className="text-center">
        <button
          onClick={onLeave}
          className="btn-secondary"
        >
          Stop Watching
        </button>
      </div>
    </div>
  );
}

function getInitialLobbyMode(tournamentId: string | undefined, searchParams: URLSearchParams): LobbyMode {
  if (tournamentId) return 'join';
  const mode = searchParams.get('mode');
  if (mode === 'create') return 'create';
  if (mode === 'join') return 'join';
  return 'choose';
}

export default function TournamentLobby() {
  const navigate = useNavigate();
  const { id: tournamentId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const [lobbyMode, setLobbyMode] = useState<LobbyMode>(() =>
    getInitialLobbyMode(tournamentId, searchParams)
  );
  const [showNameModal, setShowNameModal] = useState(false);
  const [showForfeitModal, setShowForfeitModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [wasCancelled, setWasCancelled] = useState(false);
  const [pendingMode, setPendingMode] = useState<'create' | 'join'>('create');
  const [joinCode, setJoinCode] = useState(tournamentId || '');
  const [tournamentSize, setTournamentSize] = useState<TournamentSize>(4);

  const flashcards = useAppStore((state) => state.flashcards);
  const hasEnoughCards = flashcards.filter((f) => !f.flag).length >= 20;

  const {
    tournament,
    playerName,
    isSpectator,
    isLoading,
    error,
    createTournament,
    joinTournament,
    leaveTournament,
    forfeitTournament,
    cancelTournament,
    startTournament,
    loadTournament,
    loadTournamentAsSpectator,
    clearTournament,
    isHost,
    canStart,
    hasMatchesStarted,
    startHeartbeat,
    stopHeartbeat,
    setupBeforeUnload,
    cleanupBeforeUnload,
  } = useTournamentStore();

  const { createTournamentBattle, joinTournamentBattle } = useBattleStore();

  // Check if joining as spectator
  const isJoiningAsSpectator = searchParams.get('spectator') === 'true';

  // Track previous tournament to detect cancellation
  const [hadTournament, setHadTournament] = useState(false);

  useEffect(() => {
    if (tournament) {
      setHadTournament(true);
    } else if (hadTournament && tournamentId) {
      // Tournament was loaded but is now null - it was cancelled or deleted
      setWasCancelled(true);
    }
  }, [tournament, hadTournament, tournamentId]);

  // Load tournament if we have an ID in URL
  useEffect(() => {
    if (tournamentId && !tournament) {
      if (isJoiningAsSpectator) {
        loadTournamentAsSpectator(tournamentId);
      } else if (playerName) {
        loadTournament(tournamentId, playerName);
      }
    }
  }, [tournamentId, tournament, playerName, isJoiningAsSpectator, loadTournament, loadTournamentAsSpectator]);

  // Start heartbeat when tournament is active and user is a player
  useEffect(() => {
    if (tournament?.status === 'active' && playerName && !isSpectator) {
      startHeartbeat();
      setupBeforeUnload();

      return () => {
        stopHeartbeat();
        cleanupBeforeUnload();
      };
    }
  }, [tournament?.status, playerName, isSpectator, startHeartbeat, stopHeartbeat, setupBeforeUnload, cleanupBeforeUnload]);

  // Auto-navigate to battle when match becomes active
  useEffect(() => {
    if (!tournament || !playerName || tournament.status !== 'active') return;

    // Find the current player's active match
    for (const round of tournament.rounds) {
      for (const match of round.matches) {
        const isPlayer1 = match.player1Name?.toLowerCase() === playerName.toLowerCase();
        const isPlayer2 = match.player2Name?.toLowerCase() === playerName.toLowerCase();

        if ((isPlayer1 || isPlayer2) && match.status === 'active' && match.battleCode) {
          // This player has an active match - auto-navigate to it
          joinTournamentBattle(match.battleCode, playerName).then((success) => {
            if (success) {
              navigate(`/battle/${match.battleCode}?tournament=${tournament.id}&match=${match.matchId}`);
            }
          });
          return;
        }
      }
    }
  }, [tournament, playerName, navigate, joinTournamentBattle]);

  const handleCreateClick = () => {
    if (!hasEnoughCards) return;
    setPendingMode('create');
    setShowNameModal(true);
  };

  const handleJoinClick = () => {
    setLobbyMode('join');
  };

  const handleNameSubmit = async (player: { name: string; emoji: string }) => {
    setShowNameModal(false);

    if (pendingMode === 'create') {
      const input: CreateTournamentInput = {
        name: `${player.name}'s Tournament`,
        hostName: player.name,
        hostEmoji: player.emoji,
        maxPlayers: tournamentSize,
      };

      const id = await createTournament(input);
      if (id) {
        navigate(`/tournament/${id}`, { replace: true });
      }
    } else {
      const success = await joinTournament(joinCode, player.name, player.emoji);
      if (success) {
        navigate(`/tournament/${joinCode}`, { replace: true });
      }
    }
  };

  // Take a break - just navigate away, can come back
  const handleTakeBreak = () => {
    clearTournament();
    navigate('/');
  };

  // Forfeit - permanent, needs confirmation
  const handleForfeitConfirm = async () => {
    const success = await forfeitTournament();
    if (success) {
      setShowForfeitModal(false);
      navigate('/');
    }
  };

  // Cancel tournament - host only, during registration
  const handleCancelTournament = async () => {
    const success = await cancelTournament();
    if (success) {
      navigate('/');
    }
  };

  // Check if current player is eliminated
  const isPlayerEliminated = (): boolean => {
    if (!tournament || !playerName) return false;
    const player = tournament.players.find(
      p => p.name.toLowerCase() === playerName.toLowerCase()
    );
    return player?.eliminated || false;
  };

  const handleStartTournament = async () => {
    const success = await startTournament();
    if (success) {
      // Tournament is now active, will show bracket
    }
  };

  const handleStartMatch = async (match: TournamentMatch) => {
    if (!playerName || !tournament) return;

    // Get both players for this match
    const player1Data = tournament.players.find(
      (p) => p.name.toLowerCase() === match.player1Name?.toLowerCase()
    );
    const player2Data = tournament.players.find(
      (p) => p.name.toLowerCase() === match.player2Name?.toLowerCase()
    );

    if (!player1Data || !player2Data) return;

    // Check if battle already exists for this match
    if (match.battleCode) {
      // Battle exists - join it
      const success = await joinTournamentBattle(match.battleCode, playerName);

      if (success) {
        // Navigate directly to battle session (not lobby)
        navigate(`/battle/${match.battleCode}?tournament=${tournament.id}&match=${match.matchId}`);
      }
      return;
    }

    // No battle exists - create one with both players pre-configured
    const code = await createTournamentBattle(
      { name: player1Data.name, emoji: player1Data.emoji },
      { name: player2Data.name, emoji: player2Data.emoji },
      playerName,
      flashcards
    );

    if (code) {
      // Link battle to match and mark it as active
      await useTournamentStore.getState().createMatchBattle(match.matchId, code);
      // Navigate directly to battle session (not lobby)
      navigate(`/battle/${code}?tournament=${tournament.id}&match=${match.matchId}`);
    }
  };

  // Render lobby content based on state
  const renderContent = () => {
    // Tournament was cancelled
    if (wasCancelled) {
      return (
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 border border-parchment-200 shadow-lg text-center"
          >
            <div className="text-5xl mb-4">🚫</div>
            <h2 className="text-2xl font-serif font-bold text-charcoal-900 mb-3">
              Tournament Cancelled
            </h2>
            <p className="text-charcoal-600 mb-6">
              This tournament was cancelled by the host.
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-brass"
            >
              Return Home
            </button>
          </motion.div>
        </div>
      );
    }

    // If we have an active tournament
    if (tournament) {
      // Spectator mode - read-only view
      if (isSpectator) {
        // Show completed view for spectators too
        if (tournament.status === 'completed') {
          return (
            <div className="max-w-4xl mx-auto">
              <CompletedTournamentView
                tournament={tournament}
                playerName={undefined}
                onReturnHome={() => {
                  clearTournament();
                  navigate('/');
                }}
              />
            </div>
          );
        }

        return (
          <div className="max-w-4xl mx-auto">
            <SpectatorTournamentView
              tournament={tournament}
              onLeave={() => {
                clearTournament();
                navigate('/');
              }}
            />
          </div>
        );
      }

      return (
        <div className="max-w-4xl mx-auto">
          {/* Registration phase */}
          {tournament.status === 'registration' && (
            <>
              {/* Tournament code display */}
              <div className="mb-8">
                <BattleCodeDisplay code={tournament.id} />
              </div>

              {/* Players grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {tournament.players.map((player) => {
                  const isCurrentPlayer = player.name.toLowerCase() === playerName?.toLowerCase();
                  const isHostPlayer = player.name.toLowerCase() === tournament.hostName.toLowerCase();
                  return (
                    <motion.div
                      key={player.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative bg-white rounded-xl p-6 text-center border-2 border-parchment-300"
                    >
                      {/* Host badge */}
                      {isHostPlayer && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 bg-brass-500 text-white text-xs font-bold px-3 py-1 rounded-full"
                        >
                          HOST
                        </motion.div>
                      )}

                      <img
                        src={player.emoji}
                        alt={player.name}
                        className="w-20 h-20 object-contain mx-auto mb-3"
                      />
                      <h3 className="text-xl font-bold text-charcoal-900">{player.name}</h3>

                      {isCurrentPlayer && (
                        <p className="text-charcoal-400 text-sm mt-1">(You)</p>
                      )}

                      {/* Connection status */}
                      <div className="flex items-center justify-center gap-2 mt-3 text-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-charcoal-500">Connected</span>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Empty slots */}
                {Array.from({ length: tournament.maxPlayers - tournament.players.length }).map(
                  (_, i) => (
                    <motion.div
                      key={`empty-${i}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-parchment-100 border-2 border-dashed border-parchment-300 rounded-xl p-6 text-center"
                    >
                      <div className="text-4xl mb-3 opacity-30">👤</div>
                      <p className="text-charcoal-500 font-medium">Waiting for player</p>
                      <p className="text-charcoal-400 text-sm mt-1">
                        Share the tournament code
                      </p>
                    </motion.div>
                  )
                )}
              </div>

              {/* Status message */}
              <div className="text-center mb-6">
                {isHost() ? (
                  tournament.players.length >= 2 ? (
                    <p className="text-charcoal-600">
                      Ready to start! You can begin now or wait for more players.
                    </p>
                  ) : (
                    <p className="text-charcoal-600">
                      Waiting for players to join... (need at least 2)
                    </p>
                  )
                ) : (
                  <p className="text-charcoal-600">
                    Waiting for {tournament.hostName} to start the tournament...
                  </p>
                )}
              </div>

              {/* Start button (host only) */}
              {canStart() && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center mb-6"
                >
                  <button
                    onClick={handleStartTournament}
                    disabled={isLoading}
                    className="btn-brass btn-lg text-xl px-12 py-4"
                  >
                    {isLoading ? 'Starting...' : 'Start Tournament!'}
                  </button>
                </motion.div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleTakeBreak}
                  className="px-4 py-2 rounded-lg border border-charcoal-200 text-charcoal-600 text-sm font-medium hover:bg-charcoal-50 transition-colors"
                >
                  Take a Break
                </button>
                {isHost() ? (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    Cancel Tournament
                  </button>
                ) : (
                  <button
                    onClick={() => setShowForfeitModal(true)}
                    className="px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    Withdraw from Tournament
                  </button>
                )}
              </div>
            </>
          )}

          {/* Active tournament - show bracket */}
          {tournament.status === 'active' && playerName && (
            <ActiveTournamentView
              tournament={tournament}
              playerName={playerName}
              onStartMatch={handleStartMatch}
              onTakeBreak={handleTakeBreak}
              onForfeit={() => setShowForfeitModal(true)}
              isPlayerEliminated={isPlayerEliminated()}
            />
          )}

          {/* Waiting for players - show bracket with waiting banner */}
          {tournament.status === 'waiting_for_players' && playerName && (
            <div className="space-y-6">
              {/* Waiting banner */}
              <WaitingBanner tournament={tournament} />

              {/* Bracket section */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-parchment-50 px-4 py-3 text-center border-b border-parchment-200">
                  <h3 className="text-lg font-serif font-bold text-charcoal-800 tracking-wide">
                    🏆 Tournament Bracket
                  </h3>
                </div>
                <div className="p-6">
                  <BracketView
                    tournament={tournament}
                    currentPlayerName={playerName}
                  />
                </div>
              </div>

              {/* Participants section */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <TournamentLeaderboard
                  players={tournament.players}
                  currentPlayerName={playerName}
                  tournament={tournament}
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleTakeBreak}
                  className="px-4 py-2 rounded-lg border border-charcoal-200 text-charcoal-600 text-sm font-medium hover:bg-charcoal-50 transition-colors"
                >
                  Take a Break
                </button>
                {!isPlayerEliminated() && (
                  <button
                    onClick={() => setShowForfeitModal(true)}
                    className="px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    Forfeit & Leave
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Completed tournament - Celebration! */}
          {tournament.status === 'completed' && (
            <CompletedTournamentView
              tournament={tournament}
              playerName={playerName || undefined}
              onReturnHome={() => {
                clearTournament();
                navigate('/');
              }}
            />
          )}
        </div>
      );
    }

    // Choose mode (create or join)
    if (lobbyMode === 'choose') {
      return (
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <button
              onClick={handleCreateClick}
              disabled={!hasEnoughCards}
              className={`
                w-full p-6 rounded-xl text-left transition-all
                ${hasEnoughCards
                  ? 'bg-brass-600 hover:bg-brass-700 text-white'
                  : 'bg-parchment-200 text-parchment-400 cursor-not-allowed'
                }
              `}
            >
              <div className="text-2xl mb-2">Create Tournament</div>
              <p className="text-sm opacity-80">
                {hasEnoughCards
                  ? 'Start a bracket for 4, 8, or 16 players'
                  : 'Need at least 20 unflagged flashcards'}
              </p>
            </button>

            <button
              onClick={handleJoinClick}
              className="w-full p-6 rounded-xl text-left bg-white border-2 border-parchment-300 hover:border-brass-400 transition-all"
            >
              <div className="text-2xl mb-2 text-charcoal-900">Join Tournament</div>
              <p className="text-sm text-charcoal-500">
                Enter a tournament code
              </p>
            </button>
          </motion.div>
        </div>
      );
    }

    // Create mode - tournament configuration
    if (lobbyMode === 'create') {
      return (
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 border border-parchment-200 shadow-lg"
          >
            <h2 className="text-xl font-serif font-bold text-charcoal-900 text-center mb-6">
              Create Tournament
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Tournament Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([4, 8, 16] as TournamentSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => setTournamentSize(size)}
                      className={`
                        py-3 rounded-lg text-center transition-all
                        ${tournamentSize === size
                          ? 'bg-brass-500 text-white'
                          : 'bg-parchment-100 text-charcoal-700 hover:bg-parchment-200'
                        }
                      `}
                    >
                      <div className="text-xl font-bold">{size}</div>
                      <div className="text-xs opacity-75">players</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setPendingMode('create');
                  setShowNameModal(true);
                }}
                className="w-full btn-brass btn-lg"
              >
                Continue
              </button>

              <button
                onClick={() => navigate('/')}
                className="w-full text-center text-charcoal-500 hover:text-charcoal-700 text-sm"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    // Join mode
    if (lobbyMode === 'join') {
      return (
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 border border-parchment-200 shadow-lg"
          >
            <h2 className="text-xl font-serif font-bold text-charcoal-900 text-center mb-6">
              Enter Tournament Code
            </h2>

            <BattleCodeInput
              onSubmit={(code) => {
                setJoinCode(code);
                setPendingMode('join');
                setShowNameModal(true);
              }}
              isLoading={isLoading}
              error={error}
              buttonText="Join Tournament"
              loadingText="Joining..."
            />

            <button
              onClick={() => navigate('/')}
              className="mt-6 w-full text-center text-charcoal-500 hover:text-charcoal-700 text-sm"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      );
    }
  };

  // Get appropriate title based on tournament status
  const getHeaderTitle = () => {
    if (wasCancelled) return 'Tournament Cancelled';
    if (!tournament) return 'Tournament Mode';
    switch (tournament.status) {
      case 'registration':
        return 'Tournament Lobby';
      case 'waiting_for_players':
        return 'Waiting for Players';
      case 'active':
        return 'Tournament Bracket';
      case 'completed':
        return 'Tournament Results';
      default:
        return 'Tournament';
    }
  };

  const getSubtitle = () => {
    if (!tournament) return 'Compete in bracket-style elimination!';
    switch (tournament.status) {
      case 'registration':
        return `${tournament.players.length} player${tournament.players.length !== 1 ? 's' : ''} joined (${tournament.maxPlayers} max)`;
      case 'waiting_for_players':
        const spotsNeeded = tournament.maxPlayers - tournament.players.length;
        return `Waiting for ${spotsNeeded} more player${spotsNeeded !== 1 ? 's' : ''} to join`;
      case 'active':
        return `${tournament.players.filter(p => !p.eliminated).length} players remaining`;
      case 'completed':
        return `Winner: ${tournament.winner}`;
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-100 to-parchment-200">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur border-b border-parchment-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {tournament ? (
            <button
              onClick={handleTakeBreak}
              className="btn-ghost text-sm"
            >
              Take a Break
            </button>
          ) : (
            <div className="w-20" />
          )}
          <h1 className="font-serif font-bold text-charcoal-900 text-lg">
            {getHeaderTitle()}
          </h1>
          {/* Join code display in header */}
          {tournament && (tournament.status === 'active' || tournament.status === 'waiting_for_players') ? (
            <div className="flex items-center gap-1.5 bg-parchment-100 px-3 py-1.5 rounded-lg border border-parchment-300">
              <span className="text-xs text-charcoal-500">Code:</span>
              <span className="font-mono font-bold text-charcoal-800">{tournament.id}</span>
            </div>
          ) : (
            <div className="w-20" />
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-charcoal-900 mb-2">
            {getHeaderTitle()}
          </h1>
          <p className="text-charcoal-600">
            {getSubtitle()}
          </p>
        </div>

        {renderContent()}
      </div>

      {/* Name modal */}
      <BattleNameModal
        isOpen={showNameModal}
        onSubmit={handleNameSubmit}
        onCancel={() => setShowNameModal(false)}
      />

      {/* Forfeit confirmation modal */}
      <ForfeitConfirmationModal
        isOpen={showForfeitModal}
        isRegistration={tournament?.status === 'registration'}
        onConfirm={handleForfeitConfirm}
        onCancel={() => setShowForfeitModal(false)}
        isLoading={isLoading}
      />

      {/* Cancel tournament modal (host only, registration phase) */}
      <CancelConfirmationModal
        isOpen={showCancelModal}
        onConfirm={handleCancelTournament}
        onCancel={() => setShowCancelModal(false)}
        isLoading={isLoading}
      />
    </div>
  );
}
