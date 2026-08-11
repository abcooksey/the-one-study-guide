import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { motion } from 'framer-motion';
import { isValidBattleCode, normalizeBattleCode } from '../../utils/battleCode';

interface BattleCodeInputProps {
  onSubmit: (code: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function BattleCodeInput({
  onSubmit,
  isLoading = false,
  error = null,
}: BattleCodeInputProps) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Focus first input on mount
  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow alphanumeric, convert to uppercase
    const char = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (char.length > 1) return;

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    // Auto-advance to next input
    if (char && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit when all filled
    if (char && index === 3) {
      const code = [...newDigits.slice(0, 3), char].join('');
      if (isValidBattleCode(code)) {
        onSubmit(normalizeBattleCode(code));
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }

    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    if (e.key === 'ArrowRight' && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (pastedText.length >= 4) {
      const newDigits = pastedText.slice(0, 4).split('');
      setDigits(newDigits);
      inputRefs[3].current?.focus();

      // Auto-submit if valid
      const code = newDigits.join('');
      if (isValidBattleCode(code)) {
        setTimeout(() => onSubmit(normalizeBattleCode(code)), 100);
      }
    }
  };

  const code = digits.join('');
  const isComplete = code.length === 4 && isValidBattleCode(code);

  const handleSubmit = () => {
    if (isComplete && !isLoading) {
      onSubmit(normalizeBattleCode(code));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-3">
        {digits.map((digit, index) => (
          <motion.input
            key={index}
            ref={inputRefs[index]}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={isLoading}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`
              w-14 h-16 sm:w-16 sm:h-20
              text-center text-2xl sm:text-3xl font-mono font-bold
              bg-white border-2 rounded-xl
              focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-forest-400
              uppercase transition-colors
              ${error ? 'border-red-400' : digit ? 'border-forest-400' : 'border-parchment-300'}
              ${isLoading ? 'opacity-50' : ''}
            `}
          />
        ))}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-600 text-sm text-center"
        >
          {error}
        </motion.p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!isComplete || isLoading}
        className={`
          w-full py-3 rounded-xl font-semibold transition-all
          ${isComplete && !isLoading
            ? 'bg-forest-600 hover:bg-forest-700 text-white'
            : 'bg-parchment-200 text-parchment-400 cursor-not-allowed'
          }
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </span>
            Joining...
          </span>
        ) : (
          'Join Battle'
        )}
      </button>
    </div>
  );
}
