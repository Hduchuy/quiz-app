import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Output file
const outputPath = path.join(__dirname, 'analyze-results.txt');
let output = '';

function log(...args) {
  const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
  console.log(msg);
  output += msg + '\n';
}

function logSection(title) {
  const separator = '='.repeat(80);
  log(separator);
  log(title);
  log(separator);
}

function logSubSection(title) {
  const separator = '-'.repeat(60);
  log(separator);
  log(title);
  log(separator);
}

// Parse XML and extract all paragraph details
function parseDocumentXml(xml) {
  const results = [];
  
  // Match all paragraphs
  const pRegex = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;
  let pMatch;
  let lineNum = 0;
  
  while ((pMatch = pRegex.exec(xml)) !== null) {
    lineNum++;
    const pXml = pMatch[0];
    const paragraph = {
      lineNum,
      rawXml: pXml,
      text: '',
      runs: [],
      formatting: [],
      numId: null,
      ilvl: null,
      pStyle: null,
      pPr: null,
      rPrList: []
    };
    
    // Extract pPr (paragraph properties)
    const pPrMatch = pXml.match(/<w:pPr>([\s\S]*?)<\/w:pPr>/);
    if (pPrMatch) {
      paragraph.pPr = pPrMatch[1];
      
      // Extract numPr (numbering)
      const numPrMatch = paragraph.pPr.match(/<w:numPr>[\s\S]*?<\/w:numPr>/);
      if (numPrMatch) {
        const numIdMatch = numPrMatch[0].match(/<w:numId\s+w:val="([^"]+)"/);
        const ilvlMatch = numPrMatch[0].match(/<w:ilvl\s+w:val="([^"]+)"/);
        paragraph.numId = numIdMatch ? numIdMatch[1] : null;
        paragraph.ilvl = ilvlMatch ? ilvlMatch[1] : null;
      }
      
      // Extract pStyle
      const styleMatch = paragraph.pPr.match(/<w:pStyle\s+w:val="([^"]+)"/);
      if (styleMatch) {
        paragraph.pStyle = styleMatch[1];
      }
    }
    
    // Extract all runs (w:r elements)
    const rRegex = /<w:r\b[^>]*>[\s\S]*?<\/w:r>/g;
    let rMatch;
    let runIdx = 0;
    
    while ((rMatch = rRegex.exec(pXml)) !== null) {
      runIdx++;
      const rXml = rMatch[0];
      const run = {
        idx: runIdx,
        xml: rXml,
        text: '',
        rPr: null,
        properties: {}
      };
      
      // Extract rPr (run properties)
      const rPrMatch = rXml.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/);
      if (rPrMatch) {
        run.rPr = rPrMatch[1];
        run.properties = extractRunProperties(rPrMatch[1]);
      }
      
      // Extract text content
      const tMatch = rXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/);
      if (tMatch) {
        run.text = tMatch[1];
      }
      
      paragraph.runs.push(run);
    }
    
    // Combine all run texts
    paragraph.text = paragraph.runs.map(r => r.text).join('');
    
    // Extract paragraph-level formatting
    paragraph.formatting = extractParagraphFormatting(paragraph.pPr);
    
    results.push(paragraph);
  }
  
  return results;
}

function extractRunProperties(rPrXml) {
  const props = {};
  
  // Color
  const colorMatch = rPrXml.match(/<w:color\s+w:val="([^"]+)"/);
  if (colorMatch) props.color = colorMatch[1];
  
  // Bold
  if (/<w:b\b/.test(rPrXml)) props.bold = true;
  
  // Italic
  if (/<w:i\b/.test(rPrXml)) props.italic = true;
  
  // Underline
  const uMatch = rPrXml.match(/<w:u\s+w:val="([^"]+)"/);
  if (uMatch) props.underline = uMatch[1];
  
  // Font size
  const szMatch = rPrXml.match(/<w:sz\s+w:val="([^"]+)"/);
  if (szMatch) props.fontSize = szMatch[1];
  
  // Font name
  const rFontsMatch = rPrXml.match(/<w:rFonts\s+[^>]*w:ascii="([^"]+)"/);
  if (rFontsMatch) props.fontAscii = rFontsMatch[1];
  
  // Highlight
  const highlightMatch = rPrXml.match(/<w:highlight\s+w:val="([^"]+)"/);
  if (highlightMatch) props.highlight = highlightMatch[1];
  
  // Shade/background
  const shadeMatch = rPrXml.match(/<w:shd\s+w:val="clear"\s+w:fill="([^"]+)"/);
  if (shadeMatch) props.shade = shadeMatch[1];
  
  return props;
}

function extractParagraphFormatting(pPrXml) {
  if (!pPrXml) return [];
  const formatting = [];
  
  // Check for indentation, spacing, etc.
  const jcMatch = pPrXml.match(/<w:jc\s+w:val="([^"]+)"/);
  if (jcMatch) formatting.push({ type: 'justification', value: jcMatch[1] });
  
  const indMatch = pPrXml.match(/<w:ind\s+([^>]+)/);
  if (indMatch) formatting.push({ type: 'indentation', value: indMatch[1] });
  
  return formatting;
}

function formatXmlReadable(xml, indent = 2) {
  // Simple XML formatter for display
  let formatted = '';
  let depth = 0;
  const lines = xml.split(/(<[^>]+>)/g).filter(Boolean);
  
  for (const line of lines) {
    if (line.startsWith('</')) {
      depth--;
    }
    
    const currentIndent = '  '.repeat(Math.max(0, depth));
    formatted += currentIndent + line + '\n';
    
    if (line.startsWith('<') && !line.startsWith('</') && !line.endsWith('/>') && !line.includes('</')) {
      depth++;
    }
  }
  
  return formatted;
}

// Check if text is a true/false statement pattern
function isTrueFalseStatement(text) {
  return /^\d+[).:]\s*/.test(text);
}

// Check if text is "Đúng" or "Sai"
function isTrueFalseAnswer(text) {
  return /^đúng$|^sai$/iu.test(text.trim());
}

// Check if text is a question header
function isQuestionHeader(text) {
  return /^Câu\s+\d+/iu.test(text);
}

// Check if text is multiple choice option
function isMultipleChoiceOption(text) {
  return /^[A-D][).:]\s*/iu.test(text);
}

async function analyzeDocx(docxPath) {
  logSection(`DOCX ANALYSIS: ${path.basename(docxPath)}`);
  log(`Timestamp: ${new Date().toISOString()}`);
  log();
  
  // Read the DOCX file
  const fileBuffer = fs.readFileSync(docxPath);
  const arrayBuffer = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength
  );
  
  // Load with JSZip
  const zip = await JSZip.loadAsync(arrayBuffer);
  
  // List all files in the docx
  logSection('DOCX CONTENTS');
  const files = [];
  zip.forEach((relativePath, file) => {
    files.push(relativePath);
  });
  files.forEach(f => log(`  ${f}`));
  log();
  
  // Extract document.xml
  const documentXml = await zip.file('word/document.xml')?.async('string');
  if (!documentXml) {
    log('ERROR: Could not find word/document.xml');
    return;
  }
  
  logSection('DOCUMENT STATISTICS');
  log(`Document XML size: ${documentXml.length} characters`);
  
  // Parse all paragraphs
  const paragraphs = parseDocumentXml(documentXml);
  log(`Total paragraphs: ${paragraphs.length}`);
  
  // Count various content types
  let questionCount = 0;
  let trueFalseCount = 0;
  let multipleChoiceCount = 0;
  let answerCount = 0;
  
  for (const p of paragraphs) {
    if (isQuestionHeader(p.text)) questionCount++;
    if (isTrueFalseStatement(p.text)) trueFalseCount++;
    if (isMultipleChoiceOption(p.text)) multipleChoiceCount++;
    if (isTrueFalseAnswer(p.text)) answerCount++;
  }
  
  log(`Questions: ${questionCount}`);
  log(`True/False statements: ${trueFalseCount}`);
  log(`Multiple choice options: ${multipleChoiceCount}`);
  log(`True/False answers (Đúng/Sai): ${answerCount}`);
  log();
  
  // Show ALL paragraphs with details
  logSection('ALL PARAGRAPHS - FULL DETAILS');
  
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const normalizedText = p.text.replace(/\u00A0/g, ' ').trim();
    
    log();
    log(`[Paragraph ${p.lineNum}]`);
    log(`  Text: "${normalizedText}"`);
    
    // Show character codes for non-ASCII
    const specialChars = [];
    for (let j = 0; j < p.text.length; j++) {
      const code = p.text.charCodeAt(j);
      if (code > 127 && code !== 160) { // Skip non-breaking space
        specialChars.push({ char: p.text[j], code, hex: 'U+' + code.toString(16).toUpperCase().padStart(4, '0') });
      }
    }
    if (specialChars.length > 0) {
      log(`  Special chars: ${specialChars.map(c => `"${c.char}" (${c.code}/${c.hex})`).join(', ')}`);
    }
    
    // Show numbering info
    if (p.numId || p.ilvl || p.pStyle) {
      log(`  Numbering: numId=${p.numId}, ilvl=${p.ilvl}, style=${p.pStyle || 'none'}`);
    }
    
    // Show run details
    if (p.runs.length > 0) {
      log(`  Runs: ${p.runs.length}`);
      for (const run of p.runs) {
        const runInfo = [`    [Run ${run.idx}] text="${run.text}"`];
        if (Object.keys(run.properties).length > 0) {
          const props = Object.entries(run.properties).map(([k, v]) => `${k}=${v}`).join(', ');
          runInfo.push(`      Props: ${props}`);
        }
        log(runInfo.join('\n'));
      }
    }
    
    // Identify content type
    const contentTypes = [];
    if (isQuestionHeader(p.text)) contentTypes.push('QUESTION_HEADER');
    if (isTrueFalseStatement(p.text)) contentTypes.push('TRUEFALSE_STATEMENT');
    if (isTrueFalseAnswer(p.text)) contentTypes.push('TRUEFALSE_ANSWER');
    if (isMultipleChoiceOption(p.text)) contentTypes.push('MC_OPTION');
    if (contentTypes.length > 0) {
      log(`  Content types: ${contentTypes.join(', ')}`);
    }
    
    // Highlight questions and true/false items
    if (isQuestionHeader(p.text) || isTrueFalseStatement(p.text)) {
      log('  >>> RAW XML <<<');
      log(formatXmlReadable(p.rawXml));
    }
  }
  
  // Deep dive into True/False sections
  logSection('TRUE/FALSE QUESTIONS - DETAILED ANALYSIS');
  
  let currentQuestion = null;
  let questionIndex = 0;
  
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    
    if (isQuestionHeader(p.text)) {
      if (currentQuestion && currentQuestion.statements.length > 0) {
        logSubSection(`True/False Question ${questionIndex} - FULL RAW XML`);
        log('QUESTION HEADER XML:');
        log(formatXmlReadable(currentQuestion.headerXml));
        log();
        
        for (let s = 0; s < currentQuestion.statements.length; s++) {
          const stmt = currentQuestion.statements[s];
          log(`STATEMENT ${s + 1} XML:`);
          log(formatXmlReadable(stmt.xml));
          if (stmt.answerXml) {
            log(`ANSWER "${stmt.answer}" XML:`);
            log(formatXmlReadable(stmt.answerXml));
          }
          log();
        }
      }
      
      currentQuestion = {
        header: p.text,
        headerXml: p.rawXml,
        statements: [],
        headerIndex: i
      };
      questionIndex++;
    }
    
    if (currentQuestion) {
      if (isTrueFalseStatement(p.text)) {
        currentQuestion.statements.push({
          text: p.text,
          xml: p.rawXml,
          answer: null,
          answerXml: null,
          answerIndex: null
        });
      }
      
      if (isTrueFalseAnswer(p.text)) {
        const lastStmt = currentQuestion.statements[currentQuestion.statements.length - 1];
        if (lastStmt && lastStmt.answer === null) {
          lastStmt.answer = p.text.trim();
          lastStmt.answerXml = p.rawXml;
          lastStmt.answerIndex = i;
        }
      }
    }
  }
  
  // Handle last question
  if (currentQuestion && currentQuestion.statements.length > 0) {
    logSubSection(`True/False Question ${questionIndex} - FULL RAW XML`);
    log('QUESTION HEADER XML:');
    log(formatXmlReadable(currentQuestion.headerXml));
    log();
    
    for (let s = 0; s < currentQuestion.statements.length; s++) {
      const stmt = currentQuestion.statements[s];
      log(`STATEMENT ${s + 1} XML:`);
      log(formatXmlReadable(stmt.xml));
      if (stmt.answerXml) {
        log(`ANSWER "${stmt.answer}" XML:`);
        log(formatXmlReadable(stmt.answerXml));
      }
      log();
    }
  }
  
  // Analyze the relationship between statements and answers
  logSection('TRUE/FALSE STRUCTURE ANALYSIS');
  
  let inTrueFalseSection = false;
  let statementFollowedByAnswer = 0;
  let answerInSameParagraph = 0;
  
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    
    if (isQuestionHeader(p.text)) {
      inTrueFalseSection = true;
    }
    
    if (isTrueFalseStatement(p.text) && i + 1 < paragraphs.length) {
      const nextP = paragraphs[i + 1];
      
      // Check if "Đúng" or "Sai" is in next paragraph
      if (isTrueFalseAnswer(nextP.text)) {
        statementFollowedByAnswer++;
        log(`Line ${i}: "${p.text.trim()}"`);
        log(`  -> NEXT PARAGRAPH (Line ${i + 1}): "${nextP.text.trim()}"`);
        log(`  -> RELATIONSHIP: SEPARATE PARAGRAPHS`);
        
        // Check for formatting differences
        const stmtHasFormatting = p.runs.some(r => Object.keys(r.properties).length > 0);
        const ansHasFormatting = nextP.runs.some(r => Object.keys(r.properties).length > 0);
        log(`  -> Statement has formatting: ${stmtHasFormatting}`);
        log(`  -> Answer has formatting: ${ansHasFormatting}`);
        log();
      }
    }
    
    // Check if statement and answer are in same paragraph (via multiple runs)
    const hasStatement = /^\d+[).:]\s*/.test(p.text);
    const hasAnswer = /^đúng$|^sai$/iu.test(p.text.trim());
    
    if (hasStatement && hasAnswer) {
      answerInSameParagraph++;
      log(`Line ${i}: CONTAINS BOTH statement AND answer in SAME paragraph!`);
      log(`  Text: "${p.text.trim()}"`);
      log(`  Runs: ${p.runs.length}`);
      log();
    }
  }
  
  log('SUMMARY:');
  log(`  Statements followed by separate answer paragraph: ${statementFollowedByAnswer}`);
  log(`  Statements with answer in same paragraph: ${answerInSameParagraph}`);
  log();
  
  // List structure analysis
  logSection('NUMBERING AND LIST STRUCTURE');
  
  const numberedParagraphs = paragraphs.filter(p => p.numId !== null);
  log(`Paragraphs with numbering: ${numberedParagraphs.length}`);
  
  // Group by numId
  const numIdGroups = {};
  for (const p of numberedParagraphs) {
    if (!numIdGroups[p.numId]) {
      numIdGroups[p.numId] = [];
    }
    numIdGroups[p.numId].push(p);
  }
  
  for (const [numId, paras] of Object.entries(numIdGroups)) {
    log(`\nnumId="${numId}": ${paras.length} paragraphs`);
    for (const p of paras) {
      log(`  Line ${p.lineNum}: "${p.text.replace(/\u00A0/g, ' ').trim()}" (ilvl=${p.ilvl})`);
    }
  }
  
  // Color analysis
  logSection('COLOR FORMATTING ANALYSIS');
  
  const paragraphsWithColor = paragraphs.filter(p => 
    p.runs.some(r => r.properties.color)
  );
  
  log(`Paragraphs with color formatting: ${paragraphsWithColor.length}`);
  
  for (const p of paragraphsWithColor) {
    const colors = p.runs.filter(r => r.properties.color).map(r => r.properties.color);
    log(`  Line ${p.lineNum}: "${p.text.replace(/\u00A0/g, ' ').trim().substring(0, 50)}..."`);
    log(`    Colors: ${[...new Set(colors)].join(', ')}`);
  }
  
  // Save to file
  fs.writeFileSync(outputPath, output, 'utf8');
  console.log(`\nResults saved to: ${outputPath}`);
}

// Run analysis
const docxPath = path.join(__dirname, 'Chủ đề 2.docx');
analyzeDocx(docxPath).catch(console.error);
