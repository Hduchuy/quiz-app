import type { Quiz } from '@/types';
import type { RandomizationState, Answer, Set as ImmutableSet } from '@/types';

// Session data structure
export interface SessionData {
  version: number;
  timestamp: number;
  lastPath: string;
  quiz: Quiz;
  editorState: EditorSessionState;
  testState: TestSessionState | null;
}

export interface EditorSessionState {
  selectedQuestionId: string | null;
  filterType: string;
  searchQuery: string;
  currentQuestionIndex: number;
}

export interface TestSessionState {
  answers: Record<string, Answer>;
  flagged: string[];
  currentIndex: number;
  startTime: number | null;
  pausedTime: number;
  durationSeconds: number;
  randomization: RandomizationState | null;
  status: 'idle' | 'in-progress' | 'paused' | 'completed';
}

const SESSION_KEY = 'quiz-studio-session';
const CURRENT_VERSION = 1;

function safeJSONParse<T>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try {
    const parsed = JSON.parse(str);
    return parsed as T;
  } catch {
    return fallback;
  }
}

export const sessionStorage = {
  save(session: SessionData): void {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('Failed to save session:', e);
    }
  },

  load(): SessionData | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    try {
      const session = JSON.parse(raw) as SessionData;

      // Version check - clear if version mismatch
      if (session.version !== CURRENT_VERSION) {
        this.clear();
        return null;
      }

      // Basic structure validation
      if (!session.timestamp || !session.lastPath || !session.quiz) {
        this.clear();
        return null;
      }

      // Validate quiz structure
      if (!session.quiz.id || !Array.isArray(session.quiz.questions)) {
        this.clear();
        return null;
      }

      // Check if session is too old (7 days)
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - session.timestamp > sevenDaysMs) {
        this.clear();
        return null;
      }

      return session;
    } catch {
      this.clear();
      return null;
    }
  },

  clear(): void {
    localStorage.removeItem(SESSION_KEY);
  },

  hasSession(): boolean {
    return this.load() !== null;
  },
};

/**
 * Wipe ALL app-related data from localStorage and sessionStorage.
 * Use this for a full "factory reset" — equivalent to first visit.
 */
export function clearAllAppData(): void {
  // Known keys used by the app
  const knownKeys = [
    SESSION_KEY,          // 'quiz-studio-session'
    'quiz-studio-quiz',   // Zustand persist key for quizStore
  ];

  // Remove all known keys
  knownKeys.forEach((key) => localStorage.removeItem(key));

  // Safety net: remove any remaining keys that start with 'quiz-studio'
  const allKeys = Object.keys(localStorage);
  allKeys.forEach((key) => {
    if (key.startsWith('quiz-studio')) {
      localStorage.removeItem(key);
    }
  });

  // Also clear sessionStorage in case anything leaked there
  try {
    const ssKeys = Object.keys(window.sessionStorage);
    ssKeys.forEach((key) => {
      if (key.startsWith('quiz-studio')) {
        window.sessionStorage.removeItem(key);
      }
    });
  } catch {
    // sessionStorage might be unavailable in some environments
  }
}

// Debounce utility for auto-save
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
