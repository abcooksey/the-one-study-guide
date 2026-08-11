import { useState } from 'react';
import { motion } from 'framer-motion';

interface BattleCodeDisplayProps {
  code: string;
}

export default function BattleCodeDisplay({ code }: BattleCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="text-center">
      <p className="text-charcoal-600 text-sm mb-2">Share this code with your opponent:</p>
      <div className="relative inline-block">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-b from-parchment-50 to-parchment-100 border-2 border-forest-400 rounded-xl px-8 py-4 shadow-lg"
        >
          <div className="font-mono text-4xl sm:text-5xl font-bold text-forest-700 tracking-[0.3em]">
            {code}
          </div>
        </motion.div>

        <button
          onClick={handleCopy}
          className="mt-4 flex items-center justify-center gap-2 mx-auto px-4 py-2 bg-forest-100 hover:bg-forest-200 text-forest-700 rounded-lg transition-colors text-sm font-medium"
        >
          {copied ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy Code
            </>
          )}
        </button>
      </div>
    </div>
  );
}
