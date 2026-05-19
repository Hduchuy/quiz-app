import React, { useState } from 'react';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  DragOverlay,
  closestCorners
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const DraggableAnswer = React.memo(({ id, text, disabled }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled
  });
  
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: disabled ? 'default' : 'grab',
    touchAction: 'none'
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`matching-draggable-item ${isDragging ? 'is-dragging' : ''} ${disabled ? 'is-disabled' : ''}`}
    >
      {text}
    </div>
  );
});

const DroppableSlot = React.memo(({ id, targetText, answersInSlot, disabled, showResult, isCorrect }) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    disabled
  });

  let statusClass = '';
  if (showResult) {
    statusClass = isCorrect ? 'is-correct' : 'is-wrong';
  } else if (isOver) {
    statusClass = 'is-hover';
  } else if (answersInSlot && answersInSlot.length > 0) {
    statusClass = 'is-filled';
  } else {
    statusClass = 'is-empty';
  }

  return (
    <div className="matching-target-row">
      <div className="matching-target-label font-medium">{targetText}</div>
      <div 
        ref={setNodeRef} 
        className={`matching-dropzone flex-wrap gap-2 ${statusClass}`}
        style={{ display: 'flex', minHeight: '48px', padding: '8px' }}
      >
        {answersInSlot && answersInSlot.length > 0 ? (
          answersInSlot.map(ans => (
            <DraggableAnswer key={ans.id} id={ans.id} text={ans.text} disabled={disabled} />
          ))
        ) : (
          <span className="dropzone-placeholder text-sm opacity-50 m-auto">Kéo thả vào đây</span>
        )}
      </div>
    </div>
  );
});

const DroppablePool = React.memo(({ id, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div 
      ref={setNodeRef} 
      className={`matching-pool-area flex flex-wrap gap-3 p-4 min-h-[80px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl ${isOver ? 'border-[var(--color-accent)] bg-[rgba(124,58,237,0.05)]' : ''}`}
    >
      {children}
    </div>
  );
});

export function DragDropMatch({ 
  question, 
  userAnswers, // Object: { targetId: [answerId1, answerId2] }
  onSelectMatching, 
  showResult, 
  disabled,
  showAnswers
}) {
  const [activeId, setActiveId] = useState(null);

  // If showing correct answers, use the correctMatches from the question
  const currentAnswers = showAnswers ? (question.correctMatches || {}) : (userAnswers || {});

  const activeItem = activeId 
    ? (question.shuffledAnswers || []).find(a => a.id === activeId) 
    : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragStart = (event) => {
    if (disabled) return;
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (disabled) return;

    if (over) {
      const overId = over.id; // Either a target slot id or 'pool'
      const draggedAnswerId = active.id;
      
      onSelectMatching(overId, draggedAnswerId);
    }
  };

  // Find all mapped answer IDs
  const mappedAnswerIds = Object.values(currentAnswers).flat();

  // Determine which answers are in the pool
  const answersInPool = (question.shuffledAnswers || []).filter(
    a => !mappedAnswerIds.includes(a.id)
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-6 mt-4">
        
        {/* Top: Answer Pool */}
        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Ngân hàng đáp án</div>
          <DroppablePool id="pool">
            {answersInPool.map(answer => (
              <DraggableAnswer 
                key={answer.id} 
                id={answer.id} 
                text={answer.text} 
                disabled={disabled}
              />
            ))}
            {answersInPool.length === 0 && (
              <div className="text-sm italic opacity-50 m-auto">Tất cả đáp án đã được kéo thả</div>
            )}
          </DroppablePool>
        </div>

        {/* Bottom: Target Slots */}
        <div className="flex flex-col gap-3">
          <div className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Vùng đích</div>
          {(question.targets || []).map(target => {
            const answerIdsInSlot = currentAnswers[target.id] || [];
            const answersInSlot = answerIdsInSlot.map(aId => 
              (question.shuffledAnswers || []).find(a => a.id === aId)
            ).filter(Boolean);
            
            // Check if correct
            let isCorrect = false;
            if (showResult) {
              const matches = question.correctMatches || {};
              const correctAnswers = matches[target.id] || [];
              const sortedUser = [...answerIdsInSlot].sort();
              const sortedCorrect = [...correctAnswers].sort();
              isCorrect = JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
            }

            return (
              <DroppableSlot
                key={target.id}
                id={target.id}
                targetText={target.text}
                answersInSlot={answersInSlot}
                disabled={disabled}
                showResult={showResult}
                isCorrect={isCorrect}
              />
            );
          })}
        </div>
        
        <DragOverlay zIndex={1000}>
          {activeItem ? (
            <div className="matching-draggable-item is-dragging-overlay shadow-xl scale-105">
              {activeItem.text}
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
