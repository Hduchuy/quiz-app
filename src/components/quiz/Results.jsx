import { motion } from 'framer-motion';

/**
 * ScoreCard - Animated score display
 */
export function ScoreCard({ correct, total, hasGrading, className = '' }) {
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  const getGrade = () => {
    if (!hasGrading) return { text: 'Kết quả luyện tập', emoji: '📝', color: 'var(--color-accent)' };
    if (percentage >= 90) return { text: 'Xuất sắc!', emoji: '🏆', color: 'var(--color-success)' };
    if (percentage >= 80) return { text: 'Tuyệt vời!', emoji: '🌟', color: 'var(--color-success)' };
    if (percentage >= 70) return { text: 'Rất tốt!', emoji: '👏', color: 'var(--color-cyan)' };
    if (percentage >= 60) return { text: 'Khá tốt!', emoji: '👍', color: 'var(--color-cyan)' };
    if (percentage >= 50) return { text: 'Cần cố gắng', emoji: '💪', color: 'var(--color-warning)' };
    return { text: 'Cần học thêm', emoji: '📚', color: 'var(--color-error)' };
  };
  
  const grade = getGrade();
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`glass-card p-8 text-center ${className}`}
    >
      {/* Score Circle */}
      <motion.div
        className="relative w-48 h-48 mx-auto mb-8"
        initial={{ rotate: -180 }}
        animate={{ rotate: 0 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
      >
        {/* Background Circle */}
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--color-surface-active)"
            strokeWidth="8"
          />
          {/* Progress Circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={hasGrading ? grade.color : 'var(--color-accent)'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - (hasGrading ? percentage / 100 : correct / Math.max(total, 1))) }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          />
        </svg>
        
        {/* Score Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {hasGrading ? (
            <>
              <motion.span
                className="text-5xl font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {percentage}%
              </motion.span>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {correct}/{total}
              </span>
            </>
          ) : (
            <>
              <motion.span
                className="text-5xl font-bold text-gradient"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {correct}
              </motion.span>
              <span className="text-sm text-[var(--color-text-secondary)]">
                câu đã làm
              </span>
            </>
          )}
        </div>
      </motion.div>
      
      {/* Grade Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <span className="text-4xl mb-2 block">{grade.emoji}</span>
        <h2 className="text-2xl font-bold mb-2" style={{ color: grade.color }}>
          {grade.text}
        </h2>
        {hasGrading && (
          <p className="text-[var(--color-text-secondary)]">
            Bạn trả lời đúng {correct} trên {total} câu hỏi
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

/**
 * ResultItem - Individual result card
 */
export function ResultItem({ question, questionIndex, selectedAnswer, hasGrading }) {
  const isMultiple = question.type === 'multiple';
  
  const isMultiSelect = isMultiple && (
    (question.maxCorrectAnswers && question.maxCorrectAnswers > 1) ||
    (question.options || []).filter(o => o.correct).length > 1
  );

  const isCorrect = () => {
    if (!hasGrading) return null;

    if (isMultiple) {
      if (isMultiSelect) {
        const selectedIds = Array.isArray(selectedAnswer) ? [...selectedAnswer].sort() : [];
        const correctIds = (question.options || [])
          .filter(o => o.correct)
          .map(o => o.id)
          .sort();
        return JSON.stringify(selectedIds) === JSON.stringify(correctIds);
      } else {
        const selected = (question.options || []).find(o => o.id === selectedAnswer);
        return selected?.correct === true;
      }
    }

    if (question.type === 'truefalse-group') {
      return (question.statements || []).every(s => selectedAnswer?.[s.id] === s.answer);
    }

    return false;
  };

  const correct = isCorrect();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: questionIndex * 0.05 }}
      className={`
        glass-card p-5
        ${hasGrading && correct !== null 
          ? correct 
            ? 'border-l-4 border-l-[var(--color-success)]' 
            : 'border-l-4 border-l-[var(--color-error)]'
          : ''
        }
      `}
    >
      {/* Question Header */}
      <div className="flex items-start gap-3 mb-4">
        <span className={`
          flex-shrink-0 w-8 h-8 rounded-lg
          flex items-center justify-center font-bold text-sm
          ${hasGrading && correct !== null
            ? correct
              ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
              : 'bg-[var(--color-error)]/20 text-[var(--color-error)]'
            : 'bg-[var(--color-accent)]/20 text-[var(--color-accent-light)]'
          }
        `}>
          {hasGrading && correct !== null ? (
            correct ? '✓' : '✗'
          ) : (
            questionIndex + 1
          )}
        </span>
        <div className="flex-1">
          <p className="font-medium text-[var(--color-text-primary)] leading-relaxed break-words overflow-wrap-anywhere">
            {question.question}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {!hasGrading && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent-light)]">
                Luyện tập
              </span>
            )}
            {isMultiSelect && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-warning)]/20 text-[var(--color-warning)]">
                Chọn nhiều
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Multiple Choice Answers */}
      {isMultiple && (
        <div className="space-y-2 ml-4">
          {(question.options || []).map((option) => {
            const isSelected = isMultiSelect
              ? (Array.isArray(selectedAnswer) ? selectedAnswer : []).includes(option.id)
              : selectedAnswer === option.id;
            const isCorrectOption = hasGrading && option.correct;
            const isWrongSelection = isSelected && !isCorrectOption && hasGrading;

            return (
              <div
                key={option.id}
                className={`
                  flex items-center gap-3 p-3 rounded-xl
                  ${isCorrectOption 
                    ? 'bg-[var(--color-success)]/10 border border-[var(--color-success)]/30' 
                    : isWrongSelection 
                      ? 'bg-[var(--color-error)]/10 border border-[var(--color-error)]/30'
                      : 'bg-[var(--color-surface)]'
                  }
                `}
              >
                <span className={`
                  w-7 h-7 rounded-lg
                  flex items-center justify-center font-semibold text-sm
                  ${isCorrectOption
                    ? 'bg-[var(--color-success)] text-white'
                    : isWrongSelection
                      ? 'bg-[var(--color-error)] text-white'
                      : 'bg-[var(--color-surface-active)] text-[var(--color-text-secondary)]'
                  }
                `}>
                  {option.label}
                </span>
                <span className={`
                  flex-1 break-words overflow-wrap-anywhere
                  ${isCorrectOption ? 'text-[var(--color-success-light)]' : ''}
                  ${isWrongSelection ? 'text-[var(--color-error-light)]' : ''}
                `}>
                  {option.text}
                </span>
                {isCorrectOption && (
                  <span className="text-[var(--color-success)]">✓</span>
                )}
                {isWrongSelection && (
                  <span className="text-[var(--color-error)]">✗</span>
                )}
                {isSelected && !isWrongSelection && !isCorrectOption && (
                  <span className="text-xs text-[var(--color-text-muted)]">Bạn chọn</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* True/False Statements */}
      {question.type === 'truefalse-group' && (
        <div className="space-y-3 ml-4">
          {(question.statements || []).map((statement, sIdx) => {
            const userAnswer = selectedAnswer?.[statement.id];
            const isStatementCorrect = hasGrading && userAnswer === statement.answer;

            return (
              <div key={statement.id} className="space-y-2">
                <div className={`
                  flex items-start gap-2 p-3 rounded-xl
                  ${hasGrading && isStatementCorrect
                    ? 'bg-[var(--color-success)]/10 border border-[var(--color-success)]/30'
                    : hasGrading && userAnswer !== undefined
                      ? 'bg-[var(--color-error)]/10 border border-[var(--color-error)]/30'
                      : 'bg-[var(--color-surface)]'
                  }
                `}>
                  <span className="flex-shrink-0 w-6 h-6 rounded bg-[var(--color-surface-active)] flex items-center justify-center text-xs font-medium text-[var(--color-text-muted)]">
                    {sIdx + 1}
                  </span>
                  <p className="flex-1 text-sm break-words overflow-wrap-anywhere">{statement.text}</p>
                  {hasGrading && (
                    <span className={`
                      text-xs font-medium px-2 py-0.5 rounded
                      ${isStatementCorrect
                        ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
                        : userAnswer !== undefined
                          ? 'bg-[var(--color-error)]/20 text-[var(--color-error)]'
                          : ''
                      }
                    `}>
                      {statement.answer ? 'Đúng' : 'Sai'}
                    </span>
                  )}
                </div>
                {userAnswer !== undefined && hasGrading && (
                  <div className={`
                    ml-8 text-xs px-3 py-1.5 rounded-lg inline-block
                    ${isStatementCorrect
                      ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                      : 'bg-[var(--color-error)]/10 text-[var(--color-error)]'
                    }
                  `}>
                    Bạn: {userAnswer ? 'Đúng' : 'Sai'} {isStatementCorrect ? '✓' : '✗'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
