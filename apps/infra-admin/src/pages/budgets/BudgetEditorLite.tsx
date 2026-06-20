import React from 'react';
import type { Budget, Partida, Insumo, PartidaColumnKey, ApuColumnKey } from './types';

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
  
  // Handlers
  handlePartidaCellClick: (p: Partida) => void;
  handlePartidaContextMenu: (e: React.MouseEvent, p: Partida) => void;
  handlePartidaCellChange: (pId: string, field: keyof Partida, val: any) => void;
  handleUpdateInsumoField: (insId: string, field: keyof Insumo, val: any) => void;
  handleDeleteInsumo: (insId: string) => void;
  setSelectedSpecPartidaId: (id: string | null) => void;
  setIsAddInsumoOpen: (v: boolean) => void;
  getInsumoCantidad: (ins: Insumo, rend: number) => number;
  getInsumoParcial: (ins: Insumo, rend: number) => number;
}

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

  handlePartidaCellClick,
  handlePartidaContextMenu,
  handlePartidaCellChange,
  handleUpdateInsumoField,
  handleDeleteInsumo,
  setSelectedSpecPartidaId,
  setIsAddInsumoOpen,
  getInsumoCantidad,
  getInsumoParcial
}) => {
  const cd = getBudgetCD(activeBudget);
  const gg = cd * 0.10;
  const ut = cd * 0.05;
  const sub = cd + gg + ut;
  const igv = sub * 0.18;
  const total = sub + igv;

  const selectedPartida = activeBudget.partidas.find(p => p.id === selectedPartidaId);
  const apuBreakdown = selectedPartida ? getAPUBreakdown(selectedPartida) : { MO: 0, MT: 0, EQ: 0, SC: 0, SP: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-main)', overflow: 'hidden', width: '100%' }}>
      {/* Global Tabs Bar */}
      <div style={{
        height: '48px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        gap: '8px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', flexGrow: 1, minWidth: 0, paddingRight: 8 }}>
          <button
            onClick={() => setViewState('list')}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderBottom: 'none',
              borderRadius: '6px 6px 0 0',
              color: 'var(--text-secondary)',
              fontSize: '0.82rem',
              cursor: 'pointer',
              fontWeight: 700,
              flexShrink: 0
            }}
          >
            📂 PRESUPUESTOS
          </button>

          {openBudgets.map(b => (
            <div key={b.id} style={{ position: 'relative', display: 'flex', alignItems: 'center', marginRight: 6, flexShrink: 0 }}>
              <button
                onClick={() => handleSelectBudgetTab(b.id)}
                title={b.nombre}
                style={{
                  padding: '6px 10px 6px 12px',
                  background: activeBudget.id === b.id ? 'var(--bg-surface-elevated)' : 'transparent',
                  border: '1px solid var(--border-color)',
                  borderBottom: 'none',
                  borderRadius: '6px 6px 0 0',
                  color: activeBudget.id === b.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>📄</span>
                <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.nombre}</span>
              </button>
              <button
                onClick={(e) => handleCloseBudgetTab(b.id, e)}
                style={{
                  position: 'absolute',
                  right: '4px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  zIndex: 2
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0, paddingRight: '8px' }}>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.2rem',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              transition: 'background 0.2s'
            }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Empresa: <strong style={{ color: 'var(--color-primary)' }}>
              {user?.role === 'SUPER_ADMIN' ? 'Suite Global' : companies.find(c => c.id === user?.empresaId)?.nombre || 'Cargando...'}
            </strong>
          </span>
        </div>
      </div>

      {/* Top toolbar */}
      <div style={{
        height: '48px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setViewState('list')}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '6px 14px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ← Volver a Presupuestos
          </button>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Presupuesto: <strong style={{ color: 'var(--text-primary)' }}>{activeBudget.nombre}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'rgba(0, 240, 255, 0.05)',
            border: '1px solid rgba(0, 240, 255, 0.25)',
            borderRadius: '4px',
            padding: '5px 12px',
            fontSize: '0.8rem'
          }}>
            <span style={{ color: 'var(--text-muted)' }}>Costo Directo Total: </span>
            <strong style={{ color: 'var(--color-primary)', fontFamily: 'monospace' }}>S/ {cd.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>
      </div>

      {/* Main Workspace split */}
      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
        
        {/* Left Side: Modular Navigation Sidebar */}
        <div style={{
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
              onClick={() => setIsInfraCostSidebarCollapsed(!isInfraCostSidebarCollapsed)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              {isInfraCostSidebarCollapsed ? '▶' : '◀'}
            </button>
          </div>

          {/* Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px', flexGrow: 1, overflowY: 'auto' }}>
            {[
              { label: 'Datos Generales', icon: '📝', onClick: () => setIsDatosGeneralesOpen(true) },
              { label: 'Gastos Generales', icon: '📊', onClick: () => setIsGastosGeneralesOpen(true) },
              { label: 'Pie de Presupuesto', icon: '🥧', onClick: () => setIsPiePresupuestoOpen(true) },
              { label: 'Fórmula Polinómica', icon: '📐', onClick: () => setIsFormulaPolinomicaOpen(true) },
              { label: 'Catálogo de Insumos', icon: '📦', onClick: () => setIsCatalogoInsumosOpen(true) },
              { label: 'Catálogo de Partidas', icon: '📂', onClick: () => setIsCatalogoPartidasOpen(true) },
              { label: 'Lista de Insumos', icon: '📋', onClick: () => setIsListaInsumosOpen(true) },
              { label: 'Exportar Base JSON', icon: '💾', onClick: downloadActiveBudgetDatabase },
              { label: 'Configuración', icon: '⚙️', onClick: () => setIsConfiguracionOpen(true) }
            ].map(item => (
              <button
                key={item.label}
                onClick={item.onClick}
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
                <span>{item.icon}</span>
                {!isInfraCostSidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Main Spreadsheet Grid and APU details bottom pane */}
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
          
          {/* Top Half: Spreadsheet Table */}
          <div style={{ flexGrow: 1, overflow: 'auto', background: 'var(--bg-main)' }}>
            <table className={showGridlines ? 'table-gridlines' : ''} style={{ width: `${partidaTableWidth}px`, borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem', fontFamily: 'var(--font-sans)', userSelect: 'none' }}>
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
                  const isSelected = selectedPartidaId === p.id;
                  const itemCU = getPartidaCU(p);
                  const itemParcial = getPartidaParcial(p);
                  const breakdown = getAPUBreakdown(p);

                  return (
                    <tr
                      key={p.id}
                      onClick={() => handlePartidaCellClick(p)}
                      onContextMenu={(e) => handlePartidaContextMenu(e, p)}
                      style={{
                        background: isSelected ? 'rgba(0, 240, 255, 0.04)' : p.esTitulo ? 'rgba(139, 92, 246, 0.02)' : 'transparent',
                        borderBottom: '1px solid var(--border-color)',
                        fontWeight: p.esTitulo ? 'bold' : 'normal',
                        cursor: 'pointer'
                      }}
                      className="spreadsheet-row"
                    >
                      {/* Item */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.02)', color: p.esTitulo ? 'var(--color-secondary)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{p.item}</td>
                      
                      {/* Descripción */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.02)', paddingLeft: p.esTitulo ? '16px' : '24px', color: p.esTitulo ? 'var(--color-secondary)' : 'var(--text-primary)' }}>{p.nombre}</td>
                      
                      {/* Unidad */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.02)', color: 'var(--text-secondary)' }}>{p.unidad || '-'}</td>
                      
                      {/* Metrado */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.02)', color: 'var(--text-secondary)', textAlign: 'right', fontFamily: 'monospace' }}>
                        {p.esTitulo ? '' : (
                          <input
                            type="number"
                            step="0.01"
                            value={p.metrado}
                            onChange={(e) => handlePartidaCellChange(p.id, 'metrado', parseFloat(e.target.value) || 0)}
                            style={{ ...tableInputStyle }}
                          />
                        )}
                      </td>
                      
                      {/* Costo Unitario */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.02)', textAlign: 'right', fontWeight: 600, color: p.esTitulo ? 'transparent' : 'var(--text-primary)', fontFamily: 'monospace' }}>S/ {itemCU.toFixed(2)}</td>
                      
                      {/* Parcial */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.02)', textAlign: 'right', fontWeight: 700, color: p.esTitulo ? 'var(--color-secondary)' : 'var(--color-primary)', fontFamily: 'monospace' }}>S/ {itemParcial.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                      
                      {/* MO */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.02)', textAlign: 'right', color: p.esTitulo ? 'transparent' : '#ff7a00', fontFamily: 'monospace' }}>{p.esTitulo ? '' : `S/ ${breakdown.MO.toFixed(2)}`}</td>
                      
                      {/* MT */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.02)', textAlign: 'right', color: p.esTitulo ? 'transparent' : '#3b82f6', fontFamily: 'monospace' }}>{p.esTitulo ? '' : `S/ ${breakdown.MT.toFixed(2)}`}</td>
                      
                      {/* EQ */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.02)', textAlign: 'right', color: p.esTitulo ? 'transparent' : '#10b981', fontFamily: 'monospace' }}>{p.esTitulo ? '' : `S/ ${breakdown.EQ.toFixed(2)}`}</td>
                      
                      {/* SC */}
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.02)', textAlign: 'right', color: p.esTitulo ? 'transparent' : '#ec4899', fontFamily: 'monospace' }}>{p.esTitulo ? '' : `S/ ${breakdown.SC.toFixed(2)}`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Draggable/Resizable Bottom Pane: APU Analysis */}
          <div style={{
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
            <div style={{
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
                          onChange={(e) => handlePartidaCellChange(selectedPartida.id, 'rendimiento', parseFloat(e.target.value) || 1)}
                          style={{
                            width: '60px',
                            background: 'rgba(0,0,0,0.25)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            textAlign: 'right',
                            outline: 'none'
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
                          {renderApuHeader('nombre', 'Insumo')}
                          {renderApuHeader('unidad', 'Unidad')}
                          {renderApuHeader('cuadrilla', 'Cuadrilla')}
                          {renderApuHeader('cantidad', 'Cantidad')}
                          {renderApuHeader('pu', 'Unitario (S/)')}
                          {renderApuHeader('parcial', 'Parcial (S/)')}
                          {renderApuHeader('tipo', 'Tipo')}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPartida.insumos.map(ins => {
                          const insQty = getInsumoCantidad(ins, selectedPartida.rendimiento);
                          const insParcial = getInsumoParcial(ins, selectedPartida.rendimiento);

                          return (
                            <tr key={ins.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{ins.nombre}</td>
                              <td style={{ padding: '8px 12px' }}>{ins.unidad}</td>
                              <td style={{ padding: '4px 8px' }}>
                                <input
                                  type="number"
                                  step="0.0001"
                                  value={ins.cuadrilla}
                                  onChange={(e) => handleUpdateInsumoField(ins.id, 'cuadrilla', parseFloat(e.target.value) || 0)}
                                  style={{ ...tableInputStyle }}
                                />
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace' }}>{insQty.toFixed(4)}</td>
                              <td style={{ padding: '4px 8px' }}>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={ins.pu}
                                  onChange={(e) => handleUpdateInsumoField(ins.id, 'pu', parseFloat(e.target.value) || 0)}
                                  style={{ ...tableInputStyle }}
                                />
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'monospace' }}>S/ {insParcial.toFixed(2)}</td>
                              <td style={{ padding: '8px 12px', color: ins.tipo === 'MO' ? '#ff7a00' : ins.tipo === 'MT' ? '#3b82f6' : ins.tipo === 'EQ' ? '#10b981' : '#ec4899' }}>{ins.tipo}</td>
                              <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                                <button
                                  onClick={() => handleDeleteInsumo(ins.id)}
                                  style={{ background: 'transparent', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '1rem' }}
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Quick add resource action */}
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
                        ➕ Agregar Recurso
                      </button>
                    </div>
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
      </div>
    </div>
  );
};
