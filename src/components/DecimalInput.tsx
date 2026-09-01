import React, { useState, useEffect } from 'react';
import { parseNumberInput } from '../utils/helpers';

interface DecimalInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | null | undefined;
  onChangeValue: (num: number) => void;
  prefix?: string;
  allowEmpty?: boolean;
}

export const DecimalInput: React.FC<DecimalInputProps> = ({
  value,
  onChangeValue,
  prefix,
  allowEmpty = false,
  className = '',
  onFocus,
  onBlur,
  placeholder = '0,00',
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [text, setText] = useState<string>(() => {
    if (value === null || value === undefined || (value === 0 && allowEmpty)) return '';
    return value.toString();
  });

  // Sync from props when not actively focused
  useEffect(() => {
    if (!isFocused) {
      if (value === null || value === undefined || (value === 0 && allowEmpty)) {
        setText('');
      } else {
        setText(value.toString());
      }
    }
  }, [value, isFocused, allowEmpty]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow digits, dot, comma, minus
    const filtered = raw.replace(/[^\d.,-]/g, '');
    setText(filtered);
    const parsed = parseNumberInput(filtered);
    onChangeValue(parsed);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  return (
    <div className="relative w-full flex items-center">
      {prefix && (
        <span className="absolute left-2.5 text-xs text-slate-400 select-none pointer-events-none font-medium">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={text}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`${prefix ? 'pl-8 ' : ''}${className}`}
        {...rest}
      />
    </div>
  );
};
