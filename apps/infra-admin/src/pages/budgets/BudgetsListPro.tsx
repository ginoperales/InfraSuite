import React from 'react';
import { Button } from '@infrasuite/shared';
import type { Budget } from './types';

interface BudgetsListProProps {
  budgets: Budget[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  portfolioSearchTerm: string;
  setPortfolioSearchTerm: (v: string) => void;
  selectedPortfolio: string;
  setSelectedPortfolio: (v: string) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  resetBudgetForm: () => void;
  setIsCreateOpen: (v: boolean) => void;
  handleOpenBudgetEditor: (b: Budget) => void;
  handleOpenMenu: (e: React.MouseEvent, id: string) => void;
  getBudgetCD: (b: Budget) => number;
  setViewState: (v: 'list' | 'editor') => void;
  menuOpenId: string | null;
  menuPosition: { x: number; y: number };
  menuRef: React.RefObject<HTMLDivElement | null>;
  startEditBudget: (b: Budget) => void;
  handleDuplicateBudget: (id: string) => void;
  handleDeleteBudget: (id: string) => void;
  theme: 'light' | 'dark';
  menuItemStyle: React.CSSProperties;
  onNavigate?: (tab: string) => void;
}

export const BudgetsListPro: React.FC<BudgetsListProProps> = ({
  budgets,
  searchTerm,
  setSearchTerm,
  portfolioSearchTerm,
  setPortfolioSearchTerm,
  selectedPortfolio,
  setSelectedPortfolio,
  isLoading,
  setIsLoading,
  resetBudgetForm,
  setIsCreateOpen,
  handleOpenBudgetEditor,
  handleOpenMenu,
  getBudgetCD,
  setViewState,
  menuOpenId,
  menuPosition,
  menuRef,
  startEditBudget,
  handleDuplicateBudget,
  handleDeleteBudget,
  theme,
  menuItemStyle,
  onNavigate
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-main)', overflow: 'hidden', width: '100%' }}>
      {/* Delphin Express Inspired Ribbon Menu */}
      <div style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        padding: '10px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        {/* Left: Navigation and user tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', border: '1px solid var(--border-color)', minWidth: '70px' }} onClick={() => setViewState('list')}>
            <span style={{ fontSize: '1.1rem' }}>↩️</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '2px' }}>Volver</span>
          </div>
          {/* Cerrar sesión removed */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', border: '1px solid var(--border-color)', minWidth: '70px' }} onClick={() => alert('Abriendo directorio de usuarios...')}>
            <span style={{ fontSize: '1.1rem' }}>👥</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '2px' }}>Usuarios</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', border: '1px solid var(--border-color)', minWidth: '70px' }} onClick={() => alert('Abriendo perfiles...')}>
            <span style={{ fontSize: '1.1rem' }}>👤</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '2px' }}>Perfiles</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', border: '1px solid var(--border-color)', minWidth: '70px' }} onClick={() => alert('Actualizando perfil de usuario...')}>
            <span style={{ fontSize: '1.1rem' }}>🔄</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '2px' }}>Actualizar Perfil</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', border: '1px solid var(--border-color)', minWidth: '70px' }} onClick={() => alert('Copia de seguridad en progreso...')}>
            <span style={{ fontSize: '1.1rem' }}>💾</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '2px' }}>Copia de seguridad</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', border: '1px solid var(--border-color)', minWidth: '70px' }} onClick={() => alert('Optimizando base de datos...')}>
            <span style={{ fontSize: '1.1rem' }}>⚙️</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '2px' }}>Optimizar base</span>
          </div>
          {/* InfraSuite Navigation Shortcuts */}
          {onNavigate && (
            <>
              <div style={{ width: '1px', height: '40px', background: 'var(--border-color)', margin: '0 4px' }} />
              <div
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', border: '1px solid var(--border-color)', minWidth: '70px' }}
                onClick={() => onNavigate('shared')}
              >
                <span style={{ fontSize: '1.1rem' }}>📁</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '2px' }}>Compartido</span>
              </div>
              <div
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', border: '1px solid var(--border-color)', minWidth: '70px' }}
                onClick={() => onNavigate('contacts')}
              >
                <span style={{ fontSize: '1.1rem' }}>👥</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '2px' }}>Contactos</span>
              </div>
              <div
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', border: '1px solid var(--border-color)', minWidth: '70px' }}
                onClick={() => onNavigate('trash')}
              >
                <span style={{ fontSize: '1.1rem' }}>🗑️</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '2px' }}>Papelera</span>
              </div>
            </>
          )}
        </div>
        {/* Right: Brand logo/Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary)', letterSpacing: '-0.5px' }}>InfraCost</span>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>Pro 2026</div>
          </div>
          <div style={{ fontSize: '1.8rem', animation: 'pulse 2s infinite' }}>📊</div>
        </div>
      </div>

      {/* Actions sub-bar ribbon */}
      <div style={{
        background: 'var(--bg-surface-elevated)',
        padding: '8px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid var(--border-color)',
        flexShrink: 0
      }}>
        <button
          onClick={() => { resetBudgetForm(); setIsCreateOpen(true); }}
          style={{
            background: 'var(--color-primary-glow)',
            border: '1px solid rgba(15, 82, 186, 0.25)',
            color: 'var(--color-primary)',
            padding: '6px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          📄 + Nuevo Proyecto
        </button>
        <button
          onClick={() => { setIsLoading(true); setTimeout(() => setIsLoading(false), 500); }}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            padding: '6px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          🔄 Actualizar
        </button>
        <button
          onClick={() => alert('Administración de Licencias Activas para la suite')}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            padding: '6px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          🔑 Admin Licencia
        </button>
      </div>

      {/* 3-column Layout */}
      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* COLUMN 1: Tree navigation portfolio */}
        <div style={{
          width: '280px',
          borderRight: '1px solid var(--border-color)',
          background: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}>
          {/* Portfolio search */}
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <input
              type="text"
              placeholder="Filtrar árbol..."
              value={portfolioSearchTerm}
              onChange={(e) => setPortfolioSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '6px 10px',
                borderRadius: '4px',
                fontSize: '0.78rem',
                outline: 'none'
              }}
            />
          </div>
          {/* Tree menu */}
          <div style={{ flexGrow: 1, overflowY: 'auto', padding: '12px' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', padding: '0 8px 8px 8px', letterSpacing: '1px' }}>Portafolio de Proyectos</div>
            {[
              { name: 'Construcción', count: 2, icon: '🏢' },
              { name: 'Mejoramiento', count: 0, icon: '🔧' },
              { name: 'Ampliación', count: 0, icon: '➕' },
              { name: 'Instalaciones', count: 0, icon: '⚡' },
              { name: 'Carreteras', count: 0, icon: '🛣️' },
              { name: 'Saneamiento', count: 0, icon: '🚰' },
              { name: 'Minería', count: 0, icon: '⛏️' }
            ].filter(p => p.name.toLowerCase().includes(portfolioSearchTerm.toLowerCase())).map(p => (
              <div
                key={p.name}
                onClick={() => setSelectedPortfolio(p.name)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  background: selectedPortfolio === p.name ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                  color: selectedPortfolio === p.name ? '#00f0ff' : 'var(--text-secondary)',
                  marginBottom: '4px',
                  transition: 'all 0.15s'
                }}
                className="portfolio-tree-item"
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{p.icon}</span>
                  <span>{p.name}</span>
                </span>
                <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '10px', color: 'var(--text-muted)' }}>{p.count}</span>
              </div>
            ))}
          </div>

          {/* Bottom contractor logo replaced with InfraCost */}
          <div style={{
            padding: '16px',
            borderTop: '1px solid var(--border-color)',
            background: theme === 'dark' ? 'rgba(15, 23, 42, 0.4)' : 'rgba(0, 0, 0, 0.04)',
            textAlign: 'center'
          }}>
            <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)', letterSpacing: '0.5px' }}>InfraCost Suite</strong>
            <div style={{ fontSize: '0.58rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>VERSION PROFESIONAL</div>
          </div>
        </div>

        {/* COLUMN 2: Projects List with Search */}
        <div style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-main)'
        }}>
          {/* Search project bar */}
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
            <input
              type="text"
              placeholder="Buscar proyecto aquí..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flexGrow: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '8px 14px',
                borderRadius: '4px',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            <Button style={{ background: 'var(--grad-primary)', border: 'none' }}>Buscar</Button>
          </div>

          {/* Project Cards List */}
          <div style={{ flexGrow: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="skeleton" style={{ height: '70px', width: '100%' }}></div>
                <div className="skeleton" style={{ height: '70px', width: '100%' }}></div>
              </div>
            ) : (
              budgets.filter(b => {
                // Filter by search term
                const matchesSearch = b.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || b.cliente.toLowerCase().includes(searchTerm.toLowerCase());
                // Filter by portfolio tree selection
                const matchesPortfolio = b.grupo.toLowerCase().includes(selectedPortfolio.substring(0, 5).toLowerCase()) || selectedPortfolio === 'Construcción';
                return matchesSearch && matchesPortfolio;
              }).map(b => {
                const cd = getBudgetCD(b);
                return (
                  <div
                    key={b.id}
                    onClick={() => handleOpenBudgetEditor(b)}
                    style={{
                      padding: '16px 20px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                    className="budget-list-row"
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '70%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#eab308', fontSize: '1rem' }}>🔓</span>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{b.nombre}</strong>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Cliente: {b.cliente} · Costos al: {b.fechaBase}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Costo Directo</div>
                        <strong style={{ fontSize: '0.98rem', color: 'var(--color-primary)' }}>S/ {cd.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenMenu(e, b.id); }}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          padding: '4px 8px'
                        }}
                      >
                        ⋮
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 3: Opciones Metro Grid */}
        <div style={{
          width: '320px',
          borderLeft: '1px solid var(--border-color)',
          background: 'var(--bg-surface)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflowY: 'auto'
        }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Opciones</h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px'
          }}>
            {[
              { name: 'Costos Unitarios', color: '#7c3aed', icon: '💵' },
              { name: 'Grupos de Costos', color: '#f97316', icon: '📁' },
              { name: 'Unidades', color: '#475569', icon: 'u' },
              { name: 'Lista de Insumos', color: '#0ea5e9', icon: '📋' },
              { name: 'Diccionario', color: '#b45309', icon: '📖' },
              { name: 'Indices', color: '#15803d', icon: '📊' },
              { name: 'Proveedores', color: '#ca8a04', icon: '👤' },
              { name: 'Clientes', color: '#ca8a04', icon: '👥' },
              { name: 'Tipos de Obra', color: '#991b1b', icon: '🏠' },
              { name: 'Encabezados', color: '#6b21a8', icon: 'T..' },
              { name: 'Plantillas GsGs', color: '#be123c', icon: '📄' },
              { name: 'Parametros', color: '#334155', icon: '⚙️' }
            ].map(opt => (
              <div
                key={opt.name}
                onClick={() => alert(`Configuración de ${opt.name} abierta.`)}
                style={{
                  background: opt.color,
                  borderRadius: '6px',
                  padding: '16px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '95px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
              >
                <span style={{ fontSize: '1.2rem', color: '#ffffff' }}>{opt.icon}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#ffffff', lineHeight: '1.2' }}>{opt.name}</span>
              </div>
            ))}
          </div>
          
          {/* Version stamp vertical footer */}
          <div style={{ textAlign: 'right', marginTop: '20px', fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            InfraCost Pro beta 2026.1.0.10
          </div>
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
