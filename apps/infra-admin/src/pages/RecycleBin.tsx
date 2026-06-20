import React, { useState } from 'react';
import { Card, Button, Table } from '@infrasuite/shared';

interface TrashItem {
  id: string;
  name: string;
  type: 'infracost_lite' | 'infracost_pro' | 'infrageo' | 'infraplan';
  deletedAt: string;
  size: string;
}

export const RecycleBin: React.FC = () => {
  const [items, setItems] = useState<TrashItem[]>([
    {
      id: 't_1',
      name: 'PRESUPUESTO BORRADOR MODULO SEDE B',
      type: 'infracost_pro',
      deletedAt: '18 jun. 2026',
      size: '240 KB'
    },
    {
      id: 't_2',
      name: 'COORDENADAS PERFILES CURIMANA OLD',
      type: 'infrageo',
      deletedAt: '10 jun. 2026',
      size: '1.2 MB'
    },
    {
      id: 't_3',
      name: 'CRONOGRAMA DE TRABAJO - CRÍTICO ANTES DE REVISIÓN',
      type: 'infraplan',
      deletedAt: '05 jun. 2026',
      size: '450 KB'
    }
  ]);

  const handleRestore = (id: string, name: string) => {
    alert(`Restaurando "${name}" a sus archivos activos...`);
    setItems(items.filter((item) => item.id !== id));
  };

  const handleDeletePermanent = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente "${name}"? Esta acción no se puede deshacer.`)) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const handleEmptyBin = () => {
    if (confirm('¿Estás seguro de que deseas vaciar toda la papelera de reciclaje? Todos los elementos se perderán permanentemente.')) {
      setItems([]);
    }
  };

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
          <h2>Papelera de Reciclaje</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Recupera presupuestos, sondajes o cronogramas eliminados de tus proyectos activos. Los elementos se conservan aquí antes de ser borrados permanentemente.
          </p>
        </div>
        {items.length > 0 && (
          <Button variant="danger" onClick={handleEmptyBin}>
            Vaciar Papelera
          </Button>
        )}
      </div>

      <Card>
        <Table headers={['Aplicación', 'Nombre del Elemento', 'Fecha de Eliminación', 'Tamaño', 'Acciones']}>
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                La papelera de reciclaje está vacía.
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id}>
                <td style={{ fontWeight: 600 }}>
                  <span style={{ marginRight: '6px' }}>{getAppIcon(item.type)}</span>
                  {getAppLabel(item.type)}
                </td>
                <td style={{ fontWeight: 500 }}>{item.name}</td>
                <td>{item.deletedAt}</td>
                <td style={{ fontFamily: 'monospace' }}>{item.size}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button onClick={() => handleRestore(item.id, item.name)}>
                      Restaurar
                    </Button>
                    <Button variant="danger" onClick={() => handleDeletePermanent(item.id, item.name)}>
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </Table>
      </Card>
    </div>
  );
};
