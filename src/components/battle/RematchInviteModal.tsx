import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RematchInviteModalProps {
  initiatorName: string;
  initiatorEmoji?: string;
  onAccept: () => void;
  onDecline: () => void;
  expiresInSeconds?: number; // Optional countdown
}

export default function RematchInviteModal({
  initiatorName,
  initiatorEmoji,
  onAccept,
  onDecline,
  expiresInSeconds = 60,
}: RematchInviteModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(expiresInSeconds);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) {
      onDecline(); // Auto-decline when expired
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onDecline]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        >
          {/* Swords decoration */}
          <div className="text-center mb-4">
            <span className="text-5xl">⚔️</span>
          </div>

          {/* Initiator avatar */}
          {initiatorEmoji && (
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brass-100 to-brass-200 border-4 border-brass-300 flex items-center justify-center shadow-lg">
                <img
                  src={initiatorEmoji}
                  alt={initiatorName}
                  className="w-14 h-14 object-contain"
                />
              </div>
            </div>
          )}

          {/* Message */}
          <h3 className="text-xl font-bold text-center text-charcoal-900 mb-2">
            {initiatorName} wants a rematch!
          </h3>
          <p className="text-charcoal-500 text-center mb-6">
            Ready for another round?
          </p>

          {/* Countdown */}
          {secondsLeft <= 30 && (
            <p className="text-center text-sm text-charcoal-400 mb-4">
              Expires in {secondsLeft}s
            </p>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={onAccept}
              className="w-full py-3 px-4 bg-forest-600 hover:bg-forest-700 text-white font-semibold rounded-xl transition-colors shadow-md hover:shadow-lg"
            >
              Join Rematch
            </button>
            <button
              onClick={onDecline}
              className="w-full py-3 px-4 bg-parchment-100 hover:bg-parchment-200 text-charcoal-700 font-medium rounded-xl transition-colors border border-parchment-300"
            >
              Decline
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
