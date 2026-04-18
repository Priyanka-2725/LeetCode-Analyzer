import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalytics } from './hooks/useAnalytics';
import DashboardLayout from './components/layout/DashboardLayout';
import FuturisticDashboard from './components/FuturisticDashboard';
import FuturisticInput from './components/FuturisticInput';
import ComparisonPanel from './components/ComparisonPanel';
import Simulator from './components/Simulator';

function LandingHero({ onAnalyze, loading }: { onAnalyze: (v: string) => void; loading: boolean }) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[75vh] text-center px-4 overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: '#6366F1', opacity: 0.08 }} />
      <div className="absolute bottom-1/4 right-1/3 w-56 h-56 rounded-full blur-3xl pointer-events-none"
        style={{ background: '#22D3EE', opacity: 0.06 }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-48 rounded-full blur-3xl pointer-events-none"
        style={{ background: '#A78BFA', opacity: 0.04 }} />

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6"
      >
        <span
          className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full"
          style={{
            background: 'rgba(99,102,241,0.12)',
            color: '#A78BFA',
            border: '1px solid rgba(99,102,241,0.28)',
            boxShadow: '0 0 20px rgba(99,102,241,0.15)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-glow-pulse" />
          LeetCode Analytics Platform
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="text-[3.5rem] md:text-[4.5rem] font-black text-white leading-[1.05] tracking-tight mb-5"
      >
        Track Your{' '}
        <span className="text-gradient-primary">Algo</span>
        <span className="text-gradient-cyan">Streak</span>
      </motion.h1>

      {/* Sub */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-[15px] font-medium max-w-sm mb-10 leading-relaxed"
        style={{ color: 'rgba(148,163,184,0.85)' }}
      >
        Deep analytics, AI insights, and predictions for your LeetCode journey.
      </motion.p>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
      >
        <FuturisticInput onAnalyze={onAnalyze} loading={loading} />
      </motion.div>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap items-center justify-center gap-3 mt-10"
      >
        {[
          { label: 'Streak Tracking', color: '#818CF8' },
          { label: 'Topic Analytics', color: '#22D3EE' },
          { label: 'AI Insights',     color: '#A78BFA' },
          { label: 'Predictions',     color: '#4ADE80' },
        ].map((f) => (
          <span
            key={f.label}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
            style={{
              background: `${f.color}10`,
              color: f.color,
              border: `1px solid ${f.color}25`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: f.color }} />
            {f.label}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-3 px-4 py-3.5 rounded-[14px] mb-6"
      style={{
        background: 'rgba(248,113,113,0.08)',
        border: '1px solid rgba(248,113,113,0.25)',
        boxShadow: '0 0 20px rgba(248,113,113,0.1)',
      }}
    >
      <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#F87171' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span className="text-[13px] font-medium flex-1" style={{ color: '#FCA5A5' }}>{message}</span>
      <button onClick={onDismiss} className="text-slate-600 hover:text-slate-400 transition-colors p-1">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}

function SkeletonPulse() {
  return (
    <div className="space-y-8">
      {/* Profile skeleton */}
      <div className="h-[100px] rounded-[22px] animate-pulse"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(255,255,255,0.03))' }} />
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[110px] rounded-[20px] animate-pulse"
            style={{ background: 'rgba(255,255,255,0.04)', animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
      {/* Chart */}
      <div className="h-[280px] rounded-[20px] animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
      {/* Two cols */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="h-[220px] rounded-[20px] animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
        <div className="h-[220px] rounded-[20px] animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
      </div>
    </div>
  );
}

function SectionShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
        <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function DataLockedState({ onGoDashboard }: { onGoDashboard: () => void }) {
  return (
    <div
      className="rounded-[18px] p-7"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <h3 className="text-lg font-semibold text-slate-100">Analyze a profile to unlock this section</h3>
      <p className="text-sm text-slate-400 mt-2 max-w-xl">
        This area uses personalized activity history and submission events. Start with a username on
        the Dashboard first.
      </p>
      <button
        onClick={onGoDashboard}
        className="mt-5 text-sm font-semibold px-4 py-2 rounded-[11px]"
        style={{
          background: 'rgba(99,102,241,0.18)',
          border: '1px solid rgba(99,102,241,0.35)',
          color: '#C7D2FE',
        }}
      >
        Go To Dashboard
      </button>
    </div>
  );
}

export default function App() {
  const {
    data,
    loadingState,
    error,
    history,
    events,
    patterns,
    forecast,
    analyticsLoading,
    exportUrl,
    analyze,
    clearError,
  } = useAnalytics();
  const [activeSection, setActiveSection] = useState('dashboard');

  const showDashboard = loadingState === 'success' && data;

  const renderSection = () => {
    if (activeSection === 'compare') {
      return (
        <motion.div
          key="compare"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <ComparisonPanel />
        </motion.div>
      );
    }

    if (activeSection === 'simulate') {
      if (!showDashboard || !data) {
        return <DataLockedState onGoDashboard={() => setActiveSection('dashboard')} />;
      }

      return (
        <motion.div
          key="simulate"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Simulator data={data} />
        </motion.div>
      );
    }

    if (!showDashboard) {
      if (activeSection === 'dashboard') {
        return <LandingHero onAnalyze={analyze} loading={false} />;
      }
      return <DataLockedState onGoDashboard={() => setActiveSection('dashboard')} />;
    }

    if (activeSection === 'dashboard') {
      return (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <div className="mb-6">
            <FuturisticInput onAnalyze={analyze} loading={false} />
          </div>
          <FuturisticDashboard
            data={data!}
            history={history}
            events={events}
            patterns={patterns}
            forecast={forecast}
            analyticsLoading={analyticsLoading}
            exportUrl={exportUrl}
          />
        </motion.div>
      );
    }

    const points = history?.points || [];
    const recentPoints = [...points].slice(-14).reverse();
    const recentEvents = (events?.events || []).slice(0, 20);

    return (
      <motion.div
        key="history"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <SectionShell
          title="History"
          subtitle="Daily snapshots and your latest solved-problem events."
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-[16px] p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Snapshots Loaded</p>
              <p className="text-2xl font-bold text-slate-100 mt-1">{points.length}</p>
            </div>
            <div className="rounded-[16px] p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Events Loaded</p>
              <p className="text-2xl font-bold text-slate-100 mt-1">{events?.count || 0}</p>
            </div>
            <div className="rounded-[16px] p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Best Weekday</p>
              <p className="text-2xl font-bold text-slate-100 mt-1">{patterns?.bestWeekday || 'N/A'}</p>
            </div>
            <div className="rounded-[16px] p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Days To 500</p>
              <p className="text-2xl font-bold text-slate-100 mt-1">{forecast?.daysToTarget ?? 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-[16px] p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Latest Snapshots</h3>
              <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                {recentPoints.map((point) => (
                  <div key={point.snapshotDate} className="flex items-center justify-between text-sm py-2 border-b border-white/5">
                    <span className="text-slate-400">{point.snapshotDate}</span>
                    <span className="text-slate-100 font-semibold">Solved {point.totalSolved} · Streak {point.streak}</span>
                  </div>
                ))}
                {recentPoints.length === 0 && <p className="text-sm text-slate-500">No snapshots available.</p>}
              </div>
            </div>

            <div className="rounded-[16px] p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Recent Submissions</h3>
              <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                {recentEvents.map((event) => (
                  <div key={`${event.submissionId}-${event.timestamp}`} className="py-2 border-b border-white/5">
                    <p className="text-sm text-slate-200 leading-snug">{event.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{event.difficulty} · {event.submittedAt}</p>
                  </div>
                ))}
                {recentEvents.length === 0 && <p className="text-sm text-slate-500">No submission events available.</p>}
              </div>
            </div>
          </div>
        </SectionShell>
      </motion.div>
    );
  };

  return (
    <DashboardLayout
      username={data?.username}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      <AnimatePresence mode="wait">
        {error && (
          <ErrorBanner key="error" message={error} onDismiss={clearError} />
        )}
      </AnimatePresence>

      {loadingState === 'loading' && (
        <div className="pt-6">
          <div className="flex items-center gap-3 mb-8 px-1">
            <div className="glow-dot" />
            <span className="text-[13px] font-medium text-slate-500">Fetching and analyzing profile...</span>
          </div>
          <SkeletonPulse />
        </div>
      )}

      {loadingState !== 'loading' && (
        <AnimatePresence mode="wait">{renderSection()}</AnimatePresence>
      )}
    </DashboardLayout>
  );
}
