import React from 'react';

/**
 * Drag and Drop Match Editor
 * LEFT = Targets (Fixed)
 * RIGHT = Answer Bank (Draggable Cards)
 */
export function DragDropMatchEditor({ question, isEditMode, onUpdateQuestion }) {
  const targets = question.targets || [];
  const answerBank = question.answerBank || [];
  const correctMatches = question.correctMatches || {};

  const handleUpdateTarget = (id, text) => {
    const newTargets = targets.map(t => t.id === id ? { ...t, text } : t);
    onUpdateQuestion(question.id, { targets: newTargets });
  };

  const handleUpdateAnswer = (id, text) => {
    const newBank = answerBank.map(a => a.id === id ? { ...a, text } : a);
    onUpdateQuestion(question.id, { answerBank: newBank });
  };

  const handleAddTarget = () => {
    const nextId = String(targets.length + 1);
    onUpdateQuestion(question.id, { 
      targets: [...targets, { id: nextId, text: '' }] 
    });
  };

  const handleAddAnswer = () => {
    const labels = 'ABCDEFGH';
    const nextId = labels[answerBank.filter(a => !a.distractor).length] || `R${answerBank.length + 1}`;
    onUpdateQuestion(question.id, { 
      answerBank: [...answerBank, { id: nextId, text: '', distractor: false }] 
    });
  };

  const handleAddDistractor = () => {
    const labels = 'XYZWUVT';
    const nextId = labels[answerBank.filter(a => a.distractor).length] || `X${answerBank.length + 1}`;
    onUpdateQuestion(question.id, { 
      answerBank: [...answerBank, { id: nextId, text: '', distractor: true }] 
    });
  };

  const handleRemoveTarget = (id) => {
    onUpdateQuestion(question.id, { 
      targets: targets.filter(t => t.id !== id) 
    });
  };

  const handleRemoveAnswer = (id) => {
    onUpdateQuestion(question.id, { 
      answerBank: answerBank.filter(a => a.id !== id) 
    });
  };

  const toggleMatch = (targetId, answerId) => {
    const current = correctMatches[targetId] || [];
    let next;
    if (current.includes(answerId)) {
      next = current.filter(id => id !== answerId);
    } else {
      next = [...current, answerId];
    }
    onUpdateQuestion(question.id, {
      correctMatches: { ...correctMatches, [targetId]: next }
    });
  };

  if (!isEditMode) {
    return (
      <div className="mt-4 grid grid-cols-2 gap-8">
        <div className="space-y-4">
          <h4 className="text-xs font-bold opacity-50 uppercase tracking-widest">Cột cố định (LEFT)</h4>
          <div className="space-y-2">
            {targets.map(t => (
              <div key={t.id} className="p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm">
                <span className="opacity-30 mr-2 font-bold">{t.id}.</span> {t.text || '(Trống)'}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="text-xs font-bold opacity-50 uppercase tracking-widest">Kho thẻ đáp án (RIGHT)</h4>
          <div className="flex flex-wrap gap-2">
            {answerBank.map(a => (
              <div key={a.id} className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${a.distractor ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'}`}>
                <span className="opacity-50 mr-1">{a.id}.</span> {a.text || '(Trống)'}
                {a.distractor && <span className="ml-2 text-[10px] opacity-50 uppercase">Nhiễu</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-8">
      {/* 2 COLUMN EDITOR */}
      <div className="grid grid-cols-2 gap-8">
        {/* LEFT COLUMN EDITOR */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[var(--color-accent-light)] uppercase tracking-wider text-sm">Vùng Đích (Targets)</h3>
            <button onClick={handleAddTarget} className="text-xs px-3 py-1 bg-[var(--color-accent)] text-white rounded-lg">+ Thêm ô</button>
          </div>
          <div className="space-y-3">
            {targets.map((t, idx) => (
              <div key={t.id} className="flex flex-col gap-1">
                <div className="flex gap-2 p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] focus-within:border-[var(--color-accent)]">
                  <input
                    type="text"
                    value={t.text}
                    onChange={e => handleUpdateTarget(t.id, e.target.value)}
                    placeholder={`Nội dung ô ${t.id}`}
                    className="flex-1 bg-transparent outline-none text-sm"
                  />
                  <button onClick={() => handleRemoveTarget(t.id)} className="text-[var(--color-error)] opacity-50 hover:opacity-100">✕</button>
                </div>
                {(!correctMatches[t.id] || correctMatches[t.id].length === 0) && (
                  <div className="text-[10px] text-[var(--color-warning)] pl-3 flex items-center gap-1">
                    ⚠️ Ô này chưa có đáp án đúng
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN EDITOR */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-cyan-400 uppercase tracking-wider text-sm">Kho Đáp Án (Cards)</h3>
            <div className="flex gap-2">
              <button onClick={handleAddAnswer} className="text-[10px] px-2 py-1 bg-cyan-600 text-white rounded-lg">+ Thẻ đúng</button>
              <button onClick={handleAddDistractor} className="text-[10px] px-2 py-1 bg-orange-600 text-white rounded-lg">+ Thẻ nhiễu</button>
            </div>
          </div>
          <div className="space-y-3">
            {answerBank.map((a, idx) => {
              const isUsed = Object.values(correctMatches).some(arr => arr.includes(a.id));
              return (
                <div key={a.id} className="flex flex-col gap-1">
                  <div className={`flex gap-2 p-3 bg-[var(--color-surface-hover)] rounded-xl border ${a.distractor ? 'border-orange-500/30' : (isUsed ? 'border-[var(--color-border)]' : 'border-[var(--color-warning)]/30')} focus-within:border-cyan-500`}>
                    <span className={`font-bold opacity-30 text-xs w-4 ${a.distractor ? 'text-orange-400' : ''}`}>{a.id}</span>
                    <input
                      type="text"
                      value={a.text}
                      onChange={e => handleUpdateAnswer(a.id, e.target.value)}
                      placeholder={a.distractor ? "Nội dung thẻ nhiễu..." : `Nội dung card ${a.id}`}
                      className="flex-1 bg-transparent outline-none text-sm"
                    />
                    {a.distractor && <span className="text-[10px] font-bold text-orange-500/50 self-center px-1.5 py-0.5 bg-orange-500/10 rounded">NHIỄU</span>}
                    <button onClick={() => handleRemoveAnswer(a.id)} className="text-[var(--color-error)] opacity-50 hover:opacity-100">✕</button>
                  </div>
                  {!isUsed && !a.distractor && (
                    <div className="text-[10px] text-[var(--color-warning)] pl-3 flex items-center gap-1">
                      ⚠️ Chưa được gán vào ô nào
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MATCHING MATRIX */}
      <div className="pt-6 border-t border-[var(--color-border)]">
        <h3 className="font-bold text-sm uppercase opacity-50 mb-4">Thiết lập đáp án đúng (Click để nối)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-2 border border-[var(--color-border)] bg-[rgba(0,0,0,0.2)] text-xs">Ô đích (Target)</th>
                {answerBank.filter(a => !a.distractor).map(a => (
                  <th key={a.id} className="p-2 border border-[var(--color-border)] bg-[rgba(0,0,0,0.2)] text-xs text-center">{a.id}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {targets.map(t => (
                <tr key={t.id}>
                  <td className="p-2 border border-[var(--color-border)] font-medium text-xs truncate max-w-[150px]">
                    {t.text || `Ô ${t.id}`}
                  </td>
                  {answerBank.filter(a => !a.distractor).map(a => {
                    const isMatched = (correctMatches[t.id] || []).includes(a.id);
                    return (
                      <td 
                        key={a.id} 
                        onClick={() => toggleMatch(t.id, a.id)}
                        className={`p-2 border border-[var(--color-border)] text-center cursor-pointer transition-colors ${isMatched ? 'bg-[var(--color-success)]/20' : 'hover:bg-[rgba(255,255,255,0.05)]'}`}
                      >
                        {isMatched ? '✅' : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function DragDropFillEditor({ question, isEditMode, onUpdateQuestion }) {
  const segments = question.segments || [];

  const handleUpdateSegment = (idx, updates) => {
    const newSegments = segments.map((s, i) => i === idx ? { ...s, ...updates } : s);
    onUpdateQuestion(question.id, { segments: newSegments });
  };

  const handleAddSegment = (type) => {
    const newSegment = type === 'text' 
      ? { type: 'text', content: '' }
      : { type: 'blank', id: `blank_${Date.now()}`, answers: [] };
    onUpdateQuestion(question.id, { segments: [...segments, newSegment] });
  };

  const handleRemoveSegment = (idx) => {
    onUpdateQuestion(question.id, { 
      segments: segments.filter((_, i) => i !== idx) 
    });
  };

  const handleMoveSegment = (idx, direction) => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === segments.length - 1) return;
    
    const newSegments = [...segments];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newSegments[idx], newSegments[targetIdx]] = [newSegments[targetIdx], newSegments[idx]];
    
    onUpdateQuestion(question.id, { segments: newSegments });
  };

  const handleAnswersChange = (idx, val) => {
    const answers = val.split('|').map(a => a.trim()).filter(a => a.length > 0);
    handleUpdateSegment(idx, { answers });
  };

  if (!isEditMode) {
    return (
      <div className="mt-4 p-6 bg-[rgba(0,0,0,0.1)] rounded-2xl border border-[var(--color-border)] leading-loose text-lg">
        {segments.length === 0 ? (
          <span className="opacity-30 italic text-base">Chưa có nội dung...</span>
        ) : (
          segments.map((seg, idx) => {
            if (seg.type === 'text') return <span key={idx} className="whitespace-pre-wrap">{seg.content}</span>;
            return (
              <span key={idx} className="inline-flex mx-1 px-3 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent-light)] border border-[var(--color-accent)]/30 rounded-lg text-base font-bold">
                {(seg.answers || []).join(' | ') || '_____'}
              </span>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Cấu trúc câu hỏi (Segments)</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => handleAddSegment('text')}
              className="text-[10px] px-3 py-1.5 bg-[var(--color-surface-active)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-lg transition-colors"
            >
              + Thêm Văn bản
            </button>
            <button 
              onClick={() => handleAddSegment('blank')}
              className="text-[10px] px-3 py-1.5 bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-light)] rounded-lg transition-colors shadow-sm"
            >
              + Thêm Ô trống
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {segments.map((seg, idx) => (
            <div key={idx} className="flex gap-3 group animate-in fade-in slide-in-from-left-2">
              {/* Actions */}
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleMoveSegment(idx, 'up')} className="p-1 hover:bg-[var(--color-surface-hover)] rounded text-[var(--color-text-muted)]">▲</button>
                <button onClick={() => handleMoveSegment(idx, 'down')} className="p-1 hover:bg-[var(--color-surface-hover)] rounded text-[var(--color-text-muted)]">▼</button>
              </div>

              {/* Content */}
              <div className={`flex-1 p-4 rounded-xl border transition-all ${seg.type === 'text' ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-[var(--color-accent)]/5 border-[var(--color-accent)]/20'}`}>
                <div className="flex justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${seg.type === 'text' ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-accent-light)]'}`}>
                    {seg.type === 'text' ? 'Văn bản' : `Ô trống #${idx + 1}`}
                  </span>
                  <button onClick={() => handleRemoveSegment(idx)} className="text-[var(--color-error)] opacity-30 hover:opacity-100 text-xs">Xóa</button>
                </div>

                {seg.type === 'text' ? (
                  <textarea
                    value={seg.content}
                    onChange={(e) => handleUpdateSegment(idx, { content: e.target.value })}
                    placeholder="Nhập nội dung văn bản..."
                    className="w-full bg-transparent outline-none text-sm resize-none min-h-[60px] leading-relaxed"
                  />
                ) : (
                  <input
                    type="text"
                    value={(seg.answers || []).join(' | ')}
                    onChange={(e) => handleAnswersChange(idx, e.target.value)}
                    placeholder="Nhập đáp án (Dùng | cho nhiều đáp án đúng)"
                    className="w-full bg-transparent outline-none text-sm font-bold text-[var(--color-accent-light)]"
                  />
                )}
              </div>
            </div>
          ))}

          {segments.length === 0 && (
            <div className="p-12 border-2 border-dashed border-[var(--color-border)] rounded-2xl text-center text-[var(--color-text-muted)]">
              Chưa có nội dung. Hãy bắt đầu bằng cách thêm <strong>Văn bản</strong> hoặc <strong>Ô trống</strong>.
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-[var(--color-surface-hover)] rounded-xl border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] leading-relaxed">
        <strong>Cách dùng:</strong> Tạo các khối văn bản và ô trống xen kẽ nhau. Trong ô trống, bạn có thể nhập nhiều đáp án đúng cách nhau bởi dấu <code>|</code>. Ví dụ: <code>Thủ đô | Ha Noi</code>
      </div>
    </div>
  );
}
