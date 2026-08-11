import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
import { CreateBattlePlayerInput } from '../types/battle';

type LobbyMode = 'choose' | 'create' | 'join';

export default function BattleLobby() {
  const navigate = useNavigate();
  const { code: urlCode } = useParams<{ code: string }>();

  const [lobbyMode, setLobbyMode] = useState<LobbyMode>(urlCode ? 'join' : 'choose');
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingMode, setPendingMode] = useState<'create' | 'join'>('create');
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

  // Determine current player and opponent
  const currentPlayer = battle && playerKey ? battle[playerKey] : null;
  const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
  const opponent = battle ? battle[opponentKey] : null;

  // Show countdown overlay
  const showCountdown = battle?.status === 'countdown';

  // Render lobby based on state
  const renderLobbyContent = () => {
    // If we have a battle, show the waiting room
    if (battle) {
      return (
        <div className="max-w-2xl mx-auto">
          {/* Battle code */}
          <div className="mb-8">
            <BattleCodeDisplay code={battle.id} />
          </div>

          {/* Players */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <BattleLobbyCard
              player={battle.player1}
              isCurrentPlayer={playerKey === 'player1'}
              onToggleReady={playerKey === 'player1' ? handleToggleReady : undefined}
            />
            <BattleLobbyCard
              player={battle.player2}
              isCurrentPlayer={playerKey === 'player2'}
              isWaiting={!battle.player2}
              onToggleReady={playerKey === 'player2' ? handleToggleReady : undefined}
            />
          </div>

          {/* Status message */}
          <div className="text-center mb-8">
            {battle.status === 'waiting' && (
              <p className="text-charcoal-600">
                Waiting for opponent to join...
              </p>
            )}
            {battle.status === 'ready' && (
              <p className="text-charcoal-600">
                {currentPlayer?.isReady
                  ? opponent?.isReady
                    ? 'Both players ready! Starting countdown...'
                    : 'Waiting for opponent to ready up...'
                  : 'Click "I\'m Ready!" when you\'re set to begin!'}
              </p>
            )}
          </div>

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
                  ? 'Generate a code and invite a friend'
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
              onClick={() => setLobbyMode('choose')}
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
              ? 'Waiting for the battle to begin...'
              : 'Challenge a friend to test your LOTR knowledge!'}
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
        onCancel={() => setShowNameModal(false)}
      />

      {/* Countdown overlay */}
      <BattleCountdown seconds={countdownSeconds} isVisible={showCountdown} />
    </div>
  );
}
