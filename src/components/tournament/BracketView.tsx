import { Tournament } from '../../types/tournament';
import { getRoundName } from '../../lib/tournamentFirestore';
import TournamentMatchCard from './TournamentMatchCard';

interface BracketViewProps {
  tournament: Tournament;
  currentPlayerName?: string;
}

export default function BracketView({
  tournament,
  currentPlayerName,
}: BracketViewProps) {
  const numRounds = tournament.rounds.length;

  if (numRounds === 0) {
    return (
      <div className="text-center py-8 text-charcoal-500">
        Bracket will be generated when tournament starts
      </div>
    );
  }

  const renderBracket = () => {
    if (tournament.maxPlayers === 4) {
      return render4PlayerBracket();
    } else if (tournament.maxPlayers === 8) {
      return render8PlayerBracket();
    } else {
      return renderGenericBracket();
    }
  };

  const render4PlayerBracket = () => {
    const round1 = tournament.rounds[0];
    const round2 = tournament.rounds[1];

    return (
      <div className="flex items-center justify-center gap-0">
        {/* Semifinals */}
        <div className="flex flex-col gap-6">
          <div className="text-center mb-1">
            <h3 className="text-sm font-semibold text-charcoal-600">
              {getRoundName(1, numRounds)}
            </h3>
          </div>

          {round1?.matches.map((match) => (
            <div key={match.matchId} className="w-52">
              <TournamentMatchCard
                match={match}
                currentPlayerName={currentPlayerName}
                tournamentId={tournament.id}
                players={tournament.players}
              />
            </div>
          ))}
        </div>

        {/* Connector lines */}
        <div className="flex flex-col items-center justify-center h-full">
          <svg width="50" height="180" className="text-parchment-300">
            <line x1="0" y1="50" x2="18" y2="50" stroke="currentColor" strokeWidth="2" />
            <line x1="18" y1="50" x2="18" y2="90" stroke="currentColor" strokeWidth="2" />
            <line x1="0" y1="130" x2="18" y2="130" stroke="currentColor" strokeWidth="2" />
            <line x1="18" y1="130" x2="18" y2="90" stroke="currentColor" strokeWidth="2" />
            <line x1="18" y1="90" x2="50" y2="90" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        {/* Finals */}
        <div className="flex flex-col justify-center">
          <div className="text-center mb-1">
            <h3 className="text-sm font-semibold text-charcoal-600">
              {getRoundName(2, numRounds)}
            </h3>
          </div>

          {round2?.matches.map((match) => (
            <div key={match.matchId} className="w-52">
              <TournamentMatchCard
                match={match}
                currentPlayerName={currentPlayerName}
                tournamentId={tournament.id}
                players={tournament.players}
              />
            </div>
          ))}
        </div>

        {/* Winner display */}
        {tournament.winner && (
          <>
            <div className="flex items-center">
              <svg width="40" height="60" className="text-parchment-300">
                <line x1="0" y1="30" x2="40" y2="30" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <div className="flex flex-col justify-center">
              <div className="text-center">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-300">
                  <div className="text-2xl mb-1">🏆</div>
                  <div className="text-xs text-yellow-600 font-medium mb-1">Champion</div>
                  <div className="font-bold text-yellow-800">
                    {tournament.winner}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const render8PlayerBracket = () => {
    const round1 = tournament.rounds[0];
    const round2 = tournament.rounds[1];
    const round3 = tournament.rounds[2];

    return (
      <div className="flex items-center justify-center gap-0 overflow-x-auto">
        {/* Quarterfinals */}
        <div className="flex flex-col gap-3">
          <div className="text-center mb-1">
            <h3 className="text-sm font-semibold text-charcoal-600">{getRoundName(1, numRounds)}</h3>
          </div>

          {round1?.matches.map((match) => (
            <div key={match.matchId} className="w-44">
              <TournamentMatchCard
                match={match}
                currentPlayerName={currentPlayerName}
                tournamentId={tournament.id}
                players={tournament.players}
              />
            </div>
          ))}
        </div>

        {/* Connector QF to SF */}
        <div className="flex flex-col items-center px-1">
          <svg width="32" height="380" className="text-parchment-300">
            <line x1="0" y1="65" x2="12" y2="65" stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1="65" x2="12" y2="110" stroke="currentColor" strokeWidth="2" />
            <line x1="0" y1="155" x2="12" y2="155" stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1="155" x2="12" y2="110" stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1="110" x2="32" y2="110" stroke="currentColor" strokeWidth="2" />

            <line x1="0" y1="245" x2="12" y2="245" stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1="245" x2="12" y2="290" stroke="currentColor" strokeWidth="2" />
            <line x1="0" y1="335" x2="12" y2="335" stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1="335" x2="12" y2="290" stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1="290" x2="32" y2="290" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        {/* Semifinals */}
        <div className="flex flex-col justify-around h-[380px]">
          <div className="text-center mb-1">
            <h3 className="text-sm font-semibold text-charcoal-600">{getRoundName(2, numRounds)}</h3>
          </div>

          {round2?.matches.map((match) => (
            <div key={match.matchId} className="w-44">
              <TournamentMatchCard
                match={match}
                currentPlayerName={currentPlayerName}
                tournamentId={tournament.id}
                players={tournament.players}
              />
            </div>
          ))}
        </div>

        {/* Connector SF to Finals */}
        <div className="flex flex-col items-center px-1">
          <svg width="32" height="380" className="text-parchment-300">
            <line x1="0" y1="110" x2="12" y2="110" stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1="110" x2="12" y2="190" stroke="currentColor" strokeWidth="2" />
            <line x1="0" y1="290" x2="12" y2="290" stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1="290" x2="12" y2="190" stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1="190" x2="32" y2="190" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        {/* Finals */}
        <div className="flex flex-col justify-center h-[380px]">
          <div className="text-center mb-1">
            <h3 className="text-sm font-semibold text-charcoal-600">{getRoundName(3, numRounds)}</h3>
          </div>

          {round3?.matches.map((match) => (
            <div key={match.matchId} className="w-44">
              <TournamentMatchCard
                match={match}
                currentPlayerName={currentPlayerName}
                tournamentId={tournament.id}
                players={tournament.players}
              />
            </div>
          ))}
        </div>

        {/* Winner */}
        {tournament.winner && (
          <>
            <div className="px-1">
              <svg width="32" height="60" className="text-parchment-300">
                <line x1="0" y1="30" x2="32" y2="30" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <div className="flex flex-col justify-center">
              <div className="text-center">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-300">
                  <div className="text-2xl mb-1">🏆</div>
                  <div className="text-xs text-yellow-600 font-medium mb-1">Champion</div>
                  <div className="font-bold text-yellow-800">
                    {tournament.winner}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderGenericBracket = () => {
    return (
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max">
          {tournament.rounds.map((round) => (
            <div
              key={round.roundNumber}
              className="flex flex-col"
              style={{ minWidth: '180px' }}
            >
              <div className="text-center mb-3">
                <h3 className="text-sm font-semibold text-charcoal-600">
                  {getRoundName(round.roundNumber, numRounds)}
                </h3>
              </div>

              <div className="flex flex-col gap-3">
                {round.matches.map((match) => (
                  <TournamentMatchCard
                    key={match.matchId}
                    match={match}
                    currentPlayerName={currentPlayerName}
                    tournamentId={tournament.id}
                    players={tournament.players}
                  />
                ))}
              </div>
            </div>
          ))}

          {tournament.winner && (
            <div className="flex flex-col justify-center" style={{ minWidth: '140px' }}>
              <div className="text-center">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 border border-yellow-300">
                  <div className="text-3xl mb-1">🏆</div>
                  <div className="text-xs text-yellow-600 font-medium mb-1">Champion</div>
                  <div className="font-bold text-lg text-yellow-800">
                    {tournament.winner}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return renderBracket();
}
