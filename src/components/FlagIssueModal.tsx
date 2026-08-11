import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlagReason, FLAG_REASONS } from '../types';

interface FlagIssueModalProps {
  isOpen: boolean;
  onSubmit: (reason: FlagReason, description?: string) => void;
  onCancel: () => void;
}

export default function FlagIssueModal({
  isOpen,
  onSubmit,
  onCancel,
}: FlagIssueModalProps) {
  const [selectedReason, setSelectedReason] = useState<FlagReason | null>(null);
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!selectedReason) return;
    onSubmit(
      selectedReason,
      selectedReason === 'other' && description.trim()
        ? description.trim()
        : undefined
    );
    // Reset state
    setSelectedReason(null);
    setDescription('');
  };

  const handleCancel = () => {
    setSelectedReason(null);
    setDescription('');
    onCancel();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-charcoal-900/60 backdrop-blur-sm"
            onClick={handleCancel}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-gradient-to-b from-parchment-50 to-parchment-100 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-parchment-300"
          >
            <h2 className="text-xl font-serif font-bold text-charcoal-900 mb-2">
              Flag Question Issue
            </h2>
            <p className="text-charcoal-600 text-sm mb-4">
              This question will be removed from sessions until the issue is resolved.
            </p>

            <div className="space-y-2 mb-4">
              {FLAG_REASONS.map((reason) => (
                <button
                  key={reason.value}
                  onClick={() => setSelectedReason(reason.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                    selectedReason === reason.value
                      ? 'border-red-400 bg-red-50'
                      : 'border-parchment-200 bg-white hover:border-parchment-300'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedReason === reason.value
                        ? 'border-red-500 bg-red-500'
                        : 'border-charcoal-300'
                    }`}
                  >
                    {selectedReason === reason.value && (
                      <span className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </span>
                  <span className="text-charcoal-800">{reason.label}</span>
                </button>
              ))}
            </div>

            {selectedReason === 'other' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue..."
                  className="input-field w-full h-20 resize-none"
                  maxLength={200}
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedReason}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Flag Question
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
