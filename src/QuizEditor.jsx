import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { generateId } from './utils/quizModels';
import { DEFAULT_SETTINGS, normalizeSettings } from './utils/quizSettings';
import { SettingsButton } from './components/ui';
import './App.css';

// ============================================================================
// Mobile Settings Sheet (Bottom Sheet) - Mounts to body via Portal
// ============================================================================
function MobileSettingsSheet({ isOpen, onClose, settings, onChange }) {
  // Render via Portal to avoid parent layout constraints
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="mobile-sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="mobile-settings-sheet"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            role="dialog"
            aria-label="Tùy chọn làm bài"
          >
            <div className="mobile-sheet-handle" />
            <div className="mobile-sheet-header">
              <h3 className="mobile-sheet-title">Tùy chọn làm bài</h3>
              <button className="mobile-sheet-close" onClick={onClose} aria-label="Đóng">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mobile-sheet-content">
              <SettingsButton settings={settings} onChange={onChange} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ============================================================================
// Icon-only Settings Button with Dropdown (Desktop)
// ============================================================================
function IconSettingsButton({ settings, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close on click outside (desktop only)
  useEffect(() => {
    if (!isOpen || isMobile) return;

    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isMobile]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Render mobile sheet on mobile
  if (isMobile) {
    return (
      <>
        <button
          ref={buttonRef}
          className="icon-settings-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Cài đặt"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <svg
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-45' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
        <MobileSettingsSheet
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          settings={settings}
          onChange={onChange}
        />
      </>
    );
  }

  // Desktop dropdown
  return (
    <div className="icon-settings-wrapper">
      <button
        ref={buttonRef}
        className="icon-settings-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Cài đặt"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-45' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            className="icon-settings-dropdown"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="menu"
            aria-label="Tùy chọn làm bài"
          >
            <SettingsButton settings={settings} onChange={onChange} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// OptionEditor - Flat answer row
// ============================================================================
function OptionEditor({
  option,
  index,
  isEditMode,
  onUpdateText,
  onToggleCorrect,
  onRemove,
  canRemove
}) {
  const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const displayLabel = labels[index] || String(index + 1);

  return (
    <div className={`option-row ${option.correct ? 'is-correct' : ''} ${isEditMode ? 'is-editing' : ''}`}>
      {isEditMode ? (
        <>
          <input
            type="checkbox"
            className="option-checkbox"
            checked={option.correct}
            onChange={() => onToggleCorrect(option.id)}
            title="Đánh dấu đúng"
          />
          <span className="option-label">{displayLabel}</span>
          <input
            type="text"
            className="option-input"
            value={option.text}
            onChange={(e) => onUpdateText(option.id, e.target.value)}
            placeholder={`Đáp án ${displayLabel}`}
          />
          {canRemove && (
            <button
              className="option-remove"
              onClick={() => onRemove(option.id)}
              type="button"
              title="Xóa"
            >
              ✕
            </button>
          )}
        </>
      ) : (
        <>
          <span className={`option-indicator ${option.correct ? 'correct' : ''}`}>
            {option.correct ? '✓' : displayLabel}
          </span>
          <span className="option-text break-words overflow-wrap-anywhere">{option.text || <em>(trống)</em>}</span>
        </>
      )}
    </div>
  );
}

// ============================================================================
// QuestionItem - Flat question card
// ============================================================================
function QuestionItem({
  question,
  questionIndex,
  isEditMode,
  onUpdateQuestion,
  onUpdateOption,
  onDeleteQuestion
}) {
  const isMultipleChoice = question.type === 'multiple';
  const isTrueFalse = question.type === 'truefalse-group';
  const isMultiAnswer = isMultipleChoice && question.maxCorrectAnswers && question.maxCorrectAnswers > 1;
  const canRemoveOption = isMultipleChoice && (question.options || []).length > 2;

  const handleQuestionTextChange = (text) => {
    onUpdateQuestion(question.id, { question: text });
  };

  const handleOptionTextChange = (optionId, text) => {
    if (isTrueFalse) {
      const newStatements = (question.statements || []).map(s =>
        s.id === optionId ? { ...s, text } : s
      );
      onUpdateQuestion(question.id, { statements: newStatements });
    } else {
      onUpdateOption(question.id, optionId, { text });
    }
  };

  const handleToggleCorrect = (optionId) => {
    if (isTrueFalse) {
      // For true/false, toggle statement answer
      const statementIndex = (question.statements || []).findIndex(s => s.id === optionId);
      if (statementIndex === -1) return;

      const newStatements = (question.statements || []).map((s, i) => {
        if (i === statementIndex) {
          return { ...s, answer: s.answer === true ? false : true };
        }
        return s;
      });
      onUpdateQuestion(question.id, { statements: newStatements });
      return;
    }

    // For multiple choice
    const option = (question.options || []).find(o => o.id === optionId);
    if (!option) return;

    const newOptions = (question.options || []).map(o => ({
      ...o,
      correct: o.id === optionId ? !o.correct : o.correct
    }));
    onUpdateQuestion(question.id, { options: newOptions });
  };

  const handleAddOption = () => {
    if (isTrueFalse) {
      // For true/false, add a new statement
      const newStatement = {
        id: generateId(),
        text: '',
        answer: null,
        userAnswer: null
      };
      onUpdateQuestion(question.id, { statements: [...(question.statements || []), newStatement] });
      return;
    }

    // For multiple choice
    const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const options = question.options || [];
    const nextLabel = labels[options.length] || `Option ${options.length + 1}`;

    const newOption = {
      id: generateId(),
      label: nextLabel,
      text: '',
      correct: false
    };

    onUpdateQuestion(question.id, { options: [...options, newOption] });
  };

  const handleRemoveOption = (optionId) => {
    if (isTrueFalse) {
      // For true/false, remove a statement
      const newStatements = (question.statements || []).filter(s => s.id !== optionId);
      onUpdateQuestion(question.id, { statements: newStatements });
      return;
    }

    // For multiple choice
    const options = question.options || [];
    if (options.length <= 2) return;

    const newOptions = options
      .filter(o => o.id !== optionId)
      .map((o, i) => {
        const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        return { ...o, label: labels[i] || String(i + 1) };
      });

    onUpdateQuestion(question.id, { options: newOptions });
  };

  const handleDeleteQuestion = () => {
    if (confirm('Xóa câu hỏi này?')) {
      onDeleteQuestion(question.id);
    }
  };

  const hasCorrectAnswer = isTrueFalse
    ? (question.statements || []).every(s => s.answer !== null && s.answer !== undefined)
    : (question.options || []).some(o => o.correct);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`question-item ${!hasCorrectAnswer && !isEditMode ? 'missing-answer' : ''}`}
    >
      {/* Header */}
      <div className="question-header">
        <div className="question-meta">
          <span className="question-number">Câu {questionIndex + 1}</span>
          <span className={`question-type ${isMultipleChoice ? 'type-multiple' : 'type-truefalse'}`}>
            {isMultipleChoice ? (isMultiAnswer ? `Chọn ${question.maxCorrectAnswers}` : 'Trắc nghiệm') : 'Đúng/Sai'}
          </span>
        </div>
        {isEditMode && (
          <button
            className="question-delete"
            onClick={handleDeleteQuestion}
            type="button"
            title="Xóa câu hỏi"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
        {!hasCorrectAnswer && !isEditMode && (
          <span className="question-warning">⚠️ Chưa có đáp án</span>
        )}
      </div>

      {/* Question Content */}
      <div className="question-content">
        {isEditMode ? (
          <textarea
            className="question-textarea"
            value={question.question}
            onChange={(e) => handleQuestionTextChange(e.target.value)}
            rows={2}
          />
        ) : (
          <p className="question-text">{question.question}</p>
        )}
      </div>

      {/* Answers */}
      <div className="question-answers">
        {isTrueFalse ? (
          /* True/False Answers */
          <>
            <div className="answers-header">
              <span className="answers-label">Các mệnh đề</span>
              {isEditMode && (
                <button
                  className="add-option-btn"
                  onClick={handleAddOption}
                  type="button"
                >
                  + Thêm
                </button>
              )}
            </div>
            <div className="answers-list">
              {(question.statements || []).map((statement, i) => (
                <div
                  key={statement.id}
                  className={`option-row ${statement.answer === true ? 'is-correct' : ''} ${isEditMode ? 'is-editing' : ''}`}
                >
                  {isEditMode ? (
                    <>
                      <input
                        type="checkbox"
                        className="option-checkbox"
                        checked={statement.answer === true}
                        onChange={() => handleToggleCorrect(statement.id)}
                        title="Đúng"
                      />
                      <span className="option-label">{i + 1}</span>
                      <input
                        type="text"
                        className="option-input"
                        value={statement.text}
                        onChange={(e) => {
                          const newStatements = (question.statements || []).map((s, idx) =>
                            idx === i ? { ...s, text: e.target.value } : s
                          );
                          onUpdateQuestion(question.id, { statements: newStatements });
                        }}
                        placeholder={`Mệnh đề ${i + 1}`}
                      />
                      <span className="truefalse-badge">
                        {statement.answer === true ? 'Đúng' : statement.answer === false ? 'Sai' : '?'}
                      </span>
                      <button
                        className="option-remove"
                        onClick={() => handleRemoveOption(statement.id)}
                        type="button"
                        title="Xóa"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={`option-indicator ${statement.answer === true ? 'correct' : ''}`}>
                        {statement.answer === true ? '✓' : statement.answer === false ? '✗' : '?'}
                      </span>
                      <span className="option-text break-words overflow-wrap-anywhere">
                        {statement.text || <em>(trống)</em>}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Multiple Choice Answers */
          <>
            <div className="answers-header">
              <span className="answers-label">Đáp án</span>
              {isEditMode && (question.options || []).length < 8 && (
                <button
                  className="add-option-btn"
                  onClick={handleAddOption}
                  type="button"
                >
                  + Thêm
                </button>
              )}
            </div>
            <div className="answers-list">
              {question.options.map((option, i) => (
                <OptionEditor
                  key={option.id}
                  option={option}
                  index={i}
                  isEditMode={isEditMode}
                  onUpdateText={handleOptionTextChange}
                  onToggleCorrect={handleToggleCorrect}
                  onRemove={handleRemoveOption}
                  canRemove={canRemoveOption}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// QuizEditor (Main Component) - Flat SaaS Style
// ============================================================================
export function QuizEditor({
  questions,
  onUpdate,
  onStartQuiz,
  onCancel,
  onExport,
  settings = DEFAULT_SETTINGS,
  onSettingsChange
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedQuestions, setEditedQuestions] = useState(questions);
  const [hasChanges, setHasChanges] = useState(false);

  const [localSettings, setLocalSettings] = useState(normalizeSettings(settings));

  // Sync editedQuestions when questions prop changes
  if (questions !== editedQuestions && !hasChanges) {
    setEditedQuestions(questions);
  }

  const filteredQuestions = editedQuestions.filter(q => {
    const questionText = (q.question || '').toLowerCase();
    const optionsText = (q.options || []).map(o => (o.text || '').toLowerCase()).join(' ');
    const searchLower = (searchTerm || '').toLowerCase();

    const matchesSearch = questionText.includes(searchLower) || optionsText.includes(searchLower);
    const matchesType = filterType === 'all' ||
      (filterType === 'multiple' && q.type === 'multiple') ||
      (filterType === 'truefalse' && q.type === 'truefalse-group');

    return matchesSearch && matchesType;
  });

  // Statistics
  const stats = {
    total: editedQuestions.length,
    withAnswers: editedQuestions.filter(q => {
      if (q.type === 'multiple') return (q.options || []).some(o => o.correct);
      if (q.type === 'truefalse-group') return (q.statements || []).every(s => s.answer !== null && s.answer !== undefined);
      return false;
    }).length
  };

  const canStartQuiz = stats.withAnswers === stats.total;

  // Update handlers
  const handleUpdateQuestion = useCallback((questionId, updates) => {
    setEditedQuestions(prev => {
      const updated = prev.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      );
      setHasChanges(true);
      return updated;
    });
  }, []);

  const handleUpdateOption = useCallback((questionId, optionId, updates) => {
    setEditedQuestions(prev => {
      const updated = prev.map(q => {
        if (q.id !== questionId) return q;
        return {
          ...q,
          options: q.options.map(o =>
            o.id === optionId ? { ...o, ...updates } : o
          )
        };
      });
      setHasChanges(true);
      return updated;
    });
  }, []);

  const handleDeleteQuestion = useCallback((questionId) => {
    setEditedQuestions(prev => {
      const updated = prev.filter(q => q.id !== questionId);
      setHasChanges(true);
      return updated;
    });
  }, []);

  const handleEnterEditMode = () => {
    setEditedQuestions(questions);
    setIsEditMode(true);
    setHasChanges(false);
  };

  const handleSaveAll = () => {
    onUpdate(editedQuestions);
    setIsEditMode(false);
    setHasChanges(false);
  };

  const handleCancelChanges = () => {
    setEditedQuestions(questions);
    setIsEditMode(false);
    setHasChanges(false);
  };

  const handleSettingsChange = useCallback((newSettings) => {
    setLocalSettings(newSettings);
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  }, [onSettingsChange]);

  return (
    <div className="quiz-editor editor-header-heights" style={{ paddingInline: 'clamp(12px, 2vw, 24px)' }}>
      {/* Top Toolbar */}
      <div className="editor-topbar">
        <button className="btn-back" onClick={onCancel}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline">Quay lại</span>
        </button>

        <div className="editor-stats">
          <span className="stat-item">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">câu</span>
          </span>
          <span className="stat-divider" />
          <span className="stat-item">
            <span className={`stat-value ${stats.withAnswers === stats.total ? 'text-success' : 'text-warning'}`}>
              {stats.withAnswers}
            </span>
            <span className="stat-label">có đáp án</span>
          </span>
        </div>

        <div className="editor-actions">
          {!isEditMode ? (
            <>
              <button
                className="btn-action btn-secondary"
                onClick={handleEnterEditMode}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="btn-action-text">Chỉnh sửa</span>
              </button>
              <button
                className="btn-action btn-secondary"
                onClick={() => onExport(false)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="btn-action-text">Tải quiz</span>
              </button>
              <button
                className="btn-action btn-export"
                onClick={() => onExport(true)}
                disabled={!canStartQuiz}
                title="Tải quiz kèm đáp án"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="btn-action-text">Tải đáp án</span>
              </button>
            </>
          ) : (
            <>
              <button
                className="btn-action btn-secondary"
                onClick={() => onExport(false)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="btn-action-text">Tải quiz</span>
              </button>
              <button
                className="btn-action btn-export"
                onClick={() => onExport(true)}
                disabled={!canStartQuiz}
                title="Tải quiz kèm đáp án"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="btn-action-text">Tải đáp án</span>
              </button>
              <button
                className="btn-action btn-ghost"
                onClick={handleCancelChanges}
              >
                <span className="btn-action-text">Hủy</span>
              </button>
              <button
                className="btn-action btn-primary"
                onClick={handleSaveAll}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="btn-action-text">Lưu</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search & Filter & Settings */}
      <div className="editor-searchbar">
        <div className="toolbar-left">
          <div className="search-input-wrapper">
            <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm câu hỏi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="toolbar-right">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              Tất cả
            </button>
            <button
              className={`filter-tab ${filterType === 'multiple' ? 'active' : ''}`}
              onClick={() => setFilterType('multiple')}
            >
              Trắc nghiệm
            </button>
            <button
              className={`filter-tab ${filterType === 'truefalse' ? 'active' : ''}`}
              onClick={() => setFilterType('truefalse')}
            >
              Đúng/Sai
            </button>
          </div>
          <IconSettingsButton
            settings={localSettings}
            onChange={handleSettingsChange}
          />
        </div>
      </div>

      {/* Questions List */}
      <div className="editor-content">
        <AnimatePresence mode="popLayout">
          {filteredQuestions.length === 0 ? (
            <div className="empty-state">
              <svg className="w-12 h-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{editedQuestions.length === 0 ? 'Không có câu hỏi nào' : 'Không tìm thấy câu hỏi phù hợp'}</p>
            </div>
          ) : (
            filteredQuestions.map((question) => (
              <QuestionItem
                key={question.id}
                question={question}
                questionIndex={editedQuestions.findIndex(q => q.id === question.id)}
                isEditMode={isEditMode}
                onUpdateQuestion={handleUpdateQuestion}
                onUpdateOption={handleUpdateOption}
                onDeleteQuestion={handleDeleteQuestion}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Action Area */}
      <div className="editor-footer">
        <div className="footer-actions">
          <div className="btn-start-wrapper">
            {!canStartQuiz && (
              <span className="warning-badge">
                ⚠️ Cần điền đáp án
              </span>
            )}
            <motion.button
              className={`btn-start ${!canStartQuiz ? 'disabled' : ''}`}
              onClick={() => {
                if (hasChanges || isEditMode) {
                  onUpdate(editedQuestions);
                }
                onStartQuiz(localSettings);
              }}
              disabled={!canStartQuiz}
              whileHover={canStartQuiz ? { scale: 1.02 } : {}}
              whileTap={canStartQuiz ? { scale: 0.98 } : {}}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Bắt đầu làm bài
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuizEditor;
