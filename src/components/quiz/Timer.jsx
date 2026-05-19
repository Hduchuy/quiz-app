import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Timer - Animated countdown timer
 */
export function Timer({ duration, onTimeUp, isPaused = false }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLow = timeLeft <= 60;

  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, timeLeft, onTimeUp]);

  const percentage = duration > 0 ? (timeLeft / duration) * 100 : 0;

  return (
    <motion.div
      className={`
        inline-flex items-center gap-3 px-4 py-2 rounded-2xl
        bg-[var(--color-surface)] border border-[var(--color-border)]
        ${isLow ? 'border-[var(--color-error)]/50' : ''}
      `}
      animate={isLow ? { scale: [1, 1.02, 1] } : {}}
      transition={{ repeat: isLow ? Infinity : 0, duration: 1 }}
    >
      <div className={`
        w-2 h-2 rounded-full
        ${isLow ? 'bg-[var(--color-error)] animate-pulse' : 'bg-[var(--color-accent)]'}
      `} />
      <span className={`
        font-mono text-lg font-bold tracking-wider
        ${isLow ? 'text-[var(--color-error)]' : 'text-[var(--color-text-primary)]'}
      `}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
      <div className="w-16 h-1.5 bg-[var(--color-surface-active)] rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isLow ? 'bg-[var(--color-error)]' : 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-cyan)]'}`}
          style={{ width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
}

/**
 * MobileTopBar - Top bar for mobile
 */
export function MobileTopBar({ title, current, total, timeLeft, showTimer = false }) {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass-card rounded-none border-t-0 border-x-0 px-4 py-3" style={{ paddingInline: 'clamp(12px, 2vw, 24px)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-lg text-gradient truncate max-w-[150px] sm:max-w-none">{title}</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[var(--color-text-secondary)]">
            <span className="font-semibold text-[var(--color-accent-light)]">{current}</span>
            <span className="mx-1">/</span>
            <span>{total}</span>
          </span>
          {showTimer && timeLeft !== undefined && (
            <TimerDisplay seconds={timeLeft} compact />
          )}
        </div>
      </div>
      <div className="progress-bar mt-2">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${(current / total) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

/**
 * TimerDisplay - Compact timer for display
 */
export function TimerDisplay({ seconds, compact = false }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isLow = seconds <= 60;

  if (compact) {
    return (
      <span className={`font-mono font-bold ${isLow ? 'text-[var(--color-error)]' : 'text-[var(--color-cyan)]'}`}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
    );
  }

  return (
    <div className={`
      inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
      bg-[var(--color-surface)]
      ${isLow ? 'text-[var(--color-error)]' : 'text-[var(--color-cyan)]'}
    `}>
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="font-mono font-bold">{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
    </div>
  );
}

/**
 * BottomNavigation - Sticky bottom nav for mobile
 */
export function BottomNavigation({
  onPrev,
  onNext,
  onSubmit,
  isFirst,
  isLast,
  canSubmit,
  submitLabel = 'Nộp bài'
}) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-card rounded-none border-b-0 border-x-0 px-4 py-4" style={{ paddingInline: 'clamp(12px, 2vw, 24px)', paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="flex items-center gap-3">
        <motion.button
          onClick={onPrev}
          disabled={isFirst}
          className={`
            flex-1 py-4 rounded-2xl font-semibold text-base
            transition-all duration-200
            ${isFirst
              ? 'bg-[var(--color-surface)] text-[var(--color-text-muted)] cursor-not-allowed'
              : 'bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] active:scale-[0.98]'
            }
          `}
          whileTap={isFirst ? {} : { scale: 0.98 }}
        >
          ← Câu trước
        </motion.button>

        {isLast ? (
          <motion.button
            onClick={onSubmit}
            disabled={!canSubmit}
            className={`
              flex-1 py-4 rounded-2xl font-semibold text-base
              transition-all duration-200
              ${canSubmit
                ? 'btn-success'
                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] cursor-not-allowed'
              }
            `}
            whileTap={canSubmit ? { scale: 0.98 } : {}}
          >
            {submitLabel}
          </motion.button>
        ) : (
          <motion.button
            onClick={onNext}
            className="flex-1 py-4 rounded-2xl font-semibold text-base btn-primary"
            whileTap={{ scale: 0.98 }}
          >
            Câu tiếp →
          </motion.button>
        )}
      </div>
    </div>
  );
}
