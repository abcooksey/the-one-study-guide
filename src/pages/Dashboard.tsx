import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store';
import ProfileSelector from '../components/ProfileSelector';
import DifficultyModeSelector from '../components/DifficultyModeSelector';
import { getOverallTrend } from '../utils/stats';
import { Profile, PerformanceStats, DifficultyMode, DetailedStats, StatBreakdown } from '../types';

function StatBar({ stat }: { stat: StatBreakdown }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-charcoal-700 truncate pr-2">{stat.name}</span>
        <span className={`font-medium ${
          stat.accuracy >= 70
            ? 'text-green-600'
            : stat.accuracy >= 50
            ? 'text-brass-600'
            : 'text-red-600'
        }`}>
          {stat.accuracy}%
        </span>
      </div>
      <div className="h-2 bg-parchment-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            stat.accuracy >= 70
              ? 'bg-green-500'
              : stat.accuracy >= 50
              ? 'bg-brass-500'
              : 'bg-red-500'
          }`}
          style={{ width: `${stat.accuracy}%` }}
        />
      </div>
      <div className="text-xs text-charcoal-400 mt-0.5">
        {stat.correct}/{stat.total} correct
      </div>
    </div>
  );
}

function ProfileStatsCard({
  name,
  emoji,
  stats,
  detailedStats,
  onPracticeWeakAreas,
}: {
  name: string;
  emoji: string;
  stats: PerformanceStats;
  detailedStats: DetailedStats;
  onPracticeWeakAreas: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const trend = getOverallTrend(stats);

  // Check if there are weak areas to practice (accuracy < 70%)
  const hasWeakAreas =
    detailedStats.byFilm.some((s) => s.accuracy < 70) ||
    detailedStats.byCategory.some((s) => s.accuracy < 70);

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

      {/* Practice Weak Areas button */}
      {hasWeakAreas && (
        <button
          onClick={onPracticeWeakAreas}
          className="mt-4 w-full btn-secondary flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          Practice Weak Areas
        </button>
      )}

      {/* Expandable details section */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-4 w-full flex items-center justify-center gap-1 text-sm text-brass-600 hover:text-brass-700 transition-colors py-2"
      >
        <span>{isExpanded ? 'Hide details' : 'See more details'}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-parchment-200 space-y-6">
          {/* By Film */}
          {detailedStats.byFilm.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-charcoal-800 mb-3">By Film</h4>
              <div className="space-y-3">
                {detailedStats.byFilm.map((stat) => (
                  <StatBar key={stat.name} stat={stat} />
                ))}
              </div>
            </div>
          )}

          {/* By Category */}
          {detailedStats.byCategory.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-charcoal-800 mb-3">By Category</h4>
              <div className="space-y-3">
                {detailedStats.byCategory.map((stat) => (
                  <StatBar key={stat.name} stat={stat} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [showDifficultySelector, setShowDifficultySelector] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const flashcards = useAppStore((state) => state.flashcards);
  const startNewSession = useAppStore((state) => state.startNewSession);
  const getPerformanceStats = useAppStore((state) => state.getPerformanceStats);
  const currentSession = useAppStore((state) => state.currentSession);
  const cloudSyncEnabled = useAppStore((state) => state.cloudSyncEnabled);
  const cloudSyncLoading = useAppStore((state) => state.cloudSyncLoading);

  const getDetailedStats = useAppStore((state) => state.getDetailedStats);

  const alexStats = getPerformanceStats('Alex');
  const angusStats = getPerformanceStats('Angus');
  const alexDetailedStats = getDetailedStats('Alex');
  const angusDetailedStats = getDetailedStats('Angus');
  const hasEnoughCards = flashcards.length >= 20;

  const handleStartClick = () => {
    setShowProfileSelector(true);
  };

  const handleProfileSelect = (profile: Profile) => {
    setSelectedProfile(profile);
    setShowProfileSelector(false);
    setShowDifficultySelector(true);
  };

  const handleDifficultySelect = (mode: DifficultyMode) => {
    if (!selectedProfile) return;
    setShowDifficultySelector(false);
    const success = startNewSession(selectedProfile, mode);
    if (success) {
      navigate('/session');
    }
    setSelectedProfile(null);
  };

  const handleBackToProfile = () => {
    setShowDifficultySelector(false);
    setShowProfileSelector(true);
  };

  const handleResumeSession = () => {
    navigate('/session');
  };

  const handlePracticeWeakAreas = (profile: Profile) => {
    const success = startNewSession(profile, 'weakness');
    if (success) {
      navigate('/session');
    }
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

        <div className="mt-3 flex items-center justify-center gap-3 text-sm">
          <span className="text-charcoal-500">
            {flashcards.length} questions in library
          </span>
          {cloudSyncLoading ? (
            <span className="text-brass-600 flex items-center gap-1">
              <span className="animate-pulse">●</span> Syncing...
            </span>
          ) : cloudSyncEnabled ? (
            <span className="text-green-600 flex items-center gap-1">
              ● Cloud synced
            </span>
          ) : (
            <span className="text-charcoal-400 flex items-center gap-1">
              ○ Local only
            </span>
          )}
        </div>
      </div>

      {/* Profile Stats */}
      <div className="mb-12">
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-charcoal-900 mb-6 text-center sm:text-left">
          Player Progress
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ProfileStatsCard
            name="Alex"
            emoji="👑"
            stats={alexStats}
            detailedStats={alexDetailedStats}
            onPracticeWeakAreas={() => handlePracticeWeakAreas('Alex')}
          />
          <ProfileStatsCard
            name="Angus"
            emoji="⚔️"
            stats={angusStats}
            detailedStats={angusDetailedStats}
            onPracticeWeakAreas={() => handlePracticeWeakAreas('Angus')}
          />
        </div>
      </div>

      {/* Battle Mode */}
      <div className="mb-12">
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-charcoal-900 mb-6 text-center sm:text-left">
          Battle Mode
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/battle"
            className="card hover:shadow-card-hover transition-shadow group bg-gradient-to-br from-forest-50 to-forest-100 border-forest-200"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl group-hover:scale-110 transition-transform">
                ..
              </div>
              <div>
                <h3 className="font-medium text-forest-900 text-lg">Create Battle</h3>
                <p className="text-sm text-forest-600">
                  Generate a code and invite a friend
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/battle"
            className="card hover:shadow-card-hover transition-shadow group bg-gradient-to-br from-brass-50 to-brass-100 border-brass-200"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl group-hover:scale-110 transition-transform">
                ..
              </div>
              <div>
                <h3 className="font-medium text-brass-900 text-lg">Join Battle</h3>
                <p className="text-sm text-brass-600">
                  Enter a friend's battle code
                </p>
              </div>
            </div>
          </Link>
        </div>

        <p className="text-center text-charcoal-500 text-sm mt-4">
          Challenge a friend to a real-time trivia battle!
        </p>
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

      {/* Difficulty Mode Selector Modal */}
      <DifficultyModeSelector
        isOpen={showDifficultySelector}
        profile={selectedProfile || 'Guest'}
        onSelect={handleDifficultySelect}
        onBack={handleBackToProfile}
      />
    </div>
  );
}
