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
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [isPromoLoaded, setIsPromoLoaded] = useState(false);

  const [files, setFiles] = useState<any[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    fileId: string;
  }>({ visible: false, x: 0, y: 0, fileId: '' });

  useEffect(() => {
    if (promotions.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % promotions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [promotions]);

  useEffect(() => {
    if (currentPromoIndex >= promotions.length) {
      setCurrentPromoIndex(0);
    }
  }, [promotions, currentPromoIndex]);

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
        setPromotions(plans.filter((p: any) => p.promo) || []);
      } catch {
        try {
          const plans = db.getCollection('plans');
          setPromotions(plans.filter((p: any) => p.promo) || []);
        } catch {
          setPromotions([]);
        }
      } finally {
        setIsPromoLoaded(true);
      }
    };
    fetchPromotions();
  }, []);

  const ownerName = user?.nombre || 'Gino Harold Perales Guerra';

  // Initialize files state based on recent budgets + templates + user-created mock files
  useEffect(() => {
    const budgetFiles = recentBudgets.map((b) => ({
      id: b.id || `real_${Math.random()}`,
      name: b.nombre || 'Presupuesto de Obra',
      type: 'infracost_lite',
      modified: 'ahora mismo',
      owner: ownerName,
      category: 'Presupuestos locales',
      tabNavigate: 'budgets_lite',
      isRealBudget: true,
      isTemplate: false
    }));

    const templates = [
      // 3 InfraCost Lite templates
      { id: 't_lite_1', name: 'Presupuesto Vivienda Unifamiliar - Plantilla Base', type: 'infracost_lite', modified: '20 may.', owner: ownerName, category: 'Presupuestos Lite', isTemplate: true, tabNavigate: 'budgets_lite' },
      { id: 't_lite_2', name: 'Presupuesto Remodelación Oficina Comercial - Plantilla', type: 'infracost_lite', modified: '15 may.', owner: ownerName, category: 'Presupuestos Lite', isTemplate: true, tabNavigate: 'budgets_lite' },
      { id: 't_lite_3', name: 'Presupuesto Construcción Cerco Perimétrico - Plantilla', type: 'infracost_lite', modified: '10 may.', owner: ownerName, category: 'Presupuestos Lite', isTemplate: true, tabNavigate: 'budgets_lite' },
      
      // 3 InfraCost Pro templates
      { id: 't_pro_1', name: 'Presupuesto Hospital de Complejidad II - Plantilla Pro', type: 'infracost_pro', modified: '18 may.', owner: ownerName, category: 'Presupuestos Pro', isTemplate: true, tabNavigate: 'budgets_pro' },
      { id: 't_pro_2', name: 'Presupuesto Edificio Residencial 15 Pisos - Plantilla Pro', type: 'infracost_pro', modified: '14 may.', owner: ownerName, category: 'Presupuestos Pro', isTemplate: true, tabNavigate: 'budgets_pro' },
      { id: 't_pro_3', name: 'Presupuesto Pavimentación Vial Urbana - Plantilla Pro', type: 'infracost_pro', modified: '12 may.', owner: ownerName, category: 'Presupuestos Pro', isTemplate: true, tabNavigate: 'budgets_pro' },
      
      // 3 InfraGeo templates
      { id: 't_geo_1', name: 'Perfil de Sondaje Geotécnico Estándar - Plantilla', type: 'infrageo', modified: '25 may.', owner: ownerName, category: 'Sondeos Geológicos', isTemplate: true },
      { id: 't_geo_2', name: 'Ensayo de Penetración Estándar (SPT) - Plantilla', type: 'infrageo', modified: '22 may.', owner: ownerName, category: 'Sondeos Geológicos', isTemplate: true },
      { id: 't_geo_3', name: 'Estudio de Suelos Cimentación - Plantilla', type: 'infrageo', modified: '19 may.', owner: ownerName, category: 'Sondeos Geológicos', isTemplate: true },
      
      // 3 InfraPlan templates
      { id: 't_plan_1', name: 'Plan Anual de Seguridad y Salud - Plantilla', type: 'infraplan', modified: '22 may.', owner: ownerName, category: 'Plan de Obra', isTemplate: true },
      { id: 't_plan_2', name: 'Cronograma de Obra Gantt - Plantilla', type: 'infraplan', modified: '20 may.', owner: ownerName, category: 'Plan de Obra', isTemplate: true },
      { id: 't_plan_3', name: 'Plan de Monitoreo Ambiental - Plantilla', type: 'infraplan', modified: '18 may.', owner: ownerName, category: 'Plan de Obra', isTemplate: true },
    ];

    const staticUserFiles = [
      // 3 InfraCost Lite user-created
      { id: 'u_lite_1', name: '2631805-GDU-MO1-ZZZ-M30-ES-001', type: 'infracost_lite', modified: '20 abr.', owner: ownerName, category: 'Presupuestos Lite', isTemplate: false, tabNavigate: 'budgets_lite' },
      { id: 'u_lite_2', name: 'Presupuesto Obras Civiles Lote 12', type: 'infracost_lite', modified: '18 abr.', owner: ownerName, category: 'Presupuestos Lite', isTemplate: false, tabNavigate: 'budgets_lite' },
      { id: 'u_lite_3', name: 'Metrado y Valorización Inicial Pucallpa', type: 'infracost_lite', modified: '12 abr.', owner: ownerName, category: 'Presupuestos Lite', isTemplate: false, tabNavigate: 'budgets_lite' },
      
      // 3 InfraCost Pro user-created
      { id: 'u_pro_1', name: '0. RESUMEN DE PRESUP. SEDE GOREU I ETAPA', type: 'infracost_pro', modified: '22 may.', owner: ownerName, category: 'Presupuestos Pro', isTemplate: false, tabNavigate: 'budgets_pro' },
      { id: 'u_pro_2', name: 'ESTRUCTURAS SEDE PUCALLPA', type: 'infracost_pro', modified: '6 abr.', owner: ownerName, category: 'Presupuestos Pro', isTemplate: false, tabNavigate: 'budgets_pro' },
      { id: 'u_pro_3', name: 'Presupuesto Instalaciones Sanitarias Final', type: 'infracost_pro', modified: '2 abr.', owner: ownerName, category: 'Presupuestos Pro', isTemplate: false, tabNavigate: 'budgets_pro' },
      
      // 3 InfraGeo user-created
      { id: 'u_geo_1', name: 'PROYECTO SANEAMIENTO CURIMANA', type: 'infrageo', modified: '25 mar.', owner: ownerName, category: 'Sondeos Geológicos', isTemplate: false },
      { id: 'u_geo_2', name: 'Sondaje y Perfiles Lote 2B - Yarinacocha', type: 'infrageo', modified: '22 mar.', owner: ownerName, category: 'Sondeos Geológicos', isTemplate: false },
      { id: 'u_geo_3', name: 'Registro de Ensayos Lab Sedes Delta', type: 'infrageo', modified: '15 mar.', owner: ownerName, category: 'Sondeos Geológicos', isTemplate: false },
      
      // 3 InfraPlan user-created
      { id: 'u_plan_1', name: 'Planificación Sede Goreu Etapa I', type: 'infraplan', modified: '22 may.', owner: ownerName, category: 'Plan de Obra', isTemplate: false },
      { id: 'u_plan_2', name: 'Cronograma de Adquisición de Insumos', type: 'infraplan', modified: '14 may.', owner: ownerName, category: 'Plan de Obra', isTemplate: false },
      { id: 'u_plan_3', name: 'Plan de Seguridad Consorcio Sur', type: 'infraplan', modified: '10 may.', owner: ownerName, category: 'Plan de Obra', isTemplate: false }
    ];

    setFiles([...budgetFiles, ...staticUserFiles, ...templates]);
  }, [recentBudgets, ownerName]);

  // Context Menu handlers
  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenu((prev) => prev.visible ? { ...prev, visible: false } : prev);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      fileId
    });
  };

  const handleOpenFile = (file: any) => {
    const isModuleInstalled = 
      (file.type === 'infracost_lite' && installedModules.includes('INFRACOST')) ||
      (file.type === 'infracost_pro' && installedModules.includes('INFRACOST_PRO')) ||
      (file.type === 'infrageo' && installedModules.includes('INFRAGEO')) ||
      (file.type === 'infraplan' && installedModules.includes('INFRAPLAN'));

    const isTemplate = file.isTemplate !== false && (!isModuleInstalled || file.isTemplate);

    if (isTemplate) {
      onNavigate('applications');
    } else if (file.tabNavigate) {
      onNavigate(file.tabNavigate);
    } else {
      alert(`Abriendo el archivo "${file.name}" de la aplicación ${file.type}...`);
    }
  };

  const handleDuplicateFile = (fileId: string) => {
    const target = files.find((f) => f.id === fileId);
    if (!target) return;
    const duplicated: any = {
      ...target,
      id: 'dup_' + Math.random().toString(36).substring(2, 9),
      name: `${target.name} - Copia`,
      modified: 'ahora mismo',
      isTemplate: false
    };
    setFiles((prev) => {
      const idx = prev.findIndex((f) => f.id === fileId);
      const copy = [...prev];
      copy.splice(idx + 1, 0, duplicated);
      return copy;
    });
  };

  const handleRemoveFile = (fileId: string) => {
    const target = files.find((f) => f.id === fileId);
    if (!target) return;
    if (confirm(`¿Estás seguro de que deseas eliminar "${target.name}"?`)) {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    }
  };

  // Filter logic
  const filteredFiles = files.filter((file) => {
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
        overflow: 'hidden',
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
          flexWrap: 'wrap',
          position: 'sticky',
          top: 0,
          zIndex: 100
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

      {/* Scrollable Content Container */}
      <div style={{ flexGrow: 1, overflowY: 'auto' }}>
        <div style={{ padding: '24px 32px', maxWidth: '1400px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* ── GREETING TITLE ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          {showBanner && isPromoLoaded && promotions.length > 0 && (
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
                <span style={{ fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.4, display: 'inline-flex', alignItems: 'center' }}>
                  {promotions.length > 0 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <strong>Promoción:</strong>&nbsp;
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={currentPromoIndex}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.3 }}
                          style={{ display: 'inline-block' }}
                        >
                          {promotions[currentPromoIndex]?.title} ({promotions[currentPromoIndex]?.promo})
                        </motion.span>
                      </AnimatePresence>
                    </span>
                  ) : (
                    <span>No hay promociones activas en este momento. Revisa más tarde para ofertas especiales de suscripción.</span>
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
              onClick={() => {
                if (installedModules.includes('INFRACOST')) {
                  onNavigate('budgets_lite');
                } else {
                  onNavigate('applications');
                }
              }}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                transition: 'all 0.2s',
                opacity: installedModules.includes('INFRACOST') ? 1 : 0.85
              }}
              className="hover-card"
            >
              <InfraCostLiteIcon />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  InfraCost Lite
                  {!installedModules.includes('INFRACOST') && (
                    <span style={{ fontSize: '0.62rem', background: 'var(--color-secondary)', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>INSTALAR</span>
                  )}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Gestión de presupuestos rápida</div>
              </div>
            </div>

            {/* InfraCost Pro Card */}
            <div
              onClick={() => {
                if (installedModules.includes('INFRACOST_PRO')) {
                  onNavigate('budgets_pro');
                } else {
                  onNavigate('applications');
                }
              }}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                transition: 'all 0.2s',
                opacity: installedModules.includes('INFRACOST_PRO') ? 1 : 0.85
              }}
              className="hover-card"
            >
              <InfraCostProIcon />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  InfraCost Pro
                  {!installedModules.includes('INFRACOST_PRO') && (
                    <span style={{ fontSize: '0.62rem', background: 'var(--color-secondary)', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>INSTALAR</span>
                  )}
                </div>
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
                  filteredFiles.map((file: any) => {
                    const isModuleInstalled = 
                      (file.type === 'infracost_lite' && installedModules.includes('INFRACOST')) ||
                      (file.type === 'infracost_pro' && installedModules.includes('INFRACOST_PRO')) ||
                      (file.type === 'infrageo' && installedModules.includes('INFRAENG')) || // mock geo check
                      (file.type === 'infraplan' && installedModules.includes('INFRAPLAN'));

                    const isTemplate = file.isTemplate !== false && (!isModuleInstalled || file.isTemplate);

                    return (
                      <tr
                        key={file.id}
                        onClick={() => handleOpenFile(file)}
                        onContextMenu={(e) => handleContextMenu(e, file.id)}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s',
                          opacity: file.isTemplate ? 0.8 : 1
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
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                            >
                              {file.name}
                              {file.isTemplate && (
                                <span style={{ fontSize: '0.62rem', background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '1px 5px', borderRadius: '4px', fontWeight: 600, whiteSpace: 'nowrap' }}>PLANTILLA</span>
                              )}
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>

      {/* ── CUSTOM CONTEXT MENU ── */}
      {contextMenu.visible && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: theme === 'light' ? '#ffffff' : 'var(--bg-surface-elevated, #171923)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            zIndex: 9999,
            padding: '6px',
            minWidth: '160px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            backdropFilter: 'blur(12px)',
            animation: 'fadeIn 0.1s ease-out'
          }}
        >
          <button
            onClick={() => {
              const file = files.find(f => f.id === contextMenu.fileId);
              if (file) handleOpenFile(file);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              padding: '8px 12px',
              textAlign: 'left',
              fontSize: '0.85rem',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ fontSize: '1rem' }}>📂</span> Abrir
          </button>
          <button
            onClick={() => handleDuplicateFile(contextMenu.fileId)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              padding: '8px 12px',
              textAlign: 'left',
              fontSize: '0.85rem',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ fontSize: '1rem' }}>👯</span> Duplicar
          </button>
          <button
            onClick={() => handleRemoveFile(contextMenu.fileId)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              padding: '8px 12px',
              textAlign: 'left',
              fontSize: '0.85rem',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ fontSize: '1rem' }}>🗑️</span> Eliminar
          </button>
        </div>
      )}
    </div>
  );
};
