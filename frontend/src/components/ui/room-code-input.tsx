import React, { forwardRef } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface RoomCodeInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
}

const RoomCodeInput = forwardRef<HTMLInputElement, RoomCodeInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    // Format the display value: insert hyphen between 3rd and 4th character
    const formatDisplayValue = (rawValue: string) => {
      const cleanValue = rawValue.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (cleanValue.length <= 3) {
        return cleanValue;
      }
      return cleanValue.slice(0, 3) + '-' + cleanValue.slice(3, 6);
    };

    // Extract raw value from formatted display
    const extractRawValue = (displayValue: string) => {
      return displayValue.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const rawValue = extractRawValue(inputValue);
      onChange(rawValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow backspace, delete, arrow keys, etc.
      if (e.key === 'Backspace' || e.key === 'Delete' || 
          e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
          e.key === 'Tab' || e.key === 'Enter') {
        return;
      }
      
      // Only allow alphanumeric characters
      if (!/[A-Za-z0-9]/.test(e.key)) {
        e.preventDefault();
        return;
      }
      
      // Prevent input if already at max length
      if (value.length >= 6) {
        e.preventDefault();
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const rawValue = extractRawValue(pastedText);
      onChange(rawValue);
    };

    return (
      <Input
        {...props}
        ref={ref}
        value={formatDisplayValue(value)}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className={cn(
          "font-mono text-center text-lg tracking-widest",
          className
        )}
        maxLength={7} // 6 characters + 1 hyphen
        placeholder="XXX-XXX"
      />
    );
  }
);

RoomCodeInput.displayName = 'RoomCodeInput';

export { RoomCodeInput }; 