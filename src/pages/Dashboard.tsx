import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store';
import ProfileSelector from '../components/ProfileSelector';
import { getOverallTrend } from '../utils/stats';
import { Profile, PerformanceStats } from '../types';

function ProfileStatsCard({
  name,
  emoji,
  stats,
}: {
  name: string;
  emoji: string;
  stats: PerformanceStats;
}) {
  const trend = getOverallTrend(stats);

  if (stats.completedRounds === 0) {
    return (
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{emoji}</span>
          <h3 className="font-serif font-bold text-lg text-charcoal-900">
            {name}
          </h3>
        </div>
        <p className="text-charcoal-500 text-sm">No rounds completed yet</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{emoji}</span>
        <h3 className="font-serif font-bold text-lg text-charcoal-900">
          {name}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <div
            className={`text-2xl font-bold ${
              stats.overallAccuracy >= 70
                ? 'text-green-600'
                : stats.overallAccuracy >= 50
                ? 'text-brass-600'
                : 'text-red-600'
            }`}
          >
            {stats.overallAccuracy}%
          </div>
          <div className="text-xs text-charcoal-500">Accuracy</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-charcoal-900">
            {stats.completedRounds}
          </div>
          <div className="text-xs text-charcoal-500">Rounds</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-charcoal-600">
          {stats.totalCorrect} / {stats.totalQuestionsAnswered} correct
        </span>
        {trend !== 'insufficient' && (
          <span
            className={
              trend === 'improving'
                ? 'text-green-600'
                : trend === 'declining'
                ? 'text-red-600'
                : 'text-charcoal-500'
            }
          >
            {trend === 'improving' && '↑'}
            {trend === 'declining' && '↓'}
            {trend === 'stable' && '→'}
          </span>
        )}
      </div>

      {/* Mini trend chart */}
      {stats.accuracyTrend.length > 1 && (
        <div className="mt-4 flex items-end gap-0.5 h-8">
          {stats.accuracyTrend.slice(-8).map((accuracy, index) => (
            <div
              key={index}
              className="flex-1 bg-forest-400 rounded-t"
              style={{ height: `${accuracy}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [showProfileSelector, setShowProfileSelector] = useState(false);

  const flashcards = useAppStore((state) => state.flashcards);
  const startNewSession = useAppStore((state) => state.startNewSession);
  const getPerformanceStats = useAppStore((state) => state.getPerformanceStats);
  const currentSession = useAppStore((state) => state.currentSession);

  const alexStats = getPerformanceStats('Alex');
  const angusStats = getPerformanceStats('Angus');
  const hasEnoughCards = flashcards.length >= 20;

  const handleStartClick = () => {
    setShowProfileSelector(true);
  };

  const handleProfileSelect = (profile: Profile) => {
    setShowProfileSelector(false);
    const success = startNewSession(profile);
    if (success) {
      navigate('/session');
    }
  };

  const handleResumeSession = () => {
    navigate('/session');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Hero Section */}
      <div className="text-center mb-10 sm:mb-16">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-charcoal-900 mb-4">
          Test Your Knowledge
        </h1>
        <p className="text-lg sm:text-xl text-charcoal-600 max-w-2xl mx-auto">
          Challenge yourself with trivia from Peter Jackson's Lord of the Rings trilogy
        </p>
      </div>

      {/* Main Action */}
      <div className="flex flex-col items-center mb-12 sm:mb-16">
        {currentSession && !currentSession.isComplete ? (
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              onClick={handleResumeSession}
              className="btn-brass btn-lg text-lg px-8 py-4 shadow-lg hover:shadow-xl"
            >
              Resume Session ({currentSession.profile})
            </button>
            <button
              onClick={handleStartClick}
              disabled={!hasEnoughCards}
              className="btn-secondary btn-lg"
            >
              Start New Round
            </button>
          </div>
        ) : (
          <button
            onClick={handleStartClick}
            disabled={!hasEnoughCards}
            className="btn-brass btn-lg text-lg px-8 py-4 shadow-lg hover:shadow-xl"
          >
            Start 20-Question Round
          </button>
        )}

        {!hasEnoughCards && (
          <p className="mt-4 text-red-600 text-sm">
            You need at least 20 flashcards to start a round.{' '}
            <Link to="/add" className="underline">
              Add more cards
            </Link>
          </p>
        )}

        <p className="mt-3 text-charcoal-500 text-sm">
          {flashcards.length} questions in library
        </p>
      </div>

      {/* Profile Stats */}
      <div className="mb-12">
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-charcoal-900 mb-6 text-center sm:text-left">
          Player Progress
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ProfileStatsCard name="Alex" emoji="👑" stats={alexStats} />
          <ProfileStatsCard name="Angus" emoji="⚔️" stats={angusStats} />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-charcoal-900 mb-6 text-center sm:text-left">
          Question Library
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/add"
            className="card hover:shadow-card-hover transition-shadow text-center group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              +
            </div>
            <h3 className="font-medium text-charcoal-900">Add Flashcard</h3>
            <p className="text-sm text-charcoal-500 mt-1">
              Create your own trivia questions
            </p>
          </Link>

          <Link
            to="/library"
            className="card hover:shadow-card-hover transition-shadow text-center group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              📚
            </div>
            <h3 className="font-medium text-charcoal-900">Browse Library</h3>
            <p className="text-sm text-charcoal-500 mt-1">
              View and manage all {flashcards.length} questions
            </p>
          </Link>

          <div className="card text-center bg-parchment-50">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-medium text-charcoal-900">Categories</h3>
            <div className="flex flex-wrap gap-1 mt-2 justify-center">
              {Array.from(new Set(flashcards.map((f) => f.category)))
                .slice(0, 5)
                .map((cat) => (
                  <span
                    key={cat}
                    className="text-xs bg-parchment-200 text-charcoal-600 px-2 py-0.5 rounded"
                  >
                    {cat}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Selector Modal */}
      <ProfileSelector
        isOpen={showProfileSelector}
        onSelect={handleProfileSelect}
        onCancel={() => setShowProfileSelector(false)}
      />
    </div>
  );
}
