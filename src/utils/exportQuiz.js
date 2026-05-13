/**
 * Quiz Export Utility
 * 
 * Exports quiz to text format that can be re-imported by the parser.
 * Format:
 * - * prefix marks correct answers for multiple choice
 * - [Đúng]/[Sai] suffix for true/false
 */

/**
 * Export quiz to text format
 * @param {Array} questions - Edited questions array
 * @param {boolean} includeAnswers - Whether to include answer markers
 * @returns {string} - Formatted quiz text
 */
export function exportQuiz(questions, includeAnswers = false) {
  const lines = [];
  
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    
    // Question header
    lines.push(`Câu ${i + 1}: ${q.question}`);
    lines.push(''); // Empty line after header
    
    if (q.type === 'multiple') {
      // Export options
      for (const option of q.options) {
        const prefix = includeAnswers && option.correct ? '*' : '';
        lines.push(`${prefix}${option.label}. ${option.text}`);
      }
    }
    
    if (q.type === 'truefalse-group') {
      // Export statements
      for (let j = 0; j < q.statements.length; j++) {
        const statement = q.statements[j];
        const answerMarker = includeAnswers 
          ? ` [${statement.answer === true ? 'Đúng' : statement.answer === false ? 'Sai' : '?'}]`
          : '';
        lines.push(`${j + 1}. ${statement.text}${answerMarker}`);
      }
    }
    
    lines.push(''); // Empty line between questions
  }
  
  return lines.join('\n');
}

/**
 * Download quiz as file
 */
export function downloadQuiz(questions, includeAnswers = false, filename = 'quiz') {
  const content = exportQuiz(questions, includeAnswers);
  const suffix = includeAnswers ? '-with-answers' : '';
  const fullFilename = `${filename}${suffix}.txt`;
  
  downloadTextFile(content, fullFilename);
}

/**
 * Helper to download text content
 */
function downloadTextFile(content, filename) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename from original or default
 */
export function generateFilename(originalName, suffix) {
  if (!originalName) {
    return `quiz${suffix}.txt`;
  }
  
  // Remove extension
  const baseName = originalName.replace(/\.(docx|txt)$/i, '');
  return `${baseName}${suffix}.txt`;
}
