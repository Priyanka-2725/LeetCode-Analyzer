import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface NavbarProps {
  username?: string;
  onMobileMenuToggle: () => void;
}

export default function Navbar({ username, onMobileMenuToggle }: NavbarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasNotif] = useState(true);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setNotifOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header
      className="sticky top-0 z-30 relative flex items-center gap-4 px-4 md:px-7 h-[60px]"
      style={{
        background: 'rgba(8,12,23,0.75)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 1px 0 rgba(99,102,241,0.08)',
      }}
    >
      {/* Top shimmer */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.3) 50%, transparent 100%)' }} />

      {/* Mobile menu */}
      <button
        onClick={onMobileMenuToggle}
        className="md:hidden p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile logo */}
      <div className="md:hidden flex items-center gap-2">
        <div className="w-7 h-7 rounded-[9px] flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #6366F1, #A78BFA)', boxShadow: '0 0 14px rgba(99,102,241,0.5)' }}>
          <svg className="w-[15px] h-[15px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="font-bold text-white text-sm tracking-tight">
          Algo<span className="text-gradient-primary">Streak</span>
        </span>
      </div>

      {/* Search bar */}
      <motion.div
        animate={{ width: searchFocused ? 300 : 200 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className={`hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-[13px] ml-auto md:ml-0 transition-all ${
          searchFocused ? 'input-futuristic' : ''
        }`}
        style={!searchFocused ? {
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '13px',
        } : {}}
      >
        <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: searchFocused ? '#818CF8' : '#475569' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search topics, problems..."
          className="bg-transparent text-[13px] text-slate-300 placeholder-slate-600 focus:outline-none w-full"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {searchFocused && (
          <kbd className="hidden lg:flex items-center gap-0.5 text-[10px] text-slate-600 font-mono px-1.5 py-0.5 rounded-md"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            ESC
          </kbd>
        )}
      </motion.div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notification bell */}
        <div ref={notifRef} className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setNotifOpen((open) => !open)}
            aria-expanded={notifOpen}
            aria-label="Open notifications"
            className="relative p-2 rounded-[11px] transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <svg className="w-[17px] h-[17px] text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {hasNotif && (
              <span
                className="absolute top-1 right-1 w-[7px] h-[7px] rounded-full"
                style={{ background: '#6366F1', boxShadow: '0 0 8px rgba(99,102,241,0.9)' }}
              />
            )}
          </motion.button>

          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-[calc(100%+10px)] w-[280px] rounded-[18px] overflow-hidden border border-white/8 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
              style={{
                background: 'linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(8,12,23,0.98) 100%)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              }}
            >
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Notifications</p>
                  <p className="text-[11px] text-slate-500">Recent activity and updates</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Live
                </span>
              </div>

              <div className="p-3 space-y-2">
                <div className="rounded-[14px] p-3 border border-white/5 bg-white/[0.03]">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 font-medium">No new alerts</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Your latest analysis is up to date.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[14px] p-3 border border-dashed border-white/6 bg-white/[0.02]">
                  <p className="text-[11px] text-slate-500">
                    This panel is ready for future alerts, reminders, and progress updates.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.07)' }} />

        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="flex items-center gap-2.5 cursor-pointer px-2 py-1.5 rounded-[11px] transition-all"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="w-7 h-7 rounded-[9px] flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #A78BFA 100%)',
              boxShadow: '0 0 14px rgba(99,102,241,0.45)',
            }}
          >
            {username ? username.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden md:block">
            <div className="text-[12px] font-semibold text-slate-200 leading-none">
              {username || 'Guest'}
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">Coder</div>
          </div>
          <svg className="hidden md:block w-3 h-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </div>
    </header>
  );
}
