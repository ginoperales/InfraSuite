import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, app, isOnline, withTimeout } from '@infrasuite/firebase';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithPopup,
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
          // Attempt online login with the user's typed password
          authUserCred = await withTimeout(
            signInWithEmailAndPassword(authInstance, email, password),
            3000
          );
        } catch (authErr: any) {
          // If password is wrong or credentials invalid, throw immediately (do not bypass)
          if (authErr.code === 'auth/wrong-password' || authErr.code === 'auth/invalid-credential') {
            throw authErr;
          } else if (authErr.code === 'auth/user-not-found') {
            // Auto-create only if it's a new user email, using the password they typed
            try {
              authUserCred = await withTimeout(
                createUserWithEmailAndPassword(authInstance, email, password),
                3000
              );
            } catch (createErr) {
              console.warn("Could not auto-create online account:", createErr);
              throw createErr;
            }
          } else {
            throw authErr;
          }
        }

        const uid = authUserCred?.user.uid || Math.random().toString(36).substring(2, 9);
        
        // Resolve role, company and name dynamically from database!
        let dbRole: User['role'] = role || 'ADMIN';
        let dbEmpresaId = empresaId || 'c1';
        let dbNombre = email.split('@')[0].toUpperCase();

        if (email.startsWith('superadmin') || email === 'superadmin@infrasuite.com' || email === 'superadmin.google@gmail.com' || email === 'gin.zu.ken@gmail.com') {
          dbRole = 'SUPER_ADMIN';
          dbEmpresaId = '';
        } else {
          try {
            const usersList = await withTimeout(db.getDocs('users'), 2000);
            const found = usersList.find((u: any) => u.email === email);
            if (found) {
              dbRole = found.role;
              dbEmpresaId = found.empresaId;
              if (found.nombre) dbNombre = found.nombre;
            }
          } catch (e) {
            console.warn("Could not retrieve user info from Firestore, using defaults:", e);
          }
        }

        finalUser = {
          uid,
          nombre: dbNombre,
          email,
          empresaId: dbEmpresaId,
          role: dbRole
        };

        // Save doc to Cloud Firestore to make sure the user profile matches (timeout 2000ms max)
        await withTimeout(db.addDoc('users', finalUser), 2000);

      } catch (err: any) {
        // Stop login if wrong password error was explicitly thrown
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          setIsLoading(false);
          throw new Error("Contraseña incorrecta. Por favor, verifica tus credenciales en Firebase.");
        }
        
        console.warn("Online auth process encountered errors/timeouts, falling back to local credentials:", err);
        
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
      // Offline mode fallback
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
      try {
        const authInstance = getFirebaseAuth();
        if (!authInstance) {
          throw new Error("Firebase Auth is not available");
        }

        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account'
        });

        // Trigger Google account selector popup
        const authUserCred = await signInWithPopup(authInstance, provider);
        const email = authUserCred.user.email || '';
        
        let role: User['role'] = 'ADMIN';
        let empresaId = 'c1';

        if (email.startsWith('superadmin') || email === 'superadmin@infrasuite.com' || email === 'superadmin.google@gmail.com' || email === 'gin.zu.ken@gmail.com') {
          role = 'SUPER_ADMIN';
          empresaId = '';
        } else {
          // Check if there is an existing user mapping in Firestore
          try {
            const usersList = await withTimeout(db.getDocs('users'), 2000);
            const found = usersList.find((u: any) => u.email === email);
            if (found) {
              role = found.role;
              empresaId = found.empresaId;
            }
          } catch (e) {
            console.warn("Could not retrieve user info from Firestore, using default ADMIN role:", e);
          }
        }

        const finalUser: User = {
          uid: authUserCred.user.uid,
          nombre: authUserCred.user.displayName || email.split('@')[0].toUpperCase(),
          email,
          empresaId,
          role
        };

        // Save/Sync user profile to Cloud Firestore
        await withTimeout(db.addDoc('users', finalUser), 2000);

        setUser(finalUser);
        localStorage.setItem('infrasuite_session', JSON.stringify(finalUser));
        setIsLoading(false);
        return;

      } catch (err) {
        console.warn("Online Google Auth encountered errors or was canceled, invoking fallback chooser:", err);
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
    throw new Error("offline_fallback");
  };

  const logout = async () => {
    if (isOnline()) {
      try {
        const authInstance = getFirebaseAuth();
        if (authInstance) {
          await withTimeout(signOut(authInstance), 1500);
        }
      } catch (e) {
        console.warn("Firebase online logout error/timeout:", e);
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
