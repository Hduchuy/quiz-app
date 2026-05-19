import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ErrorBoundary - Catch and display fallback UI for component crashes
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] m-4">
          <div className="w-16 h-16 bg-[var(--color-error)]/20 text-[var(--color-error)] rounded-full flex items-center justify-center mb-4">
             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Đã xảy ra lỗi</h2>
          <p className="text-[var(--color-text-muted)] mb-4">Không thể hiển thị nội dung này do lỗi hệ thống.</p>
          
          {import.meta.env.DEV && this.state.error && (
            <div className="w-full max-w-2xl mt-4 p-4 bg-black/40 rounded-xl text-left overflow-auto max-h-[300px]">
              <div className="text-[var(--color-error)] font-mono text-sm mb-2 font-bold">
                {this.state.error.toString()}
              </div>
              <pre className="text-[var(--color-text-muted)] font-mono text-[10px] leading-tight">
                {this.state.error.stack}
              </pre>
            </div>
          )}

          <button 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="btn-action btn-primary px-6 py-2 rounded-xl mt-6"
          >
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}


/**
 * GlassCard - Modern glassmorphism card component
 */
export function GlassCard({ 
  children, 
  className = '', 
  hover = false,
  padding = 'p-6',
  ...props 
}) {
  return (
    <div
      className={`
        glass-card
        ${padding}
        ${hover ? 'glass-card-hover cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * ProgressBar - Animated progress bar
 */
export function ProgressBar({ value, max, showLabel = false, className = '' }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  return (
    <div className={`${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm text-[var(--color-text-secondary)] mb-2">
          <span>Tiến độ</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="progress-bar">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

/**
 * QuestionNavigator - Grid navigation dots
 */
export function QuestionNavigator({
  total,
  current,
  answered,
  onNavigate,
  className = ''
}) {
  return (
    <div className={`grid grid-cols-8 gap-2 ${className}`}>
      {Array.from({ length: total }, (_, i) => (
        <motion.button
          key={i}
          onClick={() => onNavigate(i)}
          className={`
            nav-dot
            aspect-square
            ${i === current ? 'current' : ''}
            ${answered.has(i) && i !== current ? 'answered' : ''}
          `}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          aria-label={`Câu ${i + 1}`}
        />
      ))}
    </div>
  );
}

/**
 * Toggle - Modern toggle switch
 */
export function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-3 px-4 rounded-xl hover:bg-[var(--color-surface-hover)] transition-colors -mx-4 px-4">
      <div className="flex-1">
        <div className="font-semibold text-[var(--color-text-primary)]">{label}</div>
        {description && (
          <div className="text-sm text-[var(--color-text-muted)] mt-0.5">{description}</div>
        )}
      </div>
      <div className="toggle">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="toggle-slider" />
      </div>
    </label>
  );
}

/**
 * Button - Modern button with variants
 */
export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  loading = false,
  ...props 
}) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    ghost: 'btn-ghost',
  };
  
  const sizes = {
    sm: 'text-sm py-2 px-4 min-h-10',
    md: 'text-base py-3 px-6 min-h-12',
    lg: 'text-lg py-4 px-8 min-h-14',
  };
  
  return (
    <motion.button
      className={`btn ${variants[variant]} ${sizes[size]} ${className}`}
      whileTap={{ scale: 0.98 }}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="animate-spin">⏳</span>
      ) : (
        children
      )}
    </motion.button>
  );
}

/**
 * Badge - Status badge
 */
export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]',
    primary: 'bg-[var(--color-accent)]/20 text-[var(--color-accent-light)]',
    success: 'bg-[var(--color-success)]/20 text-[var(--color-success-light)]',
    error: 'bg-[var(--color-error)]/20 text-[var(--color-error-light)]',
    warning: 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]',
  };
  
  return (
    <span className={`
      inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
      ${variants[variant]}
      ${className}
    `}>
      {children}
    </span>
  );
}

/**
 * AnimatedContainer - Wrapper for page transitions
 */
export function AnimatedContainer({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * SlideIn - Slide animation wrapper
 */
export function SlideIn({ children, direction = 'left', className = '' }) {
  const directions = {
    left: { x: -50, y: 0 },
    right: { x: 50, y: 0 },
    up: { x: 0, y: 50 },
    down: { x: 0, y: -50 },
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...directions[direction] }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerContainer - Staggered animation for lists
 */
export function StaggerContainer({ children, className = '', delay = 0.05 }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerItem - Individual item for staggered animation
 */
export function StaggerItem({ children, className = '' }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * SettingsButton - Icon button with dropdown settings panel
 * Props:
 *   settings: { shuffleQuestions, shuffleAnswers, showAnswerInstantly }
 *   onChange: (newSettings) => void
 */
export function SettingsButton({ settings, onChange }) {
  // settings is already normalized by parent (QuizEditor)
  const normalized = settings || {};

  const handleToggle = (key) => {
    onChange({
      ...normalized,
      [key]: !normalized[key]
    });
  };

  const settingsItems = [
    { key: 'shuffleQuestions', label: 'Xáo trộn câu hỏi' },
    { key: 'shuffleAnswers', label: 'Tráo đáp án trắc nghiệm' },
    { key: 'shuffleTrueFalse', label: 'Tráo thứ tự mệnh đề đúng/sai' },
    { key: 'shuffleDragMatch', label: 'Tráo vị trí ô kéo thả' },
    { key: 'shuffleDragFill', label: 'Tráo vị trí ô trống điền khuyết' },
    { key: 'showAnswerInstantly', label: 'Hiện đáp án ngay' }
  ];

  return (
    <div className="settings-dropdown">
      {settingsItems.map(({ key, label }) => (
        <label key={key} className="settings-option group">
          <span className="settings-option-label">{label}</span>
          <div className={`toggle ${normalized[key] ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={Boolean(normalized[key])}
              onChange={() => handleToggle(key)}
            />
            <span className="toggle-slider" />
          </div>
        </label>
      ))}
    </div>
  );
}

/**
 * Modal - Overlay modal
 */
export function Modal({ isOpen, onClose, children, title }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            style={{ padding: 'env(safe-area-inset)' }}
          >
            <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-auto pointer-events-auto mx-4" style={{ maxWidth: 'calc(100vw - 32px)' }}>
              {title && (
                <div className="flex items-center justify-between p-4 pb-0">
                  <h2 className="text-xl font-bold">{title}</h2>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="p-4">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
