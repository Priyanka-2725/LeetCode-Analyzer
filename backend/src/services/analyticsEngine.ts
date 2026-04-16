/**
 * analyticsEngine.ts
 *
 * A standalone analytics engine that converts raw LeetCode submission data
 * into insights, predictions, recommendations, and behavioral patterns.
 *
 * Input:  Submission[]  — raw per-solve records
 * Output: AnalyticsReport — fully computed analytics object
 *
 * Does NOT modify or depend on any existing fetch/analysis logic.
 */

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface Submission {
  timestamp: number;   // Unix seconds
  difficulty: 'Easy' | 'Medium' | 'Hard';
  titleSlug: string;
  timeTaken?: number;  // seconds spent (optional)
}

// ─── Output Types ─────────────────────────────────────────────────────────────

export interface BasicStats {
  totalSolved: number;
  easy: number;
  medium: number;
  hard: number;
  easyPct: number;
  mediumPct: number;
  hardPct: number;
  uniqueProblems: number;
}

export interface StreakResult {
  currentStreak: number;   // consecutive days up to today
  longestStreak: number;   // all-time best
  lastActiveDate: string;  // YYYY-MM-DD
}

export interface TopicStat {
  topic: string;
  count: number;
  percentage: number;
}

export interface WeakStrongTopics {
  weak: string[];
  strong: string[];
}

export type InsightType = 'info' | 'warning' | 'success';

export interface Insight {
  type: InsightType;
  message: string;
}

export interface BehaviorAnalysis {
  bingeDays: string[];          // dates with unusually high solves
  inactivityGaps: number[];     // gap lengths in days between active periods
  longestGap: number;           // longest inactivity gap in days
  avgSolvesPerActiveDay: number;
  peakDay: string;              // day-of-week with highest avg solves
  insights: Insight[];
}

export interface GrowthRate {
  last7: number;
  prev7: number;
  rate: number;   // % change; positive = growth, negative = decline
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface StreakRiskPrediction {
  riskLevel: RiskLevel;
  message: string;
  daysToBreak: number | null;  // estimated days until streak breaks at current pace
}

export type ProfileType = 'Speed Solver' | 'Consistency Grinder' | 'Deep Solver' | 'Binge Coder' | 'Rising Coder';

export interface CodingProfile {
  type: ProfileType;
  description: string;
  traits: string[];
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  message: string;
  category: 'streak' | 'consistency' | 'difficulty' | 'topic' | 'growth';
}

export interface AnalyticsReport {
  stats: BasicStats;
  streak: StreakResult;
  consistencyScore: number;
  growthRate: GrowthRate;
  topicStats: TopicStat[];
  weakTopics: string[];
  strongTopics: string[];
  behavior: BehaviorAnalysis;
  prediction: StreakRiskPrediction;
  profile: CodingProfile;
  recommendations: Recommendation[];
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/** Convert Unix timestamp (seconds) to YYYY-MM-DD string in local date */
function toDateStr(ts: number): string {
  return new Date(ts * 1000).toISOString().split('T')[0];
}

/** Parse YYYY-MM-DD to a UTC midnight Date */
function parseDate(d: string): Date {
  return new Date(d + 'T00:00:00Z');
}

/** Days between two YYYY-MM-DD strings (absolute) */
function daysBetween(a: string, b: string): number {
  return Math.abs(
    Math.round((parseDate(a).getTime() - parseDate(b).getTime()) / 86_400_000)
  );
}

/** Today as YYYY-MM-DD (UTC) */
function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/** Group submissions by date → count */
function groupByDate(submissions: Submission[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of submissions) {
    const d = toDateStr(s.timestamp);
    map.set(d, (map.get(d) ?? 0) + 1);
  }
  return map;
}

/** Sorted unique active dates (ascending) */
function activeDates(byDate: Map<string, number>): string[] {
  return [...byDate.keys()].sort();
}

// ─── 1. BASIC STATS ───────────────────────────────────────────────────────────

export function getBasicStats(submissions: Submission[]): BasicStats {
  const counts = { Easy: 0, Medium: 0, Hard: 0 };
  const seen = new Set<string>();

  for (const s of submissions) {
    counts[s.difficulty]++;
    seen.add(s.titleSlug);
  }

  const total = submissions.length;
  const safe = total || 1;

  return {
    totalSolved: total,
    easy: counts.Easy,
    medium: counts.Medium,
    hard: counts.Hard,
    easyPct:   Math.round((counts.Easy   / safe) * 100),
    mediumPct: Math.round((counts.Medium / safe) * 100),
    hardPct:   Math.round((counts.Hard   / safe) * 100),
    uniqueProblems: seen.size,
  };
}

// ─── 2. STREAK CALCULATION ────────────────────────────────────────────────────

export function calculateStreak(submissions: Submission[]): StreakResult {
  if (submissions.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastActiveDate: '' };
  }

  const byDate = groupByDate(submissions);
  const dates = activeDates(byDate);
  const today = todayStr();
  const yesterday = toDateStr(Math.floor(Date.now() / 1000) - 86_400);

  // Current streak — walk backwards from today/yesterday
  let currentStreak = 0;
  const lastDate = dates[dates.length - 1];

  // Only count current streak if active today or yesterday (not broken)
  if (lastDate === today || lastDate === yesterday) {
    let cursor = lastDate;
    for (let i = dates.length - 1; i >= 0; i--) {
      if (dates[i] === cursor) {
        currentStreak++;
        // Step back one day
        const prev = new Date(parseDate(cursor).getTime() - 86_400_000)
          .toISOString().split('T')[0];
        cursor = prev;
      } else {
        break;
      }
    }
  }

  // Longest streak — scan all dates
  let longest = 0;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    if (daysBetween(dates[i], dates[i - 1]) === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }
  longest = Math.max(longest, run, currentStreak);

  return {
    currentStreak,
    longestStreak: longest,
    lastActiveDate: lastDate,
  };
}

// ─── 3. CONSISTENCY SCORE ─────────────────────────────────────────────────────

export function calculateConsistency(submissions: Submission[]): number {
  if (submissions.length === 0) return 0;

  const byDate = groupByDate(submissions);
  const dates = activeDates(byDate);
  if (dates.length === 0) return 0;

  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const totalDays = Math.max(1, daysBetween(firstDate, lastDate) + 1);
  const activeDayCount = dates.length;

  return Math.min(100, Math.round((activeDayCount / totalDays) * 100));
}

// ─── 4. TOPIC STATS ───────────────────────────────────────────────────────────

/**
 * Maps titleSlug keywords → topic labels.
 * Covers the most common LeetCode topic patterns.
 */
const TOPIC_PATTERNS: [RegExp, string][] = [
  [/two.?sum|three.?sum|four.?sum/i,                    'Array'],
  [/array|subarray|matrix|rotate|spiral|search.?2d/i,   'Array'],
  [/linked.?list|reverse.?list|merge.?list|cycle/i,     'Linked List'],
  [/tree|bst|binary.?tree|level.?order|inorder|preorder|postorder|trie/i, 'Trees'],
  [/graph|island|clone|course|schedule|network|path|word.?ladder/i, 'Graphs'],
  [/dynamic|dp|knapsack|coin|climb|jump|house.?rob|edit.?dist/i, 'Dynamic Programming'],
  [/sort|merge.?sort|quick.?sort|heap.?sort|bucket|counting.?sort/i, 'Sorting'],
  [/binary.?search|search.?rotated|find.?peak|sqrt/i,   'Binary Search'],
  [/stack|valid.?paren|min.?stack|decode|asteroid/i,    'Stack'],
  [/queue|sliding.?window|deque|moving.?average/i,      'Queue / Sliding Window'],
  [/hash|anagram|group|two.?sum|contains.?dup/i,        'Hash Map'],
  [/string|palindrome|substring|longest|reverse.?string|roman|zigzag/i, 'Strings'],
  [/backtrack|permut|subset|combination|n.?queen|sudoku/i, 'Backtracking'],
  [/greedy|interval|meeting|jump.?game|gas.?station/i,  'Greedy'],
  [/bit|xor|single.?number|count.?bits|power.?of/i,     'Bit Manipulation'],
  [/math|prime|factorial|fibonacci|pow|sqrt|gcd/i,      'Math'],
  [/heap|priority.?queue|kth.?largest|top.?k|median/i,  'Heap'],
  [/design|lru|lfu|iterator|serialize|implement/i,      'Design'],
  [/two.?pointer|container|water|trap.?rain/i,          'Two Pointers'],
  [/prefix|suffix|product|range.?sum/i,                 'Prefix Sum'],
];

function inferTopic(titleSlug: string): string {
  for (const [pattern, topic] of TOPIC_PATTERNS) {
    if (pattern.test(titleSlug)) return topic;
  }
  return 'Other';
}

export function computeTopicStats(submissions: Submission[]): TopicStat[] {
  const counts = new Map<string, number>();

  for (const s of submissions) {
    const topic = inferTopic(s.titleSlug);
    counts.set(topic, (counts.get(topic) ?? 0) + 1);
  }

  const total = submissions.length || 1;
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([topic, count]) => ({
      topic,
      count,
      percentage: Math.round((count / total) * 100),
    }));
}

// ─── 5. WEAK & STRONG TOPICS ─────────────────────────────────────────────────

export function detectWeakTopics(topicStats: TopicStat[]): string[] {
  if (topicStats.length < 3) return [];
  const avg = topicStats.reduce((s, t) => s + t.count, 0) / topicStats.length;
  return topicStats
    .filter((t) => t.count < avg * 0.45 && t.topic !== 'Other')
    .map((t) => t.topic)
    .slice(0, 5);
}

export function detectStrongTopics(topicStats: TopicStat[]): string[] {
  if (topicStats.length === 0) return [];
  const avg = topicStats.reduce((s, t) => s + t.count, 0) / topicStats.length;
  return topicStats
    .filter((t) => t.count >= avg * 1.5 && t.topic !== 'Other')
    .map((t) => t.topic)
    .slice(0, 5);
}

// ─── 6. BEHAVIOR ANALYSIS ────────────────────────────────────────────────────

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function analyzeBehavior(submissions: Submission[]): BehaviorAnalysis {
  if (submissions.length === 0) {
    return {
      bingeDays: [], inactivityGaps: [], longestGap: 0,
      avgSolvesPerActiveDay: 0, peakDay: 'N/A', insights: [],
    };
  }

  const byDate = groupByDate(submissions);
  const dates = activeDates(byDate);

  // Binge days: days with solves > mean + 2 * stddev
  const counts = [...byDate.values()];
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const variance = counts.reduce((s, c) => s + Math.pow(c - mean, 2), 0) / counts.length;
  const stddev = Math.sqrt(variance);
  const bingeThreshold = Math.max(mean + 2 * stddev, mean * 2.5, 5);
  const bingeDays = dates.filter((d) => (byDate.get(d) ?? 0) >= bingeThreshold);

  // Inactivity gaps between consecutive active dates
  const inactivityGaps: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const gap = daysBetween(dates[i], dates[i - 1]) - 1; // -1: gap between days
    if (gap >= 3) inactivityGaps.push(gap); // only notable gaps (3+ days)
  }
  const longestGap = inactivityGaps.length ? Math.max(...inactivityGaps) : 0;

  // Average solves per active day
  const avgSolvesPerActiveDay =
    Math.round((submissions.length / Math.max(1, dates.length)) * 10) / 10;

  // Peak day of week
  const dayBuckets: Record<string, number[]> = {};
  DAYS.forEach((d) => (dayBuckets[d] = []));
  for (const [date, count] of byDate) {
    const dow = DAYS[new Date(date + 'T12:00:00Z').getDay()];
    dayBuckets[dow].push(count);
  }
  const dayAvgs = DAYS.map((d) => {
    const vals = dayBuckets[d];
    return { day: d, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
  });
  const peakDay = dayAvgs.sort((a, b) => b.avg - a.avg)[0]?.day ?? 'N/A';

  // Behavioral insights
  const insights: Insight[] = [];

  if (bingeDays.length >= 3) {
    insights.push({
      type: 'warning',
      message: `Binge-solving detected on ${bingeDays.length} days — consider spreading solves more evenly`,
    });
  } else if (bingeDays.length > 0) {
    insights.push({
      type: 'info',
      message: `You had ${bingeDays.length} high-volume day${bingeDays.length > 1 ? 's' : ''} — great bursts of effort`,
    });
  }

  if (longestGap >= 14) {
    insights.push({
      type: 'warning',
      message: `Longest inactivity gap: ${longestGap} days — try to avoid long breaks`,
    });
  } else if (longestGap >= 7) {
    insights.push({
      type: 'info',
      message: `You had a ${longestGap}-day gap — shorter breaks help maintain momentum`,
    });
  }

  if (inactivityGaps.filter((g) => g >= 3).length > 5) {
    insights.push({
      type: 'warning',
      message: 'Irregular solving pattern — multiple gaps of 3+ days detected',
    });
  }

  if (avgSolvesPerActiveDay >= 5) {
    insights.push({
      type: 'success',
      message: `High output: averaging ${avgSolvesPerActiveDay} solves per active day`,
    });
  }

  insights.push({
    type: 'info',
    message: `Your most productive day of the week is ${peakDay}`,
  });

  return { bingeDays, inactivityGaps, longestGap, avgSolvesPerActiveDay, peakDay, insights };
}

// ─── 7. GROWTH RATE ───────────────────────────────────────────────────────────

export function calculateGrowthRate(submissions: Submission[]): GrowthRate {
  const now = Math.floor(Date.now() / 1000);
  const day = 86_400;

  const last7  = submissions.filter((s) => s.timestamp >= now - 7  * day).length;
  const prev7  = submissions.filter((s) => s.timestamp >= now - 14 * day && s.timestamp < now - 7 * day).length;

  let rate = 0;
  if (prev7 === 0) {
    rate = last7 > 0 ? 100 : 0;
  } else {
    rate = Math.round(((last7 - prev7) / prev7) * 100);
  }

  return { last7, prev7, rate };
}

// ─── 8. STREAK RISK PREDICTION ───────────────────────────────────────────────

export function predictStreakRisk(submissions: Submission[]): StreakRiskPrediction {
  const streakResult = calculateStreak(submissions);

  if (streakResult.currentStreak === 0) {
    return {
      riskLevel: 'low',
      message: 'No active streak to protect — start one today.',
      daysToBreak: null,
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const day = 86_400;

  // Solves in last 7 days
  const last7Subs = submissions.filter((s) => s.timestamp >= now - 7 * day);
  const activeLast7 = new Set(last7Subs.map((s) => toDateStr(s.timestamp))).size;

  // Solves in last 3 days
  const last3Subs = submissions.filter((s) => s.timestamp >= now - 3 * day);
  const activeLast3 = new Set(last3Subs.map((s) => toDateStr(s.timestamp))).size;

  // Trend: declining if last 3 days have fewer active days than expected
  const declining = activeLast3 < 2 && activeLast7 < 5;
  const veryLow   = activeLast3 === 0;

  if (veryLow) {
    return {
      riskLevel: 'high',
      message: 'No activity in the last 3 days — your streak is at immediate risk. Solve at least 1 problem today.',
      daysToBreak: 1,
    };
  }

  if (declining) {
    return {
      riskLevel: 'medium',
      message: 'Activity is declining. Solve at least 1 problem daily to protect your streak.',
      daysToBreak: 2,
    };
  }

  return {
    riskLevel: 'low',
    message: `Streak is healthy at ${streakResult.currentStreak} days. Keep the momentum going.`,
    daysToBreak: null,
  };
}

// ─── 9. CODING PROFILE ───────────────────────────────────────────────────────

export function generateCodingProfile(
  stats: BasicStats,
  behavior: BehaviorAnalysis,
  streak: StreakResult,
  consistencyScore: number
): CodingProfile {
  const { hardPct, mediumPct, totalSolved } = stats;
  const { bingeDays, avgSolvesPerActiveDay } = behavior;

  // Speed Solver: high volume, fast pace, many solves per day
  if (avgSolvesPerActiveDay >= 4 && hardPct < 15) {
    return {
      type: 'Speed Solver',
      description: 'You solve problems rapidly and in high volume. Quantity is your strength.',
      traits: ['High daily output', 'Prefers easier problems', 'Fast iteration'],
    };
  }

  // Consistency Grinder: high streak, high consistency
  if (streak.currentStreak >= 14 && consistencyScore >= 65) {
    return {
      type: 'Consistency Grinder',
      description: 'You show up every day without fail. Discipline and routine define your journey.',
      traits: ['Long active streaks', 'Daily habit', 'Steady progress'],
    };
  }

  // Deep Solver: high hard % or high medium %, lower volume
  if (hardPct >= 20 || (mediumPct >= 50 && totalSolved >= 50)) {
    return {
      type: 'Deep Solver',
      description: 'You tackle complex problems head-on. Quality over quantity is your philosophy.',
      traits: ['Prefers Hard/Medium', 'Thorough approach', 'Strong problem-solving depth'],
    };
  }

  // Binge Coder: many binge days, irregular pattern
  if (bingeDays.length >= 4) {
    return {
      type: 'Binge Coder',
      description: 'You solve in intense bursts. High energy sessions followed by rest periods.',
      traits: ['Burst activity', 'High-volume days', 'Irregular schedule'],
    };
  }

  // Default: Rising Coder
  return {
    type: 'Rising Coder',
    description: "You're building your foundation. Every problem solved is a step forward.",
    traits: ['Growing momentum', 'Building habits', 'Expanding skill set'],
  };
}

// ─── 10. RECOMMENDATIONS ENGINE ──────────────────────────────────────────────

export function generateRecommendations(data: {
  stats: BasicStats;
  consistencyScore: number;
  growthRate: GrowthRate;
  weakTopics: string[];
  behavior: BehaviorAnalysis;
  prediction: StreakRiskPrediction;
  streak: StreakResult;
}): Recommendation[] {
  const { stats, consistencyScore, growthRate, weakTopics, behavior, prediction, streak } = data;
  const recs: Recommendation[] = [];

  // ── Streak protection ──
  if (prediction.riskLevel === 'high') {
    recs.push({
      priority: 'high',
      category: 'streak',
      message: 'Solve at least 1 problem today — your streak is at immediate risk of breaking.',
    });
  } else if (prediction.riskLevel === 'medium') {
    recs.push({
      priority: 'high',
      category: 'streak',
      message: 'Activity is declining. Commit to 1 problem per day to keep your streak alive.',
    });
  }

  // ── Weak topics ──
  if (weakTopics.length > 0) {
    recs.push({
      priority: 'high',
      category: 'topic',
      message: `Focus on your weak areas: ${weakTopics.slice(0, 3).join(', ')}. Dedicate 2–3 sessions per week.`,
    });
  }

  // ── Consistency ──
  if (consistencyScore < 30) {
    recs.push({
      priority: 'high',
      category: 'consistency',
      message: 'Consistency score is very low. Set a daily reminder and aim for at least 1 solve per day.',
    });
  } else if (consistencyScore < 55) {
    recs.push({
      priority: 'medium',
      category: 'consistency',
      message: `Consistency at ${consistencyScore}% — try solving on more days per week to build a stronger habit.`,
    });
  }

  // ── Difficulty balance ──
  if (stats.hardPct < 8 && stats.totalSolved >= 30) {
    recs.push({
      priority: 'medium',
      category: 'difficulty',
      message: 'Only ' + stats.hardPct + '% Hard problems. Push yourself with at least 1 Hard problem per week.',
    });
  }

  if (stats.mediumPct < 30 && stats.totalSolved >= 20) {
    recs.push({
      priority: 'medium',
      category: 'difficulty',
      message: 'Medium problems are the backbone of coding interviews. Aim for 40–50% Medium in your mix.',
    });
  }

  // ── Growth ──
  if (growthRate.rate < -25) {
    recs.push({
      priority: 'medium',
      category: 'growth',
      message: `Activity dropped ${Math.abs(growthRate.rate)}% vs last week. Re-engage with a structured daily plan.`,
    });
  } else if (growthRate.rate > 30) {
    recs.push({
      priority: 'low',
      category: 'growth',
      message: `Great momentum — ${growthRate.rate}% growth this week. Keep it up and tackle harder topics.`,
    });
  }

  // ── Binge pattern ──
  if (behavior.bingeDays.length >= 3 && consistencyScore < 50) {
    recs.push({
      priority: 'medium',
      category: 'consistency',
      message: 'You tend to binge-solve then go inactive. Spread your effort: 2–3 problems daily beats 20 in one day.',
    });
  }

  // ── Long inactivity gaps ──
  if (behavior.longestGap >= 14) {
    recs.push({
      priority: 'medium',
      category: 'consistency',
      message: `You had a ${behavior.longestGap}-day gap. Use a calendar reminder to prevent long breaks.`,
    });
  }

  // ── Streak milestone ──
  if (streak.currentStreak >= 30) {
    recs.push({
      priority: 'low',
      category: 'streak',
      message: `${streak.currentStreak}-day streak — you're in elite territory. Now focus on problem quality.`,
    });
  } else if (streak.currentStreak >= 7) {
    recs.push({
      priority: 'low',
      category: 'streak',
      message: `${streak.currentStreak}-day streak going strong. Aim for the 30-day milestone.`,
    });
  }

  // Fallback
  if (recs.length === 0) {
    recs.push({
      priority: 'low',
      category: 'growth',
      message: 'Solid performance across the board. Keep solving consistently and push into harder territory.',
    });
  }

  return recs;
}

// ─── MAIN ENTRY POINT ─────────────────────────────────────────────────────────

/**
 * runAnalyticsEngine
 *
 * Accepts raw submissions and returns a fully computed AnalyticsReport.
 *
 * @example
 * const report = runAnalyticsEngine(submissions);
 */
export function runAnalyticsEngine(submissions: Submission[]): AnalyticsReport {
  // Deduplicate: keep latest submission per titleSlug (re-solves are valid, keep all for counts)
  // Sort ascending by timestamp for streak/gap calculations
  const sorted = [...submissions].sort((a, b) => a.timestamp - b.timestamp);

  const stats          = getBasicStats(sorted);
  const streak         = calculateStreak(sorted);
  const consistencyScore = calculateConsistency(sorted);
  const growthRate     = calculateGrowthRate(sorted);
  const topicStats     = computeTopicStats(sorted);
  const weakTopics     = detectWeakTopics(topicStats);
  const strongTopics   = detectStrongTopics(topicStats);
  const behavior       = analyzeBehavior(sorted);
  const prediction     = predictStreakRisk(sorted);
  const profile        = generateCodingProfile(stats, behavior, streak, consistencyScore);
  const recommendations = generateRecommendations({
    stats, consistencyScore, growthRate, weakTopics, behavior, prediction, streak,
  });

  return {
    stats,
    streak,
    consistencyScore,
    growthRate,
    topicStats,
    weakTopics,
    strongTopics,
    behavior,
    prediction,
    profile,
    recommendations,
  };
}
