import { ReactNode } from 'react';

interface TestLayoutProps {
  children: ReactNode;
}

const TOPBAR_HEIGHT = 68;
const BOTTOMBAR_HEIGHT = 72;

export function TestLayout({ children }: TestLayoutProps) {
  return (
    <div className="fixed inset-0 flex flex-col bg-deep-space overflow-hidden" style={{ zIndex: 1 }}>
      {/* Content area with padding for fixed topbar and bottombar */}
      <div 
        className="flex-1 overflow-hidden mt-[68px] mb-[72px]"
      >
        {children}
      </div>
    </div>
  );
}

export { TOPBAR_HEIGHT, BOTTOMBAR_HEIGHT };
