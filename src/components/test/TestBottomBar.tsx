import { Send, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils/helpers';

// Reusable icons
const ChevronLeftIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

interface TestBottomBarProps {
  currentIndex: number;
  totalQuestions: number;
  isLastQuestion: boolean;
  isReviewMode: boolean;
  instantFeedback: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onToggleReview: () => void;
}

// Desktop Bottom Bar - Compact floating style
export function TestBottomBar({
  currentIndex,
  isLastQuestion,
  isReviewMode,
  instantFeedback,
  onPrev,
  onNext,
  onSubmit,
  onToggleReview,
}: TestBottomBarProps) {
  return (
    <div
      className="h-[72px] px-6 flex items-center justify-center gap-6"
      style={{
        background: 'rgba(10, 10, 26, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
      }}
    >
      {/* Previous Button */}
      <button
        onClick={onPrev}
        disabled={currentIndex === 0}
        className={cn(
          'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all min-w-[140px] justify-center',
          'disabled:opacity-30 disabled:cursor-not-allowed',
          currentIndex > 0
            ? 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
            : 'bg-white/5 text-white/30'
        )}
      >
        <ChevronLeftIcon size={16} />
        <span className="text-base">Câu trước</span>
      </button>

      {/* Center: Review Button (only when instantFeedback is TRUE) */}
      {instantFeedback && (
        <button
          onClick={onToggleReview}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all min-w-[140px] justify-center',
            isReviewMode
              ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
              : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white border border-transparent'
          )}
        >
          {isReviewMode ? (
            <>
              <EyeOff size={16} />
              <span className="text-base">Ẩn đáp án</span>
            </>
          ) : (
            <>
              <Eye size={16} />
              <span className="text-base">Hiện đáp án</span>
            </>
          )}
        </button>
      )}

      {/* Next / Submit Button */}
      {isLastQuestion ? (
        <button
          onClick={onSubmit}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all min-w-[140px] justify-center',
            'bg-gradient-to-r from-neon-cyan to-neon-purple text-deep-space',
            'hover:shadow-lg hover:shadow-neon-cyan/30',
            'active:scale-[0.98]'
          )}
        >
          <span className="text-base">Nộp bài</span>
          <Send size={16} />
        </button>
      ) : (
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all min-w-[130px] justify-center bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
        >
          <span className="text-base">Câu sau</span>
          <ChevronRightIcon size={16} />
        </button>
      )}
    </div>
  );
}
