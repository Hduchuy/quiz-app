import { useState, useCallback } from 'react';
import { generateId } from './utils/quizModels';
import './QuizEditor.css';

/**
 * QuizEditor - Full-page editor with global edit mode
 *
 * Features:
 * - Global edit mode (no per-question editing)
 * - Multiple correct answers support (checkboxes)
 * - Continuous editing without save-per-question
 * - Single/Multi-choice detection
 */

// ============================================================================
// Answer Option Editor (for both modes)
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
    <div className={`option-editor-row ${option.correct ? 'correct-option' : ''}`}>
      {isEditMode ? (
        <>
          <input
            type="checkbox"
            className="option-correct-checkbox"
            checked={option.correct}
            onChange={() => onToggleCorrect(option.id)}
            title="Đánh dấu đáp án đúng"
          />
          <span className="option-label">{displayLabel}.</span>
          <input
            type="text"
            className="option-text-input"
            value={option.text}
            onChange={(e) => onUpdateText(option.id, e.target.value)}
            placeholder={`Đáp án ${displayLabel}`}
          />
          {canRemove && (
            <button
              className="btn-remove-option"
              onClick={() => onRemove(option.id)}
              type="button"
              title="Xóa đáp án"
            >
              ✕
            </button>
          )}
        </>
      ) : (
        <>
          <span className="option-correct-indicator">
            {option.correct ? '✓' : ''}
          </span>
          <span className="option-label">{displayLabel}.</span>
          <span className="option-text">{option.text || <em>(trống)</em>}</span>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Question Card Editor (unified, no sub-edit mode)
// ============================================================================
function QuestionCardEditor({
  question,
  questionIndex,
  isEditMode,
  onUpdateQuestion,
  onUpdateOption,
  onDeleteQuestion
}) {
  const isMultipleChoice = question.type === 'multiple';
  const isMultiAnswer = isMultipleChoice && question.maxCorrectAnswers && question.maxCorrectAnswers > 1;
  
  // DEBUG: Log props to console
  console.log('[QuestionCardEditor]', {
    questionText: question.question?.substring(0, 30),
    type: question.type,
    maxCorrectAnswers: question.maxCorrectAnswers,
    isMultiAnswer
  });
  
  const canRemoveOption = (question.options || []).length > 2;

  const handleQuestionTextChange = (text) => {
    onUpdateQuestion(question.id, { question: text });
  };

  const handleOptionTextChange = (optionId, text) => {
    onUpdateOption(question.id, optionId, { text });
  };

  const handleToggleCorrect = (optionId) => {
    const option = (question.options || []).find(o => o.id === optionId);
    if (!option) return;

    // In EDITOR: always use checkbox behavior (multi-select allowed)
    // This allows marking any number of correct answers
    const newOptions = (question.options || []).map(o => ({
      ...o,
      correct: o.id === optionId ? !o.correct : o.correct
    }));
    onUpdateQuestion(question.id, { options: newOptions });
  };

  const handleAddOption = () => {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const options = question.options || [];
    const nextLabel = labels[options.length] || `Option ${options.length + 1}`;

    const newOption = {
      id: generateId(),
      label: nextLabel,
      text: '',
      correct: false
    };

    onUpdateQuestion(question.id, {
      options: [...options, newOption]
    });
  };

  const handleRemoveOption = (optionId) => {
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

  return (
    <div className={`editor-card ${isEditMode ? 'editing' : ''} ${isMultiAnswer ? 'multi-answer-card' : ''}`}>
      <div className="editor-header">
        <span className="editor-number">Câu {questionIndex + 1}</span>
        <span className="editor-type" data-type={isMultipleChoice ? 'multiple' : 'truefalse'}>
          {isMultipleChoice ? 'Trắc nghiệm' : 'Đúng/Sai'}
        </span>
        {/* DEBUG VISIBLE INDICATOR */}
        <span style={{ 
          background: question.maxCorrectAnswers ? '#e91e63' : '#999',
          color: 'white', 
          padding: '2px 8px', 
          borderRadius: '4px',
          fontSize: '11px'
        }}>
          maxCorrectAnswers: {question.maxCorrectAnswers ?? 'NULL'}
        </span>
        {isMultiAnswer && (
          <span className="editor-type multi-answer" style={{ background: '#e91e63', color: 'white' }}>
            ★ CHỌN {question.maxCorrectAnswers} ĐÁP ÁN
          </span>
        )}
        {!isMultiAnswer && isMultipleChoice && (
          <span className="editor-type" style={{ background: '#666', color: 'white' }}>
            CHỌN 1 ĐÁP ÁN
          </span>
        )}
        {isEditMode && (
          <button
            className="btn-delete"
            onClick={handleDeleteQuestion}
            type="button"
            title="Xóa câu hỏi"
          >
            🗑️ Xóa
          </button>
        )}
      </div>

      <div className="editor-content">
        <label className="editor-label">Câu hỏi:</label>
        {isEditMode ? (
          <textarea
            className="editor-textarea"
            value={question.question}
            onChange={(e) => handleQuestionTextChange(e.target.value)}
            rows={2}
          />
        ) : (
          <p className="editor-question-text">{question.question}</p>
        )}

        <label className="editor-label">
          Đáp án:
          {isEditMode && (question.options || []).length < 8 && (
            <button
              className="btn-add-option"
              onClick={handleAddOption}
              type="button"
            >
              + Thêm đáp án
            </button>
          )}
        </label>

        <div className="options-list">
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

        {!question.options.some(o => o.correct) && (
          <p className="warning-text">⚠️ Chưa chọn đáp án đúng</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// True/False Question Editor (for truefalse-group type)
// ============================================================================
function TrueFalseQuestionEditor({
  question,
  questionIndex,
  isEditMode,
  onUpdateQuestion,
  onDeleteQuestion
}) {
  const handleQuestionTextChange = (text) => {
    onUpdateQuestion(question.id, { question: text });
  };

  const handleStatementTextChange = (statementId, text) => {
    const newStatements = question.statements.map(s =>
      s.id === statementId ? { ...s, text } : s
    );
    onUpdateQuestion(question.id, { statements: newStatements });
  };

  const handleToggleAnswer = (statementId, answer) => {
    const newStatements = question.statements.map(s =>
      s.id === statementId ? { ...s, answer } : s
    );
    onUpdateQuestion(question.id, { statements: newStatements });
  };

  const handleAddStatement = () => {
    const newStatement = {
      id: generateId(),
      text: '',
      answer: null
    };
    onUpdateQuestion(question.id, {
      statements: [...question.statements, newStatement]
    });
  };

  const handleRemoveStatement = (statementId) => {
    const statements = question.statements || [];
    if (statements.length <= 1) return;
    const newStatements = statements.filter(s => s.id !== statementId);
    onUpdateQuestion(question.id, { statements: newStatements });
  };

  const handleDeleteQuestion = () => {
    if (confirm('Xóa câu hỏi này?')) {
      onDeleteQuestion(question.id);
    }
  };

  return (
    <div className={`editor-card ${isEditMode ? 'editing' : ''}`}>
      <div className="editor-header">
        <span className="editor-number">Câu {questionIndex + 1}</span>
        <span className="editor-type" data-type="truefalse">Đúng/Sai</span>
        {isEditMode && (
          <button
            className="btn-delete"
            onClick={handleDeleteQuestion}
            type="button"
            title="Xóa câu hỏi"
          >
            🗑️ Xóa
          </button>
        )}
      </div>

      <div className="editor-content">
        <label className="editor-label">Câu hỏi:</label>
        {isEditMode ? (
          <textarea
            className="editor-textarea"
            value={question.question}
            onChange={(e) => handleQuestionTextChange(e.target.value)}
            rows={2}
          />
        ) : (
          <p className="editor-question-text">{question.question}</p>
        )}

        <label className="editor-label">Các mệnh đề:</label>
        <div className="statements-list">
          {question.statements.map((statement, i) => (
            <div key={statement.id} className="statement-editor-row">
              <span className="statement-number">{i + 1}.</span>
              {isEditMode ? (
                <>
                  <input
                    type="text"
                    className="statement-text-input"
                    value={statement.text}
                    onChange={(e) => handleStatementTextChange(statement.id, e.target.value)}
                    placeholder={`Mệnh đề ${i + 1}`}
                  />
                  <div className="tf-answer-selector">
                    <label className={`tf-option ${statement.answer === true ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name={`tf-${statement.id}`}
                        checked={statement.answer === true}
                        onChange={() => handleToggleAnswer(statement.id, true)}
                      />
                      Đúng
                    </label>
                    <label className={`tf-option ${statement.answer === false ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name={`tf-${statement.id}`}
                        checked={statement.answer === false}
                        onChange={() => handleToggleAnswer(statement.id, false)}
                      />
                      Sai
                    </label>
                  </div>
                  {(question.statements || []).length > 1 && (
                    <button
                      className="btn-remove-statement"
                      onClick={() => handleRemoveStatement(statement.id)}
                      type="button"
                      title="Xóa mệnh đề"
                    >
                      ✕
                    </button>
                  )}
                </>
              ) : (
                <>
                  <span className="statement-text">{statement.text || <em>(trống)</em>}</span>
                  <span className={`answer-badge ${statement.answer === true ? 'correct' : statement.answer === false ? 'incorrect' : 'unset'}`}>
                    {statement.answer === true ? 'Đúng ✓' : statement.answer === false ? 'Sai ✗' : '?'}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>

        {isEditMode && (question.statements || []).length < 10 && (
          <button
            className="btn-add-statement"
            onClick={handleAddStatement}
            type="button"
          >
            + Thêm mệnh đề
          </button>
        )}

        {!question.statements.every(s => s.answer !== null) && (
          <p className="warning-text">⚠️ Một số mệnh đề chưa có đáp án</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Quiz Editor (Main Component)
// ============================================================================
export function QuizEditor({
  questions,
  onUpdate,
  onStartQuiz,
  onCancel,
  onExport
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedQuestions, setEditedQuestions] = useState(questions);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync editedQuestions when questions prop changes
  if (questions !== editedQuestions && !hasChanges) {
    setEditedQuestions(questions);
  }

  const filteredQuestions = editedQuestions.filter(q => {
    const questionText = (q.question || '').toLowerCase();
    const optionsText = (q.options || []).map(o => (o.text || '').toLowerCase()).join(' ');
    const statementsText = (q.statements || []).map(s => (s.text || '').toLowerCase()).join(' ');
    const searchLower = (searchTerm || '').toLowerCase();

    const matchesSearch = questionText.includes(searchLower) ||
      optionsText.includes(searchLower) ||
      statementsText.includes(searchLower);

    const matchesType = filterType === 'all' ||
      (filterType === 'multiple' && q.type === 'multiple') ||
      (filterType === 'truefalse' && q.type === 'truefalse-group');

    return matchesSearch && matchesType;
  });

  // Statistics
  const stats = {
    total: editedQuestions.length,
    multiple: editedQuestions.filter(q => q.type === 'multiple').length,
    truefalse: editedQuestions.filter(q => q.type === 'truefalse-group').length,
    withAnswers: editedQuestions.filter(q => {
      if (q.type === 'multiple') return (q.options || []).some(o => o.correct);
      if (q.type === 'truefalse-group') return (q.statements || []).every(s => s.answer !== null);
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

  // Edit mode handlers
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

  return (
    <div className="quiz-editor">
      <div className="editor-toolbar">
        <h2>Kiểm tra & Chỉnh sửa câu hỏi</h2>

        <div className="toolbar-stats">
          <span className="stat-badge">Tổng: {stats.total}</span>
          <span className="stat-badge multiple">Trắc nghiệm: {stats.multiple}</span>
          <span className="stat-badge truefalse">Đ/S: {stats.truefalse}</span>
          <span className={`stat-badge answered ${stats.withAnswers === stats.total ? 'complete' : ''}`}>
            Có đáp án: {stats.withAnswers}/{stats.total}
          </span>
        </div>

        <div className="toolbar-filters">
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm câu hỏi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="multiple">Trắc nghiệm</option>
            <option value="truefalse">Đúng/Sai</option>
          </select>
        </div>

        <div className="toolbar-actions">
          {isEditMode ? (
            <>
              <button
                className="btn btn-primary"
                onClick={handleSaveAll}
              >
                💾 Lưu tất cả
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleCancelChanges}
              >
                Hủy thay đổi
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-edit-mode"
                onClick={handleEnterEditMode}
              >
                ✏️ Chỉnh sửa
              </button>
              <button
                className="btn btn-export"
                onClick={() => onExport(false)}
                title="Tải quiz không có đáp án"
              >
                📥 Tải Quiz
              </button>
              <button
                className="btn btn-export btn-export-answers"
                onClick={() => onExport(true)}
                disabled={!canStartQuiz}
                title="Tải quiz kèm đáp án"
              >
                📥 Tải kèm Đáp án
              </button>
            </>
          )}
        </div>
      </div>

      <div className="editor-questions">
        {filteredQuestions.length === 0 ? (
          <div className="no-questions">
            {editedQuestions.length === 0 ? (
              <p>Không có câu hỏi nào được tìm thấy.</p>
            ) : (
              <p>Không tìm thấy câu hỏi phù hợp với tìm kiếm.</p>
            )}
          </div>
        ) : (
          filteredQuestions.map((question) => {
            const originalIndex = editedQuestions.findIndex(q => q.id === question.id);

            if (question.type === 'truefalse-group') {
              return (
                <TrueFalseQuestionEditor
                  key={question.id}
                  question={question}
                  questionIndex={originalIndex}
                  isEditMode={isEditMode}
                  onUpdateQuestion={handleUpdateQuestion}
                  onDeleteQuestion={handleDeleteQuestion}
                />
              );
            }

            return (
              <QuestionCardEditor
                key={question.id}
                question={question}
                questionIndex={originalIndex}
                isEditMode={isEditMode}
                onUpdateQuestion={handleUpdateQuestion}
                onUpdateOption={handleUpdateOption}
                onDeleteQuestion={handleDeleteQuestion}
              />
            );
          })
        )}
      </div>

      <div className="editor-footer">
        <button className="btn btn-secondary" onClick={onCancel}>
          ← Quay lại
        </button>

        <div className="footer-actions">
          {!canStartQuiz && (
            <p className="warning-text">
              ⚠️ Cần điền đáp án cho tất cả câu hỏi trước khi bắt đầu
            </p>
          )}

          <button
            className="btn btn-primary btn-start-quiz"
            onClick={() => {
              // Apply any unsaved changes first
              if (hasChanges || isEditMode) {
                onUpdate(editedQuestions);
              }
              onStartQuiz();
            }}
            disabled={!canStartQuiz}
          >
            Bắt đầu làm bài →
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuizEditor;
