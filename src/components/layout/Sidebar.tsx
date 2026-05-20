import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ListChecks, CheckCircle, Plus, Copy, Trash2, LayoutGrid, Type, ChevronRight, Upload } from 'lucide-react';
import { useQuizStore } from '@/stores/quizStore';
import { useEditorStore } from '@/stores/editorStore';
import { cn } from '@/utils/helpers';
import { ImportModal } from '@/components/quiz/ImportModal';
import type { Question, TrueFalseQuestion, FillBlankQuestion, MCQQuestion, DragDropBoxesQuestion } from '@/types';

// Constants
export const SIDEBAR_WIDTH = 288;
export const TOPBAR_HEIGHT = 64;
export const BOTTOMBAR_HEIGHT = 64;
export const SCROLL_OFFSET = 140;
export const MOBILE_DRAWER_BOTTOM = BOTTOMBAR_HEIGHT;

// Helper function to find the scrollable parent container
function getScrollableParent(element: HTMLElement): HTMLElement | Window | null {
  let parent = element.parentElement;
  while (parent) {
    const style = window.getComputedStyle(parent);
    if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
      return parent;
    }
    parent = parent.parentElement;
  }
  return window;
}

// Helper function to scroll to a question card
function scrollToQuestion(questionId: string) {
  const element = document.getElementById(`question-${questionId}`);
  if (!element) return;

  const scrollParent = getScrollableParent(element);
  setTimeout(() => {
    if (scrollParent === window) {
      const elementTop = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementTop - SCROLL_OFFSET, behavior: 'smooth' });
    } else {
      const container = scrollParent as HTMLElement;
      const containerRect = container.getBoundingClientRect();
      container.scrollTo({ top: element.offsetTop - containerRect.top - 16, behavior: 'smooth' });
    }
  }, 100);
}

// Helper functions
function getFillBlankPreview(question: FillBlankQuestion): string {
  const content = question.content;
  if (!content) return 'Điền chỗ trống';
  let preview = content.replace(/\[[\w-]+\]/g, '____').replace(/\s+/g, ' ').trim();
  if (!preview || preview === '____') return 'Điền chỗ trống';
  if (preview.length > 24) preview = preview.substring(0, 24) + '...';
  return preview;
}

function getQuestionPreview(q: Question): string {
  if (!q) return 'Câu hỏi';
  if (q.type === 'fillblank') return getFillBlankPreview(q as FillBlankQuestion) || 'Câu điền khuyết';
  const title = q.title?.replace(/\s+/g, ' ').trim();
  return title || 'Câu hỏi';
}

const TYPE_LABELS: Record<string, string> = {
  mcq: 'TN',
  truefalse: 'ĐS',
  fillblank: 'ĐC',
  drag_drop_boxes: 'KT',
};

export function Sidebar() {
  const location = useLocation();
  if (location.pathname === '/') return null;

  return (
    <>
      <aside
        className="hidden lg:block fixed left-0 z-[900] overflow-hidden"
        style={{
          top: TOPBAR_HEIGHT,
          width: SIDEBAR_WIDTH,
          height: `calc(100vh - ${TOPBAR_HEIGHT}px - ${BOTTOMBAR_HEIGHT}px)`,
          background: 'rgba(10, 10, 26, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <SidebarContent />
      </aside>
      <MobileSidebar />
    </>
  );
}

function SidebarContent() {
  const { addQuestion, duplicateQuestion, deleteQuestion } = useQuizStore();
  const { selectedQuestionId, selectQuestion, filterType } = useEditorStore();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const questionTypes = [
    { type: 'mcq' as const, label: 'Trắc nghiệm', icon: ListChecks, color: 'cyan' },
    { type: 'truefalse' as const, label: 'Đúng/Sai', icon: CheckCircle, color: 'green' },
    { type: 'fillblank' as const, label: 'Điền chỗ trống', icon: Type, color: 'pink' },
    { type: 'drag_drop_boxes' as const, label: 'Kéo thả', icon: LayoutGrid, color: 'purple' },
  ];

  const { quiz } = useQuizStore();
  const visibleQuestions = quiz.questions?.filter(q => q && (filterType === 'all' || q.type === filterType)) || [];

  const getStatusColor = (q: Question) => {
    if (!q) return 'yellow';
    if (q.type === 'mcq') {
      const mq = q as MCQQuestion;
      const hasCorrect = mq.options?.some(o => o.correct) ?? false;
      const hasText = mq.options?.every(o => o.text?.trim()) ?? false;
      return hasCorrect && hasText ? 'green' : 'yellow';
    }
    if (q.type === 'truefalse') {
      const tfQ = q as TrueFalseQuestion;
      const hasStatements = (tfQ.statements?.length ?? 0) >= 1;
      const hasText = tfQ.statements?.every(s => s.text?.trim()) ?? false;
      return hasStatements && hasText ? 'green' : 'yellow';
    }
    if (q.type === 'fillblank') {
      const fbQ = q as FillBlankQuestion;
      return (fbQ.blanks?.length ?? 0) > 0 ? 'green' : 'yellow';
    }
    if (q.type === 'drag_drop_boxes') {
      const ddQ = q as DragDropBoxesQuestion;
      const targets = ddQ.targets ?? [];
      const hasTargets = targets.length > 0;
      const allFilled = targets.every((t) => t?.title?.trim() && (t?.correctAnswers?.length ?? 0) > 0 && t.correctAnswers.every(ans => ans?.trim()));
      return hasTargets && allFilled ? 'green' : 'yellow';
    }
    return 'green';
  };

  const handleSelectQuestion = (q: Question) => {
    selectQuestion(q.id);
    setTimeout(() => {
      scrollToQuestion(q.id);
      setHighlightedId(q.id);
      setTimeout(() => setHighlightedId(null), 1000);
    }, 50);
  };

  const handleDuplicate = (q: Question, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateQuestion(q.id);
  };

  const handleDelete = (q: Question, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteQuestion(q.id);
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Add Question Buttons */}
      <div className="p-3 border-b border-white/10">
        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-3 px-1">Thêm câu hỏi</p>
        <div className="space-y-2">
          {questionTypes.map(({ type, label, icon: Icon, color }) => (
            <motion.button
              key={type}
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const newQ = addQuestion(type);
                setTimeout(() => handleSelectQuestion(newQ), 100);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                'bg-white/[0.04] hover:bg-white/[0.08]',
                'border border-white/[0.06] hover:border-white/[0.12]',
                'text-white/80 hover:text-white'
              )}
            >
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', `text-neon-${color}`)}>
                <Icon size={18} />
              </div>
              <span className="flex-1 text-left">{label}</span>
              <Plus size={16} className="text-white/30" />
            </motion.button>
          ))}

          {/* Import from File Button */}
          <motion.button
            whileHover={{ scale: 1.02, x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowImportModal(true)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
              'bg-neon-cyan/10 hover:bg-neon-cyan/15',
              'border border-neon-cyan/20 hover:border-neon-cyan/30',
              'text-neon-cyan hover:text-neon-cyan'
            )}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-neon-cyan">
              <Upload size={18} />
            </div>
            <span className="flex-1 text-left">Nhập file</span>
            <Plus size={16} className="text-neon-cyan/40" />
          </motion.button>
        </div>
      </div>

      {/* Import Modal */}
      <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} />

      {/* Question List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-2">
          <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2 px-1">
            Câu hỏi ({visibleQuestions.length})
          </p>
          
          <div className="space-y-1.5">
            <AnimatePresence>
              {visibleQuestions.map((q, index) => {
                const preview = getQuestionPreview(q);
                const isSelected = selectedQuestionId === q.id;
                const isHighlighted = highlightedId === q.id;
                const statusColor = getStatusColor(q);

                return (
                  <motion.div
                    key={q.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      'group relative rounded-lg transition-all duration-200 cursor-pointer',
                      'border backdrop-blur-sm',
                      isSelected && 'bg-neon-cyan/[0.08] border-neon-cyan/40 shadow-[0_0_12px_rgba(34,211,238,0.1)]',
                      isHighlighted && !isSelected && 'bg-neon-yellow/[0.08] border-neon-yellow/40 animate-pulse',
                      !isSelected && !isHighlighted && 'bg-white/[0.02] border-transparent hover:bg-white/[0.05] hover:border-white/10'
                    )}
                    onClick={() => handleSelectQuestion(q)}
                  >
                    <div className="flex items-center gap-2 p-2 pr-16">
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0',
                        isSelected ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-white/10 text-white/60',
                      )}>
                        {index + 1}
                      </div>
                      
                      <div className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0',
                        q.type === 'mcq' && 'bg-neon-cyan/10 text-neon-cyan',
                        q.type === 'truefalse' && 'bg-neon-green/10 text-neon-green',
                        q.type === 'fillblank' && 'bg-neon-pink/10 text-neon-pink',
                        q.type === 'drag_drop_boxes' && 'bg-neon-purple/10 text-neon-purple'
                      )}>
                        {TYPE_LABELS[q.type] || 'TN'}
                      </div>

                      <span className={cn(
                        'flex-1 text-xs truncate',
                        preview ? 'text-white/80' : 'text-white/30 italic'
                      )}>
                        {preview || 'Câu hỏi mới'}
                      </span>

                      <div className={cn(
                        'w-1.5 h-1.5 rounded-full flex-shrink-0',
                        statusColor === 'green' && 'bg-neon-green',
                        statusColor === 'yellow' && 'bg-neon-yellow'
                      )} />
                    </div>

                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex gap-0.5">
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={(e) => handleDuplicate(q, e)}
                        className="p-1.5 rounded-md transition-all text-white/40 hover:text-neon-cyan hover:bg-neon-cyan/10"
                        title="Nhân bản"
                      >
                        <Copy size={13} />
                      </motion.button>
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={(e) => handleDelete(q, e)}
                        className="p-1.5 rounded-md transition-all text-white/40 hover:text-neon-red hover:bg-neon-red/10"
                        title="Xóa"
                      >
                        <Trash2 size={13} />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {quiz.questions.length === 0 && (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                <ListChecks size={20} className="text-white/20" />
              </div>
              <p className="text-white/50 text-sm font-medium">Chưa có câu hỏi</p>
              <p className="text-white/30 text-xs mt-1">Nhấn nút bên trên để thêm</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { addQuestion } = useQuizStore();
  const [showImportModal, setShowImportModal] = useState(false);
  const location = useLocation();

  if (location.pathname === '/') return null;

  const questionTypes = [
    { type: 'mcq' as const, label: 'Trắc nghiệm', icon: ListChecks, color: 'from-neon-cyan to-cyan-600' },
    { type: 'truefalse' as const, label: 'Đúng/Sai', icon: CheckCircle, color: 'from-neon-green to-emerald-600' },
    { type: 'fillblank' as const, label: 'Điền chỗ trống', icon: Type, color: 'from-pink-500 to-rose-600' },
    { type: 'drag_drop_boxes' as const, label: 'Kéo thả', icon: LayoutGrid, color: 'from-neon-purple to-violet-600' },
  ];

  const handleAddQuestion = (type: string) => {
    const newQ = addQuestion(type as any);
    setIsOpen(false);
    setTimeout(() => scrollToQuestion(newQ.id), 300);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed right-4 z-30 w-14 h-14 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple shadow-lg shadow-neon-cyan/30 flex items-center justify-center text-deep-space active:scale-95 transition-transform"
        style={{ bottom: 'calc(64px + 20px + env(safe-area-inset-bottom))' }}
        aria-label="Thêm câu hỏi mới"
      >
        <Plus size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => { if (info.offset.y > 100) setIsOpen(false); }}
              className="lg:hidden fixed left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
              style={{
                bottom: MOBILE_DRAWER_BOTTOM,
                background: 'rgba(15, 15, 26, 0.98)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
                maxHeight: '70vh',
              }}
            >
              <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/30" />
              </div>

              <div className="px-4 pb-4 flex-shrink-0">
                <h2 className="text-lg font-semibold text-white text-center">Thêm câu hỏi mới</h2>
              </div>

              <div className="px-4 pb-6 space-y-3 flex-shrink-0 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 100px)' }}>
                {questionTypes.map(({ type, label, icon: Icon, color }) => (
                  <button
                    key={type}
                    onClick={() => handleAddQuestion(type)}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all duration-150 active:scale-[0.98] bg-white/5 hover:bg-white/10 border border-white/10 min-h-[60px]"
                  >
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br', color)}>
                      <Icon size={22} className="text-white" />
                    </div>
                    <span className="text-base font-medium text-white flex-1">{label}</span>
                    <ChevronRight size={20} className="text-white/40" />
                  </button>
                ))}

                {/* Import from File Button */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowImportModal(true);
                  }}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all duration-150 active:scale-[0.98] bg-neon-cyan/10 hover:bg-neon-cyan/15 border border-neon-cyan/20 min-h-[60px]"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-neon-cyan/20">
                    <Upload size={22} className="text-neon-cyan" />
                  </div>
                  <span className="text-base font-medium text-neon-cyan flex-1">Nhập file</span>
                  <ChevronRight size={20} className="text-neon-cyan/40" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} />
    </>
  );
}
