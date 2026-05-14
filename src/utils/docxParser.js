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
  
  return paragraphs;
}

function parseParagraphs(paragraphs) {
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
      continue;
    }

    if (!currentQuestion) {
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
          continue;
        }
      }
    }
  }

  if (currentQuestion) {
    questions.push(currentQuestion);
  }

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
  const paragraphs = await parseDocx(file);
  const questions = parseParagraphs(paragraphs);
  return questions;
}
