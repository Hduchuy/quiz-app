import { cn } from '@/utils/helpers';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'cyan' | 'purple' | 'pink' | 'green' | 'yellow' | 'red';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  const variants = {
    default: 'bg-white/10 text-white/80',
    cyan: 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30',
    purple: 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30',
    pink: 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30',
    green: 'bg-neon-green/20 text-neon-green border border-neon-green/30',
    yellow: 'bg-neon-yellow/20 text-neon-yellow border border-neon-yellow/30',
    red: 'bg-neon-red/20 text-neon-red border border-neon-red/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
