# Quiz Flow - Web Tạo Bài Kiểm Tra

## 1. Concept & Vision

**Quiz Flow** là một web app tạo và làm bài kiểm tra với giao diện hiện đại phong cách "phòng nhạc chill neon" - kết hợp giữa sự tập trung của Notion, tính năng của Quizizz và không gian thư giãn của một phòng nhạc electronic. Ứng dụng mang lại cảm giác như đang trong một không gian sống động nhưng vẫn yên tĩnh, nơi việc tạo đề kiểm tra trở nên thú vị thay vì nhàm chán.

Manual quiz creation only - no AI import, no file upload, no parser systems.

## 2. Design Language

### Aesthetic Direction
**"Neon Chill Room"** - Kính mờ (glassmorphism) với ánh sáng neon nhẹ nhàng, tạo chiều sâu và hiệu ứng hover đẹp mắt. Background gradient từ xanh đen sang tím đêm, tựa như một không gian lounge hiện đại.

### Color Palette
```
Primary Background:  #0a0a1a (Deep Space)
Secondary BG:       #12122a (Midnight Purple)
Glass Surface:      rgba(255, 255, 255, 0.05)
Glass Border:       rgba(255, 255, 255, 0.1)
Glass Hover:        rgba(255, 255, 255, 0.08)

Neon Cyan:          #00f5ff (Primary Accent)
Neon Purple:        #bf5af2 (Secondary Accent)
Neon Pink:          #ff2d92 (Tertiary Accent)
Neon Green:         #30d158 (Success)
Neon Yellow:        #ffd60a (Warning)
Neon Red:           #ff453a (Error)

Text Primary:       #ffffff
Text Secondary:     rgba(255, 255, 255, 0.7)
Text Muted:         rgba(255, 255, 255, 0.5)
```

### Typography
```
Headings:    Inter (700, 600) - Rõ ràng, hiện đại
Body:        Inter (400, 500) - Dễ đọc
Mono/Code:   JetBrains Mono - Cho code và công thức
Fallback:    system-ui, -apple-system, sans-serif
```

### Spatial System
```
Base unit:     4px
Spacing:       4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80px
Border radius: 12px (small), 16px (medium), 20px (large), 28px (xl)
Container max:  1400px
```

### Motion Philosophy
```
Micro-interactions: 150-200ms ease-out
Page transitions:    300-400ms ease-in-out
Hover effects:      200ms spring (stiffness: 400, damping: 30)
Drag animations:    spring physics via framer-motion
Loading states:     pulse 2s infinite
Stagger:            50ms between items
```

### Visual Assets
```
Icons:      Lucide React (consistent stroke width)
Decorative: CSS gradients, blur effects, subtle grid patterns
Images:     User-uploaded only, lazy loaded
Particles:  Canvas-based, light weight, subtle
```

## 3. Layout & Structure

### Page Architecture

**3 Main Pages:**
1. **Landing Page** - Full-screen hero với action grid
2. **Editor Page** - Split layout với sidebar + main editor
3. **Test Runner Page** - Focused quiz-taking interface

### Landing Page Structure
```
┌─────────────────────────────────────────┐
│              FULL SCREEN HERO           │
│  ┌─────────────────────────────────┐    │
│  │   Logo + Slogan + Description   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌───────┐ ┌───────┐ ┌───────┐        │
│  │Create │ │Browse │ │Format │        │
│  │ New   │ │ Quiz  │ │ Guide │        │
│  └───────┘ └───────┘ └───────┘        │
└─────────────────────────────────────────┘
```

### Editor Page Structure (Desktop)
```
┌──────────────────────────────────────────────────┐
│              TOPBAR TIER 1 (64px)                │
│  Logo │ Quiz Name Input │ Stats │ Actions       │
├──────────────────────────────────────────────────┤
│              TOPBAR TIER 2 (48px)                │
│  [All] [MCQ] [T/F] [Match] [Fill] │ Search │ ⚙  │
├────────────┬─────────────────────────────────────┤
│  SIDEBAR   │           MAIN EDITOR               │
│  (280px)   │                                     │
│            │  ┌─────────────────────────────┐    │
│  + MCQ     │  │      Question Card 1        │    │
│  + T/F     │  │      (Collapsible)          │    │
│  + Match   │  └─────────────────────────────┘    │
│  + Fill    │  ┌─────────────────────────────┐    │
│            │  │      Question Card 2        │    │
│  ──────    │  │      (Collapsed)            │    │
│  Q1 ●      │  └─────────────────────────────┘    │
│  Q2 ○      │                                     │
│  Q3 ●      │                                     │
│            │                                     │
├────────────┴─────────────────────────────────────┤
│              STATUS BAR (48px)                   │
│  Validation │ Save Status │ Preview │ Start Test  │
└──────────────────────────────────────────────────┘
```

### Test Runner Page Structure
```
┌──────────────────────────────────────────────────┐
│         TOPBAR (Quiz Name + Timer + Progress)     │
├────────────────────────────────┬─────────────────┤
│                                │  NAVIGATION     │
│     QUESTION DISPLAY           │  PANEL          │
│     (Center Focus)             │  (Desktop)      │
│                                │                 │
│     ┌──────────────────┐       │  ┌─┬─┬─┬─┐      │
│     │ Question Title    │       │  ├─┼─┼─┼─┤      │
│     │ [Image]           │       │  ├─┼─┼─┼─┤      │
│     │                   │       │  └─┴─┴─┴─┘      │
│     │ ○ Option A        │       │                 │
│     │ ○ Option B        │       │  Legend:        │
│     │ ○ Option C        │       │  ● Done ○ Skip  │
│     │ ○ Option D        │       │  🚩 Flagged     │
│     └──────────────────┘       │                 │
├────────────────────────────────┴─────────────────┤
│   [Previous] [Flag] [Next] [Submit]              │
└──────────────────────────────────────────────────┘
```

### Mobile Layout Adaptations
- Sidebar → Bottom Sheet (swipe up)
- Topbar → Compact mode (48px)
- Navigation Panel → Bottom drawer
- Touch targets ≥ 44px
- Reduced blur on low-end devices

## 4. Features & Interactions

### Landing Page Features

#### Hero Section
- Full viewport height
- Animated gradient background (subtle movement)
- Floating particle effect (light, ~20 particles)
- Glass card với logo + tagline

#### Action Cards
- **Create New Quiz Card**
  - Opens Editor with blank quiz
  - Optional: template selection modal

- **Browse Question Bank Card**
  - Grid of subject categories
  - Search by subject/tag
  - Preview card với: subject, tag, question count, difficulty

- **Format Guide Card**
  - Opens modal với format documentation
  - Example .docx template download
  - Copy format template button

### Editor Features

#### Topbar Tier 1
- **Logo**: 32px icon + "Quiz Flow" text
- **Quiz Name Input**: Editable inline, auto-save on blur
- **Stats Display**: "X questions • Y completed"
- **Actions**: Save, Undo, Redo, Export, Settings

#### Topbar Tier 2 (Filter Bar)
- Tab buttons for each question type with count badges
- Search input with debounce (300ms)
- Filter dropdowns: incomplete, errors

#### Sidebar
- **Add Question Buttons**: 4 buttons for each type
  - Hover: scale 1.05, glow effect
  - Click: insert at bottom + scroll to
- **Question List**: Mini cards showing:
  - Question number
  - Type icon
  - Status indicator (● complete, ○ incomplete, ⚠ error)
  - Click to scroll to question
- **Multi-select**: Checkbox on hover
- **Bulk actions**: Duplicate, Delete (with confirm)

#### Question Editor Cards
- **Multiple Choice (MCQ)**
  - Rich text editor for question (markdown, LaTeX)
  - Image upload/embed
  - 4+ answer options (add/remove)
  - Drag to reorder options
  - Radio button to mark correct answer
  - Optional explanation field

- **True/False**
  - Question content
  - Toggle: True / False
  - Optional explanation

- **Matching (Drag & Drop)**
  - Two columns: Left items, Right items
  - Draw connection lines (or use dnd-kit)
  - Add/remove pairs
  - Reorder pairs

- **Fill in the Blank**
  - Rich text with [blank] markers
  - Multiple blanks per question
  - Alternative answers: [answer|alt1|alt2]
  - Preview mode showing blanks as gaps

#### Bottom Status Bar
- **Left**: Validation warnings, autosave status
- **Right**: Preview button, Start Test button

### Test Runner Features

#### Topbar
- Quiz name
- Timer (countdown/countup)
- Progress bar
- Pause button (if allowed)
- Fullscreen toggle

#### Question Display
- Large, readable typography
- Image/video support
- Smooth transitions between questions
- Swipe gestures on mobile

#### Navigation Panel
- Question grid (4 columns desktop)
- Color coding: gray (unanswered), cyan (current), green (answered), yellow (flagged)
- Click to jump to question

#### Answer Input
- **MCQ**: Large radio buttons, keyboard 1-4 shortcuts
- **True/False**: Two large buttons
- **Matching**: Drag & drop
- **Fill**: Inline text inputs

#### Action Bar
- Previous/Next buttons
- Flag button (bookmark question)
- Submit button with confirmation modal

### Settings Panel
- **Test Settings**
  - Shuffle questions: toggle
  - Shuffle answers: toggle
  - Show answer immediately: toggle
  - Show explanation: toggle
  - Time limit: number input + unit
  - Prevent going back: toggle

- **Appearance**
  - Neon intensity slider
  - Compact mode toggle
  - Reduced motion toggle

- **Data**
  - Autosave interval: 5s/10s/30s/manual
  - Export format preference

## 5. Component Inventory

### Core Components

#### GlassCard
- Background: glass surface
- Border: 1px glass border
- Blur: backdrop-blur-xl
- Hover: slight lift + border brighten
- States: default, hover, active, loading

#### Button
- Variants: primary (neon cyan), secondary (glass), ghost, danger
- Sizes: sm (32px), md (40px), lg (48px)
- States: default, hover, active, disabled, loading
- Icon support: left, right, icon-only

#### Input
- Glass background
- Focus: cyan border glow
- States: default, focus, error, disabled
- Variants: text, textarea, search

#### Badge
- Small pill shape
- Color variants matching neon palette
- Sizes: sm, md

#### Modal
- Centered overlay
- Glass panel
- Close on escape/overlay click
- Focus trap

#### Tooltip
- Dark glass background
- Arrow pointing to trigger
- Delay: 500ms

#### Toast/Notification
- Bottom-right position
- Auto-dismiss: 5s
- Variants: info, success, warning, error
- Stack up to 3

### Question Components

#### QuestionCard
- Collapsible header (question number, type, status)
- Expandable body
- Drag handle
- Actions menu (duplicate, delete)

#### StatementEditor (TrueFalse)
- Label (A, B, C, D...)
- Text input for statement content
- True/False toggle buttons
- Drag handle for reordering
- Duplicate/Delete buttons on hover
- Memoized for performance

#### OptionItem (MCQ)
- Radio/checkbox
- Text content (editable)
- Drag handle
- Delete button (on hover)

#### BlankHighlight (Fill)
- Inline styling for [blank] markers
- Click to edit blank content

#### DragDropBoxesEditor
- Target box builder with title and correct answers
- Answer pool preview
- Distractor management
- Memoized target cards for performance

### Layout Components

#### Topbar
- Glass background
- Flex layout
- Responsive collapse

#### Sidebar
- Resizable (desktop)
- Collapsible
- Mobile: bottom sheet trigger

#### StatusBar
- Fixed bottom
- Glass background
- Flex layout

### Specialized Components

#### Timer
- Digital display
- Neon glow
- Warning animation (pulse red when < 1 min)

#### ProgressBar
- Thin bar
- Gradient fill
- Percentage label option

#### QuestionNavigator
- Grid of numbered squares
- Color-coded status
- Click to navigate

- **Side Menu**: Add question buttons (MCQ, T/F, Match, Fill Blank)
- **Editor Area**: Question cards with rich editing
- **Preview**: Live quiz preview mode

Manual creation only - no import, no AI.

## 6. Technical Approach

### Stack
```
Frontend:      React 18 + TypeScript
Build:         Vite 5
Styling:       TailwindCSS 3.4 + custom glass utilities
Animation:     Framer Motion 11
State:         Zustand (simple, performant)
Drag & Drop:   @dnd-kit/core + @dnd-kit/sortable
Forms:         React Hook Form + Zod validation
Routing:       React Router 6
Storage:       localStorage (small data) + IndexedDB (large)
Export:        docx library
Icons:         Lucide React
Utilities:     clsx, tailwind-merge
```

### Architecture

```
src/
├── components/
│   ├── ui/                 # Base components (Button, Input, Card, etc.)
│   ├── layout/             # Layout components (Topbar, Sidebar, etc.)
│   ├── editor/             # Editor-specific components
│   ├── test/               # Test runner components
│   └── landing/             # Landing page components
├── pages/
│   ├── Landing.tsx
│   ├── Editor.tsx
│   └── TestRunner.tsx
├── stores/
│   ├── quizStore.ts         # Quiz metadata + questions
│   ├── editorStore.ts       # UI state (selected, collapsed, etc.)
│   ├── testStore.ts         # Test session state
│   └── settingsStore.ts     # App settings
├── hooks/
│   ├── useAutosave.ts
│   ├── useKeyboardShortcuts.ts
│   ├── useLocalStorage.ts
│   └── useIndexedDB.ts
├── utils/
│   ├── fileExporter.ts      # docx export
│   └── helpers.ts
├── types/
│   └── index.ts             # All TypeScript interfaces
├── styles/
│   └── globals.css          # Tailwind + custom utilities
├── App.tsx
└── main.tsx
```

### Data Models

```typescript
// Question Types
type QuestionType = 'mcq' | 'truefalse' | 'drag_drop_boxes' | 'fillblank';

interface BaseQuestion {
  id: string;
  type: QuestionType;
  title: string;
  explanation?: string;
  media?: Media;
  points: number;
  createdAt: number;
  updatedAt: number;
}

interface Media {
  type: 'image' | 'video' | 'audio';
  url: string;
  alt?: string;
}

interface MCQQuestion extends BaseQuestion {
  type: 'mcq';
  options: { id: string; text: string }[];
  correctAnswer: string; // option id
}

interface TrueFalseQuestion extends BaseQuestion {
  type: 'truefalse';
  statements: {
    id: string;
    text: string;
    answer: boolean;
  }[];
}

interface DragDropBoxesQuestion extends BaseQuestion {
  type: 'drag_drop_boxes';
  targets: {
    id: string;
    title: string;
    correctAnswers: string[]; // Multiple correct answers allowed
  }[];
  distractors: string[]; // Wrong answers to increase difficulty
}

interface FillBlankQuestion extends BaseQuestion {
  type: 'fillblank';
  content: string; // Text with [answer|alt] markers
  blanks: { id: string; text: string; alternatives: string[] }[];
}

type Question = MCQQuestion | TrueFalseQuestion | MatchingQuestion | FillBlankQuestion;

// Quiz
interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  settings: QuizSettings;
  createdAt: number;
  updatedAt: number;
}

interface QuizSettings {
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showAnswerImmediately: boolean;
  showExplanation: boolean;
  timeLimit?: number; // seconds
  preventGoingBack: boolean;
}

// Test Session
interface TestSession {
  quizId: string;
  answers: Record<string, Answer>; // questionId -> answer (MCQ: string, TrueFalse: Record<statementId, boolean>, DragDropBoxes: Record<targetId, string[]>)
  flagged: string[]; // questionIds
  currentIndex: number;
  startTime: number;
  endTime?: number;
  status: 'in-progress' | 'completed' | 'paused';
}

// Editor State
interface EditorState {
  selectedQuestionId: string | null;
  collapsedQuestions: Set<string>;
  draggedQuestionId: string | null;
  history: HistoryState;
  historyIndex: number;
}
```

### Performance Strategies

1. **Virtualization**: Only render visible questions (react-window if > 50 questions)
2. **Memoization**: React.memo for all question cards, useMemo for derived state
3. **Debounced autosave**: 2s debounce on changes
4. **Lazy loading**: Code split pages, lazy load images
5. **Optimistic updates**: Update UI immediately, sync in background

### Accessibility

- Semantic HTML
- ARIA labels on interactive elements
- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Focus management in modals
- Reduced motion respect
- Color contrast AA compliant

### Browser Support

- Chrome/Edge 90+
- Firefox 90+
- Safari 14+
- Mobile Safari/Chrome (iOS 14+, Android 10+)
