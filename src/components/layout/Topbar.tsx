import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, Trash2 } from 'lucide-react';
import { useQuizStore } from '@/stores/quizStore';
import { SettingsPanel } from './SettingsPanel';
import { Modal, Button } from '@/components/ui';

export function Topbar() {
  const location = useLocation();
  const { quiz, updateQuizTitle, clearAllQuestions } = useQuizStore();
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(quiz.title);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setLocalTitle(quiz.title);
  }, [quiz.title]);

  const handleTitleSubmit = () => {
    if (localTitle.trim()) {
      updateQuizTitle(localTitle.trim());
    } else {
      setLocalTitle(quiz.title);
    }
    setIsEditing(false);
  };

  if (location.pathname === '/') {
    return <LandingTopbar />;
  }

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-[1000] h-16 px-4 flex items-center justify-between"
        style={{
          background: 'rgba(10, 10, 26, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
              <span className="text-deep-space font-bold">Q</span>
            </div>
            <span className="font-semibold text-white hidden sm:block">Quiz Studio</span>
          </Link>
        </div>

        {/* Center: Title Input */}
        <div className="flex-1 max-w-md mx-4">
          {isEditing ? (
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              autoFocus
              className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-neon-cyan/30 text-white text-center focus:outline-none focus:ring-2 focus:ring-neon-cyan/30"
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full px-3 py-1.5 rounded-lg text-white/80 hover:bg-white/5 hover:text-white transition-colors truncate"
            >
              {quiz.title || 'Untitled Quiz'}
            </button>
          )}
        </div>

        {/* Right: Stats & Actions */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/50 hidden md:block">
            {quiz.questions.length} câu
          </span>

          {quiz.questions.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/60 hover:text-neon-red hover:bg-neon-red/10 transition-colors text-sm"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Xóa tất cả</span>
            </button>
          )}

          <SettingsPanel />
        </div>
      </motion.header>

      {/* Clear All Confirmation Modal */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Xóa tất cả câu hỏi"
        size="sm"
      >
        <p className="text-white/70 mb-6">
          Bạn có chắc muốn xóa toàn bộ câu hỏi? Hành động này không thể hoàn tác.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowClearConfirm(false)}>
            Hủy
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              clearAllQuestions();
              setShowClearConfirm(false);
            }}
          >
            Xóa tất cả
          </Button>
        </div>
      </Modal>
    </>
  );
}

function LandingTopbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-[1000] px-4 py-4"
      style={{
        background: 'rgba(10, 10, 26, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center shadow-neon-cyan">
            <span className="text-deep-space font-bold text-lg">Q</span>
          </div>
          <span className="font-bold text-xl text-white">Quiz Studio</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/editor" className="text-white/70 hover:text-white transition-colors">
            Tạo đề mới
          </Link>
          <a href="#features" className="text-white/70 hover:text-white transition-colors">
            Tính năng
          </a>
          <a href="#about" className="text-white/70 hover:text-white transition-colors">
            Giới thiệu
          </a>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden mt-4 p-4 rounded-2xl glass"
        >
          <nav className="flex flex-col gap-4">
            <Link
              to="/editor"
              className="text-white/70 hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tạo đề mới
            </Link>
            <a
              href="#features"
              className="text-white/70 hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tính năng
            </a>
            <a
              href="#about"
              className="text-white/70 hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Giới thiệu
            </a>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
}
