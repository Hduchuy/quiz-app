import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Settings, X, Clock, Shuffle, CheckCircle2 } from 'lucide-react';
import { useQuizStore } from '@/stores/quizStore';
import { cn } from '@/utils/helpers';

// Settings key for localStorage
const SETTINGS_STORAGE_KEY = 'quiz-studio-test-settings';

interface SettingsState {
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  instantFeedback: boolean;
  enableTimer: boolean;
  timerMinutes: number;
}

function loadSettings(): SettingsState {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return {
    shuffleQuestions: false,
    shuffleAnswers: true,
    instantFeedback: false,
    enableTimer: false,
    timerMinutes: 30,
  };
}

function saveSettings(settings: SettingsState) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function SettingsPanel() {
  const { updateQuizSettings } = useQuizStore();
  const [isOpen, setIsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState<SettingsState>(() => loadSettings());

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = loadSettings();
    setLocalSettings(stored);
    // Sync to quizStore
    updateQuizSettings(stored);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      // Always cleanup when modal closes or component unmounts
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleUpdateSettings = (updates: Partial<SettingsState>) => {
    const newSettings = { ...localSettings, ...updates };
    setLocalSettings(newSettings);
    saveSettings(newSettings);
    updateQuizSettings(updates);
    
    console.log('[SettingsPanel] Settings updated:', newSettings);
  };

  const settingItems = [
    {
      key: 'shuffleQuestions' as const,
      icon: Shuffle,
      label: 'Tráo câu hỏi',
      description: 'Câu hỏi xuất hiện ngẫu nhiên',
    },
    {
      key: 'shuffleAnswers' as const,
      icon: Shuffle,
      label: 'Tráo đáp án',
      description: 'Đáp án xuất hiện ngẫu nhiên',
    },
    {
      key: 'instantFeedback' as const,
      icon: CheckCircle2,
      label: 'Hiện đáp án + giải thích ngay',
      description: 'Hiển thị sau mỗi câu trả lời',
    },
    {
      key: 'enableTimer' as const,
      icon: Clock,
      label: 'Giới hạn thời gian',
      description: 'Đặt thời gian làm bài',
      hasTimeInput: true,
    },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm"
      >
        <Settings size={16} />
        <span className="hidden sm:inline">Cài đặt</span>
      </button>

      {isOpen && createPortal(
        <SettingsModal
          settings={localSettings}
          updateSettings={handleUpdateSettings}
          settingItems={settingItems}
          onClose={() => setIsOpen(false)}
        />,
        document.body
      )}
    </>
  );
}

interface SettingItem {
  key: 'shuffleQuestions' | 'shuffleAnswers' | 'instantFeedback' | 'enableTimer';
  icon: React.ElementType;
  label: string;
  description: string;
  hasTimeInput?: boolean;
}

interface SettingsModalProps {
  settings: SettingsState;
  updateSettings: (updates: Partial<SettingsState>) => void;
  settingItems: SettingItem[];
  onClose: () => void;
}

function SettingsModal({ settings, updateSettings, settingItems, onClose }: SettingsModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center p-0 md:p-4"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-[10px]"
        onClick={onClose}
      />

      {/* Modal Panel - Bottom sheet on mobile, center on desktop */}
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className={cn(
          'relative w-full md:max-w-[520px]',
          'rounded-t-3xl md:rounded-3xl',
          'bg-[#0f0f1a]/98 md:bg-[#0f0f1a]/95',
          'backdrop-blur-xl',
          'border-t md:border border-white/10',
          'shadow-2xl shadow-black/50',
          'max-h-[85vh] md:max-h-[80vh]',
          'flex flex-col'
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Drag Handle - only show on mobile */}
        <div className="flex justify-center py-3 md:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 md:px-6 md:py-5 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">Cài đặt bài kiểm tra</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors md:hidden"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors hidden md:block"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-1">
            {settingItems.map((item) => (
              <SettingRow
                dataKey={item.key}
                icon={item.icon}
                label={item.label}
                description={item.description}
                checked={settings[item.key]}
                onChange={(checked) => updateSettings({ [item.key]: checked })}
                timeValue={item.key === 'enableTimer' ? settings.timerMinutes : 0}
                onTimeChange={(value) => updateSettings({ timerMinutes: value })}
                showTimeInput={item.key === 'enableTimer' && settings.enableTimer}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface SettingRowProps {
  dataKey: 'shuffleQuestions' | 'shuffleAnswers' | 'instantFeedback' | 'enableTimer';
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hasTimeInput?: boolean;
  timeValue?: number;
  onTimeChange?: (value: number) => void;
  showTimeInput?: boolean;
}

function SettingRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  showTimeInput,
  timeValue = 30,
  onTimeChange,
}: SettingRowProps) {
  return (
    <div className="flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-white/5 transition-colors group">
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
          checked ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-white/5 text-white/40'
        )}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-white/40">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {showTimeInput && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="300"
              value={timeValue}
              onChange={(e) => onTimeChange?.(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-center text-sm focus:outline-none focus:border-neon-cyan/50"
            />
            <span className="text-xs text-white/40">phút</span>
          </div>
        )}

        {/* Toggle Switch */}
        <button
          onClick={() => onChange(!checked)}
          className={cn(
            'relative w-[56px] h-[32px] rounded-full transition-colors duration-200 ease-out overflow-hidden flex-shrink-0',
            checked ? 'bg-neon-cyan shadow-[0_0_12px_rgba(0,255,255,0.4)]' : 'bg-white/20'
          )}
        >
          <span
            className={cn(
              'absolute top-1/2 -translate-y-1/2 w-[24px] h-[24px] rounded-full bg-white shadow-lg transition-[left] duration-200 ease-out',
              checked ? 'left-[calc(100%-28px)]' : 'left-1'
            )}
          />
        </button>
      </div>
    </div>
  );
}
