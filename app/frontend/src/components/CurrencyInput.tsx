import * as React from 'react';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  min?: number;
  step?: number;
  allowEmpty?: boolean;
  onEmptyValue?: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * A currency/number input that uses a text field internally
 * to allow proper decimal entry (e.g., "0.00", "1.50") and
 * clearing the field without the "stuck 0" problem.
 */
export default function CurrencyInput({
  value,
  onChange,
  placeholder,
  className,
  min = 0,
  step: _step,
  allowEmpty = false,
  onEmptyValue,
  disabled,
  autoFocus,
  onKeyDown,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = React.useState<string>(String(value));
  const [isFocused, setIsFocused] = React.useState(false);

  // Sync external value changes when not focused
  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value === 0 && allowEmpty ? '' : String(value));
    }
  }, [value, isFocused, allowEmpty]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Allow empty
    if (raw === '') {
      setDisplayValue('');
      if (allowEmpty && onEmptyValue) {
        onEmptyValue();
      } else {
        onChange(0);
      }
      return;
    }

    // Allow valid partial decimal inputs like "1.", "0.0", "0.00"
    if (/^-?\d*\.?\d*$/.test(raw)) {
      setDisplayValue(raw);
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) {
        const finalVal = min !== undefined ? Math.max(min, parsed) : parsed;
        onChange(finalVal);
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Select all text on focus for easy replacement
    e.target.select();
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Clean up display on blur
    if (displayValue === '' || displayValue === '.') {
      if (allowEmpty && onEmptyValue) {
        setDisplayValue('');
        onEmptyValue();
      } else {
        setDisplayValue('0');
        onChange(0);
      }
    } else {
      const parsed = parseFloat(displayValue);
      if (!isNaN(parsed)) {
        const finalVal = min !== undefined ? Math.max(min, parsed) : parsed;
        setDisplayValue(String(finalVal));
        onChange(finalVal);
      }
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      onKeyDown={onKeyDown}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
    />
  );
}