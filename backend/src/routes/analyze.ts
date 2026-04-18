import { Router, Request, Response } from 'express';
import { extractUsername } from '../utils/extractUsername';
import { fetchLeetCodeData } from '../services/leetcodeService';
import { analyzeData } from '../services/analysisService';
import { computeAnalytics } from '../services/analytics';
import { getCache, setCache } from '../config/redis';
import AnalysisResult from '../models/AnalysisResult';
import { generateLearningOutput } from '../services/learningService';
import { getMLPrediction } from '../services/mlService';
import { buildSkillEvolution } from '../services/skillEvolutionService';
import { runSimulation } from '../services/simulationService';
import {
  exportHistoryCsv,
  getGoalForecast,
  getProductivityPatterns,
  getSnapshotHistory,
  getSubmissionEvents,
  persistSnapshot,
  persistSubmissionEvents,
} from '../services/historyService';

const router = Router();
const CACHE_TTL = Number(process.env.CACHE_TTL_SECONDS) || 3600;

function deriveWeakAndStrongTopics(topicMastery: { topic: string; mastery: number }[]) {
  const avgMastery = topicMastery.reduce((s, t) => s + t.mastery, 0) / (topicMastery.length || 1);

  const weakTopics = topicMastery
    .filter((t) => t.mastery < avgMastery * 0.5)
    .map((t) => t.topic)
    .slice(0, 5);

  const strongTopics = topicMastery
    .filter((t) => t.mastery >= avgMastery * 1.5)
    .map((t) => t.topic)
    .slice(0, 5);

  return { weakTopics, strongTopics };
}

// ── Helper: build ML input from computed analytics ────────────────────────────

function buildMLInput(analytics: ReturnType<typeof computeAnalytics>, weakTopicsCount: number) {
  return {
    avgProblemsPerDay: analytics.avgProblemsPerDay,
    consistencyScore:  analytics.consistencyScore,
    growthRate:        analytics.growthRate,
    weakTopicsCount,
  };
}

function mapRecentEvents(recent: {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Unknown';
  topics: string[];
}[]) {
  return recent.map((s) => ({
    submissionId: s.id,
    title: s.title,
    titleSlug: s.titleSlug,
    difficulty: s.difficulty,
    topics: s.topics,
    timestamp: s.timestamp,
    submittedAt: new Date(s.timestamp * 1000).toISOString(),
  }));
}

function mapStoredEvents(recent: {
  submissionId: string;
  title: string;
  titleSlug: string;
  timestamp: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Unknown';
  topics: string[];
  submittedAt: Date;
}[]) {
  return recent.map((s) => ({
    submissionId: s.submissionId,
    title: s.title,
    titleSlug: s.titleSlug,
    difficulty: s.difficulty,
    topics: s.topics,
    timestamp: s.timestamp,
    submittedAt: new Date(s.submittedAt).toISOString(),
  }));
}

// ── POST /api/analyze ─────────────────────────────────────────────────────────

router.post('/analyze', async (req: Request, res: Response): Promise<void> => {
  const { username: rawInput } = req.body;

  if (!rawInput || typeof rawInput !== 'string') {
    res.status(400).json({ error: 'username is required' });
    return;
  }

  let username: string;
  try {
    username = extractUsername(rawInput);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
    return;
  }

  const cacheKey = `analysis:${username.toLowerCase()}`;

  // 1. Redis cache hit
  const cached = await getCache(cacheKey);
  if (cached) {
    res.json({ ...JSON.parse(cached), cached: true });
    return;
  }

  // 2. MongoDB cache hit (within TTL window)
  try {
    const oneHourAgo = new Date(Date.now() - CACHE_TTL * 1000);
    const dbCached = await AnalysisResult.findOne({
      username: username.toLowerCase(),
      fetchedAt: { $gte: oneHourAgo },
    }).lean();

    if (dbCached) {
      const storedEvents = await getSubmissionEvents(username, 200);

      const analytics = computeAnalytics({
        easy: dbCached.easy, medium: dbCached.medium, hard: dbCached.hard,
        totalSolved: dbCached.totalSolved, streak: dbCached.streak,
        topics: dbCached.topics, activityData: dbCached.activityData,
      });

      const { weakTopics, strongTopics } = deriveWeakAndStrongTopics(analytics.topicMastery);
      const weakTopicsCount = weakTopics.length;

      const mlPrediction = await getMLPrediction(buildMLInput(analytics, weakTopicsCount));

      const learning = generateLearningOutput({
        weakTopics, strongTopics,
        consistencyScore: analytics.consistencyScore,
        growthRate: analytics.growthRate,
      });

      const skillEvolution = buildSkillEvolution(
        storedEvents.map((event) => ({
          timestamp: event.timestamp,
          titleSlug: event.titleSlug,
          difficulty: event.difficulty,
        })),
      );

      // Persist historical snapshot for trend analytics.
      try {
        await persistSnapshot({
          username,
          analysis: {
            username: dbCached.username,
            totalSolved: dbCached.totalSolved,
            easy: dbCached.easy,
            medium: dbCached.medium,
            hard: dbCached.hard,
            streak: dbCached.streak,
            topics: dbCached.topics,
            strongestTopic: dbCached.strongestTopic,
            weakestTopic: dbCached.weakestTopic,
            activityData: dbCached.activityData,
            suggestions: dbCached.suggestions,
          },
          analytics,
          weakTopics,
          strongTopics,
        });
      } catch {
        // Skip history persistence on DB failures.
      }

      const result = {
        ...dbCached,
        analytics,
        ...learning,
        mlPrediction,
        recentEvents: mapStoredEvents(storedEvents),
        skillEvolution,
        cached: true,
      };
      await setCache(cacheKey, JSON.stringify(result), CACHE_TTL);
      res.json(result);
      return;
    }
  } catch {
    // MongoDB unavailable — continue to live fetch
  }

  // 3. Live fetch from LeetCode
  try {
    const rawData  = await fetchLeetCodeData(username);
    const analysis = analyzeData(rawData);
    const analytics = computeAnalytics({
      easy: analysis.easy, medium: analysis.medium, hard: analysis.hard,
      totalSolved: analysis.totalSolved, streak: analysis.streak,
      topics: analysis.topics, activityData: analysis.activityData,
    });

    // Derive weak / strong topics for learning service + ML input
    const { weakTopics, strongTopics } = deriveWeakAndStrongTopics(analytics.topicMastery);

    const learning = generateLearningOutput({
      weakTopics, strongTopics,
      consistencyScore: analytics.consistencyScore,
      growthRate: analytics.growthRate,
    });

    // ML prediction (non-blocking — null if service is down)
    const mlPrediction = await getMLPrediction(
      buildMLInput(analytics, weakTopics.length),
    );

    const fullResult = {
      ...analysis,
      analytics,
      ...learning,
      mlPrediction,
      recentEvents: mapRecentEvents(rawData.recentAcceptedSubmissions),
      skillEvolution: buildSkillEvolution(
        rawData.recentAcceptedSubmissions.map((submission) => ({
          timestamp: submission.timestamp,
          titleSlug: submission.titleSlug,
          difficulty: submission.difficulty,
        })),
      ),
    };

    // Persist base analysis to MongoDB
    try {
      await AnalysisResult.findOneAndUpdate(
        { username: username.toLowerCase() },
        { ...analysis, username: username.toLowerCase(), fetchedAt: new Date() },
        { upsert: true, new: true },
      );

      await persistSnapshot({ username, analysis, analytics, weakTopics, strongTopics });

      await persistSubmissionEvents(
        username,
        rawData.recentAcceptedSubmissions.map((s) => ({
          id: s.id,
          title: s.title,
          titleSlug: s.titleSlug,
          timestamp: s.timestamp,
          difficulty: s.difficulty,
          topics: s.topics,
        })),
      );
    } catch {
      // MongoDB unavailable — skip persistence
    }

    await setCache(cacheKey, JSON.stringify(fullResult), CACHE_TTL);
    res.json({ ...fullResult, cached: false });

  } catch (err) {
    const message = (err as Error).message;

    if (message.includes('not found')) {
      res.status(404).json({ error: message });
    } else if (message.includes('private') || message.includes('restricted')) {
      res.status(403).json({ error: 'This LeetCode profile is private' });
    } else if (message.includes('ECONNREFUSED') || message.includes('timeout')) {
      res.status(503).json({ error: 'LeetCode API is currently unavailable. Try again later.' });
    } else {
      console.error(`Analysis error for ${username}:`, message);
      res.status(500).json({ error: 'Failed to analyze profile. Please try again.' });
    }
  }
});

router.get('/history/:username', async (req: Request, res: Response): Promise<void> => {
  const { username } = req.params;
  const days = Number(req.query.days) || 30;

  try {
    const history = await getSnapshotHistory(username, days);
    res.json({ username: username.toLowerCase(), days, points: history });
  } catch {
    // Degrade gracefully when persistence is unavailable.
    res.json({ username: username.toLowerCase(), days, points: [] });
  }
});

router.get('/events/:username', async (req: Request, res: Response): Promise<void> => {
  const { username } = req.params;
  const limit = Number(req.query.limit) || 100;

  try {
    const events = await getSubmissionEvents(username, limit);
    res.json({ username: username.toLowerCase(), count: events.length, events });
  } catch {
    // Degrade gracefully when persistence is unavailable.
    res.json({ username: username.toLowerCase(), count: 0, events: [] });
  }
});

router.get('/export/:username', async (req: Request, res: Response): Promise<void> => {
  const { username } = req.params;

  try {
    const csv = await exportHistoryCsv(username);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${username.toLowerCase()}-history.csv"`);
    res.status(200).send(csv);
  } catch {
    res.status(500).json({ error: 'Failed to export historical analytics' });
  }
});

router.get('/patterns/:username', async (req: Request, res: Response): Promise<void> => {
  const { username } = req.params;

  try {
    const patterns = await getProductivityPatterns(username);
    res.json({ username: username.toLowerCase(), ...patterns });
  } catch {
    // Degrade gracefully when persistence is unavailable.
    res.json({
      username: username.toLowerCase(),
      totalEvents: 0,
      bestWeekday: 'Sun',
      bestHourUtc: 0,
      weekdayCounts: { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 },
      hourCounts: Array.from({ length: 24 }, () => 0),
    });
  }
});

router.get('/forecast/:username', async (req: Request, res: Response): Promise<void> => {
  const { username } = req.params;
  const target = Number(req.query.target) || 500;

  try {
    const forecast = await getGoalForecast(username, target);
    res.json({ username: username.toLowerCase(), ...forecast });
  } catch {
    // Degrade gracefully when persistence is unavailable.
    res.json({
      username: username.toLowerCase(),
      target,
      currentTotalSolved: 0,
      avgDailyProgress: 0,
      daysToTarget: null,
      projectedDate: null,
    });
  }
});

router.post('/simulate', async (req: Request, res: Response): Promise<void> => {
  const { currentStats, simulationInput } = req.body || {};

  if (!currentStats || !simulationInput) {
    res.status(400).json({ error: 'currentStats and simulationInput are required' });
    return;
  }

  try {
    const result = runSimulation({ currentStats, simulationInput });
    res.json(result);
  } catch {
    res.status(400).json({ error: 'Invalid simulation payload' });
  }
});

export default router;
