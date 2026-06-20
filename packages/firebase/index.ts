import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection as firebaseCollection, 
  getDocs as firebaseGetDocs, 
  setDoc as firebaseSetDoc, 
  doc as firebaseDoc, 
  getDoc as firebaseGetDoc, 
  deleteDoc as firebaseDeleteDoc 
} from 'firebase/firestore';

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

// Seed Data definition
const DEFAULT_COMPANIES = [
  { id: 'c1', nombre: 'Constructora Alfa S.A.', ruc: '20123456789', estado: 'activo' },
  { id: 'c2', nombre: 'Mecánica de Suelos Delta', ruc: '20987654321', estado: 'activo' },
  { id: 'c3', nombre: 'Consorcio Vial del Sur', ruc: '20456123789', estado: 'suspendido' }
];

const DEFAULT_USERS = [
  { uid: 'u1', empresaId: 'c1', nombre: 'Ing. Carlos Mendoza', email: 'carlos@alfa.com', role: 'ADMIN' },
  { uid: 'u2', empresaId: 'c1', nombre: 'Diana Flores', email: 'diana@alfa.com', role: 'PROJECT_MANAGER' },
  { uid: 'u3', empresaId: 'c2', nombre: 'Ing. Sofia Rodriguez', email: 'sofia@delta.com', role: 'ENGINEER' },
  { uid: 'u4', empresaId: '', nombre: 'Super Administrador', email: 'superadmin@infrasuite.com', role: 'SUPER_ADMIN' },
  { uid: 'u5', empresaId: 'c3', nombre: 'Jorge Peralta', email: 'jorge@vialsur.com', role: 'VIEWER' },
  { uid: 'u6', empresaId: '', nombre: 'Super Google Admin', email: 'superadmin.google@gmail.com', role: 'SUPER_ADMIN' },
  { uid: 'u7', empresaId: '', nombre: 'Gin Zu Ken', email: 'gin.zu.ken@gmail.com', role: 'SUPER_ADMIN' }
];

const DEFAULT_LICENSES = [
  { empresaId: 'c1', plan: 'PRO', vencimiento: '2027-12-31' },
  { empresaId: 'c2', plan: 'ENTERPRISE', vencimiento: '2028-06-30' },
  { empresaId: 'c3', plan: 'BASIC', vencimiento: '2026-08-15' }
];

const DEFAULT_MODULES = [
  { codigo: 'INFRACOST', nombre: 'InfraCost Lite', desc: 'Gestión clásica de presupuestos de obra y Análisis de Precios Unitarios (APU) esenciales.', icon: '💰', activo: true, visibleLanding: true },
  { codigo: 'INFRACOST_PRO', nombre: 'InfraCost', desc: 'Presupuestos de obra profesionales con pantalla dividida (Spreadsheet + Especificaciones y Asistente IA Gemini integrado).', icon: '📊', activo: true, visibleLanding: true },
  { codigo: 'INFRAGEO', nombre: 'InfraGeo', desc: 'Mapeo geotécnico, modelado de sondajes y registro de ensayos de mecánica de suelos en campo.', icon: '🕳️', activo: true, visibleLanding: true },
  { codigo: 'INFRABIM', nombre: 'InfraBIM', desc: 'Visualización y coordinación de modelos 3D en formato abierto IFC directamente en el navegador.', icon: '📐', activo: true, visibleLanding: true },
  { codigo: 'INFRACONTROL', nombre: 'InfraControl', desc: 'Seguimiento financiero de obra, generación de valorizaciones mensuales y curvas S de avance.', icon: '📈', activo: true, visibleLanding: true },
  { codigo: 'INFRADOCS', nombre: 'InfraDocs', desc: 'Gestión documental y almacenamiento estructurado de planos, contratos e informes técnicos.', icon: '📂', activo: true, visibleLanding: true },
  { codigo: 'INFRAFIELD', nombre: 'InfraField', desc: 'Órdenes de inspección, diarios de obra digitales y reportes fotográficos geo-localizados.', icon: '📋', activo: true, visibleLanding: true },
  { codigo: 'INFRAAI', nombre: 'InfraAI', desc: 'Predicción de desviaciones de costo y análisis de riesgo mediante algoritmos de Inteligencia Artificial.', icon: '🧠', activo: true, visibleLanding: true },
  { codigo: 'INFRAADMIN', nombre: 'InfraAdmin', desc: 'Consola central de gobernanza para la gestión de usuarios, roles, empresas y licencias de la suite.', icon: '🛡️', activo: true, visibleLanding: true }
];

const DEFAULT_COMPANY_MODULES = [
  { empresaId: 'c1', moduloId: 'INFRACOST' },
  { empresaId: 'c1', moduloId: 'INFRACOST_PRO' },
  { empresaId: 'c1', moduloId: 'INFRADOCS' },
  { empresaId: 'c2', moduloId: 'INFRAGEO' },
  { empresaId: 'c2', moduloId: 'INFRAAI' },
  { empresaId: 'c3', moduloId: 'INFRACONTROL' }
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
    features: 'Acceso a 6 módulos del ecosistema,Hasta 25 usuarios activos,Sincronización en la nube (Firestore),Soporte prioritario 24/7,Gestión documental avanzada',
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

// Firebase official configuration
const firebaseConfig = {
  apiKey: "AIzaSyCas8jIgsWV_hRnWcZiPMjBdvcRVtoh6EU",
  authDomain: "infrasuitee.firebaseapp.com",
  projectId: "infrasuitee",
  storageBucket: "infrasuitee.firebasestorage.app",
  messagingSenderId: "126902185835",
  appId: "1:126902185835:web:fca0a2a231b8a531efa62e",
  measurementId: "G-TVELJV85F1"
};

// Initialize real Firebase App
export const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);

// Online detection helper
export const isOnline = (): boolean => {
  return typeof window !== 'undefined' && window.navigator && window.navigator.onLine;
};

// Resilient promise timeout helper
export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 2000): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Operation timed out (Firebase is unreachable or slow)"));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

// Cloud Database seeder to avoid empty firebase DB
let isSeeding = false;
let hasCheckedSeeding = false;

export const checkAndSeedCloudDatabase = async () => {
  if (isSeeding) return;
  isSeeding = true;
  try {
    const plansRef = firebaseCollection(firestore, 'plans');
    const plansSnap = await withTimeout(firebaseGetDocs(plansRef), 1500);
    
    // Seed only if 'plans' is empty on Cloud Firestore
    if (plansSnap.empty) {
      console.info('Cloud Firestore empty. Seeding defaults to cloud...');
      
      for (const p of DEFAULT_PLANS) {
        await withTimeout(firebaseSetDoc(firebaseDoc(firestore, 'plans', p.id), p), 1000);
      }
      for (const c of DEFAULT_CLIENTS) {
        await withTimeout(firebaseSetDoc(firebaseDoc(firestore, 'clients', c.id), c), 1000);
      }
      for (const comp of DEFAULT_COMPANIES) {
        await withTimeout(firebaseSetDoc(firebaseDoc(firestore, 'companies', comp.id), comp), 1000);
      }
      for (const u of DEFAULT_USERS) {
        await withTimeout(firebaseSetDoc(firebaseDoc(firestore, 'users', u.uid), u), 1000);
      }
      for (const lic of DEFAULT_LICENSES) {
        await withTimeout(firebaseSetDoc(firebaseDoc(firestore, 'licenses', lic.empresaId), lic), 1000);
      }
      for (const mod of DEFAULT_MODULES) {
        await withTimeout(firebaseSetDoc(firebaseDoc(firestore, 'modules', mod.codigo), mod), 1000);
      }
      for (const cm of DEFAULT_COMPANY_MODULES) {
        const id = `${cm.empresaId}_${cm.moduloId}`;
        await withTimeout(firebaseSetDoc(firebaseDoc(firestore, 'company_modules', id), cm), 1000);
      }
      for (const logItem of DEFAULT_LOGS) {
        await withTimeout(firebaseSetDoc(firebaseDoc(firestore, 'logs', logItem.id), logItem), 1000);
      }
      console.info('Cloud Firestore seeded successfully!');
    }
  } catch (error) {
    console.warn('Auto-seeding of Cloud Firestore bypassed (likely timeout or permissions):', error);
  } finally {
    isSeeding = false;
  }
};

// Initialize DB collections in localStorage (fallback)
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

  // Firestore-like CRUD helpers with Hybrid Support & Timeout Fallback
  getDocs: async (collectionName: string): Promise<any[]> => {
    if (isOnline()) {
      try {
        if (!hasCheckedSeeding) {
          hasCheckedSeeding = true;
          // Seed cloud with 2000ms max timeout
          await withTimeout(checkAndSeedCloudDatabase(), 2000);
        }
        const colRef = firebaseCollection(firestore, collectionName);
        const snap = await withTimeout(firebaseGetDocs(colRef), 2000);
        const docs: any[] = [];
        snap.forEach((d) => {
          docs.push({ id: d.id, ...d.data() });
        });
        return docs;
      } catch (err) {
        console.warn(`Firestore read failed for ${collectionName}, falling back to localStorage:`, err);
      }
    }
    return db.getCollection(collectionName);
  },

  addDoc: async (collectionName: string, docData: any): Promise<any> => {
    const id = docData.id || docData.uid || docData.codigo || Math.random().toString(36).substring(2, 9);
    const newDoc = { id, ...docData };

    if (isOnline()) {
      try {
        const docRef = firebaseDoc(firestore, collectionName, id);
        await withTimeout(firebaseSetDoc(docRef, newDoc), 2000);

        // Log online
        if (collectionName !== 'logs') {
          const activeUser = getLocalStorage('infrasuite_session', { nombre: 'Sistema' });
          const logId = Math.random().toString(36).substring(2, 9);
          await withTimeout(firebaseSetDoc(firebaseDoc(firestore, 'logs', logId), {
            id: logId,
            timestamp: new Date().toISOString(),
            usuario: activeUser.nombre,
            accion: `Creación de ${collectionName.substring(0, collectionName.length - 1)}`,
            detalle: `Documento agregado: ${JSON.stringify(docData)}`
          }), 1500);
        }
        return newDoc;
      } catch (err) {
        console.warn(`Firestore addDoc failed for ${collectionName}, saving locally:`, err);
      }
    }

    // Local Storage fallback
    const data = db.getCollection(collectionName);
    data.push(newDoc);
    db.setCollection(collectionName, data);
    
    if (collectionName !== 'logs') {
      const activeUser = getLocalStorage('infrasuite_session', { nombre: 'Sistema' });
      const localLogs = db.getCollection('logs');
      localLogs.push({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        usuario: activeUser.nombre,
        accion: `Creación de ${collectionName.substring(0, collectionName.length - 1)}`,
        detalle: `Documento agregado: ${JSON.stringify(docData)}`
      });
      db.setCollection('logs', localLogs);
    }

    return newDoc;
  },

  updateDoc: async (collectionName: string, id: string, docData: any): Promise<void> => {
    if (isOnline()) {
      try {
        const docRef = firebaseDoc(firestore, collectionName, id);
        const docSnap = await withTimeout(firebaseGetDoc(docRef), 2000);
        const mergedData = docSnap.exists() ? { ...docSnap.data(), ...docData } : { id, ...docData };
        await withTimeout(firebaseSetDoc(docRef, mergedData), 2000);

        // Log online
        if (collectionName !== 'logs') {
          const activeUser = getLocalStorage('infrasuite_session', { nombre: 'Sistema' });
          const logId = Math.random().toString(36).substring(2, 9);
          await withTimeout(firebaseSetDoc(firebaseDoc(firestore, 'logs', logId), {
            id: logId,
            timestamp: new Date().toISOString(),
            usuario: activeUser.nombre,
            accion: `Modificación de ${collectionName.substring(0, collectionName.length - 1)}`,
            detalle: `Registro ${id} actualizado.`
          }), 1500);
        }
        return;
      } catch (err) {
        console.warn(`Firestore updateDoc failed for ${collectionName}, updating locally:`, err);
      }
    }

    // Local Storage fallback
    const data = db.getCollection(collectionName);
    const index = data.findIndex(d => (d.id === id || d.uid === id || d.codigo === id || d.empresaId === id));
    if (index !== -1) {
      data[index] = { ...data[index], ...docData };
      db.setCollection(collectionName, data);
      
      if (collectionName !== 'logs') {
        const activeUser = getLocalStorage('infrasuite_session', { nombre: 'Sistema' });
        const localLogs = db.getCollection('logs');
        localLogs.push({
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toISOString(),
          usuario: activeUser.nombre,
          accion: `Modificación de ${collectionName.substring(0, collectionName.length - 1)}`,
          detalle: `Registro ${id} actualizado.`
        });
        db.setCollection('logs', localLogs);
      }
    }
  },

  deleteDoc: async (collectionName: string, id: string): Promise<void> => {
    if (isOnline()) {
      try {
        const docRef = firebaseDoc(firestore, collectionName, id);
        await withTimeout(firebaseDeleteDoc(docRef), 2000);

        // Log online
        const activeUser = getLocalStorage('infrasuite_session', { nombre: 'Sistema' });
        const logId = Math.random().toString(36).substring(2, 9);
        await withTimeout(firebaseSetDoc(firebaseDoc(firestore, 'logs', logId), {
          id: logId,
          timestamp: new Date().toISOString(),
          usuario: activeUser.nombre,
          accion: `Eliminación de ${collectionName.substring(0, collectionName.length - 1)}`,
          detalle: `Registro ${id} eliminado.`
        }), 1500);
        return;
      } catch (err) {
        console.warn(`Firestore deleteDoc failed for ${collectionName}, deleting locally:`, err);
      }
    }

    // Local Storage fallback
    let data = db.getCollection(collectionName);
    const initialLen = data.length;
    data = data.filter(d => !(d.id === id || d.uid === id || d.codigo === id));
    if (data.length < initialLen) {
      db.setCollection(collectionName, data);

      const activeUser = getLocalStorage('infrasuite_session', { nombre: 'Sistema' });
      const localLogs = db.getCollection('logs');
      localLogs.push({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        usuario: activeUser.nombre,
        accion: `Eliminación de ${collectionName.substring(0, collectionName.length - 1)}`,
        detalle: `Registro ${id} eliminado.`
      });
      db.setCollection('logs', localLogs);
    }
  }
};
