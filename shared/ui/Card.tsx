import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  icon?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className={`card ${className}`} {...props}>
      {title && (
        <div className="card-title">
          {icon && <span className="card-title-icon">{icon}</span>}
          <span>{title}</span>
        </div>
      )}
      <div className="card-content">{children}</div>
    </div>
  );
};
