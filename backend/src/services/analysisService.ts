import { LeetCodeRawData, TagCount } from './leetcodeService';
import { ITopicStat, IActivityData } from '../models/AnalysisResult';

export interface AnalysisOutput {
  username: string;
  totalSolved: number;
  easy: number;
  medium: number;
  hard: number;
  streak: number;
  topics: ITopicStat[];
  strongestTopic: string;
  weakestTopic: string;
  activityData: IActivityData[];
  suggestions: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDifficultyCount(
  acSubmissions: { difficulty: string; count: number }[],
  difficulty: string
): number {
  return acSubmissions.find(
    (s) => s.difficulty.toLowerCase() === difficulty.toLowerCase()
  )?.count ?? 0;
}

export function computeTopicStats(data: LeetCodeRawData): ITopicStat[] {
  const allTags: TagCount[] = [
    ...data.tagProblemCounts.fundamental,
    ...data.tagProblemCounts.intermediate,
    ...data.tagProblemCounts.advanced,
  ];

  // Merge duplicates
  const merged: Record<string, number> = {};
  for (const tag of allTags) {
    if (tag.problemsSolved > 0) {
      const key = tag.tagName;
      merged[key] = (merged[key] || 0) + tag.problemsSolved;
    }
  }

  const total = Object.values(merged).reduce((a, b) => a + b, 0) || 1;

  return Object.entries(merged)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15) // top 15 topics
    .map(([topic, count]) => ({
      topic,
      count,
      percentage: Math.round((count / total) * 100),
    }));
}

export function calculateStreak(data: LeetCodeRawData): number {
  // Use LeetCode's own streak if available
  if (data.streak > 0) return data.streak;

  // Fallback: compute from submission calendar
  const calendar = data.submissionCalendar;
  const today = Math.floor(Date.now() / 1000);
  const oneDaySec = 86400;

  let streak = 0;
  let current = today;

  while (true) {
    const found = Object.keys(calendar).some(
      (ts) => Math.floor(Number(ts) / oneDaySec) === Math.floor(current / oneDaySec)
    );
    if (!found) break;
    streak++;
    current -= oneDaySec;
    if (streak > 365) break; // safety cap
  }

  return streak;
}

export function buildActivityData(data: LeetCodeRawData): IActivityData[] {
  const calendar = data.submissionCalendar;
  const entries = Object.entries(calendar)
    .map(([ts, count]) => ({
      date: new Date(Number(ts) * 1000).toISOString().split('T')[0],
      count: count as number,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Return last 90 days
  return entries.slice(-90);
}

export function generateInsights(
  topics: ITopicStat[],
  easy: number,
  medium: number,
  hard: number,
  streak: number
): { strongestTopic: string; weakestTopic: string; suggestions: string[] } {
  const strongestTopic = topics[0]?.topic || 'N/A';
  const weakestTopic = topics[topics.length - 1]?.topic || 'N/A';

  const suggestions: string[] = [];

  if (weakestTopic !== 'N/A') {
    suggestions.push(`Focus on improving your ${weakestTopic} skills`);
  }

  const total = easy + medium + hard;
  if (total > 0) {
    const hardRatio = hard / total;
    const mediumRatio = medium / total;
    if (hardRatio < 0.1) {
      suggestions.push('Challenge yourself with more Hard problems');
    }
    if (mediumRatio < 0.3) {
      suggestions.push('Increase your Medium problem count for interview readiness');
    }
  }

  if (streak === 0) {
    suggestions.push('Start a daily solving streak to build consistency');
  } else if (streak < 7) {
    suggestions.push('Keep your streak going — aim for at least 7 days');
  } else if (streak >= 30) {
    suggestions.push('Excellent streak! Maintain your momentum');
  }

  if (topics.length > 0 && topics[0].percentage > 50) {
    suggestions.push(`Diversify beyond ${strongestTopic} to broaden your skill set`);
  }

  if (suggestions.length === 0) {
    suggestions.push('Great balance! Keep solving consistently');
  }

  return { strongestTopic, weakestTopic, suggestions };
}

// ─── Main Analyzer ────────────────────────────────────────────────────────────

export function analyzeData(data: LeetCodeRawData): AnalysisOutput {
  const acSubmissions = data.submitStats.acSubmissionNum;

  const easy = getDifficultyCount(acSubmissions, 'Easy');
  const medium = getDifficultyCount(acSubmissions, 'Medium');
  const hard = getDifficultyCount(acSubmissions, 'Hard');
  const totalSolved = easy + medium + hard;

  const streak = calculateStreak(data);
  const topics = computeTopicStats(data);
  const activityData = buildActivityData(data);
  const { strongestTopic, weakestTopic, suggestions } = generateInsights(
    topics, easy, medium, hard, streak
  );

  return {
    username: data.username,
    totalSolved,
    easy,
    medium,
    hard,
    streak,
    topics,
    strongestTopic,
    weakestTopic,
    activityData,
    suggestions,
  };
}
