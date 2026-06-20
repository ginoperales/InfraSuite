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
  action: 'indent' | 'outdent' | 'moveUp' | 'moveDown' | 'toggleType' | 'duplicate' | 'delete'
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
  const [wordTab, setWordTab] = useState<'fichero' | 'inicio' | 'insertar' | 'diseno' | 'vista'>('inicio');
  const [searchTerm, setSearchTerm] = useState('');

  const [leftWidthPercent, setLeftWidthPercent] = useState(48);
  const [columnWidths, setColumnWidths] = useState({
    index: 35,
    item: 70,
    desc: 280,
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

      {/* 2. MAIN SPLIT PANE WORKSPACE */}
      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* LEFT COLUMN: Spreadsheet hierarchical table + Incidencia bottom pane */}
        <div style={{ width: `${leftWidthPercent}%`, borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          
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
                  let actionType: 'indent' | 'outdent' | 'moveUp' | 'moveDown' | 'toggleType' | 'duplicate' | 'delete' | null = null;
                  
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
                                    color: p.esTitulo ? '#ef4444' : 'var(--text-primary)',
                                    fontWeight: p.esTitulo ? 'bold' : 'normal',
                                    fontFamily: 'monospace',
                                    fontSize: '0.8rem',
                                    outline: 'none',
                                    padding: '2px'
                                  }}
                                />
                              </td>

                              {/* Description (with hierarchy offset) */}
                              <td style={{ padding: '6px 8px', paddingLeft: `${paddingLeft}px`, color: p.esTitulo ? '#ef4444' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                                    transition: 'transform 0.15s ease'
                                  }}
                                >
                                  {p.esTitulo ? (isCollapsed ? '▶ 📁' : '▼ 📂') : '📄'}
                                </span>
                                <span style={{ color: p.esTitulo ? 'var(--color-secondary)' : 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: '0.8rem' }}>
                                  {p.nombre}
                                </span>
                              </td>
                              {/* Cantidad / Metrado */}
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.esTitulo ? '' : p.metrado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                {!p.esTitulo && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '4px' }}>{p.unidad}</span>}
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
                          overflow: 'hidden'
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
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Ítem Código</span>
                              <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 'bold' }}>{popupRow.partida.item}</span>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Tipo Elemento</span>
                              <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: popupRow.partida.esTitulo ? 'var(--color-secondary)' : '#107c41' }}>
                                {popupRow.partida.esTitulo ? '📁 Título' : '📄 Partida'}
                              </span>
                            </div>
                          </div>

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
        </div>

        {/* Vertical Resize Handle */}
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
          style={{
            width: '6px',
            background: 'var(--border-color)',
            cursor: 'col-resize',
            zIndex: 10,
            transition: 'background 0.2s',
            position: 'relative'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--border-color)'}
        />

        {/* RIGHT COLUMN: dynamic panel depending on activeBottomTab */}
        <div style={{ width: `${100 - leftWidthPercent}%`, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {activeBottomTab === 'specs' ? (
            <>
              {/* Word-like Editor Header Info */}
              <div style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Especificaciones técnicas</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      Presupuesto: {activeBudget.nombre.substring(0, 30)}... · Partida: {selectedPartida?.item} {selectedPartida?.nombre}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button title="Exportar a Word" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#ffffff', borderRadius: '4px', width: '28px', height: '24px', cursor: 'pointer', fontSize: '0.75rem' }}>W</button>
                    <button title="Exportar a PDF" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#ffffff', borderRadius: '4px', width: '28px', height: '24px', cursor: 'pointer', fontSize: '0.75rem' }}>PDF</button>
                  </div>
                </div>
              </div>

              {/* Word-like Ribbon Tabs (Fichero, Inicio, Insertar, etc.) */}
              <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
                <div style={{ display: 'flex', padding: '0 16px', gap: '4px' }}>
                  {['Fichero', 'Inicio', 'Insertar', 'Distribución de Página', 'Vista'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setWordTab(tab.toLowerCase() as any)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: wordTab === tab.toLowerCase() ? 'var(--color-primary)' : 'var(--text-secondary)',
                        padding: '8px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        borderBottom: wordTab === tab.toLowerCase() ? '2px solid var(--color-primary)' : '2px solid transparent'
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Word Font & Style options toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface-elevated)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', cursor: 'pointer' }} title="Pegar">📋</span>
                    <span style={{ fontSize: '0.75rem', cursor: 'pointer' }} title="Cortar">✂️</span>
                    <span style={{ fontSize: '0.75rem', cursor: 'pointer' }} title="Copiar">📄</span>
                  </div>
                  <div style={{ height: '16px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <select style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#ffffff', fontSize: '0.74rem', padding: '2px 4px', borderRadius: '3px' }}>
                      <option>Arial Narrow</option>
                      <option>Calibri</option>
                      <option>Times New Roman</option>
                    </select>
                    <select style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#ffffff', fontSize: '0.74rem', padding: '2px 4px', borderRadius: '3px' }}>
                      <option>11</option>
                      <option>12</option>
                      <option>14</option>
                    </select>
                  </div>
                  <div style={{ height: '16px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem' }}>
                    <span style={{ fontWeight: 'bold', cursor: 'pointer' }}>B</span>
                    <span style={{ fontStyle: 'italic', cursor: 'pointer' }}>I</span>
                    <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>U</span>
                    <span style={{ textDecoration: 'line-through', cursor: 'pointer' }}>S</span>
                  </div>
                  <div style={{ height: '16px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '3px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    AaBbCcDd Normal
                  </div>
                </div>
              </div>

              {/* Text Editor Container (Styled like a real paper sheet) */}
              <div style={{ flexGrow: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '24px', display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  width: '100%',
                  maxWidth: '650px',
                  minHeight: '400px',
                  background: '#ffffff',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                  borderRadius: '2px',
                  padding: '40px',
                  color: '#1a1a1a',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <textarea
                    value={specValue}
                    onChange={(e) => {
                      if (!selectedPartida) return;
                      setSpecifications(prev => ({
                        ...prev,
                        [selectedPartida.id]: e.target.value
                      }));
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      outline: 'none',
                      resize: 'none',
                      fontSize: '0.88rem',
                      lineHeight: '1.6',
                      color: '#1a1a1a',
                      fontFamily: 'Arial, sans-serif',
                      flexGrow: 1,
                      background: 'transparent'
                    }}
                  />
                </div>
              </div>

              {/* Gemini AI Assistant Console Panel */}
              <div style={{
                background: 'var(--bg-surface)',
                borderTop: '1px solid var(--border-color)',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🧠 Asistente IA (Gemini 2.5 Flash)
                  </span>
                  {geminiIsLoading && <span style={{ fontSize: '0.7rem', color: '#94a3b8', animation: 'pulse 1s infinite' }}>Procesando con IA...</span>}
                </div>

                {geminiResponse && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.76rem',
                    lineHeight: '1.4',
                    color: '#e2e8f0',
                    maxHeight: '100px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'var(--font-sans)'
                  }}>
                    <strong>InfraCost Pro 2026 - Respuesta generada por Gemini:</strong>
                    <p style={{ margin: '4px 0 0 0' }}>{geminiResponse}</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={geminiPrompt}
                    onChange={(e) => setGeminiPrompt(e.target.value)}
                    placeholder="Instrucción para Gemini (ej: escribe la descripción detallada)..."
                    style={{
                      flexGrow: 1,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--text-primary)',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '0.78rem',
                      outline: 'none'
                    }}
                  />
                  <Button
                    onClick={handleAskGemini}
                    disabled={geminiIsLoading || !geminiPrompt.trim()}
                    style={{
                      background: '#0284c7',
                      border: 'none',
                      color: '#ffffff',
                      padding: '6px 14px',
                      fontSize: '0.78rem',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Generar respuesta
                  </Button>
                  <Button
                    onClick={() => {
                      if (!selectedPartida) return;
                      setSpecifications(prev => ({
                        ...prev,
                        [selectedPartida.id]: geminiResponse
                      }));
                      alert('Especificación técnica reemplazada.');
                    }}
                    disabled={!geminiResponse || !selectedPartida}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#ffffff',
                      padding: '6px 12px',
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    Reemplazar
                  </Button>
                </div>
              </div>
            </>
          ) : activeBottomTab === 'apu' ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              {/* Header Title exactly like screenshot */}
              <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>Análisis de costo unitario</span>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Presupuesto: <strong style={{ color: 'var(--text-secondary)' }}>{activeBudget.nombre}</strong> · Item: <strong style={{ color: 'var(--text-secondary)' }}>{selectedPartida?.item || '—'}</strong> · Partida: <strong style={{ color: 'var(--text-secondary)' }}>{selectedPartida?.nombre || '—'}</strong>
                  </div>
                </div>
                {/* Right side box: Duración Fija */}
                <div style={{ background: theme === 'dark' ? '#1e293b' : '#f1f5f9', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '4px', textAlign: 'center', minWidth: '120px', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Duración Fija</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>programada para ejecutar 1.00 und</div>
                  <div style={{ background: '#fef08a', color: '#854d0e', fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', marginTop: '4px', border: '1px solid #fef08a' }}>1.000 días</div>
                </div>
              </div>

              {/* Options bar checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '10px 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface-elevated)', fontSize: '0.76rem', flexShrink: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" /> Por Rendimiento
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" defaultChecked /> Por Asignación
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cant. Prog.:</span>
                  <input type="text" value="1.00" readOnly style={{ width: '45px', background: '#fef08a', border: '1px solid var(--border-color)', color: '#854d0e', textAlign: 'center', borderRadius: '3px', fontWeight: 'bold', padding: '2px 4px' }} />
                  <span style={{ color: 'var(--text-muted)' }}>und</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Prod. Est.:</span>
                  <input type="text" value="1.00" readOnly style={{ width: '45px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', textAlign: 'center', borderRadius: '3px', padding: '2px 4px' }} />
                  <span style={{ color: 'var(--text-muted)' }}>und</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Jornada:</span>
                  <input type="text" value="8.00" readOnly style={{ width: '40px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', textAlign: 'center', borderRadius: '3px', padding: '2px 4px' }} />
                  <span style={{ color: 'var(--text-muted)' }}>h/día</span>
                </div>
              </div>

              {/* APU Table spreadsheet grid */}
              <div style={{ flexGrow: 1, overflow: 'auto', background: 'var(--bg-main)' }}>
                {selectedPartida ? (
                  selectedPartida.esTitulo ? (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      Los elementos de tipo Título no contienen un Análisis de Precios Unitarios.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                      
                      {/* APU Table */}
                      <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-color)' }}>
                          <tr>
                            <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${apuColumnWidthsState.desc}px`, position: 'relative' }}>
                              Descripción
                              <div
                                onMouseDown={(e) => { e.preventDefault(); handleApuColumnResize('desc', e.clientX, apuColumnWidthsState.desc); }}
                                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px', cursor: 'col-resize', zIndex: 11 }}
                              />
                            </th>
                            <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${apuColumnWidthsState.unidad}px`, position: 'relative' }}>
                              Und. Asig.
                              <div
                                onMouseDown={(e) => { e.preventDefault(); handleApuColumnResize('unidad', e.clientX, apuColumnWidthsState.unidad); }}
                                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px', cursor: 'col-resize', zIndex: 11 }}
                              />
                            </th>
                            <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${apuColumnWidthsState.cuadrilla}px`, textAlign: 'right', position: 'relative' }}>
                              Horas asig./Cant.
                              <div
                                onMouseDown={(e) => { e.preventDefault(); handleApuColumnResize('cuadrilla', e.clientX, apuColumnWidthsState.cuadrilla); }}
                                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px', cursor: 'col-resize', zIndex: 11 }}
                              />
                            </th>
                            <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${apuColumnWidthsState.cantidad}px`, textAlign: 'right', position: 'relative' }}>
                              % Desp.
                              <div
                                onMouseDown={(e) => { e.preventDefault(); handleApuColumnResize('cantidad', e.clientX, apuColumnWidthsState.cantidad); }}
                                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px', cursor: 'col-resize', zIndex: 11 }}
                              />
                            </th>
                            <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${apuColumnWidthsState.pu}px`, textAlign: 'right', position: 'relative' }}>
                              Precio
                              <div
                                onMouseDown={(e) => { e.preventDefault(); handleApuColumnResize('pu', e.clientX, apuColumnWidthsState.pu); }}
                                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px', cursor: 'col-resize', zIndex: 11 }}
                              />
                            </th>
                            <th style={{ padding: '6px 8px', color: 'var(--text-secondary)', width: `${apuColumnWidthsState.parcial}px`, textAlign: 'right', position: 'relative' }}>
                              Parcial Total
                              <div
                                onMouseDown={(e) => { e.preventDefault(); handleApuColumnResize('parcial', e.clientX, apuColumnWidthsState.parcial); }}
                                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px', cursor: 'col-resize', zIndex: 11 }}
                              />
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* We group by type: MO, MT, EQ, SC, SP */}
                          {['MO', 'MT', 'EQ', 'SC', 'SP'].map(type => {
                            const itemsOfType = selectedPartida.insumos.filter(ins => ins.tipo === type);
                            const breakdown = getAPUBreakdown(selectedPartida);
                            const subtotal = type === 'MO' ? breakdown.MO : type === 'MT' ? breakdown.MT : type === 'EQ' ? breakdown.EQ : type === 'SC' ? breakdown.SC : breakdown.SP || 0;
                            const groupName = type === 'MO' ? 'MANO DE OBRA' : type === 'MT' ? 'MATERIALES' : type === 'EQ' ? 'EQUIPO' : type === 'SC' ? 'SUB-CONTRATOS' : 'SUB-PARTIDAS';

                            return (
                              <React.Fragment key={type}>
                                {/* Group row header */}
                                <tr style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)', fontWeight: 'bold' }}>
                                  <td colSpan={5} style={{ padding: '8px 12px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                                    {groupName}
                                  </td>
                                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '0.74rem' }}>
                                    {subtotal.toFixed(2)}
                                  </td>
                                </tr>
                                {/* Items of type */}
                                {itemsOfType.map(ins => {
                                  const insQty = getInsumoCantidad(ins, selectedPartida.rendimiento);
                                  const insParcial = getInsumoParcial(ins, selectedPartida.rendimiento);

                                  return (
                                    <tr key={ins.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                      <td style={{ padding: '6px 12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginRight: '6px' }}>{ins.id.substring(2, 6)}</span>
                                        {ins.nombre}
                                      </td>
                                      <td style={{ padding: '6px 12px', color: 'var(--text-muted)' }}>{ins.unidad}</td>
                                      <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                                        <input
                                          type="number"
                                          step="0.0001"
                                          value={ins.cuadrilla}
                                          onChange={(e) => handleUpdateInsumoField(ins.id, 'cuadrilla', parseFloat(e.target.value) || 0)}
                                          style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'right', outline: 'none' }}
                                        />
                                      </td>
                                      <td style={{ padding: '6px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>0%</td>
                                      <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={ins.pu}
                                          onChange={(e) => handleUpdateInsumoField(ins.id, 'pu', parseFloat(e.target.value) || 0)}
                                          style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'right', outline: 'none' }}
                                        />
                                      </td>
                                      <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                                        {insParcial.toFixed(2)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Add resource action */}
                      <div style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                        <Button
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
                        </Button>
                      </div>

                    </div>
                  )
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    Seleccione una partida en la grilla superior para editar sus análisis.
                  </div>
                )}
              </div>

              {/* Bottom status exactly like screenshot */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>Fecha: <strong style={{ color: 'var(--text-secondary)' }}>27/12/2020</strong></span>
                  <span>Hecho por: <strong style={{ color: 'var(--text-secondary)' }}>Administrador</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 'bold' }}>
                    Costo total: <span style={{ color: 'var(--color-primary)', fontSize: '1.05rem', fontFamily: 'monospace' }}>{cdTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <Button variant="secondary" style={{ fontSize: '0.76rem', padding: '6px 12px' }}>
                    ACU (Inc. Pie Presupuesto)
                  </Button>
                </div>
              </div>

            </div>
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Sección activa: {activeBottomTab.toUpperCase()} (Desarrollo en progreso)
            </div>
          )}
        </div>
      </div>

      {/* 3. FOOTER NAVIGATION TABS */}
      <div style={{
        height: '36px',
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', gap: '2px', height: '100%' }}>
          {[
            { id: 'apu', label: 'Análisis de C.U' },
            { id: 'specs', label: 'Especif. técnicas' },
            { id: 'bim', label: 'Metrado BIM' },
            { id: 'metrado', label: 'Metrado' },
            { id: 'xls', label: 'Metrado Xls' },
            { id: 'consol', label: 'Consol. de Partida' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveBottomTab(tab.id as any);
                if (tab.id === 'apu') {
                  alert('Abriendo análisis de costos unitarios (APU).');
                }
              }}
              style={{
                height: '100%',
                border: 'none',
                background: activeBottomTab === tab.id ? 'var(--bg-main)' : 'transparent',
                color: activeBottomTab === tab.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontSize: '0.72rem',
                fontWeight: 'bold',
                padding: '0 14px',
                cursor: 'pointer',
                borderTop: activeBottomTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Open Budgets Tabs (Excel sheet style) */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '100%', overflowX: 'auto' }}>
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
