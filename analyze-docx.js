import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple XML parser for extracting text and formatting
function parseXmlSimple(xml) {
  const results = [];
  const paragraphs = [];
  
  // Split by paragraphs
  const pRegex = /<w:p[^>]*>(.*?)<\/w:p>/gs;
  let pMatch;
  
  while ((pMatch = pRegex.exec(xml)) !== null) {
    const pContent = pMatch[1];
    const paragraph = { raw: pMatch[0], text: '', formatting: [] };
    
    // Extract all text runs
    const tRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let tMatch;
    let textParts = [];
    
    while ((tMatch = tRegex.exec(pContent)) !== null) {
      textParts.push(tMatch[1]);
    }
    paragraph.text = textParts.join('');
    
    // Check for color tags
    const colorRegex = /<w:color\s+w:val="([^"]+)"/g;
    while ((tMatch = colorRegex.exec(pContent)) !== null) {
      paragraph.formatting.push({ type: 'color', value: tMatch[1] });
    }
    
    // Check for bold
    if (/<w:b[^>]*\/>/.test(pContent) || /<w:b\s/.test(pContent)) {
      paragraph.formatting.push({ type: 'bold', value: true });
    }
    
    // Check for highlight
    const highlightRegex = /<w:highlight\s+w:val="([^"]+)"/g;
    while ((tMatch = highlightRegex.exec(pContent)) !== null) {
      paragraph.formatting.push({ type: 'highlight', value: tMatch[1] });
    }
    
    // Check for highlight with shade
    const shadeRegex = /<w:shd\s+w:val="clear"\s+w:color="auto"\s+w:fill="([^"]+)"/g;
    while ((tMatch = shadeRegex.exec(pContent)) !== null) {
      paragraph.formatting.push({ type: 'shade', value: tMatch[1] });
    }
    
    // Check for underline
    if (/<w:u\s+w:val="([^"]+)"/.test(pContent)) {
      const uMatch = pContent.match(/<w:u\s+w:val="([^"]+)"/);
      if (uMatch) {
        paragraph.formatting.push({ type: 'underline', value: uMatch[1] });
      }
    }
    
    // Check for font size
    const szRegex = /<w:sz\s+w:val="([^"]+)"/g;
    while ((tMatch = szRegex.exec(pContent)) !== null) {
      paragraph.formatting.push({ type: 'fontSize', value: tMatch[1] });
    }
    
    paragraphs.push(paragraph);
  }
  
  return paragraphs;
}

function formatXmlPretty(xml, maxLen = 500) {
  // Truncate if too long
  if (xml.length > maxLen) {
    return xml.substring(0, maxLen) + '\n  ... [truncated]';
  }
  
  // Simple formatting
  return xml
    .replace(/</g, '\n<')
    .replace(/>\s*</g, '>\n<')
    .split('\n')
    .filter(line => line.trim())
    .join('\n');
}

function getCharDetails(str) {
  const details = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code !== 32) { // Skip spaces
      details.push({ char: str[i], code, hex: 'U+' + code.toString(16).toUpperCase().padStart(4, '0') });
    }
  }
  return details;
}

async function analyzeDocx(docxPath) {
  console.log('='.repeat(80));
  console.log('DOCX FILE ANALYSIS');
  console.log('='.repeat(80));
  console.log(`File: ${docxPath}\n`);

  // Read the DOCX file
  const fileBuffer = fs.readFileSync(docxPath);
  const arrayBuffer = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength
  );

  // Load with JSZip
  const zip = await JSZip.loadAsync(arrayBuffer);
  
  // Extract document.xml
  const documentXml = await zip.file('word/document.xml')?.async('string');
  if (!documentXml) {
    console.error('ERROR: Could not find word/document.xml');
    return;
  }

  console.log(`Document XML size: ${documentXml.length} characters\n`);

  // Parse paragraphs
  const paragraphs = parseXmlSimple(documentXml);
  
  console.log(`Total paragraphs found: ${paragraphs.length}\n`);

  // Find first 3 questions
  console.log('='.repeat(80));
  console.log('FIRST 3 QUESTIONS - RAW XML & FORMATTING');
  console.log('='.repeat(80));
  
  let questionCount = 0;
  for (let i = 0; i < paragraphs.length && questionCount < 3; i++) {
    const p = paragraphs[i];
    const normalized = p.text.replace(/\u00A0/g, ' ').trim();
    
    if (/^Câu\s+\d+/i.test(normalized)) {
      questionCount++;
      console.log('\n' + '='.repeat(60));
      console.log(`QUESTION ${questionCount} (Paragraph #${i})`);
      console.log(`${'='.repeat(60)}`);
      
      // Show raw XML
      console.log('\nRAW XML:');
      console.log(formatXmlPretty(p.raw));
      
      // Show extracted text
      console.log('\nEXTRACTED TEXT:', JSON.stringify(p.text));
      console.log('NORMALIZED:', JSON.stringify(normalized));
      
      // Show formatting
      if (p.formatting.length > 0) {
        console.log('\nFORMATTING DETECTED:');
        p.formatting.forEach(f => console.log(`  - ${f.type}: ${f.value}`));
      } else {
        console.log('\nFORMATTING: None detected');
      }
      
      // Show character details (non-space)
      const charDetails = getCharDetails(p.text);
      if (charDetails.some(c => c.code > 127)) {
        console.log('\nNON-ASCII CHARACTERS:');
        charDetails.filter(c => c.code > 127).forEach(c => {
          console.log(`  "${c.char}" - ${c.code} (${c.hex})`);
        });
      }
    }
  }

  // Show next few paragraphs after first question
  console.log('\n' + '='.repeat(80));
  console.log('FIRST 10 PARAGRAPHS - SUMMARY');
  console.log('='.repeat(80));
  
  for (let i = 0; i < Math.min(10, paragraphs.length); i++) {
    const p = paragraphs[i];
    const normalized = p.text.replace(/\u00A0/g, ' ').trim();
    const hasFormatting = p.formatting.length > 0;
    const hasSpecialChars = getCharDetails(p.text).some(c => c.code > 127);
    
    console.log(`\n[${i}] ${hasFormatting ? '📝' : '  '} "${normalized}"`);
    if (hasFormatting) {
      p.formatting.forEach(f => console.log(`     └─ ${f.type}: ${f.value}`));
    }
    if (hasSpecialChars) {
      const special = getCharDetails(p.text).filter(c => c.code > 127);
      special.forEach(c => console.log(`     └─ special: "${c.char}" (${c.hex})`));
    }
  }

  // All extracted lines
  console.log('\n' + '='.repeat(80));
  console.log('ALL EXTRACTED LINES (TEXT ONLY)');
  console.log('='.repeat(80));
  
  const lines = [];
  for (let i = 0; i < paragraphs.length; i++) {
    const normalized = paragraphs[i].text.replace(/\u00A0/g, ' ').trim();
    if (normalized) {
      lines.push(normalized);
      console.log(`Line ${lines.length}: "${normalized}"`);
    }
  }

  // Check for common issue patterns
  console.log('\n' + '='.repeat(80));
  console.log('POTENTIAL PARSING ISSUES');
  console.log('='.repeat(80));
  
  let hasIssues = false;
  
  // Check for invisible or zero-width characters
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const zwChars = [];
    for (let j = 0; j < line.length; j++) {
      const code = line.charCodeAt(j);
      if (code === 8203 || code === 8204 || code === 8205 || code === 173) {
        zwChars.push({ char: line[j], code, pos: j });
      }
    }
    if (zwChars.length > 0) {
      hasIssues = true;
      console.log(`Line ${i + 1}: Contains invisible characters`);
      zwChars.forEach(z => console.log(`  "${z.char}" at position ${z.pos} (U+${z.code.toString(16).toUpperCase()})`));
    }
  }
  
  if (!hasIssues) {
    console.log('No obvious invisible character issues found.');
  }
  
  // Check for lines that might not match patterns
  console.log('\nLines that might not match expected patterns:');
  let unmatchedCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/^Câu\s+\d+/i.test(line) && 
        !/^[A-D][).:]/i.test(line) && 
        !/^\d+[).:]/i.test(line) &&
        !/^đúng$|^sai$/i.test(line)) {
      unmatchedCount++;
      if (unmatchedCount <= 10) {
        console.log(`  "${line}"`);
      }
    }
  }
  if (unmatchedCount > 10) {
    console.log(`  ... and ${unmatchedCount - 10} more`);
  }
}

// Run analysis
const docxPath = path.join(__dirname, 'test-quiz-new.docx');
analyzeDocx(docxPath).catch(console.error);
