import React, { useState, useEffect } from 'react';
import { Card, Button } from '@infrasuite/shared';
import { db } from '@infrasuite/firebase';
import { useAuth } from '@infrasuite/auth';
import { getCompanyModules } from '@infrasuite/license-service';

export const Applications: React.FC = () => {
  const { user } = useAuth();
  const [allModules, setAllModules] = useState<any[]>([]);
  const [companyModules, setCompanyModules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAppData = async () => {
      setIsLoading(true);
      try {
        // Load all system modules
        const modulesList = await db.getDocs('modules');
        setAllModules(modulesList);

        // Load company active modules if not super admin
        if (user && user.role !== 'SUPER_ADMIN') {
          const activeList = await getCompanyModules(user.empresaId);
          setCompanyModules(activeList);
        } else if (user && user.role === 'SUPER_ADMIN') {
          // Super admin has access to everything
          setCompanyModules(modulesList.map((m: any) => m.codigo));
        }
      } catch (e) {
        console.error(e);
      }
      setIsLoading(false);
    };

    loadAppData();
  }, [user]);

  // Premium App Meta Info for visual excellence (Full Catalog)
  const appMeta: { [key: string]: { icon: string; desc: string; color: string; gradient: string } } = {
    'INFRACOST': {
      icon: '📊',
      desc: 'Gestión de presupuestos de obra, análisis de precios unitarios (APU), gastos generales y programación con diagramas de Gantt.',
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

  // Combine database modules with extra fictional catalog apps to ensure all of them appear
  const getDisplayModules = () => {
    const dbCodes = new Set(allModules.map(m => m.codigo.toUpperCase()));
    const displayList = [...allModules];
    
    Object.keys(appMeta).forEach(code => {
      if (!dbCodes.has(code)) {
        displayList.push({
          codigo: code,
          nombre: code.charAt(0) + code.slice(1).toLowerCase(),
          ficticio: true
        });
      }
    });
    return displayList;
  };

  return (
    <div className="content-container">
      <div style={{ marginBottom: '24px' }}>
        <h2>Tienda de Aplicaciones (Ecosistema InfraSuite)</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Visualiza las aplicaciones disponibles en la plataforma. Para instalar una aplicación nueva en tu panel, el Super Administrador debe habilitar el acceso a tu empresa.
        </p>
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
            const isInstalled = user?.role === 'SUPER_ADMIN' || companyModules.some(code => code.toUpperCase() === moduloCodigoUpper);
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
                  border: isInstalled ? `1px solid rgba(0, 240, 255, 0.15)` : '1px solid var(--border-color)',
                  boxShadow: isInstalled ? '0 4px 20px rgba(0, 240, 255, 0.03)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                  minHeight: '260px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Top header: Icon + Status */}
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
                      {isInstalled ? '✓ ACCESO CONCEDIDO' : '🔒 REQUIERE ACCESO'}
                    </span>
                  </div>

                  {/* App info */}
                  <div>
                    <h3 style={{ margin: '0 0 6px 0', color: isInstalled ? meta.color : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {modulo.codigo}
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

                {/* Footer action button */}
                <div style={{ marginTop: '20px' }}>
                  {isInstalled ? (
                    <Button 
                      onClick={() => alert(`Cargando consola segura de ${modulo.codigo}...`)}
                      style={{
                        background: `linear-gradient(135deg, ${meta.color} 0%, rgba(255,255,255,0.05) 100%)`,
                        border: 'none',
                        color: '#121622',
                        fontWeight: 'bold',
                        width: '100%'
                      }}
                    >
                      Abrir Aplicación
                    </Button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        disabled
                        style={{
                          width: '100%',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px dashed var(--border-color)',
                          color: 'var(--text-muted)',
                          padding: '10px',
                          borderRadius: '6px',
                          cursor: 'not-allowed',
                          fontSize: '0.88rem',
                          fontWeight: 600
                        }}
                      >
                        Bloqueado por Licencia
                      </button>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', display: 'block' }}>
                        * Solicita el alta del módulo a tu Super Administrador.
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
