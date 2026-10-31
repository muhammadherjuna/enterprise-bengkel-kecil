import React from 'react';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | '';
  onChange: (value: number | '') => void;
}

/**
 * Format raw number or string into thousands separated string with dots (e.g. 20000 -> "20.000")
 */
export const formatThousands = (val: number | string | ''): string => {
  if (val === '' || val === null || val === undefined) return '';
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('id-ID').format(Number(digits));
};

/**
 * Parse thousands formatted string into number or empty string (e.g. "20.000" -> 20000)
 */
export const parseThousands = (str: string): number | '' => {
  const digits = str.replace(/\D/g, '');
  if (!digits) return '';
  const parsed = parseInt(digits, 10);
  return isNaN(parsed) ? '' : parsed;
};

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder = '0',
  onFocus,
  ...props
}) => {
  const displayValue = value === '' ? '' : formatThousands(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseThousands(raw);
    onChange(parsed);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
    if (onFocus) onFocus(e);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  );
};
