import { motion, AnimatePresence } from 'framer-motion';
import { Flashcard as FlashcardType, AttemptStatus } from '../types';

interface FlashcardProps {
  flashcard: FlashcardType;
  isFlipped: boolean;
  onFlip: () => void;
  status: AttemptStatus;
  onMarkCorrect: () => void;
  onMarkIncorrect: () => void;
}

export default function Flashcard({
  flashcard,
  isFlipped,
  onFlip,
  status,
  onMarkCorrect,
  onMarkIncorrect,
}: FlashcardProps) {
  const isAnswered = status !== 'unanswered';
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className="flashcard-container"
        style={{ minHeight: '400px' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={flashcard.id}
            className="flashcard relative w-full"
            style={{ minHeight: '400px' }}
            initial={{ rotateY: 0, opacity: 0 }}
            animate={{ rotateY: isFlipped ? 180 : 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: 0.4, ease: 'easeInOut' }
            }
          >
          {/* Front of card */}
          <div className="flashcard-face flashcard-front">
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brass-100 text-brass-800 mb-4">
                {flashcard.category}
              </span>
              <h2 className="text-xl sm:text-2xl font-serif text-charcoal-900 leading-relaxed">
                {flashcard.question}
              </h2>
            </div>

            <div className="flex flex-col items-center gap-4 pt-4">
              {!isAnswered && (
                <button
                  onClick={onFlip}
                  className="btn-brass btn-lg w-full sm:w-auto"
                  aria-label="Reveal answer"
                >
                  Reveal Answer
                </button>
              )}

              {isAnswered && (
                <div
                  className={`px-4 py-2 rounded-lg font-medium ${
                    status === 'correct'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  Marked as {status === 'correct' ? 'Correct' : 'Incorrect'}
                </div>
              )}

              <p className="text-sm text-charcoal-500">
                {flashcard.film}
                {flashcard.edition !== 'Both / General' &&
                  ` · ${flashcard.edition}`}
              </p>
            </div>
          </div>

          {/* Back of card */}
          <div className="flashcard-face flashcard-back">
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <span className="text-sm text-forest-600 font-medium mb-3">
                Answer
              </span>
              <h2 className="text-xl sm:text-2xl font-serif text-forest-900 leading-relaxed mb-4">
                {flashcard.answer}
              </h2>
              {flashcard.explanation && (
                <p className="text-forest-700 text-sm mt-4 max-w-lg">
                  {flashcard.explanation}
                </p>
              )}
            </div>

            <div className="flex flex-col items-center gap-4 pt-4">
              {!isAnswered && (
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    onClick={onMarkCorrect}
                    className="btn-success btn-lg flex-1 sm:flex-initial"
                    aria-label="I got this correct"
                  >
                    <span className="mr-2" aria-hidden="true">✓</span>
                    Correct
                  </button>
                  <button
                    onClick={onMarkIncorrect}
                    className="btn-danger btn-lg flex-1 sm:flex-initial"
                    aria-label="I got this incorrect"
                  >
                    <span className="mr-2" aria-hidden="true">✗</span>
                    Incorrect
                  </button>
                </div>
              )}

              {isAnswered && (
                <div
                  className={`px-4 py-2 rounded-lg font-medium ${
                    status === 'correct'
                      ? 'bg-green-200 text-green-800'
                      : 'bg-red-200 text-red-800'
                  }`}
                >
                  Marked as {status === 'correct' ? 'Correct' : 'Incorrect'}
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-forest-600">
                <span>{flashcard.difficulty}</span>
                <span>·</span>
                <span>{flashcard.film}</span>
              </div>
            </div>
          </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
