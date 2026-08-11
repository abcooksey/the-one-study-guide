import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { getRandomMessage, EncouragementMessage } from '../data/encouragementMessages';

interface EncouragementCardProps {
  milestone: 50 | 75;
  isDoingWell: boolean;
  accuracy: number;
  onContinue: () => void;
}

export default function EncouragementCard({
  milestone,
  isDoingWell,
  accuracy,
  onContinue,
}: EncouragementCardProps) {
  const [imageError, setImageError] = useState(false);

  // Get a random message when the component mounts
  const message: EncouragementMessage = useMemo(() => {
    return getRandomMessage(milestone, isDoingWell);
  }, [milestone, isDoingWell]);

  const milestoneLabel = milestone === 50 ? 'Halfway There!' : 'Almost Done!';
  const questionsLeft = milestone === 50 ? 10 : 5;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div style={{ minHeight: '400px' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full rounded-2xl p-6 sm:p-8 flex flex-col bg-gradient-to-br from-gold-50 to-parchment-100 border-2 border-gold-300 shadow-flashcard"
          style={{ minHeight: '400px' }}
        >
          {/* Milestone badge */}
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-gold-200 text-gold-800">
              {milestoneLabel}
            </span>
          </div>

          {/* Image */}
          <div className="w-full h-36 sm:h-44 rounded-xl bg-parchment-200 flex items-center justify-center overflow-hidden mb-4">
            {!imageError ? (
              <img
                src={message.imageUrl}
                alt={message.imageAlt}
                className="w-full h-full object-cover rounded-xl"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="text-center text-charcoal-400">
                <div className="text-4xl mb-1">💍</div>
                <p className="text-xs">The ring was here somewhere...</p>
              </div>
            )}
          </div>

          {/* Message */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <h2 className="text-xl sm:text-2xl font-serif text-charcoal-900 leading-relaxed mb-2">
              {message.text}
            </h2>
            {message.subtext && (
              <p className="text-charcoal-600 text-sm sm:text-base mb-3">
                {message.subtext}
              </p>
            )}
            <p className="text-sm text-charcoal-500">
              {questionsLeft} questions to go • {Math.round(accuracy)}% accuracy
            </p>
          </div>

          {/* Continue button */}
          <div className="flex flex-col items-center pt-4">
            <button
              onClick={onContinue}
              className="btn-brass btn-lg w-full sm:w-auto"
            >
              Continue Your Journey
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
