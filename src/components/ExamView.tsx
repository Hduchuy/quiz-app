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
    
    // Deterministic or clean random shuffle
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
      // Initialize topic breakdown
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
      <div style={{ maxWidth: 640, margin: '20px auto 0', width: '100%' }}>
        <div className="card" style={{ padding: '36px 28px' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14
            }}>
              <Clock size={30} />
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              Thi Thử Trắc Nghiệm
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
              Môn học: <strong>{courseData.name}</strong> ({totalBank} câu trong ngân hàng)
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 30 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Số lượng câu hỏi trong đề:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[20, 30, 40, totalBank].map((count) => (
                  <button
                    key={count}
                    className={`btn ${examQuestionCount === count ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setExamQuestionCount(count)}
                  >
                    {count === totalBank ? `Tất cả (${totalBank})` : `${count} câu`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Thời gian làm bài:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    className={`btn ${durationMinutes === mins ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setDurationMinutes(mins)}
                  >
                    {mins} phút
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              padding: 16,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6
            }}>
              <strong style={{ color: 'var(--text-primary)' }}>Quy chế thi thử:</strong>
              <ul style={{ paddingLeft: 18, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>Hệ thống chọn ngẫu nhiên các câu hỏi từ toàn bộ các chủ đề.</li>
                <li><strong>Không hiển thị đáp án đúng hay kết quả trong suốt thời gian thi.</strong></li>
                <li>Tự động nộp bài khi hết thời gian đếm ngược.</li>
                <li>Xem ngay điểm số theo thang 10 và xem lại toàn bộ lời giải sau khi nộp bài.</li>
              </ul>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className="btn btn-secondary"
              onClick={onCancelExam}
              style={{ flex: 1 }}
            >
              Hủy & Quay lại
            </button>

            <button
              className="btn btn-primary btn-lg"
              onClick={startExam}
              style={{ flex: 2 }}
            >
              Bắt đầu tính giờ thi
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      {/* Exam Header Bar with Countdown Timer */}
      <div className="card" style={{
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        position: 'sticky',
        top: 60,
        zIndex: 35,
        boxShadow: 'var(--shadow-md)',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            Phòng Thi Thử
          </span>
          <span className="badge badge-primary">
            Đã làm: {answeredCount} / {questions.length}
          </span>
        </div>

        {/* Timer Box */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 14px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: isTimeCritical ? 'var(--danger-light)' : 'var(--bg-card-subtle)',
          color: isTimeCritical ? 'var(--danger-text)' : 'var(--text-primary)',
          border: `1.5px solid ${isTimeCritical ? 'var(--danger-border)' : 'var(--border-color)'}`,
          fontWeight: 800,
          fontSize: '1.15rem'
        }}>
          <Clock size={18} className={isTimeCritical ? 'animate-pulse' : ''} />
          <span>{formatTime(secondsRemaining)}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Mobile Palette Toggle Button */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowMobilePalette(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Layers size={15} />
            <span>Bảng câu ({answeredCount}/{questions.length})</span>
          </button>

          <button
            className="btn btn-success"
            onClick={() => setShowSubmitModal(true)}
          >
            <Send size={15} />
            <span>Nộp bài</span>
          </button>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(0, 1fr) 280px', 
        gap: 16,
        alignItems: 'start'
      }}>
        {/* Left: Current Question Area */}
        {currentQ && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

            {/* Navigation buttons */}
            <div className="card" style={{ 
              padding: '12px 18px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap'
            }}>
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={18} />
                <span>Câu trước</span>
              </button>

              <button
                className={`btn ${flaggedIds.includes(currentQ.id) ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => handleToggleFlag(currentQ.id)}
              >
                <Flag size={15} />
                <span>{flaggedIds.includes(currentQ.id) ? 'Đã gắn cờ xem lại' : 'Đánh dấu xem lại'}</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIndex === questions.length - 1}
              >
                <span>Câu tiếp theo</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Right: Question Palette sidebar (Desktop) */}
        <div className="card" style={{ padding: 18, position: 'sticky', top: 130 }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
            Danh sách câu hỏi ({answeredCount}/{questions.length})
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 6,
            maxHeight: '55vh',
            overflowY: 'auto',
            paddingRight: 4
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
            marginTop: 16, 
            borderTop: '1px solid var(--border-color)', 
            paddingTop: 12, 
            fontSize: '0.775rem', 
            color: 'var(--text-muted)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 6 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: 'var(--primary)' }} />
              <span>Đã làm ({answeredCount})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }} />
              <span>Chưa làm ({unansweredCount})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <span>Đánh dấu xem lại ({flaggedIds.length})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer/Modal for Question Palette */}
      {showMobilePalette && (
        <div className="modal-overlay" onClick={() => setShowMobilePalette(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title" style={{ fontSize: '1.1rem' }}>
                Bảng câu hỏi ({answeredCount}/{questions.length})
              </div>
              <button className="modal-close" onClick={() => setShowMobilePalette(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 8,
              maxHeight: '60vh',
              overflowY: 'auto',
              marginBottom: 16
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

            <button 
              className="btn btn-secondary" 
              style={{ width: '100%' }}
              onClick={() => setShowMobilePalette(false)}
            >
              Đóng bảng
            </button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={22} color="var(--warning)" />
                <span>Xác Nhận Nộp Bài Thi</span>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowSubmitModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 14 }}>
                Bạn có chắc chắn muốn kết thúc bài thi và nộp kết quả ngay bây giờ?
              </p>

              <div style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: unansweredCount > 0 ? 'var(--warning-light)' : 'var(--success-light)',
                border: `1.5px solid ${unansweredCount > 0 ? 'var(--warning-border)' : 'var(--success-border)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontSize: '0.9rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                  <span>Tổng số câu hỏi:</span>
                  <strong>{questions.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success-text)' }}>
                  <span>Số câu đã trả lời:</span>
                  <strong>{answeredCount} câu</strong>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  color: unansweredCount > 0 ? 'var(--danger-text)' : 'var(--text-muted)' 
                }}>
                  <span>Số câu còn bỏ trống:</span>
                  <strong>{unansweredCount} câu</strong>
                </div>
              </div>

              {unansweredCount > 0 && (
                <div style={{ 
                  marginTop: 12, 
                  fontSize: '0.85rem', 
                  color: 'var(--danger-text)', 
                  fontWeight: 600 
                }}>
                  Lưu ý: Bạn còn {unansweredCount} câu chưa trả lời. Những câu này sẽ bị tính là sai!
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowSubmitModal(false)}
              >
                Tiếp tục làm bài
              </button>

              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowSubmitModal(false);
                  handleSubmitExam(false);
                }}
                style={{ backgroundColor: 'var(--success)' }}
              >
                Xác nhận nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
