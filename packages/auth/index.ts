import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, app, isOnline } from '@infrasuite/firebase';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider
} from 'firebase/auth';

export interface User {
  uid: string;
  nombre: string;
  email: string;
  empresaId: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'PROJECT_MANAGER' | 'ENGINEER' | 'VIEWER';
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, empresaId?: string, role?: User['role']) => Promise<void>;
  loginWithGoogle: (mockEmail?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Lazy Auth retriever to avoid module-level exceptions
let firebaseAuth: any = null;
const getFirebaseAuth = () => {
  if (!firebaseAuth && app) {
    try {
      firebaseAuth = getAuth(app);
    } catch (e) {
      console.warn("Failed to initialize Firebase Auth instance lazily:", e);
    }
  }
  return firebaseAuth;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // SSO Session sync from localStorage
  useEffect(() => {
    const session = localStorage.getItem('infrasuite_session');
    if (session) {
      try {
        setUser(JSON.parse(session));
      } catch (e) {
        console.error('Failed to parse session', e);
      }
    }
    setIsLoading(false);

    // Deep link listener for Electron Google OAuth
    if (typeof window !== 'undefined' && (window as any).electron?.auth) {
      (window as any).electron.auth.onDeepLink(async (url: string) => {
        setIsLoading(true);
        try {
          const urlObj = new URL(url);
          const idToken = urlObj.searchParams.get('token');
          if (idToken) {
            const authInstance = getFirebaseAuth();
            if (authInstance) {
              const credential = GoogleAuthProvider.credential(idToken);
              const authUserCred = await signInWithCredential(authInstance, credential);
              
              const email = authUserCred.user.email || '';
              let role: User['role'] = 'ADMIN';
              let empresaId = 'c1';
              
              if (email.startsWith('superadmin') || email === 'superadmin@infrasuite.com' || email === 'superadmin.google@gmail.com' || email === 'gin.zu.ken@gmail.com') {
                role = 'SUPER_ADMIN';
                empresaId = '';
              } else {
                try {
                  const usersList = await db.getDocs('users');
                  const found = usersList.find((u: any) => u.email === email);
                  if (found) {
                    role = found.role;
                    empresaId = found.empresaId;
                  }
                } catch (e) {}
              }

              const finalUser: User = {
                uid: authUserCred.user.uid,
                nombre: authUserCred.user.displayName || email.split('@')[0].toUpperCase(),
                email,
                empresaId,
                role
              };

              setUser(finalUser);
              localStorage.setItem('infrasuite_session', JSON.stringify(finalUser));
            }
          }
        } catch (e) {
          console.error("Deep link auth error", e);
        }
        setIsLoading(false);
      });
    }
  }, []);

  const login = async (email: string, password: string, empresaId?: string, role?: User['role']) => {
    setIsLoading(true);
    let finalUser: User;

    if (isOnline()) {
      try {
        const authInstance = getFirebaseAuth();
        if (!authInstance) {
          throw new Error("Firebase Auth is not available");
        }

        let authUserCred: any = null;
        try {
          // Attempt online login with Firebase Auth
          authUserCred = await signInWithEmailAndPassword(authInstance, email, password);
        } catch (authErr: any) {
          if (authErr.code === 'auth/wrong-password' || authErr.code === 'auth/invalid-credential') {
            throw authErr;
          } else if (authErr.code === 'auth/user-not-found') {
            try {
              authUserCred = await createUserWithEmailAndPassword(authInstance, email, password);
            } catch (createErr) {
              console.warn("Could not auto-create online account in Firebase Auth:", createErr);
              throw createErr;
            }
          } else {
            throw authErr;
          }
        }

        const uid = authUserCred?.user.uid || Math.random().toString(36).substring(2, 9);
        
        let dbRole: User['role'] = role || 'ADMIN';
        let dbEmpresaId = empresaId || 'c1';
        let dbNombre = email.split('@')[0].toUpperCase();

        if (email.startsWith('superadmin') || email === 'superadmin@infrasuite.com' || email === 'superadmin.google@gmail.com' || email === 'gin.zu.ken@gmail.com') {
          dbRole = 'SUPER_ADMIN';
          dbEmpresaId = '';
        } else {
          try {
            const usersList = await db.getDocs('users');
            const found = usersList.find((u: any) => u.email === email);
            if (found) {
              dbRole = found.role;
              dbEmpresaId = found.empresaId;
              if (found.nombre) dbNombre = found.nombre;
            }
          } catch (e) {
            console.warn("Could not retrieve user info from Supabase DB, using defaults:", e);
          }
        }

        finalUser = {
          uid,
          nombre: dbNombre,
          email,
          empresaId: dbEmpresaId,
          role: dbRole
        };

        // Sync profile to Supabase DB
        await db.addDoc('users', finalUser);

      } catch (err: any) {
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          setIsLoading(false);
          throw new Error("Contraseña incorrecta. Por favor, verifica tus credenciales en Firebase.");
        }
        
        console.warn("Online Firebase Auth error, using local fallback profile:", err);
        
        let dbRole: User['role'] = role || 'ADMIN';
        let dbEmpresaId = empresaId || 'c1';
        let dbNombre = email.split('@')[0].toUpperCase();

        if (email.startsWith('superadmin') || email === 'superadmin@infrasuite.com' || email === 'superadmin.google@gmail.com' || email === 'gin.zu.ken@gmail.com') {
          dbRole = 'SUPER_ADMIN';
          dbEmpresaId = '';
        } else {
          try {
            const localUsers = db.getCollection('users');
            const found = localUsers.find((u: any) => u.email === email);
            if (found) {
              dbRole = found.role;
              dbEmpresaId = found.empresaId;
              if (found.nombre) dbNombre = found.nombre;
            }
          } catch (e) {
            console.warn("Could not retrieve local user during offline fallback:", e);
          }
        }

        finalUser = {
          uid: Math.random().toString(36).substring(2, 9),
          nombre: dbNombre,
          email,
          empresaId: dbEmpresaId,
          role: dbRole
        };
      }
    } else {
      let dbRole: User['role'] = role || 'ADMIN';
      let dbEmpresaId = empresaId || 'c1';
      let dbNombre = email.split('@')[0].toUpperCase();

      if (email.startsWith('superadmin') || email === 'superadmin@infrasuite.com' || email === 'superadmin.google@gmail.com' || email === 'gin.zu.ken@gmail.com') {
        dbRole = 'SUPER_ADMIN';
        dbEmpresaId = '';
      } else {
        try {
          const localUsers = db.getCollection('users');
          const found = localUsers.find((u: any) => u.email === email);
          if (found) {
            dbRole = found.role;
            dbEmpresaId = found.empresaId;
            if (found.nombre) dbNombre = found.nombre;
          }
        } catch (e) {
          console.warn("Could not retrieve local user in offline mode:", e);
        }
      }

      finalUser = {
        uid: Math.random().toString(36).substring(2, 9),
        nombre: dbNombre,
        email,
        empresaId: dbEmpresaId,
        role: dbRole
      };
    }

    setUser(finalUser);
    localStorage.setItem('infrasuite_session', JSON.stringify(finalUser));
    setIsLoading(false);
  };

  const loginWithGoogle = async (mockEmail?: string) => {
    setIsLoading(true);

    if (isOnline() && !mockEmail) {
      const isElectron = typeof window !== 'undefined' && window.navigator && window.navigator.userAgent.toLowerCase().includes('electron');
      
      if (isElectron) {
        if ((window as any).electron?.auth) {
          (window as any).electron.auth.openExternal('https://infrasuitee.web.app/desktop-login');
        } else {
          const finalUser: User = {
            uid: 'desktop_local_user',
            nombre: 'Usuario Desktop (Local)',
            email: 'desktop@local.infrasuite.com',
            role: 'SUPER_ADMIN',
            empresaId: ''
          };
          setUser(finalUser);
          localStorage.setItem('infrasuite_session', JSON.stringify(finalUser));
          setIsLoading(false);
        }
        return;
      }

      try {
        const authInstance = getFirebaseAuth();
        if (!authInstance) {
          throw new Error("Firebase Auth instance is not initialized");
        }

        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account'
        });

        // Trigger Google account selector popup in browser
        const authUserCred = await signInWithPopup(authInstance, provider);
        const email = authUserCred.user.email || '';
        
        let role: User['role'] = 'ADMIN';
        let empresaId = 'c1';

        if (email.startsWith('superadmin') || email === 'superadmin@infrasuite.com' || email === 'superadmin.google@gmail.com' || email === 'gin.zu.ken@gmail.com') {
          role = 'SUPER_ADMIN';
          empresaId = '';
        } else {
          try {
            const usersList = await db.getDocs('users');
            const found = usersList.find((u: any) => u.email === email);
            if (found) {
              role = found.role;
              empresaId = found.empresaId;
            }
          } catch (e) {
            console.warn("Could not retrieve user info from Supabase DB:", e);
          }
        }

        const finalUser: User = {
          uid: authUserCred.user.uid,
          nombre: authUserCred.user.displayName || email.split('@')[0].toUpperCase(),
          email,
          empresaId,
          role
        };

        // Sync user profile to Supabase DB
        await db.addDoc('users', finalUser);

        setUser(finalUser);
        localStorage.setItem('infrasuite_session', JSON.stringify(finalUser));
        setIsLoading(false);
        return;

      } catch (err: any) {
        console.error("Firebase Google Auth error:", err);

        if (err?.code === 'auth/unauthorized-domain') {
          setIsLoading(false);
          throw new Error("El dominio '" + window.location.hostname + "' no está autorizado en Firebase Console (Authentication > Settings > Authorized Domains).");
        }
        if (err?.code === 'auth/operation-not-allowed') {
          setIsLoading(false);
          throw new Error("El proveedor de Google no está activado en tu consola de Firebase (Authentication > Sign-in method > Google).");
        }
        if (err?.code === 'auth/popup-closed-by-user') {
          setIsLoading(false);
          throw new Error("Inicio de sesión cancelado al cerrar la ventana emergente.");
        }
      }
    }

    const email = mockEmail || '';
    if (email) {
      let role: User['role'] = 'ADMIN';
      let empresaId = 'c1';

      if (email.startsWith('superadmin') || email === 'superadmin@infrasuite.com' || email === 'superadmin.google@gmail.com' || email === 'gin.zu.ken@gmail.com') {
        role = 'SUPER_ADMIN';
        empresaId = '';
      } else {
        try {
          const usersList = db.getCollection('users');
          const found = usersList.find((u: any) => u.email === email);
          if (found) {
            role = found.role;
            empresaId = found.empresaId;
          }
        } catch (e) {
          console.warn("Could not retrieve local user info during mock Google login:", e);
        }
      }

      const finalUser: User = {
        uid: 'g_' + Math.random().toString(36).substring(2, 9),
        nombre: email.split('@')[0].toUpperCase(),
        email,
        empresaId,
        role
      };

      setUser(finalUser);
      localStorage.setItem('infrasuite_session', JSON.stringify(finalUser));
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    throw new Error("No se pudo completar el inicio de sesión con Google.");
  };

  const logout = async () => {
    if (isOnline()) {
      try {
        const authInstance = getFirebaseAuth();
        if (authInstance) {
          await signOut(authInstance);
        }
      } catch (e) {
        console.warn("Firebase online logout error:", e);
      }
    }
    setUser(null);
    localStorage.removeItem('infrasuite_session');
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { user, login, loginWithGoogle, logout, isLoading } },
    children
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
