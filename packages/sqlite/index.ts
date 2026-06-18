// SQLite Client Wrapper

export class LocalDatabase {
  private dbName: string;

  constructor(dbName: string) {
    this.dbName = dbName;
    this.initDatabase();
  }

  private initDatabase() {
    if (typeof window === 'undefined') return;
    const dbExist = localStorage.getItem(this.dbName);
    if (!dbExist) {
      localStorage.setItem(this.dbName, JSON.stringify({}));
    }
  }

  private getData(): Record<string, any[]> {
    if (typeof window === 'undefined') return {};
    const data = localStorage.getItem(this.dbName);
    return data ? JSON.parse(data) : {};
  }

  private setData(data: Record<string, any[]>) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.dbName, JSON.stringify(data));
    }
  }

  public createTable(tableName: string, _schema: string[]) {
    const data = this.getData();
    if (!data[tableName]) {
      data[tableName] = [];
      this.setData(data);
    }
  }

  public query(tableName: string, filterFn?: (row: any) => boolean): any[] {
    const data = this.getData();
    const tableData = data[tableName] || [];
    if (filterFn) {
      return tableData.filter(filterFn);
    }
    return tableData;
  }

  public insert(tableName: string, row: any): any {
    const data = this.getData();
    if (!data[tableName]) {
      data[tableName] = [];
    }
    const newRow = { id: Math.random().toString(36).substring(2, 9), ...row };
    data[tableName].push(newRow);
    this.setData(data);
    return newRow;
  }

  public update(tableName: string, id: string, updatedFields: any): boolean {
    const data = this.getData();
    const tableData = data[tableName] || [];
    const index = tableData.findIndex((r) => r.id === id);
    if (index !== -1) {
      tableData[index] = { ...tableData[index], ...updatedFields };
      data[tableName] = tableData;
      this.setData(data);
      return true;
    }
    return false;
  }

  public delete(tableName: string, id: string): boolean {
    const data = this.getData();
    const tableData = data[tableName] || [];
    const originalLen = tableData.length;
    data[tableName] = tableData.filter((r) => r.id !== id);
    this.setData(data);
    return data[tableName].length < originalLen;
  }

  public clear() {
    this.setData({});
  }
}

// Global factory for SQLite databases per module
const activeDatabases: Record<string, LocalDatabase> = {};

export const getSQLiteDatabase = (dbName: string): LocalDatabase => {
  if (!activeDatabases[dbName]) {
    activeDatabases[dbName] = new LocalDatabase(dbName);
  }
  return activeDatabases[dbName];
};
