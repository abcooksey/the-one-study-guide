import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store';
import Flashcard from '../components/Flashcard';
import ProgressBar from '../components/ProgressBar';
import ConfirmDialog from '../components/ConfirmDialog';
import FlagIssueModal from '../components/FlagIssueModal';
import EncouragementModal from '../components/EncouragementModal';
import { FlagReason } from '../types';

interface EncouragementData {
  milestone: 50 | 75;
  isDoingWell: boolean;
  accuracy: number;
}

export default function TriviaSession() {
  const navigate = useNavigate();
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);
  const [showUnansweredDialog, setShowUnansweredDialog] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [encouragementData, setEncouragementData] = useState<EncouragementData | null>(null);
  const shownMilestonesRef = useRef<Set<50 | 75>>(new Set());

  const currentSession = useAppStore((state) => state.currentSession);
  const currentCardIndex = useAppStore((state) => state.currentCardIndex);
  const isCardFlipped = useAppStore((state) => state.isCardFlipped);
  const getFlashcardById = useAppStore((state) => state.getFlashcardById);
  const getCurrentAttempt = useAppStore((state) => state.getCurrentAttempt);
  const getUnansweredIndices = useAppStore((state) => state.getUnansweredIndices);
  const canCompleteSession = useAppStore((state) => state.canCompleteSession);

  const flipCard = useAppStore((state) => state.flipCard);
  const goToCard = useAppStore((state) => state.goToCard);
  const goToNextCard = useAppStore((state) => state.goToNextCard);
  const goToPreviousCard = useAppStore((state) => state.goToPreviousCard);
  const markAnswer = useAppStore((state) => state.markAnswer);
  const completeSession = useAppStore((state) => state.completeSession);
  const abandonSession = useAppStore((state) => state.abandonSession);
  const flagFlashcard = useAppStore((state) => state.flagFlashcard);

  // Redirect if no session
  useEffect(() => {
    if (!currentSession) {
      navigate('/');
    }
  }, [currentSession, navigate]);

  // Redirect if session complete
  useEffect(() => {
    if (currentSession?.isComplete) {
      navigate('/results');
    }
  }, [currentSession?.isComplete, navigate]);

  // Track milestones and show encouragement modal
  useEffect(() => {
    if (!currentSession) return;

    const attempts = currentSession.attempts;
    const answered = attempts.filter((a) => a.status !== 'unanswered').length;
    const correct = attempts.filter((a) => a.status === 'correct').length;

    // Check for 50% milestone (10 out of 20)
    if (answered === 10 && !shownMilestonesRef.current.has(50)) {
      const accuracy = (correct / 10) * 100;
      setEncouragementData({
        milestone: 50,
        isDoingWell: accuracy >= 70,
        accuracy,
      });
      shownMilestonesRef.current.add(50);
    }

    // Check for 75% milestone (15 out of 20)
    if (answered === 15 && !shownMilestonesRef.current.has(75)) {
      const accuracy = (correct / 15) * 100;
      setEncouragementData({
        milestone: 75,
        isDoingWell: accuracy >= 70,
        accuracy,
      });
      shownMilestonesRef.current.add(75);
    }
  }, [currentSession?.attempts]);

  if (!currentSession) {
    return null;
  }

  const currentAttempt = getCurrentAttempt();
  const currentFlashcardId = currentSession.attempts[currentCardIndex]?.flashcardId;
  const currentFlashcard = currentFlashcardId
    ? getFlashcardById(currentFlashcardId)
    : null;

  const unansweredIndices = getUnansweredIndices();
  const canComplete = canCompleteSession();

  const isFirstCard = currentCardIndex === 0;
  const isLastCard = currentCardIndex === currentSession.attempts.length - 1;

  const handleFinish = () => {
    if (canComplete) {
      completeSession();
      navigate('/results');
    } else {
      setShowUnansweredDialog(true);
    }
  };

  const handleGoToFirstUnanswered = () => {
    if (unansweredIndices.length > 0) {
      goToCard(unansweredIndices[0]);
    }
    setShowUnansweredDialog(false);
  };

  const handleAbandon = () => {
    abandonSession();
    navigate('/');
  };

  const handleMarkCorrect = () => {
    markAnswer('correct');
    // Auto-advance to next card after marking
    if (!isLastCard) {
      setTimeout(() => goToNextCard(), 300);
    }
  };

  const handleMarkIncorrect = () => {
    markAnswer('incorrect');
    // Auto-advance to next card after marking
    if (!isLastCard) {
      setTimeout(() => goToNextCard(), 300);
    }
  };

  const handleFlagQuestion = () => {
    setShowFlagModal(true);
  };

  const handleFlagSubmit = (reason: FlagReason, description?: string) => {
    if (!currentFlashcard || !currentSession) return;
    flagFlashcard(currentFlashcard.id, reason, description, currentSession.profile);
    setShowFlagModal(false);
    // Auto-advance to next card after flagging
    if (!isLastCard) {
      setTimeout(() => goToNextCard(), 300);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          goToPreviousCard();
          break;
        case 'ArrowRight':
          goToNextCard();
          break;
        case ' ':
        case 'Enter':
          if (!isCardFlipped && currentAttempt?.status === 'unanswered') {
            e.preventDefault();
            flipCard();
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
  }, [isCardFlipped, currentAttempt, goToNextCard, goToPreviousCard, flipCard]);

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
            ← Exit
          </button>

          <div className="text-center">
            <h1 className="font-serif font-bold text-charcoal-900">
              {currentSession.profile === 'Alex' && '👑 '}
              {currentSession.profile === 'Angus' && '⚔️ '}
              {currentSession.profile === 'Guest' && '🧙 '}
              {currentSession.profile}'s Round
            </h1>
          </div>

          <button
            onClick={handleFinish}
            className={`btn-sm ${
              canComplete ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            {canComplete ? 'Finish' : `${unansweredIndices.length} left`}
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 py-4 sm:py-6">
        <div className="max-w-4xl mx-auto">
          <ProgressBar
            attempts={currentSession.attempts}
            currentIndex={currentCardIndex}
            onGoToCard={goToCard}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <Flashcard
          flashcard={currentFlashcard}
          isFlipped={isCardFlipped}
          onFlip={flipCard}
          status={currentAttempt?.status ?? 'unanswered'}
          onMarkCorrect={handleMarkCorrect}
          onMarkIncorrect={handleMarkIncorrect}
          onFlag={handleFlagQuestion}
        />
      </div>

      {/* Navigation */}
      <div className="bg-white/80 backdrop-blur border-t border-parchment-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousCard}
              disabled={isFirstCard}
              className="btn-secondary"
              aria-label="Previous question"
            >
              ← Previous
            </button>

            <div className="text-sm text-charcoal-500 hidden sm:block">
              Press <kbd className="px-1.5 py-0.5 bg-parchment-200 rounded text-xs">Space</kbd> to reveal
              {' • '}
              <kbd className="px-1.5 py-0.5 bg-parchment-200 rounded text-xs">C</kbd> correct
              {' • '}
              <kbd className="px-1.5 py-0.5 bg-parchment-200 rounded text-xs">X</kbd> incorrect
            </div>

            <div className="flex gap-2">
              {currentAttempt?.status === 'unanswered' && (
                <button
                  onClick={goToNextCard}
                  disabled={isLastCard}
                  className="btn-ghost"
                  aria-label="Skip question"
                >
                  Skip
                </button>
              )}
              <button
                onClick={goToNextCard}
                disabled={isLastCard}
                className="btn-secondary"
                aria-label="Next question"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Abandon Dialog */}
      <ConfirmDialog
        isOpen={showAbandonDialog}
        title="Exit Session?"
        message="Your progress in this session will be lost. You can start a new session anytime."
        confirmLabel="Exit Session"
        cancelLabel="Continue"
        confirmVariant="danger"
        onConfirm={handleAbandon}
        onCancel={() => setShowAbandonDialog(false)}
      />

      {/* Unanswered Dialog */}
      <ConfirmDialog
        isOpen={showUnansweredDialog}
        title="Unanswered Questions"
        message={
          <div>
            <p className="mb-2">
              You have {unansweredIndices.length} unanswered question
              {unansweredIndices.length !== 1 ? 's' : ''}.
            </p>
            <p className="text-sm text-charcoal-500">
              You must answer all questions before completing the session.
            </p>
          </div>
        }
        confirmLabel="Go to Unanswered"
        cancelLabel="Close"
        confirmVariant="primary"
        onConfirm={handleGoToFirstUnanswered}
        onCancel={() => setShowUnansweredDialog(false)}
      />

      {/* Flag Issue Modal */}
      <FlagIssueModal
        isOpen={showFlagModal}
        onSubmit={handleFlagSubmit}
        onCancel={() => setShowFlagModal(false)}
      />

      {/* Encouragement Modal */}
      {encouragementData && (
        <EncouragementModal
          isOpen={true}
          milestone={encouragementData.milestone}
          isDoingWell={encouragementData.isDoingWell}
          accuracy={encouragementData.accuracy}
          onClose={() => setEncouragementData(null)}
        />
      )}
    </div>
  );
}
