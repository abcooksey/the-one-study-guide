import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTournamentStore } from '../store/tournamentStore';
import { useBattleStore } from '../store/battleStore';
import { useAppStore } from '../store';
import { BracketView, TournamentLeaderboard, TournamentActionCard } from '../components/tournament';
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
          <div className={`${step.iconBg} w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-2xl sm:text-3xl`}>
            {step.icon}
          </div>
          <div className="flex-1 sm:flex-none">
            <div className="font-semibold text-charcoal-800">{step.title}</div>
            <p className="text-sm text-charcoal-500">{step.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Active tournament view with action card
function ActiveTournamentView({
  tournament,
  playerName,
  onStartMatch,
  onLeaveTournament,
}: {
  tournament: Tournament;
  playerName: string;
  onStartMatch: (match: TournamentMatch) => void;
  onLeaveTournament: () => void;
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
        />
      </div>

      {/* Leave button */}
      <div className="text-center">
        <button
          onClick={onLeaveTournament}
          className="text-charcoal-500 hover:text-charcoal-700 text-sm underline"
        >
          Leave Tournament
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
  const [pendingMode, setPendingMode] = useState<'create' | 'join'>('create');
  const [joinCode, setJoinCode] = useState(tournamentId || '');
  const [tournamentSize, setTournamentSize] = useState<TournamentSize>(4);

  const flashcards = useAppStore((state) => state.flashcards);
  const hasEnoughCards = flashcards.filter((f) => !f.flag).length >= 20;

  const {
    tournament,
    playerName,
    isLoading,
    error,
    createTournament,
    joinTournament,
    leaveTournament,
    startTournament,
    loadTournament,
    clearTournament,
    isHost,
    canStart,
  } = useTournamentStore();

  const { createTournamentBattle, joinTournamentBattle } = useBattleStore();

  // Load tournament if we have an ID in URL
  useEffect(() => {
    if (tournamentId && !tournament && playerName) {
      loadTournament(tournamentId, playerName);
    }
  }, [tournamentId, tournament, playerName, loadTournament]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Don't clear if navigating to battle
    };
  }, []);

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

  const handleLeaveTournament = async () => {
    await leaveTournament();
    clearTournament();
    navigate('/');
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
    // If we have an active tournament
    if (tournament) {
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

              {/* Leave button */}
              <div className="text-center">
                <button
                  onClick={handleLeaveTournament}
                  className="text-charcoal-500 hover:text-charcoal-700 text-sm underline"
                >
                  Leave Tournament
                </button>
              </div>
            </>
          )}

          {/* Active tournament - show bracket */}
          {tournament.status === 'active' && playerName && (
            <ActiveTournamentView
              tournament={tournament}
              playerName={playerName}
              onStartMatch={handleStartMatch}
              onLeaveTournament={handleLeaveTournament}
            />
          )}

          {/* Completed tournament */}
          {tournament.status === 'completed' && (
            <div className="space-y-8">
              {/* Winner announcement */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl p-8 border-2 border-yellow-400"
              >
                <div className="text-5xl mb-4">🏆</div>
                <h2 className="text-3xl font-serif font-bold text-yellow-800 mb-2">
                  {tournament.winner} Wins!
                </h2>
                <p className="text-yellow-700">Tournament Champion</p>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <BracketView
                    tournament={tournament}
                    currentPlayerName={playerName || undefined}
                  />
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <TournamentLeaderboard
                    players={tournament.players}
                    finalRankings={tournament.finalRankings}
                    currentPlayerName={playerName || undefined}
                  />
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => {
                    clearTournament();
                    navigate('/');
                  }}
                  className="btn-brass btn-lg"
                >
                  Return Home
                </button>
              </div>
            </div>
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
                Back
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
              Back
            </button>
          </motion.div>
        </div>
      );
    }
  };

  // Get appropriate title based on tournament status
  const getHeaderTitle = () => {
    if (!tournament) return 'Tournament Mode';
    switch (tournament.status) {
      case 'registration':
        return 'Tournament Lobby';
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
          <Link to="/" className="btn-ghost text-sm">
            Exit
          </Link>
          <h1 className="font-serif font-bold text-charcoal-900 text-lg">
            {getHeaderTitle()}
          </h1>
          <div className="w-16" />
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
    </div>
  );
}
