import React, { useState, useEffect } from 'react';
import { CourseData, StudyProgress, ExamRecord, UserAnswerRecord, ExamRetrySession, PracticeFilterMode } from './types/quiz';
import { 
  loadCourseData, 
  saveCourseData, 
  loadStudyProgress, 
  saveStudyProgress,
  recordQuestionAnswer, 
  toggleBookmarkQuestion, 
  loadExamHistory, 
  saveExamResult, 
  updateCourseName,
  loadExamRetrySession,
  saveExamRetrySession
} from './utils/storage';
import { 
  ThemeMode, 
  getSavedTheme, 
  saveTheme, 
  applyTheme, 
  initThemeListener 
} from './utils/theme';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { PracticeView } from './components/PracticeView';
import { ExamView } from './components/ExamView';
import { ResultView } from './components/ResultView';
import { BankManagerView } from './components/BankManagerView';
import { BookOpen, FileText, GraduationCap, Database } from 'lucide-react';

export const App: React.FC = () => {
  const [courseData, setCourseData] = useState<CourseData>(() => loadCourseData());
  const [studyProgress, setStudyProgress] = useState<StudyProgress>(() => loadStudyProgress());
  const [examHistory, setExamHistory] = useState<ExamRecord[]>(() => loadExamHistory());
  const [currentView, setCurrentView] = useState<'home' | 'practice' | 'exam' | 'bank' | 'result'>(() => {
    try {
      const saved = localStorage.getItem('quiz_app_current_view');
      if (saved === 'home' || saved === 'practice' || saved === 'exam' || saved === 'bank' || saved === 'result') {
        return saved;
      }
    } catch (_) {}
    return 'home';
  });

  const navigateToView = (view: 'home' | 'practice' | 'exam' | 'bank' | 'result') => {
    setCurrentView(view);
    try {
      localStorage.setItem('quiz_app_current_view', view);
    } catch (_) {}
  };

  // Theme state
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = getSavedTheme();
    applyTheme(saved);
    return saved;
  });

  useEffect(() => {
    applyTheme(themeMode);
    const unbind = initThemeListener();
    return () => unbind();
  }, [themeMode]);

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    saveTheme(mode);
    applyTheme(mode);
  };

  // Practice navigation state
  const [practiceTopicId, setPracticeTopicId] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem('quiz_app_practice_topic') || undefined;
    } catch {
      return undefined;
    }
  });

  const [practiceFilter, setPracticeFilter] = useState<PracticeFilterMode>(() => {
    try {
      const saved = localStorage.getItem('quiz_app_practice_filter');
      if (saved === 'all' || saved === 'unanswered' || saved === 'wrong' || saved === 'bookmarked' || saved === 'exam_wrong') {
        return saved as PracticeFilterMode;
      }
    } catch {}
    return 'all';
  });

  // Current result viewing state
  const [currentExamRecord, setCurrentExamRecord] = useState<ExamRecord | null>(() => {
    try {
      const savedId = localStorage.getItem('quiz_app_current_exam_id');
      const history = loadExamHistory();
      if (savedId) {
        const found = history.find(e => e.id === savedId);
        if (found) return found;
      }
      return history[0] || null;
    } catch (_) {}
    return null;
  });

  // Active retry session state
  const [retryExamSession, setRetryExamSession] = useState<ExamRetrySession | null>(() => loadExamRetrySession());

  // Notification Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Handlers
  const handleUpdateCourseName = (newName: string) => {
    const updated = updateCourseName(newName);
    setCourseData(updated);
    showToast(`Đã đổi tên môn học thành: "${newName}"`);
  };

  const handleStartPractice = (topicId?: string, filterMode: PracticeFilterMode = 'all') => {
    setPracticeTopicId(topicId);
    setPracticeFilter(filterMode);
    navigateToView('practice');
    try {
      localStorage.setItem('quiz_app_practice_filter', filterMode);
      if (topicId) localStorage.setItem('quiz_app_practice_topic', topicId);
      else localStorage.removeItem('quiz_app_practice_topic');
    } catch (_) {}
  };

  const handleRecordAnswer = (rec: UserAnswerRecord) => {
    const updated = recordQuestionAnswer(rec);
    setStudyProgress({ ...updated });
  };

  const handleToggleBookmark = (qId: string) => {
    const updated = toggleBookmarkQuestion(qId);
    setStudyProgress({ ...updated });
  };

  const handleFinishExam = (result: ExamRecord) => {
    const updatedHistory = saveExamResult(result);
    setExamHistory(updatedHistory);
    setCurrentExamRecord(result);
    try {
      localStorage.setItem('quiz_app_current_exam_id', result.id);
    } catch (_) {}
    navigateToView('result');
    showToast(`Đã nộp bài thi thành công! Điểm: ${result.score.toFixed(1)}/10`);
  };

  const handleRetryWrongQuestions = (questionIds: string[]) => {
    const uniqueIds = Array.from(new Set(questionIds.filter(Boolean)));
    if (uniqueIds.length === 0) {
      showToast('Không có câu hỏi sai nào để luyện lại.', 'error');
      return;
    }

    // Reset answer state in studyProgress ONLY for these specific wrong questions
    // so the user starts with a clean attempt for this retry session
    const currentProgress = loadStudyProgress();
    let progressModified = false;
    uniqueIds.forEach(id => {
      if (currentProgress.answeredQuestions[id]) {
        delete currentProgress.answeredQuestions[id];
        progressModified = true;
      }
    });
    if (progressModified) {
      saveStudyProgress(currentProgress);
      setStudyProgress({ ...currentProgress });
    }

    const examId = currentExamRecord?.id || `exam_${Date.now()}`;
    const session: ExamRetrySession = {
      examId,
      questionIds: uniqueIds,
      timestamp: Date.now()
    };
    saveExamRetrySession(session);
    setRetryExamSession(session);

    setPracticeTopicId('all');
    setPracticeFilter('exam_wrong');
    navigateToView('practice');
    try {
      localStorage.setItem('quiz_app_practice_filter', 'exam_wrong');
      localStorage.setItem('quiz_app_practice_topic', 'all');
    } catch (_) {}

    showToast(`Bắt đầu luyện lại ${uniqueIds.length} câu sai từ bài thi!`);
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 76,
          right: 20,
          zIndex: 100,
          padding: '12px 20px',
          borderRadius: 10,
          backgroundColor: toast.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '0.9rem',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={(v) => navigateToView(v)}
        courseData={courseData}
        onUpdateCourseName={handleUpdateCourseName}
        themeMode={themeMode}
        onThemeChange={handleThemeChange}
      />

      {/* Main View Container */}
      <main className={`main-content ${currentView === 'practice' || currentView === 'exam' ? 'study-mode' : ''}`}>
        {currentView === 'home' && (
          <HomeView
            courseData={courseData}
            studyProgress={studyProgress}
            examHistory={examHistory}
            onStartPractice={handleStartPractice}
            onStartExam={() => navigateToView('exam')}
            onOpenBankManager={() => navigateToView('bank')}
            onViewExamResult={(exam) => {
              setCurrentExamRecord(exam);
              try {
                localStorage.setItem('quiz_app_current_exam_id', exam.id);
              } catch (_) {}
              navigateToView('result');
            }}
          />
        )}

        {currentView === 'practice' && (
          <PracticeView
            courseData={courseData}
            studyProgress={studyProgress}
            initialTopicId={practiceTopicId}
            initialFilter={practiceFilter}
            retryQuestionIds={retryExamSession?.questionIds}
            onRecordAnswer={handleRecordAnswer}
            onToggleBookmark={handleToggleBookmark}
            onBackToHome={() => navigateToView('home')}
          />
        )}

        {currentView === 'exam' && (
          <ExamView
            courseData={courseData}
            onFinishExam={handleFinishExam}
            onCancelExam={() => navigateToView('home')}
          />
        )}

        {currentView === 'result' && currentExamRecord && (
          <ResultView
            examRecord={currentExamRecord}
            onRetryWrongQuestions={handleRetryWrongQuestions}
            onRetakeExam={() => navigateToView('exam')}
            onBackToHome={() => navigateToView('home')}
          />
        )}

        {currentView === 'bank' && (
          <BankManagerView
            courseData={courseData}
            onUpdateCourse={(updated) => {
              setCourseData(updated);
              saveCourseData(updated);
            }}
            onNotify={showToast}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Hidden during practice and exam sessions to prioritize thumb controls) */}
      {currentView !== 'practice' && currentView !== 'exam' && (
        <nav className="bottom-nav" aria-label="Điều hướng chính di động">
          <button
            className={`bottom-nav-item ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => navigateToView('home')}
          >
            <BookOpen size={20} />
            <span>Trang chủ</span>
          </button>

          <button
            className="bottom-nav-item"
            onClick={() => navigateToView('practice')}
          >
            <FileText size={20} />
            <span>Luyện tập</span>
          </button>

          <button
            className={`bottom-nav-item ${currentView === 'result' ? 'active' : ''}`}
            onClick={() => navigateToView('exam')}
          >
            <GraduationCap size={20} />
            <span>Thi thử</span>
          </button>

          <button
            className={`bottom-nav-item ${currentView === 'bank' ? 'active' : ''}`}
            onClick={() => navigateToView('bank')}
          >
            <Database size={20} />
            <span>Ngân hàng</span>
          </button>
        </nav>
      )}

      {/* Footer (Hidden during study/exam mode) */}
      {currentView !== 'practice' && currentView !== 'exam' && (
        <footer style={{
          textAlign: 'center',
          padding: '18px 16px calc(18px + var(--safe-bottom))',
          borderTop: '1px solid var(--border-color)',
          color: 'var(--text-subtle)',
          fontSize: '0.8rem',
          backgroundColor: 'var(--bg-surface)',
          transition: 'var(--transition-theme)'
        }}>
          Ứng dụng Ôn tập & Thi thử Trắc nghiệm Cá nhân • Hỗ trợ hoàn toàn Offline
        </footer>
      )}
    </div>
  );
};

export default App;
