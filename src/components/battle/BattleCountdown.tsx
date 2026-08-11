import { motion, AnimatePresence } from 'framer-motion';

interface BattleCountdownProps {
  seconds: number;
  isVisible: boolean;
}

export default function BattleCountdown({ seconds, isVisible }: BattleCountdownProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/80 backdrop-blur-md"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-parchment-100 text-xl mb-4 font-serif"
            >
              Battle begins in
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={seconds}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                {seconds > 0 ? (
                  <div className="text-8xl sm:text-9xl font-bold text-forest-400 font-mono">
                    {seconds}
                  </div>
                ) : (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="text-6xl sm:text-7xl font-bold text-brass-400 font-serif"
                  >
                    GO!
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Ring animation */}
            <motion.div
              key={`ring-${seconds}`}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-forest-400 rounded-full"
            />

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-parchment-300 mt-8 text-lg"
            >
              May the best Tolkien fan win!
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
