import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Input } from '@infrasuite/shared';
import { db } from '@infrasuite/firebase';
import { useAuth } from '@infrasuite/auth';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [metrics, setMetrics] = useState({
    companies: 0,
    users: 0,
    licenses: 0,
    modules: 0
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Users state for quick role administration
  const [usersList, setUsersList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    // Simulate real Firestore database loading delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const companies = await db.getDocs('companies');
    const users = await db.getDocs('users');
    const licenses = await db.getDocs('licenses');
    const modules = await db.getDocs('modules');
    const logs = await db.getDocs('logs');

    setMetrics({
      companies: companies.length,
      users: users.length,
      licenses: licenses.filter((l) => new Date(l.vencimiento) > new Date()).length,
      modules: modules.filter((m) => m.activo).length
    });

    // Sort logs descending by timestamp and take last 5
    const sortedLogs = [...logs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
    setRecentLogs(sortedLogs);

    // Map company names for users
    const mappedUsers = users
      .filter((u) => u && u.uid && u.email)
      .map((u) => {
        const comp = companies.find((c) => c.id === u.empresaId);
        return {
          ...u,
          companyName: comp ? comp.nombre : (u.role === 'SUPER_ADMIN' ? 'Ecosistema InfraSuite' : 'Sin asignar')
        };
      });
    setUsersList(mappedUsers);

    setIsLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRoleChange = async (targetUser: any, newRole: any) => {
    setUpdatingUid(targetUser.uid);
    try {
      await db.updateDoc('users', targetUser.uid, { role: newRole });
      
      // Log the change
      await db.addDoc('logs', {
        timestamp: new Date().toISOString(),
        usuario: user?.nombre || 'Super Administrador',
        accion: 'Cambio de Rol',
        detalle: `Rol de ${targetUser.nombre} cambiado a ${newRole}`
      });

      setToastMessage(`¡Rol de ${targetUser.nombre} actualizado a ${newRole}!`);
      setTimeout(() => setToastMessage(null), 3000);

      // Reload dashboard data
      const companies = await db.getDocs('companies');
      const users = await db.getDocs('users');
      const logs = await db.getDocs('logs');
      const licenses = await db.getDocs('licenses');
      const modules = await db.getDocs('modules');

      setMetrics({
        companies: companies.length,
        users: users.length,
        licenses: licenses.filter((l) => new Date(l.vencimiento) > new Date()).length,
        modules: modules.filter((m) => m.activo).length
      });

      const sortedLogs = [...logs]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
      setRecentLogs(sortedLogs);

      const mappedUsers = users
        .filter((u) => u && u.uid && u.email)
        .map((u) => {
          const comp = companies.find((c) => c.id === u.empresaId);
          return {
            ...u,
            companyName: comp ? comp.nombre : (u.role === 'SUPER_ADMIN' ? 'Ecosistema InfraSuite' : 'Sin asignar')
          };
        });
      setUsersList(mappedUsers);
    } catch (error) {
      console.error(error);
      alert('Error al actualizar el rol.');
    } finally {
      setUpdatingUid(null);
    }
  };

  const handleRunBackup = async () => {
    setIsBackupLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Log the backup activity
    await db.addDoc('logs', {
      timestamp: new Date().toISOString(),
      usuario: 'Super Administrador',
      accion: 'Respaldo del Sistema',
      detalle: 'Respaldo completo de base de datos Firestore y configuraciones locales ejecutada con éxito.'
    });

    // Reload logs
    const logs = await db.getDocs('logs');
    const sortedLogs = [...logs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
    setRecentLogs(sortedLogs);

    setIsBackupLoading(false);
    alert('¡Respaldo completo del sistema generado con éxito!');
  };

  const filteredUsers = usersList.filter((u) => {
    if (!u) return false;
    return (
      (u.nombre || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
      (u.email || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    );
  });

  return (
    <div className="content-container">
      {/* Overview Cards */}
      <div className="metrics-grid">
        <div className="card metric-card metric-primary" onClick={() => onNavigate('companies')} style={{ cursor: 'pointer' }}>
          <div className="metric-info">
            <span className="metric-label">Empresas</span>
            <span className="metric-val">
              {isLoading ? (
                <div className="skeleton" style={{ height: '2.2rem', width: '50px', margin: '4px 0', borderRadius: '4px' }} />
              ) : (
                metrics.companies
              )}
            </span>
          </div>
          <div className="metric-icon-box">🏢</div>
        </div>

        <div className="card metric-card metric-secondary" onClick={() => onNavigate('users')} style={{ cursor: 'pointer' }}>
          <div className="metric-info">
            <span className="metric-label">Usuarios Activos</span>
            <span className="metric-val">
              {isLoading ? (
                <div className="skeleton" style={{ height: '2.2rem', width: '50px', margin: '4px 0', borderRadius: '4px' }} />
              ) : (
                metrics.users
              )}
            </span>
          </div>
          <div className="metric-icon-box">👥</div>
        </div>

        <div className="card metric-card metric-success">
          <div className="metric-info">
            <span className="metric-label">Licencias Activas</span>
            <span className="metric-val">
              {isLoading ? (
                <div className="skeleton" style={{ height: '2.2rem', width: '50px', margin: '4px 0', borderRadius: '4px' }} />
              ) : (
                metrics.licenses
              )}
            </span>
          </div>
          <div className="metric-icon-box">🔑</div>
        </div>

        <div className="card metric-card">
          <div className="metric-info">
            <span className="metric-label">Módulos InfraSuite</span>
            <span className="metric-val">
              {isLoading ? (
                <div className="skeleton" style={{ height: '2.2rem', width: '50px', margin: '4px 0', borderRadius: '4px' }} />
              ) : (
                metrics.modules
              )}
            </span>
          </div>
          <div className="metric-icon-box">⚙️</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        {/* Recent Activity Log */}
        <Card title="Actividad Reciente del Ecosistema" icon="⚡">
          <Table headers={['Fecha / Hora', 'Usuario', 'Acción', 'Detalle']}>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
                  <td className="log-row-timestamp">
                    <div className="skeleton skeleton-text" style={{ width: '130px', height: '14px', margin: 0 }} />
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    <div className="skeleton skeleton-text" style={{ width: '80px', height: '14px', margin: 0 }} />
                  </td>
                  <td>
                    <div className="skeleton" style={{ width: '80px', height: '22px', borderRadius: '10px' }} />
                  </td>
                  <td className="log-row-detail">
                    <div className="skeleton skeleton-text" style={{ width: '90%', height: '14px', margin: 0 }} />
                  </td>
                </tr>
              ))
            ) : recentLogs.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay actividades registradas.
                </td>
              </tr>
            ) : (
              recentLogs.map((log) => (
                <tr key={log.id}>
                  <td className="log-row-timestamp">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 600 }}>{log.usuario}</td>
                  <td>
                    <span className="badge badge-secondary">{log.accion}</span>
                  </td>
                  <td className="log-row-detail">{log.detalle}</td>
                </tr>
              ))
            )}
          </Table>
          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <Button variant="secondary" onClick={() => onNavigate('logs')}>
              Ver todos los logs →
            </Button>
          </div>
        </Card>

        {/* Global actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card title="Respaldos y Mantenimiento" icon="💾">
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.4' }}>
              Genera copias de seguridad de las configuraciones compartidas de Firestore y bases locales de módulos para recuperación ante fallos.
            </p>
            <Button
              variant="primary"
              style={{ width: '100%' }}
              isLoading={isBackupLoading}
              onClick={handleRunBackup}
            >
              Ejecutar Respaldo Completo
            </Button>
          </Card>

          <Card title="Estado del Servidor" icon="🟢">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Firestore Core:</span>
                <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>Conectado (Mock)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>SSO Server:</span>
                <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>Operativo</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Sincronización:</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Listo</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {isSuperAdmin && (
        <Card title="Gestión Rápida de Roles (Superadmin)" icon="🛡️" style={{ marginTop: '32px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Cambia los roles jerárquicos de cualquier usuario de InfraSuite de manera inmediata. Los cambios afectarán su acceso a todos los módulos y se auditarán automáticamente.
          </p>

          {toastMessage && (
            <div style={{
              background: 'rgba(0, 240, 255, 0.1)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              color: 'var(--color-primary)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 500
            }}>
              <span>🔔</span> {toastMessage}
            </div>
          )}

          <div style={{ marginBottom: '20px', maxWidth: '400px' }}>
            <Input
              placeholder="🔍 Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <Table headers={['Usuario', 'Email', 'Empresa / Entidad', 'Rol Asignado']}>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx}>
                    <td><div className="skeleton skeleton-text" style={{ width: '120px', height: '14px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '160px', height: '14px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '120px', height: '14px' }} /></td>
                    <td><div className="skeleton" style={{ width: '80px', height: '22px', borderRadius: '10px' }} /></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron usuarios que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.uid} style={{ opacity: updatingUid === u.uid ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                    <td style={{ fontWeight: 600 }}>{u.nombre}</td>
                    <td style={{ fontFamily: 'monospace' }}>{u.email}</td>
                    <td>{u.companyName}</td>
                    <td>
                      <select
                        value={u.role}
                        disabled={updatingUid === u.uid}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        style={{
                          background: 'rgba(0, 240, 255, 0.05)',
                          border: '1px solid rgba(0, 240, 255, 0.25)',
                          color: 'var(--color-primary)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '4px 8px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          outline: 'none',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                          width: '100%',
                          maxWidth: '180px'
                        }}
                      >
                        <option value="SUPER_ADMIN" style={{ background: '#0c0e15', color: 'var(--text-primary)' }}>SUPER_ADMIN</option>
                        <option value="ADMIN" style={{ background: '#0c0e15', color: 'var(--text-primary)' }}>ADMIN</option>
                        <option value="PROJECT_MANAGER" style={{ background: '#0c0e15', color: 'var(--text-primary)' }}>PROJECT_MANAGER</option>
                        <option value="ENGINEER" style={{ background: '#0c0e15', color: 'var(--text-primary)' }}>ENGINEER</option>
                        <option value="VIEWER" style={{ background: '#0c0e15', color: 'var(--text-primary)' }}>VIEWER</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
};
