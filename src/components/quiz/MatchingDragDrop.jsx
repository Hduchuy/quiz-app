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

// Draggable Item Component
function DraggableAnswer({ id, text, disabled }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled
  });
  
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: disabled ? 'default' : 'grab',
    touchAction: 'none' // Important for touch devices
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
}

// Droppable Zone Component
function DroppableSlot({ id, targetText, answer, disabled, showResult, isCorrect }) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    disabled
  });

  let statusClass = '';
  if (showResult) {
    statusClass = isCorrect ? 'is-correct' : 'is-wrong';
  } else if (isOver) {
    statusClass = 'is-hover';
  } else if (answer) {
    statusClass = 'is-filled';
  } else {
    statusClass = 'is-empty';
  }

  return (
    <div className="matching-target-row">
      <div className="matching-target-label">{targetText}</div>
      <div 
        ref={setNodeRef} 
        className={`matching-dropzone ${statusClass}`}
      >
        {answer ? (
          <DraggableAnswer id={answer.id} text={answer.text} disabled={disabled} />
        ) : (
          <span className="dropzone-placeholder">Kéo và thả đáp án vào đây</span>
        )}
      </div>
    </div>
  );
}

// Droppable area for the pool
function DroppablePool({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div 
      ref={setNodeRef} 
      className={`matching-pool-area ${isOver ? 'is-over' : ''}`}
    >
      {children}
    </div>
  );
}

export function MatchingDragDrop({ 
  question, 
  userAnswers, // Object: { targetId: answerId }
  onSelectMatching, 
  showResult, 
  disabled 
}) {
  const [activeId, setActiveId] = useState(null);

  // Default state for userAnswers if empty
  const currentAnswers = userAnswers || {};

  // Find the active dragging item text
  const activeItem = activeId 
    ? (question.shuffledAnswers || []).find(a => a.id === activeId) 
    : null;

  // Set up sensors for mouse and touch
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (disabled) return;

    if (over) {
      const overId = over.id; // Either a target slot id or 'pool'
      const draggedAnswerId = active.id;
      
      // Handle the swap logic or placement logic
      onSelectMatching(overId, draggedAnswerId);
    }
  };

  // Determine which answers are in the pool
  const answersInPool = (question.shuffledAnswers || []).filter(
    a => !Object.values(currentAnswers).includes(a.id)
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="matching-quiz-container">
        
        {/* Top: Answer Pool */}
        <div className="matching-pool-section">
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
              <div className="matching-pool-empty">Tất cả đáp án đã được ghép</div>
            )}
          </DroppablePool>
        </div>

        {/* Bottom: Target Slots */}
        <div className="matching-targets-section">
          {(question.matches || []).map(match => {
            const answerIdInSlot = currentAnswers[match.targetId];
            const answerObj = answerIdInSlot 
              ? (question.shuffledAnswers || []).find(a => a.id === answerIdInSlot)
              : null;
            
            // For results, check if answerId in slot matches correct answerId
            const isCorrect = answerIdInSlot === match.answerId;

            return (
              <DroppableSlot
                key={match.targetId}
                id={match.targetId}
                targetText={match.targetText}
                answer={answerObj}
                disabled={disabled}
                showResult={showResult}
                isCorrect={isCorrect}
              />
            );
          })}
        </div>
        
        <DragOverlay zIndex={1000}>
          {activeItem ? (
            <div className="matching-draggable-item is-dragging-overlay">
              {activeItem.text}
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
