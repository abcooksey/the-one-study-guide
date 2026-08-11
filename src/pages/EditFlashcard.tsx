import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAppStore } from '../store';
import FlashcardForm, { FlashcardFormData } from '../components/FlashcardForm';

export default function EditFlashcard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getFlashcardById = useAppStore((state) => state.getFlashcardById);
  const updateFlashcard = useAppStore((state) => state.updateFlashcard);

  const flashcard = id ? getFlashcardById(id) : undefined;

  useEffect(() => {
    if (!flashcard && id) {
      // Card not found, redirect to library
      navigate('/library');
    }
  }, [flashcard, id, navigate]);

  if (!flashcard) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-charcoal-600 mb-4">Flashcard not found</p>
        <Link to="/library" className="btn-primary">
          Return to Library
        </Link>
      </div>
    );
  }

  const handleSubmit = (data: FlashcardFormData) => {
    updateFlashcard(flashcard.id, {
      question: data.question,
      answer: data.answer,
      category: data.category,
      difficulty: data.difficulty,
      film: data.film,
      edition: data.edition,
      explanation: data.explanation,
      source: data.source,
    });

    navigate('/library');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">
          Edit Flashcard
        </h1>
        <p className="text-charcoal-600 mt-1">
          Update this trivia question
        </p>
      </div>

      <div className="card">
        <FlashcardForm
          initialData={flashcard}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
