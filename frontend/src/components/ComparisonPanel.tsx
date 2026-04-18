import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchComparison } from '../api/analyzeApi';
import { ComparisonResponse } from '../types';

function parseError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as { response?: { data?: { error?: string }; status?: number } };
    const status = axiosErr.response?.status;
    const msg = axiosErr.response?.data?.error;
    if (status === 404) return 'One of the users was not found. Check both usernames and try again.';
    if (status === 403) return 'One of the profiles is private and cannot be compared.';
    if (status === 503) return 'LeetCode API is temporarily unavailable. Try again in a moment.';
    if (status === 400) return msg || 'Please enter two different usernames.';
    if (msg) return msg;
  }
  if (err instanceof Error) return err.message;
  return 'Unable to compare profiles right now.';
}

function SectionHeader() {
  return (
    <div className="flex items-center gap-4 mb-5">
      <div className="flex items-center gap-2.5">
        <div
          className="w-1 h-5 rounded-full"
          style={{
            background: 'linear-gradient(180deg, #22D3EE, #A78BFA)',
            boxShadow: '0 0 8px rgba(34,211,238,0.6)',
          }}
        />
        <div>
          <span className="text-[13px] font-bold text-white tracking-tight">Compare Profiles</span>
          <span className="text-[11px] text-slate-600 ml-2 font-medium">Real analytics side-by-side</span>
        </div>
      </div>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(34,211,238,0.2), transparent)' }} />
    </div>
  );
}

function MetricTooltip({ active, payload }: { active?: boolean; payload?: { payload: { metric: string; userA: number; userB: number } }[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div
      className="px-4 py-3 rounded-[14px] text-sm"
      style={{
        background: 'rgba(8,12,23,0.98)',
        border: '1px solid rgba(99,102,241,0.35)',
        boxShadow: '0 0 24px rgba(99,102,241,0.22), 0 8px 24px rgba(0,0,0,0.45)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <p className="text-[11px] text-slate-500 mb-1.5 font-medium uppercase tracking-wider">{item.metric}</p>
      <p className="text-xs text-slate-300">A: {item.userA.toFixed(1)} | B: {item.userB.toFixed(1)}</p>
    </div>
  );
}

function TopicTooltip({ active, payload }: { active?: boolean; payload?: { payload: { topic: string; userA: number; userB: number } }[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div
      className="px-4 py-3 rounded-[14px] text-sm"
      style={{
        background: 'rgba(8,12,23,0.98)',
        border: '1px solid rgba(34,211,238,0.3)',
        boxShadow: '0 0 24px rgba(34,211,238,0.18), 0 8px 24px rgba(0,0,0,0.45)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <p className="text-[11px] text-slate-500 mb-1.5 font-medium uppercase tracking-wider">{item.topic}</p>
      <p className="text-xs text-slate-300">A: {item.userA.toFixed(1)} | B: {item.userB.toFixed(1)}</p>
    </div>
  );
}

function ProfileCard({ label, username, profile, accent }: { label: string; username: string; profile: ComparisonResponse['profiles']['userA']; accent: string }) {
  return (
    <div className="glass-card p-5 relative overflow-hidden">
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl" style={{ background: accent, opacity: 0.14 }} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{label}</p>
            <h3 className="text-xl font-bold text-white mt-1">{username}</h3>
          </div>
          <div className="w-10 h-10 rounded-[14px] flex items-center justify-center text-white font-black" style={{ background: accent }}>
            {username.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-[14px] p-3 bg-white/[0.03] border border-white/5">
            <p className="text-[11px] text-slate-500">Solved</p>
            <p className="text-lg font-bold text-white mt-1">{profile.stats.totalSolved}</p>
          </div>
          <div className="rounded-[14px] p-3 bg-white/[0.03] border border-white/5">
            <p className="text-[11px] text-slate-500">Consistency</p>
            <p className="text-lg font-bold text-white mt-1">{profile.consistencyScore.toFixed(1)}%</p>
          </div>
          <div className="rounded-[14px] p-3 bg-white/[0.03] border border-white/5">
            <p className="text-[11px] text-slate-500">Avg / day</p>
            <p className="text-lg font-bold text-white mt-1">{profile.features.avgProblemsPerDay.toFixed(1)}</p>
          </div>
          <div className="rounded-[14px] p-3 bg-white/[0.03] border border-white/5">
            <p className="text-[11px] text-slate-500">Growth</p>
            <p className="text-lg font-bold text-white mt-1">{profile.growthRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-slate-400">
          <div className="rounded-[12px] px-3 py-2 bg-white/[0.03] border border-white/5">
            <span className="block text-slate-500">Easy</span>
            <span className="text-slate-200 font-semibold">{profile.features.easyPct.toFixed(0)}%</span>
          </div>
          <div className="rounded-[12px] px-3 py-2 bg-white/[0.03] border border-white/5">
            <span className="block text-slate-500">Medium</span>
            <span className="text-slate-200 font-semibold">{profile.features.mediumPct.toFixed(0)}%</span>
          </div>
          <div className="rounded-[12px] px-3 py-2 bg-white/[0.03] border border-white/5">
            <span className="block text-slate-500">Hard</span>
            <span className="text-slate-200 font-semibold">{profile.features.hardPct.toFixed(0)}%</span>
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-400 space-y-1.5">
          <p><span className="text-slate-500">Strongest:</span> {profile.features.strongestTopic}</p>
          <p><span className="text-slate-500">Weakest:</span> {profile.features.weakestTopic}</p>
        </div>
      </div>
    </div>
  );
}

export default function ComparisonPanel() {
  const [usernameA, setUsernameA] = useState('');
  const [usernameB, setUsernameB] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResponse | null>(null);

  const metricChartData = useMemo(() => {
    if (!result) return [];
    return [
      {
        metric: 'Total Solved',
        userA: result.metricComparison.totalSolved.userA,
        userB: result.metricComparison.totalSolved.userB,
      },
      {
        metric: 'Avg / Day',
        userA: result.metricComparison.avgProblemsPerDay.userA,
        userB: result.metricComparison.avgProblemsPerDay.userB,
      },
      {
        metric: 'Consistency',
        userA: result.metricComparison.consistencyScore.userA,
        userB: result.metricComparison.consistencyScore.userB,
      },
      {
        metric: 'Growth',
        userA: result.metricComparison.growthRate.userA,
        userB: result.metricComparison.growthRate.userB,
      },
    ];
  }, [result]);

  const topicChartData = useMemo(() => {
    if (!result) return [];
    return result.topicComparison.topicDeltas.slice(0, 8);
  }, [result]);

  async function handleCompare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedA = usernameA.trim();
    const trimmedB = usernameB.trim();

    if (!trimmedA || !trimmedB) {
      setError('Please enter both usernames.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchComparison(trimmedA, trimmedB);
      setResult(data);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-5"
    >
      <SectionHeader />

      <form
        onSubmit={handleCompare}
        className="glass-card p-5 grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-3 items-end"
      >
        <label className="space-y-2 text-sm text-slate-400">
          <span className="text-xs uppercase tracking-wide text-slate-500">Username A</span>
          <input
            value={usernameA}
            onChange={(e) => setUsernameA(e.target.value)}
            placeholder="e.g. algoAce"
            className="w-full rounded-[14px] px-4 py-3 bg-white/[0.03] border border-white/8 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/40"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-400">
          <span className="text-xs uppercase tracking-wide text-slate-500">Username B</span>
          <input
            value={usernameB}
            onChange={(e) => setUsernameB(e.target.value)}
            placeholder="e.g. graphGuru"
            className="w-full rounded-[14px] px-4 py-3 bg-white/[0.03] border border-white/8 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/40"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="h-[52px] px-5 rounded-[14px] font-semibold text-sm text-white transition-all disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(99,102,241,0.45))',
            border: '1px solid rgba(34,211,238,0.35)',
            boxShadow: '0 0 20px rgba(99,102,241,0.18)',
          }}
        >
          {loading ? 'Comparing...' : 'Compare Profiles'}
        </button>

        {error && (
          <div className="lg:col-span-3 rounded-[14px] p-3 text-sm text-rose-200 bg-rose-500/10 border border-rose-500/20">
            {error}
          </div>
        )}
      </form>

      {result ? (
        <div className="space-y-5">
          <div className="glass-card p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Summary</p>
                <h3 className="text-2xl font-bold text-white mt-2">
                  {result.summary.overallBetter === 'Tie'
                    ? 'Profiles are evenly matched'
                    : `${result.summary.overallBetter} is ahead`}
                </h3>
                <p className="text-sm text-slate-400 mt-2 max-w-3xl">{result.summary.reason}</p>
              </div>
              <div className="rounded-[16px] px-4 py-3 bg-white/[0.03] border border-white/5 min-w-[220px]">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Comparison outcome</p>
                <p className="text-base font-semibold text-slate-100 mt-1">
                  {result.summary.overallBetter === 'Tie' ? 'No clear winner' : result.summary.overallBetter}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <ProfileCard
              label="User A"
              username={result.profiles.userA.username}
              profile={result.profiles.userA}
              accent="linear-gradient(135deg, #22D3EE 0%, #6366F1 100%)"
            />
            <ProfileCard
              label="User B"
              username={result.profiles.userB.username}
              profile={result.profiles.userB}
              accent="linear-gradient(135deg, #A78BFA 0%, #22D3EE 100%)"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="glass-card p-5">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-[15px] font-bold text-white tracking-tight">Metric Comparison</h3>
                  <p className="text-[12px] text-slate-500 mt-0.5 font-medium">Solved volume, pacing, consistency, and growth</p>
                </div>
                <div className="text-[11px] text-slate-500">A vs B</div>
              </div>
              <ResponsiveContainer width="100%" height={270}>
                <BarChart data={metricChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="metric" tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<MetricTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="userA" radius={[8, 8, 0, 0]} fill="url(#compareA)" />
                  <Bar dataKey="userB" radius={[8, 8, 0, 0]} fill="url(#compareB)" />
                  <defs>
                    <linearGradient id="compareA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22D3EE" stopOpacity={1} />
                      <stop offset="100%" stopColor="#22D3EE" stopOpacity={0.35} />
                    </linearGradient>
                    <linearGradient id="compareB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A78BFA" stopOpacity={1} />
                      <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.35} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-[15px] font-bold text-white tracking-tight">Difficulty Focus</h3>
                  <p className="text-[12px] text-slate-500 mt-0.5 font-medium">Easy vs Medium vs Hard split</p>
                </div>
              </div>
              <div className="space-y-4">
                {result.topicComparison.difficultyFocus.map((item) => (
                  (() => {
                    const total = item.userA + item.userB;
                    const shareA = total > 0 ? (item.userA / total) * 100 : 50;
                    const shareB = total > 0 ? (item.userB / total) * 100 : 50;

                    return (
                  <div key={item.difficulty} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300 font-medium">{item.difficulty}</span>
                      <span className="text-xs text-slate-500">
                        A {item.userA.toFixed(1)}% · B {item.userB.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-white/[0.03] border border-white/5 overflow-hidden flex">
                      <div
                        className="h-full"
                        style={{ width: `${Math.max(8, shareA)}%`, background: 'linear-gradient(90deg, rgba(34,211,238,0.85), rgba(34,211,238,0.3))' }}
                      />
                      <div
                        className="h-full"
                        style={{ width: `${Math.max(8, shareB)}%`, background: 'linear-gradient(90deg, rgba(167,139,250,0.85), rgba(167,139,250,0.3))' }}
                      />
                    </div>
                  </div>
                    );
                  })()
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-[15px] font-bold text-white tracking-tight">Topic Comparison</h3>
                <p className="text-[12px] text-slate-500 mt-0.5 font-medium">Mastery values for the most different topics</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topicChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="topic" tick={{ fill: '#64748B', fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} interval={0} angle={-18} textAnchor="end" height={52} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<TopicTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="userA" radius={[8, 8, 0, 0]} fill="url(#topicA)" />
                <Bar dataKey="userB" radius={[8, 8, 0, 0]} fill="url(#topicB)" />
                <defs>
                  <linearGradient id="topicA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity={1} />
                    <stop offset="100%" stopColor="#22D3EE" stopOpacity={0.3} />
                  </linearGradient>
                  <linearGradient id="topicB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A78BFA" stopOpacity={1} />
                    <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-[15px] font-bold text-white tracking-tight mb-4">Insights</h3>
            <div className="space-y-3">
              {result.insights.map((insight) => (
                <div key={insight} className="rounded-[14px] p-4 bg-white/[0.03] border border-white/5 text-sm text-slate-300">
                  {insight}
                </div>
              ))}
              {result.insights.length === 0 && (
                <div className="rounded-[14px] p-4 bg-white/[0.03] border border-white/5 text-sm text-slate-500">
                  No strong differentiators were found yet.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-6 text-slate-400">
          Compare two users to generate side-by-side analytics, topic gaps, and a winner summary.
        </div>
      )}
    </motion.div>
  );
}