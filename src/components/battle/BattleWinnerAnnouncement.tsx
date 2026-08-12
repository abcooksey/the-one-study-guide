import { motion } from 'framer-motion';
import { BattlePlayer, BattleStats, PlayerKey } from '../../types/battle';

interface BattleWinnerAnnouncementProps {
  rankings: PlayerKey[];  // Ordered 1st to last
  players: Record<PlayerKey, BattlePlayer | null>;
  playerStats: Record<PlayerKey, BattleStats | null>;
  currentPlayerKey: PlayerKey;
}

const LOTR_WIN_MESSAGES = [
  "The battle is won! You have shown the wisdom of Gandalf and the courage of Aragorn!",
  "Victory! Your knowledge rivals that of the Elves of Rivendell!",
  "You have conquered! Even Sauron's forces cannot match your trivia prowess!",
  "Champion of Middle-earth! Your wisdom is spoken of from the Shire to Mordor!",
  "The Ring of Victory is yours! Tolkien himself would be proud!",
];

const LOTR_LOSE_MESSAGES = [
  "A valiant effort, but this round goes to your opponent. Like Boromir, you fought bravely!",
  "Not all battles can be won, but like Sam, you never gave up!",
  "Your opponent proved stronger today, but remember - even Frodo needed multiple attempts!",
  "The Enemy has won this skirmish, but the war is not over. Return to your studies!",
  "As Gandalf said: 'All we have to decide is what to do with the time that is given us.' Time to study!",
];

const PLACEMENT_LABELS = ['1st', '2nd', '3rd', '4th'] as const;
const PLACEMENT_COLORS = {
  1: { bg: 'bg-gradient-to-b from-brass-400 to-brass-500', text: 'text-white', podium: 'bg-brass-600' },
  2: { bg: 'bg-gradient-to-b from-parchment-300 to-parchment-400', text: 'text-charcoal-700', podium: 'bg-parchment-500' },
  3: { bg: 'bg-gradient-to-b from-amber-600 to-amber-700', text: 'text-white', podium: 'bg-amber-800' },
  4: { bg: 'bg-gradient-to-b from-charcoal-300 to-charcoal-400', text: 'text-white', podium: 'bg-charcoal-500' },
};
const PODIUM_HEIGHTS = ['h-24', 'h-16', 'h-12', 'h-8'];

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export default function BattleWinnerAnnouncement({
  rankings,
  players,
  playerStats,
  currentPlayerKey,
}: BattleWinnerAnnouncementProps) {
  // Determine current player's placement
  const currentPlayerRank = rankings.indexOf(currentPlayerKey);
  const isCurrentPlayerWinner = currentPlayerRank === 0;
  const playerCount = rankings.length;

  const getMessage = () => {
    const messages = isCurrentPlayerWinner ? LOTR_WIN_MESSAGES : LOTR_LOSE_MESSAGES;
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Get placement info for rendering
  const getPlacementInfo = (rank: number) => {
    const placement = (rank + 1) as 1 | 2 | 3 | 4;
    return {
      label: PLACEMENT_LABELS[rank],
      colors: PLACEMENT_COLORS[placement],
      podiumHeight: PODIUM_HEIGHTS[rank],
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-8"
    >
      {/* Trophy/Result Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="text-7xl mb-4"
      >
        {isCurrentPlayerWinner ? '...' : '...'}
      </motion.div>

      {/* Result Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`text-3xl sm:text-4xl font-serif font-bold mb-4 ${
          isCurrentPlayerWinner ? 'text-forest-600' : 'text-charcoal-700'
        }`}
      >
        {isCurrentPlayerWinner
          ? 'Victory!'
          : currentPlayerRank === 1
            ? '2nd Place!'
            : currentPlayerRank === 2
              ? '3rd Place!'
              : '4th Place!'}
      </motion.h1>

      {/* LOTR Message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-charcoal-600 max-w-md mx-auto mb-8 italic"
      >
        "{getMessage()}"
      </motion.p>

      {/* Podium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mb-8"
      >
        {/* 1st Place - Large and centered */}
        {rankings.length > 0 && (() => {
          const winnerKey = rankings[0];
          const winner = players[winnerKey];
          const winnerStats = playerStats[winnerKey];
          const { colors, podiumHeight } = getPlacementInfo(0);

          if (!winner) return null;

          return (
            <div className="flex justify-center mb-4">
              <div className="text-center">
                <div className={`${colors.bg} rounded-t-xl px-8 py-4 min-w-[140px]`}>
                  <img src={winner.emoji} alt={winner.name} className="w-20 h-20 object-contain mx-auto mb-2" />
                  <span className={`${colors.text} font-bold text-lg block`}>
                    {winner.name}
                  </span>
                  <span className={`${colors.text} opacity-80 text-sm`}>
                    {winnerStats?.correct ?? 0} correct
                  </span>
                </div>
                <div className={`${colors.podium} ${podiumHeight} flex items-center justify-center`}>
                  <span className="text-4xl font-bold text-white">1st</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 2nd, 3rd, 4th Place - Row below */}
        {rankings.length > 1 && (
          <div className={`flex justify-center items-end gap-3 ${
            playerCount === 2 ? 'max-w-xs mx-auto' : playerCount === 3 ? 'max-w-md mx-auto' : 'max-w-2xl mx-auto'
          }`}>
            {rankings.slice(1).map((key, index) => {
              const rank = index + 1; // 1, 2, or 3 (for 2nd, 3rd, 4th place)
              const player = players[key];
              const stats = playerStats[key];
              const { label, colors, podiumHeight } = getPlacementInfo(rank);

              if (!player) return null;

              return (
                <div key={key} className="text-center flex-1 max-w-[120px]">
                  <div className={`${colors.bg} rounded-t-xl px-4 py-3`}>
                    <img src={player.emoji} alt={player.name} className="w-12 h-12 object-contain mx-auto mb-1" />
                    <span className={`${colors.text} font-bold text-sm block truncate`}>
                      {player.name}
                    </span>
                    <span className={`${colors.text} opacity-80 text-xs`}>
                      {stats?.correct ?? 0} correct
                    </span>
                  </div>
                  <div className={`${colors.podium} ${podiumHeight} flex items-center justify-center`}>
                    <span className="text-xl font-bold text-white">{label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Detailed Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className={`grid gap-4 max-w-3xl mx-auto ${
          playerCount === 2
            ? 'grid-cols-2'
            : playerCount === 3
              ? 'grid-cols-3'
              : 'grid-cols-2 lg:grid-cols-4'
        }`}
      >
        {rankings.map((key) => {
          const player = players[key];
          const stats = playerStats[key];

          if (!player || !stats) return null;

          return (
            <div
              key={key}
              className={`bg-white rounded-xl p-4 border ${
                key === currentPlayerKey
                  ? 'border-forest-300 ring-2 ring-forest-200'
                  : 'border-parchment-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <img src={player.emoji} alt={player.name} className="w-8 h-8 object-contain" />
                <span className="font-medium text-charcoal-800 truncate">{player.name}</span>
                {key === currentPlayerKey && (
                  <span className="text-xs text-forest-600">(You)</span>
                )}
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Correct</span>
                  <span className="font-medium text-green-600">{stats.correct}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Incorrect</span>
                  <span className="font-medium text-red-600">{stats.incorrect}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Accuracy</span>
                  <span className="font-medium">{stats.accuracy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Time</span>
                  <span className="font-medium">{formatTime(stats.totalTime)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
