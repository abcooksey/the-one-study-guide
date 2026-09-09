import { useState, useEffect, useCallback } from 'react';
import { Profile } from '../types';
import {
  getFlaggedFlashcardIds,
  incrementCorrectStreak,
  resetCorrectStreak,
} from '../lib/practiceFlagsFirestore';

interface UseQuestionReviewReturn {
  flaggedCardIds: Set<string>;
  isLoadingFlags: boolean;
  reloadFlags: () => Promise<void>;
  handleCorrectAnswer: (flashcardId: string) => Promise<void>;
  handleIncorrectAnswer: (flashcardId: string) => Promise<void>;
}

/**
 * Hook for managing practice flags in the question review and session flow
 *
 * Usage:
 * - Load flagged card IDs before starting a weakness mode session
 * - Track correct/incorrect answers to update flag streaks
 * - Flag is removed after 2 consecutive correct answers
 */
export function useQuestionReview(playerName: string | null): UseQuestionReviewReturn {
  const [flaggedCardIds, setFlaggedCardIds] = useState<Set<string>>(new Set());
  const [isLoadingFlags, setIsLoadingFlags] = useState(false);

  // Load flags on mount and when player changes
  const reloadFlags = useCallback(async () => {
    if (!playerName) {
      setFlaggedCardIds(new Set());
      return;
    }

    setIsLoadingFlags(true);
    try {
      const ids = await getFlaggedFlashcardIds(playerName);
      setFlaggedCardIds(ids);
    } catch (error) {
      console.error('Error loading practice flags:', error);
    } finally {
      setIsLoadingFlags(false);
    }
  }, [playerName]);

  useEffect(() => {
    reloadFlags();
  }, [reloadFlags]);

  // Handle correct answer - increment streak, remove flag if streak reaches 2
  const handleCorrectAnswer = useCallback(async (flashcardId: string) => {
    if (!playerName) return;

    // Only process if this card is flagged
    if (!flaggedCardIds.has(flashcardId)) return;

    const result = await incrementCorrectStreak(playerName, flashcardId);

    if (result.removed) {
      // Flag was removed - update local state
      setFlaggedCardIds((prev) => {
        const next = new Set(prev);
        next.delete(flashcardId);
        return next;
      });
    }
  }, [playerName, flaggedCardIds]);

  // Handle incorrect answer - reset streak
  const handleIncorrectAnswer = useCallback(async (flashcardId: string) => {
    if (!playerName) return;

    // Only process if this card is flagged
    if (!flaggedCardIds.has(flashcardId)) return;

    await resetCorrectStreak(playerName, flashcardId);
  }, [playerName, flaggedCardIds]);

  return {
    flaggedCardIds,
    isLoadingFlags,
    reloadFlags,
    handleCorrectAnswer,
    handleIncorrectAnswer,
  };
}

/**
 * Hook for loading practice flags for a given profile
 * Returns the flagged card IDs as a Set for use with startNewSession
 */
export function usePracticeFlags(profile: Profile | null): {
  flaggedCardIds: Set<string>;
  isLoading: boolean;
} {
  const [flaggedCardIds, setFlaggedCardIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadFlags = async () => {
      if (!profile || profile === 'Guest') {
        setFlaggedCardIds(new Set());
        return;
      }

      setIsLoading(true);
      try {
        const ids = await getFlaggedFlashcardIds(profile);
        setFlaggedCardIds(ids);
      } catch (error) {
        console.error('Error loading practice flags:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFlags();
  }, [profile]);

  return { flaggedCardIds, isLoading };
}

export default useQuestionReview;
