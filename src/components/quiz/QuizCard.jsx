import { motion } from 'framer-motion';
import { AnswerOption, AnswerOptionMulti, TrueFalseOption, AnswerFeedback } from './AnswerOption';

/**
 * QuizCard - Main question card component
 */
export function QuizCard({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  showResult,
  isMultiSelect: isMultiSelectProp,
  showHelper = true,
  onSelectOption,
  onToggleOption,
  onSelectStatement
}) {
  // Determine if this is a multi-select question
  const isMultiSelect = isMultiSelectProp || (question.type === 'multiple' && (
    (question.maxCorrectAnswers && question.maxCorrectAnswers > 1) ||
    (question.options || []).filter(o => o.correct).length > 1
  ));

  // Calculate required and selected counts for multi-select
  const requiredAnswers = question.maxCorrectAnswers ||
    (question.options || []).filter(o => o.correct).length;
  const selectedCount = Array.isArray(selectedAnswer) ? selectedAnswer.length : 0;
  const showRequiredBadge = isMultiSelect && requiredAnswers >= 2;
  const showSelectionCounter = showRequiredBadge && selectedCount > 0 && selectedCount < requiredAnswers && !showResult;

  const isSelectedCorrect = () => {
    if (!showResult || !isMultiSelect) {
      const selectedOpt = (question.options || []).find(o => o.id === selectedAnswer);
      return selectedOpt?.correct === true;
    }
    const selectedIds = Array.isArray(selectedAnswer) ? [...selectedAnswer].sort() : [];
    const correctIds = (question.options || [])
      .filter(o => o.correct)
      .map(o => o.id)
      .sort();
    return JSON.stringify(selectedIds) === JSON.stringify(correctIds);
  };

  return (
    <motion.div
      key={questionIndex}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="quiz-card"
    >
      {/* Question Header */}
      <div className="quiz-card-header">
        <span className="quiz-card-number">
          {questionIndex + 1}
        </span>
        <div className="quiz-card-info">
          <span className="quiz-card-meta">
            Câu hỏi {questionIndex + 1} / {totalQuestions}
          </span>
          {showRequiredBadge && !showSelectionCounter && (
            <span className="quiz-card-badge quiz-card-badge-multi">
              Chọn {requiredAnswers} đáp án
            </span>
          )}
          {showSelectionCounter && (
            <span className="quiz-card-badge quiz-card-badge-progress">
              Đã chọn {selectedCount}/{requiredAnswers}
            </span>
          )}
        </div>
      </div>

      {/* Question Text */}
      <h2 className="quiz-card-question">
        {question.question}
      </h2>

      {/* Answer Options */}
      {question.type === 'multiple' && (
        <>
          <div className="quiz-card-answers">
            {(question.options || []).map((option, idx) => {
              if (isMultiSelect) {
                const selectedIds = Array.isArray(selectedAnswer) ? selectedAnswer : [];
                const isSelected = selectedIds.includes(option.id);
                const isCorrectOption = option.correct;
                const isWrongSelection = showResult && isSelected && !isCorrectOption;

                return (
                  <AnswerOptionMulti
                    key={option.id}
                    option={option}
                    index={idx}
                    isSelected={isSelected}
                    isCorrect={showResult && isCorrectOption}
                    isWrong={isWrongSelection}
                    disabled={showResult}
                    showResult={showResult}
                    onClick={() => onToggleOption(option.id)}
                  />
                );
              }

              const isSelected = selectedAnswer === option.id;
              const isCorrectOption = option.correct;
              const isWrongSelection = showResult && isSelected && !isCorrectOption;

              return (
                <AnswerOption
                  key={option.id}
                  option={option}
                  index={idx}
                  isSelected={isSelected}
                  isCorrect={showResult && isCorrectOption}
                  isWrong={isWrongSelection}
                  disabled={showResult}
                  showResult={showResult}
                  onClick={() => onSelectOption(option.id)}
                />
              );
            })}
          </div>
          {showResult && (
            <AnswerFeedback isCorrect={isSelectedCorrect()} showResult={showResult} />
          )}
          {/* Helper message for multi-select when not enough selected */}
          {showHelper && isMultiSelect && !showResult && (() => {
            const localSelectedCount = Array.isArray(selectedAnswer) ? selectedAnswer.length : 0;
            if (localSelectedCount > 0 && localSelectedCount < requiredAnswers) {
              return (
                <div className="multi-select-helper">
                  Chọn thêm {requiredAnswers - localSelectedCount} đáp án
                </div>
              );
            }
            return null;
          })()}
        </>
      )}

      {/* True/False Statements */}
      {question.type === 'truefalse-group' && (
        <>
          <div className="quiz-card-answers">
            {(question.statements || []).map((statement, idx) => (
              <TrueFalseOption
                key={statement.id}
                statement={statement}
                index={idx}
                userAnswer={selectedAnswer?.[statement.id]}
                disabled={showResult}
                showResult={showResult}
                onSelect={(value) => onSelectStatement(statement.id, value)}
              />
            ))}
          </div>
          {/* Helper message for true/false when not all statements answered */}
          {showHelper && !showResult && (() => {
            const totalStatements = (question.statements || []).length;
            const answeredStatements = (question.statements || []).filter(
              s => selectedAnswer?.[s.id] !== undefined
            ).length;
            if (answeredStatements > 0 && answeredStatements < totalStatements) {
              return (
                <div className="multi-select-helper">
                  Đã trả lời {answeredStatements}/{totalStatements} ý
                </div>
              );
            }
            return null;
          })()}
        </>
      )}
    </motion.div>
  );
}

/**
 * QuizCardSkeleton - Loading skeleton
 */
export function QuizCardSkeleton() {
  return (
    <div className="quiz-card animate-pulse">
      <div className="quiz-card-header">
        <div className="quiz-card-number" style={{ background: 'var(--color-surface)' }} />
        <div className="quiz-card-info">
          <div style={{ height: 14, width: 120, background: 'var(--color-surface)', borderRadius: 4 }} />
        </div>
      </div>
      <div style={{ height: 24, width: '80%', background: 'var(--color-surface)', borderRadius: 6, marginBottom: 16 }} />
      <div className="quiz-card-answers">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ height: 56, background: 'var(--color-surface)', borderRadius: 14 }} />
        ))}
      </div>
    </div>
  );
}
