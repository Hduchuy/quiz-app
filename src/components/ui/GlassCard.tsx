import { motion } from 'framer-motion';
import { cn } from '@/utils/helpers';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className, hover = true, onClick }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={cn(
        'rounded-2xl p-6',
        'bg-white/5 backdrop-blur-xl',
        'border border-white/10',
        'shadow-lg',
        hover && 'transition-all duration-300 hover:bg-white/[0.08] hover:border-white/15 hover:-translate-y-0.5',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

interface NeonCardProps {
  children: React.ReactNode;
  className?: string;
  color?: 'cyan' | 'purple' | 'pink';
  onClick?: () => void;
}

export function NeonCard({ children, className, color = 'cyan', onClick }: NeonCardProps) {
  const colors = {
    cyan: 'border-neon-cyan/30 shadow-neon-cyan',
    purple: 'border-neon-purple/30 shadow-neon-purple',
    pink: 'border-neon-pink/30 shadow-neon-pink',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={cn(
        'rounded-2xl p-6',
        'bg-white/[0.05] backdrop-blur-xl',
        `border ${colors[color]}`,
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
