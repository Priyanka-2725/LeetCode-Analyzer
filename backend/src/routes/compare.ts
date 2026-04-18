import { Router, Request, Response } from 'express';
import { extractUsername } from '../utils/extractUsername';
import { fetchLeetCodeData } from '../services/leetcodeService';
import { analyzeData } from '../services/analysisService';
import { computeAnalytics } from '../services/analytics';
import { compareProfiles, toComparisonProfile } from '../services/comparisonService';

const router = Router();

async function buildProfile(rawInput: string) {
  const username = extractUsername(rawInput);
  const rawData = await fetchLeetCodeData(username);
  const analysis = analyzeData(rawData);
  const analytics = computeAnalytics({
    easy: analysis.easy,
    medium: analysis.medium,
    hard: analysis.hard,
    totalSolved: analysis.totalSolved,
    streak: analysis.streak,
    topics: analysis.topics,
    activityData: analysis.activityData,
  });

  return toComparisonProfile({ username: analysis.username, analysis, analytics });
}

router.post('/compare', async (req: Request, res: Response): Promise<void> => {
  const usernameA = req.body?.usernameA || req.body?.userA;
  const usernameB = req.body?.usernameB || req.body?.userB;

  if (typeof usernameA !== 'string' || typeof usernameB !== 'string' || !usernameA.trim() || !usernameB.trim()) {
    res.status(400).json({ error: 'usernameA and usernameB are required' });
    return;
  }

  try {
    const normalizedA = extractUsername(usernameA);
    const normalizedB = extractUsername(usernameB);

    if (normalizedA.toLowerCase() === normalizedB.toLowerCase()) {
      res.status(400).json({ error: 'Please choose two different usernames' });
      return;
    }

    const [profileA, profileB] = await Promise.all([
      buildProfile(normalizedA),
      buildProfile(normalizedB),
    ]);

    res.json(compareProfiles(profileA, profileB));
  } catch (err) {
    const message = (err as Error).message;

    if (message.includes('not found')) {
      res.status(404).json({ error: message });
    } else if (message.includes('private') || message.includes('restricted')) {
      res.status(403).json({ error: 'One of the LeetCode profiles is private' });
    } else if (message.includes('ECONNREFUSED') || message.includes('timeout')) {
      res.status(503).json({ error: 'LeetCode API is currently unavailable. Try again later.' });
    } else {
      console.error('Comparison error:', message);
      res.status(500).json({ error: 'Failed to compare profiles. Please try again.' });
    }
  }
});

export default router;