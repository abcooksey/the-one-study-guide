import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import FlashcardForm, { FlashcardFormData } from '../components/FlashcardForm';

export default function AddFlashcard() {
  const navigate = useNavigate();
  const addFlashcard = useAppStore((state) => state.addFlashcard);

  const handleSubmit = (data: FlashcardFormData) => {
    addFlashcard({
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
          Add New Flashcard
        </h1>
        <p className="text-charcoal-600 mt-1">
          Create a custom trivia question for your library
        </p>
      </div>

      <div className="card">
        <FlashcardForm onSubmit={handleSubmit} submitLabel="Add Flashcard" />
      </div>
    </div>
  );
}
