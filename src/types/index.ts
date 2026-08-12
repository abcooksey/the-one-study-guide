export type Film =
  | 'The Fellowship of the Ring'
  | 'The Two Towers'
  | 'The Return of the King'
  | 'Trilogy / General';

export type Edition =
  | 'Theatrical'
  | 'Extended'
  | 'Both / General';

export type Category =
  | 'Characters'
  | 'Cast'
  | 'Quotes'
  | 'Behind the Scenes'
  | 'Awards'
  | 'Production'
  | 'Music'
  | 'Filming'
  | 'Costumes & Props'
  | 'Locations'
  | 'Visual Effects'
  | 'General Trivia';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type Profile = 'Alex' | 'Angus' | 'Guest';

export type FlagReason = 'gives_away_answer' | 'incorrect_answer' | 'other';

export const FLAG_REASONS: { value: FlagReason; label: string }[] = [
  { value: 'gives_away_answer', label: 'Question gives away the answer' },
  { value: 'incorrect_answer', label: 'Answer is incorrect' },
  { value: 'other', label: 'Other issue' },
];

export interface FlashcardFlag {
  reason: FlagReason;
  description?: string;
  flaggedAt: string;
  flaggedBy: Profile;
}

export const PROFILES: Profile[] = ['Alex', 'Angus', 'Guest'];

export type DifficultyMode = 'progressive' | 'warmup' | 'random' | 'weakness';

export const DIFFICULTY_MODES: { value: DifficultyMode; label: string; description: string }[] = [
  {
    value: 'progressive',
    label: 'Progressive',
    description: 'Equal mix starting with easy, then medium, then hard questions',
  },
  {
    value: 'warmup',
    label: 'Warm Up',
    description: '5 easy questions to start, then a random mix of all difficulties',
  },
  {
    value: 'random',
    label: 'Random Mix',
    description: 'Completely random mix of easy, medium, and hard questions',
  },
  {
    value: 'weakness',
    label: 'Practice Weak Areas',
    description: 'Focus on categories and films you struggle with most',
  },
];

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category: Category;
  difficulty: Difficulty;
  film: Film;
  edition: Edition;
  explanation?: string;
  source?: string;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
  flag?: FlashcardFlag;
}

export type AttemptStatus = 'correct' | 'incorrect' | 'unanswered' | 'flagged';

export interface SessionAttempt {
  flashcardId: string;
  status: AttemptStatus;
  answeredAt?: string;
}

export interface Session {
  id: string;
  profile: Profile;
  difficultyMode: DifficultyMode;
  startedAt: string;
  completedAt?: string;
  attempts: SessionAttempt[];
  isComplete: boolean;
}

export interface PerformanceStats {
  totalQuestionsAnswered: number;
  totalCorrect: number;
  totalIncorrect: number;
  completedRounds: number;
  overallAccuracy: number;
  lastRoundAccuracy?: number;
  accuracyTrend: number[];
}

export interface StatBreakdown {
  name: string;
  correct: number;
  total: number;
  accuracy: number;
}

export interface DetailedStats {
  byFilm: StatBreakdown[];
  byCategory: StatBreakdown[];
}

export const FILMS: Film[] = [
  'The Fellowship of the Ring',
  'The Two Towers',
  'The Return of the King',
  'Trilogy / General',
];

export const EDITIONS: Edition[] = [
  'Theatrical',
  'Extended',
  'Both / General',
];

export const CATEGORIES: Category[] = [
  'Characters',
  'Cast',
  'Quotes',
  'Behind the Scenes',
  'Awards',
  'Production',
  'Music',
  'Filming',
  'Costumes & Props',
  'Locations',
  'Visual Effects',
  'General Trivia',
];

export const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];

// Battle types
export * from './battle';

// Battle player types
export * from './battlePlayer';
