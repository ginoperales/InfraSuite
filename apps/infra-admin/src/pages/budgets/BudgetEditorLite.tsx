import React, { useEffect, useState } from 'react';
import type { Budget, Partida, Insumo, PartidaColumnKey, ApuColumnKey, SharedPartidaBudgetRef } from './types';
import { exportPDF, exportExcel, type ExportOption } from './exportUtils';
import { SyncButton } from '../../components/SyncButton';

const tableInputStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'inherit',
  width: '100%',
  textAlign: 'right',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  outline: 'none',
  padding: 0
};

export type LiteIconName =
  | 'arrow-left'
  | 'arrow-down'
  | 'arrow-right'
  | 'arrow-up'
  | 'calculator'
  | 'calendar'
  | 'chart'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'clipboard-list'
  | 'database'
  | 'file-spreadsheet'
  | 'file-text'
  | 'folder'
  | 'folder-open'
  | 'indent'
  | 'link'
  | 'list'
  | 'lock'
  | 'more-vertical'
  | 'moon'
  | 'package'
  | 'pie'
  | 'plus'
  | 'redo'
  | 'settings'
  | 'share'
  | 'sigma'
  | 'sun'
  | 'trash'
  | 'outdent'
  | 'undo'
  | 'upload'
  | 'user'
  | 'users'
  | 'clock'
  | 'copy'
  | 'edit'
  | 'globe'
  | 'refresh-cw'
  | 'search'
  | 'sparkles'
  | 'x';

export const LiteIcon: React.FC<{ name: LiteIconName; size?: number; strokeWidth?: number; className?: string }> = ({
  name,
  size = 18,
  strokeWidth = 1.9,
  className
}) => {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const
  };

  const paths: Record<LiteIconName, React.ReactNode> = {
    'arrow-left': (
      <>
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </>
    ),
    'arrow-down': (
      <>
        <path d="M12 5v14" />
        <path d="m19 12-7 7-7-7" />
      </>
    ),
    'arrow-right': (
      <>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </>
    ),
    'arrow-up': (
      <>
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </>
    ),
    calculator: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 7h8" />
        <path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" />
      </>
    ),
    calendar: (
      <>
        <path d="M8 2v4M16 2v4" />
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 15v-4" />
        <path d="M12 15V8" />
        <path d="M16 15v-6" />
      </>
    ),
    'chevron-down': <path d="m6 9 6 6 6-6" />,
    'chevron-left': <path d="m15 18-6-6 6-6" />,
    'chevron-right': <path d="m9 18 6-6-6-6" />,
    'clipboard-list': (
      <>
        <rect x="8" y="3" width="8" height="4" rx="1" />
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <path d="M9 12h6" />
        <path d="M9 16h6" />
      </>
    ),
    database: (
      <>
        <ellipse cx="12" cy="5" rx="7" ry="3" />
        <path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />
        <path d="M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
      </>
    ),
    'file-spreadsheet': (
      <>
        <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
        <path d="M14 2v5h5" />
        <path d="M8 13h8M8 17h8M11 10v9" />
      </>
    ),
    'file-text': (
      <>
        <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
        <path d="M14 2v5h5" />
        <path d="M9 13h6" />
        <path d="M9 17h6" />
      </>
    ),
    folder: (
      <>
        <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v1H3z" />
        <path d="M3 10h18l-2 8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
      </>
    ),
    'folder-open': (
      <>
        <path d="M3 7a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v2" />
        <path d="M3 11h18l-2.2 7.2A2.5 2.5 0 0 1 16.4 20H6a2 2 0 0 1-1.9-1.4z" />
      </>
    ),
    indent: (
      <>
        <path d="M3 6h18" />
        <path d="M3 12h10" />
        <path d="M3 18h18" />
        <path d="m14 9 3 3-3 3" />
      </>
    ),
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
        <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1" />
      </>
    ),
    list: (
      <>
        <path d="M8 6h13" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <path d="M3 6h.01M3 12h.01M3 18h.01" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </>
    ),
    'more-vertical': (
      <>
        <path d="M12 5h.01" />
        <path d="M12 12h.01" />
        <path d="M12 19h.01" />
      </>
    ),
    moon: <path d="M21 13.4A8 8 0 1 1 10.6 3a6.5 6.5 0 0 0 10.4 10.4Z" />,
    package: (
      <>
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
        <path d="M12 12 4 7.5" />
        <path d="m12 12 8-4.5" />
        <path d="M12 12v9" />
      </>
    ),
    pie: (
      <>
        <path d="M21 12A9 9 0 1 1 12 3v9z" />
        <path d="M13 3.05A9 9 0 0 1 20.95 11H13z" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    redo: (
      <>
        <path d="m17 7 4 4-4 4" />
        <path d="M3 11h18" />
        <path d="M7 7H5a2 2 0 0 0-2 2v2" />
      </>
    ),
    settings: (
      <>
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6V21a2 2 0 1 1-4 0v-1a1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1H3a2 2 0 1 1 0-4h1a1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6V3a2 2 0 1 1 4 0v1a1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.35.4.67.6 1h1a2 2 0 1 1 0 4h-1a1.7 1.7 0 0 0-.6 1Z" />
      </>
    ),
    share: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 10.6 6.8-4.2M8.6 13.4l6.8 4.2" />
      </>
    ),
    sigma: (
      <>
        <path d="M18 4H7l6 8-6 8h11" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="m19 6-1 14H6L5 6" />
        <path d="M10 11v5M14 11v5" />
      </>
    ),
    outdent: (
      <>
        <path d="M3 6h18" />
        <path d="M11 12h10" />
        <path d="M3 18h18" />
        <path d="m10 9-3 3 3 3" />
      </>
    ),
    undo: (
      <>
        <path d="m7 7-4 4 4 4" />
        <path d="M21 11H3" />
        <path d="M17 7h2a2 2 0 0 1 2 2v2" />
      </>
    ),
    upload: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </>
    ),
    user: (
      <>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    users: (
      <>
        <path d="M16 21a6 6 0 0 0-12 0" />
        <circle cx="10" cy="7" r="4" />
        <path d="M22 21a5 5 0 0 0-4-4.9" />
        <path d="M16 3.1a4 4 0 0 1 0 7.8" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a14 14 0 0 1 0 18" />
        <path d="M12 3a14 14 0 0 0 0 18" />
      </>
    ),
    'refresh-cw': (
      <>
        <path d="M21 12a9 9 0 0 1-15.2 6.5" />
        <path d="M3 12A9 9 0 0 1 18.2 5.5" />
        <path d="M18 2v4h4" />
        <path d="M6 22v-4H2" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    sparkles: (
      <>
        <path d="M12 3 9.8 8.8 4 11l5.8 2.2L12 19l2.2-5.8L20 11l-5.8-2.2Z" />
        <path d="M19 3v4M21 5h-4M5 17v3M6.5 18.5h-3" />
      </>
    ),
    x: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    )
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className} {...common}>
      {paths[name]}
    </svg>
  );
};

interface BudgetEditorLiteProps {
  activeBudget: Budget;
  openBudgets: Budget[];
  handleSelectBudgetTab: (id: string) => void;
  handleCloseBudgetTab: (id: string, e: React.MouseEvent) => void;
  setViewState: (v: 'list' | 'editor') => void;
  toggleTheme: () => void;
  theme: 'light' | 'dark';
  companies: any[];
  user: any;
  getBudgetCD: (b: Budget) => number;
  
  // Navigation & Sidebar operations
  setIsDatosGeneralesOpen: (v: boolean) => void;
  setIsGastosGeneralesOpen: (v: boolean) => void;
  setIsPiePresupuestoOpen: (v: boolean) => void;
  setIsFormulaPolinomicaOpen: (v: boolean) => void;
  setIsCatalogoInsumosOpen: (v: boolean) => void;
  setIsCatalogoPartidasOpen: (v: boolean) => void;
  setIsListaInsumosOpen: (v: boolean) => void;
  setIsConfiguracionOpen: (v: boolean) => void;
  downloadActiveBudgetDatabase: () => void;

  // Editor spreadsheet states & operations
  selectedPartidaId: string | null;
  selectedPartidaIds: string[];
  setSelectedPartidaId: (v: string | null) => void;
  sidebarTab: string;
  setSidebarTab: (v: string) => void;
  isInfraCostSidebarCollapsed: boolean;
  setIsInfraCostSidebarCollapsed: (v: boolean) => void;
  showGridlines: boolean;
  
  // Table widths & resizing
  partidaColumnWidths: Record<PartidaColumnKey, number>;
  partidaTableWidth: number;
  renderPartidaHeader: (key: PartidaColumnKey, label: string) => React.ReactNode;
  
  // APU panel resizing & zoom
  apuPanelHeight: number;
  setApuPanelHeight: (v: number) => void;
  apuZoom: number;
  setApuZoom: (v: number) => void;
  apuColumnWidths: Record<ApuColumnKey, number>;
  apuTableWidth: number;
  renderApuHeader: (key: ApuColumnKey, label: string) => React.ReactNode;
  getAPUBreakdown: (p: Partida) => any;
  getPartidaCU: (p: Partida) => number;
  getPartidaParcial: (p: Partida) => number;
  getPartidaBreakdownTotal: (p: Partida) => { MO: number; MT: number; EQ: number; SC: number };
  getPartidaSharedBudgets: (p: Partida) => SharedPartidaBudgetRef[];
  
  // Handlers
  handlePartidaCellClick: (p: Partida, e?: React.MouseEvent) => void;
  handlePartidaDragEnter: (p: Partida) => void;
  handlePartidaDragEnd: () => void;
  handlePartidaContextMenu: (e: React.MouseEvent, p: Partida) => void;
  openEditPartidaModal: (p: Partida) => void;
  handleEmptyPartidasContextMenu: (e: React.MouseEvent) => void;
  handlePartidaCellChange: (pId: string, field: keyof Partida, val: any) => boolean | void;
  handleUpdateInsumoField: (pId: string, insId: string, field: keyof Insumo, val: any) => void;
  handleDeleteInsumo: (insId: string) => void;
  setSelectedSpecPartidaId: (id: string | null) => void;
  setIsAddInsumoOpen: (v: boolean) => void;
  getInsumoBaseCantidad: (ins: Insumo, rend: number) => number;
  getInsumoCantidad: (ins: Insumo, rend: number) => number;
  getInsumoParcial: (ins: Insumo, rend: number, partida?: Partida) => number;
  handleUndo?: () => void;
  handleRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  readOnly?: boolean;
  onShareBudget?: (b: Budget) => void;
  onSync?: () => void;
}

// ─── Export Dropdown Component ────────────────────────────────────────────

const EXPORT_OPTIONS: { value: ExportOption; label: string; icon: LiteIconName }[] = [
  { value: 'resumen',     label: 'Hoja Resumen',               icon: 'clipboard-list' },
  { value: 'presupuesto', label: 'Presupuesto',                icon: 'file-text' },
  { value: 'apu',         label: 'Análisis de Costos Unitarios', icon: 'calculator' },
  { value: 'insumos',     label: 'Listado de Insumos',         icon: 'package' },
  { value: 'polinomica',  label: 'Fórmula Polinómica',         icon: 'sigma' },
];

export const ExportDropdowns: React.FC<{ budget: Budget }> = ({ budget }) => {
  const [openMenu, setOpenMenu] = useState<'pdf' | 'excel' | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (type: 'pdf' | 'excel', option: ExportOption) => {
    setLoading(`${type}-${option}`);
    setOpenMenu(null);
    try {
      if (type === 'pdf') await exportPDF(option, budget);
      else                await exportExcel(option, budget);
    } catch (e) {
      console.error('Export error', e);
      window.alert(type === 'excel' ? 'No se pudo generar el archivo Excel.' : 'No se pudo generar el archivo PDF.');
    } finally {
      setLoading(null);
    }
  };

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '6px 14px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 700,
    border: '1px solid',
    transition: 'all 0.15s',
  };

  const menuStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    zIndex: 999,
    background: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    overflow: 'hidden',
    minWidth: '220px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* PDF Button */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpenMenu(openMenu === 'pdf' ? null : 'pdf')}
          style={{ ...btnBase, background: 'rgba(220,38,38,0.08)', borderColor: 'rgba(220,38,38,0.4)', color: '#f87171' }}
          title="Exportar a PDF"
        >
          <LiteIcon name={loading?.startsWith('pdf') ? 'redo' : 'file-text'} size={16} />
          PDF
          <LiteIcon name="chevron-down" size={14} />
        </button>
        {openMenu === 'pdf' && (
          <div style={menuStyle}>
            {EXPORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleExport('pdf', opt.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                  padding: '9px 14px', background: 'transparent', border: 'none',
                  color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.82rem',
                  textAlign: 'left', borderBottom: '1px solid var(--border-color)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ display: 'inline-flex', color: 'currentColor' }}>
                  <LiteIcon name={opt.icon} size={16} />
                </span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Excel Button */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpenMenu(openMenu === 'excel' ? null : 'excel')}
          style={{ ...btnBase, background: 'rgba(22,163,74,0.08)', borderColor: 'rgba(22,163,74,0.4)', color: '#4ade80' }}
          title="Exportar a Excel"
        >
          <LiteIcon name={loading?.startsWith('excel') ? 'redo' : 'file-spreadsheet'} size={16} />
          Excel
          <LiteIcon name="chevron-down" size={14} />
        </button>
        {openMenu === 'excel' && (
          <div style={menuStyle}>
            {EXPORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleExport('excel', opt.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                  padding: '9px 14px', background: 'transparent', border: 'none',
                  color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.82rem',
                  textAlign: 'left', borderBottom: '1px solid var(--border-color)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(22,163,74,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ display: 'inline-flex', color: 'currentColor' }}>
                  <LiteIcon name={opt.icon} size={16} />
                </span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Click-outside overlay */}
      {openMenu && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 998 }}
          onClick={() => setOpenMenu(null)}
        />
      )}
    </div>
  );
};
// ─── Componente de Programación de Obra (Gantt & Cronograma) ────────────────

const ProgramacionObraView: React.FC<{
  budget: Budget;
  cd: number;
}> = ({ budget, cd }) => {
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [activeSubTab, setActiveSubTab] = useState<'gantt' | 'valorizado'>('gantt');

  const partidasNoTitulos = budget.partidas.filter(p => !p.esTitulo);

  const getPartidaDuration = (p: Partida) => {
    if (durations[p.id]) return durations[p.id];
    if (p.rendimiento && p.rendimiento > 0 && p.metrado && p.metrado > 0) {
      return Math.ceil(p.metrado / p.rendimiento);
    }
    return 5;
  };

  const totalDays = partidasNoTitulos.reduce((sum, p) => sum + getPartidaDuration(p), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100%', overflow: 'hidden', background: 'var(--bg-main)' }}>
      {/* Top Banner */}
      <div style={{ padding: '14px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LiteIcon name="calendar" size={18} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              Programación de Obra (Gantt & Cronograma)
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Planificación temporal y cronograma de ejecución para <strong style={{ color: 'var(--color-primary)' }}>{budget.nombre}</strong>
            </span>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--modal-panel-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 12px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Duración Total</span>
            <strong style={{ fontSize: '0.9rem', color: '#22c55e', fontWeight: 800 }}>{totalDays || 90} Días Calendario</strong>
          </div>
          <div style={{ background: 'var(--modal-panel-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 12px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Monto Programado</span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--color-primary)', fontFamily: 'monospace', fontWeight: 800 }}>S/ {cd.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong>
          </div>
          <div style={{ background: 'var(--modal-panel-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 12px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Ruta Crítica (CPM)</span>
            <strong style={{ fontSize: '0.82rem', color: '#f59e0b', fontWeight: 800 }}>{Math.min(partidasNoTitulos.length, 12)} Partidas Críticas</strong>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{ padding: '8px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('gantt')}
            style={{
              padding: '5px 14px',
              borderRadius: '6px',
              background: activeSubTab === 'gantt' ? '#22c55e' : 'transparent',
              color: activeSubTab === 'gantt' ? '#ffffff' : 'var(--text-secondary)',
              border: activeSubTab === 'gantt' ? 'none' : '1px solid var(--border-color)',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LiteIcon name="chart" size={14} />
            <span>Diagrama de Gantt</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('valorizado')}
            style={{
              padding: '5px 14px',
              borderRadius: '6px',
              background: activeSubTab === 'valorizado' ? '#22c55e' : 'transparent',
              color: activeSubTab === 'valorizado' ? '#ffffff' : 'var(--text-secondary)',
              border: activeSubTab === 'valorizado' ? 'none' : '1px solid var(--border-color)',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LiteIcon name="calculator" size={14} />
            <span>Cronograma Valorizado</span>
          </button>
        </div>
      </div>

      {/* Main Gantt Table Area */}
      <div style={{ flexGrow: 1, overflow: 'auto', padding: '16px 20px' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: 'var(--modal-panel-bg)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', width: '70px' }}>Item</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', minWidth: '200px' }}>Descripción de Partida</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', width: '60px' }}>Und.</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', width: '80px' }}>Metrado</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', width: '90px' }}>Rend/Día</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', width: '90px' }}>Duración (Días)</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', minWidth: '340px' }}>Línea de Tiempo / Diagrama de Gantt</th>
                </tr>
              </thead>
              <tbody>
                {budget.partidas.map((p, idx) => {
                  const isTitle = p.esTitulo;
                  const dur = isTitle ? 0 : getPartidaDuration(p);
                  const startPct = Math.min((idx * 4) % 70, 70);
                  const barWidthPct = Math.max(15, Math.min(dur * 4, 30));

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)', background: isTitle ? 'rgba(34, 197, 94, 0.04)' : 'transparent' }}>
                      <td style={{ padding: '8px 12px', fontWeight: isTitle ? 800 : 500, color: isTitle ? 'var(--color-primary)' : 'var(--text-primary)' }}>{p.item}</td>
                      <td style={{ padding: '8px 12px', fontWeight: isTitle ? 800 : 600, color: isTitle ? 'var(--color-primary)' : 'var(--text-primary)' }}>{p.nombre}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{p.unidad || '-'}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace' }}>{isTitle ? '' : (p.metrado || 0).toLocaleString('es-PE')}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace' }}>{isTitle ? '' : (p.rendimiento || 0).toLocaleString('es-PE')}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        {!isTitle && (
                          <input
                            type="number"
                            value={dur}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                              setDurations(prev => ({ ...prev, [p.id]: val }));
                            }}
                            style={{ width: '56px', padding: '3px 5px', textAlign: 'center', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'var(--modal-panel-bg)', color: 'var(--text-primary)', fontWeight: 700 }}
                          />
                        )}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {!isTitle && (
                          <div style={{ position: 'relative', width: '100%', height: '18px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                position: 'absolute',
                                left: `${startPct}%`,
                                width: `${barWidthPct}%`,
                                height: '100%',
                                background: idx % 3 === 0 ? 'linear-gradient(90deg, #22c55e, #16a34a)' : '#22c55e',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                boxShadow: '0 2px 6px rgba(34, 197, 94, 0.3)'
                              }}
                            >
                              {dur}d
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BudgetEditorLite: React.FC<BudgetEditorLiteProps> = ({
  activeBudget,
  openBudgets,
  handleSelectBudgetTab,
  handleCloseBudgetTab,
  setViewState,
  toggleTheme,
  theme,
  companies,
  user,
  getBudgetCD,

  setIsDatosGeneralesOpen,
  setIsGastosGeneralesOpen,
  setIsPiePresupuestoOpen,
  setIsFormulaPolinomicaOpen,
  setIsCatalogoInsumosOpen,
  setIsCatalogoPartidasOpen,
  setIsListaInsumosOpen,
  setIsConfiguracionOpen,
  downloadActiveBudgetDatabase,

  selectedPartidaId,
  selectedPartidaIds,
  setSelectedPartidaId,
  sidebarTab,
  isInfraCostSidebarCollapsed,
  setIsInfraCostSidebarCollapsed,
  showGridlines,

  partidaColumnWidths,
  partidaTableWidth,
  renderPartidaHeader,

  apuPanelHeight,
  setApuPanelHeight,
  apuZoom,
  setApuZoom,
  apuColumnWidths,
  apuTableWidth,
  renderApuHeader,
  getAPUBreakdown,
  getPartidaCU,
  getPartidaParcial,
  getPartidaSharedBudgets,

  handlePartidaCellClick,
  handlePartidaDragEnter,
  handlePartidaDragEnd,
  handlePartidaContextMenu,
  openEditPartidaModal,
  handleEmptyPartidasContextMenu,
  handlePartidaCellChange,
  handleUpdateInsumoField,
  handleDeleteInsumo,
  setSelectedSpecPartidaId,
  setIsAddInsumoOpen,
  getInsumoBaseCantidad,
  getInsumoCantidad,
  getInsumoParcial,
  getPartidaBreakdownTotal,
  handleUndo,
  handleRedo,
  canUndo,
  canRedo,
  readOnly = false,
  onShareBudget,
  onSync
}) => {
  const [apuDraftValues, setApuDraftValues] = useState<Record<string, string>>({});
  const [mobileApuPartidaId, setMobileApuPartidaId] = useState<string | null>(null);
  const [isLiteMobileSidebarOpen, setIsLiteMobileSidebarOpen] = useState(false);
  const [activeEditorMode, setActiveEditorMode] = useState<'presupuesto' | 'programacion'>('presupuesto');
  const [sharedPartidaDialog, setSharedPartidaDialog] = useState<{
    partida: Partida;
    budgets: SharedPartidaBudgetRef[];
  } | null>(null);

  const parseApuNumber = (rawValue: string) => {
    const normalized = rawValue.trim().replace(',', '.');
    if (!normalized || normalized === '-' || normalized === '.' || normalized === '-.') return null;
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const getApuInputValue = (key: string, value: number) => {
    return apuDraftValues[key] ?? String(value);
  };

  const handleApuNumberChange = (key: string, rawValue: string, onValidValue: (value: number) => void) => {
    setApuDraftValues(prev => ({ ...prev, [key]: rawValue }));
    const parsed = parseApuNumber(rawValue);
    if (parsed !== null) onValidValue(parsed);
  };

  const clearApuDraftValue = (key: string) => {
    setApuDraftValues(prev => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const isManualToolsInsumo = (ins: Pick<Insumo, 'nombre' | 'unidad'>) => {
    const unidad = (ins.unidad || '').trim().toUpperCase();
    const nombre = (ins.nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    return unidad === '%MO' || nombre.includes('HERRAMIENTAS MANUALES');
  };

  const getManualToolsUnitPrice = (partida: Partida) => {
    return partida.insumos.reduce((sum, item) => {
      if (item.tipo !== 'MO' || isManualToolsInsumo(item)) return sum;
      return sum + getInsumoCantidad(item, partida.rendimiento) * item.pu;
    }, 0);
  };

  const cd = getBudgetCD(activeBudget);
  const gg = cd * 0.10;
  const ut = cd * 0.05;
  const sub = cd + gg + ut;
  const igv = sub * 0.18;
  const total = sub + igv;

  const selectedPartida = activeBudget.partidas.find(p => p.id === selectedPartidaId);
  const apuBreakdown = selectedPartida ? getAPUBreakdown(selectedPartida) : { MO: 0, MT: 0, EQ: 0, SC: 0, SP: 0 };
  const mobileApuPartida = activeBudget.partidas.find(p => p.id === mobileApuPartidaId) || null;
  const mobileApuBreakdown = mobileApuPartida ? getAPUBreakdown(mobileApuPartida) : { MO: 0, MT: 0, EQ: 0, SC: 0, SP: 0 };

  useEffect(() => {
    if (!selectedPartidaId) return;
    const row = document.querySelector(`[data-partida-row-id="${selectedPartidaId}"]`);
    row?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [selectedPartidaId]);

  const getResourceTypeColor = (tipo: Insumo['tipo']) => {
    if (tipo === 'MO') return '#ff7a00';
    if (tipo === 'MT') return '#3b82f6';
    if (tipo === 'EQ') return '#10b981';
    if (tipo === 'SC') return '#ec4899';
    return '#8b5cf6';
  };

  const openMobileApu = (partida: Partida) => {
    setSelectedPartidaId(partida.id);
    if (!partida.esTitulo) {
      setMobileApuPartidaId(partida.id);
    }
  };

  const handlePartidasAreaContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-partida-row-id], input, textarea, select, button, [contenteditable="true"]')) return;

    if (readOnly) {
      e.preventDefault();
      return;
    }

    handleEmptyPartidasContextMenu(e);
  };

  const renderSharedPartidaBadge = (partida: Partida) => {
    const sharedBudgets = getPartidaSharedBudgets(partida);
    if (sharedBudgets.length < 2) return null;

    const label = `Esta partida esta en ${sharedBudgets.length} presupuestos`;
    return (
      <button
        type="button"
        title={label}
        aria-label={label}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSharedPartidaDialog({ partida, budgets: sharedBudgets });
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          flexShrink: 0,
          width: 'fit-content',
          padding: '2px 6px',
          borderRadius: 999,
          border: '1px solid rgba(14, 165, 233, 0.38)',
          background: 'rgba(14, 165, 233, 0.12)',
          color: '#38bdf8',
          fontSize: '0.68rem',
          fontWeight: 900,
          lineHeight: 1,
          cursor: 'pointer'
        }}
      >
        <LiteIcon name="link" size={12} strokeWidth={2.2} />
        <span>{sharedBudgets.length}</span>
      </button>
    );
  };

  return (
    <div className="budget-editor-lite-shell" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-main)', overflow: 'hidden', width: '100%' }}>
      <style>{`
        .budget-editor-lite-mobile-partidas {
          display: none;
        }

        .budget-editor-lite-sidebar-toggle,
        .budget-editor-lite-sidebar-backdrop,
        .budget-editor-lite-mobile-sidebar-close {
          display: none;
        }

        .budget-editor-lite-partidas-table {
          display: table;
        }

        @media (max-width: 900px) {
          .budget-editor-lite-shell {
            height: auto !important;
            min-height: 100vh;
            overflow: auto !important;
          }

          .budget-editor-lite-tabs,
          .budget-editor-lite-toolbar,
          .budget-editor-lite-apu-header {
            height: auto !important;
            min-height: 52px;
            align-items: stretch !important;
            flex-wrap: wrap;
            padding: 8px 12px !important;
          }

          .budget-editor-lite-tabs {
            padding-left: 78px !important;
          }

          .budget-editor-lite-toolbar > div,
          .budget-editor-lite-apu-header > div {
            flex-wrap: wrap;
          }

          .budget-editor-lite-workspace {
            flex-direction: column !important;
            overflow: visible !important;
          }

          .budget-editor-lite-sidebar-toggle {
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            gap: 7px;
            min-height: 36px;
            padding: 0 12px;
            border-radius: 999px;
            border: 1px solid var(--border-color);
            background: var(--modal-panel-bg);
            color: var(--text-primary);
            font-family: var(--font-sans);
            font-size: 0.8rem;
            font-weight: 850;
            cursor: pointer;
            flex-shrink: 0;
          }

          .budget-editor-lite-sidebar-backdrop {
            position: fixed;
            inset: 0;
            z-index: 10010;
            display: block;
            border: 0;
            background: rgba(15, 23, 42, 0.52);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
          }

          .budget-editor-lite-sidebar {
            position: fixed !important;
            top: 0;
            bottom: 0;
            left: 0;
            z-index: 10020;
            display: flex !important;
            width: min(84vw, 292px) !important;
            max-height: none;
            border-right: 1px solid var(--border-color);
            transform: translateX(-108%);
            transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 24px 0 58px rgba(0, 0, 0, 0.34);
          }

          .budget-editor-lite-sidebar.mobile-open {
            transform: translateX(0);
          }

          .budget-editor-lite-desktop-sidebar-collapse {
            display: none !important;
          }

          .budget-editor-lite-mobile-sidebar-close {
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            border-radius: 999px;
            border: 1px solid var(--border-color);
            background: var(--modal-panel-bg);
            color: var(--text-primary);
            cursor: pointer;
          }

          .budget-editor-lite-main {
            min-height: 0;
            overflow: visible !important;
          }

          .budget-editor-lite-table-scroll {
            min-height: 0;
            max-height: none;
            overflow: visible !important;
          }

          .budget-editor-lite-apu-pane {
            display: none !important;
          }

          .budget-editor-lite-partidas-table {
            display: none !important;
          }

          .budget-editor-lite-mobile-partidas {
            display: grid;
            gap: 10px;
            padding: 12px;
            background: var(--bg-main);
          }
        }

        @media (max-width: 640px) {
          .budget-editor-lite-tabs,
          .budget-editor-lite-toolbar,
          .budget-editor-lite-apu-header {
            gap: 8px !important;
          }

          .budget-editor-lite-main {
            min-height: 0;
          }

          .budget-editor-lite-mobile-partidas {
            padding: 10px;
          }
        }
      `}</style>
      {/* Global Tabs Bar */}
      <div className="budget-editor-lite-tabs" style={{
        height: '44px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 14px 0 14px',
        gap: '12px',
        flexShrink: 0
      }}>
        {/* Left: Logo & Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto', flexGrow: 1, minWidth: 0 }}>
          {/* Logo Badge (SI O SI A LA IZQUIERDA Y CON LA MISMA TIPOGRAFIA) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '4px', flexShrink: 0 }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LiteIcon name="calculator" size={16} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.02rem', color: 'var(--color-primary)', letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>InfraCost Lite</span>
            <span style={{ fontSize: '0.6rem', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', fontWeight: 'bold', padding: '1px 5px', borderRadius: '4px', border: '1px solid rgba(34, 197, 94, 0.3)', whiteSpace: 'nowrap' }}>v1.0.1</span>
          </div>

          <button
            onClick={() => setViewState('list')}
            style={{
              minHeight: 34,
              padding: '5px 14px',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderBottom: 'none',
              borderRadius: '6px 6px 0 0',
              color: 'var(--text-secondary)',
              fontSize: '0.81rem',
              cursor: 'pointer',
              fontWeight: 650,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              fontFamily: 'inherit'
            }}
          >
            <LiteIcon name="folder" size={15} />
            PRESUPUESTOS
          </button>

          {openBudgets.map(b => (
            <div key={b.id} style={{ position: 'relative', display: 'flex', alignItems: 'center', marginRight: 4, flexShrink: 0 }}>
              <button
                onClick={() => handleSelectBudgetTab(b.id)}
                title={b.nombre}
                style={{
                  minHeight: 34,
                  padding: '5px 30px 5px 10px',
                  background: activeBudget.id === b.id ? 'var(--bg-main)' : 'transparent',
                  border: '1px solid var(--border-color)',
                  borderBottom: 'none',
                  borderRadius: '6px 6px 0 0',
                  color: activeBudget.id === b.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                  fontSize: '0.81rem',
                  cursor: 'pointer',
                  fontWeight: activeBudget.id === b.id ? 750 : 650,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: activeBudget.id === b.id ? '0 -2px 10px rgba(0,0,0,0.03)' : 'none',
                  fontFamily: 'inherit'
                }}
              >
                <LiteIcon name="file-text" size={14} />
                <span style={{ maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.nombre}</span>
              </button>
              <button
                onClick={(e) => handleCloseBudgetTab(b.id, e)}
                style={{
                  position: 'absolute',
                  right: '5px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  width: 20,
                  height: 20,
                  borderRadius: 4,
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

        {/* Right Controls in Editor Tab Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, paddingBottom: '4px' }}>
          <SyncButton />

          <button
            type="button"
            onClick={() => { if (onSync) onSync(); }}
            title="Actualizar presupuesto y datos"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--modal-panel-bg)',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            <LiteIcon name="refresh-cw" size={14} />
            <span>Actualizar</span>
          </button>

          {onShareBudget && (
            <button
              type="button"
              onClick={() => onShareBudget(activeBudget)}
              title="Compartir Presupuesto"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(34, 197, 94, 0.35)',
                background: 'rgba(34, 197, 94, 0.12)',
                fontSize: '0.78rem',
                fontWeight: 750,
                color: '#22c55e',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              <LiteIcon name="share" size={14} />
              <span>Compartir</span>
            </button>
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
              width: 32,
              height: 32,
              borderRadius: '8px'
            }}
          >
            <LiteIcon name={theme === 'dark' ? 'sun' : 'moon'} size={15} />
          </button>
        </div>
      </div>

      {/* Top toolbar */}
      <div className="budget-editor-lite-toolbar" style={{
        height: '48px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            className="budget-editor-lite-sidebar-toggle"
            onClick={() => {
              setIsInfraCostSidebarCollapsed(false);
              setIsLiteMobileSidebarOpen(true);
            }}
          >
            <LiteIcon name="settings" size={16} />
            Opciones
          </button>
          <button
            type="button"
            onClick={() => setActiveEditorMode(activeEditorMode === 'presupuesto' ? 'programacion' : 'presupuesto')}
            style={{
              background: activeEditorMode === 'presupuesto' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(59, 130, 246, 0.12)',
              border: activeEditorMode === 'presupuesto' ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(59, 130, 246, 0.35)',
              color: activeEditorMode === 'presupuesto' ? '#22c55e' : '#3b82f6',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              transition: 'all 0.18s ease'
            }}
            title={activeEditorMode === 'presupuesto' ? 'Cambiar a Interfaz de Programación de Obra' : 'Volver a Interfaz de Presupuesto'}
          >
            <LiteIcon name={activeEditorMode === 'presupuesto' ? 'calendar' : 'calculator'} size={15} />
            <span>{activeEditorMode === 'presupuesto' ? 'Programar' : 'Presupuestar'}</span>
          </button>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Presupuesto: <strong style={{ color: 'var(--text-primary)' }}>{activeBudget.nombre}</strong>
          </span>
        </div>

        {/* ── Export Buttons & Sync ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
          <SyncButton />
          <ExportDropdowns budget={activeBudget} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {readOnly && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.22)', color: '#22c55e', borderRadius: '999px', padding: '6px 12px', fontSize: '0.78rem', fontWeight: 800 }}>
              <LiteIcon name="lock" size={14} />
              Solo lectura
            </div>
          )}
          <div style={{
            background: 'rgba(0, 240, 255, 0.05)',
            border: '1px solid rgba(0, 240, 255, 0.25)',
            borderRadius: '4px',
            padding: '6px 14px',
            fontSize: '0.82rem'
          }}>
            <span style={{ color: 'var(--text-muted)' }}>Costo Directo Total: </span>
            <strong style={{ color: 'var(--color-primary)', fontFamily: 'monospace', fontSize: '0.96rem', fontWeight: 800 }}>S/ {cd.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>
      </div>

      {/* Main Workspace split */}
      <div className="budget-editor-lite-workspace" style={{ display: 'flex', flexGrow: 1, overflow: 'hidden', position: 'relative', minWidth: 0 }}>
        {isLiteMobileSidebarOpen && (
          <button
            type="button"
            className="budget-editor-lite-sidebar-backdrop"
            onClick={() => setIsLiteMobileSidebarOpen(false)}
            aria-label="Cerrar opciones de InfraCost Lite"
          />
        )}
        
        {/* Left Side: Modular Navigation Sidebar */}
        <div className={`budget-editor-lite-sidebar ${isLiteMobileSidebarOpen ? 'mobile-open' : ''}`} style={{
          width: isInfraCostSidebarCollapsed ? '48px' : '220px',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Collapse toggle */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: isInfraCostSidebarCollapsed ? 'center' : 'flex-end' }}>
            <button
              className="budget-editor-lite-desktop-sidebar-collapse"
              onClick={() => setIsInfraCostSidebarCollapsed(!isInfraCostSidebarCollapsed)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28 }}
            >
              <LiteIcon name={isInfraCostSidebarCollapsed ? 'chevron-right' : 'chevron-left'} size={17} />
            </button>
            <button
              type="button"
              className="budget-editor-lite-mobile-sidebar-close"
              onClick={() => setIsLiteMobileSidebarOpen(false)}
              aria-label="Cerrar opciones"
            >
              <LiteIcon name="x" size={17} />
            </button>
          </div>

          {/* Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px', flexGrow: 1, overflowY: 'auto' }}>
            {[
              { label: 'Datos Generales', icon: 'file-text' as LiteIconName, onClick: () => setIsDatosGeneralesOpen(true) },
              { label: 'Gastos Generales', icon: 'chart' as LiteIconName, onClick: () => setIsGastosGeneralesOpen(true) },
              { label: 'Pie de Presupuesto', icon: 'pie' as LiteIconName, onClick: () => setIsPiePresupuestoOpen(true) },
              { label: 'Fórmula Polinómica', icon: 'sigma' as LiteIconName, onClick: () => setIsFormulaPolinomicaOpen(true) },
              { label: 'Catálogo de Insumos', icon: 'package' as LiteIconName, onClick: () => setIsCatalogoInsumosOpen(true) },
              { label: 'Catálogo de Partidas', icon: 'folder-open' as LiteIconName, onClick: () => setIsCatalogoPartidasOpen(true) },
              { label: 'Lista de Insumos', icon: 'list' as LiteIconName, onClick: () => setIsListaInsumosOpen(true) },
              { label: 'Exportar Base JSON', icon: 'database' as LiteIconName, onClick: downloadActiveBudgetDatabase },
              { label: 'Configuración', icon: 'settings' as LiteIconName, onClick: () => setIsConfiguracionOpen(true) }
            ].filter(item => !readOnly || ['FÃ³rmula PolinÃ³mica', 'Lista de Insumos'].includes(item.label)).map(item => (
              <button
                key={item.label}
                onClick={() => {
                  item.onClick();
                  setIsLiteMobileSidebarOpen(false);
                }}
                title={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: '4px',
                  textAlign: 'left',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <span style={{ display: 'inline-flex', width: 20, alignItems: 'center', justifyContent: 'center', color: 'currentColor', flexShrink: 0 }}>
                  <LiteIcon name={item.icon} size={17} />
                </span>
                {!isInfraCostSidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Main View (Presupuesto o Programación de Obra) */}
        {activeEditorMode === 'programacion' ? (
          <ProgramacionObraView budget={activeBudget} cd={cd} />
        ) : (
          <div className="budget-editor-lite-main" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', minWidth: 0 }}>
          
          {/* Top Half: Spreadsheet Table */}
          <div
            className="budget-editor-lite-table-scroll"
            onContextMenu={handlePartidasAreaContextMenu}
            style={{ flexGrow: 1, overflow: 'auto', background: 'var(--bg-main)' }}
          >
            <div className="budget-editor-lite-mobile-partidas">
              {activeBudget.partidas.map(p => {
                const isSelected = selectedPartidaId === p.id || selectedPartidaIds.includes(p.id);
                const itemCU = getPartidaCU(p);
                const itemParcial = getPartidaParcial(p);
                const brtotal = getPartidaBreakdownTotal(p);

                if (p.esTitulo) {
                  return (
                    <div
                      key={p.id}
                      data-partida-row-id={p.id}
                      onClick={() => setSelectedPartidaId(p.id)}
                      onContextMenu={(e) => {
                        if (readOnly) {
                          e.preventDefault();
                          setSelectedPartidaId(p.id);
                          return;
                        }
                        handlePartidaContextMenu(e, p);
                      }}
                      style={{
                        padding: '11px 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(139, 92, 246, 0.22)',
                        background: 'rgba(139, 92, 246, 0.08)',
                        color: 'var(--color-secondary)',
                        fontWeight: 900,
                        display: 'flex',
                        gap: 10,
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', flexShrink: 0 }}>{p.item}</span>
                      {renderSharedPartidaBadge(p)}
                      <span style={{ fontSize: '0.86rem', lineHeight: 1.35 }}>{p.nombre}</span>
                    </div>
                  );
                }

                return (
                  <button
                    key={p.id}
                    data-partida-row-id={p.id}
                    type="button"
                    onClick={() => openMobileApu(p)}
                    onContextMenu={(e) => {
                      if (readOnly) {
                        e.preventDefault();
                        setSelectedPartidaId(p.id);
                        return;
                      }
                      handlePartidaContextMenu(e, p);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      border: isSelected ? '1px solid rgba(37, 99, 235, 0.36)' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      borderRadius: 10,
                      padding: '12px',
                      display: 'grid',
                      gap: 10,
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 10px 24px rgba(37, 99, 235, 0.10)' : 'none',
                      fontFamily: 'var(--font-sans)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span>{p.item}</span>
                          {renderSharedPartidaBadge(p)}
                        </div>
                        <div style={{ fontWeight: 850, fontSize: '0.94rem', lineHeight: 1.35, overflowWrap: 'anywhere' }}>{p.nombre}</div>
                      </div>
                      <span style={{ border: '1px solid var(--border-color)', borderRadius: 999, padding: '5px 9px', color: 'var(--color-primary)', fontWeight: 850, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        Ver APU
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                      <div style={{ background: 'var(--modal-panel-bg)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>Und.</div>
                        <strong style={{ fontSize: '0.86rem' }}>{p.unidad || '-'}</strong>
                      </div>
                      <div style={{ background: 'var(--modal-panel-bg)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>Metrado</div>
                        <input
                          type="number"
                          step="0.01"
                          value={p.metrado}
                          readOnly={readOnly}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            if (!readOnly) handlePartidaCellChange(p.id, 'metrado', parseFloat(e.target.value) || 0);
                          }}
                          style={{ ...tableInputStyle, textAlign: 'left', fontWeight: 850, cursor: readOnly ? 'default' : 'text' }}
                        />
                      </div>
                      <div style={{ background: 'var(--modal-panel-bg)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>CU</div>
                        <strong style={{ fontSize: '0.86rem' }}>S/ {itemCU.toFixed(2)}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.96rem' }}>
                        S/ {itemParcial.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </strong>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {[
                          ['MO', brtotal.MO, '#ff7a00'],
                          ['MT', brtotal.MT, '#3b82f6'],
                          ['EQ', brtotal.EQ, '#10b981'],
                          ['SC', brtotal.SC, '#ec4899']
                        ].filter(([, value]) => Number(value) > 0).map(([label, value, color]) => (
                          <span key={String(label)} style={{ color: String(color), background: 'var(--modal-panel-bg)', border: '1px solid var(--border-color)', borderRadius: 999, padding: '4px 7px', fontSize: '0.7rem', fontWeight: 850 }}>
                            {label}: S/ {Number(value).toFixed(2)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <table className={`${showGridlines ? 'table-gridlines ' : ''}budget-editor-lite-partidas-table`} style={{ width: `${partidaTableWidth}px`, borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem', fontFamily: 'var(--font-sans)', userSelect: 'none' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface-elevated)' }}>
                <tr>
                  {renderPartidaHeader('item', 'Item')}
                  {renderPartidaHeader('descripcion', 'Descripción')}
                  {renderPartidaHeader('unidad', 'Unidad')}
                  {renderPartidaHeader('metrado', 'Metrado')}
                  {renderPartidaHeader('cu', 'Unitario (S/)')}
                  {renderPartidaHeader('parcial', 'Parcial (S/)')}
                  {renderPartidaHeader('mo', 'M. Obra')}
                  {renderPartidaHeader('mt', 'Material')}
                  {renderPartidaHeader('eq', 'Equipo')}
                  {renderPartidaHeader('sc', 'Subcontrato')}
                </tr>
              </thead>
              <tbody>
                {activeBudget.partidas.map(p => {
                  const isSelected = selectedPartidaId === p.id || selectedPartidaIds.includes(p.id);
                  const itemCU = getPartidaCU(p);
                  const itemParcial = getPartidaParcial(p);
                  // Use totals (metrado × unit cost) for all breakdown columns
                  const brtotal = getPartidaBreakdownTotal(p);

                  return (
                    <tr
                      key={p.id}
                      data-partida-row-id={p.id}
                      onMouseDown={(e) => {
                        if (e.button !== 0) return;
                        const target = e.target as HTMLElement;
                        if (!target.closest('input, textarea, select, button, [contenteditable="true"]')) {
                          e.preventDefault();
                        }
                        handlePartidaCellClick(p, e);
                      }}
                      onMouseEnter={() => handlePartidaDragEnter(p)}
                      onMouseUp={handlePartidaDragEnd}
                      onDoubleClick={() => openEditPartidaModal(p)}
                      onContextMenu={(e) => {
                        if (readOnly) {
                          e.preventDefault();
                          setSelectedPartidaId(p.id);
                          return;
                        }
                        handlePartidaContextMenu(e, p);
                      }}
                      style={{
                        background: isSelected ? 'rgba(37, 99, 235, 0.12)' : p.esTitulo ? 'rgba(139, 92, 246, 0.02)' : 'transparent',
                        borderBottom: '1px solid var(--border-color)',
                        boxShadow: isSelected ? 'inset 3px 0 0 var(--color-primary)' : 'none',
                        fontWeight: p.esTitulo ? 'bold' : 'normal',
                        cursor: 'pointer'
                      }}
                      className="spreadsheet-row"
                    >
                      {/* Item */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.02)', color: p.esTitulo ? 'var(--color-secondary)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{p.item}</td>
                      
                      {/* Descripción */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.02)', paddingLeft: p.esTitulo ? '16px' : '24px', color: p.esTitulo ? 'var(--color-secondary)' : 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          {renderSharedPartidaBadge(p)}
                          <span style={{ overflowWrap: 'anywhere' }}>{p.nombre}</span>
                        </div>
                      </td>
                      
                      {/* Unidad */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.02)', color: 'var(--text-secondary)' }}>{p.unidad || '-'}</td>
                      
                      {/* Metrado */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.02)', color: 'var(--text-secondary)', textAlign: 'right', fontFamily: 'monospace' }}>
                        {p.esTitulo ? '' : (
                          <input
                            type="number"
                            step="0.01"
                            value={p.metrado}
                            readOnly={readOnly}
                            onChange={(e) => {
                              if (!readOnly) handlePartidaCellChange(p.id, 'metrado', parseFloat(e.target.value) || 0);
                            }}
                            style={{ ...tableInputStyle, cursor: readOnly ? 'default' : 'text' }}
                          />
                        )}
                      </td>
                      
                      {/* Costo Unitario */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.02)', textAlign: 'right', fontWeight: 600, color: p.esTitulo ? 'transparent' : 'var(--text-primary)', fontFamily: 'monospace' }}>S/ {itemCU.toFixed(2)}</td>
                      
                      {/* Parcial */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.02)', textAlign: 'right', fontWeight: 700, color: p.esTitulo ? 'var(--color-secondary)' : 'var(--color-primary)', fontFamily: 'monospace' }}>S/ {itemParcial.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                      
                      {/* MO - total para todos los ítems (incluye títulos) */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.02)', textAlign: 'right', color: '#ff7a00', fontFamily: 'monospace', fontWeight: p.esTitulo ? 700 : 400 }}>
                        {brtotal.MO > 0 ? `S/ ${brtotal.MO.toFixed(2)}` : ''}
                      </td>
                      
                      {/* MT */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.02)', textAlign: 'right', color: '#3b82f6', fontFamily: 'monospace', fontWeight: p.esTitulo ? 700 : 400 }}>
                        {brtotal.MT > 0 ? `S/ ${brtotal.MT.toFixed(2)}` : ''}
                      </td>
                      
                      {/* EQ */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.02)', textAlign: 'right', color: '#10b981', fontFamily: 'monospace', fontWeight: p.esTitulo ? 700 : 400 }}>
                        {brtotal.EQ > 0 ? `S/ ${brtotal.EQ.toFixed(2)}` : ''}
                      </td>
                      
                      {/* SC */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.02)', textAlign: 'right', color: '#ec4899', fontFamily: 'monospace', fontWeight: p.esTitulo ? 700 : 400 }}>
                        {brtotal.SC > 0 ? `S/ ${brtotal.SC.toFixed(2)}` : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Draggable/Resizable Bottom Pane: APU Analysis */}
          <div className="budget-editor-lite-apu-pane" style={{
            height: `${apuPanelHeight}px`,
            borderTop: '2px solid var(--border-color)',
            background: 'var(--bg-surface-elevated)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            position: 'relative'
          }}>
            {/* Height Resize Handle */}
            <div
              onMouseDown={(e) => {
                const startY = e.clientY;
                const startHeight = apuPanelHeight;
                const onMouseMove = (moveEvent: MouseEvent) => {
                  const newHeight = Math.max(160, Math.min(600, startHeight - (moveEvent.clientY - startY)));
                  setApuPanelHeight(newHeight);
                };
                const onMouseUp = () => {
                  document.removeEventListener('mousemove', onMouseMove);
                  document.removeEventListener('mouseup', onMouseUp);
                };
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
              }}
              style={{
                position: 'absolute',
                top: '-4px',
                left: 0,
                right: 0,
                height: '8px',
                cursor: 'ns-resize',
                zIndex: 100
              }}
            />

            {/* APU Panel Header */}
            <div className="budget-editor-lite-apu-header" style={{
              height: '42px',
              background: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>Análisis de Precios Unitarios (APU)</span>
                {selectedPartida ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Item: <strong style={{ color: 'var(--text-primary)' }}>{selectedPartida.item}</strong> · <strong style={{ color: 'var(--text-primary)' }}>{selectedPartida.nombre}</strong>
                  </span>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Seleccione una partida para ver su análisis.</span>
                )}
              </div>

              {/* Zoom controls & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => setApuZoom(Math.max(0.7, apuZoom - 0.1))} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#ffffff', borderRadius: '4px', width: '26px', height: '26px', cursor: 'pointer' }}>-</button>
                  <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{Math.round(apuZoom * 100)}%</span>
                  <button onClick={() => setApuZoom(Math.min(1.5, apuZoom + 0.1))} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#ffffff', borderRadius: '4px', width: '26px', height: '26px', cursor: 'pointer' }}>+</button>
                </div>
              </div>
            </div>

            {/* APU Content Grid */}
            <div style={{ flexGrow: 1, overflow: 'auto', padding: '12px', transform: `scale(${apuZoom})`, transformOrigin: 'top left', width: `${100 / apuZoom}%`, height: `${100 / apuZoom}%` }}>
              {selectedPartida ? (
                selectedPartida.esTitulo ? (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    Los elementos de tipo Título no contienen un Análisis de Precios Unitarios.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Rendimiento header details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(255,255,255,0.01)', padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rendimiento base:</span>
                        <input
                          type="number"
                          value={selectedPartida.rendimiento}
                          readOnly={readOnly}
                          onChange={(e) => {
                            if (!readOnly) handlePartidaCellChange(selectedPartida.id, 'rendimiento', parseFloat(e.target.value) || 1);
                          }}
                          style={{
                            width: '60px',
                            background: 'rgba(0,0,0,0.25)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            textAlign: 'right',
                            outline: 'none',
                            cursor: readOnly ? 'default' : 'text'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ background: 'rgba(255,122,0,0.05)', border: '1px solid rgba(255,122,0,0.2)', color: '#ff7a00', padding: '3px 10px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 'bold' }}>
                          MO: S/ {apuBreakdown.MO.toFixed(2)}
                        </div>
                        <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6', padding: '3px 10px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 'bold' }}>
                          MT: S/ {apuBreakdown.MT.toFixed(2)}
                        </div>
                        <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', padding: '3px 10px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 'bold' }}>
                          EQ: S/ {apuBreakdown.EQ.toFixed(2)}
                        </div>
                        <div style={{ background: 'rgba(236,72,153,0.05)', border: '1px solid rgba(236,72,153,0.2)', color: '#ec4899', padding: '3px 10px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 'bold' }}>
                          SC: S/ {apuBreakdown.SC.toFixed(2)}
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '3px 10px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: '800' }}>
                          Costo Unitario: S/ {getPartidaCU(selectedPartida).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Table of insumos */}
                    <table className={showGridlines ? 'table-gridlines' : ''} style={{ width: `${apuTableWidth}px`, borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          {renderApuHeader('codigo', 'Código')}
                          {renderApuHeader('nombre', 'Insumo')}
                          {renderApuHeader('unidad', 'Unidad')}
                          {renderApuHeader('cuadrilla', 'Cuadrilla')}
                          {renderApuHeader('cantidad', 'Cantidad')}
                          {renderApuHeader('desperdicio', '% Desp.')}
                          {renderApuHeader('pu', 'Unitario (S/)')}
                          {renderApuHeader('parcial', 'Parcial (S/)')}
                          {renderApuHeader('tipo', 'Tipo')}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPartida.insumos.map(ins => {
                          const baseQty = getInsumoBaseCantidad(ins, selectedPartida.rendimiento);
                          const adjustedQty = getInsumoCantidad(ins, selectedPartida.rendimiento);
                          const desperdicioValue = ins.tipo === 'MT' ? (ins.desperdicio ?? 0) : 0;
                          const isManualTools = isManualToolsInsumo(ins);
                          const displayedUnitPrice = isManualTools ? getManualToolsUnitPrice(selectedPartida) : ins.pu;
                          const isUnitPriceLocked = readOnly || isManualTools;
                          const insParcial = getInsumoParcial(ins, selectedPartida.rendimiento, selectedPartida);
                          const cuadrillaInputKey = `${selectedPartida.id}:${ins.id}:cuadrilla`;
                          const cantidadInputKey = `${selectedPartida.id}:${ins.id}:cantidad`;
                          const desperdicioInputKey = `${selectedPartida.id}:${ins.id}:desperdicio`;
                          const puInputKey = `${selectedPartida.id}:${ins.id}:pu`;

                          return (
                            <tr key={ins.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              {/* Código del catálogo */}
                              <td style={{ padding: '4px 8px' }}>
                                <input
                                  type="text"
                                  value={ins.codigo || ''}
                                  readOnly={readOnly}
                                  onChange={(e) => {
                                    if (!readOnly) handleUpdateInsumoField(selectedPartida.id, ins.id, 'codigo', e.target.value);
                                  }}
                                  placeholder="—"
                                  style={{ ...tableInputStyle, textAlign: 'left', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)', cursor: readOnly ? 'default' : 'text' }}
                                />
                              </td>
                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{ins.nombre}</td>
                              <td style={{ padding: '8px 12px' }}>{ins.unidad}</td>
                              <td style={{ padding: '4px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                {(ins.tipo === 'MO' || (ins.tipo === 'EQ' && ins.unidad !== '%MO')) ? (
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={getApuInputValue(cuadrillaInputKey, ins.cuadrilla)}
                                    onChange={(e) => handleApuNumberChange(cuadrillaInputKey, e.target.value, (value) => {
                                      if (!readOnly) handleUpdateInsumoField(selectedPartida.id, ins.id, 'cuadrilla', value);
                                    })}
                                    readOnly={readOnly}
                                    onBlur={() => clearApuDraftValue(cuadrillaInputKey)}
                                    style={{ ...tableInputStyle, cursor: readOnly ? 'default' : 'text' }}
                                  />
                                ) : '-'}
                              </td>
                              <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace' }}>
                                {ins.tipo === 'MO' ? (
                                  <span style={{ padding: '4px 8px', display: 'block' }}>{baseQty.toFixed(4)}</span>
                                ) : (
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={getApuInputValue(cantidadInputKey, baseQty)}
                                    onChange={(e) => handleApuNumberChange(cantidadInputKey, e.target.value, (value) => {
                                      if (!readOnly) handleUpdateInsumoField(selectedPartida.id, ins.id, 'cantidad', value);
                                    })}
                                    readOnly={readOnly}
                                    onBlur={() => clearApuDraftValue(cantidadInputKey)}
                                    style={{ ...tableInputStyle, textAlign: 'right', cursor: readOnly ? 'default' : 'text' }}
                                  />
                                )}
                              </td>
                              <td style={{ padding: '4px 8px', textAlign: 'right', fontFamily: 'monospace' }}>
                                {ins.tipo === 'MT' ? (
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={getApuInputValue(desperdicioInputKey, desperdicioValue)}
                                    onChange={(e) => handleApuNumberChange(desperdicioInputKey, e.target.value, (value) => {
                                      if (!readOnly) handleUpdateInsumoField(selectedPartida.id, ins.id, 'desperdicio', value);
                                    })}
                                    readOnly={readOnly}
                                    onBlur={() => clearApuDraftValue(desperdicioInputKey)}
                                    title={`Cantidad ajustada: ${adjustedQty.toFixed(4)}`}
                                    style={{ ...tableInputStyle, textAlign: 'right', cursor: readOnly ? 'default' : 'text' }}
                                  />
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>-</span>
                                )}
                              </td>
                              <td style={{ padding: '4px 8px' }}>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={isManualTools ? displayedUnitPrice.toFixed(2) : getApuInputValue(puInputKey, displayedUnitPrice)}
                                  onChange={(e) => handleApuNumberChange(puInputKey, e.target.value, (value) => {
                                    if (!isUnitPriceLocked) handleUpdateInsumoField(selectedPartida.id, ins.id, 'pu', value);
                                  })}
                                  readOnly={isUnitPriceLocked}
                                  onBlur={() => clearApuDraftValue(puInputKey)}
                                  title={isManualTools ? 'Calculado automaticamente desde el subtotal de Mano de Obra' : undefined}
                                  style={{
                                    ...tableInputStyle,
                                    cursor: isUnitPriceLocked ? 'default' : 'text',
                                    color: isManualTools ? 'var(--text-muted)' : tableInputStyle.color,
                                    fontWeight: isManualTools ? 700 : tableInputStyle.fontWeight,
                                    background: isManualTools ? 'rgba(148, 163, 184, 0.08)' : tableInputStyle.background,
                                    borderRadius: isManualTools ? 4 : tableInputStyle.borderRadius
                                  }}
                                />
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'monospace' }}>S/ {insParcial.toFixed(2)}</td>
                              <td style={{ padding: '8px 12px', color: ins.tipo === 'MO' ? '#ff7a00' : ins.tipo === 'MT' ? '#3b82f6' : ins.tipo === 'EQ' ? '#10b981' : '#ec4899' }}>{ins.tipo}</td>
                              <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                                {!readOnly && (
                                  <button
                                    onClick={() => handleDeleteInsumo(ins.id)}
                                    title="Eliminar recurso"
                                    style={{ background: 'transparent', border: 'none', color: '#dc3545', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 6 }}
                                  >
                                    <LiteIcon name="trash" size={16} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Quick add resource action */}
                    {!readOnly && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setSelectedSpecPartidaId(selectedPartida.id);
                            setIsAddInsumoOpen(true);
                          }}
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            padding: '6px 14px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600
                          }}
                        >
                          <LiteIcon name="plus" size={16} />
                          Agregar Recurso
                        </button>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Seleccione una partida en la grilla superior para editar sus análisis.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>

      {mobileApuPartida && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Analisis de precios unitarios de ${mobileApuPartida.nombre}`}
          onClick={() => setMobileApuPartidaId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.66)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'center',
            padding: '10px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(760px, 100%)',
              height: 'min(94vh, 960px)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 18,
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              color: 'var(--text-primary)'
            }}
          >
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, background: 'var(--bg-surface-elevated)' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'var(--color-primary)', fontSize: '0.78rem', fontWeight: 900, marginBottom: 5 }}>
                  APU · Item {mobileApuPartida.item}
                </div>
                <h2 style={{ margin: 0, fontSize: '1rem', lineHeight: 1.35, fontFamily: 'var(--font-display)', overflowWrap: 'anywhere' }}>
                  {mobileApuPartida.nombre}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setMobileApuPartidaId(null)}
                aria-label="Cerrar analisis"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  border: '1px solid var(--border-color)',
                  background: 'var(--modal-panel-bg)',
                  color: 'var(--text-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <LiteIcon name="x" size={18} />
              </button>
            </div>

            <div style={{ padding: '14px', overflow: 'auto', display: 'grid', gap: 12 }}>
              {mobileApuPartida.esTitulo ? (
                <div style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)', background: 'var(--modal-panel-bg)', borderRadius: 12, padding: 16 }}>
                  Los elementos de tipo Titulo no contienen un Analisis de Precios Unitarios.
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                    <div style={{ background: 'var(--modal-panel-bg)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 10 }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 850, marginBottom: 6 }}>Unidad</div>
                      <strong>{mobileApuPartida.unidad || '-'}</strong>
                    </div>
                    <div style={{ background: 'var(--modal-panel-bg)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 10 }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 850, marginBottom: 6 }}>Metrado</div>
                      <input
                        type="number"
                        step="0.01"
                        value={mobileApuPartida.metrado}
                        readOnly={readOnly}
                        onChange={(e) => {
                          if (!readOnly) handlePartidaCellChange(mobileApuPartida.id, 'metrado', parseFloat(e.target.value) || 0);
                        }}
                        style={{ ...tableInputStyle, textAlign: 'left', fontWeight: 850, cursor: readOnly ? 'default' : 'text' }}
                      />
                    </div>
                    <div style={{ background: 'var(--modal-panel-bg)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 10 }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 850, marginBottom: 6 }}>Rendimiento base</div>
                      <input
                        type="number"
                        value={mobileApuPartida.rendimiento}
                        readOnly={readOnly}
                        onChange={(e) => {
                          if (!readOnly) handlePartidaCellChange(mobileApuPartida.id, 'rendimiento', parseFloat(e.target.value) || 1);
                        }}
                        style={{ ...tableInputStyle, textAlign: 'left', fontWeight: 850, cursor: readOnly ? 'default' : 'text' }}
                      />
                    </div>
                    <div style={{ background: 'var(--modal-panel-bg)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 10 }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 850, marginBottom: 6 }}>Costo unitario</div>
                      <strong style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>S/ {getPartidaCU(mobileApuPartida).toFixed(2)}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[
                      ['MO', mobileApuBreakdown.MO, '#ff7a00'],
                      ['MT', mobileApuBreakdown.MT, '#3b82f6'],
                      ['EQ', mobileApuBreakdown.EQ, '#10b981'],
                      ['SC', mobileApuBreakdown.SC, '#ec4899']
                    ].map(([label, value, color]) => (
                      <span key={String(label)} style={{ background: 'var(--modal-panel-bg)', border: '1px solid var(--border-color)', color: String(color), borderRadius: 999, padding: '7px 10px', fontSize: '0.76rem', fontWeight: 900 }}>
                        {label}: S/ {Number(value).toFixed(2)}
                      </span>
                    ))}
                    <span style={{ marginLeft: 'auto', background: 'rgba(37, 99, 235, 0.10)', border: '1px solid rgba(37, 99, 235, 0.24)', color: 'var(--color-primary)', borderRadius: 999, padding: '7px 10px', fontSize: '0.76rem', fontWeight: 900 }}>
                      Parcial: S/ {getPartidaParcial(mobileApuPartida).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 900, color: 'var(--text-primary)' }}>Recursos del APU</div>
                    {mobileApuPartida.insumos.map(ins => {
                      const baseQty = getInsumoBaseCantidad(ins, mobileApuPartida.rendimiento);
                      const adjustedQty = getInsumoCantidad(ins, mobileApuPartida.rendimiento);
                      const desperdicioValue = ins.tipo === 'MT' ? (ins.desperdicio ?? 0) : 0;
                      const isManualTools = isManualToolsInsumo(ins);
                      const displayedUnitPrice = isManualTools ? getManualToolsUnitPrice(mobileApuPartida) : ins.pu;
                      const isUnitPriceLocked = readOnly || isManualTools;
                      const insParcial = getInsumoParcial(ins, mobileApuPartida.rendimiento, mobileApuPartida);
                      const cuadrillaInputKey = `${mobileApuPartida.id}:${ins.id}:mobile-cuadrilla`;
                      const cantidadInputKey = `${mobileApuPartida.id}:${ins.id}:mobile-cantidad`;
                      const desperdicioInputKey = `${mobileApuPartida.id}:${ins.id}:mobile-desperdicio`;
                      const puInputKey = `${mobileApuPartida.id}:${ins.id}:mobile-pu`;
                      const typeColor = getResourceTypeColor(ins.tipo);

                      return (
                        <div key={ins.id} style={{ border: '1px solid var(--border-color)', background: 'var(--modal-panel-bg)', borderRadius: 12, padding: 12, display: 'grid', gap: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                            <div style={{ minWidth: 0 }}>
                              <input
                                type="text"
                                value={ins.codigo || ''}
                                readOnly={readOnly}
                                onChange={(e) => {
                                  if (!readOnly) handleUpdateInsumoField(mobileApuPartida.id, ins.id, 'codigo', e.target.value);
                                }}
                                placeholder="Codigo"
                                style={{ ...tableInputStyle, textAlign: 'left', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6, cursor: readOnly ? 'default' : 'text' }}
                              />
                              <div style={{ fontWeight: 900, lineHeight: 1.35, overflowWrap: 'anywhere' }}>{ins.nombre}</div>
                            </div>
                            <span style={{ color: typeColor, border: `1px solid ${typeColor}44`, background: `${typeColor}14`, borderRadius: 999, padding: '5px 8px', fontSize: '0.72rem', fontWeight: 900, flexShrink: 0 }}>
                              {ins.tipo}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: 9, padding: 8, background: 'var(--bg-surface)' }}>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 850 }}>Unidad</div>
                              <strong>{ins.unidad || '-'}</strong>
                            </div>
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: 9, padding: 8, background: 'var(--bg-surface)' }}>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 850 }}>Cuadrilla</div>
                              {(ins.tipo === 'MO' || (ins.tipo === 'EQ' && ins.unidad !== '%MO')) ? (
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={getApuInputValue(cuadrillaInputKey, ins.cuadrilla)}
                                  onChange={(e) => handleApuNumberChange(cuadrillaInputKey, e.target.value, (value) => {
                                    if (!readOnly) handleUpdateInsumoField(mobileApuPartida.id, ins.id, 'cuadrilla', value);
                                  })}
                                  readOnly={readOnly}
                                  onBlur={() => clearApuDraftValue(cuadrillaInputKey)}
                                  style={{ ...tableInputStyle, textAlign: 'left', fontWeight: 850, cursor: readOnly ? 'default' : 'text' }}
                                />
                              ) : (
                                <strong>-</strong>
                              )}
                            </div>
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: 9, padding: 8, background: 'var(--bg-surface)' }}>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 850 }}>Cantidad</div>
                              {ins.tipo === 'MO' ? (
                                <strong>{baseQty.toFixed(4)}</strong>
                              ) : (
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={getApuInputValue(cantidadInputKey, baseQty)}
                                  onChange={(e) => handleApuNumberChange(cantidadInputKey, e.target.value, (value) => {
                                    if (!readOnly) handleUpdateInsumoField(mobileApuPartida.id, ins.id, 'cantidad', value);
                                  })}
                                  readOnly={readOnly}
                                  onBlur={() => clearApuDraftValue(cantidadInputKey)}
                                  style={{ ...tableInputStyle, textAlign: 'left', fontWeight: 850, cursor: readOnly ? 'default' : 'text' }}
                                />
                              )}
                            </div>
                            {ins.tipo === 'MT' && (
                              <div style={{ border: '1px solid var(--border-color)', borderRadius: 9, padding: 8, background: 'var(--bg-surface)' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 850 }}>Desperdicio %</div>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={getApuInputValue(desperdicioInputKey, desperdicioValue)}
                                  onChange={(e) => handleApuNumberChange(desperdicioInputKey, e.target.value, (value) => {
                                    if (!readOnly) handleUpdateInsumoField(mobileApuPartida.id, ins.id, 'desperdicio', value);
                                  })}
                                  readOnly={readOnly}
                                  onBlur={() => clearApuDraftValue(desperdicioInputKey)}
                                  title={`Cantidad ajustada: ${adjustedQty.toFixed(4)}`}
                                  style={{ ...tableInputStyle, textAlign: 'left', fontWeight: 850, cursor: readOnly ? 'default' : 'text' }}
                                />
                                {desperdicioValue > 0 && (
                                  <div style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 800 }}>Final: {adjustedQty.toFixed(4)}</div>
                                )}
                              </div>
                            )}
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: 9, padding: 8, background: 'var(--bg-surface)' }}>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 850 }}>Unitario S/</div>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={isManualTools ? displayedUnitPrice.toFixed(2) : getApuInputValue(puInputKey, displayedUnitPrice)}
                                onChange={(e) => handleApuNumberChange(puInputKey, e.target.value, (value) => {
                                  if (!isUnitPriceLocked) handleUpdateInsumoField(mobileApuPartida.id, ins.id, 'pu', value);
                                })}
                                readOnly={isUnitPriceLocked}
                                onBlur={() => clearApuDraftValue(puInputKey)}
                                title={isManualTools ? 'Calculado automaticamente desde el subtotal de Mano de Obra' : undefined}
                                style={{
                                  ...tableInputStyle,
                                  textAlign: 'left',
                                  fontWeight: 850,
                                  color: isManualTools ? 'var(--text-muted)' : tableInputStyle.color,
                                  cursor: isUnitPriceLocked ? 'default' : 'text'
                                }}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                            <strong style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>Parcial: S/ {insParcial.toFixed(2)}</strong>
                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() => handleDeleteInsumo(ins.id)}
                                title="Eliminar recurso"
                                style={{ background: 'transparent', border: '1px solid var(--border-color)', color: '#dc3545', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8 }}
                              >
                                <LiteIcon name="trash" size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSpecPartidaId(mobileApuPartida.id);
                        setIsAddInsumoOpen(true);
                      }}
                      style={{
                        width: '100%',
                        minHeight: 44,
                        borderRadius: 10,
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-surface-elevated)',
                        color: 'var(--text-primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        fontWeight: 900,
                        cursor: 'pointer'
                      }}
                    >
                      <LiteIcon name="plus" size={17} />
                      Agregar Recurso
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {sharedPartidaDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Presupuestos con ${sharedPartidaDialog.partida.nombre}`}
          onClick={() => setSharedPartidaDialog(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10020,
            background: 'rgba(15, 23, 42, 0.62)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(560px, 100%)',
              maxHeight: 'min(78vh, 640px)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 12,
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              color: 'var(--text-primary)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', background: 'var(--bg-surface-elevated)' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 900, marginBottom: 5 }}>
                  {sharedPartidaDialog.budgets.length} presupuestos
                </div>
                <h2 style={{ margin: 0, fontSize: '0.98rem', lineHeight: 1.35, overflowWrap: 'anywhere' }}>
                  {sharedPartidaDialog.partida.nombre}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSharedPartidaDialog(null)}
                aria-label="Cerrar"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  background: 'var(--modal-panel-bg)',
                  color: 'var(--text-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <LiteIcon name="x" size={16} />
              </button>
            </div>

            <div style={{ padding: 12, overflowY: 'auto', display: 'grid', gap: 8 }}>
              {sharedPartidaDialog.budgets.map((budget) => (
                <div
                  key={`${budget.budgetId}:${budget.partidaId}`}
                  style={{
                    border: '1px solid var(--border-color)',
                    background: 'var(--modal-panel-bg)',
                    borderRadius: 8,
                    padding: '11px 12px',
                    display: 'grid',
                    gap: 5
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                    <strong style={{ overflowWrap: 'anywhere' }}>{budget.budgetName}</strong>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0 }}>
                      {budget.item}
                    </span>
                  </div>
                  {budget.cliente && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem', overflowWrap: 'anywhere' }}>
                      {budget.cliente}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
