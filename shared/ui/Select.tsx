import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || React.useId();
  return (
    <div className="input-group">
      {label && <label htmlFor={selectId} className="input-label">{label}</label>}
      <select
        id={selectId}
        className={`select-field ${className}`}
        style={error ? { borderColor: 'var(--color-danger)' } : {}}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="input-error" style={{
          fontSize: '0.8rem',
          color: 'var(--color-danger)',
          marginTop: '2px'
        }}>
          {error}
        </span>
      )}
    </div>
  );
};
