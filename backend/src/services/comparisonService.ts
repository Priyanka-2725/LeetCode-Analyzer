import { AnalysisOutput } from './analysisService';
import { AnalyticsOutput, TopicMastery } from './analytics';

export type ComparisonWinner = 'A' | 'B' | 'Tie';

export interface ComparisonProfile {
  username: string;
  stats: {
    totalSolved: number;
    easy: number;
    medium: number;
    hard: number;
    streak: number;
  };
  features: {
    avgProblemsPerDay: number;
    consistencyScore: number;
    growthRate: number;
    strongestTopic: string;
    weakestTopic: string;
    easyPct: number;
    mediumPct: number;
    hardPct: number;
  };
  topicStats: TopicMastery[];
  consistencyScore: number;
  growthRate: number;
}

export interface MetricComparisonItem {
  userA: number;
  userB: number;
  difference: number;
  winner: ComparisonWinner;
}

export interface MetricComparison {
  totalSolved: MetricComparisonItem;
  avgProblemsPerDay: MetricComparisonItem;
  consistencyScore: MetricComparisonItem;
  growthRate: MetricComparisonItem;
}

export interface TopicComparisonItem {
  topic: string;
  userA: number;
  userB: number;
  difference: number;
}

export interface DifficultyComparisonItem {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  userA: number;
  userB: number;
  difference: number;
  winner: ComparisonWinner;
}

export interface TopicComparison {
  topicDeltas: TopicComparisonItem[];
  strongerTopicsA: TopicComparisonItem[];
  strongerTopicsB: TopicComparisonItem[];
  difficultyFocus: DifficultyComparisonItem[];
}

export interface ComparisonSummary {
  overallBetter: string;
  reason: string;
}

export interface ComparisonReport {
  profiles: {
    userA: ComparisonProfile;
    userB: ComparisonProfile;
  };
  metricComparison: MetricComparison;
  topicComparison: TopicComparison;
  insights: string[];
  summary: ComparisonSummary;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function getDifficultySplit(profile: ComparisonProfile) {
  const total = profile.stats.easy + profile.stats.medium + profile.stats.hard || 1;
  return {
    Easy: (profile.stats.easy / total) * 100,
    Medium: (profile.stats.medium / total) * 100,
    Hard: (profile.stats.hard / total) * 100,
  };
}

function getWinner(a: number, b: number): ComparisonWinner {
  if (Math.abs(a - b) < 0.0001) return 'Tie';
  return a > b ? 'A' : 'B';
}

function buildMetricItem(userA: number, userB: number): MetricComparisonItem {
  return {
    userA: round(userA),
    userB: round(userB),
    difference: round(userA - userB),
    winner: getWinner(userA, userB),
  };
}

function buildTopicMap(topics: TopicMastery[]) {
  return new Map(topics.map((topic) => [topic.topic, topic.mastery]));
}

function scoreProfile(profile: ComparisonProfile): number {
  const topicAvg = profile.topicStats.length
    ? profile.topicStats.reduce((sum, topic) => sum + topic.mastery, 0) / profile.topicStats.length
    : 0;

  return (
    profile.stats.totalSolved * 0.12
    + profile.features.avgProblemsPerDay * 10
    + profile.features.consistencyScore * 1.35
    + profile.features.growthRate * 0.45
    + topicAvg * 0.75
  );
}

export function compareMetrics(userA: ComparisonProfile, userB: ComparisonProfile): MetricComparison {
  return {
    totalSolved: buildMetricItem(userA.stats.totalSolved, userB.stats.totalSolved),
    avgProblemsPerDay: buildMetricItem(userA.features.avgProblemsPerDay, userB.features.avgProblemsPerDay),
    consistencyScore: buildMetricItem(userA.consistencyScore, userB.consistencyScore),
    growthRate: buildMetricItem(userA.growthRate, userB.growthRate),
  };
}

export function compareTopics(userA: ComparisonProfile, userB: ComparisonProfile): TopicComparison {
  const topicMap = new Map<string, { userA: number; userB: number }>();
  const aMap = buildTopicMap(userA.topicStats);
  const bMap = buildTopicMap(userB.topicStats);

  for (const [topic, mastery] of aMap.entries()) {
    topicMap.set(topic, { userA: mastery, userB: bMap.get(topic) ?? 0 });
  }

  for (const [topic, mastery] of bMap.entries()) {
    const current = topicMap.get(topic) || { userA: 0, userB: 0 };
    topicMap.set(topic, { userA: current.userA, userB: mastery });
  }

  const topicDeltas = [...topicMap.entries()]
    .map(([topic, values]) => ({
      topic,
      userA: round(values.userA),
      userB: round(values.userB),
      difference: round(values.userA - values.userB),
    }))
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference) || a.topic.localeCompare(b.topic));

  const strongerTopicsA = topicDeltas
    .filter((topic) => topic.difference > 0)
    .slice(0, 5)
    .map((topic) => ({ ...topic, difference: round(Math.abs(topic.difference)) }));

  const strongerTopicsB = topicDeltas
    .filter((topic) => topic.difference < 0)
    .slice(0, 5)
    .map((topic) => ({ ...topic, difference: round(Math.abs(topic.difference)) }));

  const difficultyA = getDifficultySplit(userA);
  const difficultyB = getDifficultySplit(userB);
  const difficultyFocus: DifficultyComparisonItem[] = (['Easy', 'Medium', 'Hard'] as const).map((difficulty) => {
    const userAValue = difficultyA[difficulty as keyof typeof difficultyA];
    const userBValue = difficultyB[difficulty as keyof typeof difficultyB];
    return {
      difficulty,
      userA: round(userAValue),
      userB: round(userBValue),
      difference: round(userAValue - userBValue),
      winner: getWinner(userAValue, userBValue),
    };
  });

  return {
    topicDeltas,
    strongerTopicsA,
    strongerTopicsB,
    difficultyFocus,
  };
}

export function generateComparisonInsights(
  userA: ComparisonProfile,
  userB: ComparisonProfile,
  metricComparison: MetricComparison,
  topicComparison: TopicComparison,
): string[] {
  const insights: string[] = [];

  if (metricComparison.consistencyScore.winner !== 'Tie') {
    const leader = metricComparison.consistencyScore.winner === 'A' ? userA.username : userB.username;
    const trailer = metricComparison.consistencyScore.winner === 'A' ? userB.username : userA.username;
    insights.push(`${leader} is more consistent than ${trailer} by ${Math.abs(metricComparison.consistencyScore.difference).toFixed(1)} points.`);
  }

  if (metricComparison.avgProblemsPerDay.winner !== 'Tie') {
    const leader = metricComparison.avgProblemsPerDay.winner === 'A' ? userA.username : userB.username;
    const trailer = metricComparison.avgProblemsPerDay.winner === 'A' ? userB.username : userA.username;
    insights.push(`${leader} solves more problems per day than ${trailer}.`);
  }

  if (metricComparison.growthRate.winner !== 'Tie') {
    const leader = metricComparison.growthRate.winner === 'A' ? userA.username : userB.username;
    insights.push(`${leader} has the stronger recent growth trend.`);
  }

  if (metricComparison.totalSolved.winner !== 'Tie') {
    const leader = metricComparison.totalSolved.winner === 'A' ? userA.username : userB.username;
    insights.push(`${leader} has solved more total problems.`);
  }

  const strongestA = topicComparison.strongerTopicsA[0];
  const strongestB = topicComparison.strongerTopicsB[0];
  if (strongestA && strongestB) {
    insights.push(`${userA.username} is ahead in ${strongestA.topic}, while ${userB.username} is stronger in ${strongestB.topic}.`);
  } else if (strongestA) {
    insights.push(`${userA.username} has the clearer advantage in ${strongestA.topic}.`);
  } else if (strongestB) {
    insights.push(`${userB.username} has the clearer advantage in ${strongestB.topic}.`);
  }

  const hardFocus = topicComparison.difficultyFocus.find((item) => item.difficulty === 'Hard');
  const easyFocus = topicComparison.difficultyFocus.find((item) => item.difficulty === 'Easy');
  if (hardFocus && hardFocus.winner !== 'Tie') {
    const leader = hardFocus.winner === 'A' ? userA.username : userB.username;
    insights.push(`${leader} attempts more Hard problems.`);
  }
  if (easyFocus && easyFocus.winner !== 'Tie') {
    const leader = easyFocus.winner === 'A' ? userA.username : userB.username;
    insights.push(`${leader} leans more toward Easy problems.`);
  }

  return insights.slice(0, 6);
}

export function generateSummary(
  userA: ComparisonProfile,
  userB: ComparisonProfile,
  metricComparison: MetricComparison,
  topicComparison: TopicComparison,
): ComparisonSummary {
  const scoreA = scoreProfile(userA);
  const scoreB = scoreProfile(userB);

  if (Math.abs(scoreA - scoreB) < 1) {
    return {
      overallBetter: 'Tie',
      reason: 'Both profiles are very close overall, with no decisive gap across metrics and topic mastery.',
    };
  }

  const better = scoreA > scoreB ? userA : userB;
  const other = scoreA > scoreB ? userB : userA;

  const keyMetrics = [
    metricComparison.consistencyScore.winner !== 'Tie' ? 'consistency' : null,
    metricComparison.growthRate.winner !== 'Tie' ? 'growth' : null,
    metricComparison.totalSolved.winner !== 'Tie' ? 'total solved' : null,
  ].filter(Boolean) as string[];

  const keyTopic = topicComparison.strongerTopicsA[0] && scoreA > scoreB
    ? topicComparison.strongerTopicsA[0].topic
    : topicComparison.strongerTopicsB[0]?.topic;

  const reasons: string[] = [];
  if (keyMetrics.length > 0) {
    reasons.push(`higher ${keyMetrics.slice(0, 2).join(' and ')}`);
  }
  if (keyTopic) {
    reasons.push(`stronger ${keyTopic} mastery`);
  }

  return {
    overallBetter: better.username,
    reason: `${better.username} is ahead over ${other.username} because of ${reasons.join(', ')}.`,
  };
}

export function compareProfiles(userA: ComparisonProfile, userB: ComparisonProfile): ComparisonReport {
  const metricComparison = compareMetrics(userA, userB);
  const topicComparison = compareTopics(userA, userB);
  const insights = generateComparisonInsights(userA, userB, metricComparison, topicComparison);
  const summary = generateSummary(userA, userB, metricComparison, topicComparison);

  return {
    profiles: { userA, userB },
    metricComparison,
    topicComparison,
    insights,
    summary,
  };
}

export function toComparisonProfile(params: {
  username: string;
  analysis: AnalysisOutput;
  analytics: AnalyticsOutput;
}): ComparisonProfile {
  const { username, analysis, analytics } = params;
  const total = analysis.easy + analysis.medium + analysis.hard || 1;

  return {
    username,
    stats: {
      totalSolved: analysis.totalSolved,
      easy: analysis.easy,
      medium: analysis.medium,
      hard: analysis.hard,
      streak: analysis.streak,
    },
    features: {
      avgProblemsPerDay: analytics.avgProblemsPerDay,
      consistencyScore: analytics.consistencyScore,
      growthRate: analytics.growthRate,
      strongestTopic: analysis.strongestTopic,
      weakestTopic: analysis.weakestTopic,
      easyPct: round((analysis.easy / total) * 100),
      mediumPct: round((analysis.medium / total) * 100),
      hardPct: round((analysis.hard / total) * 100),
    },
    topicStats: analytics.topicMastery,
    consistencyScore: analytics.consistencyScore,
    growthRate: analytics.growthRate,
  };
}