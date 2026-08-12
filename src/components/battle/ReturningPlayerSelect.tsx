import { useState, useEffect } from 'react';
import { BattlePlayerProfile } from '../../types/battlePlayer';
import { getAllPlayers } from '../../lib/battlePlayerFirestore';

interface ReturningPlayerSelectProps {
  onSelect: (player: BattlePlayerProfile | null) => void;
  selectedPlayer: BattlePlayerProfile | null;
}

export default function ReturningPlayerSelect({
  onSelect,
  selectedPlayer,
}: ReturningPlayerSelectProps) {
  const [players, setPlayers] = useState<BattlePlayerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      setIsLoading(true);
      const allPlayers = await getAllPlayers();
      setPlayers(allPlayers);
      setIsLoading(false);
    };
    fetchPlayers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '') {
      onSelect(null);
    } else {
      const player = players.find((p) => p.name === value);
      onSelect(player || null);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 w-24 bg-parchment-200 rounded mb-2" />
        <div className="h-12 bg-parchment-200 rounded-xl" />
      </div>
    );
  }

  // Don't show if no existing players
  if (players.length === 0) {
    return null;
  }

  return (
    <div>
      <label className="block text-sm font-medium text-charcoal-700 mb-2">
        Returning Player
      </label>
      <div className="relative">
        <select
          value={selectedPlayer?.name || ''}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl border-2 border-parchment-300 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-400/20 bg-white appearance-none cursor-pointer"
        >
          <option value="">Select a player...</option>
          {players.map((player) => (
            <option key={player.name} value={player.name}>
              {player.displayName}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
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
            className="text-charcoal-400"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Show selected player preview */}
      {selectedPlayer && (
        <div className="mt-3 flex items-center gap-3 p-3 bg-forest-50 rounded-xl border border-forest-200">
          <img
            src={selectedPlayer.emoji}
            alt={selectedPlayer.displayName}
            className="w-10 h-10 object-contain"
          />
          <div>
            <p className="font-medium text-charcoal-900">{selectedPlayer.displayName}</p>
            <p className="text-xs text-charcoal-500">
              {selectedPlayer.wins} wins | {selectedPlayer.totalBattles} battles
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
