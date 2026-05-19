import { useLocation, useNavigate } from 'react-router-dom';
import { Play, CheckCircle, AlertCircle } from 'lucide-react';
import { useQuizStore } from '@/stores/quizStore';
import { useTestStore } from '@/stores/testStore';
import { Button } from '@/components/ui';
import { cn } from '@/utils/helpers';
import type { MCQQuestion, TrueFalseQuestion, FillBlankQuestion } from '@/types';

export function StatusBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { quiz } = useQuizStore();
  const resetTest = useTestStore((state) => state.resetTest);

  if (location.pathname === '/') return null;

  const questions = quiz.questions ?? [];
  
  const incompleteCount = questions.filter((q) => {
    if (!q) return false;
    
    if (q.type === 'mcq') {
      const mcq = q as MCQQuestion;
      const opts = mcq.options ?? [];
      return opts.filter(o => o?.correct).length === 0;
    }
    if (q.type === 'truefalse') {
      const tf = q as TrueFalseQuestion;
      const stmts = tf.statements ?? [];
      return stmts.length === 0 || stmts.some(s => !s?.text?.trim());
    }
    if (q.type === 'fillblank') {
      const fb = q as FillBlankQuestion;
      const blanks = fb.blanks ?? [];
      const actualText = (fb.content ?? '').replace(/\[\w+\]/g, '').trim();
      return actualText.length === 0 || blanks.length === 0 || blanks.some(b => !b?.text?.trim());
    }
    return false;
  }).length;

  const handleStartTest = () => {
    if (questions.length === 0) {
      alert('Vui lòng thêm ít nhất 1 câu hỏi trước khi làm bài.');
      return;
    }
    // Initialize a NEW active test session (forces status = 'idle')
    resetTest();
    navigate(`/test/${quiz.id}`);
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-[1000] border-t border-white/10 bg-deep-space/95 backdrop-blur-xl">
      <div className="h-14 px-4 flex items-center justify-between">
        {/* Left: Quiz stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-sm">Câu hỏi:</span>
            <span className="text-white font-semibold">{questions.length}</span>
          </div>
          
          <div className="w-px h-4 bg-white/10" />
          
          <div className="flex items-center gap-2">
            {incompleteCount > 0 ? (
              <>
                <AlertCircle size={14} className="text-neon-yellow" />
                <span className="text-neon-yellow text-sm">{incompleteCount} chưa hoàn thành</span>
              </>
            ) : questions.length > 0 ? (
              <>
                <CheckCircle size={14} className="text-neon-green" />
                <span className="text-neon-green text-sm">Tất cả đã hoàn thành</span>
              </>
            ) : null}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleStartTest}
            disabled={questions.length === 0}
            leftIcon={<Play size={14} />}
            className={cn(
              "bg-neon-cyan hover:bg-neon-cyan/90 text-black font-semibold",
              questions.length === 0 && "opacity-50"
            )}
          >
            Làm bài
          </Button>
        </div>
      </div>
    </footer>
  );
}
