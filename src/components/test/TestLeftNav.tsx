import { motion } from 'framer-motion';
import { Flag } from 'lucide-react';
import { cn } from '@/utils/helpers';
import type { Question, Answer } from '@/types';

interface TestLeftNavProps {
  questions: Question[];
  currentIndex: number;
  answered: Record<string, Answer>;
  flagged: Set<string>;
  onNavigate: (index: number) => void;
}

// Layout constants - must match TestRunnerPage

export function TestLeftNav({
  questions,
  currentIndex,
  answered,
  flagged,
  onNavigate,
}: TestLeftNavProps) {
  const answeredCount = questions.filter((q) => answered[q.id] !== undefined).length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  return (
    <aside 
      className="hidden lg:flex flex-col w-[260px] overflow-hidden fixed left-0 top-[68px] bottom-[72px] z-[900]"
      style={{
        background: 'rgba(10, 10, 26, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-sm font-medium text-white/80 mb-3">Điều hướng</h3>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-white/50">Tiến độ</span>
            <span className="text-neon-cyan font-medium">{progressPercent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple"
            />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2.5 border-b border-white/10">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-white/20" />
            <span className="text-white/50">Chưa làm</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-neon-cyan shadow-neon-cyan/30" />
            <span className="text-white/50">Hiện tại</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-neon-green/60" />
            <span className="text-white/50">Đã làm</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-neon-yellow/60" />
            <span className="text-white/50">Flagged</span>
          </div>
        </div>
      </div>

      {/* Question Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, index) => {
            const isAnswered = answered[q.id] !== undefined;
            const isFlagged = flagged.has(q.id);
            const isCurrent = index === currentIndex;

            return (
              <motion.button
                key={q.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate(index)}
                className={cn(
                  'w-9 h-9 rounded-lg font-medium text-xs transition-all relative',
                  isCurrent
                    ? 'bg-neon-cyan text-deep-space shadow-neon-cyan/30 shadow-md'
                    : isAnswered
                    ? 'bg-neon-green/30 text-neon-green hover:bg-neon-green/40'
                    : 'bg-white/10 text-white/60 hover:bg-white/20',
                  isFlagged && !isCurrent && 'ring-2 ring-neon-yellow ring-offset-1 ring-offset-transparent'
                )}
                title={`Câu ${index + 1}${isAnswered ? ' (Đã làm)' : ''}${isFlagged ? ' (Flagged)' : ''}`}
              >
                {index + 1}
                {isFlagged && (
                  <Flag
                    size={8}
                    className="absolute -top-0.5 -right-0.5 text-neon-yellow fill-neon-yellow"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
