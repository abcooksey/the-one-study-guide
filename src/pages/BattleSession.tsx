import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useBattleStore } from '../store/battleStore';
import { useAppStore } from '../store';
import Flashcard from '../components/Flashcard';
import ProgressBar from '../components/ProgressBar';
import ConfirmDialog from '../components/ConfirmDialog';
import { OpponentProgress } from '../components/battle';
import { AttemptStatus } from '../types';

export default function BattleSession() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();

  const [showAbandonDialog, setShowAbandonDialog] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const hasAutoFinished = useRef(false);

  const {
    battle,
    playerKey,
    getAttempts,
    getOpponent,
    canFinish,
    markAnswer,
    goToQuestion,
    finishBattle,
    leaveBattle,
  } = useBattleStore();

  const getFlashcardById = useAppStore((state) => state.getFlashcardById);

  const attempts = getAttempts();
  const opponent = getOpponent();
  const canComplete = canFinish();
  const currentPlayer = battle && playerKey ? battle[playerKey] : null;

  // Redirect if no battle or battle not active
  useEffect(() => {
    if (!battle) {
      navigate('/');
      return;
    }

    if (battle.status === 'completed') {
      navigate(`/battle/${code}/results`);
    }
  }, [battle, battle?.status, code, navigate]);

  // Auto-finish when all questions are answered
  useEffect(() => {
    if (canComplete && !hasAutoFinished.current && currentPlayer && !currentPlayer.finishedAt) {
      hasAutoFinished.current = true;
      finishBattle().then(() => {
        // Navigate to waiting page
        navigate(`/battle/${code}/waiting`);
      });
    }
  }, [canComplete, currentPlayer, finishBattle, code, navigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case ' ':
        case 'Enter':
          if (!isCardFlipped && currentAttempt?.status === 'unanswered') {
            e.preventDefault();
            setIsCardFlipped(true);
          }
          break;
        case 'c':
        case 'C':
          if (isCardFlipped && currentAttempt?.status === 'unanswered') {
            handleMarkCorrect();
          }
          break;
        case 'i':
        case 'I':
        case 'x':
        case 'X':
          if (isCardFlipped && currentAttempt?.status === 'unanswered') {
            handleMarkIncorrect();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCardFlipped, currentIndex, attempts]);

  if (!battle || !currentPlayer) {
    return null;
  }

  const currentAttempt = attempts[currentIndex];
  const currentFlashcard = currentAttempt
    ? getFlashcardById(currentAttempt.flashcardId)
    : null;

  const isFirstCard = currentIndex === 0;
  const isLastCard = currentIndex === attempts.length - 1;

  const unansweredIndices = attempts
    .map((a, i) => (a.status === 'unanswered' ? i : -1))
    .filter((i) => i !== -1);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsCardFlipped(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < attempts.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsCardFlipped(false);
    }
  };

  const handleGoToCard = (index: number) => {
    setCurrentIndex(index);
    setIsCardFlipped(false);
    goToQuestion(index);
  };

  const handleMarkCorrect = async () => {
    if (!currentAttempt) return;
    await markAnswer(currentAttempt.flashcardId, 'correct');
    // Auto-advance
    if (!isLastCard) {
      setTimeout(() => handleNext(), 300);
    }
  };

  const handleMarkIncorrect = async () => {
    if (!currentAttempt) return;
    await markAnswer(currentAttempt.flashcardId, 'incorrect');
    // Auto-advance
    if (!isLastCard) {
      setTimeout(() => handleNext(), 300);
    }
  };

  const handleAbandon = () => {
    leaveBattle();
    navigate('/');
  };

  // Convert battle attempts to session attempts format for ProgressBar
  const progressAttempts = attempts.map((a) => ({
    flashcardId: a.flashcardId,
    status: a.status as AttemptStatus,
    answeredAt: a.answeredAt,
  }));

  if (!currentFlashcard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-charcoal-600 mb-4">Flashcard not found</p>
          <Link to="/" className="btn-primary">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-100 to-parchment-200 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur border-b border-parchment-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setShowAbandonDialog(true)}
            className="btn-ghost text-sm"
          >
            .. Exit
          </button>

          <div className="text-center">
            <h1 className="font-serif font-bold text-charcoal-900">
              .. Battle Mode
            </h1>
          </div>

          <div className="text-sm font-medium text-charcoal-600">
            {unansweredIndices.length > 0
              ? `${unansweredIndices.length} left`
              : 'Finishing...'
            }
          </div>
        </div>
      </div>

      {/* Opponent Progress */}
      <div className="px-4 pt-4">
        <div className="max-w-4xl mx-auto">
          <OpponentProgress
            opponent={opponent}
            totalQuestions={attempts.length}
          />
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <ProgressBar
            attempts={progressAttempts}
            currentIndex={currentIndex}
            onGoToCard={handleGoToCard}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <Flashcard
          flashcard={currentFlashcard}
          isFlipped={isCardFlipped}
          onFlip={() => setIsCardFlipped(true)}
          status={currentAttempt?.status ?? 'unanswered'}
          onMarkCorrect={handleMarkCorrect}
          onMarkIncorrect={handleMarkIncorrect}
        />
      </div>

      {/* Navigation */}
      <div className="bg-white/80 backdrop-blur border-t border-parchment-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={isFirstCard}
              className="btn-secondary"
              aria-label="Previous question"
            >
              .. Previous
            </button>

            <div className="text-sm text-charcoal-500 hidden sm:block">
              Press <kbd className="px-1.5 py-0.5 bg-parchment-200 rounded text-xs">Space</kbd> to reveal
              {' . '}
              <kbd className="px-1.5 py-0.5 bg-parchment-200 rounded text-xs">C</kbd> correct
              {' . '}
              <kbd className="px-1.5 py-0.5 bg-parchment-200 rounded text-xs">X</kbd> incorrect
            </div>

            <div className="flex gap-2">
              {currentAttempt?.status === 'unanswered' && (
                <button
                  onClick={handleNext}
                  disabled={isLastCard}
                  className="btn-ghost"
                  aria-label="Skip question"
                >
                  Skip
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={isLastCard}
                className="btn-secondary"
                aria-label="Next question"
              >
                Next ..
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Abandon Dialog */}
      <ConfirmDialog
        isOpen={showAbandonDialog}
        title="Leave Battle?"
        message="If you leave, you'll forfeit this battle. Your opponent will win by default."
        confirmLabel="Leave Battle"
        cancelLabel="Continue"
        confirmVariant="danger"
        onConfirm={handleAbandon}
        onCancel={() => setShowAbandonDialog(false)}
      />

    </div>
  );
}
