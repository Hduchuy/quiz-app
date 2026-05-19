import type { Question } from '@/types';
import { createEmptyMCQ, createEmptyTrueFalse } from '@/types';

interface ParseResult {
  questions: Question[];
  errors: string[];
  warnings: string[];
}

// Question start patterns - ONLY these create new questions
// Must match "Câu X:" style patterns at start of line
const QUESTION_START_PATTERNS = [
  /^câu\s+\d+[.:)]\s*/i,
];

// Check if line is a question start
function isQuestionStart(line: string): boolean {
  const trimmed = line.trim();
  for (const pattern of QUESTION_START_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }
  return false;
}

// Check if line is an option (A. B. C. D.)
function isOption(line: string): boolean {
  return /^[A-D][.):]\s*.+/i.test(line.trim());
}

// Check if line is a numbered statement (1. 2. 3. 4.) inside DUNG_SAI
function isStatement(line: string): boolean {
  return /^\d+[.):]\s*.+/i.test(line.trim());
}

// Detect question type from block content
function detectType(blockLines: string[]): 'mcq' | 'truefalse' | 'unknown' {
  let hasOptions = false;
  let hasStatements = false;
  
  for (const line of blockLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    if (isOption(trimmed)) hasOptions = true;
    if (isStatement(trimmed)) hasStatements = true;
  }
  
  if (hasOptions && !hasStatements) return 'mcq';
  if (hasStatements && !hasOptions) return 'truefalse';
  return 'unknown';
}

// Extract question blocks - stops at question starts only
function extractBlocks(text: string): string[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const blocks: { start: number; end: number }[] = [];
  
  // Find all question start indices (only "Câu X:" patterns)
  const startIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (isQuestionStart(lines[i])) {
      startIndices.push(i);
    }
  }
  
  // If no question starts found, try treating whole text as one block
  if (startIndices.length === 0) {
    const nonEmptyLines = lines.filter(l => l.trim().length > 0);
    if (nonEmptyLines.length > 0) {
      return [text];
    }
    return [];
  }
  
  // Create blocks from start indices
  for (let i = 0; i < startIndices.length; i++) {
    const start = startIndices[i];
    const end = i + 1 < startIndices.length ? startIndices[i + 1] : lines.length;
    blocks.push({ start, end });
  }
  
  // Extract block text
  return blocks.map(block => lines.slice(block.start, block.end).join('\n'));
}

// Parse TRAC_NGHIEM block
function parseMCQBlock(block: string, warnings: string[]): Question | null {
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  
  // First line is question title
  const title = lines[0].replace(/^câu\s*\d+[.:)]\s*/i, '').trim();
  if (!title) return null;
  
  // Parse options
  const options: string[] = ['', '', '', ''];
  const correctIndices: number[] = []; // Collect ALL correct options
  
  for (const line of lines.slice(1)) {
    // Check for correct marker: *A. or *B) - collect ALL starred options
    const correctMatch = line.match(/^\*([A-D])[.):]\s*(.*)/i);
    if (correctMatch) {
      const idx = correctMatch[1].toUpperCase().charCodeAt(0) - 65;
      if (correctMatch[2].trim()) {
        options[idx] = correctMatch[2].trim();
      }
      // Don't skip - collect ALL starred options
      correctIndices.push(idx);
      continue;
    }
    
    // Check for option: A. or A)
    const optionMatch = line.match(/^([A-D])[.):]\s*(.*)/i);
    if (optionMatch) {
      const idx = optionMatch[1].toUpperCase().charCodeAt(0) - 65;
      if (optionMatch[2].trim()) {
        options[idx] = optionMatch[2].trim();
      }
    }
  }
  
  // Count valid options
  const validOptions = options.filter(o => o.length > 0);
  
  // MCQ requires 4 options A, B, C, D
  if (validOptions.length !== 4) {
    warnings.push(`"${title}" - cần 4 đáp án A,B,C,D (có ${validOptions.length})`);
    return null;
  }
  
  // Create options - keep unanswered if no starred options found (NO AUTO-SELECT A)
  const question = createEmptyMCQ();
  question.title = title;
  question.options = options.map((text, i) => ({
    id: crypto.randomUUID(),
    text,
    correct: correctIndices.length > 0 ? correctIndices.includes(i) : null,
  }));

  return question;
}

// Parse DUNG_SAI block
function parseTrueFalseBlock(block: string, warnings: string[]): Question | null {
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  
  // First line is question title
  const title = lines[0].replace(/^câu\s*\d+[.:)]\s*/i, '').trim();
  if (!title) return null;
  
  // Parse statements 1, 2, 3, 4
  const statements: { text: string; answer: boolean | null }[] = [];
  let currentStatement: { text: string; answer: boolean | null } | null = null;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for statement: 1. or 2) etc
    const statementMatch = line.match(/^(\d+)[.):]\s*(.*)/);
    if (statementMatch) {
      // Save previous statement
      if (currentStatement) {
        statements.push(currentStatement);
      }
      currentStatement = {
        text: statementMatch[2].trim(),
        answer: null,
      };
      continue;
    }
    
    // Check for [Đúng] or [Sai]
    const bracketMatch = line.match(/^\[(đúng|sai)\]/i);
    if (bracketMatch && currentStatement) {
      currentStatement.answer = /^đúng$/i.test(bracketMatch[1]);
      continue;
    }
    
    // Check for standalone Đúng/Sai
    const standaloneMatch = line.match(/^(đúng|sai)$/i);
    if (standaloneMatch && currentStatement) {
      currentStatement.answer = /^đúng$/i.test(standaloneMatch[1]);
      continue;
    }
    
    // If no statement started yet, skip
    if (!currentStatement) continue;
    
    // If statement has no text yet, this line is the text
    if (!currentStatement.text) {
      currentStatement.text = line;
    }
  }
  
  // Don't forget last statement
  if (currentStatement) {
    statements.push(currentStatement);
  }
  
  // Count valid statements
  const validStatements = statements.filter(s => s.text.length > 0);
  
  // DUNG_SAI requires 4 statements
  if (validStatements.length !== 4) {
    warnings.push(`"${title}" - cần 4 mệnh đề 1,2,3,4 (có ${validStatements.length})`);
    return null;
  }
  
  const question = createEmptyTrueFalse();
  question.title = title;
  question.statements = validStatements.map((s) => ({
    id: crypto.randomUUID(),
    text: s.text,
    answer: s.answer ?? null, // Keep null if not specified
  }));

  return question;
}

/**
 * Smart flexible parser for Vietnamese quiz files
 * Uses block-based structure detection
 */
export function parseQuizText(text: string): ParseResult {
  const result: ParseResult = {
    questions: [],
    errors: [],
    warnings: [],
  };

  // Extract blocks (only splits on "Câu X:" patterns)
  const blocks = extractBlocks(text);
  
  for (const block of blocks) {
    if (!block.trim()) continue;
    
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    
    // Detect type from block content
    const blockType = detectType(lines);
    
    if (blockType === 'mcq') {
      const question = parseMCQBlock(block, result.warnings);
      if (question) result.questions.push(question);
    } else if (blockType === 'truefalse') {
      const question = parseTrueFalseBlock(block, result.warnings);
      if (question) result.questions.push(question);
    } else {
      // Unknown - try MCQ first
      const question = parseMCQBlock(block, result.warnings);
      if (question) {
        result.questions.push(question);
      } else {
        const tf = parseTrueFalseBlock(block, result.warnings);
        if (tf) result.questions.push(tf);
      }
    }
  }

  return result;
}

export function parseTextFile(content: string): ParseResult {
  return parseQuizText(content);
}

export async function parseDocxFile(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  if (result.messages?.length > 0) {
    console.warn('DOCX parsing warnings:', result.messages);
  }
  return result.value;
}
