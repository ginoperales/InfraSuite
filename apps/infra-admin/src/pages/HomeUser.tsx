import React, { useEffect, useState } from 'react';
import { useAuth } from '@infrasuite/auth';
import { getSQLiteDatabase } from '@infrasuite/sqlite';
import { db } from '@infrasuite/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { isElectron, syncToCloud } from '../lib/databaseAdapter';
import { SyncButton } from '../components/SyncButton';

interface HomeUserProps {
  onNavigate: (tab: string, budgetId?: string) => void;
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
const SearchAiIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    <path d="M12 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" fill="#10b981" stroke="none" />
  </svg>
);

const SunIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

const MoonIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

const SettingsGearIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'var(--text-secondary)' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const PaperclipIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
  </svg>
);

const TemplateListIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="3" y1="9" x2="21" y2="9"></line>
    <line x1="9" y1="21" x2="9" y2="9"></line>
  </svg>
);

const ArrowRightIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

const HomeChipIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const DocumentChipIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const CalculatorChipIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2"></rect>
    <line x1="8" y1="6" x2="16" y2="6"></line>
    <line x1="16" y1="14" x2="16" y2="18"></line>
    <path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01"></path>
  </svg>
);

const CalendarChipIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

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
  const [isAiCreationViewOpen, setIsAiCreationViewOpen] = useState(false);
  const [aiPromptText, setAiPromptText] = useState('');

  const [files, setFiles] = useState<any[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    fileId: string;
  }>({ visible: false, x: 0, y: 0, fileId: '' });

  const [isSyncing, setIsSyncing] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (isElectron() && (window as any).electron?.updater) {
      (window as any).electron.updater.onUpdateAvailable(() => {
        setUpdateAvailable(true);
      });
    }
  }, []);

  const handleSync = async () => {
    if (!isElectron()) return;
    setIsSyncing(true);
    try {
      await syncToCloud();
      alert('¡Sincronización completada con éxito!');
    } catch (e) {
      alert('Error en la sincronización. Revisa tu conexión.');
    } finally {
      setIsSyncing(false);
    }
  };

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
      onNavigate(file.tabNavigate, file.id);
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
      {/* ── UPDATE BANNER ── */}
      {updateAvailable && (
        <div style={{ background: '#2563eb', color: 'white', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
          ¡Nueva actualización disponible! Descargando en segundo plano...
        </div>
      )}

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
        {/* Left: Spacer */}
        <div style={{ width: '80px', display: 'none', '@media (min-width: 768px)': { display: 'block' } } as any} />

        {/* Center: Search & AI Creation Pill */}
        <div
          onClick={() => setIsAiCreationViewOpen(true)}
          style={{
            flexGrow: 1,
            maxWidth: '580px',
            margin: '0 auto',
            position: 'relative',
            cursor: 'pointer'
          }}
        >
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
            <SearchAiIcon size={18} color="var(--text-muted)" />
          </span>
          <input
            type="text"
            readOnly
            placeholder="Creación o Búsqueda"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            onClick={() => setIsAiCreationViewOpen(true)}
            style={{
              width: '100%',
              padding: '9px 16px 9px 42px',
              borderRadius: '24px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-main)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              outline: 'none',
              cursor: 'pointer',
              transition: 'all 0.25s',
              fontWeight: 500
            }}
          />
        </div>

        {/* Right: Sync, Theme & Settings Switchers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
          <SyncButton />

          <button
            type="button"
            onClick={onToggleTheme}
            style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              padding: '8px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {theme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('profile-settings')}
            style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              padding: '8px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            title="Configuración"
          >
            <SettingsGearIcon size={20} />
          </button>
        </div>
      </div>

      {/* ── FULL SCREEN AI CREATION / SEARCH VIEW ── */}
      <AnimatePresence>
        {isAiCreationViewOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: theme === 'light' ? '#fcfcfd' : 'var(--bg-main, #0b0f19)',
              color: 'var(--text-primary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              overflowY: 'auto'
            }}
          >
            {/* Top Controls */}
            <div style={{ position: 'absolute', top: '24px', left: '24px', right: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => setIsAiCreationViewOpen(false)}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '8px 18px',
                  borderRadius: '20px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s'
                }}
              >
                ← Volver al inicio
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    padding: '8px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                >
                  {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAiCreationViewOpen(false);
                    onNavigate('profile-settings');
                  }}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    padding: '8px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Configuración"
                >
                  <SettingsGearIcon size={18} />
                </button>
              </div>
            </div>

            {/* Main AI Prompt Container */}
            <div style={{ maxWidth: '820px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '28px', marginTop: '30px' }}>
              
              {/* Title & Subtitle */}
              <div>
                <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
                  ¿Qué presupuesto deseas crear?
                </h1>
                <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', margin: 0, fontWeight: 400 }}>
                  Usa la IA para generar análisis de costos, metrados y partidas
                </p>
              </div>

              {/* Prompt Card Box */}
              <div
                style={{
                  width: '100%',
                  background: theme === 'light' ? '#ffffff' : 'var(--bg-surface)',
                  border: '1.5px solid rgba(22, 163, 74, 0.4)',
                  borderRadius: '24px',
                  padding: '24px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: theme === 'light' ? '0 12px 35px rgba(22, 163, 74, 0.08)' : '0 12px 35px rgba(0,0,0,0.4)',
                  transition: 'all 0.3s'
                }}
              >
                <textarea
                  placeholder="Describe tu proyecto o consulta de presupuesto..."
                  value={aiPromptText}
                  onChange={(e) => setAiPromptText(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '1.05rem',
                    fontFamily: 'inherit',
                    resize: 'none',
                    lineHeight: 1.5
                  }}
                />

                {/* Bottom Toolbar inside Card */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                      type="button"
                      onClick={() => alert('Selecciona un archivo PDF, Excel o memoria descriptiva para adjuntar.')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <PaperclipIcon size={18} /> Adjuntar
                    </button>
                    <span style={{ color: 'var(--border-color)' }}>|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAiCreationViewOpen(false);
                        onNavigate('applications');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <TemplateListIcon size={18} /> Plantillas
                    </button>
                  </div>

                  {/* Circular Green Action Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!aiPromptText.trim()) {
                        alert('Por favor ingresa una descripción de tu proyecto.');
                        return;
                      }
                      setIsAiCreationViewOpen(false);
                      onNavigate('budgets_lite');
                    }}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(22, 163, 74, 0.4)',
                      transition: 'transform 0.2s, boxShadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <ArrowRightIcon size={20} />
                  </button>
                </div>
              </div>

              {/* 4 Quick Action Chips */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', width: '100%' }}>
                <button
                  type="button"
                  onClick={() => {
                    setAiPromptText('Presupuesto de construcción de vivienda unifamiliar de 2 pisos con acabados de primera');
                  }}
                  style={{
                    background: theme === 'light' ? '#ffffff' : 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '20px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#16a34a';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <HomeChipIcon size={20} /> Presupuesto de vivienda
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAiPromptText('Análisis de precios unitarios (APU) para partidas de estructuras de concreto y vaciado');
                  }}
                  style={{
                    background: theme === 'light' ? '#ffffff' : 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '20px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#16a34a';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <DocumentChipIcon size={20} /> Análisis de precios unitarios
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAiPromptText('Metrados de obra y movimiento de tierras con cálculo automático de volumen de excavación');
                  }}
                  style={{
                    background: theme === 'light' ? '#ffffff' : 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '20px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#16a34a';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <CalculatorChipIcon size={20} /> Metrados de obra
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAiPromptText('Cronograma de obra valorizado y flujo de caja mensual para proyecto de edificación');
                  }}
                  style={{
                    background: theme === 'light' ? '#ffffff' : 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '20px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#16a34a';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <CalendarChipIcon size={20} /> Cronograma y costos
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
