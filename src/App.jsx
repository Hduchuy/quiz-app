import { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import React from 'react';
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
  Badge,
  ErrorBoundary
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
// FormatGuide - Detailed documentation
// ============================================================================
function FormatGuide({ onBack }) {
  const sections = [
    {
      title: "1. Trắc nghiệm (SINGLE/MULTIPLE)",
      icon: "🎯",
      content: `[SINGLE]
Câu 1: Thủ đô của Việt Nam là gì?
A. Hải Phòng
*B. Hà Nội
C. Đà Nẵng

[MULTIPLE]
Câu 2: Các hành tinh nào thuộc hệ Mặt Trời?
*A. Trái Đất
*B. Sao Hỏa
C. Mặt Trăng
*D. Sao Mộc`
    },
    {
      title: "2. Đúng / Sai (TRUE_FALSE)",
      icon: "⚖️",
      content: `[TRUE_FALSE]
Câu 3: Kiến thức tổng hợp
1. Mặt trời mọc ở hướng Đông. [Đúng]
2. Cá voi là loài cá. [Sai]
3. Con người cần Oxy để sống. [Đúng]`
    },
    {
      title: "3. Ghép nối (MATCH)",
      icon: "🧩",
      content: `[MATCH]
Ghép nội dung phù hợp

LEFT:
1|Triết học Mác
2|Kinh tế chính trị Mác
3|Chủ nghĩa xã hội khoa học

RIGHT:
A|Giá trị thặng dư
B|Đấu tranh giai cấp
C|Thế giới quan khoa học
D|Phương pháp luận

CORRECT:
1=C,D
2=A
3=B`
    },
    {
      title: "4. Điền khuyết (CLOZE)",
      icon: "✏️",
      content: `[CLOZE]
TEXT:
Hà Nội là thủ đô của {{Việt Nam}} và nằm ở miền {{Bắc|miền Bắc}}.`
    }
  ];

  return (
    <AnimatedContainer>
      <div className="min-h-screen p-4 lg:p-8 max-w-5xl mx-auto flex flex-col gap-6">
        <header className="flex items-center gap-4">
          <Button variant="secondary" size="sm" onClick={onBack}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold text-gradient">Hướng dẫn Format chuẩn</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((s, idx) => (
            <GlassCard key={idx} padding="p-6" className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <h3 className="font-bold text-[var(--color-text-primary)]">{s.title}</h3>
              </div>
              <div className="relative group">
                <pre className="text-xs font-mono bg-[var(--color-bg-primary)] p-4 rounded-xl border border-[var(--color-border)] overflow-x-auto text-[var(--color-text-muted)] leading-relaxed">
                  {s.content}
                </pre>
                <button 
                  className="absolute top-2 right-2 p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    navigator.clipboard.writeText(s.content);
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </button>
              </div>
            </GlassCard>
          ))}
        </div>

        <div className="p-6 rounded-2xl bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/10 text-center">
          <p className="text-[var(--color-text-secondary)] italic">
            💡 Mẹo: Bạn có thể copy các mẫu trên vào file Word (.docx) hoặc Text (.txt) để upload trực tiếp.
          </p>
        </div>
      </div>
    </AnimatedContainer>
  );
}

// ============================================================================
// AIFormatGuide - AI Integration instructions
// ============================================================================
function AIFormatGuide({ onBack }) {
  return (
    <AnimatedContainer>
      <div className="min-h-screen p-4 lg:p-8 max-w-4xl mx-auto flex flex-col gap-8">
        <header className="flex items-center gap-4">
          <Button variant="secondary" size="sm" onClick={onBack}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold text-gradient">AI Format Rules</h1>
        </header>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <GlassCard padding="p-6 lg:p-10" className="space-y-8 max-w-none">
            <div className="flex items-center gap-4 text-cyan-400 border-b border-[var(--color-border)] pb-6">
              <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 flex items-center justify-center text-3xl shadow-inner">🤖</div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Quy tắc cho AI</h2>
                <p className="text-sm text-[var(--color-text-muted)] font-medium">Dành cho việc viết Prompt hoặc tích hợp API</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Nội dung Prompt chuẩn</span>
                <Button 
                  variant="secondary" 
                  size="xs" 
                  onClick={() => {
                    const text = document.getElementById('ai-prompt-text').innerText;
                    navigator.clipboard.writeText(text);
                  }}
                  className="text-[10px] h-7 px-3"
                >
                  Sao chép toàn bộ
                </Button>
              </div>
              
              <div 
                id="ai-prompt-text"
                className="bg-black/30 p-6 lg:p-8 rounded-2xl border border-[var(--color-border)] font-sans text-sm lg:text-base leading-relaxed text-cyan-50/90 whitespace-pre-wrap select-text selection:bg-cyan-500/30"
              >
{`Bạn là AI chuyển đổi đề bài sang format chuẩn cho Quiz App.
Nhiệm vụ của bạn là đọc toàn bộ nội dung file người dùng tải lên (.docx hoặc .txt), tự động hiểu loại câu hỏi mà người dùng đang sử dụng, sau đó CHUYỂN ĐỔI và CHUẨN HÓA toàn bộ về đúng format quy định dưới đây.

YÊU CẦU QUAN TRỌNG:

* Không được bỏ sót câu hỏi.
* Không tự ý thay đổi nội dung kiến thức.
* Chỉ chuẩn hóa cấu trúc và định dạng.
* Nếu đề bài lẫn nhiều loại câu hỏi khác nhau thì phải tự nhận diện và format đúng từng loại.
* Nếu phát hiện format cũ, format tự do, OCR lỗi nhẹ, ký hiệu khác nhau (A), A., A:, A -, ✓, x, True/False, Đúng/Sai...) thì phải tự hiểu và chuyển sang chuẩn mới.
* Xuất kết quả cuối cùng dưới dạng plain text sạch, không markdown code block.

==================================================
QUY ĐỊNH FORMAT QUIZ APP MỚI NHẤT
=================================

1. QUY TẮC CHUNG

* Mỗi câu hỏi bắt buộc bắt đầu bằng:
  [SINGLE]
  [MULTIPLE]
  [TRUE_FALSE]
  [MATCH]
  [CLOZE]

* Có thể thêm dòng trống giữa các câu hỏi.

* Không thêm giải thích ngoài nội dung đề.

==================================================
2. CÁC ĐỊNH DẠNG CÂU HỎI
========================

---

## A. SINGLE — Chọn 1 đáp án

Quy tắc:

* Chỉ có 1 đáp án đúng.
* Đáp án đúng thêm dấu * ngay đầu dòng.
* Đáp án bắt đầu bằng A., B., C., D....

Ví dụ chuẩn:

[SINGLE]
Thủ đô của Việt Nam là gì?
*A. Hà Nội
B. TP. Hồ Chí Minh
C. Đà Nẵng

---

## B. MULTIPLE — Chọn nhiều đáp án

Quy tắc:

* Có nhiều đáp án đúng.
* Mỗi đáp án đúng đều thêm dấu *.

Ví dụ chuẩn:

[MULTIPLE]
Những số nào là số chẵn?
*A. 2
*B. 4
C. 5
*D. 8

---

## C. TRUE_FALSE — Đúng/Sai

Quy tắc:

* Mỗi dòng là một mệnh đề.

* Cuối dòng phải có:
  [Đúng]
  hoặc
  [Sai]

* Chấp nhận chuyển đổi từ:
  [True]/[False]
  Đúng/Sai
  ✓/✗
  Yes/No
  và các biến thể tương tự.

Ví dụ chuẩn:

[TRUE_FALSE]
Kiểm tra kiến thức:

1. Trái đất hình tròn [Đúng]
2. Mặt trời quay quanh Trái đất [Sai]

---

## D. MATCH — Ghép nối

Bắt buộc gồm 4 phần:

LEFT:
RIGHT:
CORRECT:
DISTRACTOR: (không bắt buộc)

Quy tắc:

* LEFT chứa danh sách bên trái.
* RIGHT chứa danh sách bên phải.
* CORRECT định nghĩa cặp đúng.
* DISTRACTOR là đáp án nhiễu.

Ví dụ chuẩn:

[MATCH]
Hãy nối quốc gia với thủ đô:

LEFT:
1 : Việt Nam
2 : Nhật Bản

RIGHT:
A : Hà Nội
B : Tokyo

CORRECT:
1 => A
2 => B

DISTRACTOR:
X : Bangkok

---

## E. CLOZE — Điền khuyết

Quy tắc:

* Phải có nhãn:
  TEXT:

* Từ cần điền nằm trong:
  {{ }}

* Nhiều đáp án đúng dùng dấu:
  |

Ví dụ chuẩn:

[CLOZE]
TEXT:
Hà Nội là thủ đô của {{Việt Nam}} và nằm ở miền {{Bắc|miền Bắc}}.

==================================================
3. QUY TẮC TỰ NHẬN DIỆN LOẠI CÂU HỎI
====================================

* Nếu câu có radio/chỉ 1 đáp án đúng → [SINGLE]
* Nếu nhiều đáp án đúng → [MULTIPLE]
* Nếu là các mệnh đề đúng sai → [TRUE_FALSE]
* Nếu là nối cột A-B → [MATCH]
* Nếu có chỗ trống cần điền → [CLOZE]

==================================================
4. QUY TẮC CHUẨN HÓA
====================

* Xóa các tiền tố như:
  "Câu 1:"
  "Question 1:"
  "Bài 1:"
  nếu không cần thiết.

* Chuẩn hóa đáp án:
  A)
  A:
  A -
  => A.

* Dấu * phải dính sát:

- A. ❌
  *A. ✅

* Không giữ numbering thừa nếu không cần.

* Với CLOZE:

---

……
( )
=> chuyển thành:
{{đáp án}}

==================================================
5. OUTPUT CUỐI CÙNG
===================

* Chỉ trả về nội dung đã format chuẩn.
* Không thêm giải thích.
* Không thêm markdown.
* Không thêm nhận xét.
* Không thêm tiêu đề ngoài format quy định.`}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </AnimatedContainer>
  );
}

// ============================================================================
// FeatureCard - Small feature highlight card
// ============================================================================
function FeatureCard({ icon, title, description }) {
  return (
    <div className="p-3 lg:p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 transition-all duration-200 group">
      <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent-light)] mb-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="font-bold text-sm text-[var(--color-text-primary)] mb-1">{title}</div>
      <div className="text-xs text-[var(--color-text-muted)] line-clamp-1">{description}</div>
    </div>
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
  
  const navigate = useNavigate();
  const location = useLocation();

  const [questions, setQuestions] = useState([]);
  const [editedQuestions, setEditedQuestions] = useState([]);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
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
        mode: location.pathname,
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
    location.pathname,
    questionFileName,
    answerKeyFileName,
    quizSettings,
    showRestoreModal
  ]);

  // ==========================================================================
  // URL Validation effect
  // ==========================================================================
  useEffect(() => {
    if (!showRestoreModal && !libraryState.show && location.pathname !== '/') {
      // Allow editor to be empty if we are explicitly creating a new one
      if (location.pathname === '/editor' && (location.state?.createNew || questionFileName === 'Đề mới')) {
        return;
      }
      
      // If we are in quiz or result mode, we must have questions to show
      const hasData = (questions || []).length > 0 || 
                      (editedQuestions || []).length > 0 || 
                      (shuffledQuestions || []).length > 0;

      if (!hasData) {
        console.warn(`[Route Protection] No quiz data found for ${location.pathname}, redirecting to home.`);
        navigate('/');
      }
    }
  }, [location.pathname, questions, editedQuestions, shuffledQuestions, showRestoreModal, libraryState.show, navigate, location.state, questionFileName]);

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
      setQuizSettings(restored.quizSettings || DEFAULT_SETTINGS);
      
      const mode = restored.mode || '/';
      const path = mode === 'upload' ? '/' : (mode === 'review' ? '/editor' : (mode === 'playing' ? '/quiz' : (mode === 'results' ? '/result' : mode)));
      navigate(path);
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
          if (q.type === 'single' || q.type === 'multiple') {
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
          if (q.type === 'true_false') {
            return {
              ...q,
              statements: (q.statements || []).map((s, sIdx) => ({
                ...s,
                answer: answerKey[`${idx + 1}.${sIdx + 1}`]?.[0] === 'Đúng' ? true : (answerKey[`${idx + 1}.${sIdx + 1}`]?.[0] === 'Sai' ? false : null)
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
      navigate('/editor');
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
  const handleCreateNewQuiz = () => {
    setQuestions([]);
    setEditedQuestions([]);
    setQuestionFileName('Đề mới');
    setAnswerKeyFileName(null);
    navigate('/editor', { state: { createNew: true } });
  };

  const handleStartQuiz = (settings = DEFAULT_SETTINGS, overrideQuestions = null) => {
    const normalizedSettings = normalizeSettings(settings);
    const activeQuestions = overrideQuestions || editedQuestions;
    
    console.log("START QUIZ QUESTIONS:", activeQuestions?.length);
    console.log("OVERRIDE:", !!overrideQuestions);

    if (!activeQuestions || activeQuestions.length === 0) {
      console.warn('[handleStartQuiz] No questions to start with');
      return;
    }

    const prepared = prepareQuizWithSettings(activeQuestions, normalizedSettings);
    setShuffledQuestions(prepared);
    setQuizSettings(normalizedSettings);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    navigate('/quiz');
  };

  const handleUpdateQuestions = (updatedQuestions) => {
    setQuestions(updatedQuestions);
    setEditedQuestions(updatedQuestions);
  };

  const handleExportQuiz = (includeAnswers) => {
    const baseName = questionFileName 
      ? questionFileName.replace(/\.(docx|txt)$/i, '')
      : 'quiz';
    downloadQuiz(editedQuestions, includeAnswers, baseName);
  };

  const handleCancelFromReview = () => {
    navigate('/');
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
          if (q.type === 'single' || q.type === 'multiple') {
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
          if (q.type === 'true_false') {
            return {
              ...q,
              statements: (q.statements || []).map((s, sIdx) => ({
                ...s,
                answer: answerKey[`${idx + 1}.${sIdx + 1}`]?.[0] === 'Đúng' ? true : (answerKey[`${idx + 1}.${sIdx + 1}`]?.[0] === 'Sai' ? false : null)
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
      navigate('/editor');
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
    navigate('/');
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


  const handleSelectDragDrop = useCallback((targetId, answerId) => {
    setSelectedAnswers(prev => {
      const q = shuffledQuestions[currentQuestionIndex];
      const current = prev[currentQuestionIndex] || {};
      const newAnswers = { ...current };

      if (q.type === 'cloze' && q.fillMode === 'input') {
        // Direct text input
        newAnswers[targetId] = answerId;
      } else {
        // Remove the dragged answer from wherever it is currently
        for (const key in newAnswers) {
          if (Array.isArray(newAnswers[key])) {
            newAnswers[key] = newAnswers[key].filter(id => id !== answerId);
          }
        }

        if (targetId && targetId !== 'pool') {
          // Add to the new target
          if (!newAnswers[targetId]) {
            newAnswers[targetId] = [];
          }
          newAnswers[targetId].push(answerId);
        }
      }

      return {
        ...prev,
        [currentQuestionIndex]: newAnswers
      };
    });
  }, [currentQuestionIndex, shuffledQuestions]);

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
    navigate('/result');
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

      if (q.type === 'single' || q.type === 'multiple') {
        if (hasGrading) {
          total++;
          if (q.type === 'single') {
            const selectedOption = q.options.find(o => o.id === userAnswer);
            if (selectedOption?.correct === true) correct++;
          } else {
            const correctOptionIds = q.options.filter(o => o.correct).map(o => o.id);
            const selectedArray = Array.isArray(userAnswer) ? [...userAnswer].sort() : [];
            const correctArray = [...correctOptionIds].sort();
            if (selectedArray.length > 0 && JSON.stringify(selectedArray) === JSON.stringify(correctArray)) {
              correct++;
            }
          }
        }
      }

      if (q.type === 'true_false') {
        if (hasGrading) {
          total++;
          const allCorrect = (q.statements || []).every(s => userAnswer?.[s.id] === s.answer);
          if (allCorrect && (q.statements || []).length > 0) correct++;
        }
      }

      if (q.type === 'match') {
        if (hasGrading) {
          total++;
          const matches = q.correctMatches || {};
          const allCorrect = (q.targets || []).length > 0 && (q.targets || []).every(t => {
            const userArr = [...(userAnswer?.[t.id] || [])].sort();
            const correctArr = [...(matches[t.id] || [])].sort();
            return userArr.length > 0 && JSON.stringify(userArr) === JSON.stringify(correctArr);
          });
          if (allCorrect) correct++;
        }
      }

      if (q.type === 'cloze') {
        if (hasGrading) {
          total++;
          const blanks = (q.segments || []).filter(seg => seg.type === 'blank');
          const allCorrect = blanks.length > 0 && blanks.every(b => {
            const userStr = String(userAnswer?.[b.id] || '').toLowerCase().trim().replace(/\s+/g, ' ');
            const correctStrs = (b.answers || []).map(a => a.toLowerCase().trim().replace(/\s+/g, ' '));
            return correctStrs.includes(userStr);
          });
          if (allCorrect) correct++;
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
    if (q.type === 'single' || q.type === 'multiple') {
      return answer !== undefined && answer !== null && (q.type === 'single' || (Array.isArray(answer) && answer.length > 0));
    }
    if (q.type === 'true_false') {
      return (q.statements || []).length > 0 && q.statements.every(s => answer?.[s.id] !== undefined);
    }
    if (q.type === 'match') {
      const mappedCount = Object.values(answer || {}).flat().length;
      return mappedCount > 0;
    }
    if (q.type === 'cloze') {
      const blanks = (q.segments || []).filter(seg => seg.type === 'blank');
      return blanks.length > 0 && blanks.every(b => {
        const val = answer?.[b.id];
        return typeof val === 'string' && val.trim() !== '';
      });
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

              {/* Hero Actions - Desktop & Mobile */}
              <div className="flex flex-col gap-3 mt-8 w-full max-w-md">
                <motion.button
                  onClick={() => navigate('/format-guide')}
                  className="flex items-center gap-4 px-6 py-5 rounded-[24px] bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-accent)]/30 transition-all duration-200 group w-full min-h-[96px]"
                  whileHover={{ x: 6, backgroundColor: 'var(--color-surface-hover)' }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    📘
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg text-[var(--color-text-primary)]">Xem format câu hỏi</div>
                    <div className="text-sm text-[var(--color-text-muted)]">Hướng dẫn chuẩn nội dung</div>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => navigate('/ai-format')}
                  className="flex items-center gap-4 px-6 py-5 rounded-[24px] bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-cyan)]/30 transition-all duration-200 group w-full min-h-[96px]"
                  whileHover={{ x: 6, backgroundColor: 'var(--color-surface-hover)' }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-cyan)]/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    🤖
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg text-[var(--color-text-primary)]">Format AI viết lại</div>
                    <div className="text-sm text-[var(--color-text-muted)]">Tối ưu đề bằng AI</div>
                  </div>
                </motion.button>

                <motion.button
                  onClick={handleOpenLibrary}
                  className="flex items-center gap-4 px-6 py-5 rounded-[24px] bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/10 hover:border-[var(--color-accent)]/30 transition-all duration-200 group w-full min-h-[96px]"
                  whileHover={{ x: 6 }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)]/20 flex items-center justify-center text-[var(--color-accent-light)] group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg text-[var(--color-text-primary)]">Kho đề có sẵn</div>
                    <div className="text-sm text-[var(--color-text-muted)]">Khám phá các bài thi mẫu</div>
                  </div>
                </motion.button>
              </div>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full order-2 sm:order-1"
                      onClick={handleCreateNewQuiz}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      📄 Tạo đề từ đầu
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full order-1 sm:order-2"
                      onClick={handleUpload}
                      loading={isLoading}
                      disabled={!questionFileName}
                    >
                      {isLoading ? 'Đang xử lý...' : '📤 Upload file có sẵn'}
                    </Button>
                  </div>

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
      <ErrorBoundary>
        <QuizEditor
          questions={editedQuestions}
          onUpdate={handleUpdateQuestions}
          onStartQuiz={handleStartQuiz}
          onCancel={handleCancelFromReview}
          onExport={handleExportQuiz}
          settings={quizSettings}
          onSettingsChange={setQuizSettings}
        />
      </ErrorBoundary>
    </AnimatedContainer>
  );

  const renderPlayingState = () => {
    if (!shuffledQuestions || shuffledQuestions.length === 0) return null;
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    if (!currentQuestion) return null;

    const isLastQuestion = currentQuestionIndex === shuffledQuestions.length - 1;
    const isFirstQuestion = currentQuestionIndex === 0;
    const answeredCount = shuffledQuestions.filter((_, i) => isQuestionAnswered(i)).length;

    // Determine if current question should show instant result
    const currentAnswer = selectedAnswers[currentQuestionIndex];

    // Calculate question type flags
    const isMultiAnswerQuestion = currentQuestion?.type === 'multiple';
    const isTrueFalseQuestion = currentQuestion?.type === 'true_false';
    const isMatchingQuestion = currentQuestion?.type === 'match';
    const isClozeQuestion = currentQuestion?.type === 'cloze';

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

    // Helper to count matched targets for drag-and-drop
    const getMatchingAnsweredCount = (answer, targets) => {
      if (!targets || targets.length === 0) return 0;
      return targets.filter(t => answer?.[t.id] !== undefined).length;
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
      } else if (isMatchingQuestion) {
        // Matching: NEVER show instant results (use Show Answer button instead)
        shouldShowResult = false;
      } else if (isClozeQuestion) {
        // Cloze: NEVER show instant results
        shouldShowResult = false;
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
        footer={
          <BottomNavigation
            onPrev={handlePrev}
            onNext={handleNext}
            onSubmit={handleSubmit}
            isFirst={isFirstQuestion}
            isLast={isLastQuestion}
            canSubmit={allAnswered}
            submitLabel="Nộp bài"
          />
        }
        mobileNav={
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
        }
        mobileSheet={
          <MobileQuestionSheet
            totalQuestions={shuffledQuestions.length}
            currentQuestion={currentQuestionIndex}
            answeredQuestions={answeredSet}
            onNavigate={setCurrentQuestionIndex}
            isExpanded={mobileNavExpanded}
            onToggle={() => setMobileNavExpanded(!mobileNavExpanded)}
          />
        }
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
            onSelectDragDrop={handleSelectDragDrop}
          />
        </AnimatePresence>
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
            {(shuffledQuestions || []).map((q, qIndex) => (
              <ResultItem
                key={qIndex}
                question={q}
                questionIndex={qIndex}
                selectedAnswer={selectedAnswers?.[qIndex]}
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
        <ErrorBoundary>
          <RestoreSession
            savedAt={restoreData?.savedAt}
            onRestore={handleRestore}
            onDiscard={handleDiscard}
          />
        </ErrorBoundary>
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
      {!libraryState.show && (
        <Routes>
          <Route path="/" element={renderUploadState()} />
          <Route path="/editor" element={renderReviewState()} />
          <Route path="/quiz" element={renderPlayingState()} />
          <Route path="/result" element={renderResultsState()} />
          <Route path="/format-guide" element={<FormatGuide onBack={() => navigate('/')} />} />
          <Route path="/ai-format" element={<AIFormatGuide onBack={() => navigate('/')} />} />
          <Route path="*" element={renderUploadState()} />
        </Routes>
      )}
    </div>
  );
}

export default App;
