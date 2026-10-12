import JSZip from 'jszip';
import { Question, Topic } from '../types/quiz';

// Helper to check if a color is reddish (EE0000, FF0000, ED1C24, red, etc.)
function isRedColor(colorVal: string | null | undefined): boolean {
  if (!colorVal) return false;
  const c = colorVal.trim().toUpperCase();
  if (c === 'RED') return true;
  if (c.startsWith('#')) colorVal = c.slice(1);
  if (c === 'EE0000' || c === 'FF0000' || c === 'ED1C24' || c === 'D32F2F' || c === 'C00000') return true;
  // If hex 6 chars: check if red channel is high and green/blue are low
  if (/^[0-9A-F]{6}$/i.test(c)) {
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    if (r > 180 && g < 80 && b < 80) return true;
  }
  return false;
}

export async function parseDocxFile(file: File, topicIndex: number): Promise<Topic> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const documentXmlFile = zip.file('word/document.xml');

  if (!documentXmlFile) {
    throw new Error('File không hợp lệ hoặc không tìm thấy word/document.xml');
  }

  const xmlText = await documentXmlFile.async('string');
  return parseDocumentXml(xmlText, file.name, topicIndex);
}

export function parseDocumentXml(xmlText: string, filename: string, topicIndex: number): Topic {
  const bodyMatch = xmlText.match(/<w:body>(.*?)<\/w:body>/s);
  if (!bodyMatch) {
    return {
      id: `topic_${topicIndex}`,
      title: filename.replace(/\.docx$/i, ''),
      sourceFile: filename,
      questions: []
    };
  }
  const bodyContent = bodyMatch[1];

  interface RawElement {
    type: 'p' | 'tbl';
    text?: string;
    redText?: string;
    hasRed?: boolean;
    rows?: Array<Array<Array<{ text: string; red: string; hasRed: boolean }>>>;
  }

  const tokenRegex = /<(w:p|w:tbl)\b[^>]*>(.*?)<\/\1>/gs;
  let tokenMatch: RegExpExecArray | null;
  const elements: RawElement[] = [];

  while ((tokenMatch = tokenRegex.exec(bodyContent)) !== null) {
    const tag = tokenMatch[1];
    const raw = tokenMatch[2];

    if (tag === 'w:p') {
      const rRegex = /<w:r\b[^>]*>(.*?)<\/w:r>/gs;
      let rMatch: RegExpExecArray | null;
      const runs: Array<{ text: string; isRed: boolean }> = [];

      while ((rMatch = rRegex.exec(raw)) !== null) {
        const rContent = rMatch[1];
        const colorMatch = rContent.match(/<w:color\s+[^>]*w:val="([^"]+)"/i);
        const colorVal = colorMatch ? colorMatch[1] : '';
        const highlightMatch = rContent.match(/<w:highlight\s+[^>]*w:val="([^"]+)"/i);
        const highlightVal = highlightMatch ? highlightMatch[1] : '';

        const isRed = isRedColor(colorVal) || highlightVal.toLowerCase() === 'red';
        const tMatches = [...rContent.matchAll(/<w:t\b[^>]*>(.*?)<\/w:t>/gs)].map(m => m[1]);
        const txt = tMatches.join('');
        if (txt) {
          runs.push({ text: txt, isRed });
        }
      }

      const text = runs.map(r => r.text).join('').trim();
      const redText = runs.filter(r => r.isRed).map(r => r.text).join('').trim();
      const hasRed = runs.some(r => r.isRed && r.text.trim().length > 0);

      if (text) {
        elements.push({ type: 'p', text, redText, hasRed });
      }
    } else {
      // Table
      const trRegex = /<w:tr\b[^>]*>(.*?)<\/w:tr>/gs;
      let trMatch: RegExpExecArray | null;
      const rows: Array<Array<Array<{ text: string; red: string; hasRed: boolean }>>> = [];

      while ((trMatch = trRegex.exec(raw)) !== null) {
        const trXml = trMatch[1];
        const tcRegex = /<w:tc\b[^>]*>(.*?)<\/w:tc>/gs;
        let tcMatch: RegExpExecArray | null;
        const cells: Array<Array<{ text: string; red: string; hasRed: boolean }>> = [];

        while ((tcMatch = tcRegex.exec(trXml)) !== null) {
          const tcXml = tcMatch[1];
          const pInTc = [...tcXml.matchAll(/<w:p\b[^>]*>(.*?)<\/w:p>/gs)];
          const cellParas: Array<{ text: string; red: string; hasRed: boolean }> = [];

          for (const pM of pInTc) {
            const pContent = pM[1];
            const rInP = [...pContent.matchAll(/<w:r\b[^>]*>(.*?)<\/w:r>/gs)];
            const pRuns: Array<{ text: string; isRed: boolean }> = [];

            for (const rM of rInP) {
              const rXml = rM[1];
              const colorMatch = rXml.match(/<w:color\s+[^>]*w:val="([^"]+)"/i);
              const colorVal = colorMatch ? colorMatch[1] : '';
              const isRed = isRedColor(colorVal);
              const txt = [...rXml.matchAll(/<w:t\b[^>]*>(.*?)<\/w:t>/gs)].map(m => m[1]).join('');
              if (txt) pRuns.push({ text: txt, isRed });
            }

            const pText = pRuns.map(r => r.text).join('').trim();
            const pRed = pRuns.filter(r => r.isRed).map(r => r.text).join('').trim();
            if (pText) {
              cellParas.push({
                text: pText,
                red: pRed,
                hasRed: pRuns.some(r => r.isRed && r.text.trim().length > 0)
              });
            }
          }
          cells.push(cellParas);
        }
        rows.push(cells);
      }
      elements.push({ type: 'tbl', rows });
    }
  }

  // Topic title detection
  let topicTitle = filename.replace(/\.docx$/i, '');
  let startIndex = 0;
  if (elements.length > 0 && elements[0].type === 'p' && elements[0].text) {
    if (/^(Bài|Chủ đề|Chương)\s+\d+/i.test(elements[0].text)) {
      topicTitle = elements[0].text;
      startIndex = 1;
    }
  }

  // Question blocks
  interface RawBlock {
    title: string;
    items: RawElement[];
  }
  const rawBlocks: RawBlock[] = [];
  let curBlock: RawBlock | null = null;

  for (let i = startIndex; i < elements.length; i++) {
    const el = elements[i];
    if (el.type === 'p' && el.text && /^Câu\s+\d+[:.]/i.test(el.text)) {
      if (curBlock) rawBlocks.push(curBlock);
      curBlock = { title: el.text, items: [] };
    } else if (curBlock) {
      curBlock.items.push(el);
    }
  }
  if (curBlock) rawBlocks.push(curBlock);

  const topicId = `topic_${topicIndex}`;
  const questions: Question[] = rawBlocks.map((block, bIdx) => {
    const qMatch = block.title.match(/^Câu\s+(\d+)[:.]?\s*(.*)/i);
    const qNumber = qMatch ? parseInt(qMatch[1], 10) : bIdx + 1;
    const qText = qMatch && qMatch[2].trim() ? qMatch[2].trim() : block.title;
    const titleLower = block.title.toLowerCase();
    const id = `${topicId}_q${qNumber}`;

    // 1. True / False
    if (titleLower.includes('đúng hoặc sai') || titleLower.includes('đúng/sai') || titleLower.includes('đúng hay sai')) {
      const statements: Array<{ id: string; text: string; correctAnswer: boolean }> = [];
      let curStmt: { id: string; text: string; correctAnswer: boolean } | null = null;

      const isTFOptionLine = (str: string) => {
        const t = str.trim().toLowerCase();
        if (t === 'đúng' || t === 'sai') return true;
        if (/^[a-d][\.\)]\s*(đúng|sai)/i.test(t)) return true;
        return false;
      };

      const cleanStatementText = (str: string) => {
        return str.replace(/&lt;\/?[^>]+&gt;/g, '').replace(/<\/?[^>]+>/g, '').trim();
      };

      for (const item of block.items) {
        if (item.type !== 'p' || !item.text) continue;
        const text = item.text.trim();
        if (!text) continue;

        if (isTFOptionLine(text)) {
          // Option line (e.g., A. Đúng, B. Sai, Đúng, Sai) - NEVER add to statements!
          if (curStmt) {
            const textLower = text.toLowerCase();
            const hasRed = item.hasRed || (item.redText && item.redText.length > 0);
            if (hasRed) {
              if (textLower.includes('đúng')) {
                curStmt.correctAnswer = true;
              } else if (textLower.includes('sai')) {
                curStmt.correctAnswer = false;
              }
            }
          }
        } else {
          // Statement line (e.g., 1. Nguồn gốc nhận thức...)
          if (curStmt) statements.push(curStmt);
          curStmt = {
            id: `stmt_${statements.length + 1}`,
            text: cleanStatementText(text),
            correctAnswer: true // default, updated when red option is encountered
          };
        }
      }
      if (curStmt) statements.push(curStmt);

      return {
        id,
        sourceFile: filename,
        topicId,
        topicTitle,
        questionNumber: qNumber,
        questionText: qText,
        type: 'true_false',
        statements,
        verificationStatus: statements.length > 0 ? 'verified' : 'needs_review',
        reviewReason: statements.length === 0 ? 'Không tìm thấy mệnh đề Đúng/Sai' : undefined
      };
    }

    // 2. Matching / Drag and drop
    const hasTable = block.items.some(it => it.type === 'tbl');
    const isMatchingTitle =
      titleLower.includes('kéo thả') ||
      titleLower.includes('kéo thể') ||
      titleLower.includes('ghép nối') ||
      titleLower.includes('khớp với') ||
      titleLower.includes('cột tương ứng');

    if (hasTable || isMatchingTitle) {
      if (hasTable) {
        const tblItem = block.items.find(it => it.type === 'tbl');
        const rows = tblItem?.rows || [];
        if (rows.length >= 2) {
          const colCount = rows[0].length;
          const categories: Array<{ id: string; name: string; items: string[] }> = [];
          const allItems: string[] = [];

          for (let c = 0; c < colCount; c++) {
            const catName = rows[0][c].map(p => p.text).join(' ').trim();
            const catItems: string[] = [];
            for (let r = 1; r < rows.length; r++) {
              if (rows[r][c]) {
                for (const p of rows[r][c]) {
                  if (p.text && p.text.trim()) {
                    catItems.push(p.text.trim());
                    allItems.push(p.text.trim());
                  }
                }
              }
            }
            categories.push({
              id: `cat_${c + 1}`,
              name: catName,
              items: catItems
            });
          }

          return {
            id,
            sourceFile: filename,
            topicId,
            topicTitle,
            questionNumber: qNumber,
            questionText: qText,
            type: 'matching',
            matchingData: {
              matchingType: 'categories',
              categories,
              allItems: [...allItems].sort(() => Math.random() - 0.5)
            },
            verificationStatus: 'verified'
          };
        }
      }

      // Non-table matching
      const pItems = block.items.filter(it => it.type === 'p');
      const pairs: Array<{ id: string; prompt: string; target: string }> = [];
      const pool: string[] = [];
      let isNumbered = false;

      for (let idx = 0; idx < pItems.length; idx++) {
        const it = pItems[idx];
        if (!it.text) continue;
        if (/^\d+[\.)]/.test(it.text)) {
          isNumbered = true;
          const nextIt = pItems[idx + 1];
          if (nextIt && nextIt.text && !/^\d+[\.)]/.test(nextIt.text)) {
            pairs.push({
              id: `pair_${pairs.length + 1}`,
              prompt: it.text.trim(),
              target: nextIt.text.trim()
            });
            idx++;
          } else {
            pairs.push({
              id: `pair_${pairs.length + 1}`,
              prompt: it.text.trim(),
              target: it.redText || ''
            });
          }
        } else if (!isNumbered) {
          pool.push(it.text.trim());
        }
      }

      if (pairs.length > 0) {
        const allTargets = [...new Set([...pairs.map(p => p.target), ...pool])].filter(Boolean);
        return {
          id,
          sourceFile: filename,
          topicId,
          topicTitle,
          questionNumber: qNumber,
          questionText: qText,
          type: 'matching',
          matchingData: {
            matchingType: 'pairs',
            pairs,
            allTargets
          },
          verificationStatus: 'verified'
        };
      }
    }

    // 3. Single or Multiple choice
    const pItems = block.items.filter(it => it.type === 'p');
    const options = pItems.map(it => it.text?.trim() || '');
    const redIndices: number[] = [];
    pItems.forEach((it, idx) => {
      if (it.hasRed) redIndices.push(idx);
    });

    const isMultipleDetected =
      titleLower.includes('chọn 2') ||
      titleLower.includes('chọn 3') ||
      titleLower.includes('chọn nhiều') ||
      redIndices.length > 1;
    const type = isMultipleDetected ? 'multiple' : 'single';

    let verificationStatus: 'verified' | 'needs_review' = 'verified';
    let reviewReason: string | undefined = undefined;

    if (redIndices.length === 0) {
      verificationStatus = 'needs_review';
      reviewReason = 'Không tìm thấy phương án được đánh dấu màu đỏ';
    } else if (type === 'single' && redIndices.length > 1) {
      verificationStatus = 'needs_review';
      reviewReason = `Phát hiện ${redIndices.length} đáp án đỏ bất thường ở câu chọn 1`;
    }

    return {
      id,
      sourceFile: filename,
      topicId,
      topicTitle,
      questionNumber: qNumber,
      questionText: qText,
      type,
      options,
      correctAnswers: redIndices,
      verificationStatus,
      reviewReason
    };
  });

  return {
    id: topicId,
    title: topicTitle,
    sourceFile: filename,
    questions
  };
}
