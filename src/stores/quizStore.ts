import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Quiz, Question, QuestionType, QuizSettings } from '@/types';
import { createEmptyQuiz, createEmptyMCQ, createEmptyTrueFalse, createEmptyDragDropBoxes, createEmptyFillBlank, createEmptyMatching } from '@/types';

// Only 4 valid question types
const VALID_TYPES = ['mcq', 'truefalse', 'fillblank', 'matching', 'drag_drop_boxes'] as const;

function validateQuestion(q: any): Question | null {
  if (!q || !q.id || !q.type) return null;
  if (!VALID_TYPES.includes(q.type)) return null;
  
  // Ensure required arrays exist
  if (q.type === 'mcq') {
    if (!Array.isArray(q.options) || q.options.length < 2) {
      q.options = [
        { id: crypto.randomUUID(), text: '', correct: false },
        { id: crypto.randomUUID(), text: '', correct: false },
      ];
    }
  }
  if (q.type === 'truefalse') {
    if (!Array.isArray(q.statements) || q.statements.length < 1) {
      q.statements = [{ id: crypto.randomUUID(), text: '', answer: true }];
    }
  }
  if (q.type === 'fillblank') {
    q.blanks = Array.isArray(q.blanks) ? q.blanks : [];
    q.content = q.content || '';
  }
  if (q.type === 'matching') {
    q.matchingItems = Array.isArray(q.matchingItems) ? q.matchingItems : [];
  }
  if (q.type === 'drag_drop_boxes') {
    q.targets = Array.isArray(q.targets) ? q.targets : [];
    q.distractors = Array.isArray(q.distractors) ? q.distractors : [];
  }
  
  q.title = q.title || 'Câu hỏi';
  return q as Question;
}

function validateQuiz(quiz: any): Quiz {
  const emptyQuiz = createEmptyQuiz();
  if (!quiz || typeof quiz !== 'object') return emptyQuiz;
  
  const questions = Array.isArray(quiz.questions) 
    ? quiz.questions.map(validateQuestion).filter(Boolean)
    : [];
  
  return {
    id: quiz.id || emptyQuiz.id,
    title: quiz.title || 'Untitled Quiz',
    description: quiz.description,
    questions,
    settings: { ...emptyQuiz.settings, ...quiz.settings },
    createdAt: quiz.createdAt || Date.now(),
    updatedAt: quiz.updatedAt || Date.now(),
  };
}

interface QuizState {
  // Current quiz
  quiz: Quiz;
  isDirty: boolean;
  lastSaved: number | null;
  saveStatus: 'saved' | 'saving' | 'unsaved';

  // Actions
  setQuiz: (quiz: Quiz) => void;
  updateQuizTitle: (title: string) => void;
  updateQuizDescription: (description: string) => void;
  updateQuizSettings: (settings: Partial<QuizSettings>) => void;

  // Question actions
  addQuestion: (type: QuestionType) => Question;
  addQuestions: (questions: Question[]) => void;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  duplicateQuestion: (id: string) => void;
  reorderQuestions: (fromIndex: number, toIndex: number) => void;
  getQuestion: (id: string) => Question | undefined;

  // Save actions
  saveQuiz: () => Promise<void>;
  markSaved: () => void;
  markDirty: () => void;

  // Reset
  resetQuiz: () => void;
  createNewQuiz: () => void;
  clearAllQuestions: () => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      quiz: createEmptyQuiz(),
      isDirty: false,
      lastSaved: null,
      saveStatus: 'saved' as const,

      setQuiz: (quiz) => {
        const validated = validateQuiz(quiz);
        set({ quiz: validated, isDirty: false, lastSaved: Date.now() });
      },

      updateQuizTitle: (title) => {
        set((state) => ({
          quiz: { ...state.quiz, title, updatedAt: Date.now() },
          isDirty: true,
          saveStatus: 'unsaved',
        }));
      },

      updateQuizDescription: (description) => {
        set((state) => ({
          quiz: { ...state.quiz, description, updatedAt: Date.now() },
          isDirty: true,
          saveStatus: 'unsaved',
        }));
      },

      updateQuizSettings: (settings) => {
        set((state) => ({
          quiz: {
            ...state.quiz,
            settings: { ...state.quiz.settings, ...settings },
            updatedAt: Date.now(),
          },
          isDirty: true,
          saveStatus: 'unsaved',
        }));
      },

      addQuestion: (type) => {
        let newQuestion: Question;

        switch (type) {
          case 'mcq':
            newQuestion = createEmptyMCQ();
            break;
          case 'truefalse':
            newQuestion = createEmptyTrueFalse();
            break;
          case 'drag_drop_boxes':
            newQuestion = createEmptyDragDropBoxes();
            break;
          case 'fillblank':
            newQuestion = createEmptyFillBlank();
            break;
          case 'matching':
            newQuestion = createEmptyMatching();
            break;
          default:
            newQuestion = createEmptyMCQ();
        }

        set((state) => ({
          quiz: {
            ...state.quiz,
            questions: [...state.quiz.questions, newQuestion],
            updatedAt: Date.now(),
          },
          isDirty: true,
          saveStatus: 'unsaved',
        }));

        return newQuestion;
      },

      addQuestions: (questions) => {
        set((state) => ({
          quiz: {
            ...state.quiz,
            questions: [...state.quiz.questions, ...questions],
            updatedAt: Date.now(),
          },
          isDirty: true,
          saveStatus: 'unsaved',
        }));
      },

      updateQuestion: (id, updates) => {
        set((state) => ({
          quiz: {
            ...state.quiz,
            questions: state.quiz.questions.map((q) =>
              q.id === id ? ({ ...q, ...updates, updatedAt: Date.now() } as Question) : q
            ),
            updatedAt: Date.now(),
          },
          isDirty: true,
          saveStatus: 'unsaved',
        }));
      },

      deleteQuestion: (id) => {
        set((state) => ({
          quiz: {
            ...state.quiz,
            questions: state.quiz.questions.filter((q) => q.id !== id),
            updatedAt: Date.now(),
          },
          isDirty: true,
          saveStatus: 'unsaved',
        }));
      },

      duplicateQuestion: (id) => {
        const state = get();
        const question = state.quiz.questions.find((q) => q.id === id);
        if (!question) return;

        // Deep duplicate with new IDs for nested objects
        let duplicated: Question;

        if (question.type === 'mcq') {
          duplicated = {
            ...question,
            id: crypto.randomUUID(),
            options: question.options.map(opt => ({
              ...opt,
              id: crypto.randomUUID(),
            })),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
        } else {
          duplicated = {
            ...question,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          } as Question;
        }

        const index = state.quiz.questions.findIndex((q) => q.id === id);
        const newQuestions = [...state.quiz.questions];
        newQuestions.splice(index + 1, 0, duplicated);

        set({
          quiz: { ...state.quiz, questions: newQuestions, updatedAt: Date.now() },
          isDirty: true,
          saveStatus: 'unsaved',
        });
      },

      reorderQuestions: (fromIndex, toIndex) => {
        set((state) => {
          const questions = [...state.quiz.questions];
          const [removed] = questions.splice(fromIndex, 1);
          questions.splice(toIndex, 0, removed);

          return {
            quiz: { ...state.quiz, questions, updatedAt: Date.now() },
            isDirty: true,
            saveStatus: 'unsaved',
          };
        });
      },

      getQuestion: (id) => {
        return get().quiz.questions.find((q) => q.id === id);
      },

      markSaved: () => {
        set({ isDirty: false, saveStatus: 'saved', lastSaved: Date.now() });
      },

      markDirty: () => {
        set({ isDirty: true, saveStatus: 'unsaved' });
      },

      saveQuiz: async () => {
        set({ saveStatus: 'saving' });
        // Trigger persist middleware to save
        const state = get();
        set({
          quiz: { ...state.quiz, updatedAt: Date.now() },
          isDirty: false,
          saveStatus: 'saved',
          lastSaved: Date.now(),
        });
      },

      resetQuiz: () => {
        const saved = localStorage.getItem('quiz-studio-quiz');
        if (saved) {
          try {
            const quiz = JSON.parse(saved) as Quiz;
            set({ quiz, isDirty: false, saveStatus: 'saved', lastSaved: Date.now() });
          } catch {
            set({ quiz: createEmptyQuiz(), isDirty: false, saveStatus: 'saved' });
          }
        }
      },

      createNewQuiz: () => {
        set({ quiz: createEmptyQuiz(), isDirty: false, saveStatus: 'saved', lastSaved: Date.now() });
      },

      clearAllQuestions: () => {
        set((state) => ({
          quiz: {
            ...state.quiz,
            questions: [],
            updatedAt: Date.now(),
          },
          isDirty: true,
          saveStatus: 'unsaved',
        }));
      },
    }),
    {
      name: 'quiz-studio-quiz',
      partialize: (state) => ({ quiz: state.quiz }),
    }
  )
);
