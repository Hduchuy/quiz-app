import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Trophy, RotateCcw, Home, Edit3 } from 'lucide-react';
import { Button, GlassCard, ProgressBar } from '@/components/ui';
import { useTestStore } from '@/stores/testStore';
import { useQuizStore } from '@/stores/quizStore';
import { cn } from '@/utils/helpers';
import type { MCQQuestion, TrueFalseQuestion, DragDropBoxesQuestion } from '@/types';
import { getCorrectAnswerIds } from '@/types';

export function ResultsPage() {
  const navigate = useNavigate();
  const { quiz: testQuiz, answers, getAnsweredCount, getElapsedTime, resetTest, submittedDueToTimeout } = useTestStore();
  const { quiz } = useQuizStore();

  if (!testQuiz) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-white/50 mb-6">Không có kết quả để hiển thị</p>
        <Button variant="primary" onClick={() => navigate('/')}>
          Về trang chủ
        </Button>
      </div>
    );
  }

  const answeredCount = getAnsweredCount();
  const elapsedTime = getElapsedTime();

  // Calculate score - count by QUESTION (1 question = 1 score unit)
  // A question is correct ONLY IF all required parts are correct
  const totalQuestions = testQuiz.questions.length;
  let correctQuestions = 0;

  testQuiz.questions.forEach((q) => {
    if (q.type === 'mcq') {
      const mcqQuestion = q as MCQQuestion;
      const correctIds = getCorrectAnswerIds(mcqQuestion);
      const userAnswer = answers[q.id];
      const userSelectedIds = Array.isArray(userAnswer) ? userAnswer.filter((id): id is string => typeof id === 'string') : userAnswer && typeof userAnswer === 'string' ? [userAnswer] : [];
      const userSelectedSet = new Set(userSelectedIds);
      const correctSet = new Set(correctIds);

      // All correct options selected AND no wrong options selected
      const allCorrectSelected = correctIds.every(id => userSelectedSet.has(id));
      const noWrongSelected = userSelectedIds.every(id => correctSet.has(id));

      if (allCorrectSelected && noWrongSelected) {
        correctQuestions++;
      }
    } else if (q.type === 'truefalse') {
      const tfQuestion = q as TrueFalseQuestion;
      const userAnswers = (answers[q.id] as Record<string, boolean>) || {};

      // ALL statements must be correct for the question to be correct
      const allStatementsCorrect = tfQuestion.statements.every(
        (statement) => userAnswers[statement.id] === statement.answer
      );
      if (allStatementsCorrect) {
        correctQuestions++;
      }
    } else if (q.type === 'drag_drop_boxes') {
      const ddQuestion = q as DragDropBoxesQuestion;
      const userFilled = (answers[q.id] as Record<string, string[]>) || {};

      // ALL targets must have exactly their correct answers (no extras, no missing)
      const allTargetsCorrect = ddQuestion.targets.every((target) => {
        const filledInTarget = userFilled[target.id] || [];
        const correctSet = new Set(target.correctAnswers);
        const filledSet = new Set(filledInTarget);
        return (
          target.correctAnswers.every(ans => filledSet.has(ans)) &&
          filledInTarget.every(ans => correctSet.has(ans))
        );
      });
      if (allTargetsCorrect) {
        correctQuestions++;
      }
    }
  });

  const wrongQuestions = totalQuestions - correctQuestions;
  const score = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0;
  const isPass = score >= 50;

  const getScoreColor = () => {
    if (score >= 80) return 'text-neon-green';
    if (score >= 60) return 'text-neon-yellow';
    return 'text-neon-red';
  };

  const getScoreMessage = () => {
    if (score >= 90) return 'Xuất sắc! Bạn làm rất tốt!';
    if (score >= 80) return 'Tuyệt vời! Kết quả rất tốt!';
    if (score >= 70) return 'Khá tốt! Cố gắng hơn nữa!';
    if (score >= 60) return 'Trung bình khá. Cần cải thiện thêm.';
    if (score >= 50) return 'Trung bình. Hãy ôn tập thêm.';
    return 'Chưa đạt. Đừng nản chí, hãy thử lại!';
  };

  return (
    <div className="min-h-screen p-4 pb-20 lg:pb-4 allow-scroll">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          {/* Trophy */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 mb-6"
          >
            <Trophy className={cn('w-12 h-12', getScoreColor())} />
          </motion.div>

          {/* Score */}
          <h1 className={cn('text-6xl font-bold mb-2', getScoreColor())}>
            {score}%
          </h1>
          <p className="text-xl text-white/80 mb-2">{getScoreMessage()}</p>
          <p className="text-white/50">
            {testQuiz.title}
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <GlassCard className="text-center">
            <CheckCircle className="w-8 h-8 text-neon-green mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{correctQuestions}</p>
            <p className="text-sm text-white/50">Đúng</p>
          </GlassCard>

          <GlassCard className="text-center">
            <XCircle className="w-8 h-8 text-neon-red mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{wrongQuestions}</p>
            <p className="text-sm text-white/50">Sai</p>
          </GlassCard>

          <GlassCard className="text-center">
            <Clock className="w-8 h-8 text-neon-cyan mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {Math.floor(elapsedTime / 60000)}:{(Math.floor(elapsedTime / 1000) % 60).toString().padStart(2, '0')}
            </p>
            <p className="text-sm text-white/50">Thời gian</p>
          </GlassCard>
        </motion.div>

        {/* Timeout Warning Banner */}
        {submittedDueToTimeout && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-6 p-4 rounded-xl bg-neon-yellow/10 border border-neon-yellow/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neon-yellow/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-neon-yellow" />
              </div>
              <div>
                <p className="text-neon-yellow font-medium">Hết thời gian làm bài!</p>
                <p className="text-white/60 text-sm">
                  Bài của bạn đã được nộp tự động khi hết giờ.
                  {answeredCount < totalQuestions && ` Còn ${totalQuestions - answeredCount} câu chưa trả lời.`}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/50">Tiến độ hoàn thành</span>
            <span className="text-sm text-white/70">{answeredCount}/{totalQuestions} câu</span>
          </div>
          <ProgressBar
            value={answeredCount}
            max={totalQuestions}
            color={isPass ? 'green' : 'pink'}
            size="lg"
          />
        </motion.div>

        {/* Question Review */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Chi tiết câu hỏi</h2>
          <div className="space-y-4">
            {testQuiz.questions.map((q, qIndex) => {
              if (q.type === 'mcq') {
                const mcqQuestion = q as MCQQuestion;
                const userAnswer = answers[q.id];
                const userSelectedIds = Array.isArray(userAnswer) ? userAnswer.filter((id): id is string => typeof id === 'string') : userAnswer && typeof userAnswer === 'string' ? [userAnswer] : [];
                const userSelectedSet = new Set(userSelectedIds);
                const correctIds = getCorrectAnswerIds(mcqQuestion);
                const correctSet = new Set(correctIds);
                const isMultiAnswer = correctIds.length > 1;

                const allCorrectSelected = correctIds.every(id => userSelectedSet.has(id));
                const noWrongSelected = userSelectedIds.every(id => correctSet.has(id));
                const isCorrect = allCorrectSelected && noWrongSelected;

                return (
                  <div
                    key={q.id}
                    className={cn(
                      'p-4 rounded-xl border transition-colors',
                      isCorrect
                        ? 'bg-neon-green/5 border-neon-green/30'
                        : 'bg-white/5 border-white/10'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                          isCorrect
                            ? 'bg-neon-green/20 text-neon-green'
                            : 'bg-neon-red/20 text-neon-red'
                        )}
                      >
                        {isCorrect ? (
                          <CheckCircle size={16} />
                        ) : (
                          <XCircle size={16} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm font-medium line-clamp-2 mb-2">
                          {q.title || `Câu hỏi ${qIndex + 1}`}
                          {isMultiAnswer && (
                            <span className="ml-2 text-xs text-neon-purple">
                              (Chọn {correctIds.length})
                            </span>
                          )}
                        </p>

                        {/* Show all options with status */}
                        <div className="space-y-2">
                          {mcqQuestion.options.map((option, optIndex) => {
                            const label = String.fromCharCode(65 + optIndex);
                            const isOptionCorrect = correctSet.has(option.id);
                            const isOptionSelected = userSelectedSet.has(option.id);
                            const isMissed = isOptionCorrect && !isOptionSelected;
                            const isWrong = !isOptionCorrect && isOptionSelected;

                            return (
                              <div
                                key={option.id}
                                className={cn(
                                  'flex items-center gap-2 p-2 rounded-lg text-sm',
                                  isMissed && 'bg-neon-yellow/10 border border-neon-yellow/30',
                                  isWrong && 'bg-neon-red/10 border border-neon-red/30',
                                  isOptionCorrect && !isMissed && 'bg-neon-green/10 border border-neon-green/30',
                                  !isOptionCorrect && !isWrong && 'bg-white/5 border border-white/10'
                                )}
                              >
                                <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-medium bg-white/10">
                                  {label}
                                </span>
                                <span className="flex-1 line-clamp-3">{option.text}</span>
                                {isMissed && <span className="text-neon-yellow text-xs">Bỏ sót</span>}
                                {isWrong && <XCircle size={14} className="text-neon-red" />}
                                {isOptionCorrect && !isMissed && <CheckCircle size={14} className="text-neon-green" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (q.type === 'truefalse') {
                const tfQuestion = q as TrueFalseQuestion;
                const userAnswers = (answers[q.id] as Record<string, boolean>) || {};
                const isTfCorrect = tfQuestion.statements.every(
                  (statement) => userAnswers[statement.id] === statement.answer
                );

                return (
                  <div
                    key={q.id}
                    className={cn(
                      'p-4 rounded-xl border transition-colors',
                      isTfCorrect
                        ? 'bg-neon-green/5 border-neon-green/30'
                        : 'bg-white/5 border-white/10'
                    )}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                          isTfCorrect
                            ? 'bg-neon-green/20 text-neon-green'
                            : 'bg-neon-red/20 text-neon-red'
                        )}
                      >
                        {isTfCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      </div>
                      <p className="text-white/80 text-sm font-medium">{q.title || `Câu hỏi ${qIndex + 1}`}</p>
                    </div>
                    <div className="space-y-2">
                      {tfQuestion.statements.map((statement, sIndex) => {
                        const label = String.fromCharCode(65 + sIndex);
                        const userAnswer = userAnswers[statement.id];
                        const isAnswered = userAnswer !== undefined;
                        const isCorrect = userAnswer === statement.answer;

                        return (
                          <div
                            key={statement.id}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-lg transition-colors',
                              isCorrect
                                ? 'bg-neon-green/10 border border-neon-green/30'
                                : isAnswered
                                ? 'bg-neon-red/10 border border-neon-red/30'
                                : 'bg-white/5'
                            )}
                          >
                            <span className="w-6 h-6 rounded bg-white/10 text-white/60 flex items-center justify-center text-xs font-medium">
                              {label}
                            </span>
                            <span className="flex-1 text-sm text-white/70">{statement.text}</span>
                            <span className={cn(
                              'px-2 py-1 rounded text-xs font-medium',
                              isCorrect
                                ? 'bg-neon-green/20 text-neon-green'
                                : isAnswered
                                ? 'bg-neon-red/20 text-neon-red'
                                : 'bg-white/10 text-white/50'
                            )}>
                              {isCorrect ? 'Đúng' : isAnswered ? 'Sai' : 'Chưa trả lời'}
                            </span>
                            {!isCorrect && isAnswered && (
                              <span className="text-xs text-neon-green">
                                → {statement.answer ? 'Đúng' : 'Sai'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              if (q.type === 'drag_drop_boxes') {
                const ddQuestion = q as DragDropBoxesQuestion;
                const userFilled = (answers[q.id] as Record<string, string[]>) || {};
                const isDdCorrect = ddQuestion.targets.every((target) => {
                  const filledInTarget = userFilled[target.id] || [];
                  const correctSet = new Set(target.correctAnswers);
                  const filledSet = new Set(filledInTarget);
                  return (
                    target.correctAnswers.every(ans => filledSet.has(ans)) &&
                    filledInTarget.every(ans => correctSet.has(ans))
                  );
                });

                return (
                  <div
                    key={q.id}
                    className={cn(
                      'p-4 rounded-xl border transition-colors',
                      isDdCorrect
                        ? 'bg-neon-green/5 border-neon-green/30'
                        : 'bg-white/5 border-white/10'
                    )}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                          isDdCorrect
                            ? 'bg-neon-green/20 text-neon-green'
                            : 'bg-neon-red/20 text-neon-red'
                        )}
                      >
                        {isDdCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      </div>
                      <p className="text-white/80 text-sm font-medium">{q.title || `Câu hỏi ${qIndex + 1}`}</p>
                    </div>
                    <div className="space-y-3">
                      {ddQuestion.targets.map((target, targetIndex) => {
                        const label = String.fromCharCode(65 + targetIndex);
                        const filledInTarget = userFilled[target.id] || [];

                        return (
                          <div key={target.id} className="p-3 rounded-lg bg-white/5">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-6 h-6 rounded bg-neon-purple/20 text-neon-purple flex items-center justify-center text-xs font-medium">
                                {label}
                              </span>
                              <span className="text-sm text-white/70">{target.title}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {target.correctAnswers.map((correctAnswer) => {
                                const isFilled = filledInTarget.includes(correctAnswer);
                                return (
                                  <span
                                    key={correctAnswer}
                                    className={cn(
                                      'px-3 py-1.5 rounded-lg text-sm font-medium border',
                                      isFilled
                                        ? 'bg-neon-green/20 text-neon-green border-neon-green/30'
                                        : 'bg-white/5 text-white/40 border-white/10'
                                    )}
                                  >
                                    {correctAnswer} {isFilled ? '✓' : '✗'}
                                  </span>
                                );
                              })}
                              {filledInTarget.map((filledItem) => {
                                const isCorrect = target.correctAnswers.includes(filledItem);
                                if (isCorrect) return null;
                                return (
                                  <span
                                    key={filledItem}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-neon-red/20 text-neon-red border border-neon-red/30"
                                  >
                                    {filledItem} ✗
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={q.id}
                  className="p-4 rounded-xl border border-neon-red/30 bg-neon-red/5 text-center"
                >
                  <p className="text-neon-red font-medium text-sm">Loại câu hỏi chưa được hỗ trợ ({q.type})</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            leftIcon={<RotateCcw size={18} />}
            onClick={() => {
              resetTest();
              if (quiz) {
                navigate('/test');
              }
            }}
          >
            Làm lại
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            leftIcon={<Edit3 size={18} />}
            onClick={() => {
              resetTest();
              navigate('/editor');
            }}
          >
            Chỉnh sửa đề
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            leftIcon={<Home size={18} />}
            onClick={() => {
              resetTest();
              navigate('/');
            }}
          >
            Trang chủ
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
