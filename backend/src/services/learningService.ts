/**
 * learningService.ts
 *
 * Learning Path and Problem Recommendation System.
 * Uses problems.json dataset + user analytics to generate:
 *  - learningPath:        topic-ordered problem sets for weak areas
 *  - dailyPlan:           daily target + suggested topics + problems
 *  - recommendedProblems: top 5 next problems to solve
 */

import path from 'path';
import fs from 'fs';

// ─── Types ────────────────────────────────────────────────────────────────────

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

export interface LearningOutput {
  learningPath: LearningPathEntry[];
  dailyPlan: DailyPlan;
  recommendedProblems: Problem[];
}

// ─── Dataset ──────────────────────────────────────────────────────────────────

const PROBLEMS: Problem[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../data/problems.json'), 'utf-8')
);

const DIFFICULTY_ORDER: Record<Problem['difficulty'], number> = {
  Easy: 0,
  Medium: 1,
  Hard: 2,
};

// ─── 1. PROBLEM FILTERING ─────────────────────────────────────────────────────

/**
 * Returns all problems that include the given topic (case-insensitive partial match).
 */
export function getProblemsByTopic(topic: string): Problem[] {
  const normalized = topic.toLowerCase();
  return PROBLEMS.filter((p) =>
    p.topics.some((t) => t.toLowerCase().includes(normalized) || normalized.includes(t.toLowerCase()))
  );
}

// ─── 2. DIFFICULTY BALANCING ─────────────────────────────────────────────────

/**
 * Determines user level from consistency + growth signals.
 * Returns 'beginner' | 'intermediate' | 'advanced'
 */
function getUserLevel(consistencyScore: number, growthRate: number): 'beginner' | 'intermediate' | 'advanced' {
  if (consistencyScore >= 60 && growthRate >= 0) return 'advanced';
  if (consistencyScore >= 30) return 'intermediate';
  return 'beginner';
}

/**
 * Selects problems from a pool based on user level difficulty weighting.
 * Beginner  → Easy first, then Medium
 * Intermediate → Medium focus, some Easy/Hard
 * Advanced  → Medium + Hard
 */
export function selectProblems(problems: Problem[], userLevel: 'beginner' | 'intermediate' | 'advanced'): Problem[] {
  const easy   = problems.filter((p) => p.difficulty === 'Easy');
  const medium = problems.filter((p) => p.difficulty === 'Medium');
  const hard   = problems.filter((p) => p.difficulty === 'Hard');

  switch (userLevel) {
    case 'beginner':
      return [...easy, ...medium.slice(0, 2), ...hard.slice(0, 0)];
    case 'intermediate':
      return [...easy.slice(0, 1), ...medium, ...hard.slice(0, 1)];
    case 'advanced':
      return [...easy.slice(0, 1), ...medium, ...hard];
  }
}

// ─── 3. LEARNING PATH GENERATOR ──────────────────────────────────────────────

/**
 * For each weak topic, selects 3–5 problems sorted by difficulty.
 */
export function generateLearningPath(
  weakTopics: string[],
  consistencyScore: number,
  growthRate: number
): LearningPathEntry[] {
  const userLevel = getUserLevel(consistencyScore, growthRate);
  const seen = new Set<string>();

  return weakTopics.map((topic) => {
    const pool = getProblemsByTopic(topic);
    const balanced = selectProblems(pool, userLevel);

    // Deduplicate across topics, then take 3–5
    const unique = balanced.filter((p) => !seen.has(p.slug));
    const selected = unique.slice(0, 5);
    selected.forEach((p) => seen.add(p.slug));

    // Ensure at least 3 — relax dedup if needed
    if (selected.length < 3) {
      const extras = balanced.filter((p) => !selected.find((s) => s.slug === p.slug)).slice(0, 3 - selected.length);
      selected.push(...extras);
    }

    // Sort by difficulty
    selected.sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]);

    return { topic, problems: selected };
  }).filter((entry) => entry.problems.length > 0);
}

// ─── 4. DAILY PLAN GENERATOR ─────────────────────────────────────────────────

/**
 * Generates a daily practice plan based on consistency level.
 * Low  (<30)  → 2 problems/day
 * Medium (30–60) → 3 problems/day
 * High (>60)  → 4+ problems/day
 */
export function generateDailyPlan(data: {
  weakTopics: string[];
  strongTopics: string[];
  consistencyScore: number;
  growthRate: number;
}): DailyPlan {
  const { weakTopics, strongTopics, consistencyScore, growthRate } = data;
  const userLevel = getUserLevel(consistencyScore, growthRate);

  // Daily target
  let dailyTarget: number;
  if (consistencyScore < 30) dailyTarget = 2;
  else if (consistencyScore < 60) dailyTarget = 3;
  else dailyTarget = 4;

  // Suggested topics: prioritize weak, pad with strong if needed
  const suggestedTopics = [...weakTopics.slice(0, 2), ...strongTopics.slice(0, 1)].slice(0, 3);

  // Collect problems from suggested topics
  const seen = new Set<string>();
  const problems: Problem[] = [];

  for (const topic of suggestedTopics) {
    const pool = getProblemsByTopic(topic);
    const balanced = selectProblems(pool, userLevel);
    for (const p of balanced) {
      if (!seen.has(p.slug) && problems.length < dailyTarget) {
        seen.add(p.slug);
        problems.push(p);
      }
    }
  }

  // If not enough problems, fill from any weak topic
  if (problems.length < dailyTarget) {
    const allWeak = weakTopics.flatMap((t) => getProblemsByTopic(t));
    for (const p of allWeak) {
      if (!seen.has(p.slug) && problems.length < dailyTarget) {
        seen.add(p.slug);
        problems.push(p);
      }
    }
  }

  problems.sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]);

  return { dailyTarget, suggestedTopics, problems };
}

// ─── 5. SMART RECOMMENDATIONS ────────────────────────────────────────────────

// Default curated list — always-available fallback (never empty)
const DEFAULT_RECOMMENDATIONS: Problem[] = [
  { title: 'Two Sum',                          slug: 'two-sum',                          difficulty: 'Easy',   topics: ['Arrays', 'HashMap'] },
  { title: 'Best Time to Buy and Sell Stock',  slug: 'best-time-to-buy-and-sell-stock',  difficulty: 'Easy',   topics: ['Arrays', 'DP'] },
  { title: 'Maximum Subarray',                 slug: 'maximum-subarray',                 difficulty: 'Medium', topics: ['Arrays', 'DP'] },
  { title: 'Climbing Stairs',                  slug: 'climbing-stairs',                  difficulty: 'Easy',   topics: ['DP'] },
  { title: 'Coin Change',                      slug: 'coin-change',                      difficulty: 'Medium', topics: ['DP'] },
  { title: 'Number of Islands',                slug: 'number-of-islands',                difficulty: 'Medium', topics: ['Graphs'] },
  { title: 'Longest Substring Without Repeating Characters', slug: 'longest-substring-without-repeating-characters', difficulty: 'Medium', topics: ['Sliding Window'] },
  { title: 'Binary Tree Level Order Traversal', slug: 'binary-tree-level-order-traversal', difficulty: 'Medium', topics: ['Trees'] },
];

const FALLBACK_TOPICS = ['Arrays', 'DP', 'Trees', 'Graphs', 'Sliding Window'];

/**
 * Generates 5–8 recommended problems. ALWAYS returns results.
 *
 * Priority:
 *  1. Weak topics (user's identified gaps)
 *  2. Medium-strength topics (if weak is empty)
 *  3. Popular fallback topics (Arrays, DP, etc.)
 *  4. Curated default list (absolute last resort)
 *
 * Difficulty balanced by user level:
 *  Beginner     → Easy + some Medium
 *  Intermediate → Medium focus
 *  Advanced     → Medium + Hard
 */
export function generateProblemRecommendations(data: {
  weakTopics: string[];
  strongTopics: string[];
  consistencyScore: number;
  growthRate: number;
  solvedSlugs?: string[];
}): Problem[] {
  const { weakTopics, strongTopics, consistencyScore, growthRate, solvedSlugs = [] } = data;
  const userLevel = getUserLevel(consistencyScore, growthRate);
  const solved = new Set(solvedSlugs);
  const seen = new Set<string>();
  const result: Problem[] = [];

  const TARGET_MIN = 5;
  const TARGET_MAX = 8;

  // Helper: add problems from a pool up to TARGET_MAX
  function addFromPool(pool: Problem[]) {
    for (const p of pool) {
      if (result.length >= TARGET_MAX) break;
      if (!seen.has(p.slug) && !solved.has(p.slug)) {
        seen.add(p.slug);
        result.push(p);
      }
    }
  }

  // Helper: get difficulty-balanced pool for a topic
  function getBalancedPool(topic: string): Problem[] {
    const pool = getProblemsByTopic(topic);
    return selectProblems(pool, userLevel);
  }

  // STEP 1: Weak topics (primary source)
  // If weakTopics is empty, derive from medium-strength topics
  let primaryTopics = weakTopics.length > 0 ? weakTopics : [];

  if (primaryTopics.length === 0) {
    // Use medium-strength topics (below average mastery but not empty)
    primaryTopics = strongTopics.length > 0 ? strongTopics.slice(0, 3) : [];
    console.debug('[Recommendations] weakTopics empty — using medium/strong topics:', primaryTopics);
  }

  if (primaryTopics.length === 0) {
    // Fallback to popular topics
    primaryTopics = FALLBACK_TOPICS;
    console.debug('[Recommendations] No topic data — falling back to popular topics');
  }

  // STEP 2: Fill from primary topics
  for (const topic of primaryTopics) {
    if (result.length >= TARGET_MAX) break;
    addFromPool(getBalancedPool(topic));
  }

  // STEP 3: If still under minimum, pull from strong topics at next difficulty
  if (result.length < TARGET_MIN && strongTopics.length > 0) {
    const nextDiff: Problem['difficulty'] = userLevel === 'beginner' ? 'Medium' : 'Hard';
    for (const topic of strongTopics) {
      if (result.length >= TARGET_MAX) break;
      const pool = getProblemsByTopic(topic).filter((p) => p.difficulty === nextDiff);
      addFromPool(pool);
    }
  }

  // STEP 4: Fill remaining from fallback popular topics
  if (result.length < TARGET_MIN) {
    for (const topic of FALLBACK_TOPICS) {
      if (result.length >= TARGET_MAX) break;
      addFromPool(getBalancedPool(topic));
    }
  }

  // STEP 5: Fill remaining with any medium problems
  if (result.length < TARGET_MIN) {
    const mediums = PROBLEMS.filter((p) => p.difficulty === 'Medium' && !seen.has(p.slug) && !solved.has(p.slug));
    addFromPool(mediums);
  }

  // STEP 6: Absolute fallback — return curated defaults (never empty)
  if (result.length === 0) {
    console.debug('[Recommendations] All filters exhausted — returning curated defaults');
    return DEFAULT_RECOMMENDATIONS.slice(0, TARGET_MAX);
  }

  // If still under minimum, pad with defaults
  if (result.length < TARGET_MIN) {
    for (const p of DEFAULT_RECOMMENDATIONS) {
      if (result.length >= TARGET_MIN) break;
      if (!seen.has(p.slug)) {
        seen.add(p.slug);
        result.push(p);
      }
    }
  }

  return result.slice(0, TARGET_MAX);
}

// ─── MAIN ENTRY POINT ─────────────────────────────────────────────────────────

export function generateLearningOutput(data: {
  weakTopics: string[];
  strongTopics: string[];
  consistencyScore: number;
  growthRate: number;
}): LearningOutput {
  const { weakTopics, strongTopics, consistencyScore, growthRate } = data;

  const learningPath = generateLearningPath(weakTopics, consistencyScore, growthRate);
  const dailyPlan = generateDailyPlan({ weakTopics, strongTopics, consistencyScore, growthRate });
  const recommendedProblems = generateProblemRecommendations({ weakTopics, strongTopics, consistencyScore, growthRate });

  return { learningPath, dailyPlan, recommendedProblems };
}
