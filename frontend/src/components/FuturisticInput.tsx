import { useState } from 'react';
import { motion } from 'framer-motion';

interface FuturisticInputProps {
  onAnalyze: (input: string) => void;
  loading: boolean;
}

export default function FuturisticInput({ onAnalyze, loading }: FuturisticInputProps) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onAnalyze(trimmed);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-lg mx-auto"
    >
      <form onSubmit={handleSubmit}>
        <div
          className="flex items-center gap-2 p-1.5 rounded-[18px] transition-all duration-300"
          style={{
            background: focused
              ? 'rgba(99,102,241,0.08)'
              : 'rgba(255,255,255,0.04)',
            border: `1px solid ${focused ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.08)'}`,
            boxShadow: focused
              ? '0 0 0 3px rgba(99,102,241,0.1), 0 0 30px rgba(99,102,241,0.15)'
              : '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          {/* Icon */}
          <div className="pl-3 flex-shrink-0">
            <svg
              className="w-4 h-4 transition-colors duration-200"
              style={{ color: focused ? '#818CF8' : '#475569' }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          {/* Input */}
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Enter LeetCode username..."
            className="flex-1 bg-transparent text-[13.5px] font-medium text-slate-200 placeholder-slate-600 focus:outline-none py-2.5"
            disabled={loading}
          />

          {/* Clear button */}
          {value && !loading && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setValue('')}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-400 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          )}

          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={loading || !value.trim()}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[13px] text-[13px] font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #A78BFA 100%)',
              boxShadow: loading || !value.trim()
                ? 'none'
                : '0 0 20px rgba(99,102,241,0.45), 0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {loading ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Analyzing</span>
              </>
            ) : (
              <>
                <span>Analyze</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
