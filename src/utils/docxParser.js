import JSZip from 'jszip';

export async function parseDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  
  const documentXml = await zip.file('word/document.xml')?.async('string');
  if (!documentXml) {
    throw new Error('Invalid DOCX file: missing document.xml');
  }
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(documentXml, 'text/xml');
  
  // Extract paragraphs with full metadata
  const paragraphs = [];
  const allPElements = doc.getElementsByTagName('w:p');
  
  for (let i = 0; i < allPElements.length; i++) {
    const p = allPElements[i];
    
    // Extract numId (Word numbered list)
    let numId = null;
    const pPrList = p.getElementsByTagName('w:pPr');
    for (let pp = 0; pp < pPrList.length; pp++) {
      const numPr = pPrList[pp].getElementsByTagName('w:numPr');
      for (let np = 0; np < numPr.length; np++) {
        const numIdEl = numPr[np].getElementsByTagName('w:numId');
        if (numIdEl.length > 0) {
          numId = numIdEl[0].getAttribute('w:val');
        }
        const ilvlEl = numPr[np].getElementsByTagName('w:ilvl');
        if (ilvlEl.length > 0) {
          // ilvl = indentation level
        }
      }
    }
    
    // Extract text content
    let textContent = '';
    const allTextElements = p.getElementsByTagName('w:t');
    for (let t = 0; t < allTextElements.length; t++) {
      if (allTextElements[t].textContent) {
        textContent += allTextElements[t].textContent;
      }
    }
    
    // Check for red color
    let isRed = false;
    const runElements = p.getElementsByTagName('w:r');
    for (let r = 0; r < runElements.length; r++) {
      const rPrElements = runElements[r].getElementsByTagName('w:rPr');
      for (let rp = 0; rp < rPrElements.length; rp++) {
        const colorElements = rPrElements[rp].getElementsByTagName('w:color');
        for (let c = 0; c < colorElements.length; c++) {
          const colorVal = colorElements[c].getAttribute('w:val');
          if (colorVal && (
            colorVal.toUpperCase() === 'EE0000' || 
            colorVal.toUpperCase() === 'FF0000' || 
            colorVal.toLowerCase() === 'red'
          )) {
            isRed = true;
          }
        }
      }
    }
    
    // Check for bold
    let isBold = false;
    for (let r = 0; r < runElements.length; r++) {
      const rPrElements = runElements[r].getElementsByTagName('w:rPr');
      for (let rp = 0; rp < rPrElements.length; rp++) {
        const boldElements = rPrElements[rp].getElementsByTagName('w:b');
        if (boldElements.length > 0) {
          isBold = true;
        }
      }
    }
    
    const text = textContent.replace(/\u00A0/g, ' ').trim();
    
    if (text) {
      paragraphs.push({
        text,
        numId,
        isRed,
        isBold,
        index: paragraphs.length
      });
    }
  }
  
  console.log("=== EXTRACTED PARAGRAPHS ===");
  paragraphs.forEach((p, i) => {
    const flags = [];
    if (p.isRed) flags.push('RED');
    if (p.isBold) flags.push('BOLD');
    if (p.numId) flags.push(`numId=${p.numId}`);
    const flagStr = flags.length ? ` [${flags.join(', ')}]` : '';
    console.log(`[${i}] ${p.text.substring(0, 60)}${p.text.length > 60 ? '...' : ''}${flagStr}`);
  });
  console.log("============================");
  
  return paragraphs;
}

function parseParagraphs(paragraphs) {
  console.log("=== PARSING QUESTIONS ===");
  
  const questions = [];
  let currentQuestion = null;
  
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    
    // NEW QUESTION
    if (/^Câu\s+\d+/i.test(p.text)) {
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      
      const questionText = p.text.replace(/^Câu\s+\d+[:).]\s*/i, '').trim();
      currentQuestion = {
        type: null,
        question: questionText,
        options: [],
        statements: []
      };
      console.log(`\nNew question: "${questionText}"`);
      continue;
    }
    
    if (!currentQuestion) {
      console.log(`Skipping: "${p.text.substring(0, 40)}..."`);
      continue;
    }
    
    // MULTIPLE CHOICE option (A. B. C. D.)
    if (/^[A-D][).:]/i.test(p.text)) {
      currentQuestion.type = 'multiple';
      const optionText = p.text.replace(/^[A-D][).:]\s*/i, '').trim();
      currentQuestion.options.push({
        text: optionText,
        correct: p.isRed // Red color marks correct answer
      });
      console.log(`  Option "${optionText}" ${p.isRed ? '[CORRECT]' : ''}`);
      continue;
    }
    
    // TRUE/FALSE STATEMENT (paragraphs with numId + bold = Word numbered list item)
    if (p.numId && p.isBold && !/^đúng$|^sai$/i.test(p.text)) {
      // Set type to truefalse-group
      currentQuestion.type = 'truefalse-group';
      currentQuestion.statements.push({
        text: p.text,
        answer: null
      });
      console.log(`  Statement: "${p.text.substring(0, 50)}..."`);
      continue;
    }
    
    // Statement WITHOUT numId but bold (continuation or inline list)
    if (!p.numId && p.isBold && 
        currentQuestion.type === 'truefalse-group' &&
        currentQuestion.statements.length > 0 &&
        p.text.length > 20 &&
        !/^đúng$|^sai$/i.test(p.text) &&
        !/^[A-D][).:]/i.test(p.text)) {
      currentQuestion.statements.push({
        text: p.text,
        answer: null
      });
      console.log(`  Statement (bold, no numId): "${p.text.substring(0, 50)}..."`);
      continue;
    }
    
    // TRUE/FALSE ANSWER (Đúng/Sai in separate paragraph)
    if (/^đúng$|^sai$/i.test(p.text)) {
      // Set type to truefalse-group if not already set
      if (currentQuestion.type === null) {
        currentQuestion.type = 'truefalse-group';
      }
      
      // Assign answer to the last statement
      if (currentQuestion.type === 'truefalse-group' && currentQuestion.statements.length > 0) {
        const lastStatement = currentQuestion.statements[currentQuestion.statements.length - 1];
        if (lastStatement.answer === null) {
          lastStatement.answer = /^đúng$/i.test(p.text);
          console.log(`  → Answer: ${lastStatement.answer ? 'Đúng' : 'Sai'}`);
          continue;
        }
      }
    }
    
    console.log(`  Ignored: "${p.text.substring(0, 40)}..."`);
  }
  
  if (currentQuestion) {
    questions.push(currentQuestion);
  }
  
  console.log("\n=== FINAL QUESTIONS ===");
  questions.forEach((q, i) => {
    console.log(`\nQ${i + 1}: ${q.question}`);
    console.log(`  Type: ${q.type}`);
    if (q.type === 'multiple') {
      q.options.forEach((o, j) => {
        console.log(`  ${String.fromCharCode(65 + j)}. ${o.text} ${o.correct ? '[CORRECT]' : ''}`);
      });
    } else if (q.type === 'truefalse-group') {
      q.statements.forEach((s, j) => {
        console.log(`  ${j + 1}. ${s.text.substring(0, 50)}... → ${s.answer !== null ? (s.answer ? 'Đúng' : 'Sai') : '[NO ANSWER]'}`);
      });
    } else {
      console.log(`  WARNING: Unknown type - ${JSON.stringify(q)}`);
    }
  });
  console.log("=======================");
  
  return questions;
}

export function parseLinesToQuestions(lines) {
  return parseParagraphs(lines);
}

export function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function prepareQuiz(questions) {
  const shuffledQuestions = shuffleArray(questions);
  
  return shuffledQuestions.map(q => {
    if (q.type === 'multiple') {
      const shuffledOptions = shuffleArray(q.options.map((o, idx) => ({ ...o, originalIndex: idx })));
      return {
        type: 'multiple',
        question: q.question,
        maxCorrectAnswers: q.maxCorrectAnswers,
        options: shuffledOptions.map(o => ({
          text: o.text,
          correct: o.correct
        }))
      };
    } else if (q.type === 'truefalse-group') {
      return {
        type: 'truefalse-group',
        question: q.question,
        maxCorrectAnswers: q.maxCorrectAnswers,
        statements: q.statements
      };
    }
    return q;
  });
}

export async function loadAndParseDocx(file) {
  console.log("=== PARSING DOCX ===");
  const paragraphs = await parseDocx(file);
  
  const questions = parseParagraphs(paragraphs);
  console.log("=== PARSED QUESTIONS ===");
  console.log(JSON.stringify(questions, null, 2));
  return questions;
}
