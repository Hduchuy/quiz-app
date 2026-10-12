import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  Send, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Layers,
  Award
} from 'lucide-react';
import { CourseData, Question, ExamRecord, UserAnswerRecord } from '../types/quiz';
import { QuestionCard } from './QuestionCard';

interface ExamViewProps {
  courseData: CourseData;
  onFinishExam: (result: ExamRecord) => void;
  onCancelExam: () => void;
}

export const ExamView: React.FC<ExamViewProps> = ({
  courseData,
  onFinishExam,
  onCancelExam
}) => {
  // Configuration State
  const [examQuestionCount, setExamQuestionCount] = useState<number>(40);
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [isStarted, setIsStarted] = useState<boolean>(false);

  // Active Exam State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, UserAnswerRecord>>({});
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45 * 60);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showMobilePalette, setShowMobilePalette] = useState<boolean>(false);

  // Timer Ref
  const timerRef = useRef<any>(null);
  const examStartTimeRef = useRef<number>(0);

  // Start Exam: pick random questions and start countdown
  const startExam = () => {
    const allQuestions = courseData.topics.flatMap(t => t.questions);
    
    // Clean random shuffle
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(examQuestionCount, allQuestions.length));

    setQuestions(selected);
    setCurrentIndex(0);
    setUserAnswers({});
    setFlaggedIds([]);
    setSecondsRemaining(durationMinutes * 60);
    examStartTimeRef.current = Date.now();
    setIsStarted(true);
  };

  // Timer Countdown Effect
  useEffect(() => {
    if (!isStarted) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted]);

  // Submission Logic
  const handleAutoSubmit = () => {
    handleSubmitExam(true);
  };

  const handleSubmitExam = (isAuto: boolean = false) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const timeSpentSeconds = Math.round((Date.now() - examStartTimeRef.current) / 1000);
    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const topicBreakdown: Record<string, { total: number; correct: number }> = {};

    const detailedQuestions = questions.map(q => {
      if (!topicBreakdown[q.topicTitle]) {
        topicBreakdown[q.topicTitle] = { total: 0, correct: 0 };
      }
      topicBreakdown[q.topicTitle].total++;

      const ans = userAnswers[q.id];
      if (!ans) {
        unansweredCount++;
        return {
          question: q,
          userAnswer: {
            questionId: q.id,
            type: q.type,
            isCorrect: false,
            score: 0,
            answeredAt: new Date().toISOString()
          }
        };
      }

      const score = ans.score ?? (ans.isCorrect ? 1 : 0);
      totalScore += score;
      if (ans.isCorrect) {
        correctCount++;
        topicBreakdown[q.topicTitle].correct++;
      } else {
        incorrectCount++;
      }

      return {
        question: q,
        userAnswer: ans
      };
    });

    // Score on 10-point scale
    const finalScaledScore = questions.length > 0 ? (totalScore / questions.length) * 10 : 0;
    const percentage = questions.length > 0 ? Math.round((totalScore / questions.length) * 100) : 0;

    const examRecord: ExamRecord = {
      id: `exam_${Date.now()}`,
      date: new Date().toISOString(),
      timeSpentSeconds,
      totalQuestions: questions.length,
      correctCount,
      incorrectCount,
      unansweredCount,
      score: Number(finalScaledScore.toFixed(2)),
      percentage,
      topicBreakdown,
      questions: detailedQuestions
    };

    onFinishExam(examRecord);
  };

  const handleToggleFlag = (qId: string) => {
    setFlaggedIds(prev => 
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    );
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = questions.filter(q => {
    const ans = userAnswers[q.id];
    if (!ans) return false;
    if (q.type === 'single') return ans.selectedSingle !== undefined;
    if (q.type === 'multiple') return (ans.selectedMultiple || []).length > 0;
    if (q.type === 'true_false') return Object.keys(ans.selectedTrueFalse || {}).length > 0;
    if (q.type === 'matching') return Object.keys(ans.selectedMatching || {}).length > 0;
    return false;
  }).length;

  const unansweredCount = questions.length - answeredCount;

  // 1. Exam Configuration Screen
  if (!isStarted) {
    const totalBank = courseData.topics.flatMap(t => t.questions).length;

    return (
      <div style={{ maxWidth: 580, margin: '10px auto 0', width: '100%' }}>
        <div className="card" style={{ padding: '20px 16px' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10
            }}>
              <Clock size={24} />
            </div>

            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              Thi Thử Trắc Nghiệm
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Môn: <strong>{courseData.name}</strong> ({totalBank} câu trong ngân hàng)
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 22 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Số lượng câu hỏi trong đề:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[20, 30, 40, totalBank].map((count) => (
                  <button
                    key={count}
                    className={`btn btn-sm ${examQuestionCount === count ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setExamQuestionCount(count)}
                    style={{ padding: '8px 4px', fontSize: '0.8rem', justifyContent: 'center' }}
                  >
                    {count === totalBank ? `Tất cả (${totalBank})` : `${count} câu`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Thời gian làm bài:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    className={`btn btn-sm ${durationMinutes === mins ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setDurationMinutes(mins)}
                    style={{ padding: '8px 4px', fontSize: '0.8rem', justifyContent: 'center' }}
                  >
                    {mins} phút
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5
            }}>
              <strong style={{ color: 'var(--text-primary)' }}>Quy chế thi thử:</strong>
              <ul style={{ paddingLeft: 16, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <li>Hệ thống chọn ngẫu nhiên từ toàn bộ các chủ đề.</li>
                <li><strong>Không hiển thị đáp án trong lúc làm bài.</strong></li>
                <li>Tự động nộp bài khi hết giờ đếm ngược.</li>
                <li>Xem điểm thang 10 và xem lại đáp án sau khi nộp.</li>
              </ul>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-secondary"
              onClick={onCancelExam}
              style={{ flex: 1, padding: '10px 14px' }}
            >
              Hủy
            </button>

            <button
              className="btn btn-primary"
              onClick={startExam}
              style={{ flex: 2, padding: '10px 14px' }}
            >
              Bắt đầu làm bài
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Exam Interface
  const currentQ = questions[currentIndex];
  const isTimeCritical = secondsRemaining <= 300; // < 5 mins

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 1050, margin: '0 auto', width: '100%' }}>
      {/* Exam Header Bar with Countdown Timer */}
      <div className="card" style={{
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        position: 'sticky',
        top: 56,
        zIndex: 35,
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Left: Progress info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Thi thử
          </span>
          <span className="badge badge-primary" style={{ fontSize: '0.725rem', padding: '2px 6px' }}>
            {answeredCount}/{questions.length}
          </span>
        </div>

        {/* Center: Countdown Timer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 10px',
          borderRadius: 'var(--radius-xs)',
          backgroundColor: isTimeCritical ? 'var(--danger-light)' : 'var(--bg-card-subtle)',
          color: isTimeCritical ? 'var(--danger-text)' : 'var(--text-primary)',
          border: `1.5px solid ${isTimeCritical ? 'var(--danger-border)' : 'var(--border-color)'}`,
          fontWeight: 800,
          fontSize: '1rem'
        }}>
          <Clock size={15} className={isTimeCritical ? 'animate-pulse' : ''} />
          <span>{formatTime(secondsRemaining)}</span>
        </div>

        {/* Right: Drawer Palette Trigger & Submit Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowMobilePalette(true)}
            style={{ padding: '6px 8px' }}
            title="Mở bảng câu hỏi"
            aria-label="Mở bảng câu hỏi"
          >
            <Layers size={14} />
            <span style={{ fontSize: '0.8rem' }}>Bảng</span>
          </button>

          <button
            className="btn btn-success btn-sm"
            onClick={() => setShowSubmitModal(true)}
            style={{ padding: '6px 10px' }}
          >
            <Send size={14} />
            <span style={{ fontSize: '0.8rem' }}>Nộp bài</span>
          </button>
        </div>
      </div>

      {/* Main Exam Layout */}
      <div className="exam-layout-grid">
        {/* Current Question Area */}
        {currentQ && (
          <div className="study-question-scroll-wrapper">
            <QuestionCard
              question={currentQ}
              userAnswer={userAnswers[currentQ.id]}
              onAnswerChange={(rec) => {
                setUserAnswers(prev => ({ ...prev, [currentQ.id]: rec }));
              }}
              showResult={false}
              isBookmarked={flaggedIds.includes(currentQ.id)}
              onToggleBookmark={() => handleToggleFlag(currentQ.id)}
              questionIndex={currentIndex}
              totalQuestions={questions.length}
            />
          </div>
        )}

        {/* Right: Question Palette Sidebar (Visible on Desktop only) */}
        <div className="card exam-sidebar-desktop" style={{ padding: 14, position: 'sticky', top: 120 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
            Danh sách ({answeredCount}/{questions.length})
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 5,
            maxHeight: '52vh',
            overflowY: 'auto',
            paddingRight: 2
          }}>
            {questions.map((q, idx) => {
              const ans = userAnswers[q.id];
              let hasAnswer = false;
              if (ans) {
                if (q.type === 'single') hasAnswer = ans.selectedSingle !== undefined;
                else if (q.type === 'multiple') hasAnswer = (ans.selectedMultiple || []).length > 0;
                else if (q.type === 'true_false') hasAnswer = Object.keys(ans.selectedTrueFalse || {}).length > 0;
                else if (q.type === 'matching') hasAnswer = Object.keys(ans.selectedMatching || {}).length > 0;
              }

              const isCur = idx === currentIndex;
              const isFlag = flaggedIds.includes(q.id);

              let itemClass = 'palette-item';
              if (isCur) itemClass += ' current';
              if (hasAnswer) itemClass += ' answered';
              if (isFlag) itemClass += ' flagged';

              return (
                <div
                  key={q.id}
                  className={itemClass}
                  onClick={() => setCurrentIndex(idx)}
                >
                  {idx + 1}
                </div>
              );
            })}
          </div>

          <div style={{ 
            marginTop: 12, 
            borderTop: '1px solid var(--border-color)', 
            paddingTop: 10, 
            fontSize: '0.75rem', 
            color: 'var(--text-muted)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 5 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: 'var(--primary)' }} />
              <span>Đã làm ({answeredCount})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }} />
              <span>Chưa làm ({unansweredCount})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <span>Đánh dấu xem lại ({flaggedIds.length})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Thumb Bar during Exam */}
      {currentQ && (
        <div className="sticky-study-bar">
          <div className="sticky-study-bar-inner">
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              style={{ padding: '8px 10px', minHeight: 44, flex: '1 1 auto', justifyContent: 'center' }}
              aria-label="Câu trước"
            >
              <ChevronLeft size={18} />
              <span className="study-btn-text">Câu trước</span>
            </button>

            <button
              className={`btn ${flaggedIds.includes(currentQ.id) ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleToggleFlag(currentQ.id)}
              style={{ minHeight: 44, padding: '8px 10px', justifyContent: 'center', flex: '0 0 auto' }}
              title={flaggedIds.includes(currentQ.id) ? 'Bỏ cờ xem lại' : 'Gắn cờ xem lại'}
              aria-label="Đánh dấu câu này"
            >
              <Flag size={15} fill={flaggedIds.includes(currentQ.id) ? 'currentColor' : 'none'} />
              <span className="study-btn-text">{flaggedIds.includes(currentQ.id) ? 'Đã cờ' : 'Cờ'}</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => setShowMobilePalette(true)}
              style={{ minHeight: 44, padding: '8px 10px', justifyContent: 'center', flex: '0 0 auto' }}
              title="Mở bảng câu hỏi"
              aria-label="Mở bảng câu hỏi"
            >
              <Layers size={15} />
              <span className="study-btn-text">Bảng</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1}
              style={{ padding: '8px 10px', minHeight: 44, flex: '1 1 auto', justifyContent: 'center' }}
              aria-label="Câu tiếp theo"
            >
              <span className="study-btn-text">Câu sau</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheet Drawer for Question Palette */}
      {showMobilePalette && (
        <div className="bottom-sheet-overlay" onClick={() => setShowMobilePalette(false)}>
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
                  Bảng câu hỏi ({answeredCount}/{questions.length})
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Chạm vào số câu để chuyển nhanh
                </div>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowMobilePalette(false)}
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
                <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: 'var(--primary)' }} /> Đã làm ({answeredCount})
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }} /> Chưa làm ({unansweredCount})
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f59e0b' }} /> Cờ ({flaggedIds.length})
              </span>
            </div>

            {/* Grid of question buttons */}
            <div className="palette-grid" style={{ overflowY: 'auto', paddingRight: 2, maxHeight: '52vh' }}>
              {questions.map((q, idx) => {
                const ans = userAnswers[q.id];
                let hasAnswer = false;
                if (ans) {
                  if (q.type === 'single') hasAnswer = ans.selectedSingle !== undefined;
                  else if (q.type === 'multiple') hasAnswer = (ans.selectedMultiple || []).length > 0;
                  else if (q.type === 'true_false') hasAnswer = Object.keys(ans.selectedTrueFalse || {}).length > 0;
                  else if (q.type === 'matching') hasAnswer = Object.keys(ans.selectedMatching || {}).length > 0;
                }

                const isCur = idx === currentIndex;
                const isFlag = flaggedIds.includes(q.id);

                let itemClass = 'palette-item';
                if (isCur) itemClass += ' current';
                if (hasAnswer) itemClass += ' answered';
                if (isFlag) itemClass += ' flagged';

                return (
                  <div
                    key={q.id}
                    className={itemClass}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowMobilePalette(false);
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

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.05rem' }}>
                <AlertTriangle size={20} color="var(--warning)" />
                <span>Xác nhận nộp bài thi</span>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowSubmitModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 12 }}>
                Bạn có chắc chắn muốn kết thúc bài thi và xem kết quả ngay?
              </p>

              <div style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: unansweredCount > 0 ? 'var(--warning-light)' : 'var(--success-light)',
                border: `1.5px solid ${unansweredCount > 0 ? 'var(--warning-border)' : 'var(--success-border)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                  <span>Tổng số câu:</span>
                  <strong>{questions.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success-text)' }}>
                  <span>Số câu đã làm:</span>
                  <strong>{answeredCount}</strong>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  color: unansweredCount > 0 ? 'var(--danger-text)' : 'var(--text-muted)' 
                }}>
                  <span>Số câu chưa làm:</span>
                  <strong>{unansweredCount}</strong>
                </div>
              </div>

              {unansweredCount > 0 && (
                <div style={{ 
                  marginTop: 10, 
                  fontSize: '0.8rem', 
                  color: 'var(--danger-text)', 
                  fontWeight: 600 
                }}>
                  Lưu ý: Có {unansweredCount} câu chưa làm sẽ bị tính 0 điểm!
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowSubmitModal(false)}
                style={{ padding: '8px 14px' }}
              >
                Làm tiếp
              </button>

              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setShowSubmitModal(false);
                  handleSubmitExam(false);
                }}
                style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)', padding: '8px 16px' }}
              >
                Nộp bài thi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
