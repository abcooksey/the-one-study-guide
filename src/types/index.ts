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

export const PROFILES: Profile[] = ['Alex', 'Angus', 'Guest'];

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
}

export type AttemptStatus = 'correct' | 'incorrect' | 'unanswered';

export interface SessionAttempt {
  flashcardId: string;
  status: AttemptStatus;
  answeredAt?: string;
}

export interface Session {
  id: string;
  profile: Profile;
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
