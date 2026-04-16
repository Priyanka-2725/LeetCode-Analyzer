import AnalyticsSnapshot from '../models/AnalyticsSnapshot';
import SubmissionEvent, { SubmissionDifficulty } from '../models/SubmissionEvent';
import { AnalysisOutput } from './analysisService';
import { AnalyticsOutput } from './analytics';

export interface SubmissionEventInput {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: number;
  difficulty: SubmissionDifficulty;
  topics: string[];
}

function toDateString(d = new Date()): string {
  return d.toISOString().split('T')[0];
}

function escapeCsv(val: string | number): string {
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function persistSnapshot(params: {
  username: string;
  analysis: AnalysisOutput;
  analytics: AnalyticsOutput;
  weakTopics: string[];
  strongTopics: string[];
}): Promise<void> {
  const { username, analysis, analytics, weakTopics, strongTopics } = params;

  await AnalyticsSnapshot.findOneAndUpdate(
    { username: username.toLowerCase(), snapshotDate: toDateString() },
    {
      username: username.toLowerCase(),
      snapshotDate: toDateString(),
      totalSolved: analysis.totalSolved,
      easy: analysis.easy,
      medium: analysis.medium,
      hard: analysis.hard,
      streak: analysis.streak,
      consistencyScore: analytics.consistencyScore,
      growthRate: analytics.growthRate,
      weakTopics,
      strongTopics,
      fetchedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

export async function persistSubmissionEvents(username: string, events: SubmissionEventInput[]): Promise<void> {
  if (!events.length) return;

  const normalized = username.toLowerCase();
  const ops = events.map((e) => ({
    updateOne: {
      filter: { username: normalized, submissionId: e.id },
      update: {
        $setOnInsert: {
          username: normalized,
          submissionId: e.id,
          title: e.title,
          titleSlug: e.titleSlug,
          difficulty: e.difficulty,
          topics: e.topics,
          timestamp: e.timestamp,
          submittedAt: new Date(e.timestamp * 1000),
        },
      },
      upsert: true,
    },
  }));

  await SubmissionEvent.bulkWrite(ops, { ordered: false });
}

export async function getSnapshotHistory(username: string, days = 30) {
  return AnalyticsSnapshot.find({
    username: username.toLowerCase(),
    fetchedAt: { $gte: new Date(Date.now() - Math.max(1, days) * 86400000) },
  })
    .sort({ snapshotDate: 1 })
    .lean();
}

export async function getSubmissionEvents(username: string, limit = 100) {
  return SubmissionEvent.find({ username: username.toLowerCase() })
    .sort({ timestamp: -1 })
    .limit(Math.max(1, Math.min(limit, 1000)))
    .lean();
}

export async function exportHistoryCsv(username: string): Promise<string> {
  const rows = await AnalyticsSnapshot.find({ username: username.toLowerCase() })
    .sort({ snapshotDate: 1 })
    .lean();

  const header = [
    'snapshotDate',
    'totalSolved',
    'easy',
    'medium',
    'hard',
    'streak',
    'consistencyScore',
    'growthRate',
    'weakTopics',
    'strongTopics',
  ];

  const lines = [header.join(',')];

  for (const row of rows) {
    lines.push([
      escapeCsv(row.snapshotDate),
      escapeCsv(row.totalSolved),
      escapeCsv(row.easy),
      escapeCsv(row.medium),
      escapeCsv(row.hard),
      escapeCsv(row.streak),
      escapeCsv(row.consistencyScore),
      escapeCsv(row.growthRate),
      escapeCsv((row.weakTopics || []).join(';')),
      escapeCsv((row.strongTopics || []).join(';')),
    ].join(','));
  }

  return lines.join('\n');
}

export async function getProductivityPatterns(username: string) {
  const events = await SubmissionEvent.find({ username: username.toLowerCase() })
    .sort({ timestamp: 1 })
    .lean();

  const weekdayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekdayCounts: Record<string, number> = {
    Sun: 0,
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
  };

  const hourCounts: number[] = Array.from({ length: 24 }, () => 0);

  for (const event of events) {
    const d = new Date(event.timestamp * 1000);
    weekdayCounts[weekdayOrder[d.getUTCDay()]] += 1;
    hourCounts[d.getUTCHours()] += 1;
  }

  const bestWeekday = weekdayOrder.reduce((best, day) =>
    weekdayCounts[day] > weekdayCounts[best] ? day : best,
  'Sun');

  const bestHourUtc = hourCounts.reduce((best, count, idx, arr) =>
    count > arr[best] ? idx : best,
  0);

  return {
    totalEvents: events.length,
    bestWeekday,
    bestHourUtc,
    weekdayCounts,
    hourCounts,
  };
}

export async function getGoalForecast(username: string, target: number) {
  const snapshots = await AnalyticsSnapshot.find({ username: username.toLowerCase() })
    .sort({ snapshotDate: 1 })
    .lean();

  const latest = snapshots[snapshots.length - 1];
  if (!latest) {
    return {
      target,
      currentTotalSolved: 0,
      avgDailyProgress: 0,
      daysToTarget: null as number | null,
      projectedDate: null as string | null,
    };
  }

  let avgDailyProgress = 0;
  if (snapshots.length >= 2) {
    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    const daySpan = Math.max(
      1,
      Math.round((new Date(last.snapshotDate).getTime() - new Date(first.snapshotDate).getTime()) / 86400000),
    );
    avgDailyProgress = Math.max(0, (last.totalSolved - first.totalSolved) / daySpan);
  }

  const remaining = Math.max(0, target - latest.totalSolved);
  const daysToTarget = avgDailyProgress > 0 ? Math.ceil(remaining / avgDailyProgress) : null;
  const projectedDate = daysToTarget !== null
    ? new Date(Date.now() + daysToTarget * 86400000).toISOString().split('T')[0]
    : null;

  return {
    target,
    currentTotalSolved: latest.totalSolved,
    avgDailyProgress: Number(avgDailyProgress.toFixed(2)),
    daysToTarget,
    projectedDate,
  };
}
