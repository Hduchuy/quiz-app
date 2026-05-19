import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import type { SessionData } from '@/utils/sessionStorage';

interface RestoreSessionModalProps {
  isOpen: boolean;
  sessionData: SessionData | null;
  onRestore: () => void;
  onDiscard: () => void;
}

export function RestoreSessionModal({
  isOpen,
  sessionData,
  onRestore,
  onDiscard,
}: RestoreSessionModalProps) {
  const getQuestionCount = () => {
    if (!sessionData?.quiz?.questions) return 0;
    return sessionData.quiz.questions.length;
  };

  const getLastPathLabel = () => {
    if (!sessionData?.lastPath) return 'Trang chủ';
    switch (sessionData.lastPath) {
      case '/editor':
        return 'Trình chỉnh sửa';
      case '/':
        return 'Trang chủ';
      default:
        if (sessionData.lastPath.startsWith('/test/')) return 'Làm bài kiểm tra';
        return 'Trang chủ';
    }
  };

  const getTimeAgo = () => {
    if (!sessionData?.timestamp) return 'Không rõ';
    const diff = Date.now() - sessionData.timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} ngày trước`;
    if (hours > 0) return `${hours} giờ trước`;
    if (minutes > 0) return `${minutes} phút trước`;
    return 'Vừa xong';
  };

  const getTestProgress = () => {
    if (!sessionData?.testState) return null;
    const { answers, randomization } = sessionData.testState;
    if (!randomization) return null;
    
    const total = randomization.questionOrder.length;
    const answered = Object.keys(answers).length;
    return { answered, total };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md rounded-2xl bg-midnight-purple/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-neon-cyan/20 flex items-center justify-center">
                  <RotateCcw className="w-6 h-6 text-neon-cyan" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Khôi phục phiên làm việc?</h2>
                  <p className="text-white/50 text-sm">Đã tìm thấy dữ liệu làm việc trước đó</p>
                </div>
              </div>

              {/* Session Info */}
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Vị trí cuối</span>
                  <span className="text-white font-medium text-sm">{getLastPathLabel()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Số câu hỏi</span>
                  <span className="text-white font-medium text-sm">{getQuestionCount()} câu</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Cập nhật lần cuối</span>
                  <span className="text-white font-medium text-sm">{getTimeAgo()}</span>
                </div>

                {/* Test Progress */}
                {sessionData?.testState && (
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 text-sm">Tiến độ làm bài</span>
                      <span className="text-neon-green font-medium text-sm">
                        {getTestProgress()?.answered}/{getTestProgress()?.total} câu
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <Button
                variant="secondary"
                onClick={onDiscard}
                className="flex-1"
              >
                <Trash2 size={18} />
                Bỏ qua
              </Button>
              <Button
                variant="primary"
                onClick={onRestore}
                className="flex-1"
              >
                <RotateCcw size={18} />
                Khôi phục
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
