import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/helpers';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-white/70 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full px-4 py-3 rounded-lg transition-all duration-200 resize-none',
            'bg-white/5 border border-white/10',
            'text-white placeholder:text-white/40',
            'focus:outline-none focus:border-neon-cyan/50 focus:ring-2 focus:ring-neon-cyan/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-neon-red focus:border-neon-red focus:ring-neon-red/20',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-neon-red">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
