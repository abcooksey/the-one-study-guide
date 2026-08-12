import { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../../types/battlePlayer';
import { subscribeToAllLeaderboard } from '../../lib/battlePlayerFirestore';

const COLLAPSED_COUNT = 5;
const EXPANDED_PAGE_SIZE = 10;

export default function BattleLeaderboard() {
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToAllLeaderboard((newEntries) => {
      setAllEntries(newEntries);
      setIsLoading(false);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Reset to page 1 when collapsing
  const handleToggleExpanded = () => {
    if (isExpanded) {
      setCurrentPage(1);
    }
    setIsExpanded(!isExpanded);
  };

  // Calculate pagination
  const totalPages = Math.ceil(allEntries.length / EXPANDED_PAGE_SIZE);
  const hasMoreThanCollapsed = allEntries.length > COLLAPSED_COUNT;

  // Get entries to display
  const getDisplayedEntries = () => {
    if (!isExpanded) {
      return allEntries.slice(0, COLLAPSED_COUNT);
    }
    const startIndex = (currentPage - 1) * EXPANDED_PAGE_SIZE;
    return allEntries.slice(startIndex, startIndex + EXPANDED_PAGE_SIZE);
  };

  const displayedEntries = getDisplayedEntries();

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

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

  if (allEntries.length === 0) {
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
              <th className="px-4 py-2 text-center">Best Streak</th>
            </tr>
          </thead>
          <tbody>
            {displayedEntries.map((entry) => (
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

      {/* Pagination (only shown when expanded and more than one page) */}
      {isExpanded && totalPages > 1 && (
        <div className="px-4 py-3 border-t border-parchment-100 flex justify-center">
          <div className="inline-flex items-center gap-4 bg-parchment-50 rounded-xl px-4 py-2 border border-parchment-200">
            {/* Previous button */}
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`
                w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                ${currentPage === 1
                  ? 'text-parchment-300 cursor-not-allowed'
                  : 'text-charcoal-500 hover:bg-parchment-200 hover:text-charcoal-700'
                }
              `}
              aria-label="Previous page"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Page indicator */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brass-500 text-white text-sm font-medium">
                {currentPage}
              </span>
              <span className="text-charcoal-500 text-sm">of {totalPages}</span>
            </div>

            {/* Next button */}
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`
                w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                ${currentPage === totalPages
                  ? 'text-parchment-300 cursor-not-allowed'
                  : 'text-charcoal-500 hover:bg-parchment-200 hover:text-charcoal-700'
                }
              `}
              aria-label="Next page"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Show more/less button */}
      {hasMoreThanCollapsed && (
        <div className="px-4 py-3 border-t border-parchment-100">
          <button
            onClick={handleToggleExpanded}
            className="w-full flex items-center justify-center gap-1 text-sm text-brass-600 hover:text-brass-700 transition-colors py-1"
          >
            <span>{isExpanded ? 'Show less' : 'Show more'}</span>
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
              className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
