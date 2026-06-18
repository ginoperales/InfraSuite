import { getSQLiteDatabase } from '@infrasuite/sqlite';
import { db } from '@infrasuite/firebase';

export interface SyncStatus {
  lastSync: string;
  pendingUploads: number;
}

export const syncModuleData = async (
  dbName: string,
  tableName: string,
  firestoreCollection: string
): Promise<SyncStatus> => {
  const localDb = getSQLiteDatabase(dbName);
  
  // 1. Fetch local rows that need syncing (simulate local changes)
  const localRows = localDb.query(tableName);
  
  // 2. Fetch remote documents
  const remoteDocs = await db.getDocs(firestoreCollection);
  
  let syncedCount = 0;
  
  // 3. Simple two-way merge simulation:
  // Upload any local rows not present in remote
  for (const localRow of localRows) {
    const exists = remoteDocs.some((remote) => remote.id === localRow.id);
    if (!exists) {
      await db.addDoc(firestoreCollection, {
        id: localRow.id,
        ...localRow,
        _syncedAt: new Date().toISOString()
      });
      syncedCount++;
    }
  }

  // Download any remote rows not present in local
  for (const remoteDoc of remoteDocs) {
    const exists = localRows.some((local) => local.id === remoteDoc.id);
    if (!exists) {
      localDb.insert(tableName, remoteDoc);
    }
  }

  // 4. Log the sync activity
  const activeUser = localStorage.getItem('infrasuite_session') 
    ? JSON.parse(localStorage.getItem('infrasuite_session')!) 
    : { nombre: 'Sincronizador' };

  if (syncedCount > 0) {
    await db.addDoc('logs', {
      timestamp: new Date().toISOString(),
      usuario: activeUser.nombre,
      accion: 'Sincronización',
      detalle: `Sincronizados ${syncedCount} registros de ${tableName} (${dbName}) a Firestore.`
    });
  }

  return {
    lastSync: new Date().toISOString(),
    pendingUploads: 0
  };
};
