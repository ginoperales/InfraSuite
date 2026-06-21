import React, { useState } from 'react';
import { Card, Button, Input } from '@infrasuite/shared';
import type { Budget, Partida, Insumo, PartidaColumnKey } from './types';

const contextMenuItemStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  textAlign: 'left',
  padding: '6px 12px',
  fontSize: '0.78rem',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'background-color 0.15s, color 0.15s',
  width: '100%',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
};

const popupBtnStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-color)',
  borderRadius: '4px',
  color: 'var(--text-primary)',
  padding: '6px 12px',
  fontSize: '0.78rem',
  cursor: 'pointer',
  transition: 'all 0.15s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  fontWeight: 'bold',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
};

const getHierarchyColor = (level: number) => {
  const colors = [
    '#ef4444', // Level 0 (Red)
    '#3b82f6', // Level 1 (Blue)
    '#10b981', // Level 2 (Green)
    '#f59e0b', // Level 3 (Amber/Orange)
    '#8b5cf6', // Level 4 (Purple)
    '#06b6d4', // Level 5 (Cyan)
    '#ec4899'  // Level 6+ (Pink)
  ];
  return colors[level % colors.length];
};

function regenerateItemCodes(itemsWithLevels: { partida: Partida; level: number }[]): Partida[] {
  const counters: number[] = [];
  return itemsWithLevels.map(item => {
    const L = item.level;
    if (counters[L] === undefined) {
      counters[L] = 1;
    } else {
      counters[L]++;
    }
    counters.length = L + 1;
    for (let i = 0; i <= L; i++) {
      if (counters[i] === undefined || isNaN(counters[i])) {
        counters[i] = 1;
      }
    }
    const itemCode = counters.join('.');
    return {
      ...item.partida,
      item: itemCode
    };
  });
}

const adjustHierarchy = (
  partidas: Partida[],
  targetId: string,
  action: 'indent' | 'outdent' | 'moveUp' | 'moveDown' | 'toggleType' | 'duplicate' | 'delete' | 'addPartida' | 'addTitle'
): Partida[] => {
  const itemsWithLevels = partidas.map(p => ({
    partida: { ...p },
    level: Math.max(0, p.item.split('.').length - 1)
  }));

  const targetIdx = itemsWithLevels.findIndex(item => item.partida.id === targetId);
  if (targetIdx === -1) return partidas;

  const targetItem = itemsWithLevels[targetIdx];

  const getDescendantsRange = (startIndex: number, level: number) => {
    let count = 0;
    for (let i = startIndex + 1; i < itemsWithLevels.length; i++) {
      if (itemsWithLevels[i].level > level) {
        count++;
      } else {
        break;
      }
    }
    return count;
  };

  if (action === 'indent') {
    if (targetIdx > 0) {
      const prevItem = itemsWithLevels[targetIdx - 1];
      if (targetItem.level <= prevItem.level) {
        const descCount = getDescendantsRange(targetIdx, targetItem.level);
        for (let i = targetIdx; i <= targetIdx + descCount; i++) {
          itemsWithLevels[i].level += 1;
        }
      }
    }
  } else if (action === 'outdent') {
    if (targetItem.level > 0) {
      const descCount = getDescendantsRange(targetIdx, targetItem.level);
      for (let i = targetIdx; i <= targetIdx + descCount; i++) {
        itemsWithLevels[i].level = Math.max(0, itemsWithLevels[i].level - 1);
      }
    }
  } else if (action === 'toggleType') {
    targetItem.partida.esTitulo = !targetItem.partida.esTitulo;
  } else if (action === 'delete') {
    const descCount = getDescendantsRange(targetIdx, targetItem.level);
    itemsWithLevels.splice(targetIdx, 1 + descCount);
  } else if (action === 'duplicate') {
    const descCount = getDescendantsRange(targetIdx, targetItem.level);
    const toDuplicate = itemsWithLevels.slice(targetIdx, targetIdx + 1 + descCount).map(item => ({
      partida: {
        ...item.partida,
        id: 'p_' + Math.random().toString(36).substring(2, 9),
        nombre: item.partida.nombre + ' (Copia)',
        insumos: item.partida.insumos.map(ins => ({ ...ins, id: 'i_' + Math.random().toString(36).substring(2, 9) }))
      },
      level: item.level
    }));
    itemsWithLevels.splice(targetIdx + 1 + descCount, 0, ...toDuplicate);
  } else if (action === 'moveUp') {
    let siblingIdx = -1;
    for (let i = targetIdx - 1; i >= 0; i--) {
      if (itemsWithLevels[i].level < targetItem.level) {
        break;
      }
      if (itemsWithLevels[i].level === targetItem.level) {
        siblingIdx = i;
        break;
      }
    }

    if (siblingIdx !== -1) {
      const targetDescCount = getDescendantsRange(targetIdx, targetItem.level);
      const targetBlock = itemsWithLevels.splice(targetIdx, 1 + targetDescCount);
      itemsWithLevels.splice(siblingIdx, 0, ...targetBlock);
    } else if (targetIdx > 0) {
      const prevItem = itemsWithLevels[targetIdx - 1];
      if (prevItem.level >= targetItem.level) {
        const targetDescCount = getDescendantsRange(targetIdx, targetItem.level);
        const targetBlock = itemsWithLevels.splice(targetIdx, 1 + targetDescCount);
        itemsWithLevels.splice(targetIdx - 1, 0, ...targetBlock);
      }
    }
  } else if (action === 'moveDown') {
    let siblingIdx = -1;
    const targetDescCount = getDescendantsRange(targetIdx, targetItem.level);
    const targetBlockEnd = targetIdx + targetDescCount;

    for (let i = targetBlockEnd + 1; i < itemsWithLevels.length; i++) {
      if (itemsWithLevels[i].level < targetItem.level) {
        break;
      }
      if (itemsWithLevels[i].level === targetItem.level) {
        siblingIdx = i;
        break;
      }
    }

    if (siblingIdx !== -1) {
      const siblingDescCount = getDescendantsRange(siblingIdx, itemsWithLevels[siblingIdx].level);
      const insertAt = siblingIdx + siblingDescCount;
      const targetBlock = itemsWithLevels.splice(targetIdx, 1 + targetDescCount);
      const adjustedInsertAt = insertAt - targetBlock.length;
      itemsWithLevels.splice(adjustedInsertAt + 1, 0, ...targetBlock);
    } else if (targetBlockEnd + 1 < itemsWithLevels.length) {
      const nextItem = itemsWithLevels[targetBlockEnd + 1];
      if (nextItem.level >= targetItem.level) {
        const nextDescCount = getDescendantsRange(targetBlockEnd + 1, nextItem.level);
        const targetBlock = itemsWithLevels.splice(targetIdx, 1 + targetDescCount);
        itemsWithLevels.splice(targetIdx + nextDescCount + 1, 0, ...targetBlock);
      }
    }
  } else if (action === 'addPartida' || action === 'addTitle') {
    const isTitle = action === 'addTitle';
    const newP: Partida = {
      id: 'p_' + Math.random().toString(36).substring(2, 9),
      item: '',
      nombre: isTitle ? 'NUEVO TÍTULO' : 'NUEVA PARTIDA',
      unidad: isTitle ? '' : 'GLB',
      metrado: isTitle ? 0 : 1,
      esTitulo: isTitle,
      rendimiento: 1,
      insumos: []
    };
    itemsWithLevels.splice(targetIdx + 1, 0, {
      partida: newP,
      level: targetItem.level
    });
  }

  return regenerateItemCodes(itemsWithLevels);
};

interface BudgetEditorProProps {
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

  setIsDatosGeneralesOpen: (v: boolean) => void;
  setIsGastosGeneralesOpen: (v: boolean) => void;
  setIsPiePresupuestoOpen: (v: boolean) => void;
  setIsFormulaPolinomicaOpen: (v: boolean) => void;
  setIsCatalogoInsumosOpen: (v: boolean) => void;
  setIsCatalogoPartidasOpen: (v: boolean) => void;
  setIsListaInsumosOpen: (v: boolean) => void;
  setIsConfiguracionOpen: (v: boolean) => void;
  downloadActiveBudgetDatabase: () => void;

  selectedPartidaId: string | null;
  setSelectedPartidaId: (v: string | null) => void;
  
  // Custom Spec editor hooks
  specifications: Record<string, string>;
  setSpecifications: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  geminiPrompt: string;
  setGeminiPrompt: (v: string) => void;
  geminiResponse: string;
  setGeminiResponse: (v: string) => void;
  geminiIsLoading: boolean;
  handleAskGemini: () => void;

  // Handlers
  handlePartidaCellClick: (p: Partida) => void;
  handlePartidaContextMenu: (e: React.MouseEvent, p: Partida) => void;
  getPartidaCU: (p: Partida) => number;
  getPartidaParcial: (p: Partida) => number;
  getAPUBreakdown: (p: Partida) => any;
  
  // Table widths & resizing
  partidaColumnWidths: Record<PartidaColumnKey, number>;
  partidaTableWidth: number;

  handlePartidaCellChange: (pId: string, field: keyof Partida, val: any) => void;
  handleUpdateInsumoField: (insId: string, field: keyof Insumo, val: any) => void;
  handleDeleteInsumo: (insId: string) => void;
  setSelectedSpecPartidaId: (id: string | null) => void;
  setIsAddInsumoOpen: (v: boolean) => void;
  getInsumoCantidad: (ins: Insumo, rend: number) => number;
  getInsumoParcial: (ins: Insumo, rend: number) => number;
  updatePartidasList?: (partidas: Partida[]) => void;
}

interface FloatingWindowProps {
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onExternalOpen: () => void;
  onDock?: () => void;
  children: React.ReactNode;
  defaultPosition: { x: number; y: number };
  width?: string | number;
  height?: string | number;
}

const FloatingWindow: React.FC<FloatingWindowProps> = ({
  title,
  isOpen,
  isMinimized,
  onClose,
  onMinimize,
  onExternalOpen,
  onDock,
  children,
  defaultPosition,
  width = '750px',
  height = '530px'
}) => {
  const [position, setPosition] = React.useState(defaultPosition);
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStart = React.useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('input') ||
      (e.target as HTMLElement).closest('textarea') ||
      (e.target as HTMLElement).closest('select')
    ) {
      return;
    }
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
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
    <div
      style={{
        display: isMinimized ? 'none' : 'flex',
        flexDirection: 'column',
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
        zIndex: 999,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          padding: '10px 16px',
          background: 'rgba(0, 0, 0, 0.25)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'move',
          userSelect: 'none',
          flexShrink: 0
        }}
      >
        <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            title="Desprender ventana (nueva ventana del navegador)"
            onClick={(e) => { e.stopPropagation(); onExternalOpen(); }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: '2px', color: 'var(--text-secondary)' }}
          >
            ↗️
          </button>
          {onDock && (
            <button
              title="Acoplar al panel derecho"
              onClick={(e) => { e.stopPropagation(); onDock(); }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: '2px', color: 'var(--text-secondary)' }}
            >
              📌
            </button>
          )}
          <button
            title="Minimizar"
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: '2px', color: 'var(--text-secondary)', fontWeight: 'bold' }}
          >
            ➖
          </button>
          <button
            title="Cerrar"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: '2px', color: 'var(--text-secondary)' }}
          >
            ❌
          </button>
        </div>
      </div>
      {/* Body */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
};

export const BudgetEditorPro: React.FC<BudgetEditorProProps> = ({
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
  setSelectedPartidaId,

  specifications,
  setSpecifications,
  geminiPrompt,
  setGeminiPrompt,
  geminiResponse,
  setGeminiResponse,
  geminiIsLoading,
  handleAskGemini,

  handlePartidaCellClick,
  handlePartidaContextMenu,
  getPartidaCU,
  getPartidaParcial,
  getAPUBreakdown,
  partidaColumnWidths,
  partidaTableWidth,

  handlePartidaCellChange,
  handleUpdateInsumoField,
  handleDeleteInsumo,
  setSelectedSpecPartidaId,
  setIsAddInsumoOpen,
  getInsumoCantidad,
  getInsumoParcial,
  updatePartidasList
}) => {
  const cd = getBudgetCD(activeBudget);
  const gg = cd * 0.0624; // matches screenshot 6.24%
  const total = cd + gg;

  const selectedPartida = activeBudget.partidas.find(p => p.id === selectedPartidaId) || activeBudget.partidas[0];
  const cdTotal = selectedPartida ? getPartidaCU(selectedPartida) : 0;
  const specKey = selectedPartida ? selectedPartida.id : '';
  const specValue = specKey ? (specifications[specKey] || `${selectedPartida?.nombre || ''} (unidad de medida: ${selectedPartida?.unidad || 'm²'})\n\nDESCRIPCIÓN - Procesando...`) : '';

  const [activeBottomTab, setActiveBottomTab] = useState<'apu' | 'specs' | 'bim' | 'metrado' | 'xls' | 'consol'>('specs');
  const [floatingWindows, setFloatingWindows] = useState<Record<string, { isOpen: boolean; isMinimized: boolean; x: number; y: number }>>({
    apu: { isOpen: false, isMinimized: false, x: 200, y: 80 },
    specs: { isOpen: false, isMinimized: false, x: 250, y: 120 },
    bim: { isOpen: false, isMinimized: false, x: 300, y: 160 },
    metrado: { isOpen: false, isMinimized: false, x: 350, y: 200 },
    xls: { isOpen: false, isMinimized: false, x: 400, y: 240 },
    consol: { isOpen: false, isMinimized: false, x: 450, y: 280 }
  });

  // Which tab (if any) is currently docked to the right split panel
  const [dockedTab, setDockedTab] = useState<string | null>(null);

  const handleToggleTab = (tabId: string) => {
    // If already docked, undock it (make it float)
    if (dockedTab === tabId) {
      setDockedTab(null);
      setFloatingWindows(prev => ({
        ...prev,
        [tabId]: { ...prev[tabId], isOpen: true, isMinimized: false }
      }));
      return;
    }
    setFloatingWindows(prev => {
      const current = prev[tabId];
      if (!current.isOpen) {
        return {
          ...prev,
          [tabId]: { ...current, isOpen: true, isMinimized: false }
        };
      } else if (current.isMinimized) {
        return {
          ...prev,
          [tabId]: { ...current, isMinimized: false }
        };
      } else {
        return {
          ...prev,
          [tabId]: { ...current, isMinimized: true }
        };
      }
    });
  };

  const handleCloseWindow = (tabId: string) => {
    if (dockedTab === tabId) setDockedTab(null);
    setFloatingWindows(prev => ({
      ...prev,
      [tabId]: { ...prev[tabId], isOpen: false, isMinimized: false }
    }));
  };

  const handleMinimizeWindow = (tabId: string) => {
    setFloatingWindows(prev => ({
      ...prev,
      [tabId]: { ...prev[tabId], isMinimized: true }
    }));
  };

  // Dock a floating window to the right panel
  const handleDockWindow = (tabId: string) => {
    setDockedTab(tabId);
    // Close the floating version
    setFloatingWindows(prev => ({
      ...prev,
      [tabId]: { ...prev[tabId], isOpen: false, isMinimized: false }
    }));
  };

  // Undock: move back to floating
  const handleUndockWindow = () => {
    if (!dockedTab) return;
    const tabId = dockedTab;
    setDockedTab(null);
    setFloatingWindows(prev => ({
      ...prev,
      [tabId]: { ...prev[tabId], isOpen: true, isMinimized: false }
    }));
  };

  const renderPanelContent = (tabId: string): React.ReactNode => {
    switch (tabId) {
      case 'apu':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* APU Header bar */}
            <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.1)', borderBottom: '1px solid var(--border-color)', fontSize: '0.76rem', color: 'var(--text-muted)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Presupuesto: <strong style={{ color: 'var(--text-secondary)' }}>{activeBudget.nombre}</strong></span>
              <div style={{ background: theme === 'dark' ? '#1e293b' : '#f1f5f9', border: '1px solid var(--border-color)', padding: '4px 10px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Duración Fija</div>
                <div style={{ background: '#fef08a', color: '#854d0e', fontSize: '0.72rem', fontWeight: 'bold', padding: '1px 6px', borderRadius: '3px', marginTop: '2px' }}>1.000 días</div>
              </div>
            </div>
            {/* Options bar */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '14px', padding: '8px 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface-elevated)', fontSize: '0.76rem', flexShrink: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-secondary)' }}><input type="checkbox" /> Por Rendimiento</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-secondary)' }}><input type="checkbox" defaultChecked /> Por Asignación</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cant. Prog.:</span>
                <input type="text" value="1.00" readOnly style={{ width: '42px', background: '#fef08a', border: '1px solid var(--border-color)', color: '#854d0e', textAlign: 'center', borderRadius: '3px', fontWeight: 'bold', padding: '2px 4px', fontSize: '0.75rem' }} />
                <span style={{ color: 'var(--text-muted)' }}>und</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                <span style={{ color: 'var(--text-muted)' }}>Jornada:</span>
                <input type="text" value="8.00" readOnly style={{ width: '38px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', textAlign: 'center', borderRadius: '3px', padding: '2px 4px', fontSize: '0.75rem' }} />
                <span style={{ color: 'var(--text-muted)' }}>h/día</span>
              </div>
            </div>
            {/* APU Table */}
            <div style={{ flexGrow: 1, overflow: 'auto', background: 'var(--bg-main)' }}>
              {selectedPartida ? (
                selectedPartida.esTitulo ? (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>Los títulos no contienen APU.</div>
                ) : (
                  <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-color)' }}>
                      <tr>
                        <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${apuColumnWidthsState.desc}px` }}>Descripción</th>
                        <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${apuColumnWidthsState.unidad}px` }}>Und.</th>
                        <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${apuColumnWidthsState.cuadrilla}px`, textAlign: 'right' }}>Horas/Cant.</th>
                        <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${apuColumnWidthsState.cantidad}px`, textAlign: 'right' }}>% Desp.</th>
                        <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${apuColumnWidthsState.pu}px`, textAlign: 'right' }}>Precio</th>
                        <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${apuColumnWidthsState.parcial}px`, textAlign: 'right' }}>Parcial</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['MO', 'MT', 'EQ', 'SC', 'SP'].map(type => {
                        const itemsOfType = selectedPartida.insumos.filter(ins => ins.tipo === type);
                        const breakdown = getAPUBreakdown(selectedPartida);
                        const subtotal = type === 'MO' ? breakdown.MO : type === 'MT' ? breakdown.MT : type === 'EQ' ? breakdown.EQ : type === 'SC' ? breakdown.SC : breakdown.SP || 0;
                        const groupName = type === 'MO' ? 'MANO DE OBRA' : type === 'MT' ? 'MATERIALES' : type === 'EQ' ? 'EQUIPO' : type === 'SC' ? 'SUB-CONTRATOS' : 'SUB-PARTIDAS';
                        return (
                          <React.Fragment key={type}>
                            <tr style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)', fontWeight: 'bold' }}>
                              <td colSpan={5} style={{ padding: '8px 12px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{groupName}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '0.74rem' }}>{subtotal.toFixed(2)}</td>
                            </tr>
                            {itemsOfType.map(ins => {
                              const insParcial = getInsumoParcial(ins, selectedPartida.rendimiento);
                              return (
                                <tr key={ins.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                  <td style={{ padding: '6px 12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginRight: '6px' }}>{ins.id.substring(2, 6)}</span>{ins.nombre}
                                  </td>
                                  <td style={{ padding: '6px 12px', color: 'var(--text-muted)' }}>{ins.unidad}</td>
                                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                                    <input type="number" step="0.0001" value={ins.cuadrilla} onChange={(e) => handleUpdateInsumoField(ins.id, 'cuadrilla', parseFloat(e.target.value) || 0)} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'right', outline: 'none' }} />
                                  </td>
                                  <td style={{ padding: '6px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>0%</td>
                                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                                    <input type="number" step="0.01" value={ins.pu} onChange={(e) => handleUpdateInsumoField(ins.id, 'pu', parseFloat(e.target.value) || 0)} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'right', outline: 'none' }} />
                                  </td>
                                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'monospace' }}>{insParcial.toFixed(2)}</td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                )
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>Seleccione una partida para ver su APU.</div>
              )}
            </div>
            {/* APU Footer */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>Fecha: <strong style={{ color: 'var(--text-secondary)' }}>27/12/2020</strong></span>
                <span>Hecho por: <strong style={{ color: 'var(--text-secondary)' }}>Administrador</strong></span>
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 'bold' }}>
                Costo total: <span style={{ color: 'var(--color-primary)', fontSize: '1.05rem', fontFamily: 'monospace' }}>{cdTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        );
      case 'specs':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
              <div style={{ display: 'flex', padding: '0 12px', gap: '2px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {['Fichero', 'Inicio', 'Insertar', 'Vista'].map(tab => (
                    <button key={tab} onClick={() => setWordTab(tab.toLowerCase() as any)} style={{ background: 'transparent', border: 'none', color: wordTab === tab.toLowerCase() ? 'var(--color-primary)' : 'var(--text-secondary)', padding: '8px 10px', fontSize: '0.76rem', fontWeight: 'bold', cursor: 'pointer', borderBottom: wordTab === tab.toLowerCase() ? '2px solid var(--color-primary)' : '2px solid transparent' }}>{tab}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', width: '28px', height: '24px', cursor: 'pointer', fontSize: '0.72rem' }}>W</button>
                  <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', width: '32px', height: '24px', cursor: 'pointer', fontSize: '0.72rem' }}>PDF</button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface-elevated)' }}>
                <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem' }}>
                  <span style={{ cursor: 'pointer' }}>📋</span>
                  <span style={{ cursor: 'pointer' }}>✂️</span>
                  <span style={{ cursor: 'pointer' }}>📄</span>
                </div>
                <div style={{ height: '14px', width: '1px', background: 'var(--border-color)' }} />
                <select style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.72rem', padding: '2px 4px', borderRadius: '3px' }}>
                  <option>Arial Narrow</option><option>Calibri</option>
                </select>
                <select style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.72rem', padding: '2px 4px', borderRadius: '3px' }}>
                  <option>11</option><option>12</option><option>14</option>
                </select>
                <div style={{ display: 'flex', gap: '5px', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                  <span style={{ fontWeight: 'bold', cursor: 'pointer' }}>B</span>
                  <span style={{ fontStyle: 'italic', cursor: 'pointer' }}>I</span>
                  <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>U</span>
                </div>
              </div>
            </div>
            <div style={{ flexGrow: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.15)', padding: '16px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: '600px', minHeight: '260px', background: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', borderRadius: '2px', padding: '28px', color: '#1a1a1a', display: 'flex', flexDirection: 'column' }}>
                <textarea
                  value={specValue}
                  onChange={(e) => { if (!selectedPartida) return; setSpecifications(prev => ({ ...prev, [selectedPartida.id]: e.target.value })); }}
                  style={{ width: '100%', flexGrow: 1, border: 'none', outline: 'none', resize: 'none', fontSize: '0.88rem', lineHeight: '1.6', color: '#1a1a1a', fontFamily: 'Arial, sans-serif', background: 'transparent', minHeight: '220px' }}
                />
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-color)', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 'bold', color: '#38bdf8' }}>🧠 Asistente IA (Gemini 2.5 Flash)</span>
                {geminiIsLoading && <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Procesando...</span>}
              </div>
              {geminiResponse && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.74rem', color: '#e2e8f0', maxHeight: '70px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                  <strong>Respuesta Gemini:</strong><p style={{ margin: '3px 0 0 0' }}>{geminiResponse}</p>
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" value={geminiPrompt} onChange={(e) => setGeminiPrompt(e.target.value)} placeholder="Instrucción para Gemini..." style={{ flexGrow: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '5px 10px', borderRadius: '4px', fontSize: '0.76rem', outline: 'none' }} />
                <Button onClick={handleAskGemini} disabled={geminiIsLoading || !geminiPrompt.trim()} style={{ background: '#0284c7', border: 'none', color: '#fff', padding: '5px 12px', fontSize: '0.76rem', fontWeight: 'bold', cursor: 'pointer' }}>Generar</Button>
                <Button onClick={() => { if (!selectedPartida) return; setSpecifications(prev => ({ ...prev, [selectedPartida.id]: geminiResponse })); }} disabled={!geminiResponse || !selectedPartida} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '5px 10px', fontSize: '0.76rem', cursor: 'pointer' }}>Reemplazar</Button>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', flexDirection: 'column', gap: '12px', height: '100%' }}>
            <span style={{ fontSize: '2rem' }}>🚧</span>
            <span style={{ fontWeight: 'bold' }}>{tabId.toUpperCase()}</span>
            <span style={{ fontSize: '0.78rem' }}>Esta sección se encuentra en desarrollo activo.</span>
          </div>
        );
    }
  };

  const handleOpenApuExternal = () => {
    if (!selectedPartida) return;
    const title = `Análisis de Costo Unitario - Item ${selectedPartida.item} ${selectedPartida.nombre}`;
    const newWindow = window.open('', '_blank', 'width=1000,height=750,resizable=yes');
    if (!newWindow) {
      alert('Por favor permita las ventanas emergentes (popups) para este sitio.');
      return;
    }

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const breakdown = getAPUBreakdown(selectedPartida);

    const groupsHtml = ['MO', 'MT', 'EQ', 'SC', 'SP'].map(type => {
      const itemsOfType = selectedPartida.insumos.filter(ins => ins.tipo === type);
      if (itemsOfType.length === 0) return '';
      const subtotal = type === 'MO' ? breakdown.MO : type === 'MT' ? breakdown.MT : type === 'EQ' ? breakdown.EQ : type === 'SC' ? breakdown.SC : breakdown.SP || 0;
      const groupName = type === 'MO' ? 'MANO DE OBRA' : type === 'MT' ? 'MATERIALES' : type === 'EQ' ? 'EQUIPO' : type === 'SC' ? 'SUB-CONTRATOS' : 'SUB-PARTIDAS';

      const rowsHtmlStr = itemsOfType.map(ins => {
        const insQty = getInsumoCantidad(ins, selectedPartida.rendimiento);
        const insParcial = getInsumoParcial(ins, selectedPartida.rendimiento);
        return `
          <tr>
            <td style="padding: 8px 12px; font-weight: 600;">${ins.nombre}</td>
            <td style="padding: 8px 12px; color: #64748b;">${ins.unidad}</td>
            <td style="padding: 8px 12px; text-align: right; font-family: monospace;">${ins.cuadrilla.toFixed(4)}</td>
            <td style="padding: 8px 12px; text-align: right; color: #64748b;">0%</td>
            <td style="padding: 8px 12px; text-align: right; font-family: monospace;">${ins.pu.toFixed(2)}</td>
            <td style="padding: 8px 12px; text-align: right; font-weight: bold; color: #0284c7; font-family: monospace;">${insParcial.toFixed(2)}</td>
          </tr>
        `;
      }).join('');

      return `
        <tr style="background: rgba(0,0,0,0.03); font-weight: bold;">
          <td colspan="5" style="padding: 8px 12px; font-size: 0.75rem; color: #475569;">${groupName}</td>
          <td style="padding: 8px 12px; text-align: right; font-family: monospace; font-size: 0.75rem;">${subtotal.toFixed(2)}</td>
        </tr>
        ${rowsHtmlStr}
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es" data-theme="${currentTheme}">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          :root {
            --bg-main: #f8fafc;
            --bg-surface: #ffffff;
            --text-primary: #0f172a;
            --text-secondary: #475569;
            --border-color: #e2e8f0;
            --color-primary: #0284c7;
          }
          [data-theme="dark"] {
            --bg-main: #0b0f19;
            --bg-surface: #111827;
            --text-primary: #f9fafb;
            --text-secondary: #9ca3af;
            --border-color: #374151;
            --color-primary: #38bdf8;
          }
          body {
            background-color: var(--bg-main);
            color: var(--text-primary);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 24px;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            background: var(--bg-surface);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          .header {
            padding: 20px;
            background: rgba(0, 0, 0, 0.05);
            border-bottom: 1px solid var(--border-color);
          }
          .header-title {
            font-size: 1.25rem;
            font-weight: bold;
            color: var(--color-primary);
          }
          .header-subtitle {
            font-size: 0.82rem;
            color: var(--text-secondary);
            margin-top: 6px;
          }
          .table-container {
            padding: 20px;
            overflow-x: auto;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
          }
          th {
            background: rgba(0, 0, 0, 0.02);
            padding: 10px 12px;
            text-align: left;
            color: var(--text-secondary);
            border-bottom: 2px solid var(--border-color);
            font-weight: 600;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid var(--border-color);
          }
          .footer {
            padding: 16px 20px;
            border-top: 1px solid var(--border-color);
            background: rgba(0, 0, 0, 0.02);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .cost-total {
            font-size: 1.1rem;
            font-weight: bold;
          }
          .cost-val {
            color: var(--color-primary);
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-title">Análisis de Costo Unitario</div>
            <div class="header-subtitle">
              Presupuesto: <strong>${activeBudget.nombre}</strong><br>
              Item: <strong>${selectedPartida.item}</strong> &middot; Partida: <strong>${selectedPartida.nombre}</strong> &middot; Rendimiento: <strong>${selectedPartida.rendimiento} und/día</strong>
            </div>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Descripción del Recurso</th>
                  <th>Unidad</th>
                  <th style="text-align: right;">Horas/Cant.</th>
                  <th style="text-align: right;">% Desp.</th>
                  <th style="text-align: right;">Precio S/.</th>
                  <th style="text-align: right;">Parcial S/.</th>
                </tr>
              </thead>
              <tbody>
                ${groupsHtml}
              </tbody>
            </table>
          </div>
          <div class="footer">
            <div>Rendimiento: <strong>${selectedPartida.rendimiento} und/día</strong></div>
            <div class="cost-total">Costo Unitario Total: <span class="cost-val">S/. ${cdTotal.toFixed(2)}</span></div>
          </div>
        </div>
      </body>
      </html>
    `;

    newWindow.document.open();
    newWindow.document.write(htmlContent);
    newWindow.document.close();
  };

  const handleOpenSpecsExternal = () => {
    if (!selectedPartida) return;
    const title = `Especificaciones Técnicas - Item ${selectedPartida.item} ${selectedPartida.nombre}`;
    const newWindow = window.open('', '_blank', 'width=1000,height=750,resizable=yes');
    if (!newWindow) {
      alert('Por favor permita las ventanas emergentes (popups) para este sitio.');
      return;
    }

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es" data-theme="${currentTheme}">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          :root {
            --bg-main: #f8fafc;
            --bg-surface: #ffffff;
            --text-primary: #0f172a;
            --text-secondary: #475569;
            --border-color: #e2e8f0;
            --color-primary: #0284c7;
          }
          [data-theme="dark"] {
            --bg-main: #0b0f19;
            --bg-surface: #111827;
            --text-primary: #f9fafb;
            --text-secondary: #9ca3af;
            --border-color: #374151;
            --color-primary: #38bdf8;
          }
          body {
            background-color: var(--bg-main);
            color: var(--text-primary);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 24px;
            display: flex;
            justify-content: center;
          }
          .paper {
            width: 100%;
            max-width: 800px;
            background: #ffffff;
            color: #1a1a1a;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            border-radius: 4px;
            padding: 40px;
            box-sizing: border-box;
            min-height: 90vh;
            border: 1px solid var(--border-color);
          }
          .title-section {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 24px;
          }
          .title-section h1 {
            font-size: 1.5rem;
            margin: 0;
            color: #0f172a;
          }
          .title-section p {
            font-size: 0.85rem;
            color: #475569;
            margin: 6px 0 0 0;
          }
          .content-text {
            font-size: 0.95rem;
            line-height: 1.6;
            white-space: pre-wrap;
            font-family: Arial, sans-serif;
          }
        </style>
      </head>
      <body>
        <div class="paper">
          <div class="title-section">
            <h1>ESPECIFICACIONES TÉCNICAS</h1>
            <p><strong>Presupuesto:</strong> ${activeBudget.nombre} &middot; <strong>Partida:</strong> ${selectedPartida.item} ${selectedPartida.nombre}</p>
          </div>
          <div class="content-text">${specValue}</div>
        </div>
      </body>
      </html>
    `;

    newWindow.document.open();
    newWindow.document.write(htmlContent);
    newWindow.document.close();
  };

  const handleOpenExternalGeneric = (tabId: string, label: string) => {
    const title = `${label} - ${activeBudget.nombre}`;
    const newWindow = window.open('', '_blank', 'width=1000,height=750,resizable=yes');
    if (!newWindow) {
      alert('Por favor permita las ventanas emergentes (popups) para este sitio.');
      return;
    }
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es" data-theme="${currentTheme}">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          :root {
            --bg-main: #f8fafc;
            --bg-surface: #ffffff;
            --text-primary: #0f172a;
            --text-secondary: #475569;
            --border-color: #e2e8f0;
            --color-primary: #0284c7;
          }
          [data-theme="dark"] {
            --bg-main: #0b0f19;
            --bg-surface: #111827;
            --text-primary: #f9fafb;
            --text-secondary: #9ca3af;
            --border-color: #374151;
            --color-primary: #38bdf8;
          }
          body {
            background-color: var(--bg-main);
            color: var(--text-primary);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 80vh;
          }
          .card {
            background: var(--bg-surface);
            border: 1px solid var(--border-color);
            padding: 32px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1 style="color: var(--color-primary); margin: 0 0 12px 0;">${label}</h1>
          <p style="color: var(--text-secondary); margin: 0;">Presupuesto: ${activeBudget.nombre}</p>
          <p style="color: var(--text-secondary); margin: 8px 0 0 0; font-size: 0.88rem; opacity: 0.8;">Esta sección se encuentra en desarrollo activo.</p>
        </div>
      </body>
      </html>
    `;
    newWindow.document.open();
    newWindow.document.write(htmlContent);
    newWindow.document.close();
  };

  const [wordTab, setWordTab] = useState<'fichero' | 'inicio' | 'insertar' | 'diseno' | 'vista'>('inicio');
  const [searchTerm, setSearchTerm] = useState('');

  const [leftWidthPercent, setLeftWidthPercent] = useState(48);
  const [columnWidths, setColumnWidths] = useState({
    index: 35,
    item: 70,
    desc: 280,
    und: 55,
    cant: 80,
    price: 85,
    total: 95
  });

  const [apuColumnWidthsState, setApuColumnWidthsState] = useState({
    desc: 320,
    unidad: 70,
    cuadrilla: 80,
    cantidad: 80,
    pu: 80,
    parcial: 90,
    tipo: 70
  });

  const handleColumnResize = (
    colKey: keyof typeof columnWidths,
    startX: number,
    startWidth: number
  ) => {
    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setColumnWidths(prev => ({
        ...prev,
        [colKey]: Math.max(30, startWidth + deltaX)
      }));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleApuColumnResize = (
    colKey: keyof typeof apuColumnWidthsState,
    startX: number,
    startWidth: number
  ) => {
    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setApuColumnWidthsState(prev => ({
        ...prev,
        [colKey]: Math.max(30, startWidth + deltaX)
      }));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const filteredPartidas = activeBudget.partidas.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.item.includes(searchTerm)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-main)', overflow: 'hidden', width: '100%', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>
      
      {/* 1. TOP HEADER / RIBBON MENU (InfraCost 2026 layout) */}
      <div style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        padding: '8px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        {/* Ribbon Options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', flexGrow: 1 }}>
          {[
            { label: 'Ir Inicio', icon: '🏠', onClick: () => setViewState('list') },
            { label: 'Guardar', icon: '💾', onClick: () => alert('Proyecto guardado en base de datos local.') },
            { label: 'Imprimir', icon: '🖨️', onClick: () => window.print() },
            { label: 'Info. Proyecto', icon: 'ℹ️', onClick: () => setIsDatosGeneralesOpen(true) },
            { label: 'Exportar', icon: '💾', onClick: downloadActiveBudgetDatabase },
            { label: 'Fórmula Polinómica', icon: '📐', onClick: () => setIsFormulaPolinomicaOpen(true) },
            { label: 'Presupuesto Analítico', icon: '📊', onClick: () => alert('Presupuesto Analítico generado') },
            { label: 'Calendario Adquisiciones', icon: '📅', onClick: () => alert('Calendario de Adquisiciones abierto') },
            { label: 'Calendario Valorizado', icon: '🗓️', onClick: () => alert('Calendario Valorizado abierto') },
            { label: 'Resumen de costos', icon: '💰', onClick: () => setIsGastosGeneralesOpen(true) },
            { label: 'Responsables', icon: '👥', onClick: () => alert('Responsables del Proyecto') },
            { label: 'Especificaciones técnicas', icon: '📝', onClick: () => setActiveBottomTab('specs') },
            { label: 'Valorización', icon: '📈', onClick: () => alert('Valorización del presupuesto') },
            { label: 'Permisos', icon: '🔒', onClick: () => alert('Configuración de permisos de usuario') }
          ].map(opt => (
            <div
              key={opt.label}
              onClick={opt.onClick}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '4px 10px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.05)',
                minWidth: '76px',
                textAlign: 'center',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
            >
              <span style={{ fontSize: '1.05rem' }}>{opt.icon}</span>
              <span style={{ fontSize: '0.62rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.label}</span>
            </div>
          ))}
        </div>

        {/* Right side mode toggles (R, CPM, BP, BIM, BI) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: '4px', border: '1px solid var(--border-color)', flexShrink: 0, marginLeft: '12px' }}>
          {[
            { label: 'R', active: true },
            { label: 'CPM', active: false },
            { label: 'BP', active: false },
            { label: 'BIM', active: false },
            { label: 'BI', active: false }
          ].map(mode => (
            <button
              key={mode.label}
              onClick={() => alert(`Cambiando a modo ${mode.label}`)}
              style={{
                padding: '4px 10px',
                border: 'none',
                background: mode.active ? 'var(--color-primary)' : 'transparent',
                color: mode.active ? '#121622' : 'var(--text-secondary)',
                fontSize: '0.72rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '3px'
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. MAIN WORKSPACE */}
      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
        
        {/* LEFT COLUMN: Spreadsheet hierarchical table + Incidencia bottom pane */}
        <div style={{ width: dockedTab ? `${leftWidthPercent}%` : '100%', borderRight: dockedTab ? '1px solid var(--border-color)' : 'none', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', flexShrink: 0 }}>
          
          {/* Left Top: Ingrese el texto para buscar + hierarchical table */}
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Search Input bar */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)' }}>
              <input
                type="text"
                placeholder="Ingrese el texto para buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Hierarchical Spreadsheet Table */}
            <div style={{ flexGrow: 1, overflowY: 'auto' }}>
              {(() => {
                const [collapsedItems, setCollapsedItems] = useState<string[]>([]);
                const [contextMenuRow, setContextMenuRow] = useState<{ visible: boolean; x: number; y: number; partida: Partida } | null>(null);
                
                // Double-click movable popup dialog state (without backdrop filter/overlay)
                const [popupRow, setPopupRow] = useState<{ visible: boolean; x: number; y: number; partida: Partida; isDragging: boolean; dragStart: { x: number; y: number } } | null>(null);

                const toggleCollapse = (itemStr: string) => {
                  setCollapsedItems(prev => 
                    prev.includes(itemStr) 
                      ? prev.filter(x => x !== itemStr) 
                      : [...prev, itemStr]
                  );
                };

                const handleRowContextMenu = (e: React.MouseEvent, p: Partida) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextMenuRow({
                    visible: true,
                    x: e.clientX,
                    y: e.clientY,
                    partida: p
                  });
                };

                const handleRowDoubleClick = (e: React.MouseEvent, p: Partida) => {
                  e.preventDefault();
                  // Open floating menu near cursor position
                  setPopupRow({
                    visible: true,
                    x: e.clientX,
                    y: e.clientY - 20,
                    partida: p,
                    isDragging: false,
                    dragStart: { x: 0, y: 0 }
                  });
                };

                const handleAction = (action: string, p: Partida) => {
                  let actionType: 'indent' | 'outdent' | 'moveUp' | 'moveDown' | 'toggleType' | 'duplicate' | 'delete' | 'addPartida' | 'addTitle' | null = null;
                  
                  if (action === 'Cambiar Jerarquía' || action === 'Convertir a Título' || action === 'Convertir a Partida') {
                    actionType = 'toggleType';
                  } else if (action === 'Mover Derecha' || action === 'Degradar Título') {
                    actionType = 'indent';
                  } else if (action === 'Mover Izquierda' || action === 'Promover Título') {
                    actionType = 'outdent';
                  } else if (action === 'Mover Arriba') {
                    actionType = 'moveUp';
                  } else if (action === 'Mover Abajo') {
                    actionType = 'moveDown';
                  } else if (action === 'Duplicar') {
                    actionType = 'duplicate';
                  } else if (action === 'Eliminar') {
                    actionType = 'delete';
                  } else if (action === 'Agregar Partida') {
                    actionType = 'addPartida';
                  } else if (action === 'Agregar Título') {
                    actionType = 'addTitle';
                  }

                  if (actionType && updatePartidasList) {
                    const nextPartidas = adjustHierarchy(activeBudget.partidas, p.id, actionType);
                    updatePartidasList(nextPartidas);
                  } else {
                    alert(`Acción "${action}" seleccionada para el elemento: ${p.item} ${p.nombre}`);
                  }
                  
                  setContextMenuRow(null);
                  setPopupRow(null);
                };

                // Close menus on click
                React.useEffect(() => {
                  const closeMenus = () => {
                    setContextMenuRow(null);
                  };
                  window.addEventListener('click', closeMenus);
                  return () => window.removeEventListener('click', closeMenus);
                }, []);

                // Global dragging effect for Quick Properties Popup
                React.useEffect(() => {
                  if (!popupRow || !popupRow.isDragging) return;

                  const handleMouseMove = (e: MouseEvent) => {
                    setPopupRow(prev => {
                      if (!prev || !prev.isDragging) return prev;
                      return {
                        ...prev,
                        x: e.clientX - prev.dragStart.x,
                        y: e.clientY - prev.dragStart.y
                      };
                    });
                  };

                  const handleMouseUp = () => {
                    setPopupRow(prev => {
                      if (!prev) return null;
                      return { ...prev, isDragging: false };
                    });
                  };

                  window.addEventListener('mousemove', handleMouseMove);
                  window.addEventListener('mouseup', handleMouseUp);
                  return () => {
                    window.removeEventListener('mousemove', handleMouseMove);
                    window.removeEventListener('mouseup', handleMouseUp);
                  };
                }, [popupRow?.isDragging]);

                const handleItemCodeChange = (partidaId: string, oldCode: string, newCode: string) => {
                  if (!newCode) return;
                  
                  // Rule 1: Check duplication
                  const duplicate = activeBudget.partidas.find(p => p.id !== partidaId && p.item === newCode);
                  if (duplicate) {
                    alert(`El código de ítem "${newCode}" ya existe. Ingrese un código único para evitar duplicados.`);
                    return;
                  }

                  // Update the item and its subcategories reactively
                  const nextPartidas = activeBudget.partidas.map(p => {
                    if (p.id === partidaId) {
                      return { ...p, item: newCode };
                    }
                    if (p.item.startsWith(oldCode + '.')) {
                      const suffix = p.item.substring(oldCode.length);
                      return { ...p, item: newCode + suffix };
                    }
                    return p;
                  });

                  if (updatePartidasList) {
                    updatePartidasList(nextPartidas);
                  }
                };

                // Filter out items whose parent is collapsed
                const visiblePartidas = filteredPartidas.filter(p => {
                  return !collapsedItems.some(collapsedItem => {
                    return p.item !== collapsedItem && p.item.startsWith(collapsedItem + ".");
                  });
                });

                return (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-color)' }}>
                        <tr>
                          <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${columnWidths.index}px`, textAlign: 'center', position: 'relative' }}>
                            #
                            <div
                              onMouseDown={(e) => { e.preventDefault(); handleColumnResize('index', e.clientX, columnWidths.index); }}
                              style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px', cursor: 'col-resize', zIndex: 11 }}
                            />
                          </th>
                          <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${columnWidths.item}px`, position: 'relative' }}>
                            Ítem
                            <div
                              onMouseDown={(e) => { e.preventDefault(); handleColumnResize('item', e.clientX, columnWidths.item); }}
                              style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px', cursor: 'col-resize', zIndex: 11 }}
                            />
                          </th>
                          <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${columnWidths.desc}px`, position: 'relative' }}>
                            Descripción
                            <div
                              onMouseDown={(e) => { e.preventDefault(); handleColumnResize('desc', e.clientX, columnWidths.desc); }}
                              style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px', cursor: 'col-resize', zIndex: 11 }}
                            />
                          </th>
                          <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${columnWidths.und}px`, position: 'relative' }}>
                            Und.
                            <div
                              onMouseDown={(e) => { e.preventDefault(); handleColumnResize('und', e.clientX, columnWidths.und); }}
                              style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px', cursor: 'col-resize', zIndex: 11 }}
                            />
                          </th>
                          <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${columnWidths.cant}px`, textAlign: 'right', position: 'relative' }}>
                            Cantidad
                            <div
                              onMouseDown={(e) => { e.preventDefault(); handleColumnResize('cant', e.clientX, columnWidths.cant); }}
                              style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px', cursor: 'col-resize', zIndex: 11 }}
                            />
                          </th>
                          <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${columnWidths.price}px`, textAlign: 'right', position: 'relative' }}>
                            Precio
                            <div
                              onMouseDown={(e) => { e.preventDefault(); handleColumnResize('price', e.clientX, columnWidths.price); }}
                              style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px', cursor: 'col-resize', zIndex: 11 }}
                            />
                          </th>
                          <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${columnWidths.total}px`, textAlign: 'right', position: 'relative' }}>
                            Total
                            <div
                              onMouseDown={(e) => { e.preventDefault(); handleColumnResize('total', e.clientX, columnWidths.total); }}
                              style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px', cursor: 'col-resize', zIndex: 11 }}
                            />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {visiblePartidas.map((p, idx) => {
                          const isSelected = selectedPartidaId === p.id;
                          const price = getPartidaCU(p);
                          const totalVal = getPartidaParcial(p);
                          const isCollapsed = collapsedItems.includes(p.item);

                          const level = p.item.split('.').length - 1;
                          const paddingLeft = 10 + (level * 16);

                          return (
                            <tr
                              key={p.id}
                              onClick={() => handlePartidaCellClick(p)}
                              onContextMenu={(e) => handleRowContextMenu(e, p)}
                              onDoubleClick={(e) => handleRowDoubleClick(e, p)}
                              style={{
                                background: isSelected ? 'rgba(0, 240, 255, 0.05)' : p.esTitulo ? 'rgba(139, 92, 246, 0.02)' : 'transparent',
                                borderBottom: '1px solid var(--border-color)',
                                cursor: 'pointer',
                                fontWeight: p.esTitulo ? 'bold' : 'normal'
                              }}
                            >
                              {/* Index Row */}
                              <td style={{ padding: '6px 8px', color: 'var(--text-muted)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{idx + 1}</td>
                              
                              {/* Item Column (Editable on Blur/Enter) */}
                              <td style={{ padding: '4px 6px', width: `${columnWidths.item}px` }}>
                                <input
                                  type="text"
                                  defaultValue={p.item}
                                  key={p.item}
                                  onBlur={(e) => {
                                    const newCode = e.target.value.trim();
                                    if (newCode !== p.item) {
                                      handleItemCodeChange(p.id, p.item, newCode);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const newCode = e.currentTarget.value.trim();
                                      if (newCode !== p.item) {
                                        handleItemCodeChange(p.id, p.item, newCode);
                                      }
                                      e.currentTarget.blur();
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    width: '100%',
                                    background: 'transparent',
                                    border: 'none',
                                    color: getHierarchyColor(level),
                                    fontWeight: p.esTitulo ? 'bold' : 'normal',
                                    fontFamily: 'monospace',
                                    fontSize: '0.8rem',
                                    outline: 'none',
                                    padding: '2px'
                                  }}
                                />
                              </td>

                              {/* Description (with hierarchy offset) */}
                              <td style={{ padding: '6px 8px', paddingLeft: `${paddingLeft}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <span 
                                  onClick={(e) => {
                                    if (p.esTitulo) {
                                      e.stopPropagation();
                                      toggleCollapse(p.item);
                                    }
                                  }}
                                  style={{ 
                                    marginRight: '6px', 
                                    cursor: p.esTitulo ? 'pointer' : 'default',
                                    userSelect: 'none',
                                    display: 'inline-block',
                                    transition: 'transform 0.15s ease',
                                    color: getHierarchyColor(level)
                                  }}
                                >
                                  {p.esTitulo ? (isCollapsed ? '▶ 📁' : '▼ 📂') : '📄'}
                                </span>
                                <span style={{ color: getHierarchyColor(level), fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: p.esTitulo ? 'bold' : 'normal' }}>
                                  {p.nombre}
                                </span>
                              </td>
                              {/* Unidad */}
                              <td style={{ padding: '6px 8px', color: getHierarchyColor(level), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.esTitulo ? '' : p.unidad}
                              </td>
                              {/* Cantidad / Metrado */}
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.esTitulo ? '' : p.metrado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                              </td>
                              {/* Precio */}
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.esTitulo ? '' : price.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                              </td>
                              {/* Total */}
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: p.esTitulo ? '#ef4444' : 'var(--color-primary)', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                S/ {totalVal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Right click custom Context Menu */}
                    {contextMenuRow && contextMenuRow.visible && (
                      <div 
                        style={{
                          position: 'fixed',
                          top: contextMenuRow.y,
                          left: contextMenuRow.x,
                          background: theme === 'light' ? '#ffffff' : 'var(--bg-surface-elevated, #171923)',
                          border: '1px solid var(--border-color)',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                          borderRadius: '8px',
                          padding: '6px',
                          zIndex: 99999,
                          minWidth: '220px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', padding: '4px 8px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {contextMenuRow.partida.esTitulo ? '📂 Título' : '📄 Partida'}: {contextMenuRow.partida.item}
                        </div>
                        <button onClick={() => handleAction('Cambiar Jerarquía', contextMenuRow.partida)} style={contextMenuItemStyle}>
                          📐 Convertir a {contextMenuRow.partida.esTitulo ? 'Partida' : 'Título'}
                        </button>
                        <button onClick={() => handleAction('Duplicar', contextMenuRow.partida)} style={contextMenuItemStyle}>👯 Duplicar</button>
                        <button onClick={() => handleAction('Agregar Partida', contextMenuRow.partida)} style={contextMenuItemStyle}>➕ Agregar Partida</button>
                        <button onClick={() => handleAction('Agregar Título', contextMenuRow.partida)} style={contextMenuItemStyle}>➕ Agregar Título</button>
                        <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                        <button onClick={() => handleAction('Mover Arriba', contextMenuRow.partida)} style={contextMenuItemStyle}>⬆️ Mover Arriba</button>
                        <button onClick={() => handleAction('Mover Abajo', contextMenuRow.partida)} style={contextMenuItemStyle}>⬇️ Mover Abajo</button>
                        <button onClick={() => handleAction('Mover Derecha', contextMenuRow.partida)} style={contextMenuItemStyle}>➡️ Mover Derecha (Indentar)</button>
                        <button onClick={() => handleAction('Mover Izquierda', contextMenuRow.partida)} style={contextMenuItemStyle}>⬅️ Mover Izquierda (Desindentar)</button>
                        <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                        <button onClick={() => handleAction('Eliminar', contextMenuRow.partida)} style={{ ...contextMenuItemStyle, color: '#ef4444' }}>🗑️ Eliminar</button>
                      </div>
                    )}

                    {/* Double Click Movable Floating Dialog Menu (No dark backdrop filter) */}
                    {popupRow && popupRow.visible && (
                      <div 
                        style={{
                          position: 'fixed',
                          top: popupRow.y,
                          left: popupRow.x,
                          background: theme === 'light' ? '#ffffff' : 'var(--bg-surface-elevated, #171923)',
                          border: '1px solid var(--color-primary, #00f0ff)',
                          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4), 0 0 15px rgba(0, 240, 255, 0.1)',
                          borderRadius: '10px',
                          width: '320px',
                          zIndex: 99999,
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-sans)',
                          resize: 'both',
                          overflow: 'auto',
                          minWidth: '280px',
                          minHeight: '260px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Popup Header (Draggable Handle) */}
                        <div 
                          onMouseDown={(e) => {
                            const container = e.currentTarget.parentElement;
                            if (!container) return;
                            const rect = container.getBoundingClientRect();
                            setPopupRow({
                              ...popupRow,
                              isDragging: true,
                              dragStart: { x: e.clientX - rect.left, y: e.clientY - rect.top }
                            });
                          }}
                          style={{
                            background: 'linear-gradient(90deg, #1e3a8a 0%, #0f52ba 100%)',
                            color: '#ffffff',
                            padding: '10px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'move',
                            userSelect: 'none'
                          }}
                        >
                          <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>PROPIEDADES RAPIDAS</span>
                          <span 
                            onClick={() => setPopupRow(null)}
                            style={{ cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', padding: '0 4px' }}
                          >
                            ×
                          </span>
                        </div>
                        {/* Popup Content */}
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Nombre del Elemento</span>
                            <input
                              type="text"
                              value={popupRow.partida.nombre}
                              onChange={(e) => {
                                const newName = e.target.value;
                                setPopupRow({
                                  ...popupRow,
                                  partida: {
                                    ...popupRow.partida,
                                    nombre: newName
                                  }
                                });
                                handlePartidaCellChange(popupRow.partida.id, 'nombre', newName);
                              }}
                              style={{
                                width: '100%',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)',
                                padding: '6px 10px',
                                borderRadius: '4px',
                                fontSize: '0.82rem',
                                outline: 'none',
                                fontFamily: 'var(--font-sans)'
                              }}
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                               <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Ítem Código</span>
                               <input
                                 type="text"
                                 defaultValue={popupRow.partida.item}
                                 key={popupRow.partida.id + '_' + (activeBudget.partidas.find(p => p.id === popupRow.partida.id)?.item || '')}
                                 onBlur={(e) => {
                                   const newCode = e.target.value.trim();
                                   const currentActual = activeBudget.partidas.find(p => p.id === popupRow.partida.id)?.item;
                                   if (newCode && newCode !== currentActual) {
                                     handleItemCodeChange(popupRow.partida.id, currentActual || popupRow.partida.item, newCode);
                                   }
                                 }}
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter') {
                                     const newCode = e.currentTarget.value.trim();
                                     const currentActual = activeBudget.partidas.find(p => p.id === popupRow.partida.id)?.item;
                                     if (newCode && newCode !== currentActual) {
                                       handleItemCodeChange(popupRow.partida.id, currentActual || popupRow.partida.item, newCode);
                                     }
                                     e.currentTarget.blur();
                                   }
                                 }}
                                 style={{
                                   width: '100%',
                                   background: 'rgba(255, 255, 255, 0.05)',
                                   border: '1px solid var(--border-color)',
                                   color: 'var(--text-primary)',
                                   padding: '6px 10px',
                                   borderRadius: '4px',
                                   fontSize: '0.82rem',
                                   fontFamily: 'monospace',
                                   outline: 'none',
                                   boxSizing: 'border-box'
                                 }}
                               />
                             </div>
                            <div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Tipo Elemento</span>
                              <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: popupRow.partida.esTitulo ? 'var(--color-secondary)' : '#107c41' }}>
                                {popupRow.partida.esTitulo ? '📁 Título' : '📄 Partida'}
                              </span>
                            </div>
                          </div>

                          {!popupRow.partida.esTitulo && (
                            <div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Unidad</span>
                              <input
                                type="text"
                                value={popupRow.partida.unidad}
                                onChange={(e) => {
                                  const newUnidad = e.target.value;
                                  setPopupRow({
                                    ...popupRow,
                                    partida: {
                                      ...popupRow.partida,
                                      unidad: newUnidad
                                    }
                                  });
                                  handlePartidaCellChange(popupRow.partida.id, 'unidad', newUnidad);
                                }}
                                style={{
                                  width: '100%',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text-primary)',
                                  padding: '6px 10px',
                                  borderRadius: '4px',
                                  fontSize: '0.82rem',
                                  outline: 'none',
                                  fontFamily: 'var(--font-sans)',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                          )}

                          {/* Conditional Options */}
                          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: 600 }}>Operaciones Rápidas</span>
                            {popupRow.partida.esTitulo ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                  <button onClick={() => handleAction('Degradar Título', popupRow.partida)} style={popupBtnStyle}>📉 Degradar</button>
                                  <button onClick={() => handleAction('Promover Título', popupRow.partida)} style={popupBtnStyle}>📈 Promover</button>
                                </div>
                                <button 
                                  onClick={() => handleAction('Convertir a Partida', popupRow.partida)}
                                  style={{
                                    ...popupBtnStyle,
                                    background: 'rgba(16, 124, 65, 0.1)',
                                    borderColor: 'rgba(16, 124, 65, 0.3)',
                                    color: '#107c41'
                                  }}
                                >
                                  📄 Convertir a Partida
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                  <button onClick={() => handleAction('Editar Metrado', popupRow.partida)} style={popupBtnStyle}>✏️ Metrado</button>
                                  <button onClick={() => handleAction('Ver Subpresupuesto', popupRow.partida)} style={popupBtnStyle}>🔍 Presupuesto</button>
                                </div>
                                <button 
                                  onClick={() => handleAction('Convertir a Título', popupRow.partida)}
                                  style={{
                                    ...popupBtnStyle,
                                    background: 'rgba(139, 92, 246, 0.1)',
                                    borderColor: 'rgba(139, 92, 246, 0.3)',
                                    color: '#a78bfa'
                                  }}
                                >
                                  📁 Convertir a Título
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Left Bottom: Países/Monedas + Cost Incidence + Pies Resumen */}
          <div style={{ height: '240px', borderTop: '2px solid var(--border-color)', display: 'flex', flexDirection: 'column', flexShrink: 0, background: 'var(--bg-surface-elevated)' }}>
            {/* Status bar */}
            <div style={{
              height: '28px',
              borderBottom: '1px solid var(--border-color)',
              background: 'rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              fontSize: '0.72rem',
              color: 'var(--text-muted)'
            }}>
              <span>País: Perú - Moneda activa: sol peruano (S/)</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span>T.C:</span>
                <input type="text" value="1.0000" readOnly style={{ width: '40px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.72rem', textAlign: 'center' }} />
                <span>12/05/2026</span>
              </div>
            </div>

            {/* Split bottom Incidence and Summary */}
            <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
              {/* Cost Incidence Bar chart */}
              <div style={{ width: '50%', borderRight: '1px solid var(--border-color)', padding: '10px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Incidencia de Costos</span>
                <div style={{ display: 'flex', flexGrow: 1, alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: '12px' }}>
                  {[
                    { label: 'MANO DE OBRA', val: 12.3, color: '#f97316' },
                    { label: 'MATERIALES', val: 75.1, color: '#dc2626' },
                    { label: 'EQUIPO', val: 7.6, color: '#16a34a' }
                  ].map(bar => (
                    <div key={bar.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%', zIndex: 2 }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{bar.val}%</span>
                      <div style={{ width: '100%', height: `${Math.max(10, bar.val * 1.2)}px`, background: bar.color, borderRadius: '3px 3px 0 0', boxShadow: `0 0 10px ${bar.color}33` }} />
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center', lineHeight: 1.1, height: '22px', overflow: 'hidden' }}>{bar.label}</span>
                    </div>
                  ))}
                </div>

                {/* InfraCost 2026 watermark */}
                <div style={{ position: 'absolute', bottom: '10px', left: '10px', opacity: 0.12, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '1.2rem' }}>📊</span>
                  <div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-primary)' }}>InfraCost Pro</div>
                    <div style={{ fontSize: '0.45rem', color: 'var(--color-primary)' }}>2026</div>
                  </div>
                </div>
              </div>

              {/* PIE RESUMEN POR PRESUPUESTO Table */}
              <div style={{ width: '50%', padding: '10px', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Pie Resumen por Presupuesto</span>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', textAlign: 'left' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px dashed var(--border-color)' }}>
                      <td style={{ padding: '6px 0', color: 'var(--text-secondary)' }}>Costo Directo</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace' }}>S/ {cd.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', color: 'var(--text-muted)' }}>1.00</td>
                    </tr>
                    <tr style={{ borderBottom: '1px dashed var(--border-color)' }}>
                      <td style={{ padding: '6px 0', color: 'var(--text-secondary)' }}>Gastos Admin. Directa (6.24%)</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace' }}>S/ {gg.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', color: 'var(--text-muted)' }}>0.06</td>
                    </tr>
                    <tr style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                      <td style={{ padding: '8px 0' }}>Total</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'monospace' }}>S/ {total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>1.06</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>  {/* end left column */}

        {/* === RESIZE HANDLE (only when a tab is docked) === */}
        {dockedTab && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = leftWidthPercent;
              const onMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const newPercent = Math.max(25, Math.min(75, startWidth + (deltaX / window.innerWidth) * 100));
                setLeftWidthPercent(newPercent);
              };
              const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
              };
              document.addEventListener('mousemove', onMouseMove);
              document.addEventListener('mouseup', onMouseUp);
            }}
            style={{ width: '6px', background: 'var(--border-color)', cursor: 'col-resize', zIndex: 10, transition: 'background 0.2s', flexShrink: 0 }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--border-color)'}
          />
        )}

        {/* === RIGHT DOCKED PANEL === */}
        {dockedTab && (
          <div style={{ width: `${100 - leftWidthPercent}%`, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', flexShrink: 0 }}>
            {/* Docked panel header */}
            <div style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, userSelect: 'none' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {dockedTab === 'apu' ? '📐 Análisis de Costo Unitario' :
                 dockedTab === 'specs' ? '📝 Especificaciones Técnicas' :
                 dockedTab === 'bim' ? '🏗️ Metrado BIM' :
                 dockedTab === 'metrado' ? '📏 Metrado' :
                 dockedTab === 'xls' ? '📊 Metrado Xls' : '📋 Consol. de Partida'}
                {selectedPartida && ` · ${selectedPartida.item} ${selectedPartida.nombre}`}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  title="Desprender a nueva ventana del navegador"
                  onClick={() => {
                    if (dockedTab === 'apu') { handleOpenApuExternal(); }
                    else if (dockedTab === 'specs') { handleOpenSpecsExternal(); }
                    else { handleOpenExternalGeneric(dockedTab, dockedTab); }
                    setDockedTab(null);
                  }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                >↗️</button>
                <button
                  title="Desacoplar (convertir a ventana flotante)"
                  onClick={handleUndockWindow}
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--text-secondary)', padding: '2px 8px', fontWeight: 'bold' }}
                >□ Desacoplar</button>
                <button
                  title="Cerrar panel"
                  onClick={() => setDockedTab(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                >❌</button>
              </div>
            </div>
            {/* Docked panel body */}
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {renderPanelContent(dockedTab)}
            </div>
          </div>
        )}

        {/* === FLOATING WINDOWS OVERLAY LAYER === */}

        {/* APU Floating Window */}
        <FloatingWindow
          title={`📐 Análisis de Costo Unitario${selectedPartida ? ` · ${selectedPartida.item} ${selectedPartida.nombre}` : ''}`}
          isOpen={floatingWindows.apu.isOpen && dockedTab !== 'apu'}
          isMinimized={floatingWindows.apu.isMinimized}
          onClose={() => handleCloseWindow('apu')}
          onMinimize={() => handleMinimizeWindow('apu')}
          onExternalOpen={() => { handleOpenApuExternal(); handleCloseWindow('apu'); }}
          onDock={() => handleDockWindow('apu')}
          defaultPosition={{ x: floatingWindows.apu.x, y: floatingWindows.apu.y }}
          width="860px"
          height="580px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* APU Header bar */}
            <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.1)', borderBottom: '1px solid var(--border-color)', fontSize: '0.76rem', color: 'var(--text-muted)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Presupuesto: <strong style={{ color: 'var(--text-secondary)' }}>{activeBudget.nombre}</strong></span>
              <div style={{ background: theme === 'dark' ? '#1e293b' : '#f1f5f9', border: '1px solid var(--border-color)', padding: '4px 10px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Duración Fija</div>
                <div style={{ background: '#fef08a', color: '#854d0e', fontSize: '0.72rem', fontWeight: 'bold', padding: '1px 6px', borderRadius: '3px', marginTop: '2px' }}>1.000 días</div>
              </div>
            </div>
            {/* Options bar */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '14px', padding: '8px 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface-elevated)', fontSize: '0.76rem', flexShrink: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-secondary)' }}><input type="checkbox" /> Por Rendimiento</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-secondary)' }}><input type="checkbox" defaultChecked /> Por Asignación</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cant. Prog.:</span>
                <input type="text" value="1.00" readOnly style={{ width: '42px', background: '#fef08a', border: '1px solid var(--border-color)', color: '#854d0e', textAlign: 'center', borderRadius: '3px', fontWeight: 'bold', padding: '2px 4px', fontSize: '0.75rem' }} />
                <span style={{ color: 'var(--text-muted)' }}>und</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                <span style={{ color: 'var(--text-muted)' }}>Jornada:</span>
                <input type="text" value="8.00" readOnly style={{ width: '38px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', textAlign: 'center', borderRadius: '3px', padding: '2px 4px', fontSize: '0.75rem' }} />
                <span style={{ color: 'var(--text-muted)' }}>h/día</span>
              </div>
            </div>
            {/* APU Table */}
            <div style={{ flexGrow: 1, overflow: 'auto', background: 'var(--bg-main)' }}>
              {selectedPartida ? (
                selectedPartida.esTitulo ? (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>Los títulos no contienen APU.</div>
                ) : (
                  <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-color)' }}>
                      <tr>
                        <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${apuColumnWidthsState.desc}px`, position: 'relative' }}>Descripción</th>
                        <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${apuColumnWidthsState.unidad}px` }}>Und.</th>
                        <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${apuColumnWidthsState.cuadrilla}px`, textAlign: 'right' }}>Horas/Cant.</th>
                        <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${apuColumnWidthsState.cantidad}px`, textAlign: 'right' }}>% Desp.</th>
                        <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${apuColumnWidthsState.pu}px`, textAlign: 'right' }}>Precio</th>
                        <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${apuColumnWidthsState.parcial}px`, textAlign: 'right' }}>Parcial Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['MO', 'MT', 'EQ', 'SC', 'SP'].map(type => {
                        const itemsOfType = selectedPartida.insumos.filter(ins => ins.tipo === type);
                        const breakdown = getAPUBreakdown(selectedPartida);
                        const subtotal = type === 'MO' ? breakdown.MO : type === 'MT' ? breakdown.MT : type === 'EQ' ? breakdown.EQ : type === 'SC' ? breakdown.SC : breakdown.SP || 0;
                        const groupName = type === 'MO' ? 'MANO DE OBRA' : type === 'MT' ? 'MATERIALES' : type === 'EQ' ? 'EQUIPO' : type === 'SC' ? 'SUB-CONTRATOS' : 'SUB-PARTIDAS';
                        return (
                          <React.Fragment key={type}>
                            <tr style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)', fontWeight: 'bold' }}>
                              <td colSpan={5} style={{ padding: '8px 12px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{groupName}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '0.74rem' }}>{subtotal.toFixed(2)}</td>
                            </tr>
                            {itemsOfType.map(ins => {
                              const insParcial = getInsumoParcial(ins, selectedPartida.rendimiento);
                              return (
                                <tr key={ins.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                  <td style={{ padding: '6px 12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginRight: '6px' }}>{ins.id.substring(2, 6)}</span>
                                    {ins.nombre}
                                  </td>
                                  <td style={{ padding: '6px 12px', color: 'var(--text-muted)' }}>{ins.unidad}</td>
                                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                                    <input type="number" step="0.0001" value={ins.cuadrilla} onChange={(e) => handleUpdateInsumoField(ins.id, 'cuadrilla', parseFloat(e.target.value) || 0)} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'right', outline: 'none' }} />
                                  </td>
                                  <td style={{ padding: '6px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>0%</td>
                                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                                    <input type="number" step="0.01" value={ins.pu} onChange={(e) => handleUpdateInsumoField(ins.id, 'pu', parseFloat(e.target.value) || 0)} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'right', outline: 'none' }} />
                                  </td>
                                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'monospace' }}>{insParcial.toFixed(2)}</td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                )
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>Seleccione una partida para ver su APU.</div>
              )}
            </div>
            {/* APU Footer */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>Fecha: <strong style={{ color: 'var(--text-secondary)' }}>27/12/2020</strong></span>
                <span>Hecho por: <strong style={{ color: 'var(--text-secondary)' }}>Administrador</strong></span>
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 'bold' }}>
                Costo total: <span style={{ color: 'var(--color-primary)', fontSize: '1.05rem', fontFamily: 'monospace' }}>{cdTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </FloatingWindow>

        {/* Specs Floating Window */}
        <FloatingWindow
          title={`📝 Especificaciones Técnicas${selectedPartida ? ` · ${selectedPartida.item} ${selectedPartida.nombre}` : ''}`}
          isOpen={floatingWindows.specs.isOpen && dockedTab !== 'specs'}
          isMinimized={floatingWindows.specs.isMinimized}
          onClose={() => handleCloseWindow('specs')}
          onMinimize={() => handleMinimizeWindow('specs')}
          onExternalOpen={() => { handleOpenSpecsExternal(); handleCloseWindow('specs'); }}
          onDock={() => handleDockWindow('specs')}
          defaultPosition={{ x: floatingWindows.specs.x, y: floatingWindows.specs.y }}
          width="720px"
          height="560px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Specs Ribbon Tabs */}
            <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
              <div style={{ display: 'flex', padding: '0 12px', gap: '2px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {['Fichero', 'Inicio', 'Insertar', 'Vista'].map(tab => (
                    <button key={tab} onClick={() => setWordTab(tab.toLowerCase() as any)} style={{ background: 'transparent', border: 'none', color: wordTab === tab.toLowerCase() ? 'var(--color-primary)' : 'var(--text-secondary)', padding: '8px 10px', fontSize: '0.76rem', fontWeight: 'bold', cursor: 'pointer', borderBottom: wordTab === tab.toLowerCase() ? '2px solid var(--color-primary)' : '2px solid transparent' }}>{tab}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button title="Exportar a Word" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', width: '28px', height: '24px', cursor: 'pointer', fontSize: '0.72rem' }}>W</button>
                  <button title="Exportar a PDF" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', width: '32px', height: '24px', cursor: 'pointer', fontSize: '0.72rem' }}>PDF</button>
                </div>
              </div>
              {/* Formatting bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface-elevated)' }}>
                <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem' }}>
                  <span style={{ cursor: 'pointer' }} title="Pegar">📋</span>
                  <span style={{ cursor: 'pointer' }} title="Cortar">✂️</span>
                  <span style={{ cursor: 'pointer' }} title="Copiar">📄</span>
                </div>
                <div style={{ height: '14px', width: '1px', background: 'var(--border-color)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <select style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.72rem', padding: '2px 4px', borderRadius: '3px' }}>
                    <option>Arial Narrow</option><option>Calibri</option><option>Times New Roman</option>
                  </select>
                  <select style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.72rem', padding: '2px 4px', borderRadius: '3px' }}>
                    <option>11</option><option>12</option><option>14</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                  <span style={{ fontWeight: 'bold', cursor: 'pointer' }}>B</span>
                  <span style={{ fontStyle: 'italic', cursor: 'pointer' }}>I</span>
                  <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>U</span>
                </div>
              </div>
            </div>
            {/* Paper text area */}
            <div style={{ flexGrow: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.15)', padding: '20px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: '600px', minHeight: '300px', background: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', borderRadius: '2px', padding: '32px', color: '#1a1a1a', display: 'flex', flexDirection: 'column' }}>
                <textarea
                  value={specValue}
                  onChange={(e) => { if (!selectedPartida) return; setSpecifications(prev => ({ ...prev, [selectedPartida.id]: e.target.value })); }}
                  style={{ width: '100%', height: '100%', border: 'none', outline: 'none', resize: 'none', fontSize: '0.88rem', lineHeight: '1.6', color: '#1a1a1a', fontFamily: 'Arial, sans-serif', flexGrow: 1, background: 'transparent', minHeight: '280px' }}
                />
              </div>
            </div>
            {/* Gemini AI Panel */}
            <div style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-color)', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 'bold', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>🧠 Asistente IA (Gemini 2.5 Flash)</span>
                {geminiIsLoading && <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Procesando...</span>}
              </div>
              {geminiResponse && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.74rem', lineHeight: '1.4', color: '#e2e8f0', maxHeight: '80px', overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)' }}>
                  <strong>Respuesta Gemini:</strong><p style={{ margin: '3px 0 0 0' }}>{geminiResponse}</p>
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" value={geminiPrompt} onChange={(e) => setGeminiPrompt(e.target.value)} placeholder="Instrucción para Gemini..." style={{ flexGrow: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '5px 10px', borderRadius: '4px', fontSize: '0.76rem', outline: 'none' }} />
                <Button onClick={handleAskGemini} disabled={geminiIsLoading || !geminiPrompt.trim()} style={{ background: '#0284c7', border: 'none', color: '#fff', padding: '5px 12px', fontSize: '0.76rem', fontWeight: 'bold', cursor: 'pointer' }}>Generar</Button>
                <Button onClick={() => { if (!selectedPartida) return; setSpecifications(prev => ({ ...prev, [selectedPartida.id]: geminiResponse })); }} disabled={!geminiResponse || !selectedPartida} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '5px 10px', fontSize: '0.76rem', cursor: 'pointer' }}>Reemplazar</Button>
              </div>
            </div>
          </div>
        </FloatingWindow>

        {/* Generic floating windows for other tabs */}
        {[{ id: 'bim', label: '🏗️ Metrado BIM' }, { id: 'metrado', label: '📏 Metrado' }, { id: 'xls', label: '📊 Metrado Xls' }, { id: 'consol', label: '📋 Consol. de Partida' }].map(({ id, label }) => (
          <FloatingWindow
            key={id}
            title={`${label} · ${activeBudget.nombre.substring(0, 30)}`}
            isOpen={floatingWindows[id].isOpen && dockedTab !== id}
            isMinimized={floatingWindows[id].isMinimized}
            onClose={() => handleCloseWindow(id)}
            onMinimize={() => handleMinimizeWindow(id)}
            onExternalOpen={() => { handleOpenExternalGeneric(id, label); handleCloseWindow(id); }}
            onDock={() => handleDockWindow(id)}
            defaultPosition={{ x: floatingWindows[id].x, y: floatingWindows[id].y }}
            width="700px"
            height="480px"
          >
            <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '2rem' }}>🚧</span>
              <span style={{ fontWeight: 'bold' }}>{label}</span>
              <span style={{ fontSize: '0.78rem' }}>Esta sección se encuentra en desarrollo activo.</span>
            </div>
          </FloatingWindow>
        ))}
      </div> {/* end MAIN WORKSPACE */}

      {/* 3. FOOTER NAVIGATION TABS */}

      <div style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        padding: '4px 16px',
        flexShrink: 0,
        gap: '4px'
      }}>
        {/* Navigation Tabs (Top Row) - now open floating windows */}
        <div style={{ display: 'flex', gap: '2px', height: '28px', justifyContent: 'flex-start', alignItems: 'center' }}>
          {[
            { id: 'apu', label: 'Análisis de C.U', icon: '📐' },
            { id: 'specs', label: 'Especif. técnicas', icon: '📝' },
            { id: 'bim', label: 'Metrado BIM', icon: '🏗️' },
            { id: 'metrado', label: 'Metrado', icon: '📏' },
            { id: 'xls', label: 'Metrado Xls', icon: '📊' },
            { id: 'consol', label: 'Consol. de Partida', icon: '📋' }
          ].map(tab => {
            const fw = floatingWindows[tab.id];
            const isActive = fw.isOpen && !fw.isMinimized;
            const isMinimized = fw.isOpen && fw.isMinimized;
            return (
              <button
                key={tab.id}
                onClick={() => handleToggleTab(tab.id)}
                title={isActive ? 'Minimizar ventana' : isMinimized ? 'Restaurar ventana' : 'Abrir ventana flotante'}
                style={{
                  height: '100%',
                  border: 'none',
                  background: isActive ? 'var(--bg-main)' : isMinimized ? 'rgba(255,255,255,0.04)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : isMinimized ? 'var(--text-secondary)' : 'var(--text-secondary)',
                  fontSize: '0.72rem',
                  fontWeight: 'bold',
                  padding: '0 12px',
                  cursor: 'pointer',
                  borderTop: isActive ? '2px solid var(--color-primary)' : isMinimized ? '2px solid rgba(255,165,0,0.6)' : '2px solid transparent',
                  borderRadius: '4px 4px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {isMinimized && <span style={{ fontSize: '0.6rem', background: 'rgba(255,165,0,0.2)', borderRadius: '3px', padding: '1px 4px', color: '#f59e0b' }}>MIN</span>}
              </button>
            );
          })}
        </div>

        {/* Open Budgets Tabs (Bottom Row - Left aligned) */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start', gap: '2px', height: '32px', overflowX: 'auto' }}>
          {openBudgets.map(budget => {
            const isActive = budget.id === activeBudget.id;
            return (
              <div
                key={budget.id}
                onClick={() => handleSelectBudgetTab(budget.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: '100%',
                  padding: '0 16px',
                  background: isActive ? 'var(--bg-main)' : 'transparent',
                  borderLeft: '1px solid var(--border-color)',
                  borderRight: '1px solid var(--border-color)',
                  borderTop: isActive ? '3px solid #107c41' : '3px solid transparent', // Excel green accent
                  borderBottom: isActive ? 'none' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: isActive ? 'bold' : 'normal',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                  position: 'relative',
                  zIndex: isActive ? 2 : 1
                }}
              >
                <span style={{ fontSize: '0.9rem' }}>📄</span>
                <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {budget.nombre}
                </span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseBudgetTab(budget.id, e);
                  }}
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    marginLeft: '4px',
                    borderRadius: '50%',
                    width: '14px',
                    height: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.15s, color 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 0, 0, 0.2)';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                >
                  ×
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
