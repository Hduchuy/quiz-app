import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Topbar, Sidebar, StatusBar, SIDEBAR_WIDTH, TOPBAR_HEIGHT, BOTTOMBAR_HEIGHT } from '@/components/layout';
import { ToastContainer, Input, Badge } from '@/components/ui';
import { RestoreSessionModal } from '@/components/ui/RestoreSessionModal';
import { LandingPage } from '@/pages/Landing';
import { EditorPage } from '@/pages/Editor';
import { TestRunnerPage } from '@/pages/TestRunner';
import { ResultsPage } from '@/pages/Results';
import { TestLayout } from '@/components/test';
import { useQuizStore } from '@/stores/quizStore';
import { useEditorStore } from '@/stores/editorStore';
import { useSessionManager } from '@/hooks/useSessionManager';
import { useState, useEffect } from 'react';
import { cn } from '@/utils/helpers';
import { ListChecks, CheckCircle, LayoutGrid, Type } from 'lucide-react';

const FILTER_BAR_HEIGHT = 56;

function SessionRestoreHandler() {
  const navigate = useNavigate();
  const { checkSession, restoreSession, discardSession } = useSessionManager();
  const [sessionData, setSessionData] = useState<ReturnType<typeof checkSession>>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const session = checkSession();
    if (session) {
      setSessionData(session);
      setShowModal(true);
    }
  }, [checkSession]);

  const handleRestore = () => {
    if (sessionData) {
      restoreSession(sessionData);
      navigate(sessionData.lastPath);
    }
    setShowModal(false);
  };

  const handleDiscard = () => {
    discardSession();
    setShowModal(false);
    // Navigate to clean home page so the user doesn't stay on a stale route
    navigate('/');
  };

  return (
    <RestoreSessionModal
      isOpen={showModal}
      sessionData={sessionData}
      onRestore={handleRestore}
      onDiscard={handleDiscard}
    />
  );
}

function App() {
  const { quiz } = useQuizStore();
  const { filterType, setFilterType, searchQuery, setSearchQuery } = useEditorStore();

  const editorFilterTabs = [
    { type: 'all' as const, label: 'Tất cả', icon: null },
    { type: 'mcq' as const, label: 'Trắc nghiệm', icon: ListChecks },
    { type: 'truefalse' as const, label: 'Đúng/Sai', icon: CheckCircle },
    { type: 'drag_drop_boxes' as const, label: 'Kéo thả', icon: LayoutGrid },
    { type: 'fillblank' as const, label: 'Điền chỗ trống', icon: Type },
  ];

  return (
    <BrowserRouter>
      <div className="min-h-screen w-full bg-deep-space relative">
        {/* Background Effects - Fixed behind everything */}
        <div className="fixed inset-0 gradient-mesh pointer-events-none" />
        <div className="blur-background pointer-events-none" />

        {/* Session Restore Modal */}
        <SessionRestoreHandler />

        {/* Main Layout */}
        <div className="relative z-10">
          <Routes>
            {/* Home Page - Full scrolling */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Editor Page - Custom scroll layout */}
            <Route path="/editor" element={
              <div className="h-screen w-full flex flex-col overflow-hidden">
                {/* Topbar - Fixed */}
                <Topbar />

                {/* Filter Bar - Fixed below topbar, right of sidebar */}
                <div 
                  className="fixed z-20 hidden lg:block"
                  style={{
                    top: TOPBAR_HEIGHT,
                    left: SIDEBAR_WIDTH,
                    right: 0,
                    height: FILTER_BAR_HEIGHT,
                    background: 'rgba(10, 10, 26, 0.92)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="h-full px-4 flex items-center gap-4 overflow-x-auto no-scrollbar">
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {editorFilterTabs.map(({ type, label, icon: Icon }) => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                            filterType === type
                              ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                              : 'text-white/60 hover:text-white hover:bg-white/5'
                          )}
                        >
                          {Icon && <Icon size={14} />}
                          {label}
                          {type !== 'all' && (
                            <Badge size="sm" className="ml-1">
                              {(quiz.questions?.filter((q) => q?.type === type) ?? []).length}
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Search */}
                    <div className="flex-1 min-w-[200px] max-w-[300px]">
                      <Input
                        placeholder="Tìm kiếm..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Sidebar - Fixed */}
                <Sidebar />

                {/* Content Area - Scrollable, uses inset for proper viewport */}
                <main
                  className="hidden lg:block overflow-y-auto"
                  style={{
                    position: 'fixed',
                    top: TOPBAR_HEIGHT + FILTER_BAR_HEIGHT,
                    left: SIDEBAR_WIDTH,
                    right: 0,
                    bottom: BOTTOMBAR_HEIGHT,
                  }}
                >
                  <EditorPage />
                </main>

                {/* Mobile Content Area - Fill available space */}
                <main 
                  className="lg:hidden flex-1 overflow-y-auto"
                  style={{
                    // Start below topbar with safe area
                    paddingTop: 'calc(env(safe-area-inset-top) + 56px)',
                    // Extra space at bottom for scrolling past the fixed bottom bar
                    paddingBottom: '96px',
                    // Prevent horizontal overflow
                    overflowX: 'hidden',
                    // Smooth scrolling on iOS
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  <EditorPage />
                </main>

                {/* Bottom Status Bar - Fixed at bottom */}
                <StatusBar />
              </div>
            } />
            <Route path="/test/:quizId" element={<TestLayout><TestRunnerPage /></TestLayout>} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/bank" element={<ComingSoon />} />
            <Route path="/preview/:id" element={
              <div className="h-screen w-full flex flex-col overflow-hidden">
                <Topbar />
                <Sidebar />
                <main 
                  className="flex-1 overflow-y-auto hidden lg:block"
                  style={{
                    marginLeft: SIDEBAR_WIDTH,
                    paddingBottom: BOTTOMBAR_HEIGHT,
                  }}
                >
                  <EditorPage />
                </main>
                <main className="flex-1 overflow-y-auto lg:hidden">
                  <EditorPage />
                </main>
                <StatusBar />
              </div>
            } />
          </Routes>
        </div>

        {/* Global Components */}
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}

function ComingSoon() {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Sắp ra mắt!</h1>
        <p className="text-white/50 mb-8">Tính năng này đang được phát triển.</p>
        <a href="/" className="text-neon-cyan hover:underline">
          Quay lại trang chủ
        </a>
      </div>
    </div>
  );
}

export default App;
