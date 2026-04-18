export interface SimulationCurrentStats {
  totalSolved: number;
  avgProblemsPerDay: number;
  consistencyScore: number;
  weakTopics: string[];
}

export interface SimulationDifficultyMix {
  easy: number;
  medium: number;
  hard: number;
}

export interface SimulationInput {
  problemsPerDay: number;
  days: number;
  goal?: number;
  focusTopics: string[];
  difficultyMix: SimulationDifficultyMix;
}

export interface TopicImprovement {
  topic: string;
  currentMastery: number;
  projectedMastery: number;
  improvement: number;
}

export interface SimulationResult {
  futureSolved: number;
  daysToGoal: number | null;
  updatedConsistency: number;
  topicImprovement: TopicImprovement[];
  growthProjection: number;
  insights: string[];
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeMix(mix: SimulationDifficultyMix): SimulationDifficultyMix {
  const safe = {
    easy: Math.max(0, mix.easy || 0),
    medium: Math.max(0, mix.medium || 0),
    hard: Math.max(0, mix.hard || 0),
  };

  const total = safe.easy + safe.medium + safe.hard;
  if (total <= 0) {
    return { easy: 34, medium: 45, hard: 21 };
  }

  return {
    easy: round((safe.easy / total) * 100),
    medium: round((safe.medium / total) * 100),
    hard: round((safe.hard / total) * 100),
  };
}

export function predictFutureSolves(currentSolved: number, problemsPerDay: number, days: number): number {
  const safeCurrent = Math.max(0, currentSolved || 0);
  const safePerDay = Math.max(0, problemsPerDay || 0);
  const safeDays = Math.max(0, days || 0);
  return Math.round(safeCurrent + safePerDay * safeDays);
}

export function estimateDaysToGoal(goal: number | undefined, currentSolved: number, problemsPerDay: number): number | null {
  if (!goal || goal <= currentSolved) return 0;
  if (problemsPerDay <= 0) return null;
  return Math.ceil((goal - currentSolved) / problemsPerDay);
}

export function simulateTopicImprovement(
  weakTopics: string[],
  focusTopics: string[],
  totalPlannedProblems: number,
  difficultyMix: SimulationDifficultyMix,
): TopicImprovement[] {
  if (totalPlannedProblems <= 0 || focusTopics.length === 0) return [];

  const mix = normalizeMix(difficultyMix);
  const difficultyBoost = 1 + (mix.hard * 0.003) + (mix.medium * 0.0015);
  const perTopicProblems = totalPlannedProblems / focusTopics.length;

  return focusTopics.map((topic) => {
    const isWeak = weakTopics.includes(topic);
    const currentMastery = isWeak ? 30 : 45;
    const rawImprovement = (perTopicProblems / 5) * 5 * difficultyBoost;
    const improvement = round(rawImprovement);
    const projectedMastery = round(clamp(currentMastery + improvement, 0, 100));

    return {
      topic,
      currentMastery,
      projectedMastery,
      improvement: round(projectedMastery - currentMastery),
    };
  }).sort((a, b) => b.improvement - a.improvement);
}

export function simulateConsistencyImpact(
  currentConsistencyScore: number,
  currentAvgProblemsPerDay: number,
  simulatedProblemsPerDay: number,
  plannedDays: number,
): number {
  const base = clamp(currentConsistencyScore || 0, 0, 100);
  const dailyDelta = simulatedProblemsPerDay - Math.max(0, currentAvgProblemsPerDay || 0);
  const timeFactor = clamp((plannedDays || 0) / 30, 0, 1.4);

  const consistencyLift = dailyDelta > 0
    ? dailyDelta * 6 * timeFactor
    : dailyDelta * 3 * Math.max(0.4, timeFactor);

  return round(clamp(base + consistencyLift, 0, 100));
}

export function predictGrowthRate(currentAvgProblemsPerDay: number, simulatedProblemsPerDay: number): number {
  const current = Math.max(0, currentAvgProblemsPerDay || 0);
  const simulated = Math.max(0, simulatedProblemsPerDay || 0);

  if (current === 0) {
    return simulated > 0 ? 100 : 0;
  }

  return round(((simulated - current) / current) * 100);
}

export function generateSimulationInsights(params: {
  currentStats: SimulationCurrentStats;
  simulationInput: SimulationInput;
  futureSolved: number;
  daysToGoal: number | null;
  updatedConsistency: number;
  topicImprovement: TopicImprovement[];
  growthProjection: number;
}): string[] {
  const {
    currentStats,
    simulationInput,
    futureSolved,
    daysToGoal,
    updatedConsistency,
    topicImprovement,
    growthProjection,
  } = params;

  const insights: string[] = [];

  if (simulationInput.problemsPerDay <= 0 || simulationInput.days <= 0) {
    return ['Set problems/day and days above 0 to run a meaningful simulation.'];
  }

  insights.push(
    `At this pace, total solved can move from **${currentStats.totalSolved}** to **${futureSolved}** in **${simulationInput.days} days**.`,
  );

  if (daysToGoal === null) {
    insights.push('With **0 problems/day**, goal ETA cannot be estimated (division by zero avoided).');
  } else if (simulationInput.goal && simulationInput.goal > currentStats.totalSolved) {
    insights.push(`At **${simulationInput.problemsPerDay}/day**, you can reach **${simulationInput.goal}** solves in about **${daysToGoal} days**.`);
  } else if (simulationInput.goal && simulationInput.goal <= currentStats.totalSolved) {
    insights.push(`Goal **${simulationInput.goal}** is already achieved based on current progress.`);
  }

  if (topicImprovement.length > 0) {
    const top = topicImprovement[0];
    insights.push(
      `Focusing on **${top.topic}** can increase mastery by about **${top.improvement.toFixed(1)}%** over this plan.`,
    );
  } else {
    insights.push('Add focus topics to simulate weak-area improvement impact.');
  }

  if (growthProjection > 0) {
    insights.push(
      `Increasing daily practice from **${currentStats.avgProblemsPerDay.toFixed(1)}** to **${simulationInput.problemsPerDay.toFixed(1)}** projects **${growthProjection.toFixed(1)}%** growth.`,
    );
  } else if (growthProjection < 0) {
    insights.push(`This plan projects **${Math.abs(growthProjection).toFixed(1)}%** slower growth than your current pace.`);
  } else {
    insights.push('This plan keeps growth roughly flat relative to your current pace.');
  }

  const consistencyDelta = updatedConsistency - currentStats.consistencyScore;
  if (consistencyDelta > 0) {
    insights.push(`Consistency score could improve from **${currentStats.consistencyScore.toFixed(1)}** to **${updatedConsistency.toFixed(1)}**.`);
  } else if (consistencyDelta < 0) {
    insights.push(`Consistency may dip to **${updatedConsistency.toFixed(1)}** with this lower daily load.`);
  }

  return insights.slice(0, 6);
}

export function runSimulation(params: {
  currentStats: SimulationCurrentStats;
  simulationInput: SimulationInput;
}): SimulationResult {
  const currentStats = {
    totalSolved: Math.max(0, params.currentStats.totalSolved || 0),
    avgProblemsPerDay: Math.max(0, params.currentStats.avgProblemsPerDay || 0),
    consistencyScore: clamp(params.currentStats.consistencyScore || 0, 0, 100),
    weakTopics: params.currentStats.weakTopics || [],
  };

  const simulationInput = {
    problemsPerDay: Math.max(0, params.simulationInput.problemsPerDay || 0),
    days: Math.max(0, params.simulationInput.days || 0),
    goal: params.simulationInput.goal,
    focusTopics: (params.simulationInput.focusTopics || []).filter(Boolean),
    difficultyMix: normalizeMix(params.simulationInput.difficultyMix || { easy: 34, medium: 45, hard: 21 }),
  };

  const futureSolved = predictFutureSolves(
    currentStats.totalSolved,
    simulationInput.problemsPerDay,
    simulationInput.days,
  );

  const daysToGoal = estimateDaysToGoal(
    simulationInput.goal,
    currentStats.totalSolved,
    simulationInput.problemsPerDay,
  );

  const totalPlannedProblems = simulationInput.problemsPerDay * simulationInput.days;

  const topicImprovement = simulateTopicImprovement(
    currentStats.weakTopics,
    simulationInput.focusTopics,
    totalPlannedProblems,
    simulationInput.difficultyMix,
  );

  const updatedConsistency = simulateConsistencyImpact(
    currentStats.consistencyScore,
    currentStats.avgProblemsPerDay,
    simulationInput.problemsPerDay,
    simulationInput.days,
  );

  const growthProjection = predictGrowthRate(
    currentStats.avgProblemsPerDay,
    simulationInput.problemsPerDay,
  );

  const insights = generateSimulationInsights({
    currentStats,
    simulationInput,
    futureSolved,
    daysToGoal,
    updatedConsistency,
    topicImprovement,
    growthProjection,
  });

  return {
    futureSolved,
    daysToGoal,
    updatedConsistency,
    topicImprovement,
    growthProjection,
    insights,
  };
}
