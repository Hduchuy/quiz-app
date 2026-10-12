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
      gap: 16 
    }}>
      {/* Top Header & Filter Controls Card */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: 12, 
          flexWrap: 'wrap', 
          marginBottom: 14 
        }}>
          <button
            onClick={onBackToHome}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={16} />
            <span>Trang chủ</span>
          </button>

          {/* Topic Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 220 }}>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="input-text"
              style={{
                padding: '6px 12px',
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            >
              <option value="all">Tất cả chủ đề ({courseData.topics.flatMap(t => t.questions).length} câu)</option>
              {courseData.topics.map((t, idx) => (
                <option key={t.id} value={t.id}>
                  Chủ đề {idx + 1}: {t.title.slice(0, 45)}... ({t.questions.length} câu)
                </option>
              ))}
            </select>
          </div>

          {/* Controls: Auto-Show Answer Toggle & Shuffle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Auto-show Answer Switch */}
            <div
              onClick={handleToggleAutoShow}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                userSelect: 'none',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: autoShowAnswer ? 'var(--primary-light)' : 'var(--bg-card-subtle)',
                border: `1.5px solid ${autoShowAnswer ? 'var(--primary)' : 'var(--border-color)'}`,
                fontSize: '0.825rem',
                fontWeight: 600,
                color: autoShowAnswer ? 'var(--primary)' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
              title="Tự động hiển thị kết quả đúng/sai ngay sau khi bạn hoàn thành lựa chọn"
            >
              <div style={{
                width: 32,
                height: 18,
                borderRadius: 10,
                backgroundColor: autoShowAnswer ? 'var(--primary)' : 'var(--border-subtle)',
                position: 'relative',
                transition: 'background-color 0.2s ease',
                flexShrink: 0
              }}>
                <div style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  position: 'absolute',
                  top: 2,
                  left: autoShowAnswer ? 16 : 2,
                  transition: 'left 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }} />
              </div>
              <span>Hiện đáp án: {autoShowAnswer ? 'Bật' : 'Tắt'}</span>
            </div>

            {/* Shuffle Toggle */}
            <button
              className={`btn btn-sm ${isShuffle ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setIsShuffle(prev => !prev)}
              title="Đảo ngẫu nhiên thứ tự câu hỏi"
            >
              <Shuffle size={14} />
              <span>Trộn</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs & Question Count */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 6, 
          flexWrap: 'wrap', 
          borderTop: '1px solid var(--border-color)', 
          paddingTop: 12 
        }}>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: 4 }}>
            Lọc:
          </span>
          
          <button
            className={`nav-btn btn-sm ${filterMode === 'all' ? 'active' : ''}`}
            onClick={() => setFilterMode('all')}
          >
            Tất cả
          </button>

          <button
            className={`nav-btn btn-sm ${filterMode === 'unanswered' ? 'active' : ''}`}
            onClick={() => setFilterMode('unanswered')}
          >
            Chưa làm
          </button>

          <button
            className={`nav-btn btn-sm ${filterMode === 'wrong' ? 'active' : ''}`}
            onClick={() => setFilterMode('wrong')}
          >
            Đã làm sai
          </button>

          <button
            className={`nav-btn btn-sm ${filterMode === 'bookmarked' ? 'active' : ''}`}
            onClick={() => setFilterMode('bookmarked')}
          >
            Đã lưu ({studyProgress.bookmarkedQuestionIds.length})
          </button>

          <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {filteredQuestions.length > 0 ? (
              <span>Câu <strong>{currentIndex + 1}</strong> / {filteredQuestions.length} ({progressPercent}%)</span>
            ) : (
              <span>0 câu</span>
            )}
          </div>
        </div>

        {/* Progress Bar under filters */}
        {filteredQuestions.length > 0 && (
          <div className="progress-bar-bg" style={{ marginTop: 10, height: 4 }}>
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </div>

      {/* Main Question Display Area */}
      {filteredQuestions.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
            Không có câu hỏi nào theo bộ lọc đã chọn
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: 20 }}>
            {filterMode === 'wrong'
              ? 'Tuyệt vời! Bạn chưa có câu nào làm sai hoặc đã ôn hết danh sách sai.'
              : filterMode === 'bookmarked'
              ? 'Bạn chưa đánh dấu câu hỏi nào. Nhấn biểu tượng bookmark trên góc câu hỏi để lưu lại.'
              : 'Hãy thử chọn chủ đề khác hoặc đổi bộ lọc.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setFilterMode('all')}
          >
            Xem tất cả câu hỏi
          </button>
        </div>
      ) : currentQuestion ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

          {/* Action Bar below Question Card */}
          <div className="card" style={{
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap'
          }}>
            {/* Navigation Buttons: Previous / Next */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary"
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={18} />
                <span>Câu trước</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={handleNext}
                disabled={currentIndex === filteredQuestions.length - 1}
              >
                <span>Câu sau</span>
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Redo, Check Answer & Palette Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleResetCurrent}
                title="Làm lại câu hỏi này"
              >
                <RotateCcw size={15} />
                <span>Làm lại</span>
              </button>

              <button
                className={`btn ${showAnswer ? 'btn-secondary' : 'btn-success'}`}
                onClick={() => setShowAnswer(prev => !prev)}
              >
                <CheckCircle size={16} />
                <span>{showAnswer ? 'Ẩn đáp án' : 'Kiểm tra đáp án'}</span>
              </button>

              <button
                className={`btn ${showPalette ? 'btn-primary' : 'btn-outline'} btn-sm`}
                onClick={() => setShowPalette(prev => !prev)}
              >
                <Layers size={15} />
                <span>{showPalette ? 'Đóng bảng' : 'Bảng câu hỏi'}</span>
              </button>
            </div>
          </div>

          {/* Collapsible Question Palette Grid */}
          {showPalette && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginBottom: 12 
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Bảng điều hướng nhanh ({filteredQuestions.length} câu):
                </div>
                <button
                  className="modal-close"
                  onClick={() => setShowPalette(false)}
                  title="Đóng bảng câu hỏi"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="palette-grid">
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
          )}
        </div>
      ) : null}
    </div>
  );
};
