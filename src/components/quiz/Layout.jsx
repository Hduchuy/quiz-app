import { motion } from 'framer-motion';

/**
 * Sidebar - Left sidebar for desktop
 */
export function Sidebar({ children, className = '' }) {
  return (
    <aside className={`
      hidden lg:flex flex-col w-[280px] h-screen sticky top-0
      bg-[var(--color-bg-secondary)]/80 backdrop-blur-xl
      border-r border-[var(--color-border)]
      overflow-hidden flex-shrink-0
      ${className}
    `}>
      {children}
    </aside>
  );
}

/**
 * SidebarHeader - Logo and app name
 */
export function SidebarHeader({ title = 'Quiz App', subtitle = '' }) {
  return (
    <div className="p-6 border-b border-[var(--color-border)]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-cyan)] flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h1 className="font-bold text-lg text-gradient">{title}</h1>
          {subtitle && <p className="text-xs text-[var(--color-text-muted)]">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

/**
 * SidebarContent - Scrollable content area
 */
export function SidebarContent({ children, className = '' }) {
  return (
    <div className={`flex-1 overflow-y-auto p-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * SidebarSection - Section with title
 */
export function SidebarSection({ title, children, className = '' }) {
  return (
    <div className={`mb-6 ${className}`}>
      {title && (
        <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-3 mb-2">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

/**
 * SidebarItem - Navigation item
 */
export function SidebarItem({ 
  icon, 
  label, 
  active = false, 
  badge,
  onClick,
  className = '' 
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-3 rounded-xl
        transition-all duration-200
        ${active 
          ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent-light)]' 
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]'
        }
        ${className}
      `}
      whileTap={{ scale: 0.98 }}
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      <span className="flex-1 text-left font-medium">{label}</span>
      {badge && (
        <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--color-accent)]/20 text-[var(--color-accent-light)]">
          {badge}
        </span>
      )}
    </motion.button>
  );
}

/**
 * SidebarFooter - Bottom actions
 */
export function SidebarFooter({ children, className = '' }) {
  return (
    <div className={`p-4 border-t border-[var(--color-border)] ${className}`}>
      {children}
    </div>
  );
}

/**
 * RightPanel - Right panel for desktop
 */
export function RightPanel({ children, className = '' }) {
  return (
    <aside className={`
      hidden lg:flex flex-col w-[300px] h-screen sticky top-0
      bg-[var(--color-bg-secondary)]/80 backdrop-blur-xl
      border-l border-[var(--color-border)]
      overflow-hidden flex-shrink-0
      ${className}
    `}>
      {children}
    </aside>
  );
}

/**
 * RightPanelHeader - Panel header
 */
export function RightPanelHeader({ title, children }) {
  return (
    <div className="p-6 border-b border-[var(--color-border)]">
      <h2 className="font-semibold text-[var(--color-text-primary)]">{title}</h2>
      {children}
    </div>
  );
}

/**
 * RightPanelContent - Scrollable content
 */
export function RightPanelContent({ children, className = '' }) {
  return (
    <div className={`flex-1 overflow-y-auto p-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * RightPanelFooter - Panel footer actions
 */
export function RightPanelFooter({ children, className = '' }) {
  return (
    <div className={`p-4 border-t border-[var(--color-border)] ${className}`}>
      {children}
    </div>
  );
}

/**
 * MobileLayout - Mobile-specific layout wrapper
 */
export function MobileLayout({ children, className = '' }) {
  return (
    <div className={`lg:hidden ${className}`}>
      {children}
    </div>
  );
}

/**
 * DesktopLayout - Desktop 3-column layout
 */
export function DesktopLayout({ sidebar, main, rightPanel, className = '' }) {
  return (
    <div className={`hidden lg:flex h-screen ${className}`}>
      {sidebar}
      <main className="flex-1 overflow-y-auto p-6">
        {main}
      </main>
      {rightPanel}
    </div>
  );
}
