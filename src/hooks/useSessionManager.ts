import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuizStore } from '@/stores/quizStore';
import { useEditorStore } from '@/stores/editorStore';
import { useTestStore } from '@/stores/testStore';
import { sessionStorage, clearAllAppData, debounce, type SessionData } from '@/utils/sessionStorage';
import { createEmptyQuiz } from '@/types';

export function useSessionManager() {
  const location = useLocation();
  const { quiz } = useQuizStore();
  const { selectedQuestionId, filterType, searchQuery } = useEditorStore();
  const testStore = useTestStore();
  
  // Track if we should save (to avoid saving during restore)
  const isRestoringRef = useRef(false);
  const hasShownModalRef = useRef(false);
  
  // Get current question index
  const currentQuestionIndex = quiz.questions.findIndex(
    (q) => q?.id === selectedQuestionId
  );

  // Save session function
  const saveSession = useCallback(() => {
    if (isRestoringRef.current) return;
    
    const testState = testStore.status !== 'idle'
      ? {
          answers: testStore.answers,
          flagged: Array.from(testStore.flagged),
          currentIndex: testStore.currentIndex,
          startTime: testStore.startTime,
          pausedTime: testStore.pausedTime,
          durationSeconds: testStore.durationSeconds,
          randomization: testStore.randomization,
          status: testStore.status,
        }
      : null;

    const sessionData: SessionData = {
      version: 1,
      timestamp: Date.now(),
      lastPath: location.pathname,
      quiz,
      editorState: {
        selectedQuestionId,
        filterType,
        searchQuery,
        currentQuestionIndex: currentQuestionIndex >= 0 ? currentQuestionIndex : 0,
      },
      testState,
    };

    sessionStorage.save(sessionData);
  }, [quiz, selectedQuestionId, filterType, searchQuery, currentQuestionIndex, location.pathname, testStore]);

  // Debounced save
  const debouncedSave = useCallback(
    debounce(saveSession, 1000),
    [saveSession]
  );

  // Save on location change or store changes
  useEffect(() => {
    debouncedSave();
  }, [location.pathname, quiz, selectedQuestionId, filterType, searchQuery]);

  // Also save when test state changes
  useEffect(() => {
    if (testStore.status !== 'idle') {
      debouncedSave();
    }
  }, [testStore.answers, testStore.currentIndex, testStore.flagged, testStore.status]);

  // Check for existing session on mount
  const checkSession = useCallback((): SessionData | null => {
    // Only show modal once per page load
    if (hasShownModalRef.current) return null;
    
    const session = sessionStorage.load();
    if (session) {
      hasShownModalRef.current = true;
    }
    return session;
  }, []);

  // Restore session - fully brings back exact position and progress
  const restoreSession = useCallback((session: SessionData) => {
    isRestoringRef.current = true;
    
    // 1. Restore quiz data
    useQuizStore.getState().setQuiz(session.quiz);
    
    // 2. Restore editor UI state
    const editorStore = useEditorStore.getState();
    if (session.editorState.selectedQuestionId) {
      editorStore.selectQuestion(session.editorState.selectedQuestionId);
    }
    if (session.editorState.filterType) {
      editorStore.setFilterType(session.editorState.filterType as any);
    }
    if (session.editorState.searchQuery) {
      editorStore.setSearchQuery(session.editorState.searchQuery);
    }
    
    // 3. Restore test state — use setState directly so we preserve EVERY field:
    //    answers, flagged, currentIndex, timer, randomization, status.
    //    Do NOT call startTest() — it generates new randomization and wipes progress.
    if (session.testState) {
      const ts = session.testState;
      useTestStore.setState({
        quiz: session.quiz,
        answers: ts.answers,
        flagged: new Set(ts.flagged),        // stored as string[], restore as Set
        currentIndex: ts.currentIndex,
        startTime: ts.startTime,
        endTime: null,
        pausedTime: ts.pausedTime,
        durationSeconds: ts.durationSeconds,
        randomization: ts.randomization,    // exact same order as when saved
        status: ts.status,
        submittedDueToTimeout: false,
        reviewMode: false,
      });
    }
    
    // Allow auto-save again after a short delay
    setTimeout(() => {
      isRestoringRef.current = false;
    }, 500);
  }, []);

  // Discard session - full factory reset
  const discardSession = useCallback(() => {
    // 1. Block auto-save FIRST so it can't re-write the data we're about to clear
    isRestoringRef.current = true;

    // 2. Wipe all localStorage / sessionStorage app data
    clearAllAppData();

    // 3. Reset every Zustand store to its initial state
    useQuizStore.getState().setQuiz(createEmptyQuiz());
    useEditorStore.getState().selectQuestion(null);
    useEditorStore.getState().setSearchQuery('');
    useEditorStore.getState().setFilterType('all');
    useTestStore.getState().resetTest();

    // 4. Also clear the Zustand persist storage directly so it doesn’t
    //    re-hydrate on the next render cycle
    try {
      localStorage.removeItem('quiz-studio-quiz');
    } catch {
      // ignore
    }

    // Keep auto-save blocked indefinitely — the page is now in a clean state
    // and doesn’t need to persist anything until the user makes a change.
    // We re-enable it after a generous delay so a deliberate edit can be saved.
    setTimeout(() => {
      isRestoringRef.current = false;
    }, 2000);
  }, []);

  return {
    checkSession,
    restoreSession,
    discardSession,
  };
}
