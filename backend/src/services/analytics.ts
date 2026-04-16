import { IActivityData, ITopicStat } from '../models/AnalysisResult';

export interface TopicMastery { topic: string; count: number; mastery: number; }

export interface Prediction {
  daysToNextMilestone: number | null;
  nextMilestone: number;
  streakBreakRiskDays: number | null;
  projectedSolvesIn30Days: number;
}

export interface Insight { type: 'info' | 'warning' | 'success'; message: string; }
export interface Recommendation { priority: 'high' | 'medium' | 'low'; message: string; }

export interface AnalyticsOutput {
  consistencyScore: number;
  avgProblemsPerDay: number;
  growthRate: number;
  topicMastery: TopicMastery[];
  weekdayDistribution: { day: string; avg: number }[];
  insights: Insight[];
  recommendations: Recommendation[];
  predictions: Prediction;
}

function getDifficultyStats(easy: number, medium: number, hard: number) {
  const total = easy + medium + hard || 1;
  return {
    easyPct: Math.round((easy / total) * 100),
    mediumPct: Math.round((medium / total) * 100),
    hardPct: Math.round((hard / total) * 100),
  };
}

function getTopicDistribution(topics: ITopicStat[]): TopicMastery[] {
  if (topics.length === 0) return [];
  const maxCount = topics[0].count || 1;
  return topics.map((t) => ({
    topic: t.topic,
    count: t.count,
    mastery: Math.min(100, Math.round((t.count / maxCount) * 100)),
  }));
}

function getDailyActivity(activityData: IActivityData[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return activityData.map((d) => ({
    date: d.date,
    count: d.count,
    dayOfWeek: days[new Date(d.date + 'T12:00:00').getDay()],
  }));
}

function getWeekdayDistribution(daily: { dayOfWeek: string; count: number }[]): { day: string; avg: number }[] {
  const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const buckets: Record<string, number[]> = {};
  order.forEach((d) => (buckets[d] = []));
  for (const entry of daily) {
    if (buckets[entry.dayOfWeek]) buckets[entry.dayOfWeek].push(entry.count);
  }
  return order.map((day) => {
    const vals = buckets[day];
    const avg = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
    return { day, avg };
  });
}

function calcConsistency(activityData: IActivityData[]): number {
  if (activityData.length === 0) return 0;
  const sorted = [...activityData].sort((a, b) => a.date.localeCompare(b.date));
  const first = new Date(sorted[0].date + 'T12:00:00');
  const last = new Date(sorted[sorted.length - 1].date + 'T12:00:00');
  const totalDays = Math.max(1, Math.round((last.getTime() - first.getTime()) / 86400000) + 1);
  const activeDays = activityData.filter((d) => d.count > 0).length;
  return Math.min(100, Math.round((activeDays / totalDays) * 100));
}

function calcGrowthRate(activityData: IActivityData[]): number {
  if (activityData.length < 30) return 0;
  const sorted = [...activityData].sort((a, b) => a.date.localeCompare(b.date));
  const recent30 = sorted.slice(-30).reduce((s, d) => s + d.count, 0);
  const prior30 = sorted.slice(-60, -30).reduce((s, d) => s + d.count, 0);
  if (prior30 === 0) return recent30 > 0 ? 100 : 0;
  return Math.round(((recent30 - prior30) / prior30) * 100);
}

function calcAvgPerDay(activityData: IActivityData[]): number {
  if (activityData.length === 0) return 0;
  const total = activityData.reduce((s, d) => s + d.count, 0);
  return Math.round((total / activityData.length) * 10) / 10;
}

function detectWeakTopics(topics: ITopicStat[]): string[] {
  if (topics.length < 3) return [];
  const avg = topics.reduce((s, t) => s + t.count, 0) / topics.length;
  return topics.filter((t) => t.count < avg * 0.4).map((t) => t.topic).slice(0, 5);
}

function detectInconsistency(activityData: IActivityData[]): boolean {
  if (activityData.length < 14) return false;
  return activityData.slice(-14).filter((d) => d.count > 0).length < 5;
}

function predictFutureSolves(totalSolved: number, avgPerDay: number) {
  const milestones = [50, 100, 150, 200, 300, 400, 500, 600, 750, 1000, 1500, 2000];
  const next = milestones.find((m) => m > totalSolved) ?? totalSolved + 100;
  return {
    daysToNextMilestone: avgPerDay > 0 ? Math.ceil((next - totalSolved) / avgPerDay) : null,
    nextMilestone: next,
    projectedSolvesIn30Days: Math.round(totalSolved + avgPerDay * 30),
  };
}

function predictStreakRisk(activityData: IActivityData[], streak: number): number | null {
  if (streak === 0 || activityData.length < 7) return null;
  const sorted = [...activityData].sort((a, b) => a.date.localeCompare(b.date));
  const last7 = sorted.slice(-7).map((d) => d.count);
  let lowDays = 0;
  for (let i = last7.length - 1; i >= 0; i--) {
    if (last7[i] <= 1) lowDays++;
    else break;
  }
  return lowDays >= 3 ? Math.max(1, 4 - lowDays) : null;
}

function buildInsights(p: {
  consistencyScore: number; growthRate: number; weakTopics: string[];
  inconsistent: boolean; streakRiskDays: number | null;
  weekdayDist: { day: string; avg: number }[]; streak: number;
  avgPerDay: number; hardPct: number;
}): Insight[] {
  const out: Insight[] = [];
  if (p.streakRiskDays !== null) {
    out.push({ type: 'warning', message: `Your streak may break in ~${p.streakRiskDays} day${p.streakRiskDays > 1 ? 's' : ''} based on recent activity` });
  }
  if (p.consistencyScore >= 70) {
    out.push({ type: 'success', message: `Excellent consistency — active ${p.consistencyScore}% of days` });
  } else if (p.consistencyScore < 30) {
    out.push({ type: 'warning', message: `Low consistency score (${p.consistencyScore}%) — you have many inactive days` });
  } else {
    out.push({ type: 'info', message: `Consistency score: ${p.consistencyScore}% — room to improve daily habits` });
  }
  if (p.growthRate > 15) {
    out.push({ type: 'success', message: `Activity grew ${p.growthRate}% compared to the previous 30 days` });
  } else if (p.growthRate < -15) {
    out.push({ type: 'warning', message: `Activity dropped ${Math.abs(p.growthRate)}% compared to the previous 30 days` });
  }
  if (p.weakTopics.length > 0) {
    out.push({ type: 'warning', message: `You struggle with: ${p.weakTopics.slice(0, 3).join(', ')}` });
  }
  const wdAvg = p.weekdayDist.filter((d) => !['Sat', 'Sun'].includes(d.day)).reduce((s, d) => s + d.avg, 0) / 5 || 0;
  const weAvg = p.weekdayDist.filter((d) => ['Sat', 'Sun'].includes(d.day)).reduce((s, d) => s + d.avg, 0) / 2 || 0;
  if (wdAvg > 0 && weAvg < wdAvg * 0.4) {
    out.push({ type: 'info', message: 'Your activity drops significantly on weekends' });
  }
  if (p.inconsistent) {
    out.push({ type: 'warning', message: 'Irregular solving pattern detected in the last 2 weeks' });
  }
  if (p.hardPct < 5 && p.avgPerDay > 1) {
    out.push({ type: 'info', message: 'You rarely attempt Hard problems — consider adding them to your routine' });
  }
  if (p.streak >= 30) {
    out.push({ type: 'success', message: `Impressive ${p.streak}-day streak — you are in the top tier of consistency` });
  }
  return out;
}

function buildRecommendations(p: {
  weakTopics: string[]; inconsistent: boolean; streakRiskDays: number | null;
  consistencyScore: number; hardPct: number; mediumPct: number;
  growthRate: number; avgPerDay: number;
}): Recommendation[] {
  const out: Recommendation[] = [];
  if (p.streakRiskDays !== null) {
    out.push({ priority: 'high', message: `Solve at least ${Math.ceil(p.avgPerDay)} problem${Math.ceil(p.avgPerDay) > 1 ? 's' : ''} today to protect your streak` });
  }
  if (p.weakTopics.length > 0) {
    out.push({ priority: 'high', message: `Practice ${p.weakTopics.slice(0, 2).join(' and ')} — these are your weakest areas` });
  }
  if (p.inconsistent) {
    out.push({ priority: 'high', message: 'Set a daily goal of at least 1 problem to rebuild consistency' });
  }
  if (p.hardPct < 8) {
    out.push({ priority: 'medium', message: 'Attempt more Hard problems to sharpen problem-solving skills' });
  }
  if (p.mediumPct < 30) {
    out.push({ priority: 'medium', message: 'Increase Medium problem count — they are the core of coding interviews' });
  }
  if (p.consistencyScore < 40) {
    out.push({ priority: 'medium', message: 'Your consistency score is low — try solving problems on more days per week' });
  }
  if (p.growthRate < -20) {
    out.push({ priority: 'medium', message: 'Your activity has declined recently — re-engage with a structured plan' });
  }
  if (p.growthRate > 20) {
    out.push({ priority: 'low', message: 'Great growth momentum — keep it up and tackle harder topics' });
  }
  if (out.length === 0) {
    out.push({ priority: 'low', message: 'Solid performance — keep solving consistently' });
  }
  return out;
}

export function computeAnalytics(params: {
  easy: number; medium: number; hard: number;
  totalSolved: number; streak: number;
  topics: ITopicStat[]; activityData: IActivityData[];
}): AnalyticsOutput {
  const { easy, medium, hard, totalSolved, streak, topics, activityData } = params;
  const diff = getDifficultyStats(easy, medium, hard);
  const topicMastery = getTopicDistribution(topics);
  const daily = getDailyActivity(activityData);
  const weekdayDistribution = getWeekdayDistribution(daily);
  const consistencyScore = calcConsistency(activityData);
  const growthRate = calcGrowthRate(activityData);
  const avgPerDay = calcAvgPerDay(activityData);
  const weakTopics = detectWeakTopics(topics);
  const inconsistent = detectInconsistency(activityData);
  const streakRiskDays = predictStreakRisk(activityData, streak);
  const { daysToNextMilestone, nextMilestone, projectedSolvesIn30Days } = predictFutureSolves(totalSolved, avgPerDay);

  return {
    consistencyScore,
    avgProblemsPerDay: avgPerDay,
    growthRate,
    topicMastery,
    weekdayDistribution,
    insights: buildInsights({ consistencyScore, growthRate, weakTopics, inconsistent, streakRiskDays, weekdayDist: weekdayDistribution, streak, avgPerDay, hardPct: diff.hardPct }),
    recommendations: buildRecommendations({ weakTopics, inconsistent, streakRiskDays, consistencyScore, hardPct: diff.hardPct, mediumPct: diff.mediumPct, growthRate, avgPerDay }),
    predictions: { daysToNextMilestone, nextMilestone, streakBreakRiskDays: streakRiskDays, projectedSolvesIn30Days },
  };
}
