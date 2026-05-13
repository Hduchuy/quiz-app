import { useState, useEffect, useCallback, useRef } from 'react';
import { loadQuiz } from './utils/questionParser';
import { importQuizFromText } from './utils/quizImporter';
import {
  parseAnswerKey,
  hasAnswerKey,
  prepareQuiz,
  reprepareQuiz,
  normalizeQuestions
} from './utils/quizModels';
import {
  loadSavedSession,
  clearSavedSession,
  restoreFromSession,
  createAutoSave
} from './utils/storage';
import { QuizEditor } from './QuizEditor';
import { RestoreSession } from './components/RestoreSession';
import { QuizLibrary, SubjectPage } from './components/QuizLibrary';
import { downloadQuiz } from './utils/exportQuiz';
import './App.css';

// ============================================================================
// QuestionCard - renders one question during quiz
// ============================================================================
function QuestionCard({
  question,
  questionIndex,
  selectedAnswer,
  onSelectOption,
  onToggleOption,
  onSelectStatement
}) {
  // Multi-select: either maxCorrectAnswers > 1 or has multiple correct options marked
  const isMultiSelect = question.type === 'multiple' && (
    (question.maxCorrectAnswers && question.maxCorrectAnswers > 1) ||
    (question.options || []).filter(o => o.correct).length > 1
  );

  // DEBUG: Log what we're receiving
  console.log('[QuestionCard]', {
    q: (question.question || '').substring(0, 30),
    maxCorrectAnswers: question.maxCorrectAnswers,
    isMultiSelect,
    type: question.type
  });

  if (question.type === 'multiple') {
    // Multi-select mode: use checkboxes
    if (isMultiSelect) {
      const selectedIds = Array.isArray(selectedAnswer) ? selectedAnswer : [];

      return (
        <div className="question-card">
          <h2 className="question-text">
            <span className="question-number">Câu {questionIndex + 1}:</span> {question.question}
            <span className="multi-select-hint">(Chọn {question.maxCorrectAnswers || 'tất cả'} đáp án đúng)</span>
          </h2>

          <div className="options-list multi-select">
            {(question.options || []).map((option) => {
              const isSelected = selectedIds.includes(option.id);
              return (
                <button
                  key={option.id}
                  className={`option-btn checkbox-mode ${isSelected ? 'selected' : ''}`}
                  onClick={() => onToggleOption(option.id)}
                >
                  <span className={`checkbox ${isSelected ? 'checked' : ''}`}>
                    {isSelected && '✓'}
                  </span>
                  <span className="option-marker">{option.label}.</span>
                  <span className="option-text">{option.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // Single-select mode: use radio-style buttons
    return (
      <div className="question-card">
        <h2 className="question-text">
          <span className="question-number">Câu {questionIndex + 1}:</span> {question.question}
        </h2>

        <div className="options-list">
          {(question.options || []).map((option) => (
            <button
              key={option.id}
              className={`option-btn ${selectedAnswer === option.id ? 'selected' : ''}`}
              onClick={() => onSelectOption(option.id)}
            >
              <span className="option-marker">{option.label}.</span>
              <span className="option-text">{option.text}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (question.type === 'truefalse-group') {
    return (
      <div className="question-card">
        <h2 className="question-text">
          <span className="question-number">Câu {questionIndex + 1}:</span> {question.question}
        </h2>

        <div className="statements-list">
          {(question.statements || []).map((statement, sIndex) => (
            <div key={statement.id} className="statement-item">
              <div className="statement-text">
                <span className="statement-number">{sIndex + 1}.</span>
                <span>{statement.text}</span>
              </div>
              <div className="statement-answers">
                <button
                  className={`tf-btn ${selectedAnswer?.[statement.id] === true ? 'selected' : ''}`}
                  onClick={() => onSelectStatement(statement.id, true)}
                >
                  Đúng
                </button>
                <button
                  className={`tf-btn ${selectedAnswer?.[statement.id] === false ? 'selected' : ''}`}
                  onClick={() => onSelectStatement(statement.id, false)}
                >
                  Sai
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="question-card">
      <h2 className="question-text">
        <span className="question-number">Câu {questionIndex + 1}:</span> {question.question}
      </h2>
      <p style={{ color: 'red' }}>Loại câu hỏi không xác định: {question.type}</p>
    </div>
  );
}

// ============================================================================
// ResultCard - shows one question in results
// ============================================================================
function ResultCard({ question, questionIndex, selectedAnswer, hasGrading }) {
  const isMultiple = question.type === 'multiple';

  // Multi-select: either maxCorrectAnswers > 1 or has multiple correct options marked
  const isMultiSelect = isMultiple && (
    (question.maxCorrectAnswers && question.maxCorrectAnswers > 1) ||
    (question.options || []).filter(o => o.correct).length > 1
  );

  const isCorrect = () => {
    if (!hasGrading) return null;

    if (isMultiple) {
      if (isMultiSelect) {
        // Multi-select: compare arrays of IDs
        const selectedIds = Array.isArray(selectedAnswer) ? [...selectedAnswer].sort() : [];
        const correctIds = (question.options || [])
          .filter(o => o.correct)
          .map(o => o.id)
          .sort();
        return JSON.stringify(selectedIds) === JSON.stringify(correctIds);
      } else {
        // Single-select: simple comparison
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
    <div className={`result-item ${hasGrading && correct !== null ? (correct ? 'correct' : 'incorrect') : ''}`}>
      <div className="result-question">
        <span className="result-number">{questionIndex + 1}.</span>
        <span className="result-text">{question.question}</span>
        {!hasGrading && <span className="practice-badge">Luyện tập</span>}
        {isMultiSelect && <span className="multi-select-badge">Chọn nhiều</span>}
      </div>

      {isMultiple && (
        <div className="result-answers">
          {(question.options || []).map((option) => {
            const isSelected = isMultiSelect
              ? (Array.isArray(selectedAnswer) ? selectedAnswer : []).includes(option.id)
              : selectedAnswer === option.id;
            const isCorrectOption = hasGrading && option.correct;
            const isWrongSelection = isSelected && !isCorrectOption && hasGrading;

            return (
              <div
                key={option.id}
                className={`result-option ${isCorrectOption ? 'correct-answer' : ''} ${isWrongSelection ? 'selected-answer' : ''}`}
              >
                <span className="result-option-marker">{option.label}.</span>
                <span className="result-option-text">{option.text}</span>
                {isCorrectOption && <span className="correct-badge">✓</span>}
                {isWrongSelection && <span className="wrong-badge">✗</span>}
                {isSelected && <span className="selected-badge">Bạn chọn</span>}
              </div>
            );
          })}
        </div>
      )}

      {question.type === 'truefalse-group' && (
        <div className="result-statements">
          {(question.statements || []).map((statement, sIndex) => {
            const userAnswer = selectedAnswer?.[statement.id];
            const isStatementCorrect = hasGrading && userAnswer === statement.answer;

            return (
              <div key={statement.id} className="result-statement">
                <div className={`result-statement-row ${hasGrading && isStatementCorrect ? 'correct' : ''}`}>
                  <span className="statement-number">{sIndex + 1}.</span>
                  <span className="statement-text">{statement.text}</span>
                </div>
                <div className="result-statement-answer">
                  {hasGrading && (
                    <span className={`answer ${statement.answer ? 'true' : 'false'}`}>
                      Đáp án: {statement.answer ? 'Đúng' : 'Sai'}
                    </span>
                  )}
                  {userAnswer !== undefined && (
                    <span className={`user-answer ${hasGrading && isStatementCorrect ? 'correct' : 'incorrect'}`}>
                      Bạn: {userAnswer ? 'Đúng' : 'Sai'} {hasGrading && (isStatementCorrect ? '✓' : '✗')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main App
// ============================================================================
function App() {
  // Check for saved session on mount
  const savedSession = loadSavedSession();
  
  // State
  const [showRestoreModal, setShowRestoreModal] = useState(savedSession !== null);
  const [restoreData, setRestoreData] = useState(savedSession);
  
  const [questions, setQuestions] = useState([]);
  const [editedQuestions, setEditedQuestions] = useState([]);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [gameState, setGameState] = useState('upload');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Library navigation state
  const [libraryState, setLibraryState] = useState({
    show: false,
    subject: null
  });

  // File inputs (only file names are persisted, not file content)
  const [questionFileName, setQuestionFileName] = useState(null);
  const [answerKeyFileName, setAnswerKeyFileName] = useState(null);
  
  // Auto-save
  const autoSaveRef = useRef(createAutoSave(300));
  const lastSavedRef = useRef(null);

  // ==========================================================================
  // Auto-save effect
  // ==========================================================================
  useEffect(() => {
    // Don't save if showing restore modal
    if (showRestoreModal) return;
    
    // Don't save if nothing to save
    if ((questions || []).length === 0 && (editedQuestions || []).length === 0) return;

    const state = {
      quizData: {
        questions,
        hasAnswerKey: hasAnswerKey(editedQuestions)
      },
      editorState: {
        editedQuestions
      },
      quizState: {
        mode: gameState,
        shuffledQuestions,
        currentQuestionIndex,
        selectedAnswers,
        questionFileName,
        answerKeyFileName
      }
    };

    // Only save if state changed
    const stateStr = JSON.stringify(state);
    if (stateStr !== lastSavedRef.current) {
      lastSavedRef.current = stateStr;
      autoSaveRef.current(state);
    }
  }, [
    questions, 
    editedQuestions, 
    shuffledQuestions, 
    currentQuestionIndex, 
    selectedAnswers,
    gameState,
    questionFileName,
    answerKeyFileName,
    showRestoreModal
  ]);

  // ==========================================================================
  // Restore session handlers
  // ==========================================================================
  const handleRestore = () => {
    const restored = restoreFromSession(restoreData);

    if (restored) {
      setQuestions(restored.questions);
      setEditedQuestions(restored.editedQuestions);

      // Re-prepare quiz to restore shuffled state with regenerated labels
      // This preserves the exact shuffle order from the session
      // Only regenerates display labels (A/B/C/D) to match display positions
      const reshuffled = reprepareQuiz(
        restored.editedQuestions,
        restored.shuffledQuestions
      );

      setShuffledQuestions(reshuffled);
      setCurrentQuestionIndex(restored.currentQuestionIndex);
      setSelectedAnswers(restored.selectedAnswers);
      setQuestionFileName(restored.questionFileName);
      setAnswerKeyFileName(restored.answerKeyFileName);
      setGameState(restored.mode);
    }

    setShowRestoreModal(false);
    setRestoreData(null);
  };

  const handleDiscard = () => {
    clearSavedSession();
    setShowRestoreModal(false);
    setRestoreData(null);
  };

  // ==========================================================================
  // File handling
  // ==========================================================================
  const handleQuestionFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQuestionFileName(file.name);
      setError(null);
    }
  };

  const handleAnswerKeyFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAnswerKeyFileName(file.name);
      setError(null);
    }
  };

  // ==========================================================================
  // Upload handler
  // ==========================================================================
  const handleUpload = async () => {
    const fileInput = document.getElementById('question-file');
    const keyFileInput = document.getElementById('answer-key-file');
    
    const questionFile = fileInput?.files?.[0];
    const answerKeyFile = keyFileInput?.files?.[0];

    if (!questionFile) {
      setError('Vui lòng chọn file câu hỏi');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let parsedQuestions = await loadQuiz(questionFile);

      // Normalize for consistency (same as library flow)
      parsedQuestions = normalizeQuestions(parsedQuestions);

      if (parsedQuestions.length === 0) {
        setError('Không tìm thấy câu hỏi nào trong file');
        setIsLoading(false);
        return;
      }

      // Apply answer key if provided
      if (answerKeyFile) {
        const answerKeyText = await answerKeyFile.text();
        const answerKey = parseAnswerKey(answerKeyText);
        parsedQuestions = parsedQuestions.map(q => {
          if (q.type === 'multiple') {
            const idx = parsedQuestions.indexOf(q);
            const key = String(idx + 1);
            const answers = answerKey[key] || [];
            return {
              ...q,
              maxCorrectAnswers: q.maxCorrectAnswers,
              options: (q.options || []).map(o => ({
                ...o,
                correct: answers.includes(o.label)
              }))
            };
          }
          if (q.type === 'truefalse-group') {
            const idx = parsedQuestions.indexOf(q);
            return {
              ...q,
              statements: (q.statements || []).map((s, sIdx) => {
                const key = `${idx + 1}.${sIdx + 1}`;
                const answers = answerKey[key];
                return {
                  ...s,
                  answer: answers ? answers[0] : null
                };
              })
            };
          }
          return q;
        });
      }

      setQuestions(parsedQuestions);
      setEditedQuestions(parsedQuestions);
      setQuestionFileName(questionFile.name);
      setAnswerKeyFileName(answerKeyFile?.name || null);
      setGameState('review');
    } catch (err) {
      console.error('Parse error:', err);
      setError('Lỗi khi đọc file: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================================
  // Quiz controls
  // ==========================================================================
  const handleStartQuiz = () => {
    const prepared = prepareQuiz(editedQuestions);
    setShuffledQuestions(prepared);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setGameState('playing');
  };

  const handleUpdateQuestions = (updatedQuestions) => {
    setEditedQuestions(updatedQuestions);
  };

  const handleExportQuiz = (includeAnswers) => {
    const baseName = questionFileName 
      ? questionFileName.replace(/\.(docx|txt)$/i, '')
      : 'quiz';
    downloadQuiz(editedQuestions, includeAnswers, baseName);
  };

  const handleCancelFromReview = () => {
    setGameState('upload');
  };

  // ==========================================================================
  // Library handlers
  // ==========================================================================
  const handleOpenLibrary = () => {
    setLibraryState({ show: true, subject: null });
  };

  const handleSelectSubject = (subject) => {
    setLibraryState({ show: true, subject });
  };

  const handleLibraryQuizSelect = async (quiz) => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch quiz file
      const response = await fetch(quiz.file);
      if (!response.ok) {
        throw new Error(`Không thể tải file: ${response.status}`);
      }
      const text = await response.text();

      // Use shared import pipeline (same as upload)
      let questions = await importQuizFromText(text);
      if (questions.length === 0) {
        throw new Error('Không tìm thấy câu hỏi nào trong đề thi.');
      }

      // Apply answer key if bundled with quiz
      if (quiz.answerKey) {
        const answerKey = parseAnswerKey(quiz.answerKey);
        questions = questions.map((q, idx) => {
          if (q.type === 'multiple') {
            const key = String(idx + 1);
            const answers = answerKey[key] || [];
            return {
              ...q,
              options: (q.options || []).map(o => ({
                ...o,
                correct: answers.includes(o.label)
              }))
            };
          }
          if (q.type === 'truefalse-group') {
            return {
              ...q,
              statements: (q.statements || []).map((s, sIdx) => ({
                ...s,
                answer: answerKey[`${idx + 1}.${sIdx + 1}`]?.[0] ?? null
              }))
            };
          }
          return q;
        });
      }

      setQuestions(questions);
      setEditedQuestions(questions);
      setQuestionFileName(quiz.title || 'Kho đề');
      setAnswerKeyFileName(null);
      setLibraryState({ show: false, subject: null });
      setGameState('review');
    } catch (err) {
      console.error('Library quiz error:', err);
      setError('Lỗi khi tải đề thi: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackFromLibrary = () => {
    setLibraryState({ show: false, subject: null });
  };

  const resetQuiz = () => {
    clearSavedSession();
    lastSavedRef.current = null;

    // Reset all state
    setQuestions([]);
    setEditedQuestions([]);
    setShuffledQuestions([]);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setGameState('upload');
    setError(null);
    setQuestionFileName(null);
    setAnswerKeyFileName(null);
    setLibraryState({ show: false, subject: null });

    // Clear file inputs
    const fileInput = document.getElementById('question-file');
    const keyFileInput = document.getElementById('answer-key-file');
    if (fileInput) fileInput.value = '';
    if (keyFileInput) keyFileInput.value = '';
  };

  // ==========================================================================
  // Answer selection
  // ==========================================================================
  const handleSelectOption = useCallback((optionId) => {
    // Single-select mode
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionId
    }));
  }, [currentQuestionIndex]);

  const handleToggleOption = useCallback((optionId) => {
    // Multi-select mode (checkbox behavior)
    setSelectedAnswers(prev => {
      const current = prev[currentQuestionIndex] || [];
      const currentArray = Array.isArray(current) ? current : [];
      const isSelected = currentArray.includes(optionId);

      if (isSelected) {
        // Remove from selection
        return {
          ...prev,
          [currentQuestionIndex]: currentArray.filter(id => id !== optionId)
        };
      } else {
        // Add to selection
        return {
          ...prev,
          [currentQuestionIndex]: [...currentArray, optionId]
        };
      }
    });
  }, [currentQuestionIndex]);

  const handleSelectStatement = useCallback((statementId, value) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: {
        ...prev[currentQuestionIndex],
        [statementId]: value
      }
    }));
  }, [currentQuestionIndex]);

  // ==========================================================================
  // Navigation
  // ==========================================================================
  const handleNext = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    setGameState('results');
  };

  // ==========================================================================
  // Scoring
  // ==========================================================================
  const calculateScore = () => {
    let correct = 0;
    let total = 0;
    const hasGrading = hasAnswerKey(editedQuestions);

    shuffledQuestions.forEach((q, qIndex) => {
      const userAnswer = selectedAnswers[qIndex];

      if (q.type === 'multiple') {
        if (hasGrading) {
          total++;
          const correctOptionIds = q.options
            .filter(o => o.correct)
            .map(o => o.id);

          // Check if multiple correct answers
          if (correctOptionIds.length > 1) {
            // Multi-select: compare sorted arrays
            const selectedArray = Array.isArray(userAnswer)
              ? [...userAnswer].sort()
              : (userAnswer ? [userAnswer] : []);
            const correctArray = [...correctOptionIds].sort();
            if (JSON.stringify(selectedArray) === JSON.stringify(correctArray)) {
              correct++;
            }
          } else {
            // Single-select: simple comparison
            const selectedOption = q.options.find(o => o.id === userAnswer);
            if (selectedOption?.correct === true) {
              correct++;
            }
          }
        }
      }

      if (q.type === 'truefalse-group') {
        if (hasGrading) {
          total++;
          const allCorrect = q.statements.every(s => userAnswer?.[s.id] === s.answer);
          if (allCorrect) {
            correct++;
          }
        }
      }
    });

    return { correct, total, hasGrading };
  };

  // ==========================================================================
  // UI helpers
  // ==========================================================================
  const isQuestionAnswered = useCallback((qIndex) => {
    const answer = selectedAnswers[qIndex];
    if (answer === undefined) return false;

    const q = shuffledQuestions[qIndex];
    if (q.type === 'multiple') {
      return answer !== undefined;
    }
    if (q.type === 'truefalse-group') {
      return q.statements.every(s => answer?.[s.id] !== undefined);
    }
    return false;
  }, [selectedAnswers, shuffledQuestions]);

  const allAnswered = shuffledQuestions.every((_, i) => isQuestionAnswered(i));

  // ==========================================================================
  // Render states
  // ==========================================================================
  const renderUploadState = () => (
    <div className="container">
      <header className="header">
        <h1>Quiz App</h1>
        <p>Làm bài trắc nghiệm từ file Word</p>
      </header>

      <div className="upload-area">
        <div className="file-input-group">
          <label className="file-label-title">File câu hỏi</label>
          <div className="file-input-wrapper">
            <input
              type="file"
              accept=".docx,.txt"
              onChange={handleQuestionFileChange}
              className="file-input"
              id="question-file"
            />
            <label htmlFor="question-file" className="file-label">
              <span className="file-icon">📄</span>
              <span className="file-text">
                {questionFileName || 'Chọn file .docx hoặc .txt'}
              </span>
            </label>
          </div>
        </div>

        <div className="file-input-group">
          <label className="file-label-title">File đáp án (tùy chọn)</label>
          <div className="file-input-wrapper">
            <input
              type="file"
              accept=".txt,.docx"
              onChange={handleAnswerKeyFileChange}
              className="file-input"
              id="answer-key-file"
            />
            <label htmlFor="answer-key-file" className="file-label">
              <span className="file-icon">🔑</span>
              <span className="file-text">
                {answerKeyFileName || 'Chọn file đáp án (hoặc bỏ trống)'}
              </span>
            </label>
          </div>
          <p className="file-hint">
            Format file đáp án: <code>1:B</code> | <code>2. C</code> | <code>28.1:Đúng</code>.<br/>
            Hoặc dùng đáp án inline trong file câu hỏi (không cần file đáp án riêng).
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={isLoading}
        >
          {isLoading ? 'Đang xử lý...' : 'Tải lên & Kiểm tra'}
        </button>

        <button
          className="btn btn-library"
          onClick={handleOpenLibrary}
        >
          📚 Kho đề có sẵn
        </button>

        {questionFileName && (
          <button
            className="btn btn-text"
            onClick={resetQuiz}
          >
            Xóa dữ liệu đã lưu
          </button>
        )}
      </div>

      <div className="instructions">
        <h3>Hướng dẫn format file câu hỏi:</h3>

        <div className="format-example">
          <p><strong>Trắc nghiệm A/B/C/D (đáp án inline):</strong></p>
          <pre>{`Câu 1: 2 + 2 = ?
*A. 3
*B. 4
C. 5
D. 6`}</pre>
        </div>

        <div className="format-example">
          <p><strong>Câu đúng/sai - Format A (đáp án dòng riêng):</strong></p>
          <pre>{`Câu 28: Vì sao Nho giáo phát triển mạnh?
1. Vì Nho giáo phù hợp với nghệ thuật
Đúng
2. Vì Nhà nước ủng hộ Nho giáo
*Sai
3. Vì Nho giáo được hoàng đế bảo trợ
Sai`}</pre>
        </div>

        <div className="format-example">
          <p><strong>Câu đúng/sai - Format B (đáp án cùng dòng):</strong></p>
          <pre>{`Câu 28: Vì sao Nho giáo phát triển mạnh?
1. Vì Nho giáo phù hợp với nghệ thuật [Đúng]
2. Vì Nhà nước ủng hộ Nho giáo [Sai]
3. Vì Nho giáo được hoàng đế bảo trợ [Sai]`}</pre>
        </div>
      </div>
    </div>
  );

  const renderReviewState = () => (
    <QuizEditor
      questions={editedQuestions}
      onUpdate={handleUpdateQuestions}
      onStartQuiz={handleStartQuiz}
      onCancel={handleCancelFromReview}
      onExport={handleExportQuiz}
    />
  );

  const renderPlayingState = () => {
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === shuffledQuestions.length - 1;
    const isFirstQuestion = currentQuestionIndex === 0;
    const answeredCount = shuffledQuestions.filter((_, i) => isQuestionAnswered(i)).length;

    return (
      <div className="container">
        <div className="quiz-header">
          <div className="progress-info">
            Câu {currentQuestionIndex + 1} / {shuffledQuestions.length}
            <span className="answered-count">({answeredCount}/{shuffledQuestions.length} đã trả lời)</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentQuestionIndex + 1) / shuffledQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        <QuestionCard
          question={currentQuestion}
          questionIndex={currentQuestionIndex}
          selectedAnswer={selectedAnswers[currentQuestionIndex]}
          onSelectOption={handleSelectOption}
          onToggleOption={handleToggleOption}
          onSelectStatement={handleSelectStatement}
        />

        <div className="navigation-buttons">
          <button
            className="btn btn-secondary"
            onClick={handlePrev}
            disabled={isFirstQuestion}
          >
            ← Câu trước
          </button>

          {isLastQuestion ? (
            <button
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={!allAnswered}
            >
              Nộp bài
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleNext}>
              Câu tiếp →
            </button>
          )}
        </div>

        <div className="question-dots">
          {shuffledQuestions.map((_, index) => (
            <button
              key={index}
              className={`dot ${isQuestionAnswered(index) ? 'answered' : ''} ${index === currentQuestionIndex ? 'current' : ''}`}
              onClick={() => setCurrentQuestionIndex(index)}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderResultsState = () => {
    const { correct, total, hasGrading } = calculateScore();
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <div className="container">
        <div className="results-header">
          <h1>{hasGrading ? 'Kết quả bài thi' : 'Kết quả luyện tập'}</h1>
        </div>

        <div className="score-card">
          <div className="score-circle">
            {hasGrading ? (
              <>
                <span className="score-value">{correct}/{total}</span>
                <span className="score-percent">{percentage}%</span>
              </>
            ) : (
              <>
                <span className="score-value">{editedQuestions.length}</span>
                <span className="score-percent">câu đã làm</span>
              </>
            )}
          </div>
          {hasGrading ? (
            <p className="score-message">
              {percentage >= 80 ? 'Xuất sắc!' : percentage >= 60 ? 'Khá tốt!' : percentage >= 40 ? 'Cần cố gắng hơn' : 'Cần học thêm'}
            </p>
          ) : (
            <p className="score-message">Xem lại các đáp án bạn đã chọn</p>
          )}
        </div>

        <div className="results-details">
          {shuffledQuestions.map((q, qIndex) => (
            <ResultCard
              key={qIndex}
              question={q}
              questionIndex={qIndex}
              selectedAnswer={selectedAnswers[qIndex]}
              hasGrading={hasGrading}
            />
          ))}
        </div>

        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={resetQuiz}>
            Làm bài mới
          </button>
          <button className="btn btn-primary" onClick={handleStartQuiz}>
            Làm lại (xáo trộn lại)
          </button>
        </div>
      </div>
    );
  };

  // ==========================================================================
  // Main render
  // ==========================================================================
  return (
    <div className="app">
      {showRestoreModal && restoreData && (
        <RestoreSession
          savedAt={restoreData.savedAt}
          onRestore={handleRestore}
          onDiscard={handleDiscard}
        />
      )}

      {/* Quiz Library Views */}
      {libraryState.show && !libraryState.subject && (
        <QuizLibrary
          onSelectQuiz={handleSelectSubject}
          onBack={handleBackFromLibrary}
        />
      )}
      {libraryState.show && libraryState.subject && (
        <SubjectPage
          subject={libraryState.subject}
          onBack={() => setLibraryState(prev => ({ ...prev, subject: null }))}
          onSelectQuiz={handleLibraryQuizSelect}
        />
      )}

      {/* Main App Views */}
      {!libraryState.show && gameState === 'upload' && renderUploadState()}
      {!libraryState.show && gameState === 'review' && renderReviewState()}
      {!libraryState.show && gameState === 'playing' && renderPlayingState()}
      {!libraryState.show && gameState === 'results' && renderResultsState()}
    </div>
  );
}

export default App;
