import { motion } from 'framer-motion';
import { Check, X, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/utils/helpers';
import type { FillBlankQuestion, FillBlank } from '@/types';

interface FillBlankAnswerProps {
  question: FillBlankQuestion;
  userAnswer: Record<string, string> | undefined;
  showResult: boolean;
  onAnswer: (answer: Record<string, string>) => void;
}

export function FillBlankAnswer({ question, userAnswer = {}, showResult, onAnswer }: FillBlankAnswerProps) {

  const handleInputChange = (blankId: string, value: string) => {
    onAnswer({
      ...userAnswer,
      [blankId]: value,
    });
  };

  // Parse content to render blanks inline
  const renderContentWithBlanks = () => {
    const parts: { type: 'text' | 'blank'; value: string; blank?: FillBlank }[] = [];
    const regex = /\[([^\]]+)\]/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(question.content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', value: question.content.slice(lastIndex, match.index) });
      }

      const blankId = match[1];
      const blank = question.blanks.find(b => b.id === blankId);
      if (blank) {
        parts.push({ type: 'blank', value: match[0], blank });
      } else {
        parts.push({ type: 'text', value: match[0] });
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < question.content.length) {
      parts.push({ type: 'text', value: question.content.slice(lastIndex) });
    }

    return parts.map((part, index) => {
      if (part.type === 'blank' && part.blank) {
        const blank = part.blank;
        const userAnswerValue = userAnswer[blank.id] || '';
        const correctAnswer = blank.text.trim().toLowerCase();
        const userAnswerTrimmed = userAnswerValue.trim().toLowerCase();

        // Check if correct (considering alternatives)
        const isCorrect = showResult && (
          userAnswerTrimmed === correctAnswer ||
          blank.alternatives.some(alt => alt.toLowerCase() === userAnswerTrimmed)
        );
        const isWrong = showResult && userAnswerTrimmed && !isCorrect;

        return (
          <span key={blank.id} className="inline-flex items-center">
            <input
              type="text"
              value={userAnswerValue}
              onChange={(e) => handleInputChange(blank.id, e.target.value)}
              disabled={showResult}
              placeholder="..."
              className={cn(
                'inline-block w-32 px-2 py-1 rounded-lg text-center text-sm font-medium transition-all',
                'border-2 outline-none',
                !showResult && 'bg-white/5 border-white/20 text-white placeholder:text-white/30',
                showResult && !userAnswerValue && 'bg-white/5 border-white/10 text-white/50',
                showResult && isCorrect && 'bg-neon-green/20 border-neon-green/50 text-neon-green',
                showResult && isWrong && 'bg-neon-red/20 border-neon-red/50 text-neon-red'
              )}
            />
            {showResult && isCorrect && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-1 text-neon-green"
              >
                <Check size={16} />
              </motion.span>
            )}
            {showResult && isWrong && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-1 text-neon-red"
              >
                <X size={16} />
              </motion.span>
            )}
          </span>
        );
      }
      return <span key={index}>{part.value}</span>;
    });
  };

  return (
    <div className="space-y-4">
      {/* Question Content */}
      <div className="text-base text-white leading-relaxed whitespace-pre-wrap">
        {renderContentWithBlanks()}
      </div>

      {/* Answer Feedback */}
      {showResult && question.explanation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10"
        >
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-neon-cyan mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-white/50 mb-1">Giải thích</p>
              <p className="text-sm text-white/80">{question.explanation}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Correct Answers Summary */}
      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-neon-cyan" />
            <p className="text-xs font-medium text-neon-cyan">Đáp án đúng</p>
          </div>
          <div className="space-y-1">
            {question.blanks.map((blank, index) => (
              <div key={blank.id} className="flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-neon-cyan/10 text-neon-cyan text-xs flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-white/70">{blank.text}</span>
                {blank.alternatives.length > 0 && (
                  <span className="text-white/40 text-xs">
                    (hoặc: {blank.alternatives.join(', ')})
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
