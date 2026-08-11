import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-charcoal-900/50"
            onClick={onCancel}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-serif font-bold text-charcoal-900 mb-2">
              {title}
            </h3>
            <div className="text-charcoal-600 mb-6">{message}</div>

            <div className="flex gap-3 justify-end">
              <button onClick={onCancel} className="btn-secondary">
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={
                  confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'
                }
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
