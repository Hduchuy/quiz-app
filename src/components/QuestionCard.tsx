import React, { useState } from 'react';
import { Bookmark, Check, X, HelpCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { Question, UserAnswerRecord } from '../types/quiz';

interface QuestionCardProps {
  question: Question;
  userAnswer?: UserAnswerRecord;
  onAnswerChange: (newRecord: UserAnswerRecord) => void;
  showResult?: boolean;
  autoShowAnswer?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  questionIndex?: number;
  totalQuestions?: number;
  readOnly?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  userAnswer,
  onAnswerChange,
  showResult = false,
  autoShowAnswer = false,
  isBookmarked = false,
  onToggleBookmark,
  questionIndex,
  totalQuestions,
  readOnly = false
}) => {
  // Mobile / touch selection state for matching questions
  const [selectedPoolItem, setSelectedPoolItem] = useState<string | null>(null);

  const getOptionLetter = (idx: number) => String.fromCharCode(65 + idx);

  // Check completion states for auto-showing answers
  const isSingleComplete = question.type === 'single' && userAnswer?.selectedSingle !== undefined;

  const requiredMulti = question.correctAnswers?.length || 2;
  const isMultipleComplete =
    question.type === 'multiple' && (userAnswer?.selectedMultiple || []).length >= requiredMulti;

  const totalStmts = question.statements?.length || 0;
  const answeredStmtsCount = question.statements
    ? Object.keys(userAnswer?.selectedTrueFalse || {}).length
    : 0;
  const isTFAllComplete = question.type === 'true_false' && totalStmts > 0 && answeredStmtsCount >= totalStmts;

  const totalCatItems = question.matchingData?.allItems?.length || 0;
  const isCategoriesComplete =
    question.matchingData?.matchingType === 'categories' &&
    totalCatItems > 0 &&
    Object.keys(userAnswer?.selectedMatching || {}).length >= totalCatItems;

  const totalPairs = question.matchingData?.pairs?.length || 0;
  const isPairsComplete =
    question.matchingData?.matchingType === 'pairs' &&
    totalPairs > 0 &&
    Object.keys(userAnswer?.selectedMatching || {}).length >= totalPairs;

  // Granular display flags
  const showSingleResult = showResult || (autoShowAnswer && isSingleComplete);
  const showMultipleResult = showResult || (autoShowAnswer && isMultipleComplete);
  const showCategoriesResult = showResult || (autoShowAnswer && isCategoriesComplete);
  const showPairsResult = showResult || (autoShowAnswer && isPairsComplete);

  const isShowingOverallResult =
    showResult ||
    (autoShowAnswer &&
      (isSingleComplete ||
        isMultipleComplete ||
        isTFAllComplete ||
        isCategoriesComplete ||
        isPairsComplete));

  // 1. Single Choice Handlers
  const handleSingleSelect = (optionIdx: number) => {
    if (readOnly) return;
    const isCorrect = question.correctAnswers?.includes(optionIdx) ?? false;
    onAnswerChange({
      questionId: question.id,
      type: 'single',
      selectedSingle: optionIdx,
      isCorrect,
      score: isCorrect ? 1 : 0,
      answeredAt: new Date().toISOString()
    });
  };

  // 2. Multiple Choice Handlers
  const handleMultipleToggle = (optionIdx: number) => {
    if (readOnly) return;
    const current = userAnswer?.selectedMultiple || [];
    const maxAllowed = question.correctAnswers?.length || 2;
    let next: number[];

    if (current.includes(optionIdx)) {
      next = current.filter(i => i !== optionIdx);
    } else {
      if (current.length >= maxAllowed) {
        // Replace oldest or prevent
        next = [...current.slice(1), optionIdx];
      } else {
        next = [...current, optionIdx];
      }
    }

    const expected = question.correctAnswers || [];
    const isCorrect =
      next.length === expected.length &&
      expected.every(val => next.includes(val));
    
    // Partial score calculation
    const correctCount = next.filter(val => expected.includes(val)).length;
    const score = expected.length > 0 ? correctCount / expected.length : 0;

    onAnswerChange({
      questionId: question.id,
      type: 'multiple',
      selectedMultiple: next,
      isCorrect,
      score,
      answeredAt: new Date().toISOString()
    });
  };

  // 3. True / False Handlers
  const handleTrueFalseSelect = (statementId: string, value: boolean) => {
    if (readOnly) return;
    const current = { ...(userAnswer?.selectedTrueFalse || {}) };
    current[statementId] = value;

    const stmts = question.statements || [];
    let correctStmts = 0;
    stmts.forEach(s => {
      if (current[s.id] === s.correctAnswer) {
        correctStmts++;
      }
    });

    const isCorrect = correctStmts === stmts.length && Object.keys(current).length === stmts.length;
    const score = stmts.length > 0 ? correctStmts / stmts.length : 0;

    onAnswerChange({
      questionId: question.id,
      type: 'true_false',
      selectedTrueFalse: current,
      isCorrect,
      score,
      answeredAt: new Date().toISOString()
    });
  };

  // 4A. Matching Categories Handlers
  const handleCategoryAssign = (itemText: string, categoryId: string) => {
    if (readOnly) return;
    const current = { ...(userAnswer?.selectedMatching || {}) };
    current[itemText] = categoryId;

    // Check correctness
    const categories = question.matchingData?.categories || [];
    let totalItems = 0;
    let correctCount = 0;

    categories.forEach(cat => {
      cat.items.forEach(it => {
        totalItems++;
        if (current[it] === cat.id) {
          correctCount++;
        }
      });
    });

    const isCorrect = correctCount === totalItems;
    const score = totalItems > 0 ? correctCount / totalItems : 0;

    onAnswerChange({
      questionId: question.id,
      type: 'matching',
      selectedMatching: current,
      isCorrect,
      score,
      answeredAt: new Date().toISOString()
    });
    setSelectedPoolItem(null);
  };

  const handleCategoryRemoveItem = (itemText: string) => {
    if (readOnly) return;
    const current = { ...(userAnswer?.selectedMatching || {}) };
    delete current[itemText];

    const categories = question.matchingData?.categories || [];
    let totalItems = 0;
    let correctCount = 0;
    categories.forEach(cat => {
      cat.items.forEach(it => {
        totalItems++;
        if (current[it] === cat.id) correctCount++;
      });
    });

    const isCorrect = correctCount === totalItems;
    const score = totalItems > 0 ? correctCount / totalItems : 0;

    onAnswerChange({
      questionId: question.id,
      type: 'matching',
      selectedMatching: current,
      isCorrect,
      score,
      answeredAt: new Date().toISOString()
    });
  };

  // 4B. Matching Pairs Handlers
  const handlePairAssign = (pairId: string, targetValue: string) => {
    if (readOnly) return;
    const current = { ...(userAnswer?.selectedMatching || {}) };
    current[pairId] = targetValue;

    const pairs = question.matchingData?.pairs || [];
    let correctCount = 0;
    pairs.forEach(p => {
      if (current[p.id] === p.target) {
        correctCount++;
      }
    });

    const isCorrect = correctCount === pairs.length && Object.keys(current).length === pairs.length;
    const score = pairs.length > 0 ? correctCount / pairs.length : 0;

    onAnswerChange({
      questionId: question.id,
      type: 'matching',
      selectedMatching: current,
      isCorrect,
      score,
      answeredAt: new Date().toISOString()
    });
    setSelectedPoolItem(null);
  };

  const handlePairReset = (pairId: string) => {
    if (readOnly) return;
    const current = { ...(userAnswer?.selectedMatching || {}) };
    delete current[pairId];

    const pairs = question.matchingData?.pairs || [];
    let correctCount = 0;
    pairs.forEach(p => {
      if (current[p.id] === p.target) correctCount++;
    });

    const isCorrect = correctCount === pairs.length && Object.keys(current).length === pairs.length;
    const score = pairs.length > 0 ? correctCount / pairs.length : 0;

    onAnswerChange({
      questionId: question.id,
      type: 'matching',
      selectedMatching: current,
      isCorrect,
      score,
      answeredAt: new Date().toISOString()
    });
  };

  const getTypeBadge = () => {
    switch (question.type) {
      case 'single':
        return <span className="badge badge-primary">Chọn 1 đáp án</span>;
      case 'multiple':
        return <span className="badge badge-warning">Chọn {question.correctAnswers?.length || 2} đáp án</span>;
      case 'true_false':
        return <span className="badge badge-neutral">Đúng / Sai</span>;
      case 'matching':
        return <span className="badge" style={{ backgroundColor: 'var(--accent-purple-light)', color: 'var(--accent-purple)', border: '1px solid var(--accent-purple-light)' }}>Ghép nối / Phân loại</span>;
    }
  };

  return (
    <div className="card" style={{ position: 'relative' }}>
      {/* Question Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: 10, 
        gap: 8,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, fontSize: '0.975rem', color: 'var(--text-primary)' }}>
            {questionIndex !== undefined ? `Câu ${questionIndex + 1}` : `Câu ${question.questionNumber}`}
            {totalQuestions ? ` / ${totalQuestions}` : ''}
          </span>
          {getTypeBadge()}
          <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
            {question.topicTitle.split(':')[0]}
          </span>
        </div>

        {onToggleBookmark && (
          <button
            onClick={onToggleBookmark}
            title={isBookmarked ? 'Bỏ đánh dấu' : 'Đánh dấu câu hỏi cần xem lại'}
            aria-label="Đánh dấu câu khó"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isBookmarked ? '#f59e0b' : 'var(--text-subtle)',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 'var(--radius-sm)',
              transition: 'all 0.15s ease'
            }}
          >
            <Bookmark size={18} fill={isBookmarked ? '#f59e0b' : 'none'} />
          </button>
        )}
      </div>

      {/* Question Text */}
      <div style={{ 
        fontSize: '0.975rem', 
        fontWeight: 600, 
        color: 'var(--text-primary)', 
        marginBottom: 14, 
        lineHeight: 1.55,
        wordBreak: 'break-word'
      }}>
        {question.questionText}
      </div>

      {/* ================= TYPE 1: SINGLE CHOICE ================= */}
      {question.type === 'single' && question.options && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {question.options.map((opt, idx) => {
            const isSelected = userAnswer?.selectedSingle === idx;
            const isCorrectAnswer = question.correctAnswers?.includes(idx);
            
            let itemClass = 'option-item';
            if (showSingleResult) {
              if (isCorrectAnswer) itemClass += ' correct';
              else if (isSelected) itemClass += ' incorrect';
            } else if (isSelected) {
              itemClass += ' selected';
            }
            if (readOnly) itemClass += ' disabled';

            return (
              <div
                key={idx}
                className={itemClass}
                onClick={() => handleSingleSelect(idx)}
              >
                <div className="option-indicator">
                  {showSingleResult ? (
                    isCorrectAnswer ? <Check size={14} /> : isSelected ? <X size={14} /> : getOptionLetter(idx)
                  ) : (
                    getOptionLetter(idx)
                  )}
                </div>
                <div style={{ flex: 1, fontSize: '0.95rem', lineHeight: 1.5 }}>{opt}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= TYPE 2: MULTIPLE CHOICE ================= */}
      {question.type === 'multiple' && question.options && (
        <div>
          <div style={{ 
            fontSize: '0.8rem', 
            color: 'var(--text-muted)', 
            marginBottom: 8,
            fontWeight: 600 
          }}>
            {`Đã chọn: ${(userAnswer?.selectedMultiple || []).length} / ${question.correctAnswers?.length || 2} phương án (Cần chọn đủ ${question.correctAnswers?.length || 2})`}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {question.options.map((opt, idx) => {
              const isSelected = (userAnswer?.selectedMultiple || []).includes(idx);
              const isCorrectAnswer = question.correctAnswers?.includes(idx);

              let itemClass = 'option-item';
              if (showMultipleResult) {
                if (isCorrectAnswer) itemClass += ' correct';
                else if (isSelected) itemClass += ' incorrect';
              } else if (isSelected) {
                itemClass += ' selected';
              }
              if (readOnly) itemClass += ' disabled';

              return (
                <div
                  key={idx}
                  className={itemClass}
                  onClick={() => handleMultipleToggle(idx)}
                >
                  <div className="option-indicator option-indicator-square">
                    {showMultipleResult ? (
                      isCorrectAnswer ? <Check size={14} /> : isSelected ? <X size={14} /> : getOptionLetter(idx)
                    ) : (
                      isSelected ? <Check size={14} /> : getOptionLetter(idx)
                    )}
                  </div>
                  <div style={{ flex: 1, fontSize: '0.95rem', lineHeight: 1.5 }}>{opt}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TYPE 3: TRUE / FALSE ================= */}
      {question.type === 'true_false' && question.statements && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {question.statements.map(stmt => {
            const userChoice = userAnswer?.selectedTrueFalse?.[stmt.id];
            const isStmtAnswered = userChoice !== undefined;
            const showThisStmtResult = showResult || (autoShowAnswer && isStmtAnswered);

            return (
              <div key={stmt.id} className="tf-statement-card">
                <div className="tf-statement-text">{stmt.text}</div>
                <div className="tf-actions">
                  <button
                    className={`tf-btn ${
                      showThisStmtResult
                        ? stmt.correctAnswer === true
                          ? 'correct-pill'
                          : userChoice === true
                          ? 'incorrect-pill'
                          : ''
                        : userChoice === true
                        ? 'selected-true'
                        : ''
                    }`}
                    onClick={() => handleTrueFalseSelect(stmt.id, true)}
                    disabled={readOnly}
                  >
                    {showThisStmtResult ? (
                      stmt.correctAnswer === true ? <Check size={14} /> : userChoice === true ? <X size={14} /> : null
                    ) : userChoice === true ? (
                      <Check size={14} />
                    ) : null}
                    <span>Đúng</span>
                  </button>

                  <button
                    className={`tf-btn ${
                      showThisStmtResult
                        ? stmt.correctAnswer === false
                          ? 'correct-pill'
                          : userChoice === false
                          ? 'incorrect-pill'
                          : ''
                        : userChoice === false
                        ? 'selected-false'
                        : ''
                    }`}
                    onClick={() => handleTrueFalseSelect(stmt.id, false)}
                    disabled={readOnly}
                  >
                    {showThisStmtResult ? (
                      stmt.correctAnswer === false ? <Check size={14} /> : userChoice === false ? <X size={14} /> : null
                    ) : userChoice === false ? (
                      <Check size={14} />
                    ) : null}
                    <span>Sai</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= TYPE 4: MATCHING / CATEGORIZATION ================= */}
      {question.type === 'matching' && question.matchingData && (
        <div>
          {/* Subtype 4A: CATEGORIES */}
          {question.matchingData.matchingType === 'categories' && question.matchingData.categories && (
            <div>
              {/* Pool of items to drag/assign */}
              {!showCategoriesResult && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                    Các mục cần phân loại (Bấm chọn một thẻ bên dưới rồi bấm vào cột tương ứng):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {question.matchingData.allItems?.map((item, idx) => {
                      const isAssigned = Object.keys(userAnswer?.selectedMatching || {}).includes(item);
                      const isSelected = selectedPoolItem === item;

                      if (isAssigned) return null;

                      return (
                        <div
                          key={idx}
                          draggable={!readOnly}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', item);
                          }}
                          onClick={() => {
                            if (!readOnly) {
                              setSelectedPoolItem(isSelected ? null : item);
                            }
                          }}
                          className={`matching-card ${isSelected ? 'active-match' : ''}`}
                          style={{
                            padding: '8px 14px',
                            cursor: readOnly ? 'default' : 'pointer'
                          }}
                        >
                          <span>{item}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Columns for each category */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))`,
                gap: 14
              }}>
                {question.matchingData.categories.map(cat => {
                  const assignedItems = Object.entries(userAnswer?.selectedMatching || {})
                    .filter(([_, catId]) => catId === cat.id)
                    .map(([itemText]) => itemText);

                  return (
                    <div
                      key={cat.id}
                      className="category-dropzone"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const itemText = e.dataTransfer.getData('text/plain');
                        if (itemText) handleCategoryAssign(itemText, cat.id);
                      }}
                      onClick={() => {
                        if (selectedPoolItem) {
                          handleCategoryAssign(selectedPoolItem, cat.id);
                        }
                      }}
                    >
                      <div style={{
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: 'var(--text-primary)',
                        paddingBottom: 6,
                        borderBottom: '1px solid var(--border-color)'
                      }}>
                        {cat.name}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                        {assignedItems.length === 0 && (
                          <div style={{ 
                            fontSize: '0.8rem', 
                            color: 'var(--text-subtle)', 
                            fontStyle: 'italic', 
                            padding: '12px 0', 
                            textAlign: 'center' 
                          }}>
                            {selectedPoolItem ? 'Nhấn để đưa thẻ vào đây' : 'Thả hoặc chạm thẻ vào đây'}
                          </div>
                        )}

                        {assignedItems.map((item, idx) => {
                          const isCorrect = cat.items.includes(item);
                          let chipBg = 'var(--bg-card)';
                          let chipColor = 'var(--text-primary)';
                          let chipBorder = '1px solid var(--border-color)';

                          if (showCategoriesResult) {
                            if (isCorrect) {
                              chipBg = 'var(--success-light)';
                              chipColor = 'var(--success-text)';
                              chipBorder = '1px solid var(--success-border)';
                            } else {
                              chipBg = 'var(--danger-light)';
                              chipColor = 'var(--danger-text)';
                              chipBorder = '1px solid var(--danger-border)';
                            }
                          }

                          return (
                            <div
                              key={idx}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 6,
                                backgroundColor: chipBg,
                                color: chipColor,
                                border: chipBorder,
                                fontSize: '0.825rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 6
                              }}
                            >
                              <span>{item}</span>
                              {!readOnly && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCategoryRemoveItem(item);
                                  }}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    color: 'var(--text-subtle)',
                                    cursor: 'pointer',
                                    padding: 2
                                  }}
                                  aria-label="Gỡ mục"
                                >
                                  <X size={14} />
                                </button>
                              )}
                              {showCategoriesResult && (
                                isCorrect ? <Check size={14} color="var(--success)" /> : <X size={14} color="var(--danger)" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* When showing result: also show missing items that should have been here */}
                      {showCategoriesResult && (
                        <div style={{ 
                          marginTop: 10, 
                          paddingTop: 8, 
                          borderTop: '1px dashed var(--border-subtle)', 
                          fontSize: '0.775rem' 
                        }}>
                          <span style={{ fontWeight: 600, color: 'var(--success)' }}>Đáp án chuẩn của cột:</span>
                          <ul style={{ paddingLeft: 16, marginTop: 4, color: 'var(--text-secondary)' }}>
                            {cat.items.map((it, i) => (
                              <li key={i}>{it}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Subtype 4B: PAIRS MATCHING */}
          {question.matchingData.matchingType === 'pairs' && question.matchingData.pairs && (
            <div>
              {/* Pool of target chips */}
              {!showPairsResult && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                    Các khái niệm / đáp án cần ghép (Chọn một thẻ bên dưới rồi bấm vị trí cần ghép):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {question.matchingData.allTargets?.map((target, idx) => {
                      const isSelected = selectedPoolItem === target;
                      const isUsed = Object.values(userAnswer?.selectedMatching || {}).includes(target);

                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedPoolItem(isSelected ? null : target)}
                          className={`matching-card ${isSelected ? 'active-match' : ''}`}
                          style={{
                            padding: '8px 14px',
                            opacity: isUsed ? 0.45 : 1,
                            borderStyle: isUsed ? 'dashed' : 'solid'
                          }}
                          disabled={readOnly}
                        >
                          <span>{target}</span>
                          {isUsed && <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>(Đã dùng)</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* List of source items with drop targets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {question.matchingData.pairs.map((pair) => {
                  const assignedTarget = userAnswer?.selectedMatching?.[pair.id];
                  const isCorrect = assignedTarget === pair.target;

                  return (
                    <div
                      key={pair.id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-card)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                      }}
                    >
                      <div style={{ fontSize: '0.925rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {pair.prompt}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Ghép với:</span>

                        {assignedTarget ? (
                          <div
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              backgroundColor: showPairsResult
                                ? isCorrect ? 'var(--success-light)' : 'var(--danger-light)'
                                : 'var(--primary-light)',
                              color: showPairsResult
                                ? isCorrect ? 'var(--success-text)' : 'var(--danger-text)'
                                : 'var(--primary-text)',
                              border: showPairsResult
                                ? isCorrect ? '1px solid var(--success-border)' : '1px solid var(--danger-border)'
                                : '1px solid var(--primary-border)',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8
                            }}
                          >
                            <span>{assignedTarget}</span>
                            {!readOnly && (
                              <button
                                onClick={() => handlePairReset(pair.id)}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-subtle)' }}
                                aria-label="Gỡ ghép nối"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (selectedPoolItem) {
                                handlePairAssign(pair.id, selectedPoolItem);
                              }
                            }}
                            disabled={readOnly}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 6,
                              border: '1.5px dashed var(--border-subtle)',
                              backgroundColor: selectedPoolItem ? 'var(--primary-light)' : 'var(--bg-card-subtle)',
                              color: selectedPoolItem ? 'var(--primary)' : 'var(--text-subtle)',
                              fontSize: '0.85rem',
                              cursor: selectedPoolItem ? 'pointer' : 'default',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            {selectedPoolItem ? 'Nhấn để gán thẻ đã chọn' : 'Chưa ghép'}
                          </button>
                        )}
                      </div>

                      {showPairsResult && !isCorrect && (
                        <div style={{ fontSize: '0.825rem', color: 'var(--success)', fontWeight: 600, marginTop: 2 }}>
                          Đáp án đúng: {pair.target}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result & Explanation Feedback Banner */}
      {isShowingOverallResult && (
        <div style={{
          marginTop: 14,
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: userAnswer?.isCorrect ? 'var(--success-light)' : 'var(--warning-light)',
          border: `1.5px solid ${userAnswer?.isCorrect ? 'var(--success-border)' : 'var(--warning-border)'}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 700,
            fontSize: '0.9rem',
            color: userAnswer?.isCorrect ? 'var(--success-text)' : 'var(--warning-text)'
          }}>
            {userAnswer?.isCorrect ? (
              <>
                <Check size={16} color="var(--success)" />
                <span>Chính xác! (+{(userAnswer.score ?? 1).toFixed(1)} điểm)</span>
              </>
            ) : (
              <>
                <X size={16} color="var(--danger)" />
                <span>Chưa chính xác (Điểm: {(userAnswer?.score ?? 0).toFixed(1)})</span>
              </>
            )}
          </div>

          {question.explanation && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Giải thích: </strong>
              {question.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
