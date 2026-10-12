import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
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

  return (
    <div style={{ 
      maxWidth: 900, 
      margin: '0 auto', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 10 
    }}>
      {/* Ultra-Compact Top Header Bar */}
      <div className="card" style={{ padding: '10px 12px' }}>
        {/* Row 1: Back, Topic dropdown, Shuffle, Bookmark & Palette Drawer Button */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: 8, 
          marginBottom: 8 
        }}>
          <button
            onClick={onBackToHome}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 10px', flexShrink: 0 }}
            title="Quay lại trang chủ"
          >
            <ArrowLeft size={15} />
            <span style={{ fontSize: '0.8rem' }}>Về</span>
          </button>

          {/* Topic Select */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="input-text"
              style={{
                padding: '5px 8px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              <option value="all">Tất cả ({courseData.topics.flatMap(t => t.questions).length} câu)</option>
              {courseData.topics.map((t, idx) => (
                <option key={t.id} value={t.id}>
                  CĐ {idx + 1}: {t.title} ({t.questions.length} câu)
                </option>
              ))}
            </select>
          </div>

          {/* Shuffle Toggle */}
          <button
            className={`btn btn-sm ${isShuffle ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setIsShuffle(prev => !prev)}
            title="Đảo ngẫu nhiên thứ tự câu hỏi"
            style={{ padding: '6px 8px', flexShrink: 0 }}
          >
            <Shuffle size={14} />
          </button>

          {/* Palette Drawer Trigger */}
          <button
            className={`btn btn-sm ${showPalette ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setShowPalette(true)}
            style={{ padding: '6px 10px', flexShrink: 0 }}
            title="Mở bảng câu hỏi"
          >
            <Layers size={14} />
            <span style={{ fontSize: '0.8rem' }}>Bảng</span>
          </button>
        </div>

        {/* Row 2: Filter Chips, Auto-show Switch, and Question Counter */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: 6, 
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <button
              className={`nav-btn btn-sm ${filterMode === 'all' ? 'active' : ''}`}
              onClick={() => setFilterMode('all')}
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            >
              Tất cả
            </button>

            <button
              className={`nav-btn btn-sm ${filterMode === 'unanswered' ? 'active' : ''}`}
              onClick={() => setFilterMode('unanswered')}
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            >
              Chưa làm
            </button>

            <button
              className={`nav-btn btn-sm ${filterMode === 'wrong' ? 'active' : ''}`}
              onClick={() => setFilterMode('wrong')}
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            >
              Sai
            </button>

            <button
              className={`nav-btn btn-sm ${filterMode === 'bookmarked' ? 'active' : ''}`}
              onClick={() => setFilterMode('bookmarked')}
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            >
              Lưu ({studyProgress.bookmarkedQuestionIds.length})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            {/* Compact Auto-show Answer Switch */}
            <div
              onClick={handleToggleAutoShow}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
                userSelect: 'none',
                padding: '3px 7px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: autoShowAnswer ? 'var(--primary-light)' : 'var(--bg-card-subtle)',
                border: `1px solid ${autoShowAnswer ? 'var(--primary)' : 'var(--border-color)'}`,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: autoShowAnswer ? 'var(--primary)' : 'var(--text-secondary)'
              }}
              title="Tự động hiển thị kết quả đúng/sai ngay sau khi bạn hoàn thành lựa chọn"
            >
              <span>Hiện ĐA</span>
              <div style={{
                width: 26,
                height: 14,
                borderRadius: 8,
                backgroundColor: autoShowAnswer ? 'var(--primary)' : 'var(--border-subtle)',
                position: 'relative',
                transition: 'background-color 0.2s ease',
                flexShrink: 0
              }}>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  position: 'absolute',
                  top: 2,
                  left: autoShowAnswer ? 14 : 2,
                  transition: 'left 0.2s ease'
                }} />
              </div>
            </div>

            {/* Question Counter */}
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0 }}>
              {filteredQuestions.length > 0 ? (
                <span><strong>{currentIndex + 1}</strong>/{filteredQuestions.length}</span>
              ) : (
                <span>0 câu</span>
              )}
            </div>
          </div>
        </div>

        {/* Thin 3px Progress Line */}
        {filteredQuestions.length > 0 && (
          <div className="progress-bar-bg" style={{ marginTop: 8, height: 3 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 68 }}>
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

      {/* Sticky Bottom Thumb Navigation Bar */}
      {filteredQuestions.length > 0 && (
        <div className="sticky-study-bar">
          {/* Previous Question Button */}
          <button
            className="btn btn-secondary"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            style={{ padding: '8px 12px', minHeight: 44, flex: 1, justifyContent: 'center' }}
            aria-label="Câu trước"
          >
            <ChevronLeft size={18} />
            <span style={{ fontSize: '0.85rem' }}>Câu trước</span>
          </button>

          {/* Reset / Redo button if answered */}
          {currentAnswerRecord && currentAnswerRecord.answeredAt && (
            <button
              className="btn btn-secondary"
              onClick={handleResetCurrent}
              title="Làm lại câu này"
              aria-label="Làm lại câu này"
              style={{ minHeight: 44, width: 44, padding: 0, justifyContent: 'center' }}
            >
              <RotateCcw size={16} />
            </button>
          )}

          {/* Check / Toggle Answer Button */}
          <button
            className={`btn ${showAnswer ? 'btn-secondary' : 'btn-success'}`}
            onClick={() => setShowAnswer(prev => !prev)}
            style={{ padding: '8px 12px', minHeight: 44, flex: 1.2, justifyContent: 'center' }}
            aria-label={showAnswer ? 'Ẩn đáp án' : 'Kiểm tra đáp án'}
          >
            <CheckCircle size={16} />
            <span style={{ fontSize: '0.85rem' }}>{showAnswer ? 'Ẩn ĐA' : 'Kiểm tra'}</span>
          </button>

          {/* Next Question Button */}
          <button
            className="btn btn-secondary"
            onClick={handleNext}
            disabled={currentIndex === filteredQuestions.length - 1}
            style={{ padding: '8px 12px', minHeight: 44, flex: 1, justifyContent: 'center' }}
            aria-label="Câu sau"
          >
            <span style={{ fontSize: '0.85rem' }}>Câu sau</span>
            <ChevronRight size={18} />
          </button>
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
