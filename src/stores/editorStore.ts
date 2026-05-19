import { create } from 'zustand';
import type { QuestionType } from '@/types';

interface EditorState {
  // Selection
  selectedQuestionId: string | null;
  collapsedQuestions: Set<string>;

  // Drag & Drop
  draggedQuestionId: string | null;

  // Filtering
  searchQuery: string;
  filterType: QuestionType | 'all';
  filterIncomplete: boolean;

  // History
  history: unknown[];
  historyIndex: number;

  // UI State
  isSidebarOpen: boolean;
  isSettingsOpen: boolean;
  isFormatGuideOpen: boolean;
  activeModal: string | null;

  // Actions
  selectQuestion: (id: string | null) => void;
  toggleCollapsed: (id: string) => void;
  setCollapsed: (id: string, collapsed: boolean) => void;
  collapseAll: () => void;
  expandAll: () => void;

  setDraggedQuestion: (id: string | null) => void;

  setSearchQuery: (query: string) => void;
  setFilterType: (type: QuestionType | 'all') => void;
  setFilterIncomplete: (incomplete: boolean) => void;

  toggleSidebar: () => void;
  toggleSettings: () => void;
  toggleFormatGuide: () => void;
  openModal: (modal: string) => void;
  closeModal: () => void;

  // History actions
  pushHistory: (state: unknown) => void;
  undo: () => unknown | null;
  redo: () => unknown | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  selectedQuestionId: null,
  collapsedQuestions: new Set(),

  draggedQuestionId: null,

  searchQuery: '',
  filterType: 'all',
  filterIncomplete: false,

  history: [],
  historyIndex: -1,

  isSidebarOpen: true,
  isSettingsOpen: false,
  isFormatGuideOpen: false,
  activeModal: null,

  selectQuestion: (id) => set({ selectedQuestionId: id }),

  toggleCollapsed: (id) => {
    set((state) => {
      const newCollapsed = new Set(state.collapsedQuestions);
      if (newCollapsed.has(id)) {
        newCollapsed.delete(id);
      } else {
        newCollapsed.add(id);
      }
      return { collapsedQuestions: newCollapsed };
    });
  },

  setCollapsed: (id, collapsed) => {
    set((state) => {
      const newCollapsed = new Set(state.collapsedQuestions);
      if (collapsed) {
        newCollapsed.add(id);
      } else {
        newCollapsed.delete(id);
      }
      return { collapsedQuestions: newCollapsed };
    });
  },

  collapseAll: () => {
    // This would need to be called with question IDs
    // For now, we'll use this pattern
  },

  expandAll: () => {
    set({ collapsedQuestions: new Set() });
  },

  setDraggedQuestion: (id) => set({ draggedQuestionId: id }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setFilterType: (type) => set({ filterType: type }),

  setFilterIncomplete: (incomplete) => set({ filterIncomplete: incomplete }),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

  toggleFormatGuide: () => set((state) => ({ isFormatGuideOpen: !state.isFormatGuideOpen })),

  openModal: (modal) => set({ activeModal: modal }),

  closeModal: () => set({ activeModal: null }),

  pushHistory: (state) => {
    set((prev) => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(state);
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      set({ historyIndex: historyIndex - 1 });
      return history[historyIndex - 1];
    }
    return null;
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      set({ historyIndex: historyIndex + 1 });
      return history[historyIndex + 1];
    }
    return null;
  },

  canUndo: () => get().historyIndex > 0,

  canRedo: () => get().historyIndex < get().history.length - 1,
}));
