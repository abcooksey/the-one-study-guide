// Pending Question Types
// Questions awaiting review before being added to the main library

import { Category, Difficulty, Film, Edition } from './index';

export type PendingQuestionStatus = 'pending' | 'approved' | 'rejected';

export interface PendingQuestion {
  id: string;
  question: string;
  answer: string;
  category: Category;
  difficulty: Difficulty;
  film: Film;
  edition: Edition;
  explanation?: string;
  source?: string;

  // Review metadata
  status: PendingQuestionStatus;
  similarQuestionIds?: string[];  // IDs of similar existing questions
  similarityScores?: number[];    // Corresponding similarity scores
  createdAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface SimilarQuestion {
  id: string;
  question: string;
  answer: string;
  similarityScore: number;
}

// For importing questions in bulk
export interface QuestionImport {
  question: string;
  answer: string;
  category: Category;
  difficulty: Difficulty;
  film: Film;
  edition: Edition;
  explanation?: string;
  source?: string;
}
