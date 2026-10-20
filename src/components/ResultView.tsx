import React, { useState } from 'react';
import { 
  Award, 
  RotateCcw, 
  ArrowLeft
} from 'lucide-react';
import { ExamRecord } from '../types/quiz';
import { QuestionCard } from './QuestionCard';

interface ResultViewProps {
  examRecord: ExamRecord;
  onRetryWrongQuestions: (questionIds: string[]) => void;
  onRetakeExam: () => void;
  onBackToHome: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  examRecord,
  onRetryWrongQuestions,
  onRetakeExam,
  onBackToHome
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'wrong' | 'correct'>('all');

  const wrongQuestionIds = Array.from(
    new Set(
      examRecord.questions
        .filter(item => !item.userAnswer.isCorrect && item.question?.id)
        .map(item => item.question.id)
    )
  );

  const filteredQuestions = examRecord.questions.filter(item => {
    if (filterMode === 'wrong') return !item.userAnswer.isCorrect;
    if (filterMode === 'correct') return item.userAnswer.isCorrect;
    return true;
  });

  const getRating = (score: number) => {
    if (score >= 9.0) return { label: 'Xuất sắc', color: 'var(--success-text)', bg: 'var(--success-light)', border: 'var(--success-border)' };
    if (score >= 8.0) return { label: 'Giỏi', color: 'var(--primary-text)', bg: 'var(--primary-light)', border: 'var(--primary-border)' };
    if (score >= 6.5) return { label: 'Khá', color: 'var(--primary-text)', bg: 'var(--primary-light)', border: 'var(--primary-border)' };
    if (score >= 5.0) return { label: 'Trung bình', color: 'var(--warning-text)', bg: 'var(--warning-light)', border: 'var(--warning-border)' };
    return { label: 'Cần ôn thêm', color: 'var(--danger-text)', bg: 'var(--danger-light)', border: 'var(--danger-border)' };
  };

  const rating = getRating(examRecord.score);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Navigation Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <button className="btn btn-secondary btn-sm" onClick={onBackToHome}>
          <ArrowLeft size={16} />
          <span>Về trang chủ</span>
        </button>

        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Thời gian thi: {new Date(examRecord.date).toLocaleString('vi-VN')}
        </span>
      </div>

      {/* Primary Score Board */}
      <div className="card" style={{ padding: '20px 16px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          padding: '4px 14px',
          borderRadius: 20,
          backgroundColor: rating.bg,
          color: rating.color,
          border: `1px solid ${rating.border}`,
          fontWeight: 700,
          fontSize: '0.85rem',
          marginBottom: 10
        }}>
          Kết quả: {rating.label}
        </div>

        <div style={{ fontSize: '2.75rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
          {examRecord.score.toFixed(1)}
          <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}> / 10</span>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 8 }}>
          Đạt: <strong>{examRecord.percentage}%</strong> • Làm bài: <strong>{Math.floor(examRecord.timeSpentSeconds / 60)}p {examRecord.timeSpentSeconds % 60}s</strong>
        </p>

        {/* 4 Stat Badges (2x2 on mobile, 4 on desktop) */}
        <div className="exam-stats-summary-grid" style={{ maxWidth: 600, margin: '16px auto 0' }}>
          <div style={{ 
            padding: '8px 10px', 
            borderRadius: 'var(--radius-md)', 
            backgroundColor: 'var(--bg-card-subtle)', 
            border: '1px solid var(--border-color)' 
          }}>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tổng câu</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>{examRecord.totalQuestions}</div>
          </div>

          <div style={{ 
            padding: '8px 10px', 
            borderRadius: 'var(--radius-md)', 
            backgroundColor: 'var(--success-light)', 
            border: '1px solid var(--success-border)' 
          }}>
            <div style={{ fontSize: '0.725rem', color: 'var(--success-text)', fontWeight: 600 }}>Đúng</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--success)' }}>{examRecord.correctCount}</div>
          </div>

          <div style={{ 
            padding: '8px 10px', 
            borderRadius: 'var(--radius-md)', 
            backgroundColor: 'var(--danger-light)', 
            border: '1px solid var(--danger-border)' 
          }}>
            <div style={{ fontSize: '0.725rem', color: 'var(--danger-text)', fontWeight: 600 }}>Sai</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--danger)' }}>{examRecord.incorrectCount}</div>
          </div>

          <div style={{ 
            padding: '8px 10px', 
            borderRadius: 'var(--radius-md)', 
            backgroundColor: 'var(--bg-card-subtle)', 
            border: '1px solid var(--border-color)' 
          }}>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600 }}>Bỏ trống</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-muted)' }}>{examRecord.unansweredCount}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {wrongQuestionIds.length > 0 && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onRetryWrongQuestions(wrongQuestionIds)}
              style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
            >
              <RotateCcw size={15} />
              <span>Luyện lại {wrongQuestionIds.length} câu sai</span>
            </button>
          )}

          <button
            className="btn btn-secondary btn-sm"
            onClick={onRetakeExam}
          >
            <Award size={15} />
            <span>Thi lại đề mới</span>
          </button>
        </div>
      </div>

      {/* Topic Breakdown Card */}
      {Object.keys(examRecord.topicBreakdown).length > 0 && (
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14 }}>
            Kết quả theo từng chủ đề
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(examRecord.topicBreakdown).map(([tName, data]) => {
              const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
              return (
                <div key={tName} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ width: 160, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {tName.split(':')[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div className="progress-bar-bg">
                      <div 
                        className="progress-bar-fill" 
                        style={{ 
                          width: `${pct}%`, 
                          backgroundColor: pct >= 70 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)' 
                        }} 
                      />
                    </div>
                  </div>
                  <div style={{ minWidth: 90, textAlign: 'right', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {data.correct} / {data.total} ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Question Review List */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Xem lại bài thi ({filteredQuestions.length} câu)
          </h3>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              className={`nav-btn btn-sm ${filterMode === 'all' ? 'active' : ''}`}
              onClick={() => setFilterMode('all')}
            >
              Tất cả ({examRecord.questions.length})
            </button>
            <button
              className={`nav-btn btn-sm ${filterMode === 'wrong' ? 'active' : ''}`}
              onClick={() => setFilterMode('wrong')}
            >
              Câu sai ({examRecord.incorrectCount})
            </button>
            <button
              className={`nav-btn btn-sm ${filterMode === 'correct' ? 'active' : ''}`}
              onClick={() => setFilterMode('correct')}
            >
              Câu đúng ({examRecord.correctCount})
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredQuestions.map((item, idx) => (
            <div key={item.question.id}>
              <QuestionCard
                question={item.question}
                userAnswer={item.userAnswer}
                onAnswerChange={() => {}}
                showResult={true}
                readOnly={true}
                questionIndex={idx}
                totalQuestions={filteredQuestions.length}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
