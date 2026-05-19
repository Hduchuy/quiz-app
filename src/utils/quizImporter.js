/**
 * Shared Quiz Import Pipeline
 *
 * ALL quiz sources (upload, library, import) MUST use this function.
 * This ensures consistent parsing and normalization.
 */

import { parseQuestions } from './questionParser';
import { normalizeQuestions } from './quizModels';

/**
 * Import quiz from raw text
 * @param {string} rawText - Raw text content of quiz file
 * @returns {Promise<Array>} - Normalized questions array
 */
export async function importQuizFromText(rawText) {
  // Validate input
  if (typeof rawText !== 'string') {
    console.error('[importQuizFromText] Invalid input: not a string', typeof rawText);
    return [];
  }

  // Normalize line endings
  const text = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  // Parse questions
  const questions = parseQuestions(text);

  if (questions.length === 0) {
    console.warn('[importQuizFromText] Parser returned 0 questions');
    return [];
  }

  // Normalize questions
  const normalized = normalizeQuestions(questions);

  return normalized;
}
