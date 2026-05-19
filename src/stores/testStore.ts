import { create } from 'zustand';
import type { Quiz, Answer, RandomizationState, AnswerOrder, Question, MCQQuestion, TrueFalseQuestion, DragDropBoxesQuestion } from '@/types';

// Fisher-Yates shuffle algorithm (stable, in-place on copy)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate randomization state for a quiz
function generateRandomizationState(quiz: Quiz): RandomizationState {
  const questionOrder = quiz.questions.map(q => q.id);
  
  // Shuffle question order if enabled
  const shuffledQuestionOrder = quiz.settings.shuffleQuestions 
    ? shuffleArray(questionOrder) 
    : questionOrder;

  // Generate answer orders for each question
  const answerOrders: Record<string, AnswerOrder> = {};

  if (quiz.settings.shuffleAnswers) {
    for (const question of quiz.questions) {
      if (question.type === 'mcq') {
        const mcq = question as MCQQuestion;
        answerOrders[question.id] = {
          options: shuffleArray(mcq.options.map(opt => opt.id)),
        };
      } else if (question.type === 'truefalse') {
        const tf = question as TrueFalseQuestion;
        answerOrders[question.id] = {
          statements: shuffleArray(tf.statements.map(s => s.id)),
        };
      } else if (question.type === 'drag_drop_boxes') {
        const dd = question as DragDropBoxesQuestion;
        answerOrders[question.id] = {
          targets: shuffleArray(dd.targets.map(t => t.id)),
          answerPool: shuffleArray([
            ...dd.targets.flatMap(t => t.correctAnswers),
            ...dd.distractors,
          ].filter(a => a.trim())),
        };
      }
      // fillblank doesn't need answer shuffling
    }
  }

  return {
    questionOrder: shuffledQuestionOrder,
    answerOrders,
  };
}

interface TestState {
  // Session
  quiz: Quiz | null;
  answers: Record<string, Answer>;
  flagged: Set<string>;
  currentIndex: number;

  // Time tracking - using timestamps for accuracy
  startTime: number | null;
  endTime: number | null;
  pausedTime: number;
  durationSeconds: number; // Total allowed duration in seconds

  // Status
  status: 'idle' | 'in-progress' | 'paused' | 'completed';

  // Timeout tracking
  submittedDueToTimeout: boolean;

  // Randomization state (generated once at test start)
  randomization: RandomizationState | null;

  // Review mode
  reviewMode: boolean;

  // Actions
  startTest: (quiz: Quiz, durationMinutes?: number) => void;
  setAnswer: (questionId: string, answer: Answer) => void;
  toggleFlag: (questionId: string) => void;
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;

  pauseTest: () => void;
  resumeTest: () => void;
  submitTest: (dueToTimeout?: boolean) => void;

  resetTest: () => void;

  // Review mode actions
  toggleReviewMode: () => void;

  // Computed
  getAnswer: (questionId: string) => Answer | undefined;
  isQuestionAnswered: (questionId: string) => boolean;
  getAnsweredCount: () => number;
  getFlaggedCount: () => number;
  getElapsedTime: () => number;
  getRemainingTime: () => number;

  // Get shuffled questions based on randomization state
  getShuffledQuestions: () => Question[];
  // Get current question (with shuffled order applied)
  getCurrentQuestion: () => Question | null;
  // Get answer order for a specific question
  getAnswerOrder: (questionId: string) => AnswerOrder | undefined;
}

export const useTestStore = create<TestState>((set, get) => ({
  quiz: null,
  answers: {},
  flagged: new Set(),
  currentIndex: 0,
  startTime: null,
  endTime: null,
  pausedTime: 0,
  durationSeconds: 0,
  status: 'idle',
  submittedDueToTimeout: false,
  randomization: null,
  reviewMode: false,

  startTest: (quiz, _durationMinutes) => {
    // Generate randomization state ONCE at test start
    const randomization = generateRandomizationState(quiz);
    
    // Calculate duration in seconds
    const duration = quiz.settings.enableTimer && quiz.settings.timerMinutes > 0
      ? quiz.settings.timerMinutes * 60
      : 0;

    set({
      quiz,
      randomization,
      answers: {},
      flagged: new Set(),
      currentIndex: 0,
      startTime: Date.now(),
      endTime: null,
      pausedTime: 0,
      durationSeconds: duration,
      submittedDueToTimeout: false,
      status: 'in-progress',
      reviewMode: false,
    });
  },

  setAnswer: (questionId, answer) => {
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
    }));
  },

  toggleFlag: (questionId) => {
    set((state) => {
      const newFlagged = new Set(state.flagged);
      if (newFlagged.has(questionId)) {
        newFlagged.delete(questionId);
      } else {
        newFlagged.add(questionId);
      }
      return { flagged: newFlagged };
    });
  },

  goToQuestion: (index) => {
    const { randomization } = get();
    if (randomization && index >= 0 && index < randomization.questionOrder.length) {
      set({ currentIndex: index, reviewMode: false });
    }
  },

  nextQuestion: () => {
    const { randomization, currentIndex } = get();
    if (randomization && currentIndex < randomization.questionOrder.length - 1) {
      set({ currentIndex: currentIndex + 1, reviewMode: false });
    }
  },

  prevQuestion: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1, reviewMode: false });
    }
  },

  pauseTest: () => {
    set((state) => ({
      status: 'paused',
      pausedTime: state.pausedTime + (state.startTime ? Date.now() - state.startTime : 0),
    }));
  },

  resumeTest: () => {
    set({ status: 'in-progress', startTime: Date.now() });
  },

  submitTest: (dueToTimeout = false) => {
    set({
      status: 'completed',
      endTime: Date.now(),
      reviewMode: true, // Auto-enable review mode on submit
      submittedDueToTimeout: dueToTimeout,
    });
  },

  resetTest: () => {
    set({
      quiz: null,
      answers: {},
      flagged: new Set(),
      currentIndex: 0,
      startTime: null,
      endTime: null,
      pausedTime: 0,
      durationSeconds: 0,
      status: 'idle',
      submittedDueToTimeout: false,
      randomization: null,
      reviewMode: false,
    });
  },

  toggleReviewMode: () => {
    set((state) => ({ reviewMode: !state.reviewMode }));
  },

  getAnswer: (questionId) => {
    return get().answers[questionId];
  },

  isQuestionAnswered: (questionId) => {
    const answer = get().answers[questionId];
    if (answer === undefined || answer === null) return false;
    if (typeof answer === 'string') return answer !== '';
    if (typeof answer === 'boolean') return true;
    if (Array.isArray(answer)) return answer.length > 0;
    if (typeof answer === 'object') return Object.keys(answer).length > 0;
    return false;
  },

  getAnsweredCount: () => {
    const { answers, randomization } = get();
    if (!randomization) return 0;
    return randomization.questionOrder.filter(qId => {
      const answer = answers[qId];
      if (answer === undefined || answer === null) return false;
      if (typeof answer === 'string') return answer !== '';
      if (typeof answer === 'boolean') return true;
      if (Array.isArray(answer)) return answer.length > 0;
      if (typeof answer === 'object') return Object.keys(answer).length > 0;
      return false;
    }).length;
  },

  getFlaggedCount: () => {
    return get().flagged.size;
  },

  getElapsedTime: () => {
    const { startTime, pausedTime, status, endTime } = get();
    if (!startTime) return 0;
    if (status === 'completed' || endTime) {
      return pausedTime + (endTime ? endTime - startTime : 0);
    }
    return pausedTime + (Date.now() - startTime);
  },

  getRemainingTime: () => {
    const { quiz, durationSeconds, getElapsedTime } = get();
    // Return -1 if timer is not enabled
    if (!quiz?.settings.enableTimer || durationSeconds <= 0) return -1;
    const elapsed = Math.floor(getElapsedTime() / 1000);
    return Math.max(0, durationSeconds - elapsed);
  },

  getShuffledQuestions: () => {
    const { quiz, randomization } = get();
    if (!quiz || !randomization) return [];
    
    // Map shuffled question IDs back to actual questions
    return randomization.questionOrder
      .map(qId => quiz.questions.find(q => q.id === qId))
      .filter((q): q is Question => q !== undefined);
  },

  getCurrentQuestion: () => {
    const questions = get().getShuffledQuestions();
    const { currentIndex } = get();
    return questions[currentIndex] || null;
  },

  getAnswerOrder: (questionId) => {
    const { randomization } = get();
    if (!randomization) return undefined;
    return randomization.answerOrders[questionId];
  },
}));
