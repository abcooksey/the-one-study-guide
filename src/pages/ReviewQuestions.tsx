import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store';
import {
  PendingQuestion,
  QuestionImport,
  Category,
  Difficulty,
  Film,
  Edition,
  CATEGORIES,
  DIFFICULTIES,
  FILMS,
  EDITIONS,
} from '../types';
import {
  subscribeToPendingQuestions,
  approvePendingQuestion,
  rejectPendingQuestion,
  deletePendingQuestion,
  updatePendingQuestion,
  bulkImportPendingQuestions,
  pendingQuestionToFlashcard,
  calculateSimilarity,
} from '../lib/pendingQuestionFirestore';
import ConfirmDialog from '../components/ConfirmDialog';

type ViewMode = 'list' | 'review' | 'import';

export default function ReviewQuestions() {
  const flashcards = useAppStore((state) => state.flashcards);
  const addFlashcard = useAppStore((state) => state.addFlashcard);

  const [pendingQuestions, setPendingQuestions] = useState<PendingQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<PendingQuestion | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  // Subscribe to pending questions
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToPendingQuestions((questions) => {
      setPendingQuestions(questions);
      setIsLoading(false);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Current question being reviewed
  const currentQuestion = pendingQuestions[currentIndex] || null;

  // Find similar existing questions for current question
  const similarQuestions = useMemo(() => {
    if (!currentQuestion) return [];

    return flashcards
      .map((fc) => ({
        flashcard: fc,
        score: calculateSimilarity(currentQuestion.question, fc.question),
      }))
      .filter((item) => item.score >= 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [currentQuestion, flashcards]);

  // Handle approve
  const handleApprove = async () => {
    if (!currentQuestion) return;

    const questionToAdd = isEditing && editData ? editData : currentQuestion;

    // Update in Firestore if edited
    if (isEditing && editData) {
      await updatePendingQuestion(currentQuestion.id, editData);
    }

    // Mark as approved
    await approvePendingQuestion(currentQuestion.id);

    // Add to flashcard library
    const newFlashcard = pendingQuestionToFlashcard(questionToAdd);
    addFlashcard({
      question: newFlashcard.question,
      answer: newFlashcard.answer,
      category: newFlashcard.category,
      difficulty: newFlashcard.difficulty,
      film: newFlashcard.film,
      edition: newFlashcard.edition,
      explanation: newFlashcard.explanation,
      source: newFlashcard.source,
    });

    // Reset editing state
    setIsEditing(false);
    setEditData(null);

    // Move to next question or back to list
    if (currentIndex >= pendingQuestions.length - 1) {
      setCurrentIndex(0);
      if (pendingQuestions.length <= 1) {
        setViewMode('list');
      }
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!currentQuestion) return;

    await rejectPendingQuestion(currentQuestion.id);
    await deletePendingQuestion(currentQuestion.id);

    setRejectDialogOpen(false);
    setIsEditing(false);
    setEditData(null);

    // Move to next or back to list
    if (currentIndex >= pendingQuestions.length - 1) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
      if (pendingQuestions.length <= 1) {
        setViewMode('list');
      }
    }
  };

  // Handle skip
  const handleSkip = () => {
    if (currentIndex < pendingQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
    setIsEditing(false);
    setEditData(null);
  };

  // Start editing
  const startEditing = () => {
    if (currentQuestion) {
      setEditData({ ...currentQuestion });
      setIsEditing(true);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditData(null);
  };

  // Handle import
  const handleImport = async () => {
    setImportError('');
    setImportSuccess('');

    try {
      const questions: QuestionImport[] = JSON.parse(importText);

      if (!Array.isArray(questions)) {
        setImportError('Import data must be an array of questions');
        return;
      }

      // Validate each question
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question || !q.answer || !q.category || !q.difficulty || !q.film || !q.edition) {
          setImportError(`Question ${i + 1} is missing required fields (question, answer, category, difficulty, film, edition)`);
          return;
        }
      }

      const count = await bulkImportPendingQuestions(questions, flashcards);
      if (count > 0) {
        setImportSuccess(`Successfully imported ${count} questions to review queue`);
        setImportText('');
        setTimeout(() => setViewMode('list'), 1500);
      } else {
        setImportError('Import failed. Check browser console for details. Make sure Firebase is configured correctly.');
      }
    } catch (e) {
      console.error('Import error:', e);
      setImportError('Invalid JSON format. Please check your input.');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-parchment-200 rounded mb-4" />
          <div className="h-4 w-32 bg-parchment-200 rounded mb-8" />
          <div className="card h-64" />
        </div>
      </div>
    );
  }

  // Import view
  if (viewMode === 'import') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">
              Import Questions
            </h1>
            <p className="text-charcoal-600 mt-1">
              Paste JSON array of questions to add to review queue
            </p>
          </div>
          <button onClick={() => setViewMode('list')} className="btn-secondary">
            Back to List
          </button>
        </div>

        <div className="card">
          <div className="mb-4">
            <label className="label">Questions JSON</label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="textarea font-mono text-sm"
              rows={15}
              placeholder={`[
  {
    "question": "Your question here?",
    "answer": "The answer",
    "category": "Characters",
    "difficulty": "Medium",
    "film": "The Fellowship of the Ring",
    "edition": "Both / General",
    "explanation": "Optional explanation",
    "source": "Optional source"
  }
]`}
            />
          </div>

          {importError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {importError}
            </div>
          )}

          {importSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {importSuccess}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handleImport} className="btn-primary" disabled={!importText.trim()}>
              Import Questions
            </button>
            <button onClick={() => setViewMode('list')} className="btn-secondary">
              Cancel
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-parchment-200">
            <h3 className="font-medium text-charcoal-900 mb-2">Valid Categories:</h3>
            <p className="text-sm text-charcoal-600 mb-4">{CATEGORIES.join(', ')}</p>

            <h3 className="font-medium text-charcoal-900 mb-2">Valid Difficulties:</h3>
            <p className="text-sm text-charcoal-600 mb-4">{DIFFICULTIES.join(', ')}</p>

            <h3 className="font-medium text-charcoal-900 mb-2">Valid Films:</h3>
            <p className="text-sm text-charcoal-600 mb-4">{FILMS.join(', ')}</p>

            <h3 className="font-medium text-charcoal-900 mb-2">Valid Editions:</h3>
            <p className="text-sm text-charcoal-600">{EDITIONS.join(', ')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Review view
  if (viewMode === 'review' && currentQuestion) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">
              Review Questions
            </h1>
            <p className="text-charcoal-600 mt-1">
              Question {currentIndex + 1} of {pendingQuestions.length}
            </p>
          </div>
          <button onClick={() => setViewMode('list')} className="btn-secondary">
            Back to List
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main review card */}
          <div className="lg:col-span-2">
            <div className="card">
              {isEditing && editData ? (
                // Edit form
                <div className="space-y-4">
                  <div>
                    <label className="label">Question</label>
                    <textarea
                      value={editData.question}
                      onChange={(e) => setEditData({ ...editData, question: e.target.value })}
                      className="textarea"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="label">Answer</label>
                    <textarea
                      value={editData.answer}
                      onChange={(e) => setEditData({ ...editData, answer: e.target.value })}
                      className="textarea"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Category</label>
                      <select
                        value={editData.category}
                        onChange={(e) => setEditData({ ...editData, category: e.target.value as Category })}
                        className="select"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Difficulty</label>
                      <select
                        value={editData.difficulty}
                        onChange={(e) => setEditData({ ...editData, difficulty: e.target.value as Difficulty })}
                        className="select"
                      >
                        {DIFFICULTIES.map((diff) => (
                          <option key={diff} value={diff}>{diff}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Film</label>
                      <select
                        value={editData.film}
                        onChange={(e) => setEditData({ ...editData, film: e.target.value as Film })}
                        className="select"
                      >
                        {FILMS.map((film) => (
                          <option key={film} value={film}>{film}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Edition</label>
                      <select
                        value={editData.edition}
                        onChange={(e) => setEditData({ ...editData, edition: e.target.value as Edition })}
                        className="select"
                      >
                        {EDITIONS.map((ed) => (
                          <option key={ed} value={ed}>{ed}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="label">Explanation (optional)</label>
                    <textarea
                      value={editData.explanation || ''}
                      onChange={(e) => setEditData({ ...editData, explanation: e.target.value })}
                      className="textarea"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="label">Source (optional)</label>
                    <input
                      value={editData.source || ''}
                      onChange={(e) => setEditData({ ...editData, source: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
              ) : (
                // Read-only view
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brass-100 text-brass-800">
                      {currentQuestion.category}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        currentQuestion.difficulty === 'Easy'
                          ? 'bg-green-100 text-green-800'
                          : currentQuestion.difficulty === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {currentQuestion.difficulty}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-parchment-200 text-charcoal-700">
                      {currentQuestion.film}
                    </span>
                  </div>

                  <h2 className="text-xl font-medium text-charcoal-900 mb-4">
                    {currentQuestion.question}
                  </h2>

                  <div className="bg-forest-50 border border-forest-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-charcoal-500 mb-1">Answer:</p>
                    <p className="text-forest-800 font-medium">{currentQuestion.answer}</p>
                  </div>

                  {currentQuestion.explanation && (
                    <div className="bg-parchment-50 border border-parchment-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-charcoal-500 mb-1">Explanation:</p>
                      <p className="text-charcoal-700">{currentQuestion.explanation}</p>
                    </div>
                  )}

                  {currentQuestion.source && (
                    <p className="text-sm text-charcoal-500">
                      <span className="font-medium">Source:</span> {currentQuestion.source}
                    </p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-parchment-200">
                {isEditing ? (
                  <>
                    <button onClick={handleApprove} className="btn-primary">
                      Save & Approve
                    </button>
                    <button onClick={cancelEditing} className="btn-secondary">
                      Cancel Edit
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={handleApprove} className="btn-primary">
                      Approve
                    </button>
                    <button onClick={startEditing} className="btn-secondary">
                      Edit
                    </button>
                    <button onClick={() => setRejectDialogOpen(true)} className="btn-ghost text-red-600 hover:bg-red-50">
                      Reject
                    </button>
                    <button onClick={handleSkip} className="btn-ghost ml-auto">
                      Skip
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="btn-ghost btn-sm"
              >
                Previous
              </button>
              <div className="flex-1 h-2 bg-parchment-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-forest-500 transition-all"
                  style={{ width: `${((currentIndex + 1) / pendingQuestions.length) * 100}%` }}
                />
              </div>
              <button
                onClick={() => setCurrentIndex(Math.min(pendingQuestions.length - 1, currentIndex + 1))}
                disabled={currentIndex === pendingQuestions.length - 1}
                className="btn-ghost btn-sm"
              >
                Next
              </button>
            </div>
          </div>

          {/* Similar questions sidebar */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="font-medium text-charcoal-900 mb-4">
                Potential Duplicates
              </h3>

              {similarQuestions.length === 0 ? (
                <p className="text-charcoal-500 text-sm">
                  No similar questions found in library.
                </p>
              ) : (
                <div className="space-y-4">
                  {similarQuestions.map(({ flashcard, score }) => (
                    <div key={flashcard.id} className="p-3 bg-parchment-50 rounded-lg border border-parchment-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-charcoal-500">
                          {Math.round(score * 100)}% similar
                        </span>
                        <span className="text-xs text-brass-600">{flashcard.category}</span>
                      </div>
                      <p className="text-sm text-charcoal-900 mb-1">{flashcard.question}</p>
                      <p className="text-xs text-charcoal-600">A: {flashcard.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reject confirmation dialog */}
        <ConfirmDialog
          isOpen={rejectDialogOpen}
          title="Reject Question?"
          message="Are you sure you want to reject this question? It will be removed from the review queue."
          confirmLabel="Reject"
          cancelLabel="Cancel"
          confirmVariant="danger"
          onConfirm={handleReject}
          onCancel={() => setRejectDialogOpen(false)}
        />
      </div>
    );
  }

  // List view (default)
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">
            Review Questions
          </h1>
          <p className="text-charcoal-600 mt-1">
            {pendingQuestions.length} questions awaiting review
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setViewMode('import')} className="btn-secondary">
            Import Questions
          </button>
          {pendingQuestions.length > 0 && (
            <button onClick={() => setViewMode('review')} className="btn-primary">
              Start Review
            </button>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="mb-6">
        <Link to="/library" className="text-forest-600 hover:text-forest-700 text-sm">
          View Flashcard Library ({flashcards.length} questions)
        </Link>
      </div>

      {pendingQuestions.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-charcoal-900 mb-2">
            No Questions to Review
          </h3>
          <p className="text-charcoal-600 mb-6">
            Import questions to start reviewing them before adding to your library.
          </p>
          <button onClick={() => setViewMode('import')} className="btn-primary">
            Import Questions
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingQuestions.map((question, index) => (
            <div key={question.id} className="card hover:shadow-card-hover transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brass-100 text-brass-800">
                      {question.category}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        question.difficulty === 'Easy'
                          ? 'bg-green-100 text-green-800'
                          : question.difficulty === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {question.difficulty}
                    </span>
                  </div>

                  <h3 className="font-medium text-charcoal-900 mb-1">
                    {question.question}
                  </h3>
                  <p className="text-charcoal-600 text-sm">{question.answer}</p>

                  <div className="flex items-center gap-2 mt-2 text-xs text-charcoal-400">
                    <span>{question.film}</span>
                    {question.edition !== 'Both / General' && (
                      <>
                        <span>•</span>
                        <span>{question.edition}</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCurrentIndex(index);
                    setViewMode('review');
                  }}
                  className="btn-secondary btn-sm"
                >
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
