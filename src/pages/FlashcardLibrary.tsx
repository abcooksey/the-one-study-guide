import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store';
import ConfirmDialog from '../components/ConfirmDialog';
import { CATEGORIES, FILMS, DIFFICULTIES, Category, Film, Difficulty } from '../types';

export default function FlashcardLibrary() {
  const flashcards = useAppStore((state) => state.flashcards);
  const deleteFlashcard = useAppStore((state) => state.deleteFlashcard);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [filmFilter, setFilmFilter] = useState<Film | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredFlashcards = useMemo(() => {
    return flashcards.filter((card) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          card.question.toLowerCase().includes(query) ||
          card.answer.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && card.category !== categoryFilter) {
        return false;
      }

      // Film filter
      if (filmFilter !== 'all' && card.film !== filmFilter) {
        return false;
      }

      // Difficulty filter
      if (difficultyFilter !== 'all' && card.difficulty !== difficultyFilter) {
        return false;
      }

      return true;
    });
  }, [flashcards, searchQuery, categoryFilter, filmFilter, difficultyFilter]);

  const handleDelete = () => {
    if (deleteId) {
      deleteFlashcard(deleteId);
      setDeleteId(null);
    }
  };

  const cardToDelete = deleteId
    ? flashcards.find((f) => f.id === deleteId)
    : null;

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setFilmFilter('all');
    setDifficultyFilter('all');
  };

  const hasActiveFilters =
    searchQuery ||
    categoryFilter !== 'all' ||
    filmFilter !== 'all' ||
    difficultyFilter !== 'all';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">
            Flashcard Library
          </h1>
          <p className="text-charcoal-600 mt-1">
            {flashcards.length} total questions
          </p>
        </div>

        <Link to="/add" className="btn-primary">
          + Add Flashcard
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label htmlFor="search" className="sr-only">
              Search questions
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="sr-only">
              Filter by category
            </label>
            <select
              id="category"
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as Category | 'all')
              }
              className="select"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Film */}
          <div>
            <label htmlFor="film" className="sr-only">
              Filter by film
            </label>
            <select
              id="film"
              value={filmFilter}
              onChange={(e) => setFilmFilter(e.target.value as Film | 'all')}
              className="select"
            >
              <option value="all">All Films</option>
              {FILMS.map((film) => (
                <option key={film} value={film}>
                  {film}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label htmlFor="difficulty" className="sr-only">
              Filter by difficulty
            </label>
            <select
              id="difficulty"
              value={difficultyFilter}
              onChange={(e) =>
                setDifficultyFilter(e.target.value as Difficulty | 'all')
              }
              className="select"
            >
              <option value="all">All Difficulties</option>
              {DIFFICULTIES.map((diff) => (
                <option key={diff} value={diff}>
                  {diff}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-parchment-200">
            <span className="text-sm text-charcoal-600">
              Showing {filteredFlashcards.length} of {flashcards.length} cards
            </span>
            <button
              onClick={clearFilters}
              className="text-sm text-forest-600 hover:text-forest-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Cards List */}
      {filteredFlashcards.length === 0 ? (
        <div className="card text-center py-12">
          {hasActiveFilters ? (
            <>
              <p className="text-charcoal-600 mb-2">
                No flashcards match your filters
              </p>
              <button
                onClick={clearFilters}
                className="text-forest-600 hover:text-forest-700 font-medium"
              >
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p className="text-charcoal-600 mb-4">
                No flashcards in your library yet
              </p>
              <Link to="/add" className="btn-primary">
                Add Your First Flashcard
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFlashcards.map((card) => (
            <div
              key={card.id}
              className="card hover:shadow-card-hover transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brass-100 text-brass-800">
                      {card.category}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        card.difficulty === 'Easy'
                          ? 'bg-green-100 text-green-800'
                          : card.difficulty === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {card.difficulty}
                    </span>
                    {card.isCustom && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-forest-100 text-forest-800">
                        Custom
                      </span>
                    )}
                  </div>

                  <h3 className="font-medium text-charcoal-900 mb-1">
                    {card.question}
                  </h3>
                  <p className="text-charcoal-600 text-sm">{card.answer}</p>

                  <div className="flex items-center gap-2 mt-2 text-xs text-charcoal-400">
                    <span>{card.film}</span>
                    {card.edition !== 'Both / General' && (
                      <>
                        <span>•</span>
                        <span>{card.edition}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2 shrink-0">
                  <Link
                    to={`/edit/${card.id}`}
                    className="btn-secondary btn-sm flex-1 sm:flex-initial"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => setDeleteId(card.id)}
                    className="btn-ghost btn-sm text-red-600 hover:bg-red-50 flex-1 sm:flex-initial"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Delete Flashcard?"
        message={
          cardToDelete ? (
            <div>
              <p className="mb-2">
                Are you sure you want to delete this flashcard?
              </p>
              <div className="bg-parchment-100 rounded p-3 text-sm">
                <strong>Q:</strong> {cardToDelete.question}
              </div>
            </div>
          ) : (
            'Are you sure you want to delete this flashcard?'
          )
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
