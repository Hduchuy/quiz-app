import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { parseTextFile, parseDocxFile } from '@/utils/quizParser';
import type { Question } from '@/types';
import { useQuizStore } from '@/stores/quizStore';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParseResult {
  questions: Question[];
  errors: string[];
  warnings: string[];
}

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const navigate = useNavigate();
  const { addQuestions } = useQuizStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setResult(null);
    setFileName(file.name);

    try {
      let content: string;

      if (file.name.endsWith('.docx')) {
        content = await parseDocxFile(file);
      } else if (file.name.endsWith('.txt')) {
        content = await file.text();
      } else {
        content = await file.text();
      }

      const parsed = parseTextFile(content);
      setResult(parsed);
    } catch (error) {
      setResult({
        questions: [],
        errors: [`Lỗi đọc file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleImport = useCallback(() => {
    if (result && result.questions.length > 0) {
      addQuestions(result.questions);
      onClose();
      // BUG 2 FIX: Navigate directly to editor after import
      navigate('/editor');
    }
  }, [result, addQuestions, onClose, navigate]);

  const handleClose = useCallback(() => {
    setResult(null);
    setFileName(null);
    onClose();
  }, [onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-midnight-purple/95 backdrop-blur-xl border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Nhập câu hỏi từ file</h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <div className="space-y-4">
                {!result && (
                  <>
                    {/* Drop Zone */}
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`
                        border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                        ${isDragging 
                          ? 'border-neon-cyan bg-neon-cyan/10' 
                          : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                        }
                      `}
                      onClick={() => document.getElementById('import-file-input')?.click()}
                    >
                      <input
                        type="file"
                        id="import-file-input"
                        accept=".txt,.docx"
                        onChange={handleInputChange}
                        className="hidden"
                      />
                      
                      {isLoading ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-10 h-10 text-neon-cyan animate-spin" />
                          <p className="text-white/60">Đang đọc file...</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 mx-auto mb-3 text-white/40" />
                          <p className="text-white/80 mb-1">Kéo thả file vào đây</p>
                          <p className="text-white/40 text-sm">hoặc click để chọn file</p>
                          <p className="text-white/30 text-xs mt-3">Hỗ trợ .txt và .docx</p>
                        </>
                      )}
                    </div>

                    {/* Note */}
                    <div className="bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg p-3">
                      <p className="text-neon-cyan text-sm font-medium">
                        Hiện chỉ hỗ trợ nhập tự động:
                      </p>
                      <p className="text-white/70 text-sm mt-1">
                        <span className="text-neon-cyan">•</span> Trắc nghiệm (A. B. C. D.)
                      </p>
                      <p className="text-white/70 text-sm">
                        <span className="text-neon-cyan">•</span> Đúng/Sai (1. 2. 3. 4.)
                      </p>
                    </div>

                    {/* Format Examples */}
                    <div className="space-y-3">
                      {/* Trắc nghiệm Example */}
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <h4 className="text-neon-cyan text-xs font-medium mb-2">Trắc nghiệm</h4>
                        <pre className="font-mono text-xs text-white/60 whitespace-pre-wrap leading-relaxed">
{`Câu 1: Nội dung câu hỏi

A. Đáp án A
B. Đáp án B
C. Đáp án C
D. Đáp án D`}
                        </pre>
                      </div>

                      {/* Đúng/Sai Example */}
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <h4 className="text-neon-green text-xs font-medium mb-2">Đúng / Sai</h4>
                        <pre className="font-mono text-xs text-white/60 whitespace-pre-wrap leading-relaxed">
{`Câu 2: Nội dung câu hỏi

1. Mệnh đề 1
2. Mệnh đề 2
3. Mệnh đề 3
4. Mệnh đề 4`}
                        </pre>
                      </div>
                    </div>
                  </>
                )}

                {result && (
                  <div className="space-y-4">
                    {/* File Info */}
                    <div className="flex items-center gap-2 text-white/60">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">{fileName}</span>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-neon-green/10 rounded-lg p-4 text-center">
                        <CheckCircle className="w-6 h-6 text-neon-green mx-auto mb-2" />
                        <p className="text-2xl font-bold text-neon-green">{result.questions.length}</p>
                        <p className="text-white/60 text-sm">Câu hỏi đã nhập</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4 text-center">
                        <AlertCircle className="w-6 h-6 text-white/40 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white/60">{result.warnings.length}</p>
                        <p className="text-white/60 text-sm">Cảnh báo</p>
                      </div>
                    </div>

                    {/* Warnings */}
                    {result.warnings.length > 0 && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                        <h4 className="text-yellow-400 text-sm font-medium mb-2">Cảnh báo</h4>
                        <ul className="space-y-1">
                          {result.warnings.slice(0, 5).map((warning, i) => (
                            <li key={i} className="text-yellow-200/80 text-xs">
                              • {warning}
                            </li>
                          ))}
                          {result.warnings.length > 5 && (
                            <li className="text-yellow-200/60 text-xs">
                              ... và {result.warnings.length - 5} cảnh báo khác
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Errors */}
                    {result.errors.length > 0 && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <h4 className="text-red-400 text-sm font-medium mb-2">Lỗi</h4>
                        <ul className="space-y-1">
                          {result.errors.map((error, i) => (
                            <li key={i} className="text-red-200/80 text-xs">
                              • {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                      <Button variant="secondary" onClick={handleClose}>
                        Hủy
                      </Button>
                      {result.questions.length > 0 && (
                        <Button variant="primary" onClick={handleImport}>
                          Nhập {result.questions.length} câu hỏi
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
