// Tournament Mode Types
// Bracket-style competition for 4, 8, or 16 players

export type TournamentStatus = 'registration' | 'active' | 'waiting_for_players' | 'completed';
export type TournamentSize = 4 | 8 | 16;
export type MatchStatus = 'pending' | 'active' | 'completed';

export interface Tournament {
  id: string;
  name: string;
  hostName: string;
  status: TournamentStatus;
  createdAt: string;

  // Configuration
  maxPlayers: TournamentSize;
  questionsPerRound: number;       // Default 20

  // Participants
  players: TournamentPlayer[];

  // Bracket structure
  rounds: TournamentRound[];
  currentRound: number;

  // Results
  winner?: string;
  finalRankings?: string[];

  expiresAt: string;               // TTL for cleanup
}

export interface TournamentPlayer {
  name: string;
  emoji: string;
  seed: number;                    // Initial seeding (1 = top seed)
  eliminated: boolean;
  eliminatedInRound?: number;
  forfeited?: boolean;             // True if player voluntarily left the tournament
  // Presence tracking
  isConnected?: boolean;           // Whether player is currently on tournament page
  lastHeartbeat?: string;          // ISO timestamp of last heartbeat
  // Pick Your Champion - who eliminated players are rooting for
  rootingFor?: string;             // Name of player they're cheering for (just for fun!)
}

export interface TournamentRound {
  roundNumber: number;             // 1 = first round, etc.
  matches: TournamentMatch[];
}

export interface TournamentMatch {
  matchId: string;
  player1Name: string | null;      // null = bye or TBD
  player2Name: string | null;
  battleCode?: string;             // Links to battles collection
  winner?: string;
  status: MatchStatus;
  // For bracket positioning
  roundNumber: number;
  matchIndex: number;              // Position within round
}

// For creating a tournament
export interface CreateTournamentInput {
  name: string;
  hostName: string;
  hostEmoji: string;
  maxPlayers: TournamentSize;
  questionsPerRound?: number;
}

// For joining a tournament
export interface JoinTournamentInput {
  name: string;
  emoji: string;
}
