import React, { useState } from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  FileText, 
  Database, 
  Edit2, 
  Check, 
  Sun, 
  Moon, 
  Monitor 
} from 'lucide-react';
import { CourseData } from '../types/quiz';
import { ThemeMode } from '../utils/theme';

interface NavbarProps {
  currentView: 'home' | 'practice' | 'exam' | 'bank' | 'result';
  setCurrentView: (view: 'home' | 'practice' | 'exam' | 'bank') => void;
  courseData: CourseData;
  onUpdateCourseName: (name: string) => void;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  courseData,
  onUpdateCourseName,
  themeMode,
  onThemeChange
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(courseData.name);

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      onUpdateCourseName(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand & Course Title */}
        <div className="navbar-brand" onClick={() => setCurrentView('home')}>
          <div className="brand-icon">
            <GraduationCap size={22} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {isEditingTitle ? (
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: 6 }} 
                onClick={e => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={tempTitle}
                  onChange={e => setTempTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveTitle()}
                  autoFocus
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    borderRadius: 6,
                    border: '1.5px solid var(--primary)',
                    outline: 'none',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-primary)'
                  }}
                />
                <button
                  onClick={handleSaveTitle}
                  aria-label="Lưu tên môn học"
                  style={{
                    padding: '5px 8px',
                    background: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ 
                  fontSize: '1.05rem', 
                  fontWeight: 800, 
                  color: 'var(--text-primary)',
                  maxWidth: '360px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {courseData.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTempTitle(courseData.name);
                    setIsEditingTitle(true);
                  }}
                  title="Đổi tên môn học"
                  aria-label="Đổi tên môn học"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 2,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Edit2 size={13} />
                </button>
              </div>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Ôn thi trắc nghiệm cá nhân
            </span>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="navbar-nav">
          <button
            className={`nav-btn ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentView('home')}
          >
            <BookOpen size={16} />
            <span>Tổng quan</span>
          </button>

          <button
            className={`nav-btn ${currentView === 'practice' ? 'active' : ''}`}
            onClick={() => setCurrentView('practice')}
          >
            <FileText size={16} />
            <span>Luyện tập</span>
          </button>

          <button
            className={`nav-btn ${currentView === 'exam' || currentView === 'result' ? 'active' : ''}`}
            onClick={() => setCurrentView('exam')}
          >
            <GraduationCap size={16} />
            <span>Thi thử</span>
          </button>

          <button
            className={`nav-btn ${currentView === 'bank' ? 'active' : ''}`}
            onClick={() => setCurrentView('bank')}
          >
            <Database size={16} />
            <span>Ngân hàng</span>
          </button>
        </nav>

        {/* Right Section: Theme Toggle Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="theme-toggle-group" role="group" aria-label="Lựa chọn giao diện sáng tối">
            <button
              className={`theme-toggle-btn ${themeMode === 'light' ? 'active' : ''}`}
              onClick={() => onThemeChange('light')}
              title="Giao diện Sáng (Light Mode)"
              aria-label="Giao diện Sáng"
            >
              <Sun size={14} />
              <span style={{ display: 'none' }}>Sáng</span>
            </button>

            <button
              className={`theme-toggle-btn ${themeMode === 'dark' ? 'active' : ''}`}
              onClick={() => onThemeChange('dark')}
              title="Giao diện Tối (Dark Mode)"
              aria-label="Giao diện Tối"
            >
              <Moon size={14} />
              <span style={{ display: 'none' }}>Tối</span>
            </button>

            <button
              className={`theme-toggle-btn ${themeMode === 'system' ? 'active' : ''}`}
              onClick={() => onThemeChange('system')}
              title="Giao diện Theo hệ thống (System)"
              aria-label="Giao diện Theo hệ thống"
            >
              <Monitor size={14} />
              <span style={{ display: 'none' }}>Hệ thống</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
