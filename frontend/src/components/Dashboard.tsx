import { AnalysisResult } from '../types';
import StatsCards from './StatsCards';
import DifficultyPieChart from './charts/DifficultyPieChart';
import TopicBarChart from './charts/TopicBarChart';
import ActivityLineChart from './charts/ActivityLineChart';
import InsightsPanel from './InsightsPanel';
import AnalyticsMetrics from './analytics/AnalyticsMetrics';
import TopicMasteryChart from './analytics/TopicMasteryChart';
import WeekdayChart from './analytics/WeekdayChart';
import PredictionsCard from './analytics/PredictionsCard';
import InsightsAndRecs from './analytics/InsightsAndRecs';

interface Props {
  data: AnalysisResult;
}

export default function Dashboard({ data }: Props) {
  const { analytics } = data;

  return (
    <div className="space-y-8">

      {/* Profile header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center">
          <span className="text-brand-400 font-bold text-sm">
            {data.username.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h2 className="text-slate-100 font-semibold">{data.username}</h2>
          <a
            href={`https://leetcode.com/u/${data.username}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            View on LeetCode ↗
          </a>
        </div>
        {data.cached && (
          <span className="ml-auto text-xs text-slate-600 bg-slate-800 px-2 py-1 rounded-lg">
            cached
          </span>
        )}
      </div>

      {/* ── Basic Stats ── */}
      <section>
        <SectionLabel>Overview</SectionLabel>
        <StatsCards data={data} />
      </section>

      {/* ── Analytics Metrics (new) ── */}
      {analytics && (
        <section>
          <SectionLabel>Analytics Metrics</SectionLabel>
          <AnalyticsMetrics analytics={analytics} />
        </section>
      )}

      {/* ── Charts row ── */}
      <section>
        <SectionLabel>Distribution</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DifficultyPieChart data={data} />
          <TopicBarChart topics={data.topics} />
        </div>
      </section>

      {/* ── Topic Mastery (new) ── */}
      {analytics && analytics.topicMastery.length > 0 && (
        <section>
          <SectionLabel>Topic Analytics</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TopicMasteryChart topicMastery={analytics.topicMastery} />
            <WeekdayChart weekdayDistribution={analytics.weekdayDistribution} />
          </div>
        </section>
      )}

      {/* ── Activity Trend ── */}
      <section>
        <SectionLabel>Activity Trend</SectionLabel>
        <ActivityLineChart activityData={data.activityData} />
      </section>

      {/* ── Predictions (new) ── */}
      {analytics && (
        <section>
          <SectionLabel>Predictions</SectionLabel>
          <PredictionsCard
            predictions={analytics.predictions}
            totalSolved={data.totalSolved}
            streak={data.streak}
          />
        </section>
      )}

      {/* ── Insights & Recommendations (new) ── */}
      {analytics && (
        <section>
          <SectionLabel>Insights & Recommendations</SectionLabel>
          <InsightsAndRecs
            insights={analytics.insights}
            recommendations={analytics.recommendations}
          />
        </section>
      )}

      {/* ── Legacy Insights Panel (kept) ── */}
      <section>
        <SectionLabel>Summary</SectionLabel>
        <InsightsPanel data={data} />
      </section>

    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 font-medium">
      {children}
    </p>
  );
}
