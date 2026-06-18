import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Input, Select } from '@infrasuite/shared';
import { db } from '@infrasuite/firebase';
import {
  getCompanyLicense,
  getCompanyModules,
  activateModuleForCompany,
  deactivateModuleForCompany
} from '@infrasuite/license-service';

export const Companies: React.FC = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals status
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isModuleManageOpen, setIsModuleManageOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [ruc, setRuc] = useState('');
  const [plan, setPlan] = useState<'BASIC' | 'PRO' | 'ENTERPRISE'>('PRO');
  const [expiration, setExpiration] = useState('2027-12-31');

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      await Promise.all([loadCompanies(false), loadModules()]);
      setIsLoading(false);
    };
    initData();
  }, []);

  const loadCompanies = async (shouldSetLoadingState = true) => {
    if (shouldSetLoadingState) setIsLoading(true);
    // Simulate real database loading delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const companyList = await db.getDocs('companies');
    // Enrich with licenses and modules counts
    const enriched = await Promise.all(
      companyList.map(async (c) => {
        const license = await getCompanyLicense(c.id);
        const companyModules = await getCompanyModules(c.id);
        return {
          ...c,
          plan: license?.plan || 'Ninguno',
          vencimiento: license?.vencimiento || '-',
          modulesCount: companyModules.length
        };
      })
    );
    setCompanies(enriched);
    if (shouldSetLoadingState) setIsLoading(false);
  };

  const loadModules = async () => {
    const list = await db.getDocs('modules');
    setModules(list);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ruc) {
      alert('Por favor completa los campos obligatorios.');
      return;
    }

    const companyId = 'c_' + Math.random().toString(36).substring(2, 9);
    
    // Add Company
    await db.addDoc('companies', {
      id: companyId,
      nombre: name,
      ruc,
      estado: 'activo'
    });

    // Add License
    await db.addDoc('licenses', {
      empresaId: companyId,
      plan,
      vencimiento: expiration
    });

    // Initialize with a default module: INFRADOCS
    await db.addDoc('company_modules', {
      empresaId: companyId,
      moduloId: 'INFRADOCS'
    });

    // Reset fields & reload
    setName('');
    setRuc('');
    setIsCreateOpen(false);
    loadCompanies();
  };

  const handleToggleModule = async (moduleId: string, checked: boolean) => {
    if (!selectedCompany) return;
    
    if (checked) {
      await activateModuleForCompany(selectedCompany.id, moduleId);
      setActiveModules(prev => [...prev, moduleId]);
    } else {
      await deactivateModuleForCompany(selectedCompany.id, moduleId);
      setActiveModules(prev => prev.filter(m => m !== moduleId));
    }
    loadCompanies(); // Update module count in the table
  };

  const openModuleManager = async (company: any) => {
    setSelectedCompany(company);
    const companyModules = await getCompanyModules(company.id);
    setActiveModules(companyModules);
    setIsModuleManageOpen(true);
  };

  const toggleCompanyStatus = async (company: any) => {
    const newStatus = company.estado === 'activo' ? 'suspendido' : 'activo';
    await db.updateDoc('companies', company.id, { estado: newStatus });
    loadCompanies();
  };

  return (
    <div className="content-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Directorio de Empresas</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Registra y gestiona las empresas asociadas, sus licencias y módulos habilitados.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>+ Nueva Empresa</Button>
      </div>

      <Card>
        <Table headers={['RUC', 'Razón Social', 'Plan Licencia', 'Vencimiento', 'Módulos Activos', 'Estado', 'Acciones']}>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={idx}>
                <td style={{ fontFamily: 'monospace' }}>
                  <div className="skeleton skeleton-text" style={{ width: '90px', height: '14px', margin: 0 }} />
                </td>
                <td style={{ fontWeight: 600 }}>
                  <div className="skeleton skeleton-text" style={{ width: '180px', height: '14px', margin: 0 }} />
                </td>
                <td>
                  <div className="skeleton" style={{ width: '60px', height: '22px', borderRadius: '10px' }} />
                </td>
                <td>
                  <div className="skeleton skeleton-text" style={{ width: '80px', height: '14px', margin: 0 }} />
                </td>
                <td>
                  <div className="skeleton" style={{ width: '85px', height: '22px', borderRadius: '10px' }} />
                </td>
                <td>
                  <div className="skeleton" style={{ width: '60px', height: '22px', borderRadius: '10px' }} />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div className="skeleton" style={{ width: '78px', height: '32px', borderRadius: '6px' }} />
                    <div className="skeleton" style={{ width: '78px', height: '32px', borderRadius: '6px' }} />
                  </div>
                </td>
              </tr>
            ))
          ) : companies.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No hay empresas registradas.
              </td>
            </tr>
          ) : (
            companies.map((c) => (
              <tr key={c.id}>
                <td style={{ fontFamily: 'monospace' }}>{c.ruc}</td>
                <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                <td>
                  <span className="badge badge-role">{c.plan}</span>
                </td>
                <td>{c.vencimiento}</td>
                <td>
                  <span className="badge badge-secondary">{c.modulesCount} habilitados</span>
                </td>
                <td>
                  <span className={`badge badge-${c.estado}`}>
                    {c.estado}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="secondary" onClick={() => openModuleManager(c)}>
                      🔧 Módulos
                    </Button>
                    <Button
                      variant={c.estado === 'activo' ? 'danger' : 'secondary'}
                      onClick={() => toggleCompanyStatus(c)}
                    >
                      {c.estado === 'activo' ? 'Suspender' : 'Activar'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </Table>
      </Card>

      {/* Modal - Create Company */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Agregar Nueva Empresa">
        <form onSubmit={handleCreateCompany} className="login-form">
          <Input
            label="Razón Social *"
            placeholder="Ej. Inversiones del Norte S.A.C."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Número de RUC *"
            placeholder="Ej. 20123456789"
            maxLength={11}
            value={ruc}
            onChange={(e) => setRuc(e.target.value)}
            required
          />
          <Select
            label="Plan de Suscripción"
            value={plan}
            onChange={(e: any) => setPlan(e.target.value)}
            options={[
              { value: 'BASIC', label: 'BASIC (Módulos Esenciales)' },
              { value: 'PRO', label: 'PRO (Recomendado)' },
              { value: 'ENTERPRISE', label: 'ENTERPRISE (Completo)' }
            ]}
          />
          <Input
            type="date"
            label="Vencimiento de Licencia"
            value={expiration}
            onChange={(e) => setExpiration(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)} style={{ flex: 1 }}>
              Cancelar
            </Button>
            <Button type="submit" style={{ flex: 1 }}>
              Registrar Empresa
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal - Manage Modules */}
      <Modal
        isOpen={isModuleManageOpen}
        onClose={() => setIsModuleManageOpen(false)}
        title={selectedCompany ? `Módulos: ${selectedCompany.nombre}` : 'Administrar Módulos'}
      >
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Activa o desactiva las aplicaciones correspondientes al ecosistema de esta empresa:
        </p>
        <div className="modules-checklist">
          {modules.map((m) => {
            const isChecked = activeModules.includes(m.codigo);
            return (
              <label key={m.codigo} className="module-checkbox-label">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleToggleModule(m.codigo, e.target.checked)}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.codigo}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.nombre.split(' (')[0]}</span>
                </div>
              </label>
            );
          })}
        </div>
        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <Button onClick={() => setIsModuleManageOpen(false)}>Guardar y Cerrar</Button>
        </div>
      </Modal>
    </div>
  );
};
