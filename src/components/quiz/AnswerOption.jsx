import { motion } from 'framer-motion';

/**
 * AnswerOption - Modern answer card
 */
export function AnswerOption({
  option,
  index,
  isSelected,
  isCorrect,
  isWrong,
  disabled,
  showResult,
  onClick
}) {
  const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const label = labels[index] || String(index + 1);
  
  let cardClass = 'answer-card';
  if (isSelected && !showResult) cardClass += ' selected';
  if (showResult && isCorrect) cardClass += ' correct';
  if (showResult && isWrong) cardClass += ' wrong';
  
  const labelClass = showResult && isCorrect 
    ? 'answer-label answer-label-correct'
    : showResult && isWrong 
      ? 'answer-label answer-label-wrong'
      : isSelected && !showResult
        ? 'answer-label answer-label-selected'
        : 'answer-label';
  
  const getLabelIcon = () => {
    if (showResult && isCorrect) {
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    if (showResult && isWrong) {
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    return label;
  };
  
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={cardClass}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      whileHover={disabled ? {} : { scale: 1.005 }}
      whileTap={disabled ? {} : { scale: 0.995 }}
      role="option"
      aria-selected={isSelected}
    >
      <span className={labelClass}>
        {getLabelIcon()}
      </span>
      <span className="answer-text">{option.text}</span>
    </motion.button>
  );
}

/**
 * AnswerOptionMulti - Multi-select answer card
 */
export function AnswerOptionMulti({
  option,
  index,
  isSelected,
  isCorrect,
  isWrong,
  disabled,
  showResult,
  onClick
}) {
  const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const label = labels[index] || String(index + 1);

  let cardClass = 'answer-card';
  if (isSelected && !showResult) cardClass += ' selected';
  if (showResult && isCorrect) cardClass += ' correct';
  if (showResult && isWrong) cardClass += ' wrong';

  // Determine label content: show checkmark only after evaluation (showResult)
  const showCheckmark = showResult && (isCorrect || isWrong);
  const showPartialCheck = isSelected && !showResult;

  const labelClass = showResult && isCorrect
    ? 'answer-label answer-label-correct'
    : showResult && isWrong
      ? 'answer-label answer-label-wrong'
      : isSelected && !showResult
        ? 'answer-label answer-label-selected'
        : 'answer-label';

  const getLabelIcon = () => {
    // After evaluation: show check/x based on correctness
    if (showResult && isCorrect) {
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    if (showResult && isWrong) {
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    // During partial selection: show checkbox-style indicator
    if (showPartialCheck) {
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return label;
  };
  
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={cardClass}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      whileHover={disabled ? {} : { scale: 1.005 }}
      whileTap={disabled ? {} : { scale: 0.995 }}
      role="checkbox"
      aria-checked={isSelected}
    >
      <span className={labelClass}>
        {getLabelIcon()}
      </span>
      <span className="answer-text">{option.text}</span>
    </motion.button>
  );
}

/**
 * TrueFalseOption - Compact True/False statement card
 */
export function TrueFalseOption({
  statement,
  index,
  userAnswer,
  disabled,
  showResult,
  onSelect
}) {
  const isTrueSelected = userAnswer === true;
  const isFalseSelected = userAnswer === false;
  const isCorrectAnswer = statement.answer === true;
  const isFalseAnswer = statement.answer === false;

  return (
    <motion.div
      className="truefalse-card-compact"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      {/* Statement Number */}
      <span className="tf-compact-number">{index + 1}</span>

      {/* Statement Text */}
      <p className="tf-compact-text">{statement.text}</p>

      {/* True/False Buttons */}
      <div className="tf-compact-buttons">
        <motion.button
          onClick={() => !disabled && onSelect(true)}
          disabled={disabled}
          className={`tf-btn tf-btn-true ${isTrueSelected && !showResult ? 'tf-btn-selected-true' : ''} ${showResult && isCorrectAnswer ? 'tf-btn-correct' : ''} ${showResult && !isCorrectAnswer && isTrueSelected ? 'tf-btn-wrong' : ''}`}
          whileTap={disabled ? {} : { scale: 0.95 }}
          title="Đúng"
        >
          {showResult && isCorrectAnswer ? (
            <svg className="tf-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : null}
          <span>Đ</span>
        </motion.button>
        <motion.button
          onClick={() => !disabled && onSelect(false)}
          disabled={disabled}
          className={`tf-btn tf-btn-false ${isFalseSelected && !showResult ? 'tf-btn-selected-false' : ''} ${showResult && isFalseAnswer ? 'tf-btn-correct' : ''} ${showResult && !isFalseAnswer && isFalseSelected ? 'tf-btn-wrong' : ''}`}
          whileTap={disabled ? {} : { scale: 0.95 }}
          title="Sai"
        >
          {showResult && isFalseAnswer ? (
            <svg className="tf-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : null}
          <span>S</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

/**
 * AnswerFeedback - Feedback message after answering
 */
export function AnswerFeedback({ isCorrect, showResult }) {
  if (!showResult) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`answer-feedback ${isCorrect ? 'answer-feedback-correct' : 'answer-feedback-wrong'}`}
    >
      <span className="answer-feedback-icon">
        {isCorrect ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </span>
      <span className="answer-feedback-text">
        {isCorrect ? 'Chính xác!' : 'Chưa đúng rồi'}
      </span>
    </motion.div>
  );
}
