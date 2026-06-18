import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Input, Select } from '@infrasuite/shared';
import { db } from '@infrasuite/firebase';
import { useAuth } from '@infrasuite/auth';

export const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals status
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'PROJECT_MANAGER' | 'ENGINEER' | 'VIEWER' | 'SUPER_ADMIN'>('ENGINEER');

  useEffect(() => {
    loadUsersAndCompanies();
  }, []);

  const loadUsersAndCompanies = async (shouldSetLoadingState = true) => {
    if (shouldSetLoadingState) setIsLoading(true);
    // Simulate database network lag
    await new Promise((resolve) => setTimeout(resolve, 800));

    const userList = await db.getDocs('users');
    const companyList = await db.getDocs('companies');
    
    setCompanies(companyList);
    
    // Map company names for users
    const mapped = userList.map((u) => {
      const comp = companyList.find((c) => c.id === u.empresaId);
      return {
        ...u,
        companyName: comp ? comp.nombre : (u.role === 'SUPER_ADMIN' ? 'Ecosistema InfraSuite' : 'Sin asignar')
      };
    });
    
    setUsers(mapped);
    if (shouldSetLoadingState) setIsLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      alert('Por favor completa los campos obligatorios.');
      return;
    }

    // Add User
    await db.addDoc('users', {
      uid: 'u_' + Math.random().toString(36).substring(2, 9),
      nombre: name,
      email,
      empresaId: role === 'SUPER_ADMIN' ? '' : selectedCompanyId,
      role
    });

    // Reset fields & reload
    setName('');
    setEmail('');
    setSelectedCompanyId('');
    setRole('ENGINEER');
    setIsCreateOpen(false);
    loadUsersAndCompanies();
  };

  const handleDeleteUser = async (uid: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      await db.deleteDoc('users', uid);
      loadUsersAndCompanies();
    }
  };

  // Build company select options
  const companyOptions = [
    { value: '', label: 'Seleccionar Empresa...' },
    ...companies.map((c) => ({ value: c.id, label: c.nombre }))
  ];

  return (
    <div className="content-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Gestión de Usuarios</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Registra nuevos integrantes, asígnalos a su respectiva empresa y configura su rol jerárquico.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>+ Nuevo Usuario</Button>
      </div>

      <Card>
        <Table headers={['Nombre Completo', 'Email Corporativo', 'Empresa / Entidad', 'Rol Asignado', 'Acciones']}>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 600 }}>
                  <div className="skeleton skeleton-text" style={{ width: '130px', height: '14px', margin: 0 }} />
                </td>
                <td style={{ fontFamily: 'monospace' }}>
                  <div className="skeleton skeleton-text" style={{ width: '180px', height: '14px', margin: 0 }} />
                </td>
                <td>
                  <div className="skeleton skeleton-text" style={{ width: '120px', height: '14px', margin: 0 }} />
                </td>
                <td>
                  <div className="skeleton" style={{ width: '80px', height: '22px', borderRadius: '10px' }} />
                </td>
                <td>
                  <div className="skeleton" style={{ width: '70px', height: '32px', borderRadius: '6px' }} />
                </td>
              </tr>
            ))
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No hay usuarios registrados.
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.uid}>
                <td style={{ fontWeight: 600 }}>{u.nombre}</td>
                <td style={{ fontFamily: 'monospace' }}>{u.email}</td>
                <td>{u.companyName}</td>
                <td>
                  {isSuperAdmin ? (
                    <select
                      value={u.role}
                      onChange={async (e) => {
                        const newRole = e.target.value as any;
                        await db.updateDoc('users', u.uid, { role: newRole });
                        loadUsersAndCompanies(false);
                      }}
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
                        fontFamily: 'var(--font-sans)'
                      }}
                    >
                      <option value="SUPER_ADMIN" style={{ background: '#0c0e15', color: 'var(--text-primary)' }}>SUPER_ADMIN</option>
                      <option value="ADMIN" style={{ background: '#0c0e15', color: 'var(--text-primary)' }}>ADMIN</option>
                      <option value="PROJECT_MANAGER" style={{ background: '#0c0e15', color: 'var(--text-primary)' }}>PROJECT_MANAGER</option>
                      <option value="ENGINEER" style={{ background: '#0c0e15', color: 'var(--text-primary)' }}>ENGINEER</option>
                      <option value="VIEWER" style={{ background: '#0c0e15', color: 'var(--text-primary)' }}>VIEWER</option>
                    </select>
                  ) : (
                    <span className={`badge ${u.role === 'SUPER_ADMIN' ? 'btn-primary' : 'badge-role'}`}>
                      {u.role}
                    </span>
                  )}
                </td>
                <td>
                  <Button variant="danger" onClick={() => handleDeleteUser(u.uid)}>
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))
          )}
        </Table>
      </Card>

      {/* Modal - Create User */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Agregar Nuevo Usuario">
        <form onSubmit={handleCreateUser} className="login-form">
          <Input
            label="Nombre Completo *"
            placeholder="Ej. Ing. Juan Pérez"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="email"
            label="Correo Electrónico *"
            placeholder="Ej. juan.perez@alfa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Select
            label="Rol de Permisos"
            value={role}
            onChange={(e: any) => {
              const selectedRole = e.target.value;
              setRole(selectedRole);
              if (selectedRole === 'SUPER_ADMIN') {
                setSelectedCompanyId('');
              }
            }}
            options={[
              { value: 'SUPER_ADMIN', label: 'SUPER_ADMIN (Control de Suite completo)' },
              { value: 'ADMIN', label: 'ADMIN (Controlador de Empresa)' },
              { value: 'PROJECT_MANAGER', label: 'PROJECT_MANAGER (Gestor de Proyectos)' },
              { value: 'ENGINEER', label: 'ENGINEER (Editor técnico)' },
              { value: 'VIEWER', label: 'VIEWER (Solo Lectura)' }
            ]}
          />
          {role !== 'SUPER_ADMIN' && (
            <Select
              label="Empresa Asociada *"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              options={companyOptions}
              required
            />
          )}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)} style={{ flex: 1 }}>
              Cancelar
            </Button>
            <Button type="submit" style={{ flex: 1 }}>
              Crear Usuario
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
