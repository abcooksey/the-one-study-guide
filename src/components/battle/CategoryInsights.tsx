import { CategoryInsightData } from './QuestionReview';

interface CategoryInsightsProps {
  insights: CategoryInsightData;
}

export default function CategoryInsights({ insights }: CategoryInsightsProps) {
  // Don't render if no insights available
  if (!insights.best && !insights.worst && !insights.sharedStruggle) {
    return null;
  }

  return (
    <div className="bg-white border border-parchment-200 rounded-xl p-4">
      <h3 className="text-sm font-medium text-charcoal-700 mb-3 flex items-center gap-2">
        <span>📊</span>
        Category Insights
      </h3>

      <div className="flex flex-wrap gap-3">
        {insights.best && (
          <div className="flex-1 min-w-[140px] p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-xs text-green-600 mb-1 flex items-center gap-1">
              <span>💪</span>
              Your Best
            </div>
            <div className="font-medium text-green-800">{insights.best.category}</div>
            <div className="text-sm text-green-600">{insights.best.accuracy}% correct</div>
          </div>
        )}

        {insights.worst && (
          <div className="flex-1 min-w-[140px] p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-xs text-amber-600 mb-1 flex items-center gap-1">
              <span>📚</span>
              Needs Work
            </div>
            <div className="font-medium text-amber-800">{insights.worst.category}</div>
            <div className="text-sm text-amber-600">{insights.worst.accuracy}% correct</div>
          </div>
        )}

        {insights.sharedStruggle && (
          <div className="flex-1 min-w-[140px] p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-xs text-purple-600 mb-1 flex items-center gap-1">
              <span>🤝</span>
              Everyone Struggled
            </div>
            <div className="font-medium text-purple-800">{insights.sharedStruggle.category}</div>
            <div className="text-sm text-purple-600">{insights.sharedStruggle.accuracy}% correct</div>
          </div>
        )}
      </div>
    </div>
  );
}
