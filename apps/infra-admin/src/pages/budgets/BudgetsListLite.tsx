import React from 'react';
import { Card, Button, Input } from '@infrasuite/shared';
import { HardDrive, Cloud } from 'lucide-react';
import type { Budget } from './types';
import { LiteIcon, type LiteIconName } from './BudgetEditorLite';
import { isElectron } from '../../lib/databaseAdapter';
import { SyncButton } from '../../components/SyncButton';

interface BudgetsListLiteProps {
  budgets: Budget[];
  recientes: Budget[];
  antiguos: Budget[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  selectedGroup: string;
  setSelectedGroup: (v: string) => void;
  groups: string[];
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  resetBudgetForm: () => void;
  setIsCreateOpen: (v: boolean) => void;
  handleOpenBudgetEditor: (b: Budget) => void;
  handleOpenMenu: (e: React.MouseEvent, id: string) => void;
  closeMenu?: () => void;
  getBudgetCD: (b: Budget) => number;
  openBudgets: Budget[];
  handleSelectBudgetTab: (id: string) => void;
  handleCloseBudgetTab: (id: string, e: React.MouseEvent) => void;
  handleUploadBudget?: (file: File) => void;
  toggleTheme: () => void;
  theme: 'light' | 'dark';
  companies: any[];
  user: any;
  menuOpenId: string | null;
  menuPosition: { x: number; y: number };
  menuRef: React.RefObject<HTMLDivElement | null>;
  startEditBudget: (b: Budget) => void;
  handleDuplicateBudget: (id: string) => void;
  handleDeleteBudget: (id: string) => void;
  menuItemStyle?: React.CSSProperties;
  onNavigate?: (tab: string, budgetId?: string) => void;
  onShareBudget?: (b: Budget) => void;
  onDownloadBudget?: (b: Budget) => void;
  onSync?: () => void;
  isSyncing?: boolean;
}

const formatMoney = (value: number) =>
  value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatUpdatedLabel = (value?: number) => {
  if (!value) return 'Sin cambios recientes';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin cambios recientes';

  return `Modificado ${date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })} ${date.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit'
  })}`;
};

const HeaderIconButton: React.FC<{
  label: string;
  icon: LiteIconName;
  onClick: () => void;
}> = ({ label, icon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      minHeight: 36,
      padding: '8px 12px',
      background: 'var(--modal-panel-bg)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      color: 'var(--text-secondary)',
      fontSize: '0.78rem',
      fontWeight: 700,
      cursor: 'pointer',
      transition: 'all 0.18s ease',
      whiteSpace: 'nowrap'
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background = 'var(--modal-panel-hover-bg)';
      e.currentTarget.style.color = 'var(--text-primary)';
      e.currentTarget.style.borderColor = 'var(--color-primary)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = 'var(--modal-panel-bg)';
      e.currentTarget.style.color = 'var(--text-secondary)';
      e.currentTarget.style.borderColor = 'var(--border-color)';
    }}
  >
    <LiteIcon name={icon} size={15} />
    {label}
  </button>
);

const SectionTitle: React.FC<{
  icon: LiteIconName;
  title: string;
  tone?: 'primary' | 'muted';
  count: number;
}> = ({ icon, title, tone = 'primary', count }) => (
  <h3
    style={{
      fontFamily: 'var(--font-sans)',
      fontSize: '1.05rem',
      color: tone === 'primary' ? 'var(--color-primary)' : 'var(--text-secondary)',
      margin: '0 0 14px',
      display: 'flex',
      alignItems: 'center',
      gap: '9px',
      letterSpacing: 0
    }}
  >
    <LiteIcon name={icon} size={18} />
    <span>{title}</span>
    <span
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '0.72rem',
        fontWeight: 800,
        padding: '3px 8px',
        borderRadius: '999px',
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-muted)'
      }}
    >
      {count}
    </span>
  </h3>
);

const MetaChip: React.FC<{
  icon: LiteIconName;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '7px',
      minHeight: 26,
      padding: '4px 9px',
      borderRadius: '999px',
      border: '1px solid var(--border-color)',
      background: 'var(--modal-panel-bg)',
      color: 'var(--text-secondary)',
      fontSize: '0.78rem',
      lineHeight: 1
    }}
  >
    <LiteIcon name={icon} size={14} />
    <span>{label}: </span>
    <strong style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{value || '-'}</strong>
  </span>
);

const Tag: React.FC<{
  children: React.ReactNode;
  tone?: 'neutral' | 'blue' | 'green';
}> = ({ children, tone = 'neutral' }) => {
  const styles = {
    neutral: {
      background: 'var(--modal-panel-bg)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-color)'
    },
    blue: {
      background: 'rgba(37, 99, 235, 0.10)',
      color: 'var(--color-primary)',
      border: '1px solid rgba(37, 99, 235, 0.22)'
    },
    green: {
      background: 'rgba(16, 185, 129, 0.10)',
      color: 'var(--color-success)',
      border: '1px solid rgba(16, 185, 129, 0.22)'
    }
  }[tone];

  return (
    <span
      style={{
        ...styles,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        minHeight: 26,
        padding: '4px 10px',
        borderRadius: '999px',
        fontSize: '0.74rem',
        fontWeight: 800,
        lineHeight: 1,
        whiteSpace: 'nowrap'
      }}
    >
      {children}
    </span>
  );
};

const MenuAction: React.FC<{
  icon: LiteIconName;
  label: string;
  danger?: boolean;
  onClick: () => void;
}> = ({ icon, label, danger, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      width: '100%',
      border: 'none',
      background: 'transparent',
      color: danger ? 'var(--color-danger)' : 'var(--text-primary)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      minHeight: 38,
      padding: '9px 13px',
      fontSize: '0.86rem',
      fontWeight: 700,
      textAlign: 'left',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)'
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background = danger
        ? 'rgba(239, 68, 68, 0.10)'
        : 'var(--modal-panel-hover-bg)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = 'transparent';
    }}
  >
    <LiteIcon name={icon} size={16} />
    {label}
  </button>
);

export const BudgetsListLite: React.FC<BudgetsListLiteProps> = ({
  budgets,
  recientes,
  antiguos,
  searchTerm,
  setSearchTerm,
  selectedGroup,
  setSelectedGroup,
  groups,
  isLoading,
  setIsLoading,
  resetBudgetForm,
  setIsCreateOpen,
  handleOpenBudgetEditor,
  handleOpenMenu,
  closeMenu,
  getBudgetCD,
  openBudgets,
  handleSelectBudgetTab,
  handleCloseBudgetTab,
  handleUploadBudget,
  toggleTheme,
  theme,
  companies,
  user,
  menuOpenId,
  menuPosition,
  menuRef,
  startEditBudget,
  handleDuplicateBudget,
  handleDeleteBudget,
  onNavigate,
  onShareBudget,
  onDownloadBudget,
  onSync,
  isSyncing = false
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const closeBudgetMenu = () => closeMenu?.();

  const currentCompany =
    user?.role === 'SUPER_ADMIN'
      ? 'Suite Global'
      : companies.find(c => c.id === user?.empresaId)?.nombre || 'Cargando...';

  const openMenuBudget = menuOpenId ? budgets.find(x => x.id === menuOpenId) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-main)', overflow: 'hidden', width: '100%' }}>
      <style>{`
        @media (max-width: 768px) {
          .lite-header-top { flex-wrap: wrap !important; padding: 8px 12px !important; gap: 8px !important; }
          .lite-controls-card { padding: 14px !important; gap: 12px !important; }
          .lite-controls-group { width: 100% !important; flex-direction: column !important; align-items: stretch !important; }
          .lite-controls-group > button, .lite-controls-group > div { width: 100% !important; justify-content: center !important; }
          .lite-controls-group select { width: 100% !important; flex-grow: 1 !important; }
          .lite-search-box { max-width: 100% !important; width: 100% !important; }
        }
      `}</style>

      {/* ── TOP BRAND HEADER (ARRIBA DE TODO) ── */}
      <div className="lite-header-top" style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LiteIcon name="calculator" size={20} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary)', letterSpacing: '-0.5px' }}>InfraCost Lite</span>
            <span style={{ fontSize: '0.65rem', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', fontWeight: 'bold', padding: '2px 7px', borderRadius: '4px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>v1.0.1</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', marginLeft: 'auto' }}>
          <SyncButton />

          {onNavigate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderRight: '1px solid var(--border-color)', paddingRight: '8px' }}>
              <HeaderIconButton label="Compartido" icon="folder-open" onClick={() => onNavigate('shared')} />
              <HeaderIconButton label="Contactos" icon="users" onClick={() => onNavigate('contacts')} />
              <HeaderIconButton label="Papelera" icon="trash" onClick={() => onNavigate('trash')} />
            </div>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
            style={{
              background: 'var(--modal-panel-bg)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: '8px'
            }}
          >
            <LiteIcon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
          </button>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--modal-panel-bg)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)'
            }}
          >
            <LiteIcon name="database" size={14} />
            <strong style={{ color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentCompany}
            </strong>
          </span>
        </div>
      </div>

      {/* Tabs bar */}
      <div
        style={{
          minHeight: '44px',
          background: 'var(--bg-surface-elevated)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          gap: '10px',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', flexGrow: 1, minWidth: 0 }}>
          <button
            type="button"
            onClick={() => {}}
            style={{
              minHeight: 34,
              padding: '6px 14px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderBottom: 'none',
              borderRadius: '8px 8px 0 0',
              color: 'var(--color-primary)',
              fontSize: '0.82rem',
              cursor: 'pointer',
              fontWeight: 800,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <LiteIcon name="folder" size={15} />
            PRESUPUESTOS
          </button>

          {openBudgets.map(b => (
            <div key={b.id} style={{ position: 'relative', display: 'flex', alignItems: 'center', marginRight: 6, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => handleSelectBudgetTab(b.id)}
                title={b.nombre}
                style={{
                  minHeight: 34,
                  padding: '6px 34px 6px 12px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderBottom: 'none',
                  borderRadius: '8px 8px 0 0',
                  color: 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px'
                }}
              >
                <LiteIcon name="file-text" size={14} />
                <span style={{ maxWidth: '128px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.nombre}</span>
              </button>
              <button
                type="button"
                onClick={(e) => handleCloseBudgetTab(b.id, e)}
                title="Cerrar presupuesto"
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2
                }}
              >
                <LiteIcon name="x" size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div
        className="content-container"
        style={{
          position: 'relative',
          overflowY: 'auto',
          flexGrow: 1,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '22px'
        }}
      >
        {/* ── AI CREATION & SEARCH CARD (ADAPTED TO INFRACOST LITE) ── */}
        <div
          style={{
            background: theme === 'light' ? '#ffffff' : 'var(--bg-surface)',
            border: '1.5px solid rgba(22, 163, 74, 0.4)',
            borderRadius: '20px',
            padding: '22px 26px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: theme === 'light' ? '0 12px 35px rgba(22, 163, 74, 0.06)' : '0 12px 35px rgba(0,0,0,0.35)',
            transition: 'all 0.3s'
          }}
        >
          {/* Card Title & Subtitle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
                ¿Qué presupuesto deseas crear o buscar?
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                Usa la IA para generar análisis de costos o busca en tus presupuestos existentes
              </p>
            </div>
            
            {/* Group Filter Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Grupo:</span>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                style={{
                  background: 'var(--modal-input-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none'
                }}
              >
                {groups.map(g => (
                  <option key={g} value={g} style={{ background: 'var(--bg-surface)' }}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Main Textarea Input */}
          <div style={{ position: 'relative', width: '100%' }}>
            <textarea
              placeholder="Describe tu proyecto o busca por nombre de presupuesto, cliente o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'none',
                lineHeight: 1.5
              }}
            />
          </div>

          {/* Action Row Inside Card */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '14px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Create New Budget Button */}
              <Button
                onClick={() => {
                  resetBudgetForm();
                  setIsCreateOpen(true);
                }}
                style={{ background: 'var(--grad-primary)', border: 'none', minHeight: 38, padding: '0 16px', fontSize: '0.84rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: '20px' }}
              >
                <LiteIcon name="plus" size={16} />
                Nuevo Presupuesto
              </Button>

              {/* Upload File Button */}
              <Button
                onClick={() => fileInputRef.current?.click()}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', minHeight: 38, padding: '0 16px', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: '20px' }}
              >
                <LiteIcon name="upload" size={16} />
                Adjuntar / Subir
              </Button>
              <input 
                type="file" 
                accept=".json" 
                style={{ display: 'none' }} 
                ref={fileInputRef} 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && handleUploadBudget) {
                    handleUploadBudget(file);
                  }
                  e.target.value = '';
                }} 
              />

              {/* Sync Button */}
              <Button
                variant="secondary"
                onClick={() => {
                  if (onSync) onSync();
                  setIsLoading(true);
                  setTimeout(() => setIsLoading(false), 500);
                }}
                disabled={isSyncing}
                style={{ minHeight: 38, padding: '0 14px', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: '20px' }}
              >
                <LiteIcon name="refresh-cw" size={15} className={isSyncing ? 'spin' : ''} />
                {isSyncing ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </div>

            {/* Green Circular Action Button */}
            <button
              type="button"
              onClick={() => {
                resetBudgetForm();
                setIsCreateOpen(true);
              }}
              title="Crear o consultar presupuesto con IA"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
                transition: 'transform 0.2s, boxShadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>

          {/* Quick Action Chips inside Lite */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={() => setSearchTerm('Vivienda')}
              style={{
                background: 'var(--modal-panel-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#16a34a';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              🏠 Presupuesto de vivienda
            </button>

            <button
              type="button"
              onClick={() => setSearchTerm('Estructuras')}
              style={{
                background: 'var(--modal-panel-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#16a34a';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              📑 Análisis de precios unitarios
            </button>

            <button
              type="button"
              onClick={() => setSearchTerm('Metrado')}
              style={{
                background: 'var(--modal-panel-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#16a34a';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              🧮 Metrados de obra
            </button>

            <button
              type="button"
              onClick={() => setSearchTerm('Cronograma')}
              style={{
                background: 'var(--modal-panel-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#16a34a';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              📅 Cronograma y costos
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {isLoading ? (
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
                <div className="skeleton" style={{ height: '40px', width: '200px', borderRadius: '4px' }} />
                <div className="skeleton" style={{ height: '80px', width: '100%', borderRadius: '8px' }} />
                <div className="skeleton" style={{ height: '80px', width: '100%', borderRadius: '8px' }} />
              </div>
            </Card>
          ) : (
            <>
              {recientes.length > 0 && (
                <section>
                  <SectionTitle icon="sparkles" title="Recientes" count={recientes.length} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {recientes.map(b => (
                      <BudgetRow key={b.id} budget={b} onOpenMenu={handleOpenMenu} onOpen={handleOpenBudgetEditor} getCD={getBudgetCD} />
                    ))}
                  </div>
                </section>
              )}

              <section>
                <SectionTitle icon="folder" title="Antiguos" tone="muted" count={antiguos.length} />
                {antiguos.length === 0 && recientes.length === 0 ? (
                  <div
                    style={{
                      padding: '48px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      border: '1px dashed var(--border-color)',
                      borderRadius: '10px',
                      background: 'var(--bg-surface)'
                    }}
                  >
                    No se encontraron presupuestos en esta categoria.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {antiguos.map(b => (
                      <BudgetRow key={b.id} budget={b} onOpenMenu={handleOpenMenu} onOpen={handleOpenBudgetEditor} getCD={getBudgetCD} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {menuOpenId && openMenuBudget && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${Math.max(12, menuPosition.y + 8)}px`,
            left: `${Math.max(12, Math.min(menuPosition.x - 188, window.innerWidth - 232))}px`,
            zIndex: 9999,
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg), 0 18px 45px rgba(15, 23, 42, 0.18)',
            borderRadius: '10px',
            padding: '7px',
            width: '220px',
            animation: 'fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuAction
            icon="folder-open"
            label="Abrir presupuesto"
            onClick={() => {
              handleOpenBudgetEditor(openMenuBudget);
              closeBudgetMenu();
            }}
          />
          <MenuAction
            icon="link"
            label="Abrir en InfraCost Pro"
            onClick={() => {
              if (onNavigate) onNavigate('budgets_pro', openMenuBudget.id);
              closeBudgetMenu();
            }}
          />
          <MenuAction
            icon="edit"
            label="Datos generales"
            onClick={() => {
              startEditBudget(openMenuBudget);
              closeBudgetMenu();
            }}
          />
          <MenuAction
            icon="copy"
            label="Duplicar"
            onClick={() => {
              handleDuplicateBudget(menuOpenId);
              closeBudgetMenu();
            }}
          />
          <MenuAction
            icon="share"
            label="Compartir"
            onClick={() => {
              onShareBudget?.(openMenuBudget);
              closeBudgetMenu();
            }}
          />
          <MenuAction
            icon="upload"
            label="Descargar presupuesto (.json)"
            onClick={() => {
              if (openMenuBudget) onDownloadBudget?.(openMenuBudget);
              closeBudgetMenu();
            }}
          />
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '6px 2px' }} />
          <MenuAction
            icon="trash"
            label="Eliminar"
            danger
            onClick={() => {
              handleDeleteBudget(menuOpenId);
              closeBudgetMenu();
            }}
          />
        </div>
      )}
    </div>
  );
};

const BudgetRow: React.FC<{
  budget: Budget;
  onOpenMenu: (e: React.MouseEvent, id: string) => void;
  onOpen: (b: Budget) => void;
  getCD: (b: Budget) => number;
}> = ({ budget, onOpenMenu, onOpen, getCD }) => {
  const cd = getCD(budget);

  return (
    <div
      onDoubleClick={() => onOpen(budget)}
      className="budget-list-row"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: '18px',
        alignItems: 'center',
        padding: '20px 22px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '9px',
              background: 'rgba(37, 99, 235, 0.10)',
              color: 'var(--color-primary)',
              border: '1px solid rgba(37, 99, 235, 0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <LiteIcon name="file-text" size={18} />
          </div>
          <h4
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.04rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              lineHeight: '1.35',
              margin: 0,
              overflowWrap: 'anywhere'
            }}
          >
            {budget.nombre}
          </h4>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <MetaChip icon="user" label="Cliente" value={budget.cliente} />
          <MetaChip icon="calendar" label="Fecha base" value={budget.fechaBase} />
          <Tag tone="blue">{budget.grupo}</Tag>
          {isElectron() && (
            budget.isLocal ? (
              <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                <HardDrive size={13} /> Local
              </span>
            ) : (
              <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                <Cloud size={13} /> Nube
              </span>
            )
          )}
          <Tag tone="green">
            <LiteIcon name="clock" size={13} />
            {formatUpdatedLabel(budget.updatedAt)}
          </Tag>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', justifySelf: 'end' }}>
        <div style={{ textAlign: 'right', minWidth: 150 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Costo Directo</div>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.3rem',
              fontWeight: 900,
              color: 'var(--color-primary)',
              lineHeight: 1.25,
              whiteSpace: 'nowrap'
            }}
          >
            S/ {formatMoney(cd)}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenMenu(e, budget.id);
          }}
          style={{
            background: 'var(--modal-panel-bg)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            width: '40px',
            height: '40px',
            borderRadius: '9px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            flexShrink: 0
          }}
          className="three-dots-btn"
          title="Acciones"
        >
          <LiteIcon name="more-vertical" size={18} />
        </button>
      </div>
    </div>
  );
};
