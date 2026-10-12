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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Compact Mobile-First Hero Welcome Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '16px 18px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.25)'
      }}>
        {/* Subtle decorative glow */}
        <div style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            borderRadius: 16,
            backgroundColor: 'rgba(59, 130, 246, 0.25)',
            border: '1px solid rgba(59, 130, 246, 0.45)',
            color: '#93c5fd',
            fontSize: '0.75rem',
            fontWeight: 600,
            marginBottom: 8
          }}>
            <Sparkles size={12} />
            Hệ thống ôn thi cá nhân
          </div>

          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.3, marginBottom: 6 }}>
            {courseData.name}
          </h1>

          <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: 14, lineHeight: 1.45 }}>
            Ngân hàng <strong>{totalQuestions} câu</strong> • <strong>{courseData.topics.length} chủ đề</strong> trọng tâm. Tự động lưu tiến độ và thi thử tính giờ.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={() => onStartPractice()}
              style={{ boxShadow: '0 2px 10px rgba(37,99,235,0.4)', padding: '8px 16px' }}
            >
              <Play size={15} fill="#ffffff" />
              <span>Tiếp tục ôn tập</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={onStartExam}
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.12)', 
                color: '#ffffff', 
                borderColor: 'rgba(255,255,255,0.25)',
                padding: '8px 16px'
              }}
            >
              <Award size={15} />
              <span>Vào thi thử</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards (2x2 on mobile, 4 cols on desktop) */}
      <div className="home-stats-grid">
        {/* Stat 1: Progress */}
        <div className="card home-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tiến độ</span>
            <div style={{ 
              padding: 5, 
              borderRadius: 'var(--radius-xs)', 
              backgroundColor: 'var(--primary-light)', 
              color: 'var(--primary)' 
            }}>
              <BookOpen size={15} />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {progressPercent}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {answeredCount}/{totalQuestions} câu
          </div>
          <div className="progress-bar-bg" style={{ marginTop: 8, height: 4 }}>
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Stat 2: Accuracy */}
        <div className="card home-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Độ đúng</span>
            <div style={{ 
              padding: 5, 
              borderRadius: 'var(--radius-xs)', 
              backgroundColor: 'var(--success-light)', 
              color: 'var(--success)' 
            }}>
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {accuracyRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Đúng {correctCount} • Sai {wrongCount}
          </div>
          <div className="progress-bar-bg" style={{ marginTop: 8, height: 4 }}>
            <div 
              className="progress-bar-fill" 
              style={{ width: `${accuracyRate}%`, backgroundColor: 'var(--success)' }} 
            />
          </div>
        </div>

        {/* Stat 3: Recent Exam */}
        <div className="card home-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Điểm gần nhất</span>
            <div style={{ 
              padding: 5, 
              borderRadius: 'var(--radius-xs)', 
              backgroundColor: 'var(--warning-light)', 
              color: 'var(--warning)' 
            }}>
              <Award size={15} />
            </div>
          </div>
          <div style={{ 
            fontSize: '1.45rem', 
            fontWeight: 800, 
            color: latestExam ? 'var(--text-primary)' : 'var(--text-subtle)',
            lineHeight: 1.1 
          }}>
            {latestExam ? `${latestExam.score.toFixed(1)}` : 'Chưa thi'}
            {latestExam && <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>/10</span>}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {latestExam ? `${latestExam.correctCount}/${latestExam.totalQuestions} câu (${latestExam.percentage}%)` : 'Bấm thi thử để kiểm tra'}
          </div>
        </div>

        {/* Stat 4: Hard / Bookmarked */}
        <div className="card home-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Câu đã lưu</span>
            <div style={{ 
              padding: 5, 
              borderRadius: 'var(--radius-xs)', 
              backgroundColor: 'var(--warning-light)', 
              color: 'var(--warning)' 
            }}>
              <Bookmark size={15} />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {bookmarkedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
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
                  fontSize: '0.75rem'
                }}
              >
                Ôn ngay →
              </button>
            ) : 'Đánh dấu khi gặp câu khó'}
          </div>
        </div>
      </div>

      {/* Quick Access Shortcuts */}
      <div className="card" style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
          Lối tắt ôn tập nhanh
        </div>

        <div className="home-shortcuts-grid">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onStartPractice(undefined, 'all')}
          >
            <BookOpen size={15} />
            <span>Tất cả ({totalQuestions})</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onStartPractice(undefined, 'wrong')}
            disabled={wrongCount === 0}
            style={{
              borderColor: wrongCount > 0 ? 'var(--danger-border)' : undefined,
              color: wrongCount > 0 ? 'var(--danger-text)' : undefined,
              backgroundColor: wrongCount > 0 ? 'var(--danger-light)' : undefined
            }}
          >
            <XCircle size={15} />
            <span>Câu sai ({wrongCount})</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onStartPractice(undefined, 'bookmarked')}
            disabled={bookmarkedCount === 0}
          >
            <Bookmark size={15} />
            <span>Đã lưu ({bookmarkedCount})</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={onStartExam}
          >
            <Clock size={15} />
            <span>Thi thử 40 câu</span>
          </button>

          <button
            className="btn btn-outline btn-sm"
            onClick={onOpenBankManager}
            style={{ gridColumn: 'span 2' }}
          >
            <Database size={15} />
            <span>Quản lý ngân hàng & Đổi môn</span>
          </button>
        </div>
      </div>

      {/* Compact Topic List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Danh sách chủ đề ({courseData.topics.length})
          </h2>
          <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            Chạm vào chủ đề để ôn
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {courseData.topics.map((topic, idx) => {
            const topicQIds = new Set(topic.questions.map(q => q.id));
            const topicAnswered = answeredRecords.filter(r => topicQIds.has(r.questionId));
            const topicCorrect = topicAnswered.filter(r => r.isCorrect).length;
            const topicPercent = topic.questions.length > 0 ? Math.round((topicAnswered.length / topic.questions.length) * 100) : 0;
            const topicAcc = topicAnswered.length > 0 ? Math.round((topicCorrect / topicAnswered.length) * 100) : 0;

            return (
              <div
                key={topic.id}
                className="topic-card-compact"
                onClick={() => onStartPractice(topic.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onStartPractice(topic.id);
                  }
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                      CĐ {idx + 1}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {topic.questions.length} câu
                    </span>
                    {topicAnswered.length > 0 && (
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: topicAcc >= 70 ? 'var(--success)' : 'var(--warning)', 
                        fontWeight: 700,
                        marginLeft: 'auto'
                      }}>
                        Đúng {topicAcc}%
                      </span>
                    )}
                  </div>

                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 700, 
                    color: 'var(--text-primary)', 
                    marginBottom: 6, 
                    lineHeight: 1.35,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {topic.title}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div className="progress-bar-bg" style={{ height: 4 }}>
                        <div className="progress-bar-fill" style={{ width: `${topicPercent}%` }} />
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {topicAnswered.length}/{topic.questions.length} ({topicPercent}%)
                    </span>
                  </div>
                </div>

                <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', paddingLeft: 4 }}>
                  <ArrowRight size={18} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Exam History */}
      {examHistory.length > 0 && (
        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Lịch sử thi thử ({examHistory.length} bài)
            </h2>

            {examHistory.length > 3 && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowAllHistory(prev => !prev)}
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              >
                <span>{showAllHistory ? 'Thu gọn' : `Xem thêm (${examHistory.length - 3})`}</span>
                {showAllHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displayedHistory.map(exam => (
              <div
                key={exam.id}
                className="card card-hover"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-card-subtle)',
                  gap: 10
                }}
                onClick={() => onViewExamResult(exam)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: exam.score >= 8 ? 'var(--success-light)' : exam.score >= 5 ? 'var(--primary-light)' : 'var(--danger-light)',
                    color: exam.score >= 8 ? 'var(--success-text)' : exam.score >= 5 ? 'var(--primary-text)' : 'var(--danger-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1rem',
                    flexShrink: 0
                  }}>
                    {exam.score.toFixed(1)}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {exam.totalQuestions} câu • {exam.percentage}%
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {new Date(exam.date).toLocaleDateString('vi-VN')} {new Date(exam.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {Math.floor(exam.timeSpentSeconds / 60)}p {exam.timeSpentSeconds % 60}s
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '2px 5px' }}>✓{exam.correctCount}</span>
                  <span className="badge badge-danger" style={{ fontSize: '0.7rem', padding: '2px 5px' }}>✗{exam.incorrectCount}</span>
                  <ArrowRight size={14} color="var(--text-subtle)" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
