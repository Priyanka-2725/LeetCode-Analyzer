import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import {
  AnalysisResult,
  EventsResponse,
  GoalForecast,
  HistoryResponse,
  ProductivityPatterns,
} from '../types';
import StatsCard from './ui/StatsCard';
import ProfileCard from './ui/ProfileCard';
import PerformanceChart from './ui/PerformanceChart';
import TopicChart from './ui/TopicChart';
import InsightsPanel from './ui/InsightsPanel';
import RecommendationsPanel from './ui/RecommendationsPanel';
import RecommendedQuestions from './ui/RecommendedQuestions';

interface Props {
  data: AnalysisResult;
  history: HistoryResponse | null;
  events: EventsResponse | null;
  patterns: ProductivityPatterns | null;
  forecast: GoalForecast | null;
  analyticsLoading: boolean;
  exportUrl: string | null;
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-center gap-4 mb-5">
      <div className="flex items-center gap-2.5">
        <div
          className="w-1 h-5 rounded-full"
          style={{
            background: 'linear-gradient(180deg, #6366F1, #A78BFA)',
            boxShadow: '0 0 8px rgba(99,102,241,0.6)',
          }}
        />
        <div>
          <span className="text-[13px] font-bold text-white tracking-tight">{children}</span>
          {sub && <span className="text-[11px] text-slate-600 ml-2 font-medium">{sub}</span>}
        </div>
      </div>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.2), transparent)' }} />
    </div>
  );
}

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  };
}

function TinyTrendChart({ points }: { points: { x: string; y: number }[] }) {
  if (!points.length) {
    return (
      <div
        className="relative overflow-hidden rounded-[18px] border border-slate-800/80 min-h-[180px] p-4 flex flex-col justify-between"
        style={{
          background:
            'linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(8,12,23,0.85) 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        <div
          className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl"
          style={{ background: 'rgba(99,102,241,0.16)' }}
        />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/8 text-cyan-300 text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-cyan-300" />
            Waiting for snapshot history
          </div>
          <div>
            <p className="text-sm text-slate-300 font-medium">No historical trend data yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Run a few analyses to populate daily snapshots and unlock the solved trend graph.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-6">
          <div className="h-24 rounded-xl border border-slate-800/70 bg-slate-950/30 overflow-hidden flex items-end gap-2 px-3 py-3">
            {[22, 42, 34, 58, 46, 66, 38].map((height, index) => (
              <div
                key={`${height}-${index}`}
                className="flex-1 rounded-t-md"
                style={{
                  height: `${height}%`,
                  background:
                    'linear-gradient(180deg, rgba(34,211,238,0.45) 0%, rgba(99,102,241,0.12) 100%)',
                  boxShadow: '0 0 12px rgba(34,211,238,0.12)',
                }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-2">
            <span>Snapshot start</span>
            <span>Snapshot end</span>
          </div>
        </div>
      </div>
    );
  }

  const min = Math.min(...points.map((p) => p.y));
  const max = Math.max(...points.map((p) => p.y));
  const span = Math.max(1, max - min);

  const path = points
    .map((p, i) => {
      const x = (i / Math.max(1, points.length - 1)) * 100;
      const y = 100 - ((p.y - min) / span) * 100;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="space-y-2">
      <svg viewBox="0 0 100 100" className="w-full h-24 rounded-lg border border-slate-800/70 bg-slate-950/45">
        <path d={path} fill="none" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>{points[0].x}</span>
        <span>{points[points.length - 1].x}</span>
      </div>
    </div>
  );
}

function sumSolved(points: { totalSolved: number }[]): number {
  if (!points.length) return 0;
  return Math.max(0, points[points.length - 1].totalSolved - points[0].totalSolved);
}

function avgOf(points: number[]): number {
  if (!points.length) return 0;
  return points.reduce((a, b) => a + b, 0) / points.length;
}

function toUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shiftUtcDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function sumActivityWindow(activityMap: Map<string, number>, todayUtc: Date, fromDaysAgo: number, toDaysAgo: number): number {
  let total = 0;
  for (let offset = fromDaysAgo; offset <= toDaysAgo; offset++) {
    const key = toUtcDateKey(shiftUtcDays(todayUtc, -offset));
    total += activityMap.get(key) || 0;
  }
  return total;
}

function consistencyActivityWindow(activityMap: Map<string, number>, todayUtc: Date, fromDaysAgo: number, toDaysAgo: number): number {
  let activeDays = 0;
  const windowDays = Math.max(1, toDaysAgo - fromDaysAgo + 1);

  for (let offset = fromDaysAgo; offset <= toDaysAgo; offset++) {
    const key = toUtcDateKey(shiftUtcDays(todayUtc, -offset));
    if ((activityMap.get(key) || 0) > 0) activeDays += 1;
  }

  return (activeDays / windowDays) * 100;
}

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function Badge({ label }: { label: string }) {
  return (
    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
      {label}
    </span>
  );
}

export default function FuturisticDashboard({
  data,
  history,
  events,
  patterns,
  forecast,
  analyticsLoading,
  exportUrl,
}: Props) {
  const { analytics } = data;
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard' | 'Unknown'>('All');
  const [dateRangeFilter, setDateRangeFilter] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [topicFilter, setTopicFilter] = useState<string>('All');

  const xp = data.totalSolved * 10 + data.hard * 20 + data.medium * 5;
  const level = Math.floor(xp / 500) + 1;
  const consistencyScore = analytics?.consistencyScore ?? Math.min(100, Math.round((data.streak / 30) * 100));

  const trendPoints = (history?.points || []).slice(-14).map((p) => ({ x: p.snapshotDate.slice(5), y: p.totalSolved }));

  const allEvents = events?.events || [];
  const allTopics = useMemo(() => {
    const set = new Set<string>();
    for (const event of allEvents) {
      for (const topic of event.topics || []) set.add(topic);
    }
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [allEvents]);

  const filteredEvents = useMemo(() => {
    const nowSec = Math.floor(Date.now() / 1000);
    const minTs =
      dateRangeFilter === 'all'
        ? 0
        : nowSec - (dateRangeFilter === '7d' ? 7 : dateRangeFilter === '30d' ? 30 : 90) * 86400;

    return allEvents
      .filter((e) => (difficultyFilter === 'All' ? true : e.difficulty === difficultyFilter))
      .filter((e) => e.timestamp >= minTs)
      .filter((e) => (topicFilter === 'All' ? true : (e.topics || []).includes(topicFilter)))
      .slice(0, 20);
  }, [allEvents, dateRangeFilter, difficultyFilter, topicFilter]);

  const historyPoints = history?.points || [];
  const last7 = historyPoints.slice(-7);
  const prev7 = historyPoints.slice(-14, -7);
  const last30 = historyPoints.slice(-30);
  const prev30 = historyPoints.slice(-60, -30);

  const activityMap = useMemo(
    () => new Map((data.activityData || []).map((p) => [p.date, p.count])),
    [data.activityData],
  );
  const todayUtc = useMemo(() => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }, []);

  const fallbackSolved7 = sumActivityWindow(activityMap, todayUtc, 0, 6);
  const fallbackSolvedPrev7 = sumActivityWindow(activityMap, todayUtc, 7, 13);
  const fallbackSolved30 = sumActivityWindow(activityMap, todayUtc, 0, 29);
  const fallbackSolvedPrev30 = sumActivityWindow(activityMap, todayUtc, 30, 59);

  const fallbackConsistency7 = consistencyActivityWindow(activityMap, todayUtc, 0, 6);
  const fallbackConsistencyPrev7 = consistencyActivityWindow(activityMap, todayUtc, 7, 13);

  const hasHistory7 = last7.length >= 2;
  const hasHistory30 = last30.length >= 2;
  const hasHistoryConsistency = last7.length > 0;

  const solved7 = hasHistory7 ? sumSolved(last7) : fallbackSolved7;
  const solvedPrev7 = hasHistory7 ? sumSolved(prev7) : fallbackSolvedPrev7;
  const solved30 = hasHistory30 ? sumSolved(last30) : fallbackSolved30;
  const solvedPrev30 = hasHistory30 ? sumSolved(prev30) : fallbackSolvedPrev30;

  const solved7Delta = pctDelta(solved7, solvedPrev7);
  const solved30Delta = pctDelta(solved30, solvedPrev30);

  const consistency7 = hasHistoryConsistency
    ? avgOf(last7.map((p) => p.consistencyScore))
    : fallbackConsistency7;
  const consistencyPrev7 = hasHistoryConsistency
    ? avgOf(prev7.map((p) => p.consistencyScore))
    : fallbackConsistencyPrev7;
  const consistencyDrop = consistencyPrev7 - consistency7;

  const growthMetric = analytics?.growthRate ?? (solved30Delta ?? solved7Delta ?? 0);

  const alerts: { level: 'warning' | 'danger'; text: string }[] = [];
  if (consistencyDrop >= 10) {
    alerts.push({
      level: 'warning',
      text: `Consistency dropped by ${consistencyDrop.toFixed(1)} points (last 7d vs previous 7d).`,
    });
  }
  if ((analytics?.growthRate || 0) < 0) {
    alerts.push({
      level: 'danger',
      text: `Negative growth detected (${analytics?.growthRate}%). Consider a short recovery plan.`,
    });
  }
  if (forecast?.daysToTarget !== null && forecast?.daysToTarget !== undefined && forecast.daysToTarget > 180) {
    alerts.push({
      level: 'warning',
      text: 'Forecast slippage: target ETA is beyond 180 days at current pace.',
    });
  }
  if ((forecast?.daysToTarget === null || forecast?.daysToTarget === undefined) && solved30 > 0) {
    alerts.push({
      level: 'warning',
      text: 'Forecast ETA is temporarily unavailable. Keep solving daily to improve projection quality.',
    });
  }

  return (
    <div className="space-y-10">
      <motion.section {...fadeUp(0)}>
        <ProfileCard data={data} />
      </motion.section>

      <section>
        <SectionTitle sub="real-time">Stats Overview</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Solves"
            value={data.totalSolved}
            subtitle={`Easy ${data.easy} · Med ${data.medium} · Hard ${data.hard}`}
            color="indigo"
            delay={0}
            icon={<span className="text-base">✅</span>}
          />
          <StatsCard
            title="Current Streak"
            value={data.streak}
            subtitle="days in a row"
            color="cyan"
            delay={80}
            suffix="d"
            icon={<span className="text-base">🔥</span>}
          />
          <StatsCard
            title="XP / Level"
            value={level}
            subtitle={`${xp.toLocaleString()} total XP`}
            color="purple"
            delay={160}
            suffix=" Lv"
            icon={<span className="text-base">⚡</span>}
          />
          <StatsCard
            title="Consistency"
            value={consistencyScore}
            subtitle="consistency score"
            color="green"
            delay={240}
            suffix="%"
            icon={<span className="text-base">📊</span>}
          />
        </div>
      </section>

      {alerts.length > 0 && (
        <section>
          <SectionTitle sub="risk monitoring">Alert Banners</SectionTitle>
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div
                key={`${alert.text}-${idx}`}
                className={`glass-card p-4 border ${alert.level === 'danger' ? 'border-rose-500/40' : 'border-amber-500/40'}`}
              >
                <p className={`text-sm ${alert.level === 'danger' ? 'text-rose-300' : 'text-amber-300'}`}>{alert.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle sub="period over period">KPI Comparison</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400">Solved 7d</p>
              <Badge label="vs prev 7d" />
            </div>
            <p className="text-2xl font-semibold text-white">{solved7}</p>
            <p className={`text-xs mt-1 ${((solved7Delta || 0) >= 0) ? 'text-emerald-300' : 'text-rose-300'}`}>
              {solved7Delta !== null ? `${solved7Delta >= 0 ? '+' : ''}${solved7Delta.toFixed(1)}%` : 'N/A'}
            </p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400">Solved 30d</p>
              <Badge label="vs prev 30d" />
            </div>
            <p className="text-2xl font-semibold text-white">{solved30}</p>
            <p className={`text-xs mt-1 ${((solved30Delta || 0) >= 0) ? 'text-emerald-300' : 'text-rose-300'}`}>
              {solved30Delta !== null ? `${solved30Delta >= 0 ? '+' : ''}${solved30Delta.toFixed(1)}%` : 'N/A'}
            </p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400">Consistency 7d</p>
              <Badge label="vs prev 7d" />
            </div>
            <p className="text-2xl font-semibold text-white">{consistency7.toFixed(1)}%</p>
            <p className={`text-xs mt-1 ${consistency7 >= consistencyPrev7 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {(consistency7 - consistencyPrev7) >= 0 ? '+' : ''}{(consistency7 - consistencyPrev7).toFixed(1)} pts
            </p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400">Current Growth</p>
              <Badge label="latest" />
            </div>
            <p className="text-2xl font-semibold text-white">{growthMetric.toFixed(0)}%</p>
            <p className="text-xs mt-1 text-slate-400">Model growth indicator</p>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle sub="last 12 months">Performance</SectionTitle>
        <PerformanceChart activityData={data.activityData} />
      </section>

      <section>
        <SectionTitle sub="top topics">Topic Analytics</SectionTitle>
        <TopicChart topics={data.topics} />
      </section>

      <section>
        <SectionTitle sub="historical snapshots">Trend Analytics</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="glass-card p-5 lg:col-span-2">
            <p className="text-xs text-slate-400 mb-3">Total solved trend (last 14 points)</p>
            <TinyTrendChart points={trendPoints} />
            <div className="mt-3 text-xs text-slate-500">
              {analyticsLoading ? 'Loading historical analytics...' : `${history?.points.length || 0} snapshot points available`}
            </div>
          </div>

          <div className="glass-card p-5 space-y-3">
            <p className="text-xs text-slate-400">What-if Forecast</p>
            <div className="text-sm text-slate-200">Target: {forecast?.target ?? 500}</div>
            <div className="text-xs text-slate-500">Avg Daily Progress: {forecast?.avgDailyProgress ?? 0}</div>
            <div className="text-xs text-slate-500">
              ETA: {forecast?.projectedDate || 'Need more data'}
            </div>
            <div className="text-xs text-cyan-300">
              {forecast?.daysToTarget !== null && forecast?.daysToTarget !== undefined
                ? `${forecast.daysToTarget} day(s) to target`
                : 'Forecast unavailable'}
            </div>
            {exportUrl && (
              <a
                href={exportUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-colors"
              >
                Export CSV
              </a>
            )}
          </div>
        </div>
      </section>

      <section>
        <SectionTitle sub="submission drill-down">Recent Events</SectionTitle>
        <div className="glass-card p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-xs text-slate-400">
              Difficulty
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as typeof difficultyFilter)}
                className="mt-1 w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-200"
              >
                {['All', 'Easy', 'Medium', 'Hard', 'Unknown'].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </label>

            <label className="text-xs text-slate-400">
              Date Range
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value as typeof dateRangeFilter)}
                className="mt-1 w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-200"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </label>

            <label className="text-xs text-slate-400">
              Topic
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="mt-1 w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-200"
              >
                {allTopics.map((topic) => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="glass-card p-5 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-800">
                <th className="py-2">Problem</th>
                <th className="py-2">Topic</th>
                <th className="py-2">Difficulty</th>
                <th className="py-2">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((e) => (
                <tr key={e.submissionId} className="border-b border-slate-900/60">
                  <td className="py-2 text-slate-200">{e.title}</td>
                  <td className="py-2 text-slate-400">{(e.topics || []).slice(0, 2).join(', ') || 'N/A'}</td>
                  <td className="py-2 text-slate-400">{e.difficulty}</td>
                  <td className="py-2 text-slate-500">{new Date(e.timestamp * 1000).toISOString().slice(0, 16).replace('T', ' ')}</td>
                </tr>
              ))}
              {filteredEvents.length === 0 && (
                <tr>
                  <td className="py-3 text-slate-500" colSpan={4}>No events match current filters. Try broadening difficulty/date/topic filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <SectionTitle sub="best solving windows">Productivity Patterns</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="glass-card p-5">
            <p className="text-xs text-slate-400 mb-1">Best Day</p>
            <p className="text-lg text-white font-semibold">{patterns?.bestWeekday || 'N/A'}</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs text-slate-400 mb-1">Best Hour (UTC)</p>
            <p className="text-lg text-white font-semibold">{patterns ? `${patterns.bestHourUtc}:00` : 'N/A'}</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-xs text-slate-400 mb-1">Tracked Events</p>
            <p className="text-lg text-white font-semibold">{patterns?.totalEvents || 0}</p>
          </div>
        </div>
      </section>

      {data.recommendedProblems && data.recommendedProblems.length > 0 && (
        <section>
          <SectionTitle sub="personalized for you">Recommended Questions</SectionTitle>
          <RecommendedQuestions problems={data.recommendedProblems} />
        </section>
      )}

      <section>
        <SectionTitle sub="AI-powered">Insights and Recommendations</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <InsightsPanel insights={analytics?.insights ?? []} suggestions={data.suggestions} />
          <RecommendationsPanel recommendations={analytics?.recommendations ?? []} />
        </div>
      </section>
    </div>
  );
}
