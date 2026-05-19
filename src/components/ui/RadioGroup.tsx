import { cn } from '@/utils/helpers';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function RadioGroup({
  options,
  value,
  onChange,
  orientation = 'horizontal',
  className,
}: RadioGroupProps) {
  return (
    <div
      className={cn(
        'flex gap-2',
        orientation === 'vertical' && 'flex-col',
        className
      )}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            'flex items-center gap-2 cursor-pointer',
            'px-4 py-2 rounded-lg',
            'bg-white/5 border border-white/10',
            'hover:bg-white/10 hover:border-white/20',
            'transition-all duration-200',
            value === option.value && 'border-neon-cyan/50 bg-neon-cyan/10'
          )}
        >
          <div
            className={cn(
              'w-4 h-4 rounded-full border-2 transition-all duration-200',
              value === option.value
                ? 'border-neon-cyan bg-neon-cyan'
                : 'border-white/40'
            )}
          >
            {value === option.value && (
              <div className="w-full h-full rounded-full bg-white scale-50" />
            )}
          </div>
          <span className="text-sm text-white/80">{option.label}</span>
          <input
            type="radio"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
        </label>
      ))}
    </div>
  );
}
