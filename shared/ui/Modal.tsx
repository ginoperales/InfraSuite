import React, { useState, useEffect, useRef } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onExternalOpen?: () => void;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onExternalOpen
}) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isOpen) {
      setOffset({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.modal-close')) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setOffset({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          left: `${offset.x}px`,
          top: `${offset.y}px`,
          position: 'relative'
        }}
      >
        <div 
          className="modal-header" 
          onMouseDown={handleMouseDown}
          style={{ cursor: 'move', userSelect: 'none' }}
        >
          <h2 className="modal-title">{title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onExternalOpen && (
              <button 
                title="Abrir en ventana independiente"
                className="modal-close" 
                onClick={(e) => {
                  e.stopPropagation();
                  onExternalOpen();
                }}
                style={{ fontSize: '0.85rem' }}
              >
                ↗️
              </button>
            )}
            <button className="modal-close" onClick={onClose}>
              &times;
            </button>
          </div>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

