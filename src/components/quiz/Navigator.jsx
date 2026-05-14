import { motion } from 'framer-motion';

/**
 * QuestionNavigatorGrid - Grid navigation for questions
 */
export function QuestionNavigatorGrid({
  total,
  current,
  answered,
  onNavigate,
  className = ''
}) {
  return (
    <div className={className}>
      <div className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">
        Điều hướng
      </div>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: total }, (_, i) => (
          <motion.button
            key={i}
            onClick={() => onNavigate(i)}
            className={`
              aspect-square rounded-xl font-semibold text-sm
              flex items-center justify-center
              transition-all duration-200
              ${i === current
                ? 'bg-[var(--color-accent)] text-white shadow-lg glow-accent'
                : answered.has(i)
                  ? 'bg-[var(--color-success)]/20 text-[var(--color-success-light)] border border-[var(--color-success)]/30'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]'
              }
            `}
            whileHover={{ scale: i === current ? 1 : 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`Câu ${i + 1}${answered.has(i) ? ' (đã trả lời)' : ''}`}
          >
            {i + 1}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/**
 * ProgressStats - Progress statistics display
 */
export function ProgressStats({ answered, total, correct, showCorrect = false }) {
  const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;
  
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[var(--color-text-secondary)]">Tiến độ</span>
        <span className="text-sm font-semibold text-[var(--color-accent-light)]">{percentage}%</span>
      </div>
      <div className="progress-bar">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between mt-3 text-xs">
        <span className="text-[var(--color-text-muted)]">
          {answered}/{total} đã trả lời
        </span>
        {showCorrect && correct !== undefined && (
          <span className="text-[var(--color-success)] font-semibold">
            {correct} đúng
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * QuizInfoCard - Quiz information display
 */
export function QuizInfoCard({ title, questionCount, hasAnswerKey, className = '' }) {
  return (
    <div className={`glass-card p-4 ${className}`}>
      <h3 className="font-semibold text-[var(--color-text-primary)] mb-3 truncate">
        {title || 'Quiz'}
      </h3>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-surface)] text-xs font-medium">
          <svg className="w-3.5 h-3.5 text-[var(--color-accent-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {questionCount} câu
        </span>
        {hasAnswerKey && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-success)]/10 text-[var(--color-success)] text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Có đáp án
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * AnsweredCounter - Animated answer counter
 */
export function AnsweredCounter({ answered, total }) {
  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      key={answered}
    >
      <span className="text-2xl font-bold text-gradient">{answered}</span>
      <span className="text-[var(--color-text-muted)] text-sm">/ {total}</span>
    </motion.div>
  );
}
