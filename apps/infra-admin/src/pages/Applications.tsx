import React, { useState, useEffect } from 'react';
import { Card, Button } from '@infrasuite/shared';
import { db } from '@infrasuite/firebase';
import { useAuth } from '@infrasuite/auth';
import { 
  getCompanyModules, 
  activateModuleForCompany, 
  deactivateModuleForCompany 
} from '@infrasuite/license-service';
import { motion, AnimatePresence } from 'framer-motion';

interface ApplicationsProps {
  onModulesChanged?: () => void;
}

export const Applications: React.FC<ApplicationsProps> = ({ onModulesChanged }) => {
  const { user } = useAuth();
  const [allModules, setAllModules] = useState<any[]>([]);
  const [companyModules, setCompanyModules] = useState<string[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Premium modal confirmation state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'install' | 'uninstall' | null;
    moduloCodigo: string;
    displayName: string;
    isExecuting: boolean;
  }>({
    isOpen: false,
    type: null,
    moduloCodigo: '',
    displayName: '',
    isExecuting: false
  });

  const loadModulesForCompany = async (companyId: string) => {
    try {
      const activeList = await getCompanyModules(companyId);
      setCompanyModules(activeList);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const loadAppData = async () => {
      setIsLoading(true);
      try {
        const modulesList = await db.getDocs('modules');
        setAllModules(modulesList);

        if (user) {
          if (user.role === 'SUPER_ADMIN') {
            const companyList = await db.getDocs('companies');
            setCompanies(companyList);
            const initialId = companyList[0]?.id || 'c1';
            setSelectedCompanyId(initialId);
            await loadModulesForCompany(initialId);
          } else {
            setSelectedCompanyId(user.empresaId);
            await loadModulesForCompany(user.empresaId);
          }
        }
      } catch (e) {
        console.error(e);
      }
      setIsLoading(false);
    };

    loadAppData();
  }, [user]);

  const handleCompanyChange = async (e: any) => {
    const cid = e.target.value;
    setSelectedCompanyId(cid);
    await loadModulesForCompany(cid);
  };

  const executeAction = async () => {
    if (!confirmModal.type || !confirmModal.moduloCodigo) return;
    
    setConfirmModal(prev => ({ ...prev, isExecuting: true }));
    const moduloCodigo = confirmModal.moduloCodigo;
    const targetCid = selectedCompanyId || user?.empresaId || 'c1';

    try {
      // Simulate premium delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 800));

      if (confirmModal.type === 'install') {
        await activateModuleForCompany(targetCid, moduloCodigo);
      } else {
        await deactivateModuleForCompany(targetCid, moduloCodigo);
      }

      await loadModulesForCompany(targetCid);
      if (onModulesChanged) {
        onModulesChanged();
      }
      
      // Close modal on success
      setConfirmModal({
        isOpen: false,
        type: null,
        moduloCodigo: '',
        displayName: '',
        isExecuting: false
      });
    } catch (e) {
      console.error(e);
      alert(`Error al procesar la solicitud para el módulo ${moduloCodigo}.`);
      setConfirmModal(prev => ({ ...prev, isExecuting: false }));
    }
  };

  const appMeta: { [key: string]: { icon: string; desc: string; color: string; gradient: string } } = {
    'INFRACOST': {
      icon: '💰',
      desc: 'Gestión clásica de presupuestos de obra y Análisis de Precios Unitarios (APU) esenciales.',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)'
    },
    'INFRACOST_PRO': {
      icon: '📊',
      desc: 'Presupuestos de obra profesionales con pantalla dividida (Spreadsheet + Especificaciones y Asistente IA Gemini integrado).',
      color: '#00f0ff',
      gradient: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(0, 110, 255, 0.05) 100%)'
    },
    'INFRASEACE': {
      icon: '🏢',
      desc: 'Monitoreo inteligente de licitaciones públicas de SEACE, alertas de convocatorias y seguimiento de bases de concurso.',
      color: '#a855f7',
      gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)'
    },
    'INFRASTRUCT': {
      icon: '📐',
      desc: 'Cálculo estructural avanzado, modelado de pórticos 2D/3D y análisis sismorresistente integrado en la nube.',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'
    },
    'INFRADOCS': {
      icon: '📁',
      desc: 'Control de documentación de obra, firmas digitales, planos, valorizaciones y cuadernos de obra electrónicos centralizados.',
      color: '#eab308',
      gradient: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(202, 138, 4, 0.05) 100%)'
    },
    'INFRAGEO': {
      icon: '🕳️',
      desc: 'Mapeo geotécnico en campo, modelado de sondajes y registro de ensayos de mecánica de suelos.',
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(219, 39, 119, 0.05) 100%)'
    },
    'INFRABIM': {
      icon: '📐',
      desc: 'Visualización y coordinación en tiempo real de modelos 3D en formato IFC/BIM en la nube.',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)'
    },
    'INFRACONTROL': {
      icon: '📈',
      desc: 'Seguimiento financiero, valorizaciones mensuales, gestión de adicionales y Curvas S automáticas.',
      color: '#f97316',
      gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)'
    },
    'INFRAFIELD': {
      icon: '📋',
      desc: 'Supervisión en obra, reportes fotográficos con geolocalización y cuaderno de incidencias offline.',
      color: '#06b6d4',
      gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(8, 145, 178, 0.05) 100%)'
    },
    'INFRAAI': {
      icon: '🧠',
      desc: 'Predicciones y análisis de riesgo mediante Inteligencia Artificial para evitar retrasos y sobrecostos.',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)'
    },
    'INFRAADMIN': {
      icon: '🛡️',
      desc: 'Consola de administración global, auditorías, roles de seguridad y control de licenciamiento.',
      color: '#64748b',
      gradient: 'linear-gradient(135deg, rgba(100, 116, 139, 0.1) 0%, rgba(71, 85, 105, 0.05) 100%)'
    }
  };

  const getDisplayModules = () => {
    const dbCodes = new Set(allModules.map(m => m.codigo.toUpperCase()));
    const displayList = [...allModules];
    
    Object.keys(appMeta).forEach(code => {
      if (!dbCodes.has(code)) {
        displayList.push({
          codigo: code,
          nombre: code === 'INFRACOST' ? 'InfraCost Lite' : (code === 'INFRACOST_PRO' ? 'InfraCost Pro' : code.charAt(0) + code.slice(1).toLowerCase()),
          ficticio: true
        });
      }
    });
    return displayList;
  };

  return (
    <div className="content-container">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2>Tienda de Aplicaciones (Ecosistema InfraSuite)</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Visualiza e instala las aplicaciones del ecosistema en tu panel de control corporativo.
          </p>
        </div>

        {user?.role === 'SUPER_ADMIN' && companies.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Administrar Empresa:</span>
            <select
              value={selectedCompanyId}
              onChange={handleCompanyChange}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                outline: 'none'
              }}
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx}>
              <div style={{ padding: '8px' }}>
                <div className="skeleton" style={{ height: '32px', width: '50px', borderRadius: '4px', marginBottom: '16px' }} />
                <div className="skeleton skeleton-text" style={{ width: '150px', height: '18px', marginBottom: '8px' }} />
                <div className="skeleton skeleton-text" style={{ width: '90%', height: '14px', marginBottom: '6px' }} />
                <div className="skeleton skeleton-text" style={{ width: '70%', height: '14px', marginBottom: '20px' }} />
                <div className="skeleton" style={{ height: '38px', width: '120px', borderRadius: '6px' }} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {getDisplayModules().map((modulo) => {
            const moduloCodigoUpper = modulo.codigo.toUpperCase();
            const isInstalled = companyModules.some(code => code.toUpperCase() === moduloCodigoUpper);
            const meta = appMeta[moduloCodigoUpper] || {
              icon: '⚙️',
              desc: modulo.nombre,
              color: '#94a3b8',
              gradient: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)'
            };

            return (
              <Card 
                key={modulo.codigo} 
                style={{
                  background: meta.gradient,
                  border: isInstalled ? `1px solid rgba(0, 240, 255, 0.18)` : '1px solid var(--border-color)',
                  boxShadow: isInstalled ? '0 4px 20px rgba(0, 240, 255, 0.04)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                  minHeight: '270px',
                  transition: 'all 0.25s ease'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '2rem' }}>{meta.icon}</span>
                    <span 
                      className={`badge badge-${isInstalled ? 'activo' : 'suspendido'}`}
                      style={{
                        background: isInstalled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                        border: isInstalled ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(244, 63, 94, 0.25)',
                        color: isInstalled ? 'var(--color-success)' : 'var(--color-danger)',
                        fontSize: '0.75rem',
                        padding: '4px 10px',
                        fontWeight: 'bold',
                        borderRadius: '4px'
                      }}
                    >
                      {isInstalled ? '✓ INSTALADO' : '🔒 INACTIVO'}
                    </span>
                  </div>

                  <div>
                    <h3 style={{ margin: '0 0 6px 0', color: isInstalled ? meta.color : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {modulo.nombre || (modulo.codigo === 'INFRACOST' ? 'InfraCost Lite' : (modulo.codigo === 'INFRACOST_PRO' ? 'InfraCost Pro' : modulo.codigo))}
                      {modulo.ficticio && (
                        <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', color: 'var(--text-muted)' }}>
                          Catálogo
                        </span>
                      )}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {meta.desc}
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {isInstalled ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button 
                        onClick={() => alert(`Cargando consola segura de ${modulo.nombre || modulo.codigo}...`)}
                        style={{
                          background: `linear-gradient(135deg, ${meta.color} 0%, rgba(255,255,255,0.05) 100%)`,
                          border: 'none',
                          color: '#121622',
                          fontWeight: 'bold',
                          flex: 2
                        }}
                      >
                        Abrir
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => setConfirmModal({
                          isOpen: true,
                          type: 'uninstall',
                          moduloCodigo: modulo.codigo,
                          displayName: modulo.nombre || (modulo.codigo === 'INFRACOST' ? 'InfraCost Lite' : (modulo.codigo === 'INFRACOST_PRO' ? 'InfraCost Pro' : modulo.codigo)),
                          isExecuting: false
                        })}
                        style={{ flex: 1, padding: '10px 0' }}
                      >
                        Desinstalar
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => setConfirmModal({
                        isOpen: true,
                        type: 'install',
                        moduloCodigo: modulo.codigo,
                        displayName: modulo.nombre || (modulo.codigo === 'INFRACOST' ? 'InfraCost Lite' : (modulo.codigo === 'INFRACOST_PRO' ? 'InfraCost Pro' : modulo.codigo)),
                        isExecuting: false
                      })}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        fontWeight: '600',
                        width: '100%'
                      }}
                    >
                      Instalar Aplicación
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Premium Confirm Modal Dialog */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(5, 7, 12, 0.75)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 220 }}
              style={{
                width: '100%',
                maxWidth: '460px',
                background: 'var(--bg-surface-elevated)',
                border: `1px solid ${confirmModal.type === 'install' ? 'rgba(0, 240, 255, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px ${confirmModal.type === 'install' ? 'rgba(0, 240, 255, 0.05)' : 'rgba(239, 68, 68, 0.05)'}`,
                borderRadius: '16px',
                padding: '28px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Top accent glow line */}
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: confirmModal.type === 'install' ? 'linear-gradient(90deg, #00f0ff, #3b82f6)' : 'linear-gradient(90deg, #ef4444, #b91c1c)'
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px' }}>
                {/* Visual Icon Badge */}
                <motion.div
                  animate={confirmModal.isExecuting ? { rotate: 360 } : {}}
                  transition={confirmModal.isExecuting ? { repeat: Infinity, duration: 1.5, ease: 'linear' } : {}}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: confirmModal.type === 'install' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${confirmModal.type === 'install' ? 'rgba(0, 240, 255, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    color: confirmModal.type === 'install' ? '#00f0ff' : '#ef4444'
                  }}
                >
                  {confirmModal.isExecuting ? '⏳' : (confirmModal.type === 'install' ? '📥' : '🗑️')}
                </motion.div>

                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
                    {confirmModal.type === 'install' ? 'Confirmar Instalación' : 'Confirmar Desinstalación'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {confirmModal.type === 'install' 
                      ? `¿Estás seguro de que deseas habilitar e instalar el módulo "${confirmModal.displayName}" en el espacio de la empresa seleccionada?` 
                      : `¿Estás seguro de que deseas desactivar y desinstalar el módulo "${confirmModal.displayName}"? Los accesos de los usuarios serán revocados.`}
                  </p>
                </div>

                {/* Company Context Badge */}
                <div 
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    width: '100%',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)'
                  }}
                >
                  Empresa Objetivo: <strong style={{ color: 'var(--color-primary)' }}>
                    {companies.find(c => c.id === (selectedCompanyId || user?.empresaId || 'c1'))?.nombre || 'Empresa'}
                  </strong>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
                  <Button
                    variant="secondary"
                    onClick={() => setConfirmModal({ isOpen: false, type: null, moduloCodigo: '', displayName: '', isExecuting: false })}
                    disabled={confirmModal.isExecuting}
                    style={{ flex: 1 }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={executeAction}
                    isLoading={confirmModal.isExecuting}
                    style={{
                      flex: 1,
                      background: confirmModal.type === 'install' ? 'var(--color-primary)' : '#ef4444',
                      border: 'none',
                      color: confirmModal.type === 'install' ? '#121622' : '#ffffff',
                      fontWeight: 'bold'
                    }}
                  >
                    {confirmModal.type === 'install' ? 'Sí, Instalar' : 'Sí, Desinstalar'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
