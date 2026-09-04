import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Tournament } from '../../types/tournament';
import { getRoundName } from '../../lib/tournamentFirestore';
import TournamentMatchCard from './TournamentMatchCard';

interface BracketViewProps {
  tournament: Tournament;
  currentPlayerName?: string;
}

interface ConnectorLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// Stores the Y offset needed to position a card at the correct bracket position
interface CardOffset {
  matchId: string;
  offsetY: number;
}

export default function BracketView({
  tournament,
  currentPlayerName,
}: BracketViewProps) {
  const numRounds = tournament.rounds.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [connectorLines, setConnectorLines] = useState<ConnectorLine[]>([]);
  const [cardOffsets, setCardOffsets] = useState<CardOffset[]>([]);

  // Register a card ref
  const setCardRef = useCallback((matchId: string, el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(matchId, el);
    } else {
      cardRefs.current.delete(matchId);
    }
  }, []);

  // Calculate connector lines and card offsets based on card positions
  const calculateConnectors = useCallback(() => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const lines: ConnectorLine[] = [];
    const offsets: CardOffset[] = [];
    const CONNECTOR_WIDTH = 20;

    // For each round (except the last), connect cards to the next round
    for (let roundIdx = 0; roundIdx < tournament.rounds.length - 1; roundIdx++) {
      const currentRound = tournament.rounds[roundIdx];
      const nextRound = tournament.rounds[roundIdx + 1];

      // Each pair of matches in current round feeds into one match in next round
      for (let pairIdx = 0; pairIdx < currentRound.matches.length / 2; pairIdx++) {
        const match1 = currentRound.matches[pairIdx * 2];
        const match2 = currentRound.matches[pairIdx * 2 + 1];
        const targetMatch = nextRound.matches[pairIdx];

        const card1 = cardRefs.current.get(match1.matchId);
        const card2 = cardRefs.current.get(match2.matchId);
        const targetCard = cardRefs.current.get(targetMatch.matchId);

        if (card1 && card2 && targetCard) {
          const rect1 = card1.getBoundingClientRect();
          const rect2 = card2.getBoundingClientRect();
          const targetRect = targetCard.getBoundingClientRect();

          // Card centers (relative to container)
          const card1CenterY = rect1.top - containerRect.top + rect1.height / 2;
          const card2CenterY = rect2.top - containerRect.top + rect2.height / 2;
          const targetCenterY = targetRect.top - containerRect.top + targetRect.height / 2;

          // Calculate where the target card SHOULD be (midpoint of feeding cards)
          const idealTargetCenterY = (card1CenterY + card2CenterY) / 2;

          // Calculate offset needed to position target card correctly
          const offsetY = idealTargetCenterY - targetCenterY;
          offsets.push({
            matchId: targetMatch.matchId,
            offsetY,
          });

          // Right edge of source cards
          const card1Right = rect1.right - containerRect.left;
          const card2Right = rect2.right - containerRect.left;

          // Left edge of target card
          const targetLeft = targetRect.left - containerRect.left;

          // Midpoint X for vertical line
          const midX = card1Right + CONNECTOR_WIDTH;

          // Horizontal line from card 1 to vertical line
          lines.push({
            id: `h1-${match1.matchId}`,
            x1: card1Right,
            y1: card1CenterY,
            x2: midX,
            y2: card1CenterY,
          });

          // Horizontal line from card 2 to vertical line
          lines.push({
            id: `h2-${match2.matchId}`,
            x1: card2Right,
            y1: card2CenterY,
            x2: midX,
            y2: card2CenterY,
          });

          // Vertical line connecting the two horizontal lines
          lines.push({
            id: `v-${match1.matchId}-${match2.matchId}`,
            x1: midX,
            y1: card1CenterY,
            x2: midX,
            y2: card2CenterY,
          });

          // Horizontal line from vertical midpoint to target card
          // Use idealTargetCenterY since the card will be moved there
          lines.push({
            id: `h3-${match1.matchId}-${targetMatch.matchId}`,
            x1: midX,
            y1: idealTargetCenterY,
            x2: targetLeft,
            y2: idealTargetCenterY,
          });
        }
      }
    }

    // Connect finals to winner if exists
    if (tournament.winner && tournament.rounds.length > 0) {
      const lastRound = tournament.rounds[tournament.rounds.length - 1];
      const finalsMatch = lastRound.matches[0];
      const finalsCard = cardRefs.current.get(finalsMatch.matchId);
      const winnerEl = cardRefs.current.get('winner');

      if (finalsCard && winnerEl) {
        const finalsRect = finalsCard.getBoundingClientRect();
        const winnerRect = winnerEl.getBoundingClientRect();

        // Get the finals card's center (accounting for any offset already applied)
        const finalsOffset = offsets.find(o => o.matchId === finalsMatch.matchId)?.offsetY || 0;
        const finalsCenterY = finalsRect.top - containerRect.top + finalsRect.height / 2 + finalsOffset;
        const winnerCenterY = winnerRect.top - containerRect.top + winnerRect.height / 2;
        const finalsRight = finalsRect.right - containerRect.left;
        const winnerLeft = winnerRect.left - containerRect.left;

        // Calculate offset to align winner card with finals card center
        const winnerOffset = finalsCenterY - winnerCenterY;
        offsets.push({
          matchId: 'winner',
          offsetY: winnerOffset,
        });

        // Horizontal line from finals to winner (use finalsCenterY for both to ensure it's straight)
        lines.push({
          id: 'finals-to-winner',
          x1: finalsRight,
          y1: finalsCenterY,
          x2: winnerLeft,
          y2: finalsCenterY,
        });
      }
    }

    setConnectorLines(lines);
    setCardOffsets(offsets);
  }, [tournament.rounds, tournament.winner]);

  // Get the Y offset for a specific match card
  const getCardOffset = useCallback((matchId: string): number => {
    const offset = cardOffsets.find(o => o.matchId === matchId);
    return offset?.offsetY || 0;
  }, [cardOffsets]);

  // Recalculate on mount and when tournament changes
  useEffect(() => {
    calculateConnectors();

    // Use ResizeObserver to recalculate when cards resize
    const resizeObserver = new ResizeObserver(() => {
      calculateConnectors();
    });

    // Observe all card elements
    cardRefs.current.forEach((el) => {
      resizeObserver.observe(el);
    });

    // Also observe the container
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [calculateConnectors, tournament]);

  // Recalculate after a short delay to ensure cards have rendered
  useEffect(() => {
    const timer = setTimeout(calculateConnectors, 100);
    return () => clearTimeout(timer);
  }, [calculateConnectors]);

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
      <div ref={containerRef} className="relative flex items-stretch justify-center gap-12">
        {/* SVG overlay for connector lines */}
        <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
          {connectorLines.map((line) => (
            <line
              key={line.id}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#d4c5a9"
              strokeWidth={2}
            />
          ))}
        </svg>

        {/* Semifinals */}
        <div className="flex flex-col">
          <div className="text-center mb-2">
            <h3 className="text-sm font-semibold text-charcoal-600">
              {getRoundName(1, numRounds)}
            </h3>
          </div>
          <div className="flex flex-col gap-6 flex-1">
            {round1?.matches.map((match, idx) => (
              <div
                key={match.matchId}
                ref={(el) => setCardRef(match.matchId, el)}
                className="w-52"
              >
                <TournamentMatchCard
                  match={match}
                  currentPlayerName={currentPlayerName}
                  tournamentId={tournament.id}
                  players={tournament.players}
                  animationDelay={idx}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Finals */}
        <div className="flex flex-col">
          <div className="text-center mb-2">
            <h3 className="text-sm font-semibold text-charcoal-600">
              {getRoundName(2, numRounds)}
            </h3>
          </div>
          <div className="flex flex-col justify-center flex-1">
            {round2?.matches.map((match, idx) => (
              <div
                key={match.matchId}
                ref={(el) => setCardRef(match.matchId, el)}
                className="w-52 transition-transform duration-200"
                style={{ transform: `translateY(${getCardOffset(match.matchId)}px)` }}
              >
                <TournamentMatchCard
                  match={match}
                  currentPlayerName={currentPlayerName}
                  tournamentId={tournament.id}
                  players={tournament.players}
                  animationDelay={idx + 2}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Winner display */}
        {tournament.winner && (
          <motion.div
            ref={(el) => setCardRef('winner', el)}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', delay: 0.5 }}
            className="flex flex-col transition-transform duration-200"
            style={{ transform: `translateY(${getCardOffset('winner')}px)` }}
          >
            <div className="text-center mb-2">
              <h3 className="text-sm font-semibold text-charcoal-600">&nbsp;</h3>
            </div>
            <div className="flex items-center justify-center flex-1">
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-300 shadow-lg">
                <motion.div
                  initial={{ rotate: -10 }}
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="text-2xl mb-1 text-center"
                >
                  🏆
                </motion.div>
                <div className="text-xs text-yellow-600 font-medium mb-1 text-center">Champion</div>
                <div className="font-bold text-yellow-800 text-center">
                  {tournament.winner}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  const render8PlayerBracket = () => {
    const round1 = tournament.rounds[0];
    const round2 = tournament.rounds[1];
    const round3 = tournament.rounds[2];

    return (
      <div ref={containerRef} className="relative flex items-stretch justify-center gap-12 overflow-x-auto">
        {/* SVG overlay for connector lines */}
        <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
          {connectorLines.map((line) => (
            <line
              key={line.id}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#d4c5a9"
              strokeWidth={2}
            />
          ))}
        </svg>

        {/* Quarterfinals */}
        <div className="flex flex-col flex-shrink-0">
          <div className="text-center mb-2">
            <h3 className="text-sm font-semibold text-charcoal-600">{getRoundName(1, numRounds)}</h3>
          </div>
          <div className="flex flex-col gap-4 flex-1">
            {round1?.matches.map((match, idx) => (
              <div
                key={match.matchId}
                ref={(el) => setCardRef(match.matchId, el)}
                className="w-44"
              >
                <TournamentMatchCard
                  match={match}
                  currentPlayerName={currentPlayerName}
                  tournamentId={tournament.id}
                  players={tournament.players}
                  animationDelay={idx}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Semifinals */}
        <div className="flex flex-col flex-shrink-0">
          <div className="text-center mb-2">
            <h3 className="text-sm font-semibold text-charcoal-600">{getRoundName(2, numRounds)}</h3>
          </div>
          <div className="flex flex-col justify-around flex-1">
            {round2?.matches.map((match, idx) => (
              <div
                key={match.matchId}
                ref={(el) => setCardRef(match.matchId, el)}
                className="w-44 transition-transform duration-200"
                style={{ transform: `translateY(${getCardOffset(match.matchId)}px)` }}
              >
                <TournamentMatchCard
                  match={match}
                  currentPlayerName={currentPlayerName}
                  tournamentId={tournament.id}
                  players={tournament.players}
                  animationDelay={idx + 4}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Finals */}
        <div className="flex flex-col flex-shrink-0">
          <div className="text-center mb-2">
            <h3 className="text-sm font-semibold text-charcoal-600">{getRoundName(3, numRounds)}</h3>
          </div>
          <div className="flex flex-col justify-center flex-1">
            {round3?.matches.map((match, idx) => (
              <div
                key={match.matchId}
                ref={(el) => setCardRef(match.matchId, el)}
                className="w-44 transition-transform duration-200"
                style={{ transform: `translateY(${getCardOffset(match.matchId)}px)` }}
              >
                <TournamentMatchCard
                  match={match}
                  currentPlayerName={currentPlayerName}
                  tournamentId={tournament.id}
                  players={tournament.players}
                  animationDelay={idx + 6}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Winner */}
        {tournament.winner && (
          <motion.div
            ref={(el) => setCardRef('winner', el)}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', delay: 0.5 }}
            className="flex flex-col flex-shrink-0 transition-transform duration-200"
            style={{ transform: `translateY(${getCardOffset('winner')}px)` }}
          >
            <div className="text-center mb-2">
              <h3 className="text-sm font-semibold text-charcoal-600">&nbsp;</h3>
            </div>
            <div className="flex items-center justify-center flex-1">
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-300 shadow-lg">
                <motion.div
                  initial={{ rotate: -10 }}
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="text-2xl mb-1 text-center"
                >
                  🏆
                </motion.div>
                <div className="text-xs text-yellow-600 font-medium mb-1 text-center">Champion</div>
                <div className="font-bold text-yellow-800 text-center">
                  {tournament.winner}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  const renderGenericBracket = () => {
    return (
      <div ref={containerRef} className="relative overflow-x-auto pb-4">
        {/* SVG overlay for connector lines */}
        <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
          {connectorLines.map((line) => (
            <line
              key={line.id}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#d4c5a9"
              strokeWidth={2}
            />
          ))}
        </svg>

        <div className="flex gap-12 min-w-max items-stretch">
          {tournament.rounds.map((round, roundIdx) => (
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

              <div className="flex flex-col gap-4 justify-around flex-1">
                {round.matches.map((match, matchIdx) => (
                  <div
                    key={match.matchId}
                    ref={(el) => setCardRef(match.matchId, el)}
                    className="transition-transform duration-200"
                    style={{ transform: `translateY(${getCardOffset(match.matchId)}px)` }}
                  >
                    <TournamentMatchCard
                      match={match}
                      currentPlayerName={currentPlayerName}
                      tournamentId={tournament.id}
                      players={tournament.players}
                      animationDelay={roundIdx * 2 + matchIdx}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {tournament.winner && (
            <motion.div
              ref={(el) => setCardRef('winner', el)}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', delay: 0.5 }}
              className="flex flex-col justify-center transition-transform duration-200"
              style={{ minWidth: '140px', transform: `translateY(${getCardOffset('winner')}px)` }}
            >
              <div className="text-center">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 border border-yellow-300 shadow-lg">
                  <motion.div
                    initial={{ rotate: -10 }}
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="text-3xl mb-1"
                  >
                    🏆
                  </motion.div>
                  <div className="text-xs text-yellow-600 font-medium mb-1">Champion</div>
                  <div className="font-bold text-lg text-yellow-800">
                    {tournament.winner}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  return renderBracket();
}
