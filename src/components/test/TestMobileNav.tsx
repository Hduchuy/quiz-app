import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/helpers';
import type { Question, Answer } from '@/types';
import { Flag } from 'lucide-react';

interface TestMobileNavProps {
  questions: Question[];
  currentIndex: number;
  answered: Record<string, Answer>;
  flagged: Set<string>;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function TestMobileNav({
  questions,
  currentIndex,
  answered,
  flagged,
  isOpen,
  onClose,
  onNavigate,
}: TestMobileNavProps) {
  const answeredCount = questions.filter((q) => answered[q.id] !== undefined).length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />

          {/* Bottom Sheet - positioned above bottom bar */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="lg:hidden fixed left-0 right-0 z-[940] rounded-t-3xl overflow-hidden"
            style={{
              bottom: 'calc(72px + max(12px, env(safe-area-inset-bottom)))',
              maxHeight: '60vh',
              background: 'rgba(15, 15, 26, 0.98)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="px-4 pb-3 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white/80">Điều hướng câu hỏi</h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    {answeredCount}/{questions.length} câu đã làm ({progressPercent}%)
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Question Grid */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              <div className="grid grid-cols-6 gap-2 mb-4">
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
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        onNavigate(index);
                        onClose();
                      }}
                      className={cn(
                        'w-full aspect-square rounded-lg font-medium text-sm transition-all relative flex items-center justify-center',
                        isCurrent
                          ? 'bg-neon-cyan text-deep-space shadow-neon-cyan/30 shadow-lg'
                          : isAnswered
                          ? 'bg-neon-green/30 text-neon-green hover:bg-neon-green/40'
                          : 'bg-white/10 text-white/60 hover:bg-white/20',
                        isFlagged && !isCurrent && 'ring-2 ring-neon-yellow'
                      )}
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

              {/* Legend */}
              <div className="flex justify-center gap-6 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-white/20" />
                  <span className="text-white/50">Chưa làm</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-neon-cyan" />
                  <span className="text-white/50">Hiện tại</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-neon-green" />
                  <span className="text-white/50">Đã làm</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-neon-yellow" />
                  <span className="text-white/50">Flagged</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
