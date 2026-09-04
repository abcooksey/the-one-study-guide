interface SpectatorBadgeProps {
  count: number;
  className?: string;
}

export default function SpectatorBadge({ count, className = '' }: SpectatorBadgeProps) {
  if (count === 0) return null;

  return (
    <div
      className={`flex items-center gap-1.5 bg-charcoal-100 text-charcoal-600 px-2 py-1 rounded-full text-xs ${className}`}
      title={`${count} spectator${count === 1 ? '' : 's'} watching`}
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
      <span>{count}</span>
    </div>
  );
}
