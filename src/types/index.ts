// Question Types
export type QuestionType = 'mcq' | 'truefalse' | 'drag_drop_boxes' | 'fillblank' | 'matching' | 'ordering';

// Media
export interface Media {
  type: 'image' | 'video' | 'audio';
  url: string;
  alt?: string;
}

// Base Question
export interface BaseQuestion {
  id: string;
  type: QuestionType;
  title: string;
  explanation?: string;
  media?: Media;
  points: number;
  createdAt: number;
  updatedAt: number;
}

// MCQ Option
export interface MCQOption {
  id: string;
  text: string;
  correct: boolean | null; // null if no answer detected during import
}

export interface MCQQuestion extends BaseQuestion {
  type: 'mcq';
  options: MCQOption[];
  // correctAnswer: string; // Old single answer - removed
}

// TrueFalse Statement
export interface TrueFalseStatement {
  id: string;
  text: string;
  answer: boolean | null; // null if no answer detected during import
}

// True/False Question (Multi-statement)
export interface TrueFalseQuestion extends BaseQuestion {
  type: 'truefalse';
  statements: TrueFalseStatement[];
}

// DragDropBoxes - Drag answer items into target boxes
export interface DragDropTarget {
  id: string;
  title: string;
  correctAnswers: string[]; // Multiple correct answers allowed
}

export interface DragDropBoxesQuestion extends BaseQuestion {
  type: 'drag_drop_boxes';
  targets: DragDropTarget[];
  distractors: string[]; // Wrong answers to increase difficulty
}

// Fill Blank Question
export interface FillBlank {
  id: string;
  text: string;
  alternatives: string[];
}

export interface FillBlankQuestion extends BaseQuestion {
  type: 'fillblank';
  content: string;
  blanks: FillBlank[];
}

// Union type
export type Question = MCQQuestion | TrueFalseQuestion | DragDropBoxesQuestion | FillBlankQuestion | MatchingQuestion | OrderingQuestion;

// Quiz Settings
export interface QuizSettings {
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  instantFeedback: boolean;
  enableTimer: boolean;
  timerMinutes: number;
}

// Quiz
export interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  settings: QuizSettings;
  createdAt: number;
  updatedAt: number;
}

// Test Session
export interface TestSession {
  quizId: string;
  answers: Record<string, Answer>;
  flagged: string[];
  currentIndex: number;
  startTime: number;
  endTime?: number;
  status: 'in-progress' | 'completed' | 'paused';
  // Randomization state - stored once at test start
  randomization?: RandomizationState;
  // Review mode - user can reveal answers during test
  reviewMode?: boolean;
}

export interface RandomizationState {
  // Shuffled question order (array of question IDs)
  questionOrder: string[];
  // Answer display orders for each question
  answerOrders: Record<string, AnswerOrder>;
}

export interface AnswerOrder {
  // For MCQ: shuffled option IDs
  options?: string[];
  // For True/False: shuffled statement IDs
  statements?: string[];
  // For Drag & Drop: shuffled target IDs and answer pool
  targets?: string[];
  answerPool?: string[];
}

// Union type for answers
export type Answer = string | boolean | string[] | Record<string, boolean> | Record<string, string[]>;

// Editor State
export interface EditorState {
  selectedQuestionId: string | null;
  collapsedQuestions: Set<string>;
  draggedQuestionId: string | null;
  searchQuery: string;
  filterType: QuestionType | 'all';
  filterIncomplete: boolean;
}

// App Settings
export interface AppSettings {
  darkMode: boolean;
  neonIntensity: number;
  compactMode: boolean;
  reducedMotion: boolean;
  autosaveInterval: number;
}

// Question Bank Item
export interface QuestionBankItem {
  id: string;
  subject: string;
  tags: string[];
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Notification
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
}

// Helper type guards
export function isMCQQuestion(q: Question): q is MCQQuestion {
  return q.type === 'mcq';
}

export function isTrueFalseQuestion(q: Question): q is TrueFalseQuestion {
  return q.type === 'truefalse';
}

export function isDragDropBoxesQuestion(q: Question): q is DragDropBoxesQuestion {
  return q.type === 'drag_drop_boxes';
}

export function isFillBlankQuestion(q: Question): q is FillBlankQuestion {
  return q.type === 'fillblank';
}

// Matching Question
export interface MatchingItem {
  id: string;
  left: string;
  right: string;
}

export interface MatchingQuestion extends BaseQuestion {
  type: 'matching';
  matchingItems: MatchingItem[];
}

export function isMatchingQuestion(q: Question): q is MatchingQuestion {
  return q.type === 'matching';
}

// Ordering Question
export interface OrderedItem {
  id: string;
  text: string;
  position: number;
}

export interface OrderingQuestion extends BaseQuestion {
  type: 'ordering';
  orderedItems: OrderedItem[];
}

export function isOrderingQuestion(q: Question): q is OrderingQuestion {
  return q.type === 'ordering';
}

// Create helper functions
export function createEmptyMCQ(): MCQQuestion {
  return {
    id: crypto.randomUUID(),
    type: 'mcq',
    title: '',
    options: [
      { id: crypto.randomUUID(), text: '', correct: false },
      { id: crypto.randomUUID(), text: '', correct: false },
      { id: crypto.randomUUID(), text: '', correct: false },
      { id: crypto.randomUUID(), text: '', correct: false },
    ],
    points: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Helper to count correct answers
export function getCorrectAnswerCount(question: MCQQuestion): number {
  return question.options.filter(opt => opt.correct).length;
}

// Helper to get correct answer IDs
export function getCorrectAnswerIds(question: MCQQuestion): string[] {
  return question.options.filter(opt => opt.correct).map(opt => opt.id);
}

// Helper to check if question has multiple correct answers
export function hasMultipleCorrectAnswers(question: MCQQuestion): boolean {
  return getCorrectAnswerCount(question) > 1;
}

export function createEmptyTrueFalse(): TrueFalseQuestion {
  return {
    id: crypto.randomUUID(),
    type: 'truefalse',
    title: '',
    statements: [
      { id: crypto.randomUUID(), text: '', answer: true },
      { id: crypto.randomUUID(), text: '', answer: true },
      { id: crypto.randomUUID(), text: '', answer: true },
      { id: crypto.randomUUID(), text: '', answer: true },
    ],
    points: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createEmptyDragDropBoxes(): DragDropBoxesQuestion {
  return {
    id: crypto.randomUUID(),
    type: 'drag_drop_boxes',
    title: 'Kéo thả đáp án vào các ô tương ứng',
    targets: [
      { id: crypto.randomUUID(), title: '', correctAnswers: [''] },
      { id: crypto.randomUUID(), title: '', correctAnswers: [''] },
    ],
    distractors: [],
    points: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createEmptyFillBlank(): FillBlankQuestion {
  return {
    id: crypto.randomUUID(),
    type: 'fillblank',
    title: '',
    content: '',
    blanks: [],
    points: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createEmptyMatching(): MatchingQuestion {
  return {
    id: crypto.randomUUID(),
    type: 'matching',
    title: '',
    matchingItems: [
      { id: crypto.randomUUID(), left: '', right: '' },
      { id: crypto.randomUUID(), left: '', right: '' },
    ],
    points: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createEmptyOrdering(): OrderingQuestion {
  return {
    id: crypto.randomUUID(),
    type: 'ordering',
    title: '',
    orderedItems: [
      { id: crypto.randomUUID(), text: '', position: 0 },
      { id: crypto.randomUUID(), text: '', position: 0 },
      { id: crypto.randomUUID(), text: '', position: 0 },
      { id: crypto.randomUUID(), text: '', position: 0 },
    ],
    points: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createEmptyQuiz(): Quiz {
  return {
    id: crypto.randomUUID(),
    title: 'Untitled Quiz',
    questions: [],
    settings: {
      shuffleQuestions: false,
      shuffleAnswers: true,
      instantFeedback: false,
      enableTimer: false,
      timerMinutes: 30,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
