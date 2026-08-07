import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { isElectron, syncToCloud } from '../lib/databaseAdapter';

interface SyncButtonProps {
  onSynced?: () => void;
  style?: React.CSSProperties;
}

export const SyncButton: React.FC<SyncButtonProps> = ({ onSynced, style }) => {
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isElectron()) return null;

  const handleSync = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await syncToCloud();
      if (onSynced) onSynced();
      alert(`¡Sincronización completada con éxito!\n\n${res.message}`);
    } catch (e) {
      alert('Error en la sincronización con la nube. Revisa tu conexión a internet.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={isSyncing}
      title="Actualizar y sincronizar con la nube (Subir modificaciones y descargar actualizaciones)"
      style={{
        background: 'var(--color-primary-glow, rgba(15, 82, 186, 0.12))',
        border: '1px solid var(--color-primary, #0f52ba)',
        borderRadius: '8px',
        color: 'var(--color-primary, #0f52ba)',
        fontSize: '0.78rem',
        fontWeight: 700,
        padding: '6px 12px',
        minHeight: '34px',
        cursor: isSyncing ? 'wait' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        whiteSpace: 'nowrap',
        transition: 'all 0.18s ease',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        ...style
      }}
      onMouseEnter={(e) => {
        if (!isSyncing) {
          e.currentTarget.style.opacity = '0.9';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSyncing) {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = 'none';
        }
      }}
    >
      <RefreshCw size={14} className={isSyncing ? 'spin' : ''} />
      <span>{isSyncing ? 'Actualizando...' : 'Actualizar'}</span>
    </button>
  );
};
