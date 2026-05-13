/**
 * Quiz App Data Models
 *
 * Architecture:
 * - Options have stable IDs that persist across shuffles
 * - Each option object has { id, label, text, correct }
 * - Shuffle moves entire option objects (correct flag stays attached)
 * - Display labels (A/B/C/D) are regenerated from display position
 * - Selection is stored by option.id, not by letter or index
 * - Scoring checks option.correct after finding by option.id
 * - Support for practice mode (no answer key)
 */

// Generate unique IDs for options and statements
let idCounter = 0;
export function generateId() {
  return `opt_${Date.now()}_${++idCounter}`;
}

export function generateStatementId(questionIndex, statementIndex) {
  return `q${questionIndex}_s${statementIndex}`;
}

/**
 * Create a new option object
 */
export function createOption({ label, text }) {
  return {
    id: generateId(),
    label,      // "A", "B", "C", "D"
    text,       // "4", "Paris", etc.
    correct: false  // Set by answer key later
  };
}

/**
 * Create a new statement object for true/false questions
 */
export function createStatement({ text, answer = null }) {
  return {
    id: generateId(),
    text,
    answer,  // null = unknown, true = Đúng, false = Sai
    userAnswer: null  // Set by user selection
  };
}

/**
 * Create a new question object
 */
export function createQuestion({ type, question, options = [], statements = [], maxCorrectAnswers = null }) {
  return {
    id: generateId(),
    type,  // "multiple" or "truefalse-group"
    question,
    options,
    statements,
    questionNumber: null,  // Set during parsing
    maxCorrectAnswers  // null for single-choice, N for multi-choice
  };
}

/**
 * Normalize a question to ensure consistent structure
 * Every question MUST have: type, question, options, statements, maxCorrectAnswers
 */
export function normalizeQuestion(q) {
  return {
    id: q.id || generateId(),
    type: q.type || 'multiple',
    question: q.question || '',
    options: Array.isArray(q.options) ? q.options : [],
    statements: Array.isArray(q.statements) ? q.statements : [],
    questionNumber: q.questionNumber || null,
    maxCorrectAnswers: q.maxCorrectAnswers || null
  };
}

/**
 * Normalize an array of questions
 */
export function normalizeQuestions(questions) {
  if (!Array.isArray(questions)) return [];
  return questions.map(normalizeQuestion);
}

/**
 * Answer Key format:
 * {
 *   "1": ["B"],           // Question 1, answer B
 *   "2": ["C"],           // Question 2, answer C
 *   "3": ["A", "D"],      // Question 3, multiple correct (A and D)
 *   "28.1": [true],       // Question 28, statement 1 = Đúng
 *   "28.2": [false],      // Question 28, statement 2 = Sai
 * }
 */
export function parseAnswerKey(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const answerKey = {};
  
  for (const line of lines) {
    // Match patterns like:
    // 1:B or 1. B or 1:B,D or 1:B,D
    // 28.1:Đúng or 28.1:Đ or 28.1:D or 28.1:True
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Question number (may include .statement for TF)
    // Format: "1:B" or "1. B" or "1:B,D"
    const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*[:.]\s*(.+)$/i);
    if (match) {
      const key = match[1];
      const value = match[2].trim();
      
      // Parse the answer value
      if (/^(đúng|đ|d|true|1)$/i.test(value)) {
        answerKey[key] = [true];
      } else if (/^(sai|s|false|0)$/i.test(value)) {
        answerKey[key] = [false];
      } else {
        // Multiple choice: split by comma
        const letters = value.split(/[,;]/).map(v => v.trim().toUpperCase());
        answerKey[key] = letters;
      }
    }
  }
  
  return answerKey;
}

/**
 * Apply answer key to questions
 * Sets option.correct and statement.answer based on answer key
 */
export function applyAnswerKey(questions, answerKey) {
  return questions.map((q, index) => {
    const qNum = String(index + 1);
    
    if (q.type === 'multiple') {
      // Find answers for this question (e.g., "1", "1:B", "1:B,C")
      const answers = answerKey[qNum] || [];
      
      const newOptions = q.options.map(opt => ({
        ...opt,
        correct: answers.includes(opt.label)
      }));
      
      return { ...q, options: newOptions };
    }
    
    if (q.type === 'truefalse-group') {
      const newStatements = q.statements.map((stmt, sIndex) => {
        const key = `${qNum}.${sIndex + 1}`;
        const answers = answerKey[key];
        
        if (answers && answers.length > 0) {
          return { ...stmt, answer: answers[0] };
        }
        return stmt;
      });
      
      return { ...q, statements: newStatements };
    }
    
    return q;
  });
}

/**
 * Check if questions have an answer key
 */
export function hasAnswerKey(questions) {
  return questions.some(q => {
    if (q.type === 'multiple') {
      return q.options.some(o => o.correct === true);
    }
    if (q.type === 'truefalse-group') {
      return q.statements.some(s => s.answer !== null);
    }
    return false;
  });
}

/**
 * Shuffle array with Fisher-Yates
 */
export function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Regenerate display labels based on current array position
 * This ensures labels show A/B/C/D in display order, not original file order
 */
function regenerateDisplayLabels(options) {
  const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  return options.map((opt, index) => ({
    ...opt,
    label: labels[index] || String(index + 1)
  }));
}

/**
 * Prepare quiz - shuffle questions and options
 * - Shuffles question order
 * - Shuffles options within each question (preserving correct flag on option object)
 * - Regenerates display labels (A/B/C/D) based on shuffled positions
 * - Selection is stored by option.id, so scoring remains correct
 */
export function prepareQuiz(questions) {
  // Debug: show first question's maxCorrectAnswers
  console.log('[prepareQuiz] Input:', questions.map(q => ({
    q: q.question?.substring(0, 30),
    maxCorrectAnswers: q.maxCorrectAnswers
  })));

  // Shuffle question order
  const shuffledQuestions = shuffleArray(questions);

  const result = shuffledQuestions.map(q => {
    if (q.type === 'multiple') {
      // Shuffle options (correct flag stays attached to each option object)
      const shuffledOptions = shuffleArray(q.options);
      // Regenerate labels based on new display order
      const labeledOptions = regenerateDisplayLabels(shuffledOptions);
      return {
        ...q,
        options: labeledOptions,
        statements: []
      };
    }

    if (q.type === 'truefalse-group') {
      return {
        ...q,
        options: [],
        statements: q.statements  // Don't shuffle statements
      };
    }

    return q;
  });

  console.log('[prepareQuiz] Output:', result.map(q => ({
    q: q.question?.substring(0, 30),
    maxCorrectAnswers: q.maxCorrectAnswers
  })));

  return result;
}

/**
 * Re-prepare quiz for restore session
 * Restores the exact shuffled order from the saved session
 * Only regenerates display labels to match current positions
 * This ensures:
 * 1. Options appear in the same order as when the quiz was started
 * 2. Labels (A/B/C/D) are regenerated to match display positions
 * 3. Option IDs remain stable for scoring
 */
export function reprepareQuiz(editedQuestions, savedShuffledQuestions) {
  if (!savedShuffledQuestions || savedShuffledQuestions.length === 0) {
    // No saved shuffle data - do fresh shuffle
    return prepareQuiz(editedQuestions);
  }

  // Build a map of question ID -> saved shuffled question
  const savedById = {};
  savedShuffledQuestions.forEach(q => {
    savedById[q.id] = q;
  });

  // Reconstruct shuffled questions using saved order (by ID matching)
  return editedQuestions
    .map(q => {
      const savedQ = savedById[q.id];
      if (!savedQ) return null;

      if (q.type === 'multiple') {
        // Match options by ID to preserve the shuffled order
        const savedOptionsById = {};
        savedQ.options?.forEach(opt => {
          savedOptionsById[opt.id] = opt;
        });

        // Reconstruct options in saved order, matching by ID
        const restoredOptions = savedQ.options
          .map(savedOpt => {
            const currentOpt = q.options.find(o => o.id === savedOpt.id);
            return currentOpt ? { ...currentOpt } : null;
          })
          .filter(Boolean);

        // Regenerate labels based on restored display order
        const labeledOptions = regenerateDisplayLabels(restoredOptions);

        return {
          ...q,
          options: labeledOptions,
          statements: []
        };
      }

      if (q.type === 'truefalse-group') {
        return {
          ...q,
          options: [],
          statements: q.statements  // Statements are not shuffled
        };
      }

      return q;
    })
    .filter(Boolean);
}
