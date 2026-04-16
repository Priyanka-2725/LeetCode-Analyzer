// ─── Existing types (unchanged) ───────────────────────────────────────────────

export interface TopicStat {
  topic: string;
  count: number;
  percentage: number;
}

export interface ActivityData {
  date: string;
  count: number;
}

export interface TopicMastery {
  topic: string;
  count: number;
  mastery: number;
}

export interface Insight {
  type: 'info' | 'warning' | 'success';
  message: string;
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  message: string;
  category?: 'streak' | 'consistency' | 'difficulty' | 'topic' | 'growth';
}

export interface Prediction {
  daysToNextMilestone: number | null;
  nextMilestone: number;
  streakBreakRiskDays: number | null;
  projectedSolvesIn30Days: number;
}

export interface Analytics {
  consistencyScore: number;
  avgProblemsPerDay: number;
  growthRate: number;
  topicMastery: TopicMastery[];
  weekdayDistribution: { day: string; avg: number }[];
  insights: Insight[];
  recommendations: Recommendation[];
  predictions: Prediction;
}

// ─── Analytics Engine types (from analyticsEngine.ts) ────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high';

export interface StreakRiskPrediction {
  riskLevel: RiskLevel;
  message: string;
  daysToBreak: number | null;
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
}

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

export interface GrowthRate {
  last7: number;
  prev7: number;
  rate: number;
}

export interface BehaviorInsight {
  type: 'info' | 'warning' | 'success';
  message: string;
}

export interface BehaviorAnalysis {
  bingeDays: string[];
  inactivityGaps: number[];
  longestGap: number;
  avgSolvesPerActiveDay: number;
  peakDay: string;
  insights: BehaviorInsight[];
}

export type ProfileType =
  | 'Speed Solver'
  | 'Consistency Grinder'
  | 'Deep Solver'
  | 'Binge Coder'
  | 'Rising Coder';

export interface CodingProfile {
  type: ProfileType;
  description: string;
  traits: string[];
}

export interface EngineReport {
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

// ─── Learning Service types ───────────────────────────────────────────────────

export interface Problem {
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topics: string[];
}

export interface LearningPathEntry {
  topic: string;
  problems: Problem[];
}

export interface DailyPlan {
  dailyTarget: number;
  suggestedTopics: string[];
  problems: Problem[];
}

export interface MLPrediction {
  streakRisk:               'low' | 'medium' | 'high';
  riskScore:                number;
  predictedSolvesNextWeek:  number;
  predictedSolvesNextMonth: number;
  confidence:               number;
  performanceDecline:       boolean;
  declineSeverity:          'none' | 'mild' | 'moderate' | 'severe';
  message:                  string;
}

// ─── Main API response ────────────────────────────────────────────────────────

export interface AnalysisResult {
  username: string;
  totalSolved: number;
  easy: number;
  medium: number;
  hard: number;
  streak: number;
  topics: TopicStat[];
  strongestTopic: string;
  weakestTopic: string;
  activityData: ActivityData[];
  suggestions: string[];
  analytics?: Analytics;
  engine?: EngineReport;
  mlPrediction?: MLPrediction | null;
  // Learning service output
  learningPath?: LearningPathEntry[];
  dailyPlan?: DailyPlan;
  recommendedProblems?: Problem[];
  cached?: boolean;
}

export interface SnapshotPoint {
  snapshotDate: string;
  totalSolved: number;
  easy: number;
  medium: number;
  hard: number;
  streak: number;
  consistencyScore: number;
  growthRate: number;
  weakTopics: string[];
  strongTopics: string[];
}

export interface HistoryResponse {
  username: string;
  days: number;
  points: SnapshotPoint[];
}

export interface SubmissionEvent {
  submissionId: string;
  title: string;
  titleSlug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Unknown';
  topics?: string[];
  timestamp: number;
  submittedAt: string;
}

export interface EventsResponse {
  username: string;
  count: number;
  events: SubmissionEvent[];
}

export interface ProductivityPatterns {
  username: string;
  totalEvents: number;
  bestWeekday: string;
  bestHourUtc: number;
  weekdayCounts: Record<string, number>;
  hourCounts: number[];
}

export interface GoalForecast {
  username: string;
  target: number;
  currentTotalSolved: number;
  avgDailyProgress: number;
  daysToTarget: number | null;
  projectedDate: string | null;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
