/**
 * Quiz Export Utility
 * 
 * Exports quiz to text format that can be re-imported by the parser.
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
    const qNum = i + 1;
    
    if (q.type === 'single' || q.type === 'multiple') {
      const typeLabel = q.type.toUpperCase();
      lines.push(`[${typeLabel}]`);
      lines.push(`Câu ${qNum}: ${q.question}`);
      for (const option of q.options) {
        const prefix = includeAnswers && option.correct ? '*' : '';
        lines.push(`${prefix}${option.label}. ${option.text}`);
      }
    }
    
    else if (q.type === 'true_false') {
      lines.push('[TRUE_FALSE]');
      lines.push(`Câu ${qNum}: ${q.question || 'Xác định Đúng/Sai'}`);
      for (let j = 0; j < (q.statements || []).length; j++) {
        const statement = q.statements[j];
        const answerMarker = includeAnswers && statement.answer !== null
          ? ` [${statement.answer === true ? 'Đúng' : 'Sai'}]`
          : '';
        lines.push(`${j + 1}. ${statement.text}${answerMarker}`);
      }
    }

    else if (q.type === 'match') {
      lines.push('[MATCH]');
      lines.push(`Câu ${qNum}: ${q.question}`);
      lines.push('');
      
      lines.push('LEFT:');
      (q.targets || []).forEach(t => {
        lines.push(`${t.id}|${t.text}`);
      });
      lines.push('');

      lines.push('RIGHT:');
      (q.answerBank || []).forEach(ans => {
        const distactorTag = ans.distractor ? ' [DISTRACTOR]' : '';
        lines.push(`${ans.id}|${ans.text}${distactorTag}`);
      });
      lines.push('');

      if (includeAnswers && q.correctMatches) {
        lines.push('CORRECT:');
        Object.keys(q.correctMatches).forEach(targetId => {
          const answerIds = q.correctMatches[targetId];
          if (answerIds && answerIds.length > 0) {
            lines.push(`${targetId}=>${answerIds.join('|')}`);
          }
        });
      }
    }

    else if (q.type === 'cloze') {
      lines.push('[CLOZE]');
      lines.push(`Câu ${qNum}:`);
      lines.push('');
      
      lines.push('TEXT:');
      let questionText = '';
      const segments = q.segments || [];
      segments.forEach(seg => {
        if (seg.type === 'text') questionText += seg.content;
        else if (seg.type === 'blank') {
          if (includeAnswers) {
            questionText += `{{${(seg.answers || []).join('|')}}}`;
          } else {
            questionText += `{{}}`;
          }
        }
      });
      lines.push(questionText);
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
