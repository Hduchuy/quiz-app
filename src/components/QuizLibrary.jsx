import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, StaggerContainer, StaggerItem } from './ui';

/**
 * QuizLibrary - Main component for browsing built-in quizzes
 */
export function QuizLibrary({ onSelectQuiz, onBack }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const initializedRef = useRef(null);

  const loadLibrary = useCallback(async () => {
    try {
      const { loadLibraryIndex } = await import('../utils/quizLibrary');
      const index = await loadLibraryIndex();
      setSubjects(index);
    } catch (e) {
      console.error('Failed to load library:', e);
      setError('Không thể tải danh sách môn học. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  if (initializedRef.current == null) {
    initializedRef.current = true;
    loadLibrary();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)]">Đang tải kho đề...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <GlassCard className="text-center max-w-md w-full">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Đã xảy ra lỗi</h2>
          <p className="text-[var(--color-text-secondary)] mb-6">{error}</p>
          <button
            onClick={loadLibrary}
            className="btn btn-primary"
          >
            Thử lại
          </button>
        </GlassCard>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <GlassCard className="text-center max-w-md w-full">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-xl font-bold mb-2">Chưa có đề thi nào</h2>
          <p className="text-[var(--color-text-secondary)] mb-6">
            Kho đề đang được cập nhật. Vui lòng quay lại sau.
          </p>
          <button onClick={onBack} className="btn btn-secondary">
            ← Quay lại
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-6 max-w-4xl mx-auto"
      style={{ paddingInline: 'clamp(12px, 2vw, 24px)' }}
    >
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="btn btn-ghost mb-4"
        >
          ← Quay lại
        </button>
        <h1 className="text-3xl font-bold text-gradient mb-2">Kho đề có sẵn</h1>
        <p className="text-[var(--color-text-secondary)]">
          Chọn môn học để xem các bộ đề thi
        </p>
      </div>

      {/* Subject Grid */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjects.map((subject) => (
          <StaggerItem key={subject.id}>
            <SubjectCard
              subject={subject}
              onSelect={() => onSelectQuiz({ type: 'subject', ...subject })}
            />
          </StaggerItem>
        ))}
      </StaggerContainer>
    </motion.div>
  );
}

/**
 * SubjectCard - Displays a subject in the library
 */
function SubjectCard({ subject, onSelect }) {
  const icons = {
    lsmtvn: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  };
  const icon = icons[subject.id] || (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );

  return (
    <motion.button
      onClick={onSelect}
      className="w-full text-left glass-card glass-card-hover cursor-pointer p-6"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-cyan)]/20 flex items-center justify-center text-[var(--color-accent-light)]">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-[var(--color-text-primary)] mb-1 truncate">
            {subject.subjectName || subject.id}
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">
            {subject.description || 'Bộ đề thi ' + subject.id}
          </p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent-light)]">
          Xem đề thi
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </motion.button>
  );
}

/**
 * SubjectPage - Shows quizzes for a specific subject
 */
export function SubjectPage({ subject, onBack, onSelectQuiz }) {
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const initializedRef = useRef(null);

  const loadManifest = useCallback(async () => {
    try {
      const { loadSubjectManifest } = await import('../utils/quizLibrary');
      const data = await loadSubjectManifest(subject.manifest);
      setManifest(data);
    } catch (e) {
      console.error('Failed to load manifest:', e);
      setError('Không thể tải danh sách đề thi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [subject]);

  // Load on mount
  if (initializedRef.current == null) {
    initializedRef.current = true;
    loadManifest();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)]">Đang tải danh sách đề thi...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <GlassCard className="text-center max-w-md w-full">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Đã xảy ra lỗi</h2>
          <p className="text-[var(--color-text-secondary)] mb-6">{error}</p>
          <button onClick={loadManifest} className="btn btn-primary">
            Thử lại
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-6 max-w-2xl mx-auto"
      style={{ paddingInline: 'clamp(12px, 2vw, 24px)' }}
    >
      {/* Header */}
      <div className="mb-8">
        <button onClick={onBack} className="btn btn-ghost mb-4">
          ← Quay lại
        </button>
        <h1 className="text-3xl font-bold text-gradient mb-2">{manifest.subject}</h1>
        {manifest.description && (
          <p className="text-[var(--color-text-secondary)]">{manifest.description}</p>
        )}
      </div>

      {/* Quiz List */}
      <StaggerContainer className="space-y-3">
        {manifest.quizzes.map((quiz) => (
          <StaggerItem key={quiz.id}>
            <QuizItemCard
              quiz={quiz}
              subjectId={subject.id}
              onSelect={onSelectQuiz}
            />
          </StaggerItem>
        ))}
      </StaggerContainer>
    </motion.div>
  );
}

/**
 * QuizItemCard - Displays a quiz in the subject page
 */
function QuizItemCard({ quiz, subjectId, onSelect }) {
  return (
    <motion.button
      onClick={() => onSelect(quiz)}
      className="w-full text-left glass-card glass-card-hover flex items-center gap-4 p-4"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[var(--color-text-primary)] mb-1 truncate">
          {quiz.title}
        </h3>
        {quiz.description && (
          <p className="text-sm text-[var(--color-text-muted)] truncate">
            {quiz.description}
          </p>
        )}
      </div>
      <motion.div
        className="btn btn-primary flex-shrink-0"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Bắt đầu
      </motion.div>
    </motion.button>
  );
}

export default QuizLibrary;
