import React, { useState, useEffect } from 'react';
import { CourseData, StudyProgress, ExamRecord, UserAnswerRecord } from './types/quiz';
import { 
  loadCourseData, 
  saveCourseData, 
  loadStudyProgress, 
  recordQuestionAnswer, 
  toggleBookmarkQuestion, 
  loadExamHistory, 
  saveExamResult, 
  updateCourseName 
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
  const [currentView, setCurrentView] = useState<'home' | 'practice' | 'exam' | 'bank' | 'result'>('home');

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
  const [practiceTopicId, setPracticeTopicId] = useState<string | undefined>(undefined);
  const [practiceFilter, setPracticeFilter] = useState<'all' | 'wrong' | 'bookmarked'>('all');

  // Current result viewing state
  const [currentExamRecord, setCurrentExamRecord] = useState<ExamRecord | null>(null);

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

  const handleStartPractice = (topicId?: string, filterMode: 'all' | 'wrong' | 'bookmarked' = 'all') => {
    setPracticeTopicId(topicId);
    setPracticeFilter(filterMode);
    setCurrentView('practice');
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
    setCurrentView('result');
    showToast(`Đã nộp bài thi thành công! Điểm: ${result.score.toFixed(1)}/10`);
  };

  const handleRetryWrongQuestions = (questionIds: string[]) => {
    setPracticeTopicId('all');
    setPracticeFilter('wrong');
    setCurrentView('practice');
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
        setCurrentView={(v) => setCurrentView(v)}
        courseData={courseData}
        onUpdateCourseName={handleUpdateCourseName}
        themeMode={themeMode}
        onThemeChange={handleThemeChange}
      />

      {/* Main View Container */}
      <main className="main-content">
        {currentView === 'home' && (
          <HomeView
            courseData={courseData}
            studyProgress={studyProgress}
            examHistory={examHistory}
            onStartPractice={handleStartPractice}
            onStartExam={() => setCurrentView('exam')}
            onOpenBankManager={() => setCurrentView('bank')}
            onViewExamResult={(exam) => {
              setCurrentExamRecord(exam);
              setCurrentView('result');
            }}
          />
        )}

        {currentView === 'practice' && (
          <PracticeView
            courseData={courseData}
            studyProgress={studyProgress}
            initialTopicId={practiceTopicId}
            initialFilter={practiceFilter}
            onRecordAnswer={handleRecordAnswer}
            onToggleBookmark={handleToggleBookmark}
            onBackToHome={() => setCurrentView('home')}
          />
        )}

        {currentView === 'exam' && (
          <ExamView
            courseData={courseData}
            onFinishExam={handleFinishExam}
            onCancelExam={() => setCurrentView('home')}
          />
        )}

        {currentView === 'result' && currentExamRecord && (
          <ResultView
            examRecord={currentExamRecord}
            onRetryWrongQuestions={handleRetryWrongQuestions}
            onRetakeExam={() => setCurrentView('exam')}
            onBackToHome={() => setCurrentView('home')}
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

      {/* Mobile Bottom Navigation Bar */}
      <nav className="bottom-nav" aria-label="Điều hướng chính di động">
        <button
          className={`bottom-nav-item ${currentView === 'home' ? 'active' : ''}`}
          onClick={() => setCurrentView('home')}
        >
          <BookOpen size={20} />
          <span>Tổng quan</span>
        </button>

        <button
          className={`bottom-nav-item ${currentView === 'practice' ? 'active' : ''}`}
          onClick={() => setCurrentView('practice')}
        >
          <FileText size={20} />
          <span>Luyện tập</span>
        </button>

        <button
          className={`bottom-nav-item ${currentView === 'exam' || currentView === 'result' ? 'active' : ''}`}
          onClick={() => setCurrentView('exam')}
        >
          <GraduationCap size={20} />
          <span>Thi thử</span>
        </button>

        <button
          className={`bottom-nav-item ${currentView === 'bank' ? 'active' : ''}`}
          onClick={() => setCurrentView('bank')}
        >
          <Database size={20} />
          <span>Ngân hàng</span>
        </button>
      </nav>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '24px 20px',
        borderTop: '1px solid var(--border-color)',
        color: 'var(--text-subtle)',
        fontSize: '0.825rem',
        backgroundColor: 'var(--bg-surface)',
        transition: 'var(--transition-theme)'
      }}>
        Ứng dụng Ôn tập & Thi thử Trắc nghiệm Cá nhân • Hỗ trợ hoàn toàn Offline
      </footer>
    </div>
  );
};

export default App;
