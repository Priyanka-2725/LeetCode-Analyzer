import React, { useState } from 'react';

interface Props {
  onAnalyze: (input: string) => void;
  loading: boolean;
}

export default function InputSection({ onAnalyze, loading }: Props) {
  const [input, setInput] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) onAnalyze(trimmed);
  }

  return (
    <section className="w-full max-w-2xl mx-auto">
      <div className="card p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-500/10 rounded-2xl mb-4">
            <svg className="w-7 h-7 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-100">Analyze a Profile</h2>
          <p className="text-slate-400 text-sm mt-1">
            Enter a LeetCode username or profile URL
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            className="input-field flex-1"
            placeholder="e.g. john_doe or https://leetcode.com/u/john_doe/"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            aria-label="LeetCode username or URL"
          />
          <button
            type="submit"
            className="btn-primary whitespace-nowrap"
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </span>
            ) : 'Analyze'}
          </button>
        </form>

        <p className="text-xs text-slate-500 mt-3 text-center">
          Examples: <span className="text-slate-400">neal_wu</span> · <span className="text-slate-400">https://leetcode.com/u/tourist/</span>
        </p>
      </div>
    </section>
  );
}
