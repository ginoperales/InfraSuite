import React, { useState } from 'react';
import { Card, Button, Table } from '@infrasuite/shared';

interface SharedFile {
  id: string;
  name: string;
  type: 'infracost_lite' | 'infracost_pro' | 'infrageo' | 'infraplan';
  sharedBy?: string;
  sharedWith?: string;
  date: string;
  permission: 'Lectura' | 'Escritura';
}

export const SharedItems: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'with_me' | 'by_me'>('with_me');

  // Simulated mockup files
  const sharedWithMe: SharedFile[] = [
    {
      id: 'sw_1',
      name: '0. RESUMEN DE PRESUP. SEDE GOREU I ETAPA',
      type: 'infracost_pro',
      sharedBy: 'Ing. Sofia Rodriguez',
      date: '20 jun. 2026',
      permission: 'Escritura'
    },
    {
      id: 'sw_2',
      name: 'PROYECTO SANEAMIENTO CURIMANA',
      type: 'infrageo',
      sharedBy: 'Diana Flores',
      date: '18 jun. 2026',
      permission: 'Lectura'
    }
  ];

  const sharedByMe: SharedFile[] = [
    {
      id: 'sb_1',
      name: 'PLAN ANUAL DE SEGURIDAD Y SALUD EN EL TRABAJO',
      type: 'infraplan',
      sharedWith: 'Diana Flores (diana@alfa.com)',
      date: '15 jun. 2026',
      permission: 'Escritura'
    },
    {
      id: 'sb_2',
      name: 'ESTRUCTURAS SEDE CENTRAL',
      type: 'infracost_pro',
      sharedWith: 'carlos@alfa.com',
      date: '10 jun. 2026',
      permission: 'Lectura'
    }
  ];

  const getAppLabel = (type: string) => {
    switch (type) {
      case 'infracost_lite': return 'InfraCost Lite';
      case 'infracost_pro': return 'InfraCost Pro';
      case 'infrageo': return 'InfraGeo';
      default: return 'InfraPlan';
    }
  };

  const getAppIcon = (type: string) => {
    switch (type) {
      case 'infracost_lite': return '💰';
      case 'infracost_pro': return '📊';
      case 'infrageo': return '🕳️';
      default: return '📅';
    }
  };

  return (
    <div className="content-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <h2>Archivos Compartidos</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Visualiza y administra presupuestos, planos y cronogramas que han sido compartidos contigo o que has compartido con tu equipo.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveSubTab('with_me')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: activeSubTab === 'with_me' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
            color: activeSubTab === 'with_me' ? '#fff' : 'var(--text-secondary)',
            transition: 'all 0.2s'
          }}
        >
          📥 Compartido conmigo ({sharedWithMe.length})
        </button>
        <button
          onClick={() => setActiveSubTab('by_me')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: activeSubTab === 'by_me' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
            color: activeSubTab === 'by_me' ? '#fff' : 'var(--text-secondary)',
            transition: 'all 0.2s'
          }}
        >
          📤 Compartido por mí ({sharedByMe.length})
        </button>
      </div>

      <Card>
        {activeSubTab === 'with_me' ? (
          <Table headers={['Aplicación', 'Nombre del Archivo', 'Compartido Por', 'Fecha', 'Permiso', 'Acciones']}>
            {sharedWithMe.map((file) => (
              <tr key={file.id}>
                <td style={{ fontWeight: 600 }}>
                  <span style={{ marginRight: '6px' }}>{getAppIcon(file.type)}</span>
                  {getAppLabel(file.type)}
                </td>
                <td style={{ fontWeight: 500 }}>{file.name}</td>
                <td>{file.sharedBy}</td>
                <td>{file.date}</td>
                <td>
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem'
                    }}
                  >
                    {file.permission}
                  </span>
                </td>
                <td>
                  <Button variant="secondary" onClick={() => alert(`Abriendo archivo ${file.name}...`)}>
                    Abrir
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <Table headers={['Aplicación', 'Nombre del Archivo', 'Compartido Con', 'Fecha', 'Permiso', 'Acciones']}>
            {sharedByMe.map((file) => (
              <tr key={file.id}>
                <td style={{ fontWeight: 600 }}>
                  <span style={{ marginRight: '6px' }}>{getAppIcon(file.type)}</span>
                  {getAppLabel(file.type)}
                </td>
                <td style={{ fontWeight: 500 }}>{file.name}</td>
                <td>{file.sharedWith}</td>
                <td>{file.date}</td>
                <td>
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem'
                    }}
                  >
                    {file.permission}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="secondary" onClick={() => alert('Administrando permisos...')}>
                      Configurar
                    </Button>
                    <Button variant="danger" onClick={() => alert('Revocando acceso al usuario...')}>
                      Revocar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
};
