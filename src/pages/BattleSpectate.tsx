import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { Battle, PlayerKey } from '../types/battle';
import {
  subscribeToBattle,
  joinAsSpectator,
  leaveAsSpectator,
  getActivePlayers,
  getSpectatorCount,
} from '../lib/battleFirestore';
import { OpponentProgress } from '../components/battle';
import SpectatorBadge from '../components/battle/SpectatorBadge';
import Flashcard from '../components/Flashcard';
import { Unsubscribe } from 'firebase/firestore';

export default function BattleSpectate() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();

  // Preserve tournament query params for navigation
  const queryString = searchParams.toString();
  const queryParams = queryString ? `?${queryString}` : '';

  const [battle, setBattle] = useState<Battle | null>(null);
  const [spectatorName, setSpectatorName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [selectedPlayerKey, setSelectedPlayerKey] = useState<PlayerKey | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const getFlashcardById = useAppStore((state) => state.getFlashcardById);

  // Subscribe to battle updates
  useEffect(() => {
    if (!code) return;

    let unsubscribe: Unsubscribe | null = null;

    const subscribe = () => {
      unsubscribe = subscribeToBattle(code, (updatedBattle) => {
        if (!updatedBattle) {
          // Battle no longer exists
          navigate('/');
          return;
        }
        setBattle(updatedBattle);

        // Auto-select first player if none selected
        if (!selectedPlayerKey && updatedBattle.player1) {
          setSelectedPlayerKey('player1');
        }

        // Navigate to results when battle completes
        if (updatedBattle.status === 'completed') {
          navigate(`/battle/${code}/results${queryParams}`);
        }
      });
    };

    subscribe();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [code, navigate, selectedPlayerKey]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (code && spectatorName && isJoined) {
        leaveAsSpectator(code, spectatorName);
      }
    };
  }, [code, spectatorName, isJoined]);

  const handleJoinAsSpectator = async () => {
    if (!code || !spectatorName.trim()) return;

    const success = await joinAsSpectator(code, spectatorName.trim());
    if (success) {
      setIsJoined(true);
    }
  };

  const handleLeaveSpectate = async () => {
    if (code && spectatorName) {
      await leaveAsSpectator(code, spectatorName);
    }
    navigate('/');
  };

  // Not yet joined - show name input
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-parchment-100 to-parchment-200 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full"
        >
          <h1 className="text-2xl font-serif font-bold text-charcoal-900 text-center mb-6">
            Watch Battle
          </h1>

          <p className="text-charcoal-600 text-center mb-6">
            Enter your name to spectate battle <span className="font-mono font-bold">{code}</span>
          </p>

          <div className="space-y-4">
            <input
              type="text"
              value={spectatorName}
              onChange={(e) => setSpectatorName(e.target.value)}
              placeholder="Your name"
              maxLength={20}
              className="w-full px-4 py-3 border border-parchment-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brass-500"
            />

            <button
              onClick={handleJoinAsSpectator}
              disabled={!spectatorName.trim()}
              className="w-full btn-brass btn-lg"
            >
              Start Watching
            </button>

            <Link
              to="/"
              className="block text-center text-charcoal-500 hover:text-charcoal-700 text-sm"
            >
              Cancel
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brass-600"></div>
      </div>
    );
  }

  const activePlayers = getActivePlayers(battle);
  const spectatorCount = getSpectatorCount(battle);
  const selectedPlayer = selectedPlayerKey ? battle[selectedPlayerKey] : null;

  // Get current flashcard for selected player
  const currentFlashcardId = selectedPlayer?.attempts[currentQuestionIndex]?.flashcardId;
  const currentFlashcard = currentFlashcardId ? getFlashcardById(currentFlashcardId) : null;
  const currentAttemptStatus = selectedPlayer?.attempts[currentQuestionIndex]?.status || 'unanswered';

  // Waiting states
  if (battle.status === 'waiting' || battle.status === 'ready') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-parchment-100 to-parchment-200">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur border-b border-parchment-200 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button onClick={handleLeaveSpectate} className="btn-ghost text-sm">
              Leave
            </button>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-bold text-charcoal-900">Spectating</h1>
              <SpectatorBadge count={spectatorCount} />
            </div>
            <div className="w-16" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <div className="text-4xl mb-4">
              {battle.status === 'waiting' ? '...' : '...'}
            </div>
            <h2 className="text-xl font-serif font-bold text-charcoal-900 mb-2">
              {battle.status === 'waiting' ? 'Waiting for Players' : 'Waiting to Start'}
            </h2>
            <p className="text-charcoal-600 mb-6">
              {activePlayers.length} player{activePlayers.length === 1 ? '' : 's'} in lobby
            </p>

            <div className="space-y-2">
              {activePlayers.map(({ key, player }) => (
                <div
                  key={key}
                  className="flex items-center justify-between bg-parchment-50 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{player.emoji}</span>
                    <span className="font-medium">{player.name}</span>
                  </div>
                  <span className={`text-sm ${player.isReady ? 'text-green-600' : 'text-charcoal-400'}`}>
                    {player.isReady ? 'Ready' : 'Not ready'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Countdown
  if (battle.status === 'countdown') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-parchment-100 to-parchment-200 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">...</div>
          <h2 className="text-2xl font-serif font-bold text-charcoal-900">
            Battle Starting...
          </h2>
        </motion.div>
      </div>
    );
  }

  // Active battle - show spectator view
  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-100 to-parchment-200 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur border-b border-parchment-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={handleLeaveSpectate} className="btn-ghost text-sm">
            Leave
          </button>
          <div className="flex items-center gap-2">
            <h1 className="font-serif font-bold text-charcoal-900">Spectating</h1>
            <SpectatorBadge count={spectatorCount} />
          </div>
          <div className="text-xs text-charcoal-500">
            Watching only
          </div>
        </div>
      </div>

      {/* Player selector tabs */}
      <div className="px-4 pt-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {activePlayers.map(({ key, player }) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedPlayerKey(key);
                  setCurrentQuestionIndex(player.currentQuestionIndex);
                  setIsCardFlipped(false);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedPlayerKey === key
                    ? 'bg-brass-500 text-white'
                    : 'bg-white text-charcoal-700 hover:bg-parchment-100'
                }`}
              >
                <span>{player.emoji}</span>
                <span className="font-medium">{player.name}</span>
                {player.finishedAt && (
                  <span className="text-xs opacity-75">Finished</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* All players progress */}
      <div className="px-4 pt-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activePlayers.map(({ key, player }) => (
              <div
                key={key}
                className={`transition-all ${
                  selectedPlayerKey === key ? 'ring-2 ring-brass-500 rounded-lg' : ''
                }`}
              >
                <OpponentProgress
                  opponent={player}
                  totalQuestions={battle.questionIds.length}
                  compact
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected player's current view */}
      {selectedPlayer && currentFlashcard && (
        <>
          {/* Progress indicator */}
          <div className="px-4 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-sm text-charcoal-600">
              <span>Question {currentQuestionIndex + 1} of {battle.questionIds.length}</span>
              <span className="text-charcoal-400">|</span>
              <span>
                {selectedPlayer.emoji} {selectedPlayer.name}
                {selectedPlayer.finishedAt ? ' (Finished)' : ''}
              </span>
            </div>
          </div>

          {/* Flashcard (read-only) */}
          <div className="flex-1 flex items-center justify-center px-4 pb-8">
            <div className="w-full max-w-lg">
              <Flashcard
                flashcard={currentFlashcard}
                isFlipped={isCardFlipped || currentAttemptStatus !== 'unanswered'}
                onFlip={() => setIsCardFlipped(true)}
                status={currentAttemptStatus}
                onMarkCorrect={() => {}} // No-op for spectators
                onMarkIncorrect={() => {}} // No-op for spectators
              />

              {/* Spectator note */}
              <div className="mt-4 text-center text-sm text-charcoal-500">
                Click card to reveal answer (spectator view only)
              </div>
            </div>
          </div>

          {/* Question navigation */}
          <div className="bg-white/80 backdrop-blur border-t border-parchment-200 px-4 py-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    if (currentQuestionIndex > 0) {
                      setCurrentQuestionIndex(currentQuestionIndex - 1);
                      setIsCardFlipped(false);
                    }
                  }}
                  disabled={currentQuestionIndex === 0}
                  className="btn-secondary"
                >
                  Previous
                </button>

                <button
                  onClick={() => {
                    setCurrentQuestionIndex(selectedPlayer.currentQuestionIndex);
                    setIsCardFlipped(false);
                  }}
                  className="btn-ghost text-sm"
                >
                  Follow Player
                </button>

                <button
                  onClick={() => {
                    if (currentQuestionIndex < battle.questionIds.length - 1) {
                      setCurrentQuestionIndex(currentQuestionIndex + 1);
                      setIsCardFlipped(false);
                    }
                  }}
                  disabled={currentQuestionIndex === battle.questionIds.length - 1}
                  className="btn-secondary"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
