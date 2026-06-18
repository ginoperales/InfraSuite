import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || React.useId();
  return (
    <div className="input-group">
      {label && <label htmlFor={inputId} className="input-label">{label}</label>}
      <input
        id={inputId}
        className={`input-field ${className}`}
        style={error ? { borderColor: 'var(--color-danger)' } : {}}
        {...props}
      />
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
