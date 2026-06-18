import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@infrasuite/auth';
import { Button, Card, Table, Input, Select, Modal } from '@infrasuite/shared';
import { db } from '@infrasuite/firebase';
import { getSQLiteDatabase } from '@infrasuite/sqlite';
import { syncModuleData } from '@infrasuite/sync-service';
import { motion, AnimatePresence } from 'framer-motion';

// Subpages
import { Dashboard } from './pages/Dashboard';
import { Companies } from './pages/Companies';
import { Users } from './pages/Users';
import { Logs } from './pages/Logs';
import { LandingPage } from './pages/LandingPage';
import { LandingAdmin } from './pages/LandingAdmin';
import { Budgets } from './pages/Budgets';
import { Applications } from './pages/Applications';
import { ProfileSettings } from './pages/ProfileSettings';

// App Inner Layout
const AppContent: React.FC = () => {
  const { user, login, loginWithGoogle, logout, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);

  // SQLite / Sync demo states
  const [syncModule, setSyncModule] = useState('InfraCost');
  const [localRows, setLocalRows] = useState<any[]>([]);
  const [newLocalItemName, setNewLocalItemName] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('infrasuite_theme') as 'dark' | 'light') || 'dark';
  });

  // States for premium login success transition animation
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [successProgress, setSuccessProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState('Iniciando carga segura...');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('infrasuite_theme', theme);
  }, [theme]);

  // Monitor login success to trigger custom transition screen
  useEffect(() => {
    if (user && !sessionUser) {
      setShowSuccessOverlay(true);
      setSessionUser(user);
    } else if (!user && sessionUser) {
      setSessionUser(null);
    }
  }, [user, sessionUser]);

  useEffect(() => {
    if (user) {
      if (user.role === 'SUPER_ADMIN') {
        setActiveTab('dashboard');
      } else {
        setActiveTab('budgets');
      }
    }
  }, [user]);

  // Turn off the success transition overlay after a set duration
  useEffect(() => {
    if (showSuccessOverlay) {
      const timer = setTimeout(() => {
        setShowSuccessOverlay(false);
      }, 2400); // Duration matches progress steps
      return () => clearTimeout(timer);
    }
  }, [showSuccessOverlay]);

  // Drive progress bar and status text during login success transition
  useEffect(() => {
    if (showSuccessOverlay) {
      setSuccessProgress(0);
      setSuccessMessage('Iniciando carga segura...');
      
      const interval = setInterval(() => {
        setSuccessProgress((prev) => {
          const next = prev + 5;
          if (next >= 100) {
            clearInterval(interval);
            return 100;
          }
          return next;
        });
      }, 95); // 20 steps of 95ms ~= 1.9s

      return () => clearInterval(interval);
    }
  }, [showSuccessOverlay]);

  useEffect(() => {
    if (successProgress < 20) {
      setSuccessMessage('Conectando al gateway de seguridad...');
    } else if (successProgress < 40) {
      setSuccessMessage('Validando tokens de sesión JWT...');
    } else if (successProgress < 65) {
      setSuccessMessage('Estableciendo canales de datos de monorepo...');
    } else if (successProgress < 85) {
      setSuccessMessage('Cargando componentes de control administrativo...');
    } else {
      setSuccessMessage('¡Acceso concedido! Redireccionando a la consola...');
    }
  }, [successProgress]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    // Load companies list for login dropdown selection
    const loadCompanies = async () => {
      const list = await db.getDocs('companies');
      setCompanies(list);
    };
    loadCompanies();
  }, []);

  // Sync / SQLite demo: Load local SQLite rows
  useEffect(() => {
    if (!user) return;
    loadLocalSQLiteData();
  }, [syncModule, user]);

  const loadLocalSQLiteData = () => {
    const dbName = `${syncModule}.db`;
    const tableName = syncModule === 'InfraCost' ? 'budgets' : 'samples';
    const localDb = getSQLiteDatabase(dbName);
    
    // Create tables if they do not exist
    if (syncModule === 'InfraCost') {
      localDb.createTable('budgets', ['nombre', 'monto']);
    } else {
      localDb.createTable('samples', ['codigo', 'profundidad']);
    }

    setLocalRows(localDb.query(tableName));
  };

  const handleAddSQLiteRow = () => {
    if (!newLocalItemName) return;
    const dbName = `${syncModule}.db`;
    const tableName = syncModule === 'InfraCost' ? 'budgets' : 'samples';
    const localDb = getSQLiteDatabase(dbName);

    if (syncModule === 'InfraCost') {
      localDb.insert(tableName, {
        nombre: newLocalItemName,
        monto: Math.floor(Math.random() * 50000) + 5000,
        createdAt: new Date().toISOString()
      });
    } else {
      localDb.insert(tableName, {
        codigo: newLocalItemName,
        profundidad: `${(Math.random() * 10 + 1).toFixed(2)}m`,
        createdAt: new Date().toISOString()
      });
    }

    setNewLocalItemName('');
    loadLocalSQLiteData();
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    const dbName = `${syncModule}.db`;
    const tableName = syncModule === 'InfraCost' ? 'budgets' : 'samples';
    const firestoreCollection = syncModule === 'InfraCost' ? 'budgets_cloud' : 'samples_cloud';

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await syncModuleData(dbName, tableName, firestoreCollection);
    
    setIsSyncing(false);
    loadLocalSQLiteData();
    alert(`¡Sincronización de ${syncModule} completada con Firestore!`);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      alert(`Error de autenticación: ${err.message || err.code || err}`);
    }
  };

  const handleSelectGoogleAccount = (email: string) => {
    if (!email || !email.includes('@')) {
      alert('Por favor introduce un correo de Gmail válido.');
      return;
    }
    setIsGoogleModalOpen(false);
    loginWithGoogle(email);
    
    // Log SSO event
    db.addDoc('logs', {
      timestamp: new Date().toISOString(),
      usuario: email.split('@')[0].toUpperCase(),
      accion: 'SSO Google Login',
      detalle: `Sesión iniciada con cuenta de Google Gmail: ${email}`
    });
  };

  const handleGoogleLoginClick = async () => {
    try {
      await loginWithGoogle();
      // Log SSO event
      db.addDoc('logs', {
        timestamp: new Date().toISOString(),
        usuario: 'GOOGLE_AUTH',
        accion: 'SSO Google Login popup',
        detalle: 'Sesión iniciada con cuenta de Google'
      });
    } catch (err: any) {
      if (err.message === "offline_fallback") {
        setIsGoogleModalOpen(true);
      } else {
        console.warn("Google Auth failed, falling back to local modal:", err);
        setIsGoogleModalOpen(true);
      }
    }
  };


  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          className="login-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <motion.div
              style={{
                width: '70px',
                height: '70px',
                border: '4px solid rgba(0, 240, 255, 0.05)',
                borderTop: '4px solid var(--color-primary)',
                borderRight: '4px solid var(--color-secondary)',
                borderRadius: '50%',
              }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{ textAlign: 'center' }}
            >
              <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', letterSpacing: '-0.3px' }}>
                SSO Centralizado
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontFamily: 'monospace', fontWeight: 600, marginTop: '6px', display: 'inline-block' }}>
                Verificando credenciales de acceso...
              </span>
            </motion.div>
          </div>
        </motion.div>
      ) : showSuccessOverlay ? (
        <motion.div
          key="success-transition"
          className="success-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.97 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
        >
          {/* Cyber scanline */}
          <div className="cyber-scanline" />
          
          <motion.div 
            className="success-card"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          >
            {/* Holographic header */}
            <div className="success-icon-container">
              <motion.div 
                className="success-glow-ring"
                animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              />
              <motion.div 
                className="success-icon-badge"
                initial={{ rotate: -90, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', delay: 0.15, stiffness: 150, damping: 12 }}
              >
                ✓
              </motion.div>
            </div>

            <motion.h2 
              className="success-card-title"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              AUTENTICACIÓN EXITOSA
            </motion.h2>

            <motion.div 
              className="success-card-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              SSO CENTRALIZADO • INFRASUITE CONTROL
            </motion.div>

            {/* Futuristic user details card */}
            <motion.div 
              className="success-details-terminal"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <div className="terminal-header">
                <span className="terminal-dot red" />
                <span className="terminal-dot yellow" />
                <span className="terminal-dot green" />
                <span className="terminal-title">SECURITY_TOKEN_INFO</span>
              </div>
              <div className="terminal-content">
                <div className="terminal-line">
                  <span className="terminal-label">USUARIO:</span>
                  <span className="terminal-value highlight">{user?.nombre}</span>
                </div>
                <div className="terminal-line">
                  <span className="terminal-label">CORREO:</span>
                  <span className="terminal-value">{user?.email}</span>
                </div>
                <div className="terminal-line">
                  <span className="terminal-label">ROL ACCESO:</span>
                  <span className="terminal-value badge-role-inline">{user?.role}</span>
                </div>
                <div className="terminal-line">
                  <span className="terminal-label">EMPRESA:</span>
                  <span className="terminal-value">
                    {user?.role === 'SUPER_ADMIN' ? 'SUITE GLOBAL (ALL)' : companies.find(c => c.id === user?.empresaId)?.nombre || 'EMPRESA CENTRAL'}
                  </span>
                </div>
                <div className="terminal-line">
                  <span className="terminal-label">GW_GATEWAY:</span>
                  <span className="terminal-value highlight-cyan">SECURE_TUNNEL_ESTABLISHED</span>
                </div>
              </div>
            </motion.div>

            {/* Progress Bar */}
            <div className="success-progress-section">
              <div className="success-progress-labels">
                <span className="success-progress-status">{successMessage}</span>
                <span className="success-progress-percentage">{successProgress}%</span>
              </div>
              <div className="success-progress-bar-container">
                <div 
                  className="success-progress-bar-fill"
                  style={{ width: `${successProgress}%`, transition: 'width 0.1s ease-out' }}
                />
              </div>
            </div>

            {/* Footer details */}
            <div className="success-card-footer">
              <span className="blink-dot" />
              <span>ESTADO DE RED: ONLINE (SSL v3)</span>
            </div>
          </motion.div>
        </motion.div>
      ) : !user ? (
        !showLogin ? (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%' }}
          >
            <LandingPage onStartLogin={() => setShowLogin(true)} theme={theme} toggleTheme={toggleTheme} />
          </motion.div>
        ) : (
          <motion.div
            key="login"
            className="login-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="login-card"
              initial={{ y: 40, scale: 0.96, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: -40, scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            >
              <div className="login-header">
                <div className="login-logo">I</div>
                <h1 className="login-title">InfraSuite</h1>
                <p className="login-subtitle">Single Sign-On (SSO) Centralizado</p>
              </div>
              <form onSubmit={handleLoginSubmit} className="login-form">
                <Input
                  type="email"
                  label="Correo Electrónico"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  label="Contraseña"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <Button type="submit" style={{ marginTop: '10px' }}>
                  Iniciar Sesión
                </Button>

                <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0', gap: '10px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>O BIEN</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleGoogleLoginClick}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    background: '#ffffff',
                    color: '#1f1f1f',
                    border: '1px solid #dadce0',
                    fontWeight: '600'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7l2.79 2.17c1.63-1.51 2.57-3.73 2.57-6.5z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.79-2.17c-.77.52-1.76.83-2.79.83-2.15 0-3.97-1.45-4.62-3.41H1.89v2.24C3.39 16.09 6.01 18 9 18z"/>
                    <path fill="#FBBC05" d="M4.38 11.07A5.36 5.36 0 0 1 4.1 9c0-.73.12-1.43.35-2.07V4.69H1.89A8.99 8.99 0 0 0 0 9c0 1.69.47 3.27 1.29 4.63l3.09-2.56z"/>
                    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.4A8.99 8.99 0 0 0 1.89 4.69l3.09 2.38C5.63 5.03 7.45 3.58 9 3.58z"/>
                  </svg>
                  Acceder con Google
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowLogin(false)}
                  style={{ marginTop: '12px' }}
                >
                  Volver al Inicio
                </Button>
              </form>
            </motion.div>

            {/* Mock Google Account Chooser Modal */}
            <Modal
              isOpen={isGoogleModalOpen}
              onClose={() => setIsGoogleModalOpen(false)}
              title="Iniciar sesión con Google"
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" style={{ marginBottom: '12px', display: 'inline-block' }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Elige una cuenta de Google para continuar en <strong>InfraSuite</strong>
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleSelectGoogleAccount('gin.zu.ken@gmail.com')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    fontFamily: 'var(--font-sans)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div className="avatar" style={{ width: '32px', height: '32px', background: 'var(--color-primary)', color: 'white' }}>GZ</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Gin Zu Ken</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>gin.zu.ken@gmail.com</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectGoogleAccount('superadmin.google@gmail.com')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    fontFamily: 'var(--font-sans)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div className="avatar" style={{ width: '32px', height: '32px', background: 'var(--color-secondary)', color: 'white' }}>SG</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Super Google Admin</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>superadmin.google@gmail.com</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectGoogleAccount('colaborador.obra@gmail.com')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    fontFamily: 'var(--font-sans)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div className="avatar" style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.1)', color: 'white' }}>CO</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Colaborador Obra</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>colaborador.obra@gmail.com</div>
                  </div>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0', gap: '8px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>O USA OTRA CUENTA</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Input
                    type="email"
                    placeholder="ejemplo@gmail.com"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                  />
                  <Button type="button" onClick={() => handleSelectGoogleAccount(googleEmailInput)}>
                    Siguiente
                  </Button>
                </div>
              </div>
            </Modal>
          </motion.div>
        )
      ) : (
        <motion.div
          key="app"
          className="app-container"
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{ width: '100%' }}
        >
          {/* Sidebar navigation */}
          <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="logo-container">
                <div className="logo-icon">I</div>
                {!isSidebarCollapsed && <div className="logo-text">InfraAdmin</div>}
              </div>
              <button 
                type="button"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'background 0.2s',
                  alignSelf: 'center'
                }}
                title={isSidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
              >
                {isSidebarCollapsed ? '➡️' : '⬅️'}
              </button>
            </div>

            {user.role === 'SUPER_ADMIN' ? (
              <nav className="sidebar-menu">
                <button
                  className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dashboard')}
                  title={isSidebarCollapsed ? "Panel Principal" : undefined}
                  style={{
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    padding: isSidebarCollapsed ? '14px 0' : '14px 18px',
                  }}
                >
                  <span style={{ fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>📊</span>
                  {!isSidebarCollapsed && <span>Panel Principal</span>}
                </button>
                <button
                  className={`menu-item ${activeTab === 'companies' ? 'active' : ''}`}
                  onClick={() => setActiveTab('companies')}
                  title={isSidebarCollapsed ? "Empresas y Módulos" : undefined}
                  style={{
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    padding: isSidebarCollapsed ? '14px 0' : '14px 18px',
                  }}
                >
                  <span style={{ fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>🏢</span>
                  {!isSidebarCollapsed && <span>Empresas y Módulos</span>}
                </button>
                <button
                  className={`menu-item ${activeTab === 'landing' ? 'active' : ''}`}
                  onClick={() => setActiveTab('landing')}
                  title={isSidebarCollapsed ? "Configuración Landing" : undefined}
                  style={{
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    padding: isSidebarCollapsed ? '14px 0' : '14px 18px',
                  }}
                >
                  <span style={{ fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>🎨</span>
                  {!isSidebarCollapsed && <span>Configuración Landing</span>}
                </button>
                <button
                  className={`menu-item ${activeTab === 'users' ? 'active' : ''}`}
                  onClick={() => setActiveTab('users')}
                  title={isSidebarCollapsed ? "Directorio de Usuarios" : undefined}
                  style={{
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    padding: isSidebarCollapsed ? '14px 0' : '14px 18px',
                  }}
                >
                  <span style={{ fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>👥</span>
                  {!isSidebarCollapsed && <span>Directorio de Usuarios</span>}
                </button>
                <button
                  className={`menu-item ${activeTab === 'logs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('logs')}
                  title={isSidebarCollapsed ? "Bitácora / Auditoría" : undefined}
                  style={{
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    padding: isSidebarCollapsed ? '14px 0' : '14px 18px',
                  }}
                >
                  <span style={{ fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>⚡</span>
                  {!isSidebarCollapsed && <span>Bitácora / Auditoría</span>}
                </button>
                <button
                  className={`menu-item ${activeTab === 'sync' ? 'active' : ''}`}
                  onClick={() => setActiveTab('sync')}
                  title={isSidebarCollapsed ? "Sincronizador Local" : undefined}
                  style={{
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    padding: isSidebarCollapsed ? '14px 0' : '14px 18px',
                  }}
                >
                  <span style={{ fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>🔄</span>
                  {!isSidebarCollapsed && <span>Sincronizador Local</span>}
                </button>
                <button
                  className={`menu-item ${activeTab === 'budgets' ? 'active' : ''}`}
                  onClick={() => setActiveTab('budgets')}
                  title={isSidebarCollapsed ? "Presupuestos" : undefined}
                  style={{
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    padding: isSidebarCollapsed ? '14px 0' : '14px 18px',
                  }}
                >
                  <span style={{ fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>💰</span>
                  {!isSidebarCollapsed && <span>PRESUPUESTOS</span>}
                </button>
                <button
                  className={`menu-item ${activeTab === 'applications' ? 'active' : ''}`}
                  onClick={() => setActiveTab('applications')}
                  title={isSidebarCollapsed ? "Aplicaciones" : undefined}
                  style={{
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    padding: isSidebarCollapsed ? '14px 0' : '14px 18px',
                  }}
                >
                  <span style={{ fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>📱</span>
                  {!isSidebarCollapsed && <span>Aplicaciones</span>}
                </button>
              </nav>
            ) : user.role === 'ADMIN' ? (
              <nav className="sidebar-menu">
                <button
                  className={`menu-item ${activeTab === 'budgets' ? 'active' : ''}`}
                  onClick={() => setActiveTab('budgets')}
                  title={isSidebarCollapsed ? "Presupuestos" : undefined}
                  style={{
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    padding: isSidebarCollapsed ? '14px 0' : '14px 18px',
                  }}
                >
                  <span style={{ fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>💰</span>
                  {!isSidebarCollapsed && <span>PRESUPUESTOS</span>}
                </button>

                {!isSidebarCollapsed && (
                  <div style={{
                    margin: '16px 0 8px 18px',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>
                    Opciones de Admin
                  </div>
                )}

                <button
                  className={`menu-item ${activeTab === 'users' ? 'active' : ''}`}
                  onClick={() => setActiveTab('users')}
                  title={isSidebarCollapsed ? "Directorio de Usuarios" : undefined}
                  style={{
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    padding: isSidebarCollapsed ? '14px 0' : '14px 18px',
                  }}
                >
                  <span style={{ fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>👥</span>
                  {!isSidebarCollapsed && <span>Directorio de Usuarios</span>}
                </button>
                <button
                  className={`menu-item ${activeTab === 'sync' ? 'active' : ''}`}
                  onClick={() => setActiveTab('sync')}
                  title={isSidebarCollapsed ? "Sincronizador Local" : undefined}
                  style={{
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    padding: isSidebarCollapsed ? '14px 0' : '14px 18px',
                  }}
                >
                  <span style={{ fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>🔄</span>
                  {!isSidebarCollapsed && <span>Sincronizador Local</span>}
                </button>
                <button
                  className={`menu-item ${activeTab === 'applications' ? 'active' : ''}`}
                  onClick={() => setActiveTab('applications')}
                  title={isSidebarCollapsed ? "Aplicaciones" : undefined}
                  style={{
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    padding: isSidebarCollapsed ? '14px 0' : '14px 18px',
                  }}
                >
                  <span style={{ fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>📱</span>
                  {!isSidebarCollapsed && <span>Aplicaciones</span>}
                </button>
              </nav>
            ) : (
              <nav className="sidebar-menu">
                <button
                  className={`menu-item ${activeTab === 'budgets' ? 'active' : ''}`}
                  onClick={() => setActiveTab('budgets')}
                  title={isSidebarCollapsed ? "Presupuestos" : undefined}
                  style={{
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    padding: isSidebarCollapsed ? '14px 0' : '14px 18px',
                  }}
                >
                  <span style={{ fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>💰</span>
                  {!isSidebarCollapsed && <span>PRESUPUESTOS</span>}
                </button>
                <button
                  className={`menu-item ${activeTab === 'applications' ? 'active' : ''}`}
                  onClick={() => setActiveTab('applications')}
                  title={isSidebarCollapsed ? "Aplicaciones" : undefined}
                  style={{
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    padding: isSidebarCollapsed ? '14px 0' : '14px 18px',
                  }}
                >
                  <span style={{ fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>📱</span>
                  {!isSidebarCollapsed && <span>Aplicaciones</span>}
                </button>
              </nav>
            )}

            <div className="sidebar-footer" style={{ padding: isSidebarCollapsed ? '12px 8px' : '24px 20px 0 20px', position: 'relative' }}>
              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div style={{
                  position: 'absolute',
                  bottom: 'calc(100% - 10px)',
                  left: isSidebarCollapsed ? '10px' : '20px',
                  width: '260px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-lg), 0 8px 30px rgba(0,0,0,0.3)',
                  zIndex: 1000,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--text-primary)',
                  animation: 'fadeIn var(--transition-normal) forwards'
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                    <span style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center' }}>💻</span>
                    <strong style={{ fontSize: '0.92rem', fontWeight: 700 }}>Presupuestos.pe</strong>
                  </div>

                  {/* Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'center', margin: '4px 0' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Suscripción venció el: 05-05-2020</span>
                  </div>

                  {/* Promo Button */}
                  <button 
                    onClick={() => {
                      setActiveTab('profile-settings');
                      setIsUserMenuOpen(false);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #ff4500 0%, #ff6347 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      fontSize: '0.82rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'opacity 0.2s',
                      boxShadow: '0 4px 12px rgba(255, 69, 0, 0.2)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <span>🎁</span> Tenemos una oferta para ti
                  </button>

                  {/* Menu Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button 
                      onClick={() => {
                        setActiveTab('profile-settings');
                        setIsUserMenuOpen(false);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderRadius: '4px',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center' }}>⚙️</span> Configurar mi cuenta
                    </button>
                    <button 
                      onClick={() => {
                        setActiveTab('profile-settings');
                        setIsUserMenuOpen(false);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderRadius: '4px',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center' }}>⚙️</span> Cambiar mi contraseña
                    </button>
                    <button 
                      onClick={() => {
                        setActiveTab('profile-settings');
                        setIsUserMenuOpen(false);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderRadius: '4px',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center' }}>📅</span> Ampliar mi suscripción
                    </button>
                  </div>
                </div>
              )}

              <div 
                className="user-profile-badge" 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                style={{ 
                  marginBottom: '12px',
                  padding: isSidebarCollapsed ? '8px' : '10px 14px',
                  justifyContent: 'center',
                  border: isSidebarCollapsed ? 'none' : '1px solid var(--border-color)',
                  background: isSidebarCollapsed ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                  cursor: 'pointer'
                }}
                title={`${user.nombre} (${user.role})`}
              >
                <div className="avatar" style={{ margin: 0 }}>{user.nombre.substring(0, 2)}</div>
                {!isSidebarCollapsed && (
                  <div className="user-details">
                    <span className="user-name">{user.nombre}</span>
                    <span className="user-role">{user.role}</span>
                  </div>
                )}
              </div>
              <Button 
                variant="secondary" 
                onClick={logout} 
                style={{ 
                  width: '100%',
                  padding: isSidebarCollapsed ? '8px 0' : undefined,
                  fontSize: isSidebarCollapsed ? '1rem' : undefined,
                }}
                title={isSidebarCollapsed ? "Cerrar Sesión" : undefined}
              >
                {isSidebarCollapsed ? '🚪' : 'Cerrar Sesión'}
              </Button>
            </div>
          </aside>

          {/* Main Panel Content */}
          <main className="main-wrapper">
            {activeTab !== 'budgets' && (
              <header className="top-bar">
                <div className="page-title-section">
                  <h1 className="page-title">
                    {activeTab === 'dashboard' && 'Panel de Control Principal'}
                    {activeTab === 'companies' && 'Administración de Empresas'}
                    {activeTab === 'users' && 'Administración de Usuarios'}
                    {activeTab === 'logs' && 'Auditoría del Ecosistema'}
                    {activeTab === 'sync' && 'Motor de Sincronización Local'}
                    {activeTab === 'landing' && 'Configuración de Inicio'}
                    {activeTab === 'budgets' && 'PRESUPUESTOS'}
                    {activeTab === 'applications' && 'Aplicaciones Disponibles'}
                    {activeTab === 'profile-settings' && 'Perfil y Configuración de Cuenta'}
                  </h1>
                  <span className="page-subtitle">Ecosistema InfraSuite • Modos SSO activos</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.4rem',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'background 0.2s'
                    }}
                  >
                    {theme === 'dark' ? '☀️' : '🌙'}
                  </button>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Empresa: <strong style={{ color: 'var(--color-primary)' }}>
                      {user.role === 'SUPER_ADMIN' ? 'Suite Global' : companies.find(c => c.id === user.empresaId)?.nombre || 'Cargando...'}
                    </strong>
                  </span>
                </div>
              </header>
            )}

            {/* Tab router views */}
            <React.Fragment>
              {activeTab === 'dashboard' && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && <Dashboard onNavigate={(tab) => setActiveTab(tab)} />}
              {activeTab === 'companies' && user.role === 'SUPER_ADMIN' && <Companies />}
              {activeTab === 'landing' && user.role === 'SUPER_ADMIN' && <LandingAdmin />}
              {activeTab === 'users' && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && <Users />}
              {activeTab === 'logs' && user.role === 'SUPER_ADMIN' && <Logs />}
              {activeTab === 'budgets' && <Budgets theme={theme} toggleTheme={toggleTheme} companies={companies} />}
              {activeTab === 'applications' && <Applications />}
              {activeTab === 'profile-settings' && <ProfileSettings />}
              
              {activeTab === 'sync' && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
                <div className="content-container">
                  <div>
                      <h2>Motor de Sincronización (Eventos Offline)</h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Esta sección simula el almacenamiento SQLite local de cada módulo e ilustra cómo el Sync-Service consolida cambios con Firestore.
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                      {/* Local SQLite Database Panel */}
                      <Card title={`Base Local SQLite: ${syncModule}.db`} icon="💾">
                        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                          <Select
                            value={syncModule}
                            onChange={(e) => setSyncModule(e.target.value)}
                            options={[
                              { value: 'InfraCost', label: 'Módulo: InfraCost (Presupuestos)' },
                              { value: 'InfraGeo', label: 'Módulo: InfraGeo (Muestras de Suelo)' }
                            ]}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                          <Input
                            placeholder={syncModule === 'InfraCost' ? 'Nombre de Presupuesto (ej. Presupuesto Lote A)' : 'Código de Sondaje (ej. DH-01)'}
                            value={newLocalItemName}
                            onChange={(e) => setNewLocalItemName(e.target.value)}
                          />
                          <Button onClick={handleAddSQLiteRow}>Agregar Fila</Button>
                        </div>

                        {localRows.length === 0 ? (
                          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Base de datos SQLite local vacía. Registra filas arriba para simular cambios offline.
                          </div>
                        ) : (
                          <Table headers={['ID Local', syncModule === 'InfraCost' ? 'Presupuesto' : 'Muestra', syncModule === 'InfraCost' ? 'Monto' : 'Profundidad', 'Acciones']}>
                            {localRows.map((row) => (
                              <tr key={row.id}>
                                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.id}</td>
                                <td style={{ fontWeight: 600 }}>{row.nombre || row.codigo}</td>
                                <td>{row.monto ? `$${row.monto.toLocaleString()}` : row.profundidad}</td>
                                <td>
                                  <Button
                                    variant="danger"
                                    onClick={() => {
                                      const dbName = `${syncModule}.db`;
                                      const tableName = syncModule === 'InfraCost' ? 'budgets' : 'samples';
                                      getSQLiteDatabase(dbName).delete(tableName, row.id);
                                      loadLocalSQLiteData();
                                    }}
                                  >
                                    Borrar
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </Table>
                        )}
                      </Card>

                      {/* Sync Action and cloud preview */}
                      <Card title="Estatus de Sincronización en la Nube" icon="☁️">
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.4' }}>
                          Al presionar "Sincronizar", se dispararán los eventos de sincronización del monorepo, uniendo las tablas locales SQLite de su respectivo módulo con el Firestore central.
                        </p>
                        <div style={{ textAlign: 'center', padding: '24px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
                          <Button
                            variant="primary"
                            isLoading={isSyncing}
                            onClick={handleSyncNow}
                            style={{ padding: '14px 28px', fontSize: '1rem' }}
                          >
                            🔄 Sincronizar Cambios de {syncModule}
                          </Button>
                        </div>

                        <div>
                          <h4 style={{ marginBottom: '12px' }}>Historial en Firestore Cloud:</h4>
                          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', height: '200px', overflowY: 'auto' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Muestras en la nube (Firestore Colección: {syncModule === 'InfraCost' ? 'budgets_cloud' : 'samples_cloud'}):</span>
                            <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                              {db.getCollection(syncModule === 'InfraCost' ? 'budgets_cloud' : 'samples_cloud').map((cItem: any) => (
                                <li key={cItem.id} style={{ marginBottom: '6px' }}>
                                  <strong>{cItem.nombre || cItem.codigo}</strong> - {cItem.monto ? `$${cItem.monto.toLocaleString()}` : cItem.profundidad} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Sincronizado: {new Date(cItem._syncedAt).toLocaleTimeString()})</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </React.Fragment>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Main entry with Provider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
