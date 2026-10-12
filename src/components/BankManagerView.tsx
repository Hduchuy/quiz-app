import React, { useState, useRef } from 'react';
import { 
  Database, 
  Search, 
  Download, 
  Upload, 
  FileText, 
  Trash2, 
  RotateCcw, 
  AlertCircle, 
  Edit3, 
  Check, 
  X,
  FileCheck,
  FolderOpen,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import { CourseData, Question, Topic } from '../types/quiz';
import { exportBackupData, importBackupData, resetToDefaultCourse, resetStudyProgress, resetExamHistory, updateQuestionInBank } from '../utils/storage';
import { parseDocxFile } from '../utils/docxParser';

interface BankManagerViewProps {
  courseData: CourseData;
  onUpdateCourse: (updated: CourseData) => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const BankManagerView: React.FC<BankManagerViewProps> = ({
  courseData,
  onUpdateCourse,
  onNotify
}) => {
  const [activeTab, setActiveTab] = useState<'questions' | 'data' | 'advanced'>('questions');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterTopicId, setFilterTopicId] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterVerification, setFilterVerification] = useState('all');

  // Edit question state
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Confirmation modals
  const [showConfirmResetProgress, setShowConfirmResetProgress] = useState(false);
  const [showConfirmResetCourse, setShowConfirmResetCourse] = useState(false);

  // File inputs refs
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const docxInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingDocx, setIsProcessingDocx] = useState(false);

  // All questions flattened
  const allQuestions = courseData.topics.flatMap(t => t.questions);

  // Filtered list
  const filteredQuestions = allQuestions.filter(q => {
    if (filterTopicId !== 'all' && q.topicId !== filterTopicId) return false;
    if (filterType !== 'all' && q.type !== filterType) return false;
    if (filterVerification !== 'all' && q.verificationStatus !== filterVerification) return false;
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      const matchText = q.questionText.toLowerCase().includes(kw);
      const matchOpt = (q.options || []).some(o => o.toLowerCase().includes(kw));
      const matchNum = `câu ${q.questionNumber}`.includes(kw);
      return matchText || matchOpt || matchNum;
    }
    return true;
  });

  const needsReviewCount = allQuestions.filter(q => q.verificationStatus === 'needs_review').length;

  // 1. Export JSON handler
  const handleExportJson = () => {
    const jsonStr = exportBackupData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${courseData.name.replace(/\s+/g, '_')}_ngan_hang_cau_hoi.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Đã xuất file sao lưu JSON thành công!', 'success');
  };

  // 2. Import JSON handler
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importBackupData(content);
      if (res.success && res.course) {
        onUpdateCourse(res.course);
        onNotify(res.message, 'success');
      } else {
        onNotify(res.message, 'error');
      }
    };
    reader.readAsText(file);
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  };

  // 3. Import DOCX files handler (Client-side JSZip)
  const handleImportDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingDocx(true);
    try {
      const fileList = Array.from(files);
      const parsedTopics: Topic[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const topic = await parseDocxFile(file, i + 1);
        parsedTopics.push(topic);
      }

      if (parsedTopics.length > 0) {
        const totalQ = parsedTopics.reduce((acc, t) => acc + t.questions.length, 0);
        const newCourse: CourseData = {
          id: `course_${Date.now()}`,
          name: fileList.length === 1 ? parsedTopics[0].title : 'Môn Học Mới',
          topics: parsedTopics,
          updatedAt: new Date().toISOString()
        };

        onUpdateCourse(newCourse);
        resetStudyProgress();
        onNotify(`Đã phân tích thành công ${fileList.length} file Word với tổng cộng ${totalQ} câu hỏi!`, 'success');
      }
    } catch (err: any) {
      onNotify(`Lỗi khi đọc file Word: ${err.message}`, 'error');
    } finally {
      setIsProcessingDocx(false);
      if (docxInputRef.current) docxInputRef.current.value = '';
    }
  };

  // 4. Save Edited Question
  const handleSaveEditedQuestion = () => {
    if (!editingQuestion) return;
    const updatedCourse = updateQuestionInBank(editingQuestion);
    onUpdateCourse(updatedCourse);
    setEditingQuestion(null);
    onNotify(`Đã cập nhật Câu ${editingQuestion.questionNumber} thành công!`, 'success');
  };

  // 5. Restore default CNXHKH course
  const handleRestoreDefault = () => {
    const def = resetToDefaultCourse();
    resetStudyProgress();
    onUpdateCourse(def);
    setShowConfirmResetCourse(false);
    onNotify('Đã khôi phục dữ liệu gốc 197 câu hỏi môn CNXHKH!', 'success');
  };

  // 6. Reset study progress
  const handleResetProgress = () => {
    resetStudyProgress();
    resetExamHistory();
    setShowConfirmResetProgress(false);
    onNotify('Đã xóa toàn bộ lịch sử học tập và kết quả thi thử!', 'success');
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header Card */}
      <div className="card" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Database size={24} color="var(--primary)" />
              <span>Quản Lý Ngân Hàng Câu Hỏi & Dữ Liệu</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
              Môn hiện tại: <strong>{courseData.name}</strong> • Tổng cộng <strong>{allQuestions.length} câu hỏi</strong> trong <strong>{courseData.topics.length} chủ đề</strong>
            </p>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border-color)', paddingTop: 14, flexWrap: 'wrap' }}>
          <button
            className={`nav-btn ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            <FileText size={16} />
            <span>Danh sách câu hỏi ({allQuestions.length})</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            <FolderOpen size={16} />
            <span>Nhập & Xuất dữ liệu</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            <Sliders size={16} />
            <span>Quản lý nâng cao</span>
          </button>
        </div>
      </div>

      {/* Warning Badge if any questions need review */}
      {needsReviewCount > 0 && activeTab === 'questions' && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--warning-light)',
          border: '1px solid var(--warning-border)',
          color: 'var(--warning-text)',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={18} />
            <span>Phát hiện <strong>{needsReviewCount} câu hỏi</strong> cần bạn kiểm tra lại!</span>
          </div>
          <button
            className="btn btn-sm"
            style={{ backgroundColor: 'var(--warning)', color: '#fff' }}
            onClick={() => setFilterVerification('needs_review')}
          >
            Lọc các câu này
          </button>
        </div>
      )}

      {/* ================= TAB 1: QUESTIONS LIST & SEARCH ================= */}
      {activeTab === 'questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Filter and Search Bar */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Search Input */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flex: 2,
                minWidth: 240,
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border-color)',
                backgroundColor: 'var(--bg-input)'
              }}>
                <Search size={16} color="var(--text-subtle)" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nội dung câu hỏi, từ khóa, đáp án..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: '0.875rem',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)'
                  }}
                />
                {searchKeyword && (
                  <button
                    onClick={() => setSearchKeyword('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)' }}
                    aria-label="Xóa từ khóa"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Topic Select */}
              <select
                value={filterTopicId}
                onChange={(e) => setFilterTopicId(e.target.value)}
                className="input-text"
                style={{ width: 'auto', minWidth: 160 }}
              >
                <option value="all">Tất cả chủ đề</option>
                {courseData.topics.map(t => (
                  <option key={t.id} value={t.id}>{t.title.slice(0, 35)}...</option>
                ))}
              </select>

              {/* Type Select */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-text"
                style={{ width: 'auto', minWidth: 140 }}
              >
                <option value="all">Tất cả loại câu</option>
                <option value="single">Chọn 1 đáp án</option>
                <option value="multiple">Chọn nhiều đáp án</option>
                <option value="true_false">Đúng / Sai</option>
                <option value="matching">Ghép nối / Phân loại</option>
              </select>

              <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Hiển thị: {filteredQuestions.length} / {allQuestions.length} câu
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredQuestions.length === 0 ? (
              <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  Không tìm thấy câu hỏi nào phù hợp với bộ lọc tìm kiếm.
                </p>
              </div>
            ) : (
              filteredQuestions.map((q) => (
                <div key={q.id} className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        Câu {q.questionNumber}
                      </span>
                      <span className="badge badge-primary">
                        {q.type === 'single' ? 'Chọn 1' : q.type === 'multiple' ? 'Chọn nhiều' : q.type === 'true_false' ? 'Đúng/Sai' : 'Ghép nối'}
                      </span>
                      <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                        {q.topicTitle.split(':')[0]}
                      </span>
                      {q.verificationStatus === 'needs_review' && (
                        <span className="badge badge-warning">Cần kiểm tra: {q.reviewReason}</span>
                      )}
                    </div>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setEditingQuestion({ ...q })}
                      title="Chỉnh sửa câu hỏi hoặc đáp án"
                    >
                      <Edit3 size={14} />
                      <span>Sửa câu</span>
                    </button>
                  </div>

                  {/* Question text */}
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.5 }}>
                    {q.questionText}
                  </div>

                  {/* Options Preview */}
                  {q.options && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.85rem' }}>
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correctAnswers?.includes(optIdx);
                        return (
                          <div
                            key={optIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '4px 10px',
                              borderRadius: 6,
                              backgroundColor: isCorrect ? 'var(--success-light)' : 'var(--bg-card-subtle)',
                              color: isCorrect ? 'var(--success-text)' : 'var(--text-secondary)',
                              fontWeight: isCorrect ? 700 : 400
                            }}
                          >
                            <span style={{ minWidth: 20 }}>{String.fromCharCode(65 + optIdx)}.</span>
                            <span style={{ flex: 1 }}>{opt}</span>
                            {isCorrect && <Check size={14} color="var(--success)" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* True/False Statements Preview */}
                  {q.type === 'true_false' && q.statements && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem', marginTop: 4 }}>
                      {q.statements.map((s, sIdx) => (
                        <div
                          key={s.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '4px 10px',
                            borderRadius: 6,
                            backgroundColor: 'var(--bg-card-subtle)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          <span>{sIdx + 1}. {s.text}</span>
                          <span className={`badge ${s.correctAnswer ? 'badge-success' : 'badge-danger'}`}>
                            {s.correctAnswer ? 'Đúng' : 'Sai'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Matching Preview */}
                  {q.type === 'matching' && q.matchingData?.pairs && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem', marginTop: 4 }}>
                      {q.matchingData.pairs.map((p, pIdx) => (
                        <div
                          key={p.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '4px 10px',
                            borderRadius: 6,
                            backgroundColor: 'var(--bg-card-subtle)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          <span>{pIdx + 1}. {p.prompt}</span>
                          <span style={{ fontWeight: 600, color: 'var(--primary)' }}>➔ {p.target}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: IMPORT & EXPORT DATA ================= */}
      {activeTab === 'data' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              Sao lưu & Xuất dữ liệu
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
              Xuất toàn bộ ngân hàng câu hỏi môn học hiện tại ra file JSON để lưu trữ hoặc chuyển sang máy tính khác.
            </p>
            <button className="btn btn-secondary" onClick={handleExportJson}>
              <Download size={16} />
              <span>Xuất ngân hàng câu hỏi ra file JSON</span>
            </button>
          </div>

          <div className="card">
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              Nhập dữ liệu từ JSON
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
              Khôi phục ngân hàng câu hỏi từ một file JSON đã sao lưu trước đó.
            </p>
            <button className="btn btn-secondary" onClick={() => jsonInputRef.current?.click()}>
              <Upload size={16} />
              <span>Chọn file JSON để nhập</span>
            </button>
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportJson}
            />
          </div>

          <div className="card">
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              Nhập tài liệu môn học mới từ Word (.docx)
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
              Tải lên một hoặc nhiều file Word (.docx) chứa câu hỏi và đáp án có đánh dấu đỏ. Hệ thống sẽ tự động bóc tách câu hỏi, nhận diện đáp án và tạo môn học mới.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => docxInputRef.current?.click()}
              disabled={isProcessingDocx}
            >
              <FolderOpen size={16} />
              <span>{isProcessingDocx ? 'Đang phân tích file Word...' : 'Chọn 1 hoặc nhiều file Word (.docx)'}</span>
            </button>
            <input
              ref={docxInputRef}
              type="file"
              multiple
              accept=".docx"
              style={{ display: 'none' }}
              onChange={handleImportDocx}
            />
          </div>
        </div>
      )}

      {/* ================= TAB 3: ADVANCED / DANGER ZONE ================= */}
      {activeTab === 'advanced' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ borderColor: 'var(--warning-border)', backgroundColor: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <AlertTriangle size={20} color="var(--warning)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Xóa lịch sử & tiến độ học tập
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
              Thao tác này sẽ xóa toàn bộ câu hỏi đã làm, danh sách các câu làm sai và lịch sử kết quả thi thử. <strong>Ngân hàng câu hỏi vẫn được giữ nguyên vẹn.</strong>
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => setShowConfirmResetProgress(true)}
              style={{ color: 'var(--danger-text)', borderColor: 'var(--danger-border)' }}
            >
              <RotateCcw size={15} />
              <span>Xóa toàn bộ lịch sử học tập</span>
            </button>
          </div>

          <div className="card" style={{ borderColor: 'var(--danger-border)', backgroundColor: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <AlertCircle size={20} color="var(--danger)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Khôi phục dữ liệu gốc môn CNXHKH
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
              Đặt lại ứng dụng về trạng thái mặc định với 197 câu hỏi của môn Chủ Nghĩa Xã Hội Khoa Học từ 6 file gốc. Mọi thay đổi chỉnh sửa thủ công sẽ được đặt lại.
            </p>
            <button
              className="btn btn-danger"
              onClick={() => setShowConfirmResetCourse(true)}
            >
              <FileCheck size={15} />
              <span>Khôi phục dữ liệu gốc môn CNXHKH</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div className="modal-title">
                Chỉnh sửa Câu {editingQuestion.questionNumber}
              </div>
              <button className="modal-close" onClick={() => setEditingQuestion(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              {/* Question Text Edit */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Nội dung câu hỏi:
                </label>
                <textarea
                  value={editingQuestion.questionText}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                  rows={3}
                  className="input-text"
                />
              </div>

              {/* Options Edit (if single or multiple) */}
              {editingQuestion.options && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Các phương án trả lời & Chọn đáp án đúng:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {editingQuestion.options.map((opt, idx) => {
                      const isCorrect = editingQuestion.correctAnswers?.includes(idx);
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => {
                              const cur = editingQuestion.correctAnswers || [];
                              let next: number[];
                              if (editingQuestion.type === 'single') {
                                next = [idx];
                              } else {
                                next = cur.includes(idx) ? cur.filter(i => i !== idx) : [...cur, idx];
                              }
                              setEditingQuestion({ ...editingQuestion, correctAnswers: next });
                            }}
                            className={`btn btn-sm ${isCorrect ? 'btn-success' : 'btn-secondary'}`}
                            style={{ minWidth: 40 }}
                          >
                            {String.fromCharCode(65 + idx)}
                          </button>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const nextOpts = [...(editingQuestion.options || [])];
                              nextOpts[idx] = e.target.value;
                              setEditingQuestion({ ...editingQuestion, options: nextOpts });
                            }}
                            className="input-text"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Explanation Edit */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Lời giải thích (tùy chọn):
                </label>
                <input
                  type="text"
                  value={editingQuestion.explanation || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  placeholder="Nhập lời giải thích kiến thức cho câu hỏi này..."
                  className="input-text"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setEditingQuestion(null)}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={handleSaveEditedQuestion}>
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reset Progress */}
      {showConfirmResetProgress && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Xác nhận xóa tiến độ học tập</div>
              <button className="modal-close" onClick={() => setShowConfirmResetProgress(false)}>
                <X size={20} />
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 20, lineHeight: 1.55 }}>
              Thao tác này sẽ xóa toàn bộ câu hỏi đã làm, danh sách câu sai và lịch sử điểm số bài thi thử. <strong>Ngân hàng câu hỏi vẫn được giữ nguyên.</strong> Bạn có chắc chắn muốn xóa không?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowConfirmResetProgress(false)}>
                Hủy
              </button>
              <button className="btn btn-danger" onClick={handleResetProgress}>
                Xóa tiến độ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reset Course to default */}
      {showConfirmResetCourse && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Khôi phục môn CNXHKH gốc</div>
              <button className="modal-close" onClick={() => setShowConfirmResetCourse(false)}>
                <X size={20} />
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 20, lineHeight: 1.55 }}>
              Bạn có chắc chắn muốn khôi phục lại ngân hàng 197 câu hỏi gốc được trích xuất từ 6 file Word môn Chủ Nghĩa Xã Hội Khoa Học không? Mọi câu hỏi tự chỉnh sửa sẽ được đặt lại theo file gốc.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowConfirmResetCourse(false)}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={handleRestoreDefault}>
                Khôi phục ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
