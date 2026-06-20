import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Input } from '@infrasuite/shared';
import { db } from '@infrasuite/firebase';
import { useAuth } from '@infrasuite/auth';

interface Contact {
  id: string;
  nombre: string;
  email: string;
  status: 'Activo' | 'Invitado';
  empresa?: string;
  addedAt: string;
}

export const Contacts: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [foundUser, setFoundUser] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      // Load contacts from simulated collection or initialize if empty
      let storedContacts = await db.getDocs('contacts');
      // Filter contacts belonging to current user
      const userContacts = storedContacts.filter((c: any) => c.ownerUid === currentUser?.uid);
      
      if (userContacts.length === 0 && storedContacts.length === 0) {
        // Seed some initial contacts for demo
        const defaultContacts: any[] = [
          {
            id: 'c_demo_1',
            ownerUid: currentUser?.uid || 'u1',
            nombre: 'Diana Flores',
            email: 'diana@alfa.com',
            status: 'Activo',
            empresa: 'Constructora Alfa S.A.',
            addedAt: new Date().toLocaleDateString()
          },
          {
            id: 'c_demo_2',
            ownerUid: currentUser?.uid || 'u1',
            nombre: 'Ing. Sofia Rodriguez',
            email: 'sofia@delta.com',
            status: 'Activo',
            empresa: 'Mecánica de Suelos Delta',
            addedAt: new Date().toLocaleDateString()
          }
        ];
        for (const c of defaultContacts) {
          await db.addDoc('contacts', c);
        }
        setContacts(defaultContacts);
      } else {
        setContacts(userContacts);
      }
    } catch {
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail) return;

    try {
      const allUsers = await db.getDocs('users');
      const match = allUsers.find(
        (u: any) => u.email && u.email.toLowerCase() === searchEmail.toLowerCase()
      );
      
      if (match) {
        // Fetch company info
        const companies = await db.getDocs('companies');
        const comp = companies.find((c: any) => c.id === match.empresaId);
        setFoundUser({
          ...match,
          companyName: comp ? comp.nombre : 'Sin asignar'
        });
      } else {
        setFoundUser(null);
      }
      setHasSearched(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddExisting = async () => {
    if (!foundUser) return;
    
    // Check if already in contacts
    const exists = contacts.some((c) => c.email.toLowerCase() === foundUser.email.toLowerCase());
    if (exists) {
      alert('Este usuario ya está en tu lista de contactos.');
      return;
    }

    const newContact: any = {
      id: 'c_' + Math.random().toString(36).substring(2, 9),
      ownerUid: currentUser?.uid || 'u1',
      nombre: foundUser.nombre,
      email: foundUser.email,
      status: 'Activo',
      empresa: foundUser.companyName,
      addedAt: new Date().toLocaleDateString()
    };

    await db.addDoc('contacts', newContact);
    alert(`Se agregó a ${foundUser.nombre} a tus contactos.`);
    
    // Reset modal state
    setIsAddModalOpen(false);
    setSearchEmail('');
    setFoundUser(null);
    setHasSearched(false);
    loadContacts();
  };

  const handleSendInvite = async () => {
    if (!searchEmail) return;
    if (!inviteName) {
      alert('Por favor ingresa el nombre de la persona a invitar.');
      return;
    }

    // Check if already in contacts
    const exists = contacts.some((c) => c.email.toLowerCase() === searchEmail.toLowerCase());
    if (exists) {
      alert('Este contacto ya se encuentra en tu lista.');
      return;
    }

    const newContact: any = {
      id: 'c_' + Math.random().toString(36).substring(2, 9),
      ownerUid: currentUser?.uid || 'u1',
      nombre: inviteName,
      email: searchEmail,
      status: 'Invitado',
      empresa: 'Pendiente de Registro',
      addedAt: new Date().toLocaleDateString()
    };

    await db.addDoc('contacts', newContact);
    alert(`Invitación por correo enviada exitosamente a ${inviteName} (${searchEmail}).`);
    
    // Reset modal state
    setIsAddModalOpen(false);
    setSearchEmail('');
    setInviteName('');
    setFoundUser(null);
    setHasSearched(false);
    loadContacts();
  };

  const handleDeleteContact = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar a ${name} de tus contactos?`)) {
      await db.deleteDoc('contacts', id);
      loadContacts();
    }
  };

  return (
    <div className="content-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <h2>Contactos de Trabajo</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Gestiona tus colaboradores en el ecosistema InfraSuite. Comparte presupuestos o planes directamente con ellos.
          </p>
        </div>
        <Button onClick={() => { setIsAddModalOpen(true); setHasSearched(false); setFoundUser(null); setSearchEmail(''); }}>
          + Agregar / Invitar
        </Button>
      </div>

      <Card>
        <Table headers={['Nombre', 'Correo Electrónico', 'Empresa / Entidad', 'Estado', 'Fecha de Registro', 'Acciones']}>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <tr key={idx}>
                <td><div className="skeleton skeleton-text" style={{ width: '120px', height: '14px' }} /></td>
                <td><div className="skeleton skeleton-text" style={{ width: '180px', height: '14px' }} /></td>
                <td><div className="skeleton skeleton-text" style={{ width: '140px', height: '14px' }} /></td>
                <td><div className="skeleton" style={{ width: '80px', height: '22px', borderRadius: '10px' }} /></td>
                <td><div className="skeleton skeleton-text" style={{ width: '80px', height: '14px' }} /></td>
                <td><div className="skeleton" style={{ width: '80px', height: '32px', borderRadius: '6px' }} /></td>
              </tr>
            ))
          ) : contacts.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No tienes contactos agregados en tu cuenta. ¡Agrega a tu equipo o invítalos por correo!
              </td>
            </tr>
          ) : (
            contacts.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                <td style={{ fontFamily: 'monospace' }}>{c.email}</td>
                <td>{c.empresa || 'Sin empresa'}</td>
                <td>
                  <span
                    className={`badge`}
                    style={{
                      background: c.status === 'Activo' ? 'rgba(31, 154, 85, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                      color: c.status === 'Activo' ? '#1f9a55' : '#f97316',
                      border: c.status === 'Activo' ? '1px solid rgba(31, 154, 85, 0.3)' : '1px solid rgba(249, 115, 22, 0.3)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    {c.status}
                  </span>
                </td>
                <td>{c.addedAt}</td>
                <td>
                  <Button variant="danger" onClick={() => handleDeleteContact(c.id, c.nombre)}>
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))
          )}
        </Table>
      </Card>

      {/* Modal - Add / Invite Contact */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Agregar Contacto a InfraSuite">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input
                label="Buscar por Correo Electrónico *"
                type="email"
                placeholder="colaborador@correo.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" style={{ height: '38px', marginBottom: '4px' }}>Buscar</Button>
          </form>

          {hasSearched && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '4px' }}>
              {foundUser ? (
                <div style={{ background: 'var(--bg-surface-hover)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>¡Usuario Encontrado!</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                    <div><strong>Nombre:</strong> {foundUser.nombre}</div>
                    <div><strong>Email:</strong> {foundUser.email}</div>
                    <div><strong>Empresa:</strong> {foundUser.companyName}</div>
                  </div>
                  <Button onClick={handleAddExisting} style={{ width: '100%', marginTop: '16px' }}>
                    Agregar a mis Contactos
                  </Button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ color: '#f97316', background: 'rgba(249, 115, 22, 0.08)', border: '1px solid rgba(249, 115, 22, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                    ⚠️ Este correo no está registrado en InfraSuite. Puedes invitarlo completando su nombre a continuación para enviarle un enlace de registro.
                  </div>
                  <Input
                    label="Nombre Completo del Invitado *"
                    placeholder="Ej. Ing. Juan Pérez"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    required
                  />
                  <Button onClick={handleSendInvite} style={{ width: '100%' }}>
                    Enviar Invitación y Agregar
                  </Button>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
