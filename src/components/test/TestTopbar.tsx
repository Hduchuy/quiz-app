import { Clock, Settings, Maximize2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/helpers';
import { formatTime } from '@/utils/helpers';

interface TestTopbarProps {
  title: string;
  currentQuestion: number;
  totalQuestions: number;
  timeRemaining: number | null;
  onClose: () => void;
  onSettings?: () => void;
  onFullscreen?: () => void;
}

export function TestTopbar({
  title,
  currentQuestion,
  totalQuestions,
  timeRemaining,
  onClose,
  onSettings,
  onFullscreen,
}: TestTopbarProps) {
  // Timer states: -1 = disabled, 0 = expired, >0 = countdown, null = disabled
  const isTimeWarning = timeRemaining !== null && timeRemaining > 0 && timeRemaining <= 300; // < 5 min
  const isTimeCritical = timeRemaining !== null && timeRemaining > 0 && timeRemaining <= 60; // < 1 min
  const isExpired = timeRemaining === 0;
  const showTimer = timeRemaining !== null && timeRemaining >= 0;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 h-14 md:h-[68px] px-3 md:px-4 flex items-center justify-between z-[1000]"
      style={{
        background: 'rgba(10, 10, 26, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* Left: Timer (only show when enabled) */}
      <div className="w-[80px] md:w-[140px] flex items-center">
        {showTimer && (
          <motion.div
            animate={
              isExpired
                ? { scale: [1, 1.05, 1] }
                : isTimeCritical
                ? { scale: [1, 1.02, 1] }
                : {}
            }
            transition={{ repeat: isExpired || isTimeCritical ? Infinity : 0, duration: 0.5 }}
            className={cn(
              'flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 rounded-lg font-mono text-xs md:text-sm',
              'transition-all duration-300',
              isExpired
                ? 'bg-neon-red text-white animate-pulse'
                : isTimeCritical
                ? 'bg-neon-red/20 text-neon-red shadow-neon-red/30'
                : isTimeWarning
                ? 'bg-neon-yellow/20 text-neon-yellow'
                : 'bg-white/5 text-white/80'
            )}
          >
            <Clock size={12} className={isTimeWarning || isTimeCritical ? 'animate-pulse' : ''} />
            <span className="font-medium hidden sm:inline">
              {isExpired ? 'Hết giờ' : (timeRemaining !== null ? formatTime(timeRemaining) : '00:00')}
            </span>
            <span className="sm:hidden font-medium">
              {isExpired ? 'Hết' : (timeRemaining !== null ? formatTime(timeRemaining) : '00:00')}
            </span>
          </motion.div>
        )}
      </div>

      {/* Center: Title & Progress */}
      <div className="flex flex-col items-center">
        <h1 className="text-sm md:text-base font-semibold text-white truncate max-w-[160px] md:max-w-[280px] lg:max-w-[400px]">
          {title}
        </h1>
        <div className="flex items-center gap-1 text-xs md:text-sm text-white/50">
          <span className="text-neon-cyan font-medium">{currentQuestion}</span>
          <span className="mx-0.5">/</span>
          <span>{totalQuestions}</span>
          <span className="ml-1 text-white/40 hidden sm:inline">câu</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="w-[80px] md:w-[140px] flex items-center justify-end gap-1">
        {onFullscreen && (
          <button
            onClick={onFullscreen}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Toàn màn hình"
          >
            <Maximize2 size={16} className="md:w-[18px] md:h-[18px]" />
          </button>
        )}

        {onSettings && (
          <button
            onClick={onSettings}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Cài đặt"
          >
            <Settings size={16} className="md:w-[18px] md:h-[18px]" />
          </button>
        )}

        <button
          onClick={onClose}
          className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          title="Thoát"
        >
          <X size={18} className="md:w-5 md:h-5" />
        </button>
      </div>
    </motion.header>
  );
}
