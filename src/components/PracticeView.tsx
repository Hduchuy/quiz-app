import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  RotateCcw, 
  CheckCircle, 
  Shuffle, 
  Bookmark, 
  Layers,
  ArrowLeft,
  X
} from 'lucide-react';
import { CourseData, Question, StudyProgress, UserAnswerRecord } from '../types/quiz';
import { QuestionCard } from './QuestionCard';

interface PracticeViewProps {
  courseData: CourseData;
  studyProgress: StudyProgress;
  initialTopicId?: string;
  initialFilter?: 'all' | 'wrong' | 'bookmarked';
  onRecordAnswer: (record: UserAnswerRecord) => void;
  onToggleBookmark: (qId: string) => void;
  onBackToHome: () => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  courseData,
  studyProgress,
  initialTopicId,
  initialFilter = 'all',
  onRecordAnswer,
  onToggleBookmark,
  onBackToHome
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId || 'all');
  const [filterMode, setFilterMode] = useState<'all' | 'unanswered' | 'wrong' | 'bookmarked'>(initialFilter);
  const [isShuffle, setIsShuffle] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  // Auto-show answer setting with persistent localStorage
  const [autoShowAnswer, setAutoShowAnswer] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('quiz_app_auto_show_answer');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const handleToggleAutoShow = () => {
    setAutoShowAnswer(prev => {
      const next = !prev;
      try {
        localStorage.setItem('quiz_app_auto_show_answer', String(next));
      } catch (_) {}
      return next;
    });
  };

  // Filter questions based on selection
  const filteredQuestions = useMemo(() => {
    let pool: Question[] = [];

    if (selectedTopicId === 'all') {
      pool = courseData.topics.flatMap(t => t.questions);
    } else {
      const topic = courseData.topics.find(t => t.id === selectedTopicId);
      pool = topic ? [...topic.questions] : [];
    }

    if (filterMode === 'unanswered') {
      pool = pool.filter(q => !studyProgress.answeredQuestions[q.id]);
    } else if (filterMode === 'wrong') {
      pool = pool.filter(q => {
        const ans = studyProgress.answeredQuestions[q.id];
        return ans && ans.isCorrect === false;
      });
    } else if (filterMode === 'bookmarked') {
      const bookmarkedSet = new Set(studyProgress.bookmarkedQuestionIds);
      pool = pool.filter(q => bookmarkedSet.has(q.id));
    }

    if (isShuffle) {
      const copy = [...pool];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    return pool;
  }, [courseData, selectedTopicId, filterMode, isShuffle, studyProgress]);

  // Reset index & answer view when question list changes
  useEffect(() => {
    setCurrentIndex(0);
    setShowAnswer(false);
  }, [selectedTopicId, filterMode]);

  const currentQuestion: Question | undefined = filteredQuestions[currentIndex];
  const currentAnswerRecord: UserAnswerRecord | undefined = currentQuestion
    ? studyProgress.answeredQuestions[currentQuestion.id]
    : undefined;

  const isCurrentBookmarked = currentQuestion
    ? studyProgress.bookmarkedQuestionIds.includes(currentQuestion.id)
    : false;

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowAnswer(false);
    }
  };

  const handleResetCurrent = () => {
    if (currentQuestion) {
      const emptyRecord: UserAnswerRecord = {
        questionId: currentQuestion.id,
        type: currentQuestion.type,
        answeredAt: new Date().toISOString()
      };
      onRecordAnswer(emptyRecord);
      setShowAnswer(false);
    }
  };

  const progressPercent = filteredQuestions.length > 0 
    ? Math.round(((currentIndex + 1) / filteredQuestions.length) * 100) 
    : 0;

  const currentTopic = courseData.topics.find(t => t.id === selectedTopicId);
  const totalBankQuestions = courseData.topics.flatMap(t => t.questions).length;
  const currentTopicFullTitle = selectedTopicId === 'all'
    ? `Tất cả chủ đề (${totalBankQuestions} câu)`
    : currentTopic
    ? `Chủ đề ${courseData.topics.indexOf(currentTopic) + 1}: ${currentTopic.title} (${currentTopic.questions.length} câu)`
    : 'Chọn chủ đề';

  return (
    <div style={{ 
      maxWidth: 900, 
      margin: '0 auto', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 10 
    }}>
      {/* Redesigned 3-Row Practice Header */}
      <div className="practice-header-card">
        {/* Hàng 1 — Điều hướng và công cụ */}
        <div className="practice-header-row-1">
          {/* Nút quay lại compact */}
          <button
            onClick={onBackToHome}
            className="practice-tool-btn"
            title="Quay lại trang chủ"
            aria-label="Quay lại trang chủ"
          >
            <ArrowLeft size={16} />
            <span>Về</span>
          </button>

          {/* Tên chủ đề trong vùng co giãn, một dòng, ellipsis khi quá dài */}
          <div className="practice-topic-selector" title={currentTopicFullTitle}>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="practice-topic-select"
              aria-label="Chọn chủ đề ôn tập"
            >
              <option value="all">Tất cả ({totalBankQuestions} câu)</option>
              {courseData.topics.map((t, idx) => (
                <option key={t.id} value={t.id}>
                  CĐ {idx + 1}: {t.title} ({t.questions.length} câu)
                </option>
              ))}
            </select>
            <div className="practice-topic-chevron" aria-hidden="true">
              <ChevronDown size={14} />
            </div>
          </div>

          {/* Nút trộn câu bằng icon */}
          <button
            className={`practice-tool-btn practice-icon-btn ${isShuffle ? 'btn-primary' : ''}`}
            onClick={() => setIsShuffle(prev => !prev)}
            title={isShuffle ? "Đang bật trộn ngẫu nhiên câu hỏi (bấm để tắt)" : "Trộn ngẫu nhiên thứ tự câu hỏi"}
            aria-label="Trộn câu hỏi"
          >
            <Shuffle size={15} />
          </button>

          {/* Nút mở bảng câu hỏi */}
          <button
            className={`practice-tool-btn ${showPalette ? 'btn-primary' : ''}`}
            onClick={() => setShowPalette(true)}
            title="Mở bảng danh sách câu hỏi"
            aria-label="Mở bảng câu hỏi"
          >
            <Layers size={15} />
            <span>Bảng</span>
          </button>
        </div>

        {/* Hàng 2 — Bộ lọc (cuộn ngang, không xuống dòng, hiển thị rõ active) */}
        <div className="practice-filter-row" role="tablist" aria-label="Bộ lọc câu hỏi">
          <button
            role="tab"
            aria-selected={filterMode === 'all'}
            className={`filter-chip ${filterMode === 'all' ? 'active' : ''}`}
            onClick={() => setFilterMode('all')}
          >
            Tất cả
          </button>

          <button
            role="tab"
            aria-selected={filterMode === 'unanswered'}
            className={`filter-chip ${filterMode === 'unanswered' ? 'active' : ''}`}
            onClick={() => setFilterMode('unanswered')}
          >
            Chưa làm
          </button>

          <button
            role="tab"
            aria-selected={filterMode === 'wrong'}
            className={`filter-chip ${filterMode === 'wrong' ? 'active' : ''}`}
            onClick={() => setFilterMode('wrong')}
          >
            Câu sai
          </button>

          <button
            role="tab"
            aria-selected={filterMode === 'bookmarked'}
            className={`filter-chip ${filterMode === 'bookmarked' ? 'active' : ''}`}
            onClick={() => setFilterMode('bookmarked')}
          >
            Đã lưu ({studyProgress.bookmarkedQuestionIds.length})
          </button>
        </div>

        {/* Hàng 3 — Cài đặt và tiến độ */}
        <div className="practice-meta-row">
          {/* Bên trái: Công tắc tự động hiển thị đáp án, nhãn ngắn gọn */}
          <div
            className={`auto-show-switch-btn ${autoShowAnswer ? 'active' : ''}`}
            onClick={handleToggleAutoShow}
            role="switch"
            aria-checked={autoShowAnswer}
            title="Tự động kiểm tra và hiển thị kết quả đúng/sai ngay sau khi bạn chọn"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleToggleAutoShow();
              }
            }}
          >
            <span>Hiện ĐA</span>
            <div className={`mini-toggle-pill ${autoShowAnswer ? 'active' : ''}`}>
              <div className="mini-toggle-thumb" />
            </div>
          </div>

          {/* Bên phải: Số câu hiện tại/tổng số câu */}
          <div className="practice-counter-badge">
            {filteredQuestions.length > 0 ? (
              <span>
                <strong>{currentIndex + 1}</strong>/{filteredQuestions.length}
              </span>
            ) : (
              <span>0 câu</span>
            )}
          </div>
        </div>

        {/* Bên dưới: Thanh tiến độ mảnh 3-4px */}
        {filteredQuestions.length > 0 && (
          <div className="progress-bar-bg practice-progress-line" aria-hidden="true">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </div>

      {/* Main Question Display Area */}
      {filteredQuestions.length === 0 ? (
        <div className="card" style={{ padding: '40px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            Không có câu hỏi nào theo bộ lọc đã chọn
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 16 }}>
            {filterMode === 'wrong'
              ? 'Tuyệt vời! Bạn chưa có câu nào làm sai hoặc đã ôn hết danh sách sai.'
              : filterMode === 'bookmarked'
              ? 'Bạn chưa đánh dấu câu hỏi nào. Nhấn biểu tượng bookmark trên góc câu hỏi để lưu lại.'
              : 'Hãy thử chọn chủ đề khác hoặc đổi bộ lọc.'}
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setFilterMode('all')}
          >
            Xem tất cả câu hỏi
          </button>
        </div>
      ) : currentQuestion ? (
        <div className="study-question-scroll-wrapper">
          {/* Question Card */}
          <QuestionCard
            question={currentQuestion}
            userAnswer={currentAnswerRecord}
            onAnswerChange={(rec) => {
              onRecordAnswer(rec);
            }}
            showResult={showAnswer}
            autoShowAnswer={autoShowAnswer}
            isBookmarked={isCurrentBookmarked}
            onToggleBookmark={() => onToggleBookmark(currentQuestion.id)}
            questionIndex={currentIndex}
            totalQuestions={filteredQuestions.length}
          />
        </div>
      ) : null}

      {/* Fixed Bottom Thumb Navigation Bar */}
      {filteredQuestions.length > 0 && (
        <div className="sticky-study-bar">
          <div className="sticky-study-bar-inner">
            {/* Previous Question Button */}
            <button
              className="btn btn-secondary"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              style={{ padding: '8px 10px', minHeight: 44, flex: '1 1 auto', justifyContent: 'center' }}
              aria-label="Câu trước"
            >
              <ChevronLeft size={18} />
              <span className="study-btn-text">Câu trước</span>
            </button>

            {/* Reset / Redo button if answered */}
            {currentAnswerRecord && currentAnswerRecord.answeredAt && (
              <button
                className="btn btn-secondary"
                onClick={handleResetCurrent}
                title="Làm lại câu này"
                aria-label="Làm lại câu này"
                style={{ minHeight: 44, width: 44, padding: 0, justifyContent: 'center', flexShrink: 0 }}
              >
                <RotateCcw size={16} />
              </button>
            )}

            {/* Check / Toggle Answer Button */}
            <button
              className={`btn ${showAnswer ? 'btn-secondary' : 'btn-success'}`}
              onClick={() => setShowAnswer(prev => !prev)}
              style={{ padding: '8px 10px', minHeight: 44, flex: '1.2 1 auto', justifyContent: 'center' }}
              aria-label={showAnswer ? 'Ẩn đáp án' : 'Kiểm tra đáp án'}
            >
              <CheckCircle size={16} />
              <span className="study-btn-text">{showAnswer ? 'Ẩn ĐA' : 'Kiểm tra'}</span>
            </button>

            {/* Next Question Button */}
            <button
              className="btn btn-secondary"
              onClick={handleNext}
              disabled={currentIndex === filteredQuestions.length - 1}
              style={{ padding: '8px 10px', minHeight: 44, flex: '1 1 auto', justifyContent: 'center' }}
              aria-label="Câu sau"
            >
              <span className="study-btn-text">Câu sau</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Question Palette Bottom Sheet Drawer */}
      {showPalette && (
        <div className="bottom-sheet-overlay" onClick={() => setShowPalette(false)}>
          <div className="bottom-sheet-content" onClick={e => e.stopPropagation()}>
            <div className="sheet-drag-handle" />

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: 10 
            }}>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Bảng câu hỏi ({filteredQuestions.length} câu)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Chạm vào số câu để chuyển nhanh
                </div>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowPalette(false)}
                title="Đóng bảng câu hỏi"
              >
                <X size={18} />
              </button>
            </div>

            {/* Status Legend */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '6px 0 10px',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: 10,
              fontSize: '0.75rem',
              color: 'var(--text-secondary)'
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: 'var(--success)' }} /> Đúng
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: 'var(--danger)' }} /> Sai
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }} /> Chưa làm
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f59e0b' }} /> Lưu
              </span>
            </div>

            {/* Palette Grid */}
            <div className="palette-grid" style={{ overflowY: 'auto', paddingRight: 2, maxHeight: '52vh' }}>
              {filteredQuestions.map((q, idx) => {
                const ans = studyProgress.answeredQuestions[q.id];
                const isCurrent = idx === currentIndex;
                const isBookmarked = studyProgress.bookmarkedQuestionIds.includes(q.id);

                let itemClass = 'palette-item';
                if (isCurrent) itemClass += ' current';
                if (ans && ans.isCorrect !== undefined) {
                  itemClass += ' answered';
                }
                if (isBookmarked) itemClass += ' flagged';

                return (
                  <div
                    key={q.id}
                    className={itemClass}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowAnswer(false);
                      setShowPalette(false);
                    }}
                    style={{
                      backgroundColor: ans?.isCorrect === true 
                        ? 'var(--success)' 
                        : ans?.isCorrect === false 
                        ? 'var(--danger)' 
                        : undefined,
                      color: ans ? '#ffffff' : undefined,
                      borderColor: ans ? 'transparent' : undefined
                    }}
                  >
                    {idx + 1}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
