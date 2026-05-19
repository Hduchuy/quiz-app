import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusCircle,
  BookOpen,
  FileText,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  Upload,
} from 'lucide-react';
import { GlassCard, NeonCard, Modal, Button } from '@/components/ui';
import { useQuizStore } from '@/stores/quizStore';
import { ImportModal } from '@/components/quiz/ImportModal';
import { cn } from '@/utils/helpers';

export function LandingPage() {
  const navigate = useNavigate();
  const { createNewQuiz } = useQuizStore();
  const [showFormatGuide, setShowFormatGuide] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // BUG 1 FIX: Scroll to top when homepage mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleCreateNew = () => {
    createNewQuiz();
    navigate('/editor');
  };

  return (
    <div className="min-h-screen gradient-mesh allow-scroll">
      {/* Background Effects */}
      <div className="blur-background" />

      {/* Hero Section */}
      <HeroSection />

      {/* Action Cards Grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Create New */}
          <NeonCard color="cyan" onClick={handleCreateNew}>
            <div className="flex flex-col items-center text-center h-full justify-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-neon-cyan/20 flex items-center justify-center mb-4">
                <PlusCircle className="w-7 h-7 text-neon-cyan" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Tạo đề mới</h3>
              <p className="text-white/60 text-sm mb-4">
                Bắt đầu tạo đề kiểm tra từ đầu với giao diện trực quan
              </p>
              <span className="inline-flex items-center gap-2 text-neon-cyan text-sm font-medium">
                Bắt đầu ngay <ArrowRight size={16} />
              </span>
            </div>
          </NeonCard>

          {/* Import from File */}
          <GlassCard onClick={() => setShowImportModal(true)}>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-neon-green/10 flex items-center justify-center mb-4">
                <Upload className="w-7 h-7 text-neon-green" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Nhập từ file</h3>
              <p className="text-white/60 text-sm mb-4">
                Import câu hỏi từ file .txt hoặc .docx dễ dàng
              </p>
              <span className="inline-flex items-center gap-2 text-neon-green text-sm font-medium">
                Chọn file <ArrowRight size={16} />
              </span>
            </div>
          </GlassCard>

          {/* Question Bank */}
          <GlassCard onClick={() => navigate('/bank')}>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-neon-purple/10 flex items-center justify-center mb-4">
                <BookOpen className="w-7 h-7 text-neon-purple" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Kho câu hỏi</h3>
              <p className="text-white/60 text-sm mb-4">
                Khám phá kho câu hỏi có sẵn theo môn học và chủ đề
              </p>
              <span className="inline-flex items-center gap-2 text-white/60 text-sm">
                Đang phát triển <span className="text-xs bg-white/10 px-2 py-0.5 rounded">Soon</span>
              </span>
            </div>
          </GlassCard>

          {/* Format Guide */}
          <GlassCard onClick={() => setShowFormatGuide(true)}>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-neon-pink/10 flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-neon-pink" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Hướng dẫn format</h3>
              <p className="text-white/60 text-sm mb-4">
                Xem cách format file để import câu hỏi chính xác nhất
              </p>
              <span className="inline-flex items-center gap-2 text-white/60 text-sm">
                Tải file mẫu
              </span>
            </div>
          </GlassCard>
        </motion.div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* Format Guide Modal */}
      <FormatGuideModal isOpen={showFormatGuide} onClose={() => setShowFormatGuide(false)} />

      {/* Import Modal */}
      <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-3xl"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className="inline-flex items-center gap-3 mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center shadow-neon-cyan">
            <span className="text-deep-space font-bold text-3xl">Q</span>
          </div>
          <span className="font-bold text-4xl gradient-text">Quiz Studio</span>
        </motion.div>

        {/* Slogan */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
        >
          Tạo bài kiểm tra
          <br />
          <span className="gradient-text">không cần đăng nhập</span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg md:text-xl text-white/60 mb-10 max-w-xl mx-auto"
        >
          Giao diện hiện đại, tạo đề nhanh chóng, làm bài mọi lúc mọi nơi.
          Cảm giác như trong phòng nhạc chill vậy.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/editor">
            <Button variant="primary" size="lg" rightIcon={<ArrowRight size={18} />}>
              Tạo đề ngay
            </Button>
          </Link>
          <Button variant="secondary" size="lg" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
            Khám phá tính năng
          </Button>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
        >
          <div className="w-1 h-2 rounded-full bg-white/40" />
        </motion.div>
      </motion.div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Nhanh chóng',
      description: 'Tạo và làm bài kiểm tra chỉ trong vài phút',
      color: 'cyan',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'An toàn',
      description: 'Dữ liệu được lưu trữ cục bộ, bảo mật tuyệt đối',
      color: 'purple',
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Tiện lợi',
      description: 'Làm bài mọi lúc, mọi nơi trên mọi thiết bị',
      color: 'pink',
    },
  ];

  return (
    <section id="features" className="max-w-6xl mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Tại sao chọn <span className="gradient-text">Quiz Studio</span>?
        </h2>
        <p className="text-white/60 max-w-xl mx-auto">
          Chúng tôi xây dựng công cụ này với mong muốn giúp việc tạo và làm bài kiểm tra trở nên dễ dàng và thú vị hơn.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard className="h-full">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                feature.color === 'cyan' && 'bg-neon-cyan/10 text-neon-cyan',
                feature.color === 'purple' && 'bg-neon-purple/10 text-neon-purple',
                feature.color === 'pink' && 'bg-neon-pink/10 text-neon-pink',
              )}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/60 text-sm">{feature.description}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

interface FormatGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function FormatGuideModal({ isOpen, onClose }: FormatGuideModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hướng dẫn nhập câu hỏi" size="2xl">
      <div className="space-y-8">
        {/* Intro Note */}
        <div className="bg-neon-cyan/5 border border-neon-cyan/20 rounded-xl p-4">
          <p className="text-sm text-white/80">
            <span className="text-neon-cyan font-medium">Lưu ý:</span> Bạn có thể nhập câu hỏi từ file .txt hoặc .docx. 
            Hệ thống tự động nhận diện format — không cần format cứng nhắc.
          </p>
        </div>

        {/* Format Examples - 2 columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trắc nghiệm Example */}
          <div className="bg-white/5 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-neon-cyan/20 flex items-center justify-center">
                <span className="text-neon-cyan text-sm font-bold">TN</span>
              </div>
              <h3 className="text-base font-semibold text-white">Trắc nghiệm</h3>
            </div>
            <div className="p-4 rounded-lg bg-deep-space/50 font-mono text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
{`Câu 1: Nội dung câu hỏi
A. đáp án A
B. đáp án B
C. đáp án C
D. đáp án D
*A. (đáp án đúng)

hoặc:

1. Nội dung câu hỏi
   A) đáp án A
   B) đáp án B
   C) đáp án C
   D) đáp án D

Đáp án: B`}
            </div>
          </div>

          {/* Đúng/Sai Example */}
          <div className="bg-white/5 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-neon-green/20 flex items-center justify-center">
                <span className="text-neon-green text-sm font-bold">ĐS</span>
              </div>
              <h3 className="text-base font-semibold text-white">Đúng/Sai</h3>
            </div>
            <div className="p-4 rounded-lg bg-deep-space/50 font-mono text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
{`1. Nội dung câu hỏi
   Đúng
   Sai

hoặc:

Câu 2: Mệnh đề
   [Đúng]`}
            </div>
          </div>
        </div>

        {/* Answer Marking Guide */}
        <div className="bg-white/5 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-4">Cách đánh dấu đáp án</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-deep-space/50 rounded-lg p-3">
              <code className="text-neon-cyan font-mono text-sm">*A.</code>
              <p className="text-white/60 text-xs mt-1">Đáp án A là đúng</p>
            </div>
            <div className="bg-deep-space/50 rounded-lg p-3">
              <code className="text-neon-cyan font-mono text-sm">Đáp án: B</code>
              <p className="text-white/60 text-xs mt-1">Chỉ định B là đáp án</p>
            </div>
            <div className="bg-deep-space/50 rounded-lg p-3">
              <code className="text-neon-cyan font-mono text-sm">Đáp án: A|C</code>
              <p className="text-white/60 text-xs mt-1">Nhiều đáp án đúng</p>
            </div>
          </div>
        </div>

        {/* Flexibility Section */}
        <div>
          <h3 className="text-base font-semibold text-white mb-4">Linh hoạt</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
              <span className="text-neon-green text-lg">✓</span>
              <p className="text-white/70 text-sm">Tự động nhận diện <code className="text-neon-cyan/80">Câu 1</code>, <code className="text-neon-cyan/80">1.</code>, hoặc <code className="text-neon-cyan/80">1)</code></p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
              <span className="text-neon-green text-lg">✓</span>
              <p className="text-white/70 text-sm">Hỗ trợ <code className="text-neon-cyan/80">A.</code> hoặc <code className="text-neon-cyan/80">A)</code> cho đáp án</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
              <span className="text-neon-green text-lg">✓</span>
              <p className="text-white/70 text-sm">Bỏ qua dòng trống, không cần format cứng nhắc</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
              <span className="text-neon-green text-lg">✓</span>
              <p className="text-white/70 text-sm">Nếu không có đáp án, mặc định chọn đáp án đầu tiên</p>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="flex justify-end pt-2 border-t border-white/10">
          <Button variant="primary" onClick={onClose}>
            Đã hiểu
          </Button>
        </div>
      </div>
    </Modal>
  );
}
