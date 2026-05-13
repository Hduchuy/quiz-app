import { useState, useRef, useCallback } from 'react';
import { loadLibraryIndex, loadSubjectManifest } from '../utils/quizLibrary';
import './QuizLibrary.css';

// Subject icons mapping
const SUBJECT_ICONS = {
  lsmtvn: '🎨'
};

/**
 * QuizLibrary - Main component for browsing built-in quizzes
 */
export function QuizLibrary({ onSelectQuiz, onBack }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const initializedRef = useRef(null);

  // Load on mount
  if (initializedRef.current == null) {
    initializedRef.current = true;
    loadLibraryIndex()
      .then((index) => setSubjects(index))
      .catch((e) => {
        console.error('Failed to load library:', e);
        setError('Không thể tải danh sách môn học. Vui lòng thử lại.');
      })
      .finally(() => setLoading(false));
  }

  const handleRetry = useCallback(() => {
    initializedRef.current = null;
    setLoading(true);
    setError(null);
    loadLibraryIndex()
      .then((index) => setSubjects(index))
      .catch((e) => {
        console.error('Failed to load library:', e);
        setError('Không thể tải danh sách môn học. Vui lòng thử lại.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="quiz-library">
        <div className="library-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải kho đề...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-library">
        <button className="library-back-btn" onClick={onBack}>
          ← Quay lại
        </button>
        <div className="library-error">
          <div className="error-icon">⚠️</div>
          <h2>Đã xảy ra lỗi</h2>
          <p>{error}</p>
          <button className="retry-btn" onClick={handleRetry}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="quiz-library">
        <button className="library-back-btn" onClick={onBack}>
          ← Quay lại
        </button>
        <div className="library-empty">
          <div className="empty-icon">📚</div>
          <h2>Chưa có đề thi nào</h2>
          <p>Kho đề đang được cập nhật. Vui lòng quay lại sau.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-library">
      <div className="library-header">
        <button className="library-back-btn" onClick={onBack}>
          ← Quay lại
        </button>
        <h1>Kho đề có sẵn</h1>
        <p>Chọn môn học để xem các bộ đề thi</p>
      </div>

      <div className="subjects-grid">
        {subjects.map((subject) => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            onSelect={() => onSelectQuiz({ type: 'subject', ...subject })}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * SubjectCard - Displays a subject in the library
 */
function SubjectCard({ subject, onSelect }) {
  const icon = SUBJECT_ICONS[subject.id] || '📖';

  return (
    <div className="subject-card" onClick={onSelect}>
      <div className="subject-icon">{icon}</div>
      <h3>{subject.subjectName || subject.id}</h3>
      <p>{subject.description || 'Bộ đề thi ' + subject.id}</p>
      <div className="subject-meta">
        <span className="subject-badge">Xem đề thi →</span>
      </div>
    </div>
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

  // Load on mount
  if (initializedRef.current == null) {
    initializedRef.current = true;
    loadSubjectManifest(subject.manifest)
      .then((data) => setManifest(data))
      .catch((e) => {
        console.error('Failed to load manifest:', e);
        setError('Không thể tải danh sách đề thi. Vui lòng thử lại.');
      })
      .finally(() => setLoading(false));
  }

  const handleRetry = useCallback(() => {
    initializedRef.current = null;
    setLoading(true);
    setError(null);
    loadSubjectManifest(subject.manifest)
      .then((data) => setManifest(data))
      .catch((e) => {
        console.error('Failed to load manifest:', e);
        setError('Không thể tải danh sách đề thi. Vui lòng thử lại.');
      })
      .finally(() => setLoading(false));
  }, [subject]);

  if (loading) {
    return (
      <div className="quiz-library">
        <div className="library-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách đề thi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-library">
        <button className="library-back-btn" onClick={onBack}>
          ← Quay lại
        </button>
        <div className="library-error">
          <div className="error-icon">⚠️</div>
          <h2>Đã xảy ra lỗi</h2>
          <p>{error}</p>
          <button className="retry-btn" onClick={handleRetry}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-library">
      <div className="subject-header">
        <button className="library-back-btn" onClick={onBack}>
          ← Quay lại
        </button>
        <h1>{manifest.subject}</h1>
        {manifest.description && <p>{manifest.description}</p>}
      </div>

      <div className="quizzes-list">
        {manifest.quizzes.map((quiz) => (
          <QuizCard
            key={quiz.id}
            quiz={quiz}
            subjectId={subject.id}
            onSelect={onSelectQuiz}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * QuizCard - Displays a quiz in the subject page
 * Passes quiz reference to parent; parent handles fetch/parse
 */
function QuizCard({ quiz, subjectId, onSelect }) {
  return (
    <div className="quiz-card">
      <div className="quiz-info">
        <h3>{quiz.title}</h3>
        {quiz.description && <p>{quiz.description}</p>}
      </div>
      <button
        className="quiz-start-btn"
        onClick={() => onSelect(quiz)}
      >
        Bắt đầu
      </button>
    </div>
  );
}

export default QuizLibrary;
