import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flashcard,
  Category,
  Difficulty,
  Film,
  Edition,
  CATEGORIES,
  DIFFICULTIES,
  FILMS,
  EDITIONS,
} from '../types';

interface FlashcardFormProps {
  initialData?: Flashcard;
  onSubmit: (data: FlashcardFormData) => void;
  submitLabel: string;
}

export interface FlashcardFormData {
  question: string;
  answer: string;
  category: Category;
  difficulty: Difficulty;
  film: Film;
  edition: Edition;
  explanation?: string;
  source?: string;
}

export default function FlashcardForm({
  initialData,
  onSubmit,
  submitLabel,
}: FlashcardFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FlashcardFormData>({
    question: initialData?.question ?? '',
    answer: initialData?.answer ?? '',
    category: initialData?.category ?? 'General Trivia',
    difficulty: initialData?.difficulty ?? 'Medium',
    film: initialData?.film ?? 'Trilogy / General',
    edition: initialData?.edition ?? 'Both / General',
    explanation: initialData?.explanation ?? '',
    source: initialData?.source ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.question.trim()) {
      newErrors.question = 'Question is required';
    }

    if (!formData.answer.trim()) {
      newErrors.answer = 'Answer is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit({
      ...formData,
      question: formData.question.trim(),
      answer: formData.answer.trim(),
      explanation: formData.explanation?.trim() || undefined,
      source: formData.source?.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="question" className="label">
          Question <span className="text-red-500">*</span>
        </label>
        <textarea
          id="question"
          value={formData.question}
          onChange={(e) =>
            setFormData({ ...formData, question: e.target.value })
          }
          className={`textarea ${errors.question ? 'border-red-500' : ''}`}
          placeholder="Enter your trivia question..."
          rows={3}
        />
        {errors.question && (
          <p className="text-red-500 text-sm mt-1">{errors.question}</p>
        )}
      </div>

      <div>
        <label htmlFor="answer" className="label">
          Answer <span className="text-red-500">*</span>
        </label>
        <textarea
          id="answer"
          value={formData.answer}
          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
          className={`textarea ${errors.answer ? 'border-red-500' : ''}`}
          placeholder="Enter the answer..."
          rows={2}
        />
        {errors.answer && (
          <p className="text-red-500 text-sm mt-1">{errors.answer}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="film" className="label">
            Film
          </label>
          <select
            id="film"
            value={formData.film}
            onChange={(e) =>
              setFormData({ ...formData, film: e.target.value as Film })
            }
            className="select"
          >
            {FILMS.map((film) => (
              <option key={film} value={film}>
                {film}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="edition" className="label">
            Edition
          </label>
          <select
            id="edition"
            value={formData.edition}
            onChange={(e) =>
              setFormData({ ...formData, edition: e.target.value as Edition })
            }
            className="select"
          >
            {EDITIONS.map((edition) => (
              <option key={edition} value={edition}>
                {edition}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="label">
            Category
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value as Category })
            }
            className="select"
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="difficulty" className="label">
            Difficulty
          </label>
          <select
            id="difficulty"
            value={formData.difficulty}
            onChange={(e) =>
              setFormData({
                ...formData,
                difficulty: e.target.value as Difficulty,
              })
            }
            className="select"
          >
            {DIFFICULTIES.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="explanation" className="label">
          Explanation / Additional Context{' '}
          <span className="text-charcoal-400 font-normal">(Optional)</span>
        </label>
        <textarea
          id="explanation"
          value={formData.explanation}
          onChange={(e) =>
            setFormData({ ...formData, explanation: e.target.value })
          }
          className="textarea"
          placeholder="Any additional context or explanation..."
          rows={2}
        />
      </div>

      <div>
        <label htmlFor="source" className="label">
          Source / Reference{' '}
          <span className="text-charcoal-400 font-normal">(Optional)</span>
        </label>
        <input
          id="source"
          type="text"
          value={formData.source}
          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
          className="input"
          placeholder="e.g., DVD commentary, interview..."
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button type="submit" className="btn-primary btn-lg flex-1 sm:flex-initial">
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn-secondary btn-lg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
