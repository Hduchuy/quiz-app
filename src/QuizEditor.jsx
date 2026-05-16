import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { generateId } from './utils/quizModels';
import { DEFAULT_SETTINGS, normalizeSettings } from './utils/quizSettings';
import { SettingsButton, Modal as UnsavedModal } from './components/ui';
import { DragDropMatchEditor, DragDropFillEditor } from './components/quiz/DragDropEditors';
import './App.css';

// ============================================================================
// Mobile Settings Sheet (Bottom Sheet) - Mounts to body via Portal
// ============================================================================
function MobileSettingsSheet({ isOpen, onClose, settings, onChange }) {
  // Render via Portal to avoid parent layout constraints
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="mobile-sheet-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="mobile-settings-sheet"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            role="dialog"
            aria-label="Tùy chọn làm bài"
            onClick={(event) => event.stopPropagation()}
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
            <div className="mobile-sheet-body">
              <div className="mobile-settings-content">
                <SettingsButton settings={settings} onChange={onChange} />
              </div>
            </div>
          </motion.div>
        </motion.div>
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
            className="icon-settings-dropdown quiz-settings-dropdown"
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

function MobileAddQuestionSheet({ isOpen, onClose, questionTypes, onSelect }) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="mobile-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          <motion.div
            className="mobile-bottom-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            role="dialog"
            aria-label="Thêm câu hỏi"
          >
            <div className="mobile-sheet-handle" />
            <div className="mobile-sheet-content">
              <div className="mobile-sheet-header">
                <h3>Thêm câu hỏi mới</h3>
                <button className="close-btn" onClick={onClose}>✕</button>
              </div>
              <div className="question-types-grid">
                {questionTypes.map((type) => (
                  <button
                    key={type.id}
                    className="mobile-type-card"
                    onClick={() => onSelect(type.id)}
                  >
                    <span className="type-icon">{type.icon}</span>
                    <div className="type-info">
                      <div className="type-title">{type.title}</div>
                      <div className="type-desc">{type.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="mobile-sheet-safe-area" />
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ============================================================================
// AddQuestionMenu - Menu for adding new questions
// ============================================================================
function AddQuestionMenu({ onAddQuestion, isOpen, onOpenChange, isSidePanel = false }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const menuRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSelect = (type) => {
    onAddQuestion(type);
    if (!isSidePanel) onOpenChange(false);
  };

  const questionTypes = [
    { id: 'single', icon: '🎯', title: 'Chọn 1', description: 'Trắc nghiệm 1 đáp án' },
    { id: 'multiple', icon: '☑️', title: 'Chọn nhiều', description: 'Trắc nghiệm nhiều đáp án' },
    { id: 'true_false', icon: '⚖️', title: 'Đúng / Sai', description: 'Các mệnh đề đúng sai' },
    { id: 'match', icon: '🧩', title: 'Ghép nối', description: 'Ghép vế trái và vế phải' },
    { id: 'cloze', icon: '✏️', title: 'Điền khuyết', description: 'Điền vào chỗ trống {{...}}' }
  ];

  if (isSidePanel && !isMobile) {
    return (
      <div className="desktop-tool-panel">
        <h3 className="panel-title">Loại câu hỏi</h3>
        <div className="question-types-list">
          {questionTypes.map((type) => (
            <button
              key={type.id}
              className="compact-type-card"
              onClick={() => handleSelect(type.id)}
            >
              <span className="type-icon">{type.icon}</span>
              <div className="type-info">
                <div className="type-title">{type.title}</div>
                <div className="type-desc">{type.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {isMobile && (
        <button
          className="mobile-fab-add"
          onClick={() => onOpenChange(true)}
          aria-label="Thêm câu hỏi"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      <MobileAddQuestionSheet
        isOpen={isOpen && isMobile}
        onClose={() => onOpenChange(false)}
        questionTypes={questionTypes}
        onSelect={handleSelect}
      />
    </>
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
  if (!question) return null;
  
  const isSingle = question?.type === 'single';
  const isMultiple = question?.type === 'multiple';
  const isTrueFalse = question?.type === 'true_false';
  const isMatch = question?.type === 'match';
  const isCloze = question?.type === 'cloze';
  
  const canRemoveOption = (isSingle || isMultiple) && (question.options || []).length > 2;

  const handleQuestionTextChange = (text) => {
    onUpdateQuestion(question.id, { question: text });
  };

  const handleOptionTextChange = (optionId, text) => {
    if (isTrueFalse) {
      const newStatements = (question.statements || []).map(s =>
        s.id === optionId ? { ...s, text } : s
      );
      onUpdateQuestion(question.id, { statements: newStatements });
    } else if (isSingle || isMultiple) {
      onUpdateOption(question.id, optionId, { text });
    }
  };

  const handleToggleCorrect = (optionId) => {
    if (isTrueFalse) {
      const newStatements = (question.statements || []).map(s =>
        s.id === optionId ? { ...s, answer: s.answer === true ? false : (s.answer === false ? null : true) } : s
      );
      onUpdateQuestion(question.id, { statements: newStatements });
      return;
    }

    if (isSingle) {
      const newOptions = (question.options || []).map(o => ({
        ...o,
        correct: o.id === optionId
      }));
      onUpdateQuestion(question.id, { options: newOptions });
      return;
    }

    if (isMultiple) {
      const newOptions = (question.options || []).map(o => ({
        ...o,
        correct: o.id === optionId ? !o.correct : o.correct
      }));
      onUpdateQuestion(question.id, { options: newOptions });
    }
  };

  const handleAddOption = () => {
    if (isTrueFalse) {
      const newStatement = {
        id: generateId(),
        text: '',
        answer: null
      };
      onUpdateQuestion(question.id, { statements: [...(question.statements || []), newStatement] });
      return;
    }

    if (isSingle || isMultiple) {
      const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const options = question.options || [];
      const nextLabel = labels[options.length] || String(options.length + 1);

      const newOption = {
        id: generateId(),
        label: nextLabel,
        text: '',
        correct: false
      };
      onUpdateQuestion(question.id, { options: [...options, newOption] });
    }
  };

  const handleRemoveOption = (optionId) => {
    if (isTrueFalse) {
      const newStatements = (question.statements || []).filter(s => s.id !== optionId);
      onUpdateQuestion(question.id, { statements: newStatements });
      return;
    }

    if (isMatch) {
      const newTargets = (question.targets || []).filter(t => t.id !== optionId);
      onUpdateQuestion(question.id, { targets: newTargets });
      return;
    }

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

  const validateQuestion = (q) => {
    if (!q) return { valid: false, error: 'Câu hỏi trống' };
    if (!q.question && q.type !== 'cloze') return { valid: false, error: 'Chưa có nội dung câu hỏi' };

    if (q.type === 'single' || q.type === 'multiple') {
      const correctCount = (q.options || []).filter(o => o.correct).length;
      if (q.type === 'single') {
        return { valid: correctCount === 1, error: correctCount === 0 ? 'Chưa chọn đáp án đúng' : (correctCount > 1 ? 'Chỉ được chọn 1 đáp án đúng' : null) };
      } else {
        return { valid: correctCount >= 1, error: correctCount === 0 ? 'Chưa chọn đáp án đúng' : null };
      }
    }
    
    if (q.type === 'true_false') {
      const statements = q.statements || [];
      const allAnswered = statements.length > 0 && statements.every(s => s.answer !== null && s.answer !== undefined);
      return { valid: allAnswered, error: allAnswered ? null : 'Chưa chọn Đúng/Sai cho tất cả mệnh đề' };
    }

    if (q.type === 'match') {
      const targets = q.targets || [];
      const bank = q.answerBank || [];
      const matches = q.correctMatches || {};
      const hasTargets = targets.length > 0;
      const hasBank = bank.length > 0;
      const hasMapping = Object.keys(matches).length > 0 && Object.values(matches).some(arr => arr && arr.length > 0);
      
      if (!hasTargets) return { valid: false, error: 'Chưa có ô đích' };
      if (!hasBank) return { valid: false, error: 'Chưa có kho đáp án' };
      if (!hasMapping) return { valid: false, error: 'Chưa thiết lập ghép đúng' };
      
      return { valid: true, error: null };
    }

    if (q.type === 'cloze') {
      const blanks = (q.segments || []).filter(s => s.type === 'blank');
      const hasBlanks = blanks.length > 0;
      const allFilled = hasBlanks && blanks.every(b => b.answers && b.answers.length > 0);
      
      if (!hasBlanks) return { valid: false, error: 'Chưa có ô trống' };
      if (!allFilled) return { valid: false, error: 'Chưa điền đáp án cho ô trống' };
      
      return { valid: true, error: null };
    }

    return { valid: false, error: 'Loại câu hỏi không hợp lệ' };
  };

  const validation = validateQuestion(question);
  const hasCorrectAnswer = validation.valid;

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
          <span className={`question-type type-${question.type}`}>
            {isSingle ? 'Chọn 1' : isMultiple ? 'Chọn nhiều' : isTrueFalse ? 'Đúng/Sai' : isMatch ? 'Ghép nối' : 'Điền khuyết'}
          </span>
        </div>
        {isEditMode && (
          <button
            className="question-delete"
            onClick={handleDeleteQuestion}
            type="button"
            title="Xóa"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
        {!hasCorrectAnswer && !isEditMode && (
          <span className="question-warning">⚠️ {validation.error || 'Lỗi dữ liệu'}</span>
        )}
      </div>

      {/* Question Content */}
      <div className="question-content">
        {isEditMode ? (
          !isCloze && (
            <textarea
              className="question-textarea"
              value={question.question}
              onChange={(e) => handleQuestionTextChange(e.target.value)}
              rows={2}
              placeholder="Nhập câu hỏi..."
            />
          )
        ) : (
          !isCloze && <p className="question-text">{question.question}</p>
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
                      <div className="truefalse-toggles" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className={`btn-action ${statement.answer === true ? 'btn-primary' : 'btn-ghost'}`}
                          style={{ padding: '4px 8px', minHeight: 'auto', fontSize: '0.8rem' }}
                          onClick={() => {
                            const newStatements = (question.statements || []).map(s =>
                              s.id === statement.id ? { ...s, answer: s.answer === true ? null : true } : s
                            );
                            onUpdateQuestion(question.id, { statements: newStatements });
                          }}
                        >
                          Đúng
                        </button>
                        <button
                          type="button"
                          className={`btn-action ${statement.answer === false ? 'btn-primary' : 'btn-ghost'}`}
                          style={{ 
                            padding: '4px 8px', 
                            minHeight: 'auto', 
                            fontSize: '0.8rem', 
                            background: statement.answer === false ? 'var(--color-error)' : undefined, 
                            color: statement.answer === false ? '#fff' : undefined,
                            borderColor: statement.answer === false ? 'var(--color-error)' : undefined
                          }}
                          onClick={() => {
                            const newStatements = (question.statements || []).map(s =>
                              s.id === statement.id ? { ...s, answer: s.answer === false ? null : false } : s
                            );
                            onUpdateQuestion(question.id, { statements: newStatements });
                          }}
                        >
                          Sai
                        </button>
                      </div>
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
              {(question.statements || []).length === 0 && (
                <div className="text-center p-4 border border-dashed border-[var(--color-border)] rounded-lg text-[var(--color-text-muted)] text-sm mb-2">
                  Chưa có mệnh đề nào. Nhấn "+ Thêm" để tạo.
                </div>
              )}
            </div>
          </>
        ) : isSingle || isMultiple ? (
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
              {(question.options || []).map((option, i) => (
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
        ) : isMatch ? (
          <DragDropMatchEditor
            question={question}
            isEditMode={isEditMode}
            onUpdateQuestion={onUpdateQuestion}
          />
        ) : isCloze ? (
          <DragDropFillEditor
            question={question}
            isEditMode={isEditMode}
            onUpdateQuestion={onUpdateQuestion}
          />
        ) : null}
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
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [editedQuestions, setEditedQuestions] = useState(questions || []);
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isEditMode, setIsEditMode] = useState(location.state?.createNew || false);

  const [localSettings, setLocalSettings] = useState(normalizeSettings(settings));

  // Sync editedQuestions when questions prop changes using useEffect to avoid render loops
  useEffect(() => {
    if (!hasChanges) {
      setEditedQuestions(questions || []);
    }
  }, [questions, hasChanges]);

  const filteredQuestions = (editedQuestions || []).filter(q => {
    if (!q) return false;
    const questionText = (q?.question || '').toLowerCase();
    const searchLower = (searchTerm || '').toLowerCase();
    
    const optionsText = (q?.options || []).map(o => (o?.text || '').toLowerCase()).join(' ');
    const targetsText = (q?.targets || []).map(t => (t?.text || '').toLowerCase()).join(' ');
    const bankText = (q?.answerBank || []).map(a => (a?.text || '').toLowerCase()).join(' ');

    const matchesSearch = questionText.includes(searchLower) || 
                         optionsText.includes(searchLower) || 
                         targetsText.includes(searchLower) || 
                         bankText.includes(searchLower);
                         
    const matchesType = filterType === 'all' || 
      (filterType === 'choice' && (q?.type === 'single' || q?.type === 'multiple')) ||
      (filterType === 'true_false' && q?.type === 'true_false') ||
      (filterType === 'drag' && (q?.type === 'match' || q?.type === 'cloze'));

    return matchesSearch && matchesType;
  });

  // Statistics
  const stats = {
    total: (editedQuestions || []).length,
    withAnswers: (editedQuestions || []).filter(q => {
      if (!q) return false;
      
      if (q.type === 'single') {
        return (q.options || []).some(o => o?.correct);
      }
      if (q.type === 'multiple') {
        return (q.options || []).filter(o => o?.correct).length >= 1;
      }
      if (q.type === 'true_false') {
        return (q.statements || []).length > 0 && (q.statements || []).every(s => s?.answer !== null && s?.answer !== undefined);
      }
      if (q.type === 'match') {
        const matches = q.correctMatches || {};
        return (q.targets || []).length > 0 && 
               (q.answerBank || []).length > 0 && 
               Object.keys(matches).length > 0 && 
               Object.values(matches).some(arr => arr && arr.length > 0);
      }
      if (q.type === 'cloze') {
        const blanks = (q.segments || []).filter(s => s.type === 'blank');
        return blanks.length > 0 && blanks.every(b => b.answers && b.answers.length > 0);
      }
      
      return false;
    }).length
  };

  const canStartQuiz = editedQuestions.length > 0 && stats.withAnswers === stats.total;
  const isQuestionsEmpty = (editedQuestions || []).length === 0;

  const settingsChanged = (() => {
    try {
      return JSON.stringify(localSettings) !== JSON.stringify(normalizeSettings(settings));
    } catch (err) {
      console.error("Error comparing settings:", err);
      return false;
    }
  })();
  const hasUnsavedChanges = hasChanges || settingsChanged;

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

  const handleAddQuestion = useCallback((type) => {
    const baseType = type;

    let newQuestion = {
      id: generateId(),
      type: baseType,
      question: '',
      questionNumber: null
    };

    if (baseType === 'single' || baseType === 'multiple') {
      newQuestion.options = Array.from({ length: 4 }).map((_, i) => ({
        id: generateId(),
        label: ['A', 'B', 'C', 'D'][i],
        text: '',
        correct: false
      }));
    } else if (baseType === 'true_false') {
      newQuestion.question = 'Xác định các mệnh đề đúng hoặc sai';
      newQuestion.statements = Array.from({ length: 4 }).map((_, i) => ({
        id: generateId(),
        text: '',
        answer: null
      }));
    } else if (baseType === 'match') {
      newQuestion.question = 'Ghép nội dung phù hợp';
      newQuestion.targets = [
        { id: generateId(), text: '' },
        { id: generateId(), text: '' }
      ];
      newQuestion.answerBank = [];
      newQuestion.correctMatches = {};
    } else if (baseType === 'cloze') {
      newQuestion.question = 'Triết học là {{thế giới quan}} của con người về thế giới.';
      newQuestion.segments = [
        { type: 'text', content: 'Triết học là ' },
        { type: 'blank', id: 'blank_0', answers: ['thế giới quan'] },
        { type: 'text', content: ' của con người về thế giới.' }
      ];
      newQuestion.fillMode = 'input';
    }

    console.log("NEW QUESTION TYPE:", newQuestion.type);

    setEditedQuestions(prev => [...prev, newQuestion]);
    setIsEditMode(true);
    setHasChanges(true);

    setTimeout(() => {
      const el = document.getElementById(`question-${newQuestion.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const textarea = el.querySelector('textarea');
        if (textarea) {
          setTimeout(() => textarea.focus(), 100);
        }
      }
    }, 50);
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

  const handleStartQuizClick = () => {
    if (!canStartQuiz) return;
    if (hasUnsavedChanges) {
      setShowUnsavedConfirm(true);
    } else {
      onStartQuiz(localSettings, editedQuestions);
    }
  };

  const handleSaveAndStart = () => {
    onUpdate(editedQuestions);
    setHasChanges(false);
    setShowUnsavedConfirm(false);
    onStartQuiz(localSettings, editedQuestions);
  };

  const handleStartNoSave = () => {
    setShowUnsavedConfirm(false);
    onStartQuiz(localSettings, questions);
  };

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
      <div className="editor-search-container">
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
              className={`filter-tab ${filterType === 'choice' ? 'active' : ''}`}
              onClick={() => setFilterType('choice')}
            >
              Trắc nghiệm
            </button>
            <button
              className={`filter-tab ${filterType === 'true_false' ? 'active' : ''}`}
              onClick={() => setFilterType('true_false')}
            >
              Đúng/Sai
            </button>
            <button
              className={`filter-tab ${filterType === 'drag' ? 'active' : ''}`}
              onClick={() => setFilterType('drag')}
            >
              Kéo thả
            </button>
          </div>
          <IconSettingsButton
            settings={localSettings}
            onChange={handleSettingsChange}
          />
        </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="editor-main-layout">
        {/* Left Column: Desktop Tool Panel */}
        <aside className="editor-side-panel">
          <AddQuestionMenu 
            isOpen={isAddMenuOpen}
            onOpenChange={setIsAddMenuOpen}
            onAddQuestion={handleAddQuestion} 
            isSidePanel={true}
          />
          
          <div className="panel-footer-tip">
            <p>💡 Mẹo: Bạn có thể kéo thả đề từ file Word/TXT vào đây để tự động parse.</p>
          </div>
        </aside>

        {/* Right Column: Question Content Workspace */}
        <div className="editor-content-area">
          <AnimatePresence mode="popLayout">
            {filteredQuestions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div className="empty-state-text">
                  <h3>{editedQuestions.length === 0 ? 'Chưa có câu hỏi nào' : 'Không tìm thấy kết quả'}</h3>
                  <p>
                    {editedQuestions.length === 0 
                      ? 'Bắt đầu bằng cách thêm trắc nghiệm, đúng/sai, kéo thả từ menu bên trái.'
                      : 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="questions-scroll-container">
                {filteredQuestions.map((question) => (
                  <div id={`question-${question.id}`} key={question.id}>
                    <QuestionItem
                      question={question}
                      questionIndex={editedQuestions.findIndex(q => q.id === question.id)}
                      isEditMode={isEditMode}
                      onUpdateQuestion={handleUpdateQuestion}
                      onUpdateOption={handleUpdateOption}
                      onDeleteQuestion={handleDeleteQuestion}
                    />
                  </div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Add Trigger (Hidden on Desktop via CSS) */}
      <AddQuestionMenu 
        isOpen={isAddMenuOpen}
        onOpenChange={setIsAddMenuOpen}
        onAddQuestion={handleAddQuestion} 
      />

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
              onClick={handleStartQuizClick}
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
            {isQuestionsEmpty && (
              <p className="start-quiz-reminder" style={{ 
                fontSize: '0.75rem', 
                color: 'var(--color-text-muted)', 
                marginTop: '8px',
                textAlign: 'center',
                opacity: 0.8
              }}>
                Hãy thêm ít nhất 1 câu hỏi để bắt đầu làm bài
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Unsaved Changes Confirmation Modal */}
      <UnsavedModal 
        isOpen={showUnsavedConfirm} 
        onClose={() => setShowUnsavedConfirm(false)}
        title="Bạn có thay đổi chưa lưu"
      >
        <div className="space-y-4">
          <p className="text-[var(--color-text-secondary)] leading-relaxed">
            Nếu bắt đầu làm bài ngay bây giờ, các chỉnh sửa gần đây có thể bị mất.
          </p>
          <div className="flex flex-col gap-3 mt-6">
            <button
              className="btn-action btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              onClick={handleSaveAndStart}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Lưu & Bắt đầu
            </button>
            <button
              className="btn-action btn-secondary w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
              onClick={handleStartNoSave}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              Bắt đầu không lưu
            </button>
            <button
              className="btn-action btn-ghost w-full py-3 rounded-xl font-medium text-[var(--color-text-muted)]"
              onClick={() => setShowUnsavedConfirm(false)}
            >
              Hủy
            </button>
          </div>
        </div>
      </UnsavedModal>
    </div>
  );
}

export default QuizEditor;
