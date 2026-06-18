import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Input } from '@infrasuite/shared';
import { db } from '@infrasuite/firebase';

const FALLBACK_MODULES_INFO: Record<string, { icon: string; nombre: string; desc: string }> = {
  INFRACOST: {
    icon: '📊',
    nombre: 'InfraCost',
    desc: 'Gestión avanzada de costos, presupuestos de obra y Análisis de Precios Unitarios (APU) integrados.'
  },
  INFRAGEO: {
    icon: '🕳️',
    nombre: 'InfraGeo',
    desc: 'Mapeo geotécnico, modelado de sondajes y registro de ensayos de mecánica de suelos en campo.'
  },
  INFRABIM: {
    icon: '📐',
    nombre: 'InfraBIM',
    desc: 'Visualización y coordinación de modelos 3D en formato abierto IFC directamente en el navegador.'
  },
  INFRACONTROL: {
    icon: '📈',
    nombre: 'InfraControl',
    desc: 'Seguimiento financiero de obra, generación de valorizaciones mensuales y curvas S de avance.'
  },
  INFRADOCS: {
    icon: '📂',
    nombre: 'InfraDocs',
    desc: 'Gestión documental y almacenamiento estructurado de planos, contratos e informes técnicos.'
  },
  INFRAFIELD: {
    icon: '📋',
    nombre: 'InfraField',
    desc: 'Órdenes de inspección, diarios de obra digitales y reportes fotográficos geo-localizados.'
  },
  INFRAAI: {
    icon: '🧠',
    nombre: 'InfraAI',
    desc: 'Predicción de desviaciones de costo y análisis de riesgo mediante algoritmos de Inteligencia Artificial.'
  },
  INFRAADMIN: {
    icon: '🛡️',
    nombre: 'InfraAdmin',
    desc: 'Consola central de gobernanza para la gestión de usuarios, roles, empresas y licencias de la suite.'
  }
};

const getModuleInfo = (m: any) => {
  const code = (m.codigo || m.id || '').toUpperCase();
  const fallback = FALLBACK_MODULES_INFO[code] || { icon: '🔧', nombre: m.nombre || code, desc: m.desc || '' };
  return {
    id: m.id || m.codigo,
    codigo: code,
    nombre: m.nombre || fallback.nombre,
    icon: m.icon || fallback.icon,
    desc: m.desc || fallback.desc,
    activo: m.activo !== false,
    visibleLanding: m.visibleLanding !== false
  };
};

export const LandingAdmin: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  // Edit Plan form fields
  const [planTitle, setPlanTitle] = useState('');
  const [planPromo, setPlanPromo] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planFeatures, setPlanFeatures] = useState('');
  const [planPopular, setPlanPopular] = useState(false);

  // Add Client form fields
  const [clientName, setClientName] = useState('');
  const [clientLogo, setClientLogo] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (shouldSetLoading = true) => {
    if (shouldSetLoading) setIsLoading(true);
    // Simulate real database loading delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const p = await db.getDocs('plans');
    const c = await db.getDocs('clients');
    const m = await db.getDocs('modules');
    setPlans(p);
    setClients(c);
    setModules(m);
    if (shouldSetLoading) setIsLoading(false);
  };

  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setPlanTitle('');
    setPlanPromo('');
    setPlanDesc('');
    setPlanPrice('');
    setPlanFeatures('');
    setPlanPopular(false);
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanTitle(plan.title || '');
    setPlanPromo(plan.promo || '');
    setPlanDesc(plan.desc || '');
    setPlanPrice(plan.price || '');
    setPlanFeatures(plan.features || '');
    setPlanPopular(!!plan.popular);
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle || !planPrice || !planDesc) {
      alert('Por favor completa los campos obligatorios.');
      return;
    }

    if (editingPlan) {
      // Edit mode
      await db.updateDoc('plans', editingPlan.id, {
        title: planTitle,
        promo: planPromo,
        desc: planDesc,
        price: planPrice,
        features: planFeatures,
        popular: planPopular,
      });
    } else {
      // Create mode
      const planId = 'p_' + Math.random().toString(36).substring(2, 9);
      await db.addDoc('plans', {
        id: planId,
        title: planTitle,
        promo: planPromo,
        desc: planDesc,
        price: planPrice,
        features: planFeatures,
        popular: planPopular,
      });
    }

    setIsPlanModalOpen(false);
    setEditingPlan(null);
    loadData();
  };

  const handleDeletePlan = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este plan de suscripción?')) {
      await db.deleteDoc('plans', id);
      loadData();
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientLogo) {
      alert('Por favor, ingresa el nombre y logotipo/emoji del cliente.');
      return;
    }

    await db.addDoc('clients', {
      nombre: clientName,
      logo: clientLogo
    });

    setClientName('');
    setClientLogo('');
    loadData();
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      await db.deleteDoc('clients', id);
      loadData();
    }
  };

  return (
    <div className="content-container">
      {/* Header Info */}
      <div>
        <h2>Configuración de Pantalla de Inicio (Landing Page)</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Desde este panel central puedes gobernar la oferta de planes activos y controlar la cinta scrolling de logotipos de clientes.
        </p>
      </div>

      {/* Plans Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            💼 Planes y Promociones Activas
          </h3>
          <Button onClick={handleOpenCreatePlan}>+ Nuevo Plan</Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <Card 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px', 
                  border: '1px solid var(--border-color)', 
                  minHeight: '340px',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div className="skeleton" style={{ width: '80px', height: '22px', borderRadius: '10px', marginBottom: '14px' }} />
                  <div className="skeleton skeleton-title" style={{ width: '60%', height: '24px', margin: '0 0 12px 0' }} />
                  <div className="skeleton skeleton-text" style={{ width: '90%', height: '14px', margin: '0 0 8px 0' }} />
                  <div className="skeleton skeleton-text" style={{ width: '75%', height: '14px', margin: '0 0 16px 0' }} />
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', margin: '16px 0' }}>
                    <div className="skeleton" style={{ width: '35px', height: '14px' }} />
                    <div className="skeleton" style={{ width: '60px', height: '32px', borderRadius: '4px' }} />
                    <div className="skeleton" style={{ width: '40px', height: '14px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                    <div className="skeleton skeleton-text" style={{ width: '85%', height: '14px', margin: 0 }} />
                    <div className="skeleton skeleton-text" style={{ width: '70%', height: '14px', margin: 0 }} />
                  </div>
                </div>
                <div className="skeleton" style={{ width: '100%', height: '42px', borderRadius: '6px', marginTop: '24px' }} />
              </Card>
            ))
          ) : (
            plans.map((p) => {
              const feats = typeof p.features === 'string' ? p.features.split(',') : [];
              return (
                <Card 
                  key={p.id} 
                  className={p.popular ? 'price-card-popular' : ''}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    border: p.popular ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid var(--border-color)',
                    position: 'relative'
                  }}
                >
                  <div>
                    {p.promo && (
                      <span className="price-promo-tag" style={{ marginBottom: '14px', display: 'inline-block' }}>
                        {p.promo}
                      </span>
                    )}
                    {p.popular && (
                      <span style={{ 
                        position: 'absolute', 
                        top: '16px', 
                        right: '16px', 
                        background: 'var(--grad-primary)', 
                        fontSize: '0.65rem', 
                        padding: '2px 8px', 
                        borderRadius: 'var(--radius-full)', 
                        fontWeight: 800,
                        color: '#ffffff'
                      }}>
                        POPULAR
                      </span>
                    )}
                    <h4 style={{ fontSize: '1.25rem', margin: '0 0 8px 0', fontWeight: 700 }}>{p.title}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                      {p.desc}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '16px 0' }}>
                      <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>USD</span>
                      <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{p.price}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ mes</span>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {feats.map((f: string, idx: number) => (
                        <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                          <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>✓</span>
                          <span>{f.trim()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <Button variant="secondary" onClick={() => handleOpenEditPlan(p)} style={{ flex: 1 }}>
                      ✏️ Editar
                    </Button>
                    <Button variant="danger" onClick={() => handleDeletePlan(p.id)} style={{ flex: 1 }}>
                      🗑️ Eliminar
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </section>

      {/* Clients Section */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px', marginTop: '16px' }}>
        {/* Add Client Form */}
        <Card title="Registrar Cliente en Marquee" icon="➕">
          <form onSubmit={handleAddClient} className="login-form">
            <Input
              label="Nombre Comercial *"
              placeholder="Ej. Constructora Andina"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
            <Input
              label="Logo (Emoji o Icono Texto) *"
              placeholder="Ej. 🏗️ o 🏢 o CA"
              value={clientLogo}
              onChange={(e) => setClientLogo(e.target.value)}
              required
            />
            <div style={{ marginTop: '16px' }}>
              <Button type="submit" style={{ width: '100%' }}>
                Agregar a la Cinta
              </Button>
            </div>
          </form>
        </Card>

        {/* Current Clients List */}
        <Card title="Logotipos y Clientes Activos" icon="🛣️">
          {isLoading ? (
            <Table headers={['Logo', 'Nombre del Cliente', 'Acciones']}>
              {Array.from({ length: 3 }).map((_, idx) => (
                <tr key={idx}>
                  <td style={{ width: '80px', textAlign: 'center' }}>
                    <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: '50%', margin: '0 auto' }} />
                  </td>
                  <td>
                    <div className="skeleton skeleton-text" style={{ width: '130px', height: '14px', margin: 0 }} />
                  </td>
                  <td style={{ width: '120px' }}>
                    <div className="skeleton" style={{ width: '70px', height: '32px', borderRadius: '6px' }} />
                  </td>
                </tr>
              ))}
            </Table>
          ) : clients.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No hay clientes registrados en el carrusel. Agrega uno a la izquierda.
            </div>
          ) : (
            <Table headers={['Logo', 'Nombre del Cliente', 'Acciones']}>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontSize: '1.6rem', textAlign: 'center', width: '80px' }}>{c.logo}</td>
                  <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                  <td style={{ width: '120px' }}>
                    <Button variant="danger" onClick={() => handleDeleteClient(c.id)}>
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      {/* Ecosystem Modules Management */}
      <section style={{ marginTop: '32px' }}>
        <Card title="🛡️ Ecosistema Modular Integrado (Visibilidad en Landing)" icon="🌐">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Activa o desactiva qué módulos se mostrarán en la cuadrícula de la Landing Page de inicio para nuevos clientes.
          </p>
          {isLoading ? (
            <Table headers={['Icono', 'Código del Módulo', 'Nombre del Módulo', 'Descripción', 'Estado en Landing', 'Acciones']}>
              {Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx}>
                  <td style={{ width: '60px', textAlign: 'center' }}>
                    <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: '6px', margin: '0 auto' }} />
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    <div className="skeleton skeleton-text" style={{ width: '90px', height: '14px', margin: 0 }} />
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    <div className="skeleton skeleton-text" style={{ width: '110px', height: '14px', margin: 0 }} />
                  </td>
                  <td>
                    <div className="skeleton skeleton-text" style={{ width: '92%', height: '14px', margin: 0 }} />
                  </td>
                  <td>
                    <div className="skeleton" style={{ width: '95px', height: '22px', borderRadius: '10px' }} />
                  </td>
                  <td style={{ width: '200px' }}>
                    <div className="skeleton" style={{ width: '130px', height: '20px', borderRadius: '4px' }} />
                  </td>
                </tr>
              ))}
            </Table>
          ) : modules.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Cargando módulos del ecosistema...
            </div>
          ) : (
            <Table headers={['Icono', 'Código del Módulo', 'Nombre del Módulo', 'Descripción', 'Estado en Landing', 'Acciones']}>
              {modules.map(getModuleInfo).map((m) => (
                <tr key={m.id}>
                  <td style={{ fontSize: '1.4rem', textAlign: 'center', width: '60px' }}>{m.icon}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{m.codigo}</td>
                  <td style={{ fontWeight: 600 }}>{m.nombre}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{m.desc}</td>
                  <td>
                    <span className={`badge ${m.visibleLanding ? 'btn-primary' : 'badge-role'}`} style={{ fontSize: '0.75rem' }}>
                      {m.visibleLanding ? 'Visible en Inicio' : 'Oculto'}
                    </span>
                  </td>
                  <td style={{ width: '200px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={m.visibleLanding}
                        onChange={async (e) => {
                          const val = e.target.checked;
                          await db.updateDoc('modules', m.id, { visibleLanding: val });
                          loadData();
                        }}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Mostrar en Inicio</span>
                    </label>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </section>

      </section>

      {/* Edit Plan Modal */}
      <Modal 
        isOpen={isPlanModalOpen} 
        onClose={() => setIsPlanModalOpen(false)} 
        title={editingPlan ? `Editar Plan: ${editingPlan.title}` : 'Crear Nuevo Plan de Suscripción'}
      >
        <form onSubmit={handleSavePlan} className="login-form">
          <Input
            label="Título del Plan *"
            value={planTitle}
            onChange={(e) => setPlanTitle(e.target.value)}
            required
          />
          <Input
            label="Etiqueta Promocional"
            placeholder="Ej. ¡PROMO: -15% Pago Anual!"
            value={planPromo}
            onChange={(e) => setPlanPromo(e.target.value)}
          />
          <Input
            label="Precio USD/mes *"
            type="number"
            value={planPrice}
            onChange={(e) => setPlanPrice(e.target.value)}
            required
          />
          <Input
            label="Descripción Corta *"
            value={planDesc}
            onChange={(e) => setPlanDesc(e.target.value)}
            required
          />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Características (separadas por comas) *
            </label>
            <textarea
              style={{
                width: '100%',
                minHeight: '100px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                padding: '12px',
                fontSize: '0.9rem',
                fontFamily: 'var(--font-sans)',
                lineHeight: 1.4,
                outline: 'none',
                resize: 'vertical'
              }}
              value={planFeatures}
              onChange={(e) => setPlanFeatures(e.target.value)}
              placeholder="Ej. Acceso a 3 módulos,Hasta 5 usuarios,Soporte técnico por correo"
              required
            />
          </div>

          <label className="module-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={planPopular}
              onChange={(e) => setPlanPopular(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
            />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Destacar como plan "Popular"</span>
          </label>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsPlanModalOpen(false)} style={{ flex: 1 }}>
              Cancelar
            </Button>
            <Button type="submit" style={{ flex: 1 }}>
              {editingPlan ? 'Guardar Cambios' : 'Crear Plan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
