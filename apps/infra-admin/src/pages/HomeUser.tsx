import React, { useEffect, useState } from 'react';
import { useAuth } from '@infrasuite/auth';
import { getSQLiteDatabase } from '@infrasuite/sqlite';
import { db } from '@infrasuite/firebase';
import { motion, AnimatePresence } from 'framer-motion';

interface HomeUserProps {
  onNavigate: (tab: string) => void;
  installedModules: string[];
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

interface DashboardFile {
  id: string;
  name: string;
  type: 'infracost_lite' | 'infracost_pro' | 'infrageo' | 'infraplan';
  modified: string;
  owner: string;
  category: string;
  tabNavigate?: string;
  isRealBudget?: boolean;
}

// Fluent-style Custom Icons for InfraSuite Applications
const InfraCostLiteIcon: React.FC = () => (
  <div style={{ position: 'relative', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <div style={{ width: '22px', height: '22px', backgroundColor: '#107c41', borderRadius: '4px', position: 'absolute', left: '2px', top: '2px', opacity: 0.8 }} />
    <div style={{ width: '18px', height: '18px', backgroundColor: '#1f9a55', borderRadius: '3px', position: 'absolute', right: '2px', bottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
      <span style={{ color: '#fff', fontSize: '11px', fontWeight: 800, fontFamily: 'Segoe UI, sans-serif' }}>$</span>
    </div>
  </div>
);

const InfraCostProIcon: React.FC = () => (
  <div style={{ position: 'relative', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <div style={{ width: '22px', height: '22px', backgroundColor: '#6d28d9', borderRadius: '4px', position: 'absolute', left: '2px', top: '2px', opacity: 0.8 }} />
    <div style={{ width: '18px', height: '18px', backgroundColor: '#8b5cf6', borderRadius: '3px', position: 'absolute', right: '2px', bottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
      <span style={{ color: '#fff', fontSize: '10px', fontWeight: 800, fontFamily: 'Segoe UI, sans-serif' }}>P</span>
    </div>
  </div>
);

const InfraGeoIcon: React.FC = () => (
  <div style={{ position: 'relative', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <div style={{ width: '22px', height: '22px', backgroundColor: '#0f766e', borderRadius: '4px', position: 'absolute', left: '2px', top: '2px', opacity: 0.8 }} />
    <div style={{ width: '18px', height: '18px', backgroundColor: '#0d9488', borderRadius: '3px', position: 'absolute', right: '2px', bottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
      <span style={{ color: '#fff', fontSize: '10px', fontWeight: 800, fontFamily: 'Segoe UI, sans-serif' }}>G</span>
    </div>
  </div>
);

const InfraPlanIcon: React.FC = () => (
  <div style={{ position: 'relative', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <div style={{ width: '22px', height: '22px', backgroundColor: '#c2410c', borderRadius: '4px', position: 'absolute', left: '2px', top: '2px', opacity: 0.8 }} />
    <div style={{ width: '18px', height: '18px', backgroundColor: '#f97316', borderRadius: '3px', position: 'absolute', right: '2px', bottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
      <span style={{ color: '#fff', fontSize: '9px', fontWeight: 800, fontFamily: 'Segoe UI, sans-serif' }}>PL</span>
    </div>
  </div>
);

const FileIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'infracost_lite': return <InfraCostLiteIcon />;
    case 'infracost_pro': return <InfraCostProIcon />;
    case 'infrageo': return <InfraGeoIcon />;
    default: return <InfraPlanIcon />;
  }
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
};

export const HomeUser: React.FC<HomeUserProps> = ({ onNavigate, installedModules, theme, onToggleTheme }) => {
  const { user } = useAuth();
  const [globalSearch, setGlobalSearch] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'infracost_lite' | 'infracost_pro' | 'infrageo' | 'infraplan'>('all');
  const [showBanner, setShowBanner] = useState(true);
  const [recentBudgets, setRecentBudgets] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);

  useEffect(() => {
    try {
      const localDb = getSQLiteDatabase('InfraCost.db');
      localDb.createTable('budgets', ['nombre', 'monto']);
      const rows = localDb.query('budgets');
      setRecentBudgets(rows.slice(-5).reverse());
    } catch {
      setRecentBudgets([]);
    }
  }, []);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const plans = await db.getDocs('plans');
        setPromotions(plans.filter((p: any) => p.promo));
      } catch {
        const plans = db.getCollection('plans');
        setPromotions(plans.filter((p: any) => p.promo));
      }
    };
    fetchPromotions();
  }, []);

  const ownerName = user?.nombre || 'Gino Harold Perales Guerra';

  // Base mockup files mapped to InfraSuite apps
  const mockFiles: DashboardFile[] = [
    {
      id: 'f_1',
      name: 'PLAN ANUAL DE SEGURIDAD Y SALUD EN EL TRABAJO - CONSORCIO SEDE PUCALLPA',
      type: 'infraplan',
      modified: '22 may.',
      owner: ownerName,
      category: 'Plan de Obra'
    },
    {
      id: 'f_2',
      name: '0. RESUMEN DE PRESUP. SEDE GOREU I ETAPA',
      type: 'infracost_pro',
      modified: '22 may.',
      owner: ownerName,
      category: 'Presupuestos Pro',
      tabNavigate: 'budgets_pro'
    },
    {
      id: 'f_3',
      name: 'TALLER DE INDUCCION SEDE-wrom an',
      type: 'infraplan',
      modified: '22 may.',
      owner: ownerName,
      category: 'Plan de Obra'
    },
    {
      id: 'f_4',
      name: '2631805-GDU-MO1-ZZZ-M30-ES-001',
      type: 'infracost_lite',
      modified: '20 abr.',
      owner: ownerName,
      category: 'Presupuestos Lite',
      tabNavigate: 'budgets_lite'
    },
    {
      id: 'f_5',
      name: 'ESTRUCTURAS',
      type: 'infracost_pro',
      modified: '6 abr.',
      owner: ownerName,
      category: 'Presupuestos Pro',
      tabNavigate: 'budgets_pro'
    },
    {
      id: 'f_6',
      name: 'PROYECTO SANEAMIENTO CURIMANA',
      type: 'infrageo',
      modified: '25 mar.',
      owner: ownerName,
      category: 'Sondeos Geológicos'
    },
    {
      id: 'f_7',
      name: 'CT2',
      type: 'infracost_lite',
      modified: '10 mar.',
      owner: ownerName,
      category: 'Presupuestos Lite',
      tabNavigate: 'budgets_lite'
    },
    {
      id: 'f_8',
      name: 'SUSTENTO DE METRADO MOBILIARIO ok ok',
      type: 'infracost_lite',
      modified: '7 mar.',
      owner: ownerName,
      category: 'Presupuestos Lite',
      tabNavigate: 'budgets_lite'
    }
  ];

  // Map real Budgets to files dynamically
  const budgetFiles: DashboardFile[] = recentBudgets.map((b) => ({
    id: b.id || `real_${Math.random()}`,
    name: b.nombre || 'Presupuesto de Obra',
    type: 'infracost_lite',
    modified: 'ahora mismo',
    owner: ownerName,
    category: 'Presupuestos locales',
    tabNavigate: 'budgets_lite',
    isRealBudget: true
  }));

  // Combine both real budgets and mock files
  const allFiles = [...budgetFiles, ...mockFiles];

  // Filter logic
  const filteredFiles = allFiles.filter((file) => {
    const query = (globalSearch || tableSearch).toLowerCase();
    const matchesSearch = file.name.toLowerCase().includes(query) || file.owner.toLowerCase().includes(query);
    const matchesFilter = selectedFilter === 'all' || file.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-primary)',
        fontFamily: '"Segoe UI", var(--font-sans), sans-serif',
        overflowY: 'auto',
      }}
    >
      {/* ── TOP HEADER / TOOLBAR ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-surface)',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        {/* Left: Spacer to help balance search bar center layout (using width of right menu) */}
        <div style={{ width: '80px', display: 'none', '@media (min-width: 768px)': { display: 'block' } } as any} />

        {/* Center: Search Bar */}
        <div style={{ flexGrow: 1, maxWidth: '580px', margin: '0 auto', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.95rem' }}>🔍</span>
          <input
            type="text"
            placeholder="Búsqueda"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 16px 8px 38px',
              borderRadius: '24px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-main)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              outline: 'none',
              transition: 'all 0.25s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-primary)';
              e.target.style.boxShadow = '0 0 0 2px var(--color-primary-glow)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Right: Theme Switcher & Configuration */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            onClick={onToggleTheme}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '4px',
              transition: 'background 0.2s'
            }}
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Configuración"
            onClick={() => onNavigate('profile-settings')}
          >
            ⚙️
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: '1400px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* ── GREETING TITLE ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800 }}>
              {getGreeting()}, {user?.nombre?.split(' ')[0] || 'SELVAVIVACONSTRUCCIONES'} 👋
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              InfraSuite Control Center • Ecosistema de Construcción y Presupuestos
            </p>
          </div>
        </div>

        {/* ── PROMO BANNER ── */}
        <AnimatePresence>
          {showBanner && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                background: 'linear-gradient(90deg, #0f52ba 0%, #1e3a8a 100%)',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                position: 'relative',
                boxShadow: '0 4px 15px rgba(15, 82, 186, 0.15)',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.5rem' }}>🎁</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.4 }}>
                  {promotions.length > 0 ? (
                    <span>
                      <strong>Promociones del Superadministrador:</strong>{' '}
                      {promotions.map((p) => `${p.title} (${p.promo})`).join(' • ')}
                    </span>
                  ) : (
                    <span>Obtenga 100 GB gratis durante un mes. Comience ya la prueba para obtener más almacenamiento para todos sus archivos y fotos.</span>
                  )}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => alert('Prueba de plan iniciada exitosamente.')}
                  style={{
                    background: '#ffffff',
                    color: '#0f52ba',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '8px 18px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Iniciar prueba gratuita
                </button>
                <button
                  onClick={() => setShowBanner(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    fontSize: '1.15rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px'
                  }}
                  title="Cerrar"
                >
                  ×
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── COMENZAR SECTION (AVAILABLE APPLICATIONS) ── */}
        <div>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Comenzar
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {/* InfraCost Lite Card */}
            <div
              onClick={() => onNavigate('budgets_lite')}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                transition: 'all 0.2s'
              }}
              className="hover-card"
            >
              <InfraCostLiteIcon />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>InfraCost Lite</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Gestión de presupuestos rápida</div>
              </div>
            </div>

            {/* InfraCost Pro Card */}
            <div
              onClick={() => onNavigate('budgets_pro')}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                transition: 'all 0.2s'
              }}
              className="hover-card"
            >
              <InfraCostProIcon />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>InfraCost Pro</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Análisis completo y APUs</div>
              </div>
            </div>

            {/* InfraGeo Card */}
            <div
              onClick={() => onNavigate('applications')}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '16px',
                cursor: 'default',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                opacity: 0.75,
                transition: 'all 0.2s'
              }}
            >
              <InfraGeoIcon />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  InfraGeo <span style={{ fontSize: '0.62rem', background: '#0d9488', color: '#fff', padding: '1px 5px', borderRadius: '4px' }}>PRÓXIMO</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Análisis geotécnico de suelo</div>
              </div>
            </div>

            {/* InfraPlan Card */}
            <div
              onClick={() => onNavigate('applications')}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '16px',
                cursor: 'default',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                opacity: 0.75,
                transition: 'all 0.2s'
              }}
            >
              <InfraPlanIcon />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  InfraPlan <span style={{ fontSize: '0.62rem', background: '#f97316', color: '#fff', padding: '1px 5px', borderRadius: '4px' }}>PRÓXIMO</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Cronograma y recursos de obra</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FILES LIST TABLE ── */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          {/* Table Header Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '8px' }}>Reciente</span>
              <button
                onClick={() => setSelectedFilter('all')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  border: selectedFilter === 'all' ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                  background: selectedFilter === 'all' ? 'var(--color-primary-glow)' : 'transparent',
                  color: selectedFilter === 'all' ? 'var(--color-primary)' : 'var(--text-primary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                Todos
              </button>
              <button
                onClick={() => setSelectedFilter('infracost_lite')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  border: selectedFilter === 'infracost_lite' ? '1px solid #1f9a55' : '1px solid var(--border-color)',
                  background: selectedFilter === 'infracost_lite' ? 'rgba(31, 154, 85, 0.1)' : 'transparent',
                  color: selectedFilter === 'infracost_lite' ? '#66bb6a' : 'var(--text-primary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                InfraCost Lite
              </button>
              <button
                onClick={() => setSelectedFilter('infracost_pro')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  border: selectedFilter === 'infracost_pro' ? '1px solid #8b5cf6' : '1px solid var(--border-color)',
                  background: selectedFilter === 'infracost_pro' ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                  color: selectedFilter === 'infracost_pro' ? '#a78bfa' : 'var(--text-primary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                InfraCost Pro
              </button>
              <button
                onClick={() => setSelectedFilter('infrageo')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  border: selectedFilter === 'infrageo' ? '1px solid #0d9488' : '1px solid var(--border-color)',
                  background: selectedFilter === 'infrageo' ? 'rgba(13, 148, 136, 0.1)' : 'transparent',
                  color: selectedFilter === 'infrageo' ? '#2dd4bf' : 'var(--text-primary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                InfraGeo
              </button>
              <button
                onClick={() => setSelectedFilter('infraplan')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  border: selectedFilter === 'infraplan' ? '1px solid #f97316' : '1px solid var(--border-color)',
                  background: selectedFilter === 'infraplan' ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                  color: selectedFilter === 'infraplan' ? '#fb923c' : 'var(--text-primary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                InfraPlan
              </button>
            </div>

            {/* Table Search Input */}
            <div style={{ position: 'relative', width: '220px' }}>
              <input
                type="text"
                placeholder="Filtrar por nombre o persona"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Table Container */}
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.85rem',
                textAlign: 'left'
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Nombre</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Abierto</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Propietario</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No se encontraron archivos coincidentes.
                    </td>
                  </tr>
                ) : (
                  filteredFiles.map((file) => (
                    <tr
                      key={file.id}
                      onClick={() => file.tabNavigate && onNavigate(file.tabNavigate)}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        cursor: file.tabNavigate ? 'pointer' : 'default',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Name / File Info */}
                      <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileIcon type={file.type} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                          <span
                            style={{
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {file.name}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {file.category}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', verticalAlign: 'middle' }}>
                        {file.modified}
                      </td>

                      {/* Owner */}
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', verticalAlign: 'middle' }}>
                        {file.owner}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
