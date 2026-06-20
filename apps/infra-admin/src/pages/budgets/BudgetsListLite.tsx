import React from 'react';
import { Card, Button, Input } from '@infrasuite/shared';
import type { Budget } from './types';

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
  getBudgetCD: (b: Budget) => number;
  openBudgets: Budget[];
  handleSelectBudgetTab: (id: string) => void;
  handleCloseBudgetTab: (id: string, e: React.MouseEvent) => void;
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
  menuItemStyle: React.CSSProperties;
}

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
  getBudgetCD,
  openBudgets,
  handleSelectBudgetTab,
  handleCloseBudgetTab,
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
  menuItemStyle
}) => {
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
            onClick={() => {}}
            style={{
              padding: '6px 14px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              borderBottom: 'none',
              borderRadius: '6px 6px 0 0',
              color: 'var(--color-primary)',
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
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderBottom: 'none',
                  borderRadius: '6px 6px 0 0',
                  color: 'var(--text-secondary)',
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

      <div className="content-container" style={{ position: 'relative', overflowY: 'auto', flexGrow: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Filter and Search Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          background: 'rgba(12, 14, 21, 0.4)',
          padding: '20px 24px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button onClick={() => { resetBudgetForm(); setIsCreateOpen(true); }} style={{ background: 'var(--grad-primary)', border: 'none' }}>
              ➕ Nuevo Presupuesto
            </Button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Grupo:</span>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  fontSize: '0.85rem',
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
            
            <Button variant="secondary" onClick={() => { setIsLoading(true); setTimeout(() => setIsLoading(false), 500); }}>
              🔄 Actualizar
            </Button>
          </div>

          <div style={{ width: '100%', maxWidth: '360px' }}>
            <Input
              placeholder="🔍 Buscar presupuesto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ margin: 0 }}
            />
          </div>
        </div>

        {/* Render list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {isLoading ? (
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
                <div className="skeleton" style={{ height: '40px', width: '200px', borderRadius: '4px' }}></div>
                <div className="skeleton" style={{ height: '80px', width: '100%', borderRadius: '8px' }}></div>
                <div className="skeleton" style={{ height: '80px', width: '100%', borderRadius: '8px' }}></div>
              </div>
            </Card>
          ) : (
            <>
              {recientes.length > 0 && (
                <div>
                  <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.2rem',
                    color: 'var(--color-primary)',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>⚡</span> Recientes
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {recientes.map(b => (
                      <BudgetRow key={b.id} budget={b} onOpenMenu={handleOpenMenu} onOpen={handleOpenBudgetEditor} getCD={getBudgetCD} />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.2rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>📁</span> Antiguos
                </h3>
                {antiguos.length === 0 && recientes.length === 0 ? (
                  <div style={{
                    padding: '48px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    border: '1px dashed var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0,0,0,0.1)'
                  }}>
                    No se encontraron presupuestos en esta categoría.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {antiguos.map(b => (
                      <BudgetRow key={b.id} budget={b} onOpenMenu={handleOpenMenu} onOpen={handleOpenBudgetEditor} getCD={getBudgetCD} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {menuOpenId && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: `${menuPosition.y - 120}px`,
            left: `${menuPosition.x - 30}px`,
            zIndex: 9999,
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg), 0 0 20px rgba(0, 240, 255, 0.05)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 0',
            width: '180px',
            animation: 'fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <button
            onClick={() => {
              const b = budgets.find(x => x.id === menuOpenId);
              if (b) handleOpenBudgetEditor(b);
              handleOpenMenu({} as any, ''); // close menu
            }}
            style={menuItemStyle}
          >
            📂 Abrir presupuesto
          </button>
          <button
            onClick={() => {
              const b = budgets.find(x => x.id === menuOpenId);
              if (b) startEditBudget(b);
            }}
            style={menuItemStyle}
          >
            📝 Datos generales
          </button>
          <button
            onClick={() => handleDuplicateBudget(menuOpenId)}
            style={menuItemStyle}
          >
            📋 Duplicar
          </button>
          <button
            onClick={() => { alert(`Presupuesto enviado con éxito.`); handleOpenMenu({} as any, ''); }}
            style={menuItemStyle}
          >
            ✉️ Enviar presupuesto
          </button>
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
          <button
            onClick={() => handleDeleteBudget(menuOpenId)}
            style={{ ...menuItemStyle, color: 'var(--color-danger)' }}
          >
            🗑️ Eliminar
          </button>
        </div>
      )}
    </div>
  );
};

// Row item component for budget list view
const BudgetRow: React.FC<{
  budget: Budget;
  onOpenMenu: (e: React.MouseEvent, id: string) => void;
  onOpen: (b: Budget) => void;
  getCD: (b: Budget) => number;
}> = ({ budget, onOpenMenu, onOpen, getCD }) => {
  const cd = getCD(budget);
  return (
    <div
      onClick={() => onOpen(budget)}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 24px',
        background: 'rgba(255, 255, 255, 0.01)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}
      className="budget-list-row"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '85%' }}>
        <h4 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.05rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: '1.4'
        }}>
          {budget.nombre}
        </h4>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            👤 Cliente: <strong style={{ color: 'var(--text-primary)' }}>{budget.cliente}</strong>
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            📅 Fecha base: <strong style={{ color: 'var(--text-primary)' }}>{budget.fechaBase}</strong>
          </span>
          <span style={{
            fontSize: '0.75rem',
            background: 'rgba(139, 92, 246, 0.1)',
            color: 'var(--color-secondary)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: 600,
            textTransform: 'uppercase'
          }}>
            {budget.grupo}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Costo Directo</div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            fontWeight: 800,
            color: 'var(--color-primary)'
          }}>
            S/ {cd.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenMenu(e, budget.id);
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            transition: 'all 0.2s'
          }}
          className="three-dots-btn"
          title="Acciones"
        >
          ⋮
        </button>
      </div>
    </div>
  );
};
