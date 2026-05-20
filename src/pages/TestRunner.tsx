import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, AlertCircle, X, CheckCircle, XCircle, Check, Sparkles } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { useQuizStore } from '@/stores/quizStore';
import { useTestStore } from '@/stores/testStore';
import { cn } from '@/utils/helpers';
import { TestTopbar, TestLeftNav, TestBottomBar, TestBottomBarMobile, TestMobileNav } from '@/components/test';
import type { Question, Answer, MCQQuestion, TrueFalseQuestion, DragDropBoxesQuestion, FillBlankQuestion, FillBlank, AnswerOrder } from '@/types';
import { getCorrectAnswerCount, hasMultipleCorrectAnswers } from '@/types';

// Layout constants
export function TestRunnerPage() {
  const navigate = useNavigate();
  const { quiz } = useQuizStore();
  const {
    status,
    answers,
    flagged,
    currentIndex,
    startTest,
    setAnswer,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    submitTest,
    toggleFlag,
    getAnsweredCount,
    getRemainingTime,
    getFlaggedCount,
    quiz: testQuiz,
    getShuffledQuestions,
    getAnswerOrder,
    reviewMode,
    toggleReviewMode,
  } = useTestStore();

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(-1);
  const hasAutoSubmitted = useRef(false);

  // Reset auto-submit flag when test starts
  useEffect(() => {
    if (status === 'in-progress') {
      hasAutoSubmitted.current = false;
    }
  }, [status]);

  // Start test on mount if quiz is available
  useEffect(() => {
    if (quiz && quiz.questions && quiz.questions.length > 0) {
      if (status === 'idle') {
        console.log('[TestRunner] Starting test with settings:', quiz.settings);
        startTest(quiz);
      }
    }
  }, [quiz, status, startTest]);

  // Timer - only active when enabled in quiz settings (timestamp-based)
  useEffect(() => {
    if (status !== 'in-progress' || !testQuiz?.settings.enableTimer) {
      setTimeRemaining(-1); // -1 means disabled
      return;
    }

    // Update timer immediately
    const updateTimer = () => {
      const remaining = getRemainingTime();
      setTimeRemaining(remaining);

      // Auto-submit when timer runs out (only once, no confirmation)
      if (remaining <= 0 && !hasAutoSubmitted.current) {
        hasAutoSubmitted.current = true;
        console.log('[TestRunner] Timer expired, auto-submitting...');
        submitTest(true); // Pass true for timeout submission
      }
    };

    // Initial update
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [status, getRemainingTime, testQuiz, submitTest]);

  // Navigate to results when completed
  useEffect(() => {
    if (status === 'completed') {
      navigate('/results');
    }
  }, [status, navigate]);

  const handleSubmit = () => {
    submitTest();
    setShowSubmitModal(false);
  };

  const handleExit = () => {
    setShowExitConfirm(true);
  };

  if (!testQuiz) {
    return (
      <div className="h-screen flex items-center justify-center bg-deep-space">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Get shuffled questions
  const shuffledQuestions = getShuffledQuestions();
  const totalQuestions = shuffledQuestions.length;
  const currentQuestion = shuffledQuestions[currentIndex];
  const answeredCount = getAnsweredCount();
  const answerOrder = currentQuestion ? getAnswerOrder(currentQuestion.id) : undefined;

  // Review mode is ONLY triggered by user clicking the button
  // instantFeedback setting controls whether the button is VISIBLE, not auto-show
  const showResult = reviewMode;

  return (
    <div className="h-full flex flex-col bg-deep-space">
      {/* Fixed Topbar */}
      <div className="flex-shrink-0">
        <TestTopbar
          title={testQuiz.title}
          currentQuestion={currentIndex + 1}
          totalQuestions={totalQuestions}
          timeRemaining={timeRemaining}
          onClose={handleExit}
        />
      </div>

      {/* Fixed Left Navigation - Desktop Only */}
      <div className="hidden lg:block">
        <TestLeftNav
          questions={shuffledQuestions}
          currentIndex={currentIndex}
          answered={answers}
          flagged={flagged}
          onNavigate={goToQuestion}
        />
      </div>

      {/* Main Content Area - Responsive padding */}
      <div className="flex-1 lg:pl-[260px] lg:pt-4 flex flex-col min-h-0">
        {/* Scrollable Question Content - Mobile */}
        <main 
          className="flex-1 min-h-0 overflow-y-auto pb-28 md:pb-32 lg:pb-8"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          {/* Desktop: Wider card, better padding */}
          <div className="px-3 py-4 md:px-4 md:py-5 lg:px-8 xl:px-12 h-full">
            <div className="lg:max-w-[1100px] lg:mx-auto h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  {/* Question Card - Premium glass styling, auto height */}
                  <div className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/10 p-5 lg:p-7 shadow-2xl shadow-black/20">
                    {/* Question Header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                          {currentIndex + 1}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs text-white/30 uppercase tracking-wider">Câu hỏi</span>
                          <span className="text-sm text-white/50">{totalQuestions} câu</span>
                        </div>
                      </div>
                      
                      {/* Flag button */}
                      <button
                        onClick={() => toggleFlag(currentQuestion.id)}
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                          flagged.has(currentQuestion.id)
                            ? 'bg-neon-yellow/20 text-neon-yellow shadow-lg shadow-neon-yellow/20'
                            : 'text-white/40 hover:text-neon-yellow hover:bg-white/10'
                        )}
                      >
                        <Flag size={18} className={flagged.has(currentQuestion.id) ? 'fill-current' : ''} />
                      </button>
                    </div>

                    {/* Question Content */}
                    <div className="mb-6">
                      {currentQuestion.type === 'fillblank' ? (
                        !currentQuestion.title?.trim() ? (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-neon-purple/80 bg-neon-purple/10 px-3 py-1.5 rounded-lg">
                              ✨ Điền vào chỗ trống
                            </span>
                          </div>
                        ) : (
                          <h2 className="text-lg md:text-xl lg:text-[30px] text-white lg:leading-[1.55] font-bold tracking-tight">
                            {currentQuestion.title}
                          </h2>
                        )
                      ) : (
                        <h2 className="text-lg md:text-xl lg:text-[30px] text-white lg:leading-[1.55] font-bold tracking-tight">
                          {currentQuestion.title || 'Câu hỏi không có nội dung'}
                        </h2>
                      )}
                      {currentQuestion.media?.type === 'image' && (
                        <img
                          src={currentQuestion.media.url}
                          alt={currentQuestion.media.alt || ''}
                          className="mt-4 max-w-full rounded-xl"
                        />
                      )}
                    </div>

                    {/* Answer Options - Larger for desktop */}
                    <QuestionAnswer
                      question={currentQuestion}
                      answer={answers[currentQuestion.id]}
                      onAnswer={(answer) => setAnswer(currentQuestion.id, answer)}
                      showResult={showResult}
                      answerOrder={answerOrder}
                    />

                    {/* Explanation (if shown in review mode) */}
                    {showResult && currentQuestion.explanation && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mt-6 p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20 backdrop-blur-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 flex items-center justify-center flex-shrink-0">
                            <Sparkles size={14} className="text-neon-cyan" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-neon-cyan uppercase tracking-wide mb-1">Giải thích</p>
                            <p className="text-sm text-white/80 leading-relaxed">{currentQuestion.explanation}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>

      {/* Fixed Bottom Action Bar - Desktop Only */}
      <div className="hidden lg:block fixed bottom-0 left-0 right-0">
        <TestBottomBar
          currentIndex={currentIndex}
          totalQuestions={totalQuestions}
          isLastQuestion={currentIndex === totalQuestions - 1}
          isReviewMode={reviewMode}
          instantFeedback={testQuiz?.settings.instantFeedback ?? false}
          onPrev={prevQuestion}
          onNext={nextQuestion}
          onSubmit={() => setShowSubmitModal(true)}
          onToggleReview={toggleReviewMode}
        />
      </div>

      {/* Mobile Bottom Action Bar */}
      <TestBottomBarMobile
        currentIndex={currentIndex}
        totalQuestions={totalQuestions}
        isLastQuestion={currentIndex === totalQuestions - 1}
        isReviewMode={reviewMode}
        instantFeedback={testQuiz?.settings.instantFeedback ?? false}
        onPrev={prevQuestion}
        onNext={nextQuestion}
        onSubmit={() => setShowSubmitModal(true)}
        onToggleReview={toggleReviewMode}
      />

      {/* Mobile Navigation Button */}
      <button
        onClick={() => setShowMobileNav(true)}
        className="lg:hidden fixed bottom-24 left-4 z-20 px-4 py-2.5 rounded-full glass text-sm font-medium shadow-lg"
      >
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
          Điều hướng
        </span>
      </button>

      {/* Mobile Navigation Bottom Sheet */}
      <TestMobileNav
        questions={shuffledQuestions}
        currentIndex={currentIndex}
        answered={answers}
        flagged={flagged}
        isOpen={showMobileNav}
        onClose={() => setShowMobileNav(false)}
        onNavigate={goToQuestion}
      />

      {/* Submit Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Nộp bài?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-white/70">
            Bạn đã trả lời <span className="text-neon-cyan font-medium">{answeredCount}</span> / {totalQuestions} câu.
          </p>
          {answeredCount < totalQuestions && (
            <p className="text-neon-yellow text-sm flex items-center gap-2">
              <AlertCircle size={14} />
              Còn {totalQuestions - answeredCount} câu chưa trả lời.
            </p>
          )}
          {getFlaggedCount() > 0 && (
            <p className="text-neon-purple text-sm flex items-center gap-2">
              <Flag size={14} />
              Có {getFlaggedCount()} câu đã đánh dấu.
            </p>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={() => setShowSubmitModal(false)} className="flex-1">
            Tiếp tục làm
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-neon-cyan to-neon-purple"
          >
            Nộp bài
          </Button>
        </div>
      </Modal>

      {/* Exit Confirmation Modal */}
      <Modal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        title="Thoát làm bài?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-white/70">
            Bạn đang làm bài. Tiến độ sẽ không được lưu.
          </p>
          <p className="text-sm text-white/50">
            Điểm số và câu trả lời sẽ bị mất nếu bạn thoát bây giờ.
          </p>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={() => setShowExitConfirm(false)} className="flex-1">
            Ở lại
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setShowExitConfirm(false);
              navigate('/editor');
            }}
            className="flex-1"
          >
            Thoát
          </Button>
        </div>
      </Modal>
    </div>
  );
}

interface QuestionAnswerProps {
  question: Question;
  answer: Answer | undefined;
  onAnswer: (answer: Answer) => void;
  showResult?: boolean;
  answerOrder?: AnswerOrder;
}

function QuestionAnswer({ question, answer, onAnswer, showResult = false, answerOrder }: QuestionAnswerProps) {
  if (question.type === 'mcq') {
    return <MCQAnswer question={question} answer={answer} onAnswer={onAnswer} showResult={showResult} answerOrder={answerOrder} />;
  }
  if (question.type === 'truefalse') {
    return <TrueFalseAnswer question={question} answer={answer} onAnswer={onAnswer} showResult={showResult} answerOrder={answerOrder} />;
  }
  if (question.type === 'drag_drop_boxes') {
    return <DragDropAnswer question={question} answer={answer} onAnswer={onAnswer} showResult={showResult} answerOrder={answerOrder} />;
  }
  if (question.type === 'fillblank') {
    return <FillBlankAnswer question={question} answer={answer} onAnswer={onAnswer} showResult={showResult} />;
  }
  return (
    <div className="p-4 rounded-xl bg-neon-red/5 border border-neon-red/20 text-center">
      <p className="text-neon-red font-medium text-sm">Loại câu hỏi chưa được hỗ trợ ({question.type})</p>
    </div>
  );
}

// MCQ Answer Component - Premium Redesign
interface MCQAnswerProps {
  question: MCQQuestion;
  answer: Answer | undefined;
  onAnswer: (answer: Answer) => void;
  showResult: boolean;
  answerOrder?: AnswerOrder;
}

function MCQAnswer({ question, answer, onAnswer, showResult, answerOrder }: MCQAnswerProps) {
  const q = question;
  const isMultiAnswer = hasMultipleCorrectAnswers(q);
  const correctCount = getCorrectAnswerCount(q);
  
  // Get selected answers
  const selectedAnswers: string[] = Array.isArray(answer)
    ? answer.filter((id): id is string => typeof id === 'string')
    : answer && typeof answer === 'string'
      ? [answer]
      : [];
  const selectedSet = new Set(selectedAnswers);

  // Apply shuffled order if available
  const shuffledOptionIds = answerOrder?.options;
  const displayOptions = shuffledOptionIds 
    ? shuffledOptionIds.map(id => q.options.find(opt => opt.id === id)).filter((opt): opt is NonNullable<typeof opt> => opt !== undefined)
    : q.options;

  return (
    <div className="space-y-4">
      {/* Helper hint - compact */}
      <div className="flex items-center gap-2">
        <span className={cn(
          'w-2 h-2 rounded-full',
          isMultiAnswer ? 'bg-neon-purple' : 'bg-neon-cyan'
        )} />
        <span className={cn(
          'text-xs font-medium',
          isMultiAnswer ? 'text-neon-purple/80' : 'text-neon-cyan/80'
        )}>
          {isMultiAnswer ? `Chọn ${correctCount} đáp án` : 'Chọn 1 đáp án'}
        </span>
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        {displayOptions.map((option, index) => {
          const label = String.fromCharCode(65 + index);
          const isSelected = selectedSet.has(option.id);
          const isCorrect = option.correct;
          
          // Review mode styling
          const isCorrectState = showResult && isCorrect;
          const isWrongState = showResult && isSelected && !isCorrect;
          
          const glowClass = showResult && isCorrect ? 'shadow-neon-green/20' : showResult && isWrongState ? 'shadow-neon-red/20' : '';
          const borderClass = showResult && isCorrect ? 'border-neon-green/50' : showResult && isWrongState ? 'border-neon-red/50' : showResult ? 'border-white/10' : '';
          const bgClass = showResult && isCorrect ? 'bg-neon-green/[0.08]' : showResult && isWrongState ? 'bg-neon-red/[0.08]' : showResult ? 'bg-white/[0.03]' : '';

          return (
            <motion.button
              key={option.id}
              whileHover={!showResult && !isSelected ? { scale: 1.01, y: -1 } : {}}
              whileTap={!showResult ? { scale: 0.99 } : {}}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              onClick={() => {
                if (showResult) return;
                if (selectedSet.has(option.id)) {
                  onAnswer(selectedAnswers.filter(id => id !== option.id));
                } else {
                  if (isMultiAnswer) {
                    onAnswer([...selectedAnswers, option.id]);
                  } else {
                    onAnswer(option.id);
                  }
                }
              }}
              disabled={showResult}
              className={cn(
                'w-full p-4 lg:p-[18px] rounded-2xl text-left transition-all flex items-center gap-4',
                'border backdrop-blur-sm min-h-[56px] lg:min-h-[72px]',
                // Default states
                !showResult && !isSelected && [
                  'border-white/10 bg-white/[0.04]',
                  'hover:border-neon-cyan/40 hover:bg-white/[0.08] hover:shadow-lg hover:shadow-neon-cyan/10',
                ],
                !showResult && isSelected && [
                  'border-neon-cyan/60 bg-neon-cyan/[0.12]',
                  'shadow-lg shadow-neon-cyan/15',
                ],
                showResult && [glowClass, borderClass, bgClass],
                'group'
              )}
            >
              {/* Radio/Checkbox indicator */}
              <div className="relative flex-shrink-0">
                {isMultiAnswer ? (
                  // Checkbox style for multi-answer
                  <div className={cn(
                    'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all',
                    !showResult && !isSelected && 'border-white/30 bg-transparent group-hover:border-neon-cyan/60',
                    !showResult && isSelected && 'border-neon-cyan bg-neon-cyan',
                    showResult && isCorrectState && 'border-neon-green bg-neon-green',
                    showResult && isWrongState && 'border-neon-red bg-neon-red',
                    showResult && !isCorrectState && !isWrongState && 'border-white/20 bg-transparent'
                  )}>
                    {isSelected && !showResult && (
                      <Check size={14} className="text-deep-space" strokeWidth={3} />
                    )}
                    {showResult && isCorrectState && (
                      <Check size={14} className="text-deep-space" strokeWidth={3} />
                    )}
                    {showResult && isWrongState && (
                      <X size={14} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                ) : (
                  // Radio style for single answer
                  <div className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                    !showResult && !isSelected && 'border-white/30 group-hover:border-neon-cyan/60',
                    !showResult && isSelected && 'border-neon-cyan',
                    showResult && isCorrectState && 'border-neon-green',
                    showResult && isWrongState && 'border-neon-red',
                    showResult && !isCorrectState && !isWrongState && 'border-white/20'
                  )}>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          'w-3 h-3 rounded-full',
                          !showResult && 'bg-neon-cyan',
                          showResult && isCorrectState && 'bg-neon-green',
                          showResult && isWrongState && 'bg-neon-red'
                        )}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Label badge - circular */}
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all',
                !showResult && !isSelected && 'bg-white/10 text-white/60 group-hover:bg-white/15',
                !showResult && isSelected && 'bg-neon-cyan/20 text-neon-cyan',
                showResult && isCorrectState && 'bg-neon-green/20 text-neon-green',
                showResult && isWrongState && 'bg-neon-red/20 text-neon-red',
                showResult && !isCorrectState && !isWrongState && 'bg-white/5 text-white/40'
              )}>
                {label}
              </div>

              {/* Answer text */}
              <span className={cn(
                'flex-1 text-sm font-medium transition-colors line-clamp-3 overflow-hidden',
                !showResult && isSelected && 'text-white',
                !showResult && !isSelected && 'text-white/80 group-hover:text-white',
                showResult && isCorrectState && 'text-neon-green',
                showResult && isWrongState && 'text-neon-red',
                showResult && !isCorrectState && !isWrongState && 'text-white/50'
              )}>
                {option.text}
              </span>

              {/* Result icons */}
              {showResult && isCorrectState && (
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <CheckCircle size={20} className="text-neon-green" />
                </motion.div>
              )}
              {showResult && isWrongState && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <XCircle size={20} className="text-neon-red" />
                </motion.div>
              )}
              {!showResult && isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <CheckCircle size={20} className="text-neon-cyan" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selection count hint - compact, at bottom */}
      <div className="flex justify-end pt-1">
        <span className={cn(
          'text-xs font-medium px-2 py-1 rounded-md',
          selectedAnswers.length === correctCount && selectedAnswers.length > 0
            ? 'bg-neon-green/10 text-neon-green'
            : 'bg-white/5 text-white/40'
        )}>
          Đã chọn: {selectedAnswers.length}/{correctCount}
        </span>
      </div>
    </div>
  );
}

// True/False Answer Component - Premium Redesign
interface TrueFalseAnswerProps {
  question: TrueFalseQuestion;
  answer: Answer | undefined;
  onAnswer: (answer: Answer) => void;
  showResult: boolean;
  answerOrder?: AnswerOrder;
}

function TrueFalseAnswer({ question, answer, onAnswer, showResult, answerOrder }: TrueFalseAnswerProps) {
  const tfQuestion = question;
  const statementAnswers = (answer as Record<string, boolean>) || {};

  // Apply shuffled order if available
  const shuffledStatementIds = answerOrder?.statements;
  const displayStatements = shuffledStatementIds
    ? shuffledStatementIds.map(id => tfQuestion.statements.find(s => s.id === id)).filter((s): s is NonNullable<typeof s> => s !== undefined)
    : tfQuestion.statements;

  return (
    <div className="space-y-4">
      {/* Helper hint */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-neon-green" />
        <span className="text-xs font-medium text-neon-green/80">
          Đúng/Sai
        </span>
      </div>

      {/* Statements */}
      <div className="space-y-2.5">
        {displayStatements.map((statement, index) => {
          const label = String.fromCharCode(65 + index);
          const userAnswer = statementAnswers[statement.id];
          const isCorrect = statement.answer;
          const hasAnswered = userAnswer !== undefined;
          
          // Review states - check if USER answered correctly
          const userAnsweredCorrectly = hasAnswered && userAnswer === isCorrect;
          const userAnsweredIncorrectly = hasAnswered && userAnswer !== isCorrect;
          
          const isCorrectState = showResult && userAnsweredCorrectly;
          const isWrongState = showResult && userAnsweredIncorrectly;
          const isMissedState = showResult && isCorrect && !hasAnswered;

          return (
            <motion.div 
              key={statement.id}
              whileHover={!showResult ? { scale: 1.01, y: -1 } : {}}
              transition={{ duration: 0.15 }}
              className={cn(
                'flex flex-wrap items-center gap-3 p-3.5 rounded-xl border backdrop-blur-sm transition-all',
                !showResult && 'bg-white/[0.04] border-white/10 hover:border-white/20',
                showResult && isCorrectState && 'bg-neon-green/[0.08] border-neon-green/50 shadow-neon-green/10',
                showResult && isWrongState && 'bg-neon-red/[0.08] border-neon-red/50 shadow-neon-red/10',
                showResult && isMissedState && 'bg-neon-yellow/[0.08] border-neon-yellow/50',
                showResult && !isCorrect && !hasAnswered && 'bg-white/[0.03] border-white/10'
              )}
            >
              {/* Statement number - circular */}
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0',
                !showResult && 'bg-white/10 text-white/60',
                showResult && isCorrectState && 'bg-neon-green text-deep-space',
                showResult && isWrongState && 'bg-neon-red text-white',
                showResult && isMissedState && 'bg-neon-yellow text-deep-space',
                showResult && !isCorrect && !hasAnswered && 'bg-white/5 text-white/40'
              )}>
                {label}
              </div>

              {/* Statement Text */}
              <span className={cn(
                'flex-1 text-sm font-medium leading-relaxed',
                !showResult && 'text-white/90',
                showResult && isCorrectState && 'text-neon-green',
                showResult && isWrongState && 'text-neon-red',
                showResult && isMissedState && 'text-neon-yellow',
                showResult && !isCorrect && !hasAnswered && 'text-white/50'
              )}>
                {statement.text || `Mệnh đề ${label}`}
              </span>

              {/* Review result */}
              {showResult && (
                <div className="flex items-center gap-2">
                  {/* User's answer badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5',
                      isCorrectState && 'bg-neon-green/20 text-neon-green',
                      isWrongState && 'bg-neon-red/20 text-neon-red',
                      isMissedState && 'bg-neon-yellow/20 text-neon-yellow'
                    )}
                  >
                    {isCorrectState && <Check size={12} />}
                    {isWrongState && <X size={12} />}
                    {isMissedState && <AlertCircle size={12} />}
                    {hasAnswered ? (userAnswer ? 'Đúng' : 'Sai') : 'Chưa trả lời'}
                  </motion.div>
                  
                  {/* Correct answer badge - only show when user was wrong */}
                  {isWrongState && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.15 }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neon-green/20 text-neon-green flex items-center gap-1.5"
                    >
                      <Check size={12} />
                      Đáp án đúng: {isCorrect ? 'Đúng' : 'Sai'}
                    </motion.div>
                  )}
                  
                  {/* Show correct answer when user didn't answer */}
                  {isMissedState && (
                    <span className="text-xs text-white/40">- Cần đánh dấu</span>
                  )}
                </div>
              )}

              {/* True/False Buttons */}
              {!showResult && (
                <div className="flex gap-1.5 flex-shrink-0 ml-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onAnswer({ ...statementAnswers, [statement.id]: true })}
                    className={cn(
                      'px-4 py-2 rounded-lg font-semibold transition-all text-sm',
                      userAnswer === true
                        ? 'bg-neon-green text-deep-space shadow-lg shadow-neon-green/30'
                        : 'bg-white/10 text-white/70 hover:bg-neon-green/20 hover:text-neon-green border border-transparent hover:border-neon-green/30'
                    )}
                  >
                    Đúng
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onAnswer({ ...statementAnswers, [statement.id]: false })}
                    className={cn(
                      'px-4 py-2 rounded-lg font-semibold transition-all text-sm',
                      userAnswer === false
                        ? 'bg-neon-red text-white shadow-lg shadow-neon-red/30'
                        : 'bg-white/10 text-white/70 hover:bg-neon-red/20 hover:text-neon-red border border-transparent hover:border-neon-red/30'
                    )}
                  >
                    Sai
                  </motion.button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Drag & Drop Answer Component with shuffled targets and pool
interface DragDropAnswerProps {
  question: DragDropBoxesQuestion;
  answer: Answer | undefined;
  onAnswer: (answer: Answer) => void;
  showResult: boolean;
  answerOrder?: AnswerOrder;
}

function DragDropAnswer({ question, answer, onAnswer, showResult, answerOrder }: DragDropAnswerProps) {
  const ddQuestion = question;
  const userAnswers = (answer as Record<string, string[]>) || {};

  // Apply shuffled order if available
  const shuffledTargetIds = answerOrder?.targets;
  const shuffledPool = answerOrder?.answerPool;
  
  // Build answer pool
  const allAnswerItems = shuffledPool || [
    ...ddQuestion.targets.flatMap((t) => t.correctAnswers),
    ...ddQuestion.distractors,
  ].filter((a) => a.trim());

  // Get used answers (in any target box)
  const usedAnswers = Object.values(userAnswers).flat();

  // Get display targets
  const displayTargets = shuffledTargetIds
    ? shuffledTargetIds.map(id => ddQuestion.targets.find(t => t.id === id)).filter((t): t is NonNullable<typeof t> => t !== undefined)
    : ddQuestion.targets;

  return (
    <div className="space-y-4">
      {/* Answer Pool */}
      <div className="space-y-2">
        <p className="text-xs text-white/50">Kéo đáp án vào các ô bên dưới</p>
        <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-white/5 border border-white/10">
          {allAnswerItems.map((item, index) => {
            const isUsed = usedAnswers.includes(item);
            // Check if this is a distractor
            const isDistractor = ddQuestion.distractors.includes(item);
            
            // In review mode, check if item is in correct target
            let isCorrectlyPlaced = false;
            let isIncorrectlyPlaced = false;
            if (showResult) {
              for (const target of ddQuestion.targets) {
                if (target.correctAnswers.includes(item)) {
                  // This is a correct answer, check if it's in this target
                  if (userAnswers[target.id]?.includes(item)) {
                    isCorrectlyPlaced = true;
                  }
                } else if (userAnswers[target.id]?.includes(item)) {
                  isIncorrectlyPlaced = true;
                }
              }
            }

            return (
              <div
                key={`${item}-${index}`}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all select-none',
                  !showResult && !isUsed && 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/30 cursor-grab',
                  !showResult && isUsed && 'bg-white/5 text-white/30 border border-white/10',
                  showResult && isCorrectlyPlaced && 'bg-neon-green/20 text-neon-green border border-neon-green/30',
                  showResult && isIncorrectlyPlaced && 'bg-neon-red/20 text-neon-red border border-neon-red/30',
                  showResult && !isCorrectlyPlaced && !isIncorrectlyPlaced && !isUsed && 'bg-white/5 text-white/30 border border-white/10',
                  showResult && !isCorrectlyPlaced && !isIncorrectlyPlaced && isUsed && 'bg-white/5 text-white/30 border border-white/10',
                  showResult && isDistractor && !isUsed && 'bg-neon-yellow/20 text-neon-yellow border border-neon-yellow/30'
                )}
                draggable={!isUsed && !showResult}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', item);
                }}
                style={{ opacity: isUsed && !showResult ? 0.4 : 1 }}
              >
                {item}
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Boxes */}
      <div className="grid gap-3 grid-cols-2">
        {displayTargets.map((target, targetIndex) => {
          const label = String.fromCharCode(65 + targetIndex);
          const filledAnswers = userAnswers[target.id] || [];
          const correctAnswers = target.correctAnswers;

          return (
            <div
              key={target.id}
              className={cn(
                'p-4 rounded-2xl border-2 transition-all min-h-[100px] lg:min-h-[120px]',
                !showResult && 'border-dashed border-neon-purple/30 bg-white/5',
                showResult && 'border-solid',
                filledAnswers.length > 0 && !showResult && 'border-neon-purple/60'
              )}
              onDragOver={(e) => {
                if (!showResult) e.preventDefault();
              }}
              onDrop={(e) => {
                if (showResult) return;
                e.preventDefault();
                const droppedItem = e.dataTransfer.getData('text/plain');
                if (droppedItem && !filledAnswers.includes(droppedItem)) {
                  onAnswer({
                    ...userAnswers,
                    [target.id]: [...filledAnswers, droppedItem],
                  });
                }
              }}
            >
              {/* Target Label */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-neon-purple/20 text-neon-purple flex items-center justify-center font-bold text-xs">
                  {label}
                </div>
                <span className="text-xs text-white/70 truncate">{target.title || `Ô ${label}`}</span>
              </div>

              {/* Filled Answers */}
              <div className="space-y-1 min-h-[40px]">
                {filledAnswers.map((filledItem, fillIndex) => {
                  const isCorrectAnswer = correctAnswers.includes(filledItem);
                  
                  return (
                    <div
                      key={`${filledItem}-${fillIndex}`}
                      className={cn(
                        'flex items-center justify-between gap-1 p-1.5 rounded-lg',
                        !showResult && 'bg-neon-purple/20 border border-neon-purple/30',
                        showResult && isCorrectAnswer && 'bg-neon-green/20 border border-neon-green/30',
                        showResult && !isCorrectAnswer && 'bg-neon-red/20 border border-neon-red/30'
                      )}
                    >
                      <span className="text-xs text-white/80 truncate">{filledItem}</span>
                      {showResult && (
                        isCorrectAnswer 
                          ? <CheckCircle size={12} className="text-neon-green flex-shrink-0" />
                          : <X size={12} className="text-neon-red flex-shrink-0" />
                      )}
                      {!showResult && (
                        <button
                          onClick={() => {
                            const newFilled = filledAnswers.filter((_, i) => i !== fillIndex);
                            onAnswer({
                              ...userAnswers,
                              [target.id]: newFilled,
                            });
                          }}
                          className="p-0.5 rounded text-white/40 hover:text-neon-red hover:bg-white/10 transition-colors flex-shrink-0"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}

                {filledAnswers.length === 0 && (
                  <div className="flex items-center justify-center h-8 rounded-lg border border-dashed border-white/10 text-white/30 text-xs">
                    Kéo vào đây
                  </div>
                )}
              </div>

              {/* Correct Answers Preview (only in review mode) */}
              {showResult && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <p className="text-[10px] text-white/40 mb-1">Đáp án đúng:</p>
                  <div className="flex flex-wrap gap-1">
                    {correctAnswers.map((ca, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-neon-green/10 text-neon-green text-[10px]">
                        {ca}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Fill Blank Answer Component
interface FillBlankAnswerProps {
  question: FillBlankQuestion;
  answer: Answer | undefined;
  onAnswer?: (answer: Answer) => void;
  showResult: boolean;
}

function FillBlankAnswer({ question, answer, onAnswer: _onAnswer, showResult }: FillBlankAnswerProps) {
  const userAnswer = (answer as Record<string, string[]>) || {};

  // Calculate hint info
  const getHintInfo = (text: string): { words: number; chars: number } => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(w => w.length > 0).length : 0;
    const chars = trimmed.length;
    return { words, chars };
  };

  // Parse content to render blanks inline
  const renderContentWithBlanks = () => {
    const parts: { type: 'text' | 'blank'; value: string; blank?: FillBlank; index: number }[] = [];
    const regex = /\[([^\]]+)\]/g;
    let lastIndex = 0;
    let match;
    let partIdx = 0;

    while ((match = regex.exec(question.content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', value: question.content.slice(lastIndex, match.index), index: partIdx++ });
      }

      const blankId = match[1];
      const blank = question.blanks.find(b => b.id === blankId);
      if (blank) {
        parts.push({ type: 'blank', value: match[0], blank, index: partIdx++ });
      } else {
        parts.push({ type: 'text', value: match[0], index: partIdx++ });
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < question.content.length) {
      parts.push({ type: 'text', value: question.content.slice(lastIndex), index: partIdx++ });
    }

    return parts.map((part) => {
      if (part.type === 'blank' && part.blank) {
        const blank = part.blank;
        const userAnswerValue = userAnswer[blank.id]?.[0] || '';
        const correctAnswer = blank.text.trim().toLowerCase();
        const userAnswerTrimmed = userAnswerValue.trim().toLowerCase();
        const hint = getHintInfo(blank.text);

        const isCorrect = showResult && (
          userAnswerTrimmed === correctAnswer ||
          blank.alternatives.some(alt => alt.toLowerCase() === userAnswerTrimmed)
        );
        const isWrong = showResult && userAnswerTrimmed && !isCorrect;
        const isMissed = showResult && !userAnswerTrimmed && correctAnswer;

        return (
          <span key={blank.id} className="inline-flex flex-col items-start mx-0.5 mb-1">
            <span className="inline-flex items-center">
              <input
                type="text"
                value={showResult ? blank.text : userAnswerValue}
                disabled={true}
                placeholder={showResult ? '' : '...'}
                style={{ minWidth: '80px' }}
                className={cn(
                  'px-2 py-1 rounded-lg text-sm font-medium transition-all',
                  'border-2 outline-none',
                  !showResult && 'bg-white/5 border-white/20 text-white placeholder:text-white/30 cursor-text',
                  showResult && isCorrect && 'bg-neon-green/20 border-neon-green/50 text-neon-green',
                  showResult && isWrong && 'bg-neon-red/20 border-neon-red/50 text-neon-red',
                  showResult && isMissed && 'bg-neon-yellow/20 border-neon-yellow/50 text-neon-yellow'
                )}
              />
              {showResult && isCorrect && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-1 text-neon-green"
                >
                  <Check size={16} />
                </motion.span>
              )}
              {showResult && isWrong && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-1 text-neon-red"
                >
                  <X size={16} />
                </motion.span>
              )}
              {showResult && isMissed && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-1 text-neon-yellow"
                >
                  <AlertCircle size={16} />
                </motion.span>
              )}
            </span>
            {/* Hint below input (only when not in review mode) */}
            {!showResult && hint.chars > 0 && (
              <span className="text-[10px] text-white/40 mt-0.5 ml-0.5">
                {hint.words} từ • {hint.chars} ký tự
              </span>
            )}
            {/* User's answer vs correct answer in review */}
            {showResult && isWrong && (
              <span className="text-[10px] text-white/50 mt-0.5">
                Bạn: {userAnswerValue}
              </span>
            )}
          </span>
        );
      }
      return <span key={part.index}>{part.value}</span>;
    });
  };

  return (
    <div className="space-y-4">
      {/* Question Instruction */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neon-cyan/5 border border-neon-cyan/20">
        <Sparkles size={14} className="text-neon-cyan flex-shrink-0" />
        <p className="text-sm text-neon-cyan font-medium">Điền vào chỗ trống</p>
      </div>

      {/* Question Content */}
      <div className="text-base text-white leading-relaxed whitespace-pre-wrap">
        {renderContentWithBlanks()}
      </div>

      {/* Correct Answers Summary */}
      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-neon-cyan" />
            <p className="text-xs font-medium text-neon-cyan">Đáp án đúng</p>
          </div>
          <div className="space-y-1">
            {question.blanks.map((blank, index) => (
              <div key={blank.id} className="flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-neon-cyan/10 text-neon-cyan text-xs flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-white/70">{blank.text}</span>
                {blank.alternatives.length > 0 && (
                  <span className="text-white/40 text-xs">
                    (hoặc: {blank.alternatives.join(', ')})
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
