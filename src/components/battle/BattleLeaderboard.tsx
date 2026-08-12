import { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../../types/battlePlayer';
import { subscribeToLeaderboard } from '../../lib/battlePlayerFirestore';

export default function BattleLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToLeaderboard((newEntries) => {
      setEntries(newEntries);
      setIsLoading(false);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="mt-6 bg-white rounded-xl border border-parchment-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-parchment-200 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-parchment-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="mt-6 bg-white rounded-xl border border-parchment-200 p-6 text-center">
        <div className="text-2xl mb-2">🏆</div>
        <h3 className="font-serif font-bold text-charcoal-900 mb-1">Top Players</h3>
        <p className="text-sm text-charcoal-500">
          No battles completed yet. Be the first on the leaderboard!
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white rounded-xl border border-parchment-200 overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-brass-50 to-brass-100 border-b border-parchment-200">
        <h3 className="font-serif font-bold text-charcoal-900 flex items-center gap-2">
          <span>🏆</span>
          Top Players
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-charcoal-500 uppercase tracking-wider border-b border-parchment-100">
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Player</th>
              <th className="px-4 py-2 text-center">Wins</th>
              <th className="px-4 py-2 text-center">Acc%</th>
              <th className="px-4 py-2 text-center">Streak</th>
              <th className="px-4 py-2 text-center">Best</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.player.name}
                className="border-b border-parchment-50 last:border-0 hover:bg-parchment-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <span
                    className={`
                      inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold
                      ${entry.rank === 1
                        ? 'bg-yellow-100 text-yellow-700'
                        : entry.rank === 2
                        ? 'bg-gray-100 text-gray-600'
                        : entry.rank === 3
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-parchment-100 text-charcoal-600'
                      }
                    `}
                  >
                    {entry.rank}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={entry.player.emoji}
                      alt={entry.player.displayName}
                      className="w-8 h-8 object-contain"
                    />
                    <span className="font-medium text-charcoal-900">
                      {entry.player.displayName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-bold text-forest-600">{entry.player.wins}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`
                      ${entry.correctnessPercent >= 70
                        ? 'text-green-600'
                        : entry.correctnessPercent >= 50
                        ? 'text-brass-600'
                        : 'text-charcoal-500'
                      }
                    `}
                  >
                    {entry.correctnessPercent}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {entry.player.winStreak > 0 ? (
                    <span className="text-brass-600 font-medium">
                      {entry.player.winStreak}
                    </span>
                  ) : (
                    <span className="text-charcoal-400">0</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-charcoal-700">{entry.player.longestWinStreak}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
