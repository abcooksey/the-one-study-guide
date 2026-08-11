import { motion } from 'framer-motion';
import { BattlePlayer, WinnerResult, BattleStats } from '../../types/battle';

interface BattleWinnerAnnouncementProps {
  winnerId: WinnerResult;
  player1: BattlePlayer;
  player2: BattlePlayer;
  currentPlayerKey: 'player1' | 'player2';
  player1Stats: BattleStats;
  player2Stats: BattleStats;
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

const LOTR_TIE_MESSAGES = [
  "A perfect balance! Like Legolas and Gimli, you are evenly matched!",
  "Neither fellowship prevailed - a true battle of equals!",
  "Even the Palantir could not have predicted this draw!",
  "The Valar have decreed a tie! Your knowledge is perfectly matched!",
];

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export default function BattleWinnerAnnouncement({
  winnerId,
  player1,
  player2,
  currentPlayerKey,
  player1Stats,
  player2Stats,
}: BattleWinnerAnnouncementProps) {
  const isCurrentPlayerWinner =
    winnerId === currentPlayerKey ||
    (winnerId === 'tie' && false);

  const isTie = winnerId === 'tie';

  const winner = winnerId === 'player1' ? player1 : winnerId === 'player2' ? player2 : null;
  const loser = winnerId === 'player1' ? player2 : winnerId === 'player2' ? player1 : null;

  const getMessage = () => {
    const messages = isTie
      ? LOTR_TIE_MESSAGES
      : isCurrentPlayerWinner
      ? LOTR_WIN_MESSAGES
      : LOTR_LOSE_MESSAGES;
    return messages[Math.floor(Math.random() * messages.length)];
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
        {isTie ? '...' : isCurrentPlayerWinner ? '...' : '...'}
      </motion.div>

      {/* Result Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`text-3xl sm:text-4xl font-serif font-bold mb-4 ${
          isTie
            ? 'text-brass-600'
            : isCurrentPlayerWinner
            ? 'text-forest-600'
            : 'text-charcoal-700'
        }`}
      >
        {isTie ? "It's a Tie!" : isCurrentPlayerWinner ? 'Victory!' : 'Defeat'}
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
        className="flex justify-center items-end gap-4 mb-8"
      >
        {/* 1st Place */}
        <div
          className={`relative ${isTie ? 'order-1' : winner === player1 ? 'order-1' : 'order-2'}`}
        >
          <div className="bg-gradient-to-b from-brass-400 to-brass-500 rounded-t-xl px-6 py-4 min-w-[120px]">
            <span className="text-4xl block mb-1">{winner ? winner.emoji : player1.emoji}</span>
            <span className="text-white font-bold text-sm block">
              {winner ? winner.name : player1.name}
            </span>
            <span className="text-brass-100 text-xs">
              {winner
                ? `${winnerId === 'player1' ? player1Stats.correct : player2Stats.correct} correct`
                : `${player1Stats.correct} correct`}
            </span>
          </div>
          <div className="bg-brass-600 h-24 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">1st</span>
          </div>
        </div>

        {/* 2nd Place */}
        {!isTie && loser && (
          <div className="order-2">
            <div className="bg-gradient-to-b from-parchment-300 to-parchment-400 rounded-t-xl px-6 py-4 min-w-[120px]">
              <span className="text-4xl block mb-1">{loser.emoji}</span>
              <span className="text-charcoal-700 font-bold text-sm block">
                {loser.name}
              </span>
              <span className="text-charcoal-500 text-xs">
                {winnerId === 'player1' ? player2Stats.correct : player1Stats.correct} correct
              </span>
            </div>
            <div className="bg-parchment-500 h-16 flex items-center justify-center">
              <span className="text-2xl font-bold text-charcoal-600">2nd</span>
            </div>
          </div>
        )}

        {/* Tie - Show both at same level */}
        {isTie && (
          <div className="order-2">
            <div className="bg-gradient-to-b from-brass-400 to-brass-500 rounded-t-xl px-6 py-4 min-w-[120px]">
              <span className="text-4xl block mb-1">{player2.emoji}</span>
              <span className="text-white font-bold text-sm block">{player2.name}</span>
              <span className="text-brass-100 text-xs">{player2Stats.correct} correct</span>
            </div>
            <div className="bg-brass-600 h-24 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">1st</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Detailed Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="grid grid-cols-2 gap-6 max-w-lg mx-auto"
      >
        {/* Player 1 Stats */}
        <div className="bg-white rounded-xl p-4 border border-parchment-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{player1.emoji}</span>
            <span className="font-medium text-charcoal-800">{player1.name}</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-charcoal-500">Correct</span>
              <span className="font-medium text-green-600">{player1Stats.correct}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-500">Incorrect</span>
              <span className="font-medium text-red-600">{player1Stats.incorrect}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-500">Accuracy</span>
              <span className="font-medium">{player1Stats.accuracy}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-500">Time</span>
              <span className="font-medium">{formatTime(player1Stats.totalTime)}</span>
            </div>
          </div>
        </div>

        {/* Player 2 Stats */}
        <div className="bg-white rounded-xl p-4 border border-parchment-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{player2.emoji}</span>
            <span className="font-medium text-charcoal-800">{player2.name}</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-charcoal-500">Correct</span>
              <span className="font-medium text-green-600">{player2Stats.correct}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-500">Incorrect</span>
              <span className="font-medium text-red-600">{player2Stats.incorrect}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-500">Accuracy</span>
              <span className="font-medium">{player2Stats.accuracy}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-500">Time</span>
              <span className="font-medium">{formatTime(player2Stats.totalTime)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
