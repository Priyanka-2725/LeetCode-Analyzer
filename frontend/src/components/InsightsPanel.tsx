import { AnalysisResult } from '../types';

interface Props {
  data: AnalysisResult;
}

const suggestionIcons: Record<string, string> = {
  Focus: '🎯',
  Challenge: '💪',
  Increase: '📈',
  Start: '🔥',
  Keep: '🔥',
  Excellent: '🏆',
  Diversify: '🌐',
  Great: '✅',
};

function getIcon(suggestion: string): string {
  for (const [key, icon] of Object.entries(suggestionIcons)) {
    if (suggestion.startsWith(key)) return icon;
  }
  return '💡';
}

export default function InsightsPanel({ data }: Props) {
  return (
    <div className="card p-6">
      <h3 className="text-slate-200 font-semibold mb-5">Insights & Recommendations</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1">Strongest Topic</p>
          <p className="text-lg font-semibold text-emerald-300">{data.strongestTopic}</p>
          <p className="text-xs text-slate-500 mt-1">Keep leveraging this strength</p>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
          <p className="text-xs text-rose-400 uppercase tracking-wider mb-1">Weakest Topic</p>
          <p className="text-lg font-semibold text-rose-300">{data.weakestTopic}</p>
          <p className="text-xs text-slate-500 mt-1">Focus here for improvement</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-slate-500 uppercase tracking-wider">Suggestions</p>
        {data.suggestions.map((suggestion, i) => (
          <div
            key={i}
            className="flex items-start gap-3 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50"
          >
            <span className="text-lg flex-shrink-0">{getIcon(suggestion)}</span>
            <p className="text-slate-300 text-sm leading-relaxed">{suggestion}</p>
          </div>
        ))}
      </div>

      {data.cached && (
        <p className="text-xs text-slate-600 mt-4 text-right">
          Cached result · refresh to get latest data
        </p>
      )}
    </div>
  );
}
