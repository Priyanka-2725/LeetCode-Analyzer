import problems from '../../data/problems.json';

export interface SkillSubmission {
  timestamp: number;
  titleSlug: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Unknown';
}

export interface TimelinePoint {
  date: string;
  count: number;
}

export interface MasteryPoint {
  date: string;
  mastery: number;
}

export interface TopicGrowth {
  topic: string;
  firstWindowAvg: number;
  lastWindowAvg: number;
  growthPct: number;
  trend: 'improving' | 'stagnant' | 'declining' | 'insufficient';
}

export interface SkillEvolutionOutput {
  topicTimeline: Record<string, TimelinePoint[]>;
  masteryTimeline: Record<string, MasteryPoint[]>;
  growthInsights: string[];
}

const topicsBySlug = new Map(
  (problems as { slug: string; topics?: string[] }[]).map((p) => [p.slug, p.topics || []]),
);

function toDateKey(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}

function avg(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function groupByDate(submissions: SkillSubmission[]): Record<string, SkillSubmission[]> {
  const grouped: Record<string, SkillSubmission[]> = {};

  for (const submission of submissions) {
    const key = toDateKey(submission.timestamp);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(submission);
  }

  return Object.fromEntries(
    Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)),
  );
}

function buildDateRange(dates: string[]): string[] {
  if (!dates.length) return [];
  const start = new Date(`${dates[0]}T00:00:00Z`);
  const end = new Date(`${dates[dates.length - 1]}T00:00:00Z`);
  const range: string[] = [];

  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    range.push(cursor.toISOString().slice(0, 10));
  }

  return range;
}

export function computeTopicTimeline(submissions: SkillSubmission[]): Record<string, TimelinePoint[]> {
  const grouped = groupByDate(submissions);
  const groupedDates = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
  const allDates = buildDateRange(groupedDates);
  const topicDateCounts = new Map<string, Map<string, number>>();

  for (const [date, daySubs] of Object.entries(grouped)) {
    for (const submission of daySubs) {
      const topics = topicsBySlug.get(submission.titleSlug) || [];
      for (const topic of topics) {
        if (!topicDateCounts.has(topic)) topicDateCounts.set(topic, new Map());
        const dateCounts = topicDateCounts.get(topic)!;
        dateCounts.set(date, (dateCounts.get(date) || 0) + 1);
      }
    }
  }

  const timeline: Record<string, TimelinePoint[]> = {};
  for (const [topic, dateCounts] of topicDateCounts.entries()) {
    timeline[topic] = allDates.map((date) => ({
      date,
      count: dateCounts.get(date) || 0,
    }));
  }

  return timeline;
}

export function computeTopicMasteryTimeline(
  topicTimeline: Record<string, TimelinePoint[]>,
  submissions: SkillSubmission[],
): Record<string, MasteryPoint[]> {
  const grouped = groupByDate(submissions);
  const groupedDates = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
  const allDates = buildDateRange(groupedDates);

  const totalSolvedTillDate = new Map<string, number>();
  let solvedRunning = 0;
  for (const date of allDates) {
    solvedRunning += grouped[date]?.length || 0;
    totalSolvedTillDate.set(date, solvedRunning);
  }

  const masteryTimeline: Record<string, MasteryPoint[]> = {};

  for (const [topic, points] of Object.entries(topicTimeline)) {
    let topicRunning = 0;
    masteryTimeline[topic] = points.map((point) => {
      topicRunning += point.count;
      const totalSolved = totalSolvedTillDate.get(point.date) || 0;
      const mastery = totalSolved > 0 ? (topicRunning / totalSolved) * 100 : 0;
      return {
        date: point.date,
        mastery: Math.round(mastery * 10) / 10,
      };
    });
  }

  return masteryTimeline;
}

export function analyzeTopicGrowth(
  masteryTimeline: Record<string, MasteryPoint[]>,
): TopicGrowth[] {
  const growth: TopicGrowth[] = [];

  for (const [topic, points] of Object.entries(masteryTimeline)) {
    if (points.length < 4) {
      growth.push({
        topic,
        firstWindowAvg: points[0]?.mastery || 0,
        lastWindowAvg: points[points.length - 1]?.mastery || 0,
        growthPct: 0,
        trend: 'insufficient',
      });
      continue;
    }

    const firstWindow = points.slice(0, Math.min(7, points.length)).map((p) => p.mastery);
    const lastWindow = points.slice(-Math.min(7, points.length)).map((p) => p.mastery);

    const firstAvg = avg(firstWindow);
    const lastAvg = avg(lastWindow);
    const base = Math.max(1, firstAvg);
    const growthPct = ((lastAvg - firstAvg) / base) * 100;

    let trend: TopicGrowth['trend'];
    if (growthPct > 8) trend = 'improving';
    else if (growthPct < -8) trend = 'declining';
    else trend = 'stagnant';

    growth.push({
      topic,
      firstWindowAvg: Math.round(firstAvg * 10) / 10,
      lastWindowAvg: Math.round(lastAvg * 10) / 10,
      growthPct: Math.round(growthPct * 10) / 10,
      trend,
    });
  }

  return growth.sort((a, b) => Math.abs(b.growthPct) - Math.abs(a.growthPct));
}

export function generateEvolutionInsights(
  growth: TopicGrowth[],
  masteryTimeline: Record<string, MasteryPoint[]>,
  totalSubmissions: number,
): string[] {
  const insights: string[] = [];

  if (totalSubmissions < 5) {
    return ['Not enough data to compute skill evolution yet. Solve a few more problems to unlock trends.'];
  }

  const improving = growth.filter((item) => item.trend === 'improving').slice(0, 2);
  const stagnant = growth.filter((item) => item.trend === 'stagnant').slice(0, 2);
  const declining = growth.filter((item) => item.trend === 'declining').slice(0, 1);

  for (const item of improving) {
    const points = masteryTimeline[item.topic] || [];
    if (!points.length) continue;
    const start = points[Math.max(0, points.length - 14)] || points[0];
    const end = points[points.length - 1];
    insights.push(
      `${item.topic} mastery increased from ${start.mastery.toFixed(1)}% to ${end.mastery.toFixed(1)}% in the last ${Math.min(14, points.length)} days.`,
    );
  }

  for (const item of stagnant) {
    insights.push(`${item.topic} skills remain mostly stagnant (no strong growth detected).`);
  }

  for (const item of declining) {
    insights.push(`${item.topic} mastery is declining recently. Consider focused practice to recover momentum.`);
  }

  if (!insights.length) {
    insights.push('Skill evolution is currently stable across topics with no major shifts yet.');
  }

  return insights.slice(0, 6);
}

export function buildSkillEvolution(submissions: SkillSubmission[]): SkillEvolutionOutput {
  const cleaned = submissions
    .filter((submission) => Number.isFinite(submission.timestamp) && submission.titleSlug)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (!cleaned.length) {
    return {
      topicTimeline: {},
      masteryTimeline: {},
      growthInsights: ['Not enough data to compute skill evolution yet.'],
    };
  }

  const topicTimeline = computeTopicTimeline(cleaned);
  const masteryTimeline = computeTopicMasteryTimeline(topicTimeline, cleaned);
  const growth = analyzeTopicGrowth(masteryTimeline);
  const growthInsights = generateEvolutionInsights(growth, masteryTimeline, cleaned.length);

  return {
    topicTimeline,
    masteryTimeline,
    growthInsights,
  };
}
