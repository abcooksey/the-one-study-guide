import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreateBattlePlayerInput } from '../../types/battle';
import { BattlePlayerProfile } from '../../types/battlePlayer';
import ReturningPlayerSelect from './ReturningPlayerSelect';

interface BattleNameModalProps {
  isOpen: boolean;
  mode: 'create' | 'join';
  onSubmit: (player: CreateBattlePlayerInput) => void;
  onCancel: () => void;
}

const BATTLE_ICONS = [
  { name: 'Frodo', path: '/images/icons/icon-frodo.png' },
  { name: 'Sam', path: '/images/icons/icon-sam.png' },
  { name: 'Merry', path: '/images/icons/icon-merry.png' },
  { name: 'Pippin', path: '/images/icons/icon-pippin.png' },
  { name: 'Gandalf', path: '/images/icons/icon-gandalf.png' },
  { name: 'Aragorn', path: '/images/icons/icon-aragorn.png' },
  { name: 'Legolas', path: '/images/icons/icon-legolas.png' },
  { name: 'Gimli', path: '/images/icons/icon-gimli.png' },
  { name: 'Boromir', path: '/images/icons/icon-boromir.png' },
  { name: 'Faramir', path: '/images/icons/icon-faramir.png' },
  { name: 'Eowyn', path: '/images/icons/icon-eyowen.png' },
  { name: 'Theoden', path: '/images/icons/icon-theoden.png' },
  { name: 'Galadriel', path: '/images/icons/icon-galadriel.png' },
  { name: 'Treebeard', path: '/images/icons/icon-treebeard.png' },
  { name: 'Gollum', path: '/images/icons/icon-gollum.png' },
  { name: 'Saruman', path: '/images/icons/icon-sarumon.png' },
];

export default function BattleNameModal({
  isOpen,
  mode,
  onSubmit,
  onCancel,
}: BattleNameModalProps) {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(BATTLE_ICONS[0]);
  const [returningPlayer, setReturningPlayer] = useState<BattlePlayerProfile | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (returningPlayer) {
      onSubmit({
        name: returningPlayer.displayName,
        emoji: returningPlayer.emoji,
        isReturningPlayer: true,
      });
    } else if (name.trim()) {
      onSubmit({ name: name.trim(), emoji: selectedIcon.path });
    }
  };

  const handleReturningPlayerSelect = (player: BattlePlayerProfile | null) => {
    setReturningPlayer(player);
    if (player) {
      // Clear new player fields when selecting returning player
      setName('');
    }
  };

  const isValid = returningPlayer !== null || name.trim().length > 0;

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
            className="relative bg-gradient-to-b from-parchment-50 to-parchment-100 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-parchment-300 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-serif font-bold text-charcoal-900 text-center mb-2">
              {mode === 'create' ? 'Create Battle' : 'Join Battle'}
            </h2>
            <p className="text-charcoal-600 text-center mb-6">
              Choose your battle identity
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Returning Player Select */}
              <ReturningPlayerSelect
                onSelect={handleReturningPlayerSelect}
                selectedPlayer={returningPlayer}
              />

              {/* Divider - only show if returning player dropdown is visible */}
              {!returningPlayer && (
                <div className="flex items-center gap-4">
                  <div className="flex-1 border-t border-parchment-300" />
                  <span className="text-sm text-charcoal-400">OR</span>
                  <div className="flex-1 border-t border-parchment-300" />
                </div>
              )}

              {/* New Player section - hide when returning player is selected */}
              {!returningPlayer && (
                <>
                  {/* Name input */}
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">
                      Your Name (max 5 characters)
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      maxLength={5}
                      className="w-full px-4 py-3 rounded-xl border-2 border-parchment-300 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-400/20 bg-white"
                      autoFocus
                    />
                  </div>

                  {/* Icon selector */}
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-2">
                      Choose Your Character
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {BATTLE_ICONS.map((icon) => (
                        <button
                          key={icon.name}
                          type="button"
                          onClick={() => setSelectedIcon(icon)}
                          className={`
                            p-2 rounded-xl transition-all flex flex-col items-center
                            ${selectedIcon.name === icon.name
                              ? 'bg-forest-100 border-2 border-forest-400 scale-105'
                              : 'bg-parchment-100 border-2 border-transparent hover:bg-parchment-200'
                            }
                          `}
                          title={icon.name}
                        >
                          <img
                            src={icon.path}
                            alt={icon.name}
                            className="w-12 h-12 object-contain"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview for new player */}
                  <div className="bg-white rounded-xl p-4 border border-parchment-200 text-center">
                    <img
                      src={selectedIcon.path}
                      alt={selectedIcon.name}
                      className="w-16 h-16 object-contain mx-auto"
                    />
                    <p className="font-medium text-charcoal-900 mt-2">
                      {name.trim() || 'Your Name'}
                    </p>
                    <p className="text-sm text-charcoal-500">{selectedIcon.name}</p>
                  </div>
                </>
              )}

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
