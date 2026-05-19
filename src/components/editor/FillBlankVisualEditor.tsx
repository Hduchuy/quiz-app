import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Sparkles } from 'lucide-react';
import { cn } from '@/utils/helpers';
import type { FillBlankQuestion, FillBlank } from '@/types';

interface FillBlankVisualEditorProps {
  question: FillBlankQuestion;
  onUpdate: (updates: Partial<FillBlankQuestion>) => void;
}

// Calculate word count
function getHintInfo(answer: string): { words: number; chars: number } {
  const trimmed = answer.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(w => w.length > 0).length : 0;
  const chars = trimmed.length;
  return { words, chars };
}

export function FillBlankVisualEditor({ question, onUpdate }: FillBlankVisualEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const answerInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  
  const [selectedBlankId, setSelectedBlankId] = useState<string | null>(null);
  const [focusedAnswerId, setFocusedAnswerId] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [editorInitialized, setEditorInitialized] = useState(false);

  // Check if editor has content
  const hasContent = question.content.length > 0;

  // Handle editor focus
  const handleEditorFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  // Handle editor blur
  const handleEditorBlur = useCallback((e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget?.closest('.blank-chip')) {
      // Don't blur if focusing on a chip
      return;
    }
    if (relatedTarget?.closest('.answer-input')) {
      // Don't blur if focusing on answer input
      return;
    }
    setIsFocused(false);
  }, []);

  // Handle editor click
  const handleEditorClick = useCallback(() => {
    setSelectedBlankId(null);
    
    // Ensure editor is focused
    if (document.activeElement !== editorRef.current) {
      editorRef.current?.focus();
    }
  }, []);

  // Handle editor input - sync content with state (including [id] markers for chips)
  const handleEditorInput = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // Build content from DOM by replacing chips with [id] markers
    const content = buildContentFromDOM(editor);
    
    // Only update if content actually changed
    if (content !== question.content) {
      onUpdate({ content });
    }
  }, [question.content, onUpdate]);

  // Build content string from DOM (replace chips with [id] markers)
  const buildContentFromDOM = (editor: HTMLElement): string => {
    let content = '';
    const walker = document.createTreeWalker(
      editor,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    const nodes: Text[] = [];
    let node: Text | null;
    while ((node = walker.nextNode() as Text)) {
      nodes.push(node);
    }
    
    for (const textNode of nodes) {
      // Check if this text node is inside a chip
      const parentChip = textNode.parentElement?.closest('.blank-chip') as HTMLElement | null;
      if (parentChip) {
        const blankId = parentChip.dataset.blankId;
        if (blankId) {
          content += `[${blankId}]`;
        }
      } else {
        content += textNode.textContent || '';
      }
    }
    
    return content;
  };

  // Handle chip click
  const handleChipClick = useCallback((blankId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBlankId(blankId);
    setFocusedAnswerId(blankId);
    
    // Scroll to answer input
    const inputEl = answerInputRefs.current.get(blankId);
    if (inputEl) {
      inputEl.focus();
    }
  }, []);

  // Insert a blank at current cursor position
  const insertBlankAtCursor = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // Create new blank
    const newBlank: FillBlank = {
      id: crypto.randomUUID(),
      text: '',
      alternatives: [],
    };

    // Get selection and range
    const selection = window.getSelection();
    let insertPosition: { node: Node; offset: number } | null = null;

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      // Check if we're inside the editor
      if (editor.contains(range.startContainer)) {
        insertPosition = {
          node: range.startContainer,
          offset: range.startOffset,
        };
      }
    }

    // Create chip element
    const chip = document.createElement('span');
    chip.className = 'blank-chip';
    chip.dataset.blankId = newBlank.id;
    chip.setAttribute('contenteditable', 'false');
    chip.innerHTML = `<span class="blank-text">Ô trống</span>`;
    chip.addEventListener('click', (e: MouseEvent) => handleChipClick(newBlank.id, e as unknown as React.MouseEvent));

    // Create a zero-width space after chip for cursor positioning
    const zwsp = document.createTextNode('\u200B');

    if (insertPosition) {
      // Insert at cursor position
      const range = document.createRange();
      range.setStart(insertPosition.node, insertPosition.offset);
      range.collapse(true);
      
      const fragment = document.createDocumentFragment();
      fragment.appendChild(chip);
      fragment.appendChild(zwsp);
      
      range.insertNode(fragment);
      
      // Move cursor after the zero-width space
      range.setStartAfter(zwsp);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    } else {
      // Append at end
      const fragment = document.createDocumentFragment();
      fragment.appendChild(chip);
      fragment.appendChild(zwsp);
      editor.appendChild(fragment);
      
      // Move cursor to end
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    // Update state
    onUpdate({
      blanks: [...question.blanks, newBlank],
    });

    setSelectedBlankId(newBlank.id);
    setFocusedAnswerId(newBlank.id);

    // Focus the answer input after a short delay
    setTimeout(() => {
      answerInputRefs.current.get(newBlank.id)?.focus();
    }, 50);
  }, [question.blanks, onUpdate, handleChipClick]);

  // Handle answer input change
  const handleAnswerChange = useCallback((blankId: string, text: string) => {
    const updatedBlanks = question.blanks.map(b =>
      b.id === blankId ? { ...b, text } : b
    );
    onUpdate({ blanks: updatedBlanks });
    
    // Update chip text in DOM
    const chip = editorRef.current?.querySelector(`[data-blank-id="${blankId}"] .blank-text`);
    if (chip) {
      chip.textContent = text.trim() || 'Ô trống';
    }
  }, [question.blanks, onUpdate]);

  // Delete blank
  const deleteBlank = useCallback((blankId: string) => {
    // Remove chip from DOM
    const chip = editorRef.current?.querySelector(`[data-blank-id="${blankId}"]`);
    if (chip) {
      const nextSibling = chip.nextSibling;
      chip.remove();
      // If next sibling is ZWSP, remove it too
      if (nextSibling?.textContent === '\u200B') {
        nextSibling.remove();
      }
      // If previous sibling is ZWSP and next to another chip, remove it
      const prevSibling = chip.previousSibling;
      if (prevSibling?.textContent === '\u200B') {
        const stillNeeded = editorRef.current?.querySelectorAll('.blank-chip').length || 0;
        if (stillNeeded <= 1) {
          prevSibling.remove();
        }
      }
    }

    // Update state - remove both blank and its marker from content
    const updatedBlanks = question.blanks.filter(b => b.id !== blankId);
    const updatedContent = question.content.replace(`[${blankId}]`, '');
    
    onUpdate({
      blanks: updatedBlanks,
      content: updatedContent,
    });
    
    setSelectedBlankId(null);
    setFocusedAnswerId(null);
  }, [question.blanks, question.content, onUpdate]);

  // Handle answer input focus
  const handleAnswerFocus = useCallback((blankId: string) => {
    setSelectedBlankId(blankId);
    setFocusedAnswerId(blankId);
  }, []);

  // Handle answer input keydown
  const handleAnswerKeyDown = useCallback((blankId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      editorRef.current?.focus();
      
      // Find chip and move cursor after it
      const chip = editorRef.current?.querySelector(`[data-blank-id="${blankId}"]`);
      if (chip) {
        const nextSibling = chip.nextSibling;
        const selection = window.getSelection();
        const range = document.createRange();
        
        if (nextSibling) {
          range.setStartBefore(nextSibling);
          range.collapse(true);
        } else {
          // Place at end of editor
          range.selectNodeContents(editorRef.current!);
          range.collapse(false);
        }
        
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    } else if (e.key === 'Backspace' && !e.currentTarget.value) {
      e.preventDefault();
      deleteBlank(blankId);
    }
  }, [deleteBlank]);

  // Initialize editor content on mount
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || editor.children.length > 0 || editorInitialized) return;
    
    setEditorInitialized(true);

    // Parse content and build DOM
    const content = question.content;
    const regex = /\[([^\]]+)\]/g;
    let lastIndex = 0;
    let match;

    const fragment = document.createDocumentFragment();

    while ((match = regex.exec(content)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        const textNode = document.createTextNode(content.slice(lastIndex, match.index));
        fragment.appendChild(textNode);
      }

      // Add chip for blank
      const blankId = match[1];
      const blank = question.blanks.find(b => b.id === blankId);
      const displayText = blank?.text?.trim() || 'Ô trống';

      const chip = document.createElement('span');
      chip.className = 'blank-chip';
      chip.dataset.blankId = blankId;
      chip.setAttribute('contenteditable', 'false');
      chip.innerHTML = `<span class="blank-text">${displayText}</span>`;
      chip.addEventListener('click', (e: MouseEvent) => handleChipClick(blankId, e as unknown as React.MouseEvent));
      fragment.appendChild(chip);

      // Add ZWSP after chip
      fragment.appendChild(document.createTextNode('\u200B'));

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      const textNode = document.createTextNode(content.slice(lastIndex));
      fragment.appendChild(textNode);
    }

    editor.appendChild(fragment);
  }, [question.content, question.blanks, handleChipClick, editorInitialized]);

  // Sync editor content when blanks change (for chip text updates)
  useEffect(() => {
    question.blanks.forEach(blank => {
      const chip = editorRef.current?.querySelector(`[data-blank-id="${blank.id}"] .blank-text`);
      if (chip) {
        chip.textContent = blank.text.trim() || 'Ô trống';
      }
    });
  }, [question.blanks]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-neon-cyan" />
          <label className="text-xs text-white/50">Nội dung câu hỏi</label>
        </div>
        <button
          onClick={insertBlankAtCursor}
          className={cn(
            'relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
            'bg-neon-cyan text-deep-space',
            'hover:opacity-90 transition-all duration-200',
            'shadow-lg shadow-neon-cyan/20'
          )}
        >
          <Plus size={12} />
          Tạo ô trống
        </button>
      </div>

      {/* Editor Container */}
      <div 
        className={cn(
          'relative min-h-[120px] rounded-xl overflow-hidden',
          'border transition-all duration-200',
          isFocused 
            ? 'border-neon-cyan/30 ring-2 ring-neon-cyan/20' 
            : 'border-white/10'
        )}
      >
        {/* Placeholder - only show when empty and not focused */}
        {!hasContent && !isFocused && (
          <div className="absolute inset-0 p-4 pointer-events-none text-sm text-white/35 select-none">
            Nhập nội dung và bấm <span className="text-neon-cyan/70">"Tạo ô trống"</span> để thêm chỗ điền...
          </div>
        )}
        
        {/* ContentEditable Editor */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onFocus={handleEditorFocus}
          onBlur={handleEditorBlur}
          onClick={handleEditorClick}
          onInput={handleEditorInput}
          className={cn(
            'relative min-h-[120px] p-4 z-10',
            'text-sm leading-relaxed text-white/95',
            'whitespace-pre-wrap break-words',
            'outline-none cursor-text',
            !hasContent && 'text-white/0'
          )}
          style={{ caretColor: '#22d3ee' }}
        />
      </div>

      {/* Answer List */}
      {question.blanks.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-white/50">
            Đáp án ({question.blanks.filter(b => b.text.trim()).length}/{question.blanks.length})
          </span>
          <div className="space-y-1.5">
            {question.blanks.map((blank, index) => {
              const hint = getHintInfo(blank.text);
              const isFocusedItem = focusedAnswerId === blank.id;
              const isSelected = selectedBlankId === blank.id;

              return (
                <motion.div
                  key={blank.id}
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                    isSelected
                      ? 'bg-neon-cyan/15 border border-neon-cyan/40 shadow-[0_0_12px_rgba(0,255,255,0.15)]'
                      : 'bg-white/[0.02] hover:bg-white/[0.04] border border-transparent'
                  )}
                >
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-neon-cyan/10 text-neon-cyan text-xs font-semibold flex-shrink-0">
                    {index + 1}
                  </span>
                  <input
                    ref={(el) => {
                      if (el) answerInputRefs.current.set(blank.id, el);
                    }}
                    type="text"
                    value={blank.text}
                    onChange={(e) => handleAnswerChange(blank.id, e.target.value)}
                    onFocus={() => handleAnswerFocus(blank.id)}
                    onKeyDown={(e) => handleAnswerKeyDown(blank.id, e)}
                    placeholder={`Đáp án ${index + 1}`}
                    className={cn(
                      'answer-input flex-1 bg-transparent text-sm transition-all duration-200',
                      blank.text.trim() ? 'text-white' : 'text-white/50',
                      'focus:outline-none',
                      isFocusedItem && 'ring-1 ring-neon-cyan/30'
                    )}
                  />
                  {blank.text.trim() && (
                    <span className="text-xs text-white/40 flex-shrink-0">
                      {hint.words} từ
                    </span>
                  )}
                  <button
                    onClick={() => deleteBlank(blank.id)}
                    className="p-1.5 text-white/40 hover:text-neon-red hover:bg-neon-red/10 rounded-lg transition-colors flex-shrink-0"
                    title="Xóa ô trống"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state hint */}
      {question.blanks.length === 0 && question.content && (
        <p className="text-xs text-white/40 text-center py-2">
          Bấm <span className="text-neon-cyan">"Tạo ô trống"</span> để thêm chỗ điền
        </p>
      )}
    </div>
  );
}
