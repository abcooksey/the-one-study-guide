import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BattleHistoryEntry, HeadToHeadRecord, BattleHistoryStats } from '../types/battleHistory';
import {
  getBattleHistory,
  getHeadToHeadRecords,
  getBattleHistoryStats,
} from '../lib/battleHistoryFirestore';
import BattleHistoryCard from '../components/battle/BattleHistoryCard';
import { getPlayer } from '../lib/battlePlayerFirestore';
import { BattlePlayerProfile } from '../types/battlePlayer';

export default function BattleHistory() {
  const [searchParams] = useSearchParams();
  const playerName = searchParams.get('player') || '';

  const [player, setPlayer] = useState<BattlePlayerProfile | null>(null);
  const [history, setHistory] = useState<BattleHistoryEntry[]>([]);
  const [headToHead, setHeadToHead] = useState<HeadToHeadRecord[]>([]);
  const [stats, setStats] = useState<BattleHistoryStats | null>(null);
  const [filterOpponent, setFilterOpponent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load player profile and history
  useEffect(() => {
    const loadData = async () => {
      if (!playerName) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const [playerData, historyData, h2hData, statsData] = await Promise.all([
        getPlayer(playerName),
        getBattleHistory(playerName),
        getHeadToHeadRecords(playerName),
        getBattleHistoryStats(playerName),
      ]);

      setPlayer(playerData);
      setHistory(historyData);
      setHeadToHead(h2hData);
      setStats(statsData);
      setIsLoading(false);
    };
    loadData();
  }, [playerName]);

  // Filter history by opponent
  const filteredHistory = filterOpponent
    ? history.filter((entry) =>
        entry.opponents.some((o) =>
          o.toLowerCase().includes(filterOpponent.toLowerCase())
        )
      )
    : history;

  // No player specified - redirect to home
  if (!playerName) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-parchment-100 to-parchment-200 flex items-center justify-center">
        <div className="text-center">
          <p className="text-charcoal-500 mb-4">No player specified</p>
          <Link to="/" className="btn-brass">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-100 to-parchment-200">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur border-b border-parchment-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="text-charcoal-600 hover:text-charcoal-900 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            {player && (
              <img
                src={player.emoji}
                alt={player.displayName}
                className="w-6 h-6 object-contain"
              />
            )}
            <h1 className="font-serif font-bold text-charcoal-900 text-lg">
              {player?.displayName || playerName}'s History
            </h1>
          </div>
          <div className="w-6" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brass-600 mx-auto"></div>
            <p className="mt-4 text-charcoal-500">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          /* Fun empty state */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="mb-6">
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
                className="text-6xl mb-4 inline-block"
              >
                ⚔️
              </motion.div>
            </div>

            <h2 className="text-2xl font-serif font-bold text-charcoal-900 mb-3">
              No Battles Yet!
            </h2>

            <p className="text-charcoal-600 mb-2 max-w-md mx-auto">
              {player?.displayName || playerName} hasn't entered the arena yet.
            </p>
            <p className="text-charcoal-500 text-sm mb-8 max-w-md mx-auto italic">
              "Even the smallest person can change the course of the future." — Galadriel
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/battle?mode=create"
                className="btn-brass inline-flex items-center justify-center gap-2"
              >
                <span>⚔️</span>
                Create a Battle
              </Link>
              <Link
                to="/battle?mode=join"
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <span>🛡️</span>
                Join a Battle
              </Link>
            </div>

            <div className="mt-12 pt-8 border-t border-parchment-200">
              <p className="text-xs text-charcoal-400">
                Battle records will appear here after completing battles
              </p>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Stats Summary */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
              >
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <div className="text-2xl font-bold text-charcoal-900">
                    {stats.totalBattles}
                  </div>
                  <div className="text-xs text-charcoal-500">Battles</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.totalWins}
                  </div>
                  <div className="text-xs text-charcoal-500">Wins</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <div className={`text-2xl font-bold ${
                    stats.winRate >= 50 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.winRate}%
                  </div>
                  <div className="text-xs text-charcoal-500">Win Rate</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <div className={`text-2xl font-bold ${
                    stats.averageAccuracy >= 70
                      ? 'text-green-600'
                      : stats.averageAccuracy >= 50
                      ? 'text-brass-600'
                      : 'text-red-600'
                  }`}>
                    {stats.averageAccuracy}%
                  </div>
                  <div className="text-xs text-charcoal-500">Avg Accuracy</div>
                </div>
              </motion.div>
            )}

            {/* Head-to-Head Records */}
            {headToHead.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
              >
                <h2 className="text-lg font-serif font-bold text-charcoal-900 mb-4">
                  Head-to-Head Records
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {headToHead.map((record) => (
                    <button
                      key={record.opponentName}
                      onClick={() => setFilterOpponent(
                        filterOpponent === record.opponentName ? '' : record.opponentName
                      )}
                      className={`bg-white rounded-xl p-4 text-left shadow-sm transition-all ${
                        filterOpponent === record.opponentName
                          ? 'ring-2 ring-brass-500'
                          : 'hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-charcoal-900">
                          vs {record.opponentName}
                        </span>
                        <span className="text-xs text-charcoal-500">
                          {record.totalGames} games
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 font-bold">
                            {record.wins}W
                          </span>
                          <span className="text-charcoal-400">-</span>
                          <span className="text-red-600 font-bold">
                            {record.losses}L
                          </span>
                        </div>
                        <span className={`text-sm font-medium ${
                          record.winRate >= 50 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {record.winRate}%
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Battle History List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-serif font-bold text-charcoal-900">
                  Recent Battles
                  {filterOpponent && (
                    <span className="text-sm font-normal text-charcoal-500 ml-2">
                      with {filterOpponent}
                    </span>
                  )}
                </h2>
                {filterOpponent && (
                  <button
                    onClick={() => setFilterOpponent('')}
                    className="text-sm text-brass-600 hover:text-brass-700"
                  >
                    Clear filter
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {filteredHistory.map((entry, index) => (
                  <motion.div
                    key={entry.battleId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <BattleHistoryCard entry={entry} />
                  </motion.div>
                ))}
              </div>

              {filteredHistory.length === 0 && filterOpponent && (
                <div className="text-center py-8 text-charcoal-500">
                  No battles found with {filterOpponent}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
