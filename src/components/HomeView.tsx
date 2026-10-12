import React, { useState } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Award, 
  Bookmark, 
  Clock, 
  ArrowRight, 
  Play, 
  Sparkles, 
  Database,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CourseData, StudyProgress, ExamRecord } from '../types/quiz';

interface HomeViewProps {
  courseData: CourseData;
  studyProgress: StudyProgress;
  examHistory: ExamRecord[];
  onStartPractice: (topicId?: string, filterMode?: 'all' | 'wrong' | 'bookmarked') => void;
  onStartExam: () => void;
  onOpenBankManager: () => void;
  onViewExamResult: (exam: ExamRecord) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  courseData,
  studyProgress,
  examHistory,
  onStartPractice,
  onStartExam,
  onOpenBankManager,
  onViewExamResult
}) => {
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Aggregate statistics
  const allQuestions = courseData.topics.flatMap(t => t.questions);
  const totalQuestions = allQuestions.length;
  const answeredRecords = Object.values(studyProgress.answeredQuestions);
  const answeredCount = answeredRecords.length;

  const correctCount = answeredRecords.filter(r => r.isCorrect).length;
  const wrongCount = answeredRecords.filter(r => r.isCorrect === false).length;
  const accuracyRate = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const bookmarkedCount = studyProgress.bookmarkedQuestionIds.length;

  const latestExam = examHistory.length > 0 ? examHistory[0] : null;
  const displayedHistory = showAllHistory ? examHistory : examHistory.slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero Welcome Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '30px 24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.25)'
      }}>
        {/* Subtle decorative glow */}
        <div style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 680 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 20,
            backgroundColor: 'rgba(59, 130, 246, 0.25)',
            border: '1px solid rgba(59, 130, 246, 0.45)',
            color: '#93c5fd',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: 12
          }}>
            <Sparkles size={14} />
            Hệ thống ôn luyện thông minh
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, lineHeight: 1.3, marginBottom: 8 }}>
            {courseData.name}
          </h1>

          <p style={{ color: '#cbd5e1', fontSize: '0.925rem', marginBottom: 20, lineHeight: 1.55 }}>
            Ngân hàng câu hỏi gồm <strong>{totalQuestions} câu</strong> phân bổ qua{' '}
            <strong>{courseData.topics.length} chủ đề</strong> trọng tâm. Hỗ trợ ôn luyện từng phần, tự động kiểm tra và thi thử tính giờ.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => onStartPractice()}
              style={{ boxShadow: '0 4px 14px rgba(37,99,235,0.4)' }}
            >
              <Play size={18} fill="#ffffff" />
              <span>Tiếp tục ôn tập</span>
            </button>

            <button
              className="btn btn-secondary btn-lg"
              onClick={onStartExam}
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.12)', 
                color: '#ffffff', 
                borderColor: 'rgba(255,255,255,0.25)' 
              }}
            >
              <Award size={18} />
              <span>Vào thi thử</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid-cols-4">
        {/* Stat 1: Progress */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tiến độ hoàn thành</span>
            <div style={{ 
              padding: 7, 
              borderRadius: 'var(--radius-sm)', 
              backgroundColor: 'var(--primary-light)', 
              color: 'var(--primary)' 
            }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {progressPercent}%
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: 6 }}>
            Đã làm {answeredCount} / {totalQuestions} câu
          </div>
          <div className="progress-bar-bg" style={{ marginTop: 12 }}>
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Stat 2: Accuracy */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tỷ lệ trả lời đúng</span>
            <div style={{ 
              padding: 7, 
              borderRadius: 'var(--radius-sm)', 
              backgroundColor: 'var(--success-light)', 
              color: 'var(--success)' 
            }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {accuracyRate}%
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: 6 }}>
            Đúng {correctCount} • Sai {wrongCount} câu
          </div>
          <div className="progress-bar-bg" style={{ marginTop: 12 }}>
            <div 
              className="progress-bar-fill" 
              style={{ width: `${accuracyRate}%`, backgroundColor: 'var(--success)' }} 
            />
          </div>
        </div>

        {/* Stat 3: Recent Exam */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Điểm thi gần nhất</span>
            <div style={{ 
              padding: 7, 
              borderRadius: 'var(--radius-sm)', 
              backgroundColor: 'var(--warning-light)', 
              color: 'var(--warning)' 
            }}>
              <Award size={18} />
            </div>
          </div>
          <div style={{ 
            fontSize: '1.75rem', 
            fontWeight: 800, 
            color: latestExam ? 'var(--text-primary)' : 'var(--text-subtle)',
            lineHeight: 1.1 
          }}>
            {latestExam ? `${latestExam.score.toFixed(1)}` : 'Chưa thi'}
            {latestExam && <span style={{ fontSize: '1.05rem', color: 'var(--text-muted)', fontWeight: 600 }}> / 10</span>}
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: 6 }}>
            {latestExam ? `${latestExam.percentage}% (${latestExam.correctCount}/${latestExam.totalQuestions} câu)` : 'Hãy làm bài thi thử đầu tiên'}
          </div>
        </div>

        {/* Stat 4: Hard / Bookmarked */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Câu khó / Đã lưu</span>
            <div style={{ 
              padding: 7, 
              borderRadius: 'var(--radius-sm)', 
              backgroundColor: 'var(--warning-light)', 
              color: 'var(--warning)' 
            }}>
              <Bookmark size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {bookmarkedCount}
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: 6 }}>
            {bookmarkedCount > 0 ? (
              <button
                onClick={() => onStartPractice(undefined, 'bookmarked')}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--primary)', 
                  cursor: 'pointer', 
                  fontWeight: 600, 
                  padding: 0,
                  fontSize: '0.825rem'
                }}
              >
                Ôn các câu này ngay →
              </button>
            ) : 'Đánh dấu khi gặp câu khó'}
          </div>
        </div>
      </div>

      {/* Quick Access Shortcuts */}
      <div className="card" style={{ padding: '20px 22px' }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
          Lối tắt ôn tập nhanh
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button
            className="btn btn-secondary"
            onClick={() => onStartPractice(undefined, 'all')}
          >
            <BookOpen size={16} />
            <span>Luyện tất cả ({totalQuestions})</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => onStartPractice(undefined, 'wrong')}
            disabled={wrongCount === 0}
            style={{
              borderColor: wrongCount > 0 ? 'var(--danger-border)' : undefined,
              color: wrongCount > 0 ? 'var(--danger-text)' : undefined,
              backgroundColor: wrongCount > 0 ? 'var(--danger-light)' : undefined
            }}
          >
            <XCircle size={16} />
            <span>Luyện câu sai ({wrongCount})</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => onStartPractice(undefined, 'bookmarked')}
            disabled={bookmarkedCount === 0}
          >
            <Bookmark size={16} />
            <span>Câu đã đánh dấu ({bookmarkedCount})</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={onStartExam}
          >
            <Clock size={16} />
            <span>Thi thử 40 câu</span>
          </button>

          <button
            className="btn btn-outline"
            onClick={onOpenBankManager}
            style={{ marginLeft: 'auto' }}
          >
            <Database size={16} />
            <span>Quản lý ngân hàng & Đổi môn</span>
          </button>
        </div>
      </div>

      {/* Topic List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Danh sách chủ đề ôn thi
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Chọn từng chủ đề cụ thể để nắm chắc kiến thức trọng tâm
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {courseData.topics.map((topic, idx) => {
            const topicQIds = new Set(topic.questions.map(q => q.id));
            const topicAnswered = answeredRecords.filter(r => topicQIds.has(r.questionId));
            const topicCorrect = topicAnswered.filter(r => r.isCorrect).length;
            const topicPercent = topic.questions.length > 0 ? Math.round((topicAnswered.length / topic.questions.length) * 100) : 0;
            const topicAcc = topicAnswered.length > 0 ? Math.round((topicCorrect / topicAnswered.length) * 100) : 0;

            return (
              <div
                key={topic.id}
                className="card card-hover"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '18px 22px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span className="badge badge-primary">Chủ đề {idx + 1}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {topic.questions.length} câu hỏi
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.025rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, lineHeight: 1.45 }}>
                    {topic.title}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, maxWidth: 460 }}>
                    <div style={{ flex: 1 }}>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${topicPercent}%` }} />
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: 100 }}>
                      {topicAnswered.length}/{topic.questions.length} ({topicPercent}%)
                    </span>
                    {topicAnswered.length > 0 && (
                      <span style={{ 
                        fontSize: '0.8rem', 
                        color: topicAcc >= 70 ? 'var(--success)' : 'var(--warning)', 
                        fontWeight: 700 
                      }}>
                        Đúng {topicAcc}%
                      </span>
                    )}
                  </div>
                </div>

                <button
                  className="btn btn-outline"
                  onClick={() => onStartPractice(topic.id)}
                  style={{ flexShrink: 0 }}
                >
                  <span>Luyện tập</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Exam History */}
      {examHistory.length > 0 && (
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Lịch sử thi thử ({examHistory.length} bài thi)
            </h2>

            {examHistory.length > 3 && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowAllHistory(prev => !prev)}
              >
                <span>{showAllHistory ? 'Thu gọn' : `Xem thêm (${examHistory.length - 3})`}</span>
                {showAllHistory ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayedHistory.map(exam => (
              <div
                key={exam.id}
                className="card card-hover"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-card-subtle)',
                  flexWrap: 'wrap',
                  gap: 12
                }}
                onClick={() => onViewExamResult(exam)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: exam.score >= 8 ? 'var(--success-light)' : exam.score >= 5 ? 'var(--primary-light)' : 'var(--danger-light)',
                    color: exam.score >= 8 ? 'var(--success-text)' : exam.score >= 5 ? 'var(--primary-text)' : 'var(--danger-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    flexShrink: 0
                  }}>
                    {exam.score.toFixed(1)}
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                      Đề {exam.totalQuestions} câu • {exam.percentage}% chính xác
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(exam.date).toLocaleString('vi-VN')} • Thời gian: {Math.floor(exam.timeSpentSeconds / 60)}p {exam.timeSpentSeconds % 60}s
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 8, fontSize: '0.85rem' }}>
                    <span className="badge badge-success">✓ {exam.correctCount}</span>
                    <span className="badge badge-danger">✗ {exam.incorrectCount}</span>
                  </div>
                  <ArrowRight size={16} color="var(--text-subtle)" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
