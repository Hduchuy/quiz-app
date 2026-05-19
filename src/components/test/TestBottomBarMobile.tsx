import { motion } from 'framer-motion';
import { Send, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils/helpers';

// Reusable icons to avoid import issues
const ChevronLeftIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// Mobile Bottom Bar - Full width, touch-friendly
export function TestBottomBarMobile({
  currentIndex,
  totalQuestions: _totalQuestions,
  isLastQuestion,
  isReviewMode,
  instantFeedback,
  onPrev,
  onNext,
  onSubmit,
  onToggleReview,
}: {
  currentIndex: number;
  totalQuestions: number;
  isLastQuestion: boolean;
  isReviewMode: boolean;
  instantFeedback: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onToggleReview: () => void;
}) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[950]"
      style={{
        background: 'rgba(10, 10, 26, 0.98)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-3">
        {/* Previous Button - Full width equal distribution */}
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3.5 px-2 rounded-xl font-medium transition-all min-h-[48px]',
            'disabled:opacity-30 disabled:cursor-not-allowed',
            currentIndex > 0
              ? 'bg-white/10 text-white/80 hover:bg-white/20 active:bg-white/30'
              : 'bg-white/5 text-white/30'
          )}
        >
          <ChevronLeftIcon size={20} />
          <span className="text-sm">Trước</span>
        </button>

        {/* Review Button - Only when instantFeedback is TRUE */}
        {instantFeedback && (
          <button
            onClick={onToggleReview}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 py-3.5 px-2 rounded-xl font-medium transition-all min-h-[48px]',
              isReviewMode
                ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                : 'bg-white/10 text-white/80 hover:bg-white/20 active:bg-white/30 border border-transparent'
            )}
          >
            {isReviewMode ? (
              <>
                <EyeOff size={18} />
                <span className="text-sm ml-1">Ẩn</span>
              </>
            ) : (
              <>
                <Eye size={18} />
                <span className="text-sm ml-1">Đáp án</span>
              </>
            )}
          </button>
        )}

        {/* Next / Submit Button */}
        {isLastQuestion ? (
          <button
            onClick={onSubmit}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3.5 px-2 rounded-xl font-semibold transition-all min-h-[48px]',
              'bg-gradient-to-r from-neon-cyan to-neon-purple text-deep-space',
              'active:scale-[0.98]'
            )}
          >
            <span className="text-sm">Nộp bài</span>
            <Send size={18} />
          </button>
        ) : (
          <button
            onClick={onNext}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-2 rounded-xl font-medium transition-all min-h-[48px] bg-white/10 text-white/80 hover:bg-white/20 active:bg-white/30"
          >
            <span className="text-sm">Sau</span>
            <ChevronRightIcon size={20} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
