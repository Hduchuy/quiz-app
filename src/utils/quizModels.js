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
    type,  // "single", "multiple", "true_false", "match", "cloze"
    question,
    options,
    statements,
    questionNumber: null,
    maxCorrectAnswers,
    targets: [],      
    answerBank: [],   
    correctMatches: {}, 
    segments: [],       
    fillMode: 'input'
  };
}

/**
 * Convert segments to string syntax {{answer}}
 */
export function stringifySegments(segments = []) {
  return segments.map(seg => {
    if (seg.type === 'text') return seg.content || '';
    if (seg.type === 'blank') return `{{${(seg.answers || []).join('|')}}}`;
    return '';
  }).join('');
}

export function normalizeQuestion(q) {
  const normalized = {
    id: q.id || generateId(),
    type: q.type || 'single',
    question: q.question || '',
    options: Array.isArray(q.options) ? q.options : [],
    statements: Array.isArray(q.statements) ? q.statements : [],
    targets: Array.isArray(q.targets) ? q.targets : [],
    answerBank: Array.isArray(q.answerBank) ? q.answerBank : [],
    correctMatches: q.correctMatches || {},
    segments: Array.isArray(q.segments) ? q.segments : [],
    fillMode: q.fillMode || 'input',
    questionNumber: q.questionNumber || null,
    maxCorrectAnswers: q.maxCorrectAnswers || null
  };

  // Ensure types are standardized
  if (normalized.type === 'truefalse-group') normalized.type = 'true_false';
  if (normalized.type === 'dragdrop-match') normalized.type = 'match';
  if (normalized.type === 'dragdrop-fill') normalized.type = 'cloze';


  // Support for cloze syntax {{ }}
  if (normalized.type === 'cloze') {
    // If segments exist, ensure question text is in sync for export
    if (normalized.segments.length > 0) {
      normalized.question = stringifySegments(normalized.segments);
    } 
    // If segments don't exist but question has syntax, parse it (Initial import)
    else if (normalized.question && normalized.question.includes('{{')) {
      const segments = [];
      const parts = normalized.question.split(/(\{\{[^}]+\}\})/g);
      parts.forEach((part, idx) => {
        const match = part.match(/^\{\{(.+)\}\}$/);
        if (match) {
          const answers = match[1].split('|').map(a => a.trim()).filter(a => a.length > 0);
          segments.push({
            type: 'blank',
            id: `blank_${Date.now()}_${idx}`,
            answers
          });
        } else if (part) {
          segments.push({
            type: 'text',
            content: part
          });
        }
      });
      normalized.segments = segments;
    }
    normalized.fillMode = 'input';
  }

  return normalized;
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
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*[:.]\s*(.+)$/i);
    if (match) {
      const key = match[1];
      const value = match[2].trim();
      
      if (/^(đúng|đ|d|true|1)$/i.test(value)) {
        answerKey[key] = [true];
      } else if (/^(sai|s|false|0)$/i.test(value)) {
        answerKey[key] = [false];
      } else {
        const letters = value.split(/[,;]/).map(v => v.trim().toUpperCase());
        answerKey[key] = letters;
      }
    }
  }
  
  return answerKey;
}

/**
 * Apply answer key to questions
 */
export function applyAnswerKey(questions, answerKey) {
  return questions.map((q, index) => {
    const qNum = String(index + 1);
    
    if (q.type === 'single' || q.type === 'multiple') {
      const answers = answerKey[qNum] || [];
      const newOptions = q.options.map(opt => ({
        ...opt,
        correct: answers.includes(opt.label)
      }));
      return { ...q, options: newOptions };
    }
    
    if (q.type === 'true_false') {
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
    if (q.type === 'single' || q.type === 'multiple') {
      return q.options.some(o => o.correct === true);
    }
    if (q.type === 'true_false') {
      return q.statements.some(s => s.answer !== null);
    }
    if (q.type === 'match') {
      return q.targets.length > 0 && Object.keys(q.correctMatches || {}).length > 0;
    }
    if (q.type === 'cloze') {
      const blanks = (q.segments || []).filter(s => s.type === 'blank');
      return blanks.length > 0 && blanks.every(b => b.answers && b.answers.length > 0);
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
 */
function regenerateDisplayLabels(options) {
  const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  return options.map((opt, index) => ({
    ...opt,
    label: labels[index] || String(index + 1)
  }));
}

/**
 * Prepare quiz with settings
 */
export function prepareQuizWithSettings(questions, settings = {}) {
  if (!Array.isArray(questions)) return [];
  const {
    shuffleQuestions = false,
    shuffleAnswers = false,
    shuffleTrueFalse = false,
    shuffleDragMatch = false
  } = settings;

  const clonedQuestions = questions.map(q => ({
    ...q,
    options: q.options ? q.options.map(opt => ({ ...opt })) : [],
    statements: q.statements ? q.statements.map(s => ({ ...s })) : [],
    targets: q.targets ? q.targets.map(t => ({ ...t })) : [],
    answerBank: q.answerBank ? q.answerBank.map(a => ({ ...a })) : [],
    correctMatches: q.correctMatches ? { ...q.correctMatches } : {},
    segments: q.segments ? q.segments.map(s => ({ ...s, answers: s.answers ? [...s.answers] : [] })) : []
  }));

  const orderedQuestions = shuffleQuestions
    ? shuffleArray(clonedQuestions)
    : clonedQuestions;

  const result = orderedQuestions.map(q => {
    if (q.type === 'single' || q.type === 'multiple') {
      const orderedOptions = shuffleAnswers ? shuffleArray(q.options) : q.options;
      const labeledOptions = regenerateDisplayLabels(orderedOptions);
      return { ...q, options: labeledOptions };
    }

    if (q.type === 'true_false') {
      return { ...q, statements: shuffleTrueFalse ? shuffleArray(q.statements) : q.statements };
    }

    if (q.type === 'match') {
      return {
        ...q,
        targets: shuffleDragMatch ? shuffleArray(q.targets) : q.targets,
        shuffledAnswers: shuffleAnswers ? shuffleArray(q.answerBank) : q.answerBank
      };
    }

    if (q.type === 'cloze') {
      return { ...q }; // Cloze uses text input by default in the new format
    }

    return q;
  });

  return result;
}

export function reprepareQuiz(editedQuestions, savedShuffledQuestions) {
  if (!Array.isArray(editedQuestions)) return [];
  if (!savedShuffledQuestions || savedShuffledQuestions.length === 0) {
    return prepareQuizWithSettings(editedQuestions);
  }

  const savedById = {};
  savedShuffledQuestions.forEach(q => { savedById[q.id] = q; });

  return editedQuestions
    .map(q => {
      const savedQ = savedById[q.id];
      if (!savedQ) return null;

      if (q.type === 'single' || q.type === 'multiple') {
        const restoredOptions = savedQ.options
          .map(savedOpt => q.options.find(o => o.id === savedOpt.id))
          .filter(Boolean);
        const labeledOptions = regenerateDisplayLabels(restoredOptions);
        return { ...q, options: labeledOptions };
      }

      if (q.type === 'true_false') {
        const restoredStatements = savedQ.statements
          ? savedQ.statements.map(savedStmt => q.statements.find(s => s.id === savedStmt.id)).filter(Boolean)
          : q.statements;
        return { ...q, statements: restoredStatements.length === q.statements.length ? restoredStatements : q.statements };
      }

      if (q.type === 'match') {
        return {
          ...q,
          targets: savedQ.targets || q.targets,
          shuffledAnswers: savedQ.shuffledAnswers || q.answerBank
        };
      }

      if (q.type === 'cloze') {
        return {
          ...q,
          segments: savedQ.segments || q.segments
        };
      }

      return q;
    })
    .filter(Boolean);
}
