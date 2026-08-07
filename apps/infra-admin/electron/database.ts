import Database from 'better-sqlite3';
import { app, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let db: any = null;

export function setupDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'infrasuite.sqlite');
  
  db = new Database(dbPath, { verbose: console.log });
  
  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      data TEXT,
      updatedAt INTEGER
    );
  `);

  // Handle IPC calls
  ipcMain.handle('db:getBudgets', () => {
    try {
      const stmt = db.prepare('SELECT * FROM budgets');
      const rows = stmt.all();
      return rows.map((row: any) => JSON.parse(row.data));
    } catch (error) {
      console.error('Error fetching budgets from SQLite:', error);
      return [];
    }
  });

  ipcMain.handle('db:getBudget', (_event, id: string) => {
    try {
      const stmt = db.prepare('SELECT * FROM budgets WHERE id = ?');
      const row = stmt.get(id);
      if (row) {
        return JSON.parse(row.data);
      }
      return null;
    } catch (error) {
      console.error('Error fetching budget from SQLite:', error);
      return null;
    }
  });

  ipcMain.handle('db:saveBudget', (_event, budget: any) => {
    try {
      const stmt = db.prepare('INSERT OR REPLACE INTO budgets (id, data, updatedAt) VALUES (?, ?, ?)');
      const now = Date.now();
      
      // Ensure the budget has the local updatedAt
      budget.updatedAt = now;
      
      stmt.run(budget.id, JSON.stringify(budget), now);
      return true;
    } catch (error) {
      console.error('Error saving budget to SQLite:', error);
      return false;
    }
  });

  ipcMain.handle('db:deleteBudget', (_event, id: string) => {
    try {
      const stmt = db.prepare('DELETE FROM budgets WHERE id = ?');
      stmt.run(id);
      return true;
    } catch (error) {
      console.error('Error deleting budget from SQLite:', error);
      return false;
    }
  });
}

export function cleanupDatabase() {
  if (db) {
    db.close();
  }
}
