import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchSimulation } from '../api/analyzeApi';
import {
  AnalysisResult,
  SimulationDifficultyMix,
  SimulationResponse,
} from '../types';

interface SimulatorProps {
  data: AnalysisResult;
}

function SectionTitle() {
  return (
    <div className="flex items-center gap-4 mb-5">
      <div className="flex items-center gap-2.5">
        <div
          className="w-1 h-5 rounded-full"
          style={{
            background: 'linear-gradient(180deg, #22D3EE, #6366F1)',
            boxShadow: '0 0 8px rgba(34,211,238,0.6)',
          }}
        />
        <div>
          <span className="text-[13px] font-bold text-white tracking-tight">What-If Simulator</span>
          <span className="text-[11px] text-slate-600 ml-2 font-medium">predictive simulation engine</span>
        </div>
      </div>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(34,211,238,0.2), transparent)' }} />
    </div>
  );
}

function parseError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as { response?: { data?: { error?: string } } };
    return axiosErr.response?.data?.error || 'Failed to run simulation.';
  }
  if (err instanceof Error) return err.message;
  return 'Failed to run simulation.';
}

export default function Simulator({ data }: SimulatorProps) {
  const [problemsPerDay, setProblemsPerDay] = useState(3);
  const [days, setDays] = useState(30);
  const [goal, setGoal] = useState(500);
  const [focusTopics, setFocusTopics] = useState<string[]>([]);
  const [mix, setMix] = useState<SimulationDifficultyMix>({ easy: 30, medium: 50, hard: 20 });
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableTopics = useMemo(
    () => data.topics.map((topic) => topic.topic),
    [data.topics],
  );

  const weakTopics = useMemo(() => {
    if (data.analytics?.topicMastery?.length) {
      return [...data.analytics.topicMastery]
        .sort((a, b) => a.mastery - b.mastery)
        .slice(0, 4)
        .map((topic) => topic.topic);
    }
    return data.topics.slice(-4).map((topic) => topic.topic);
  }, [data.analytics?.topicMastery, data.topics]);

  useEffect(() => {
    if (!focusTopics.length && weakTopics.length) {
      setFocusTopics(weakTopics.slice(0, 2));
    }
  }, [focusTopics.length, weakTopics]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const simulation = await fetchSimulation(
          {
            totalSolved: data.totalSolved,
            avgProblemsPerDay: data.analytics?.avgProblemsPerDay ?? 0,
            consistencyScore: data.analytics?.consistencyScore ?? 0,
            weakTopics,
          },
          {
            problemsPerDay,
            days,
            goal,
            focusTopics,
            difficultyMix: mix,
          },
        );
        setResult(simulation);
      } catch (err) {
        setError(parseError(err));
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timeout);
  }, [data.totalSolved, data.analytics?.avgProblemsPerDay, data.analytics?.consistencyScore, weakTopics, problemsPerDay, days, goal, focusTopics, mix]);

  function toggleFocusTopic(topic: string) {
    setFocusTopics((prev) => {
      if (prev.includes(topic)) return prev.filter((item) => item !== topic);
      return [...prev, topic].slice(-5);
    });
  }

  function updateMix(key: keyof SimulationDifficultyMix, value: number) {
    setMix((prev) => ({ ...prev, [key]: Math.max(0, value) }));
  }

  return (
    <div className="space-y-5">
      <SectionTitle />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="glass-card p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-4">Input Panel</h3>

          <div className="space-y-4">
            <label className="block text-xs text-slate-400">
              Problems per day: <span className="text-cyan-300 font-semibold">{problemsPerDay}</span>
              <input
                type="range"
                min={0}
                max={20}
                value={problemsPerDay}
                onChange={(e) => setProblemsPerDay(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-xs text-slate-400">
                Number of days
                <input
                  type="number"
                  min={0}
                  value={days}
                  onChange={(e) => setDays(Math.max(0, Number(e.target.value) || 0))}
                  className="mt-1 w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200"
                />
              </label>
              <label className="text-xs text-slate-400">
                Goal (optional)
                <input
                  type="number"
                  min={0}
                  value={goal}
                  onChange={(e) => setGoal(Math.max(0, Number(e.target.value) || 0))}
                  className="mt-1 w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200"
                />
              </label>
            </div>

            <div>
              <p className="text-xs text-slate-400 mb-2">Focus topics</p>
              <div className="flex flex-wrap gap-2">
                {availableTopics.slice(0, 12).map((topic) => {
                  const active = focusTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleFocusTopic(topic)}
                      className="text-[11px] px-3 py-1.5 rounded-full border transition-colors"
                      style={{
                        borderColor: active ? 'rgba(34,211,238,0.45)' : 'rgba(255,255,255,0.1)',
                        color: active ? '#22D3EE' : '#94A3B8',
                        background: active ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.03)',
                      }}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['easy', 'medium', 'hard'] as const).map((key) => (
                <label key={key} className="text-xs text-slate-400 capitalize">
                  {key} mix
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={mix[key]}
                    onChange={(e) => updateMix(key, Number(e.target.value) || 0)}
                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200"
                  />
                </label>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="glass-card p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-4">Output Panel</h3>

          {error && (
            <div className="rounded-[12px] px-3 py-2 text-xs text-rose-200 bg-rose-500/10 border border-rose-500/25 mb-3">
              {error}
            </div>
          )}

          {!result ? (
            <p className="text-sm text-slate-500">Preparing simulation...</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[13px] p-3 bg-white/[0.03] border border-white/6">
                  <p className="text-[11px] text-slate-500">Future solves</p>
                  <p className="text-2xl font-bold text-emerald-300 mt-1">{result.futureSolved}</p>
                </div>
                <div className="rounded-[13px] p-3 bg-white/[0.03] border border-white/6">
                  <p className="text-[11px] text-slate-500">Days to goal</p>
                  <p className="text-2xl font-bold text-cyan-300 mt-1">{result.daysToGoal === null ? 'N/A' : result.daysToGoal}</p>
                </div>
                <div className="rounded-[13px] p-3 bg-white/[0.03] border border-white/6">
                  <p className="text-[11px] text-slate-500">Growth projection</p>
                  <p className={`text-2xl font-bold mt-1 ${result.growthProjection >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {result.growthProjection >= 0 ? '+' : ''}{result.growthProjection.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-[13px] p-3 bg-white/[0.03] border border-white/6">
                  <p className="text-[11px] text-slate-500">Updated consistency</p>
                  <p className="text-2xl font-bold text-violet-300 mt-1">{result.updatedConsistency.toFixed(1)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-2">Topic improvement</p>
                <div className="space-y-2">
                  {result.topicImprovement.length > 0 ? (
                    result.topicImprovement.slice(0, 4).map((topic) => (
                      <div key={topic.topic} className="rounded-[11px] p-2.5 bg-white/[0.03] border border-white/6 text-xs flex items-center justify-between">
                        <span className="text-slate-300">{topic.topic}</span>
                        <span className="text-emerald-300">+{topic.improvement.toFixed(1)}% mastery</span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[11px] p-2.5 bg-white/[0.03] border border-white/6 text-xs text-slate-500">
                      Select focus topics to project improvement.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-2">Insights</p>
                <div className="space-y-2">
                  {result.insights.map((insight) => (
                    <div key={insight} className="rounded-[11px] p-2.5 bg-white/[0.03] border border-white/6 text-xs text-slate-300">
                      <span dangerouslySetInnerHTML={{ __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {loading && (
            <p className="text-xs text-slate-500 mt-3">Running simulation...</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
