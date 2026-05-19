import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ListChecks, CheckCircle, LayoutGrid, Type } from 'lucide-react';
import { useQuizStore } from '@/stores/quizStore';
import { useEditorStore } from '@/stores/editorStore';
import { cn } from '@/utils/helpers';
import type { QuestionType } from '@/types';

interface FilterOption {
  type: QuestionType | 'all';
  label: string;
  icon: typeof ListChecks;
  color: string;
  activeColor: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { type: 'all', label: 'Tất cả', icon: ListChecks, color: 'text-white/50', activeColor: 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/30' },
  { type: 'mcq', label: 'Trắc nghiệm', icon: ListChecks, color: 'text-neon-cyan', activeColor: 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/30' },
  { type: 'truefalse', label: 'Đúng/Sai', icon: CheckCircle, color: 'text-neon-green', activeColor: 'text-neon-green bg-neon-green/10 border-neon-green/30' },
  { type: 'drag_drop_boxes', label: 'Kéo thả', icon: LayoutGrid, color: 'text-neon-purple', activeColor: 'text-neon-purple bg-neon-purple/10 border-neon-purple/30' },
  { type: 'fillblank', label: 'Điền chỗ trống', icon: Type, color: 'text-neon-pink', activeColor: 'text-neon-pink bg-neon-pink/10 border-neon-pink/30' },
];

export function FilterBar() {
  const { quiz } = useQuizStore();
  const { filterType, setFilterType } = useEditorStore();

  // Calculate counts for each filter type
  const counts = useMemo(() => {
    const questions = quiz.questions ?? [];
    const result: Record<string, number> = { all: questions.length };
    
    for (const option of FILTER_OPTIONS) {
      if (option.type !== 'all') {
        result[option.type] = questions.filter(q => q?.type === option.type).length;
      }
    }
    
    return result;
  }, [quiz.questions]);

  const handleFilterChange = (type: QuestionType | 'all') => {
    setFilterType(type);
    
    // Scroll to top of editor
    const editorContent = document.querySelector('.editor-content');
    if (editorContent) {
      (editorContent as HTMLElement).scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="px-4 py-2 border-b border-white/10 bg-white/[0.02]">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {FILTER_OPTIONS.map((option) => {
          const isActive = filterType === option.type;
          const count = counts[option.type] || 0;
          
          return (
            <motion.button
              key={option.type}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleFilterChange(option.type)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap border',
                isActive
                  ? option.activeColor
                  : 'bg-white/[0.03] border-transparent text-white/50 hover:text-white hover:bg-white/[0.06]'
              )}
            >
              <option.icon size={13} className={isActive ? option.color : 'text-white/40'} />
              <span>{option.label}</span>
              {count > 0 && (
                <span className={cn(
                  'ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                  isActive
                    ? 'bg-white/20'
                    : 'bg-white/10'
                )}>
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// Hook to get filtered questions based on current filter
export function useFilteredQuestions() {
  const { quiz } = useQuizStore();
  const { filterType, searchQuery } = useEditorStore();

  return useMemo(() => {
    const questions = quiz.questions ?? [];
    return questions.filter((q) => {
      if (!q) return false;
      
      // Filter by type
      if (filterType !== 'all' && q.type !== filterType) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = q.title?.toLowerCase().includes(query);
        const matchesContent = q.type === 'fillblank' 
          ? (q as { content?: string }).content?.toLowerCase().includes(query)
          : false;
        const matchesOptions = q.type === 'mcq'
          ? (q as { options?: { text: string }[] }).options?.some(opt => opt?.text?.toLowerCase().includes(query))
          : false;
        
        if (!matchesTitle && !matchesContent && !matchesOptions) {
          return false;
        }
      }
      
      return true;
    });
  }, [quiz.questions, filterType, searchQuery]);
}
