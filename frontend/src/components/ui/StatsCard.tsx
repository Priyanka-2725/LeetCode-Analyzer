import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'indigo' | 'cyan' | 'purple' | 'green';
  delay?: number;
  suffix?: string;
}

const colorMap = {
  indigo: {
    glow: 'rgba(99,102,241,0.4)', glowSoft: 'rgba(99,102,241,0.15)',
    border: 'rgba(99,102,241,0.45)', text: '#818CF8',
    iconBg: 'rgba(99,102,241,0.12)', iconBorder: 'rgba(99,102,241,0.25)',
    blob: '#6366F1',
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.04) 100%)',
  },
  cyan: {
    glow: 'rgba(34,211,238,0.35)', glowSoft: 'rgba(34,211,238,0.12)',
    border: 'rgba(34,211,238,0.4)', text: '#22D3EE',
    iconBg: 'rgba(34,211,238,0.1)', iconBorder: 'rgba(34,211,238,0.22)',
    blob: '#22D3EE',
    gradient: 'linear-gradient(135deg, rgba(34,211,238,0.14) 0%, rgba(34,211,238,0.03) 100%)',
  },
  purple: {
    glow: 'rgba(167,139,250,0.35)', glowSoft: 'rgba(167,139,250,0.12)',
    border: 'rgba(167,139,250,0.4)', text: '#A78BFA',
    iconBg: 'rgba(167,139,250,0.1)', iconBorder: 'rgba(167,139,250,0.22)',
    blob: '#A78BFA',
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.14) 0%, rgba(167,139,250,0.03) 100%)',
  },
  green: {
    glow: 'rgba(74,222,128,0.35)', glowSoft: 'rgba(74,222,128,0.12)',
    border: 'rgba(74,222,128,0.4)', text: '#4ADE80',
    iconBg: 'rgba(74,222,128,0.1)', iconBorder: 'rgba(74,222,128,0.22)',
    blob: '#4ADE80',
    gradient: 'linear-gradient(135deg, rgba(74,222,128,0.12) 0%, rgba(74,222,128,0.03) 100%)',
  },
};

function useCountUp(target: number, duration = 1400, delay = 0) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 4);
        setCount(Math.round(eased * target));
        if (t < 1) frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(frameRef.current); };
  }, [target, duration, delay]);
  return count;
}

export default function StatsCard({ title, value, subtitle, icon, color, delay = 0, suffix = '' }: StatsCardProps) {
  const c = colorMap[color];
  const numericValue = typeof value === 'number' ? value : parseFloat(value as string) || 0;
  const isNumeric = typeof value === 'number' || !isNaN(numericValue);
  const animated = useCountUp(isNumeric ? numericValue : 0, 1400, delay);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.035, y: -3 }}
      className="relative overflow-hidden rounded-[20px] p-5 cursor-default"
      style={{
        background: c.gradient,
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = c.border;
        el.style.boxShadow = `0 8px 40px rgba(0,0,0,0.45), 0 0 30px ${c.glowSoft}, inset 0 1px 0 rgba(255,255,255,0.1)`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'rgba(255,255,255,0.08)';
        el.style.boxShadow = '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)';
      }}
    >
      {/* Top shimmer */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${c.text}40, transparent)` }} />

      {/* Ambient blobs */}
      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl"
        style={{ background: c.blob, opacity: 0.12 }} />
      <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full blur-2xl"
        style={{ background: c.blob, opacity: 0.07 }} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-5">
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center"
            style={{ background: c.iconBg, border: `1px solid ${c.iconBorder}`, boxShadow: `0 0 16px ${c.glowSoft}` }}>
            <span style={{ color: c.text }}>{icon}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full"
              style={{ background: c.text, boxShadow: `0 0 6px ${c.text}` }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {title}
            </span>
          </div>
        </div>

        <div className="flex items-baseline gap-1 mb-1.5">
          <span
            className="text-[2.25rem] font-black tracking-tight leading-none"
            style={{ color: c.text, textShadow: `0 0 30px ${c.glow}`, fontVariantNumeric: 'tabular-nums' }}
          >
            {isNumeric ? animated.toLocaleString() : value}
          </span>
          {suffix && (
            <span className="text-base font-semibold mb-0.5" style={{ color: `${c.text}80` }}>
              {suffix}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-[11px] font-medium text-slate-500">{subtitle}</p>
        )}
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-[20px]"
        style={{ background: `linear-gradient(90deg, transparent, ${c.text}, transparent)`, opacity: 0.3 }} />
    </motion.div>
  );
}
