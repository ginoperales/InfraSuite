import React from 'react';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  headers?: string[];
}

export const Table: React.FC<TableProps> = ({
  children,
  headers,
  className = '',
  ...props
}) => {
  return (
    <div className="table-container">
      <table className={`table ${className}`} {...props}>
        {headers && (
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>{children}</tbody>
      </table>
    </div>
  );
};
