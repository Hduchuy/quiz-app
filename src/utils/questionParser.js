import { createOption, createStatement, createQuestion } from './quizModels';

/**
 * Preprocess text to normalize common Word/TXT formatting issues
 */
function preprocessText(text) {
  if (!text) return '';

  // 1. Normalize Unicode (NFKC) and remove BOM
  let processed = text.normalize('NFKC').replace(/^\uFEFF/, '');

  // 2. Normalize line endings to LF (\n)
  processed = processed.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 3. Normalize quotes, hyphens, and bullets
  processed = processed.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"');
  processed = processed.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");
  processed = processed.replace(/[\u2013\u2014\u2212]/g, '-');
  processed = processed.replace(/[\u2022\u2023\u2043\u204C\u204D\u2219\u25CB\u25CF\u25E6\u2619\u2761\u27A2\u27A3\u27A4]/g, '*'); // Standardize bullets

  // 4. Normalize spacing
  processed = processed.replace(/\u00A0/g, ' '); // Non-breaking space
  processed = processed.replace(/[\u200B-\u200D\uFEFF\u2060\u200E\u200F]/g, ''); // Zero-width and invisible chars
  processed = processed.replace(/[ \t]+/g, ' '); // Collapse horizontal whitespace

  return processed;
}

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
    let textContent = '';
    const allTextElements = p.getElementsByTagName('w:t');
    
    for (let t = 0; t < allTextElements.length; t++) {
      if (allTextElements[t].textContent) {
        textContent += allTextElements[t].textContent;
      }
    }
    
    if (textContent) {
      lines.push(textContent);
    }
  }
  
  return lines.join('\n');
}

/**
 * Strict Question Parser
 */
export function parseQuestions(text) {
  if (!text) return [];

  const processedText = preprocessText(text);
  
  // Split into blocks using section headers as anchors
  // Regex: lookahead for [ TYPE ] at the start of a line or start of string
  // Using a more robust approach: find all header positions and slice
  const headerRegex = /^\s*\[\s*(?:SINGLE|MULTIPLE|TRUE_FALSE|MATCH|CLOZE)\s*\]/gim;
  const blocks = [];
  let match;
  let lastIndex = 0;

  const matches = [];
  while ((match = headerRegex.exec(processedText)) !== null) {
    matches.push({ index: match.index, length: match[0].length });
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = (i + 1 < matches.length) ? matches[i + 1].index : processedText.length;
    blocks.push(processedText.substring(start, end));
  }

  const questions = [];

  blocks.forEach((block, bIdx) => {
    // Split lines but keep empty lines if they are inside content (optional, but trim for header check)
    const lines = block.split('\n').map(l => l.trim());
    if (lines.length === 0) return;

    // Find the first line that is a header
    let headerLine = "";
    let headerMatch = null;
    let contentStartIdx = 0;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === "") continue;
      const m = lines[i].match(/^\[\s*(SINGLE|MULTIPLE|TRUE_FALSE|MATCH|CLOZE)\s*\]$/i);
      if (m) {
        headerLine = lines[i];
        headerMatch = m;
        contentStartIdx = i + 1;
        break;
      }
    }
    
    if (!headerMatch) return;

    const type = headerMatch[1].toUpperCase();
    // For CLOZE, we might want to keep empty lines in the text, so don't filter them out yet
    const contentLines = type === 'CLOZE' 
      ? lines.slice(contentStartIdx) 
      : lines.slice(contentStartIdx).filter(l => l !== '');
    
    try {
      let q = null;
      if (type === 'SINGLE') q = parseSingleChoice(contentLines);
      else if (type === 'MULTIPLE') q = parseMultipleChoice(contentLines);
      else if (type === 'TRUE_FALSE') q = parseTrueFalse(contentLines);
      else if (type === 'MATCH') q = parseMatch(contentLines);
      else if (type === 'CLOZE') q = parseCloze(contentLines);

      if (q) {
        q.questionNumber = questions.length + 1;
        questions.push(q);
      }
    } catch (err) {
      console.error(`Error parsing block ${bIdx + 1} (${type}):`, err.message);
    }
  });

  return questions;
}

function parseSingleChoice(lines) {
  let questionText = "";
  const options = [];
  let foundQuestion = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Tolerant regex: allows * at start, spaces, A-H followed by . ) : or -
    const optMatch = line.match(/^(\*?\s*)?([A-H])\s*[.\):-]\s*(.+)$/i);
    
    if (optMatch) {
      foundQuestion = true;
      const isCorrect = (optMatch[1] || '').trim() === '*';
      const label = optMatch[2].toUpperCase();
      const text = optMatch[3].trim();
      const opt = createOption({ label, text });
      opt.correct = isCorrect;
      options.push(opt);
    } else if (!foundQuestion) {
      questionText += (questionText ? "\n" : "") + line;
    }
  }

  // Validation
  // Detect lines starting with number or "Câu", "Question", "Q1:"
  const questionContent = questionText.replace(/^(?:Câu|Question|Q)\s*\d*\s*[:). -]?\s*/i, "").trim();
  const correctCount = options.filter(o => o.correct).length;
  
  if (!questionContent) throw new Error("Thiếu nội dung câu hỏi");
  if (options.length < 2) throw new Error("Phải có ít nhất 2 đáp án");
  if (correctCount !== 1) throw new Error("Câu SINGLE phải có duy nhất 1 đáp án đúng (*)");

  return createQuestion({ type: 'single', question: questionContent, options });
}

function parseMultipleChoice(lines) {
  let questionText = "";
  const options = [];
  let foundQuestion = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const optMatch = line.match(/^(\*?\s*)?([A-H])\s*[.\):-]\s*(.+)$/i);
    
    if (optMatch) {
      foundQuestion = true;
      const isCorrect = (optMatch[1] || '').trim() === '*';
      const label = optMatch[2].toUpperCase();
      const text = optMatch[3].trim();
      const opt = createOption({ label, text });
      opt.correct = isCorrect;
      options.push(opt);
    } else if (!foundQuestion) {
      questionText += (questionText ? "\n" : "") + line;
    }
  }

  const questionContent = questionText.replace(/^(?:Câu|Question|Q)\s*\d*\s*[:). -]?\s*/i, "").trim();
  const correctCount = options.filter(o => o.correct).length;

  if (!questionContent) throw new Error("Thiếu nội dung câu hỏi");
  if (options.length < 2) throw new Error("Phải có ít nhất 2 đáp án");
  if (correctCount < 1) throw new Error("Câu MULTIPLE phải có ít nhất 1 đáp án đúng (*)");

  return createQuestion({ 
    type: 'multiple', 
    question: questionContent, 
    options, 
    maxCorrectAnswers: correctCount 
  });
}

function parseTrueFalse(lines) {
  let questionText = "";
  const statements = [];
  let blockSection = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Support delimiters 1. 1) 1- and various answer brackets
    const tfMatch = line.match(/^(\d+)\s*[.\):-]\s*(.+?)\s*\[\s*(Đúng|Sai|True|False|T|F|Yes|No)\s*\]$/i);
    
    if (tfMatch) {
      const text = tfMatch[2].trim();
      const ansStr = tfMatch[3].toLowerCase();
      const answer = (ansStr === 'đúng' || ansStr === 'true' || ansStr === 't' || ansStr === 'yes');
      statements.push(createStatement({ text, answer }));
    } else if (statements.length === 0) {
      questionText += (questionText ? "\n" : "") + line;
    }
  }

  const questionContent = questionText.replace(/^(?:Câu|Question|Q)\s*\d*\s*[:). -]?\s*/i, "").trim();
  if (statements.length === 0) throw new Error("Thiếu các mệnh đề Đúng/Sai");

  return createQuestion({ type: 'true_false', question: questionContent, statements });
}

function parseMatch(lines) {
  let questionText = "";
  const targets = [];
  const answerBank = [];
  const correctMatches = {};
  let section = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.trim().toLowerCase();

    if (lower.startsWith('left:')) { section = 'left'; continue; }
    if (lower.startsWith('right:')) { section = 'right'; continue; }
    if (lower.startsWith('correct:')) { section = 'correct'; continue; }
    if (lower.startsWith('distractor:')) { section = 'distractor'; continue; }

    if (!section) {
      questionText += (questionText ? "\n" : "") + line;
      continue;
    }

    if (section === 'left') {
      const m = line.match(/^(.+?)\s*[|:-]\s*(.+)$/);
      if (m) targets.push({ id: m[1].trim(), text: m[2].trim() });
    } else if (section === 'right' || section === 'distractor') {
      const isDistractor = section === 'distractor' || lower.includes('[distractor]') || lower.includes('(distractor)');
      const clean = line.replace(/\[distractor\]/i, '').replace(/\(distractor\)/i, '').trim();
      const m = clean.match(/^(.+?)\s*[|:-]\s*(.+)$/);
      if (m) {
        answerBank.push({ id: m[1].trim(), text: m[2].trim(), distractor: isDistractor });
      }
    } else if (section === 'correct') {
      // Tolerant mapping: 1=>A, 1 => A, 1=A, 1 -> A
      const m = line.match(/^(.+?)\s*(?:=>|->|=)\s*(.+)$/);
      if (m) {
        const targetId = m[1].trim();
        const labels = m[2].split(/[|;,]/).map(s => s.trim());
        correctMatches[targetId] = labels;
      }
    }
  }

  const questionContent = questionText.replace(/^(?:Câu|Question|Q)\s*\d*\s*[:). -]?\s*/i, "").trim();
  if (targets.length === 0) throw new Error("MATCH thiếu phần LEFT:");
  if (answerBank.length === 0) throw new Error("MATCH thiếu phần RIGHT:");
  if (Object.keys(correctMatches).length === 0) throw new Error("MATCH thiếu phần CORRECT:");

  const q = createQuestion({ type: 'match', question: questionContent });
  q.targets = targets;
  q.answerBank = answerBank;
  q.correctMatches = correctMatches;
  return q;
}

function parseCloze(lines) {
  let questionText = "";
  let foundTextSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.startsWith('text:')) {
      foundTextSection = true;
      questionText = line.substring(line.indexOf(':') + 1).trim();
    } else if (foundTextSection) {
      questionText += (questionText ? "\n" : "") + line;
    }
  }

  if (!foundTextSection) throw new Error("CLOZE thiếu nhãn TEXT:");
  if (!questionText.includes('{{')) throw new Error("CLOZE thiếu ô trống {{đáp án}}");

  return createQuestion({ type: 'cloze', question: questionText });
}

/**
 * Load and parse quiz from file
 */
export async function loadQuiz(file) {
  const text = await extractText(file);
  const questions = parseQuestions(text);
  return questions;
}
