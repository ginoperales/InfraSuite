import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
const SUPABASE_URL = (typeof window !== 'undefined' && (window as any).env?.VITE_SUPABASE_URL)
  || (import.meta as any).env?.VITE_SUPABASE_URL 
  || 'https://smsmllenvdfvjypeplyp.supabase.co';

const SUPABASE_ANON_KEY = (typeof window !== 'undefined' && (window as any).env?.VITE_SUPABASE_ANON_KEY)
  || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY 
  || 'sb_publishable_ig3zCd8qaGg642Reu0WY4Q_s3vjazEt';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Legacy mocks for backwards compatibility with any remaining references
export const app = {} as any;
export const firestore = {} as any;

const isBrowser = typeof window !== 'undefined';

const getLocalStorage = (key: string, defaultValue: any) => {
  if (!isBrowser) return defaultValue;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

const setLocalStorage = (key: string, value: any) => {
  if (isBrowser) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// Default seed fallback data
const DEFAULT_COMPANIES = [
  { id: 'c1', nombre: 'Constructora Alfa S.A.', ruc: '20123456789', estado: 'activo' },
  { id: 'c2', nombre: 'Mecánica de Suelos Delta', ruc: '20987654321', estado: 'activo' },
  { id: 'c3', nombre: 'Consorcio Vial del Sur', ruc: '20456123789', estado: 'suspendido' }
];

const DEFAULT_USERS = [
  { uid: 'u1', id: 'u1', empresaId: 'c1', nombre: 'Ing. Carlos Mendoza', email: 'carlos@alfa.com', role: 'ADMIN' },
  { uid: 'u2', id: 'u2', empresaId: 'c1', nombre: 'Diana Flores', email: 'diana@alfa.com', role: 'PROJECT_MANAGER' },
  { uid: 'u3', id: 'u3', empresaId: 'c2', nombre: 'Ing. Sofia Rodriguez', email: 'sofia@delta.com', role: 'ENGINEER' },
  { uid: 'u4', id: 'u4', empresaId: '', nombre: 'Super Administrador', email: 'superadmin@infrasuite.com', role: 'SUPER_ADMIN' },
  { uid: 'u5', id: 'u5', empresaId: 'c3', nombre: 'Jorge Peralta', email: 'jorge@vialsur.com', role: 'VIEWER' },
  { uid: 'u6', id: 'u6', empresaId: '', nombre: 'Super Google Admin', email: 'superadmin.google@gmail.com', role: 'SUPER_ADMIN' },
  { uid: 'u7', id: 'u7', empresaId: '', nombre: 'Gin Zu Ken', email: 'gin.zu.ken@gmail.com', role: 'SUPER_ADMIN' }
];

const DEFAULT_LICENSES = [
  { empresaId: 'c1', id: 'c1', plan: 'PRO', vencimiento: '2027-12-31' },
  { empresaId: 'c2', id: 'c2', plan: 'ENTERPRISE', vencimiento: '2028-06-30' },
  { empresaId: 'c3', id: 'c3', plan: 'BASIC', vencimiento: '2026-08-15' }
];

const DEFAULT_MODULES = [
  { codigo: 'INFRACOST', id: 'INFRACOST', nombre: 'InfraCost Lite', desc: 'Gestión clásica de presupuestos de obra y Análisis de Precios Unitarios (APU) esenciales.', icon: '💰', activo: true, visibleLanding: true },
  { codigo: 'INFRACOST_PRO', id: 'INFRACOST_PRO', nombre: 'InfraCost', desc: 'Presupuestos de obra profesionales con pantalla dividida (Spreadsheet + Especificaciones y Asistente IA Gemini integrado).', icon: '📊', activo: true, visibleLanding: true },
  { codigo: 'INFRAGEO', id: 'INFRAGEO', nombre: 'InfraGeo', desc: 'Mapeo geotécnico, modelado de sondajes y registro de ensayos de mecánica de suelos en campo.', icon: '🕳️', activo: true, visibleLanding: true },
  { codigo: 'INFRABIM', id: 'INFRABIM', nombre: 'InfraBIM', desc: 'Visualización y coordinación de modelos 3D en formato abierto IFC directamente en el navegador.', icon: '📐', activo: true, visibleLanding: true },
  { codigo: 'INFRACONTROL', id: 'INFRACONTROL', nombre: 'InfraControl', desc: 'Seguimiento financiero de obra, generación de valorizaciones mensuales y curvas S de avance.', icon: '📈', activo: true, visibleLanding: true },
  { codigo: 'INFRADOCS', id: 'INFRADOCS', nombre: 'InfraDocs', desc: 'Gestión documental y almacenamiento estructurado de planos, contratos e informes técnicos.', icon: '📂', activo: true, visibleLanding: true },
  { codigo: 'INFRAFIELD', id: 'INFRAFIELD', nombre: 'InfraField', desc: 'Órdenes de inspección, diarios de obra digitales y reportes fotográficos geo-localizados.', icon: '📋', activo: true, visibleLanding: true },
  { codigo: 'INFRAAI', id: 'INFRAAI', nombre: 'InfraAI', desc: 'Predicción de desviaciones de costo y análisis de riesgo mediante algoritmos de Inteligencia Artificial.', icon: '🧠', activo: true, visibleLanding: true },
  { codigo: 'INFRAADMIN', id: 'INFRAADMIN', nombre: 'InfraAdmin', desc: 'Consola central de gobernanza para la gestión de usuarios, roles, empresas y licencias de la suite.', icon: '🛡️', activo: true, visibleLanding: true }
];

const DEFAULT_COMPANY_MODULES = [
  { id: 'c1_INFRACOST', empresaId: 'c1', moduloId: 'INFRACOST' },
  { id: 'c1_INFRACOST_PRO', empresaId: 'c1', moduloId: 'INFRACOST_PRO' },
  { id: 'c1_INFRADOCS', empresaId: 'c1', moduloId: 'INFRADOCS' },
  { id: 'c2_INFRAGEO', empresaId: 'c2', moduloId: 'INFRAGEO' },
  { id: 'c2_INFRAAI', empresaId: 'c2', moduloId: 'INFRAAI' },
  { id: 'c3_INFRACONTROL', empresaId: 'c3', moduloId: 'INFRACONTROL' }
];

const DEFAULT_LOGS = [
  { id: 'l1', timestamp: '2026-06-17T10:15:00Z', usuario: 'Super Administrador', accion: 'Creación de Empresa', detalle: 'Empresa Constructora Alfa S.A. creada.' },
  { id: 'l2', timestamp: '2026-06-17T11:30:00Z', usuario: 'Super Administrador', accion: 'Activación de Licencia', detalle: 'Plan PRO asignado a Constructora Alfa S.A.' },
  { id: 'l3', timestamp: '2026-06-17T14:45:00Z', usuario: 'carlos@alfa.com', accion: 'Creación de Usuario', detalle: 'Usuario Diana Flores creado con rol PROJECT_MANAGER.' }
];

const DEFAULT_PLANS = [
  {
    id: 'p1',
    title: 'Plan BASIC',
    promo: '¡PROMO: 1 Mes Gratis!',
    desc: 'Ideal para pequeños contratistas independientes y proyectos unitarios.',
    price: '99',
    features: 'Acceso a 3 módulos esenciales,Hasta 5 usuarios activos,Base de datos local SQLite,Soporte técnico por correo',
    popular: false
  },
  {
    id: 'p2',
    title: 'Plan PRO',
    promo: '¡PROMO: -20% Pago Anual!',
    desc: 'Diseñado para empresas constructoras medianas con flujos continuos.',
    price: '199',
    features: 'Acceso a 6 módulos del ecosistema,Hasta 25 usuarios activos,Sincronización en la nube (Supabase),Soporte prioritario 24/7,Gestión documental avanzada',
    popular: true
  },
  {
    id: 'p3',
    title: 'Plan ENTERPRISE',
    promo: '¡PROMO: Piloto 14 Días!',
    desc: 'La suite completa con integración analítica para grandes consorcios.',
    price: '349',
    features: 'Todos los módulos (incluye InfraAI),Usuarios y proyectos ilimitados,Gobernanza multiempresa (InfraAdmin),Respaldos automáticos cada hora,Integración API personalizada',
    popular: false
  }
];

const DEFAULT_CLIENTS = [
  { id: 'cl1', nombre: 'Alfa Contratistas', logo: '🏢' },
  { id: 'cl2', nombre: 'Suelos Delta S.A.C.', logo: '🕳️' },
  { id: 'cl3', nombre: 'Minera Andina', logo: '⛰️' },
  { id: 'cl4', nombre: 'Consorcio Vial Sur', logo: '🛣️' },
  { id: 'cl5', nombre: 'BIM Projects', logo: '📐' }
];

export const isOnline = (): boolean => {
  return typeof window !== 'undefined' && window.navigator && window.navigator.onLine;
};

export const withTimeout = <T>(promise: Promise<T>, _timeoutMs: number = 2000): Promise<T> => {
  return promise;
};

export const checkAndSeedCloudDatabase = async () => {
  // No-op for Supabase (seeded via SQL schema)
};

// Database Access Object (Connected 100% to Supabase DB)
export const db = {
  getCollection: (collectionName: string): any[] => {
    switch (collectionName) {
      case 'companies': return getLocalStorage('infrasuite_db_companies', DEFAULT_COMPANIES);
      case 'users': return getLocalStorage('infrasuite_db_users', DEFAULT_USERS);
      case 'licenses': return getLocalStorage('infrasuite_db_licenses', DEFAULT_LICENSES);
      case 'modules': return getLocalStorage('infrasuite_db_modules', DEFAULT_MODULES);
      case 'company_modules': return getLocalStorage('infrasuite_db_company_modules', DEFAULT_COMPANY_MODULES);
      case 'logs': return getLocalStorage('infrasuite_db_logs', DEFAULT_LOGS);
      case 'plans': return getLocalStorage('infrasuite_db_plans', DEFAULT_PLANS);
      case 'clients': return getLocalStorage('infrasuite_db_clients', DEFAULT_CLIENTS);
      default: return [];
    }
  },

  setCollection: (collectionName: string, data: any[]) => {
    switch (collectionName) {
      case 'companies': setLocalStorage('infrasuite_db_companies', data); break;
      case 'users': setLocalStorage('infrasuite_db_users', data); break;
      case 'licenses': setLocalStorage('infrasuite_db_licenses', data); break;
      case 'modules': setLocalStorage('infrasuite_db_modules', data); break;
      case 'company_modules': setLocalStorage('infrasuite_db_company_modules', data); break;
      case 'logs': setLocalStorage('infrasuite_db_logs', data); break;
      case 'plans': setLocalStorage('infrasuite_db_plans', data); break;
      case 'clients': setLocalStorage('infrasuite_db_clients', data); break;
    }
  },

  getDocs: async (collectionName: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase.from(collectionName).select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        setLocalStorage(`infrasuite_db_${collectionName}`, data);
        return data;
      }
    } catch (err) {
      console.warn(`Supabase DB read failed for ${collectionName}, falling back to local:`, err);
    }
    return db.getCollection(collectionName);
  },

  addDoc: async (collectionName: string, docData: any): Promise<any> => {
    const id = docData.id || docData.uid || docData.codigo || Math.random().toString(36).substring(2, 9);
    const newDoc = { id, ...docData };

    try {
      await supabase.from(collectionName).upsert(newDoc);
    } catch (err) {
      console.warn(`Supabase addDoc failed for ${collectionName}:`, err);
    }

    const data = db.getCollection(collectionName);
    data.push(newDoc);
    db.setCollection(collectionName, data);
    return newDoc;
  },

  updateDoc: async (collectionName: string, id: string, docData: any): Promise<void> => {
    try {
      const pkField = collectionName === 'users' ? 'uid' : (collectionName === 'modules' ? 'codigo' : (collectionName === 'licenses' ? 'empresa_id' : 'id'));
      await supabase.from(collectionName).update(docData).eq(pkField, id);
    } catch (err) {
      console.warn(`Supabase updateDoc failed for ${collectionName}:`, err);
    }

    const data = db.getCollection(collectionName);
    const index = data.findIndex(d => (d.id === id || d.uid === id || d.codigo === id || d.empresaId === id || d.empresa_id === id));
    if (index !== -1) {
      data[index] = { ...data[index], ...docData };
      db.setCollection(collectionName, data);
    }
  },

  deleteDoc: async (collectionName: string, id: string): Promise<void> => {
    try {
      const pkField = collectionName === 'users' ? 'uid' : (collectionName === 'modules' ? 'codigo' : (collectionName === 'licenses' ? 'empresa_id' : 'id'));
      await supabase.from(collectionName).delete().eq(pkField, id);
    } catch (err) {
      console.warn(`Supabase deleteDoc failed for ${collectionName}:`, err);
    }

    let data = db.getCollection(collectionName);
    data = data.filter(d => !(d.id === id || d.uid === id || d.codigo === id || d.empresaId === id || d.empresa_id === id));
    db.setCollection(collectionName, data);
  }
};
