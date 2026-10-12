export type QuestionType = 'single' | 'multiple' | 'true_false' | 'matching';

export interface TrueFalseStatement {
  id: string;
  text: string;
  correctAnswer: boolean; // true = Đúng, false = Sai
}

export interface MatchingPair {
  id: string;
  prompt: string;
  target: string;
}

export interface MatchingCategory {
  id: string;
  name: string;
  items: string[];
}

export interface MatchingData {
  matchingType: 'pairs' | 'categories';
  pairs?: MatchingPair[];
  allTargets?: string[];
  categories?: MatchingCategory[];
  allItems?: string[];
}

export interface Question {
  id: string;
  sourceFile: string;
  topicId: string;
  topicTitle: string;
  questionNumber: number;
  questionText: string;
  type: QuestionType;
  options?: string[];
  correctAnswers?: number[];
  statements?: TrueFalseStatement[];
  matchingData?: MatchingData;
  explanation?: string;
  verificationStatus: 'verified' | 'needs_review';
  reviewReason?: string;
}

export interface Topic {
  id: string;
  title: string;
  sourceFile: string;
  questions: Question[];
}

export interface CourseData {
  id: string;
  name: string;
  topics: Topic[];
  updatedAt: string;
}

export interface UserAnswerRecord {
  questionId: string;
  type: QuestionType;
  // single: number | null
  // multiple: number[]
  // true_false: Record<string, boolean>
  // matching: Record<string, string> (for pairs: pairId -> target; for categories: item -> categoryId)
  selectedSingle?: number;
  selectedMultiple?: number[];
  selectedTrueFalse?: Record<string, boolean>;
  selectedMatching?: Record<string, string>;
  isCorrect?: boolean;
  score?: number; // 0 to 1
  answeredAt?: string;
}

export interface StudyProgress {
  answeredQuestions: Record<string, UserAnswerRecord>; // questionId -> UserAnswerRecord
  bookmarkedQuestionIds: string[]; // starred
  lastStudiedTopicId?: string;
}

export interface ExamRecord {
  id: string;
  date: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  score: number; // Scale of 10
  percentage: number;
  timeSpentSeconds: number;
  topicBreakdown: Record<string, { total: number; correct: number }>;
  questions: {
    question: Question;
    userAnswer: UserAnswerRecord;
  }[];
}
