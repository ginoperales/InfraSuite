import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Input } from '@infrasuite/shared';
import { db } from '@infrasuite/firebase';

export const Logs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async (shouldSetLoadingState = true) => {
    if (shouldSetLoadingState) setIsLoading(true);
    // Simulate database network lag
    await new Promise((resolve) => setTimeout(resolve, 800));

    const logList = await db.getDocs('logs');
    // Sort descending by date
    const sorted = [...logList].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setLogs(sorted);
    if (shouldSetLoadingState) setIsLoading(false);
  };

  const handleClearLogs = async () => {
    if (confirm('¿Estás seguro de que deseas vaciar el historial de logs de actividad?')) {
      // Clear logs collection
      db.setCollection('logs', []);
      
      // Add a fresh initial log
      const activeUser = localStorage.getItem('infrasuite_session')
        ? JSON.parse(localStorage.getItem('infrasuite_session')!)
        : { nombre: 'Sistema' };
        
      await db.addDoc('logs', {
        timestamp: new Date().toISOString(),
        usuario: activeUser.nombre,
        accion: 'Vaciado de Bitácora',
        detalle: 'Historial de logs limpiado por el administrador.'
      });
      
      loadLogs();
    }
  };

  // Filter logs based on search query
  const filteredLogs = logs.filter(
    (log) =>
      log.usuario.toLowerCase().includes(search.toLowerCase()) ||
      log.accion.toLowerCase().includes(search.toLowerCase()) ||
      log.detalle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="content-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Bitácora del Sistema (Activity Logs)</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Auditoría completa de acciones realizadas en toda la suite InfraSuite por los administradores y usuarios.
          </p>
        </div>
        <Button variant="danger" onClick={handleClearLogs}>
          Limpiar Bitácora
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: '20px', maxWidth: '400px' }}>
          <Input
            placeholder="🔍 Buscar por usuario, acción o detalle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Table headers={['Fecha y Hora', 'Usuario / Autor', 'Acción', 'Descripción del Evento']}>
          {isLoading ? (
            Array.from({ length: 8 }).map((_, idx) => (
              <tr key={idx}>
                <td className="log-row-timestamp">
                  <div className="skeleton skeleton-text" style={{ width: '130px', height: '14px', margin: 0 }} />
                </td>
                <td style={{ fontWeight: 600 }}>
                  <div className="skeleton skeleton-text" style={{ width: '100px', height: '14px', margin: 0 }} />
                </td>
                <td>
                  <div className="skeleton" style={{ width: '90px', height: '22px', borderRadius: '10px' }} />
                </td>
                <td className="log-row-detail">
                  <div className="skeleton skeleton-text" style={{ width: '95%', height: '14px', margin: 0 }} />
                </td>
              </tr>
            ))
          ) : filteredLogs.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No se encontraron logs que coincidan con la búsqueda.
              </td>
            </tr>
          ) : (
            filteredLogs.map((log) => (
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
      </Card>
    </div>
  );
};
