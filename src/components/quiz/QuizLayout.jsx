import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * QuizLayout - Main quiz-taking layout with sidebar + main content
 * 
 * Desktop: Sidebar (320px fixed) + Main Content (fluid)
 * Mobile: Main Content + Collapsible Bottom Navigator
 */
export function QuizLayout({
  children,
  sidebar,
  header,
  footer,
  mobileNav,
  mobileSheet,
  className = ''
}) {
  return (
    <div className={`quiz-layout ${className}`}>
      {header && (
        <header className="quiz-header">
          {header}
        </header>
      )}
      
      <div className="quiz-body">
        {/* Desktop Sidebar */}
        <aside className="quiz-sidebar-desktop">
          {sidebar}
        </aside>
        
        {/* Main Content Area */}
        <div className="quiz-main-wrapper">
          <main className="quiz-main-content">
            <div className="quiz-content-scroll-area">
              {children}
            </div>
          </main>
          
          {/* Fixed Footer Areas */}
          {footer && (
            <div className="quiz-footer-desktop desktop-only">
              {footer}
            </div>
          )}
          
          {mobileNav && (
            <div className="quiz-footer-mobile mobile-only">
              {mobileNav}
            </div>
          )}
        </div>
      </div>
      
      {mobileSheet && (
        <div className="quiz-mobile-sheet-container mobile-only">
          {mobileSheet}
        </div>
      )}
    </div>
  );
}

/**
 * QuizHeader - Sticky header for quiz screen
 */
export function QuizHeader({
  title,
  currentQuestion,
  totalQuestions,
  answeredCount,
  timer,
  onBack,
  showBackButton = true
}) {
  return (
    <div className="quiz-header-inner">
      <div className="quiz-header-left">
        {showBackButton && (
          <button
            onClick={onBack}
            className="quiz-header-back-btn"
            aria-label="Quay lại"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        )}
        <div className="quiz-header-title">
          <h1 className="text-gradient">{title || 'Làm bài thi'}</h1>
        </div>
      </div>
      
      <div className="quiz-header-center">
        {/* Progress indicator */}
        <div className="quiz-header-progress">
          <span className="quiz-header-counter">
            <span className="quiz-header-current">{currentQuestion}</span>
            <span className="quiz-header-separator">/</span>
            <span className="quiz-header-total">{totalQuestions}</span>
          </span>
          <span className="quiz-header-answered">
            {answeredCount} đã trả lời
          </span>
        </div>
      </div>
      
      <div className="quiz-header-right">
        {timer}
      </div>
    </div>
  );
}

/**
 * QuestionSidebar - Desktop sidebar with question navigation
 */
export function QuestionSidebar({
  totalQuestions,
  currentQuestion,
  answeredQuestions,
  flaggedQuestions = new Set(),
  onNavigate
}) {
  return (
    <div className="question-sidebar">
      {/* Header */}
      <div className="question-sidebar-header">
        <h2 className="question-sidebar-title">Điều hướng</h2>
        <div className="question-sidebar-stats">
          <span className="question-sidebar-answered">{answeredQuestions.size}</span>
          <span className="question-sidebar-separator">/</span>
          <span className="question-sidebar-total">{totalQuestions}</span>
        </div>
      </div>
      
      {/* Legend */}
      <div className="question-sidebar-legend">
        <div className="legend-item">
          <span className="legend-dot legend-dot-current"></span>
          <span className="legend-text">Hiện tại</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot legend-dot-answered"></span>
          <span className="legend-text">Đã trả lời</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot legend-dot-unanswered"></span>
          <span className="legend-text">Chưa trả lời</span>
        </div>
      </div>
      
      {/* Question Grid */}
      <div className="question-sidebar-grid">
        {Array.from({ length: totalQuestions }, (_, i) => {
          const isCurrent = i === currentQuestion;
          const isAnswered = answeredQuestions.has(i);
          
          return (
            <motion.button
              key={i}
              onClick={() => onNavigate(i)}
              className={`
                question-grid-item
                ${isCurrent ? 'question-grid-item-current' : ''}
                ${isAnswered && !isCurrent ? 'question-grid-item-answered' : ''}
                ${!isAnswered && !isCurrent ? 'question-grid-item-unanswered' : ''}
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Câu ${i + 1}${isAnswered ? ' (đã trả lời)' : ''}`}
            >
              {i + 1}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * MobileQuestionSheet - Collapsible bottom sheet for mobile navigation
 */
export function MobileQuestionSheet({
  totalQuestions,
  currentQuestion,
  answeredQuestions,
  onNavigate,
  isExpanded,
  onToggle
}) {
  return (
    <div className={`mobile-question-sheet mobile-only ${isExpanded ? 'mobile-question-sheet-expanded' : ''}`}>
      {/* Toggle Handle */}
      <button
        onClick={onToggle}
        className="mobile-question-sheet-toggle"
        aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
      >
        <div className="mobile-question-sheet-progress">
          <span className="mobile-question-sheet-current">{currentQuestion + 1}</span>
          <span className="mobile-question-sheet-sep">/</span>
          <span className="mobile-question-sheet-total">{totalQuestions}</span>
        </div>
        <div className="mobile-question-sheet-label">
          <span>{answeredQuestions.size} đã trả lời</span>
          <svg 
            className={`mobile-question-sheet-icon ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </div>
      </button>
      
      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="mobile-question-sheet-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="mobile-question-sheet-legend">
              <div className="mobile-legend-item">
                <span className="mobile-legend-dot current"></span>
                <span>Đang làm</span>
              </div>
              <div className="mobile-legend-item">
                <span className="mobile-legend-dot answered"></span>
                <span>Đã làm</span>
              </div>
              <div className="mobile-legend-item">
                <span className="mobile-legend-dot unanswered"></span>
                <span>Chưa làm</span>
              </div>
            </div>

            <div className="mobile-question-grid-container">
              <div className="mobile-question-grid">
                {Array.from({ length: totalQuestions }, (_, i) => {
                  const isCurrent = i === currentQuestion;
                  const isAnswered = answeredQuestions.has(i);
                  
                  return (
                    <motion.button
                      key={i}
                      onClick={() => {
                        onNavigate(i);
                        onToggle();
                      }}
                      className={`
                        question-grid-item
                        ${isCurrent ? 'question-grid-item-current' : ''}
                        ${isAnswered && !isCurrent ? 'question-grid-item-answered' : ''}
                        ${!isAnswered && !isCurrent ? 'question-grid-item-unanswered' : ''}
                      `}
                      whileTap={{ scale: 0.9 }}
                    >
                      {i + 1}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * BottomNavigation - Sticky bottom navigation for quiz
 */
export function BottomNavigation({
  onPrev,
  onNext,
  onSubmit,
  isFirst,
  isLast,
  canSubmit,
  submitLabel = 'Nộp bài',
  className = ''
}) {
  return (
    <div className={`quiz-bottom-nav desktop-only ${className}`}>
      <div className="quiz-bottom-nav-inner">
        <motion.button
          onClick={onPrev}
          disabled={isFirst}
          className={`
            quiz-nav-btn quiz-nav-btn-secondary
            ${isFirst ? 'quiz-nav-btn-disabled' : ''}
          `}
          whileTap={isFirst ? {} : { scale: 0.98 }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Câu trước</span>
        </motion.button>

        {isLast ? (
          <motion.button
            onClick={onSubmit}
            disabled={!canSubmit}
            className={`
              quiz-nav-btn quiz-nav-btn-success
              ${!canSubmit ? 'quiz-nav-btn-disabled' : ''}
            `}
            whileTap={canSubmit ? { scale: 0.98 } : {}}
          >
            <span>{submitLabel}</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </motion.button>
        ) : (
          <motion.button
            onClick={onNext}
            className="quiz-nav-btn quiz-nav-btn-primary"
            whileTap={{ scale: 0.98 }}
          >
            <span>Câu tiếp</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        )}
      </div>
    </div>
  );
}

/**
 * MobileNavigation - Always-visible prev/next navigation for mobile
 */
export function MobileNavigation({
  onPrev,
  onNext,
  onSubmit,
  isFirst,
  isLast,
  canSubmit,
  currentQuestion,
  totalQuestions,
  submitLabel = 'Nộp bài'
}) {
  return (
    <div className="quiz-mobile-nav mobile-only">
      <div className="quiz-mobile-nav-inner">
        <motion.button
          onClick={onPrev}
          disabled={isFirst}
          className="quiz-mobile-nav-btn quiz-mobile-nav-btn-prev"
          whileTap={isFirst ? {} : { scale: 0.96 }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Trước</span>
        </motion.button>

        <div className="quiz-mobile-nav-center">
          <div className="quiz-mobile-nav-progress">
            <span className="quiz-mobile-nav-current">{currentQuestion}</span>
            <span>/</span>
            <span>{totalQuestions}</span>
          </div>
        </div>

        {isLast ? (
          <motion.button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="quiz-mobile-nav-btn quiz-mobile-nav-btn-submit"
            whileTap={canSubmit ? { scale: 0.96 } : {}}
          >
            <span>{submitLabel}</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.button>
        ) : (
          <motion.button
            onClick={onNext}
            className="quiz-mobile-nav-btn quiz-mobile-nav-btn-next"
            whileTap={{ scale: 0.96 }}
          >
            <span>Tiếp</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        )}
      </div>
    </div>
  );
}

/**
 * QuizTimer - Timer display for header
 */
export function QuizTimer({ minutes, seconds, isLow = false }) {
  return (
    <div className={`quiz-timer ${isLow ? 'quiz-timer-low' : ''}`}>
      <div className="quiz-timer-dot"></div>
      <span className="quiz-timer-text">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
