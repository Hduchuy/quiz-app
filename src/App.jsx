import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadQuiz } from './utils/questionParser';
import { importQuizFromText } from './utils/quizImporter';
import {
  parseAnswerKey,
  hasAnswerKey,
  prepareQuizWithSettings,
  reprepareQuiz,
  normalizeQuestions
} from './utils/quizModels';
import { DEFAULT_SETTINGS, normalizeSettings } from './utils/quizSettings';
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
import {
  GlassCard,
  ProgressBar,
  AnimatedContainer,
  Button,
  Badge
} from './components/ui';
import { QuizCard } from './components/quiz/QuizCard';
import { ScoreCard, ResultItem } from './components/quiz/Results';
import {
  QuestionNavigatorGrid,
  ProgressStats,
  QuizInfoCard
} from './components/quiz/Navigator';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarSection,
  SidebarItem,
  SidebarFooter,
  RightPanel,
  RightPanelHeader,
  RightPanelContent,
  RightPanelFooter,
  DesktopLayout
} from './components/quiz/Layout';
import {
  QuizLayout,
  QuizHeader,
  QuestionSidebar,
  MobileQuestionSheet,
  BottomNavigation,
  MobileNavigation,
  QuizTimer
} from './components/quiz/QuizLayout';
import './components/quiz/QuizLayout.css';
import './App.css';

// ============================================================================
// FeatureCard - Small feature highlight card
// ============================================================================
function FeatureCard({ icon, title, description }) {
  return (
    <motion.div
      className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/20 flex items-center justify-center text-[var(--color-accent-light)] flex-shrink-0">
          {icon}
        </div>
        <div>
          <div className="font-semibold text-sm text-[var(--color-text-primary)]">{title}</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{description}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main App - Redesigned with modern dark glassmorphism UI
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
  const [mobileNavExpanded, setMobileNavExpanded] = useState(false);

  // Library navigation state
  const [libraryState, setLibraryState] = useState({
    show: false,
    subject: null
  });

  // File inputs (only file names are persisted, not file content)
  const [questionFileName, setQuestionFileName] = useState(null);
  const [answerKeyFileName, setAnswerKeyFileName] = useState(null);

  // Quiz settings
  const [quizSettings, setQuizSettings] = useState(DEFAULT_SETTINGS);
  
  // Auto-save
  const autoSaveRef = useRef(createAutoSave(300));
  const lastSavedRef = useRef(null);

  // ==========================================================================
  // Auto-save effect
  // ==========================================================================
  useEffect(() => {
    if (showRestoreModal) return;
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
        answerKeyFileName,
        quizSettings
      }
    };

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
    quizSettings,
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
      setQuizSettings(restored.quizSettings || DEFAULT_SETTINGS);
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
      parsedQuestions = normalizeQuestions(parsedQuestions);

      if (parsedQuestions.length === 0) {
        setError('Không tìm thấy câu hỏi nào trong file');
        setIsLoading(false);
        return;
      }

      if (answerKeyFile) {
        const answerKeyText = await answerKeyFile.text();
        const answerKey = parseAnswerKey(answerKeyText);
        parsedQuestions = parsedQuestions.map((q, idx) => {
          if (q.type === 'multiple') {
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
  const handleStartQuiz = (settings = DEFAULT_SETTINGS) => {
    const normalizedSettings = normalizeSettings(settings);
    const prepared = prepareQuizWithSettings(editedQuestions, normalizedSettings);
    setShuffledQuestions(prepared);
    setQuizSettings(normalizedSettings);
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
      const response = await fetch(quiz.file);
      if (!response.ok) {
        throw new Error(`Không thể tải file: ${response.status}`);
      }
      const text = await response.text();

      let questions = await importQuizFromText(text);
      if (questions.length === 0) {
        throw new Error('Không tìm thấy câu hỏi nào trong đề thi.');
      }

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
    setQuizSettings(DEFAULT_SETTINGS);
    setMobileNavExpanded(false);

    const fileInput = document.getElementById('question-file');
    const keyFileInput = document.getElementById('answer-key-file');
    if (fileInput) fileInput.value = '';
    if (keyFileInput) keyFileInput.value = '';
  };

  // ==========================================================================
  // Answer selection
  // ==========================================================================
  const handleSelectOption = useCallback((optionId) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionId
    }));
  }, [currentQuestionIndex]);

  const handleToggleOption = useCallback((optionId) => {
    setSelectedAnswers(prev => {
      const current = prev[currentQuestionIndex] || [];
      const currentArray = Array.isArray(current) ? current : [];
      const isSelected = currentArray.includes(optionId);

      if (isSelected) {
        return {
          ...prev,
          [currentQuestionIndex]: currentArray.filter(id => id !== optionId)
        };
      } else {
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

          if (correctOptionIds.length > 1) {
            const selectedArray = Array.isArray(userAnswer)
              ? [...userAnswer].sort()
              : (userAnswer ? [userAnswer] : []);
            const correctArray = [...correctOptionIds].sort();
            if (JSON.stringify(selectedArray) === JSON.stringify(correctArray)) {
              correct++;
            }
          } else {
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
  const answeredSet = new Set(shuffledQuestions.map((_, i) => i).filter(i => isQuestionAnswered(i)));

  // ==========================================================================
  // Render states
  // ==========================================================================
  const renderUploadState = () => (
    <AnimatedContainer>
      <div className="min-h-screen lg:min-h-screen flex items-center justify-center p-4 lg:p-8">
        {/* Desktop: 2-column layout */}
        <div className="w-full max-w-7xl lg:grid lg:grid-cols-5 lg:gap-8 lg:items-center">
          
          {/* LEFT SIDE - Hero (45%) */}
          <div className="lg:col-span-2 lg:py-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Logo */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-cyan)] flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gradient">Quiz App</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gradient mb-4 leading-tight">
                Làm bài trắc nghiệm dễ dàng
              </h1>
              
              {/* Subtitle */}
              <p className="text-[var(--color-text-secondary)] text-base lg:text-lg mb-8 max-w-md">
                Tải lên file Word, làm bài thi, xem kết quả ngay. Không cần đăng ký, không giới hạn.
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                <FeatureCard 
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  }
                  title="Upload DOCX/TXT"
                  description="Hỗ trợ nhiều định dạng"
                />
                <FeatureCard 
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  }
                  title="Chấm điểm tự động"
                  description="Kết quả ngay lập tức"
                />
                <FeatureCard 
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  }
                  title="Xáo trộn câu hỏi"
                  description="Chế độ thi ngẫu nhiên"
                />
                <FeatureCard 
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  }
                  title="Responsive"
                  description="Mọi thiết bị"
                />
              </div>

              {/* Library Button - Desktop */}
              <motion.button
                onClick={handleOpenLibrary}
                className="hidden lg:flex items-center gap-3 mt-8 px-6 py-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-all duration-200 group w-fit"
                whileHover={{ x: 5 }}
              >
                <svg className="w-6 h-6 text-[var(--color-accent-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <div className="text-left">
                  <div className="font-semibold text-[var(--color-text-primary)]">Kho đề có sẵn</div>
                  <div className="text-sm text-[var(--color-text-muted)]">Các bài thi mẫu</div>
                </div>
                <svg className="w-5 h-5 text-[var(--color-text-muted)] ml-auto group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </motion.div>
          </div>

          {/* RIGHT SIDE - Upload Panel (55%) */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <GlassCard padding="p-6 lg:p-8">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">
                  Tải lên đề thi của bạn
                </h2>

                {/* File Inputs */}
                <div className="space-y-4">
                  {/* Question File */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      File câu hỏi
                    </label>
                    <div className="file-upload-area">
                      <input
                        type="file"
                        accept=".docx,.txt"
                        onChange={handleQuestionFileChange}
                        className="file-input"
                        id="question-file"
                      />
                      <label htmlFor="question-file" className="file-upload-label file-upload-label-compact">
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-[var(--color-accent-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-medium text-[var(--color-text-primary)] truncate">
                              {questionFileName || 'Chọn file câu hỏi'}
                            </div>
                            <div className="text-xs text-[var(--color-text-muted)]">
                              .docx hoặc .txt
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Answer Key File */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      File đáp án <span className="text-[var(--color-text-muted)]">(tùy chọn)</span>
                    </label>
                    <div className="file-upload-area">
                      <input
                        type="file"
                        accept=".txt,.docx"
                        onChange={handleAnswerKeyFileChange}
                        className="file-input"
                        id="answer-key-file"
                      />
                      <label htmlFor="answer-key-file" className="file-upload-label file-upload-label-compact">
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-10 h-10 rounded-xl bg-[var(--color-success)]/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-medium text-[var(--color-text-primary)] truncate">
                              {answerKeyFileName || 'Chọn file đáp án'}
                            </div>
                            <div className="text-xs text-[var(--color-text-muted)]">
                              Không bắt buộc
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-2">
                      Format: <code className="px-1 py-0.5 rounded bg-[var(--color-surface)]">1:B</code> | <code className="px-1 py-0.5 rounded bg-[var(--color-surface)]">2. C</code>
                    </p>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-[var(--color-error-light)] text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Buttons */}
                <div className="mt-6 space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleUpload}
                    loading={isLoading}
                    disabled={!questionFileName}
                  >
                    {isLoading ? 'Đang xử lý...' : 'Tải lên & Kiểm tra'}
                  </Button>

                  {/* Library Button - Mobile/Tablet */}
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full lg:hidden"
                    onClick={handleOpenLibrary}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Kho đề có sẵn
                  </Button>

                  {questionFileName && (
                    <button
                      className="w-full text-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors py-2"
                      onClick={resetQuiz}
                    >
                      Xóa dữ liệu đã lưu
                    </button>
                  )}
                </div>
              </GlassCard>

              {/* Quick format guide - Desktop only */}
              <div className="hidden lg:block mt-6 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-[var(--color-accent-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-[var(--color-text-secondary)]">Format câu hỏi</span>
                </div>
                <pre className="text-xs text-[var(--color-text-muted)] font-mono bg-[var(--color-bg-primary)] p-3 rounded-xl overflow-x-auto">{`Câu 1: 2 + 2 = ?
*A. 3
*B. 4
C. 5
D. 6`}</pre>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AnimatedContainer>
  );

  const renderReviewState = () => (
    <AnimatedContainer key="review">
      <QuizEditor
        questions={editedQuestions}
        onUpdate={handleUpdateQuestions}
        onStartQuiz={handleStartQuiz}
        onCancel={handleCancelFromReview}
        onExport={handleExportQuiz}
        settings={quizSettings}
        onSettingsChange={setQuizSettings}
      />
    </AnimatedContainer>
  );

  const renderPlayingState = () => {
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === shuffledQuestions.length - 1;
    const isFirstQuestion = currentQuestionIndex === 0;
    const answeredCount = shuffledQuestions.filter((_, i) => isQuestionAnswered(i)).length;

    // Determine if current question should show instant result
    const currentAnswer = selectedAnswers[currentQuestionIndex];

    // Calculate question type flags
    const isMultiAnswerQuestion = currentQuestion?.type === 'multiple' && (
      (currentQuestion.maxCorrectAnswers && currentQuestion.maxCorrectAnswers > 1) ||
      (currentQuestion.options || []).filter(o => o.correct).length > 1
    );
    const isTrueFalseQuestion = currentQuestion?.type === 'truefalse-group';

    // Helper to count selected answers for multiple choice
    const getMultipleChoiceSelectedCount = (answer) => {
      if (!answer) return 0;
      return Array.isArray(answer) ? answer.length : 1;
    };

    // Helper to count answered statements for true/false
    const getTrueFalseAnsweredCount = (answer, statements) => {
      if (!statements || statements.length === 0) return 0;
      return statements.filter(s => answer?.[s.id] !== undefined).length;
    };

    // Determine if we should show instant results
    let shouldShowResult = false;
    if (quizSettings.showAnswerInstantly && currentAnswer !== undefined) {
      const hasAnswer = currentAnswer !== null && currentAnswer !== undefined;

      if (!hasAnswer) {
        shouldShowResult = false;
      } else if (isMultiAnswerQuestion) {
        // Multiple choice: evaluate when selected >= required (includes over-selection)
        const requiredAnswers = currentQuestion.maxCorrectAnswers ||
          (currentQuestion.options || []).filter(o => o.correct).length;
        const selectedCount = getMultipleChoiceSelectedCount(currentAnswer);
        shouldShowResult = selectedCount >= requiredAnswers;
      } else if (isTrueFalseQuestion) {
        // True/False: evaluate only when ALL statements are answered
        const totalStatements = (currentQuestion.statements || []).length;
        const answeredStatements = getTrueFalseAnsweredCount(currentAnswer, currentQuestion.statements);
        shouldShowResult = answeredStatements >= totalStatements && totalStatements > 0;
      } else {
        // Single-answer multiple choice: show immediately
        shouldShowResult = true;
      }
    }

    const sidebar = (
      <QuestionSidebar
        totalQuestions={shuffledQuestions.length}
        currentQuestion={currentQuestionIndex}
        answeredQuestions={answeredSet}
        onNavigate={setCurrentQuestionIndex}
      />
    );

    const header = (
      <QuizHeader
        title={questionFileName || 'Làm bài thi'}
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={shuffledQuestions.length}
        answeredCount={answeredCount}
        timer={null}
        onBack={resetQuiz}
        showBackButton={true}
      />
    );

    return (
      <QuizLayout
        sidebar={sidebar}
        header={header}
        className="quiz-playing-layout"
      >
        {/* Question Card */}
        <AnimatePresence mode="wait">
          <QuizCard
            key={currentQuestionIndex}
            question={currentQuestion}
            questionIndex={currentQuestionIndex}
            totalQuestions={shuffledQuestions.length}
            selectedAnswer={currentAnswer}
            showResult={shouldShowResult}
            isMultiSelect={isMultiAnswerQuestion}
            onSelectOption={handleSelectOption}
            onToggleOption={handleToggleOption}
            onSelectStatement={handleSelectStatement}
          />
        </AnimatePresence>

        {/* Bottom Navigation - Desktop only */}
        <BottomNavigation
          onPrev={handlePrev}
          onNext={handleNext}
          onSubmit={handleSubmit}
          isFirst={isFirstQuestion}
          isLast={isLastQuestion}
          canSubmit={allAnswered}
          submitLabel="Nộp bài"
        />

        {/* Mobile Navigation - Always visible on mobile */}
        <MobileNavigation
          onPrev={handlePrev}
          onNext={handleNext}
          onSubmit={handleSubmit}
          isFirst={isFirstQuestion}
          isLast={isLastQuestion}
          canSubmit={allAnswered}
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={shuffledQuestions.length}
          submitLabel="Nộp bài"
        />

        {/* Mobile Question Navigator Sheet - Expandable */}
        <MobileQuestionSheet
          totalQuestions={shuffledQuestions.length}
          currentQuestion={currentQuestionIndex}
          answeredQuestions={answeredSet}
          onNavigate={setCurrentQuestionIndex}
          isExpanded={mobileNavExpanded}
          onToggle={() => setMobileNavExpanded(!mobileNavExpanded)}
        />
      </QuizLayout>
    );
  };

  const renderResultsState = () => {
    const { correct, total, hasGrading } = calculateScore();

    return (
      <AnimatedContainer key="results">
        <div className="min-h-screen p-6 max-w-3xl mx-auto" style={{ paddingInline: 'clamp(12px, 2vw, 24px)' }}>
          {/* Score Card */}
          <ScoreCard
            correct={correct}
            total={total}
            hasGrading={hasGrading}
            className="mb-8"
          />

          {/* Results List */}
          <div className="space-y-4 mb-8">
            {shuffledQuestions.map((q, qIndex) => (
              <ResultItem
                key={qIndex}
                question={q}
                questionIndex={qIndex}
                selectedAnswer={selectedAnswers[qIndex]}
                hasGrading={hasGrading}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={resetQuiz}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Làm bài mới
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={() => handleStartQuiz(quizSettings)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm lại (xáo trộn lại)
            </Button>
          </div>
        </div>
      </AnimatedContainer>
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
