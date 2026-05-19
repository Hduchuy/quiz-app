import { cn } from '@/utils/helpers';

interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'cyan' | 'purple' | 'pink' | 'green';
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  size = 'md',
  color = 'cyan',
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colors = {
    cyan: 'bg-gradient-to-r from-neon-cyan to-cyan-400',
    purple: 'bg-gradient-to-r from-neon-purple to-purple-400',
    pink: 'bg-gradient-to-r from-neon-pink to-pink-400',
    green: 'bg-gradient-to-r from-neon-green to-green-400',
  };

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full rounded-full bg-white/10 overflow-hidden', sizes[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-white/60 mt-1 text-right">
          {Math.round(percentage)}%
        </p>
      )}
    </div>
  );
}
