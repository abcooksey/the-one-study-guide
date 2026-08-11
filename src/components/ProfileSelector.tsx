import { motion, AnimatePresence } from 'framer-motion';
import { Profile } from '../types';

interface ProfileSelectorProps {
  isOpen: boolean;
  onSelect: (profile: Profile) => void;
  onCancel: () => void;
}

export default function ProfileSelector({
  isOpen,
  onSelect,
  onCancel,
}: ProfileSelectorProps) {
  const profiles: { name: Profile; emoji: string; description: string }[] = [
    {
      name: 'Alex',
      emoji: '👑',
      description: 'Track your progress',
    },
    {
      name: 'Angus',
      emoji: '⚔️',
      description: 'Track your progress',
    },
    {
      name: 'Guest',
      emoji: '🧙',
      description: 'Play without saving',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-charcoal-900/60 backdrop-blur-sm"
            onClick={onCancel}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-gradient-to-b from-parchment-50 to-parchment-100 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-parchment-300"
          >
            <h2 className="text-2xl font-serif font-bold text-charcoal-900 text-center mb-2">
              Who's Playing?
            </h2>
            <p className="text-charcoal-600 text-center mb-6">
              Select your profile to track your progress
            </p>

            <div className="space-y-3">
              {profiles.map((profile) => (
                <button
                  key={profile.name}
                  onClick={() => onSelect(profile.name)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-white border-2 border-parchment-200 hover:border-forest-400 hover:bg-forest-50 transition-all group"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">
                    {profile.emoji}
                  </span>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-charcoal-900 text-lg">
                      {profile.name}
                    </div>
                    <div className="text-sm text-charcoal-500">
                      {profile.description}
                    </div>
                  </div>
                  <span className="text-forest-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={onCancel}
              className="mt-6 w-full text-center text-charcoal-500 hover:text-charcoal-700 text-sm"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
