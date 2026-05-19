import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Copy,
  Trash2,
  Plus,
  X,
  Check,
  AlertCircle,
  ListChecks,
  CheckCircle,
  LayoutGrid,
  Type,
  PlusCircle,
} from 'lucide-react';
import { Button, Textarea, Badge, Modal } from '@/components/ui';
import { useQuizStore } from '@/stores/quizStore';
import { useEditorStore } from '@/stores/editorStore';
import { FillBlankVisualEditor } from '@/components/editor/FillBlankVisualEditor';
import { useFilteredQuestions } from '@/components/editor/FilterBar';
import { cn } from '@/utils/helpers';
import type { Question, MCQQuestion, TrueFalseQuestion, TrueFalseStatement, DragDropBoxesQuestion, DragDropTarget, FillBlankQuestion } from '@/types';

export function EditorPage() {
  const { quiz, updateQuestion, deleteQuestion, duplicateQuestion, addQuestion } = useQuizStore();
  const { selectedQuestionId, collapsedQuestions, toggleCollapsed, selectQuestion, searchQuery, filterType } = useEditorStore();

  // Use filtered questions from FilterBar hook
  const filteredQuestions = useFilteredQuestions();

  // Handle auto-select when filter changes and selected question is hidden
  const handleFilterResult = () => {
    const selectedInFiltered = filteredQuestions.some(q => q.id === selectedQuestionId);
    if (selectedQuestionId && !selectedInFiltered && filteredQuestions.length > 0) {
      // Select the first visible question
      selectQuestion(filteredQuestions[0].id);
    }
  };

  // Run effect when filter changes
  React.useEffect(() => {
    handleFilterResult();
  }, [filterType, filteredQuestions]);

  // Scroll to the selected question once on mount (covers session restore + sidebar nav)
  React.useEffect(() => {
    if (!selectedQuestionId) return;
    // Allow one render cycle so the question card DOM node exists
    const timer = setTimeout(() => {
      const el = document.getElementById(`question-${selectedQuestionId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty: run only once on mount

  // Empty state message based on filter
  const getEmptyMessage = () => {
    if (quiz.questions.length === 0) {
      return { title: 'Chưa có câu hỏi nào', subtitle: 'Nhấn nút bên trái để thêm câu hỏi mới' };
    }
    if (searchQuery) {
      return { title: 'Không tìm thấy câu hỏi nào', subtitle: 'Thử tìm kiếm với từ khóa khác' };
    }
    const typeLabels: Record<string, string> = {
      mcq: 'Trắc nghiệm',
      truefalse: 'Đúng/Sai',
      drag_drop_boxes: 'Kéo thả',
      fillblank: 'Điền chỗ trống',
    };
    return { 
      title: `Chưa có câu hỏi dạng ${typeLabels[filterType] || ''}`,
      subtitle: '',
      showAddButton: true,
      type: filterType
    };
  };

  const emptyState = getEmptyMessage();

  return (
    <>
      {/* Editor Content */}
      <div className="h-full overflow-y-auto editor-content">
        <div className="max-w-[1100px] mx-auto space-y-3 py-3 px-4">
        <AnimatePresence mode="popLayout">
          {filteredQuestions.map((question, index) => (
            <div key={question.id} id={`question-${question.id}`}>
              <QuestionCard
                question={question}
                index={index}
                isSelected={selectedQuestionId === question.id}
                isCollapsed={collapsedQuestions.has(question.id)}
                onSelect={() => selectQuestion(question.id)}
                onToggleCollapse={() => toggleCollapsed(question.id)}
                onUpdate={(updates) => updateQuestion(question.id, updates)}
                onDelete={() => deleteQuestion(question.id)}
                onDuplicate={() => duplicateQuestion(question.id)}
              />
            </div>
          ))}
        </AnimatePresence>

        {filteredQuestions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <ListChecks className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/50 text-lg font-medium">
              {emptyState.title}
            </p>
            {emptyState.subtitle && (
              <p className="text-white/30 text-sm mt-2">
                {emptyState.subtitle}
              </p>
            )}
            {emptyState.showAddButton && emptyState.type && emptyState.type !== 'all' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const newQ = addQuestion(emptyState.type as any);
                  setTimeout(() => {
                    const element = document.getElementById(`question-${newQ.id}`);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }, 100);
                }}
                className="mt-4 px-4 py-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-sm font-medium hover:bg-neon-cyan/20 transition-colors flex items-center gap-2 mx-auto"
              >
                <PlusCircle size={16} />
                Thêm câu hỏi {emptyState.title.replace('Chưa có câu hỏi dạng ', '')}
              </motion.button>
            )}
          </motion.div>
        )}
      </div>
    </div>
    </>
  );
}

interface QuestionCardProps {
  question: Question;
  index: number;
  isSelected: boolean;
  isCollapsed: boolean;
  onSelect: () => void;
  onToggleCollapse: () => void;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function QuestionCard({
  question,
  index,
  isSelected,
  isCollapsed,
  onSelect,
  onToggleCollapse,
  onUpdate,
  onDelete,
  onDuplicate,
}: QuestionCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
    mcq: { label: 'Trắc nghiệm', icon: ListChecks, color: 'cyan' },
    truefalse: { label: 'Đúng/Sai', icon: CheckCircle, color: 'green' },
    fillblank: { label: 'Điền chỗ trống', icon: Type, color: 'pink' },
    matching: { label: 'Kéo thả', icon: LayoutGrid, color: 'purple' },
  };

  const config = typeConfig[question.type] ?? { label: 'Câu hỏi', icon: ListChecks, color: 'cyan' as const };

  // Get display title - uses type label if no content, otherwise shows content preview
  const getDisplayTitle = () => {
    // For fillblank, use content preview (without [id] markers)
    if (question.type === 'fillblank') {
      const fbQuestion = question as FillBlankQuestion;
      if (!fbQuestion?.content) return config.label;
      
      // Parse content properly to build preview
      const regex = /\[([^\]]+)\]/g;
      let lastIndex = 0;
      let preview = '';
      let match;

      while ((match = regex.exec(fbQuestion.content)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
          preview += fbQuestion.content.slice(lastIndex, match.index);
        }
        // Add blank marker with proper spacing
        const textBefore = fbQuestion.content[match.index - 1];
        const textAfter = fbQuestion.content[regex.lastIndex];
        const needsSpaceBefore = textBefore && !/\s/.test(textBefore) && preview.length > 0;
        const needsSpaceAfter = textAfter && !/\s/.test(textAfter);
        
        if (needsSpaceBefore) preview += ' ';
        preview += '____';
        if (needsSpaceAfter) preview += ' ';

        lastIndex = regex.lastIndex;
      }

      // Add remaining text
      if (lastIndex < fbQuestion.content.length) {
        preview += fbQuestion.content.slice(lastIndex);
      }

      if (!preview.trim()) return config.label;
      return preview.length > 40 ? preview.slice(0, 40) + '...' : preview;
    }

    // For other types, use title or type label
    if (question.title?.trim()) {
      return question.title.length > 40 ? question.title.slice(0, 40) + '...' : question.title;
    }
    return config.label;
  };

  const isComplete = () => {
    if (!question) return false;
    
    if (question.type === 'mcq') {
      const mcq = question as MCQQuestion;
      const opts = mcq.options ?? [];
      const hasCorrect = opts.some(opt => opt?.correct);
      const allFilled = opts.every(opt => opt?.text?.trim());
      return hasCorrect && allFilled;
    }
    if (question.type === 'truefalse') {
      const tfQuestion = question as TrueFalseQuestion;
      const stmts = tfQuestion.statements ?? [];
      return stmts.length > 0 && stmts.every((s) => s?.text?.trim());
    }
    if (question.type === 'drag_drop_boxes') {
      const ddQuestion = question as DragDropBoxesQuestion;
      const targets = ddQuestion.targets ?? [];
      return targets.length > 0 && targets.every((t) => t?.title?.trim() && (t?.correctAnswers?.length ?? 0) > 0);
    }
    if (question.type === 'fillblank') {
      const fbQuestion = question as FillBlankQuestion;
      const blanks = fbQuestion.blanks ?? [];
      const actualText = (fbQuestion.content ?? '').replace(/\[\w+\]/g, '').trim();
      return actualText.length > 0 && blanks.length > 0 && blanks.every(b => b?.text?.trim());
    }
    return !!(question as { title?: string }).title?.trim();
  };

  return (
    <motion.div
      id={`question-${question.id}`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'rounded-2xl transition-all duration-200 overflow-visible',
        'border',
        isSelected
          ? 'bg-white/[0.08] border-neon-cyan/30 shadow-neon-cyan/10'
          : 'bg-white/[0.05] border-white/10 hover:border-white/20'
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3">
        {/* Drag Handle */}
        <div className="drag-handle cursor-grab text-white/30 hover:text-white/60 transition-colors">
          <GripVertical size={16} />
        </div>

        {/* Question Number */}
        <Badge variant={isComplete() ? 'green' : 'yellow'} size="sm">
          {index + 1}
        </Badge>

        {/* Type Badge */}
        <Badge
          variant={config.color as 'cyan' | 'green' | 'purple' | 'pink'}
          size="sm"
          className="hidden sm:flex items-center gap-1"
        >
          <config.icon size={10} />
          <span className="hidden md:inline">{config.label}</span>
        </Badge>

        {/* Title Preview */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'truncate text-sm',
            getDisplayTitle() !== config.label ? 'text-white/80' : 'text-white/40 italic'
          )}>
            {getDisplayTitle()}
          </p>
        </div>

        {/* Status */}
        {!isComplete() && (
          <div className="flex items-center gap-1 text-neon-yellow text-xs">
            <AlertCircle size={12} />
            <span className="hidden sm:inline">Chưa hoàn chỉnh</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className="p-1.5 rounded-lg text-white/40 hover:text-neon-red hover:bg-neon-red/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-visible"
          >
            <div className="px-3 pb-3 pt-1">
              <QuestionEditor
                question={question}
                onUpdate={onUpdate}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Xóa câu hỏi"
        size="sm"
      >
        <p className="text-white/70 mb-6">
          Bạn có chắc muốn xóa câu hỏi này không? Hành động này không thể hoàn tác.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={() => {
            onDelete();
            setShowDeleteConfirm(false);
          }}>
            Xóa
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}

interface QuestionEditorProps {
  question: Question;
  onUpdate: (updates: Partial<Question>) => void;
}

function QuestionEditor({ question, onUpdate }: QuestionEditorProps) {
  if (question.type === 'mcq') {
    return <MCQEditor question={question} onUpdate={onUpdate} />;
  }
  if (question.type === 'truefalse') {
    return <TrueFalseEditor question={question} onUpdate={onUpdate} />;
  }
  if (question.type === 'drag_drop_boxes') {
    return <DragDropBoxesEditor question={question} onUpdate={onUpdate} />;
  }
  if (question.type === 'fillblank') {
    return <FillBlankEditor question={question} onUpdate={onUpdate} />;
  }
  return null;
}

// MCQ Editor
function MCQEditor({ question, onUpdate }: { question: MCQQuestion; onUpdate: (u: Partial<MCQQuestion>) => void }) {
  const options = question.options ?? [];
  const correctCount = options.filter(opt => opt?.correct).length;
  const hasMultipleCorrect = correctCount > 1;

  const addOption = () => {
    onUpdate({
      options: [...options, { id: crypto.randomUUID(), text: '', correct: false }],
    });
  };

  const updateOption = (optionId: string, text: string) => {
    onUpdate({
      options: options.map((opt) =>
        opt?.id === optionId ? { ...opt, text } : opt
      ),
    });
  };

  const toggleCorrect = (optionId: string) => {
    onUpdate({
      options: options.map((opt) =>
        opt?.id === optionId ? { ...opt, correct: !opt.correct } : opt
      ),
    });
  };

  const removeOption = (optionId: string) => {
    if (options.length <= 2) return;
    onUpdate({
      options: options.filter((opt) => opt?.id !== optionId),
    });
  };

  const duplicateOption = (optionId: string) => {
    const index = options.findIndex(opt => opt?.id === optionId);
    const sourceOpt = options[index];
    if (!sourceOpt) return;
    const duplicated = { id: crypto.randomUUID(), text: sourceOpt.text, correct: false };
    const newOptions = [...options];
    newOptions.splice(index + 1, 0, duplicated);
    onUpdate({ options: newOptions });
  };

  // Validation
  const validateOptions = () => {
    const texts = options.map(opt => opt?.text?.trim()?.toLowerCase() ?? '');
    const hasDuplicate = texts.filter(t => t !== '').length !== new Set(texts.filter(t => t !== '')).size;
    const hasEmpty = options.some(opt => !opt?.text?.trim());
    return { hasDuplicate, hasEmpty, hasNoCorrect: correctCount === 0 };
  };

  const validation = validateOptions();

  return (
    <div className="space-y-3">
      {/* Question Title */}
      <Textarea
        placeholder="Nhập nội dung câu hỏi..."
        value={question.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
        className="min-h-[80px] text-sm"
      />

      {/* Multi-answer indicator */}
      {hasMultipleCorrect && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-neon-purple/10 border border-neon-purple/30">
          <ListChecks size={14} className="text-neon-purple" />
          <span className="text-xs text-neon-purple font-medium">
            Câu hỏi nhiều đáp án đúng ({correctCount} đáp án)
          </span>
        </div>
      )}

      {/* Answer Selection Guidance */}
      <div className="flex items-center gap-2 p-2 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20">
        <div className="w-6 h-6 rounded-lg bg-neon-cyan/20 flex items-center justify-center flex-shrink-0">
          <CheckCircle size={12} className="text-neon-cyan" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white leading-tight">
            {hasMultipleCorrect ? 'Chọn một hoặc nhiều đáp án đúng' : 'Chọn đáp án đúng'}
          </p>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {(options ?? []).map((option, index) => (
          <OptionEditor
            key={option?.id ?? index}
            option={option ?? { id: '', text: '', correct: null }}
            index={index}
            onUpdateText={updateOption}
            onToggleCorrect={toggleCorrect}
            onRemove={removeOption}
            onDuplicate={duplicateOption}
            canRemove={(options?.length ?? 0) > 2}
          />
        ))}
      </div>

      {/* Add Option Button */}
      <Button variant="ghost" size="sm" onClick={addOption} leftIcon={<Plus size={14} />}>
        Thêm đáp án
      </Button>

      {/* Validation Warnings */}
      {validation.hasNoCorrect && (
        <p className="text-xs text-neon-yellow flex items-center gap-1.5">
          <AlertCircle size={12} />
          <span>Phải có ít nhất 1 đáp án đúng</span>
        </p>
      )}
      {validation.hasEmpty && (
        <p className="text-xs text-neon-yellow flex items-center gap-1.5">
          <AlertCircle size={12} />
          <span>Tất cả đáp án phải có nội dung</span>
        </p>
      )}
      {validation.hasDuplicate && (
        <p className="text-xs text-neon-yellow flex items-center gap-1.5">
          <AlertCircle size={12} />
          <span>Các đáp án không được trùng nhau</span>
        </p>
      )}

      {/* Explanation */}
      <div>
        <label className="text-xs text-white/50 mb-1.5 block">Giải thích (tùy chọn)</label>
        <Textarea
          placeholder="Nhập giải thích..."
          value={question.explanation || ''}
          onChange={(e) => onUpdate({ explanation: e.target.value })}
          className="min-h-[48px] text-sm"
        />
      </div>
    </div>
  );
}

// Option Editor Component (Memoized for performance)
interface OptionEditorProps {
  option: { id: string; text: string; correct: boolean | null };
  index: number;
  onUpdateText: (id: string, text: string) => void;
  onToggleCorrect: (id: string) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  canRemove: boolean;
}

const OptionEditor = React.memo(function OptionEditor({
  option,
  index,
  onUpdateText,
  onToggleCorrect,
  onRemove,
  onDuplicate,
  canRemove,
}: OptionEditorProps) {
  const label = String.fromCharCode(65 + index);

  const handleCorrectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCorrect(option.id);
  };

  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-white/5 border border-white/10 group hover:border-white/20 transition-all">
      {/* Drag Handle */}
      <div className="drag-handle cursor-grab text-white/30 hover:text-white/60 transition-colors pt-1">
        <GripVertical size={14} />
      </div>

      {/* Checkbox for correct answer */}
      <motion.button
        onClick={handleCorrectClick}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        className={cn(
          'w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 cursor-pointer',
          option.correct
            ? 'border-neon-cyan bg-neon-cyan text-deep-space shadow-neon-cyan/50'
            : 'border-white/30 bg-white/5 hover:border-neon-cyan/60 hover:bg-neon-cyan/10'
        )}
        title={option.correct ? 'Bỏ chọn đáp án đúng' : 'Chọn làm đáp án đúng'}
      >
        <AnimatePresence mode="wait">
          {option.correct && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Check size={12} strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Label */}
      <div className="w-6 h-6 rounded-md bg-white/10 text-white/80 flex items-center justify-center font-bold text-xs flex-shrink-0">
        {label}
      </div>

      {/* Text Input — border/glow applied directly on textarea so it always
           follows content height exactly (no wrapper ring misalignment) */}
      <div className="flex-1">
        <textarea
          value={option.text}
          onChange={(e) => onUpdateText(option.id, e.target.value)}
          placeholder={`Đáp án ${label}`}
          rows={2}
          className={cn(
            'w-full px-2 py-1.5 rounded-md text-white text-sm placeholder:text-white/30',
            'focus:outline-none transition-colors resize-none max-h-[4.5rem] overflow-y-auto',
            option.correct
              ? 'border border-neon-cyan/60 bg-neon-cyan/[0.06] shadow-[0_0_0_2px_rgba(0,255,255,0.08)]'
              : 'border border-white/10 bg-white/5 focus:border-neon-cyan/50'
          )}
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onDuplicate(option.id)}
          className="p-1 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          title="Nhân bản"
        >
          <Copy size={12} />
        </button>
        <button
          onClick={() => onRemove(option.id)}
          disabled={!canRemove}
          className="p-1 rounded text-white/40 hover:text-neon-red hover:bg-neon-red/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Xóa"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
});

// True/False Editor (Multi-statement)
function TrueFalseEditor({ question, onUpdate }: { question: TrueFalseQuestion; onUpdate: (u: Partial<TrueFalseQuestion>) => void }) {
  const statements = question.statements ?? [];
  
  const addStatement = () => {
    onUpdate({
      statements: [...statements, { id: crypto.randomUUID(), text: '', answer: null }],
    });
  };

  const updateStatement = (statementId: string, updates: Partial<{ text: string; answer: boolean | null }>) => {
    onUpdate({
      statements: statements.map((s) =>
        s?.id === statementId ? { ...s, ...updates } : s
      ),
    });
  };

  const removeStatement = (statementId: string) => {
    if (statements.length <= 1) return;
    onUpdate({
      statements: statements.filter((s) => s?.id !== statementId),
    });
  };

  const duplicateStatement = (statement: { id: string; text: string; answer: boolean | null }) => {
    const index = statements.findIndex((s) => s?.id === statement.id);
    const sourceStmt = statements[index];
    if (!sourceStmt) return;
    const duplicated = { ...sourceStmt, id: crypto.randomUUID() };
    const newStatements = [...statements];
    newStatements.splice(index + 1, 0, duplicated);
    onUpdate({ statements: newStatements });
  };

  const isComplete = () => {
    return statements.length > 0 &&
      statements.every((s) => s?.text?.trim());
  };

  return (
    <div className="space-y-3">
      {/* Question Title */}
      <Textarea
        placeholder="Nhập nội dung câu hỏi (VD: Cho các nhận định sau)..."
        value={question.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
        className="min-h-[80px] text-sm"
      />

      {/* Statements List */}
      <div className="space-y-2">
        {(statements ?? []).map((statement, index) => (
          <StatementEditor
            key={statement?.id ?? index}
            statement={statement ?? { id: '', text: '', answer: null }}
            index={index}
            onUpdate={(updates) => updateStatement(statement?.id ?? '', updates)}
            onRemove={() => removeStatement(statement?.id ?? '')}
            onDuplicate={() => duplicateStatement(statement ?? { id: '', text: '', answer: null })}
            canRemove={(statements?.length ?? 0) > 1}
          />
        ))}
      </div>

      {/* Add Statement Button */}
      <Button variant="ghost" size="sm" onClick={addStatement} leftIcon={<Plus size={14} />}>
        Thêm mệnh đề
      </Button>

      {/* Validation Warning */}
      {!isComplete() && (statements ?? []).some((s) => !s?.text?.trim()) && (
        <p className="text-xs text-neon-yellow flex items-center gap-1.5">
          <span>⚠️</span> Vui lòng nhập nội dung cho tất cả các mệnh đề
        </p>
      )}

      {/* Explanation */}
      <div>
        <label className="text-xs text-white/50 mb-1.5 block">Giải thích (tùy chọn)</label>
        <Textarea
          placeholder="Nhập giải thích..."
          value={question.explanation || ''}
          onChange={(e) => onUpdate({ explanation: e.target.value })}
          className="min-h-[48px] text-sm"
        />
      </div>
    </div>
  );
}

// Statement Editor Component (Memoized)
interface StatementEditorProps {
  statement: TrueFalseStatement;
  index: number;
  onUpdate: (updates: Partial<{ text: string; answer: boolean | null }>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  canRemove: boolean;
}

const StatementEditor = React.memo(function StatementEditor({
  statement,
  index,
  onUpdate,
  onRemove,
  onDuplicate,
  canRemove,
}: StatementEditorProps) {
  const label = String.fromCharCode(65 + index);

  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-white/5 border border-white/10 group hover:border-white/20 transition-colors">
      {/* Drag Handle */}
      <div className="drag-handle cursor-grab text-white/30 hover:text-white/60 transition-colors pt-1">
        <GripVertical size={14} />
      </div>

      {/* Label */}
      <div className="w-6 h-6 rounded-md bg-neon-cyan/10 text-neon-cyan flex items-center justify-center font-medium text-xs flex-shrink-0">
        {label}
      </div>

      {/* Text Input */}
      <textarea
        value={statement.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        placeholder={`Nhập mệnh đề ${label}...`}
        rows={1}
        className="flex-1 px-2 py-1.5 rounded-md bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors resize-none max-h-[4.5rem] overflow-y-auto"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}
      />

      {/* True/False Toggle */}
      <div className="flex rounded-md overflow-hidden border border-white/10 flex-shrink-0">
        <button
          onClick={() => onUpdate({ answer: true })}
          className={cn(
            'px-2 py-1 text-xs font-medium transition-all',
            statement.answer === true
              ? 'bg-neon-green text-deep-space'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          )}
        >
          Đúng
        </button>
        <button
          onClick={() => onUpdate({ answer: false })}
          className={cn(
            'px-2 py-1 text-xs font-medium transition-all',
            statement.answer === false
              ? 'bg-neon-red text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          )}
        >
          Sai
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onDuplicate}
          className="p-1 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          title="Nhân bản"
        >
          <Copy size={12} />
        </button>
        <button
          onClick={onRemove}
          disabled={!canRemove}
          className="p-1 rounded text-white/40 hover:text-neon-red hover:bg-neon-red/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Xóa"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
});

// DragDropBoxes Editor
function DragDropBoxesEditor({ question, onUpdate }: { question: DragDropBoxesQuestion; onUpdate: (u: Partial<DragDropBoxesQuestion>) => void }) {
  // Generate all answers (correct + distractors) for preview
  const allAnswers = [
    ...question.targets.flatMap((t) => t.correctAnswers),
    ...question.distractors,
  ];

  // Add a new target box
  const addTarget = () => {
    onUpdate({
      targets: [...question.targets, { id: crypto.randomUUID(), title: '', correctAnswers: [''] }],
    });
  };

  // Update a target's title
  const updateTargetTitle = (targetId: string, title: string) => {
    onUpdate({
      targets: question.targets.map((t) =>
        t.id === targetId ? { ...t, title } : t
      ),
    });
  };

  // Update a target's correct answers
  const updateTargetAnswers = (targetId: string, answers: string[]) => {
    onUpdate({
      targets: question.targets.map((t) =>
        t.id === targetId ? { ...t, correctAnswers: answers } : t
      ),
    });
  };

  // Add an answer to a target
  const addAnswerToTarget = (targetId: string) => {
    const target = question.targets.find((t) => t.id === targetId);
    if (target) {
      updateTargetAnswers(targetId, [...target.correctAnswers, '']);
    }
  };

  // Update a specific answer in a target
  const updateAnswer = (targetId: string, index: number, text: string) => {
    const target = question.targets.find((t) => t.id === targetId);
    if (target) {
      const newAnswers = [...target.correctAnswers];
      newAnswers[index] = text;
      updateTargetAnswers(targetId, newAnswers);
    }
  };

  // Remove an answer from a target
  const removeAnswerFromTarget = (targetId: string, index: number) => {
    const target = question.targets.find((t) => t.id === targetId);
    if (target && target.correctAnswers.length > 1) {
      const newAnswers = target.correctAnswers.filter((_, i) => i !== index);
      updateTargetAnswers(targetId, newAnswers);
    }
  };

  // Remove a target
  const removeTarget = (targetId: string) => {
    if (question.targets.length > 1) {
      onUpdate({
        targets: question.targets.filter((t) => t.id !== targetId),
      });
    }
  };

  // Add a distractor
  const addDistractor = () => {
    onUpdate({
      distractors: [...question.distractors, ''],
    });
  };

  // Update a distractor
  const updateDistractor = (index: number, text: string) => {
    const newDistractors = [...question.distractors];
    newDistractors[index] = text;
    onUpdate({ distractors: newDistractors });
  };

  // Remove a distractor
  const removeDistractor = (index: number) => {
    onUpdate({
      distractors: question.distractors.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4">
      {/* Question Title */}
      <Textarea
        placeholder="Nhập nội dung câu hỏi (VD: Kéo thả đáp án vào các ô tương ứng)..."
        value={question.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
        className="min-h-[80px] text-sm"
      />

      {/* Target Boxes Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-neon-purple">Ô tương ứng</h4>
          <Button variant="ghost" size="sm" onClick={addTarget} leftIcon={<Plus size={12} />}>
            Thêm ô
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {question.targets.map((target, targetIndex) => (
            <TargetBoxEditor
              key={target.id}
              target={target}
              index={targetIndex}
              onUpdateTitle={(title) => updateTargetTitle(target.id, title)}
              onUpdateAnswers={(answers) => updateTargetAnswers(target.id, answers)}
              onAddAnswer={() => addAnswerToTarget(target.id)}
              onUpdateAnswer={(index, text) => updateAnswer(target.id, index, text)}
              onRemoveAnswer={(index) => removeAnswerFromTarget(target.id, index)}
              onRemove={question.targets.length > 1 ? () => removeTarget(target.id) : undefined}
            />
          ))}
        </div>
      </div>

      {/* Distractors Section */}
      <div className="space-y-2 p-3 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-neon-pink">Đáp án nhiễu (tùy chọn)</h4>
          <Button variant="ghost" size="sm" onClick={addDistractor} leftIcon={<Plus size={12} />}>
            Thêm
          </Button>
        </div>
        <p className="text-xs text-white/40">
          Các đáp án nhiễu sẽ xuất hiện trong kho đáp án để tăng độ khó
        </p>

        {question.distractors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {question.distractors.map((distractor, index) => (
              <div key={index} className="flex items-center gap-1">
                <input
                  type="text"
                  value={distractor}
                  onChange={(e) => updateDistractor(index, e.target.value)}
                  placeholder="Đáp án nhiễu..."
                  className="px-2 py-1 rounded bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-neon-pink/50 w-28"
                />
                <button
                  onClick={() => removeDistractor(index)}
                  className="p-1 text-white/40 hover:text-neon-red transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Answer Pool Preview */}
      {allAnswers.filter((a) => a.trim()).length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-medium text-white/50">Kho đáp án (preview)</h4>
          <div className="flex flex-wrap gap-1.5">
            {allAnswers.filter((a) => a.trim()).map((answer, index) => (
              <span
                key={index}
                className="px-2 py-1 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs"
              >
                {answer}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Explanation */}
      <div>
        <label className="text-xs text-white/50 mb-1.5 block">Giải thích (tùy chọn)</label>
        <Textarea
          placeholder="Nhập giải thích..."
          value={question.explanation || ''}
          onChange={(e) => onUpdate({ explanation: e.target.value })}
          className="min-h-[48px] text-sm"
        />
      </div>
    </div>
  );
}

// Target Box Editor Component
interface TargetBoxEditorProps {
  target: DragDropTarget;
  index: number;
  onUpdateTitle: (title: string) => void;
  onUpdateAnswers: (answers: string[]) => void;
  onAddAnswer: () => void;
  onUpdateAnswer: (index: number, text: string) => void;
  onRemoveAnswer: (index: number) => void;
  onRemove?: () => void;
}

function TargetBoxEditor({
  target,
  index,
  onUpdateTitle,
  onAddAnswer,
  onUpdateAnswer,
  onRemoveAnswer,
  onRemove,
}: TargetBoxEditorProps) {
  const label = String.fromCharCode(65 + index);

  return (
    <div className="p-3 rounded-xl bg-white/5 border border-neon-purple/20 space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-neon-purple/20 text-neon-purple flex items-center justify-center font-medium text-xs">
          {label}
        </div>
        <input
          type="text"
          value={target.title}
          onChange={(e) => onUpdateTitle(e.target.value)}
          placeholder={`Nội dung ô ${label}...`}
          className="flex-1 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-neon-purple/50"
        />
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-1 rounded text-white/40 hover:text-neon-red hover:bg-neon-red/10 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Correct Answers */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">Đáp án đúng</span>
          <button
            onClick={onAddAnswer}
            className="text-xs text-neon-cyan hover:underline"
          >
            + Thêm
          </button>
        </div>
        <div className="space-y-1">
          {target.correctAnswers.map((answer, answerIndex) => (
            <div key={answerIndex} className="flex items-center gap-1.5">
              <CheckCircle size={10} className="text-neon-green flex-shrink-0" />
              <input
                type="text"
                value={answer}
                onChange={(e) => onUpdateAnswer(answerIndex, e.target.value)}
                placeholder="Đáp án..."
                className="flex-1 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-neon-green/50"
              />
              {target.correctAnswers.length > 1 && (
                <button
                  onClick={() => onRemoveAnswer(answerIndex)}
                  className="p-0.5 text-white/40 hover:text-neon-red transition-colors"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Fill Blank Editor - Using Visual Editor
function FillBlankEditor({ question, onUpdate }: { question: FillBlankQuestion; onUpdate: (u: Partial<FillBlankQuestion>) => void }) {
  return (
    <div className="space-y-4">
      {/* Visual Editor */}
      <FillBlankVisualEditor question={question} onUpdate={onUpdate} />

      {/* Explanation */}
      <div>
        <label className="text-xs text-white/50 mb-1.5 block">Giải thích (tùy chọn)</label>
        <Textarea
          placeholder="Nhập giải thích..."
          value={question.explanation || ''}
          onChange={(e) => onUpdate({ explanation: e.target.value })}
          className="min-h-[48px] text-sm"
        />
      </div>
    </div>
  );
}
