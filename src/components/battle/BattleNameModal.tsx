import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreateBattlePlayerInput } from '../../types/battle';

interface BattleNameModalProps {
  isOpen: boolean;
  mode: 'create' | 'join';
  onSubmit: (player: CreateBattlePlayerInput) => void;
  onCancel: () => void;
}

const BATTLE_EMOJIS = [
  '..', '..', '..', '..', '..', '..', '..', '..',
  '..', '..', '..', '..', '..', '..', '..', '..',
];

export default function BattleNameModal({
  isOpen,
  mode,
  onSubmit,
  onCancel,
}: BattleNameModalProps) {
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(BATTLE_EMOJIS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({ name: name.trim(), emoji: selectedEmoji });
    }
  };

  const isValid = name.trim().length > 0;

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
              {mode === 'create' ? 'Create Battle' : 'Join Battle'}
            </h2>
            <p className="text-charcoal-600 text-center mb-6">
              Choose your battle identity
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name input */}
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-xl border-2 border-parchment-300 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-400/20 bg-white"
                  autoFocus
                />
              </div>

              {/* Emoji selector */}
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Choose Your Icon
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {BATTLE_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`
                        text-2xl p-2 rounded-lg transition-all
                        ${selectedEmoji === emoji
                          ? 'bg-forest-100 border-2 border-forest-400 scale-110'
                          : 'bg-parchment-100 border-2 border-transparent hover:bg-parchment-200'
                        }
                      `}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-white rounded-xl p-4 border border-parchment-200 text-center">
                <span className="text-3xl">{selectedEmoji}</span>
                <p className="font-medium text-charcoal-900 mt-1">
                  {name.trim() || 'Your Name'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 py-3 rounded-xl font-semibold bg-parchment-200 text-charcoal-700 hover:bg-parchment-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isValid}
                  className={`
                    flex-1 py-3 rounded-xl font-semibold transition-all
                    ${isValid
                      ? 'bg-forest-600 text-white hover:bg-forest-700'
                      : 'bg-parchment-200 text-parchment-400 cursor-not-allowed'
                    }
                  `}
                >
                  {mode === 'create' ? 'Create Battle' : 'Join Battle'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
