/**
 * LocalStorage Persistence for Quiz Builder
 * 
 * Handles auto-save, restore, and version migration
 * for quiz builder state
 */

// Storage key
const STORAGE_KEY = 'quiz_builder_session';

// Current version - increment when schema changes
const CURRENT_VERSION = 2;

/**
 * Get current timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Load saved state from localStorage
 */
export function loadSavedSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    
    const saved = JSON.parse(raw);
    
    // Version check - could add migration here
    if (!saved.version || saved.version !== CURRENT_VERSION) {
      console.log('QuizBuilder: Version mismatch, clearing old data');
      clearSavedSession();
      return null;
    }
    
    return saved;
  } catch (err) {
    console.error('QuizBuilder: Error loading session', err);
    return null;
  }
}

/**
 * Save state to localStorage
 */
export function saveSession(state) {
  try {
    const toSave = {
      ...state,
      version: CURRENT_VERSION,
      savedAt: getTimestamp()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    console.log('QuizBuilder: Session saved at', toSave.savedAt);
    return true;
  } catch (err) {
    console.error('QuizBuilder: Error saving session', err);
    return false;
  }
}

/**
 * Clear saved session
 */
export function clearSavedSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('QuizBuilder: Session cleared');
    return true;
  } catch (err) {
    console.error('QuizBuilder: Error clearing session', err);
    return false;
  }
}

/**
 * Check if session exists
 */
export function hasSavedSession() {
  return loadSavedSession() !== null;
}

/**
 * Get saved timestamp for display
 */
export function getSavedTimestamp() {
  const saved = loadSavedSession();
  if (!saved || !saved.savedAt) return null;
  
  const date = new Date(saved.savedAt);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return `${diffDays} ngày trước`;
}

/**
 * Create a save handler that debounces saves
 */
export function createAutoSave(saveDelay = 300) {
  let timeout = null;
  
  return function autoSave(state) {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      saveSession(state);
      timeout = null;
    }, saveDelay);
  };
}

/**
 * Create quiz data snapshot for current state
 */
export function createQuizSnapshot({
  questions,
  editedQuestions,
  shuffledQuestions,
  currentQuestionIndex,
  selectedAnswers,
  questionFileName,
  answerKeyFileName,
  mode,
  quizSettings
}) {
  return {
    questions: questions || [],
    editedQuestions: editedQuestions || [],
    hasAnswerKey: (editedQuestions || []).some(q => {
      if (q.type === 'multiple') return q.options.some(o => o.correct);
      if (q.type === 'truefalse-group') return q.statements.some(s => s.answer !== null);
      return false;
    }),
    quizState: {
      mode,
      shuffledQuestions: shuffledQuestions || [],
      currentQuestionIndex: currentQuestionIndex || 0,
      selectedAnswers: selectedAnswers || {},
      questionFileName,
      answerKeyFileName,
      quizSettings: quizSettings || null
    }
  };
}

/**
 * Restore quiz state from saved session
 */
export function restoreFromSession(savedSession) {
  if (!savedSession) return null;

  return {
    questions: savedSession.quizData?.questions || [],
    editedQuestions: savedSession.editorState?.editedQuestions || [],
    shuffledQuestions: savedSession.quizState?.shuffledQuestions || [],
    currentQuestionIndex: savedSession.quizState?.currentQuestionIndex || 0,
    selectedAnswers: savedSession.quizState?.selectedAnswers || {},
    questionFileName: savedSession.quizState?.questionFileName || null,
    answerKeyFileName: savedSession.quizState?.answerKeyFileName || null,
    mode: savedSession.quizState?.mode || 'upload',
    hasAnswerKey: savedSession.quizData?.hasAnswerKey || false,
    quizSettings: savedSession.quizState?.quizSettings || null
  };
}
