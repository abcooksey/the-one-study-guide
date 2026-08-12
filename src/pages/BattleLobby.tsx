import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBattleStore } from '../store/battleStore';
import { useAppStore } from '../store';
import {
  BattleCodeDisplay,
  BattleCodeInput,
  BattleLobbyCard,
  BattleCountdown,
  BattleNameModal,
} from '../components/battle';
import { CreateBattlePlayerInput, PlayerKey } from '../types/battle';
import { getPlayerCount } from '../lib/battleFirestore';

type LobbyMode = 'choose' | 'create' | 'join';

// All possible player keys for iteration
const ALL_PLAYER_KEYS: PlayerKey[] = ['player1', 'player2', 'player3', 'player4'];

export default function BattleLobby() {
  const navigate = useNavigate();
  const { code: urlCode } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');

  // Determine initial mode based on URL
  const getInitialMode = (): LobbyMode => {
    if (urlCode) return 'join';
    if (modeParam === 'join') return 'join';
    return 'choose'; // 'create' mode will show modal instead
  };

  const [lobbyMode, setLobbyMode] = useState<LobbyMode>(getInitialMode());
  const [showNameModal, setShowNameModal] = useState(modeParam === 'create');
  const [pendingMode, setPendingMode] = useState<'create' | 'join'>(modeParam === 'create' ? 'create' : 'create');
  const [joinCode, setJoinCode] = useState(urlCode || '');

  const flashcards = useAppStore((state) => state.flashcards);

  const {
    battle,
    playerKey,
    isLoading,
    error,
    countdownSeconds,
    createBattle,
    joinBattle,
    setReady,
    startGame,
    canStartGame,
    leaveBattle,
  } = useBattleStore();

  // Check if we have enough flashcards
  const hasEnoughCards = flashcards.filter((f) => !f.flag).length >= 20;

  // Handle mode from URL param
  useEffect(() => {
    if (urlCode && !battle) {
      setLobbyMode('join');
      setJoinCode(urlCode);
    }
  }, [urlCode, battle]);

  // Handle cancel from name modal - go back to home if came from direct link
  const handleNameModalCancel = () => {
    setShowNameModal(false);
    if (modeParam) {
      // User came directly from Dashboard, go back home
      navigate('/');
    }
  };

  // Navigate to battle when it starts
  useEffect(() => {
    if (battle?.status === 'active') {
      navigate(`/battle/${battle.id}/play`);
    }
  }, [battle?.status, battle?.id, navigate]);

  // Handle create battle
  const handleCreateClick = () => {
    if (!hasEnoughCards) return;
    setPendingMode('create');
    setShowNameModal(true);
  };

  // Handle join battle
  const handleJoinClick = () => {
    setLobbyMode('join');
  };

  const handleJoinCodeSubmit = (code: string) => {
    setJoinCode(code);
    setPendingMode('join');
    setShowNameModal(true);
  };

  // Handle name modal submit
  const handleNameSubmit = async (player: CreateBattlePlayerInput) => {
    setShowNameModal(false);

    if (pendingMode === 'create') {
      const code = await createBattle(player, flashcards);
      if (code) {
        navigate(`/battle/${code}`, { replace: true });
      }
    } else {
      const success = await joinBattle(joinCode, player);
      if (success) {
        navigate(`/battle/${joinCode}`, { replace: true });
      }
    }
  };

  // Handle ready toggle
  const handleToggleReady = () => {
    if (!battle || !playerKey) return;
    const player = battle[playerKey];
    if (player) {
      setReady(!player.isReady);
    }
  };

  // Handle leave battle
  const handleLeaveBattle = () => {
    leaveBattle();
    navigate('/');
  };

  // Determine current player
  const currentPlayer = battle && playerKey ? battle[playerKey] : null;

  // Get player count
  const playerCount = battle ? getPlayerCount(battle) : 0;

  // Show countdown overlay
  const showCountdown = battle?.status === 'countdown';

  // Render lobby based on state
  const renderLobbyContent = () => {
    // If we have a battle, show the waiting room
    if (battle) {
      return (
        <div className="max-w-4xl mx-auto">
          {/* Battle code */}
          <div className="mb-8">
            <BattleCodeDisplay code={battle.id} />
          </div>

          {/* Players grid - always show 4 slots */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {ALL_PLAYER_KEYS.map((key) => {
              const player = battle[key];
              return (
                <BattleLobbyCard
                  key={key}
                  player={player}
                  isCurrentPlayer={playerKey === key}
                  isWaiting={!player}
                  onToggleReady={playerKey === key ? handleToggleReady : undefined}
                />
              );
            })}
          </div>

          {/* Status message */}
          <div className="text-center mb-6">
            {battle.status === 'waiting' && (
              <p className="text-charcoal-600">
                Waiting for players to join... ({playerCount} joined, need at least 2)
              </p>
            )}
            {battle.status === 'ready' && (
              <p className="text-charcoal-600">
                {!currentPlayer?.isReady
                  ? 'Click "I\'m Ready!" when you\'re set to begin!'
                  : canStartGame()
                    ? 'All players ready! Anyone can start the game.'
                    : `Waiting for players to ready up... (${playerCount} joined)`}
              </p>
            )}
          </div>

          {/* Start Game button - visible when all players are ready */}
          {canStartGame() && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center mb-6"
            >
              <button
                onClick={startGame}
                className="btn-brass btn-lg text-xl px-12 py-4"
              >
                Start Game!
              </button>
            </motion.div>
          )}

          {/* Leave button */}
          <div className="text-center">
            <button
              onClick={handleLeaveBattle}
              className="text-charcoal-500 hover:text-charcoal-700 text-sm underline"
            >
              Leave Battle
            </button>
          </div>
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
                  ? 'bg-forest-600 hover:bg-forest-700 text-white'
                  : 'bg-parchment-200 text-parchment-400 cursor-not-allowed'
                }
              `}
            >
              <div className="text-2xl mb-2">Create Battle</div>
              <p className="text-sm opacity-80">
                {hasEnoughCards
                  ? 'Start a battle for 2-4 players'
                  : 'Need at least 20 unflagged flashcards'}
              </p>
            </button>

            <button
              onClick={handleJoinClick}
              className="w-full p-6 rounded-xl text-left bg-white border-2 border-parchment-300 hover:border-forest-400 transition-all"
            >
              <div className="text-2xl mb-2 text-charcoal-900">Join Battle</div>
              <p className="text-sm text-charcoal-500">
                Enter a friend's battle code
              </p>
            </button>
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
              Enter Battle Code
            </h2>

            <BattleCodeInput
              onSubmit={handleJoinCodeSubmit}
              isLoading={isLoading}
              error={error}
            />

            <button
              onClick={() => modeParam ? navigate('/') : setLobbyMode('choose')}
              className="mt-6 w-full text-center text-charcoal-500 hover:text-charcoal-700 text-sm"
            >
              Back
            </button>
          </motion.div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-100 to-parchment-200">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur border-b border-parchment-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="btn-ghost text-sm">
            .. Exit
          </Link>
          <h1 className="font-serif font-bold text-charcoal-900 text-lg">
            .. Battle Mode
          </h1>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-charcoal-900 mb-2">
            {battle ? 'Battle Lobby' : 'Battle Mode'}
          </h1>
          <p className="text-charcoal-600">
            {battle
              ? `${playerCount} player${playerCount !== 1 ? 's' : ''} joined (2-4 players)`
              : 'Challenge friends to test your LOTR knowledge!'}
          </p>
        </div>

        {renderLobbyContent()}

        {/* Error display */}
        {error && !battle && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-center text-red-700"
          >
            {error}
          </motion.div>
        )}
      </div>

      {/* Name modal */}
      <BattleNameModal
        isOpen={showNameModal}
        mode={pendingMode}
        onSubmit={handleNameSubmit}
        onCancel={handleNameModalCancel}
      />

      {/* Countdown overlay */}
      <BattleCountdown seconds={countdownSeconds} isVisible={showCountdown} />
    </div>
  );
}
