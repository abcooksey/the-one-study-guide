import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { getRandomMessage, EncouragementMessage } from '../data/encouragementMessages';

interface EncouragementModalProps {
  isOpen: boolean;
  milestone: 50 | 75;
  isDoingWell: boolean;
  accuracy: number;
  onClose: () => void;
}

export default function EncouragementModal({
  isOpen,
  milestone,
  isDoingWell,
  accuracy,
  onClose,
}: EncouragementModalProps) {
  const [imageError, setImageError] = useState(false);

  // Get a random message when the modal opens
  const message: EncouragementMessage = useMemo(() => {
    return getRandomMessage(milestone, isDoingWell);
  }, [milestone, isDoingWell]);

  // Reset image error state when modal opens
  useEffect(() => {
    if (isOpen) {
      setImageError(false);
    }
  }, [isOpen]);

  const milestoneLabel = milestone === 50 ? 'Halfway There!' : 'Almost Done!';
  const progressEmoji = isDoingWell ? '🌟' : '💪';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-charcoal-900/60"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Progress badge */}
            <div className="absolute top-4 right-4 bg-gold-500/20 text-gold-700 px-3 py-1 rounded-full text-sm font-medium">
              {progressEmoji} {milestone}% Complete
            </div>

            {/* Image container */}
            <div className="w-full h-48 bg-parchment-200 flex items-center justify-center overflow-hidden">
              {!imageError ? (
                <img
                  src={message.imageUrl}
                  alt={message.imageAlt}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="text-center text-charcoal-400">
                  <div className="text-5xl mb-2">💍</div>
                  <p className="text-sm">The ring was here somewhere...</p>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Milestone indicator */}
              <div className="text-center mb-4">
                <span className="inline-block bg-gold-100 text-gold-800 px-4 py-1 rounded-full text-sm font-semibold">
                  {milestoneLabel}
                </span>
              </div>

              {/* Message */}
              <h3 className="text-xl font-serif font-bold text-charcoal-900 text-center mb-2">
                {message.text}
              </h3>
              {message.subtext && (
                <p className="text-charcoal-600 text-center mb-4">
                  {message.subtext}
                </p>
              )}

              {/* Accuracy indicator */}
              <div className="text-center text-sm text-charcoal-500 mb-6">
                Current accuracy: <span className={isDoingWell ? 'text-green-600 font-semibold' : 'text-charcoal-700 font-semibold'}>{Math.round(accuracy)}%</span>
              </div>

              {/* Continue button */}
              <button
                onClick={onClose}
                className="w-full btn-primary py-3 text-lg"
              >
                Continue Your Journey
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
