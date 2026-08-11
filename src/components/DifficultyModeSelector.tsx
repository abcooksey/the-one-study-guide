import { motion, AnimatePresence } from 'framer-motion';
import { DifficultyMode, DIFFICULTY_MODES, Profile } from '../types';

interface DifficultyModeSelectorProps {
  isOpen: boolean;
  profile: Profile;
  onSelect: (mode: DifficultyMode) => void;
  onBack: () => void;
}

const modeEmojis: Record<DifficultyMode, string> = {
  progressive: '📈',
  warmup: '🔥',
  random: '🎲',
  weakness: '🎯',
};

export default function DifficultyModeSelector({
  isOpen,
  profile,
  onSelect,
  onBack,
}: DifficultyModeSelectorProps) {
  const profileEmoji = profile === 'Alex' ? '👑' : profile === 'Angus' ? '⚔️' : '🧙';

  // Filter out "Practice Weak Areas" for Guest users since their data isn't saved
  const availableModes = profile === 'Guest'
    ? DIFFICULTY_MODES.filter((mode) => mode.value !== 'weakness')
    : DIFFICULTY_MODES;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-charcoal-900/60 backdrop-blur-sm"
            onClick={onBack}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-gradient-to-b from-parchment-50 to-parchment-100 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-parchment-300"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">{profileEmoji}</span>
              <h2 className="text-2xl font-serif font-bold text-charcoal-900">
                {profile}'s Challenge
              </h2>
            </div>
            <p className="text-charcoal-600 text-center mb-6">
              Choose your difficulty mode
            </p>

            <div className="space-y-3">
              {availableModes.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => onSelect(mode.value)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-white border-2 border-parchment-200 hover:border-forest-400 hover:bg-forest-50 transition-all group"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">
                    {modeEmojis[mode.value]}
                  </span>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-charcoal-900 text-lg">
                      {mode.label}
                    </div>
                    <div className="text-sm text-charcoal-500">
                      {mode.description}
                    </div>
                  </div>
                  <span className="text-forest-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={onBack}
              className="mt-6 w-full text-center text-charcoal-500 hover:text-charcoal-700 text-sm"
            >
              ← Back to profile selection
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
