/**
 * Simple Question Parser
 * 
 * Parses plain text format from DOCX/TXT files
 * NO dependency on DOCX XML styling, colors, or metadata
 * 
 * Supported formats:
 * 
 * Multiple Choice:
 * Câu 1: question text
 * A. option A
 * B. option B (or *B. option B if correct)
 * C. option C
 * D. option D
 * 
 * True/False Group - Format A (separate lines):
 * Câu 28: question text
 * 1. statement one
 *   Đúng
 * 2. statement two
 *   *Sai
 * 
 * True/False Group - Format B (inline):
 * Câu 28: question text
 * 1. statement one [Đúng]
 * 2. statement two [Sai]
 */

import { createOption, createStatement, createQuestion } from './quizModels';

/**
 * Extract text from DOCX or plain text
 */
export async function extractText(file) {
  if (file.name.endsWith('.docx')) {
    return await extractTextFromDocx(file);
  }
  // Plain text file
  return await file.text();
}

async function extractTextFromDocx(file) {
  const JSZip = (await import('jszip')).default;
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  
  const documentXml = await zip.file('word/document.xml')?.async('string');
  if (!documentXml) {
    throw new Error('Invalid DOCX file: missing document.xml');
  }
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(documentXml, 'text/xml');
  
  const lines = [];
  const allPElements = doc.getElementsByTagName('w:p');
  
  for (let i = 0; i < allPElements.length; i++) {
    const p = allPElements[i];
    
    // Collect all text nodes within this paragraph
    let textContent = '';
    const allTextElements = p.getElementsByTagName('w:t');
    
    for (let t = 0; t < allTextElements.length; t++) {
      if (allTextElements[t].textContent) {
        textContent += allTextElements[t].textContent;
      }
    }
    
    // Light normalization - only non-breaking spaces
    const text = textContent.replace(/\u00A0/g, ' ').trim();
    
    if (text) {
      lines.push(text);
    }
  }
  
  return lines.join('\n');
}

/**
 * Parse questions from text
 */
export function parseQuestions(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  const questions = [];
  let currentQuestion = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // NEW QUESTION - detect "Câu X:" pattern
    if (/^Câu\s+\d+/i.test(line)) {
      // Save previous question
      if (currentQuestion) {
        questions.push(currentQuestion);
      }

      // Parse question text (remove "Câu X:" prefix)
      let questionText = line.replace(/^Câu\s+\d+[:).]\s*/i, '').trim();

      // Check next line for multi-answer pattern
      const nextLine = lines[i + 1] || '';
      
      // VERY AGGRESSIVE matching - look for any "Chọn N" pattern
      // Match formats: "(Chọn 2)", "(Chọn 2 đáp án đúng)", "Chọn 2", etc.
      // Use word boundary and case-insensitive matching
      let chonMatch = nextLine.match(/chọn\s*(\d+)/i) ||
                     nextLine.match(/\((\d+)\)/);  // Standalone "(2)" as fallback
      
      // ALSO check if hint is embedded in the question text itself
      // e.g., "Câu 1: (Chọn 2 đáp án đúng)" - pattern is on same line
      if (!chonMatch) {
        chonMatch = questionText.match(/chọn\s*(\d+)/i);
        // If found in question text, remove it from the displayed text
        if (chonMatch) {
          questionText = questionText.replace(/\(.*chọn.*?\)|\[.*chọn.*?\]/gi, '').trim();
          console.log(`[PARSER] Found "Chọn" in question text, remaining: "${questionText}"`);
        }
      }
      
      let maxCorrectAnswers = null;
      if (chonMatch) {
        maxCorrectAnswers = parseInt(chonMatch[1], 10);
        console.log(`[PARSER] ✓ Detected "Chọn ${maxCorrectAnswers}" from: "${nextLine || questionText}"`);
        if (nextLine.match(/chọn/i)) {
          i++; // Skip the next line only if it contains the pattern
        }
      }

      currentQuestion = createQuestion({
        type: null,
        question: questionText,
        options: [],
        statements: [],
        maxCorrectAnswers
      });
      continue;
    }

    if (!currentQuestion) {
      continue;
    }

    // MULTIPLE CHOICE option (A. B. C. D.)
    // Match: A. text, A) text, A: text
    // Support * prefix for correct answer: *A. text
    const mcMatch = line.match(/^\*?([A-D])[).:]\s*(.+)$/i);
    if (mcMatch) {
      currentQuestion.type = 'multiple';
      const isCorrect = line.startsWith('*');
      const option = createOption({
        label: mcMatch[1].toUpperCase(),
        text: mcMatch[2].trim()
      });
      option.correct = isCorrect;
      currentQuestion.options.push(option);
      continue;
    }

    // TRUE/FALSE statement (numbered: 1. 2. 3.)
    // Match: 1. text, 1) text, 1: text
    // Support [Đúng] or [Sai] suffix for answer (Format B)
    // Support * prefix for answer on same line (Format A: "1. text" then "*Đúng" on next line)
    // Also support inline: "1. text *Đúng" or "1. text *Sai"
    const tfMatch = line.match(/^(\d+)[).:]\s*(.+?)\s*(?:\[(Đúng|Sai|\?)\])?$/);
    if (tfMatch) {
      currentQuestion.type = 'truefalse-group';
      const statementText = tfMatch[2].trim();
      const answerStr = tfMatch[3];

      let answer = null;
      if (answerStr === 'Đúng') answer = true;
      else if (answerStr === 'Sai') answer = false;

      const statement = createStatement({
        text: statementText,
        answer: answer
      });
      currentQuestion.statements.push(statement);
      continue;
    }

    // TRUE/FALSE FORMAT A: Answer marker on separate line (*Đúng or *Sai or just Đúng/Sai)
    // This handles the case where a statement line is followed by "*Đúng" or "Đúng" alone
    const standaloneAnswerMatch = line.match(/^\*?\s*(Đúng|Sai)\s*$/i);
    if (standaloneAnswerMatch && currentQuestion.type === 'truefalse-group') {
      const lastStatement = currentQuestion.statements[currentQuestion.statements.length - 1];
      if (lastStatement && lastStatement.answer === null) {
        const answerStr = standaloneAnswerMatch[1];
        if (answerStr === 'Đúng') lastStatement.answer = true;
        else if (answerStr === 'Sai') lastStatement.answer = false;
        continue;
      }
    }
  }

  // Don't forget the last question
  if (currentQuestion) {
    // Fallback: if multiple options are marked correct, infer multi-answer
    const correctCount = currentQuestion.options.filter(o => o.correct).length;
    if (correctCount > 1 && currentQuestion.maxCorrectAnswers === null) {
      currentQuestion.maxCorrectAnswers = correctCount;
      console.log(`[PARSER] Inferred multi-answer from ${correctCount} correct options`);
    }
    questions.push(currentQuestion);
  }

  return questions;
}

/**
 * Load and parse quiz from file
 */
export async function loadQuiz(file) {
  const text = await extractText(file);
  
  // Debug: show first few lines
  const lines = text.split('\n').filter(l => l.trim());
  console.log('[LOAD QUIZ] First 10 lines:', lines.slice(0, 10));
  
  const questions = parseQuestions(text);
  
  // Debug: show parsed questions
  console.log('[LOAD QUIZ] Parsed questions:', questions.map(q => ({
    question: q.question?.substring(0, 50),
    maxCorrectAnswers: q.maxCorrectAnswers,
    type: q.type,
    optionsCount: q.options?.length
  })));
  
  return questions;
}
