import { BattleHistoryEntry } from '../../types/battleHistory';

interface BattleHistoryCardProps {
  entry: BattleHistoryEntry;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

function getPlacementEmoji(placement: 1 | 2 | 3 | 4): string {
  switch (placement) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    case 4:
      return '4th';
  }
}

function getPlacementColor(placement: 1 | 2 | 3 | 4): string {
  switch (placement) {
    case 1:
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 2:
      return 'text-gray-500 bg-gray-50 border-gray-200';
    case 3:
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 4:
      return 'text-charcoal-500 bg-charcoal-50 border-charcoal-200';
  }
}

export default function BattleHistoryCard({ entry }: BattleHistoryCardProps) {
  const placementEmoji = getPlacementEmoji(entry.placement);
  const placementColor = getPlacementColor(entry.placement);

  return (
    <div className={`rounded-xl border p-4 ${placementColor}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{placementEmoji}</span>
          <div>
            <div className="font-medium text-charcoal-900">
              vs {entry.opponents.join(', ')}
            </div>
            <div className="text-xs text-charcoal-500">
              {formatDate(entry.date)} · {entry.totalPlayers} players
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${
            entry.accuracy >= 70
              ? 'text-green-600'
              : entry.accuracy >= 50
              ? 'text-brass-600'
              : 'text-red-600'
          }`}>
            {entry.accuracy}%
          </div>
          <div className="text-xs text-charcoal-500">accuracy</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-charcoal-600">
        <div className="flex items-center gap-4">
          <span>
            {entry.correct}/{entry.answered} correct
          </span>
          <span>
            {formatDuration(entry.duration)}
          </span>
        </div>
        <span className="text-xs text-charcoal-400 font-mono">
          {entry.battleId}
        </span>
      </div>
    </div>
  );
}
